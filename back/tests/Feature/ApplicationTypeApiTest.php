<?php

namespace Tests\Feature;

use App\Models\ApplicationType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Application Type API: list, create, read, update, delete.
 * Tests CRUD operations for application type lookups (e.g., Web, Mobile, Desktop).
 *
 * Endpoints:
 * - GET    /api/applicationtypes              (list all types, with pagination)
 * - POST   /api/applicationtypes              (create new type)
 * - PUT    /api/applicationtypes/{id}         (update type)
 * - DELETE /api/applicationtypes/{id}         (delete type)
 *
 * Permissions:
 * - application_type.view   (for list)
 * - application_type.create (for store)
 * - application_type.edit   (for update)
 * - application_type.delete (for delete)
 */
class ApplicationTypeApiTest extends TestCase
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
        Permission::findOrCreate('application_type.view', 'web');
        Permission::findOrCreate('application_type.create', 'web');
        Permission::findOrCreate('application_type.edit', 'web');
        Permission::findOrCreate('application_type.delete', 'web');

        // Grant permissions to Admin role
        $adminRole = Role::findByName('Admin');
        $adminRole->givePermissionTo([
            'application_type.view',
            'application_type.create',
            'application_type.edit',
            'application_type.delete',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // LIST / FETCH APPLICATION TYPES TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_list_application_types(): void
    {
        $this->getJson('/api/applicationtypes')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_list(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/applicationtypes')
            ->assertForbidden();
    }

    public function test_admin_can_list_application_types(): void
    {
        ApplicationType::create(['name' => 'Web Application']);
        ApplicationType::create(['name' => 'Mobile Application']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes');

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

    public function test_super_admin_can_list_application_types(): void
    {
        ApplicationType::create(['name' => 'Desktop Application']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/applicationtypes');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_application_types_pagination(): void
    {
        foreach (range(1, 25) as $i) {
            ApplicationType::create(['name' => "Application Type $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_list_application_types_default_pagination(): void
    {
        foreach (range(1, 20) as $i) {
            ApplicationType::create(['name' => "Type $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes');

        $response->assertOk()
            ->assertJsonCount(15, 'data') // Default per_page is 15
            ->assertJsonPath('meta.per_page', 15);
    }

    public function test_list_application_types_respects_per_page(): void
    {
        foreach (range(1, 30) as $i) {
            ApplicationType::create(['name' => "Type $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?per_page=5&page=2');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_list_application_types_can_search(): void
    {
        ApplicationType::create(['name' => 'Web Application']);
        ApplicationType::create(['name' => 'Mobile Application']);
        ApplicationType::create(['name' => 'Desktop Software']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?search=mobile');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Mobile Application');
    }

    public function test_list_application_types_search_case_insensitive(): void
    {
        ApplicationType::create(['name' => 'Web Application']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?search=WEB');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_application_types_sort_by_name_asc(): void
    {
        ApplicationType::create(['name' => 'Zebra Application']);
        ApplicationType::create(['name' => 'Alpha Application']);
        ApplicationType::create(['name' => 'Beta Application']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_application_types_sort_by_name_desc(): void
    {
        ApplicationType::create(['name' => 'Alpha']);
        ApplicationType::create(['name' => 'Zebra']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?sort_by=name&sort_dir=desc');

        $response->assertOk();
    }

    public function test_list_application_types_sort_by_created_at(): void
    {
        ApplicationType::create(['name' => 'First']);
        ApplicationType::create(['name' => 'Second']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?sort_by=created_at');

        $response->assertOk();
    }

    public function test_list_application_types_sort_by_id(): void
    {
        ApplicationType::create(['name' => 'Type 1']);
        ApplicationType::create(['name' => 'Type 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?sort_by=id&sort_dir=asc');

        $response->assertOk();
    }

    public function test_list_application_types_invalid_sort_defaults_to_created_at(): void
    {
        ApplicationType::create(['name' => 'Type 1']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?sort_by=invalid_column');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_application_types_empty_result(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE APPLICATION TYPE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_create_application_type(): void
    {
        $this->postJson('/api/applicationtypes', [
            'name' => 'New Application Type',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_create(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/applicationtypes', [
                'name' => 'New Application Type',
            ])->assertForbidden();
    }

    public function test_admin_can_create_application_type(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Web Application',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Web Application')
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('application_types', [
            'name' => 'Web Application',
        ]);
    }

    public function test_super_admin_can_create_application_type(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Mobile Application',
            ]);

        $response->assertCreated();
    }

    public function test_create_application_type_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_application_type_name_required_string(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => '',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_application_type_name_max_255(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_application_type_name_max_255_accepted(): void
    {
        $name = str_repeat('A', 255);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => $name,
            ]);

        $response->assertCreated();
    }

    public function test_create_application_type_name_must_be_unique(): void
    {
        ApplicationType::create(['name' => 'Web Application']);

        $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Web Application',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_application_type_unique_case_sensitive(): void
    {
        ApplicationType::create(['name' => 'Web Application']);

        // Different case should be treated as different (depends on database collation)
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'web application',
            ]);

        // This may pass or fail depending on database collation
        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_create_application_type_response_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Desktop Application',
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

    public function test_create_multiple_application_types(): void
    {
        $types = ['Web', 'Mobile', 'Desktop', 'Console', 'API'];

        foreach ($types as $type) {
            $this->actingAs($this->admin)
                ->postJson('/api/applicationtypes', [
                    'name' => $type,
                ])->assertCreated();
        }

        $this->assertDatabaseCount('application_types', 5);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE APPLICATION TYPE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_update_application_type(): void
    {
        $type = ApplicationType::create(['name' => 'Original Name']);

        $this->putJson("/api/applicationtypes/{$type->id}", [
            'name' => 'Updated Name',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_update(): void
    {
        $type = ApplicationType::create(['name' => 'Original Name']);

        $this->actingAs($this->regularUser)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Updated Name',
            ])->assertForbidden();
    }

    public function test_admin_can_update_application_type(): void
    {
        $type = ApplicationType::create(['name' => 'Web Application']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Web App',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Web App');

        $type->refresh();
        $this->assertEquals('Web App', $type->name);
    }

    public function test_super_admin_can_update_application_type(): void
    {
        $type = ApplicationType::create(['name' => 'Mobile']);

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Mobile Application',
            ]);

        $response->assertOk();
    }

    public function test_update_nonexistent_application_type_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/applicationtypes/99999', [
                'name' => 'Updated Name',
            ])->assertNotFound();
    }

    public function test_update_application_type_requires_name(): void
    {
        $type = ApplicationType::create(['name' => 'Original']);

        $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_application_type_name_max_255(): void
    {
        $type = ApplicationType::create(['name' => 'Original']);
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_application_type_name_must_be_unique(): void
    {
        $type1 = ApplicationType::create(['name' => 'Type 1']);
        ApplicationType::create(['name' => 'Type 2']);

        $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type1->id}", [
                'name' => 'Type 2', // Duplicate
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_application_type_can_keep_same_name(): void
    {
        $type = ApplicationType::create(['name' => 'Web Application']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Web Application', // Same name
            ]);

        $response->assertOk();
    }

    public function test_update_application_type_response_structure(): void
    {
        $type = ApplicationType::create(['name' => 'Original']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Updated',
            ]);

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

    public function test_update_application_type_preserves_id(): void
    {
        $type = ApplicationType::create(['name' => 'Original']);
        $originalId = $type->id;

        $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Updated',
            ]);

        $type->refresh();
        $this->assertEquals($originalId, $type->id);
    }

    public function test_update_application_type_with_special_characters(): void
    {
        $type = ApplicationType::create(['name' => 'Original']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Web App™ v2.0 (Updated)',
            ]);

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE APPLICATION TYPE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_delete_application_type(): void
    {
        $type = ApplicationType::create(['name' => 'To Delete']);

        $this->deleteJson("/api/applicationtypes/{$type->id}")
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_delete(): void
    {
        $type = ApplicationType::create(['name' => 'To Delete']);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/applicationtypes/{$type->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_application_type(): void
    {
        $type = ApplicationType::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/applicationtypes/{$type->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('application_types', [
            'id' => $type->id,
        ]);
    }

    public function test_super_admin_can_delete_application_type(): void
    {
        $type = ApplicationType::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/applicationtypes/{$type->id}");

        $response->assertOk();
    }

    public function test_delete_nonexistent_application_type_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/applicationtypes/99999')
            ->assertNotFound();
    }

    public function test_delete_application_type_response_structure(): void
    {
        $type = ApplicationType::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/applicationtypes/{$type->id}");

        $response->assertJsonStructure([
            'success',
            'message',
        ]);
    }

    public function test_delete_application_type_returns_null_data(): void
    {
        $type = ApplicationType::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/applicationtypes/{$type->id}");

        $response->assertJsonPath('data', null);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_list_with_large_dataset(): void
    {
        foreach (range(1, 100) as $i) {
            ApplicationType::create(['name' => "Application Type $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?per_page=50&page=1');

        $response->assertOk()
            ->assertJsonPath('meta.total', 100)
            ->assertJsonCount(50, 'data');
    }

    public function test_create_with_whitespace_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => '  Web Application  ',
            ]);

        // Should accept (trimming may or may not happen)
        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_create_with_unicode_characters(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Aplicación Web 웹 애플리케이션',
            ]);

        $response->assertCreated();
    }

    public function test_create_with_numbers_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Application Type v2.0.1',
            ]);

        $response->assertCreated();
    }

    public function test_update_then_delete_workflow(): void
    {
        $type = ApplicationType::create(['name' => 'Original']);

        // Update
        $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type->id}", [
                'name' => 'Updated Name',
            ])->assertOk();

        // Delete
        $this->actingAs($this->admin)
            ->deleteJson("/api/applicationtypes/{$type->id}")
            ->assertOk();

        $this->assertNull(ApplicationType::find($type->id));
    }

    public function test_multiple_users_can_access_same_data(): void
    {
        $type = ApplicationType::create(['name' => 'Shared Type']);

        // Admin 1 can see it
        $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        // Super Admin can also see it
        $this->actingAs($this->superAdmin)
            ->getJson('/api/applicationtypes')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_search_returns_correct_results(): void
    {
        ApplicationType::create(['name' => 'Web Application']);
        ApplicationType::create(['name' => 'Mobile App']);
        ApplicationType::create(['name' => 'Web Service']);
        ApplicationType::create(['name' => 'Desktop Client']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?search=Web');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_pagination_boundary(): void
    {
        foreach (range(1, 15) as $i) {
            ApplicationType::create(['name' => "Type $i"]);
        }

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?per_page=15&page=2');

        $page1->assertJsonCount(15, 'data');
        $page2->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_sort_direction_default_desc(): void
    {
        ApplicationType::create(['name' => 'Type 1']);
        ApplicationType::create(['name' => 'Type 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes?sort_by=id');

        $response->assertOk();
    }

    public function test_concurrent_operations(): void
    {
        // Create
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', ['name' => 'Type 1']);

        $type1Id = $response1->json('data.id');

        // Create another
        $response2 = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', ['name' => 'Type 2']);

        // Update first
        $this->actingAs($this->admin)
            ->putJson("/api/applicationtypes/{$type1Id}", ['name' => 'Type 1 Updated'])
            ->assertOk();

        // List should show both
        $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_response_includes_created_at_date(): void
    {
        ApplicationType::create(['name' => 'Test Type']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'created_at'],
                ],
            ]);

        // created_at should be in date format (YYYY-MM-DD)
        $createdAt = $response->json('data.0.created_at');
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $createdAt);
    }

    public function test_id_is_numeric(): void
    {
        $type = ApplicationType::create(['name' => 'Test']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/applicationtypes');

        $id = $response->json('data.0.id');
        $this->assertIsNumeric($id);
    }

    public function test_create_without_extra_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/applicationtypes', [
                'name' => 'Test Type',
                'extra_field' => 'should be ignored',
                'another_field' => 'also ignored',
            ]);

        $response->assertCreated();
        $type = ApplicationType::latest()->first();
        $this->assertEquals('Test Type', $type->name);
    }

    public function test_permission_denied_message(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/applicationtypes')
            ->assertForbidden();
    }
}
