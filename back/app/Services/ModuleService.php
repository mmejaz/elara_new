<?php

namespace App\Services;

use App\Http\Resources\ModuleResource;
use App\Models\Module;
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

    /** Update a module (e.g. toggle active/inactive visibility). */
    public function update(Module $module, array $data): ModuleResource
    {
        $module->update($data);

        return new ModuleResource($module);
    }

    /** Nested, ordered, visible tree for the sidebar. */
    public function tree()
    {
        return ModuleResource::collection(
            Module::roots()->visible()->ordered()
                ->with('childrenRecursive')
                ->get()
        );
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
                'name'           => trim($data['name']),
                'slug'           => $slug,
                'icon'           => $data['icon'] ?? null,
                'type'           => $data['type'],
                'is_resourceful' => $isResourceful,
                'parent_id'      => $parentId,
                'order'          => $this->nextOrder($parentId),
                'is_visible'     => true,
                'is_system'      => false,
                'description'    => $data['description'] ?? null,
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

        foreach ($names as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Grant the new CRUD permissions to the Admin role so the module is
        // usable immediately (Super Admin already bypasses all gates).
        $admin = Role::where('name', 'Admin')->first();
        $admin?->givePermissionTo($names);
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
