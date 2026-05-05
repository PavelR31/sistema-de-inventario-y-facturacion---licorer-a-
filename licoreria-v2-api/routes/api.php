<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Central\AuthController;
use App\Http\Controllers\Central\TenantController;
use App\Http\Controllers\Central\DashboardController;
use App\Http\Controllers\Central\LicenseController;
use App\Http\Controllers\Central\BackupController;

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
    
    // Gestión de Licencias
    Route::get('/plans', [LicenseController::class, 'plans']);
    Route::apiResource('licenses', LicenseController::class)->only(['index', 'show']);
    Route::post('/licenses/{tenant}/renew', [LicenseController::class, 'renew']);
    Route::post('/licenses/{tenant}/suspend', [LicenseController::class, 'suspend']);
    Route::post('/licenses/{tenant}/activate', [LicenseController::class, 'activate']);
    
    // Dashboard Central
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── Gestión de Backups ──────────────────────────────────────────
    Route::prefix('backups')->group(function () {
        Route::get('/',          [BackupController::class, 'index']);      // Listar backups
        Route::post('/',         [BackupController::class, 'store']);      // Crear backup manual
        Route::post('/tenant',   [BackupController::class, 'backupTenant']); // Crear backup de tenant individual
        Route::get('/health',    [BackupController::class, 'health']);     // Estado de salud
        Route::post('/download', [BackupController::class, 'download']);   // Descargar backup
        Route::post('/cleanup',  [BackupController::class, 'cleanup']);    // Limpiar backups viejos
        Route::delete('/',       [BackupController::class, 'destroy']);    // Eliminar un backup
        Route::post('/restore-tenant', [BackupController::class, 'restoreTenant']); // Restaurar tenant especifico
    });
});
