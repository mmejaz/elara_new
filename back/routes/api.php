<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// CSRF cookie
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Public auth routes
Route::post('/login', [AuthController::class, 'login']);

// Protected core routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
});

// Feature module routes live in routes/modules/{Module}Api.php and are
// auto-loaded by bootstrap/app.php — no need to register them here.
