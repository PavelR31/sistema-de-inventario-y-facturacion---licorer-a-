<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use App\Models\Central\Plan;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LicenseController extends Controller
{
    /**
     * Obtener el catálogo de planes disponibles.
     */
    public function plans()
    {
        $plans = Plan::where('is_active', true)->get();
        return response()->json($plans);
    }

    /**
     * Listar tenants con información de su licencia.
     */
    public function index()
    {
        // Traemos los tenants con su plan
        $tenants = Tenant::with(['domains', 'plan'])->get();

        // Mapeamos para no enviar los datos muy crudos y calcular stats
        $transformed = $tenants->map(function ($tenant) {
            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'domain' => $tenant->domains->first()?->domain,
                'plan' => $tenant->plan,
                'license' => [
                    'status' => $tenant->license_status,
                    'starts_at' => $tenant->license_starts_at,
                    'expires_at' => $tenant->license_expires_at,
                    'days_remaining' => $tenant->daysUntilExpiration(),
                    'max_users' => $tenant->plan?->max_users ?? $tenant->max_users,
                    'active_users' => $tenant->activeUserCount(),
                    'max_branches' => $tenant->plan?->max_branches ?? 1,
                    'active_branches' => $tenant->activeBranchCount(),
                    'is_usable' => $tenant->isLicenseUsable(),
                ]
            ];
        });

        return response()->json($transformed);
    }

    /**
     * Ver detalles completos de la licencia de un tenant.
     */
    public function show(Tenant $tenant)
    {
        $tenant->load('plan', 'domains');
        
        return response()->json([
            'tenant' => $tenant,
            'license' => [
                'status' => $tenant->license_status,
                'starts_at' => $tenant->license_starts_at,
                'expires_at' => $tenant->license_expires_at,
                'days_remaining' => $tenant->daysUntilExpiration(),
                'max_users' => $tenant->plan?->max_users ?? $tenant->max_users,
                'active_users' => $tenant->activeUserCount(),
                'max_branches' => $tenant->plan?->max_branches ?? 1,
                'active_branches' => $tenant->activeBranchCount(),
                'usage_percent' => $tenant->userUsagePercent(),
                'is_usable' => $tenant->isLicenseUsable(),
            ]
        ]);
    }

    /**
     * Renovar o cambiar el plan de un tenant.
     */
    public function renew(Request $request, Tenant $tenant)
    {
        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'months'  => 'required|integer|min:1|max:60',
        ]);

        $plan = Plan::find($request->plan_id);

        $months = (int) $request->months;

        // Calcular nueva fecha de expiración
        $currentExpiry = $tenant->license_expires_at;
        
        // Si ya expiró o estaba suspendido, contamos desde hoy. 
        // Si todavía tiene días, se los sumamos a partir de la fecha actual de expiración.
        if (!$currentExpiry || $currentExpiry->isPast() || $tenant->isLicenseSuspended()) {
            $newExpiry = now()->addMonths($months);
            $newStarts = now();
        } else {
            $newExpiry = $currentExpiry->copy()->addMonths($months);
            $newStarts = $tenant->license_starts_at;
        }

        $tenant->update([
            'plan_id_fk' => $plan->id,
            'license_status' => 'active', // renovar quita el flag de trial/suspend/expired
            'license_starts_at' => $newStarts,
            'license_expires_at' => $newExpiry,
            'max_users' => $plan->max_users,
        ]);

        return response()->json([
            'message' => 'Licencia renovada exitosamente.',
            'tenant' => $tenant->fresh('plan')
        ]);
    }

    /**
     * Suspender un tenant manualmente.
     */
    public function suspend(Tenant $tenant)
    {
        $tenant->update([
            'license_status' => 'suspended'
        ]);

        return response()->json([
            'message' => 'Licería suspendida por administración.',
            'tenant' => $tenant
        ]);
    }

    /**
     * Reactivar un tenant suspendido.
     */
    public function activate(Tenant $tenant)
    {
        // Evaluamos en qué estado debería quedar según su fecha
        $status = 'active';
        if ($tenant->license_expires_at && $tenant->license_expires_at->isPast()) {
            $status = 'expired';
        }

        $tenant->update([
            'license_status' => $status
        ]);

        return response()->json([
            'message' => 'Licería reactivada.',
            'tenant' => $tenant
        ]);
    }
}
