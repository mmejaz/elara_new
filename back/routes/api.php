<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// CSRF cookie
Route::get('/sanctum/csrf-cookie', function () {
    return response()->json(['message' => 'CSRF cookie set']);
});

// Public auth routes. `throttle:login` is a named limiter (email+IP and IP
// ceilings) registered in AppServiceProvider — brute-force protection.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Protected core routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    // Profile
    Route::get('/profile/access', [AuthController::class, 'access']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'updatePassword']);
    Route::put('/profile/settings', [AuthController::class, 'updateSettings']);
    Route::post('/profile/avatar', [AuthController::class, 'updateAvatar'])->middleware('throttle:30,1');
    Route::delete('/profile/avatar', [AuthController::class, 'deleteAvatar']);
});

// Feature module routes live in routes/modules/{Module}Api.php and are
// auto-loaded by bootstrap/app.php — no need to register them here.
