<?php
$tenant = \Stancl\Tenancy\Database\Models\Tenant::where('id', 'pavel-test')->first();
if ($tenant) {
    tenancy()->run($tenant, function() {
        $user = \App\Models\User::where('email', 'test@test.com')->first();
        if ($user) {
            $user->password = \Illuminate\Support\Facades\Hash::make('admin123');
            $user->save();
            echo "SUCCESS: Contrasena de {$user->email} cambiada a admin123\n";
        } else {
            echo "ERROR: Usuario test@test.com no encontrado en el tenant.\n";
        }
    });
} else {
    echo "ERROR: Tenant pavel-test no encontrado.\n";
}
