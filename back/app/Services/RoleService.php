<?php

namespace App\Services;

use App\Http\Resources\RoleResource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleService
{
    public function getAllNames(): array
    {
        return Role::pluck('name')->toArray();
    }

    /** Server-side paginated + searchable role list, with user + permission counts. */
    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Role::query()->with('permissions');

        if (! empty($params['search'])) {
            $query->where('name', 'like', '%' . $params['search'] . '%');
        }

        $sortable = ['name', 'created_at', 'id'];
        $sortBy = in_array($params['sort_by'] ?? '', $sortable, true) ? $params['sort_by'] : 'name';
        $sortDir = ($params['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $paginator = $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));

        // Inject user counts via a raw query — the spatie users() relation
        // resolves the wrong model under the sanctum guard, so avoid withCount().
        $userCounts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as count'))
            ->groupBy('role_id')
            ->pluck('count', 'role_id');

        $paginator->getCollection()->each(function ($role) use ($userCounts) {
            $role->users_count = $userCounts[$role->id] ?? 0;
        });

        return $paginator;
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
