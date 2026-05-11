import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Package, RefreshCcw, Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';

export default function EmpaquesList() {
  const [empaques, setEmpaques] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmpaque, setEditingEmpaque] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({ nombre: '', cantidad_unidades: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchEmpaques = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/empaques', { params: { page } });
      setEmpaques(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
      }
    } catch (error) {
      toast.error('Error al cargar empaques');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEmpaques(); }, []);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === empaques.length ? [] : empaques.map(e => e.id));
  const allSelected = empaques.length > 0 && selected.length === empaques.length;

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selected.length} empaque(s)?`)) return;
    setIsBulkDeleting(true);
    try {
      const res = await api.delete('/api/empaques/bulk', { data: { ids: selected } });
      toast.success(res.data.message);
      setSelected([]);
      fetchEmpaques();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al eliminar');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingEmpaque) {
        await api.put(`/api/empaques/${editingEmpaque.id}`, formData);
        toast.success('Empaque actualizado');
      } else {
        await api.post('/api/empaques', formData);
        toast.success('Empaque creado');
      }
      setIsDialogOpen(false);
      setFormData({ nombre: '', cantidad_unidades: '' });
      setEditingEmpaque(null);
      fetchEmpaques();
    } catch (error) {
      toast.error('Error al guardar el empaque');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (empaque) => {
    setEditingEmpaque(empaque);
    setFormData({ nombre: empaque.nombre, cantidad_unidades: empaque.cantidad_unidades || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este empaque?')) return;
    try {
      await api.delete(`/api/empaques/${id}`);
      toast.success('Empaque eliminado');
      fetchEmpaques();
    } catch (error) {
      toast.error('No se pudo eliminar el empaque porque podría estar en uso.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Catálogo de Empaques"
        subtitle="Tipos de presentación (Six-pack, Caja, Unidad)"
        icon={Layers}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        action={
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Can permission="eliminar.producto">
                <Button variant="destructive" className="rounded-sm gap-2" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Eliminar {selected.length}
                </Button>
              </Can>
            )}
            <Can permission="crear.producto">
              <Button onClick={() => { setEditingEmpaque(null); setFormData({ nombre: '', cantidad_unidades: '' }); setIsDialogOpen(true); }} className="rounded-sm">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Empaque
              </Button>
            </Can>
          </div>
        }
      />

      {viewMode === 'table' ? (
        <Card className="border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 px-4">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70 py-4 px-6 w-[300px]">Nombre</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70">Unidades Totales</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70 text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4"><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell className="px-6"><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-60 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell className="text-right px-6"><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : empaques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">No se encontraron empaques</TableCell>
                  </TableRow>
                ) : (
                  empaques.map((emp) => (
                    <TableRow key={emp.id} className={`hover:bg-muted/30 transition-colors group ${selected.includes(emp.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell className="px-4">
                        <Checkbox checked={selected.includes(emp.id)} onCheckedChange={() => toggleSelect(emp.id)} />
                      </TableCell>
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <Layers size={16} />
                          </div>
                          <span className="font-semibold text-foreground">{emp.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">{emp.cantidad_unidades} unid.</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Can permission="editar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(emp)} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(emp.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm">
                              <Trash2 className="w-4 h-4" />
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            [...Array(8)].map((_, i) => <div key={i} className="h-32 bg-card rounded-sm border animate-pulse shadow-sm" />)
          ) : empaques.map(emp => (
            <Card
              key={emp.id}
              onClick={() => toggleSelect(emp.id)}
              className={`border shadow-sm bg-card group p-5 hover:shadow-md transition-all cursor-pointer ${selected.includes(emp.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Layers size={20} />
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Can permission="editar.producto">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(emp)} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-sm">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Can>
                  <Can permission="eliminar.producto">
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(emp.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Can>
                </div>
              </div>
              <h3 className="font-bold text-foreground truncate">{emp.nombre}</h3>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 line-clamp-2 min-h-[32px] uppercase tracking-wider">{emp.cantidad_unidades} Unidades Totales</p>
            </Card>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8 flex justify-center">
          <DataPagination meta={meta} onPageChange={fetchEmpaques} />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">{editingEmpaque ? 'Editar Empaque' : 'Nuevo Empaque'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Define cómo vendes o almacenas tus productos (Ej. Caja, Six-pack, etc.)</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Nombre del Empaque</label>
              <Input placeholder="Ej. Caja, Paca, Botella" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Cantidad de Unidades Mínimas</label>
              <Input type="number" min="1" placeholder="Ej. 24" value={formData.cantidad_unidades} onChange={(e) => setFormData({...formData, cantidad_unidades: e.target.value})} required className="bg-background border-border" />
            </div>
            <DialogFooter className="pt-6 border-t border-border/50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" className="min-w-[120px] rounded-sm font-bold shadow-sm" disabled={isSubmitting}>
                {isSubmitting ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" />{editingEmpaque ? 'Actualizando...' : 'Creando...'}</> : (editingEmpaque ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
