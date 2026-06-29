<?php

namespace App\Services;

use App\Http\Resources\AuthUserResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
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
