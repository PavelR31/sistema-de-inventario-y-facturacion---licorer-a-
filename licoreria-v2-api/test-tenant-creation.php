<?php
use App\Models\Central\Tenant;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    echo "Starting tenant creation...\n";
    $id = 'debug_tenant_' . time();
    $tenant = Tenant::create([
        'id' => $id,
        'name' => 'Debug Tenant',
        'email' => 'debug@example.com',
    ]);
    echo "Tenant created in central DB with ID: " . $tenant->id . "\n";
    
    // Check if DB exists
    $dbName = config('tenancy.database.prefix') . $id;
    $exists = DB::select("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?", [$dbName]);
    
    if ($exists) {
        echo "SUCCESS: Database $dbName exists.\n";
    } else {
        echo "FAILURE: Database $dbName does NOT exist.\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
