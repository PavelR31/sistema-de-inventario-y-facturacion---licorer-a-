<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // Estadísticas globales del SaaS (cantidad de clientes, etc.)
        return response()->json([
            'total_tenants' => Tenant::count(),
            'recent_tenants' => Tenant::latest()->take(5)->with('domains')->get(),
            // 'revenue' => ... (Si manejas planes)
        ]);
    }
}
