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
            'balance_actual' => 'nullable|numeric|min:0',
        ]);

        $caja = Caja::create($request->all());
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
            'balance_actual' => 'sometimes|required|numeric|min:0',
            'activa' => 'sometimes|required|boolean',
        ]);

        $caja->update($request->all());
        return response()->json($caja);
    }

    public function destroy(Caja $caja)
    {
        // Verificar si tiene sesiones antes de eliminar o simplemente desactivar
        if ($caja->sesiones()->exists()) {
            return response()->json(['message' => 'No se puede eliminar una caja con historial de sesiones.'], 422);
        }

        $caja->delete();
        return response()->json(null, 204);
    }

    public function sesiones(Caja $caja)
    {
        return response()->json($caja->sesiones()->with('user')->get());
    }
}
