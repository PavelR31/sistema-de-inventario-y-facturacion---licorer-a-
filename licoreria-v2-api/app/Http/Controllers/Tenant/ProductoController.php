<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Producto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;

        $query = Producto::with(['categoria', 'sucursales' => function ($q) use ($sucursalId) {
            if ($sucursalId) {
                $q->where('sucursal_id', $sucursalId);
            }
        }]);

        if ($request->has('activo')) {
            $query->where('activo', $request->activo);
        }

        $productos = $query->get()->map(function ($producto) use ($sucursalId) {
            // Si hay sucursal_id, extraemos el stock y precio de esa sucursal
            if ($sucursalId) {
                $branchData = $producto->sucursales->first();
                $producto->stock_actual = $branchData->pivot->stock_actual ?? 0;
                $producto->precio_venta = $branchData->pivot->precio_venta ?? 0;
                $producto->precio_compra = $branchData->pivot->precio_compra ?? 0;
            }

            $producto->stock_total = $producto->sucursales->sum('pivot.stock_actual');
            
            if ($producto->imagen_ruta) {
                $producto->imagen_url = asset('storage/' . $producto->imagen_ruta);
            }
            
            return $producto;
        });

        return response()->json($productos);
    }

    public function store(Request $request)
    {
        $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'nombre' => 'required|string|max:150',
            'sku' => 'nullable|string|max:50|unique:productos,sku',
            'upc' => 'nullable|string|max:50|unique:productos,upc',
            'activo' => 'boolean',
            'imagen' => 'nullable|image|max:2048', // Max 2MB
        ]);

        $data = $request->except(['sucursales', 'imagen']);

        if ($request->hasFile('imagen')) {
            $path = $request->file('imagen')->store('productos', 'public');
            $data['imagen_ruta'] = $path;
        }

        $producto = Producto::create($data);

        return response()->json($producto, 201);
    }

    public function show(Producto $producto)
    {
        return response()->json($producto->load('categoria', 'sucursales'));
    }

    public function update(Request $request, Producto $producto)
    {
        $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'nombre' => 'string|max:150',
            'sku' => 'nullable|string|max:50|unique:productos,sku,' . $producto->id,
            'upc' => 'nullable|string|max:50|unique:productos,upc,' . $producto->id,
            'sucursales' => 'array',
        ]);

        $producto->update($request->except('sucursales'));

        if ($request->has('sucursales')) {
            $syncData = [];
            foreach ($request->sucursales as $s) {
                $syncData[$s['sucursal_id']] = [
                    'stock_actual' => $s['stock_actual'] ?? 0,
                    'stock_minimo' => $s['stock_minimo'] ?? 0,
                    'precio_compra' => $s['precio_compra'] ?? 0,
                    'precio_venta' => $s['precio_venta'] ?? 0,
                ];
            }
            $producto->sucursales()->sync($syncData);
        }

        return response()->json($producto->load('sucursales'));
    }

    public function destroy(Producto $producto)
    {
        $producto->delete();
        return response()->json(['message' => 'Producto eliminado de catálogo global.']);
    }
}
