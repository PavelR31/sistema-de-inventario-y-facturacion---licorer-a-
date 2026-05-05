<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use App\Models\Central\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\TenantWelcomeMail;

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

        // Buscar el plan propuesto, o predeterminado a 'trial'
        $planId = $request->plan_id;
        $plan = $planId ? Plan::find($planId) : Plan::where('slug', 'trial')->first();

        // Generar una contraseña temporal aleatoria
        $tempPassword = \Illuminate\Support\Str::random(10);

        // La creación de este modelo dispara el pipeline de Tenancy que crea y migra la BD
        $tenantData = [
            'id' => $id,
            'name' => $request->name,
            'email' => $request->email,
            'temp_password' => $tempPassword, // Se guarda en la columna 'data' automáticamente
        ];

        // Asignar licencia si encontramos el plan
        if ($plan) {
            $tenantData['plan_id_fk'] = $plan->id;
            $tenantData['license_status'] = 'trial';
            $tenantData['license_starts_at'] = now();
            $tenantData['license_expires_at'] = now()->addDays(30); // 30 días de prueba
            $tenantData['max_users'] = $plan->max_users;
        }

        $tenant = Tenant::create($tenantData);

        // Asignar dominio/subdominio
        $tenant->domains()->create([
            'domain' => $request->domain
        ]);

        // Enviar correo de bienvenida con las credenciales
        try {
            Mail::to($request->email)->send(new TenantWelcomeMail(
                $request->name,
                $request->domain,
                $request->email,
                $tempPassword
            ));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error enviando correo de bienvenida: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Licorería creada exitosamente. Las credenciales han sido enviadas al correo administrativo.',
            'tenant' => $tenant->load('domains'),
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
