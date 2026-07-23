<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Central-side tenant management. `create()` persists the tenant + its domain in
 * the central DB; Stancl's TenantCreated pipeline then provisions the tenant
 * database (create → migrate → seed first admin) automatically.
 */
class TenantService
{
    public function paginate(int $perPage = 15)
    {
        return Tenant::with('domains')->latest()->paginate($perPage);
    }

    public function create(array $data): Tenant
    {
        $connection = config('tenancy.database.central_connection');

        return DB::connection($connection)->transaction(function () use ($data) {
            // Readable, safe id → becomes the DB name suffix (prefix from config).
            $id = $data['id']
                ?? Str::of($data['domain'])->before('.')->slug()->toString();

            $tenant = Tenant::create([
                'id'       => $id,
                'name'     => $data['name'],
                'status'   => $data['status'] ?? 'active',
                'email'    => $data['email'] ?? null,
                'phone'    => $data['phone'] ?? null,
                'timezone' => $data['timezone'] ?? 'UTC',
                'currency' => $data['currency'] ?? 'USD',
                'language' => $data['language'] ?? 'en',
                // Consumed by TenantDatabaseSeeder. NOTE: stored in the tenant's
                // `data` JSON — in production, rotate/clear after provisioning.
                'admin_name'     => $data['admin_name'] ?? 'Administrator',
                'admin_email'    => $data['admin_email'],
                'admin_password' => $data['admin_password'],
            ]);

            $tenant->domains()->create(['domain' => $data['domain']]);

            return $tenant->fresh('domains');
        });
    }

    public function setStatus(Tenant $tenant, string $status): Tenant
    {
        $tenant->update(['status' => $status]);

        return $tenant->fresh('domains');
    }

    public function delete(Tenant $tenant): void
    {
        // Firing TenantDeleted → DeleteDatabase job drops the tenant database.
        $tenant->delete();
    }
}
