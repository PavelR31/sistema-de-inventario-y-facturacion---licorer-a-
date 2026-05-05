import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useNavigate } from 'react-router-dom';

const iconMap = {
  Buildings, Crown, WarningCircle, HardDrives,
};

export default function CentralDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/central/dashboard');
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
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Centro de Control</h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70">Gestión global de la red de negocios</p>
        </div>
        <Button onClick={fetchDashboard} disabled={loading} variant="outline" size="sm" className="h-9 px-3 border-slate-200 bg-white hover:bg-slate-50 rounded-sm">
          <ArrowsClockwise size={14} className={loading ? 'animate-spin' : ''} weight="bold" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary transition-colors">{kpi.title}</span>
                <div className={`p-2 rounded-sm ${kpi.color.replace('text-', 'bg-')}/10 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} className={kpi.color} weight="duotone" />
                </div>
              </CardHeader>
              <CardContent className="pb-5">
                <div className={`text-3xl font-black tracking-tight leading-none mb-2 ${kpi.color === 'text-amber-600' && data?.expiring_soon > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {kpi.val}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">{kpi.sub}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Tenants */}
        <Card className="col-span-full lg:col-span-4 border-none shadow-sm bg-white overflow-hidden rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4 px-6 pt-6">
            <div>
              <CardTitle className="text-base font-bold text-slate-800">Negocios Recientes</CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">Últimos negocios registrados en el sistema.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 px-4 rounded-sm" onClick={() => navigate('/central/tenants')}>
              Ver Todos
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Negocio</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado</th>
                    <th className="h-10 px-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {(!data?.recent_tenants || data.recent_tenants.length === 0) ? (
                    <tr><td colSpan={4} className="p-10 text-center text-[10px] font-bold text-slate-300 uppercase">Sin negocios registrados</td></tr>
                  ) : (
                    data.recent_tenants.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-sm bg-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                              {t.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-sm text-slate-700">{t.name}</span>
                              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{t.domain || t.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">{t.plan_name}</td>
                        <td className="px-6 py-4">{getStatusBadge(t.license_status)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-slate-300 hover:text-primary" onClick={() => navigate('/central/licenses')}>
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

        {/* Side Widgets */}
        <div className="col-span-full lg:col-span-3 space-y-6">
          {/* Backup Status */}
          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-sm group">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50 py-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Estado de Respaldos</span>
                <HardDrives size={18} className="text-emerald-500" weight="duotone" />
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Total archivos</p>
                  <p className="text-xl font-bold text-slate-900">{data?.backup?.total_backups || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">Espacio</p>
                  <p className="text-xl font-bold text-slate-900">{data?.backup?.total_size || '0 B'}</p>
                </div>
              </div>
              {data?.backup?.last_backup ? (
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-600 bg-emerald-50 font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                    <CheckCircle size={12} weight="bold" /> Último: {formatDate(data.backup.last_backup.created_at)}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-sm">Sin respaldos</span>
              )}
              <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200 rounded-sm" onClick={() => navigate('/central/backups')}>
                Gestionar Respaldos
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-sm bg-white overflow-hidden rounded-sm">
            <CardHeader className="bg-slate-50/30 border-b border-slate-50 py-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Acciones Rápidas</span>
            </CardHeader>
            <CardContent className="p-3 space-y-1">
              <Button variant="ghost" className="w-full justify-start h-10 rounded-sm text-xs font-medium hover:bg-primary/5 hover:text-primary gap-3" onClick={() => navigate('/central/tenants')}>
                <Buildings size={16} weight="duotone" /> Administrar Licorerías
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10 rounded-sm text-xs font-medium hover:bg-primary/5 hover:text-primary gap-3" onClick={() => navigate('/central/licenses')}>
                <Crown size={16} weight="duotone" /> Gestionar Licencias
              </Button>
              <Button variant="ghost" className="w-full justify-start h-10 rounded-sm text-xs font-medium hover:bg-primary/5 hover:text-primary gap-3" onClick={() => navigate('/central/backups')}>
                <HardDrives size={16} weight="duotone" /> Respaldos Globales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] py-10">Licora Business Ecosystem v2.0</p>
    </div>
  );
}
