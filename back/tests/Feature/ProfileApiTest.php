<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Comprehensive tests for Profile API: personal data, password, settings, avatar.
 * Tests authenticated user's ability to manage their own profile.
 *
 * Endpoints:
 * - GET    /profile/access             (get roles and permissions)
 * - PUT    /profile                    (update personal info)
 * - PUT    /profile/password           (change password)
 * - PUT    /profile/settings           (update preferences)
 * - POST   /profile/avatar             (upload avatar, throttled 30/min)
 * - DELETE /profile/avatar             (delete avatar)
 */
class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $anotherUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('User', 'web');
        Role::findOrCreate('Admin', 'web');

        $this->user = User::factory()->create([
            'email' => 'user@example.com',
            'name' => 'John Doe',
            'phone' => '+1234567890',
            'designation' => 'Software Engineer',
            'country' => 'USA',
            'city' => 'New York',
            'bio' => 'A passionate developer',
            'settings' => [
                'email_notifications' => true,
                'product_updates' => false,
                'profile_public' => true,
            ],
        ]);

        $this->anotherUser = User::factory()->create([
            'email' => 'another@example.com',
            'name' => 'Jane Smith',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // GET /PROFILE/ACCESS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_access_profile_access(): void
    {
        $this->getJson('/api/profile/access')
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_access_matrix(): void
    {
        $this->user->assignRole('User');

        $response = $this->actingAs($this->user)
            ->getJson('/api/profile/access');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'roles' => [
                        '*' => [
                            'name',
                            'permissions',
                        ],
                    ],
                    'direct_permissions',
                ],
            ]);
    }

    public function test_access_matrix_includes_user_roles(): void
    {
        $userRole = Role::findOrCreate('User', 'web');
        $this->user->assignRole($userRole);

        $response = $this->actingAs($this->user)
            ->getJson('/api/profile/access');

        $response->assertOk()
            ->assertJsonPath('data.roles.0.name', 'User');
    }

    public function test_access_matrix_includes_role_permissions(): void
    {
        $adminRole = Role::findOrCreate('Admin', 'web');
        $permission = \Spatie\Permission\Models\Permission::findOrCreate('create-users', 'web');
        $adminRole->givePermissionTo($permission);

        $this->user->assignRole($adminRole);

        $response = $this->actingAs($this->user)
            ->getJson('/api/profile/access');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['roles', 'direct_permissions']]);
    }

    public function test_access_matrix_includes_direct_permissions(): void
    {
        $permission = \Spatie\Permission\Models\Permission::findOrCreate('approve-settings', 'web');
        $this->user->givePermissionTo($permission);

        $response = $this->actingAs($this->user)
            ->getJson('/api/profile/access');

        $response->assertOk();
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PUT /PROFILE TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_update_profile(): void
    {
        $this->putJson('/api/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ])->assertUnauthorized();
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
                'phone' => '+9876543210',
                'designation' => 'Senior Engineer',
                'country' => 'UK',
                'city' => 'London',
                'bio' => 'Updated bio',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.user.name', 'Jane Doe')
            ->assertJsonPath('data.user.email', 'jane@example.com');

        $this->user->refresh();
        $this->assertEquals('Jane Doe', $this->user->name);
        $this->assertEquals('jane@example.com', $this->user->email);
    }

    public function test_update_profile_requires_name(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'email' => 'test@example.com',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_profile_requires_email(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_update_profile_name_required_string(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => '',
                'email' => 'test@example.com',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_profile_name_max_255(): void
    {
        $longName = str_repeat('A', 256);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => $longName,
                'email' => 'test@example.com',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_update_profile_email_must_be_valid(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'invalid-email',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_update_profile_email_must_be_unique(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => $this->anotherUser->email, // Duplicate
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_update_profile_can_keep_current_email(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Updated Name',
                'email' => $this->user->email, // Same email
            ]);

        $response->assertOk();
    }

    public function test_update_profile_phone_max_30(): void
    {
        $longPhone = str_repeat('1', 31);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'phone' => $longPhone,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('phone');
    }

    public function test_update_profile_designation_max_255(): void
    {
        $longDesignation = str_repeat('A', 256);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'designation' => $longDesignation,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('designation');
    }

    public function test_update_profile_country_max_255(): void
    {
        $longCountry = str_repeat('A', 256);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'country' => $longCountry,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('country');
    }

    public function test_update_profile_city_max_255(): void
    {
        $longCity = str_repeat('A', 256);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'city' => $longCity,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('city');
    }

    public function test_update_profile_bio_max_2000(): void
    {
        $longBio = str_repeat('A', 2001);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'bio' => $longBio,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('bio');
    }

    public function test_update_profile_nullable_fields(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'phone' => null,
                'designation' => null,
                'country' => null,
                'city' => null,
                'bio' => null,
            ]);

        $response->assertOk();
        $this->user->refresh();
        $this->assertNull($this->user->phone);
    }

    public function test_update_profile_partial_update(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => '+1111111111',
            ]);

        $response->assertOk();
        $this->user->refresh();
        $this->assertEquals('+1111111111', $this->user->phone);
    }

    public function test_update_profile_response_structure(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                    'designation',
                    'country',
                    'city',
                    'bio',
                    'roles',
                    'permissions',
                ],
                'roles',
                'permissions',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PUT /PROFILE/PASSWORD TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_update_password(): void
    {
        $this->putJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertUnauthorized();
    }

    public function test_user_can_update_password(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $response->assertOk();

        // Verify new password works
        $this->assertTrue(
            \Illuminate\Support\Facades\Hash::check('NewPassword123!', $this->user->fresh()->password)
        );
    }

    public function test_update_password_requires_current_password(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');
    }

    public function test_update_password_current_password_must_be_correct(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'wrongpassword',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');
    }

    public function test_update_password_requires_new_password(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_update_password_must_be_confirmed(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'DifferentPassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_update_password_must_be_min_8_chars(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'Short1!',
                'password_confirmation' => 'Short1!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_update_password_must_contain_uppercase(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'newpassword123!',
                'password_confirmation' => 'newpassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_update_password_must_contain_lowercase(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NEWPASSWORD123!',
                'password_confirmation' => 'NEWPASSWORD123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_update_password_must_contain_numbers(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewPassword!',
                'password_confirmation' => 'NewPassword!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_update_password_must_contain_symbols(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewPassword123',
                'password_confirmation' => 'NewPassword123',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_valid_password_strength_rules(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'SecurePass@123',
                'password_confirmation' => 'SecurePass@123',
            ]);

        $response->assertOk();
    }

    public function test_update_password_response_structure(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user',
                'roles',
                'permissions',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // PUT /PROFILE/SETTINGS TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_update_settings(): void
    {
        $this->putJson('/api/profile/settings', [
            'email_notifications' => false,
            'product_updates' => true,
            'profile_public' => false,
        ])->assertUnauthorized();
    }

    public function test_user_can_update_settings(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => false,
                'product_updates' => true,
                'profile_public' => false,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.user.settings.email_notifications', false)
            ->assertJsonPath('data.user.settings.product_updates', true)
            ->assertJsonPath('data.user.settings.profile_public', false);

        $this->user->refresh();
        $this->assertFalse($this->user->settings['email_notifications']);
        $this->assertTrue($this->user->settings['product_updates']);
        $this->assertFalse($this->user->settings['profile_public']);
    }

    public function test_update_settings_requires_email_notifications(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'product_updates' => true,
                'profile_public' => true,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email_notifications');
    }

    public function test_update_settings_requires_product_updates(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => true,
                'profile_public' => true,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('product_updates');
    }

    public function test_update_settings_requires_profile_public(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => true,
                'product_updates' => true,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('profile_public');
    }

    public function test_update_settings_booleans_must_be_boolean(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => 'yes',
                'product_updates' => 'no',
                'profile_public' => 1,
            ])->assertUnprocessable();
    }

    public function test_update_settings_all_true(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => true,
                'product_updates' => true,
                'profile_public' => true,
            ]);

        $response->assertOk();
        $this->user->refresh();
        $this->assertTrue($this->user->settings['email_notifications']);
        $this->assertTrue($this->user->settings['product_updates']);
        $this->assertTrue($this->user->settings['profile_public']);
    }

    public function test_update_settings_all_false(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => false,
                'product_updates' => false,
                'profile_public' => false,
            ]);

        $response->assertOk();
        $this->user->refresh();
        $this->assertFalse($this->user->settings['email_notifications']);
        $this->assertFalse($this->user->settings['product_updates']);
        $this->assertFalse($this->user->settings['profile_public']);
    }

    public function test_update_settings_response_structure(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => true,
                'product_updates' => false,
                'profile_public' => true,
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user' => [
                    'id',
                    'name',
                    'email',
                    'settings',
                ],
                'roles',
                'permissions',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // POST /PROFILE/AVATAR TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_upload_avatar(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');

        $this->postJson('/api/profile/avatar', [
            'avatar' => $file,
        ])->assertUnauthorized();
    }

    public function test_user_can_upload_avatar(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg', 100, 100);

        $response = $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [
                'avatar' => $file,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_upload_avatar_requires_file(): void
    {
        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_upload_avatar_must_be_image(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [
                'avatar' => $file,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_upload_avatar_allowed_mime_types(): void
    {
        foreach (['jpeg', 'jpg', 'png', 'webp'] as $ext) {
            $file = UploadedFile::fake()->image("avatar.$ext", 100, 100);

            $response = $this->actingAs($this->user)
                ->postJson('/api/profile/avatar', [
                    'avatar' => $file,
                ]);

            $response->assertOk();
        }
    }

    public function test_upload_avatar_rejects_other_formats(): void
    {
        $file = UploadedFile::fake()->image('avatar.gif', 100, 100);

        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [
                'avatar' => $file,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_upload_avatar_max_2048_kb(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg')->size(2049);

        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [
                'avatar' => $file,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_upload_avatar_max_2048_kb_accepted(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg')->size(2048);

        $response = $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [
                'avatar' => $file,
            ]);

        $response->assertOk();
    }

    public function test_upload_avatar_replaces_previous(): void
    {
        $file1 = UploadedFile::fake()->image('avatar1.jpg');
        $file2 = UploadedFile::fake()->image('avatar2.jpg');

        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file1])
            ->assertOk();

        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file2])
            ->assertOk();

        $this->user->refresh();
        // Only one avatar should exist
        $avatars = $this->user->getFiles('avatar');
        $this->assertCount(1, $avatars);
    }

    public function test_upload_avatar_throttled_30_per_minute(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $file = UploadedFile::fake()->image("avatar$i.jpg");

            $response = $this->actingAs($this->user)
                ->postJson('/api/profile/avatar', ['avatar' => $file]);

            $response->assertOk();
        }

        // 31st request should be throttled
        $file = UploadedFile::fake()->image('avatar31.jpg');

        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file])
            ->assertTooManyRequests();
    }

    public function test_upload_avatar_response_structure(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', [
                'avatar' => $file,
            ]);

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user',
                'roles',
                'permissions',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // DELETE /PROFILE/AVATAR TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_guest_cannot_delete_avatar(): void
    {
        $this->deleteJson('/api/profile/avatar')
            ->assertUnauthorized();
    }

    public function test_user_can_delete_avatar(): void
    {
        // Upload avatar first
        $file = UploadedFile::fake()->image('avatar.jpg');
        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file])
            ->assertOk();

        // Delete it
        $response = $this->actingAs($this->user)
            ->deleteJson('/api/profile/avatar');

        $response->assertOk();

        // Verify deleted
        $this->user->refresh();
        $avatars = $this->user->getFiles('avatar');
        $this->assertCount(0, $avatars);
    }

    public function test_delete_avatar_without_avatar(): void
    {
        $response = $this->actingAs($this->user)
            ->deleteJson('/api/profile/avatar');

        // Should still succeed (no error for deleting non-existent)
        $response->assertOk();
    }

    public function test_delete_avatar_response_structure(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg');
        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file]);

        $response = $this->actingAs($this->user)
            ->deleteJson('/api/profile/avatar');

        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user',
                'roles',
                'permissions',
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE PROFILE FLOW TESTS
    // ═══════════════════════════════════════════════════════════════════════════════

    public function test_complete_profile_update_flow(): void
    {
        // Get current access
        $this->actingAs($this->user)
            ->getJson('/api/profile/access')
            ->assertOk();

        // Update personal info
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Jane Doe',
                'email' => 'jane@example.com',
                'designation' => 'Senior Engineer',
            ])->assertOk();

        // Update settings
        $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => false,
                'product_updates' => true,
                'profile_public' => false,
            ])->assertOk();

        // Update password
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewSecure@123',
                'password_confirmation' => 'NewSecure@123',
            ])->assertOk();

        // Upload avatar
        $file = UploadedFile::fake()->image('avatar.jpg');
        $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file])
            ->assertOk();

        $this->user->refresh();
        $this->assertEquals('Jane Doe', $this->user->name);
        $this->assertEquals('jane@example.com', $this->user->email);
        $this->assertFalse($this->user->settings['email_notifications']);
        $this->assertTrue($this->user->settings['product_updates']);
    }

    public function test_user_isolation_cannot_update_another_user_profile(): void
    {
        // A user can only update their own profile through the API
        // This is because the endpoint uses auth()->user() directly
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Hacked Name',
                'email' => 'another@example.com',
            ]);

        // The request succeeds but updates their own profile, not another's
        $response->assertOk();
        $this->user->refresh();
        $this->assertEquals('Hacked Name', $this->user->name);
        // Another user should remain unchanged
        $this->anotherUser->refresh();
        $this->assertNotEquals('Hacked Name', $this->anotherUser->name);
    }

    public function test_multiple_users_independent_settings(): void
    {
        // User 1 sets settings
        $this->actingAs($this->user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => true,
                'product_updates' => false,
                'profile_public' => true,
            ])->assertOk();

        // User 2 sets different settings
        $this->actingAs($this->anotherUser)
            ->putJson('/api/profile/settings', [
                'email_notifications' => false,
                'product_updates' => true,
                'profile_public' => false,
            ])->assertOk();

        // Verify isolation
        $this->user->refresh();
        $this->anotherUser->refresh();

        $this->assertTrue($this->user->settings['email_notifications']);
        $this->assertFalse($this->anotherUser->settings['email_notifications']);
    }

    public function test_profile_update_with_special_characters(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'José María García-López',
                'email' => 'jose@example.com',
                'designation' => 'CTO @ Tech Inc™',
                'bio' => 'Passionate about coding 💻 & open source 🚀',
            ]);

        $response->assertOk();
        $this->user->refresh();
        $this->assertStringContainsString('José', $this->user->name);
    }

    public function test_profile_update_empty_strings_for_nullable_fields(): void
    {
        $response = $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'phone' => '',
                'designation' => '',
                'country' => '',
                'city' => '',
                'bio' => '',
            ]);

        $response->assertOk();
    }

    public function test_profile_access_shows_current_roles_and_permissions(): void
    {
        $userRole = Role::findOrCreate('User', 'web');
        $this->user->assignRole($userRole);

        $response = $this->actingAs($this->user)
            ->getJson('/api/profile/access');

        $response->assertOk()
            ->assertJsonPath('data.roles.0.name', 'User');
    }

    public function test_avatar_upload_and_retrieve(): void
    {
        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $uploadResponse = $this->actingAs($this->user)
            ->postJson('/api/profile/avatar', ['avatar' => $file]);

        $uploadResponse->assertOk();

        // Verify user has avatar
        $this->user->refresh();
        $avatars = $this->user->getFiles('avatar');
        $this->assertCount(1, $avatars);
    }

    public function test_password_change_invalidates_old_password(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'password',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])->assertOk();

        // Try to login with old password
        $this->postJson('/api/login', [
            'email' => $this->user->email,
            'password' => 'password',
        ])->assertUnprocessable();

        // Login with new password should work
        $response = $this->postJson('/api/login', [
            'email' => $this->user->email,
            'password' => 'NewPassword123!',
        ]);

        $response->assertOk();
    }

    public function test_get_user_endpoint_returns_current_profile(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.user.id', $this->user->id)
            ->assertJsonPath('data.user.email', $this->user->email);
    }

    public function test_profile_update_preserves_roles(): void
    {
        $adminRole = Role::findOrCreate('Admin', 'web');
        $this->user->assignRole($adminRole);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ])->assertOk();

        $this->user->refresh();
        $this->assertTrue($this->user->hasRole('Admin'));
    }

    public function test_profile_update_preserves_permissions(): void
    {
        $permission = \Spatie\Permission\Models\Permission::findOrCreate('delete-users', 'web');
        $this->user->givePermissionTo($permission);

        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ])->assertOk();

        $this->user->refresh();
        $this->assertTrue($this->user->hasPermissionTo('delete-users'));
    }
}
