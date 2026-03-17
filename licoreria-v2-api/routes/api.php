<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Central\AuthController;
use App\Http\Controllers\Central\TenantController;
use App\Http\Controllers\Central\DashboardController;

// Rutas Públicas Centrales
Route::post('/central/login', [AuthController::class, 'login']);

// Rutas Protegidas Centrales (Super Admins)
Route::middleware('auth:sanctum')->prefix('central')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });

    Route::post('/update-password', [AuthController::class, 'updatePassword']);

    // Gestión de Tenants
    Route::apiResource('tenants', TenantController::class);
    
    // Dashboard Central
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
