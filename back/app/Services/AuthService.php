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

        return $this->userPayload(Auth::user());
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
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->update(['avatar' => $file->store('avatars', 'public')]);

        return $this->userPayload($user->fresh());
    }

    public function deleteAvatar(User $user): array
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

        return $this->userPayload($user->fresh());
    }

    private function userPayload(User $user): array
    {
        $user->load('roles');

        $resource = (new AuthUserResource($user))->resolve();

        return [
            'user'        => $resource,
            'roles'       => $resource['roles'],
            'permissions' => $resource['permissions'],
        ];
    }
}
