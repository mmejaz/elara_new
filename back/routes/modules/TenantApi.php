<?php

use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

/*
 | Central tenant-management API. Runs in the CENTRAL context (app/localhost),
 | never inside a tenant — this is how Super Admins provision and manage tenants.
 | Auto-loaded by bootstrap/app.php alongside the other module route files.
 |
 | Gated to Super Admin only: `central` keeps it off tenant domains, but without
 | the role check any authenticated central user (e.g. an Admin) could list every
 | tenant's details or DELETE one — which drops that tenant's whole database.
 | Mirrors the Module Builder route, which is Super-Admin-gated the same way.
 */
Route::middleware(['central', 'auth:sanctum', 'role:Super Admin'])->group(function () {
    Route::get('/tenants', [TenantController::class, 'index']);
    Route::post('/tenants', [TenantController::class, 'store']);
    Route::get('/tenants/{tenant}', [TenantController::class, 'show']);
    Route::post('/tenants/{tenant}/suspend', [TenantController::class, 'suspend']);
    Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate']);
    Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy']);
});
