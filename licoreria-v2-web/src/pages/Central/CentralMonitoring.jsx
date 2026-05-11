import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  Heartbeat, 
  Cpu, 
  HardDrive, 
  Clock, 
  List, 
  Database, 
  ArrowsClockwise,
  CheckCircle
} from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function CentralMonitoring() {
  const [activeTab, setActiveTab] = useState("health");
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/central/health-metrics');
      setHealthData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (percent) => {
    if (percent > 85) return "text-rose-500";
    if (percent > 70) return "text-amber-500";
    return "text-emerald-500";
  };

  const getProgressColor = (percent) => {
    if (percent > 85) return "bg-rose-500";
    if (percent > 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Monitoreo del Servidor</h1>
          <p className="text-muted-foreground text-sm">Estado en tiempo real de la infraestructura (WSL/AlmaLinux)</p>
        </div>
        <Button onClick={fetchHealth} disabled={loading} variant="outline" size="sm" className="gap-2">
          <ArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} />
          Sincronizar
        </Button>
      </div>

      <Tabs defaultValue="health" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="health" className="gap-2 px-4">
            <Heartbeat size={16} />
            Salud del Servidor
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2 px-4">
            <Database size={16} />
            Almacenamiento Tenants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-6 border-none p-0 outline-none">
          {/* Main Health Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border shadow-none overflow-hidden relative">
               <div className={`absolute top-0 left-0 w-1 h-full ${getProgressColor(healthData?.system?.ram?.percent || 0)}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Memoria RAM</CardTitle>
                <Cpu size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-1">
                   <div className="text-2xl font-bold">
                    {healthData?.system?.ram?.used} / {healthData?.system?.ram?.total}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${getProgressColor(healthData?.system?.ram?.percent || 0)}`}
                        style={{ width: `${healthData?.system?.ram?.percent || 0}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${getStatusColor(healthData?.system?.ram?.percent || 0)}`}>
                      {healthData?.system?.ram?.percent}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-none overflow-hidden relative">
               <div className={`absolute top-0 left-0 w-1 h-full ${getProgressColor(healthData?.system?.cpu_load?.[0] * 10 || 0)}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Carga CPU (1m)</CardTitle>
                <Heartbeat size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData?.system?.cpu_load?.[0]?.toFixed(2) || '0.00'}</div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Promedio: {healthData?.system?.cpu_load?.map(l => l.toFixed(2)).join(' | ')}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-none overflow-hidden relative">
               <div className={`absolute top-0 left-0 w-1 h-full ${getProgressColor(healthData?.system?.disk?.percent || 0)}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Disco Principal</CardTitle>
                <HardDrive size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData?.system?.disk?.used} / {healthData?.system?.disk?.total}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${getProgressColor(healthData?.system?.disk?.percent || 0)}`}
                      style={{ width: `${healthData?.system?.disk?.percent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold">{healthData?.system?.disk?.percent}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-none overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tiempo de Actividad</CardTitle>
                <Clock size={18} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate">{healthData?.system?.uptime || 'N/A'}</div>
                <Badge variant="outline" className="mt-1 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-100">Sistema Online</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Processes */}
            <Card className="border shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Procesos TOP</CardTitle>
                    <CardDescription>Carga de recursos en tiempo real</CardDescription>
                  </div>
                  <List size={20} className="text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border-t">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="px-4 py-2 font-bold text-[10px] uppercase text-muted-foreground">PID</th>
                        <th className="px-4 py-2 font-bold text-[10px] uppercase text-muted-foreground">Comando</th>
                        <th className="px-4 py-2 font-bold text-[10px] uppercase text-muted-foreground text-right">CPU</th>
                        <th className="px-4 py-2 font-bold text-[10px] uppercase text-muted-foreground text-right">MEM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {healthData?.system?.top_processes?.map((p, i) => (
                        <tr key={i} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2 font-mono text-[11px]">{p.pid}</td>
                          <td className="px-4 py-2 font-medium truncate max-w-[150px]">{p.command}</td>
                          <td className="px-4 py-2 text-right">
                            <Badge variant="outline" className="text-[10px] font-bold text-indigo-600 border-indigo-100">
                              {p.cpu}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-right">
                             <Badge variant="outline" className="text-[10px] font-bold text-slate-600">
                              {p.mem}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Storage Chart */}
            <Card className="border shadow-none">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Uso de BD por Tenant</CardTitle>
                <CardDescription>Distribución de almacenamiento (MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={healthData?.tenants || []} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey={(d) => parseFloat(d.size)} radius={[0, 4, 4, 0]} barSize={20}>
                        {healthData?.tenants?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#4f46e5' : '#818cf8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="border-none p-0 outline-none">
          <Card className="border shadow-none">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Detalle de Almacenamiento</CardTitle>
              <CardDescription>Base de datos individual por cada cliente</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="px-6 py-3 font-bold text-[10px] uppercase text-muted-foreground">Tenant</th>
                      <th className="px-6 py-3 font-bold text-[10px] uppercase text-muted-foreground">Base de Datos</th>
                      <th className="px-6 py-3 font-bold text-[10px] uppercase text-muted-foreground text-right">Tamaño</th>
                      <th className="px-6 py-3 font-bold text-[10px] uppercase text-muted-foreground text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="bg-indigo-50/30">
                      <td className="px-6 py-4 font-bold">PLATAFORMA CENTRAL</td>
                      <td className="px-6 py-4 font-mono text-xs">{healthData?.database?.central_db_size ? 'licora_central' : '—'}</td>
                      <td className="px-6 py-4 text-right font-bold">{healthData?.database?.central_db_size}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-100">MASTER</Badge>
                      </td>
                    </tr>
                    {healthData?.tenants?.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium">{t.name}</td>
                        <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground">{t.db_name}</td>
                        <td className="px-6 py-4 text-right font-semibold">{t.size}</td>
                        <td className="px-6 py-4 text-right">
                          <CheckCircle size={16} className="text-emerald-500 inline-block" weight="fill" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] pt-10">Premium Health Monitor • Licora</p>
    </div>
  );
}
