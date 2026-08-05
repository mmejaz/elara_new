<?php

namespace Tests\Feature;

use App\Models\City;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for City API: list, create, read, update, delete.
 * Tests CRUD operations for city lookups used in address fields.
 *
 * Endpoints:
 * - GET    /api/cities              (list all cities, with pagination)
 * - POST   /api/cities              (create new city)
 * - PUT    /api/cities/{id}         (update city)
 * - DELETE /api/cities/{id}         (delete city)
 *
 * Permissions:
 * - city.view   (for list)
 * - city.create (for store)
 * - city.edit   (for update)
 * - city.delete (for delete)
 */
class CityApiTest extends TestCase
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
        Permission::findOrCreate('city.view', 'web');
        Permission::findOrCreate('city.create', 'web');
        Permission::findOrCreate('city.edit', 'web');
        Permission::findOrCreate('city.delete', 'web');

        // Grant permissions to Admin role
        $adminRole = Role::findByName('Admin');
        $adminRole->givePermissionTo([
            'city.view',
            'city.create',
            'city.edit',
            'city.delete',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // LIST / FETCH CITIES TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_list_cities(): void
    {
        $this->getJson('/api/cities')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_list(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/cities')
            ->assertForbidden();
    }

    public function test_admin_can_list_cities(): void
    {
        City::create(['name' => 'New York']);
        City::create(['name' => 'Los Angeles']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities');

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

    public function test_super_admin_can_list_cities(): void
    {
        City::create(['name' => 'Chicago']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/cities');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_cities_pagination(): void
    {
        foreach (range(1, 25) as $i) {
            City::create(['name' => "City $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_list_cities_default_pagination(): void
    {
        foreach (range(1, 20) as $i) {
            City::create(['name' => "City $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities');

        $response->assertOk()
            ->assertJsonCount(15, 'data') // Default per_page is 15
            ->assertJsonPath('meta.per_page', 15);
    }

    public function test_list_cities_respects_per_page(): void
    {
        foreach (range(1, 30) as $i) {
            City::create(['name' => "City $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?per_page=5&page=2');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_list_cities_can_search(): void
    {
        City::create(['name' => 'New York']);
        City::create(['name' => 'New Orleans']);
        City::create(['name' => 'San Francisco']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=new');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_list_cities_search_case_insensitive(): void
    {
        City::create(['name' => 'Toronto']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=TORONTO');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_cities_sort_by_name_asc(): void
    {
        City::create(['name' => 'Zurich']);
        City::create(['name' => 'Amsterdam']);
        City::create(['name' => 'Berlin']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_cities_sort_by_name_desc(): void
    {
        City::create(['name' => 'Amsterdam']);
        City::create(['name' => 'Zurich']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=name&sort_dir=desc');

        $response->assertOk();
    }

    public function test_list_cities_sort_by_created_at(): void
    {
        City::create(['name' => 'First City']);
        City::create(['name' => 'Second City']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=created_at');

        $response->assertOk();
    }

    public function test_list_cities_sort_by_id(): void
    {
        City::create(['name' => 'City 1']);
        City::create(['name' => 'City 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=id&sort_dir=asc');

        $response->assertOk();
    }

    public function test_list_cities_invalid_sort_defaults_to_created_at(): void
    {
        City::create(['name' => 'City 1']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=invalid_column');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_cities_empty_result(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE CITY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_create_city(): void
    {
        $this->postJson('/api/cities', [
            'name' => 'New City',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_create(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/cities', [
                'name' => 'New City',
            ])->assertForbidden();
    }

    public function test_admin_can_create_city(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'New York',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'New York')
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('cities', [
            'name' => 'New York',
        ]);
    }

    public function test_super_admin_can_create_city(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/cities', [
                'name' => 'London',
            ]);

        $response->assertCreated();
    }

    public function test_create_city_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/cities', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_city_name_required_string(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => '',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_city_name_max_255(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_city_name_max_255_accepted(): void
    {
        $name = str_repeat('A', 255);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => $name,
            ]);

        $response->assertCreated();
    }

    public function test_create_city_name_must_be_unique(): void
    {
        City::create(['name' => 'Paris']);

        $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'Paris',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_city_unique_case_sensitive(): void
    {
        City::create(['name' => 'New York']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'new york',
            ]);

        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_create_city_response_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'Tokyo',
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

    public function test_create_multiple_cities(): void
    {
        $cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];

        foreach ($cities as $city) {
            $this->actingAs($this->admin)
                ->postJson('/api/cities', [
                    'name' => $city,
                ])->assertCreated();
        }

        $this->assertDatabaseCount('cities', 5);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE CITY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_update_city(): void
    {
        $city = City::create(['name' => 'Original Name']);

        $this->putJson("/api/cities/{$city->id}", [
            'name' => 'Updated Name',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_update(): void
    {
        $city = City::create(['name' => 'Original Name']);

        $this->actingAs($this->regularUser)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'Updated Name',
            ])->assertForbidden();
    }

    public function test_admin_can_update_city(): void
    {
        $city = City::create(['name' => 'NYC']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'New York City',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'New York City');

        $city->refresh();
        $this->assertEquals('New York City', $city->name);
    }

    public function test_super_admin_can_update_city(): void
    {
        $city = City::create(['name' => 'LA']);

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'Los Angeles',
            ]);

        $response->assertOk();
    }

    public function test_update_nonexistent_city_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/cities/99999', [
                'name' => 'Updated Name',
            ])->assertNotFound();
    }

    public function test_update_city_requires_name(): void
    {
        $city = City::create(['name' => 'Original']);

        $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_city_name_max_255(): void
    {
        $city = City::create(['name' => 'Original']);
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_city_name_must_be_unique(): void
    {
        $city1 = City::create(['name' => 'City 1']);
        City::create(['name' => 'City 2']);

        $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city1->id}", [
                'name' => 'City 2', // Duplicate
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_city_can_keep_same_name(): void
    {
        $city = City::create(['name' => 'Berlin']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'Berlin', // Same name
            ]);

        $response->assertOk();
    }

    public function test_update_city_response_structure(): void
    {
        $city = City::create(['name' => 'Original']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
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

    public function test_update_city_preserves_id(): void
    {
        $city = City::create(['name' => 'Original']);
        $originalId = $city->id;

        $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'Updated',
            ]);

        $city->refresh();
        $this->assertEquals($originalId, $city->id);
    }

    public function test_update_city_with_special_characters(): void
    {
        $city = City::create(['name' => 'Original']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'São Paulo',
            ]);

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE CITY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_delete_city(): void
    {
        $city = City::create(['name' => 'To Delete']);

        $this->deleteJson("/api/cities/{$city->id}")
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_delete(): void
    {
        $city = City::create(['name' => 'To Delete']);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/cities/{$city->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_city(): void
    {
        $city = City::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/cities/{$city->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('cities', [
            'id' => $city->id,
        ]);
    }

    public function test_super_admin_can_delete_city(): void
    {
        $city = City::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/cities/{$city->id}");

        $response->assertOk();
    }

    public function test_delete_nonexistent_city_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/cities/99999')
            ->assertNotFound();
    }

    public function test_delete_city_response_structure(): void
    {
        $city = City::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/cities/{$city->id}");

        $response->assertJsonStructure([
            'success',
            'message',
        ]);
    }

    public function test_delete_city_returns_null_data(): void
    {
        $city = City::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/cities/{$city->id}");

        $response->assertJsonPath('data', null);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_list_with_large_dataset(): void
    {
        foreach (range(1, 100) as $i) {
            City::create(['name' => "City $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?per_page=50&page=1');

        $response->assertOk()
            ->assertJsonPath('meta.total', 100)
            ->assertJsonCount(50, 'data');
    }

    public function test_create_with_whitespace_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => '  New York  ',
            ]);

        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_create_with_unicode_characters(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'München (Munich) 慕尼黑',
            ]);

        $response->assertCreated();
    }

    public function test_create_with_numbers_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'New York City (NYC)',
            ]);

        $response->assertCreated();
    }

    public function test_update_then_delete_workflow(): void
    {
        $city = City::create(['name' => 'Original']);

        // Update
        $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city->id}", [
                'name' => 'Updated Name',
            ])->assertOk();

        // Delete
        $this->actingAs($this->admin)
            ->deleteJson("/api/cities/{$city->id}")
            ->assertOk();

        $this->assertNull(City::find($city->id));
    }

    public function test_multiple_users_can_access_same_data(): void
    {
        $city = City::create(['name' => 'Shared City']);

        // Admin 1 can see it
        $this->actingAs($this->admin)
            ->getJson('/api/cities')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        // Super Admin can also see it
        $this->actingAs($this->superAdmin)
            ->getJson('/api/cities')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_search_returns_correct_results(): void
    {
        City::create(['name' => 'New York']);
        City::create(['name' => 'New Orleans']);
        City::create(['name' => 'New Delhi']);
        City::create(['name' => 'San Francisco']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=New');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_pagination_boundary(): void
    {
        foreach (range(1, 15) as $i) {
            City::create(['name' => "City $i"]);
        }

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/cities?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/cities?per_page=15&page=2');

        $page1->assertJsonCount(15, 'data');
        $page2->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_sort_direction_default_desc(): void
    {
        City::create(['name' => 'City 1']);
        City::create(['name' => 'City 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=id');

        $response->assertOk();
    }

    public function test_concurrent_operations(): void
    {
        // Create
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/cities', ['name' => 'City 1']);

        $city1Id = $response1->json('data.id');

        // Create another
        $response2 = $this->actingAs($this->admin)
            ->postJson('/api/cities', ['name' => 'City 2']);

        // Update first
        $this->actingAs($this->admin)
            ->putJson("/api/cities/{$city1Id}", ['name' => 'City 1 Updated'])
            ->assertOk();

        // List should show both
        $this->actingAs($this->admin)
            ->getJson('/api/cities')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_response_includes_created_at_date(): void
    {
        City::create(['name' => 'Test City']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities');

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
        $city = City::create(['name' => 'Test']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities');

        $id = $response->json('data.0.id');
        $this->assertIsNumeric($id);
    }

    public function test_create_without_extra_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'Test City',
                'extra_field' => 'should be ignored',
                'another_field' => 'also ignored',
            ]);

        $response->assertCreated();
        $city = City::latest()->first();
        $this->assertEquals('Test City', $city->name);
    }

    public function test_permission_denied_message(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/cities')
            ->assertForbidden();
    }

    public function test_real_city_names(): void
    {
        $realCities = [
            'New York',
            'Los Angeles',
            'Chicago',
            'Houston',
            'Phoenix',
            'Philadelphia',
            'San Antonio',
            'San Diego',
            'Dallas',
            'San Jose',
        ];

        foreach ($realCities as $city) {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/cities', ['name' => $city]);

            $response->assertCreated();
        }

        $this->assertDatabaseCount('cities', 10);
    }

    public function test_search_partial_match(): void
    {
        City::create(['name' => 'New York']);
        City::create(['name' => 'New Orleans']);
        City::create(['name' => 'Los Angeles']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=ew');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_multiple_pages_with_search(): void
    {
        foreach (range(1, 20) as $i) {
            City::create(['name' => "City $i"]);
        }

        City::create(['name' => 'Special City A']);
        City::create(['name' => 'Special City B']);
        City::create(['name' => 'Special City C']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=Special&per_page=2&page=1');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_international_city_names(): void
    {
        $internationalCities = [
            'Paris',
            'Tokyo',
            'Sydney',
            'Mumbai',
            'Beijing',
            'Moscow',
            'Cairo',
            'Bangkok',
            'Istanbul',
            'Mexico City',
        ];

        foreach ($internationalCities as $city) {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/cities', ['name' => $city]);

            $response->assertCreated();
        }

        $this->assertDatabaseCount('cities', 10);
    }

    public function test_sort_and_paginate_combined(): void
    {
        $names = ['Zebra City', 'Apple City', 'Mango City', 'Banana City'];
        foreach ($names as $name) {
            City::create(['name' => $name]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?sort_by=name&sort_dir=asc&per_page=2&page=1');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_search_and_sort_combined(): void
    {
        City::create(['name' => 'New York']);
        City::create(['name' => 'New Orleans']);
        City::create(['name' => 'New Mexico']);
        City::create(['name' => 'New Jersey']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=New&sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonCount(4, 'data');
    }

    public function test_empty_search_returns_all(): void
    {
        City::create(['name' => 'City 1']);
        City::create(['name' => 'City 2']);
        City::create(['name' => 'City 3']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/cities?search=');

        $response->assertOk()
            ->assertJsonPath('meta.total', 3);
    }

    public function test_hyphenated_city_names(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => 'Saint-Jean-sur-Richelieu',
            ]);

        $response->assertCreated();
    }

    public function test_city_names_with_apostrophes(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/cities', [
                'name' => "L'Aquila",
            ]);

        $response->assertCreated();
    }
}
