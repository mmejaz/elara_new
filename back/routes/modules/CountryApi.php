<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CountryController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/countries', [CountryController::class, 'index'])->middleware('permission:country.view');
    Route::post('/countries', [CountryController::class, 'store'])->middleware('permission:country.create');
    Route::put('/countries/{country}', [CountryController::class, 'update'])->middleware('permission:country.edit');
    Route::delete('/countries/{country}', [CountryController::class, 'destroy'])->middleware('permission:country.delete');
});
