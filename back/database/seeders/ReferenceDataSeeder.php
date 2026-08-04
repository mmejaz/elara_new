<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Gender;
use Illuminate\Database\Seeder;

/**
 * Universal reference lookups (genders, countries). Idempotent — firstOrCreate
 * keyed on name — so it's safe on every deploy and every tenant re-seed. Runs in
 * both the central DatabaseSeeder and the per-tenant TenantDatabaseSeeder so the
 * Lookups management screens have sensible starter data instead of empty tables.
 *
 * Cities and application types are intentionally NOT seeded here: cities are
 * country-specific (too many to seed generically) and application types are a
 * domain-specific concept — both are meant to be entered per install.
 */
class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Male', 'Female', 'Other', 'Prefer not to say'] as $gender) {
            Gender::firstOrCreate(['name' => $gender]);
        }

        foreach ($this->countries() as $country) {
            Country::firstOrCreate(['name' => $country]);
        }
    }

    /** A practical starter list; extend per install as needed. */
    private function countries(): array
    {
        return [
            'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Egypt',
            'France', 'Germany', 'India', 'Indonesia', 'Ireland', 'Italy',
            'Japan', 'Kenya', 'Malaysia', 'Mexico', 'Netherlands', 'New Zealand',
            'Nigeria', 'Pakistan', 'Philippines', 'Poland', 'Qatar', 'Saudi Arabia',
            'Singapore', 'South Africa', 'South Korea', 'Spain', 'Sweden',
            'Switzerland', 'Turkey', 'United Arab Emirates', 'United Kingdom',
            'United States',
        ];
    }
}
