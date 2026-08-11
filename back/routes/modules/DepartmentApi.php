<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DepartmentController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/departments', [DepartmentController::class, 'index'])->middleware('permission:department.view');
    Route::post('/departments', [DepartmentController::class, 'store'])->middleware('permission:department.create');
    Route::put('/departments/{department}', [DepartmentController::class, 'update'])->middleware('permission:department.edit');
    Route::delete('/departments/{department}', [DepartmentController::class, 'destroy'])->middleware('permission:department.delete');
});
