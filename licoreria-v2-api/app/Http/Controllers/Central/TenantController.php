<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with('domains')->get();
        return response()->json($tenants);
    }

    public function store(Request $request)
    {
        $id = $request->id;
        // Si no viene dominio, generamos uno por defecto usando el ID
        if (!$request->has('domain')) {
            $request->merge(['domain' => $id . '.' . config('tenancy.central_domains')[0]]);
        }

        $request->validate([
            'id' => 'required|string|unique:tenants,id',
            'name' => 'required|string',
            'email' => 'required|email',
            'domain' => 'required|string|unique:domains,domain',
            'plan_id' => 'nullable|integer',
        ]);

        // Generar una contraseña temporal aleatoria
        $tempPassword = \Illuminate\Support\Str::random(10);

        // La creación de este modelo dispara el pipeline de Tenancy que crea y migra la BD
        $tenant = Tenant::create([
            'id' => $id,
            'name' => $request->name,
            'email' => $request->email,
            'temp_password' => $tempPassword, // Se guarda en la columna 'data' automáticamente
        ]);

        // Asignar dominio/subdominio
        $tenant->domains()->create([
            'domain' => $request->domain
        ]);

        return response()->json([
            'message' => 'Licorería creada e inicializada exitosamente.',
            'tenant' => $tenant->load('domains'),
            'temporary_password' => $tempPassword, // Devolvemos la clave para que el FE la muestre
        ], 201);
    }

    public function show(Tenant $tenant)
    {
        return response()->json($tenant->load('domains'));
    }

    public function update(Request $request, Tenant $tenant)
    {
        $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
        ]);

        $tenant->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json([
            'message' => 'Licorería actualizada correctamente.',
            'tenant' => $tenant->load('domains'),
        ]);
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete(); // Tenancy se encarga de eliminar la base de datos si así está configurado
        return response()->json(['message' => 'Licorería eliminada con éxito.']);
    }
}
