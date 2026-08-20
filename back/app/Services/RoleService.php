<?php

namespace App\Services;

use App\Http\Resources\RoleResource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleService
{
    /**
     * Every role is seeded under BOTH the `web` and `sanctum` guards (the API
     * checks permissions on sanctum, the web guard backs the SPA session). For
     * display — dropdowns and the roles list — we only want each role once, so
     * scope to a single guard.
     */
    private const DISPLAY_GUARD = 'web';

    public function getAllNames(): array
    {
        return Role::where('guard_name', self::DISPLAY_GUARD)
            ->orderBy('name')
            ->pluck('name')
            ->toArray();
    }

    /** Server-side paginated + searchable role list, with user + permission counts. */
    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Role::query()->with('permissions')
            ->where('guard_name', self::DISPLAY_GUARD);

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

        $roles = Role::with('permissions')
            ->where('guard_name', self::DISPLAY_GUARD)
            ->orderBy('name')
            ->get()
            ->map(fn($role) => (new RoleResource($role))->withUsersCount($userCounts[$role->id] ?? 0));

        return RoleResource::collection($roles);
    }

    public function create(array $data): RoleResource
    {
        return DB::transaction(function () use ($data) {
            // Roles must exist under BOTH guards: `web` backs the SPA session and
            // `sanctum` backs the API (and the roles list is DISPLAY_GUARD-scoped).
            // A role created under a single guard would be invisible in the list
            // and unassignable on the other guard — so mirror the seeder and
            // create both, syncing permissions per guard (names resolve to the
            // role's own guard).
            $displayRole = null;

            foreach ([self::DISPLAY_GUARD, 'sanctum'] as $guard) {
                $role = Role::create(['name' => $data['name'], 'guard_name' => $guard]);

                if (! empty($data['permissions'])) {
                    $role->syncPermissions($data['permissions']);
                }

                if ($guard === self::DISPLAY_GUARD) {
                    $displayRole = $role;
                }
            }

            return (new RoleResource($displayRole->load('permissions')))->withUsersCount(0);
        });
    }

    public function update(Role $role, array $data): RoleResource
    {
        return DB::transaction(function () use ($role, $data) {
            // The bound role is DISPLAY_GUARD-scoped, but the same role also exists
            // under sanctum for the API. Update BOTH rows so the name and
            // permissions never drift between guards (permission names resolve to
            // each row's own guard).
            $originalName = $role->name;

            foreach ([self::DISPLAY_GUARD, 'sanctum'] as $guard) {
                $twin = $guard === $role->guard_name
                    ? $role
                    : Role::where('name', $originalName)->where('guard_name', $guard)->first();

                if (! $twin) {
                    continue;
                }

                $twin->update(['name' => $data['name']]);
                $twin->syncPermissions($data['permissions'] ?? []);
            }

            $usersCount = DB::table('model_has_roles')
                ->where('role_id', $role->id)
                ->count();

            return (new RoleResource($role->fresh()->load('permissions')))->withUsersCount($usersCount);
        });
    }
}
