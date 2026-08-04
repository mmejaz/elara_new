<?php

namespace Tests\Feature;

use Database\Seeders\ModuleSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Guards against permission-name drift. Module permission names are derived from
 * the module display name (Module::permissionNames → Str::snake($name)), while
 * route guards hardcode strings like `permission:application_type.view`. The two
 * agree only by coincidence — a label edit in ModuleSeeder would silently make
 * every route for that module 403 all non-Super-Admins, with no error at seed
 * time. This test fails loudly if any route requires a permission nobody seeds.
 */
class PermissionConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_route_permission_middleware_has_a_seeded_permission(): void
    {
        $this->seed(RolePermissionSeeder::class);
        $this->seed(ModuleSeeder::class);

        $seeded = Permission::pluck('name')->all();

        $required = collect(Route::getRoutes()->getRoutes())
            ->flatMap(fn ($route) => $route->gatherMiddleware())
            ->filter(fn ($m) => is_string($m) && str_starts_with($m, 'permission:'))
            ->map(fn ($m) => substr($m, strlen('permission:')))
            // A single middleware may OR several permissions: permission:a|b
            ->flatMap(fn ($p) => explode('|', $p))
            ->unique()
            ->values();

        $this->assertNotEmpty($required, 'Expected at least one permission-gated route to exist.');

        $missing = $required->reject(fn ($p) => in_array($p, $seeded, true))->values()->all();

        $this->assertEmpty(
            $missing,
            'Route permissions with no matching seeded permission (these 403 every '
            . 'non-Super-Admin): ' . implode(', ', $missing),
        );
    }
}
