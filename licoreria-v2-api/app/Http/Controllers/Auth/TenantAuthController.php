<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordMail;
use Illuminate\Validation\ValidationException;

class TenantAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        $token = $user->createToken('tenant-token')->plainTextToken;

        return response()->json([
            'user' => $user->load('sucursal'),
            'token' => $token,
            'must_change_password' => $user->must_change_password,
            'roles' => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
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

        return response()->json([
            'message' => 'Sesión cerrada con éxito.',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            // Devolvemos éxito de todos modos por seguridad (no revelar si el email existe)
            return response()->json([
                'message' => 'Si el correo está registrado, recibirás una nueva contraseña en breve.',
            ]);
        }

        // Generar clave temporal
        $newPassword = \Illuminate\Support\Str::random(10);

        $user->password = Hash::make($newPassword);
        $user->must_change_password = true;
        $user->save();

        try {
            Mail::to($user->email)->send(new ResetPasswordMail($user->name, $newPassword));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error enviando correo de reset: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Si el correo está registrado, recibirás una nueva contraseña en breve.',
        ]);
    }
}
