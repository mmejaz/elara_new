<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GlobalSettingController;
use App\Http\Controllers\GlobalSettingRecordController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/globalsettings', [GlobalSettingController::class, 'index'])->middleware('permission:global_setting.view');
    Route::post('/globalsettings/{globalSetting}/upload', [GlobalSettingController::class, 'uploadImage'])
        ->middleware(['permission:global_setting.edit', 'throttle:30,1']);
    Route::get('/globalsettings/{globalSetting}', [GlobalSettingController::class, 'show'])->middleware('permission:global_setting.view');
    Route::post('/globalsettings', [GlobalSettingController::class, 'store'])->middleware('permission:global_setting.create');
    Route::put('/globalsettings/{globalSetting}', [GlobalSettingController::class, 'update'])->middleware('permission:global_setting.edit');
    Route::delete('/globalsettings/{globalSetting}', [GlobalSettingController::class, 'destroy'])->middleware('permission:global_setting.delete');

    // Records — the rows the user adds against an app's fields.
    Route::get('/globalsettings/{globalSetting}/records', [GlobalSettingRecordController::class, 'index'])->middleware('permission:global_setting.view');
    Route::post('/globalsettings/{globalSetting}/records', [GlobalSettingRecordController::class, 'store'])->middleware('permission:global_setting.edit');
    Route::put('/globalsettings/{globalSetting}/records/{record}', [GlobalSettingRecordController::class, 'update'])->middleware('permission:global_setting.edit');
});
