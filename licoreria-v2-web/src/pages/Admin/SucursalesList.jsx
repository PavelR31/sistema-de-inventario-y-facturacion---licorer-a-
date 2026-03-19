import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, RefreshCcw, MapPin, Phone, Store, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mis Sucursales</h1>
          <p className="text-muted-foreground text-sm">Gestiona los puntos de venta y centros de distribución.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchSucursales}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Can permission="crear.sucursal">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva Sucursal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Sucursal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label>Nombre de la Sucursal</label>
                  <Input 
                    placeholder="Sucursal Poniente" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label>Dirección</label>
                  <Input 
                    placeholder="Av. Revolucion #50" 
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label>Teléfono</label>
                  <Input 
                    placeholder="555-1234" 
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Guardar Sucursal</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </Can>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-20 text-center text-muted-foreground">
             <RefreshCcw className="h-8 w-8 animate-spin mx-auto mb-2 opacity-20" />
             Cargando sucursales...
          </div>
        ) : sucursales.length === 0 ? (
          <div className="col-span-full py-20 text-center text-muted-foreground font-medium">
             No has registrado ninguna sucursal todavía.
          </div>
        ) : (
          sucursales.map((sucursal) => (
            <Card key={sucursal.id} className="hover:border-primary/50 transition-all shadow-sm border-slate-100 group">
              <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Can permission="editar.sucursal">
                      <Button 
                        variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => openEdit(sucursal)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </Can>
                    <Can permission="eliminar.sucursal">
                      <Button 
                        variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(sucursal.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Can>
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mt-4 leading-none">
                  {sucursal.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {sucursal.direccion}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-4 w-4 shrink-0" />
                    {sucursal.telefono}
                  </div>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="secondary" className="flex-1 text-xs h-9 font-semibold">Inventario</Button>
                  <Button variant="outline" className="flex-1 text-xs h-9 font-semibold">Caja</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <DataPagination meta={meta} onPageChange={fetchSucursales} />

      {/* Dialogo de Edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sucursal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Nombre de la Sucursal</label>
              <Input 
                value={editingSucursal?.nombre || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, nombre: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label>Dirección</label>
              <Input 
                value={editingSucursal?.direccion || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, direccion: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label>Teléfono</label>
              <Input 
                value={editingSucursal?.telefono || ''}
                onChange={(e) => setEditingSucursal({...editingSucursal, telefono: e.target.value})}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Actualizar Sucursal</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
