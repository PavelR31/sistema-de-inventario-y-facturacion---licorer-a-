<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Sucursal;
use Illuminate\Http\Request;

class SucursalController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Sucursal::query();

        // Si no es administrador y no tiene permiso global, filtrar por su sucursal asignada
        if (!$user->hasRole('Administrador') && !$user->hasPermissionTo('ver.sucursales')) {
            if ($user->sucursal_id) {
                $query->where('id', $user->sucursal_id);
            } else {
                // Si no tiene sucursal asignada y no es admin, no ve nada (o podrías decidir que vea la principal)
                return response()->json(['data' => [], 'total' => 0]);
            }
        }

        if ($request->search) {
            $query->where('nombre', 'like', "%{$request->search}%");
        }

        if ($request->has('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        if (tenant()->isBranchLimitReached()) {
            return response()->json([
                'message' => 'Límite de sucursales alcanzado.',
                'error' => 'Tu plan actual no permite crear más sucursales.'
            ], 403);
        }

        $request->validate([
            'nombre' => 'required|string|max:100',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:20',
            'estado' => 'boolean',
        ]);

        $sucursal = Sucursal::create($request->all());

        return response()->json($sucursal, 201);
    }

    public function show(Sucursal $sucursal)
    {
        return response()->json($sucursal);
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $request->validate([
            'nombre' => 'string|max:100',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:20',
            'estado' => 'boolean',
        ]);

        $sucursal->update($request->all());

        return response()->json($sucursal);
    }

    public function destroy(Sucursal $sucursal)
    {
        $sucursal->delete();

        return response()->json(['message' => 'Sucursal eliminada.']);
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:sucursales,id',
        ]);

        $deleted = Sucursal::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => "$deleted sucursal(es) eliminada(s) correctamente."]);
    }
}
