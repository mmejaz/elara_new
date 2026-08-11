<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

/**
 * Department lookup starter data. Idempotent — firstOrCreate keyed on name — so
 * it's safe on every deploy and every tenant re-seed. Called from
 * ReferenceDataSeeder (central + per-tenant), and runnable on its own:
 *
 *     php artisan db:seed --class=DepartmentSeeder
 *     php artisan tenants:seed --class=DepartmentSeeder
 */
class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->departments() as $department) {
            Department::firstOrCreate(['name' => $department]);
        }
    }

    /** A practical starter list; extend per install as needed. */
    private function departments(): array
    {
        return [
            'Executive',
            'Human Resources',
            'Finance',
            'Accounts',
            'Administration',
            'Information Technology',
            'Engineering',
            'Quality Assurance',
            'Product',
            'Design',
            'Sales',
            'Marketing',
            'Customer Support',
            'Operations',
            'Procurement',
            'Legal',
            'Research and Development',
            'Training and Development',
        ];
    }
}
