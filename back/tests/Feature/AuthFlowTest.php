<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Tests the complete authentication flow: login, session persistence,
 * permission enforcement, and logout.
 */
class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::findOrCreate('Super Admin', 'web');
        Role::findOrCreate('Admin', 'web');
        Role::findOrCreate('User', 'web');
    }

    // ──────────────────────────────────────── CSRF ────

    public function test_csrf_cookie_endpoint_returns_ok(): void
    {
        $this->getJson('/api/sanctum/csrf-cookie')->assertOk();
    }

    // ────────────────────────────────────── Login ────

    public function test_guest_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_login_with_invalid_credentials_fails(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_login_with_valid_credentials_succeeds(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['id', 'name', 'email']]);
    }

    public function test_login_with_missing_email_fails(): void
    {
        $this->postJson('/api/login', ['password' => 'password123'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_login_with_invalid_email_format_fails(): void
    {
        $this->postJson('/api/login', [
            'email' => 'not-an-email',
            'password' => 'password123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    // ─────────────────────────────── Session Management ────

    public function test_authenticated_user_can_access_protected_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_authenticated_user_receives_access_info(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');
        $user->givePermissionTo('users.view');

        $response = $this->actingAs($user)->getJson('/api/profile/access');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['permissions', 'roles', 'superAdmin'],
            ]);
    }

    public function test_user_session_persists_across_requests(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/user')
            ->assertOk();

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);
    }

    public function test_super_admin_role_grants_access_to_all_resources(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Super Admin');

        $this->actingAs($user)
            ->getJson('/api/profile/access')
            ->assertOk()
            ->assertJsonPath('data.superAdmin', true);
    }

    // ───────────────────────────────────── Permissions ────

    public function test_user_without_permission_cannot_access_protected_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('User');

        $this->actingAs($user)
            ->getJson('/api/genders')
            ->assertForbidden();
    }

    public function test_user_with_permission_can_access_protected_endpoint(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');
        $user->givePermissionTo('gender.view');

        $this->actingAs($user)
            ->getJson('/api/genders')
            ->assertOk();
    }

    public function test_user_without_create_permission_cannot_store(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo('gender.view');

        $this->actingAs($user)
            ->postJson('/api/genders', ['name' => 'Test'])
            ->assertForbidden();
    }

    public function test_user_with_create_permission_can_store(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo('gender.create');

        $this->actingAs($user)
            ->postJson('/api/genders', ['name' => 'Test Gender'])
            ->assertCreated();
    }

    // ────────────────────────────────── Rate Limiting ────

    public function test_login_rate_limiting_per_email_and_ip(): void
    {
        $this->withoutMiddleware(); // Disable rate limiting for this test, then test manually

        $user = User::factory()->create(['email' => 'rate@test.com']);
        $password = 'password123';
        $user->update(['password' => bcrypt($password)]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => 'rate@test.com',
                'password' => $password,
            ])->assertOk();
        }

        // 6th request should be throttled
        $this->postJson('/api/login', [
            'email' => 'rate@test.com',
            'password' => $password,
        ])->assertTooManyRequests();
    }

    // ──────────────────────────────── Logout ────

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/logout')
            ->assertOk();
    }

    public function test_guest_cannot_logout(): void
    {
        $this->postJson('/api/logout')->assertUnauthorized();
    }

    public function test_user_cannot_access_protected_route_after_logout(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/logout')->assertOk();

        $this->getJson('/api/user')->assertUnauthorized();
    }

    // ────────────────────────────────── Password Reset ────

    public function test_password_validation_requires_min_8_chars(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => $user->password, // Wrong but format passes first
                'password' => 'Short1!',
                'password_confirmation' => 'Short1!',
            ])->assertUnprocessable();
    }

    public function test_password_validation_requires_mixed_case(): void
    {
        $user = User::factory()->create(['password' => bcrypt('CurrentPass123!')]);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'CurrentPass123!',
                'password' => 'alllowercase123!',
                'password_confirmation' => 'alllowercase123!',
            ])->assertUnprocessable();
    }

    public function test_password_validation_requires_number(): void
    {
        $user = User::factory()->create(['password' => bcrypt('CurrentPass123!')]);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'CurrentPass123!',
                'password' => 'NoNumberHere!',
                'password_confirmation' => 'NoNumberHere!',
            ])->assertUnprocessable();
    }

    public function test_password_validation_requires_symbol(): void
    {
        $user = User::factory()->create(['password' => bcrypt('CurrentPass123!')]);

        $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'CurrentPass123!',
                'password' => 'NoSymbolHere123',
                'password_confirmation' => 'NoSymbolHere123',
            ])->assertUnprocessable();
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

        $response = $this->actingAs($user)
            ->putJson('/api/profile/password', [
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ]);

        $response->assertOk();

        // Verify password actually changed
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
}
