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

        // Matriz de permisos granulares por recurso
        $permisos = [
            // Inventario
            'ver.productos', 'crear.producto', 'editar.producto', 'eliminar.producto', 'ajustar.stock', 'ver.costos', 'gestionar.categorias',
            // Ventas & POS
            'acceso.pos', 'crear.venta', 'anular.venta', 'aplicar.descuento', 'ver.historial-ventas', 'exportar.ventas',
            // Caja
            'abrir.caja', 'cerrar.caja', 'ver.movimientos-caja', 'ajustar.saldo-caja', 'realizar.egresos',
            // Compras
            'registrar.compra', 'ver.historial-compras', 'gestionar.proveedores',
            // Reportes
            'ver.reporte-diario', 'ver.reporte-mensual', 'ver.reporte-utilidades', 'ver.reporte-stock-bajo',
            // Configuración
            'gestionar.sucursales', 'gestionar.usuarios', 'gestionar.roles', 'ajustes.sistema'
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
        }

        // Roles Base en ESPAÑOL
        // 1. Administrador (Poder absoluto sobre el negocio)
        $roleAdmin = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $roleAdmin->syncPermissions(Permission::all());

        // 2. Gerente (Casi todo, excepto ajustes de sistema delicados)
        $roleGerente = Role::firstOrCreate(['name' => 'Gerente', 'guard_name' => 'web']);
        $roleGerente->syncPermissions(Permission::whereNotIn('name', [
            'eliminar.producto', 'ajustes.sistema', 'gestionar.roles'
        ])->get());

        // 3. Cajero (Operativo total del POS y Caja)
        $roleCajero = Role::firstOrCreate(['name' => 'Cajero', 'guard_name' => 'web']);
        $roleCajero->syncPermissions([
            'acceso.pos', 'crear.venta', 'ver.historial-ventas',
            'abrir.caja', 'cerrar.caja', 'ver.movimientos-caja'
        ]);
    }
}
