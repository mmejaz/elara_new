<?php

namespace App\Services;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function getAll()
    {
        return UserResource::collection(
            User::with('roles')->latest()->get()
        );
    }

    public function create(array $data): UserResource
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => $data['password'],
            ]);

            $user->assignRole($data['role']);

            return new UserResource($user->load('roles'));
        });
    }
}
