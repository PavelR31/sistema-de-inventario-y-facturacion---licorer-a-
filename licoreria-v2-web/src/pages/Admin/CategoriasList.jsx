import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function CategoriasList() {
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

  const fetchCategorias = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/categorias');
      setCategorias(response.data);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">Organiza tus productos por tipo o familia.</p>
        </div>
        <Button onClick={() => {
          setEditingCategoria(null);
          setFormData({ nombre: '', descripcion: '' });
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Cargando categorías...
                  </TableCell>
                </TableRow>
              ) : categorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No hay categorías registradas.
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary/40" />
                      {cat.nombre}
                    </TableCell>
                    <TableCell>{cat.descripcion || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
            <DialogDescription>
              Ingresa el nombre y una descripción opcional para la categoría.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de la Categoría</label>
              <Input 
                placeholder="Ej. Cervezas, Tequilas, Snacks"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (Opcional)</label>
              <Input 
                placeholder="Breve descripción de la categoría"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCategoria ? 'Guardar Cambios' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
