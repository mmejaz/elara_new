<?php

namespace App\Services;

use App\Http\Resources\RoleResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleService
{
    public function getAllNames(): array
    {
        return Role::pluck('name')->toArray();
    }

    public function getAll(): AnonymousResourceCollection
    {
        $userCounts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as count'))
            ->groupBy('role_id')
            ->pluck('count', 'role_id');

        $roles = Role::with('permissions')->get()
            ->map(fn($role) => (new RoleResource($role))->withUsersCount($userCounts[$role->id] ?? 0));

        return RoleResource::collection($roles);
    }

    public function create(array $data): RoleResource
    {
        return DB::transaction(function () use ($data) {
            $role = Role::create(['name' => $data['name']]);

            if (!empty($data['permissions'])) {
                $role->syncPermissions($data['permissions']);
            }

            return (new RoleResource($role->load('permissions')))->withUsersCount(0);
        });
    }

    public function update(Role $role, array $data): RoleResource
    {
        return DB::transaction(function () use ($role, $data) {
            $role->update(['name' => $data['name']]);
            $role->syncPermissions($data['permissions'] ?? []);

            $usersCount = DB::table('model_has_roles')
                ->where('role_id', $role->id)
                ->count();

            return (new RoleResource($role->load('permissions')))->withUsersCount($usersCount);
        });
    }
}
