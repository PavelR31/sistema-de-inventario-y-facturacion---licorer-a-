<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\AjusteInventario;
use App\Models\Tenant\Producto;
use App\Models\Tenant\PresentacionProducto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AjusteInventarioController extends Controller
{
    public function index(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;

        $query = AjusteInventario::with(['user', 'producto', 'presentacion'])->latest();

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'sucursal_id'     => 'required|exists:sucursales,id',
            'producto_id'     => 'required|exists:productos,id',
            'presentacion_id' => 'nullable|exists:presentaciones_producto,id',
            'tipo'            => 'required|in:entrada,salida',
            'cantidad'        => 'required|integer|min:1',
            'motivo'          => 'required|string|max:255',
        ]);

        return DB::transaction(function () use ($request) {
            $cantidad = $request->cantidad;
            $tipo = $request->tipo;
            $sucursalId = $request->sucursal_id;

            $cantidadUnidadesBase = 1;
            if ($request->presentacion_id) {
                $presentacion = PresentacionProducto::find($request->presentacion_id);
                if ($presentacion) {
                    $cantidadUnidadesBase = (int) $presentacion->cantidad_unidades;
                }
            }

            $cantidadAjusteTotal = $cantidad * $cantidadUnidadesBase;
            $signoTotal = $tipo === 'entrada' ? 1 : -1;
            $cantidadDescontarOGenerarGlobal = $cantidadAjusteTotal * $signoTotal;

            // 1. Modificar Stock Global Unidades
            $producto = Producto::findOrFail($request->producto_id);
            $pivot = $producto->sucursales()->where('sucursal_id', $sucursalId)->first();
            
            if ($tipo === 'salida') {
                if (!$pivot || $pivot->pivot->stock_actual < $cantidadAjusteTotal) {
                    throw new \Exception("Stock de unidades insuficientes para este ajuste. Tienes " . ($pivot ? $pivot->pivot->stock_actual : 0) . " unid.");
                }
            }

            if ($pivot) {
                $producto->sucursales()->updateExistingPivot($sucursalId, [
                    'stock_actual' => $pivot->pivot->stock_actual + $cantidadDescontarOGenerarGlobal
                ]);
            } else {
                if ($tipo === 'salida') {
                     throw new \Exception("Stock nulo.");
                }
                $producto->sucursales()->attach($sucursalId, [
                    'stock_actual' => $cantidadAjusteTotal,
                    'stock_minimo' => 0,
                    'precio_compra' => 0,
                    'precio_venta' => 0,
                ]);
            }

            // 2. Modificar Stock de Presentación (si aplica)
            if ($request->presentacion_id) {
                $presRow = DB::table('presentacion_sucursal')
                        ->where('presentacion_id', $request->presentacion_id)
                        ->where('sucursal_id', $sucursalId)
                        ->first();
                
                $cantidadAjustePres = $cantidad * $signoTotal;

                if ($tipo === 'salida') {
                     if (!$presRow || $presRow->stock_actual < $cantidad) {
                         throw new \Exception("Stock de presentación insuficiente. Tienes " . ($presRow ? $presRow->stock_actual : 0));
                     }
                }

                if ($presRow) {
                     DB::table('presentacion_sucursal')
                        ->where('presentacion_id', $request->presentacion_id)
                        ->where('sucursal_id', $sucursalId)
                        ->update(['stock_actual' => $presRow->stock_actual + $cantidadAjustePres]);
                } else {
                    DB::table('presentacion_sucursal')->insert([
                        'presentacion_id' => $request->presentacion_id,
                        'sucursal_id'     => $sucursalId,
                        'stock_actual'    => $cantidadAjustePres > 0 ? $cantidadAjustePres : 0,
                        'created_at'      => now(),
                        'updated_at'      => now(),
                    ]);
                }
            }

            // 3. Crear el Registro de Ajuste
            $ajuste = AjusteInventario::create([
                'sucursal_id'     => $sucursalId,
                'producto_id'     => $request->producto_id,
                'presentacion_id' => $request->presentacion_id,
                'user_id'         => auth()->id(),
                'tipo'            => $tipo,
                'cantidad'        => $cantidad,
                'motivo'          => $request->motivo,
            ]);

            return response()->json($ajuste->load(['producto', 'presentacion', 'user']), 201);
        });
    }
}
