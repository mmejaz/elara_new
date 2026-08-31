<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardSettingController;

Route::middleware('auth:sanctum')->group(function () {
    // Every authenticated user resolves their own effective dashboard widgets.
    Route::get('/dashboard/widgets', [DashboardSettingController::class, 'myWidgets']);

    // Configuring the per-role matrix + widget catalog is Super Admin only.
    Route::middleware('role:Super Admin')->group(function () {
        Route::get('/dashboard-settings', [DashboardSettingController::class, 'index']);
        Route::put('/dashboard-settings/{role}', [DashboardSettingController::class, 'update']);
        Route::post('/dashboard-settings/widgets', [DashboardSettingController::class, 'storeWidget']);
        Route::patch('/dashboard-settings/widgets/{key}', [DashboardSettingController::class, 'updateWidget']);
        Route::delete('/dashboard-settings/widgets/{key}', [DashboardSettingController::class, 'destroyWidget']);
    });
});
