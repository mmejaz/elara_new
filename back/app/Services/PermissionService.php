<?php

namespace App\Services;

use App\Http\Resources\PermissionResource;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    public function getAllNames(): array
    {
        return Permission::pluck('name')->toArray();
    }

    public function getAll()
    {
        return PermissionResource::collection(
            Permission::with('roles')->get()
        );
    }

    public function create(array $data): PermissionResource
    {
        return DB::transaction(function () use ($data) {
            $permission = Permission::create(['name' => $data['name']]);

            return new PermissionResource($permission->load('roles'));
        });
    }

    public function update(Permission $permission, array $data): PermissionResource
    {
        return DB::transaction(function () use ($permission, $data) {
            $permission->update(['name' => $data['name']]);

            return new PermissionResource($permission->load('roles'));
        });
    }
}
