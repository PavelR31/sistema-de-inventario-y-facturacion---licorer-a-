import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Download, Calendar, Eye, FileText, User, Store, CreditCard, Banknote, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

export default function SalesHistory() {
  const { formatMoney } = useCurrency();
  const [ventas, setVentas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Detalle Modal
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Anular Modal
  const [isAnularOpen, setIsAnularOpen] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [isAnulando, setIsAnulando] = useState(false);

  const fetchVentas = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/ventas');
      // La API retorna paginado: response.data.data
      setVentas(response.data.data || []);
    } catch (e) {
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
  }, []);

  const openDetail = async (id) => {
    try {
        const response = await api.get(`/api/ventas/${id}`);
        setSelectedVenta(response.data);
        setIsDetailOpen(true);
    } catch (error) {
        toast.error('No se pudo cargar el detalle de la venta');
    }
  };

  const handleAnularVenta = async () => {
    if (!motivoAnulacion.trim()) {
        return toast.error('Debes ingresar un motivo de anulación');
    }

    setIsAnulando(true);
    try {
        await api.post(`/api/ventas/${selectedVenta.id}/anular`, {
            motivo: motivoAnulacion
        });
        toast.success('Venta anulada correctamente');
        setIsAnularOpen(false);
        setIsDetailOpen(false);
        setMotivoAnulacion('');
        fetchVentas();
    } catch (error) {
        toast.error(error.response?.data?.message || 'Error al anular la venta');
    } finally {
        setIsAnulando(false);
    }
  };

  const handlePrint = (ventaId) => {
    const hostname = window.location.hostname;
    const printUrl = `http://${hostname}:8000/api/ventas/${ventaId}/print`;
    window.open(printUrl, '_blank');
  };

  const filteredVentas = ventas.filter(v => 
    v.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.sucursal?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Historial de Ventas</h1>
          <p className="text-muted-foreground text-sm">Consulta y gestiona todos los tickets emitidos.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exportar Reporte
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            className="flex h-10 w-full rounded-lg bg-slate-50 border-none px-9 py-2 text-sm focus-visible:ring-1 focus-visible:ring-primary outline-none" 
            placeholder="Buscar por Ticket ID o Sucursal..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2"><Calendar className="h-4 w-4" /> Filtrar Fecha</Button>
      </div>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4 px-6">Ticket ID</TableHead>
                <TableHead>Fecha / Hora</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">Cargando ventas...</TableCell></TableRow>
              ) : filteredVentas.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20 text-muted-foreground">No hay ventas registradas.</TableCell></TableRow>
              ) : (
                filteredVentas.map((v) => (
                    <TableRow key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-mono font-bold text-primary px-6">{v.numero_factura}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm font-medium">{v.sucursal?.nombre}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="capitalize gap-1 font-bold">
                            {v.metodo_pago === 'efectivo' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                            {v.metodo_pago}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-black text-slate-900">{formatMoney(v.total)}</TableCell>
                    <TableCell>
                        <Badge variant={v.estado === 'vigente' ? 'default' : 'destructive'} className="text-[10px] uppercase">
                            {v.estado}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                        <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => openDetail(v.id)}>
                            <Eye className="h-4 w-4" /> Ver Detalle
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Detalle de Venta</DialogTitle>
            <DialogDescription>Información completa del ticket {selectedVenta?.numero_factura}.</DialogDescription>
          </DialogHeader>
          
          {selectedVenta && (
            <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información General</p>
                        <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-medium">{new Date(selectedVenta.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Store className="h-4 w-4 text-primary" />
                            <span className="font-medium">{selectedVenta.sucursal?.nombre}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cajero / Cliente</p>
                        <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-medium">{selectedVenta.user?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium">{selectedVenta.cliente?.nombre || 'Venta al Mostrador'}</span>
                        </div>
                    </div>
                </div>

                <div className="border rounded-xl overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-center">Cant.</TableHead>
                                <TableHead className="text-right">Precio</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedVenta.detalles.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell className="font-medium">{d.producto?.nombre}</TableCell>
                                    <TableCell className="text-center">{d.cantidad}</TableCell>
                                    <TableCell className="text-right">{formatMoney(d.precio_unitario)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatMoney(d.subtotal)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Monto Recibido:</span>
                            <span className="font-medium">{formatMoney(selectedVenta.monto_pagado)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Cambio:</span>
                            <span className="font-medium">{formatMoney(selectedVenta.cambio)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t text-xl">
                            <span className="font-black text-slate-900">TOTAL:</span>
                            <span className="font-black text-primary">{formatMoney(selectedVenta.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={() => handlePrint(selectedVenta.id)}>
                    <FileText className="h-4 w-4" /> Reimprimir
                </Button>
                {selectedVenta?.estado === 'vigente' && (
                    <Button variant="destructive" className="gap-2" onClick={() => setIsAnularOpen(true)}>
                        <Trash2 className="h-4 w-4" /> Anular Venta
                    </Button>
                )}
            </div>
            <Button onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isAnularOpen} onOpenChange={setIsAnularOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-6 w-6" />
                <DialogTitle className="text-xl font-bold">Anular Venta</DialogTitle>
            </div>
            <DialogDescription>
              Esta acción es irreversible. Se restaurará el stock de los productos y se marcará el ticket como anulado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 uppercase">Motivo de Anulación</label>
                <textarea 
                    className="w-full min-h-[100px] p-3 rounded-lg border bg-slate-50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="Ej. Error en el cobro, Devolución de producto..."
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsAnularOpen(false)} disabled={isAnulando}>Cancelar</Button>
            <Button 
                variant="destructive" 
                onClick={handleAnularVenta} 
                disabled={isAnulando || !motivoAnulacion.trim()}
                className="gap-2"
            >
                {isAnulando ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                Confirmar Anulación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
