import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag, Ruler } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';

export default function MedidasList() {
  const [medidas, setMedidas] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedida, setEditingMedida] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({ nombre: '', abreviatura: '' });

  const fetchMedidas = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/medidas', { params: { page } });
      setMedidas(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
      }
    } catch (error) {
      toast.error('Error al cargar medidas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedidas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMedida) {
        await api.put(`/api/medidas/${editingMedida.id}`, formData);
        toast.success('Medida actualizada');
      } else {
        await api.post('/api/medidas', formData);
        toast.success('Medida creada');
      }
      setIsDialogOpen(false);
      setFormData({ nombre: '', abreviatura: '' });
      setEditingMedida(null);
      fetchMedidas();
    } catch (error) {
      toast.error('Error al guardar la medida');
    }
  };

  const handleEdit = (medida) => {
    setEditingMedida(medida);
    setFormData({ nombre: medida.nombre, abreviatura: medida.abreviatura || '' });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta medida?')) return;
    try {
      await api.delete(`/api/medidas/${id}`);
      toast.success('Medida eliminada');
      fetchMedidas();
    } catch (error) {
      toast.error('No se pudo eliminar la medida porque está en uso.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Medidas de Productos"
        subtitle="Control de litrajes y onzas"
        icon={Ruler}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        action={
          <Can permission="crear.producto">
            <Button onClick={() => {
              setEditingMedida(null);
              setFormData({ nombre: '', abreviatura: '' });
              setIsDialogOpen(true);
            }} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> Nueva Medida
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
                  <TableHead className="font-semibold text-slate-800">Abreviatura</TableHead>
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
                ) : medidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-slate-400 font-medium">
                      No se encontraron medidas
                    </TableCell>
                  </TableRow>
                ) : (
                  medidas.map((med) => (
                    <TableRow key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                            <Ruler size={16} weight="bold" />
                          </div>
                          <span className="font-medium text-slate-700">{med.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">{med.abreviatura || '-'}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Can permission="editar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(med)} className="text-slate-400 hover:text-black hover:bg-slate-100 rounded-sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(med.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm">
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
          ) : medidas.map(med => (
            <Card key={med.id} className="border-none transition-all bg-white group p-5">
              <div className="flex items-start justify-between mb-3">
                 <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                    <Ruler size={20} weight="bold" />
                 </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Can permission="editar.producto">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(med)} className="h-8 w-8 text-slate-400 hover:text-primary rounded-sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Can>
                    <Can permission="eliminar.producto">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(med.id)} className="h-8 w-8 text-slate-400 hover:text-rose-500 rounded-sm">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </Can>
                  </div>
              </div>
              <h3 className="font-semibold text-slate-800 truncate">{med.nombre}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                {med.abreviatura || '-'}
              </p>
            </Card>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8 flex justify-center">
          <DataPagination meta={meta} onPageChange={fetchMedidas} />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              {editingMedida ? 'Editar Medida' : 'Nueva Medida'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Ingresa el nombre y abreviatura de la medida (Ej. 1 Litro / 1L).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre</label>
              <Input 
                placeholder="Ej. 12 onzas"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Abreviatura (Opcional)</label>
              <Input 
                placeholder="Ej. 12 oz"
                value={formData.abreviatura}
                onChange={(e) => setFormData({...formData, abreviatura: e.target.value})}
                className="bg-slate-50/50 border-slate-200"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500 rounded-sm">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm">
                {editingMedida ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
