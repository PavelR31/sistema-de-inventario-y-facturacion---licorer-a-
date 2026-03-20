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
import PageHeader from '@/components/layout/PageHeader';

export default function UsuariosList() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Usuarios & Personal"
        subtitle="Control de accesos y permisos"
        icon={Users}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o email..."
        action={
          <Can permission="crear.usuario">
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
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
                  <TableHead className="font-semibold text-slate-800 py-4 px-6">Usuario</TableHead>
                  <TableHead className="font-semibold text-slate-800">Email</TableHead>
                  <TableHead className="font-semibold text-slate-800">Rol</TableHead>
                  <TableHead className="font-semibold text-slate-800 text-center">Sucursal</TableHead>
                  <TableHead className="font-semibold text-slate-800 text-center">Estado</TableHead>
                  <TableHead className="font-semibold text-slate-800 text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><div className="h-4 w-32 bg-slate-100 animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-40 bg-slate-100 animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-20 bg-slate-100 animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-24 bg-slate-100 animate-pulse rounded mx-auto"></div></TableCell>
                      <TableCell><div className="h-4 w-12 bg-slate-100 animate-pulse rounded mx-auto"></div></TableCell>
                      <TableCell className="text-right px-6"><div className="h-8 w-20 bg-slate-100 animate-pulse rounded ml-auto"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs border border-primary/10">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold border-none">
                          {user.roles[0]?.name || 'Sin Rol'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                          <Shield size={12} className="text-slate-400" />
                          {user.sucursal?.nombre || 'Acceso Global'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                           <Can permission="editar.usuario">
                              <Switch
                                checked={user.active !== false}
                                onCheckedChange={() => handleToggleActive(user)}
                                className="data-[state=checked]:bg-green-500"
                              />
                           </Can>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Can permission="editar.usuario">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)} className="text-slate-400 hover:text-black hover:bg-slate-100">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.usuario">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(user.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-100 font-bold">
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
              <div key={i} className="h-44 bg-white rounded-lg border border-slate-100 animate-pulse"></div>
            ))
          ) : filteredUsers.map(user => (
            <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-all bg-white group overflow-hidden">
              <div className={`h-1.5 w-full ${user.active !== false ? 'bg-primary' : 'bg-slate-200'}`}></div>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                   <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center font-bold border border-primary/10">
                      {user.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Can permission="editar.usuario">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)} className="h-8 w-8 text-slate-400 hover:text-black">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Can>
                      <Can permission="eliminar.usuario">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(user.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </Can>
                   </div>
                </div>
                <div>
                   <h3 className="font-semibold text-slate-800 truncate">{user.name}</h3>
                   <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                      <Mail size={12} weight="duotone" /> {user.email}
                   </p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-none">
                      {user.roles[0]?.name || 'Sin Rol'}
                   </Badge>
                   <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                      {user.sucursal?.nombre || 'Global'}
                   </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta.last_page > 1 && (
        <div className="mt-8 flex justify-center">
          <DataPagination meta={meta} onPageChange={fetchData} />
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Configura los datos de acceso y permisos del empleado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre Completo</label>
                  <Input 
                    placeholder="Ej. Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Correo Electrónico</label>
                  <Input 
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-2.5 text-slate-400" />
                    <Input 
                      className="pl-10 bg-slate-50/50 border-slate-200"
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
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Rol</label>
                      <Select 
                        value={formData.role} 
                        onValueChange={(v) => setFormData({...formData, role: v})}
                        required
                      >
                        <SelectTrigger className="w-full bg-slate-50/50 border-slate-200">
                          <SelectValue placeholder="Rol..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Sucursal</label>
                      <Select 
                        value={formData.sucursal_id} 
                        onValueChange={(v) => setFormData({...formData, sucursal_id: v})}
                      >
                        <SelectTrigger className="w-full bg-slate-50/50 border-slate-200">
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
            
            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm">
                {editingUser ? 'Actualizar' : 'Crear Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
