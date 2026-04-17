<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Central\Tenant;
use Illuminate\Support\Carbon;

class CheckExpiredLicenses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'licenses:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica y marca como expiradas las licencias de tenants que hayan superado su fecha límite';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verificando licencias expiradas...');

        // Buscamos tenants que estén 'active' o 'trial' pero su fecha ya haya pasado
        $expiredTenants = Tenant::whereIn('license_status', ['active', 'trial'])
            ->whereNotNull('license_expires_at')
            ->where('license_expires_at', '<', Carbon::now())
            ->get();

        $count = $expiredTenants->count();

        if ($count === 0) {
            $this->info('No se encontraron licencias expiradas.');
            return 0;
        }

        foreach ($expiredTenants as $tenant) {
            $tenant->update([
                'license_status' => 'expired'
            ]);
            $this->line("- Tenant {$tenant->id} marcado como expirado.");
        }

        $this->info("Proceso completado. Se actualizaron {$count} licencias a estado 'expired'.");
        return 0;
    }
}
