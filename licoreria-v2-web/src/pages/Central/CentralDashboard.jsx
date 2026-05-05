import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Buildings,
  ShieldCheck,
  HardDrives,
  ChartLineUp,
  WarningCircle,
  CheckCircle,
  ArrowsClockwise,
  Crown,
  ArrowUpRight,
  Clock,
} from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const iconMap = {
  Buildings, Crown, WarningCircle, HardDrives,
};

export default function CentralDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 5)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchDashboard(); }, [startDate, endDate]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/central/dashboard', {
        params: { start_date: startDate, end_date: endDate }
      });
      setData(res.data);
    } catch (e) {
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { label: 'Activa', color: 'text-emerald-600 bg-emerald-50' },
      trial: { label: 'Prueba', color: 'text-blue-600 bg-blue-50' },
      suspended: { label: 'Suspendida', color: 'text-rose-600 bg-rose-50' },
      expired: { label: 'Expirada', color: 'text-amber-600 bg-amber-50' },
    };
    const m = map[status] || map.trial;
    return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${m.color}`}>{m.label}</span>;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-slate-100 rounded-lg"></div>
          <div className="h-9 w-9 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-100 rounded-sm"></div>)}
        </div>
        <div className="h-[400px] bg-slate-100 rounded-sm"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Negocios',
      val: data?.total_tenants || 0,
      icon: Buildings,
      color: 'text-primary',
      sub: Object.entries(data?.status_counts || {}).filter(([,v]) => v > 0).map(([k,v]) => `${v} ${k}`).join(' • '),
    },
    {
      title: 'Planes Activos',
      val: data?.total_plans || 0,
      icon: Crown,
      color: 'text-violet-600',
      sub: 'Catálogo disponible',
    },
    {
      title: 'Por Expirar (7d)',
      val: data?.expiring_soon || 0,
      icon: WarningCircle,
      color: data?.expiring_soon > 0 ? 'text-amber-600' : 'text-slate-400',
      sub: data?.expiring_soon > 0 ? 'Requieren atención' : 'Sin alertas',
    },
    {
      title: 'Respaldos',
      val: data?.backup?.total_backups || 0,
      icon: HardDrives,
      color: 'text-emerald-600',
      sub: data?.backup?.total_size || '0 B',
    },
    {
      title: 'Ventas Hoy',
      val: `$${(data?.global_sales?.sales_today || 0).toLocaleString()}`,
      icon: ChartLineUp,
      color: 'text-indigo-600',
      sub: `Mes: $${(data?.global_sales?.sales_this_month || 0).toLocaleString()}`,
    },
    {
      title: 'Ventas Totales',
      val: `$${(data?.global_sales?.total_historical || 0).toLocaleString()}`,
      icon: ShieldCheck,
      color: 'text-sky-600',
      sub: 'Plataforma Global',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Control</h1>
          <p className="text-muted-foreground text-sm">Gestión global de la red de negocios</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 shadow-sm">
            <Clock size={14} className="text-muted-foreground" />
            <div className="flex items-center gap-2 text-xs">
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-muted-foreground outline-none"
              />
              <span className="text-muted-foreground">—</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-muted-foreground outline-none"
              />
            </div>
          </div>
          <Button onClick={fetchDashboard} disabled={loading} variant="outline" size="icon">
            <ArrowsClockwise size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{kpi.title}</CardTitle>
                <Icon size={16} className={kpi.color} />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${kpi.color === 'text-amber-600' && data?.expiring_soon > 0 ? 'text-amber-600' : ''}`}>
                  {kpi.val}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Section */}
      <Card className="border shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Tendencia de Ventas Globales</CardTitle>
              <CardDescription>Movimiento de los últimos 6 meses</CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-indigo-600 border-indigo-100 bg-indigo-50/50">
              BIG DATA
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.global_sales?.monthly_trend || []}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#94a3b8'}}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Negocios Recientes</CardTitle>
              <CardDescription>Últimos negocios registrados</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/central/tenants')}>
              Ver Todos
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t">
              <table className="w-full text-left text-sm">
                <thead className="bg-transparent border-b">
                  <tr className="border-b">
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase text-[10px]">Negocio</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase text-[10px]">Plan</th>
                    <th className="px-6 py-3 font-medium text-muted-foreground uppercase text-[10px]">Estado</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(!data?.recent_tenants || data.recent_tenants.length === 0) ? (
                    <tr><td colSpan={4} className="p-10 text-center text-xs text-muted-foreground">Sin negocios registrados</td></tr>
                  ) : (
                    data.recent_tenants.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px]">
                                {t.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{t.name}</span>
                              <span className="text-[10px] text-muted-foreground">{t.domain || t.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{t.plan_name}</td>
                        <td className="px-6 py-4">
                          <Badge variant={t.license_status === 'active' ? 'success' : 'outline'} className="text-[10px]">
                            {t.license_status === 'active' ? 'Activa' : t.license_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/central/licenses')}>
                            <ArrowUpRight size={14} />
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

        <div className="col-span-full lg:col-span-3 space-y-6">
          <Card className="border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold">Estado de Respaldos</CardTitle>
              <HardDrives size={18} className="text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Archivos</p>
                  <p className="text-xl font-bold">{data?.backup?.total_backups || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Espacio</p>
                  <p className="text-xl font-bold">{data?.backup?.total_size || '0 B'}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {data?.backup?.last_backup ? (
                  <Badge variant="outline" className="w-fit gap-1 text-[10px]">
                    <CheckCircle size={10} className="text-emerald-500" /> Último: {formatDate(data.backup.last_backup.created_at)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="w-fit text-[10px]">Sin respaldos</Badge>
                )}
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate('/central/backups')}>
                  Gestionar Respaldos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 p-3">
              <Button variant="ghost" className="justify-start h-9 text-xs gap-3" onClick={() => navigate('/central/tenants')}>
                <Buildings size={16} /> Administrar Licorerías
              </Button>
              <Button variant="ghost" className="justify-start h-9 text-xs gap-3" onClick={() => navigate('/central/licenses')}>
                <Crown size={16} /> Gestionar Licencias
              </Button>
              <Button variant="ghost" className="justify-start h-9 text-xs gap-3" onClick={() => navigate('/central/backups')}>
                <HardDrives size={16} /> Respaldos Globales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] pt-10">Licora</p>
    </div>
  );
}
