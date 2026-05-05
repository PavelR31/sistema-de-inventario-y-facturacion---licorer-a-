import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Calendar, Eye, FileText, User, Store, CreditCard, Banknote, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';

export default function MySales() {
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
      // Filtrar por ventas del usuario actual
      const response = await api.get('/api/ventas?mine=true');
      setVentas(response.data.data || []);
    } catch (e) {
      toast.error('Error al cargar tus ventas');
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
    v.numero_factura.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 bg-background min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Mis Ventas</h1>
          <p className="text-muted-foreground text-sm font-medium">Registro de las ventas que has procesado hoy.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-2 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
          <input 
            className="flex h-10 w-full rounded-lg bg-muted/50 border-none px-10 py-2 text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary outline-none text-foreground placeholder:text-muted-foreground/50" 
            placeholder="Buscar por Ticket ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="shadow-sm border-border bg-card overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="py-4 px-6 font-black uppercase tracking-widest text-[10px]">Ticket ID</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Fecha / Hora</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Método</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Total</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px]">Estado</TableHead>
                <TableHead className="text-right px-6 font-black uppercase tracking-widest text-[10px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Cargando tus ventas...</TableCell></TableRow>
              ) : filteredVentas.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Aún no has realizado ventas hoy.</TableCell></TableRow>
              ) : (
                filteredVentas.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/30 border-border transition-colors group">
                    <TableCell className="font-mono font-black text-primary px-6 tracking-tighter">{v.numero_factura}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                        {new Date(v.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="capitalize gap-1 font-black text-[10px] tracking-widest bg-muted border-border">
                            {v.metodo_pago === 'efectivo' ? <Banknote className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                            {v.metodo_pago}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-black text-foreground">{formatMoney(v.total)}</TableCell>
                    <TableCell>
                        <Badge variant={v.estado === 'vigente' ? 'default' : 'destructive'} className="text-[9px] font-black uppercase tracking-widest">
                            {v.estado}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                        <Button variant="ghost" size="sm" className="h-8 gap-2 font-bold text-xs hover:bg-primary/10 hover:text-primary transition-all" onClick={() => openDetail(v.id)}>
                            <Eye className="h-4 w-4" /> Detalle
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
        <DialogContent className="max-w-2xl border-border bg-card shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-foreground tracking-tight">Detalle de Venta</DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Información del ticket <span className="text-primary">{selectedVenta?.numero_factura}</span>.</DialogDescription>
          </DialogHeader>
          
          {selectedVenta && (
            <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Información General</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{new Date(selectedVenta.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Store className="h-4 w-4 text-primary" />
                            <span>{selectedVenta.sucursal?.nombre}</span>
                        </div>
                    </div>
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Cliente</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <User className="h-4 w-4 text-primary" />
                            <span>{selectedVenta.cliente?.nombre || 'Venta al Mostrador'}</span>
                        </div>
                    </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="font-black uppercase tracking-widest text-[9px]">Producto</TableHead>
                                <TableHead className="text-center font-black uppercase tracking-widest text-[9px]">Cant.</TableHead>
                                <TableHead className="text-right font-black uppercase tracking-widest text-[9px]">Precio</TableHead>
                                <TableHead className="text-right font-black uppercase tracking-widest text-[9px]">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedVenta.detalles.map((d) => (
                                <TableRow key={d.id} className="border-border hover:bg-muted/20">
                                    <TableCell className="font-bold text-xs text-foreground">{d.producto?.nombre}</TableCell>
                                    <TableCell className="text-center text-xs font-black">{d.cantidad}</TableCell>
                                    <TableCell className="text-right text-xs font-medium">{formatMoney(d.precio_unitario)}</TableCell>
                                    <TableCell className="text-right text-xs font-black text-foreground">{formatMoney(d.subtotal)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                        <div className="flex justify-between items-center pt-2 border-t border-border text-xl">
                            <span className="font-black text-muted-foreground text-xs uppercase tracking-widest">TOTAL:</span>
                            <span className="font-black text-primary text-2xl tracking-tighter">{formatMoney(selectedVenta.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="flex gap-2">
                <Button variant="outline" className="gap-2 font-bold text-[10px] uppercase tracking-widest border-border bg-card hover:bg-muted" onClick={() => handlePrint(selectedVenta.id)}>
                    <Printer className="h-4 w-4" /> Reimprimir
                </Button>
                {selectedVenta?.estado === 'vigente' && (
                    <Button variant="destructive" className="gap-2 font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsAnularOpen(true)}>
                        <Trash2 className="h-4 w-4" /> Anular
                    </Button>
                )}
            </div>
            <Button variant="secondary" className="font-bold text-[10px] uppercase tracking-widest" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isAnularOpen} onOpenChange={setIsAnularOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-card shadow-2xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="h-6 w-6" weight="fill" />
                <DialogTitle className="text-xl font-black tracking-tight">Anular Venta</DialogTitle>
            </div>
            <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">
              Se restaurará el stock y se anulará el ticket permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 ml-1">Motivo de Anulación</label>
                <textarea 
                    className="w-full min-h-[100px] p-3 rounded-xl border border-border bg-muted/50 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-muted-foreground/30"
                    placeholder="Describe por qué se anula esta venta..."
                    value={motivoAnulacion}
                    onChange={(e) => setMotivoAnulacion(e.target.value)}
                />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground" onClick={() => setIsAnularOpen(false)} disabled={isAnulando}>Cancelar</Button>
            <Button 
                variant="destructive" 
                onClick={handleAnularVenta} 
                disabled={isAnulando || !motivoAnulacion.trim()}
                className="gap-2 font-black text-[10px] uppercase tracking-[0.15em] shadow-lg shadow-destructive/20"
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
