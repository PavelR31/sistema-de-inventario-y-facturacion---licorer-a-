<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. SUCURSALES (Centro de todo en el Tenant)
        Schema::create('sucursales', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('direccion')->nullable();
            $table->string('telefono', 20)->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        // 2. CATEGORÍAS
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        // 3. PROVEEDORES
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->string('ruc', 20)->nullable();
            $table->string('telefono', 20)->nullable();
            $table->text('direccion')->nullable();
            $table->timestamps();
        });

        // 4. PRODUCTOS (Catálogo Global del Tenant)
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->string('nombre', 150);
            $table->string('sku', 50)->unique()->nullable();
            $table->string('upc', 50)->unique()->nullable();
            $table->text('descripcion')->nullable();
            $table->string('imagen_ruta')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // 5. PRODUCTO_SUCURSAL (Inventario y Precio por Sucursal)
        Schema::create('producto_sucursal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();
            $table->integer('stock_actual')->default(0);
            $table->integer('stock_minimo')->default(0);
            $table->decimal('precio_compra', 12, 2)->default(0);
            $table->decimal('precio_venta', 12, 2)->default(0);
            $table->timestamps();
            
            $table->unique(['producto_id', 'sucursal_id']);
        });

        // 6. CLIENTES
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->string('identificacion', 50)->nullable(); // DNI/RUC
            $table->string('telefono', 20)->nullable();
            $table->string('email', 150)->nullable();
            $table->text('direccion')->nullable();
            $table->timestamps();
        });

        // 7. CAJAS
        Schema::create('cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->decimal('balance_actual', 12, 2)->default(0);
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        // 7.1 CAJA SESIONES
        Schema::create('caja_sesiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caja_id')->constrained('cajas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable(); // Usuario que abrió
            $table->decimal('apertura_esperada', 12, 2)->default(0);
            $table->decimal('apertura_real', 12, 2)->default(0);
            $table->decimal('discrepancia_apertura', 12, 2)->default(0);
            $table->decimal('cierre_esperado', 12, 2)->nullable();
            $table->decimal('cierre_real', 12, 2)->nullable();
            $table->decimal('discrepancia_cierre', 12, 2)->nullable();
            $table->enum('estado', ['abierta', 'cerrada'])->default('abierta');
            $table->timestamp('fecha_apertura')->useCurrent();
            $table->timestamp('fecha_cierre')->nullable();
            $table->timestamps();
        });

        // 8. VENTAS
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();
            $table->foreignId('caja_sesion_id')->nullable()->constrained('caja_sesiones')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('user_id')->nullable(); // Cajero
            $table->string('numero_factura', 50)->unique();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('impuesto', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->enum('metodo_pago', ['efectivo', 'tarjeta', 'transferencia', 'mixto'])->default('efectivo');
            $table->decimal('monto_pagado', 12, 2)->default(0);
            $table->decimal('cambio', 12, 2)->default(0);
            $table->enum('estado', ['vigente', 'anulada'])->default('vigente');
            $table->timestamps();
        });

        // 8.1 DETALLE DE VENTAS
        Schema::create('detalle_ventas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->restrictOnDelete();
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        // 8.2 VENTAS ANULADAS
        Schema::create('ventas_anuladas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable(); // Usuario que anuló
            $table->text('motivo')->nullable();
            $table->timestamp('fecha_anulacion')->useCurrent();
            $table->timestamps();
        });

        // 9. COMPRAS (Abastecimiento para una Sucursal)
        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();
            $table->foreignId('proveedor_id')->constrained('proveedores')->restrictOnDelete();
            $table->foreignId('user_id')->nullable();
            $table->string('numero_factura', 50)->nullable();
            $table->date('fecha_compra');
            $table->decimal('total', 12, 2)->default(0);
            $table->enum('estado', ['completado', 'pendiente', 'anulado'])->default('completado');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });

        // 9.1 DETALLE DE COMPRAS
        Schema::create('detalle_compras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained('compras')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->restrictOnDelete();
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });

        // 10. AJUSTES DE INVENTARIO
        Schema::create('ajustes_inventario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->constrained('sucursales')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable();
            $table->enum('tipo', ['ingreso', 'salida']); // merma, ajuste manual
            $table->integer('cantidad');
            $table->text('motivo')->nullable();
            $table->timestamps();
        });

        // 11. BITÁCORA DE ACTIVIDADES
        Schema::create('bitacora_actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('user_id')->nullable();
            $table->string('accion');
            $table->string('tabla_afectada')->nullable();
            $table->text('descripcion')->nullable();
            $table->string('ip_origen', 45)->nullable();
            $table->timestamps();
        });

        // 12. HISTORIAL RESPALDOS
        Schema::create('historial_respaldos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable();
            $table->string('nombre_archivo');
            $table->enum('estado', ['exitoso', 'fallido'])->default('exitoso');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_respaldos');
        Schema::dropIfExists('bitacora_actividades');
        Schema::dropIfExists('ajustes_inventario');
        Schema::dropIfExists('detalle_compras');
        Schema::dropIfExists('compras');
        Schema::dropIfExists('ventas_anuladas');
        Schema::dropIfExists('detalle_ventas');
        Schema::dropIfExists('ventas');
        Schema::dropIfExists('caja_sesiones');
        Schema::dropIfExists('cajas');
        Schema::dropIfExists('clientes');
        Schema::dropIfExists('producto_sucursal');
        Schema::dropIfExists('productos');
        Schema::dropIfExists('proveedores');
        Schema::dropIfExists('categorias');
        Schema::dropIfExists('sucursales');
    }
};
