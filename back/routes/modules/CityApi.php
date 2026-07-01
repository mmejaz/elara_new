<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CityController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/cities', [CityController::class, 'index'])->middleware('permission:city.view');
    Route::post('/cities', [CityController::class, 'store'])->middleware('permission:city.create');
    Route::put('/cities/{city}', [CityController::class, 'update'])->middleware('permission:city.edit');
    Route::delete('/cities/{city}', [CityController::class, 'destroy'])->middleware('permission:city.delete');
});
