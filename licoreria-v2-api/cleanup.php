<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Central\Tenant;
use Illuminate\Support\Facades\DB;

$tenants = Tenant::all();
foreach ($tenants as $t) {
    if (str_contains($t->id, 'debug') || str_contains($t->id, 'test')) {
        echo "Deleting tenant: " . $t->id . "\n";
        $t->delete();
    }
}

// Clean up manual DB
try {
    DB::statement('DROP DATABASE IF EXISTS tenant_manual_test');
    echo "Dropped tenant_manual_test\n";
} catch (\Exception $e) {}

echo "Cleanup finished.\n";
unlink(__FILE__);
unlink(__DIR__ . '/test-tenant-creation.php');
unlink(__DIR__ . '/list-dbs.php');
