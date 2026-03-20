<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\CajaEgreso;
use App\Models\Tenant\CajaSesion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajaEgresoController extends Controller
{
    public function index(Request $request)
    {
        $sesionId = $request->caja_sesion_id;
        if (!$sesionId) {
            return response()->json(['message' => 'ID de sesión requerido'], 400);
        }

        return response()->json(CajaEgreso::where('caja_sesion_id', $sesionId)->with('user')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'motivo' => 'required|string|max:255',
        ]);

        // Obtener sesión activa del usuario
        $sesion = CajaSesion::where('user_id', $request->user()->id)
            ->where('estado', 'abierta')
            ->first();

        if (!$sesion) {
            return response()->json(['message' => 'No tienes una sesión de caja abierta.'], 422);
        }

        $egreso = CajaEgreso::create([
            'caja_sesion_id' => $sesion->id,
            'user_id' => $request->user()->id,
            'monto' => $request->monto,
            'motivo' => $request->motivo,
        ]);

        return response()->json($egreso, 201);
    }
}
