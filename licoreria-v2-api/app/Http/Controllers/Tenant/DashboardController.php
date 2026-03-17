<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Venta;
use App\Models\Tenant\Producto;
use App\Models\Tenant\Caja;
use App\Models\Tenant\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $sucursalId = $request->header('X-Branch-Id') ?? $request->sucursal_id;

        // 1. KPIs (Last 30 days vs Prev 30 days)
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sixtyDaysAgo = $now->copy()->subDays(60);

        $currentVentas = Venta::where('estado', 'vigente')
            ->whereBetween('created_at', [$thirtyDaysAgo, $now]);
        
        $prevVentas = Venta::where('estado', 'vigente')
            ->whereBetween('created_at', [$sixtyDaysAgo, $thirtyDaysAgo]);

        if ($sucursalId) {
            $currentVentas->where('sucursal_id', $sucursalId);
            $prevVentas->where('sucursal_id', $sucursalId);
        }

        $currentTotal = $currentVentas->sum('total');
        $prevTotal = $prevVentas->sum('total');
        $currentCount = $currentVentas->count();
        $prevCount = $prevVentas->count();

        $ventasTrend = $prevTotal > 0 ? (($currentTotal - $prevTotal) / $prevTotal) * 100 : 100;
        $ordersTrend = $prevCount > 0 ? (($currentCount - $prevCount) / $prevCount) * 100 : 100;

        $avgTicket = $currentCount > 0 ? $currentTotal / $currentCount : 0;
        $prevAvgTicket = $prevCount > 0 ? $prevTotal / $prevCount : 0;
        $avgTicketTrend = $prevAvgTicket > 0 ? (($avgTicket - $prevAvgTicket) / $prevAvgTicket) * 100 : 100;

        $activeCustomers = Cliente::whereHas('ventas', function($q) use ($thirtyDaysAgo, $now, $sucursalId) {
            $q->whereBetween('created_at', [$thirtyDaysAgo, $now]);
            if ($sucursalId) $q->where('sucursal_id', $sucursalId);
        })->count();

        // 2. Sales History (Last 6 Months)
        $salesHistory = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $sum = Venta::where('estado', 'vigente')
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year);
            
            if ($sucursalId) $sum->where('sucursal_id', $sucursalId);
            
            $salesHistory[] = [
                'name' => $month->translatedFormat('M'),
                'total' => (float) $sum->sum('total')
            ];
        }

        // 3. Low Stock Alerts
        $lowStockQuery = DB::table('producto_sucursal')
            ->join('productos', 'productos.id', '=', 'producto_sucursal.producto_id')
            ->select('productos.nombre', 'producto_sucursal.stock_actual', 'producto_sucursal.stock_minimo')
            ->whereRaw('producto_sucursal.stock_actual <= producto_sucursal.stock_minimo');

        if ($sucursalId) {
            $lowStockQuery->where('producto_sucursal.sucursal_id', $sucursalId);
        }

        $lowStock = $lowStockQuery->limit(5)->get()->map(function($item) {
            return [
                'item' => $item->nombre,
                'stock' => $item->stock_actual . ' u.',
                'status' => $item->stock_actual <= 0 ? 'Crítico' : ($item->stock_actual <= ($item->stock_minimo / 2) ? 'Bajo' : 'Preventivo')
            ];
        });

        // 4. Recent Sales
        $recentSalesQuery = Venta::with('sucursal')
            ->latest()
            ->limit(5);

        if ($sucursalId) {
            $recentSalesQuery->where('sucursal_id', $sucursalId);
        }

        $recentSales = $recentSalesQuery->get()->map(function($v) {
            return [
                'id' => $v->numero_factura,
                'status' => ucfirst($v->estado),
                'amount' => (float) $v->total,
                'color' => $v->estado === 'vigente' ? 'text-emerald-600' : 'text-rose-600',
            ];
        });

        // 5. Cash Status
        $openCajasQuery = Caja::where('estado', 'abierta');
        if ($sucursalId) {
            $openCajasQuery->where('sucursal_id', $sucursalId);
        }

        $openCajas = $openCajasQuery->get();
        $cashBalance = 0;
        foreach ($openCajas as $caja) {
            $ventasEfectivo = Venta::where('caja_id', $caja->id)
                ->where('metodo_pago', 'efectivo')
                ->where('estado', 'vigente')
                ->sum('total');
            $cashBalance += $caja->monto_apertura + $ventasEfectivo;
        }

        return response()->json([
            'kpis' => [
                ['title' => 'Ventas Netas', 'val' => $currentTotal, 'trend' => round($ventasTrend, 1).'%', 'isUp' => $ventasTrend >= 0, 'icon' => 'ChartLineUp', 'color' => 'text-emerald-500'],
                ['title' => 'Órdenes Totales', 'val' => $currentCount, 'trend' => round($ordersTrend, 1).'%', 'isUp' => $ordersTrend >= 0, 'icon' => 'Receipt', 'color' => 'text-blue-500'],
                ['title' => 'Ticket Promedio', 'val' => $avgTicket, 'trend' => round($avgTicketTrend, 1).'%', 'isUp' => $avgTicketTrend >= 0, 'icon' => 'Handbag', 'color' => 'text-slate-400'],
                ['title' => 'Clientes Activos', 'val' => $activeCustomers, 'trend' => '', 'isUp' => true, 'icon' => 'Users', 'color' => 'text-indigo-500'],
            ],
            'salesHistory' => $salesHistory,
            'lowStock' => $lowStock,
            'recentSales' => $recentSales,
            'cashStatus' => [
                'balance' => $cashBalance,
                'isOpen' => $openCajas->count() > 0
            ]
        ]);
    }
}
