<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Medida;
use Illuminate\Http\Request;

class MedidaController extends Controller
{
    public function index()
    {
        return response()->json(Medida::orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:50|unique:medidas,nombre',
            'abreviatura' => 'nullable|string|max:10'
        ]);

        $medida = Medida::create($validated);

        return response()->json($medida, 201);
    }

    public function show(Medida $medida)
    {
        return response()->json($medida);
    }

    public function update(Request $request, Medida $medida)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:50|unique:medidas,nombre,' . $medida->id,
            'abreviatura' => 'nullable|string|max:10'
        ]);

        $medida->update($validated);

        return response()->json($medida);
    }

    public function destroy(Medida $medida)
    {
        $medida->delete();
        return response()->json(null, 204);
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:medidas,id',
        ]);

        $deleted = Medida::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => "$deleted medida(s) eliminada(s) correctamente."]);
    }
}
