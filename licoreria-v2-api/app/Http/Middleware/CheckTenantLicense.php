<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Central\Tenant;

class CheckTenantLicense
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Tenant $tenant */
        $tenant = tenant();

        if (!$tenant) {
            return $next($request);
        }

        // 1. Verificamos si la licencia está suspendida administrativamente
        if ($tenant->isLicenseSuspended()) {
            return response()->json([
                'error' => 'Licencia suspendida',
                'message' => 'El servicio ha sido suspendido. Por favor, contacte con administración.'
            ], 403);
        }

        // 2. Verificamos expiración. 
        // Si tiene fecha fijada y ya pasó, bloqueamos
        if ($tenant->hasExpiredDate() && !$tenant->isLicenseExpired()) {
            // Técnicamente ya expiró por fecha, deberíamos actualizar el status a 'expired'
            // Pero para no hacer un update en cada request, lo bloqueamos visualmente. 
            // El comando programado en Schedule se encargará de actualizar la DB.
            return response()->json([
                'error' => 'Licencia expirada',
                'message' => 'Su licencia ha expirado. Por favor registre su pago para renovar.'
            ], 403);
        }

        // Si explícitamente está en expired, bloqueamos
        if ($tenant->isLicenseExpired()) {
            return response()->json([
                'error' => 'Licencia expirada',
                'message' => 'Su licencia ha expirado. Por favor registre su pago para renovar.'
            ], 403);
        }

        // 3. Verificamos límites de uso (Esto es más preventivo, opcional en cada request)
        // Generalmente es mejor limitarlo solo en los endpoints de "Crear Usuario"
        // Pero lo dejamos documentado.

        return $next($request);
    }
}
