import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Truck, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ProveedoresList() {
  const [proveedores, setProveedores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    ruc: '', 
    telefono: '', 
    direccion: '' 
  });

  const fetchProveedores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/proveedores');
      setProveedores(response.data);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">Gestiona las empresas que abastecen tu inventario.</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Empresa</TableHead>
                <TableHead>RUC / ID</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando proveedores...
                  </TableCell>
                </TableRow>
              ) : proveedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay proveedores registrados.
                  </TableCell>
                </TableRow>
              ) : (
                proveedores.map((prov) => (
                  <TableRow key={prov.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary/40" />
                      {prov.nombre}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{prov.ruc || '-'}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {prov.telefono || '-'}
                        </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{prov.direccion || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(prov)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(prov.id)}>
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
            <DialogTitle>{editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>
              Completa la información del proveedor para el registro de compras.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre / Razón Social</label>
              <Input 
                placeholder="Ej. Distribuidora Central S.A."
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">RUC / Identificación</label>
                    <Input 
                        placeholder="RUC del proveedor"
                        value={formData.ruc}
                        onChange={(e) => setFormData({...formData, ruc: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input 
                        placeholder="Número de contacto"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    />
                </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <Input 
                placeholder="Dirección física o de almacén"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingProveedor ? 'Guardar Cambios' : 'Crear Proveedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
