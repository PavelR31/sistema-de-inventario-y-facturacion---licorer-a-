<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('productos', 'medida_id')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->foreignId('medida_id')->nullable()->constrained('medidas')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropForeign(['medida_id']);
            $table->dropColumn('medida_id');
        });
    }
};
