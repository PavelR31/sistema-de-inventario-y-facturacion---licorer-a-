<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use ZipArchive;

class BackupController extends Controller
{
    /**
     * Listar todos los backups disponibles en el disco configurado.
     */
    public function index()
    {
        $disk = Storage::disk('backups');
        $appName = config('backup.backup.name');

        // Backups centrales (generados por Spatie)
        $centralFiles = collect($disk->allFiles($appName))
            ->filter(fn($file) => str_ends_with($file, '.zip'))
            ->map(function ($file) use ($disk) {
                return [
                    'path'       => $file,
                    'filename'   => basename($file),
                    'type'       => 'central',
                    'size'       => $disk->size($file),
                    'size_human' => $this->humanFileSize($disk->size($file)),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                ];
            });

        // Backups completos (central + tenants) generados manualmente
        $fullBackups = collect();
        if ($disk->exists('full')) {
            $fullBackups = collect($disk->allFiles('full'))
                ->filter(fn($file) => str_ends_with($file, '.zip'))
                ->map(function ($file) use ($disk) {
                    return [
                        'path'       => $file,
                        'filename'   => basename($file),
                        'type'       => 'full',
                        'size'       => $disk->size($file),
                        'size_human' => $this->humanFileSize($disk->size($file)),
                        'created_at' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                    ];
                });
        }

        $allBackups = $centralFiles->concat($fullBackups)
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'backups'    => $allBackups,
            'total_size' => $this->humanFileSize($allBackups->sum('size')),
        ]);
    }

    /**
     * Ejecutar un backup.
     * - only_db=true (default): solo BD central via Spatie
     * - full=true: BD central + TODAS las BDs de tenants en un solo ZIP
     */
    public function store(Request $request)
    {
        $isFull = $request->input('full', false);

        if ($isFull) {
            return $this->createFullBackup($request);
        }

        return $this->createCentralBackup($request);
    }

    /**
     * Backup solo de la BD central usando Spatie.
     */
    private function createCentralBackup(Request $request)
    {
        try {
            $onlyDb = $request->input('only_db', true);

            if ($onlyDb) {
                Artisan::call('backup:run', ['--only-db' => true]);
            } else {
                Artisan::call('backup:run');
            }

            $output = Artisan::output();

            Log::info('Backup central ejecutado por SuperAdmin', [
                'user_id' => $request->user()->id,
                'only_db' => $onlyDb,
            ]);

            return response()->json([
                'message' => 'Backup central creado exitosamente.',
                'output'  => $output,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error al crear backup central: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el backup central.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Backup COMPLETO: BD central + todas las BDs de tenants en un solo ZIP.
     */
    private function createFullBackup(Request $request)
    {
        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $tempDir   = storage_path('app/backup-temp/full_' . $timestamp);
            mkdir($tempDir, 0755, true);

            $dumpBinaryPath = config('database.connections.mysql.dump.dump_binary_path', '');
            $mysqldump = $dumpBinaryPath ? "{$dumpBinaryPath}/mysqldump" : 'mysqldump';
            $host     = config('database.connections.mysql.host');
            $port     = config('database.connections.mysql.port');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $centralDb = config('database.connections.mysql.database');

            $dumpedFiles = [];
            $errors = [];

            // 1. Dump de la BD central
            $centralSql = "{$tempDir}/{$centralDb}.sql";
            $result = $this->dumpDatabase($mysqldump, $host, $port, $username, $password, $centralDb, $centralSql);
            if ($result === true) {
                $dumpedFiles[] = $centralSql;
            } else {
                $errors[] = "Central ({$centralDb}): {$result}";
            }

            // 2. Dump de cada BD de tenant
            $tenants = Tenant::all();
            foreach ($tenants as $tenant) {
                // Obtener el nombre real de la BD usando el contexto del tenant
                $tenantDb = $tenant->run(function () {
                    return \Illuminate\Support\Facades\DB::connection()->getDatabaseName();
                });
                
                $tenantSql = "{$tempDir}/{$tenantDb}.sql";
                $result = $this->dumpDatabase($mysqldump, $host, $port, $username, $password, $tenantDb, $tenantSql);
                if ($result === true) {
                    $dumpedFiles[] = $tenantSql;
                } else {
                    $errors[] = "Tenant {$tenant->id} ({$tenantDb}): {$result}";
                }
            }

            if (empty($dumpedFiles)) {
                // Limpiar
                $this->cleanupDir($tempDir);
                Log::error('Fallo total al crear full backup', ['errors' => $errors]);
                return response()->json([
                    'message' => 'No se pudo crear ningún dump. Revisa el log para más detalles.',
                    'errors'  => $errors,
                ], 500);
            }

            // 3. Crear ZIP con todos los dumps
            $zipFilename = "full_backup_{$timestamp}.zip";
            $zipPath = "{$tempDir}/{$zipFilename}";

            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                foreach ($dumpedFiles as $file) {
                    $zip->addFile($file, basename($file));
                }
                $zip->close();
            } else {
                throw new \RuntimeException('No se pudo crear el archivo ZIP');
            }

            // 4. Mover al disco de backups
            $disk = Storage::disk('backups');
            $destination = "full/{$zipFilename}";
            $disk->put($destination, file_get_contents($zipPath));

            // 5. Limpiar temporales
            $this->cleanupDir($tempDir);

            Log::info('Backup COMPLETO ejecutado por SuperAdmin', [
                'user_id'       => $request->user()->id,
                'tenants_count' => $tenants->count(),
                'file'          => $destination,
                'errors'        => $errors,
            ]);

            return response()->json([
                'message'        => 'Backup completo creado exitosamente.',
                'filename'       => $zipFilename,
                'tenants_backed' => $tenants->count(),
                'errors'         => $errors,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error al crear backup completo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el backup completo.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ejecutar mysqldump para una base de datos específica.
     */
    private function dumpDatabase(string $mysqldump, string $host, string $port, string $username, string $password, string $database, string $outputPath): true|string
    {
        $command = [
            $mysqldump,
            '--host=' . $host,
            '--port=' . $port,
            '--user=' . $username,
            '--single-transaction',
            '--routines',
            '--triggers',
            $database,
        ];

        $env = null;
        if ($password) {
            $env = array_merge(getenv(), $_SERVER, ['MYSQL_PWD' => $password]);
        }

        $process = new Process($command, null, $env);
        $process->setTimeout(600);

        $process->run();

        if (!$process->isSuccessful()) {
            return $process->getErrorOutput();
        }

        file_put_contents($outputPath, $process->getOutput());
        return true;
    }

    /**
     * Descargar un archivo de backup específico.
     */
    public function download(Request $request)
    {
        $request->validate(['path' => 'required|string']);

        $disk = Storage::disk('backups');
        $path = $request->input('path');

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'Archivo de backup no encontrado.'], 404);
        }

        Log::info('Backup descargado por SuperAdmin', [
            'user_id' => $request->user()->id,
            'path'    => $path,
        ]);

        return $disk->download($path, basename($path));
    }

    /**
     * Eliminar un backup específico.
     */
    public function destroy(Request $request)
    {
        $request->validate(['path' => 'required|string']);

        $disk = Storage::disk('backups');
        $path = $request->input('path');

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'Archivo de backup no encontrado.'], 404);
        }

        $disk->delete($path);

        Log::info('Backup eliminado por SuperAdmin', [
            'user_id' => $request->user()->id,
            'path'    => $path,
        ]);

        return response()->json(['message' => 'Backup eliminado exitosamente.']);
    }

    /**
     * Ejecutar limpieza manual de backups antiguos.
     */
    public function cleanup()
    {
        try {
            Artisan::call('backup:clean');
            $output = Artisan::output();

            return response()->json([
                'message' => 'Limpieza de backups completada.',
                'output'  => $output,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al limpiar backups.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar la salud de los backups (monitoreo).
     */
    public function health()
    {
        try {
            Artisan::call('backup:monitor');
            $output = Artisan::output();

            $disk = Storage::disk('backups');
            $appName = config('backup.backup.name');
            $files = collect($disk->allFiles($appName))
                ->filter(fn($f) => str_ends_with($f, '.zip'));

            $lastBackup = $files->isEmpty() ? null : $files
                ->sortByDesc(fn($f) => $disk->lastModified($f))
                ->first();

            return response()->json([
                'status'        => 'ok',
                'total_backups' => $files->count(),
                'last_backup'   => $lastBackup ? [
                    'filename'   => basename($lastBackup),
                    'size_human' => $this->humanFileSize($disk->size($lastBackup)),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($lastBackup)),
                ] : null,
                'output'        => $output,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'unhealthy',
                'error'  => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Convertir bytes a formato legible.
     */
    private function humanFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Limpiar un directorio temporal y su contenido.
     */
    private function cleanupDir(string $dir): void
    {
        if (is_dir($dir)) {
            $files = glob("{$dir}/*");
            foreach ($files as $file) {
                @unlink($file);
            }
            @rmdir($dir);
        }
    }
}
