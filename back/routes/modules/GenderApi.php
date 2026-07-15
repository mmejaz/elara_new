<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GenderController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/genders', [GenderController::class, 'index'])->middleware('permission:gender.view');
    Route::post('/genders', [GenderController::class, 'store'])->middleware('permission:gender.create');
    Route::put('/genders/{gender}', [GenderController::class, 'update'])->middleware('permission:gender.edit');
    Route::delete('/genders/{gender}', [GenderController::class, 'destroy'])->middleware('permission:gender.delete');
});
