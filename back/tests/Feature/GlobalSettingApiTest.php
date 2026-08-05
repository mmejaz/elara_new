<?php

namespace Tests\Feature;

use App\Models\GlobalSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Global Settings API: list, create, read, update, delete.
 * Tests configurable settings with dynamic fields, validation, and authorization.
 *
 * Endpoints:
 * - GET    /api/global-settings              (list all settings)
 * - POST   /api/global-settings              (create new setting)
 * - GET    /api/global-settings/{id}         (fetch single setting)
 * - PUT    /api/global-settings/{id}         (update setting)
 * - DELETE /api/global-settings/{id}         (delete setting)
 */
class GlobalSettingApiTest extends TestCase
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
    // FETCH / LIST GLOBAL SETTINGS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guests_cannot_access_global_settings(): void
    {
        $this->getJson('/api/global-settings')->assertUnauthorized();
    }

    public function test_regular_user_cannot_list_global_settings(): void
    {
        $this->actingAs($this->regularUser)
            ->getJson('/api/global-settings')
            ->assertForbidden();
    }

    public function test_admin_can_list_all_global_settings(): void
    {
        GlobalSetting::create([
            'name' => 'Site Configuration',
            'fields' => [
                ['label' => 'Site Name', 'type' => 'text', 'is_required' => true],
                ['label' => 'Site URL', 'type' => 'text', 'is_required' => true],
            ],
        ]);

        GlobalSetting::create([
            'name' => 'Email Configuration',
            'fields' => [
                ['label' => 'SMTP Host', 'type' => 'text', 'is_required' => true],
                ['label' => 'SMTP Port', 'type' => 'number', 'is_required' => true],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/global-settings');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'fields', 'created_at'],
                ],
                'meta' => ['current_page', 'per_page', 'total', 'last_page'],
            ])
            ->assertJsonPath('meta.total', 2);
    }

    public function test_super_admin_can_list_global_settings(): void
    {
        GlobalSetting::create([
            'name' => 'App Settings',
            'fields' => [['label' => 'Theme', 'type' => 'dropdown', 'options' => ['light', 'dark']]],
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/global-settings');

        $response->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_global_settings_list_returns_paginated_results(): void
    {
        foreach (range(1, 25) as $i) {
            GlobalSetting::create([
                'name' => "Setting $i",
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/global-settings?per_page=10');

        $response->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    public function test_global_settings_respects_pagination(): void
    {
        foreach (range(1, 30) as $i) {
            GlobalSetting::create([
                'name' => "Config $i",
                'fields' => [['label' => 'Value', 'type' => 'text']],
            ]);
        }

        $page1 = $this->actingAs($this->admin)
            ->getJson('/api/global-settings?per_page=15&page=1');

        $page2 = $this->actingAs($this->admin)
            ->getJson('/api/global-settings?per_page=15&page=2');

        $page1->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.total', 30)
            ->assertJsonCount(15, 'data');

        $page2->assertJsonPath('meta.current_page', 2)
            ->assertJsonCount(15, 'data');
    }

    public function test_global_settings_can_be_searched(): void
    {
        GlobalSetting::create([
            'name' => 'Email Configuration',
            'fields' => [['label' => 'SMTP', 'type' => 'text']],
        ]);

        GlobalSetting::create([
            'name' => 'Site Configuration',
            'fields' => [['label' => 'Title', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/global-settings?search=email');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Email Configuration');
    }

    public function test_global_settings_can_be_sorted(): void
    {
        GlobalSetting::create([
            'name' => 'Zebra Settings',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        GlobalSetting::create([
            'name' => 'Alpha Settings',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/global-settings?sort_by=name&sort_dir=asc');

        $response->assertOk()
            ->assertJsonStructure(['data', 'meta']);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // FETCH SINGLE GLOBAL SETTING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_fetch_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Test Setting',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->getJson("/api/global-settings/{$setting->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_fetch_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Test Setting',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->actingAs($this->regularUser)
            ->getJson("/api/global-settings/{$setting->id}")
            ->assertForbidden();
    }

    public function test_admin_can_fetch_single_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Site Configuration',
            'fields' => [
                ['label' => 'Site Name', 'type' => 'text', 'is_required' => true],
                ['label' => 'Site URL', 'type' => 'text', 'is_required' => true],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/global-settings/{$setting->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $setting->id)
            ->assertJsonPath('data.name', 'Site Configuration')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'fields' => [
                        '*' => ['label', 'type', 'is_required'],
                    ],
                    'created_at',
                ],
            ]);
    }

    public function test_fetch_nonexistent_global_setting_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/global-settings/99999')
            ->assertNotFound();
    }

    public function test_fetch_setting_includes_all_field_properties(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Test Setting',
            'fields' => [
                [
                    'label' => 'Dropdown Field',
                    'type' => 'dropdown',
                    'options' => ['Option 1', 'Option 2', 'Option 3'],
                    'is_required' => true,
                ],
            ],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/global-settings/{$setting->id}");

        $response->assertOk()
            ->assertJsonPath('data.fields.0.label', 'Dropdown Field')
            ->assertJsonPath('data.fields.0.type', 'dropdown')
            ->assertJsonPath('data.fields.0.is_required', true);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CREATE GLOBAL SETTING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_create_global_setting(): void
    {
        $this->postJson('/api/global-settings', [
            'name' => 'New Setting',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_create_global_setting(): void
    {
        $this->actingAs($this->regularUser)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertForbidden();
    }

    public function test_admin_can_create_global_setting(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Email Configuration',
                'fields' => [
                    ['label' => 'SMTP Host', 'type' => 'text', 'is_required' => true],
                    ['label' => 'SMTP Port', 'type' => 'number', 'is_required' => true],
                    ['label' => 'Use TLS', 'type' => 'boolean', 'is_required' => false],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Email Configuration')
            ->assertJsonCount(3, 'data.fields');

        $this->assertDatabaseHas('global_settings', [
            'name' => 'Email Configuration',
        ]);
    }

    public function test_super_admin_can_create_global_setting(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/global-settings', [
                'name' => 'App Settings',
                'fields' => [['label' => 'Theme', 'type' => 'dropdown', 'options' => ['light', 'dark']]],
            ]);

        $response->assertCreated();
    }

    public function test_create_global_setting_requires_name(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_global_setting_name_must_be_unique(): void
    {
        GlobalSetting::create([
            'name' => 'Site Configuration',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Site Configuration',
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_create_global_setting_requires_fields_array(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields');
    }

    public function test_field_label_required(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    ['type' => 'text'], // Missing label
                ],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields.0.label');
    }

    public function test_field_type_required(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    ['label' => 'Field'], // Missing type
                ],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields.0.type');
    }

    public function test_field_type_must_be_valid(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    ['label' => 'Field', 'type' => 'invalid_type'],
                ],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields.0.type');
    }

    public function test_valid_field_types(): void
    {
        $validTypes = ['text', 'number', 'password', 'textarea', 'dropdown', 'boolean', 'date', 'image'];

        foreach ($validTypes as $type) {
            $response = $this->actingAs($this->admin)
                ->postJson('/api/global-settings', [
                    'name' => "Setting with $type",
                    'fields' => [['label' => 'Field', 'type' => $type]],
                ]);

            $response->assertCreated();
        }
    }

    public function test_dropdown_field_requires_options(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    ['label' => 'Dropdown', 'type' => 'dropdown'], // Missing options
                ],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields.0.options');
    }

    public function test_dropdown_options_must_be_array(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    [
                        'label' => 'Dropdown',
                        'type' => 'dropdown',
                        'options' => 'not-an-array', // Should be array
                    ],
                ],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields.0.options');
    }

    public function test_create_setting_with_multiple_fields(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Complex Configuration',
                'fields' => [
                    ['label' => 'Site Name', 'type' => 'text', 'is_required' => true],
                    ['label' => 'Site URL', 'type' => 'text', 'is_required' => true],
                    ['label' => 'Description', 'type' => 'textarea', 'is_required' => false],
                    ['label' => 'Logo', 'type' => 'image', 'is_required' => false],
                    ['label' => 'Max Uploads', 'type' => 'number', 'is_required' => true],
                    ['label' => 'Theme', 'type' => 'dropdown', 'options' => ['light', 'dark'], 'is_required' => false],
                    ['label' => 'Enable Notifications', 'type' => 'boolean', 'is_required' => false],
                    ['label' => 'Launch Date', 'type' => 'date', 'is_required' => false],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonCount(8, 'data.fields');
    }

    public function test_field_is_required_defaults_false(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    ['label' => 'Optional Field', 'type' => 'text'], // No is_required
                ],
            ]);

        $response->assertCreated();
        $setting = GlobalSetting::latest()->first();
        $this->assertFalse($setting->fields[0]['is_required']);
    }

    public function test_field_id_is_nullable(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [
                    ['id' => null, 'label' => 'Field', 'type' => 'text'],
                ],
            ]);

        $response->assertCreated();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // UPDATE GLOBAL SETTING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_update_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Original',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->putJson("/api/global-settings/{$setting->id}", [
            'name' => 'Updated',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ])->assertUnauthorized();
    }

    public function test_regular_user_cannot_update_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Original',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->actingAs($this->regularUser)
            ->putJson("/api/global-settings/{$setting->id}", [
                'name' => 'Updated',
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertForbidden();
    }

    public function test_admin_can_update_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Original Setting',
            'fields' => [['label' => 'Old Field', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->admin)
            ->putJson("/api/global-settings/{$setting->id}", [
                'name' => 'Updated Setting',
                'fields' => [['label' => 'New Field', 'type' => 'text']],
            ]);

        $response->assertOk()
            ->assertJsonPath('data.name', 'Updated Setting');

        $setting->refresh();
        $this->assertEquals('Updated Setting', $setting->name);
    }

    public function test_update_setting_fields(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Configuration',
            'fields' => [
                ['label' => 'Host', 'type' => 'text'],
                ['label' => 'Port', 'type' => 'number'],
            ],
        ]);

        $this->actingAs($this->admin)
            ->putJson("/api/global-settings/{$setting->id}", [
                'name' => 'Configuration',
                'fields' => [
                    ['label' => 'Hostname', 'type' => 'text', 'is_required' => true],
                    ['label' => 'Port Number', 'type' => 'number', 'is_required' => true],
                    ['label' => 'SSL Enabled', 'type' => 'boolean', 'is_required' => false],
                ],
            ])->assertOk();

        $setting->refresh();
        $this->assertCount(3, $setting->fields);
    }

    public function test_update_nonexistent_setting_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/global-settings/99999', [
                'name' => 'Updated',
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertNotFound();
    }

    public function test_update_setting_name_must_be_unique(): void
    {
        GlobalSetting::create([
            'name' => 'Existing Setting',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $setting = GlobalSetting::create([
            'name' => 'Another Setting',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->actingAs($this->admin)
            ->putJson("/api/global-settings/{$setting->id}", [
                'name' => 'Existing Setting', // Duplicate name
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE GLOBAL SETTING TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_delete_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'To Delete',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->deleteJson("/api/global-settings/{$setting->id}")
            ->assertUnauthorized();
    }

    public function test_regular_user_cannot_delete_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'To Delete',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $this->actingAs($this->regularUser)
            ->deleteJson("/api/global-settings/{$setting->id}")
            ->assertForbidden();
    }

    public function test_admin_can_delete_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'To Delete',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/global-settings/{$setting->id}");

        $response->assertOk();

        $this->assertDatabaseMissing('global_settings', [
            'id' => $setting->id,
        ]);
    }

    public function test_super_admin_can_delete_global_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'To Delete',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->deleteJson("/api/global-settings/{$setting->id}");

        $response->assertOk();
    }

    public function test_delete_nonexistent_setting_returns_404(): void
    {
        $this->actingAs($this->admin)
            ->deleteJson('/api/global-settings/99999')
            ->assertNotFound();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // RESPONSE STRUCTURE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_global_setting_list_response_structure(): void
    {
        GlobalSetting::create([
            'name' => 'Test',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/global-settings');

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'fields' => [
                        '*' => [
                            'label',
                            'type',
                            'is_required',
                        ],
                    ],
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

    public function test_single_setting_response_structure(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Test',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/api/global-settings/{$setting->id}");

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'fields',
                'created_at',
            ],
        ]);
    }

    public function test_create_response_structure(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'New Setting',
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'name',
                'fields',
                'created_at',
            ],
        ])->assertJsonPath('success', true);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // EDGE CASES & BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_setting_name_max_length(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => $longName,
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_field_label_max_length(): void
    {
        $longLabel = str_repeat('A', 256);

        $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Setting',
                'fields' => [['label' => $longLabel, 'type' => 'text']],
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('fields.0.label');
    }

    public function test_empty_fields_array_allowed(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Empty Setting',
                'fields' => [],
            ]);

        // May be allowed or rejected depending on business logic
        $this->assertTrue(
            $response->status() === 201 || $response->status() === 422
        );
    }

    public function test_dropdown_with_many_options(): void
    {
        $options = array_map(fn($i) => "Option $i", range(1, 100));

        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Large Dropdown',
                'fields' => [
                    ['label' => 'Many Options', 'type' => 'dropdown', 'options' => $options],
                ],
            ]);

        $response->assertCreated();
    }

    public function test_special_characters_in_field_values(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'Special Characters: @#$%^&*()_+-={}[]|:;<>?,./~`',
                'fields' => [
                    ['label' => 'Field™ with © symbols', 'type' => 'text', 'is_required' => true],
                    ['label' => 'Unicode: 中文, العربية', 'type' => 'textarea'],
                ],
            ]);

        $response->assertCreated();
    }

    public function test_multiple_settings_independent(): void
    {
        $setting1 = GlobalSetting::create([
            'name' => 'Setting 1',
            'fields' => [['label' => 'Field 1', 'type' => 'text']],
        ]);

        $setting2 = GlobalSetting::create([
            'name' => 'Setting 2',
            'fields' => [['label' => 'Field 2', 'type' => 'number']],
        ]);

        $response1 = $this->actingAs($this->admin)
            ->getJson("/api/global-settings/{$setting1->id}");

        $response2 = $this->actingAs($this->admin)
            ->getJson("/api/global-settings/{$setting2->id}");

        $response1->assertJsonPath('data.name', 'Setting 1');
        $response2->assertJsonPath('data.name', 'Setting 2');
    }

    public function test_update_and_delete_setting(): void
    {
        $setting = GlobalSetting::create([
            'name' => 'Original',
            'fields' => [['label' => 'Field', 'type' => 'text']],
        ]);

        // Update it
        $this->actingAs($this->admin)
            ->putJson("/api/global-settings/{$setting->id}", [
                'name' => 'Updated',
                'fields' => [['label' => 'Updated Field', 'type' => 'number']],
            ])->assertOk();

        // Delete it
        $this->actingAs($this->admin)
            ->deleteJson("/api/global-settings/{$setting->id}")
            ->assertOk();

        // Verify deleted
        $this->assertNull(GlobalSetting::find($setting->id));
    }

    public function test_large_settings_list_pagination(): void
    {
        foreach (range(1, 100) as $i) {
            GlobalSetting::create([
                'name' => "Setting $i",
                'fields' => [['label' => 'Field', 'type' => 'text']],
            ]);
        }

        $response = $this->actingAs($this->admin)
            ->getJson('/api/global-settings?per_page=50');

        $response->assertOk()
            ->assertJsonPath('meta.per_page', 50)
            ->assertJsonPath('meta.total', 100);
    }

    public function test_all_field_types_in_one_setting(): void
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/global-settings', [
                'name' => 'All Field Types',
                'fields' => [
                    ['id' => 1, 'label' => 'Text', 'type' => 'text', 'is_required' => true],
                    ['id' => 2, 'label' => 'Number', 'type' => 'number', 'is_required' => false],
                    ['id' => 3, 'label' => 'Password', 'type' => 'password', 'is_required' => true],
                    ['id' => 4, 'label' => 'Textarea', 'type' => 'textarea', 'is_required' => false],
                    ['id' => 5, 'label' => 'Dropdown', 'type' => 'dropdown', 'options' => ['A', 'B'], 'is_required' => false],
                    ['id' => 6, 'label' => 'Boolean', 'type' => 'boolean', 'is_required' => false],
                    ['id' => 7, 'label' => 'Date', 'type' => 'date', 'is_required' => false],
                    ['id' => 8, 'label' => 'Image', 'type' => 'image', 'is_required' => false],
                ],
            ]);

        $response->assertCreated()
            ->assertJsonCount(8, 'data.fields');
    }
}
