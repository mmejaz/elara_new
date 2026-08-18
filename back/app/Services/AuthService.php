<?php

namespace App\Services;

use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(string $email, string $password): array
    {
        if (! Auth::attempt(['email' => $email, 'password' => $password])) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        // Deactivated / blocked accounts can't sign in. Check AFTER the password
        // so we don't reveal an account's status to someone who can't authenticate.
        if (! $user->isActive()) {
            Auth::guard('web')->logout();

            $label = $user->status === \App\Models\User::STATUS_BLOCKED ? 'blocked' : 'deactivated';
            $reason = $user->status_reason ? " Reason: {$user->status_reason}" : '';

            throw ValidationException::withMessages([
                'email' => ["Your account has been {$label}.{$reason}"],
            ]);
        }

        return $this->userPayload($user);
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();
    }

    public function currentUser(User $user): array
    {
        return $this->userPayload($user);
    }

    public function updateAvatar(User $user, UploadedFile $file): array
    {
        // Centralised, validated store; replaces + cleans up the previous avatar.
        $user->attachSingleFile($file, 'avatar');

        return $this->userPayload($user->fresh());
    }

    public function deleteAvatar(User $user): array
    {
        $user->detachFiles('avatar');

        return $this->userPayload($user->fresh());
    }

    /** Update the signed-in user's personal information. */
    public function updateProfile(User $user, array $data): array
    {
        $user->update($data);

        return $this->userPayload($user->fresh());
    }

    /** Change the signed-in user's password (already validated against the current one). */
    public function updatePassword(User $user, string $password): array
    {
        $user->update(['password' => $password]); // hashed by the model cast

        return $this->userPayload($user->fresh());
    }

    /** Persist the signed-in user's account settings/preferences. */
    public function updateSettings(User $user, array $settings): array
    {
        $user->update(['settings' => $settings]);

        return $this->userPayload($user->fresh());
    }

    /**
     * The user's access breakdown: each role with its own permissions, plus any
     * permissions assigned directly to the user (not inherited from a role).
     */
    public function accessMatrix(User $user): array
    {
        $user->load('roles.permissions');

        return [
            'roles' => $user->roles->map(fn ($role) => [
                'name'        => $role->name,
                'permissions' => $role->permissions->pluck('name')->values(),
            ])->values(),
            'direct_permissions' => $user->getDirectPermissions()->pluck('name')->values(),
        ];
    }

    private function userPayload(User $user): array
    {
        $user->load(['roles.permissions', 'files']);

        $resource = (new AuthUserResource($user))->resolve();

        return [
            'user'            => $resource,
            'roles'           => $resource['roles'],
            'permissions'     => $resource['permissions'],
            // Tenant-level config the SPA needs up front — drives how the
            // department form behaves (shared / scoped / flexible).
            'department_mode' => \App\Support\DepartmentMode::current(),
            // When a Super Admin is viewing the app AS another user, the SPA
            // shows a "return to your account" banner. `impersonator` is the real
            // account's name so the banner can say who you'll return to.
            'impersonation'   => $this->impersonationState(),
        ];
    }

    /** Current impersonation status, from lab404/laravel-impersonate. */
    private function impersonationState(): array
    {
        $manager = app(\Lab404\Impersonate\Services\ImpersonateManager::class);
        $active = $manager->isImpersonating();

        return [
            'active'       => $active,
            'impersonator' => $active ? $manager->getImpersonator()?->name : null,
        ];
    }
}
