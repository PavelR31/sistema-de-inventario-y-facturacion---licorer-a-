<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;

class SystemHealthController extends Controller
{
    public function getHealthMetrics()
    {
        return response()->json([
            'system' => $this->getSystemMetrics(),
            'database' => $this->getDatabaseMetrics(),
            'tenants' => $this->getTenantStorageMetrics(),
        ]);
    }

    public function runAction(Request $request)
    {
        $action = $request->input('action');
        
        switch ($action) {
            case 'clear_cache':
                \Artisan::call('cache:clear');
                \Artisan::call('config:clear');
                \Artisan::call('route:clear');
                return response()->json(['message' => 'Caché limpiada correctamente']);
            
            case 'optimize':
                \Artisan::call('optimize');
                return response()->json(['message' => 'Sistema optimizado']);

            case 'run_migrations':
                \Artisan::call('migrate', ['--force' => true]);
                return response()->json(['message' => 'Migraciones ejecutadas en Central']);

            case 'migrate_tenants':
                \Artisan::call('tenants:migrate');
                return response()->json(['message' => 'Migraciones ejecutadas en todos los Tenants']);

            default:
                return response()->json(['message' => 'Acción no reconocida'], 400);
        }
    }

    private function getSystemMetrics()
    {
        // RAM usage
        $free = shell_exec('free -m');
        $freeLines = explode("\n", trim($free));
        $mem = explode(" ", preg_replace('/\s+/', ' ', $freeLines[1]));
        $ramTotal = $mem[1];
        $ramUsed = $mem[2];
        $ramPercent = round(($ramUsed / $ramTotal) * 100, 2);

        // CPU Load
        $load = sys_getloadavg();
        
        // Uptime
        $uptime = shell_exec('uptime -p');

        // TOP Processes (Top 5 by CPU)
        $topProcesses = [];
        $topOutput = shell_exec('ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -n 6');
        $topLines = explode("\n", trim($topOutput));
        foreach (array_slice($topLines, 1) as $line) {
            $parts = preg_split('/\s+/', trim($line));
            $topProcesses[] = [
                'pid' => $parts[0],
                'cpu' => $parts[4] . '%',
                'mem' => $parts[3] . '%',
                'command' => implode(' ', array_slice($parts, 2, 1)), // Just the command name usually
            ];
        }

        // Disk Usage
        $diskTotal = disk_total_space('/');
        $diskFree = disk_free_space('/');
        $diskUsed = $diskTotal - $diskFree;
        $diskPercent = round(($diskUsed / $diskTotal) * 100, 2);

        return [
            'ram' => [
                'total' => $ramTotal . ' MB',
                'used' => $ramUsed . ' MB',
                'percent' => $ramPercent,
            ],
            'cpu_load' => $load,
            'uptime' => trim($uptime),
            'disk' => [
                'total' => $this->humanFileSize($diskTotal),
                'used' => $this->humanFileSize($diskUsed),
                'percent' => $diskPercent,
            ],
            'top_processes' => $topProcesses,
        ];
    }

    private function getDatabaseMetrics()
    {
        $dbName = config('database.connections.central.database');
        
        $size = DB::select("
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size 
            FROM information_schema.TABLES 
            WHERE table_schema = ?", [$dbName]);

        return [
            'central_db_size' => ($size[0]->size ?? 0) . ' MB',
            'connection' => config('database.default'),
        ];
    }

    private function getTenantStorageMetrics()
    {
        $tenants = Tenant::all();
        $metrics = [];

        foreach ($tenants as $tenant) {
            $dbName = $tenant->tenancy_db_name ?? 'tenant' . $tenant->id;
            
            // Note: This assumes all tenant DBs are on the same server/connection
            $size = DB::select("
                SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size 
                FROM information_schema.TABLES 
                WHERE table_schema = ?", [$dbName]);

            $metrics[] = [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'db_name' => $dbName,
                'size' => ($size[0]->size ?? 0) . ' MB',
            ];
        }

        return $metrics;
    }

    private function humanFileSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
