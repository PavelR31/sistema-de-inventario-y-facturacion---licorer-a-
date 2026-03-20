import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
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

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Categorías de Productos"
        subtitle="Organiza tu inventario"
        icon={Tag}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        action={
          <Can permission="crear.categoria">
            <Button onClick={() => {
              setEditingCategoria(null);
              setFormData({ nombre: '', descripcion: '' });
              setIsDialogOpen(true);
            }} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
            </Button>
          </Can>
        }
      />

      {viewMode === 'table' ? (
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-800 py-4 px-6 w-[300px]">Nombre</TableHead>
                  <TableHead className="font-semibold text-slate-800">Descripción</TableHead>
                  <TableHead className="font-semibold text-slate-800 text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><div className="h-4 w-40 bg-slate-100 animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-60 bg-slate-100 animate-pulse rounded"></div></TableCell>
                      <TableCell className="text-right px-6"><div className="h-8 w-20 bg-slate-100 animate-pulse rounded ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-slate-400 font-medium">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                            <Tag size={16} weight="bold" />
                          </div>
                          <span className="font-medium text-slate-700">{cat.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">{cat.descripcion || '-'}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Can permission="editar.categoria">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(cat)} className="text-slate-400 hover:text-black hover:bg-slate-100">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.categoria">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(cat.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4 text-destructive" />
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
              <div key={i} className="h-32 bg-white rounded-sm border border-slate-100 animate-pulse"></div>
            ))
          ) : categorias.map(cat => (
            <Card key={cat.id} className="border-none transition-all bg-white group p-5">
              <div className="flex items-start justify-between mb-3">
                 <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                    <Tag size={20} weight="bold" />
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Can permission="editar.categoria">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(cat)} className="h-8 w-8 text-slate-400 hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Can>
                    <Can permission="eliminar.categoria">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(cat.id)} className="h-8 w-8 text-slate-400 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Can>
                 </div>
              </div>
              <h3 className="font-semibold text-slate-800 truncate">{cat.nombre}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                {cat.descripcion || 'Sin descripción'}
              </p>
            </Card>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8 flex justify-center">
          <DataPagination meta={meta} onPageChange={fetchCategorias} />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Ingresa el nombre y una descripción opcional para la categoría.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre de la Categoría</label>
              <Input 
                placeholder="Ej. Cervezas, Tequilas, Snacks"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Descripción (Opcional)</label>
              <Input 
                placeholder="Breve descripción de la categoría"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm">
                {editingCategoria ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
