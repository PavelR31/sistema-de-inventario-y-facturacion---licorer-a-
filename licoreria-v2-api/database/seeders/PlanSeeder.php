<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Central\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Prueba (Trial)',
                'slug' => 'trial',
                'description' => 'Periodo de evaluación de 30 días.',
                'max_users' => 2,
                'max_branches' => 1,
                'price' => 0.00,
                'is_active' => true,
            ],
            [
                'name' => 'Básico',
                'slug' => 'basico',
                'description' => 'Ideal para pequeños negocios.',
                'max_users' => 3,
                'max_branches' => 1,
                'price' => 25.00,
                'is_active' => true,
            ],
            [
                'name' => 'Profesional',
                'slug' => 'pro',
                'description' => 'Para negocios en crecimiento.',
                'max_users' => 10,
                'max_branches' => 3,
                'price' => 50.00,
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Sin límites para grandes cadenas.',
                'max_users' => 0, // ilimitado
                'max_branches' => 0, // ilimitado
                'price' => 150.00,
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
