import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Coins, 
  Globe, 
  Bank, 
  ShieldCheck, 
  Users, 
  FloppyDisk, 
  Trash, 
  Plus, 
  CircleNotch, 
  Gear,
  Storefront,
  Package,
  ShoppingCart,
  Receipt,
  ChartPieSlice,
  LockKey
} from "@phosphor-icons/react"
import { toast } from 'sonner';
import api from '@/lib/api';

export default function SettingsPage() {
  const { currency, setCurrency } = useAuthStore();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [editedPermissions, setEditedPermissions] = useState([]);
  
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/permissions')
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      
      if (rolesRes.data.length > 0 && !selectedRole) {
        handleSelectRole(rolesRes.data[0]);
      }
    } catch (e) {
      toast.error('Error al cargar la configuración de seguridad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setEditedPermissions(role.permissions.map(p => p.name));
  };

  const togglePermission = (permName) => {
    setEditedPermissions(prev => 
      prev.includes(permName) 
        ? prev.filter(p => p !== permName) 
        : [...prev, permName]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    
    setIsSaving(true);
    try {
      await api.put(`/api/roles/${selectedRole.id}`, {
        permissions: editedPermissions
      });
      toast.success('Permisos actualizados correctamente');
      fetchData();
    } catch (e) {
      toast.error('No se pudieron guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    
    try {
      await api.post('/api/roles', { name: newRoleName });
      toast.success('Rol creado con éxito');
      setNewRoleName('');
      setIsNewRoleOpen(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al crear el rol');
    }
  };

  const handleDeleteRole = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este rol? Los usuarios asignados a él perderán sus accesos.')) return;
    
    try {
      await api.delete(`/api/roles/${id}`);
      toast.success('Rol eliminado');
      setSelectedRole(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'No se pudo eliminar el rol');
    }
  };

  const handleCurrencyChange = (value) => {
    setCurrency(value);
    toast.success(`Moneda cambiada a ${value === 'NIO' ? 'Córdobas (C$)' : 'Dólares ($)'}`);
  };

  const groupedPermissions = permissions.reduce((acc, p) => {
    const resource = p.name.includes('.') ? p.name.split('.')[1] : (p.name.includes('-') ? p.name.split('-')[1] : 'general');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(p);
    return acc;
  }, {});

  const getResourceIcon = (resource) => {
    switch (resource) {
      case 'venta': case 'ventas': return <Receipt className="h-4 w-4 text-primary" />;
      case 'caja': return <Storefront className="h-4 w-4 text-primary" />;
      case 'producto': case 'catalogo': case 'categorias': return <Package className="h-4 w-4 text-primary" />;
      case 'compra': case 'compras': case 'proveedores': return <ShoppingCart className="h-4 w-4 text-primary" />;
      case 'reporte': case 'reportes': return <ChartPieSlice className="h-4 w-4 text-primary" />;
      case 'usuarios': case 'roles': case 'sucursales': return <Users className="h-4 w-4 text-primary" />;
      default: return <Gear className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Seguridad y Ajustes</h1>
          <p className="text-muted-foreground">Configura los accesos detallados por cargo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <Coins className="h-5 w-5 text-primary" weight="fill" /> Preferencias
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Moneda Global</label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full h-12 border-slate-200 shadow-none focus:ring-primary">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIO">
                      <div className="flex items-center gap-2 font-medium">
                        <Bank className="h-4 w-4 text-blue-600" />
                        <span>Córdoba (C$)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2 font-medium">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span>Dólar ($)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b">
              <CardTitle className="text-lg flex items-center gap-2 font-bold">
                <LockKey className="h-5 w-5 text-primary" weight="fill" /> Cargos / Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-8 text-center"><CircleNotch className="animate-spin h-6 w-6 mx-auto text-slate-300" /></div>
                ) : roles.map((role) => (
                  <div 
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-slate-50 ${selectedRole?.id === role.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${selectedRole?.id === role.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Users className="h-4 w-4" weight="bold" />
                      </div>
                      <div>
                        <p className="text-sm font-bold capitalize">{role.name.replace(/-/g, ' ')}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase">{role.permissions.length} acciones permitidas</p>
                      </div>
                    </div>
                    {role.name !== 'Administrador' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-300 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50/50">
                <Button variant="outline" className="w-full border-dashed border-2 hover:border-primary hover:text-primary gap-2" onClick={() => setIsNewRoleOpen(true)}>
                  <Plus className="h-4 w-4" weight="bold" /> Nuevo Cargo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="border-slate-200 shadow-sm h-full flex flex-col">
              <CardHeader className="border-b bg-white sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase">Control de Acceso</Badge>
                      <h2 className="text-xl font-black capitalize">{selectedRole.name.replace(/-/g, ' ')}</h2>
                    </div>
                    <CardDescription>Personaliza exactamente qué acciones puede realizar este cargo.</CardDescription>
                  </div>
                  <Button 
                    onClick={handleSavePermissions} 
                    disabled={isSaving || selectedRole.name === 'Administrador'}
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    {isSaving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk className="h-4 w-4" />}
                    Guardar Matriz
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 overflow-y-auto max-h-[600px] bg-slate-50/20">
                {selectedRole.name === 'Administrador' && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 text-amber-800">
                    <ShieldCheck className="h-5 w-5 shrink-0" weight="fill" />
                    <p className="text-xs font-medium leading-relaxed">
                      <strong>Perfil Maestro:</strong> Este cargo tiene privilegios absolutos. No se pueden restringir sus acciones para garantizar la integridad del sistema.
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex items-center gap-2">
                        {getResourceIcon(resource)}
                        Módulo: {resource.replace(/-/g, ' ')}
                      </h3>
                      <div className="space-y-3 pt-1">
                        {perms.map((p) => (
                          <div key={p.id} className="flex items-start space-x-3 group">
                            <Checkbox 
                              id={p.name} 
                              checked={editedPermissions.includes(p.name)}
                              disabled={selectedRole.name === 'Administrador'}
                              onCheckedChange={() => togglePermission(p.name)}
                              className="mt-0.5"
                            />
                            <div className="grid gap-0.5 leading-none">
                              <label 
                                htmlFor={p.name}
                                className="text-[13px] font-bold leading-none cursor-pointer group-hover:text-primary transition-colors capitalize"
                              >
                                {p.name.split('.')[0].replace(/-/g, ' ')}
                              </label>
                              <p className="text-[10px] text-slate-400 font-medium">Permite ejecutar esta acción en {resource}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t p-4 text-[11px] text-slate-500 font-medium">
                * Los cambios son instantáneos pero requieren un refresco de sesión para el usuario final.
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-4">
               <div className="bg-slate-50 p-6 rounded-full">
                  <ShieldCheck className="h-12 w-12 text-slate-100" />
               </div>
               <p className="font-bold">Selecciona un cargo para editar su matriz de acceso.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Crear Nuevo Cargo</DialogTitle>
            <DialogDescription>
              Define el nombre para el nuevo perfil de empleado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Nombre del Cargo</label>
              <Input 
                placeholder="Ej. Supervisor Turno A" 
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="h-12 border-slate-200 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewRoleOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>Crear Perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
