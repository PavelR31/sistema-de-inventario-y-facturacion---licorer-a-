<?php

namespace App\Http\Middleware\Tenant;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckCajaSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $sucursalId = $request->header('X-Sucursal-Id') ?? $request->sucursal_id;

        $sesion = \App\Models\Tenant\CajaSesion::where('user_id', $request->user()->id)
            ->where('estado', 'abierta')
            ->whereHas('caja', function($q) use ($sucursalId) {
                $q->where('sucursal_id', $sucursalId);
            })
            ->first();

        if (!$sesion) {
            return response()->json([
                'message' => 'No tienes una sesión de caja abierta en esta sucursal.',
                'require_caja' => true
            ], 403);
        }

        // Inyectar la sesión en el request
        $request->merge(['active_caja_session' => $sesion]);

        return $next($request);
    }
}
