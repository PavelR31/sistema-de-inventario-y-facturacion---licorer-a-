<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('categorias', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('medidas', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('empaques', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('proveedores', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        
        Schema::table('empaques', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('medidas', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('categorias', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
