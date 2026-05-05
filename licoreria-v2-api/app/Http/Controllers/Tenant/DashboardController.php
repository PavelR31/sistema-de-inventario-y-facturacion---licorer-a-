<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Venta;
use App\Models\Tenant\Producto;
use App\Models\Tenant\Caja;
use App\Models\Tenant\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant\CompraProveedor;
use App\Models\Tenant\VentaAnulada;
use App\Models\Tenant\AjusteInventario;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getTimeline(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id');
        $limit = $request->limit ?? 10;

        // 1. Obtener Ventas Recientes
        $ventas = Venta::with(['user', 'sucursal'])
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($v) => [
                'id' => "v-{$v->id}",
                'type' => 'venta',
                'title' => "Nueva Venta: {$v->numero_factura}",
                'description' => "Realizada por {$v->user->name} por un monto de " . number_format($v->total, 2),
                'amount' => (float)$v->total,
                'status' => $v->estado,
                'time' => $v->created_at->toISOString(),
                'icon' => 'receipt'
            ]);

        // 2. Obtener Anulaciones
        $anulaciones = VentaAnulada::with(['venta', 'user'])
            ->whereHas('venta', function($q) use ($sucursalId) {
                if ($sucursalId) $q->where('sucursal_id', $sucursalId);
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($a) => [
                'id' => "a-{$a->id}",
                'type' => 'anulacion',
                'title' => "Venta Anulada: {$a->venta->numero_factura}",
                'description' => "Anulada por {$a->user->name}. Motivo: {$a->motivo}",
                'amount' => (float)$a->venta->total,
                'status' => 'anulada',
                'time' => $a->created_at->toISOString(),
                'icon' => 'x-circle'
            ]);

        // 3. Obtener Compras (Abastecimiento)
        $compras = CompraProveedor::with(['proveedor', 'user'])
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($c) => [
                'id' => "c-{$c->id}",
                'type' => 'compra',
                'title' => "Abastecimiento: {$c->proveedor->nombre}",
                'description' => "Ingreso de mercadería por factura #{$c->numero_factura}",
                'amount' => (float)$c->total,
                'status' => 'completado',
                'time' => $c->created_at->toISOString(),
                'icon' => 'package'
            ]);

        // 4. Obtener Ajustes de Stock
        $ajustes = AjusteInventario::with(['producto', 'user'])
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn($aj) => [
                'id' => "aj-{$aj->id}",
                'type' => 'ajuste',
                'title' => "Ajuste de Stock: {$aj->producto->nombre}",
                'description' => "Se ajustó " . ($aj->tipo === 'entrada' ? '+' : '-') . "{$aj->cantidad} unidades. Motivo: {$aj->motivo}",
                'amount' => null,
                'status' => 'ajustado',
                'time' => $aj->created_at->toISOString(),
                'icon' => 'arrows-left-right'
            ]);

        // Combinar y ordenar
        $timeline = collect($ventas)
            ->concat($anulaciones)
            ->concat($compras)
            ->concat($ajustes)
            ->sortByDesc('time')
            ->values()
            ->take($limit);

        return response()->json($timeline);
    }

    public function getStats(Request $request)
    {
        $sucursalId = $request->sucursal_id;
        
        // Si se pide 'all' explícitamente, ignoramos el header de sucursal activa
        if ($sucursalId === 'all') {
            $sucursalId = null;
        } elseif (!$sucursalId) {
            // Si no viene parámetro, intentamos usar el header context de la sucursal
            $sucursalId = $request->header('X-Branch-Id');
        }
        
        // Filtros de fecha
        $fechaInicio = $request->fecha_inicio ? Carbon::parse($request->fecha_inicio)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $fechaFin    = $request->fecha_fin ? Carbon::parse($request->fecha_fin)->endOfDay() : Carbon::now()->endOfDay();
        
        // Período anterior para trends (mismo número de días)
        $diffInDays = $fechaInicio->diffInDays($fechaFin) + 1;
        $prevInicio = $fechaInicio->copy()->subDays($diffInDays);
        $prevFin    = $fechaInicio->copy()->subSecond();

        // 1. KPIs
        $queryCurrent = Venta::where('estado', 'vigente')->whereBetween('created_at', [$fechaInicio, $fechaFin]);
        $queryPrev    = Venta::where('estado', 'vigente')->whereBetween('created_at', [$prevInicio, $prevFin]);

        if ($sucursalId) {
            $queryCurrent->where('sucursal_id', $sucursalId);
            $queryPrev->where('sucursal_id', $sucursalId);
        }

        $currentTotal = (float) $queryCurrent->sum('total');
        $prevTotal    = (float) $queryPrev->sum('total');
        $currentCount = $queryCurrent->count();
        $prevCount    = $queryPrev->count();

        // Utilidad Bruta (Ventas - Costo de los productos)
        // Necesitamos unir con detalle_ventas y producto_sucursal para obtener el precio_compra en el momento
        $currentProfit = (float) DB::table('detalle_ventas')
            ->join('ventas', 'ventas.id', '=', 'detalle_ventas.venta_id')
            ->join('producto_sucursal', function($join) {
                $join->on('producto_sucursal.producto_id', '=', 'detalle_ventas.producto_id')
                     ->on('producto_sucursal.sucursal_id', '=', 'ventas.sucursal_id');
            })
            ->where('ventas.estado', 'vigente')
            ->whereBetween('ventas.created_at', [$fechaInicio, $fechaFin])
            ->when($sucursalId, fn($q) => $q->where('ventas.sucursal_id', $sucursalId))
            ->sum(DB::raw('detalle_ventas.subtotal - (detalle_ventas.cantidad * producto_sucursal.precio_compra)'));

        $prevProfit = (float) DB::table('detalle_ventas')
            ->join('ventas', 'ventas.id', '=', 'detalle_ventas.venta_id')
            ->join('producto_sucursal', function($join) {
                $join->on('producto_sucursal.producto_id', '=', 'detalle_ventas.producto_id')
                     ->on('producto_sucursal.sucursal_id', '=', 'ventas.sucursal_id');
            })
            ->where('ventas.estado', 'vigente')
            ->whereBetween('ventas.created_at', [$prevInicio, $prevFin])
            ->when($sucursalId, fn($q) => $q->where('ventas.sucursal_id', $sucursalId))
            ->sum(DB::raw('detalle_ventas.subtotal - (detalle_ventas.cantidad * producto_sucursal.precio_compra)'));

        $ventasTrend = $prevTotal > 0 ? (($currentTotal - $prevTotal) / $prevTotal) * 100 : 100;
        $profitTrend = $prevProfit > 0 ? (($currentProfit - $prevProfit) / $prevProfit) * 100 : 100;

        $avgTicket = $currentCount > 0 ? $currentTotal / $currentCount : 0;
        $prevAvgTicket = $prevCount > 0 ? $prevTotal / $prevCount : 0;
        $avgTicketTrend = $prevAvgTicket > 0 ? (($avgTicket - $prevAvgTicket) / $prevAvgTicket) * 100 : 100;

        // 2. Sales History (Agrupado por día o mes dependiendo del rango)
        $salesHistory = [];
        if ($diffInDays <= 60) {
            // Por día
            $history = (clone $queryCurrent)
                ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as total'))
                ->groupBy('date')
                ->orderBy('date')
                ->get();
            foreach ($history as $h) {
                $salesHistory[] = ['name' => Carbon::parse($h->date)->format('d M'), 'total' => (float) $h->total];
            }
        } else {
            // Por mes
            for ($i = 5; $i >= 0; $i--) {
                $month = Carbon::now()->subMonths($i);
                $sum = Venta::where('estado', 'vigente')
                    ->whereMonth('created_at', $month->month)
                    ->whereYear('created_at', $month->year);
                if ($sucursalId) $sum->where('sucursal_id', $sucursalId);
                $salesHistory[] = ['name' => $month->translatedFormat('M'), 'total' => (float) $sum->sum('total')];
            }
        }

        // 3. Low Stock 
        $lowStockQuery = DB::table('producto_sucursal')
            ->join('productos', 'productos.id', '=', 'producto_sucursal.producto_id')
            ->select('productos.nombre', 'producto_sucursal.stock_actual', 'producto_sucursal.stock_minimo')
            ->whereRaw('producto_sucursal.stock_actual <= producto_sucursal.stock_minimo');
        if ($sucursalId) $lowStockQuery->where('producto_sucursal.sucursal_id', $sucursalId);
        
        $lowStock = $lowStockQuery->limit(5)->get()->map(function($item) {
            return [
                'item' => $item->nombre,
                'stock' => $item->stock_actual . ' u.',
                'status' => $item->stock_actual <= 0 ? 'Crítico' : ($item->stock_actual <= ($item->stock_minimo / 2) ? 'Bajo' : 'Preventivo')
            ];
        });

        // 4. Recent Sales
        $recentSalesQuery = Venta::with('sucursal')->latest()->limit(5);
        if ($sucursalId) $recentSalesQuery->where('sucursal_id', $sucursalId);
        $recentSales = $recentSalesQuery->get()->map(function($v) {
            return [
                'id' => $v->numero_factura,
                'status' => ucfirst($v->estado),
                'amount' => (float) $v->total,
                'color' => $v->estado === 'vigente' ? 'text-emerald-600' : 'text-rose-600',
            ];
        });

        // 5. Cash Status
        $openCajasQuery = Caja::where('activa', true);
        if ($sucursalId) $openCajasQuery->where('sucursal_id', $sucursalId);
        $openCajas = $openCajasQuery->get();
        $cashBalance = 0;
        foreach ($openCajas as $caja) {
            // Obtener ventas en efectivo de la sesión activa de esta caja
            $ventasEfectivo = Venta::whereHas('session', function($q) use ($caja) {
                $q->where('caja_id', $caja->id)->where('estado', 'abierta');
            })->where('metodo_pago', 'efectivo')->where('estado', 'vigente')->sum('total');
            
            $cashBalance += $caja->balance_actual + $ventasEfectivo;
        }

        return response()->json([
            'kpis' => [
                ['title' => 'Ventas Netas', 'val' => $currentTotal, 'trend' => round($ventasTrend, 1).'%', 'isUp' => $ventasTrend >= 0, 'icon' => 'ChartLineUp', 'color' => 'text-emerald-500'],
                ['title' => 'Utilidad Bruta', 'val' => $currentProfit, 'trend' => round($profitTrend, 1).'%', 'isUp' => $profitTrend >= 0, 'icon' => 'CurrencyCircleDollar', 'color' => 'text-indigo-500'],
                ['title' => 'Ticket Promedio', 'val' => $avgTicket, 'trend' => round($avgTicketTrend, 1).'%', 'isUp' => $avgTicketTrend >= 0, 'icon' => 'Handbag', 'color' => 'text-slate-400'],
                ['title' => 'Órdenes', 'val' => $currentCount, 'trend' => round($prevCount > 0 ? ($currentCount - $prevCount) : 0, 0), 'isUp' => $currentCount >= $prevCount, 'icon' => 'Receipt', 'color' => 'text-blue-500'],
            ],
            'salesHistory' => $salesHistory,
            'lowStock' => $lowStock,
            'recentSales' => $recentSales,
            'cashStatus' => [
                'balance' => $cashBalance,
                'isOpen' => $openCajas->count() > 0
            ],
            'timeline' => $this->getTimeline($request)->original
        ]);
    }
}

