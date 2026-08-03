<?php

declare(strict_types=1);

namespace App\Models;

use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    /**
     * Real table columns. Anything not listed here is stored in the `data` JSON
     * column by the package; `name` and `status` are promoted to real columns
     * (see the add_name_and_status_to_tenants_table migration) so they can be
     * queried and indexed.
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'status',
        ];
    }
}
