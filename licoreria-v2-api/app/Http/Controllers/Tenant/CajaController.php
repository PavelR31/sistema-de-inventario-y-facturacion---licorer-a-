<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Caja;
use App\Models\Tenant\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajaController extends Controller
{
    public function status(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;
        
        if (!$sucursalId) {
            return response()->json(['message' => 'Sucursal no especificada'], 422);
        }

        $caja = Caja::where('sucursal_id', $sucursalId)
            ->where('user_id', auth()->id())
            ->where('estado', 'abierta')
            ->first();

        if ($caja) {
            $caja->ventas_totales = $caja->ventas()->sum('total');
            $caja->monto_caja = $caja->monto_apertura + $caja->ventas()->where('metodo_pago', 'efectivo')->sum('total');
        }

        return response()->json([
            'is_open' => !!$caja,
            'caja' => $caja
        ]);
    }

    public function abrir(Request $request)
    {
        $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'monto_apertura' => 'required|numeric|min:0',
        ]);

        $existe = Caja::where('sucursal_id', $request->sucursal_id)
            ->where('user_id', auth()->id())
            ->where('estado', 'abierta')
            ->exists();

        if ($existe) {
            return response()->json(['message' => 'Ya tienes una caja abierta en esta sucursal.'], 422);
        }

        $caja = Caja::create([
            'sucursal_id' => $request->sucursal_id,
            'user_id' => auth()->id(),
            'monto_apertura' => $request->monto_apertura,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
        ]);

        return response()->json($caja, 201);
    }

    public function cerrar(Request $request, Caja $caja)
    {
        $request->validate([
            'monto_cierre' => 'required|numeric|min:0',
        ]);

        if ($caja->estado === 'cerrada') {
            return response()->json(['message' => 'Esta caja ya está cerrada.'], 422);
        }

        // Calcular resumen del turno para la bitácora
        $ventasVigentes      = Venta::where('caja_id', $caja->id)->where('estado', 'vigente');
        $ventasAnuladas      = Venta::where('caja_id', $caja->id)->where('estado', 'anulada')->count();
        $totalEfectivo       = (clone $ventasVigentes)->where('metodo_pago', 'efectivo')->sum('total');
        $totalTarjeta        = (clone $ventasVigentes)->where('metodo_pago', 'tarjeta')->sum('total');
        $totalTransferencia  = (clone $ventasVigentes)->where('metodo_pago', 'transferencia')->sum('total');
        $totalMixto          = (clone $ventasVigentes)->where('metodo_pago', 'mixto')->sum('total');
        $totalVentas         = (clone $ventasVigentes)->sum('total');
        $numTransacciones    = (clone $ventasVigentes)->count();
        $efectivoEsperado    = $caja->monto_apertura + $totalEfectivo;
        $diferencia          = round($request->monto_cierre - $efectivoEsperado, 2);

        $caja->update([
            'monto_cierre' => $request->monto_cierre,
            'estado'       => 'cerrada',
            'fecha_cierre' => now(),
        ]);

        // ── Guardar en Bitácora ──────────────────────────────────────────────
        // accion: 'CIERRE_CAJA' | tabla_afectada: 'cajas' | descripcion: JSON con resumen
        try {
            DB::table('bitacora_actividades')->insert([
                'sucursal_id'     => $caja->sucursal_id,
                'user_id'         => auth()->id(),
                'accion'          => 'CIERRE_CAJA',
                'tabla_afectada'  => 'cajas',
                'descripcion'     => json_encode([
                    'caja_id'             => $caja->id,
                    'cajero'              => auth()->user()?->name,
                    'sucursal_id'         => $caja->sucursal_id,
                    'fecha_apertura'      => $caja->fecha_apertura,
                    'fecha_cierre'        => now()->toDateTimeString(),
                    'monto_apertura'      => round($caja->monto_apertura, 2),
                    'monto_cierre'        => round($request->monto_cierre, 2),
                    'num_transacciones'   => $numTransacciones,
                    'ventas_anuladas'     => $ventasAnuladas,
                    'total_ventas'        => round($totalVentas, 2),
                    'total_efectivo'      => round($totalEfectivo, 2),
                    'total_tarjeta'       => round($totalTarjeta, 2),
                    'total_transferencia' => round($totalTransferencia, 2),
                    'total_mixto'         => round($totalMixto, 2),
                    'efectivo_esperado'   => round($efectivoEsperado, 2),
                    'diferencia'          => $diferencia,
                ], JSON_UNESCAPED_UNICODE),
                'ip_origen'       => request()->ip(),
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        } catch (\Throwable $e) {
            // No bloqueamos el cierre si falla el log
            \Log::warning('No se pudo escribir en bitácora al cerrar caja: ' . $e->getMessage());
        }

        return response()->json($caja->fresh());
    }
}
