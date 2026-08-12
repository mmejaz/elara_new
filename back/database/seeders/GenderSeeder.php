<?php

namespace Database\Seeders;

use App\Models\Gender;
use Illuminate\Database\Seeder;

/**
 * Gender lookup starter data. Idempotent — firstOrCreate keyed on name — so it's
 * safe on every deploy and every tenant re-seed. Called from ReferenceDataSeeder
 * (central + per-tenant), and runnable on its own:
 *
 *     php artisan db:seed --class=GenderSeeder
 *     php artisan tenants:seed --class=GenderSeeder
 */
class GenderSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->genders() as $gender) {
            Gender::firstOrCreate(['name' => $gender]);
        }
    }

    /** A practical starter list; extend per install as needed. */
    private function genders(): array
    {
        return ['Male', 'Female', 'Other', 'Prefer not to say'];
    }
}
