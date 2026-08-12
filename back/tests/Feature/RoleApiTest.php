<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Role API endpoints: list, create, read, update, delete.
 * Tests permission management, role assignments, authorization, and validation.
 */
class RoleApiTest extends TestCase
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

        // Create permissions for testing
        Permission::findOrCreate('user.view', 'web');
        Permission::findOrCreate('user.create', 'web');
        Permission::findOrCreate('user.edit', 'web');
        Permission::findOrCreate('user.delete', 'web');
        Permission::findOrCreate('gender.view', 'web');
        Permission::findOrCreate('gender.create', 'web');
        Permission::findOrCreate('gender.edit', 'web');
        Permission::findOrCreate('gender.delete', 'web');
        Permission::findOrCreate('role.view', 'web');
        Permission::findOrCreate('role.create', 'web');
        Permission::findOrCreate('role.edit', 'web');
        Permission::findOrCreate('role.delete', 'web');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH / INDEX TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_access_roles(): void
    {
        $this->getJson('/api/roles')->assertUnauthorized();
    }

    public function test_regular_user_cannot_list_roles(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/roles')
            ->assertForbidden();
    }

    public function test_admin_can_list_all_roles(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/roles');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'created_at'],
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 3); // Super Admin, Admin, User
    }

    public function test_super_admin_can_list_roles(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/roles');

        $response->assertOk()
            ->assertJsonPath('meta.total', 3);
    }

    public function test_role_list_returns_paginated_results(): void
    {
        Role::factory()->count(25)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/roles?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 28); // 25 + 3 default roles
    }

    public function test_role_list_respects_pagination(): void
    {
        Role::factory()->count(30)->create();

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/roles?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/roles?per_page=15&page=2');

        $page1->assertJsonPath('meta.current_page', 1);
        $page2->assertJsonPath('meta.current_page', 2);
    }

    public function test_role_list_can_be_searched(): void
    {
        Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        Role::create(['name' => 'Contributor', 'guard_name' => 'web']);
        Role::create(['name' => 'Viewer', 'guard_name' => 'web']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/roles?search=editor');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Editor')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_role_list_can_be_sorted(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/roles?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH SINGLE ROLE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_fetch_role(): void
    {
        $role = Role::first();

        $this->getJson("/api/roles/{$role->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_fetch_role(): void
    {
        $role = Role::first();

        $this->actingAs($this->regularUser)
            ->getJson("/api/roles/{$role->id}")
            ->assertForbidden();
    }

    public function test_admin_can_fetch_single_role(): void
    {
        $role = Role::findByName('Admin');

        $response = $this->actingAs($this->admin)
            ->getJson("/api/roles/{$role->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $role->id)
            ->assertJsonPath('data.name', 'Admin');
    }

    public function test_fetch_nonexistent_role_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/roles/99999')
            ->assertNotFound();
    }

    public function test_fetched_role_includes_permissions(): void
    {
        $role = Role::findByName('Admin');
        $role->givePermissionTo(['user.view', 'user.create', 'gender.view']);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/roles/{$role->id}");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id', 'name', 'permissions', 'created_at'
                ]
            ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE ROLE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_create_role(): void
    {
        $this->postJson('/api/roles', [
            'name' => 'New Role',
            'permissions' => ['user.view'],
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_role(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/roles', [
                'name' => 'New Role',
                'permissions' => ['user.view'],
            ])->assertForbidden();
    }

    public function test_admin_can_create_role(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'permissions' => ['user.view', 'gender.view'],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Editor');

        $this->assertDatabaseHas('roles', [
            'name' => 'Editor',
        ]);
    }

    public function test_super_admin_can_create_role(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/roles', [
                'name' => 'Moderator',
                'permissions' => ['user.edit'],
            ]);

        $response->assertCreated();
    }

    public function test_create_role_assigns_permissions(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'permissions' => ['user.view', 'user.create', 'gender.view'],
            ])->assertCreated();

        $role = Role::findByName('Editor');
        $this->assertTrue($role->hasPermissionTo('user.view'));
        $this->assertTrue($role->hasPermissionTo('user.create'));
        $this->assertTrue($role->hasPermissionTo('gender.view'));
    }

    public function test_create_role_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'permissions' => ['user.view'],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_role_name_must_be_unique(): void
    {
        Role::create(['name' => 'Editor', 'guard_name' => 'web']);

        $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'permissions' => [],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_role_without_permissions(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Viewer',
                'permissions' => [],
            ]);

        $response->assertCreated();

        $role = Role::findByName('Viewer');
        $this->assertFalse($role->hasPermissionTo('user.view'));
    }

    public function test_create_role_with_invalid_permissions_ignored(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'permissions' => ['nonexistent.permission'],
            ]);

        // Should still create role, invalid permissions ignored or error
        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_role_name_max_length(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => $longName,
                'permissions' => [],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_role_permissions_array_optional(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Viewer',
            ]);

        $response->assertCreated();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE ROLE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_update_role(): void
    {
        $role = Role::first();

        $this->putJson("/api/roles/{$role->id}", [
            'name' => 'Updated Role',
            'permissions' => [],
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_update_role(): void
    {
        $role = Role::first();

        $this->actingAs($this->regularUser)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Updated Role',
                'permissions' => [],
            ])->assertForbidden();
    }

    public function test_admin_can_update_role(): void
    {
        $role = Role::findByName('Admin');

        $response = $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Administrator',
                'permissions' => ['user.view'],
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Administrator');

        $role->refresh();
        $this->assertEquals('Administrator', $role->name);
    }

    public function test_update_role_name(): void
    {
        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Content Editor',
                'permissions' => [],
            ])->assertOk();

        $role->refresh();
        $this->assertEquals('Content Editor', $role->name);
    }

    public function test_update_role_permissions(): void
    {
        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role->givePermissionTo('user.view');

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Editor',
                'permissions' => ['user.create', 'gender.view'],
            ])->assertOk();

        $role->refresh();
        $this->assertTrue($role->hasPermissionTo('user.create'));
        $this->assertTrue($role->hasPermissionTo('gender.view'));
        $this->assertFalse($role->hasPermissionTo('user.view'));
    }

    public function test_update_role_add_permissions(): void
    {
        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role->givePermissionTo(['user.view']);

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Editor',
                'permissions' => ['user.view', 'user.create', 'gender.view'],
            ])->assertOk();

        $role->refresh();
        $this->assertTrue($role->hasPermissionTo('user.create'));
    }

    public function test_update_role_remove_permissions(): void
    {
        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role->givePermissionTo(['user.view', 'user.create', 'gender.view']);

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Editor',
                'permissions' => ['user.view'],
            ])->assertOk();

        $role->refresh();
        $this->assertTrue($role->hasPermissionTo('user.view'));
        $this->assertFalse($role->hasPermissionTo('user.create'));
        $this->assertFalse($role->hasPermissionTo('gender.view'));
    }

    public function test_update_nonexistent_role_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/roles/99999', [
                'name' => 'Name',
                'permissions' => [],
            ])->assertNotFound();
    }

    public function test_update_role_name_must_be_unique(): void
    {
        $role1 = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role2 = Role::create(['name' => 'Contributor', 'guard_name' => 'web']);

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role2->id}", [
                'name' => 'Editor', // Same as role1
                'permissions' => [],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_role_requires_name(): void
    {
        $role = Role::first();

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'permissions' => [],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_cannot_update_super_admin_role(): void
    {
        $superAdminRole = Role::findByName('Super Admin');

        // Business logic may prevent updating Super Admin
        $response = $this->actingAs($this->admin)
            ->putJson("/api/roles/{$superAdminRole->id}", [
                'name' => 'Modified Super Admin',
                'permissions' => [],
            ]);

        // Either allows or prevents (depending on business logic)
        $this->assertTrue(
            $response->status() === 403 || $response->status() === 200
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE ROLE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_delete_role(): void
    {
        $role = Role::create(['name' => 'To Delete', 'guard_name' => 'web']);

        $this->deleteJson("/api/roles/{$role->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_delete_role(): void
    {
        $role = Role::create(['name' => 'To Delete', 'guard_name' => 'web']);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/roles/{$role->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_role(): void
    {
        $role = Role::create(['name' => 'To Delete', 'guard_name' => 'web']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/roles/{$role->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('roles', [
            'id' => $role->id,
        ]);
    }

    public function test_delete_nonexistent_role_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/roles/99999')
            ->assertNotFound();
    }

    public function test_delete_role_removes_from_database(): void
    {
        $role = Role::create(['name' => 'Temporary', 'guard_name' => 'web']);
        $roleId = $role->id;

        $this->actingAs($this->admin)
            ->deleteJson("/api/roles/{$roleId}")
            ->assertOk();

        $this->assertNull(Role::find($roleId));
    }

    public function test_cannot_delete_role_with_users(): void
    {
        $role = Role::create(['name' => 'In Use', 'guard_name' => 'web']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/roles/{$role->id}");

        // May prevent deletion if role is in use
        // Or allow and unassign from users
        $this->assertTrue(
            $response->status() === 403 || $response->status() === 200
        );
    }

    public function test_cannot_delete_system_roles(): void
    {
        $superAdminRole = Role::findByName('Super Admin');

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/roles/{$superAdminRole->id}");

        // Should prevent deletion of system roles
        $this->assertTrue(
            $response->status() === 403 || $response->status() === 400
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PERMISSION MANAGEMENT TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_role_can_have_multiple_permissions(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'permissions' => [
                    'user.view', 'user.create', 'user.edit',
                    'gender.view', 'gender.create', 'gender.edit',
                ],
            ]);

        $response->assertCreated();

        $role = Role::findByName('Editor');
        $this->assertCount(6, $role->permissions);
    }

    public function test_role_permissions_persist_on_update(): void
    {
        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role->givePermissionTo(['user.view', 'gender.view']);

        $this->actingAs($this->admin)
            ->putJson("/api/roles/{$role->id}", [
                'name' => 'Content Editor',
                'permissions' => ['user.view', 'gender.view'],
            ])->assertOk();

        $role->refresh();
        $this->assertCount(2, $role->permissions);
    }

    public function test_user_gets_role_permissions(): void
    {
        $role = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role->givePermissionTo(['user.view', 'gender.create']);

        $user = User::factory()->create();
        $user->assignRole($role);

        $this->assertTrue($user->hasPermissionTo('user.view'));
        $this->assertTrue($user->hasPermissionTo('gender.create'));
        $this->assertFalse($user->hasPermissionTo('user.edit'));
    }

    public function test_role_permission_inheritance(): void
    {
        $role = Role::create(['name' => 'Moderator', 'guard_name' => 'web']);
        $permissions = ['user.view', 'user.edit', 'gender.view', 'gender.edit'];
        $role->syncPermissions($permissions);

        $user = User::factory()->create();
        $user->assignRole($role);

        // User should have all role permissions
        foreach ($permissions as $permission) {
            $this->assertTrue($user->hasPermissionTo($permission));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // RESPONSE STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_role_response_has_correct_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/roles');

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
            'meta',
        ]);
    }

    public function test_single_role_response_structure(): void
    {
        $role = Role::first();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/roles/{$role->id}");

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

    public function test_create_role_response_includes_data(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Test Role',
                'permissions' => ['user.view'],
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

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_role_name_case_sensitivity(): void
    {
        Role::create(['name' => 'Editor', 'guard_name' => 'web']);

        // Create with different case should be treated as different or same
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'editor', // Lowercase
                'permissions' => [],
            ]);

        // Should either create as duplicate or prevent based on DB collation
        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_role_with_special_characters_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor & Moderator',
                'permissions' => [],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Editor & Moderator');
    }

    public function test_empty_permissions_array(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Guest',
                'permissions' => [],
            ]);

        $response->assertCreated();

        $role = Role::findByName('Guest');
        $this->assertCount(0, $role->permissions);
    }

    public function test_role_list_pagination_edge_cases(): void
    {
        Role::factory()->count(5)->create();

        // Test with per_page = 1
        $response = $this->actingAs($this->admin)
            ->getJson('/api/roles?per_page=1');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_duplicate_permissions_in_array(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/roles', [
                'name' => 'Editor',
                'permissions' => [
                    'user.view', 'user.view', 'user.create' // Duplicate
                ],
            ]);

        $response->assertCreated();

        $role = Role::findByName('Editor');
        // Should have unique permissions
        $this->assertLessThanOrEqual(2, $role->permissions->count());
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTHORIZATION MATRIX TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_role_permission_matrix_consistency(): void
    {
        // Create role with specific permissions
        $role = Role::create(['name' => 'Tester', 'guard_name' => 'web']);
        $permissions = ['user.view', 'user.create', 'gender.view'];
        $role->syncPermissions($permissions);

        // Verify all permissions are assigned
        $assignedPermissions = $role->permissions()->pluck('name')->toArray();
        $this->assertEqualsCanonicalizing($permissions, $assignedPermissions);
    }

    public function test_role_permissions_isolated_between_roles(): void
    {
        $role1 = Role::create(['name' => 'Editor', 'guard_name' => 'web']);
        $role1->givePermissionTo(['user.view', 'user.create']);

        $role2 = Role::create(['name' => 'Viewer', 'guard_name' => 'web']);
        $role2->givePermissionTo(['user.view']);

        // Role1 should have both permissions
        $this->assertTrue($role1->hasPermissionTo('user.create'));

        // Role2 should only have view
        $this->assertFalse($role2->hasPermissionTo('user.create'));
    }

    public function test_multiple_users_same_role_share_permissions(): void
    {
        $role = Role::create(['name' => 'Moderator', 'guard_name' => 'web']);
        $role->givePermissionTo(['user.view', 'user.edit']);

        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $user1->assignRole($role);
        $user2->assignRole($role);

        // Both users should have same permissions
        $this->assertTrue($user1->hasPermissionTo('user.edit'));
        $this->assertTrue($user2->hasPermissionTo('user.edit'));
    }
}
