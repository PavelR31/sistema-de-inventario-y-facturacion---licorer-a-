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

export default function SucursalesList() {
  const [sucursales, setSucursales] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', direccion: '', telefono: '' });
  const [editingSucursal, setEditingSucursal] = useState(null);
  const tenant = useAuthStore((state) => state.tenant);

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
    try {
      await api.post('/api/sucursales', formData);
      toast.success('Sucursal creada con éxito');
      setIsDialogOpen(false);
      fetchSucursales();
      setFormData({ nombre: '', direccion: '', telefono: '' });
    } catch (error) {
      toast.error('Error al crear la sucursal');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/sucursales/${editingSucursal.id}`, editingSucursal);
      toast.success('Sucursal actualizada');
      setIsEditOpen(false);
      fetchSucursales();
    } catch (error) {
      toast.error('Error al actualizar la sucursal');
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
          <Can permission="crear.sucursal">
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
            </Button>
          </Can>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
          ))
        ) : sucursales.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200">
             <Store className="mx-auto h-12 w-12 text-slate-300 mb-4" />
             <p className="text-slate-500 font-medium">No has registrado ninguna sucursal todavía.</p>
          </div>
        ) : (
          sucursales.map((sucursal) => (
            <Card key={sucursal.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-white">
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-colors">
                    <Store size={20} />
                  </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Can permission="editar.sucursal">
                        <Button 
                          variant="ghost" size="icon-sm" className="h-8 w-8 text-slate-400 hover:text-black hover:bg-slate-100"
                          onClick={() => openEdit(sucursal)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Can>
                      <Can permission="eliminar.sucursal">
                        <Button 
                          variant="ghost" size="icon-sm" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(sucursal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Can>
                    </div>
                </div>
                <CardTitle className="text-lg font-bold mt-4 leading-none text-slate-800 group-hover:text-primary transition-colors">
                  {sucursal.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="truncate">{sucursal.direccion}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone size={16} className="text-slate-400" />
                    <span>{sucursal.telefono || 'Sin teléfono'}</span>
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1 text-[11px] h-8 font-bold uppercase tracking-wider bg-slate-50 hover:bg-primary/10 hover:text-primary border-none shadow-none">Inventario</Button>
                  <Button variant="outline" className="flex-1 text-[11px] h-8 font-bold uppercase tracking-wider border-slate-100 hover:bg-slate-50">Caja</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <DataPagination meta={meta} onPageChange={fetchSucursales} />

      {/* Dialog: Nueva Sucursal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Nueva Sucursal</DialogTitle>
            <DialogDescription className="text-slate-500">Registra un nuevo punto de venta para tu negocio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre de la Sucursal</label>
              <Input 
                placeholder="Ej. Sucursal Centro" 
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required 
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Dirección Completa</label>
              <Input 
                placeholder="Calle, Número, Colonia..." 
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                required 
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Teléfono de Contacto</label>
              <Input 
                placeholder="555-0000" 
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm">
                Guardar Sucursal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Edición */}
      {/* Dialog: Editar Sucursal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Editar Sucursal</DialogTitle>
            <DialogDescription className="text-slate-500">Actualiza la información de este punto de venta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre de la Sucursal</label>
              <Input 
                value={editingSucursal?.nombre || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, nombre: e.target.value})}
                required 
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Dirección Completa</label>
              <Input 
                value={editingSucursal?.direccion || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, direccion: e.target.value})}
                required 
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Teléfono de Contacto</label>
              <Input 
                value={editingSucursal?.telefono || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, telefono: e.target.value})}
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm">
                Actualizar Sucursal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
