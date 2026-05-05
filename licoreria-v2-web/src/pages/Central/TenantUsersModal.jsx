import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowsClockwise, User, PencilLine, SignIn } from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';

export function TenantUsersModal({ isOpen, onClose, tenant }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (isOpen && tenant) {
      fetchUsers();
    }
  }, [isOpen, tenant]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/central/tenants/${tenant.id}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Error al cargar usuarios de la licorería');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/central/tenants/${tenant.id}/users/${editingUser.id}`, editingUser);
      toast.success('Usuario actualizado correctamente');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('Error al actualizar usuario');
    }
  };

  const handleImpersonate = async (user) => {
    try {
      toast.loading(`Conectando como ${user.name}...`);
      const response = await api.post(`/api/central/tenants/${tenant.id}/users/${user.id}/impersonate`);
      toast.dismiss();
      
      // Abrir en una nueva pestaña
      window.open(response.data.redirect_url, '_blank');
    } catch (error) {
      toast.dismiss();
      toast.error('Error al intentar impersonar al usuario');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User size={20} />
            Usuarios de {tenant?.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Gestiona los usuarios del negocio seleccionado.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading} className="gap-2">
              <ArrowsClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
              Actualizar
            </Button>
          </div>

          {editingUser ? (
            <form onSubmit={handleUpdateUser} className="space-y-4 bg-muted/50 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm">Editando a {editingUser.name}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                  <Input 
                    value={editingUser.name}
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <Input 
                    type="email"
                    value={editingUser.email}
                    onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Nueva Contraseña (Opcional)</label>
                  <Input 
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    value={editingUser.password || ''}
                    onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Guardar Cambios
                </Button>
              </div>
            </form>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Administrador</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.is_super_admin ? 'Sí' : 'No'}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleImpersonate(user)}
                            title="Entrar como este usuario"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <SignIn size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setEditingUser({...user})}
                            title="Editar Usuario"
                          >
                            <PencilLine size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
