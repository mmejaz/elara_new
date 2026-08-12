<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Guards which roles the acting user is allowed to hand out.
 *
 * "Super Admin" carries the Gate::before bypass (AppServiceProvider), so only an
 * existing Super Admin may grant it. Without this, anyone with users.create /
 * users.edit — e.g. the Admin role every tenant owner holds — could assign
 * themselves Super Admin and escalate to unconditional access.
 *
 * Shared by StoreUserRequest and UpdateUserRequest so the two can't drift.
 */
class AssignableRole implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $isSuperAdminRole = Str::lower(trim((string) $value)) === 'super admin';

        if ($isSuperAdminRole && ! Auth::user()?->hasRole('Super Admin')) {
            $fail('You are not allowed to assign the Super Admin role.');
        }
    }
}
