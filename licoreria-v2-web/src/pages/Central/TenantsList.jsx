import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, ArrowsClockwise, Trash, Globe, Key, PencilLine, CheckCircle, User } from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TenantUsersModal } from './TenantUsersModal';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newTenant, setNewTenant] = useState({ id: '', name: '', email: '' });
  const [editingTenant, setEditingTenant] = useState(null);
  const [lastCreatedTenant, setLastCreatedTenant] = useState(null);
  const [createdPassword, setCreatedPassword] = useState('');
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedTenantForUsers, setSelectedTenantForUsers] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/central/tenants');
      setTenants(response.data.data || response.data);
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las licorerías');
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post('/api/central/tenants', newTenant);
      setCreatedPassword(response.data.temporary_password);
      setLastCreatedTenant({ ...newTenant });
      setIsSuccessDialogOpen(true);
      setIsDialogOpen(false);
      fetchTenants();
      setNewTenant({ id: '', name: '', email: '' });
    } catch (error) {
      const message = error.response?.data?.message || 'Error al crear la licorería';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTenant = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/api/central/tenants/${editingTenant.id}`, editingTenant);
      toast.success('Licorería actualizada correctamente');
      setIsEditOpen(false);
      fetchTenants();
    } catch (error) {
      toast.error('Error al actualizar la licorería');
    } finally {
      setIsSubmitting(false);
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
      toast.error('No se pudo eliminar el negocio');
    }
  };

  const openEditDialog = (tenant) => {
    setEditingTenant({ ...tenant });
    setIsEditOpen(true);
  };

  const openUsersModal = (tenant) => {
    setSelectedTenantForUsers(tenant);
    setIsUsersModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader 
        title="Licorerías"
        subtitle="Administración central de negocios y dominios registrados."
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
        searchPlaceholder="Buscar por nombre o ID..."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchTenants} disabled={isLoading}>
              <ArrowsClockwise className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-sm">
                  <Plus weight="bold" className="h-4 w-4" /> Registrar Licorería
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Licorería</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateTenant} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Identificador (Slug)</label>
                    <Input 
                      placeholder="ej: licor-centro" 
                      value={newTenant.id}
                      onChange={(e) => setNewTenant({...newTenant, id: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre del Negocio</label>
                    <Input 
                      placeholder="Licorería El Paso" 
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Administrativo</label>
                    <Input 
                      type="email" 
                      placeholder="admin@negocio.com" 
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                      required 
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />
                          Creando...
                        </>
                      ) : 'Crear Negocio'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Card className="shadow-sm overflow-hidden border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Negocio</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Identificador</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Email de Contacto</TableHead>
                <TableHead className="text-right px-6 font-bold text-[10px] uppercase tracking-widest">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                    <ArrowsClockwise className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                    Cargando licorerías...
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-medium">
                    No se encontraron licorerías.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarFallback className="text-[11px] font-bold bg-primary/5">
                            {tenant.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{tenant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] gap-1.5 py-1">
                        <Globe size={12} className="text-muted-foreground" />
                        {tenant.id}.localhost
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tenant.email}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => window.location.href = '/central/licenses'}
                          title="Gestionar Licencia"
                        >
                          <Key size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => openUsersModal(tenant)}
                          title="Gestionar Usuarios"
                        >
                          <User size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => openEditDialog(tenant)}
                          title="Editar"
                        >
                          <PencilLine size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDeleteTenant(tenant.id)}
                          title="Eliminar"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogo de Éxito con Contraseña */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle weight="bold" size={24} />
              ¡Licorería Creada!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              El negocio se ha configurado correctamente. Por favor, entrega estas credenciales al administrador del negocio:
            </p>
            <div className="p-6 bg-slate-950 rounded-xl text-white font-mono space-y-4 shadow-xl border border-white/10">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">URL DE ACCESO</span>
                <p className="text-emerald-400 text-sm">{lastCreatedTenant?.id}.localhost:5173</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">USUARIO</span>
                <p className="font-bold">{lastCreatedTenant?.email}</p>
              </div>
              <div className="pt-2 border-t border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">CLAVE TEMPORAL</span>
                <p className="text-2xl font-black text-amber-400 tracking-wider">{createdPassword}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic text-center">
              * El administrador deberá cambiar esta contraseña al ingresar por primera vez.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSuccessDialogOpen(false)} className="w-full h-11">
              Entendido, copiado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Licorería</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateTenant} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Identificador (No editable)</label>
              <Input 
                value={editingTenant?.id || ''} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Negocio</label>
              <Input 
                placeholder="Licorería El Paso" 
                value={editingTenant?.name || ''}
                onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Administrativo</label>
              <Input 
                type="email" 
                placeholder="admin@negocio.com" 
                value={editingTenant?.email || ''}
                onChange={(e) => setEditingTenant({...editingTenant, email: e.target.value})}
                required 
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">Actualizar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Usuarios del Tenant */}
      <TenantUsersModal 
        isOpen={isUsersModalOpen} 
        onClose={setIsUsersModalOpen} 
        tenant={selectedTenantForUsers} 
      />
    </div>
  );
}
