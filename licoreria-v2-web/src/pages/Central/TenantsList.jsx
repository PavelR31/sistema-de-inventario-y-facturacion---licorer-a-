import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, RefreshCcw, Trash2, Globe, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ id: '', name: '', email: '' });
  const [editingTenant, setEditingTenant] = useState(null);
  const [lastCreatedTenant, setLastCreatedTenant] = useState(null);
  const [createdPassword, setCreatedPassword] = useState('');

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/central/tenants');
      setTenants(response.data.data || response.data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las licorerías');
      // Mock data for dev
      setTenants([
        { id: 'licor1', name: 'Licorería Central', email: 'admin@licor1.com', domain: 'licor1.localhost' },
        { id: 'licor2', name: 'Licorería del Norte', email: 'admin@licor2.com', domain: 'licor2.localhost' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/central/tenants', newTenant);
      setCreatedPassword(response.data.temporary_password);
      setLastCreatedTenant({ ...newTenant });
      setIsSuccessDialogOpen(true);
      setIsDialogOpen(false);
      fetchTenants();
      setNewTenant({ id: '', name: '', email: '' });
    } catch (error) {
      console.error('Error Response:', error.response?.data);
      const message = error.response?.data?.message || 'Error al crear la licorería';
      toast.error(message);
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/central/tenants/${editingTenant.id}`, editingTenant);
      toast.success('Licorería actualizada correctamente');
      setIsEditOpen(false);
      fetchTenants();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar la licorería');
    }
  };

  const handleDeleteTenant = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este negocio? Esta acción eliminará permanentemente la base de datos asociada.')) {
      return;
    }

    try {
      await api.delete(`/api/central/tenants/${id}`);
      toast.success('Licorería eliminada con éxito');
      fetchTenants();
    } catch (error) {
      console.error(error);
      toast.error('No se pudo eliminar el negocio');
    }
  };

  const openEditDialog = (tenant) => {
    setEditingTenant({ ...tenant });
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Licorerías (Tenants)</h1>
          <p className="text-muted-foreground text-sm">Administración central de negocios y dominios registrados.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchTenants}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva Licorería
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle>Registrar Nueva Licorería</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTenant} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label>Identificador (Slug)</label>
                  <Input 
                    placeholder="ej: licor-centro" 
                    value={newTenant.id}
                    onChange={(e) => setNewTenant({...newTenant, id: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label>Nombre del Negocio</label>
                  <Input 
                    placeholder="Licorería El Paso" 
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label>Email Administrativo</label>
                  <Input 
                    type="email" 
                    placeholder="admin@negocio.com" 
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                    required 
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Crear Negocio</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[300px] py-4">Negocio</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Email de Contacto</TableHead>
                  <TableHead className="text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                      <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                      Cargando licorerías...
                    </TableCell>
                  </TableRow>
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-medium">
                      No hay licorerías registradas todavía.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold border border-primary/10">
                            {tenant.name[0].toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-700">{tenant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold uppercase tracking-tight">
                          <Globe className="h-3 w-3" />
                          {tenant.id}.localhost
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{tenant.email}</TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => window.location.href = '/central/licenses'}
                          >
                            <Key className="h-3 w-3 mr-1" />
                            Licencia
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs"
                            onClick={() => openEditDialog(tenant)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteTenant(tenant.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogo de Éxito con Contraseña */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              ¡Licorería Creada!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              El negocio se ha configurado correctamente. Por favor, entrega estas credenciales al administrador del negocio:
            </p>
            <div className="p-4 bg-slate-900 rounded-lg text-white font-mono space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>URL DE ACCESO:</span>
                <span className="text-primary-foreground underline lowercase">{lastCreatedTenant?.id}.localhost:5173</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase">Usuario:</span>
                <span className="font-bold">{lastCreatedTenant?.email}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700 pt-2 mt-2">
                <span className="text-xs text-slate-400 uppercase">Clave Temporal:</span>
                <span className="text-xl font-bold text-yellow-400 tracking-wider font-mono">{createdPassword}</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * El administrador deberá cambiar esta contraseña al ingresar por primera vez.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full">
              Entendido, copiado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Editar Licorería</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTenant} className="space-y-4 py-4">
            <div className="space-y-2">
              <label>Identificador (No editable)</label>
              <Input 
                value={editingTenant?.id || ''} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <label>Nombre del Negocio</label>
              <Input 
                placeholder="Licorería El Paso" 
                value={editingTenant?.name || ''}
                onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label>Email Administrativo</label>
              <Input 
                type="email" 
                placeholder="admin@negocio.com" 
                value={editingTenant?.email || ''}
                onChange={(e) => setEditingTenant({...editingTenant, email: e.target.value})}
                required 
              />
            </div>
            <DialogFooter>
              <Button type="submit">Actualizar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
