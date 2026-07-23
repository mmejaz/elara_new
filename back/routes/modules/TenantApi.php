<?php

use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

/*
 | Central tenant-management API. Runs in the CENTRAL context (app/localhost),
 | never inside a tenant — this is how Super Admins provision and manage tenants.
 | Auto-loaded by bootstrap/app.php alongside the other module route files.
 */
Route::middleware(['central', 'auth:sanctum'])->group(function () {
    Route::get('/tenants', [TenantController::class, 'index']);
    Route::post('/tenants', [TenantController::class, 'store']);
    Route::get('/tenants/{tenant}', [TenantController::class, 'show']);
    Route::post('/tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
    Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate']);
    Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy']);
});
