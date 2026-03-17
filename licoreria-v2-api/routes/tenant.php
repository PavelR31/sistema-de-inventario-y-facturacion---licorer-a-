<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;
use App\Http\Controllers\Auth\TenantAuthController;
use App\Http\Controllers\Tenant\CategoriaController;
use App\Http\Controllers\Tenant\ProductoController;
use App\Http\Controllers\Tenant\SucursalController;
use App\Http\Controllers\Tenant\VentaController;
use App\Http\Controllers\Tenant\ProveedorController;
use App\Http\Controllers\Tenant\CompraController;
use App\Http\Controllers\Tenant\UserController;
use App\Http\Controllers\Tenant\RoleController;
use App\Http\Controllers\Tenant\CajaController;
use App\Http\Controllers\Tenant\DashboardController;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenantRouteServiceProvider.
|
*/

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->prefix('api')->group(function () {
    
    // Auth de Tokens (para Inquilinos)
    Route::post('/login', [TenantAuthController::class, 'login']);

    // Rutas protegidas (Requieren autenticación del empleado via Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', function (Request $request) {
            return response()->json($request->user()->load('roles', 'permissions'));
        });

        Route::post('/update-password', [TenantAuthController::class, 'updatePassword']);

        // Dashboard
        Route::get('dashboard/stats', [DashboardController::class, 'getStats']);

        // Catálogos
        Route::apiResource('sucursales', SucursalController::class);
        Route::apiResource('categorias', CategoriaController::class);
        Route::apiResource('productos', ProductoController::class);
        Route::apiResource('ventas', VentaController::class);
        Route::post('ventas/{id}/anular', [VentaController::class, 'anular']);
        Route::apiResource('proveedores', ProveedorController::class);
        Route::apiResource('compras', CompraController::class);
        Route::apiResource('users', UserController::class);
        
        // Roles y Permisos
        Route::get('permissions', [RoleController::class, 'permissions']);
        Route::apiResource('roles', RoleController::class);

        // Caja
        Route::get('caja/status', [CajaController::class, 'status']);
        Route::post('caja/abrir', [CajaController::class, 'abrir']);
        Route::post('caja/cerrar/{caja}', [CajaController::class, 'cerrar']);
        
        // Más adelante: Cajas, Ventas, Reportes, etc.
    });

    // Ruta de impresión pública (dentro del inquilino) para permitir window.open
    Route::get('ventas/{id}/print', [VentaController::class, 'print']);

});
