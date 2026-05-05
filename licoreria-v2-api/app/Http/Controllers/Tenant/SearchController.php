<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Producto;
use App\Models\Tenant\Venta;
use App\Models\Tenant\Cliente;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SearchController extends Controller
{
    public function global(Request $request)
    {
        try {
            $q = $request->get('q');
            if (!$q || strlen($q) < 2) {
                return response()->json([]);
            }

            $results = [];

            // Productos
            $productos = Producto::where('nombre', 'LIKE', "%{$q}%")
                ->orWhere('sku', 'LIKE', "%{$q}%")
                ->limit(10)
                ->get(['id', 'nombre', 'sku'])
                ->map(function($p) {
                    return [
                        'type' => 'Producto',
                        'title' => $p->nombre,
                        'sub' => "SKU: {$p->sku}",
                        'url' => "/admin/productos",
                        'icon' => 'package'
                    ];
                });
            $results = array_merge($results, $productos->toArray());

            // Ventas
            $ventas = Venta::where('numero_factura', 'LIKE', "%{$q}%")
                ->limit(10)
                ->get()
                ->map(function($v) {
                    return [
                        'type' => 'Venta',
                        'title' => "Factura #{$v->numero_factura}",
                        'sub' => "Total: " . number_format($v->total, 2) . " | " . ($v->created_at ? $v->created_at->format('d/m/Y') : 'Sin fecha'),
                        'url' => "/admin/ventas",
                        'icon' => 'receipt'
                    ];
                });
            $results = array_merge($results, $ventas->toArray());

            // Usuarios
            $users = User::where('name', 'LIKE', "%{$q}%")
                ->limit(5)
                ->get(['id', 'name', 'email'])
                ->map(function($u) {
                    return [
                        'type' => 'Usuario',
                        'title' => $u->name,
                        'sub' => $u->email,
                        'url' => "/admin/usuarios",
                        'icon' => 'user'
                    ];
                });
            $results = array_merge($results, $users->toArray());

            return response()->json($results);

        } catch (\Exception $e) {
            Log::error("Global Search Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Error interno en la búsqueda',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
