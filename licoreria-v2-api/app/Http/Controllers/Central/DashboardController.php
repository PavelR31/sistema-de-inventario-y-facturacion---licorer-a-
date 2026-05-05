<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use App\Models\Central\Plan;
use Illuminate\Support\Facades\Storage;

class DashboardController extends Controller
{
    public function index()
    {
        $tenants = Tenant::with(['domains', 'plan'])->get();

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
        ]);
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
