<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Empaque;
use Illuminate\Http\Request;

class EmpaqueController extends Controller
{
    public function index()
    {
        return response()->json(Empaque::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'cantidad_unidades' => 'required|integer|min:1',
        ]);

        $empaque = Empaque::create($data);

        return response()->json($empaque, 201);
    }

    public function update(Request $request, Empaque $empaque)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:100',
            'cantidad_unidades' => 'required|integer|min:1',
        ]);

        $empaque->update($data);

        return response()->json($empaque);
    }

    public function destroy(Empaque $empaque)
    {
        // For simplicity, we just delete it. If they want soft deletes or constraints, we can add later.
        $empaque->delete();
        return response()->json(['message' => 'Empaque eliminado correctamente.']);
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:empaques,id',
        ]);

        $deleted = Empaque::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => "$deleted empaque(s) eliminado(s) correctamente."]);
    }
}
