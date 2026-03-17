<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Caja;
use Illuminate\Http\Request;

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

        // Verificar si ya tiene una abierta
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

        $caja->update([
            'monto_cierre' => $request->monto_cierre,
            'estado' => 'cerrada',
            'fecha_cierre' => now(),
        ]);

        return response()->json($caja);
    }
}
