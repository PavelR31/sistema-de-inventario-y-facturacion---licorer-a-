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
        <Card className="border shadow-sm bg-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70 py-4 px-6 w-[300px]">Nombre</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70">Abreviatura</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-foreground/70 text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><div className="h-4 w-40 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-60 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell className="text-right px-6"><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : medidas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground font-medium">
                      No se encontraron medidas
                    </TableCell>
                  </TableRow>
                ) : (
                  medidas.map((med) => (
                    <TableRow key={med.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <Ruler size={16} weight="bold" />
                          </div>
                          <span className="font-semibold text-foreground">{med.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">{med.abreviatura || '-'}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Can permission="editar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(med)} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(med.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm">
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
            [...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-sm border animate-pulse shadow-sm"></div>
            ))
          ) : medidas.map(med => (
            <Card key={med.id} className="border shadow-sm bg-card group p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                 <div className="h-10 w-10 rounded-sm bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Ruler size={20} weight="bold" />
                 </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Can permission="editar.producto">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(med)} className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Can>
                    <Can permission="eliminar.producto">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(med.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Can>
                  </div>
              </div>
              <h3 className="font-bold text-foreground truncate">{med.nombre}</h3>
              <p className="text-[11px] font-bold text-muted-foreground mt-1 line-clamp-2 min-h-[32px] uppercase tracking-wider">
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
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingMedida ? 'Editar Medida' : 'Nueva Medida'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ingresa el nombre y abreviatura de la medida (Ej. 1 Litro / 1L).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Nombre</label>
              <Input 
                placeholder="Ej. 12 onzas"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Abreviatura (Opcional)</label>
              <Input 
                placeholder="Ej. 12 oz"
                value={formData.abreviatura}
                onChange={(e) => setFormData({...formData, abreviatura: e.target.value})}
                className="bg-background border-border"
              />
            </div>
            <DialogFooter className="pt-6 border-t border-border/50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground rounded-sm hover:bg-muted">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm font-bold shadow-sm">
                {editingMedida ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
