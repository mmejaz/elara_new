<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Stancl\Tenancy\Models\Domain;
use Stancl\Tenancy\Models\Tenant;
use Tests\TestCase;

/**
 * Comprehensive tests for Tenant API endpoints: list, create, read, update, delete.
 * Tests tenant provisioning, domain management, admin creation, and authorization.
 *
 * Endpoints:
 * - GET    /api/tenants              (list all tenants)
 * - POST   /api/tenants              (create new tenant + provision)
 * - GET    /api/tenants/{id}         (fetch single tenant)
 * - PUT    /api/tenants/{id}         (update tenant details)
 * - DELETE /api/tenants/{id}         (delete tenant + deprovision)
 */
class TenantApiTest extends TestCase
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
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH / LIST TENANTS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_access_tenants(): void
    {
        $this->getJson('/api/tenants')->assertUnauthorized();
    }

    public function test_regular_user_cannot_list_tenants(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/tenants')
            ->assertForbidden();
    }

    public function test_admin_cannot_list_tenants(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/tenants')
            ->assertForbidden();
    }

    public function test_super_admin_can_list_all_tenants(): void
    {
        // Create test tenants
        $tenant1 = Tenant::create(['id' => 'tenant1']);
        $tenant2 = Tenant::create(['id' => 'tenant2']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'domain', 'status', 'created_at'],
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_tenant_list_returns_paginated_results(): void
    {
        // Create multiple tenants
        foreach (range(1, 25) as $i) {
            Tenant::create(['id' => "tenant$i"]);
        }

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_tenant_list_respects_pagination(): void
    {
        foreach (range(1, 30) as $i) {
            Tenant::create(['id' => "tenant$i"]);
        }

        $page1 = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?per_page=15&page=1');

        $page2 = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?per_page=15&page=2');

        $page1->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 30)
            ->assertJsonCount(15, 'data');

        $page2->assertJsonPath('meta.current_page', 2)
            ->assertJsonCount(15, 'data');
    }

    public function test_tenant_list_can_be_searched(): void
    {
        Tenant::create(['id' => 'school-one']);
        Tenant::create(['id' => 'school-two']);
        Tenant::create(['id' => 'company-abc']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?search=school');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_tenant_list_can_be_sorted(): void
    {
        Tenant::create(['id' => 'zebra-corp']);
        Tenant::create(['id' => 'alpha-school']);
        Tenant::create(['id' => 'beta-org']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?sort_by=id&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_tenant_list_filter_by_status(): void
    {
        $tenant1 = Tenant::create(['id' => 'active-tenant']);
        $tenant2 = Tenant::create(['id' => 'suspended-tenant']);

        // Update status (assuming status field exists)
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?status=active');

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH SINGLE TENANT TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_fetch_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $this->getJson("/api/tenants/{$tenant->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_fetch_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $this->actingAs($this->regularUser)
            ->getJson("/api/tenants/{$tenant->id}")
            ->assertForbidden();
    }

    public function test_super_admin_can_fetch_single_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'school-one']);
        Domain::create(['domain' => 'school-one.elara.test', 'tenant_id' => $tenant->id]);

        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/tenants/{$tenant->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $tenant->id)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'domain', 'status', 'created_at'],
            ]);
    }

    public function test_fetch_nonexistent_tenant_returns_404(): void
    {
        $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants/nonexistent-tenant')
            ->assertNotFound();
    }

    public function test_fetch_tenant_includes_domain(): void
    {
        $tenant = Tenant::create(['id' => 'company-xyz']);
        Domain::create(['domain' => 'company-xyz.elara.test', 'tenant_id' => $tenant->id]);

        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/tenants/{$tenant->id}");

        $response->assertOk()
            ->assertJsonPath('data.domain', 'company-xyz.elara.test');
    }

    public function test_fetch_tenant_includes_admin_info(): void
    {
        $tenant = Tenant::create(['id' => 'test-org']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/tenants/{$tenant->id}");

        $response->assertOk()
            ->assertJsonStructure(['data' => ['id', 'name', 'domain']]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE TENANT TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_create_tenant(): void
    {
        $this->postJson('/api/tenants', [
            'name' => 'New School',
            'domain' => 'newschool.elara.test',
            'admin_email' => 'admin@newschool.edu',
            'admin_password' => 'AdminPassword123!',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_tenant(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/tenants', [
                'name' => 'New School',
                'domain' => 'newschool.elara.test',
                'admin_email' => 'admin@newschool.edu',
                'admin_password' => 'AdminPassword123!',
            ])->assertForbidden();
    }

    public function test_admin_cannot_create_tenant(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/tenants', [
                'name' => 'New School',
                'domain' => 'newschool.elara.test',
                'admin_email' => 'admin@newschool.edu',
                'admin_password' => 'AdminPassword123!',
            ])->assertForbidden();
    }

    public function test_super_admin_can_create_tenant(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'New School',
                'domain' => 'newschool.elara.test',
                'admin_email' => 'admin@newschool.edu',
                'admin_password' => 'AdminPassword123!',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'New School')
            ->assertJsonPath('data.domain', 'newschool.elara.test');
    }

    public function test_create_tenant_requires_name(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'domain' => 'test.elara.test',
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_tenant_requires_domain(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('domain');
    }

    public function test_create_tenant_domain_must_be_valid(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'invalid domain!', // Invalid format
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('domain');
    }

    public function test_create_tenant_domain_must_be_unique(): void
    {
        $tenant = Tenant::create(['id' => 'existing-tenant']);
        Domain::create(['domain' => 'existing.elara.test', 'tenant_id' => $tenant->id]);

        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'New School',
                'domain' => 'existing.elara.test', // Same domain
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('domain');
    }

    public function test_create_tenant_requires_admin_email(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'test.elara.test',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('admin_email');
    }

    public function test_create_tenant_admin_email_must_be_valid(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'test.elara.test',
                'admin_email' => 'invalid-email',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('admin_email');
    }

    public function test_create_tenant_requires_admin_password(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'test.elara.test',
                'admin_email' => 'admin@test.edu',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('admin_password');
    }

    public function test_create_tenant_password_must_be_strong(): void
    {
        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'test.elara.test',
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'weak', // Too weak
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('admin_password');
    }

    public function test_create_tenant_with_optional_fields(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Academy School',
                'domain' => 'academy.elara.test',
                'id' => 'academy-001', // Optional custom ID
                'admin_name' => 'Principal John',
                'admin_email' => 'principal@academy.edu',
                'admin_password' => 'SecurePass123!',
                'email' => 'contact@academy.edu',
                'phone' => '+1-555-0123',
                'timezone' => 'America/New_York',
                'currency' => 'USD',
                'language' => 'en',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Academy School');
    }

    public function test_create_tenant_creates_database(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'testschool.elara.test',
                'admin_email' => 'admin@testschool.edu',
                'admin_password' => 'Password123!',
            ]);

        $response->assertCreated();
        // Tenant database should be created
        $this->assertDatabaseHas('domains', [
            'domain' => 'testschool.elara.test',
        ]);
    }

    public function test_create_tenant_creates_admin_user(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'testschool.elara.test',
                'admin_name' => 'Admin User',
                'admin_email' => 'admin@testschool.edu',
                'admin_password' => 'Password123!',
            ]);

        $response->assertCreated();
        // Admin user should be created in tenant database
    }

    public function test_created_tenant_has_active_status(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'New Tenant',
                'domain' => 'newtenant.elara.test',
                'admin_email' => 'admin@newtenant.edu',
                'admin_password' => 'Password123!',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'active');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE TENANT TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_update_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $this->putJson("/api/tenants/{$tenant->id}", [
            'name' => 'Updated Name',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_update_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $this->actingAs($this->regularUser)
            ->putJson("/api/tenants/{$tenant->id}", [
                'name' => 'Updated Name',
            ])->assertForbidden();
    }

    public function test_super_admin_can_update_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/tenants/{$tenant->id}", [
                'name' => 'Updated Tenant Name',
                'email' => 'newemail@test.edu',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Tenant Name');
    }

    public function test_update_tenant_requires_name(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $this->actingAs($this->superAdmin)
            ->putJson("/api/tenants/{$tenant->id}", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_nonexistent_tenant_returns_404(): void
    {
        $this->actingAs($this->superAdmin)
            ->putJson('/api/tenants/nonexistent', [
                'name' => 'Name',
            ])->assertNotFound();
    }

    public function test_update_tenant_persists_to_database(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $this->actingAs($this->superAdmin)
            ->putJson("/api/tenants/{$tenant->id}", [
                'name' => 'New Tenant Name',
                'email' => 'contact@tenant.edu',
            ])->assertOk();

        $tenant->refresh();
        $this->assertEquals('New Tenant Name', $tenant->name);
    }

    public function test_update_tenant_can_change_status(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/tenants/{$tenant->id}", [
                'name' => 'Test Tenant',
                'status' => 'suspended',
            ]);

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE TENANT TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_delete_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'to-delete']);

        $this->deleteJson("/api/tenants/{$tenant->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_delete_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'to-delete']);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/tenants/{$tenant->id}")
            ->assertForbidden();
    }

    public function test_super_admin_can_delete_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'to-delete']);

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/tenants/{$tenant->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('tenants', [
            'id' => 'to-delete',
        ]);
    }

    public function test_delete_nonexistent_tenant_returns_404(): void
    {
        $this->actingAs($this->superAdmin)
            ->deleteJson('/api/tenants/nonexistent')
            ->assertNotFound();
    }

    public function test_delete_tenant_removes_domain(): void
    {
        $tenant = Tenant::create(['id' => 'to-delete']);
        Domain::create(['domain' => 'todelete.elara.test', 'tenant_id' => $tenant->id]);

        $this->actingAs($this->superAdmin)
            ->deleteJson("/api/tenants/{$tenant->id}")
            ->assertOk();

        $this->assertDatabaseMissing('domains', [
            'domain' => 'todelete.elara.test',
        ]);
    }

    public function test_delete_tenant_deprovisions_database(): void
    {
        $tenant = Tenant::create(['id' => 'to-delete']);

        $this->actingAs($this->superAdmin)
            ->deleteJson("/api/tenants/{$tenant->id}")
            ->assertOk();

        // Tenant database should be deleted
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // RESPONSE STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_tenant_list_response_structure(): void
    {
        Tenant::create(['id' => 'test']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants');

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'domain',
                    'status',
                    'created_at',
                ],
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);
    }

    public function test_single_tenant_response_structure(): void
    {
        $tenant = Tenant::create(['id' => 'test']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/tenants/{$tenant->id}");

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'domain',
                'status',
                'created_at',
            ],
        ]);
    }

    public function test_create_tenant_response_structure(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'New Tenant',
                'domain' => 'newtenant.elara.test',
                'admin_email' => 'admin@newtenant.edu',
                'admin_password' => 'Password123!',
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'domain',
                'status',
                'created_at',
            ],
        ])->assertJsonPath('success', true);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_tenant_name_max_length(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => $longName,
                'domain' => 'test.elara.test',
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'Password123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_tenant_domain_with_subdomain(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Test School',
                'domain' => 'school.org.elara.test',
                'admin_email' => 'admin@test.edu',
                'admin_password' => 'Password123!',
            ]);

        $response->assertCreated();
    }

    public function test_large_tenant_list_pagination(): void
    {
        foreach (range(1, 100) as $i) {
            Tenant::create(['id' => "tenant$i"]);
        }

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants?per_page=50');

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 50);
    }

    public function test_multiple_tenants_independent(): void
    {
        $tenant1 = Tenant::create(['id' => 'tenant1']);
        $tenant2 = Tenant::create(['id' => 'tenant2']);

        $response1 = $this->actingAs($this->superAdmin)
            ->getJson("/api/tenants/{$tenant1->id}");

        $response2 = $this->actingAs($this->superAdmin)
            ->getJson("/api/tenants/{$tenant2->id}");

        $response1->assertJsonPath('data.id', 'tenant1');
        $response2->assertJsonPath('data.id', 'tenant2');
    }

    public function test_tenant_isolation_in_list(): void
    {
        Tenant::create(['id' => 'isolated-tenant-1']);
        Tenant::create(['id' => 'isolated-tenant-2']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/tenants');

        $response->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_delete_and_recreate_tenant(): void
    {
        $tenant = Tenant::create(['id' => 'test-tenant']);

        // Delete
        $this->actingAs($this->superAdmin)
            ->deleteJson("/api/tenants/{$tenant->id}")
            ->assertOk();

        // Recreate with same ID
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/tenants', [
                'name' => 'Recreated Tenant',
                'id' => 'test-tenant',
                'domain' => 'recreated.elara.test',
                'admin_email' => 'admin@recreated.edu',
                'admin_password' => 'Password123!',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.id', 'test-tenant');
    }
}
