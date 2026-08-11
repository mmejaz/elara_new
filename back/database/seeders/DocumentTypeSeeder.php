<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;

/**
 * Document type lookup starter data. Idempotent — firstOrCreate keyed on name —
 * so it's safe on every deploy and every tenant re-seed. Called from
 * ReferenceDataSeeder (central + per-tenant), and runnable on its own:
 *
 *     php artisan db:seed --class=DocumentTypeSeeder
 *     php artisan tenants:seed --class=DocumentTypeSeeder
 *
 * The identity documents (CNIC, NICOP, B-Form, Domicile, FRC) are Pakistan
 * specific; swap them for the local equivalents on a non-PK install.
 */
class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->documentTypes() as $documentType) {
            DocumentType::firstOrCreate(['name' => $documentType]);
        }
    }

    /** A practical starter list; extend per install as needed. */
    private function documentTypes(): array
    {
        return [
            // Identity
            'CNIC',
            'NICOP',
            'B-Form',
            'Passport',
            'Driving License',
            'Domicile Certificate',
            'Family Registration Certificate',

            // Education
            'Matriculation Certificate',
            'Intermediate Certificate',
            'Degree Certificate',
            'Academic Transcript',

            // Employment
            'Resume / CV',
            'Offer Letter',
            'Employment Contract',
            'Experience Letter',
            'Relieving Letter',
            'Salary Slip',

            // Financial
            'NTN Certificate',
            'Bank Statement',
            'Cancelled Cheque',

            // Travel & clearance
            'Visa',
            'Work Permit',
            'Police Character Certificate',
            'Medical Certificate',

            // Misc
            'Photograph',
            'Utility Bill',
            'Other',
        ];
    }
}
