<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PlanController extends Controller
{
    public function index()
    {
        return response()->json(Plan::orderBy('price')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'description'  => 'nullable|string|max:500',
            'price'        => 'required|numeric|min:0',
            'max_users'    => 'required|integer|min:0',
            'max_branches' => 'required|integer|min:0',
            'is_active'    => 'boolean',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $plan = Plan::create($data);

        return response()->json($plan, 201);
    }

    public function update(Request $request, Plan $plan)
    {
        $data = $request->validate([
            'name'         => 'required|string|max:100',
            'description'  => 'nullable|string|max:500',
            'price'        => 'required|numeric|min:0',
            'max_users'    => 'required|integer|min:0',
            'max_branches' => 'required|integer|min:0',
            'is_active'    => 'boolean',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $plan->update($data);

        return response()->json($plan->fresh());
    }

    public function destroy(Plan $plan)
    {
        if ($plan->tenants()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar un plan con licorerías asignadas.'
            ], 422);
        }

        $plan->delete();

        return response()->json(['message' => 'Plan eliminado.']);
    }
}
