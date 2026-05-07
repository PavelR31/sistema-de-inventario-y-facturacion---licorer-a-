<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException;

class EnsureValidDomain
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $hostname = $request->getHost();
        $centralDomains = config('tenancy.central_domains', []);

        // Si es un dominio central, permitir
        if (in_array($hostname, $centralDomains)) {
            return $next($request);
        }

        // Si no es central, verificar si existe como tenant
        // El middleware de Stancl Tenancy se encargará de esto en las rutas de tenant,
        // pero para rutas globales o errores de 404, queremos asegurar que no se consuma nada.
        
        $domainModel = config('tenancy.domain_model');
        $exists = $domainModel::where('domain', $hostname)->exists();

        if (!$exists) {
            throw new TenantCouldNotBeIdentifiedOnDomainException($hostname);
        }

        return $next($request);
    }
}
