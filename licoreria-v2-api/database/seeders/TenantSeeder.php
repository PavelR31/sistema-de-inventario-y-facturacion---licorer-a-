<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 0. Ejecutar el seeder de base (Roles y Permisos)
        $this->call(TenantDatabaseSeeder::class);

        // El tenant actual está disponible globalmente en Stancl Tenancy
        $tenant = tenant();

        // 1. Crear el usuario administrador del negocio
        $user = \App\Models\User::create([
            'name' => $tenant->name ?? 'Admin ' . $tenant->id,
            'email' => $tenant->email,
            'password' => bcrypt($tenant->temp_password), // Usamos la clave temporal guardada en el metadata
            'must_change_password' => true,
        ]);

        // Asignar el rol de administrador
        $user->assignRole('Administrador');

        // 2. Crear una sucursal por defecto para que el negocio pueda empezar a operar
        \Illuminate\Support\Facades\DB::table('sucursales')->insert([
            'nombre' => 'Casa Matriz',
            'direccion' => 'Dirección General',
            'estado' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
