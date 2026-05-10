<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Caja;
use App\Models\Tenant\Venta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajaController extends Controller
{
    public function index(Request $request)
    {
        $sucursal_id = $request->header('X-Sucursal-Id') ?? $request->header('X-Branch-Id') ?? $request->sucursal_id;
        
        $query = Caja::query();
        if ($sucursal_id) {
            $query->where('sucursal_id', $sucursal_id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'nombre' => 'required|string|max:100',
        ]);

        $caja = Caja::create([
            'sucursal_id' => $request->sucursal_id,
            'nombre' => $request->nombre,
            'balance_actual' => 0, // Las cajas nuevas siempre inician en 0
            'activa' => true
        ]);
        return response()->json($caja, 201);
    }

    public function show(Caja $caja)
    {
        return response()->json($caja);
    }

    public function update(Request $request, Caja $caja)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:100',
            'activa' => 'sometimes|required|boolean',
        ]);

        // Protegemos el balance_actual para que solo se mueva por transacciones o cierres oficiales
        $caja->update($request->only(['nombre', 'activa']));
        return response()->json($caja);
    }

    public function destroy(Caja $caja)
    {
        $caja->delete();
        return response()->json(null, 204);
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:cajas,id',
        ]);

        $deleted = Caja::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => "$deleted caja(s) eliminada(s) correctamente."]);
    }

    public function sesiones(Caja $caja)
    {
        return response()->json($caja->sesiones()->with('user')->get());
    }
}
