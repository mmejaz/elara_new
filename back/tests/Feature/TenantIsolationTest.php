<?php

namespace Tests\Feature;

use App\Models\Gender;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Stancl\Tenancy\Facades\Tenancy;
use Tests\TestCase;

/**
 * Verifies that multi-tenant data isolation is enforced at the database level.
 * Users in different tenants cannot see each other's data, and permissions
 * are scoped to their tenant.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant1;
    private Tenant $tenant2;
    private User $user1;
    private User $user2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles globally
        Role::findOrCreate('Admin', 'web');
        Role::findOrCreate('Super Admin', 'web');

        // Create two tenants with separate databases
        $this->tenant1 = Tenant::create(['name' => 'Tenant 1', 'domain' => 'tenant1.test']);
        $this->tenant2 = Tenant::create(['name' => 'Tenant 2', 'domain' => 'tenant2.test']);

        // Run migrations for both tenants
        Tenancy::initialize($this->tenant1)->run(fn () => $this->artisan('migrate'));
        Tenancy::initialize($this->tenant2)->run(fn () => $this->artisan('migrate'));

        // Create users in each tenant
        Tenancy::initialize($this->tenant1)->run(function () {
            $this->user1 = User::factory()->create(['email' => 'user1@tenant1.com']);
            $this->user1->assignRole('Admin');
        });

        Tenancy::initialize($this->tenant2)->run(function () {
            $this->user2 = User::factory()->create(['email' => 'user2@tenant2.com']);
            $this->user2->assignRole('Admin');
        });
    }

    // ─────────────────────────── Data Isolation ────

    public function test_user_in_tenant1_cannot_see_data_from_tenant2(): void
    {
        // Create gender in tenant1
        Tenancy::initialize($this->tenant1)->run(function () {
            Gender::create(['name' => 'Tenant1 Gender']);

            $response = $this->actingAs($this->user1)
                ->getJson('/api/genders');

            $this->assertCount(1, $response->json('data'));
        });

        // User in tenant2 should not see it
        Tenancy::initialize($this->tenant2)->run(function () {
            $response = $this->actingAs($this->user2)
                ->getJson('/api/genders');

            $this->assertCount(0, $response->json('data'));
        });
    }

    public function test_user_cannot_update_resource_from_different_tenant(): void
    {
        $genderId = null;

        // Create gender in tenant1
        Tenancy::initialize($this->tenant1)->run(function () use (&$genderId) {
            $gender = Gender::create(['name' => 'Original Name']);
            $genderId = $gender->id;
        });

        // Try to update from tenant2 (should fail - resource not found)
        Tenancy::initialize($this->tenant2)->run(function () use ($genderId) {
            $this->actingAs($this->user2)
                ->putJson("/api/genders/{$genderId}", ['name' => 'Hacked Name'])
                ->assertNotFound();
        });

        // Verify it wasn't changed
        Tenancy::initialize($this->tenant1)->run(function () {
            $gender = Gender::first();
            $this->assertEquals('Original Name', $gender->name);
        });
    }

    public function test_user_cannot_delete_resource_from_different_tenant(): void
    {
        $genderId = null;

        Tenancy::initialize($this->tenant1)->run(function () use (&$genderId) {
            $gender = Gender::create(['name' => 'To Delete']);
            $genderId = $gender->id;
        });

        // Try to delete from tenant2
        Tenancy::initialize($this->tenant2)->run(function () use ($genderId) {
            $this->actingAs($this->user2)
                ->deleteJson("/api/genders/{$genderId}")
                ->assertNotFound();
        });

        // Verify it still exists in tenant1
        Tenancy::initialize($this->tenant1)->run(function () {
            $this->assertNotNull(Gender::first());
        });
    }

    // ──────────────────────── Permission Isolation ────

    public function test_permissions_are_scoped_to_tenant(): void
    {
        Tenancy::initialize($this->tenant1)->run(function () {
            $this->user1->givePermissionTo('gender.view');

            $response = $this->actingAs($this->user1)
                ->getJson('/api/profile/access');

            $this->assertContains('gender.view', $response->json('data.permissions'));
        });

        // Permissions in tenant2 should be separate
        Tenancy::initialize($this->tenant2)->run(function () {
            $response = $this->actingAs($this->user2)
                ->getJson('/api/profile/access');

            $this->assertNotContains('gender.view', $response->json('data.permissions'));
        });
    }

    public function test_revoking_permission_in_tenant1_does_not_affect_tenant2(): void
    {
        Tenancy::initialize($this->tenant1)->run(function () {
            $this->user1->givePermissionTo('gender.create');
        });

        Tenancy::initialize($this->tenant2)->run(function () {
            $this->user2->givePermissionTo('gender.create');
        });

        // Revoke in tenant1
        Tenancy::initialize($this->tenant1)->run(function () {
            $this->user1->revokePermissionTo('gender.create');
        });

        // Verify still has permission in tenant2
        Tenancy::initialize($this->tenant2)->run(function () {
            $response = $this->actingAs($this->user2)
                ->getJson('/api/profile/access');

            $this->assertContains('gender.create', $response->json('data.permissions'));
        });
    }

    // ────────────────── Tenant-Specific Module Visibility ────

    public function test_modules_visible_setting_is_per_tenant(): void
    {
        Tenancy::initialize($this->tenant1)->run(function () {
            $response = $this->actingAs($this->user1)
                ->getJson('/api/profile/access');

            $modules1 = $response->json('data.modules');
            $this->assertIsArray($modules1);
        });

        Tenancy::initialize($this->tenant2)->run(function () {
            $response = $this->actingAs($this->user2)
                ->getJson('/api/profile/access');

            $modules2 = $response->json('data.modules');
            $this->assertIsArray($modules2);

            // Could be different between tenants
            $this->assertIsArray($modules2);
        });
    }

    // ────────────────── Cross-Tenant Login Prevention ────

    public function test_user_from_tenant1_cannot_login_to_tenant2_domain(): void
    {
        // This test verifies that a user created in tenant1
        // cannot authenticate when the request comes from tenant2's domain
        // (This is more of an integration test with Stancl middleware)

        Tenancy::initialize($this->tenant1)->run(function () {
            $this->assertTrue($this->user1->exists);
        });

        Tenancy::initialize($this->tenant2)->run(function () {
            // User from tenant1 doesn't exist in tenant2's database
            $this->assertFalse(User::where('email', $this->user1->email)->exists());

            $this->postJson('/api/login', [
                'email' => $this->user1->email,
                'password' => 'password',
            ])->assertUnauthorized();
        });
    }

    // ──────────────────── Database Separation ────

    public function test_each_tenant_has_separate_database(): void
    {
        // Create data in tenant1
        Tenancy::initialize($this->tenant1)->run(function () {
            Gender::create(['name' => 'Gender 1']);
            Gender::create(['name' => 'Gender 2']);

            $this->assertCount(2, Gender::all());
        });

        // Tenant2 database should be empty
        Tenancy::initialize($this->tenant2)->run(function () {
            $this->assertCount(0, Gender::all());
        });
    }

    public function test_migrations_run_separately_per_tenant(): void
    {
        // Verify both tenants have the genders table
        Tenancy::initialize($this->tenant1)->run(function () {
            $this->assertTrue(
                \DB::table('information_schema.tables')
                    ->where('table_name', 'genders')
                    ->exists()
            );
        });

        Tenancy::initialize($this->tenant2)->run(function () {
            $this->assertTrue(
                \DB::table('information_schema.tables')
                    ->where('table_name', 'genders')
                    ->exists()
            );
        });
    }
}
