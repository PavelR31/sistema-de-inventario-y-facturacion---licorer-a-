<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Caja;
use App\Models\Tenant\CajaSesion;
use App\Models\Tenant\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\DailyCashRegisterReportMail;
use Carbon\Carbon;

class CajaSesionController extends Controller
{
    public function active(Request $request)
    {
        $sesion = CajaSesion::where('user_id', $request->user()->id)
            ->where('estado', 'abierta')
            ->first();

        if ($sesion) {
            $sesion->load('caja', 'user');
            // Calcular ventas en efectivo para el arqueo
            $sesion->ventas_efectivo = Venta::where('caja_sesion_id', $sesion->id)
                ->where('estado', 'vigente')
                ->where('metodo_pago', 'efectivo')
                ->sum('total');
            
            $sesion->ventas_totales = Venta::where('caja_sesion_id', $sesion->id)
                ->where('estado', 'vigente')
                ->sum('total');

            $sesion->egresos_totales = \App\Models\Tenant\CajaEgreso::where('caja_sesion_id', $sesion->id)
                ->sum('monto');
        }

        return response()->json($sesion);
    }

    public function listDisponibles(Request $request)
    {
        $sucursal_id = $request->header('X-Sucursal-Id') ?? $request->header('X-Branch-Id') ?? $request->sucursal_id;
        
        if (!$sucursal_id) {
            return response()->json(['message' => 'No se especificó la sucursal.'], 400);
        }

        // Cajas físicas de esta sucursal que NO tienen una sesión abierta
        $cajas = Caja::where('sucursal_id', $sucursal_id)
            ->where('activa', true)
            ->whereDoesntHave('sesiones', function($q) {
                $q->where('estado', 'abierta');
            })
            ->get();

        return response()->json($cajas);
    }

    public function abrir(Request $request)
    {
        $request->validate([
            'caja_id' => 'required|exists:cajas,id',
            'monto_real' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request) {
            $caja = Caja::lockForUpdate()->find($request->caja_id);

            // Verificar si la caja ya está ocupada
            $ocupada = CajaSesion::where('caja_id', $caja->id)->where('estado', 'abierta')->exists();
            if ($ocupada) {
                return response()->json(['message' => 'Esta caja ya tiene una sesión activa.'], 422);
            }

            // Verificar si el usuario ya tiene otra sesión abierta
            $usuarioOcupado = CajaSesion::where('user_id', $request->user()->id)->where('estado', 'abierta')->exists();
            if ($usuarioOcupado) {
                return response()->json(['message' => 'Ya tienes una sesión abierta en otra caja.'], 422);
            }

            $aperturaEsperada = $caja->balance_actual;
            $aperturaReal = $request->monto_real;
            $discrepancia = $aperturaReal - $aperturaEsperada;

            $sesion = CajaSesion::create([
                'caja_id' => $caja->id,
                'user_id' => $request->user()->id,
                'apertura_esperada' => $aperturaEsperada,
                'apertura_real' => $aperturaReal,
                'discrepancia_apertura' => $discrepancia,
                'estado' => 'abierta',
                'fecha_apertura' => now(),
            ]);

            return response()->json($sesion);
        });
    }

    public function cerrar(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['message' => 'ID de sesión inválido'], 400);
        }
        $request->validate([
            'monto_real' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($request, $id) {
            $sesion = CajaSesion::lockForUpdate()->findOrFail($id);

            if ($sesion->estado !== 'abierta') {
                return response()->json(['message' => 'La sesión ya está cerrada.'], 422);
            }

            // Calcular ventas en efectivo durante esta sesión
            $ventasEfectivo = Venta::where('caja_sesion_id', $sesion->id)
                ->where('metodo_pago', 'efectivo')
                ->where('estado', 'vigente')
                ->sum('total');

            $egresos = \App\Models\Tenant\CajaEgreso::where('caja_sesion_id', $sesion->id)
                ->sum('monto');

            $cierreEsperado = $sesion->apertura_real + $ventasEfectivo - $egresos;
            $cierreReal = $request->monto_real;
            $discrepancia = $cierreReal - $cierreEsperado;

            $sesion->update([
                'cierre_esperado' => $cierreEsperado,
                'cierre_real' => $cierreReal,
                'discrepancia_cierre' => $discrepancia,
                'estado' => 'cerrada',
                'fecha_cierre' => now(),
            ]);

            // ACTUALIZAR BALANCE PERSISTENTE DE LA CAJA FÍSICA
            $caja = $sesion->caja;
            $caja->update([
                'balance_actual' => $cierreReal
            ]);

            // Enviar correo de reporte de cierre
            try {
                $adminEmail = tenant('email');
                if ($adminEmail) {
                    $ventasTotales = Venta::where('caja_sesion_id', $sesion->id)->where('estado', 'vigente')->sum('total');
                    $ingresosExtra = 0; // Podrías implementar ingresos manuales luego

                    $reportData = [
                        'sucursal' => $caja->sucursal->nombre ?? 'Sucursal Principal',
                        'apertura' => $sesion->fecha_apertura,
                        'cierre' => $sesion->fecha_cierre,
                        'usuario' => $sesion->user->name ?? 'Usuario',
                        'monto_inicial' => number_format($sesion->apertura_real, 2),
                        'ventas_totales' => number_format($ventasTotales, 2),
                        'ingresos_extra' => number_format($ingresosExtra, 2),
                        'egresos' => number_format($egresos, 2),
                        'monto_esperado' => number_format($cierreEsperado, 2),
                        'monto_real' => number_format($cierreReal, 2),
                        'diferencia' => number_format($discrepancia, 2),
                        'observaciones' => $request->observaciones ?? 'Ninguna',
                    ];

                    Mail::to($adminEmail)->send(new DailyCashRegisterReportMail($reportData));
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Error enviando reporte de caja: " . $e->getMessage());
            }

            return response()->json($sesion);
        });
    }
}
