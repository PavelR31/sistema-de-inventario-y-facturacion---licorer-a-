<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Symfony\Component\Process\Process;

$dumpBinaryPath = config('database.connections.mysql.dump.dump_binary_path', '');
$mysqldump = $dumpBinaryPath ? "{$dumpBinaryPath}/mysqldump" : 'mysqldump';
$host     = config('database.connections.mysql.host');
$port     = config('database.connections.mysql.port');
$username = config('database.connections.mysql.username');
$password = config('database.connections.mysql.password');

$database = 'tenantLicoreria-Pavel'; // The one the code generates

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

echo "Executing: " . implode(' ', $command) . PHP_EOL;

$process = new Process($command);
if ($password) {
    $process->setEnv(['MYSQL_PWD' => $password]);
}

$process->run();

if (!$process->isSuccessful()) {
    echo "ERROR: " . $process->getErrorOutput() . PHP_EOL;
} else {
    echo "SUCCESS, output length: " . strlen($process->getOutput()) . PHP_EOL;
}
