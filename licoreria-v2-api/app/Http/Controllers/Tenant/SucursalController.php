<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Sucursal;
use Illuminate\Http\Request;

class SucursalController extends Controller
{
    public function index()
    {
        return response()->json(Sucursal::all());
    }

    public function store(Request $request)
    {
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
}
