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
        Schema::table('tenants', function (Blueprint $table) {
            $table->foreignId('plan_id_fk')
                ->nullable()
                ->constrained('plans')
                ->nullOnDelete()
                ->after('email');

            $table->enum('license_status', ['trial', 'active', 'suspended', 'expired'])
                ->default('trial')
                ->after('plan_id_fk');

            $table->timestamp('license_starts_at')
                ->nullable()
                ->after('license_status');

            $table->timestamp('license_expires_at')
                ->nullable()
                ->after('license_starts_at');

            // Copia del max_users del plan al momento de crear/renovar
            // Así los contratos vigentes no se ven afectados si el plan cambia
            $table->unsignedInteger('max_users')
                ->default(2)
                ->after('license_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['plan_id_fk']);
            $table->dropColumn([
                'plan_id_fk',
                'license_status',
                'license_starts_at',
                'license_expires_at',
                'max_users',
            ]);
        });
    }
};
