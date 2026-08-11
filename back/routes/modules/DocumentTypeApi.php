<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DocumentTypeController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/documenttypes', [DocumentTypeController::class, 'index'])->middleware('permission:document_type.view');
    Route::post('/documenttypes', [DocumentTypeController::class, 'store'])->middleware('permission:document_type.create');
    Route::put('/documenttypes/{documentType}', [DocumentTypeController::class, 'update'])->middleware('permission:document_type.edit');
    Route::delete('/documenttypes/{documentType}', [DocumentTypeController::class, 'destroy'])->middleware('permission:document_type.delete');
});
