<?php

namespace Database\Seeders;

use App\Models\LeaveType;
use Illuminate\Database\Seeder;

/**
 * Leave type lookup starter data. Idempotent — firstOrCreate keyed on name — so
 * it's safe on every deploy and every tenant re-seed. Called from
 * ReferenceDataSeeder (central + per-tenant), and runnable on its own:
 *
 *     php artisan db:seed --class=LeaveTypeSeeder
 *     php artisan tenants:seed --class=LeaveTypeSeeder
 */
class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->leaveTypes() as $leaveType) {
            LeaveType::firstOrCreate(['name' => $leaveType]);
        }
    }

    /** A practical starter list; extend per install as needed. */
    private function leaveTypes(): array
    {
        return [
            'Annual Leave',
            'Casual Leave',
            'Sick Leave',
            'Maternity Leave',
            'Paternity Leave',
            'Parental Leave',
            'Bereavement Leave',
            'Marriage Leave',
            'Unpaid Leave',
            'Compensatory Off',
            'Public Holiday',
            'Study Leave',
            'Sabbatical',
            'Work From Home',
            'Other',
        ];
    }
}
