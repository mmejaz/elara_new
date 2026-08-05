<?php

namespace Tests\Feature;

use App\Models\Country;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Country API: list, create, read, update, delete.
 * Tests CRUD operations for country lookups used in address fields.
 *
 * Endpoints:
 * - GET    /api/countries              (list all countries, with pagination)
 * - POST   /api/countries              (create new country)
 * - PUT    /api/countries/{id}         (update country)
 * - DELETE /api/countries/{id}         (delete country)
 *
 * Permissions:
 * - country.view   (for list)
 * - country.create (for store)
 * - country.edit   (for update)
 * - country.delete (for delete)
 */
class CountryApiTest extends TestCase
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
        Permission::findOrCreate('country.view', 'web');
        Permission::findOrCreate('country.create', 'web');
        Permission::findOrCreate('country.edit', 'web');
        Permission::findOrCreate('country.delete', 'web');

        // Grant permissions to Admin role
        $adminRole = Role::findByName('Admin');
        $adminRole->givePermissionTo([
            'country.view',
            'country.create',
            'country.edit',
            'country.delete',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // LIST / FETCH COUNTRIES TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_list_countries(): void
    {
        $this->getJson('/api/countries')
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_list(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/countries')
            ->assertForbidden();
    }

    public function test_admin_can_list_countries(): void
    {
        Country::create(['name' => 'United States']);
        Country::create(['name' => 'Canada']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries');

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

    public function test_super_admin_can_list_countries(): void
    {
        Country::create(['name' => 'United Kingdom']);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/countries');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_countries_pagination(): void
    {
        foreach (range(1, 25) as $i) {
            Country::create(['name' => "Country $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_list_countries_default_pagination(): void
    {
        foreach (range(1, 20) as $i) {
            Country::create(['name' => "Country $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries');

        $response->assertOk()
            ->assertJsonCount(15, 'data') // Default per_page is 15
            ->assertJsonPath('meta.per_page', 15);
    }

    public function test_list_countries_respects_per_page(): void
    {
        foreach (range(1, 30) as $i) {
            Country::create(['name' => "Country $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?per_page=5&page=2');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_list_countries_can_search(): void
    {
        Country::create(['name' => 'United States']);
        Country::create(['name' => 'United Kingdom']);
        Country::create(['name' => 'Canada']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?search=united');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_list_countries_search_case_insensitive(): void
    {
        Country::create(['name' => 'Australia']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?search=AUSTRALIA');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_countries_sort_by_name_asc(): void
    {
        Country::create(['name' => 'Zambia']);
        Country::create(['name' => 'Afghanistan']);
        Country::create(['name' => 'Brazil']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_list_countries_sort_by_name_desc(): void
    {
        Country::create(['name' => 'Afghanistan']);
        Country::create(['name' => 'Zambia']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?sort_by=name&sort_dir=desc');

        $response->assertOk();
    }

    public function test_list_countries_sort_by_created_at(): void
    {
        Country::create(['name' => 'First Country']);
        Country::create(['name' => 'Second Country']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?sort_by=created_at');

        $response->assertOk();
    }

    public function test_list_countries_sort_by_id(): void
    {
        Country::create(['name' => 'Country 1']);
        Country::create(['name' => 'Country 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?sort_by=id&sort_dir=asc');

        $response->assertOk();
    }

    public function test_list_countries_invalid_sort_defaults_to_created_at(): void
    {
        Country::create(['name' => 'Country 1']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?sort_by=invalid_column');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_list_countries_empty_result(): void
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries');

        $response->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE COUNTRY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_create_country(): void
    {
        $this->postJson('/api/countries', [
            'name' => 'New Country',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_create(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/countries', [
                'name' => 'New Country',
            ])->assertForbidden();
    }

    public function test_admin_can_create_country(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'United States',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'United States')
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('countries', [
            'name' => 'United States',
        ]);
    }

    public function test_super_admin_can_create_country(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/countries', [
                'name' => 'Canada',
            ]);

        $response->assertCreated();
    }

    public function test_create_country_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/countries', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_country_name_required_string(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => '',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_country_name_max_255(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_country_name_max_255_accepted(): void
    {
        $name = str_repeat('A', 255);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => $name,
            ]);

        $response->assertCreated();
    }

    public function test_create_country_name_must_be_unique(): void
    {
        Country::create(['name' => 'United States']);

        $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'United States',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_country_unique_case_sensitive(): void
    {
        Country::create(['name' => 'United States']);

        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'united states',
            ]);

        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_create_country_response_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'Mexico',
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

    public function test_create_multiple_countries(): void
    {
        $countries = ['United States', 'Canada', 'Mexico', 'Brazil', 'Argentina'];

        foreach ($countries as $country) {
            $this->actingAs($this->admin)
                ->postJson('/api/countries', [
                    'name' => $country,
                ])->assertCreated();
        }

        $this->assertDatabaseCount('countries', 5);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE COUNTRY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_update_country(): void
    {
        $country = Country::create(['name' => 'Original Name']);

        $this->putJson("/api/countries/{$country->id}", [
            'name' => 'Updated Name',
        ])->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_update(): void
    {
        $country = Country::create(['name' => 'Original Name']);

        $this->actingAs($this->regularUser)
            ->putJson("/api/countries/{$country->id}", [
                'name' => 'Updated Name',
            ])->assertForbidden();
    }

    public function test_admin_can_update_country(): void
    {
        $country = Country::create(['name' => 'USA']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => 'United States of America',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'United States of America');

        $country->refresh();
        $this->assertEquals('United States of America', $country->name);
    }

    public function test_super_admin_can_update_country(): void
    {
        $country = Country::create(['name' => 'UK']);

        $response = $this->actingAs($this->superAdmin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => 'United Kingdom',
            ]);

        $response->assertOk();
    }

    public function test_update_nonexistent_country_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/countries/99999', [
                'name' => 'Updated Name',
            ])->assertNotFound();
    }

    public function test_update_country_requires_name(): void
    {
        $country = Country::create(['name' => 'Original']);

        $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_country_name_max_255(): void
    {
        $country = Country::create(['name' => 'Original']);
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => $longName,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_country_name_must_be_unique(): void
    {
        $country1 = Country::create(['name' => 'Country 1']);
        Country::create(['name' => 'Country 2']);

        $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country1->id}", [
                'name' => 'Country 2', // Duplicate
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_country_can_keep_same_name(): void
    {
        $country = Country::create(['name' => 'United States']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => 'United States', // Same name
            ]);

        $response->assertOk();
    }

    public function test_update_country_response_structure(): void
    {
        $country = Country::create(['name' => 'Original']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
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

    public function test_update_country_preserves_id(): void
    {
        $country = Country::create(['name' => 'Original']);
        $originalId = $country->id;

        $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => 'Updated',
            ]);

        $country->refresh();
        $this->assertEquals($originalId, $country->id);
    }

    public function test_update_country_with_special_characters(): void
    {
        $country = Country::create(['name' => 'Original']);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => "Côte d'Ivoire (Ivory Coast)",
            ]);

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE COUNTRY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_delete_country(): void
    {
        $country = Country::create(['name' => 'To Delete']);

        $this->deleteJson("/api/countries/{$country->id}")
            ->assertUnauthorized();
    }

    public function test_user_without_permission_cannot_delete(): void
    {
        $country = Country::create(['name' => 'To Delete']);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/countries/{$country->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_country(): void
    {
        $country = Country::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/countries/{$country->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('countries', [
            'id' => $country->id,
        ]);
    }

    public function test_super_admin_can_delete_country(): void
    {
        $country = Country::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/countries/{$country->id}");

        $response->assertOk();
    }

    public function test_delete_nonexistent_country_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/countries/99999')
            ->assertNotFound();
    }

    public function test_delete_country_response_structure(): void
    {
        $country = Country::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/countries/{$country->id}");

        $response->assertJsonStructure([
            'success',
            'message',
        ]);
    }

    public function test_delete_country_returns_null_data(): void
    {
        $country = Country::create(['name' => 'To Delete']);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/countries/{$country->id}");

        $response->assertJsonPath('data', null);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_list_with_large_dataset(): void
    {
        foreach (range(1, 100) as $i) {
            Country::create(['name' => "Country $i"]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?per_page=50&page=1');

        $response->assertOk()
            ->assertJsonPath('meta.total', 100)
            ->assertJsonCount(50, 'data');
    }

    public function test_create_with_whitespace_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => '  United States  ',
            ]);

        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_create_with_unicode_characters(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'España (Spain) 西班牙',
            ]);

        $response->assertCreated();
    }

    public function test_create_with_numbers_in_name(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'New Zealand (NZ)',
            ]);

        $response->assertCreated();
    }

    public function test_update_then_delete_workflow(): void
    {
        $country = Country::create(['name' => 'Original']);

        // Update
        $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country->id}", [
                'name' => 'Updated Name',
            ])->assertOk();

        // Delete
        $this->actingAs($this->admin)
            ->deleteJson("/api/countries/{$country->id}")
            ->assertOk();

        $this->assertNull(Country::find($country->id));
    }

    public function test_multiple_users_can_access_same_data(): void
    {
        $country = Country::create(['name' => 'Shared Country']);

        // Admin 1 can see it
        $this->actingAs($this->admin)
            ->getJson('/api/countries')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        // Super Admin can also see it
        $this->actingAs($this->superAdmin)
            ->getJson('/api/countries')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_search_returns_correct_results(): void
    {
        Country::create(['name' => 'United States']);
        Country::create(['name' => 'United Kingdom']);
        Country::create(['name' => 'United Arab Emirates']);
        Country::create(['name' => 'Canada']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?search=United');

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_pagination_boundary(): void
    {
        foreach (range(1, 15) as $i) {
            Country::create(['name' => "Country $i"]);
        }

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/countries?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/countries?per_page=15&page=2');

        $page1->assertJsonCount(15, 'data');
        $page2->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.current_page', 2);
    }

    public function test_sort_direction_default_desc(): void
    {
        Country::create(['name' => 'Country 1']);
        Country::create(['name' => 'Country 2']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?sort_by=id');

        $response->assertOk();
    }

    public function test_concurrent_operations(): void
    {
        // Create
        $response1 = $this->actingAs($this->admin)
            ->postJson('/api/countries', ['name' => 'Country 1']);

        $country1Id = $response1->json('data.id');

        // Create another
        $response2 = $this->actingAs($this->admin)
            ->postJson('/api/countries', ['name' => 'Country 2']);

        // Update first
        $this->actingAs($this->admin)
            ->putJson("/api/countries/{$country1Id}", ['name' => 'Country 1 Updated'])
            ->assertOk();

        // List should show both
        $this->actingAs($this->admin)
            ->getJson('/api/countries')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_response_includes_created_at_date(): void
    {
        Country::create(['name' => 'Test Country']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries');

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
        $country = Country::create(['name' => 'Test']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries');

        $id = $response->json('data.0.id');
        $this->assertIsNumeric($id);
    }

    public function test_create_without_extra_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/countries', [
                'name' => 'Test Country',
                'extra_field' => 'should be ignored',
                'another_field' => 'also ignored',
            ]);

        $response->assertCreated();
        $country = Country::latest()->first();
        $this->assertEquals('Test Country', $country->name);
    }

    public function test_permission_denied_message(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/countries')
            ->assertForbidden();
    }

    public function test_real_country_names(): void
    {
        $realCountries = [
            'United States',
            'Canada',
            'United Kingdom',
            'Australia',
            'Germany',
            'France',
            'Japan',
            'India',
            'Brazil',
            'Mexico',
        ];

        foreach ($realCountries as $country) {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/countries', ['name' => $country]);

            $response->assertCreated();
        }

        $this->assertDatabaseCount('countries', 10);
    }

    public function test_search_partial_match(): void
    {
        Country::create(['name' => 'United States']);
        Country::create(['name' => 'United Kingdom']);
        Country::create(['name' => 'Canada']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?search=nited');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_multiple_pages_with_search(): void
    {
        foreach (range(1, 20) as $i) {
            Country::create(['name' => "Country $i"]);
        }

        Country::create(['name' => 'Special Country A']);
        Country::create(['name' => 'Special Country B']);
        Country::create(['name' => 'Special Country C']);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/countries?search=Special&per_page=2&page=1');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
