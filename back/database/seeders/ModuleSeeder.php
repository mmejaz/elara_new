<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ModuleSeeder extends Seeder
{
    /**
     * The complete sidebar/module tree — the single source of truth. Every row
     * is a SYSTEM module (code-owned, re-seedable, matched by slug). Resourceful
     * items get their CRUD permissions created and granted to Admin.
     *
     * Nesting is arbitrary: a group holds items, and an item (e.g. "All Lookups")
     * can itself hold child items.
     */
    private array $tree = [
        [
            'name' => 'Overview', 'slug' => 'overview', 'type' => 'group',
            'children' => [
                ['name' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'BarChartOutlined'],
                ['name' => 'Analytics', 'slug' => 'analytics', 'icon' => 'PieChartOutlined'],
                ['name' => 'Attendance', 'slug' => 'attendance', 'icon' => 'OrderedListOutlined'],
            ],
        ],
        [
            'name' => 'Management', 'slug' => 'management', 'type' => 'group',
            'children' => [
                ['name' => 'Users', 'slug' => 'users', 'icon' => 'TeamOutlined', 'resourceful' => true],
                ['name' => 'Roles', 'slug' => 'roles', 'icon' => 'SafetyCertificateOutlined', 'resourceful' => true],
                ['name' => 'Permissions', 'slug' => 'permissions', 'icon' => 'KeyOutlined', 'resourceful' => true],
                ['name' => 'Managed Modules', 'slug' => 'modules', 'icon' => 'AppstoreAddOutlined'],
                ['name' => 'Module Builder', 'slug' => 'module-builder', 'icon' => 'BuildOutlined'],
                ['name' => 'Tenants', 'slug' => 'tenants', 'icon' => 'CloudServerOutlined'],
                ['name' => 'Global Setting', 'slug' => 'globalsettings', 'icon' => 'AppstoreOutlined', 'resourceful' => true],
            ],
        ],
        [
            'name' => 'Account', 'slug' => 'account', 'type' => 'group',
            'children' => [
                ['name' => 'Profile', 'slug' => 'profile', 'icon' => 'UserOutlined'],
                ['name' => 'Reports', 'slug' => 'reports', 'icon' => 'FileTextOutlined'],
            ],
        ],
        [
            'name' => 'Lookups', 'slug' => 'lookups', 'type' => 'group',
            'children' => [
                [
                    'name' => 'All Lookups', 'slug' => 'all-lookups', 'icon' => 'BankOutlined',
                    'children' => [
                        ['name' => 'Application Type', 'slug' => 'applicationtypes', 'icon' => 'TeamOutlined', 'resourceful' => true],
                        ['name' => 'Country', 'slug' => 'countries', 'icon' => 'BankOutlined', 'resourceful' => true],
                        ['name' => 'City', 'slug' => 'cities', 'icon' => 'BookOutlined', 'resourceful' => true],
                        ['name' => 'Gender', 'slug' => 'genders', 'icon' => 'BookOutlined', 'resourceful' => true],
                        ['name' => 'Department', 'slug' => 'departments', 'icon' => 'TeamOutlined', 'resourceful' => true],
                        ['name' => 'Designation', 'slug' => 'designations', 'icon' => 'FileTextOutlined', 'resourceful' => true],
                        ['name' => 'Leave Type', 'slug' => 'leavetypes', 'icon' => 'FileTextOutlined', 'resourceful' => true],
                        ['name' => 'Document Type', 'slug' => 'documenttypes', 'icon' => 'CalendarOutlined', 'resourceful' => true],
                    ],
                ],
            ],
        ],
    ];

    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => 'Admin']);

        DB::transaction(function () use ($admin) {
            $this->seedNodes($this->tree, null, $admin);
        });
    }

    private function seedNodes(array $nodes, ?int $parentId, Role $admin): void
    {
        $order = 0;

        foreach ($nodes as $node) {
            // Central-only modules (tenant provisioning, module generator) are
            // never seeded into a tenant database. See config/central.php.
            if (tenancy()->initialized && in_array($node['slug'], config('central.modules', []), true)) {
                continue;
            }

            $isGroup = ($node['type'] ?? 'item') === 'group';
            $resourceful = $node['resourceful'] ?? false;

            $module = Module::updateOrCreate(
                ['slug' => $node['slug']],
                [
                    'name'           => $node['name'],
                    'type'           => $isGroup ? 'group' : 'item',
                    'icon'           => $node['icon'] ?? null,
                    'is_resourceful' => $resourceful,
                    'parent_id'      => $parentId,
                    'order'          => $order++,
                    'is_visible'     => true,
                    'is_system'      => true,
                ],
            );

            if ($resourceful) {
                $this->grantPermissions($module, $admin);
            }

            if (! empty($node['children'])) {
                $this->seedNodes($node['children'], $module->id, $admin);
            }
        }
    }

    /** Create the module's CRUD permissions and grant them to Admin (Super Admin bypasses). */
    private function grantPermissions(Module $module, Role $admin): void
    {
        $names = $module->permissionNames();

        foreach ($names as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        $admin->givePermissionTo($names);
    }
}
