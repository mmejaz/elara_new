<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DesignationController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/designations', [DesignationController::class, 'index'])->middleware('permission:designation.view');
    Route::post('/designations', [DesignationController::class, 'store'])->middleware('permission:designation.create');
    Route::put('/designations/{designation}', [DesignationController::class, 'update'])->middleware('permission:designation.edit');
    Route::delete('/designations/{designation}', [DesignationController::class, 'destroy'])->middleware('permission:designation.delete');
});
