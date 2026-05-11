<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant\Sucursal;
use Illuminate\Support\Facades\DB;

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

        // 1. Crear el usuario administrador del negocio (solo si no existe)
        $user = \App\Models\User::firstOrCreate(
            ['email' => $tenant->email],
            [
                'name' => $tenant->name ?? 'Admin ' . $tenant->id,
                'password' => bcrypt($tenant->temp_password ?? 'password'), 
                'must_change_password' => true,
            ]
        );

        // Asignar el rol de administrador si no lo tiene
        if (!$user->hasRole('Administrador')) {
            $user->assignRole('Administrador');
        }

        // 2. Crear una sucursal por defecto (solo si no hay ninguna)
        if (Sucursal::count() === 0) {
            Sucursal::create([
                'nombre' => 'Casa Matriz',
                'direccion' => 'Dirección General',
                'estado' => true,
            ]);
        }

        // 3. Crear 20 Medidas por defecto (idempotente)
        $medidas = [
            ['nombre' => '50 ml (Miniatura)', 'abreviatura' => '50ml'],
            ['nombre' => '187 ml (Cuarto)', 'abreviatura' => '187ml'],
            ['nombre' => '200 ml', 'abreviatura' => '200ml'],
            ['nombre' => '330 ml', 'abreviatura' => '330ml'],
            ['nombre' => '355 ml (Lata)', 'abreviatura' => '355ml'],
            ['nombre' => '375 ml (Media)', 'abreviatura' => '375ml'],
            ['nombre' => '500 ml', 'abreviatura' => '500ml'],
            ['nombre' => '700 ml', 'abreviatura' => '700ml'],
            ['nombre' => '750 ml (Estándar)', 'abreviatura' => '750ml'],
            ['nombre' => '1 Litro', 'abreviatura' => '1LT'],
            ['nombre' => '1.5 Litros (Magnum)', 'abreviatura' => '1.5LT'],
            ['nombre' => '1.75 Litros', 'abreviatura' => '1.75LT'],
            ['nombre' => '3 Litros', 'abreviatura' => '3LT'],
            ['nombre' => '1 Galón (3.78L)', 'abreviatura' => '1GL'],
            ['nombre' => '8 oz', 'abreviatura' => '8oz'],
            ['nombre' => '12 oz', 'abreviatura' => '12oz'],
            ['nombre' => '16 oz (Pinta)', 'abreviatura' => '16oz'],
            ['nombre' => '24 oz', 'abreviatura' => '24oz'],
            ['nombre' => '32 oz (Quart)', 'abreviatura' => '32oz'],
            ['nombre' => '40 oz', 'abreviatura' => '40oz'],
        ];
        
        foreach ($medidas as $medida) {
            DB::table('medidas')->updateOrInsert(
                ['nombre' => $medida['nombre']],
                array_merge($medida, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // 4. Crear 10 Categorías de ejemplo (idempotente)
        $categorias = [
            ['nombre' => 'Ron', 'descripcion' => 'Rones añejos y blancos'],
            ['nombre' => 'Cerveza', 'descripcion' => 'Cervezas nacionales e importadas'],
            ['nombre' => 'Tequila', 'descripcion' => 'Tequilas reposados, blancos y cristalinos'],
            ['nombre' => 'Whisky', 'descripcion' => 'Single malts y blends'],
            ['nombre' => 'Vodka', 'descripcion' => 'Vodkas premium y saborizados'],
            ['nombre' => 'Vinos', 'descripcion' => 'Vinos tintos, blancos y espumosos'],
            ['nombre' => 'Ginebra', 'descripcion' => 'Gins de estilo London Dry y botánicos'],
            ['nombre' => 'Brandy', 'descripcion' => 'Brandies y Coñacs'],
            ['nombre' => 'Mezcladores', 'descripcion' => 'Sodas, jugos y aguas tónicas'],
            ['nombre' => 'Snacks', 'descripcion' => 'Acompañamientos y boquitas'],
        ];

        foreach ($categorias as $cat) {
            DB::table('categorias')->updateOrInsert(
                ['nombre' => $cat['nombre']],
                array_merge($cat, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }
}
