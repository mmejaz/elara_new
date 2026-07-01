<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ApplicationTypeController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/applicationtypes', [ApplicationTypeController::class, 'index'])->middleware('permission:application_type.view');
    Route::post('/applicationtypes', [ApplicationTypeController::class, 'store'])->middleware('permission:application_type.create');
    Route::put('/applicationtypes/{applicationType}', [ApplicationTypeController::class, 'update'])->middleware('permission:application_type.edit');
    Route::delete('/applicationtypes/{applicationType}', [ApplicationTypeController::class, 'destroy'])->middleware('permission:application_type.delete');
});
