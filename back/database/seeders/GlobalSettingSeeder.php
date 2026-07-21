<?php

namespace Database\Seeders;

use App\Models\GlobalSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GlobalSettingSeeder extends Seeder
{
    /**
     * The canonical set of settings "applications". Each is a named container
     * with a well-scoped schema of fields; fields live in the app they belong to
     * (branding assets under Branding, formats under General Settings, etc.).
     *
     * Matched by name and re-seedable — fields are synced (renamed/removed ones
     * are dropped) so this array stays the single source of truth. Optional
     * `values` seed one example value-set so an app reads as "Configured".
     */
    private array $apps = [
        [
            'name'   => 'Branding',
            'fields' => [
                ['label' => 'Company Name', 'type' => 'text', 'required' => true],
                ['label' => 'Logo (Light)', 'type' => 'image', 'required' => false],
                ['label' => 'Logo (Dark)', 'type' => 'image', 'required' => false],
                ['label' => 'Favicon', 'type' => 'image', 'required' => false],
                ['label' => 'Support Email', 'type' => 'text', 'required' => false],
                ['label' => 'Support Contact Number', 'type' => 'text', 'required' => false],
            ],
            'values' => [
                'company_name'           => 'Elara',
                'support_email'          => 'support@elara.test',
                'support_contact_number' => '+1 (555) 010-0100',
            ],
        ],
        [
            'name'   => 'General Settings',
            'fields' => [
                ['label' => 'Currency', 'type' => 'dropdown', 'options' => ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'AED', 'SAR'], 'required' => true],
                ['label' => 'Number Format', 'type' => 'dropdown', 'options' => ['1,234.56', '1.234,56', '1 234.56', '1234.56'], 'required' => true],
                ['label' => 'Phone Number Format', 'type' => 'dropdown', 'options' => ['+# (###) ###-####', '+## ### #######', '(###) ###-####', '###-###-####'], 'required' => true],
                ['label' => 'Date Format', 'type' => 'dropdown', 'options' => ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MMMM D, YYYY'], 'required' => true],
                ['label' => 'Time Format', 'type' => 'dropdown', 'options' => ['hh:mm A', 'HH:mm', 'hh:mm:ss A', 'HH:mm:ss'], 'required' => true],
                ['label' => 'Date and Time Format', 'type' => 'dropdown', 'options' => ['YYYY-MM-DD HH:mm', 'DD/MM/YYYY hh:mm A', 'MMM D, YYYY h:mm A', 'DD-MM-YYYY HH:mm'], 'required' => true],
                ['label' => 'Records Per Page', 'type' => 'dropdown', 'options' => ['10', '15', '25', '50', '100'], 'required' => true],
                ['label' => 'File Size', 'type' => 'number', 'required' => true],
                ['label' => 'File Format', 'type' => 'text', 'required' => false],
            ],
            'values' => [
                'currency'             => 'USD',
                'number_format'        => '1,234.56',
                'phone_number_format'  => '+# (###) ###-####',
                'date_format'          => 'YYYY-MM-DD',
                'time_format'          => 'hh:mm A',
                'date_and_time_format' => 'YYYY-MM-DD HH:mm',
                'records_per_page'     => '10',
                'file_size'            => 10,
                'file_format'          => 'jpg,png,pdf,docx',
            ],
        ],
        [
            'name'   => 'SMTP',
            'fields' => [
                ['label' => 'Host', 'type' => 'text', 'required' => true],
                ['label' => 'Port', 'type' => 'number', 'required' => true],
                ['label' => 'Username', 'type' => 'text', 'required' => true],
                ['label' => 'Password', 'type' => 'password', 'required' => true],
                ['label' => 'Encryption', 'type' => 'dropdown', 'options' => ['ssl', 'tls', 'none'], 'required' => true],
                ['label' => 'From Name', 'type' => 'text', 'required' => false],
            ],
        ],
        [
            'name'   => 'Payment Gateway',
            'fields' => [
                ['label' => 'Provider', 'type' => 'dropdown', 'options' => ['Stripe', 'PayPal', 'Razorpay'], 'required' => true],
                ['label' => 'API Key', 'type' => 'text', 'required' => true],
                ['label' => 'Secret Key', 'type' => 'password', 'required' => true],
                ['label' => 'Mode', 'type' => 'dropdown', 'options' => ['test', 'live'], 'required' => true],
                ['label' => 'Webhook URL', 'type' => 'text', 'required' => false],
            ],
        ],
    ];

    public function run(): void
    {
        DB::transaction(function () {
            foreach ($this->apps as $index => $app) {
                $setting = GlobalSetting::updateOrCreate(['name' => $app['name']]);

                // Sync the field schema: upsert defined fields, drop any others.
                $keys = [];
                foreach ($app['fields'] as $i => $field) {
                    $key = Str::snake($field['label']);
                    $keys[] = $key;

                    $setting->fields()->updateOrCreate(
                        ['key' => $key],
                        [
                            'label'       => $field['label'],
                            'type'        => $field['type'],
                            'options'     => $field['options'] ?? null,
                            'is_required' => $field['required'] ?? false,
                            'sort_order'  => $i,
                        ],
                    );
                }
                $setting->fields()->whereNotIn('key', $keys)->delete();

                // Seed example values — backfills missing keys (e.g. newly added
                // fields) without overwriting values already entered.
                if (! empty($app['values'])) {
                    $record = $setting->records()->first();

                    if ($record) {
                        $record->update(['data' => array_merge($app['values'], $record->data ?? [])]);
                    } else {
                        $setting->records()->create(['data' => $app['values']]);
                    }
                }
            }
        });
    }
}
