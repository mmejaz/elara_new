<?php

namespace App\Models;

use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

/**
 * A tenant = one customer with its own database + domain(s).
 *
 * Wizard fields (name, email, phone, timezone, currency, language, status,
 * logo_path, and the transient admin_email/admin_password consumed by the tenant
 * seeder) are stored in the `data` JSON column via Stancl's virtual-column
 * pattern — no schema change needed to add a field.
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    public function isActive(): bool
    {
        return ($this->status ?? 'active') === 'active';
    }
}
