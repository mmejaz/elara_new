<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ModuleController;

Route::middleware('auth:sanctum')->group(function () {
    // Sidebar navigation — every authenticated user needs this.
    Route::get('/modules/tree', [ModuleController::class, 'tree']);

    // Managed Modules — list and toggle visibility. Tenant owners run this for
    // their own sidebar, and they hold "Admin" (not "Super Admin"), so both
    // roles are accepted here.
    Route::middleware('role:Super Admin|Admin')->group(function () {
        Route::get('/modules', [ModuleController::class, 'index']);
        Route::get('/modules/paginated', [ModuleController::class, 'paginated']);
        Route::patch('/modules/{module}', [ModuleController::class, 'update']);
    });

    // Module Builder — generates files into config('modulegen.frontend_src'),
    // which is one source tree shared by the central app and every tenant.
    // `central` keeps it off tenant domains entirely; a tenant running this
    // would rewrite every other tenant's frontend.
    Route::middleware(['central', 'role:Super Admin'])->group(function () {
        Route::post('/modules', [ModuleController::class, 'store']);
    });
});
