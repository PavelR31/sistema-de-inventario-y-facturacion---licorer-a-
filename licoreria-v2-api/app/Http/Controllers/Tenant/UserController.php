<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['roles', 'sucursal']);
        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
        }
        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function store(Request $request)
    {
        if (tenant()->isUserLimitReached()) {
            return response()->json([
                'message' => 'Límite de usuarios alcanzado.',
                'error' => 'Tu plan actual no permite crear más usuarios.'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|exists:roles,name',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'sucursal_id' => $request->sucursal_id,
        ]);

        $user->assignRole($request->role);

        return response()->json($user->load('roles'), 201);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'exists:roles,name',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        if ($request->has('name')) $user->name = $request->name;
        if ($request->has('email')) $user->email = $request->email;
        if ($request->has('password')) $user->password = Hash::make($request->password);
        if ($request->has('sucursal_id')) $user->sucursal_id = $request->sucursal_id;
        
        $user->save();

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json($user->load('roles'));
    }

    public function destroy(User $user)
    {
        // Evitar que el usuario se elimine a sí mismo
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'No puedes eliminar tu propio usuario.'], 422);
        }

        $user->delete();
        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    public function toggleActive(User $user)
    {
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'No puedes desactivar tu propio usuario.'], 422);
        }

        $user->active = !($user->active ?? true);
        $user->save();

        return response()->json([
            'message' => $user->active ? 'Usuario activado' : 'Usuario desactivado',
            'active'  => $user->active,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user' => $user->load('roles', 'sucursal')
        ]);
    }

    public function updatePasswordProfile(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta.'], 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function roles()
    {
        return response()->json(Role::all());
    }
}
