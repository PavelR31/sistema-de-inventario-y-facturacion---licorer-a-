<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    public function index()
    {
        return response()->json(Role::with('permissions')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        $role = Role::create(['name' => $request->name, 'guard_name' => 'web']);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function update(Request $request, Role $role)
    {
        // No permitir editar el rol 'Administrador' base para no romper el acceso raíz
        if ($role->name === 'Administrador' && $request->has('name') && $request->name !== 'Administrador') {
            return response()->json(['message' => 'El rol administrador principal no puede ser renombrado.'], 422);
        }

        $request->validate([
            'name' => 'string|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        if ($request->has('name')) {
            $role->name = $request->name;
            $role->save();
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
        if ($role->name === 'Administrador') {
            return response()->json(['message' => 'No se puede eliminar el rol administrador principal.'], 422);
        }

        $role->delete();
        return response()->json(['message' => 'Rol eliminado correctamente.']);
    }

    public function permissions()
    {
        return response()->json(Permission::all());
    }
}
