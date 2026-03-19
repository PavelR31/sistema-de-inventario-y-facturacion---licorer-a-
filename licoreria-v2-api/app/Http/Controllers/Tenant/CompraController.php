<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\CompraProveedor;
use App\Models\Tenant\DetalleCompra;
use App\Models\Tenant\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    public function index(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;
        
        $query = CompraProveedor::with(['proveedor', 'sucursal'])->latest();

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($request->fecha) {
            $query->whereDate('created_at', $request->fecha);
        }

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'proveedor_id' => 'required|exists:proveedores,id',
            'numero_factura' => 'nullable|string',
            'fecha_compra' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request) {
            $total = collect($request->items)->sum(fn($item) => $item['cantidad'] * $item['precio_unitario']);

            $compra = CompraProveedor::create([
                'sucursal_id' => $request->sucursal_id,
                'proveedor_id' => $request->proveedor_id,
                'user_id' => auth()->id(),
                'numero_factura' => $request->numero_factura,
                'fecha_compra' => $request->fecha_compra,
                'total' => $total,
                'estado' => 'completado',
            ]);

            foreach ($request->items as $item) {
                $compra->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $item['cantidad'] * $item['precio_unitario'],
                ]);

                // Actualizar Stock en la sucursal
                $producto = Producto::find($item['producto_id']);
                
                // Buscamos si ya existe la relación en la sucursal
                $pivot = $producto->sucursales()->where('sucursal_id', $request->sucursal_id)->first();

                if ($pivot) {
                    $nuevoStock = $pivot->pivot->stock_actual + $item['cantidad'];
                    $producto->sucursales()->updateExistingPivot($request->sucursal_id, [
                        'stock_actual' => $nuevoStock,
                        'precio_compra' => $item['precio_unitario'], // Actualizamos precio de compra al último
                    ]);
                } else {
                    $producto->sucursales()->attach($request->sucursal_id, [
                        'stock_actual' => $item['cantidad'],
                        'stock_minimo' => 0,
                        'precio_compra' => $item['precio_unitario'],
                        'precio_venta' => $item['precio_unitario'] * 1.3, // Margen sugerido 30%
                    ]);
                }
            }

            return response()->json($compra->load('detalles'), 201);
        });
    }

    public function show($id)
    {
        $compra = CompraProveedor::with(['proveedor', 'sucursal', 'detalles.producto'])->findOrFail($id);
        return response()->json($compra);
    }
}
