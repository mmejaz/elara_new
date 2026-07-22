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
    public const LOGIN_SUCCESS  = 'Login successful.';
    public const LOGOUT_SUCCESS = 'Logout successful.';

    // Errors
    public const NOT_FOUND         = 'Record not found.';
    public const VALIDATION_FAILED = 'Validation failed.';
    public const UNAUTHENTICATED   = 'Unauthenticated.';
    public const UNAUTHORIZED      = 'This action is unauthorized.';
    public const SERVER_ERROR      = 'Server error.';
}
