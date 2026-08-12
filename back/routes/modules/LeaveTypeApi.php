<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LeaveTypeController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/leavetypes', [LeaveTypeController::class, 'index'])->middleware('permission:leave_type.view');
    Route::post('/leavetypes', [LeaveTypeController::class, 'store'])->middleware('permission:leave_type.create');
    Route::put('/leavetypes/{leaveType}', [LeaveTypeController::class, 'update'])->middleware('permission:leave_type.edit');
    Route::delete('/leavetypes/{leaveType}', [LeaveTypeController::class, 'destroy'])->middleware('permission:leave_type.delete');
});
