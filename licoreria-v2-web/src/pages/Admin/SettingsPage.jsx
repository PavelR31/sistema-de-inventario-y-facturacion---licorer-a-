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
  LockKey,
  Key
} from "@phosphor-icons/react"
import { toast } from 'sonner';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';

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
  
  const [ivaPorcentaje, setIvaPorcentaje] = useState(0);
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes, configRes] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/permissions'),
        api.get('/api/configuraciones')
      ]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
      
      if (configRes.data?.moneda) {
        setCurrency(configRes.data.moneda);
      }

      if (configRes.data?.iva_porcentaje) {
        setIvaPorcentaje(configRes.data.iva_porcentaje);
      }

      if (configRes.data?.logo_empresa) {
        setLogoBase64(configRes.data.logo_empresa);
      }

      if (configRes.data?.nombre_empresa) {
        setNombreEmpresa(configRes.data.nombre_empresa);
      }
      
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

  const handleCurrencyChange = async (value) => {
    try {
      const simbolo = value === 'NIO' ? 'C$' : '$';
      await Promise.all([
        api.put('/api/configuraciones', { clave: 'moneda', valor: value }),
        api.put('/api/configuraciones', { clave: 'simbolo_moneda', valor: simbolo })
      ]);
      setCurrency(value);
      toast.success(`Moneda guardada como ${value === 'NIO' ? 'Córdobas (C$)' : 'Dólores ($)'}`);
    } catch (error) {
      toast.error('No se pudo guardar la configuración de moneda');
    }
  };

  const handleIvaChange = async (value) => {
    try {
      await api.put('/api/configuraciones', { clave: 'iva_porcentaje', valor: value });
      setIvaPorcentaje(value);
      toast.success('Porcentaje de IVA actualizado');
    } catch (error) {
      toast.error('Error al guardar el IVA');
    }
  };

  const handleNombreChange = async (value) => {
    try {
      await api.put('/api/configuraciones', { clave: 'nombre_empresa', valor: value });
      setNombreEmpresa(value);
      toast.success('Nombre de la empresa actualizado');
    } catch (error) {
      toast.error('Error al guardar el nombre');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
      return toast.error("La imagen es demasiado grande. Máximo 1MB.");
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await api.put('/api/configuraciones', { clave: 'logo_empresa', valor: base64String });
        setLogoBase64(base64String);
        toast.success('Logo de empresa actualizado');
      } catch (error) {
        toast.error('Error al subir el logo');
      }
    };
    reader.readAsDataURL(file);
  };

  const PERMISSION_GROUPS = {
    'Inventario / Productos': [
      'ver.productos', 'crear.producto', 'editar.producto', 'eliminar.producto',
      'ajustar.stock', 'ver.costos',
    ],
    'Categorías': [
      'ver.categorias', 'crear.categoria', 'editar.categoria', 'eliminar.categoria',
    ],
    'Ventas & POS': [
      'acceso.pos', 'crear.venta', 'anular.venta', 'aplicar.descuento',
      'ver.historial-ventas', 'exportar.ventas',
    ],
    'Caja': [
      'abrir.caja', 'cerrar.caja', 'ver.movimientos-caja',
      'ajustar.saldo-caja', 'realizar.egresos',
    ],
    'Compras & Proveedores': [
      'registrar.compra', 'ver.historial-compras',
      'ver.proveedores', 'crear.proveedor', 'editar.proveedor', 'eliminar.proveedor',
    ],
    'Reportes': [
      'ver.reporte-diario', 'ver.reporte-mensual',
      'ver.reporte-utilidades', 'ver.reporte-stock-bajo',
    ],
    'Sucursales': [
      'ver.sucursales', 'crear.sucursal', 'editar.sucursal', 'eliminar.sucursal',
    ],
    'Usuarios': [
      'ver.usuarios', 'crear.usuario', 'editar.usuario', 'eliminar.usuario',
    ],
    'Roles & Sistema': [
      'ver.roles', 'crear.rol', 'editar.rol', 'eliminar.rol', 'ajustes.sistema',
    ],
  };

  const groupedPermissions = Object.entries(PERMISSION_GROUPS).reduce((acc, [group, names]) => {
    const permsInGroup = names
      .map(name => permissions.find(p => p.name === name))
      .filter(Boolean);
    if (permsInGroup.length > 0) acc[group] = permsInGroup;
    return acc;
  }, {});

  const PERMISSION_LABELS = {
    'ver.productos': 'Ver catálogo',
    'crear.producto': 'Crear productos',
    'editar.producto': 'Editar productos',
    'eliminar.producto': 'Eliminar productos',
    'ajustar.stock': 'Ajustar stock',
    'ver.costos': 'Ver precios de costo',
    'ver.categorias': 'Ver categorías',
    'crear.categoria': 'Crear categorías',
    'editar.categoria': 'Editar categorías',
    'eliminar.categoria': 'Eliminar categorías',
    'acceso.pos': 'Acceso al POS',
    'crear.venta': 'Registrar ventas',
    'anular.venta': 'Anular ventas',
    'aplicar.descuento': 'Aplicar descuentos',
    'ver.historial-ventas': 'Ver historial de ventas',
    'exportar.ventas': 'Exportar ventas',
    'abrir.caja': 'Abrir caja',
    'cerrar.caja': 'Cerrar caja',
    'ver.movimientos-caja': 'Ver movimientos de caja',
    'ajustar.saldo-caja': 'Ajustar saldo de caja',
    'realizar.egresos': 'Realizar egresos',
    'registrar.compra': 'Registrar compras',
    'ver.historial-compras': 'Ver historial de compras',
    'ver.proveedores': 'Ver proveedores',
    'crear.proveedor': 'Crear proveedores',
    'editar.proveedor': 'Editar proveedores',
    'eliminar.proveedor': 'Eliminar proveedores',
    'ver.reporte-diario': 'Reporte diario',
    'ver.reporte-mensual': 'Reporte mensual',
    'ver.reporte-utilidades': 'Reporte de utilidades',
    'ver.reporte-stock-bajo': 'Reporte de stock bajo',
    'ver.sucursales': 'Ver sucursales',
    'crear.sucursal': 'Crear sucursales',
    'editar.sucursal': 'Editar sucursales',
    'eliminar.sucursal': 'Eliminar sucursales',
    'ver.usuarios': 'Ver usuarios',
    'crear.usuario': 'Crear usuarios',
    'editar.usuario': 'Editar usuarios',
    'eliminar.usuario': 'Eliminar usuarios',
    'ver.roles': 'Ver roles y permisos',
    'crear.rol': 'Crear roles',
    'editar.rol': 'Editar roles',
    'eliminar.rol': 'Eliminar roles',
    'ajustes.sistema': 'Ajustes del sistema',
  };

  const getResourceIcon = (group) => {
    if (group.includes('Inventario') || group.includes('Producto')) return <Package className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Categor')) return <Package className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Ventas') || group.includes('POS')) return <Receipt className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Caja')) return <Storefront className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Compras')) return <ShoppingCart className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Reportes')) return <ChartPieSlice className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Sucursal')) return <Storefront className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Usuario')) return <Users className="h-4 w-4 text-primary" weight="duotone" />;
    if (group.includes('Roles') || group.includes('Sistema')) return <ShieldCheck className="h-4 w-4 text-primary" weight="duotone" />;
    return <Gear className="h-4 w-4 text-primary" weight="duotone" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Configuración" 
        subtitle="Administra los ajustes del sistema y permisos de seguridad"
        icon={Gear}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Coins size={18} className="text-primary" /> Preferencias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Nombre de la Licorería</label>
                <Input 
                   value={nombreEmpresa}
                   onChange={(e) => setNombreEmpresa(e.target.value)}
                   onBlur={(e) => handleNombreChange(e.target.value)}
                   placeholder="Ej. Licorería El Oasis"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Divisa Principal</label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIO">Córdoba (C$)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Impuesto (IVA %)</label>
                <Input 
                   type="number"
                   value={ivaPorcentaje}
                   onChange={(e) => setIvaPorcentaje(e.target.value)}
                   onBlur={(e) => handleIvaChange(e.target.value)}
                   placeholder="Ej. 15"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Logotipo Empresa</label>
                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-lg bg-muted/50 transition-colors">
                    {logoBase64 ? (
                        <img src={logoBase64} alt="Logo" className="h-16 w-auto object-contain rounded-md" />
                    ) : (
                        <div className="h-16 w-16 rounded-md bg-background flex items-center justify-center text-muted-foreground border">
                            <Storefront size={32} />
                        </div>
                    )}
                    <label className="w-full">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                            <span>Cambiar Logo</span>
                        </Button>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users size={18} className="text-primary" /> Roles
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsNewRoleOpen(true)}>
                <Plus size={16} />
              </Button>
            </CardHeader>
            <CardContent className="px-2">
                {isLoading ? (
                  <div className="p-8 flex justify-center"><CircleNotch className="animate-spin h-5 w-5 text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-1">
                    {roles.map((role) => (
                      <button 
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`w-full p-3 rounded-md flex items-center justify-between text-left transition-colors ${selectedRole?.id === role.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={16} className={selectedRole?.id === role.id ? 'text-primary-foreground' : 'text-primary'} />
                          <div>
                            <p className="text-sm font-medium capitalize">{role.name.replace(/-/g, ' ')}</p>
                            <p className={`text-[10px] ${selectedRole?.id === role.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {role.permissions.length} permisos
                            </p>
                          </div>
                        </div>
                        {role.name !== 'Administrador' && selectedRole?.id !== role.id && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                          >
                            <Trash size={14} />
                          </Button>
                        )}
                      </button>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="h-full">
              <CardHeader className="border-b">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <LockKey size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold capitalize">{selectedRole.name.replace(/-/g, ' ')}</CardTitle>
                      <CardDescription>Gestión de matriz de accesos</CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSavePermissions} 
                    disabled={isSaving || selectedRole.name === 'Administrador'}
                    className="gap-2"
                  >
                    {isSaving ? <CircleNotch className="h-4 w-4 animate-spin" /> : <FloppyDisk size={18} />}
                    Guardar Cambios
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {selectedRole.name === 'Administrador' && (
                  <div className="mb-6 p-4 bg-primary/5 border rounded-lg text-sm text-muted-foreground flex gap-3">
                    <ShieldCheck size={20} className="text-primary shrink-0" />
                    <p>Este rol tiene permisos de superusuario y no puede ser modificado manualmente.</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="space-y-4 p-4 border rounded-lg">
                      <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                        {getResourceIcon(resource)}
                        {resource}
                      </h3>
                      <div className="grid gap-3">
                        {perms.map((p) => (
                          <div key={p.id} className="flex items-center space-x-3">
                            <Checkbox 
                              id={p.name} 
                              checked={editedPermissions.includes(p.name)}
                              disabled={selectedRole.name === 'Administrador'}
                              onCheckedChange={() => togglePermission(p.name)}
                            />
                            <div className="grid gap-0.5">
                              <label htmlFor={p.name} className="text-sm font-medium leading-none cursor-pointer">
                                {PERMISSION_LABELS[p.name] || p.name}
                              </label>
                              <p className="text-[10px] text-muted-foreground">{p.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground text-center p-8">
               <ShieldCheck size={48} className="mb-4 opacity-20" />
               <p className="text-sm font-medium">Selecciona un rol para ver sus permisos</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nuevo Rol</DialogTitle>
            <DialogDescription>Crea un nuevo perfil para asignar permisos específicos</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nombre del Rol</label>
            <Input 
              placeholder="Ej. Cajero, Supervisor" 
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewRoleOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()}>Crear Rol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
