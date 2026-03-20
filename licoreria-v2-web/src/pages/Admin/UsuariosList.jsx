import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Users, Shield, Mail, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';

export default function UsuariosList() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
      password: '', // Password se deja vacío si no se va a cambiar
      role: user.roles[0]?.name || '',
      sucursal_id: user.sucursal_id?.toString() || 'none' 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
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
    try {
      await api.patch(`/api/users/${user.id}/toggle-active`);
      toast.success(`Usuario ${user.active ? 'desactivado' : 'activado'}`);
      fetchData();
    } catch (error) {
      toast.error('No se pudo cambiar el estado del usuario');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Usuarios & Personal</h1>
          <p className="text-muted-foreground">Gestiona los accesos de tus cajeros y administradores.</p>
        </div>
        <Can permission="crear.usuario">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Button>
        </Can>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4">Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        {u.name}
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="h-3 w-3" />
                            {u.email}
                        </div>
                    </TableCell>
                     <TableCell>
                       <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                         <Shield className="h-3 w-3" />
                         {u.roles[0]?.name || 'Sin Rol'}
                       </span>
                     </TableCell>
                     <TableCell>
                       <span className="text-xs font-medium text-slate-600">
                         {u.sucursal?.nombre || 'Todas (Admin)'}
                       </span>
                     </TableCell>
                     <TableCell className="text-center">
                       <Can permission="editar.usuario">
                         <div className="flex flex-col items-center gap-1">
                           <Switch
                             checked={u.active !== false}
                             onCheckedChange={() => handleToggleActive(u)}
                             className="data-[state=checked]:bg-green-500"
                           />
                           <span className={`text-[10px] font-bold uppercase ${ u.active !== false ? 'text-green-600' : 'text-slate-400' }`}>
                             {u.active !== false ? 'Activo' : 'Inactivo'}
                           </span>
                         </div>
                       </Can>
                     </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-1">
                        <Can permission="editar.usuario">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Can>
                        <Can permission="eliminar.usuario">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Can>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <DataPagination meta={meta} onPageChange={fetchData} />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              Configura los datos de acceso y permisos del empleado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Nombre Completo</label>
              <Input 
                placeholder="Ej. Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Correo Electrónico</label>
              <Input 
                type="email"
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">
                {editingUser ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Rol del Sistema</label>
              <Select 
                value={formData.role} 
                onValueChange={(v) => setFormData({...formData, role: v})}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Sucursal Asignada</label>
              <Select 
                value={formData.sucursal_id} 
                onValueChange={(v) => setFormData({...formData, sucursal_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="--- Selecciona una sucursal ---" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar (Ver todas)</SelectItem>
                  {sucursales.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
