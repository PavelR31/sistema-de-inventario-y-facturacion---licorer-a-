import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ChartPieSlice, Money, Storefront, Package, Warning, XCircle, CashRegister,
  CalendarBlank, ArrowsClockwise, TrendDown, TrendUp, DownloadSimple,
  FilePdf,
  SpinnerGap
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

const downloadPDF = async (tipo, filename, params = {}) => {
  try {
    const response = await api.get('/api/reportes/pdf', {
      params: { ...params, tipo },
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(url, '_blank');
  } catch (error) {
    console.error('PDF error:', error);
    toast.error('Error al generar el PDF');
  }
};

const downloadExcel = async (endpoint, filename, params = {}) => {
  try {
    const response = await api.get(endpoint, {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Error al descargar el archivo Excel');
  }
};

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const today = new Date().toISOString().split('T')[0];
const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split('T')[0];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, accent = '#6366f1' }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
          <div className="rounded-xl p-2.5 flex-shrink-0" style={{ background: accent + '18' }}>
            <Icon size={22} weight="duotone" style={{ color: accent }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Filtro de Fechas ─────────────────────────────────────────────────────────
function DateFilter({ inicio, fin, onInicioChange, onFinChange, onRefresh, loading }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
        <CalendarBlank size={15} className="text-slate-400" />
        <input type="date" value={inicio} onChange={e => onInicioChange(e.target.value)}
          className="text-sm font-medium text-slate-700 bg-transparent outline-none" />
      </div>
      <span className="text-slate-400 text-xs font-medium">—</span>
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
        <CalendarBlank size={15} className="text-slate-400" />
        <input type="date" value={fin} onChange={e => onFinChange(e.target.value)}
          className="text-sm font-medium text-slate-700 bg-transparent outline-none" />
      </div>
      <Button size="sm" variant="outline" onClick={onRefresh} disabled={loading}
        className="gap-2 h-9 text-xs font-semibold border-slate-200">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowsClockwise size={14} weight="bold" />}
        Actualizar
      </Button>
    </div>
  );
}

// ─── Tab: Ventas por Período ──────────────────────────────────────────────────
function VentasPeriodoTab() {
  const { formatMoney } = useCurrency();
  const [inicio, setInicio] = useState(firstDay);
  const [fin, setFin] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/ventas', {
        params: { fecha_inicio: inicio, fecha_fin: fin }
      });
      setData(res.data);
    } catch {
      toast.error('Error al cargar ventas por período');
    } finally {
      setLoading(false);
    }
  }, [inicio, fin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totales = data?.totales;
  const porDia = (data?.por_dia || []).map(d => ({
    fecha: d.fecha?.slice(5) ?? '',
    Total: parseFloat(d.total ?? 0),
    Efectivo: parseFloat(d.efectivo ?? 0),
    Tarjeta: parseFloat(d.tarjeta ?? 0),
  }));

  const pieData = [
    { name: 'Efectivo', value: parseFloat(totales?.efectivo ?? 0) },
    { name: 'Tarjeta', value: parseFloat(totales?.tarjeta ?? 0) },
    { name: 'Transferencia', value: parseFloat(totales?.transferencia ?? 0) },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateFilter inicio={inicio} fin={fin} onInicioChange={setInicio}
          onFinChange={setFin} onRefresh={fetchData} loading={loading} />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={() => downloadPDF('ventas', `ventas_${inicio}_${fin}.pdf`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9"
            onClick={() => downloadExcel('/api/reportes/exportar/ventas', `ventas_${inicio}_${fin}.xlsx`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Total Vendido" value={formatMoney(totales?.total_ventas)} icon={Money} accent="#6366f1" />
            <StatCard title="Transacciones" value={totales?.num_ventas ?? 0} icon={CashRegister} accent="#22c55e" />
            <StatCard title="Ticket Promedio" value={formatMoney(totales?.ticket_promedio)} icon={ChartPieSlice} accent="#f59e0b" />
            <StatCard title="Efectivo" value={formatMoney(totales?.efectivo)} icon={Money} accent="#14b8a6" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 border-none shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-bold text-slate-700">Ventas Diarias</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {porDia.length === 0
                  ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos en este período</div>
                  : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={porDia} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip formatter={(v) => formatMoney(v)}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                        <Bar dataKey="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-bold text-slate-700">Método de Pago</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {pieData.length === 0
                  ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
                  : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" outerRadius={72}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false} fontSize={11}>
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatMoney(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0 pt-4 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-700">Resumen Diario</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold text-slate-400">Agrupado por día</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Fecha', 'N° Ventas', 'Efectivo', 'Tarjeta', 'Transfer.', 'Total'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {porDia.length === 0
                      ? <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Sin registros</td></tr>
                      : (data?.por_dia || []).map((d, i) => (
                        <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-700">{d.fecha}</td>
                          <td className="px-4 py-3 text-slate-500">{d.num_ventas}</td>
                          <td className="px-4 py-3 text-slate-600">{formatMoney(d.efectivo)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatMoney(d.tarjeta)}</td>
                          <td className="px-4 py-3 text-slate-600">{formatMoney(d.transferencia)}</td>
                          <td className="px-4 py-3 font-bold text-indigo-600">{formatMoney(d.total)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Nueva Sección: Detalle de Transacciones */}
          <Card className="border-none shadow-sm pb-4">
            <CardHeader className="pb-2 pt-6 px-4">
              <CardTitle className="text-base font-black text-slate-800">Detalle de Transacciones Recientes</CardTitle>
              <CardDescription className="text-xs">Últimos movimientos detectados en el período seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/50">
                    <tr className="border-b border-slate-100">
                      {['Folio', 'Fecha/Hora', 'Sucursal', 'Vendedor', 'Pago', 'Total'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.transacciones || []).length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-xs font-medium">No hay transacciones individuales para este rango</td></tr>
                    ) : (
                      data.transacciones.map((t, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-4 py-3">
                            <code className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{t.numero_factura}</code>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-[11px] font-medium">
                            {t.created_at ? new Date(t.created_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-semibold">{t.sucursal?.nombre || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 text-[11px] font-medium">{t.user?.name || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 text-slate-500 bg-white">
                              {t.metodo_pago}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-slate-900">{formatMoney(t.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab: Ventas por Sucursal ─────────────────────────────────────────────────
function VentasSucursalTab() {
  const { formatMoney } = useCurrency();
  const [inicio, setInicio] = useState(firstDay);
  const [fin, setFin] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/sucursal', {
        params: { fecha_inicio: inicio, fecha_fin: fin }
      });
      setData(res.data);
    } catch {
      toast.error('Error al cargar reporte por sucursal');
    } finally {
      setLoading(false);
    }
  }, [inicio, fin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sucursales = data?.sucursales || [];
  const chartData = sucursales.map(s => ({
    name: s.nombre,
    'Ventas': parseFloat(s.total_ventas ?? 0),
    'Ticket Prom.': parseFloat(s.ticket_promedio ?? 0),
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateFilter inicio={inicio} fin={fin} onInicioChange={setInicio}
          onFinChange={setFin} onRefresh={fetchData} loading={loading} />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={() => downloadPDF('sucursal', `ventas_sucursal_${inicio}_${fin}.pdf`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9"
            onClick={() => downloadExcel('/api/reportes/exportar/sucursal', `ventas_sucursal_${inicio}_${fin}.xlsx`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-slate-700">Comparativo por Sucursal</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {chartData.length === 0
                ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin datos</div>
                : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip formatter={(v) => formatMoney(v)}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Ventas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Ticket Prom." fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Sucursal', 'N° Ventas', 'Ticket Promedio', 'Total Ventas'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sucursales.length === 0
                    ? <tr><td colSpan={4} className="text-center py-10 text-slate-400 text-sm">Sin sucursales con ventas en este período</td></tr>
                    : sucursales.map((s, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="font-semibold text-slate-700">{s.nombre}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{s.num_ventas}</td>
                        <td className="px-4 py-3 text-slate-600">{formatMoney(s.ticket_promedio)}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600">{formatMoney(s.total_ventas)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab: Productos Top ───────────────────────────────────────────────────────
function ProductosTopTab() {
  const { formatMoney } = useCurrency();
  const [inicio, setInicio] = useState(firstDay);
  const [fin, setFin] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/productos-top', {
        params: { fecha_inicio: inicio, fecha_fin: fin, limite: 10 }
      });
      // El endpoint devuelve un array directamente
      setData(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [inicio, fin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = data.map(p => ({
    name: (p.nombre?.length > 20 ? p.nombre.slice(0, 20) + '…' : p.nombre) ?? '',
    Unidades: parseInt(p.total_vendido ?? 0),
  }));

  const handleDownloadPDF = () => {
    downloadPDF('top', `productos_top_${inicio}_${fin}.pdf`, { fecha_inicio: inicio, fecha_fin: fin });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateFilter inicio={inicio} fin={fin} onInicioChange={setInicio}
          onFinChange={setFin} onRefresh={fetchData} loading={loading} />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={handleDownloadPDF}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9"
            onClick={() => downloadExcel('/api/reportes/exportar/top', `productos_top_${inicio}_${fin}.xlsx`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-bold text-slate-700">Top 10 — Unidades Vendidas</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {chartData.length === 0
                ? <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Sin ventas en este período</div>
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={90} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="Unidades" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['#', 'Producto', 'SKU', 'Unidades', 'N° Ventas', 'Total Ingresos'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0
                    ? <tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Sin datos</td></tr>
                    : data.map((p, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black text-white"
                            style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{p.nombre}</td>
                        <td className="px-4 py-3">
                          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{p.sku || '—'}</code>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">{p.total_vendido}</td>
                        <td className="px-4 py-3 text-slate-500">{p.num_ventas}</td>
                        <td className="px-4 py-3 font-bold text-indigo-600">{formatMoney(p.total_monto)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab: Stock Crítico ───────────────────────────────────────────────────────
function StockCriticoTab() {
  const { formatMoney } = useCurrency();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/stock-critico');
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Error al cargar stock crítico');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadPDF = () => {
    downloadPDF('stock', `stock_critico_${today}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-sm text-slate-600 font-medium">Productos con stock ≤ mínimo configurado</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-2 h-9 text-xs border-slate-200">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowsClockwise size={14} weight="bold" />}
            Refrescar
          </Button>
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={handleDownloadPDF}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
            onClick={() => downloadExcel('/api/reportes/exportar/stock', `stock_critico_${today}.xlsx`)}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Producto', 'Categoría', 'Sucursal', 'Stock Actual', 'Stock Mín.', 'Falta', 'Precio Venta'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-emerald-600">
                          <Package size={32} weight="duotone" />
                          <p className="font-semibold text-sm">¡Inventario saludable!</p>
                          <p className="text-xs text-slate-400">Ningún producto está bajo el mínimo.</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : data.map((p, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-rose-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Warning size={14} weight="fill" className="text-rose-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-700">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.categoria || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{p.sucursal}</td>
                      <td className="px-4 py-3 font-bold text-lg text-rose-600">{p.stock_actual}</td>
                      <td className="px-4 py-3 text-slate-400 font-medium">{p.stock_minimo}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 font-bold text-[11px]">
                          -{p.diferencia}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{formatMoney(p.precio_venta)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Arqueo de Caja ──────────────────────────────────────────────────────
function ArqueoCajaTab() {
  const { formatMoney } = useCurrency();
  const [cajas, setCajas] = useState([]);
  const [selectedCaja, setSelectedCaja] = useState(null);
  const [arqueo, setArqueo] = useState(null);
  const [loadingCajas, setLoadingCajas] = useState(false);
  const [loadingArqueo, setLoadingArqueo] = useState(false);

  const fetchCajas = useCallback(async () => {
    setLoadingCajas(true);
    try {
      const res = await api.get('/api/reportes/cajas');
      setCajas(res.data?.data ?? []);
    } catch {
      toast.error('Error al cargar historial de cajas');
    } finally {
      setLoadingCajas(false);
    }
  }, []);

  useEffect(() => { fetchCajas(); }, [fetchCajas]);

  const selectCaja = async (caja) => {
    setSelectedCaja(caja);
    setLoadingArqueo(true);
    try {
      const res = await api.get(`/api/reportes/arqueo/${caja.id}`);
      setArqueo(res.data);
    } catch {
      toast.error('Error al cargar arqueo');
    } finally {
      setLoadingArqueo(false);
    }
  };

  const r = arqueo?.resumen;
  const diferencia = r?.diferencia ?? null;
  const diferenciaColor = diferencia === null ? 'text-slate-400'
    : diferencia >= 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {/* Lista de cajas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Cajas Cerradas</p>
          <Button size="sm" variant="ghost" onClick={fetchCajas} disabled={loadingCajas} className="h-7 w-7 p-0">
            {loadingCajas
              ? <Loader2 size={13} className="animate-spin" />
              : <ArrowsClockwise size={13} weight="bold" className="text-slate-400" />}
          </Button>
        </div>
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {cajas.length === 0
            ? <div className="text-center py-10 text-slate-400 text-sm">Sin cajas cerradas</div>
            : cajas.map(c => (
              <button key={c.id} onClick={() => selectCaja(c)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer
                  ${selectedCaja?.id === c.id
                    ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{c.sucursal?.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-600">{formatMoney(c.total_ventas)}</p>
                    <p className="text-[10px] text-slate-400">{c.num_transacciones} ventas</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  {c.fecha_apertura ? new Date(c.fecha_apertura).toLocaleString() : '—'}
                </p>
              </button>
            ))}
        </div>
      </div>

      {/* Detalle del arqueo */}
      <div className="md:col-span-2">
        {!selectedCaja ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-300 gap-3">
            <CashRegister size={48} weight="duotone" />
            <p className="text-sm font-medium text-slate-400">Selecciona una caja para ver su arqueo</p>
          </div>
        ) : loadingArqueo ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : arqueo && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800">Arqueo — {arqueo.caja?.sucursal?.nombre}</h3>
                <p className="text-xs text-slate-400">
                  Cajero: {arqueo.caja?.user?.name} ·{' '}
                  {arqueo.caja?.fecha_apertura ? new Date(arqueo.caja.fecha_apertura).toLocaleString() : '—'}
                </p>
              </div>
              <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px]">
                {arqueo.caja?.estado?.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Total Ventas" value={formatMoney(r?.total_ventas)} icon={Money} accent="#6366f1" />
              <StatCard title="Transacciones" value={r?.num_transacciones ?? 0} icon={CashRegister} accent="#22c55e" />
              <StatCard title="Anulaciones" value={r?.ventas_anuladas ?? 0} icon={XCircle} accent="#ef4444" />
              <StatCard title="Apertura con" value={formatMoney(r?.monto_apertura)} icon={Package} accent="#f59e0b" />
            </div>

            <Card className="border-none shadow-sm">
              <CardContent className="p-5 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Desglose del Turno</p>
                {[
                  { label: 'Ventas en Efectivo', val: r?.total_efectivo },
                  { label: 'Ventas con Tarjeta', val: r?.total_tarjeta },
                  { label: 'Transferencias', val: r?.total_transferencia },
                  { label: 'Pagos Mixtos', val: r?.total_mixto },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">{row.label}</span>
                    <span className="font-bold text-slate-700">{formatMoney(row.val)}</span>
                  </div>
                ))}

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Efectivo esperado en caja</span>
                    <span className="font-bold text-slate-700">{formatMoney(r?.efectivo_esperado)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Monto contado al cierre</span>
                    <span className="font-bold text-slate-700">
                      {r?.monto_cierre !== null ? formatMoney(r?.monto_cierre) : '—'}
                    </span>
                  </div>
                  {diferencia !== null && (
                    <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
                      <span className="font-bold text-slate-700">Diferencia</span>
                      <span className={`font-black text-base ${diferenciaColor}`}>
                        {diferencia >= 0 ? '+' : ''}{formatMoney(diferencia)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Anulaciones ─────────────────────────────────────────────────────────
function AnulacionesTab() {
  const { formatMoney } = useCurrency();
  const [inicio, setInicio] = useState(firstDay);
  const [fin, setFin] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/anulaciones', {
        params: { fecha_inicio: inicio, fecha_fin: fin }
      });
      setData(res.data);
    } catch {
      toast.error('Error al cargar anulaciones');
    } finally {
      setLoading(false);
    }
  }, [inicio, fin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ventas = data?.data || [];

  const handleDownloadPDF = () => {
    downloadPDF('anulaciones', `anulaciones_${inicio}_${fin}.pdf`, { fecha_inicio: inicio, fecha_fin: fin });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateFilter inicio={inicio} fin={fin} onInicioChange={setInicio}
          onFinChange={setFin} onRefresh={fetchData} loading={loading} />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={handleDownloadPDF}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9"
            onClick={() => downloadExcel('/api/reportes/exportar/anulaciones', `anulaciones_${inicio}_${fin}.xlsx`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Anulado" value={formatMoney(data?.total)} icon={XCircle} accent="#ef4444" />
            <StatCard title="N° Anulaciones" value={data?.count ?? 0} icon={CashRegister} accent="#f59e0b" />
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Factura', 'Fecha', 'Total', 'Sucursal', 'Cajero', 'Motivo'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ventas.length === 0
                    ? <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Sin anulaciones en este período</td></tr>
                    : ventas.map((v, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-rose-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">{v.numero_factura}</code>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-rose-500">{formatMoney(v.total)}</td>
                        <td className="px-4 py-3 text-slate-500">{v.sucursal?.nombre || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{v.user?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                          {v.ventas_anuladas?.[0]?.motivo || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab: Inventario Maestro ──────────────────────────────────────────────────
function InventarioMaestroTab() {
  const { formatMoney } = useCurrency();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/inventario-maestro');
      setData(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Error al cargar inventario maestro');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalValorizado = data.reduce((acc, curr) => acc + parseFloat(curr.valorizacion || 0), 0);

  const handleDownloadPDF = () => {
    downloadPDF('inventario', `inventario_maestro_${today}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Valor Total Inventario (Costo)</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(totalValorizado)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-2 h-9 text-xs border-slate-200">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowsClockwise size={14} weight="bold" />}
            Actualizar
          </Button>
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={handleDownloadPDF}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-bold"
            onClick={() => downloadExcel('/api/reportes/exportar/inventario', `inventario_maestro_${today}.xlsx`)}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {['Producto', 'Categoría', 'Sucursal', 'SKU', 'Stock', 'Costo', 'Venta', 'Total (Costo)'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0
                    ? <tr><td colSpan={8} className="text-center py-12 text-slate-400">Sin datos de inventario.</td></tr>
                    : data.map((p, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-700">{p.nombre}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{p.categoria || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{p.sucursal}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs"><code>{p.sku || '—'}</code></td>
                        <td className="px-4 py-3 font-bold text-slate-700">{p.stock_actual}</td>
                        <td className="px-4 py-3 text-slate-500">{formatMoney(p.precio_compra)}</td>
                        <td className="px-4 py-3 text-slate-500 font-medium">{formatMoney(p.precio_venta)}</td>
                        <td className="px-4 py-3 font-black text-indigo-600">{formatMoney(p.valorizacion)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Ventas por Usuario ──────────────────────────────────────────────────
function VentasUsuarioTab() {
  const { formatMoney } = useCurrency();
  const [inicio, setInicio] = useState(firstDay);
  const [fin, setFin] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reportes/ventas-usuario', {
        params: { fecha_inicio: inicio, fecha_fin: fin }
      });
      setData(res.data);
    } catch {
      toast.error('Error al cargar reporte por usuario');
    } finally {
      setLoading(false);
    }
  }, [inicio, fin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const usuarios = data?.usuarios || [];

  const handleDownloadPDF = () => {
    downloadPDF('usuario', `ventas_usuarios_${inicio}_${fin}.pdf`, { fecha_inicio: inicio, fecha_fin: fin });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateFilter inicio={inicio} fin={fin} onInicioChange={setInicio}
          onFinChange={setFin} onRefresh={fetchData} loading={loading} />

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50 text-xs h-9"
            onClick={handleDownloadPDF}
          >
            <FilePdf className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-9"
            onClick={() => downloadExcel('/api/reportes/exportar/usuario', `ventas_usuarios_${inicio}_${fin}.xlsx`, { fecha_inicio: inicio, fecha_fin: fin })}
          >
            <DownloadSimple size={14} weight="bold" />
            Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-slate-700">Rendimiento por Usuario / Vendedor</CardTitle>
            <CardDescription className="text-xs text-slate-500">Ventas realizadas por cada miembro del equipo en el periodo seleccionado.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Vendedor</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">Sucursal</th>
                    <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-slate-400">Cant. Ventas</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">T. Promedio</th>
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-slate-400">Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length > 0 ? (
                    usuarios.map((u, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-700">{u.name}</td>
                        <td className="px-4 py-3 text-slate-500">{u.sucursal || '—'}</td>
                        <td className="px-4 py-3 text-center text-slate-500">{u.num_ventas}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatMoney(u.ticket_promedio)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatMoney(u.total_ventas)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-10 text-slate-400 text-sm">
                        No hay datos de vendedores para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ─── Página Principal ─────────────────────────────────────────────────────────
const TABS = [
  { value: 'ventas', label: 'Ventas por Período', icon: Money },
  { value: 'sucursal', label: 'Por Sucursal', icon: Storefront },
  { value: 'usuario', label: 'Por Usuario', icon: SpinnerGap }, // Assuming SpinnerGap is the intended icon for user sales
  { value: 'productos', label: 'Productos Top', icon: Package },
  { value: 'inventario', label: 'Inventario Maestro', icon: Package },
  { value: 'stock', label: 'Stock Crítico', icon: Warning },
  { value: 'arqueo', label: 'Arqueo de Caja', icon: CashRegister },
  { value: 'anulaciones', label: 'Anulaciones', icon: XCircle },
];

export default function Reportes() {
  const location = useLocation();
  const initialTab = location.state?.activeTab || 'ventas';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Análisis y estadísticas del negocio</p>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList className="h-auto flex flex-wrap gap-1 bg-white border border-slate-100 shadow-sm rounded-xl p-1 w-full justify-start">
          {TABS.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all text-slate-600"
            >
              <tab.icon size={13} weight="bold" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="ventas" className="mt-0"><VentasPeriodoTab /></TabsContent>
          <TabsContent value="sucursal" className="mt-0"><VentasSucursalTab /></TabsContent>
          <TabsContent value="usuario" className="mt-0"><VentasUsuarioTab /></TabsContent>
          <TabsContent value="productos" className="mt-0"><ProductosTopTab /></TabsContent>
          <TabsContent value="inventario" className="mt-0"><InventarioMaestroTab /></TabsContent>
          <TabsContent value="stock" className="mt-0"><StockCriticoTab /></TabsContent>
          <TabsContent value="arqueo" className="mt-0"><ArqueoCajaTab /></TabsContent>
          <TabsContent value="anulaciones" className="mt-0"><AnulacionesTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
