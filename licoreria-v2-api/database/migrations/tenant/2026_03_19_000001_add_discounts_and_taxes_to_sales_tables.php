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
        Schema::table('ventas', function (Blueprint $table) {
            $table->decimal('descuento', 12, 2)->default(0)->after('subtotal');
            $table->decimal('impuesto_porcentaje', 5, 2)->default(0)->after('impuesto');
        });

        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->decimal('descuento', 12, 2)->default(0)->after('cantidad');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropColumn(['descuento', 'impuesto_porcentaje']);
        });

        Schema::table('detalle_ventas', function (Blueprint $table) {
            $table->dropColumn('descuento');
        });
    }
};
