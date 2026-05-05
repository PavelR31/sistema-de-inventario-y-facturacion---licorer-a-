<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TenantUserController extends Controller
{
    public function index(Tenant $tenant)
    {
        $users = $tenant->run(function () {
            $users = \Illuminate\Support\Facades\DB::connection('tenant')
                ->table('users')
                ->get()
                ->map(function ($user) {
                    unset($user->password);
                    unset($user->remember_token);
                    return $user;
                });
            return $users;
        });

        return response()->json($users);
    }

    /**
     * Actualiza la información de un usuario dentro de un inquilino.
     */
    public function update(Request $request, Tenant $tenant, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'nullable|string|min:6',
        ]);

        $user = $tenant->run(function () use ($request, $id) {
            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'updated_at' => now()
            ];
            
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            \Illuminate\Support\Facades\DB::connection('tenant')
                ->table('users')
                ->where('id', $id)
                ->update($updateData);

            $u = \Illuminate\Support\Facades\DB::connection('tenant')->table('users')->where('id', $id)->first();
            unset($u->password);
            unset($u->remember_token);
            
            return $u;
        });

        return response()->json([
            'message' => 'Usuario actualizado correctamente.',
            'user' => $user
        ]);
    }

    /**
     * Genera un token de acceso temporal para "impersonar" (iniciar sesión como) un usuario del inquilino.
     */
    public function impersonate(Tenant $tenant, $id)
    {
        $result = $tenant->run(function () use ($tenant, $id) {
            // Eliminar tokens previos
            \Illuminate\Support\Facades\DB::connection('tenant')
                ->table('personal_access_tokens')
                ->where('tokenable_id', $id)
                ->where('tokenable_type', \App\Models\User::class)
                ->where('name', 'impersonation_token')
                ->delete();
            
            // Para poder crear el token usando Sanctum, necesitamos instanciar el modelo User, 
            // pero le indicamos explícitamente la conexión.
            $user = (new \App\Models\User)->setConnection('tenant')->findOrFail($id);
            
            $token = $user->createToken('impersonation_token')->plainTextToken;
            
            // Obtener el dominio del tenant
            $domain = $tenant->domains()->first()->domain;

            return [
                'token' => $token,
                'domain' => $domain,
                'redirect_url' => "http://{$domain}:5173/impersonate?token={$token}"
            ];
        });

        return response()->json($result);
    }
}
