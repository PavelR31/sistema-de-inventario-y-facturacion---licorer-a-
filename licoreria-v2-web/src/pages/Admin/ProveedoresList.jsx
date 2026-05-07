import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Truck, Phone, FileText, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';

export default function ProveedoresList() {
  const [proveedores, setProveedores] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    telefono: '',
    direccion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProveedores = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/proveedores', { params: { page } });
      setProveedores(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
      }
    } catch (error) {
      toast.error('Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingProveedor) {
        await api.put(`/api/proveedores/${editingProveedor.id}`, formData);
        toast.success('Proveedor actualizado');
      } else {
        await api.post('/api/proveedores', formData);
        toast.success('Proveedor creado');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProveedores();
    } catch (error) {
      toast.error('Error al guardar el proveedor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', ruc: '', telefono: '', direccion: '' });
    setEditingProveedor(null);
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await api.delete(`/api/proveedores/${id}`);
      toast.success('Proveedor eliminado');
      fetchProveedores();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el proveedor');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <PageHeader 
        title="Socios Comerciales"
        subtitle="Gestión de proveedores"
        icon={Truck}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-sm border-border text-muted-foreground bg-card hover:bg-muted"
              onClick={() => fetchProveedores()}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Can permission="crear.proveedor">
              <Button
                className="rounded-sm shadow-sm"
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
              >
                <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
              </Button>
            </Can>
          </div>
        }
      />

      <Card className="border shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="py-4 px-6 font-bold text-[10px] uppercase tracking-widest text-foreground/70">Entidad</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70">RUC</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70">Contacto</TableHead>
              <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70">Ubicación</TableHead>
              <TableHead className="text-right px-6 font-bold text-[10px] uppercase tracking-widest text-foreground/70">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/40">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-80 text-center">
                  <RefreshCcw className="h-12 w-12 animate-spin mx-auto mb-4 text-muted" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Sincronizando Proveedores...</p>
                </TableCell>
              </TableRow>
            ) : proveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-80 text-center">
                  <div className="h-20 w-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-40">
                    <Truck size={40} className="text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">No se encontraron registros activos</p>
                </TableCell>
              </TableRow>
            ) : (
              proveedores.map((prov) => (
                <TableRow key={prov.id} className="hover:bg-muted/30 transition-colors group">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20 transition-colors">
                        <Truck size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm tracking-tight">{prov.nombre}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">ID: {prov.id.toString().padStart(3, '0')}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-muted-foreground">{prov.ruc || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                      <span className="text-[10px] font-black text-foreground/70 uppercase tracking-widest">{prov.telefono || 'SIN CONTACTO'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    {prov.direccion || 'DIRECCIÓN NO DISPONIBLE'}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Can permission="editar.proveedor">
                        <Button
                          variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => handleEdit(prov)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="eliminar.proveedor">
                        <Button
                          variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(prov.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </CardContent>
      </Card>

      {/* Modal de Registro/Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingProveedor ? 'Modificar Registro' : 'Nuevo Socio'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ficha maestra de proveedor del negocio
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Razón Social</label>
              <Input
                placeholder="Ej. DISTRIBUIDORA CENTRAL S.A."
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="h-10 rounded-sm border-border bg-background"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">RUC / ID TRIBUTARIO</label>
                <Input
                  placeholder="000-000-000"
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  className="h-10 rounded-sm border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Teléfono Directo</label>
                <Input
                  placeholder="555-0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="h-10 rounded-sm border-border bg-background"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Dirección Operativa</label>
              <Input
                placeholder="Calle comercial #123"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="h-10 rounded-sm border-border bg-background"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-border/50 gap-2">
              <Button type="button" variant="ghost" className="text-muted-foreground hover:bg-muted" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm font-bold shadow-sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    {editingProveedor ? 'Actualizando...' : 'Guardando...'}
                  </>
                ) : (
                  editingProveedor ? 'Actualizar Ficha' : 'Vincular Socio'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
