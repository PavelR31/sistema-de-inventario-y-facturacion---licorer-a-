<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Configuracion;
use Illuminate\Http\Request;

class ConfiguracionController extends Controller
{
    /**
     * Listar todas las configuraciones.
     */
    public function index()
    {
        return response()->json(Configuracion::all()->pluck('valor', 'clave'));
    }

    /**
     * Actualizar una configuración específica.
     */
    public function update(Request $request)
    {
        $request->validate([
            'clave' => 'required|string',
            'valor' => 'required',
        ]);

        $config = Configuracion::setVal($request->clave, $request->valor);

        return response()->json([
            'message' => 'Configuración actualizada con éxito.',
            'config'  => $config,
        ]);
    }
}
