<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Asegurar que la tabla users tenga los campos necesarios
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'must_change_password')) {
                $table->boolean('must_change_password')->default(true)->after('password');
            }
            if (!Schema::hasColumn('users', 'is_super_admin')) {
                $table->boolean('is_super_admin')->default(false)->after('must_change_password');
            }
        });

        // 2. Migrar datos si existe la tabla super_admins
        if (Schema::hasTable('super_admins')) {
            $admins = DB::table('super_admins')->get();
            foreach ($admins as $admin) {
                // Evitar duplicados por email
                if (!DB::table('users')->where('email', $admin->email)->exists()) {
                    DB::table('users')->insert([
                        'name' => $admin->name,
                        'email' => $admin->email,
                        'password' => $admin->password,
                        'must_change_password' => $admin->must_change_password ?? true,
                        'is_super_admin' => true,
                        'created_at' => $admin->created_at,
                        'updated_at' => $admin->updated_at,
                    ]);
                } else {
                    DB::table('users')->where('email', $admin->email)->update(['is_super_admin' => true]);
                }
            }
            
            // 3. Eliminar la tabla antigua
            Schema::dropIfExists('super_admins');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['must_change_password', 'is_super_admin']);
        });
    }
};
