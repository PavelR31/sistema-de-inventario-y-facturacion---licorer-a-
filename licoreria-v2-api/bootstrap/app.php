<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(\App\Http\Middleware\EnsureValidDomain::class);
        $middleware->api(prepend: [
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'token_from_query'       => \App\Http\Middleware\TokenFromQuery::class,
            'tenant.license'         => \App\Http\Middleware\CheckTenantLicense::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException $e, Request $request) {
            \Log::info('Tenant no identificado por dominio: ' . $request->getHost());
            return response()->json([
                'message' => 'La licorería solicitada no existe en nuestra red de Licora.',
                'error' => 'tenant_not_found'
            ], 404);
        });

        $exceptions->render(function (\Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedByPathException $e, Request $request) {
            \Log::info('Tenant no identificado por ruta: ' . $request->getPathInfo());
            return response()->json([
                'message' => 'Ruta de inquilino no válida.',
                'error' => 'tenant_not_found'
            ], 404);
        });

        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            if ($request->is('api/*')) {
                return true;
            }
            return $request->expectsJson();
        });
    })->create();
