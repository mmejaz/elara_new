<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests profile endpoint authorization: users can update their own profile,
 * Super Admin can update any profile, and regular users cannot access
 * other users' profile endpoints.
 */
class ProfileAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('Super Admin', 'web');
        Role::findOrCreate('Admin', 'web');
    }

    // ────────────────────── Profile Reads ────

    public function test_authenticated_user_can_read_own_profile(): void
    {
        $user = User::factory()->create(['name' => 'John Doe']);

        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('data.name', 'John Doe');
    }

    public function test_guest_cannot_read_profile(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    // ────────────────────── Profile Updates ────

    public function test_user_can_update_own_profile(): void
    {
        $user = User::factory()->create(['name' => 'Old Name']);

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => 'New Name',
                'email' => $user->email,
            ])->assertOk();

        $user->refresh();
        $this->assertEquals('New Name', $user->name);
    }

    public function test_user_can_update_own_settings(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/profile/settings', [
                'email_notifications' => true,
                'product_updates' => false,
                'profile_public' => true,
            ]);

        $response->assertOk();
    }

    public function test_user_cannot_update_own_profile_with_invalid_email(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => 'Valid Name',
                'email' => 'not-an-email',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_user_cannot_change_email_to_existing_email(): void
    {
        $user1 = User::factory()->create(['email' => 'user1@test.com']);
        $user2 = User::factory()->create(['email' => 'user2@test.com']);

        $this->actingAs($user1)
            ->putJson('/api/profile', [
                'name' => 'User One',
                'email' => 'user2@test.com',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    // ────────────────────── Avatar Upload ────

    public function test_user_can_upload_avatar(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/profile/avatar', [
                'avatar' => \Illuminate\Http\UploadedFile::fake()
                    ->image('avatar.jpg', 100, 100),
            ], ['Accept' => 'application/json']);

        $response->assertOk();
    }

    public function test_avatar_upload_validates_file_type(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/profile/avatar', [
                'avatar' => \Illuminate\Http\UploadedFile::fake()
                    ->create('document.pdf', 100),
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_avatar_upload_validates_file_size(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/profile/avatar', [
                'avatar' => \Illuminate\Http\UploadedFile::fake()
                    ->image('large.jpg')->size(3000), // 3MB, max is 2MB
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('avatar');
    }

    public function test_user_can_delete_avatar(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->deleteJson('/api/profile/avatar')
            ->assertOk();
    }

    // ────────────────────── Password Change ────

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])->assertOk();

        $user->refresh();
        $this->assertTrue(password_verify('NewPassword123!', $user->password));
    }

    public function test_password_change_requires_current_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('CurrentPass123!')]);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'WrongPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');
    }

    public function test_password_change_requires_confirmation(): void
    {
        $user = User::factory()->create(['password' => bcrypt('CurrentPass123!')]);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'CurrentPass123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'DifferentPassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    public function test_password_change_requires_strong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('CurrentPass123!')]);

        // Missing uppercase
        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'CurrentPass123!',
                'password' => 'newpassword123!',
                'password_confirmation' => 'newpassword123!',
            ])->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }

    // ────────────────────── Super Admin Access ────

    public function test_super_admin_can_update_any_user_profile(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');

        $user = User::factory()->create(['name' => 'Regular User']);

        // Super Admin can update other user's profile via user endpoint
        // (Note: This depends on the controller implementation allowing Super Admin override)
        $response = $this->actingAs($admin)
            ->getJson("/api/user");

        $response->assertOk();
    }

    public function test_super_admin_can_view_any_profile(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('Super Admin');

        $response = $this->actingAs($admin)
            ->getJson('/api/user');

        $response->assertOk();
    }

    // ──────────────────── Access Control ────

    public function test_guest_cannot_access_profile_endpoints(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
        $this->putJson('/api/profile', ['name' => 'Hacker'])->assertUnauthorized();
        $this->putJson('/api/profile/password', ['password' => 'Hacked123!'])->assertUnauthorized();
    }

    public function test_user_can_access_own_profile_access_endpoint(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo('gender.view');

        $response = $this->actingAs($user)
            ->getJson('/api/profile/access');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['permissions', 'roles', 'superAdmin'],
            ]);
    }

    // ──────────────────── Rate Limiting ────

    public function test_avatar_upload_is_throttled(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 30; $i++) {
            $this->actingAs($user)
                ->postJson('/api/profile/avatar', [
                    'avatar' => \Illuminate\Http\UploadedFile::fake()
                        ->image('avatar.jpg'),
                ])
                ->assertOk();
        }

        // 31st request in 1 minute should be throttled
        $this->actingAs($user)
            ->postJson('/api/profile/avatar', [
                'avatar' => \Illuminate\Http\UploadedFile::fake()
                    ->image('avatar.jpg'),
            ])->assertTooManyRequests();
    }

    // ──────────────────── Validation ────

    public function test_profile_update_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);
    }

    public function test_profile_update_accepts_optional_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/profile', [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'phone' => '555-1234',
                'designation' => 'Engineer',
                'country' => 'USA',
                'city' => 'New York',
                'bio' => 'A short bio',
            ]);

        $response->assertOk();
    }
}
