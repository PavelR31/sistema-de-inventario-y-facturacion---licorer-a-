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
  CurrencyCircleDollar,
  Storefront,
  ArrowsClockwise,
  TrendUp,
  TrendDown,
  XCircle,
  Package,
  ArrowsLeftRight,
  Clock,
  ArrowRight
} from "@phosphor-icons/react";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useCurrency } from "@/hooks/useCurrency";
import { toast } from "sonner";

// Icon mapping for dynamic KPIs
const iconMap = {
  ChartLineUp,
  Receipt,
  Handbag: CurrencyCircleDollar, // Cambio visual a moneda para Ticket/Utilidad
  CurrencyCircleDollar,
  Users
};

const PRESETS = [
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Este Mes', value: 'month' },
  { label: 'Este Año', value: 'year' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sucursales, setSucursales] = useState([]);
  
  // Filtros
  const [sucursalId, setSucursalId] = useState('all');
  const [users, setUsers] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users', { params: { all: true } });
      setUsers(res.data.data || res.data || []);
    } catch (err) {
      console.error("Error al cargar usuarios");
    }
  };

  const fetchSucursales = async () => {
    try {
      const res = await api.get('/api/sucursales');
      // La API devuelve paginación, los datos están en res.data.data
      setSucursales(res.data.data || res.data || []);
    } catch (err) {
      console.error("Error al cargar sucursales");
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        sucursal_id: sucursalId, // Siempre enviamos sucursalId, incluso si es 'all'
      };

      const res = await api.get('/api/dashboard/stats', { params });
      setStats(res.data);
    } catch (err) {
      toast.error("Error al cargar estadísticas del panel");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [sucursalId, fechaInicio, fechaFin]);

  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Resumen operativo y métricas de rendimiento en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-9 gap-2 shadow-sm"
            onClick={async () => {
              try {
                const response = await api.get('/api/reportes/pdf', {
                  params: { tipo: 'ventas', fecha_inicio: fechaInicio, fecha_fin: fechaFin },
                  responseType: 'blob',
                });
                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                window.open(url, '_blank');
              } catch (error) {
                toast.error('Error al generar el reporte');
              }
            }}
          >
            <DownloadSimple size={16} /> Descargar reporte
          </Button>
          <Button className="h-9 gap-2 shadow-md" onClick={() => navigate('/admin/reportes')}>
            <CalendarBlank size={16} /> Ver Reportes
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-2 rounded-xl border border-muted shadow-sm">
        <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1 shadow-sm">
          <Storefront size={14} className="text-muted-foreground ml-1" />
          <Select value={sucursalId} onValueChange={setSucursalId}>
            <SelectTrigger className="h-7 border-none shadow-none text-xs w-[140px] focus:ring-0">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {sucursales.map(s => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1 shadow-sm">
          <Clock size={14} className="text-muted-foreground" />
          <div className="flex items-center gap-2 text-xs">
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-muted-foreground outline-none"
            />
            <span className="text-muted-foreground">—</span>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-muted-foreground outline-none"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="secondary" size="sm" className="h-8 rounded-md text-[10px] font-bold uppercase tracking-wider px-4">Vista general</Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-md text-[10px] font-bold uppercase tracking-wider px-4 text-muted-foreground" onClick={() => navigate('/admin/reportes')}>Analíticas</Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-md text-[10px] font-bold uppercase tracking-wider px-4 text-muted-foreground" onClick={() => navigate('/admin/reportes')}>Reportes</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats?.kpis.map((kpi, i) => {
          const Icon = iconMap[kpi.icon] || ChartLineUp;
          return (
            <Card key={i} className="border shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {kpi.title}
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <Icon size={16} className={kpi.color} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight mb-1">
                  {kpi.title.includes('Ventas') || kpi.title.includes('Utilidad') || kpi.title.includes('Ticket') 
                    ? formatMoney(kpi.val) 
                    : kpi.val.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center text-[10px] font-bold ${kpi.isUp ? "text-green-600" : "text-destructive"}`}>
                    {kpi.isUp ? <TrendUp weight="bold" className="mr-1" /> : <TrendDown weight="bold" className="mr-1" />}
                    {Math.abs(parseFloat(kpi.trend))}%
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">desde el último mes</span>
                </div>
                
                {/* Sparkline simulation */}
                <div className="h-10 mt-4 overflow-hidden -mx-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.salesHistory.slice(-7)}>
                            <Area 
                                type="monotone" 
                                dataKey="total" 
                                stroke={kpi.isUp ? "#10b981" : "hsl(var(--destructive))"} 
                                strokeWidth={2} 
                                fillOpacity={0.1} 
                                fill={kpi.isUp ? "#10b981" : "hsl(var(--destructive))"} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Rendimiento de Ventas</CardTitle>
              <CardDescription className="text-xs">Visualización de ingresos mensuales comparativos.</CardDescription>
            </div>
            <Select defaultValue="6m">
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 meses</SelectItem>
                <SelectItem value="6m">6 meses</SelectItem>
                <SelectItem value="12m">1 año</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-[350px] pt-4 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.salesHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                   dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fill="url(#colorPrimary)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3 border shadow-none overflow-hidden flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Actividad Reciente</CardTitle>
                <CardDescription className="text-xs">Línea de tiempo de acciones en la sucursal.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={fetchStats}>
                <ArrowsClockwise size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin">
            {!stats?.timeline || stats.timeline.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                  <Clock size={40} weight="thin" />
                  <p className="text-[10px] mt-4 uppercase tracking-[0.2em] font-black">Sin actividad reciente</p>
               </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/50">
                {stats.timeline.map((item, i) => {
                  const isLast = i === stats.timeline.length - 1;
                  return (
                    <div key={item.id} className="relative pl-10 group">
                      {/* Timeline Node */}
                      <div className={`absolute left-0 top-1 h-9 w-9 rounded-full border-4 border-background flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110 ${
                        item.type === 'venta' ? 'bg-emerald-500 text-white' :
                        item.type === 'anulacion' ? 'bg-rose-500 text-white' :
                        item.type === 'compra' ? 'bg-blue-500 text-white' :
                        'bg-slate-500 text-white'
                      }`}>
                        {item.icon === 'receipt' && <Receipt size={16} weight="bold" />}
                        {item.icon === 'x-circle' && <XCircle size={16} weight="bold" />}
                        {item.icon === 'package' && <Package size={16} weight="bold" />}
                        {item.icon === 'arrows-left-right' && <ArrowsLeftRight size={16} weight="bold" />}
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground leading-none">{item.title}</h4>
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase">
                            {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        {item.amount && (
                          <div className="mt-1">
                             <Badge variant="secondary" className="text-[10px] font-black tracking-tight px-1.5 py-0 h-4 bg-muted/50 border-none">
                                {formatMoney(item.amount)}
                             </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <div className="p-4 border-t bg-muted/5 mt-auto">
            <Button variant="ghost" className="w-full h-8 text-[10px] font-black uppercase tracking-widest gap-2 group" onClick={() => navigate('/admin/reportes')}>
              Ver historial completo <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </div>

      <Card className="border shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-transparent">
          <div>
            <CardTitle className="text-lg font-bold">Pagos y Facturación</CardTitle>
            <CardDescription className="text-xs">Últimos movimientos registrados en el sistema.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/ventas')} className="text-xs font-bold text-primary">
              Ver historial
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-transparent">
              <TableRow>
                <TableHead className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Folio de Venta</TableHead>
                <TableHead className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Estado de Transacción</TableHead>
                <TableHead className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Método de Pago</TableHead>
                <TableHead className="px-6 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-right">Monto Total</TableHead>
                <TableHead className="px-6 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="p-10 text-center text-xs text-muted-foreground italic">
                      Sin movimientos recientes registrados
                    </TableCell>
                  </TableRow>
              ) : (
                  stats?.recentSales.map((sale, i) => (
                  <TableRow key={i} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary/20" />
                          <span className="font-mono text-xs font-semibold">{sale.id}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest ${sale.status === 'Pagado' ? 'text-green-600 border-green-600/20 bg-green-600/5' : 'text-orange-600 border-orange-600/20 bg-orange-600/5'}`}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-muted-foreground font-medium">
                        {i % 2 === 0 ? "Efectivo" : "Tarjeta / Transferencia"}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-base tracking-tight">{formatMoney(sale.amount)}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight size={16} />
                        </Button>
                      </TableCell>
                  </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] pt-10">Licora</p>
    </div>
  );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="h-10 w-48 bg-muted rounded-lg"></div>
                <div className="h-10 w-64 bg-muted rounded-lg"></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-2xl"></div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-6">
                <div className="col-span-4 h-[400px] bg-muted rounded-2xl"></div>
                <div className="col-span-3 space-y-6">
                    <div className="h-44 bg-muted rounded-2xl"></div>
                    <div className="h-44 bg-muted rounded-2xl"></div>
                </div>
            </div>
        </div>
    );
}

