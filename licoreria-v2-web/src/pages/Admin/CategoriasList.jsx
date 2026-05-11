import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, Plus, PencilLine, Trash, ArrowsClockwise } from "@phosphor-icons/react";
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';

export default function CategoriasList() {
  const [categorias, setCategorias] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selected, setSelected] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchCategorias = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/categorias', { params: { page } });
      setCategorias(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
      }
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === categorias.length ? [] : categorias.map(c => c.id));

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selected.length} categoría(s)?`)) return;
    setIsBulkDeleting(true);
    try {
      const res = await api.delete('/api/categorias/bulk', { data: { ids: selected } });
      toast.success(res.data.message);
      setSelected([]);
      fetchCategorias();
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
      if (editingCategoria) {
        await api.put(`/api/categorias/${editingCategoria.id}`, formData);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/api/categorias', formData);
        toast.success('Categoría creada');
      }
      setIsDialogOpen(false);
      setFormData({ nombre: '', descripcion: '' });
      setEditingCategoria(null);
      fetchCategorias();
    } catch (error) {
      toast.error('Error al guardar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (categoria) => {
    setEditingCategoria(categoria);
    setFormData({ nombre: categoria.nombre, descripcion: categoria.descripcion || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await api.delete(`/api/categorias/${id}`);
      toast.success('Categoría eliminada');
      fetchCategorias();
    } catch (error) {
      toast.error('No se pudo eliminar la categoría');
    }
  };

  const allSelected = categorias.length > 0 && selected.length === categorias.length;
  const someSelected = selected.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader
        title="Categorías"
        subtitle="Organiza los productos de tu inventario por grupos."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        action={
          <div className="flex gap-2">
            {someSelected && (
              <Can permission="eliminar.categoria">
                <Button variant="destructive" className="rounded-sm gap-2" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Eliminar {selected.length}
                </Button>
              </Can>
            )}
            <Can permission="crear.categoria">
              <Button onClick={() => { setEditingCategoria(null); setFormData({ nombre: '', descripcion: '' }); setIsDialogOpen(true); }} className="gap-2 shadow-sm">
                <Plus weight="bold" className="h-4 w-4" /> Nueva Categoría
              </Button>
            </Can>
          </div>
        }
      />

      {viewMode === 'table' ? (
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-10 px-4">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Seleccionar todo" />
                  </TableHead>
                  <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Nombre</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Descripción</TableHead>
                  <TableHead className="text-right px-6 font-bold text-[10px] uppercase tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-4"><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell className="px-6 py-4"><div className="h-4 w-40 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell><div className="h-4 w-60 bg-muted animate-pulse rounded" /></TableCell>
                      <TableCell className="text-right px-6"><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs italic">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map((cat) => (
                    <TableRow key={cat.id} className={`hover:bg-muted/30 transition-colors group ${selected.includes(cat.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell className="px-4">
                        <Checkbox checked={selected.includes(cat.id)} onCheckedChange={() => toggleSelect(cat.id)} />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                            <Tag size={16} weight="bold" />
                          </div>
                          <span className="font-semibold text-foreground">{cat.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">{cat.descripcion || '-'}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Can permission="editar.categoria">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <PencilLine size={16} />
                            </Button>
                          </Can>
                          <Can permission="eliminar.categoria">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash size={16} />
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
            [...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl border animate-pulse shadow-sm" />
            ))
          ) : categorias.map(cat => (
            <Card
              key={cat.id}
              onClick={() => toggleSelect(cat.id)}
              className={`border shadow-sm group hover:shadow-md transition-all cursor-pointer ${selected.includes(cat.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            >
              <div className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-9 w-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                  <Tag size={20} weight="bold" />
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Can permission="editar.categoria">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)} className="h-7 w-7">
                      <PencilLine size={14} />
                    </Button>
                  </Can>
                  <Can permission="eliminar.categoria">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)} className="h-7 w-7 text-destructive">
                      <Trash size={14} />
                    </Button>
                  </Can>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <h3 className="font-bold text-base truncate">{cat.nombre}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[32px] font-medium leading-relaxed">
                  {cat.descripcion || 'Sin descripción'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8">
          <DataPagination meta={meta} onPageChange={fetchCategorias} />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>Ingresa el nombre y una descripción opcional para la categoría.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de la Categoría</label>
              <Input placeholder="Ej. Cervezas, Tequilas, Snacks" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (Opcional)</label>
              <Input placeholder="Breve descripción de la categoría" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} />
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? <><ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />{editingCategoria ? 'Actualizando...' : 'Creando...'}</> : (editingCategoria ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
