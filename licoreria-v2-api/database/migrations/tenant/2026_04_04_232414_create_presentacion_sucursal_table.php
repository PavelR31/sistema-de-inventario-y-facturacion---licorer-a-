<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('presentacion_sucursal')) {
            Schema::create('presentacion_sucursal', function (Blueprint $table) {
                $table->id();
                $table->foreignId('presentacion_id')->constrained('presentaciones_producto')->onDelete('cascade');
                $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
                $table->integer('stock_actual')->default(0);
                $table->timestamps();

                $table->unique(['presentacion_id', 'sucursal_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('presentacion_sucursal');
    }
};
