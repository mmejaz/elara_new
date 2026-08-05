<?php

namespace Tests\Feature;

use App\Models\Gender;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Gender API: list, create, read, update, delete.
 * Tests CRUD operations for gender lookups used in user profiles.
 *
 * Endpoints:
 * - GET    /api/genders              (list all genders, with pagination)
 * - POST   /api/genders              (create new gender)
 * - PUT    /api/genders/{id}         (update gender)
 * - DELETE /api/genders/{id}         (delete gender)
 *
 * Permissions:
 * - gender.view   (for list)
 * - gender.create (for store)
 * - gender.edit   (for update)
 * - gender.delete (for delete)
 */
class GenderApiTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;
    private User $admin;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::findOrCreate('Super Admin', 'web');
        Role::findOrCreate('Admin', 'web');
        Role::findOrCreate('User', 'web');

        // Create users
        $this->superAdmin = User::factory()->create();
        $this->superAdmin->assignRole('Super Admin');

        $this->admin = User::factory()->create();
        $this->admin->assignRole('Admin');

        $this->regularUser = User::factory()->create();
        $this->regularUser->assignRole('User');

        // Create permissions
        Permission::findOrCreate('gender.view', 'web');
        Permission::findOrCreate('gender.create', 'web');
        Permission::findOrCreate('gender.edit', 'web');
        Permission::findOrCreate('gender.delete', 'web');

        // Grant permissions to Admin role
        $adminRole = Role::findByName('Admin');
        $adminRole->givePermissionTo([
            'gender.view',
            'gender.create',
            'gender.edit',
            'gender.delete',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // LIST / FETCH GENDERS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_list_genders(): void
    {
        $this->getJson('/api/genders')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_list(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/genders')
            ->assertForbidden();
    }

    public function test_admin_can_list_genders(): void
    {
        Gender::create(['name' => 'Male']);
        Gender::create(['name' => 'Female']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'created_at'],
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_super_admin_can_list_genders(): void
    {
        Gender::create(['name' => 'Other']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/genders');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_genders_pagination(): void
    {
        foreach (range(1, 25) as $i) {
            Gender::create(['name' => "Gender $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_list_genders_default_pagination(): void
    {
        foreach (range(1, 20) as $i) {
            Gender::create(['name' => "Gender $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders');

        $response->assertOk()
            ->assertJsonCount(15, 'data') // Default per_page is 15
            ->assertJsonPath('meta.per_page', 15);
    }

    public function test_list_genders_respects_per_page(): void
    {
        foreach (range(1, 30) as $i) {
            Gender::create(['name' => "Gender $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?per_page=5&page=2');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_list_genders_can_search(): void
    {
        Gender::create(['name' => 'Male']);
        Gender::create(['name' => 'Female']);
        Gender::create(['name' => 'Non-Binary']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?search=male');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_genders_search_case_insensitive(): void
    {
        Gender::create(['name' => 'Female']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?search=FEMALE');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_genders_sort_by_name_asc(): void
    {
        Gender::create(['name' => 'Zebra']);
        Gender::create(['name' => 'Apple']);
        Gender::create(['name' => 'Mango']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_genders_sort_by_name_desc(): void
    {
        Gender::create(['name' => 'Male']);
        Gender::create(['name' => 'Female']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?sort_by=name&sort_dir=desc');

        $response->assertOk();
    }

    public function test_list_genders_sort_by_created_at(): void
    {
        Gender::create(['name' => 'First Gender']);
        Gender::create(['name' => 'Second Gender']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?sort_by=created_at');

        $response->assertOk();
    }

    public function test_list_genders_sort_by_id(): void
    {
        Gender::create(['name' => 'Gender 1']);
        Gender::create(['name' => 'Gender 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?sort_by=id&sort_dir=asc');

        $response->assertOk();
    }

    public function test_list_genders_invalid_sort_defaults_to_created_at(): void
    {
        Gender::create(['name' => 'Gender 1']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?sort_by=invalid_column');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_genders_empty_result(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE GENDER TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_create_gender(): void
    {
        $this->postJson('/api/genders', [
            'name' => 'New Gender',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_create(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/genders', [
                'name' => 'New Gender',
            ])->assertForbidden();
    }

    public function test_admin_can_create_gender(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => 'Male',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Male')
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('genders', [
            'name' => 'Male',
        ]);
    }

    public function test_super_admin_can_create_gender(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/genders', [
                'name' => 'Female',
            ]);

        $response->assertCreated();
    }

    public function test_create_gender_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/genders', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_gender_name_required_string(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => '',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_gender_name_max_255(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_gender_name_max_255_accepted(): void
    {
        $name = str_repeat('A', 255);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => $name,
            ]);

        $response->assertCreated();
    }

    public function test_create_gender_name_must_be_unique(): void
    {
        Gender::create(['name' => 'Male']);

        $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => 'Male',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_multiple_genders(): void
    {
        $genders = ['Male', 'Female', 'Non-Binary', 'Prefer Not to Say', 'Other'];

        foreach ($genders as $gender) {
            $this->actingAs($this->admin)
                ->postJson('/api/genders', [
                    'name' => $gender,
                ])->assertCreated();
        }

        $this->assertDatabaseCount('genders', 5);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE GENDER TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_update_gender(): void
    {
        $gender = Gender::create(['name' => 'Original Name']);

        $this->putJson("/api/genders/{$gender->id}", [
            'name' => 'Updated Name',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_update(): void
    {
        $gender = Gender::create(['name' => 'Original Name']);

        $this->actingAs($this->regularUser)
            ->putJson("/api/genders/{$gender->id}", [
                'name' => 'Updated Name',
            ])->assertForbidden();
    }

    public function test_admin_can_update_gender(): void
    {
        $gender = Gender::create(['name' => 'M']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/genders/{$gender->id}", [
                'name' => 'Male',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Male');

        $gender->refresh();
        $this->assertEquals('Male', $gender->name);
    }

    public function test_super_admin_can_update_gender(): void
    {
        $gender = Gender::create(['name' => 'F']);

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/genders/{$gender->id}", [
                'name' => 'Female',
            ]);

        $response->assertOk();
    }

    public function test_update_nonexistent_gender_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/genders/99999', [
                'name' => 'Updated Name',
            ])->assertNotFound();
    }

    public function test_update_gender_requires_name(): void
    {
        $gender = Gender::create(['name' => 'Original']);

        $this->actingAs($this->admin)
            ->putJson("/api/genders/{$gender->id}", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_gender_name_must_be_unique(): void
    {
        $gender1 = Gender::create(['name' => 'Gender 1']);
        Gender::create(['name' => 'Gender 2']);

        $this->actingAs($this->admin)
            ->putJson("/api/genders/{$gender1->id}", [
                'name' => 'Gender 2',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_gender_can_keep_same_name(): void
    {
        $gender = Gender::create(['name' => 'Male']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/genders/{$gender->id}", [
                'name' => 'Male',
            ]);

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE GENDER TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_delete_gender(): void
    {
        $gender = Gender::create(['name' => 'To Delete']);

        $this->deleteJson("/api/genders/{$gender->id}")
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_delete(): void
    {
        $gender = Gender::create(['name' => 'To Delete']);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/genders/{$gender->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_gender(): void
    {
        $gender = Gender::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/genders/{$gender->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('genders', [
            'id' => $gender->id,
        ]);
    }

    public function test_super_admin_can_delete_gender(): void
    {
        $gender = Gender::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/genders/{$gender->id}");

        $response->assertOk();
    }

    public function test_delete_nonexistent_gender_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/genders/99999')
            ->assertNotFound();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_list_with_large_dataset(): void
    {
        foreach (range(1, 100) as $i) {
            Gender::create(['name' => "Gender $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?per_page=50&page=1');

        $response->assertOk()
            ->assertJsonPath('meta.total', 100)
            ->assertJsonCount(50, 'data');
    }

    public function test_update_then_delete_workflow(): void
    {
        $gender = Gender::create(['name' => 'Original']);

        $this->actingAs($this->admin)
            ->putJson("/api/genders/{$gender->id}", [
                'name' => 'Updated Name',
            ])->assertOk();

        $this->actingAs($this->admin)
            ->deleteJson("/api/genders/{$gender->id}")
            ->assertOk();

        $this->assertNull(Gender::find($gender->id));
    }

    public function test_multiple_users_can_access_same_data(): void
    {
        $gender = Gender::create(['name' => 'Shared Gender']);

        $this->actingAs($this->admin)
            ->getJson('/api/genders')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->actingAs($this->superAdmin)
            ->getJson('/api/genders')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_search_partial_match(): void
    {
        Gender::create(['name' => 'Male']);
        Gender::create(['name' => 'Female']);
        Gender::create(['name' => 'Non-Binary']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders?search=ale');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_standard_gender_options(): void
    {
        $standardGenders = [
            'Male',
            'Female',
            'Non-Binary',
            'Prefer Not to Say',
            'Other',
        ];

        foreach ($standardGenders as $gender) {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/genders', ['name' => $gender]);

            $response->assertCreated();
        }

        $this->assertDatabaseCount('genders', 5);
    }

    public function test_response_includes_created_at_date(): void
    {
        Gender::create(['name' => 'Test Gender']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/genders');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'created_at'],
                ],
            ]);

        $createdAt = $response->json('data.0.created_at');
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $createdAt);
    }

    public function test_gender_with_hyphens(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => 'Non-Binary',
            ]);

        $response->assertCreated();
    }

    public function test_gender_with_parentheses(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/genders', [
                'name' => 'Non-Binary (LGBTQ+)',
            ]);

        $response->assertCreated();
    }
}
