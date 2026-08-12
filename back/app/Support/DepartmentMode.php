<?php

declare(strict_types=1);

namespace App\Support;

/**
 * How a tenant treats departments — chosen once at provisioning, stored on the
 * tenant's `data` (department_mode), and read here in tenant context.
 *
 *   shared    Departments are tenant-wide; the organization field is hidden and
 *             every department is saved with organization_id = NULL.
 *   scoped    Every department belongs to one organization; an organization is
 *             required.
 *   flexible  The organization is optional — empty = shared, chosen = scoped.
 *
 * Defaults to `flexible` for the central context or any tenant that never set a
 * value, so an unset mode never blocks anyone.
 */
final class DepartmentMode
{
    public const SHARED = 'shared';
    public const SCOPED = 'scoped';
    public const FLEXIBLE = 'flexible';

    public const ALL = [self::SHARED, self::SCOPED, self::FLEXIBLE];

    public static function current(): string
    {
        $mode = tenancy()->initialized ? (tenant()->department_mode ?? null) : null;

        return in_array($mode, self::ALL, true) ? $mode : self::FLEXIBLE;
    }

    /**
     * Validation rules for a department's organization_id under the current
     * mode. Shared accepts nothing meaningful (the service forces NULL); scoped
     * requires an organization; flexible allows either.
     */
    public static function organizationRule(): array
    {
        return match (self::current()) {
            self::SCOPED => ['required', 'integer', 'exists:organizations,id'],
            self::SHARED => ['nullable'],
            default      => ['nullable', 'integer', 'exists:organizations,id'],
        };
    }
}
