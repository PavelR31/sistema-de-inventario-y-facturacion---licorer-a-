<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Central\Tenant;
use App\Models\Central\Plan;

$plan = Plan::where('slug', 'trial')->first();
if ($plan) {
    Tenant::all()->each(function($t) use ($plan) {
        $t->update([
            'plan_id_fk' => $plan->id,
            'max_users' => $plan->max_users,
            'license_status' => 'trial'
        ]);
        echo "Tenant {$t->id} updated to plan {$plan->slug}\n";
    });
} else {
    echo "Plan 'trial' not found.\n";
}
