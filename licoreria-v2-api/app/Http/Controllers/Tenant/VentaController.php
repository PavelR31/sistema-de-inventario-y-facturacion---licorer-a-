<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Venta;
use App\Models\Tenant\VentaAnulada;
use App\Models\Tenant\DetalleVenta;
use App\Models\Tenant\Producto;
use App\Models\Tenant\Caja;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VentaController extends Controller
{
    public function index(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;
        
        $query = Venta::with(['user', 'sucursal', 'cliente'])->latest();

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($request->fecha) {
            $query->whereDate('created_at', $request->fecha);
        }

        if ($request->has('mine')) {
            $query->where('user_id', auth()->id());
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request)
    {
        $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.descuento' => 'nullable|numeric|min:0',
            'descuento_global' => 'nullable|numeric|min:0',
            'impuesto_porcentaje' => 'nullable|numeric|min:0',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia,mixto',
            'monto_pagado' => 'required|numeric|min:0',
            'cliente_id' => 'nullable|exists:clientes,id',
        ]);

        // 1. Verificar si hay una caja abierta para este usuario en esta sucursal
        $caja = Caja::where('sucursal_id', $request->sucursal_id)
            ->where('user_id', auth()->id())
            ->where('estado', 'abierta')
            ->first();

        if (!$caja) {
            return response()->json(['message' => 'Debes tener una caja abierta para realizar ventas.'], 422);
        }

        return DB::transaction(function () use ($request, $caja) {
            // 2. Calcular Totales y Validar Stock
            $subtotalAcumulado = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $producto = Producto::findOrFail($item['producto_id']);
                
                // Obtener stock y precio de la sucursal específica
                $pivot = $producto->sucursales()->where('sucursal_id', $request->sucursal_id)->first();
                
                if (!$pivot) {
                    throw new \Exception("El producto '{$producto->nombre}' no está disponible en esta sucursal.");
                }

                if ($pivot->pivot->stock_actual < $item['cantidad']) {
                    throw new \Exception("Stock insuficiente para '{$producto->nombre}'. Disponible: {$pivot->pivot->stock_actual}");
                }

                $precioUnitario = $pivot->pivot->precio_venta;
                $descuentoItem = $item['descuento'] ?? 0;
                $lineSubtotal = ($precioUnitario * $item['cantidad']) - $descuentoItem;
                
                $subtotalAcumulado += $lineSubtotal;

                $itemsData[] = [
                    'producto_id' => $producto->id,
                    'cantidad' => $item['cantidad'],
                    'descuento' => $descuentoItem,
                    'precio_unitario' => $precioUnitario,
                    'subtotal' => $lineSubtotal,
                ];
            }

            // 3. Aplicar Descuento Global y Calcular Impuestos
            $descuentoGlobal = $request->descuento_global ?? 0;
            $montoImponible = max(0, $subtotalAcumulado - $descuentoGlobal);
            
            $porcentajeImpuesto = $request->impuesto_porcentaje ?? 0;
            $montoImpuesto = round($montoImponible * ($porcentajeImpuesto / 100), 2);
            
            $totalFinal = $montoImponible + $montoImpuesto;

            // 4. Generar número de factura (Ticket)
            $count = Venta::count() + 1;
            $numeroFactura = 'TK-' . str_pad((string)$count, 8, '0', STR_PAD_LEFT);

            // 5. Crear la Venta
            $venta = Venta::create([
                'sucursal_id' => $request->sucursal_id,
                'caja_id' => $caja->id,
                'cliente_id' => $request->cliente_id,
                'user_id' => auth()->id(),
                'numero_factura' => $numeroFactura,
                'subtotal' => $subtotalAcumulado,
                'descuento' => $descuentoGlobal,
                'impuesto' => $montoImpuesto,
                'impuesto_porcentaje' => $porcentajeImpuesto,
                'total' => $totalFinal,
                'metodo_pago' => $request->metodo_pago,
                'monto_pagado' => $request->monto_pagado,
                'cambio' => max(0, $request->monto_pagado - $totalFinal),
                'estado' => 'vigente',
            ]);

            // 5. Crear Detalles y Actualizar Stock
            foreach ($itemsData as $item) {
                $venta->detalles()->create($item);

                // Descontar Stock
                DB::table('producto_sucursal')
                    ->where('producto_id', $item['producto_id'])
                    ->where('sucursal_id', $request->sucursal_id)
                    ->decrement('stock_actual', $item['cantidad']);
            }

            return response()->json($venta->load('detalles.producto'), 201);
        });
    }

    public function show($id)
    {
        $venta = Venta::with(['detalles.producto', 'user', 'sucursal', 'cliente'])->findOrFail($id);
        return response()->json($venta);
    }

    public function print($id)
    {
        $venta = Venta::with(['detalles.producto', 'user', 'sucursal', 'cliente'])->findOrFail($id);
        $logo = \App\Models\Tenant\Configuracion::getVal('logo_empresa');
        $moneda = \App\Models\Tenant\Configuracion::getVal('simbolo_moneda', 'C$');
        
        return view('tickets.receipt', compact('venta', 'logo', 'moneda'));
    }

    public function anular(Request $request, $id)
    {
        $request->validate([
            'motivo' => 'required|string|max:255',
        ]);

        $venta = Venta::with('detalles')->findOrFail($id);

        if ($venta->estado === 'anulada') {
            return response()->json(['message' => 'Esta venta ya está anulada.'], 422);
        }

        return DB::transaction(function () use ($venta, $request) {
            // 1. Cambiar estado de la venta
            $venta->update(['estado' => 'anulada']);

            // 2. Registrar anulación
            VentaAnulada::create([
                'venta_id' => $venta->id,
                'user_id' => auth()->id(),
                'motivo' => $request->motivo,
                'fecha_anulacion' => now(),
            ]);

            // 3. Restaurar stock
            foreach ($venta->detalles as $detalle) {
                DB::table('producto_sucursal')
                    ->where('producto_id', $detalle->producto_id)
                    ->where('sucursal_id', $venta->sucursal_id)
                    ->increment('stock_actual', $detalle->cantidad);
            }

            return response()->json([
                'message' => 'Venta anulada correctamente.',
                'venta' => $venta->fresh()
            ]);
        });
    }
}
