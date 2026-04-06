<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('presentaciones_producto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->string('nombre', 50); // Ej. "Six-pack", "Caja 24"
            $table->integer('cantidad_unidades')->default(1);
            $table->decimal('precio_venta', 12, 2)->default(0);
            $table->string('codigo_barras', 50)->nullable()->unique();
            $table->boolean('es_principal')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('presentaciones_producto');
    }
};
