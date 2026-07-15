<?php

namespace App\Services;

use App\Http\Resources\PermissionResource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
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

    /**
     * Server-side paginated + searchable list. Only `name` is a real column;
     * module/action are derived from it, and a name search (e.g. "city" or
     * "view") covers both since names are "{module}.{action}".
     */
    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Permission::query()->with('roles');

        if (! empty($params['search'])) {
            $query->where('name', 'like', '%' . $params['search'] . '%');
        }

        $sortable = ['name', 'created_at', 'id'];
        $sortBy = in_array($params['sort_by'] ?? '', $sortable, true) ? $params['sort_by'] : 'name';
        $sortDir = ($params['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));
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
