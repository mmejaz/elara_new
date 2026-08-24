<?php

namespace App\Services;

use App\Http\Resources\PermissionResource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

class PermissionService
{
    /**
     * Every permission is seeded under BOTH the `web` and `sanctum` guards (the
     * API checks on sanctum, the web guard backs the SPA session). For display —
     * the permission picker and the permissions list — we only want each
     * permission once, so scope to a single guard. Names are identical across
     * guards, so a role's syncPermissions(names) still resolves per guard.
     */
    private const DISPLAY_GUARD = 'web';

    public function getAllNames(): array
    {
        return Permission::where('guard_name', self::DISPLAY_GUARD)
            ->pluck('name')
            ->toArray();
    }

    /**
     * Server-side paginated + searchable list. Only `name` is a real column;
     * module/action are derived from it, and a name search (e.g. "city" or
     * "view") covers both since names are "{module}.{action}".
     */
    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Permission::query()->with('roles')
            ->where('guard_name', self::DISPLAY_GUARD);

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
            // Permissions must exist under BOTH guards: `web` backs the SPA session
            // and `sanctum` backs the API (and the display list is
            // DISPLAY_GUARD-scoped). Creating under a single guard — the request's
            // active guard, sanctum — would hide the new permission from the list
            // and leave it unusable on the other guard. Mirror the seeder and
            // RoleService: create both.
            $displayPermission = null;

            foreach ([self::DISPLAY_GUARD, 'sanctum'] as $guard) {
                $permission = Permission::create(['name' => $data['name'], 'guard_name' => $guard]);

                if ($guard === self::DISPLAY_GUARD) {
                    $displayPermission = $permission;
                }
            }

            return new PermissionResource($displayPermission->load('roles'));
        });
    }

    public function update(Permission $permission, array $data): PermissionResource
    {
        return DB::transaction(function () use ($permission, $data) {
            // The bound permission is DISPLAY_GUARD-scoped, but the same permission
            // also exists under sanctum. Rename BOTH guard rows so the name never
            // drifts between them.
            $originalName = $permission->name;

            foreach ([self::DISPLAY_GUARD, 'sanctum'] as $guard) {
                $twin = $guard === $permission->guard_name
                    ? $permission
                    : Permission::where('name', $originalName)->where('guard_name', $guard)->first();

                if (! $twin) {
                    continue;
                }

                $twin->update(['name' => $data['name']]);
            }

            return new PermissionResource($permission->fresh()->load('roles'));
        });
    }
}
