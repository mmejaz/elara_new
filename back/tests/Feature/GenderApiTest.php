<?php

namespace Tests\Feature;

use App\Models\Gender;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Covers the Gender module's API — the reference shape every generated
 * resourceful module follows (paginated index + search/sort, validated CRUD,
 * permission-gated routes).
 */
class GenderApiTest extends TestCase
{
    use RefreshDatabase;

    /** Super Admin bypasses every gate (see AppServiceProvider::Gate::before). */
    private function admin(): User
    {
        $user = User::factory()->create();
        Role::findOrCreate('Super Admin', 'web');
        $user->assignRole('Super Admin');

        return $user;
    }

    // ───────────────────────────────── access control ────

    public function test_guests_cannot_access_genders(): void
    {
        $this->getJson('/api/genders')->assertUnauthorized();
    }

    public function test_user_without_permission_is_forbidden(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/genders')
            ->assertForbidden();
    }

    // ───────────────────────────────────────── index ────

    public function test_it_returns_a_paginated_envelope(): void
    {
        Gender::create(['name' => 'Male']);
        Gender::create(['name' => 'Female']);

        $this->actingAs($this->admin())
            ->getJson('/api/genders')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [['id', 'name', 'created_at']],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_it_respects_per_page(): void
    {
        foreach (['A', 'B', 'C'] as $name) {
            Gender::create(['name' => $name]);
        }

        $this->actingAs($this->admin())
            ->getJson('/api/genders?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2);
    }

    public function test_it_filters_by_search(): void
    {
        Gender::create(['name' => 'Male']);
        Gender::create(['name' => 'Female']);
        Gender::create(['name' => 'Other']);

        $this->actingAs($this->admin())
            ->getJson('/api/genders?search=male') // matches "Male" and "Female"
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonMissing(['name' => 'Other']);
    }

    public function test_it_sorts_by_name(): void
    {
        Gender::create(['name' => 'Zeta']);
        Gender::create(['name' => 'Alpha']);

        $this->actingAs($this->admin())
            ->getJson('/api/genders?sort_by=name&sort_dir=asc')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Alpha');
    }

    public function test_it_ignores_a_non_whitelisted_sort_column(): void
    {
        Gender::create(['name' => 'Male']);

        // `id;drop` isn't in the sortable whitelist — must not 500.
        $this->actingAs($this->admin())
            ->getJson('/api/genders?sort_by=id;drop&sort_dir=asc')
            ->assertOk();
    }

    // ───────────────────────────────────────── store ────

    public function test_it_creates_a_gender(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/genders', ['name' => 'Male'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Male');

        $this->assertDatabaseHas('genders', ['name' => 'Male']);
    }

    public function test_it_requires_a_name(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/api/genders', [])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'The name field is required.');
    }

    public function test_it_rejects_a_duplicate_name(): void
    {
        Gender::create(['name' => 'Male']);

        $this->actingAs($this->admin())
            ->postJson('/api/genders', ['name' => 'Male'])
            ->assertStatus(422)
            ->assertJsonStructure(['errors' => ['name']]);

        $this->assertSame(1, Gender::count());
    }

    // ──────────────────────────────── update / delete ────

    public function test_it_updates_a_gender(): void
    {
        $gender = Gender::create(['name' => 'Male']);

        $this->actingAs($this->admin())
            ->putJson("/api/genders/{$gender->id}", ['name' => 'Man'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Man');

        $this->assertDatabaseHas('genders', ['id' => $gender->id, 'name' => 'Man']);
    }

    public function test_update_allows_keeping_its_own_name(): void
    {
        $gender = Gender::create(['name' => 'Male']);

        // The unique rule must ignore the record being updated.
        $this->actingAs($this->admin())
            ->putJson("/api/genders/{$gender->id}", ['name' => 'Male'])
            ->assertOk();
    }

    public function test_it_deletes_a_gender(): void
    {
        $gender = Gender::create(['name' => 'Male']);

        $this->actingAs($this->admin())
            ->deleteJson("/api/genders/{$gender->id}")
            ->assertOk();

        $this->assertDatabaseMissing('genders', ['id' => $gender->id]);
    }
}
