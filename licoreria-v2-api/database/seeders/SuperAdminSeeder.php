<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Crea el usuario SuperAdmin inicial capaz de gestionar tenants.
     */
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'superadmin@licoreria.com'],
            [
                'name'                 => 'Super Administrador',
                'password'             => Hash::make('SuperAdmin2026!'),
                'is_super_admin'       => true,
                'must_change_password' => true,
            ]
        );

        $this->command->info("✅ SuperAdmin creado/actualizado:");
        $this->command->info("   Email:    superadmin@licoreria.com");
        $this->command->info("   Password: SuperAdmin2026!");
        $this->command->info("   ⚠️  Se le pedirá cambiar la contraseña en el primer inicio de sesión.");
    }
}
