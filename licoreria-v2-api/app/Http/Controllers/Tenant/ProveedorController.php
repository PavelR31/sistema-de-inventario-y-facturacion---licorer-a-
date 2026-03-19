<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Proveedor;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index(Request $request)
    {
        $query = Proveedor::query();
        if ($request->search) {
            $query->where('nombre', 'like', "%{$request->search}%")
                  ->orWhere('ruc', 'like', "%{$request->search}%");
        }
        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:150',
            'ruc' => 'nullable|string|max:20',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
        ]);

        $proveedor = Proveedor::create($request->all());

        return response()->json($proveedor, 201);
    }

    public function show(Proveedor $proveedor)
    {
        return response()->json($proveedor);
    }

    public function update(Request $request, Proveedor $proveedor)
    {
        $request->validate([
            'nombre' => 'string|max:150',
            'ruc' => 'nullable|string|max:20',
            'telefono' => 'nullable|string|max:20',
            'direccion' => 'nullable|string',
        ]);

        $proveedor->update($request->all());

        return response()->json($proveedor);
    }

    public function destroy(Proveedor $proveedor)
    {
        if ($proveedor->compras()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar un proveedor con historial de compras.'], 422);
        }
        $proveedor->delete();
        return response()->json(['message' => 'Proveedor eliminado con éxito.']);
    }
}
