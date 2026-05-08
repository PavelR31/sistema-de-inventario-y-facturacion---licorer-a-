import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { ClockCounterClockwise, Package } from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';
import { format } from 'date-fns';

export default function AjustesStock() {
  const [ajustes, setAjustes] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // Create state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  
  const [formData, setFormData] = useState({
    producto_id: '',
    presentacion_id: '',
    tipo: 'entrada',
    cantidad: 1,
    motivo: '',
  });

  const fetchAjustes = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/ajustes-inventarios', { params: { page } });
      setAjustes(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
      }
    } catch (error) {
      toast.error('Error al cargar historial de ajustes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductos = async (search = '') => {
    try {
      const response = await api.get('/api/productos', { params: { search, per_page: 20 } });
      setProductos(response.data.data ?? response.data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  useEffect(() => {
    fetchAjustes();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      fetchProductos(searchProduct);
    }
  }, [searchProduct, isDialogOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Clean nullable presentacion_id
      const payload = { ...formData };
      if (payload.presentacion_id === 'null' || !payload.presentacion_id) {
        delete payload.presentacion_id;
      }
      
      await api.post('/api/ajustes-inventarios', payload);
      toast.success(`Ajuste de ${formData.tipo} registrado con éxito`);
      setIsDialogOpen(false);
      
      // Reset form
      setFormData({
        producto_id: '',
        presentacion_id: '',
        tipo: 'entrada',
        cantidad: 1,
        motivo: '',
      });
      setSearchProduct('');
      fetchAjustes();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al procesar el ajuste de inventario';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTipoBadge = (tipo) => {
    if (tipo === 'entrada') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-600/10 px-2 py-1 rounded border border-green-600/20 uppercase dark:text-green-400">
          <ArrowUpRight size={12} /> Entrada
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20 uppercase">
        <ArrowDownRight size={12} /> Salida
      </span>
    );
  };

  const selectedProduct = productos.find(p => p.id.toString() === formData.producto_id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Ajustes de Inventario"
        subtitle="Registra entradas o salidas manuales de stock por mermas, productos vencidos, etc."
        icon={ClockCounterClockwise}
        viewMode="table"
        onViewModeChange={() => {}}
        action={
          <Can permission="ajustar.stock">
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Ajuste
            </Button>
          </Can>
        }
      />

      <Card className="border shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold text-foreground/80 py-4 px-6">Fecha y Hora</TableHead>
                <TableHead className="font-semibold text-foreground/80">Tipo</TableHead>
                <TableHead className="font-semibold text-foreground/80">Producto / Empaque</TableHead>
                <TableHead className="font-semibold text-foreground/80">Cantidad</TableHead>
                <TableHead className="font-semibold text-foreground/80">Motivo</TableHead>
                <TableHead className="font-semibold text-foreground/80 text-right px-6">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><div className="h-4 w-24 bg-muted animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-6 w-16 bg-muted animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded"></div></TableCell>
                    <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded"></div></TableCell>
                    <TableCell className="px-6 flex justify-end"><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                  </TableRow>
                ))
              ) : ajustes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
                    No se encontraron registros de ajustes de stock
                  </TableCell>
                </TableRow>
              ) : (
                ajustes.map((ajuste) => (
                  <TableRow key={ajuste.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-6 text-xs text-muted-foreground font-medium">
                      {format(new Date(ajuste.created_at), 'dd MMM yyyy, hh:mm a')}
                    </TableCell>
                    <TableCell>
                      {getTipoBadge(ajuste.tipo)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                          <Package size={16} weight="bold" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground text-sm block">{ajuste.producto?.nombre}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {ajuste.presentacion ? `Formato: ${ajuste.presentacion.nombre}` : 'Unidades Sueltas'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-foreground">{ajuste.cantidad}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium text-sm">
                      {ajuste.motivo}
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end items-center gap-2 text-muted-foreground text-xs">
                         <User size={12} /> {ajuste.user?.name || 'Sistema'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {meta.last_page > 1 && (
        <div className="mt-8 flex justify-center">
          <DataPagination meta={meta} onPageChange={fetchAjustes} />
        </div>
      )}

      {/* Creat/Edit Dialog Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground tracking-tight">
              Registrar Ajuste de Stock
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modifica manualmente el inventario por mermas, vencimientos, u otras razones excepcionales.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            
            <div className="grid grid-cols-2 gap-4">
              {/* Product Selection */}
              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Buscar Producto</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input 
                      placeholder="Buscar por nombre o escanear código..."
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      className="pl-9 bg-background border-border"
                    />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Producto a Ajustar*</label>
                <Select 
                  value={formData.producto_id} 
                  onValueChange={(val) => {
                    setFormData({...formData, producto_id: val, presentacion_id: 'null'});
                  }} 
                  required
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Seleccione un producto" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-card">
                    {productos.map(p => (
                       <SelectItem key={p.id} value={p.id.toString()}>
                         {p.nombre} — {p.stock_total} en stock total
                       </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formato / Presentación */}
              <div className="space-y-2 col-span-2">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Formato afectado</label>
                 <Select 
                    value={formData.presentacion_id} 
                    onValueChange={(val) => setFormData({...formData, presentacion_id: val})} 
                    disabled={!selectedProduct}
                 >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecciona si es unidad suelta o un empaque" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">

                       {selectedProduct?.presentaciones?.map(pres => (
                          <SelectItem key={pres.id} value={pres.id.toString()}>
                             {pres.nombre} (Contiene {pres.cantidad_unidades} unid.) — {pres.stock_sucursal} empaques disp.
                          </SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Tipo de Movimiento*</label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(val) => setFormData({...formData, tipo: val})} 
                  required
                >
                  <SelectTrigger className="bg-background border-border font-bold">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="entrada" className="text-green-600 font-bold dark:text-green-400">ENTRADA (Añadir Stock)</SelectItem>
                    <SelectItem value="salida" className="text-destructive font-bold">SALIDA (Reducir Stock)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Cantidad Física (Empaques o unid.)*</label>
                 <Input 
                   type="number"
                   min="1"
                   value={formData.cantidad}
                   onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 1})}
                   required
                   className="bg-background border-border"
                 />
              </div>

              <div className="space-y-2 col-span-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Motivo de Ajuste*</label>
                <Input 
                  placeholder="Ej: Producto vencido, Merma por daño, Error de conteo..."
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  required
                  className="bg-background border-border"
                />
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-border/50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground rounded-sm hover:bg-muted" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[140px] rounded-sm font-bold" disabled={isSubmitting}>
                {isSubmitting ? 'Procesando...' : 'Aplicar Ajuste'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
