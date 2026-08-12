<?php

namespace Database\Seeders;

use App\Models\Organization;
use Illuminate\Database\Seeder;

/**
 * The one default Organization a fresh install needs so the app is immediately
 * usable. Idempotent — firstOrCreate keyed on name — so `db:seed` can run any
 * number of times without ever creating a second organization.
 *
 * The organizations table is name-only (id, name, timestamps), so `name` is the
 * natural key. No other fields are invented here — when the model gains columns
 * (code, email, status, …) add their defaults to the second argument.
 *
 *     php artisan db:seed --class=OrganizationSeeder
 */
class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        Organization::firstOrCreate(['name' => 'Default Organization']);
    }
}
