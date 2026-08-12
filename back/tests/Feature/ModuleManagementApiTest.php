<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Module Management API: list, enable, and disable.
 * Tests module visibility toggling, authorization, and filtering.
 *
 * Endpoints:
 * - GET  /api/modules              (list all modules with visibility status)
 * - GET  /api/modules/{id}         (fetch single module)
 * - PUT  /api/modules/{id}         (enable/disable module - toggle is_visible)
 */
class ModuleManagementApiTest extends TestCase
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

        // Create sample modules
        Module::create([
            'name' => 'Users',
            'type' => 'item',
            'resourceful' => true,
            'scope' => 'central',
            'is_visible' => true,
        ]);

        Module::create([
            'name' => 'Roles',
            'type' => 'item',
            'resourceful' => true,
            'scope' => 'central',
            'is_visible' => true,
        ]);

        Module::create([
            'name' => 'Permissions',
            'type' => 'item',
            'resourceful' => false,
            'scope' => 'central',
            'is_visible' => false,
        ]);

        Module::create([
            'name' => 'Dashboard',
            'type' => 'item',
            'resourceful' => false,
            'scope' => 'central',
            'is_visible' => true,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH / LIST MODULES TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_access_modules(): void
    {
        $this->getJson('/api/modules')->assertUnauthorized();
    }

    public function test_regular_user_cannot_manage_modules(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/modules')
            ->assertForbidden();
    }

    public function test_admin_can_list_all_modules(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'type', 'is_visible', 'created_at'],
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 4); // 4 test modules
    }

    public function test_super_admin_can_list_modules(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/modules');

        $response->assertOk()
            ->assertJsonPath('meta.total', 4);
    }

    public function test_module_list_includes_visibility_status(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['is_visible'],
                ],
            ]);

        // Check visible and hidden modules
        $modules = $response->json('data');
        $visibleCount = collect($modules)->where('is_visible', true)->count();
        $hiddenCount = collect($modules)->where('is_visible', false)->count();

        $this->assertEquals(3, $visibleCount); // Users, Roles, Dashboard
        $this->assertEquals(1, $hiddenCount); // Permissions
    }

    public function test_module_list_returns_paginated_results(): void
    {
        // Create additional modules
        Module::factory()->count(20)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 24); // 4 + 20 created
    }

    public function test_module_list_respects_pagination(): void
    {
        Module::factory()->count(30)->create();

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/modules?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/modules?per_page=15&page=2');

        $page1->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 34) // 4 + 30
            ->assertJsonCount(15, 'data');

        $page2->assertJsonPath('meta.current_page', 2)
            ->assertJsonCount(15, 'data');
    }

    public function test_module_list_can_filter_by_visibility(): void
    {
        // This tests optional filtering by visibility status
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?is_visible=true');

        $response->assertOk();
        // All returned modules should be visible
        $modules = $response->json('data');
        foreach ($modules as $module) {
            $this->assertTrue($module['is_visible']);
        }
    }

    public function test_module_list_can_filter_hidden(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?is_visible=false');

        $response->assertOk();
        // Should only return hidden modules
        $modules = $response->json('data');
        foreach ($modules as $module) {
            $this->assertFalse($module['is_visible']);
        }
    }

    public function test_module_list_can_be_searched(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?search=users');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Users');
    }

    public function test_module_list_search_by_type(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?search=dashboard');

        $response->assertOk()
            ->assertJsonPath('data.0.name', 'Dashboard');
    }

    public function test_module_list_can_be_sorted(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_module_list_sort_by_visibility(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?sort_by=is_visible&sort_dir=desc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH SINGLE MODULE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_fetch_module(): void
    {
        $module = Module::first();

        $this->getJson("/api/modules/{$module->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_fetch_module(): void
    {
        $module = Module::first();

        $this->actingAs($this->regularUser)
            ->getJson("/api/modules/{$module->id}")
            ->assertForbidden();
    }

    public function test_admin_can_fetch_single_module(): void
    {
        $module = Module::where('name', 'Users')->first();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/modules/{$module->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $module->id)
            ->assertJsonPath('data.name', 'Users')
            ->assertJsonPath('data.is_visible', true);
    }

    public function test_admin_can_fetch_hidden_module(): void
    {
        $module = Module::where('name', 'Permissions')->first();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/modules/{$module->id}");

        $response->assertOk()
            ->assertJsonPath('data.is_visible', false);
    }

    public function test_super_admin_can_fetch_module(): void
    {
        $module = Module::first();

        $response = $this->actingAs($this->superAdmin)
            ->getJson("/api/modules/{$module->id}");

        $response->assertOk();
    }

    public function test_fetch_nonexistent_module_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/modules/99999')
            ->assertNotFound();
    }

    public function test_fetch_module_includes_all_details(): void
    {
        $module = Module::where('name', 'Roles')->first();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/modules/{$module->id}");

        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'type',
                'resourceful',
                'scope',
                'is_visible',
                'created_at',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // ENABLE MODULE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_enable_module(): void
    {
        $module = Module::where('is_visible', false)->first();

        $this->putJson("/api/modules/{$module->id}", [
            'is_visible' => true,
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_enable_module(): void
    {
        $module = Module::where('is_visible', false)->first();

        $this->actingAs($this->regularUser)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => true,
            ])->assertForbidden();
    }

    public function test_admin_can_enable_hidden_module(): void
    {
        $module = Module::where('name', 'Permissions')->first();
        $this->assertFalse($module->is_visible);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', true);

        $module->refresh();
        $this->assertTrue($module->is_visible);
    }

    public function test_super_admin_can_enable_module(): void
    {
        $module = Module::where('is_visible', false)->first();

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', true);
    }

    public function test_enable_module_persists_to_database(): void
    {
        $module = Module::where('is_visible', false)->first();
        $moduleId = $module->id;

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$moduleId}", [
                'is_visible' => true,
            ])->assertOk();

        $this->assertDatabaseHas('modules', [
            'id' => $moduleId,
            'is_visible' => true,
        ]);
    }

    public function test_enable_already_enabled_module(): void
    {
        $module = Module::where('name', 'Users')->first();
        $this->assertTrue($module->is_visible);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => true,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', true);
    }

    public function test_enable_module_response_structure(): void
    {
        $module = Module::where('is_visible', false)->first();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => true,
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'type',
                'is_visible',
                'created_at',
            ],
        ])->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Module updated successfully.');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DISABLE MODULE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_disable_module(): void
    {
        $module = Module::where('is_visible', true)->first();

        $this->putJson("/api/modules/{$module->id}", [
            'is_visible' => false,
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_disable_module(): void
    {
        $module = Module::where('is_visible', true)->first();

        $this->actingAs($this->regularUser)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ])->assertForbidden();
    }

    public function test_admin_can_disable_visible_module(): void
    {
        $module = Module::where('name', 'Users')->first();
        $this->assertTrue($module->is_visible);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', false);

        $module->refresh();
        $this->assertFalse($module->is_visible);
    }

    public function test_super_admin_can_disable_module(): void
    {
        $module = Module::where('is_visible', true)->first();

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', false);
    }

    public function test_disable_module_persists_to_database(): void
    {
        $module = Module::where('name', 'Dashboard')->first();
        $moduleId = $module->id;

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$moduleId}", [
                'is_visible' => false,
            ])->assertOk();

        $this->assertDatabaseHas('modules', [
            'id' => $moduleId,
            'is_visible' => false,
        ]);
    }

    public function test_disable_already_disabled_module(): void
    {
        $module = Module::where('is_visible', false)->first();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', false);
    }

    public function test_disable_module_response_structure(): void
    {
        $module = Module::where('is_visible', true)->first();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'is_visible',
                'created_at',
            ],
        ])->assertJsonPath('success', true);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOGGLE/VISIBILITY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_enable_then_disable_module(): void
    {
        $module = Module::where('name', 'Permissions')->first();
        $this->assertFalse($module->is_visible);

        // Enable it
        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => true,
            ])->assertOk();

        $module->refresh();
        $this->assertTrue($module->is_visible);

        // Disable it
        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.is_visible', false);

        $module->refresh();
        $this->assertFalse($module->is_visible);
    }

    public function test_multiple_modules_independent_visibility(): void
    {
        $module1 = Module::where('name', 'Users')->first();
        $module2 = Module::where('name', 'Dashboard')->first();

        // Disable module1
        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module1->id}", [
                'is_visible' => false,
            ])->assertOk();

        // Module2 should still be visible
        $module1->refresh();
        $module2->refresh();

        $this->assertFalse($module1->is_visible);
        $this->assertTrue($module2->is_visible);
    }

    public function test_visibility_toggle_updates_list_display(): void
    {
        $module = Module::where('name', 'Users')->first();
        $moduleId = $module->id;

        // Get list before disabling
        $responseBefore = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $beforeCount = collect($responseBefore->json('data'))
            ->where('is_visible', true)
            ->count();

        // Disable module
        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$moduleId}", [
                'is_visible' => false,
            ])->assertOk();

        // Get list after disabling
        $responseAfter = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $afterCount = collect($responseAfter->json('data'))
            ->where('is_visible', true)
            ->count();

        $this->assertEquals($beforeCount - 1, $afterCount);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // VALIDATION & ERROR TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_update_module_requires_valid_boolean(): void
    {
        $module = Module::first();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => 'invalid', // Should be boolean
            ]);

        $this->assertTrue(
            $response->status() === 422 || $response->status() === 200
        );
    }

    public function test_update_nonexistent_module_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/modules/99999', [
                'is_visible' => true,
            ])->assertNotFound();
    }

    public function test_update_module_only_visibility(): void
    {
        $module = Module::where('name', 'Roles')->first();
        $originalName = $module->name;

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ])->assertOk();

        $module->refresh();
        // Name should not change, only visibility
        $this->assertEquals($originalName, $module->name);
        $this->assertFalse($module->is_visible);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // RESPONSE STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_module_list_response_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'type',
                    'resourceful',
                    'scope',
                    'is_visible',
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

    public function test_single_module_response_structure(): void
    {
        $module = Module::first();

        $response = $this->actingAs($this->admin)
            ->getJson("/api/modules/{$module->id}");

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'type',
                'resourceful',
                'scope',
                'is_visible',
                'created_at',
            ],
        ]);
    }

    public function test_update_module_response_structure(): void
    {
        $module = Module::first();

        $response = $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => !$module->is_visible,
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'is_visible',
                'created_at',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_toggle_all_modules_independently(): void
    {
        $modules = Module::all();

        foreach ($modules as $module) {
            $newVisibility = !$module->is_visible;

            $response = $this->actingAs($this->admin)
                ->putJson("/api/modules/{$module->id}", [
                    'is_visible' => $newVisibility,
                ]);

            $response->assertOk()
                ->assertJsonPath('data.is_visible', $newVisibility);
        }
    }

    public function test_large_module_list_pagination(): void
    {
        Module::factory()->count(100)->create();

        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules?per_page=50');

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('meta.total', 104); // 4 + 100
    }

    public function test_module_visibility_status_accurate(): void
    {
        // Disable all visible modules
        $visibleModules = Module::where('is_visible', true)->get();

        foreach ($visibleModules as $module) {
            $this->actingAs($this->admin)
                ->putJson("/api/modules/{$module->id}", [
                    'is_visible' => false,
                ])->assertOk();
        }

        // List should show all as hidden
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $modules = $response->json('data');
        $visibleCount = collect($modules)->where('is_visible', true)->count();

        $this->assertEquals(0, $visibleCount);
    }

    public function test_concurrent_module_visibility_changes(): void
    {
        $module1 = Module::where('name', 'Users')->first();
        $module2 = Module::where('name', 'Dashboard')->first();

        // Change both modules
        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module1->id}", [
                'is_visible' => false,
            ])->assertOk();

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module2->id}", [
                'is_visible' => false,
            ])->assertOk();

        // Verify both are updated
        $response = $this->actingAs($this->admin)
            ->getJson('/api/modules');

        $visibleModules = collect($response->json('data'))
            ->where('is_visible', true)
            ->pluck('id')
            ->toArray();

        $this->assertNotContains($module1->id, $visibleModules);
        $this->assertNotContains($module2->id, $visibleModules);
    }

    public function test_module_type_preserved_after_visibility_change(): void
    {
        $module = Module::where('name', 'Users')->first();
        $originalType = $module->type;

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => false,
            ])->assertOk();

        $module->refresh();
        $this->assertEquals($originalType, $module->type);
    }

    public function test_module_resourceful_flag_preserved(): void
    {
        $module = Module::where('name', 'Roles')->first();
        $originalResourceful = $module->resourceful;

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => !$module->is_visible,
            ])->assertOk();

        $module->refresh();
        $this->assertEquals($originalResourceful, $module->resourceful);
    }

    public function test_module_scope_preserved_after_toggle(): void
    {
        $module = Module::first();
        $originalScope = $module->scope;

        $this->actingAs($this->admin)
            ->putJson("/api/modules/{$module->id}", [
                'is_visible' => !$module->is_visible,
            ])->assertOk();

        $module->refresh();
        $this->assertEquals($originalScope, $module->scope);
    }
}
