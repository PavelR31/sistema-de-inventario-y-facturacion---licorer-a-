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
            'sucursal_id'             => 'required|exists:sucursales,id',
            'proveedor_id'            => 'required|exists:proveedores,id',
            'numero_factura'          => 'nullable|string',
            'fecha_compra'            => 'required|date',
            'items'                   => 'required|array|min:1',
            'items.*.producto_id'     => 'required|exists:productos,id',
            'items.*.presentacion_id' => 'nullable|exists:presentaciones_producto,id',
            'items.*.cantidad'        => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request) {
            $total = collect($request->items)->sum(fn($item) => $item['cantidad'] * $item['precio_unitario']);

            $compra = CompraProveedor::create([
                'sucursal_id'    => $request->sucursal_id,
                'proveedor_id'   => $request->proveedor_id,
                'user_id'        => auth()->id(),
                'numero_factura' => $request->numero_factura,
                'fecha_compra'   => $request->fecha_compra,
                'total'          => $total,
                'estado'         => 'completado',
            ]);

            foreach ($request->items as $item) {
                $presentacion            = null;
                $cantidadUnidadesBase    = 1;
                $precioUnitarioBase      = $item['precio_unitario'];

                if (!empty($item['presentacion_id'])) {
                    $presentacion         = \App\Models\Tenant\PresentacionProducto::find($item['presentacion_id']);
                    if ($presentacion) {
                        $cantidadUnidadesBase = (int) $presentacion->cantidad_unidades;
                        $precioUnitarioBase   = $item['precio_unitario'] / max($cantidadUnidadesBase, 1);
                    }
                }

                // Detalle de compra (cantidad = número de presentaciones o unidades compradas)
                $compra->detalles()->create([
                    'producto_id'     => $item['producto_id'],
                    'presentacion_id' => $item['presentacion_id'] ?? null,
                    'cantidad'        => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal'        => $item['cantidad'] * $item['precio_unitario'],
                ]);

                $producto     = Producto::find($item['producto_id']);
                $sucursalId   = $request->sucursal_id;

                // 1. Stock global de UNIDADES (para totales de inventario)
                $unidadesAgregadas = $item['cantidad'] * $cantidadUnidadesBase;
                $pivot = $producto->sucursales()->where('sucursal_id', $sucursalId)->first();

                if ($pivot) {
                    $producto->sucursales()->updateExistingPivot($sucursalId, [
                        'stock_actual'  => $pivot->pivot->stock_actual + $unidadesAgregadas,
                        'precio_compra' => $precioUnitarioBase,
                    ]);
                } else {
                    $producto->sucursales()->attach($sucursalId, [
                        'stock_actual'  => $unidadesAgregadas,
                        'stock_minimo'  => 0,
                        'precio_compra' => $precioUnitarioBase,
                        'precio_venta'  => $precioUnitarioBase * 1.3,
                    ]);
                }

                // 2. Stock por PRESENTACIÓN (para controlar qué formatos se pueden vender)
                if ($presentacion) {
                    $presStock = $presentacion->sucursales()->where('sucursal_id', $sucursalId)->first();
                    if ($presStock) {
                        $presentacion->sucursales()->updateExistingPivot($sucursalId, [
                            'stock_actual' => $presStock->pivot->stock_actual + $item['cantidad'],
                        ]);
                    } else {
                        $presentacion->sucursales()->attach($sucursalId, [
                            'stock_actual' => $item['cantidad'],
                        ]);
                    }
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
