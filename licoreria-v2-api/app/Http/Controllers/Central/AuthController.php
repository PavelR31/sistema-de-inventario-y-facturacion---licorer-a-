<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)
                    ->where('is_super_admin', true)
                    ->first();

        if (! $user) {
            \Illuminate\Support\Facades\Log::warning("Login central fallido: Usuario no encontrado o no es SuperAdmin: " . $request->email);
        } elseif (! Hash::check($request->password, $user->password)) {
            \Illuminate\Support\Facades\Log::warning("Login central fallido: Contraseña incorrecta para email: " . $request->email);
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales incorrectas o acceso no autorizado.'], 401);
        }

        $token = $user->createToken('superadmin-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'roles' => ['super-admin'],
            'token' => $token,
            'must_change_password' => $user->must_change_password,
        ]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->must_change_password = false;
        $user->save();

        return response()->json([
            'message' => 'Contraseña actualizada con éxito.',
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada con éxito.']);
    }
}
