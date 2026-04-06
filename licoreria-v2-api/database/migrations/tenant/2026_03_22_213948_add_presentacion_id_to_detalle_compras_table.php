<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->foreignId('presentacion_id')->nullable()->after('producto_id')->constrained('presentaciones_producto')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('detalle_compras', function (Blueprint $table) {
            $table->dropForeign(['presentacion_id']);
            $table->dropColumn('presentacion_id');
        });
    }
};
