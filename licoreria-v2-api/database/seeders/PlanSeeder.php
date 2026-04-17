<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Central\Plan;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Trial (Prueba)',
                'slug' => 'trial',
                'description' => 'Ideal para probar el sistema por 30 días.',
                'max_users' => 2,
                'price' => 0.00,
                'is_active' => true,
            ],
            [
                'name' => 'Básico',
                'slug' => 'basico',
                'description' => 'Para pequeñas licorerías.',
                'max_users' => 3,
                'price' => 19.99, // Un aproximado, puedes cambiarlo
                'is_active' => true,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Para negocios medianos con varios cajeros.',
                'max_users' => 10,
                'price' => 49.99,
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Sin límites de usuarios. Para corporaciones.',
                'max_users' => 0, // 0 = Ilimitado
                'price' => 99.99,
                'is_active' => true,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }
    }
}
