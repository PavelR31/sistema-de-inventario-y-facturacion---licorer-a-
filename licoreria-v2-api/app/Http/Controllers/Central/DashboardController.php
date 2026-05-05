<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use App\Models\Central\Plan;
use Illuminate\Support\Facades\Storage;

class DashboardController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $tenants = Tenant::with(['domains', 'plan'])->get();
        $globalStats = $this->getGlobalSalesData($tenants, $startDate, $endDate);

        // Conteos por estado de licencia
        $statusCounts = [
            'active'    => $tenants->where('license_status', 'active')->count(),
            'trial'     => $tenants->where('license_status', 'trial')->count(),
            'suspended' => $tenants->where('license_status', 'suspended')->count(),
            'expired'   => $tenants->where('license_status', 'expired')->count(),
        ];

        // Tenants con licencia por expirar (próximos 7 días)
        $expiringSoon = $tenants->filter(function ($t) {
            $days = $t->daysUntilExpiration();
            return $days !== null && $days <= 7 && $days > 0;
        })->count();

        // Info de backups
        $backupInfo = $this->getBackupInfo();

        return response()->json([
            'total_tenants'    => $tenants->count(),
            'status_counts'    => $statusCounts,
            'expiring_soon'    => $expiringSoon,
            'total_plans'      => Plan::where('is_active', true)->count(),
            'recent_tenants'   => $tenants->sortByDesc('created_at')->take(5)->map(function ($t) {
                return [
                    'id'             => $t->id,
                    'name'           => $t->name,
                    'email'          => $t->email,
                    'domain'         => $t->domains->first()?->domain,
                    'license_status' => $t->license_status,
                    'plan_name'      => $t->plan?->name ?? '—',
                    'created_at'     => $t->created_at,
                ];
            })->values(),
            'backup'           => $backupInfo,
            'global_sales'     => $globalStats,
        ]);
    }

    private function getGlobalSalesData($tenants, $startDate = null, $endDate = null): array
    {
        $totalSales = 0;
        $salesToday = 0;
        $salesThisMonth = 0;
        $monthlyTrend = [];

        // Determinar el rango para la tendencia (por defecto últimos 6 meses si no hay fechas)
        $trendStart = $startDate ? \Carbon\Carbon::parse($startDate) : now()->subMonths(5)->startOfMonth();
        $trendEnd = $endDate ? \Carbon\Carbon::parse($endDate) : now()->endOfMonth();

        // Generar las llaves de los meses en el rango
        $tempDate = $trendStart->copy()->startOfMonth();
        while ($tempDate->lte($trendEnd)) {
            $monthlyTrend[$tempDate->format('Y-m')] = 0;
            $tempDate->addMonth();
        }

        foreach ($tenants as $tenant) {
            try {
                $tenant->run(function () use (&$totalSales, &$salesToday, &$salesThisMonth, &$monthlyTrend, $startDate, $endDate) {
                    // Total en el rango (o histórico si no hay fechas)
                    $queryTotal = \DB::table('ventas')->where('estado', 'vigente');
                    if ($startDate) $queryTotal->whereDate('created_at', '>=', $startDate);
                    if ($endDate) $queryTotal->whereDate('created_at', '<=', $endDate);
                    $totalSales += $queryTotal->sum('total');

                    // Hoy (siempre hoy)
                    $salesToday += \DB::table('ventas')
                        ->where('estado', 'vigente')
                        ->whereDate('created_at', now()->toDateString())
                        ->sum('total');

                    // Mes actual (siempre mes actual)
                    $salesThisMonth += \DB::table('ventas')
                        ->where('estado', 'vigente')
                        ->whereYear('created_at', now()->year)
                        ->whereMonth('created_at', now()->month)
                        ->sum('total');

                    // Tendencia (dentro del rango seleccionado)
                    foreach (array_keys($monthlyTrend) as $monthKey) {
                        [$year, $month] = explode('-', $monthKey);
                        $monthlyTrend[$monthKey] += \DB::table('ventas')
                            ->where('estado', 'vigente')
                            ->whereYear('created_at', $year)
                            ->whereMonth('created_at', $month)
                            ->sum('total');
                    }
                });
            } catch (\Throwable $e) {
                continue;
            }
        }

        // Formatear tendencia para el frontend (charts)
        $chartData = [];
        foreach ($monthlyTrend as $month => $total) {
            $chartData[] = [
                'month' => $month,
                'total' => round($total, 2)
            ];
        }

        return [
            'total_historical' => round($totalSales, 2),
            'sales_today'      => round($salesToday, 2),
            'sales_this_month' => round($salesThisMonth, 2),
            'monthly_trend'    => $chartData,
        ];
    }

    private function getBackupInfo(): array
    {
        try {
            $disk = Storage::disk('backups');
            $appName = config('backup.backup.name');

            $allFiles = collect($disk->allFiles())
                ->filter(fn($f) => str_ends_with($f, '.zip'));

            $lastBackup = $allFiles->isEmpty() ? null : $allFiles
                ->sortByDesc(fn($f) => $disk->lastModified($f))
                ->first();

            return [
                'total_backups' => $allFiles->count(),
                'total_size'    => $this->humanFileSize($allFiles->sum(fn($f) => $disk->size($f))),
                'last_backup'   => $lastBackup ? [
                    'filename'   => basename($lastBackup),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($lastBackup)),
                ] : null,
            ];
        } catch (\Throwable $e) {
            return [
                'total_backups' => 0,
                'total_size'    => '0 B',
                'last_backup'   => null,
            ];
        }
    }

    private function humanFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
