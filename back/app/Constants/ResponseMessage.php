<?php

namespace App\Constants;

class ResponseMessage
{
    // CRUD
    public const CREATED = 'Record created successfully.';

    public const UPDATED = 'Record updated successfully.';

    public const DELETED = 'Record deleted successfully.';

    public const FETCHED = 'Record fetched successfully.';

    // Auth
    public const LOGIN_SUCCESS = 'Login successful.';

    public const LOGOUT_SUCCESS = 'Logout successful.';

    // Tenancy
    public const TENANT_VERIFIED = 'Tenant verified.';

    public const TENANT_NOT_FOUND = 'Tenant not found.';

    // Impersonation
    public const IMPERSONATION_STARTED = 'Impersonation started.';

    public const IMPERSONATION_STOPPED = 'Returned to your account.';

    // Errors
    public const NOT_FOUND = 'Record not found.';

    public const VALIDATION_FAILED = 'Validation failed.';

    public const UNAUTHENTICATED = 'Unauthenticated.';

    public const UNAUTHORIZED = 'This action is unauthorized.';

    public const TOO_MANY_ATTEMPTS = 'Too many attempts. Please try again later.';

    public const SERVER_ERROR = 'Server error.';
}
