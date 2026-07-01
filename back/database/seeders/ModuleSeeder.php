<?php

namespace Database\Seeders;

use App\Models\Module;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ModuleSeeder extends Seeder
{
    /**
     * Seed the sidebar structure that currently lives in the frontend's
     * config/navigation.jsx. Every row here is a SYSTEM module (is_system =
     * true) — code-owned, re-seedable, and protected from deletion.
     *
     * The nested array IS the single source of truth; re-running this seeder
     * keeps the DB in sync without duplicating rows (matched by slug).
     */
    private array $tree = [
        [
            'name' => 'Overview', 'slug' => 'overview', 'type' => 'group',
            'children' => [
                ['name' => 'Dashboard', 'slug' => 'dashboard', 'icon' => 'BarChartOutlined', 'resourceful' => false],
                ['name' => 'Analytics', 'slug' => 'analytics', 'icon' => 'PieChartOutlined', 'resourceful' => false],
                ['name' => 'Attendance', 'slug' => 'attendance', 'icon' => 'OrderedListOutlined', 'resourceful' => false],
            ],
        ],
        [
            'name' => 'Management', 'slug' => 'management', 'type' => 'group',
            'children' => [
                ['name' => 'Users', 'slug' => 'users', 'icon' => 'TeamOutlined', 'resourceful' => true],
                ['name' => 'Roles', 'slug' => 'roles', 'icon' => 'SafetyCertificateOutlined', 'resourceful' => true],
                ['name' => 'Permissions', 'slug' => 'permissions', 'icon' => 'KeyOutlined', 'resourceful' => true],
                ['name' => 'Managed Modules', 'slug' => 'modules', 'icon' => 'AppstoreAddOutlined', 'resourceful' => false],
                ['name' => 'Module Builder', 'slug' => 'module-builder', 'icon' => 'BuildOutlined', 'resourceful' => false],
            ],
        ],
        [
            'name' => 'Account', 'slug' => 'account', 'type' => 'group',
            'children' => [
                ['name' => 'Profile', 'slug' => 'profile', 'icon' => 'UserOutlined', 'resourceful' => false],
                ['name' => 'Reports', 'slug' => 'reports', 'icon' => 'FileTextOutlined', 'resourceful' => false],
            ],
        ],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            $groupOrder = 0;

            foreach ($this->tree as $group) {
                $parent = Module::updateOrCreate(
                    ['slug' => $group['slug']],
                    [
                        'name'           => $group['name'],
                        'type'           => 'group',
                        'icon'           => null,
                        'is_resourceful' => false,
                        'parent_id'      => null,
                        'order'          => $groupOrder++,
                        'is_visible'     => true,
                        'is_system'      => true,
                    ],
                );

                $childOrder = 0;

                foreach ($group['children'] as $child) {
                    Module::updateOrCreate(
                        ['slug' => $child['slug']],
                        [
                            'name'           => $child['name'],
                            'type'           => 'item',
                            'icon'           => $child['icon'],
                            'is_resourceful' => $child['resourceful'],
                            'parent_id'      => $parent->id,
                            'order'          => $childOrder++,
                            'is_visible'     => true,
                            'is_system'      => true,
                        ],
                    );
                }
            }
        });
    }
}
