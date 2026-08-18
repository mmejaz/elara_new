<?php

use App\Http\Controllers\ImpersonationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Starting impersonation is Super-Admin-only.
    Route::post('/users/{user}/impersonate', [ImpersonationController::class, 'start'])
        ->middleware('role:Super Admin');

    // Stopping is available to the impersonated user (auth only) so they can
    // always get back to the real account.
    Route::post('/impersonate/stop', [ImpersonationController::class, 'stop']);
});
