<?php

namespace App\Services;

use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Support\DepartmentMode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Central-side tenant management. `create()` persists the tenant + its domain in
 * the central DB; Stancl's TenantCreated pipeline then provisions the tenant
 * database (create → migrate → seed first admin) automatically.
 */
class TenantService
{
    /**
     * Server-side paginated + searchable tenant list.
     *
     * Only id/created_at/updated_at are real columns — Stancl keeps every custom
     * attribute (name, status, email, …) inside the `data` JSON column, so those
     * are filtered and sorted through JSON paths rather than plain columns.
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $query = Tenant::query()->with('domains');

        if (! empty($params['search'])) {
            $search = '%'.$params['search'].'%';

            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', $search)
                    ->orWhere('data->name', 'like', $search)
                    ->orWhere('data->email', 'like', $search)
                    ->orWhere('data->phone', 'like', $search)
                    ->orWhereHas('domains', fn ($d) => $d->where('domain', 'like', $search));
            });
        }

        // Maps the column key the table sends to something SQL can order by.
        $sortable = [
            'id' => 'id',
            'name' => 'data->name',
            'status' => 'data->status',
            'email' => 'data->email',
            'timezone' => 'data->timezone',
            'currency' => 'data->currency',
            'created_at' => 'created_at',
        ];

        $sortBy = $sortable[$params['sort_by'] ?? ''] ?? 'created_at';
        $sortDir = ($params['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy($sortBy, $sortDir)
            ->paginate((int) ($params['per_page'] ?? 15));
    }

    /** A single tenant with its domains, for the detail view. */
    public function show(Tenant $tenant): TenantResource
    {
        return new TenantResource($tenant->load('domains'));
    }

    public function create(array $data): TenantResource
    {
        // NOT wrapped in a DB::transaction — deliberately. Tenant::create fires
        // Stancl's TenantCreated pipeline, which QUEUES the CreateDatabase job.
        // A job dispatched inside a transaction is pushed before the row commits,
        // so the queue worker would race an un-committed tenant and provisioning
        // would silently fail. Keep the two inserts unwrapped so the row is
        // visible the moment the job runs.
        // Readable, safe id → becomes the DB name suffix (prefix from config).
        $id = $data['id']
            ?? Str::of($data['domain'])->before('.')->slug()->toString();

        $tenant = Tenant::create([
            'id' => $id,
            'name' => $data['name'],
            'status' => $data['status'] ?? 'active',
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'timezone' => $data['timezone'] ?? 'UTC',
            'currency' => $data['currency'] ?? 'USD',
            'language' => $data['language'] ?? 'en',
            // How this client treats departments — chosen once at provisioning.
            // Read in tenant context via App\Support\DepartmentMode::current().
            'department_mode' => $data['department_mode'] ?? DepartmentMode::FLEXIBLE,
            // Consumed by TenantDatabaseSeeder. NOTE: stored in the tenant's
            // `data` JSON — in production, rotate/clear after provisioning.
            'admin_name' => $data['admin_name'] ?? 'Administrator',
            'admin_email' => $data['admin_email'],
            'admin_password' => $data['admin_password'],
        ]);

        $tenant->domains()->create(['domain' => $data['domain']]);

        return new TenantResource($tenant->fresh('domains'));
    }

    public function setStatus(Tenant $tenant, string $status): TenantResource
    {
        return DB::transaction(function () use ($tenant, $status) {
            $tenant->update(['status' => $status]);

            return new TenantResource($tenant->fresh('domains'));
        });
    }

    public function delete(Tenant $tenant): void
    {
        // Also unwrapped (see create): TenantDeleted queues DeleteDatabase, which
        // must see the committed row — and DROP DATABASE is DDL that can't live in
        // a transaction anyway.
        $tenant->delete();
    }
}
