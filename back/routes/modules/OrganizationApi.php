<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OrganizationController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/organizations', [OrganizationController::class, 'index'])->middleware('permission:organization.view');
    Route::post('/organizations', [OrganizationController::class, 'store'])->middleware('permission:organization.create');
    Route::put('/organizations/{organization}', [OrganizationController::class, 'update'])->middleware('permission:organization.edit');
    Route::delete('/organizations/{organization}', [OrganizationController::class, 'destroy'])->middleware('permission:organization.delete');
});
