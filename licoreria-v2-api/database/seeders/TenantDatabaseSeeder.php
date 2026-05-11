<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TenantDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds for the Tenant.
     */
    public function run(): void
    {
        // Limpiamos caché de spatie antes de crear
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Matriz de permisos 100% granulares por recurso
        $permisos = [
            // Productos
            'ver.productos', 'crear.producto', 'editar.producto', 'eliminar.producto',
            'ajustar.stock', 'ver.costos',

            // Categorías
            'ver.categorias', 'crear.categoria', 'editar.categoria', 'eliminar.categoria',

            // Ventas & POS
            'acceso.pos', 'crear.venta', 'anular.venta', 'aplicar.descuento',
            'ver.historial-ventas', 'exportar.ventas',

            // Caja
            'abrir.caja', 'cerrar.caja', 'ver.movimientos-caja',
            'ajustar.saldo-caja', 'realizar.egresos',

            // Compras
            'registrar.compra', 'ver.historial-compras',

            // Proveedores
            'ver.proveedores', 'crear.proveedor', 'editar.proveedor', 'eliminar.proveedor',

            // Reportes
            'ver.reporte-diario', 'ver.reporte-mensual',
            'ver.reporte-utilidades', 'ver.reporte-stock-bajo',

            // Sucursales
            'ver.sucursales', 'crear.sucursal', 'editar.sucursal', 'eliminar.sucursal',

            // Usuarios
            'ver.usuarios', 'crear.usuario', 'editar.usuario', 'eliminar.usuario',

            // Roles & Sistema
            'ver.roles', 'crear.rol', 'editar.rol', 'eliminar.rol',
            'ajustes.sistema',
            'gestionar.backups',
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
        }

        // Roles Base
        // 1. Administrador — acceso total
        $roleAdmin = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $roleAdmin->syncPermissions(Permission::all());

        // 2. Gerente — todo excepto eliminar cosas críticas y ajustes de sistema
        $roleGerente = Role::firstOrCreate(['name' => 'Gerente', 'guard_name' => 'web']);
        $roleGerente->syncPermissions(Permission::whereNotIn('name', [
            'eliminar.producto', 'eliminar.categoria', 'eliminar.proveedor',
            'eliminar.usuario', 'eliminar.sucursal', 'eliminar.rol',
            'ajustes.sistema', 'ver.roles', 'crear.rol', 'editar.rol',
        ])->get());

        // 3. Cajero — solo POS y Caja
        $roleCajero = Role::firstOrCreate(['name' => 'Cajero', 'guard_name' => 'web']);
        $roleCajero->syncPermissions([
            'acceso.pos', 'crear.venta', 'ver.historial-ventas',
            'abrir.caja', 'cerrar.caja', 'ver.movimientos-caja',
            'ver.productos', 'ver.categorias', 'ver.sucursales',
            'realizar.egresos', 'aplicar.descuento',
        ]);

        // Empaques por defecto
        $defaultEmpaques = [
            ['nombre' => 'Unidad', 'cantidad_unidades' => 1],
            ['nombre' => 'Six-Pack', 'cantidad_unidades' => 6],
            ['nombre' => 'Doce-Pack', 'cantidad_unidades' => 12],
            ['nombre' => 'Caja', 'cantidad_unidades' => 24],
            ['nombre' => 'Plancha / Paca', 'cantidad_unidades' => 24],
        ];

        foreach ($defaultEmpaques as $emp) {
            \App\Models\Tenant\Empaque::firstOrCreate(['nombre' => $emp['nombre']], $emp);
        }
    }
}
