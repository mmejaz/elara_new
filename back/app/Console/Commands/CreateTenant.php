<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\GlobalSettingSeeder;
use Database\Seeders\ModuleSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateTenant extends Command
{
    protected $signature = 'tenant:create
        {slug : Subdomain-safe tenant id, e.g. acme}
        {name : Human-readable name, e.g. "Acme Inc"}
        {admin-email : Email for the first admin user}';

    protected $description = 'Provision a tenant: database, migrations, seed data, and first admin user';

    public function handle(): int
    {
        $slug  = strtolower(trim((string) $this->argument('slug')));
        $name  = trim((string) $this->argument('name'));
        $email = strtolower(trim((string) $this->argument('admin-email')));

        $validator = Validator::make(
            compact('slug', 'name', 'email'),
            [
                'slug'  => ['required', 'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/'],
                'name'  => ['required', 'string', 'max:255'],
                'email' => ['required', 'email'],
            ],
            ['slug.regex' => 'The slug must be a valid subdomain label (lowercase letters, digits, hyphens; not starting/ending with a hyphen).'],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        if (Tenant::find($slug)) {
            $this->error("A tenant with id [{$slug}] already exists.");

            return self::FAILURE;
        }

        $centralDomain = config('tenancy.central_domains')[0] ?? 'lvh.me';
        $domain = "{$slug}.{$centralDomain}";

        $this->info("Provisioning tenant [{$slug}] at {$domain} ...");

        // Generated up front so it is available for the summary after seeding.
        $password = Str::password(16);
        $tenant = null;

        try {
            // Creating the tenant fires TenantCreated -> CreateDatabase +
            // MigrateDatabase (synchronous), so the tenant database exists and is
            // migrated by the time create() returns.
            $tenant = Tenant::create([
                'id'     => $slug,
                'name'   => $name,
                'status' => 'active',
            ]);
            $tenant->domains()->create(['domain' => $domain]);
            $this->line('  - database created and migrated');

            tenancy()->initialize($tenant);

            try {
                Artisan::call('db:seed', ['--class' => RolePermissionSeeder::class, '--force' => true]);
                Artisan::call('db:seed', ['--class' => ModuleSeeder::class, '--force' => true]);
                Artisan::call('db:seed', ['--class' => GlobalSettingSeeder::class, '--force' => true]);
                $this->line('  - seeded roles, permissions, modules, settings');

                $admin = User::create([
                    'name'     => 'Administrator',
                    'email'    => $email,
                    'password' => $password,
                ]);
                $admin->assignRole('Super Admin');
                $this->line('  - created admin user');
            } finally {
                tenancy()->end();
            }
        } catch (\Throwable $e) {
            $this->error("Provisioning failed: {$e->getMessage()}");

            if ($tenant) {
                // Fires TenantDeleted -> DeleteDatabase, cleaning up the
                // half-provisioned tenant so a retry starts clean.
                $tenant->delete();
                $this->warn('  Rolled back: the tenant and its database were removed.');
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->info("Tenant [{$slug}] provisioned.");
        $this->table(['Field', 'Value'], [
            ['URL',      "http://{$domain}:5173"],
            ['API',      "http://{$domain}:8000/api"],
            ['Admin',    $email],
            ['Password', $password],
        ]);
        $this->warn('Save the password now — it is shown once and stored nowhere.');

        return self::SUCCESS;
    }
}
