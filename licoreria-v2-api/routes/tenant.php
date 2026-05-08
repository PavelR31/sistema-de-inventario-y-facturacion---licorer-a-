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
use App\Http\Controllers\Tenant\MedidaController;
use App\Http\Controllers\Tenant\ReporteController;
use App\Http\Controllers\Tenant\ConfiguracionController;
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
    Route::get('/verify', function() {
        return response()->json(['message' => 'Tenant verified', 'tenant' => tenant('name')]);
    });
    Route::post('/login', [TenantAuthController::class, 'login']);
    Route::post('/forgot-password', [TenantAuthController::class, 'forgotPassword']);

    // Rutas protegidas (Requieren autenticación del empleado via Sanctum y licencia activa)
    Route::middleware(['auth:sanctum', 'tenant.license'])->group(function () {
        Route::get('/user', function (Request $request) {
            return response()->json($request->user()->load('roles', 'permissions'));
        });

        Route::post('/update-password', [TenantAuthController::class, 'updatePassword']);
        Route::put('/perfil/update', [UserController::class, 'updateProfile']);
        Route::put('/perfil/password', [UserController::class, 'updatePasswordProfile']);

        // Dashboard
        Route::get('dashboard/stats', [DashboardController::class, 'getStats'])
            ->middleware('permission:ver.reporte-diario');

        // Sucursales
        Route::get('sucursales', [SucursalController::class, 'index'])->middleware('permission:ver.sucursales');
        Route::post('sucursales', [SucursalController::class, 'store'])->middleware('permission:crear.sucursal');
        Route::get('sucursales/{sucursal}', [SucursalController::class, 'show'])->middleware('permission:ver.sucursales');
        Route::put('sucursales/{sucursal}', [SucursalController::class, 'update'])->middleware('permission:editar.sucursal');
        Route::delete('sucursales/{sucursal}', [SucursalController::class, 'destroy'])->middleware('permission:eliminar.sucursal');

        // Categorias
        Route::get('categorias', [CategoriaController::class, 'index']);
        Route::post('categorias', [CategoriaController::class, 'store'])->middleware('permission:crear.categoria');
        Route::get('categorias/{categoria}', [CategoriaController::class, 'show']);
        Route::put('categorias/{categoria}', [CategoriaController::class, 'update'])->middleware('permission:editar.categoria');
        Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy'])->middleware('permission:eliminar.categoria');

        // Productos
        Route::get('productos', [ProductoController::class, 'index'])->middleware('permission:ver.productos');
        Route::get('productos/buscar-barcode', [ProductoController::class, 'buscarPorBarcode'])->middleware('permission:ver.productos');
        Route::post('productos/bulk', [ProductoController::class, 'storeBulk'])->middleware('permission:crear.producto');
        Route::post('productos', [ProductoController::class, 'store'])->middleware('permission:crear.producto');
        Route::get('productos/{producto}', [ProductoController::class, 'show'])->middleware('permission:ver.productos');
        Route::post('productos/{producto}', [ProductoController::class, 'update'])->middleware('permission:editar.producto'); // POST con _method=PUT
        Route::put('productos/{producto}', [ProductoController::class, 'update'])->middleware('permission:editar.producto');
        Route::delete('productos/{producto}', [ProductoController::class, 'destroy'])->middleware('permission:eliminar.producto');

        // Ventas
        Route::get('ventas', [VentaController::class, 'index'])->middleware('permission:ver.historial-ventas');
        Route::post('ventas', [VentaController::class, 'store'])
            ->middleware(['permission:crear.venta', \App\Http\Middleware\Tenant\CheckCajaSession::class]);
        Route::get('ventas/{venta}', [VentaController::class, 'show'])->middleware('permission:ver.historial-ventas');
        Route::post('ventas/{id}/anular', [VentaController::class, 'anular'])->middleware('permission:anular.venta');

        // Proveedores
        Route::get('proveedores', [ProveedorController::class, 'index'])->middleware('permission:ver.proveedores');
        Route::post('proveedores', [ProveedorController::class, 'store'])->middleware('permission:crear.proveedor');
        Route::get('proveedores/{proveedor}', [ProveedorController::class, 'show'])->middleware('permission:ver.proveedores');
        Route::put('proveedores/{proveedor}', [ProveedorController::class, 'update'])->middleware('permission:editar.proveedor');
        Route::delete('proveedores/{proveedor}', [ProveedorController::class, 'destroy'])->middleware('permission:eliminar.proveedor');

        // Compras
        Route::get('compras', [CompraController::class, 'index'])->middleware('permission:ver.historial-compras');
        Route::post('compras', [CompraController::class, 'store'])->middleware('permission:registrar.compra');
        Route::get('compras/{compra}', [CompraController::class, 'show'])->middleware('permission:ver.historial-compras');

        // Ajustes de Inventario
        Route::get('ajustes-inventarios', [\App\Http\Controllers\Tenant\AjusteInventarioController::class, 'index'])->middleware('permission:ajustar.stock');
        Route::post('ajustes-inventarios', [\App\Http\Controllers\Tenant\AjusteInventarioController::class, 'store'])->middleware('permission:ajustar.stock');

        // Usuarios
        Route::get('users', [UserController::class, 'index'])->middleware('permission:ver.usuarios');
        Route::post('users', [UserController::class, 'store'])->middleware('permission:crear.usuario');
        Route::get('users/{user}', [UserController::class, 'show'])->middleware('permission:ver.usuarios');
        Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:editar.usuario');
        Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive'])->middleware('permission:editar.usuario');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:eliminar.usuario');

        // Roles y Permisos
        Route::get('permissions', [RoleController::class, 'permissions'])->middleware('permission:ver.roles');
        Route::get('roles', [RoleController::class, 'index'])->middleware('permission:ver.roles');
        Route::post('roles', [RoleController::class, 'store'])->middleware('permission:crear.rol');
        Route::get('roles/{role}', [RoleController::class, 'show'])->middleware('permission:ver.roles');
        Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:editar.rol');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:eliminar.rol');

        // Cajas Físicas
        Route::apiResource('cajas', CajaController::class);
        Route::apiResource('proveedores', ProveedorController::class);
        Route::apiResource('medidas', MedidaController::class);
        Route::apiResource('empaques', \App\Http\Controllers\Tenant\EmpaqueController::class)->except(['show']);
        
        // Sesiones de Caja (Trabajo)
        Route::get('caja-sesiones/active', [\App\Http\Controllers\Tenant\CajaSesionController::class, 'active']);
        Route::get('caja-sesiones/disponibles', [\App\Http\Controllers\Tenant\CajaSesionController::class, 'listDisponibles']);
        Route::post('caja-sesiones/abrir', [\App\Http\Controllers\Tenant\CajaSesionController::class, 'abrir']);
        Route::post('caja-sesiones/cerrar/{id}', [\App\Http\Controllers\Tenant\CajaSesionController::class, 'cerrar']);
        Route::get('caja-egresos', [\App\Http\Controllers\Tenant\CajaEgresoController::class, 'index']);
        Route::post('caja-egresos', [\App\Http\Controllers\Tenant\CajaEgresoController::class, 'store']);
        
        // Configuraciones del Sistema
        Route::get('configuraciones', [ConfiguracionController::class, 'index']);
        Route::put('configuraciones', [ConfiguracionController::class, 'update']);

        // ── Respaldos del Tenant ────────────────────────────────────────
        Route::prefix('backups')->middleware('permission:ajustes.sistema')->group(function () {
            Route::get('/',          [\App\Http\Controllers\Tenant\TenantBackupController::class, 'index']);
            Route::post('/',         [\App\Http\Controllers\Tenant\TenantBackupController::class, 'store']);
            Route::post('/upload',   [\App\Http\Controllers\Tenant\TenantBackupController::class, 'upload']);
            Route::post('/download', [\App\Http\Controllers\Tenant\TenantBackupController::class, 'download']);
            Route::post('/restore',  [\App\Http\Controllers\Tenant\TenantBackupController::class, 'restore']);
            Route::delete('/',       [\App\Http\Controllers\Tenant\TenantBackupController::class, 'destroy']);
        });
        
        // Reportes y Estadísticas
        Route::prefix('reportes')->middleware(['token_from_query', 'auth:sanctum'])->group(function () {
            Route::get('ventas',           [ReporteController::class, 'ventasPorPeriodo']);
            Route::get('sucursal',         [ReporteController::class, 'ventasPorSucursal']);
            Route::get('productos-top',    [ReporteController::class, 'productosTop']);
            Route::get('stock-critico',    [ReporteController::class, 'stockCritico']);
            Route::get('anulaciones',      [ReporteController::class, 'anulaciones']);
            Route::get('cajas',            [ReporteController::class, 'historialCajas']);
            Route::get('arqueo/{cajaId}',  [ReporteController::class, 'arqueoCaja']);
            Route::get('inventario-maestro', [ReporteController::class, 'inventarioMaestro']);
            Route::get('ventas-usuario',   [ReporteController::class, 'ventasPorUsuario']);
            
            // Exportaciones
            Route::prefix('exportar')->group(function () {
                Route::get('ventas',       [ReporteController::class, 'exportarVentas']);
                Route::get('stock',        [ReporteController::class, 'exportarStock']);
                Route::get('top',          [ReporteController::class, 'exportarTop']);
                Route::get('anulaciones',  [ReporteController::class, 'exportarAnulaciones']);
                Route::get('inventario',   [ReporteController::class, 'exportarInventario']);
                Route::get('sucursal',     [ReporteController::class, 'exportarSucursal']);
                Route::get('usuario',      [ReporteController::class, 'exportarUsuario']);
            });

            Route::get('pdf', [ReporteController::class, 'generarPdf']);
            Route::get('global-search', [\App\Http\Controllers\Tenant\SearchController::class, 'global']);
        });
    });

    // Ruta de impresión pública (dentro del inquilino) para permitir window.open
    Route::get('ventas/{id}/print', [VentaController::class, 'print']);

});
