<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\BackupCompletedMail;
use Symfony\Component\Process\Process;
use ZipArchive;

class TenantBackupController extends Controller
{
    /**
     * Obtener el nombre real de la BD del tenant desde la conexión activa.
     */
    private function getTenantDbName(): string
    {
        return DB::connection()->getDatabaseName();
    }

    /**
     * Listar los backups disponibles del tenant actual.
     */
    public function index()
    {
        $tenantId = tenant('id');
        $disk = Storage::disk('backups');
        $basePath = "tenants/{$tenantId}";

        if (!$disk->exists($basePath)) {
            return response()->json([
                'backups'    => [],
                'tenant_id'  => $tenantId,
                'total_size' => '0 B',
            ]);
        }

        $files = collect($disk->allFiles($basePath))
            ->filter(fn($file) => str_ends_with($file, '.zip'))
            ->map(function ($file) use ($disk) {
                return [
                    'path'       => $file,
                    'filename'   => basename($file),
                    'size'       => $disk->size($file),
                    'size_human' => $this->humanFileSize($disk->size($file)),
                    'created_at' => date('Y-m-d H:i:s', $disk->lastModified($file)),
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'backups'    => $files,
            'tenant_id'  => $tenantId,
            'total_size' => $this->humanFileSize($files->sum('size')),
        ]);
    }

    /**
     * Crear un backup manual de la base de datos del tenant actual.
     */
    public function store(Request $request)
    {
        $tenantId = tenant('id');
        $dbName = $this->getTenantDbName();

        try {
            $timestamp = now()->format('Y-m-d_H-i-s');
            $sqlFilename = "{$dbName}_{$timestamp}.sql";
            $zipFilename = "{$dbName}_{$timestamp}.zip";

            $tempDir = storage_path('app/backup-temp');
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $sqlPath = "{$tempDir}/{$sqlFilename}";
            $zipPath = "{$tempDir}/{$zipFilename}";

            // Ejecutar mysqldump
            $this->runDump($dbName, $sqlPath);

            // Crear ZIP
            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                $zip->addFile($sqlPath, $sqlFilename);
                $zip->close();
            } else {
                throw new \RuntimeException('No se pudo crear el archivo ZIP');
            }

            // Mover al disco de backups
            $disk = Storage::disk('backups');
            $destination = "tenants/{$tenantId}/{$zipFilename}";
            $disk->put($destination, file_get_contents($zipPath));

            // Limpiar
            @unlink($sqlPath);
            @unlink($zipPath);

            // Enviar correo de notificación
            try {
                $adminEmail = tenant('email');
                $tenantName = tenant('name') ?? $tenantId;
                $sizeHuman = $this->humanFileSize($disk->size($destination));
                
                if ($adminEmail) {
                    Mail::to($adminEmail)->send(new BackupCompletedMail(
                        $tenantName,
                        $zipFilename,
                        $sizeHuman
                    ));
                }
            } catch (\Exception $e) {
                Log::error("Error enviando correo de backup: " . $e->getMessage());
            }

            Log::info("Backup creado para tenant {$tenantId} (db: {$dbName})", [
                'user_id' => $request->user()->id,
                'file'    => $destination,
            ]);

            return response()->json([
                'message'  => 'Respaldo creado exitosamente.',
                'filename' => $zipFilename,
                'path'     => $destination,
            ], 201);
        } catch (\Throwable $e) {
            Log::error("Error en backup tenant {$tenantId}: " . $e->getMessage());

            return response()->json([
                'message' => 'Error al crear el respaldo.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Subir un archivo ZIP de backup manualmente.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:512000', // max 500MB
        ]);

        $tenantId = tenant('id');
        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        
        if (!in_array($extension, ['zip', 'sql'])) {
            return response()->json(['message' => 'Solo se permiten archivos ZIP o SQL.'], 422);
        }
        
        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "import_{$timestamp}_" . $file->getClientOriginalName();
        $path = "tenants/{$tenantId}/{$filename}";

        try {
            Storage::disk('backups')->put($path, file_get_contents($file->getRealPath()));
            
            Log::info("Backup subido manualmente para tenant {$tenantId}", [
                'user_id' => $request->user()->id,
                'file'    => $path,
            ]);

            return response()->json([
                'message' => 'Respaldo importado correctamente.',
                'path'    => $path,
                'filename'=> $filename
            ], 201);
        } catch (\Throwable $e) {
            Log::error("Error al subir backup para tenant {$tenantId}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al importar el archivo.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restaurar un backup del tenant actual.
     */
    public function restore(Request $request)
    {
        $request->validate(['path' => 'required|string']);

        $tenantId = tenant('id');
        $disk = Storage::disk('backups');
        $path = $request->input('path');

        // Seguridad: solo sus propios backups
        if (!str_starts_with($path, "tenants/{$tenantId}/")) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'Archivo no encontrado.'], 404);
        }

        try {
            $dbName = $this->getTenantDbName();

            $tempDir = storage_path('app/backup-temp/restore_' . time());
            mkdir($tempDir, 0755, true);

            // Copiar archivo a temp
            $filePath = "{$tempDir}/" . basename($path);
            file_put_contents($filePath, $disk->get($path));

            $sqlPath = null;
            if (str_ends_with(strtolower($path), '.zip')) {
                // Extraer ZIP
                $zip = new ZipArchive();
                if ($zip->open($filePath) !== true) {
                    throw new \RuntimeException('No se pudo abrir el archivo ZIP');
                }
                $zip->extractTo($tempDir);
                $zip->close();

                // Buscar el archivo .sql dentro del ZIP extraído
                $sqlFiles = glob("{$tempDir}/*.sql");
                if (empty($sqlFiles)) {
                    throw new \RuntimeException('No se encontró un archivo SQL en el respaldo ZIP');
                }
                $sqlPath = $sqlFiles[0];
            } else if (str_ends_with(strtolower($path), '.sql')) {
                $sqlPath = $filePath;
            } else {
                throw new \RuntimeException('Formato de archivo no soportado para restauración');
            }

            // Ejecutar mysql import
            $dumpBinaryPath = config('database.connections.mysql.dump.dump_binary_path', '');
            $mysqlBin = $dumpBinaryPath ? "{$dumpBinaryPath}/mysql" : 'mysql';

            $host     = config('database.connections.mysql.host');
            $port     = config('database.connections.mysql.port');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');

            $command = [
                $mysqlBin,
                '--host=' . $host,
                '--port=' . $port,
                '--user=' . $username,
                $dbName,
            ];

            $env = null;
            if ($password) {
                $env = array_merge(getenv(), $_SERVER, ['MYSQL_PWD' => $password]);
            }

            $process = new Process($command, null, $env);
            $process->setTimeout(600);
            $process->setInput(file_get_contents($sqlPath));

            $process->run();

            // Limpiar temp
            array_map('unlink', glob("{$tempDir}/*"));
            @rmdir($tempDir);

            if (!$process->isSuccessful()) {
                Log::error("Restauración falló para tenant {$tenantId}: " . $process->getErrorOutput());
                return response()->json([
                    'message' => 'Error al restaurar la base de datos.',
                    'error'   => $process->getErrorOutput(),
                ], 500);
            }

            Log::info("Backup restaurado para tenant {$tenantId}", [
                'user_id' => $request->user()->id,
                'path'    => $path,
            ]);

            return response()->json([
                'message' => 'Respaldo restaurado exitosamente. Los datos han sido restablecidos.',
            ]);
        } catch (\Throwable $e) {
            Log::error("Error al restaurar backup tenant {$tenantId}: " . $e->getMessage());
            return response()->json([
                'message' => 'Error al restaurar el respaldo.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Descargar un backup del tenant actual.
     */
    public function download(Request $request)
    {
        $request->validate(['path' => 'required|string']);

        $tenantId = tenant('id');
        $disk = Storage::disk('backups');
        $path = $request->input('path');

        if (!str_starts_with($path, "tenants/{$tenantId}/")) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'Archivo no encontrado.'], 404);
        }

        return $disk->download($path, basename($path));
    }

    /**
     * Eliminar un backup del tenant actual.
     */
    public function destroy(Request $request)
    {
        $request->validate(['path' => 'required|string']);

        $tenantId = tenant('id');
        $disk = Storage::disk('backups');
        $path = $request->input('path');

        if (!str_starts_with($path, "tenants/{$tenantId}/")) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        if (!$disk->exists($path)) {
            return response()->json(['message' => 'Archivo no encontrado.'], 404);
        }

        $disk->delete($path);

        return response()->json(['message' => 'Respaldo eliminado exitosamente.']);
    }

    /**
     * Ejecutar mysqldump para una BD específica.
     */
    private function runDump(string $dbName, string $outputPath): void
    {
        $dumpBinaryPath = config('database.connections.mysql.dump.dump_binary_path', '');
        $mysqldump = $dumpBinaryPath ? "{$dumpBinaryPath}/mysqldump" : 'mysqldump';

        $host     = config('database.connections.mysql.host');
        $port     = config('database.connections.mysql.port');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $command = [
            $mysqldump,
            '--host=' . $host,
            '--port=' . $port,
            '--user=' . $username,
            '--single-transaction',
            '--routines',
            '--triggers',
            $dbName,
        ];

        $env = null;
        if ($password) {
            $env = array_merge(getenv(), $_SERVER, ['MYSQL_PWD' => $password]);
        }

        $process = new Process($command, null, $env);
        $process->setTimeout(300);

        $process->run();

        if (!$process->isSuccessful()) {
            throw new \RuntimeException(
                "mysqldump falló para {$dbName}: " . $process->getErrorOutput()
            );
        }

        file_put_contents($outputPath, $process->getOutput());
    }

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
}
