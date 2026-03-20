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
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      <PageHeader 
        title="Configuraciones" 
        subtitle="Panel de control maestro y seguridad"
        icon={Gear}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Coins size={14} weight="duotone" className="text-primary" /> Preferencias Globales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Divisa Principal</label>
                <Select value={currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="w-full h-11 bg-slate-50 border-none rounded-xl focus:ring-primary/20 font-bold">
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="NIO">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
                        <Bank className="h-4 w-4 text-blue-600" weight="duotone" />
                        <span>Córdoba (C$)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="USD">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
                        <Globe className="h-4 w-4 text-green-600" weight="duotone" />
                        <span>Dólar ($)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Impuesto Local (IVA %)</label>
                <Input 
                   type="number"
                   value={ivaPorcentaje}
                   onChange={(e) => setIvaPorcentaje(e.target.value)}
                   onBlur={(e) => handleIvaChange(e.target.value)}
                   className="h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-primary/20 font-black text-lg"
                   placeholder="Ej. 15"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identidad Visual</label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-slate-100 rounded-[1.5rem] bg-slate-50/50 hover:bg-slate-100/50 transition-colors group">
                    {logoBase64 ? (
                        <img src={logoBase64} alt="Logo" className="h-20 w-auto object-contain rounded-xl shadow-lg border border-white" />
                    ) : (
                        <div className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center text-slate-300 shadow-sm">
                            <Storefront size={40} weight="thin" />
                        </div>
                    )}
                    <label className="w-full">
                        <Button variant="outline" className="w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 hover:bg-white" asChild>
                            <span>Actualizar Logotipo</span>
                        </Button>
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Key size={14} weight="duotone" className="text-primary" /> Matriz de Cargos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
                {isLoading ? (
                  <div className="p-12 flex justify-center"><CircleNotch className="animate-spin h-6 w-6 text-primary/30" weight="bold" /></div>
                ) : roles.map((role) => (
                  <div 
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-4 mx-1 rounded-2xl flex items-center justify-between cursor-pointer transition-all duration-300 group ${selectedRole?.id === role.id ? 'bg-primary/5 shadow-inner' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${selectedRole?.id === role.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 group-hover:bg-white'}`}>
                        <Users className="h-5 w-5" weight="duotone" />
                      </div>
                      <div>
                        <p className={`text-xs font-black capitalize tracking-tight ${selectedRole?.id === role.id ? 'text-primary' : 'text-slate-700'}`}>{role.name.replace(/-/g, ' ')}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1 opacity-70">{role.permissions.length} privilegios</p>
                      </div>
                    </div>
                    {role.name !== 'Administrador' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                      >
                        <Trash weight="bold" size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="p-3">
                    <Button variant="ghost" className="w-full h-11 border-2 border-dashed border-slate-100 rounded-2xl hover:bg-white hover:border-primary/20 hover:text-primary gap-2 transition-all group" onClick={() => setIsNewRoleOpen(true)}>
                        <Plus size={16} weight="bold" className="group-hover:scale-125 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Añadir Cargo</span>
                    </Button>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/90 backdrop-blur-xl h-full flex flex-col rounded-[2.5rem] overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-white/50 px-8 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <LockKey size={24} weight="duotone" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black capitalize tracking-tight text-slate-800 leading-none">{selectedRole.name.replace(/-/g, ' ')}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg">Módulo de Seguridad</Badge>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">•</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedRole.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSavePermissions} 
                    disabled={isSaving || selectedRole.name === 'Administrador'}
                    className="h-12 px-8 rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-[10px] gap-3"
                  >
                    {isSaving ? <CircleNotch className="h-5 w-5 animate-spin" weight="bold" /> : <FloppyDisk size={20} weight="duotone" />}
                    Confirmar Matriz
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 overflow-y-auto max-h-[700px] bg-slate-50/30 thin-scrollbar">
                {selectedRole.name === 'Administrador' && (
                  <div className="mb-8 p-6 bg-primary/5 border border-primary/10 rounded-[1.5rem] flex gap-4 text-slate-600 animate-in slide-in-from-top-4 duration-500">
                    <ShieldCheck size={32} className="shrink-0 text-primary" weight="duotone" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Perfil Maestro Protegido</p>
                        <p className="text-xs font-bold leading-relaxed text-slate-500">
                          Este cargo posee privilegios absolutos a nivel de base de datos. Para garantizar la operatividad continua del sistema, las restricciones manuales están deshabilitadas para este nivel jerárquico.
                        </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(groupedPermissions).map(([resource, perms], idx) => (
                    <div key={resource} 
                         className="space-y-5 bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden"
                         style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-150 group-hover:opacity-[0.05] transition-all duration-700">
                        {getResourceIcon(resource)}
                      </div>
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50 pb-4 flex items-center gap-2">
                        {getResourceIcon(resource)}
                        {resource}
                      </h3>
                      <div className="space-y-4 pt-1">
                        {perms.map((p) => (
                          <div key={p.id} className="flex items-start space-x-4 group/item">
                            <Checkbox 
                              id={p.name} 
                              checked={editedPermissions.includes(p.name)}
                              disabled={selectedRole.name === 'Administrador'}
                              onCheckedChange={() => togglePermission(p.name)}
                              className="mt-0.5 rounded-lg h-5 w-5 border-slate-200 data-[state=checked]:bg-primary transition-all duration-300"
                            />
                            <div className="grid gap-1 leading-none">
                              <label 
                                htmlFor={p.name}
                                className="text-xs font-black tracking-tight cursor-pointer group-hover/item:text-primary transition-colors text-slate-700"
                              >
                                {PERMISSION_LABELS[p.name] || p.name}
                              </label>
                              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">{p.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="bg-white/80 backdrop-blur-sm border-t border-slate-100 p-6 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-primary/40 animate-pulse"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">
                   Sincronización de seguridad activa • Los cambios requieren reinicio de sesión
                </span>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[500px] bg-white/40 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 space-y-4 group">
               <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <ShieldCheck size={48} className="text-slate-100 group-hover:text-primary/10 transition-colors" weight="duotone" />
               </div>
               <div className="text-center space-y-1">
                 <p className="font-black text-[10px] uppercase tracking-[0.2em]">Seguridad del Sistema</p>
                 <p className="text-xs font-bold text-slate-400">Selecciona un cargo lateral para gestionar su matriz</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isNewRoleOpen} onOpenChange={setIsNewRoleOpen}>
        <DialogContent className="sm:max-w-[425px] border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem]">
          <DialogHeader className="p-4">
            <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Perfil de Cargo</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Asigna un nombre descriptivo para identificar el cargo
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Denominación del Puesto</label>
              <Input 
                placeholder="Ej. Supervisor de Inventario, Cajero Senior" 
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="h-12 bg-slate-50 border-none rounded-2xl focus-visible:ring-primary/20 font-bold"
              />
            </div>
          </div>
          <DialogFooter className="p-4">
            <Button variant="ghost" className="rounded-xl font-bold text-xs" onClick={() => setIsNewRoleOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRole} disabled={!newRoleName.trim()} className="rounded-xl px-8 h-11 font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                Crear Perfil Maestro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
