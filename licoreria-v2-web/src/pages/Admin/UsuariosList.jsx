import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  Plus, 
  PencilLine, 
  Trash, 
  ShieldCheck, 
  EnvelopeSimple, 
  Key, 
  Storefront,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function UsuariosList() {
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewMode, setViewMode] = useState('table');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: '',
    sucursal_id: 'none'
  });

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes, sucursalesRes] = await Promise.all([
        api.get('/api/users', { params: { page } }),
        api.get('/api/roles'),
        api.get('/api/sucursales', { params: { all: true } })
      ]);
      setUsers(usersRes.data.data ?? usersRes.data);
      if (usersRes.data.last_page) {
        setMeta({ current_page: usersRes.data.current_page, last_page: usersRes.data.last_page, total: usersRes.data.total });
      }
      setRoles(rolesRes.data.data ?? rolesRes.data);
      setSucursales(sucursalesRes.data.data ?? sucursalesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        sucursal_id: formData.sucursal_id === 'none' ? null : formData.sucursal_id 
      };
      
      if (editingUser) {
        await api.put(`/api/users/${editingUser.id}`, payload);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/api/users', payload);
        toast.success('Usuario creado');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar el usuario');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: '', sucursal_id: 'none' });
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', 
      role: user.roles[0]?.name || '',
      sucursal_id: user.sucursal_id?.toString() || 'none' 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (currentUser?.id === id) {
        toast.error('No puedes eliminar tu propio usuario');
        return;
    }
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      toast.success('Usuario eliminado');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el usuario');
    }
  };

  const handleToggleActive = async (user) => {
    if (currentUser?.id === user.id) {
        toast.error('No puedes desactivar tu propio usuario');
        return;
    }
    try {
      await api.patch(`/api/users/${user.id}/toggle-active`);
      toast.success(`Usuario ${user.active ? 'desactivado' : 'activado'}`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cambiar el estado del usuario');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader 
        title="Personal"
        subtitle="Gestiona los accesos, roles y sucursales de tu equipo."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o email..."
        action={
          <Can permission="crear.usuario">
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2 shadow-sm">
              <Plus weight="bold" className="h-4 w-4" /> Nuevo Usuario
            </Button>
          </Can>
        }
      />

      {viewMode === 'table' ? (
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Usuario</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Email</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Rol</TableHead>
                  <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Sucursal</TableHead>
                  <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest">Estado</TableHead>
                  <TableHead className="text-right px-6 font-bold text-[10px] uppercase tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6 py-4"><div className="h-4 w-32 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-40 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-24 bg-muted animate-pulse rounded mx-auto"></div></TableCell>
                      <TableCell className="py-4"><div className="h-4 w-12 bg-muted animate-pulse rounded mx-auto"></div></TableCell>
                      <TableCell className="text-right px-6 py-4"><div className="h-8 w-20 bg-muted animate-pulse rounded ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs italic">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/5">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-foreground">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider bg-primary/5 border-primary/20 text-primary">
                          {user.roles[0]?.name || 'Sin Rol'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-medium text-[10px] gap-1.5 py-0.5 px-2">
                          <Storefront size={12} weight="bold" />
                          {user.sucursal?.nombre || 'Global'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                           <Can permission="editar.usuario">
                              <Switch
                                checked={user.active !== false}
                                disabled={currentUser?.id === user.id}
                                onCheckedChange={() => handleToggleActive(user)}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                           </Can>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Can permission="editar.usuario">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <PencilLine size={16} />
                            </Button>
                          </Can>
                          <Can permission="eliminar.usuario">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(user.id)} 
                                disabled={currentUser?.id === user.id}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
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
              <div key={i} className="h-44 bg-card rounded-xl border animate-pulse shadow-sm"></div>
            ))
          ) : filteredUsers.map(user => (
            <Card key={user.id} className="border shadow-sm group hover:shadow-md transition-all overflow-hidden relative">
              <div className={`absolute top-0 left-0 right-0 h-1 ${user.active !== false ? 'bg-primary' : 'bg-muted'}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                   <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarFallback className="font-bold bg-primary/5 text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                   </Avatar>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Can permission="editar.usuario">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8">
                          <PencilLine size={16} />
                        </Button>
                      </Can>
                      <Can permission="eliminar.usuario">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(user.id)} 
                            disabled={currentUser?.id === user.id}
                            className="h-8 w-8 text-destructive"
                        >
                          <Trash size={16} />
                        </Button>
                      </Can>
                   </div>
                </div>
                <div>
                   <h3 className="font-bold text-base truncate">{user.name}</h3>
                   <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                      <EnvelopeSimple size={14} weight="bold" />
                      <span className="text-xs font-medium truncate">{user.email}</span>
                   </div>
                </div>
                <div className="mt-5 pt-4 border-t flex items-center justify-between">
                   <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest py-0.5 border-primary/20 bg-primary/5 text-primary">
                      {user.roles[0]?.name || 'Sin Rol'}
                   </Badge>
                   <Badge variant="secondary" className="text-[9px] font-bold py-0.5">
                      {user.sucursal?.nombre || 'Global'}
                   </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8">
          <DataPagination meta={meta} onPageChange={fetchData} />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              Configura los datos de acceso y permisos del empleado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input 
                    placeholder="Ej. Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo Electrónico</label>
                  <Input 
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      className="pl-10"
                      type="password"
                      placeholder="********"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required={!editingUser}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rol</label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(v) => setFormData({...formData, role: v})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rol..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sucursal</label>
                      <Select 
                        value={formData.sucursal_id} 
                        onValueChange={(v) => setFormData({...formData, sucursal_id: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sucursal..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Global</SelectItem>
                          {sucursales.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                </div>
            </div>
            
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingUser ? 'Actualizar' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
