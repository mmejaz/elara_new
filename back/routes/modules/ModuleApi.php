<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ModuleController;

Route::middleware('auth:sanctum')->group(function () {
    // Sidebar navigation — every authenticated user needs this.
    Route::get('/modules/tree', [ModuleController::class, 'tree']);

    // Module management — Super Admin only (lists, generates, toggles).
    Route::middleware('role:Super Admin')->group(function () {
        Route::get('/modules', [ModuleController::class, 'index']);
        Route::post('/modules', [ModuleController::class, 'store']);
        Route::patch('/modules/{module}', [ModuleController::class, 'update']);
    });
});
