import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, RefreshCcw, MapPin, Phone, Store, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';
import { Loader2 } from 'lucide-react';

export default function SucursalesList() {
  const [sucursales, setSucursales] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', direccion: '', telefono: '' });
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tenant = useAuthStore((state) => state.tenant);

  // Bulk Delete States
  const [selected, setSelected] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchSucursales = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/sucursales', { params: { page } });
      setSucursales(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las sucursales');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/sucursales', formData);
      toast.success('Sucursal creada con éxito');
      setIsDialogOpen(false);
      fetchSucursales();
      setFormData({ nombre: '', direccion: '', telefono: '' });
    } catch (error) {
      toast.error('Error al crear la sucursal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/api/sucursales/${editingSucursal.id}`, editingSucursal);
      toast.success('Sucursal actualizada');
      setIsEditOpen(false);
      fetchSucursales();
    } catch (error) {
      toast.error('Error al actualizar la sucursal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta sucursal?')) return;
    try {
      await api.delete(`/api/sucursales/${id}`);
      toast.success('Sucursal eliminada');
      fetchSucursales();
    } catch (error) {
      toast.error('No se pudo eliminar la sucursal');
    }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selected.length} sucursal(es)?`)) return;
    setIsBulkDeleting(true);
    try {
      const res = await api.delete('/api/sucursales/bulk', { data: { ids: selected } });
      toast.success(res.data.message);
      setSelected([]);
      fetchSucursales();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al eliminar');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const openEdit = (sucursal) => {
    setEditingSucursal({ ...sucursal });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Sucursales"
        subtitle="Gestión de puntos de venta"
        icon={Store}
        action={
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Can permission="eliminar.sucursal">
                <Button variant="destructive" className="rounded-sm gap-2" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Eliminar {selected.length}
                </Button>
              </Can>
            )}
            <Can permission="crear.sucursal">
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-sm">
                <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
              </Button>
            </Can>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse border border-border" />
          ))
        ) : sucursales.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/20 backdrop-blur-sm rounded-2xl border-2 border-dashed border-border">
             <Store className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
             <p className="text-muted-foreground font-medium">No has registrado ninguna sucursal todavía.</p>
          </div>
        ) : (
          sucursales.map((sucursal) => (
            <Card 
              key={sucursal.id} 
              onClick={() => toggleSelect(sucursal.id)}
              className={`group overflow-hidden border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-card cursor-pointer ${selected.includes(sucursal.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            >
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-colors">
                    <Store size={20} />
                  </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Can permission="editar.sucursal">
                        <Button 
                          variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm"
                          onClick={() => openEdit(sucursal)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Can>
                      <Can permission="eliminar.sucursal">
                        <Button 
                          variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                          onClick={(e) => { e.stopPropagation(); handleDelete(sucursal.id); }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </Can>
                    </div>
                </div>
                <CardTitle className="text-lg font-bold mt-4 leading-none text-foreground group-hover:text-primary transition-colors">
                  {sucursal.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin size={16} className="text-muted-foreground/60" />
                    <span className="truncate">{sucursal.direccion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={16} className="text-muted-foreground/60" />
                    <span>{sucursal.telefono || 'Sin teléfono'}</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1 text-[11px] h-8 font-bold uppercase tracking-wider bg-muted hover:bg-primary/10 hover:text-primary border-none shadow-none">Inventario</Button>
                  <Button variant="outline" className="flex-1 text-[11px] h-8 font-bold uppercase tracking-wider border-border hover:bg-muted">Caja</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <DataPagination meta={meta} onPageChange={fetchSucursales} />

      {/* Dialog: Nueva Sucursal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Nueva Sucursal</DialogTitle>
            <DialogDescription className="text-muted-foreground">Registra un nuevo punto de venta para tu negocio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Nombre de la Sucursal</label>
              <Input 
                placeholder="Ej. Sucursal Centro" 
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required 
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Dirección Completa</label>
              <Input 
                placeholder="Calle, Número, Colonia..." 
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                required 
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Teléfono de Contacto</label>
              <Input 
                placeholder="555-0000" 
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="bg-background border-border"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-border gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground rounded-sm">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar Sucursal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Edición */}
      {/* Dialog: Editar Sucursal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Editar Sucursal</DialogTitle>
            <DialogDescription className="text-muted-foreground">Actualiza la información de este punto de venta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Nombre de la Sucursal</label>
              <Input 
                value={editingSucursal?.nombre || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, nombre: e.target.value})}
                required 
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Dirección Completa</label>
              <Input 
                value={editingSucursal?.direccion || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, direccion: e.target.value})}
                required 
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Teléfono de Contacto</label>
              <Input 
                value={editingSucursal?.telefono || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, telefono: e.target.value})}
                className="bg-background border-border"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-border gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-muted-foreground">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : 'Actualizar Sucursal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
