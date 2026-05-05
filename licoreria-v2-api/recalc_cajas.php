<?php
use App\Models\Central\Tenant;

$tenants = Tenant::all();

foreach ($tenants as $tenant) {
    echo "Procesando tenant: {$tenant->id}\n";
    $tenant->run(function () {
        $cajas = \DB::table('cajas')->get();
        foreach ($cajas as $cajaData) {
            $ultimoCierre = \DB::table('caja_sesiones')
                ->where('caja_id', $cajaData->id)
                ->where('estado', 'cerrada')
                ->latest('fecha_cierre')
                ->first()?->cierre_real ?? 0;
                
            $sesionAbierta = \DB::table('caja_sesiones')
                ->where('caja_id', $cajaData->id)
                ->where('estado', 'abierta')
                ->first();
            
            $balance = $ultimoCierre;
            
            if ($sesionAbierta) {
                $ventasActuales = \DB::table('ventas')
                    ->where('caja_sesion_id', $sesionAbierta->id)
                    ->where('estado', 'vigente')
                    ->where('metodo_pago', 'efectivo')
                    ->sum('total');
                    
                $egresosActuales = \DB::table('caja_egresos')
                    ->where('caja_sesion_id', $sesionAbierta->id)
                    ->sum('monto');
                
                $balance = $sesionAbierta->apertura_real + $ventasActuales - $egresosActuales;
            }
            
            \DB::table('cajas')->where('id', $cajaData->id)->update(['balance_actual' => $balance]);
            echo "  Caja {$cajaData->nombre} actualizada a balance: {$balance}\n";
        }
    });
}
