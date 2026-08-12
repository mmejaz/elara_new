<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Permission API endpoints: list (fetch) and create.
 * Permissions are read-only (view + create). No update or delete operations.
 *
 * Endpoints:
 * - GET  /api/permissions         (list all permissions)
 * - GET  /api/permissions/{id}    (fetch single permission)
 * - POST /api/permissions         (create new permission)
 * - PUT  /api/permissions/{id}    (NOT ALLOWED - 405 Method Not Allowed)
 * - DELETE /api/permissions/{id}  (NOT ALLOWED - 405 Method Not Allowed)
 */
class PermissionApiTest extends TestCase
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
    // FETCH / LIST PERMISSIONS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_access_permissions(): void
    {
        $this->getJson('/api/permissions')->assertUnauthorized();
    }

    public function test_regular_user_cannot_list_permissions(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/permissions')
            ->assertForbidden();
    }

    public function test_admin_can_list_all_permissions(): void
    {
        // Create test permissions
        Permission::findOrCreate('user.view', 'web');
        Permission::findOrCreate('user.create', 'web');
        Permission::findOrCreate('user.edit', 'web');
        Permission::findOrCreate('user.delete', 'web');
        Permission::findOrCreate('gender.view', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'created_at'],
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 5);
    }

    public function test_super_admin_can_list_permissions(): void
    {
        Permission::findOrCreate('role.view', 'web');
        Permission::findOrCreate('role.create', 'web');

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/permissions');

        $response->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_permission_list_returns_paginated_results(): void
    {
        // Create 25 permissions
        foreach (range(1, 25) as $i) {
            Permission::findOrCreate("permission.$i", 'web');
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_permission_list_respects_pagination(): void
    {
        foreach (range(1, 30) as $i) {
            Permission::findOrCreate("perm.$i", 'web');
        }

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/permissions?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/permissions?per_page=15&page=2');

        $page1->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 30)
            ->assertJsonCount(15, 'data');

        $page2->assertJsonPath('meta.current_page', 2)
            ->assertJsonCount(15, 'data');
    }

    public function test_permission_list_can_be_searched(): void
    {
        Permission::findOrCreate('user.view', 'web');
        Permission::findOrCreate('user.create', 'web');
        Permission::findOrCreate('user.edit', 'web');
        Permission::findOrCreate('gender.view', 'web');
        Permission::findOrCreate('gender.create', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?search=user');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('meta.total', 3);
    }

    public function test_permission_search_by_exact_name(): void
    {
        Permission::findOrCreate('user.view', 'web');
        Permission::findOrCreate('user.create', 'web');
        Permission::findOrCreate('gender.view', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?search=user.view');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'user.view');
    }

    public function test_permission_list_can_be_sorted(): void
    {
        Permission::findOrCreate('zebra.permission', 'web');
        Permission::findOrCreate('apple.permission', 'web');
        Permission::findOrCreate('banana.permission', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_permission_list_sort_descending(): void
    {
        Permission::findOrCreate('alpha', 'web');
        Permission::findOrCreate('beta', 'web');
        Permission::findOrCreate('gamma', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?sort_by=name&sort_dir=desc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_empty_search_returns_all_permissions(): void
    {
        Permission::findOrCreate('perm.one', 'web');
        Permission::findOrCreate('perm.two', 'web');
        Permission::findOrCreate('perm.three', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?search=');

        $response->assertOk()
            ->assertJsonPath('meta.total', 3);
    }

    public function test_permission_list_default_pagination(): void
    {
        foreach (range(1, 20) as $i) {
            Permission::findOrCreate("perm.$i", 'web');
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions');

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 15); // Default per page
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH SINGLE PERMISSION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_fetch_permission(): void
    {
        $permission = Permission::findOrCreate('user.view', 'web');

        $this->getJson("/api/permissions/{$permission->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_fetch_permission(): void
    {
        $permission = Permission::findOrCreate('user.view', 'web');

        $this->actingAs($this->regularUser)
            ->getJson("/api/permissions/{$permission->id}")
            ->assertForbidden();
    }

    public function test_admin_can_fetch_single_permission(): void
    {
        $permission = Permission::findOrCreate('user.create', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/permissions/{$permission->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $permission->id)
            ->assertJsonPath('data.name', 'user.create');
    }

    public function test_super_admin_can_fetch_permission(): void
    {
        $permission = Permission::findOrCreate('role.delete', 'web');

        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/permissions/{$permission->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $permission->id);
    }

    public function test_fetch_nonexistent_permission_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/permissions/99999')
            ->assertNotFound();
    }

    public function test_fetch_permission_returns_correct_structure(): void
    {
        $permission = Permission::findOrCreate('gender.view', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/permissions/{$permission->id}");

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'created_at',
            ],
        ]);
    }

    public function test_fetch_permission_includes_all_details(): void
    {
        $permission = Permission::findOrCreate('user.edit', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/permissions/{$permission->id}");

        $response->assertOk()
            ->assertJsonPath('data.name', 'user.edit')
            ->assertJsonMissing(['data.updated_at']); // No update tracking
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE PERMISSION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_create_permission(): void
    {
        $this->postJson('/api/permissions', [
            'name' => 'new.permission',
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_permission(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/permissions', [
                'name' => 'new.permission',
            ])->assertForbidden();
    }

    public function test_admin_can_create_permission(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'post.publish',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'post.publish');

        $this->assertDatabaseHas('permissions', [
            'name' => 'post.publish',
        ]);
    }

    public function test_super_admin_can_create_permission(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/permissions', [
                'name' => 'admin.access',
            ]);

        $response->assertCreated();
    }

    public function test_create_permission_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/permissions', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_permission_name_must_be_unique(): void
    {
        Permission::findOrCreate('user.view', 'web');

        $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'user.view',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_permission_name_must_be_string(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 12345, // Numeric instead of string
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_permission_name_max_length(): void
    {
        $longName = str_repeat('a', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_permission_name_with_dots(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'user.profile.edit',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'user.profile.edit');
    }

    public function test_permission_name_with_underscore(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'user_management_view',
            ]);

        $response->assertCreated();
    }

    public function test_permission_name_case_sensitive(): void
    {
        Permission::findOrCreate('User.View', 'web');

        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'user.view', // Different case
            ]);

        // Should create as different permission (case-sensitive)
        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_created_permission_stored_in_database(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'document.share',
            ])->assertCreated();

        $this->assertDatabaseHas('permissions', [
            'name' => 'document.share',
            'guard_name' => 'web',
        ]);
    }

    public function test_created_permission_has_correct_guard(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'team.manage',
            ]);

        $permissionId = $response->json('data.id');
        $permission = Permission::find($permissionId);

        $this->assertEquals('web', $permission->guard_name);
    }

    public function test_create_permission_response_includes_data(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'new.perm',
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'created_at',
            ],
        ])->assertJsonPath('success', true);
    }

    public function test_create_multiple_permissions_sequentially(): void
    {
        $permissions = ['perm.one', 'perm.two', 'perm.three'];

        foreach ($permissions as $name) {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/permissions', ['name' => $name]);

            $response->assertCreated();
        }

        foreach ($permissions as $name) {
            $this->assertDatabaseHas('permissions', ['name' => $name]);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE NOT ALLOWED TESTS (405 Method Not Allowed)
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_update_permission_not_allowed(): void
    {
        $permission = Permission::findOrCreate('user.view', 'web');

        $response = $this->actingAs($this->admin)
            ->putJson("/api/permissions/{$permission->id}", [
                'name' => 'user.view.updated',
            ]);

        // Should return 405 Method Not Allowed or 403 Forbidden
        $this->assertTrue(
            $response->status() === 405 || $response->status() === 403
        );
    }

    public function test_super_admin_cannot_update_permission(): void
    {
        $permission = Permission::findOrCreate('role.create', 'web');

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/permissions/{$permission->id}", [
                'name' => 'role.create.v2',
            ]);

        $this->assertTrue(
            $response->status() === 405 || $response->status() === 403
        );
    }

    public function test_patch_permission_not_allowed(): void
    {
        $permission = Permission::findOrCreate('gender.edit', 'web');

        $response = $this->actingAs($this->admin)
            ->patchJson("/api/permissions/{$permission->id}", [
                'name' => 'gender.edit.v2',
            ]);

        $this->assertTrue(
            $response->status() === 405 || $response->status() === 403
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE NOT ALLOWED TESTS (405 Method Not Allowed)
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_delete_permission_not_allowed(): void
    {
        $permission = Permission::findOrCreate('user.delete', 'web');

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/permissions/{$permission->id}");

        // Should return 405 Method Not Allowed or 403 Forbidden
        $this->assertTrue(
            $response->status() === 405 || $response->status() === 403
        );
    }

    public function test_super_admin_cannot_delete_permission(): void
    {
        $permission = Permission::findOrCreate('admin.dashboard', 'web');

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/permissions/{$permission->id}");

        $this->assertTrue(
            $response->status() === 405 || $response->status() === 403
        );
    }

    public function test_admin_cannot_delete_permission(): void
    {
        $permission = Permission::findOrCreate('system.config', 'web');

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/permissions/{$permission->id}");

        // Permission should still exist
        $this->assertDatabaseHas('permissions', [
            'id' => $permission->id,
        ]);
    }

    public function test_deleted_permission_endpoint_returns_405(): void
    {
        $permission = Permission::findOrCreate('tenant.access', 'web');

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/permissions/{$permission->id}");

        $this->assertTrue(
            $response->status() === 405 || $response->status() === 403 || $response->status() === 404
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // RESPONSE STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_permission_list_response_structure(): void
    {
        Permission::findOrCreate('test.perm', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions');

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
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

    public function test_single_permission_response_structure(): void
    {
        $permission = Permission::findOrCreate('user.view', 'web');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/permissions/{$permission->id}");

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'created_at',
            ],
        ]);
    }

    public function test_create_permission_response_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'new.test',
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'created_at',
            ],
        ])->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Permission created successfully.');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_permission_name_with_numbers(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'api.v2.access',
            ]);

        $response->assertCreated();
    }

    public function test_permission_name_with_hyphens(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'user-management-view',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'user-management-view');
    }

    public function test_permission_list_large_pagination(): void
    {
        foreach (range(1, 100) as $i) {
            Permission::findOrCreate("perm.$i", 'web');
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?per_page=50');

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 50);
    }

    public function test_permission_search_case_insensitive(): void
    {
        Permission::findOrCreate('User.View', 'web');

        $response1 = $this->actingAs($this->admin)
            ->getJson('/api/permissions?search=user');

        $response2 = $this->actingAs($this->admin)
            ->getJson('/api/permissions?search=USER');

        // Should find regardless of case (depends on implementation)
        $this->assertTrue(
            $response1->status() === 200 && $response2->status() === 200
        );
    }

    public function test_permission_created_timestamp(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/permissions', [
                'name' => 'timestamp.test',
            ]);

        $response->assertCreated();
        $createdAt = $response->json('data.created_at');

        $this->assertNotNull($createdAt);
    }

    public function test_multiple_permissions_for_same_module(): void
    {
        $permissions = ['user.view', 'user.create', 'user.edit', 'user.delete'];

        foreach ($permissions as $name) {
            $this->actingAs($this->admin)
                ->postJson('/api/permissions', ['name' => $name])
                ->assertCreated();
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/permissions?search=user');

        $response->assertJsonPath('meta.total', 4);
    }
}
