import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  ChartLineUp, 
  Handbag, 
  Receipt, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  DownloadSimple,
  CalendarBlank,
  UserCircle,
  Warning,
  CheckCircle,
  CurrencyCircleDollar
} from "@phosphor-icons/react";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

// Icon mapping for dynamic KPIs
const iconMap = {
  ChartLineUp,
  Receipt,
  Handbag,
  Users
};

export default function AdminDashboard() {
  const { formatMoney } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      toast.error("Error al cargar estadísticas del panel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vista General</h1>
          <p className="text-slate-500 text-xs font-medium">Control operativo y financiero en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-4 border-slate-200 text-slate-600 font-medium bg-white hover:bg-slate-50">
            <CalendarBlank className="mr-2 h-4 w-4" weight="regular" /> 
            Últimos 30 días
          </Button>
          <Button size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm">
            <DownloadSimple className="mr-2 h-4 w-4" weight="regular" /> 
            Descargar Reporte
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats?.kpis.map((kpi, i) => {
          const Icon = iconMap[kpi.icon] || ChartLineUp;
          return (
            <Card key={i} className="border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </span>
                <Icon className={`h-4 w-4 ${kpi.color}`} weight="regular" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-slate-900">
                  {kpi.title.includes('Ventas') || kpi.title.includes('Ticket') ? formatMoney(kpi.val) : kpi.val.toLocaleString()}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold ${kpi.isUp ? "text-emerald-600" : "text-rose-600"}`}>
                    {kpi.trend}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">vs. mes pasado</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Analysis Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 border border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Rendimiento de Ventas</CardTitle>
                <CardDescription className="text-xs text-slate-500">Ingresos históricos por mes.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] pt-6 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesHistory} margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 10, fontWeight: '500', fill: '#94a3b8' }}
                   dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: '500', fill: '#94a3b8' }}
                  tickFormatter={(val) => `C$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <Tooltip 
                  formatter={(val) => [formatMoney(val), "Ventas"]}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    padding: '8px 12px'
                  }}
                  itemStyle={{ fontWeight: '600', fontSize: '12px', color: '#0f172a' }}
                  labelStyle={{ fontWeight: '500', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrimary)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Operational Widgets */}
        <div className="col-span-full lg:col-span-3 space-y-6">
            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Alertas de Stock</span>
                        <div className="h-5 w-5 rounded-full bg-rose-50 flex items-center justify-center">
                            <Warning className="h-3 w-3 text-rose-600" weight="bold" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {stats?.lowStock.length === 0 ? (
                            <div className="p-8 text-center">
                                <CheckCircle className="h-8 w-8 text-emerald-100 mx-auto mb-2" />
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Stock saludable</p>
                            </div>
                        ) : (
                            stats?.lowStock.map((alert, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                                    <span className="text-xs font-medium text-slate-700 truncate pr-4">{alert.item}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400">{alert.stock}</span>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${alert.status === 'Crítico' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {alert.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Estado de Caja (Hoy)</span>
                        <CurrencyCircleDollar className="h-4 w-4 text-emerald-500" />
                    </div>
                </CardHeader>
                <CardContent className="p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Monto Estimado</p>
                        <p className="text-xl font-bold text-slate-900">{formatMoney(stats?.cashStatus.balance)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md mb-2 ${stats?.cashStatus.isOpen ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-100'}`}>
                            {stats?.cashStatus.isOpen ? 'Abierta' : 'Cerrada'}
                        </span>
                        <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-bold border-slate-200">Ver Detalles</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Transactional Activity */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4 px-6">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">Últimas Facturas</CardTitle>
            <CardDescription className="text-xs text-slate-500">Movimientos recientes de facturación.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-slate-50">
            Ver Registro Completo
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/30">
                  <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Folio</th>
                  <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</th>
                  <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Monto</th>
                  <th className="h-10 px-6"></th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSales.length === 0 ? (
                    <tr><td colSpan={4} className="p-10 text-center text-[10px] font-bold text-slate-300 uppercase">Sin movimientos hoy</td></tr>
                ) : (
                    stats?.recentSales.map((sale, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 font-mono text-[10px] font-semibold text-slate-500">{sale.id}</td>
                        <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${sale.color} bg-current/5`}>{sale.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 text-xs tracking-tight">{formatMoney(sale.amount)}</td>
                        <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-300 hover:text-primary">
                            <ArrowUpRight weight="bold" />
                        </Button>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] py-10">Licora Business Ecosystem v2.0</p>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-10 w-48 bg-slate-100 rounded-lg"></div>
                <div className="h-10 w-64 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-2xl"></div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-6">
                <div className="col-span-4 h-[400px] bg-slate-100 rounded-2xl"></div>
                <div className="col-span-3 space-y-6">
                    <div className="h-44 bg-slate-100 rounded-2xl"></div>
                    <div className="h-44 bg-slate-100 rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
}

