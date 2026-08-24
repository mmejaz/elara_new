<?php

namespace App\Services;

use App\Http\Resources\ModuleResource;
use App\Models\Module;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ModuleService
{
    public function __construct(private ModuleGeneratorService $generator) {}

    /** Flat list for the Module Builder table. */
    public function getAll()
    {
        return ModuleResource::collection(
            Module::ordered()->get()
        );
    }

    /** Server-side paginated + searchable list for the Module Builder table. */
    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Module::query();

        if (! empty($params['search'])) {
            $query->where('name', 'like', '%'.$params['search'].'%');
        }

        $sortable = ['name', 'created_at', 'id', 'order'];
        $sortBy = in_array($params['sort_by'] ?? '', $sortable, true) ? $params['sort_by'] : 'order';
        $sortDir = ($params['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));
    }

    /**
     * Slugs every signed-in user may reach regardless of permissions —
     * self-service pages. Mirrors the frontend ModuleAccessGuard allow-list.
     */
    private const ALWAYS_ALLOWED = ['profile'];

    /**
     * Nested, ordered, visible tree for the sidebar, PRUNED to what the current
     * user may access. A leaf item survives only if the user holds its
     * "{module}.view" permission (or it is an always-allowed self-service page);
     * a parent/group survives only if at least one descendant does. Super Admin
     * (Gate::before) sees the whole tree, including modules that have no
     * permission of their own (e.g. system tools).
     */
    public function tree()
    {
        $roots = Module::roots()->visible()->ordered()
            ->with('childrenRecursive')
            ->get();

        $user = auth()->user();

        // Super Admin bypasses every gate → full tree, untouched.
        if ($user && $user->hasRole('Super Admin')) {
            return ModuleResource::collection($roots);
        }

        // Permission NAMES the user holds (guard-agnostic — the same role lives
        // under both `web` and `sanctum`, so flatten to a name set).
        $permitted = $user
            ? $user->getAllPermissions()->pluck('name')->unique()->flip()
            : collect();

        return ModuleResource::collection($this->pruneForPermissions($roots, $permitted));
    }

    /**
     * Recursively drop modules the user cannot view. Parents are judged AFTER
     * their children, so a group keeps its slot only when something inside it
     * survived.
     */
    private function pruneForPermissions($modules, $permitted)
    {
        return $modules
            ->filter(function (Module $module) use ($permitted) {
                $keptChildren = $this->pruneForPermissions($module->childrenRecursive, $permitted);
                $module->setRelation('childrenRecursive', $keptChildren);

                // A container with any surviving child always stays.
                if ($keptChildren->isNotEmpty()) {
                    return true;
                }

                // Self-service pages are always reachable.
                if (in_array($module->slug, self::ALWAYS_ALLOWED, true)) {
                    return true;
                }

                // Leaf: keep only if the user holds this module's view permission.
                return $permitted->has(Str::snake($module->name).'.view');
            })
            ->values();
    }

    /**
     * Create a module. For a resourceful menu item this also creates the
     * permissions and generates the full file set, then migrates.
     */
    public function create(array $data): ModuleResource
    {
        $isResourceful = ($data['type'] === 'item') && ! empty($data['resourceful']);

        // 1. Persist the module row (DB transaction).
        $module = DB::transaction(function () use ($data, $isResourceful) {
            $parentId = $this->resolveParentId($data['parent'] ?? null);
            $slug = $isResourceful
                ? Str::slug(Str::pluralStudly(Str::studly(Str::singular($data['name']))))
                : Str::slug($data['name']);

            return Module::create([
                'name' => trim($data['name']),
                'slug' => $slug,
                'icon' => $data['icon'] ?? null,
                'type' => $data['type'],
                'is_resourceful' => $isResourceful,
                'parent_id' => $parentId,
                'order' => $this->nextOrder($parentId),
                'is_visible' => true,
                'is_system' => false,
                'description' => $data['description'] ?? null,
            ]);
        });

        // 2. Non-resourceful (group / parent menu): row only, done.
        if (! $isResourceful) {
            return new ModuleResource($module);
        }

        // 3. Resourceful: permissions + file generation + migrate, with rollback.
        try {
            $this->createPermissions($module);
            $this->generator->generate($module);
            Artisan::call('migrate', ['--force' => true]);
            Artisan::call('route:clear');
        } catch (\Throwable $e) {
            $this->generator->rollback();
            $this->dropTableIfExists($this->generator->tableName());
            $this->deletePermissions($module);
            $module->forceDelete();
            throw $e;
        }

        return new ModuleResource($module);
    }

    /** Update a module (e.g. toggle active/inactive visibility). */
    public function update(Module $module, array $data): ModuleResource
    {
        return DB::transaction(function () use ($module, $data) {
            $module->update($data);

            return new ModuleResource($module);
        });
    }

    // ───────────────────────────────────────────────────────── helpers ────

    /** Map the frontend parent value ("group:Management" | "/users") to an id. */
    private function resolveParentId(?string $parent): ?int
    {
        if (! $parent) {
            return null;
        }

        $slug = str_starts_with($parent, 'group:')
            ? Str::slug(substr($parent, 6))
            : ltrim($parent, '/');

        return Module::where('slug', $slug)->value('id');
    }

    private function nextOrder(?int $parentId): int
    {
        return (int) Module::where('parent_id', $parentId)->max('order') + 1;
    }

    private function createPermissions(Module $module): void
    {
        $names = $module->permissionNames();

        // Create permissions for both 'web' and 'sanctum' guards
        foreach (['web', 'sanctum'] as $guard) {
            foreach ($names as $name) {
                Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
            }
        }

        // Grant the new CRUD permissions to the Admin role for both guards
        // so the module is usable immediately (Super Admin already bypasses all gates).
        foreach (['web', 'sanctum'] as $guard) {
            $admin = Role::where('name', 'Admin')->where('guard_name', $guard)->first();
            if ($admin) {
                $admin->givePermissionTo(
                    Permission::whereIn('name', $names)->where('guard_name', $guard)->get()
                );
            }
        }
    }

    private function deletePermissions(Module $module): void
    {
        Permission::whereIn('name', $module->permissionNames())->delete();
    }

    private function dropTableIfExists(string $table): void
    {
        if (Schema::hasTable($table)) {
            Schema::drop($table);
        }
    }
}
