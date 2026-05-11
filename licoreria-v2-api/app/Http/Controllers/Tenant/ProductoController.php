<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Producto;
use App\Models\Tenant\PresentacionProducto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;

        $query = Producto::with(['categoria', 'medida', 'presentaciones', 'sucursales' => function ($q) use ($sucursalId) {
            if ($sucursalId) {
                $q->where('sucursal_id', $sucursalId);
            }
        }]);

        if ($request->has('activo')) {
            $query->where('activo', $request->activo);
        }

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('nombre', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%")
                  ->orWhere('upc', 'like', "%{$request->search}%");
            });
        }

        $paginated = $query->paginate($request->per_page ?? 15);

        $paginated->getCollection()->transform(function ($producto) use ($sucursalId) {
            if ($sucursalId) {
                $branchData = $producto->sucursales->first();
                $producto->stock_actual  = $branchData?->pivot?->stock_actual ?? 0;
                $producto->precio_venta  = $branchData?->pivot?->precio_venta ?? 0;
                $producto->precio_compra = $branchData?->pivot?->precio_compra ?? 0;
            }
            $producto->stock_total = $producto->sucursales->sum('pivot.stock_actual');

            // Inyectar stock_sucursal en cada presentación para que el POS filtre disponibilidad
            if ($sucursalId && $producto->presentaciones) {
                $producto->presentaciones->each(function ($pres) use ($sucursalId) {
                    $pivotRow = \DB::table('presentacion_sucursal')
                        ->where('presentacion_id', $pres->id)
                        ->where('sucursal_id', $sucursalId)
                        ->first();
                    $pres->stock_sucursal = $pivotRow ? (int)$pivotRow->stock_actual : 0;
                });
            }

            return $producto;
        });

        return response()->json($paginated);
    }

    public function store(Request $request)
    {
        $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'medida_id' => 'nullable|exists:medidas,id',
            'nombre' => 'required|string|max:150',
            'descripcion' => 'nullable|string',
            'sku' => 'nullable|string|max:50|unique:productos,sku',
            'upc' => 'nullable|string|max:50|unique:productos,upc',
            'activo' => 'boolean',
            'imagen' => 'nullable|image|max:2048',
            'presentaciones' => 'nullable|array',
            'presentaciones.*.nombre' => 'required|string|max:50',
            'presentaciones.*.cantidad_unidades' => 'required|integer|min:1',
            'presentaciones.*.precio_venta' => 'required|numeric|min:0',
            'presentaciones.*.codigo_barras' => 'nullable|string|max:50',
            'presentaciones.*.es_principal' => 'boolean',
        ]);

        $data = $request->except(['sucursales', 'imagen', 'presentaciones']);

        if ($request->hasFile('imagen')) {
            $path = $request->file('imagen')->store('productos', 'public');
            $data['imagen_ruta'] = $path;
        }

        $producto = Producto::create($data);

        if ($request->has('presentaciones')) {
            $producto->presentaciones()->createMany($request->presentaciones);
        }

        return response()->json($producto->load('medida', 'presentaciones'), 201);
    }

    public function storeBulk(Request $request)
    {
        $request->validate([
            'productos' => 'required|array|min:1|max:50',
            'productos.*.categoria_id' => 'nullable|exists:categorias,id',
            'productos.*.medida_id' => 'nullable|exists:medidas,id',
            'productos.*.nombre' => 'required|string|max:150',
            'productos.*.descripcion' => 'nullable|string',
            'productos.*.sku' => 'nullable|string|max:50|distinct', // check unique in DB later to avoid multiple errors
            'productos.*.upc' => 'nullable|string|max:50|distinct',
            'productos.*.activo' => 'boolean',
            'productos.*.imagen' => 'nullable|image|max:2048',
            'productos.*.presentaciones' => 'nullable|array',
            'productos.*.presentaciones.*.nombre' => 'required|string|max:50',
            'productos.*.presentaciones.*.cantidad_unidades' => 'required|integer|min:1',
            'productos.*.presentaciones.*.precio_venta' => 'required|numeric|min:0',
            'productos.*.presentaciones.*.codigo_barras' => 'nullable|string|max:50',
            'productos.*.presentaciones.*.es_principal' => 'boolean',
        ]);

        $createdProducts = [];

        \DB::beginTransaction();
        try {
            foreach ($request->productos as $prodData) {
                // Check uniqueness manually to fail fast
                if (!empty($prodData['sku']) && Producto::where('sku', $prodData['sku'])->exists()) {
                    throw new \Exception("El SKU {$prodData['sku']} ya existe.");
                }
                if (!empty($prodData['upc']) && Producto::where('upc', $prodData['upc'])->exists()) {
                    throw new \Exception("El UPC {$prodData['upc']} ya existe.");
                }

                $data = collect($prodData)->except(['presentaciones', 'imagen'])->toArray();
                
                if (isset($prodData['imagen']) && $prodData['imagen'] instanceof \Illuminate\Http\UploadedFile) {
                    $path = $prodData['imagen']->store('productos', 'public');
                    $data['imagen_ruta'] = $path;
                }

                $producto = Producto::create($data);

                if (!empty($prodData['presentaciones'])) {
                    $producto->presentaciones()->createMany($prodData['presentaciones']);
                }

                $createdProducts[] = $producto;
            }
            \DB::commit();
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json(['message' => 'Error al insertar productos: ' . $e->getMessage()], 422);
        }

        return response()->json([
            'message' => count($createdProducts) . ' productos creados exitosamente.',
            'productos' => $createdProducts
        ], 201);
    }

    public function show(Producto $producto)
    {
        return response()->json($producto->load('categoria', 'medida', 'presentaciones', 'sucursales'));
    }

    public function update(Request $request, Producto $producto)
    {
        $request->validate([
            'categoria_id' => 'nullable|exists:categorias,id',
            'medida_id' => 'nullable|exists:medidas,id',
            'nombre' => 'string|max:150',
            'descripcion' => 'nullable|string',
            'sku' => 'nullable|string|max:50|unique:productos,sku,' . $producto->id,
            'upc' => 'nullable|string|max:50|unique:productos,upc,' . $producto->id,
            'sucursales' => 'array',
            'presentaciones' => 'nullable|array',
            'presentaciones.*.id' => 'nullable|exists:presentaciones_producto,id',
            'presentaciones.*.nombre' => 'required_with:presentaciones|string|max:50',
            'presentaciones.*.cantidad_unidades' => 'required_with:presentaciones|integer|min:1',
            'presentaciones.*.precio_venta' => 'required_with:presentaciones|numeric|min:0',
            'presentaciones.*.codigo_barras' => 'nullable|string|max:50',
            'presentaciones.*.es_principal' => 'boolean',
            'imagen' => 'nullable|image|max:2048',
        ]);

        $data = $request->except(['sucursales', 'presentaciones', 'imagen']);

        if ($request->hasFile('imagen')) {
            $path = $request->file('imagen')->store('productos', 'public');
            $data['imagen_ruta'] = $path;
        }

        $producto->update($data);

        if ($request->has('sucursales')) {
            $syncData = [];
            foreach ($request->sucursales as $s) {
                $syncData[$s['sucursal_id']] = [
                    'stock_actual' => $s['stock_actual'] ?? 0,
                    'stock_minimo' => $s['stock_minimo'] ?? 0,
                    'precio_compra' => $s['precio_compra'] ?? 0,
                    'precio_venta' => $s['precio_venta'] ?? 0,
                ];
            }
            $producto->sucursales()->sync($syncData);
        }

        if ($request->has('presentaciones')) {
            $incomingIds = collect($request->presentaciones)->pluck('id')->filter()->toArray();
            
            // Delete presentations not in the request
            // Note: If they are tied to sales, they will fail to delete if there is a restricted foreign key,
            // but for MVP we attempt to delete them as they are not needed anymore.
            try {
                $producto->presentaciones()->whereNotIn('id', $incomingIds)->delete();
            } catch (\Exception $e) {
                // If deletion fails due to FK constraint, we just leave them.
            }

            foreach ($request->presentaciones as $presData) {
                if (isset($presData['id'])) {
                    $producto->presentaciones()->where('id', $presData['id'])->update($presData);
                } else {
                    $producto->presentaciones()->create($presData);
                }
            }
        }

        return response()->json($producto->load('sucursales', 'medida', 'presentaciones'));
    }

    public function destroy(Producto $producto)
    {
        $producto->delete();
        return response()->json(['message' => 'Producto eliminado de catálogo global.']);
    }

    public function destroyBulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:productos,id',
        ]);

        $deleted = Producto::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => "$deleted producto(s) eliminado(s) correctamente."]);
    }

    /**
     * Busca un producto por código de barras (sku, upc, o código de presentación).
     * Usado por el POS para escaneo automático.
     */
    public function buscarPorBarcode(Request $request)
    {
        $request->validate(['code' => 'required|string']);

        $code = trim($request->code);
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;

        // 1. Buscar primero en presentaciones_producto por codigo_barras
        $presentacion = PresentacionProducto::where('codigo_barras', $code)->first();

        if ($presentacion) {
            $producto = Producto::with(['categoria', 'medida', 'presentaciones',
                'sucursales' => function ($q) use ($sucursalId) {
                    if ($sucursalId) $q->where('sucursal_id', $sucursalId);
                }])->find($presentacion->producto_id);

            if ($producto) {
                $branchData = $producto->sucursales->first();
                if ($sucursalId && $branchData) {
                    $producto->stock_actual  = $branchData?->pivot?->stock_actual ?? 0;
                    $producto->precio_venta  = $branchData?->pivot?->precio_venta ?? 0;
                    $producto->precio_compra = $branchData?->pivot?->precio_compra ?? 0;
                }
                $producto->stock_total = $producto->sucursales->sum('pivot.stock_actual');

                return response()->json([
                    'found'                  => true,
                    'matched_by'             => 'presentacion',
                    'matched_presentacion_id' => $presentacion->id,
                    'producto'               => $producto,
                ]);
            }
        }

        // 2. Buscar en sku y upc del producto base
        $producto = Producto::with(['categoria', 'medida', 'presentaciones',
            'sucursales' => function ($q) use ($sucursalId) {
                if ($sucursalId) $q->where('sucursal_id', $sucursalId);
            }])
            ->where('sku', $code)
            ->orWhere('upc', $code)
            ->first();

        if ($producto) {
            $branchData = $producto->sucursales->first();
            if ($sucursalId && $branchData) {
                $producto->stock_actual  = $branchData?->pivot?->stock_actual ?? 0;
                $producto->precio_venta  = $branchData?->pivot?->precio_venta ?? 0;
                $producto->precio_compra = $branchData?->pivot?->precio_compra ?? 0;
            }
            $producto->stock_total = $producto->sucursales->sum('pivot.stock_actual');

            return response()->json([
                'found'                  => true,
                'matched_by'             => 'base',
                'matched_presentacion_id' => null,
                'producto'               => $producto,
            ]);
        }

        return response()->json(['found' => false, 'message' => 'Código no encontrado.'], 404);
    }
}
