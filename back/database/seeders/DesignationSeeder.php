<?php

namespace Database\Seeders;

use App\Models\Designation;
use Illuminate\Database\Seeder;

/**
 * Designation lookup starter data. Idempotent — firstOrCreate keyed on name — so
 * it's safe on every deploy and every tenant re-seed. Called from
 * ReferenceDataSeeder (central + per-tenant), and runnable on its own:
 *
 *     php artisan db:seed --class=DesignationSeeder
 *     php artisan tenants:seed --class=DesignationSeeder
 */
class DesignationSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->designations() as $designation) {
            Designation::firstOrCreate(['name' => $designation]);
        }
    }

    /** A practical starter list; extend per install as needed. */
    private function designations(): array
    {
        return [
            'Chief Executive Officer',
            'Chief Operating Officer',
            'Chief Financial Officer',
            'Chief Technology Officer',
            'Director',
            'General Manager',
            'Manager',
            'Assistant Manager',
            'Team Lead',
            'Supervisor',
            'Senior Software Engineer',
            'Software Engineer',
            'Junior Software Engineer',
            'QA Engineer',
            'Business Analyst',
            'Project Manager',
            'Product Manager',
            'UI/UX Designer',
            'HR Executive',
            'Accountant',
            'Sales Executive',
            'Marketing Executive',
            'Customer Support Executive',
            'Administrative Assistant',
            'Intern',
        ];
    }
}
