<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Categoria;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    public function index()
    {
        return response()->json(Categoria::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        $categoria = Categoria::create($request->all());

        return response()->json($categoria, 201);
    }

    public function show(Categoria $categoria)
    {
        return response()->json($categoria);
    }

    public function update(Request $request, Categoria $categoria)
    {
        $request->validate([
            'nombre' => 'string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        $categoria->update($request->all());

        return response()->json($categoria);
    }

    public function destroy(Categoria $categoria)
    {
        // En un caso real, validar si tiene productos asociados antes de eliminar
        $categoria->delete();

        return response()->json(['message' => 'Categoría eliminada con éxito.']);
    }
}
