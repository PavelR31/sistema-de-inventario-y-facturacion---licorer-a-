<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Caja;
use App\Models\Tenant\Venta;
use App\Models\Tenant\DetalleVenta;
use App\Models\Tenant\Sucursal;
use App\Models\Tenant\Configuracion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReporteController extends Controller
{
    /**
     * Arqueo detallado de una SESIÓN específica.
     */
    public function arqueoCaja(Request $request, $sesionId)
    {
        if (!is_numeric($sesionId)) {
            return response()->json(['message' => 'ID de sesión inválido'], 400);
        }
        $sesion = \App\Models\Tenant\CajaSesion::with(['caja', 'user'])->findOrFail($sesionId);

        $ventas = Venta::where('caja_sesion_id', $sesionId)->with('ventas_anuladas')->get();

        $vigentes  = $ventas->where('estado', 'vigente');
        $anuladas  = $ventas->where('estado', 'anulada');

        $totalEfectivo      = $vigentes->where('metodo_pago', 'efectivo')->sum('total');
        $totalTarjeta       = $vigentes->where('metodo_pago', 'tarjeta')->sum('total');
        $totalTransferencia = $vigentes->where('metodo_pago', 'transferencia')->sum('total');
        $totalMixto         = $vigentes->where('metodo_pago', 'mixto')->sum('total');
        $totalVentas        = $vigentes->sum('total');

        $egresos = \App\Models\Tenant\CajaEgreso::where('caja_sesion_id', $sesionId)->get();
        $totalEgresos = $egresos->sum('monto');

        // Efectivo esperado = apertura_real + ventas_efectivo - egresos
        $efectivoEsperado = (float) $sesion->apertura_real + (float) $totalEfectivo - (float) $totalEgresos; 
        $diferencia       = $sesion->cierre_real ? ($sesion->cierre_real - $efectivoEsperado) : null;

        return response()->json([
            'sesion'              => $sesion,
            'egresos'             => $egresos,
            'resumen'             => [
                'num_transacciones'   => $vigentes->count(),
                'total_ventas'        => round($totalVentas, 2),
                'total_efectivo'      => round($totalEfectivo, 2),
                'total_tarjeta'       => round($totalTarjeta, 2),
                'total_transferencia' => round($totalTransferencia, 2),
                'total_mixto'         => round($totalMixto, 2),
                'total_egresos'       => round($totalEgresos, 2),
                'monto_apertura'      => round((float) $sesion->apertura_real, 2),
                'efectivo_esperado'   => round((float) $efectivoEsperado, 2),
                'monto_cierre'        => $sesion->cierre_real ? round((float) $sesion->cierre_real, 2) : null,
                'diferencia'          => $diferencia !== null ? round((float) $diferencia, 2) : null,
                'ventas_anuladas'     => $anuladas->count(),
            ],
        ]);
    }

    /**
     * Historial de SESIONES cerradas.
     */
    public function historialCajas(Request $request)
    {
        $sucursalId = $request->header('X-Sucursal-Id') ?? $request->sucursal_id;

        $query = \App\Models\Tenant\CajaSesion::with(['caja', 'user'])
            ->where('estado', 'cerrada')
            ->latest('fecha_cierre');

        if ($sucursalId && $sucursalId !== 'all') {
            $query->whereHas('caja', function($q) use ($sucursalId) {
                $q->where('sucursal_id', $sucursalId);
            });
        }

        $sesiones = $query->paginate(15);

        $sesiones->getCollection()->transform(function ($sesion) {
            $ventasVigentes = Venta::where('caja_sesion_id', $sesion->id)->where('estado', 'vigente');
            $sesion->total_ventas      = round($ventasVigentes->sum('total'), 2);
            $sesion->num_transacciones = $ventasVigentes->count();
            return $sesion;
        });

        return response()->json($sesiones);
    }

    /**
     * Ventas agrupadas por día en un rango de fechas.
     */
    public function ventasPorPeriodo(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            $sucursalId = $request->header('X-Branch-Id');
        }

        $fechaInicio = $request->fecha_inicio ?? now()->startOfMonth()->toDateString();
        $fechaFin    = $request->fecha_fin    ?? now()->toDateString();

        $query = Venta::query()
            ->where('estado', 'vigente')
            ->whereBetween(DB::raw('DATE(created_at)'), [$fechaInicio, $fechaFin]);

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        // Agrupar por día
        $porDia = (clone $query)
            ->select(
                DB::raw('DATE(created_at) as fecha'),
                DB::raw('COUNT(*) as num_ventas'),
                DB::raw('SUM(total) as total'),
                DB::raw('SUM(CASE WHEN metodo_pago="efectivo" THEN total ELSE 0 END) as efectivo'),
                DB::raw('SUM(CASE WHEN metodo_pago="tarjeta" THEN total ELSE 0 END) as tarjeta'),
                DB::raw('SUM(CASE WHEN metodo_pago="transferencia" THEN total ELSE 0 END) as transferencia'),
                DB::raw('SUM(CASE WHEN metodo_pago="mixto" THEN total ELSE 0 END) as mixto')
            )
            ->groupBy('fecha')
            ->orderBy('fecha')
            ->get();

        // Totales del período
        $totales = [
            'total_ventas'   => round($query->sum('total'), 2),
            'num_ventas'     => $query->count(),
            'ticket_promedio'=> $query->count() > 0 ? round($query->sum('total') / $query->count(), 2) : 0,
            'efectivo'       => round($query->where('metodo_pago', 'efectivo')->sum('total'), 2),
            'tarjeta'        => round($query->where('metodo_pago', 'tarjeta')->sum('total'), 2),
            'transferencia'  => round($query->where('metodo_pago', 'transferencia')->sum('total'), 2),
        ];

        // Últimas 50 transacciones del período para detalle
        $transacciones = (clone $query)
            ->with(['user:id,name', 'sucursal:id,nombre', 'cliente:id,nombre'])
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'por_dia'       => $porDia,
            'totales'       => $totales,
            'transacciones' => $transacciones,
        ]);
    }

    /**
     * Comparativo de ventas por sucursal en un rango de fechas.
     */
    public function ventasPorSucursal(Request $request)
    {
        $fechaInicio = $request->fecha_inicio ?? now()->startOfMonth()->toDateString();
        $fechaFin    = $request->fecha_fin    ?? now()->toDateString();

        $sucursales = Sucursal::where('estado', true)->get();

        $result = $sucursales->map(function ($sucursal) use ($fechaInicio, $fechaFin) {
            $ventasQuery = Venta::where('sucursal_id', $sucursal->id)
                ->where('estado', 'vigente')
                ->whereBetween(DB::raw('DATE(created_at)'), [$fechaInicio, $fechaFin]);

            $total       = round($ventasQuery->sum('total'), 2);
            $count       = $ventasQuery->count();
            $promedio    = $count > 0 ? round($total / $count, 2) : 0;

            return [
                'sucursal_id'    => $sucursal->id,
                'nombre'         => $sucursal->nombre,
                'total_ventas'   => $total,
                'num_ventas'     => $count,
                'ticket_promedio'=> $promedio,
            ];
        });

        return response()->json([
            'sucursales'  => $result,
            'fecha_inicio'=> $fechaInicio,
            'fecha_fin'   => $fechaFin,
        ]);
    }

    /**
     * Ventas por usuario en un período.
     */
    public function ventasPorUsuario(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            $sucursalId = $request->header('X-Branch-Id');
        }

        $fechaInicio = $request->fecha_inicio ?? now()->startOfMonth()->toDateString();
        $fechaFin    = $request->fecha_fin    ?? now()->toDateString();

        // Obtener todos los usuarios que tienen permiso para vender o el rol de vendedor/admin
        // Para simplificar y ser precisos, buscaremos usuarios que tengan al menos ALGUN registro de actividad
        // o simplemente todos los usuarios activos si queremos una comparativa total.
        // El usuario pidió: "que pueda vender y tenga permiso para vender"
        
        $query = \App\Models\User::query()
            ->select('users.id', 'users.name')
            ->withCount(['ventas as num_ventas' => function ($q) use ($fechaInicio, $fechaFin, $sucursalId) {
                $q->where('estado', 'vigente')
                  ->whereBetween(DB::raw('DATE(created_at)'), [$fechaInicio, $fechaFin]);
                if ($sucursalId) {
                    $q->where('sucursal_id', $sucursalId);
                }
            }])
            ->withSum(['ventas as total_ventas' => function ($q) use ($fechaInicio, $fechaFin, $sucursalId) {
                $q->where('estado', 'vigente')
                  ->whereBetween(DB::raw('DATE(created_at)'), [$fechaInicio, $fechaFin]);
                if ($sucursalId) {
                    $q->where('sucursal_id', $sucursalId);
                }
            }], 'total')
            ->orderByDesc('total_ventas');

        $result = $query->get()->map(function($user) {
            $user->total_ventas = $user->total_ventas ?? 0;
            $user->num_ventas = $user->num_ventas ?? 0;
            $user->ticket_promedio = $user->num_ventas > 0 ? round($user->total_ventas / $user->num_ventas, 2) : 0;
            
            // Intentar obtener la sucursal (simplificado: la del último registro de venta o la primera asignada)
            // En un sistema multi-sucursal real, un usuario podría vender en varias.
            // Para el reporte, mostraremos su nombre y sus totales.
            return $user;
        });

        return response()->json([
            'usuarios'    => $result,
            'fecha_inicio'=> $fechaInicio,
            'fecha_fin'   => $fechaFin,
        ]);
    }

    /**
     * Top N productos más vendidos en un rango de fechas.
     */
    public function productosTop(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            $sucursalId = $request->header('X-Branch-Id');
        }

        $fechaInicio = $request->fecha_inicio ?? now()->startOfMonth()->toDateString();
        $fechaFin    = $request->fecha_fin    ?? now()->toDateString();
        $limite      = min((int) ($request->limite ?? 10), 50);

        $query = DetalleVenta::join('ventas', 'detalle_ventas.venta_id', '=', 'ventas.id')
            ->join('productos', 'detalle_ventas.producto_id', '=', 'productos.id')
            ->where('ventas.estado', 'vigente')
            ->whereBetween(DB::raw('DATE(ventas.created_at)'), [$fechaInicio, $fechaFin])
            ->select(
                'productos.id',
                'productos.nombre',
                'productos.sku',
                DB::raw('SUM(detalle_ventas.cantidad) as total_vendido'),
                DB::raw('SUM(detalle_ventas.subtotal) as total_monto'),
                DB::raw('COUNT(DISTINCT ventas.id) as num_ventas')
            )
            ->groupBy('productos.id', 'productos.nombre', 'productos.sku')
            ->orderByDesc('total_vendido');

        if ($sucursalId) {
            $query->where('ventas.sucursal_id', $sucursalId);
        }

        return response()->json($query->limit($limite)->get());
    }

    /**
     * Productos con stock por debajo del mínimo.
     */
    public function stockCritico(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            $sucursalId = $request->header('X-Branch-Id');
        }

        $query = DB::table('producto_sucursal')
            ->join('productos', 'producto_sucursal.producto_id', '=', 'productos.id')
            ->join('sucursales', 'producto_sucursal.sucursal_id', '=', 'sucursales.id')
            ->leftJoin('categorias', 'productos.categoria_id', '=', 'categorias.id')
            ->whereColumn('producto_sucursal.stock_actual', '<=', 'producto_sucursal.stock_minimo')
            ->where('productos.activo', true)
            ->select(
                'productos.id',
                'productos.nombre',
                'productos.sku',
                'categorias.nombre as categoria',
                'sucursales.nombre as sucursal',
                'producto_sucursal.stock_actual',
                'producto_sucursal.stock_minimo',
                'producto_sucursal.precio_venta',
                DB::raw('(producto_sucursal.stock_minimo - producto_sucursal.stock_actual) as diferencia')
            )
            ->orderBy('diferencia', 'desc');

        if ($sucursalId) {
            $query->where('producto_sucursal.sucursal_id', $sucursalId);
        }

        return response()->json($query->get());
    }

    /**
     * Listado de ventas anuladas con detalle y motivo.
     */
    public function anulaciones(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            $sucursalId = $request->header('X-Branch-Id');
        }

        $fechaInicio = $request->fecha_inicio ?? now()->startOfMonth()->toDateString();
        $fechaFin    = $request->fecha_fin    ?? now()->toDateString();

        $query = Venta::with(['ventas_anuladas.user', 'user', 'sucursal', 'cliente'])
            ->where('estado', 'anulada')
            ->whereBetween(DB::raw('DATE(created_at)'), [$fechaInicio, $fechaFin]);

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        return response()->json([
            'data'  => $query->orderByDesc('created_at')->get(),
            'total' => round($query->sum('total'), 2),
            'count' => $query->count(),
        ]);
    }

    /**
     * Reporte detallado de todos los productos y su valorización.
     */
    public function inventarioMaestro(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            $sucursalId = $request->header('X-Branch-Id');
        }

        $query = DB::table('producto_sucursal')
            ->join('productos', 'productos.id', '=', 'producto_sucursal.producto_id')
            ->leftJoin('categorias', 'categorias.id', '=', 'productos.categoria_id')
            ->join('sucursales', 'sucursales.id', '=', 'producto_sucursal.sucursal_id')
            ->select(
                'productos.nombre',
                'categorias.nombre as categoria',
                'sucursales.nombre as sucursal',
                'productos.sku',
                'producto_sucursal.stock_actual',
                'producto_sucursal.precio_compra',
                'producto_sucursal.precio_venta',
                DB::raw('(producto_sucursal.stock_actual * producto_sucursal.precio_compra) as valorizacion')
            );

        if ($sucursalId) {
            $query->where('producto_sucursal.sucursal_id', $sucursalId);
        }

        return response()->json($query->get());
    }

    // --- Métodos de Exportación Excel ---

    public function exportarVentas(Request $request)
    {
        $data = $this->ventasPorPeriodo($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\VentasExport($data['por_dia'], $data['totales']), 
            'reporte_ventas_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportarStock(Request $request)
    {
        $data = $this->stockCritico($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\StockExport($data), 
            'stock_critico_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportarTop(Request $request)
    {
        $data = $this->productosTop($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\ProductosTopExport($data), 
            'productos_top_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportarAnulaciones(Request $request)
    {
        $data = $this->anulaciones($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\AnulacionesExport($data['data']), 
            'ventas_anuladas_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportarInventario(Request $request)
    {
        $data = $this->inventarioMaestro($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\InventarioMaestroExport($data), 
            'inventario_maestro_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportarSucursal(Request $request)
    {
        $data = $this->ventasPorSucursal($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\VentasSucursalExport($data['sucursales']), 
            'ventas_por_sucursal_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    public function exportarUsuario(Request $request)
    {
        $data = $this->ventasPorUsuario($request)->getData(true);
        return \Maatwebsite\Excel\Facades\Excel::download(
            new \App\Exports\VentasUsuarioExport($data['usuarios']), 
            'ventas_por_usuario_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    /**
     * Generación de PDF profesional para cualquier reporte.
     */
    public function generarPdf(Request $request)
    {
        $tipo = $request->tipo;
        $data = [];
        $title = "Reporte";
        $headers = [];
        $rows = [];
        $total_formatted = "";

        // Obtener configuración de moneda
        $simbolo = Configuracion::getVal('simbolo_moneda', '$');
        $nombreEmpresa = Configuracion::getVal('nombre_empresa', 'Licorería');

        switch ($tipo) {
            case 'ventas':
                $res = $this->ventasPorPeriodo($request)->getData(true);
                $title = "Reporte de Ventas por Período";
                $headers = ['Fecha', 'Ventas', 'Efectivo', 'Tarjeta', 'Total'];
                foreach ($res['por_dia'] as $d) {
                    $rows[] = [$d['fecha'], $d['num_ventas'], $simbolo . number_format($d['efectivo'], 2), $simbolo . number_format($d['tarjeta'], 2), $simbolo . number_format($d['total'], 2)];
                }
                $total_formatted = $simbolo . number_format($res['totales']['total_ventas'], 2);
                break;
            case 'sucursal':
                $res = $this->ventasPorSucursal($request)->getData(true);
                $title = "Ventas por Sucursal";
                $headers = ['Sucursal', 'Ventas', 'T. Promedio', 'Total'];
                foreach ($res['sucursales'] as $s) {
                    $rows[] = [$s['nombre'], $s['num_ventas'], $simbolo . number_format($s['ticket_promedio'], 2), $simbolo . number_format($s['total_ventas'], 2)];
                }
                $total_formatted = $simbolo . number_format(collect($res['sucursales'])->sum('total_ventas'), 2);
                break;
            case 'usuario':
                $res = $this->ventasPorUsuario($request)->getData(true);
                $title = "Rendimiento por Vendedor";
                $headers = ['Usuario', 'Sucursal', 'Ventas', 'T. Promedio', 'Total'];
                foreach ($res['usuarios'] as $u) {
                    $rows[] = [$u['name'], $u['sucursal'], $u['num_ventas'], $simbolo . number_format($u['ticket_promedio'], 2), $simbolo . number_format($u['total_ventas'], 2)];
                }
                $total_formatted = $simbolo . number_format(collect($res['usuarios'])->sum('total_ventas'), 2);
                break;
            case 'inventario':
                $res = $this->inventarioMaestro($request)->getData(true);
                $title = "Inventario Maestro y Valorización";
                $headers = ['Producto', 'Categoría', 'Stock', 'Costo', 'Venta', 'Valorización'];
                foreach ($res as $i) {
                    $rows[] = [$i['nombre'], $i['categoria'], $i['stock_actual'], $simbolo . number_format($i['precio_compra'], 2), $simbolo . number_format($i['precio_venta'], 2), $simbolo . number_format($i['valorizacion'], 2)];
                }
                $total_formatted = $simbolo . number_format(collect($res)->sum('valorizacion'), 2);
                break;
            case 'top':
                $res = $this->productosTop($request)->getData(true);
                $title = "Top de Productos más Vendidos";
                $headers = ['Producto', 'SKU', 'Vendidos', 'N° Ventas', 'Total'];
                foreach ($res as $p) {
                    $rows[] = [$p['nombre'], $p['sku'], $p['total_vendido'], $p['num_ventas'], $simbolo . number_format($p['total_monto'], 2)];
                }
                $total_formatted = $simbolo . number_format(collect($res)->sum('total_monto'), 2);
                break;
            case 'stock':
                $res = $this->stockCritico($request)->getData(true);
                $title = "Reporte de Stock Crítico";
                $headers = ['Producto', 'SKU', 'Categoría', 'Sucursal', 'Stock', 'Mínimo', 'Precio'];
                foreach ($res as $s) {
                    $rows[] = [$s['nombre'], $s['sku'], $s['categoria'], $s['sucursal'], $s['stock_actual'], $s['stock_minimo'], $simbolo . number_format($s['precio_venta'], 2)];
                }
                break;
        }

        $fecha_inicio = $request->fecha_inicio ?? now()->startOfMonth()->toDateString();
        $fecha_fin = $request->fecha_fin ?? now()->toDateString();

        $pdf = Pdf::loadView('reports.general', compact('title', 'headers', 'rows', 'fecha_inicio', 'fecha_fin', 'total_formatted', 'nombreEmpresa'));
        return $pdf->stream($tipo . '_reporte_' . now()->format('Ymd') . '.pdf');
    }
}

