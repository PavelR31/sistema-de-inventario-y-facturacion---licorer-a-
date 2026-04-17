import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, ShieldAlert, KeyRound, CalendarDays, Users, CheckCircle2, Play, Pause, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function LicenseManagement() {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog States
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [renewForm, setRenewForm] = useState({ plan_id: '', months: '12' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, plansRes] = await Promise.all([
        api.get('/api/central/licenses'),
        api.get('/api/central/plans')
      ]);
      setTenants(tenantsRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando licencias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenew = async (e) => {
    e.preventDefault();
    if (!renewForm.plan_id) return toast.error('Selecciona un plan');
    
    try {
      await api.post(`/api/central/licenses/${selectedTenant.id}/renew`, renewForm);
      toast.success('Licencia renovada exitosamente');
      setIsRenewOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Error al renovar licencia');
    }
  };

  const handleToggleSuspend = async (tenant) => {
    const isSuspended = tenant.license.status === 'suspended';
    const actionText = isSuspended ? 'reactivar' : 'suspender';
    
    if (!window.confirm(`¿Estás seguro de que deseas ${actionText} a ${tenant.name}?`)) return;

    try {
      if (isSuspended) {
        await api.post(`/api/central/licenses/${tenant.id}/activate`);
        toast.success('Licorería reactivada');
      } else {
        await api.post(`/api/central/licenses/${tenant.id}/suspend`);
        toast.success('Licorería suspendida');
      }
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(`Error al ${actionText} licorería`);
    }
  };

  const openRenewDialog = (tenant) => {
    setSelectedTenant(tenant);
    setRenewForm({ plan_id: tenant.plan?.id?.toString() || '', months: '12' });
    setIsRenewOpen(true);
  };

  const getStatusBadge = (status) => {
    const map = {
      trial: { label: 'Prueba', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
      active: { label: 'Activo', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
      suspended: { label: 'Suspendido', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
      expired: { label: 'Expirado', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    };
    const mapped = map[status] || map.trial;
    return <Badge className={`${mapped.color} border-none shadow-none`}>{mapped.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Licencias</h1>
          <p className="text-muted-foreground text-sm">Control de planes, suscripciones y accesos por tenant.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-100 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4">Negocio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Plan Actual</TableHead>
                  <TableHead>Usuarios (Seats)</TableHead>
                  <TableHead>Expiración</TableHead>
                  <TableHead className="text-right px-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                      <RefreshCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-20" />
                      Cargando información de licencias...
                    </TableCell>
                  </TableRow>
                ) : tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">
                      No hay negocios registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id} className={`hover:bg-slate-50/50 transition-colors group ${!tenant.license.is_usable ? 'bg-red-50/30' : ''}`}>
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{tenant.name}</span>
                          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-tighter">
                            {tenant.id}.localhost
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tenant.license.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{tenant.plan?.name || '--'}</span>
                          {tenant.plan && <span className="text-xs text-muted-foreground">${tenant.plan.price}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {tenant.license.active_users} / {tenant.license.max_users === 0 ? '∞' : tenant.license.max_users}
                          </span>
                        </div>
                        {/* Progress bar visual */}
                        {tenant.license.max_users > 0 && (
                          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (tenant.license.active_users / tenant.license.max_users) > 0.9 ? 'bg-red-500' : 'bg-primary'
                              }`}
                              style={{ width: `${Math.min(100, (tenant.license.active_users / tenant.license.max_users) * 100)}%` }}
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          {tenant.license.expires_at ? (
                            <>
                              <span className="text-sm">
                                {new Date(tenant.license.expires_at).toLocaleDateString()}
                              </span>
                              <span className={`text-[11px] font-medium ${
                                tenant.license.days_remaining <= 7 ? 'text-red-600' : 'text-slate-500'
                              }`}>
                                {tenant.license.days_remaining > 0 ? `En ${tenant.license.days_remaining} días` : 'Expirada'}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-slate-500">Ilimitada</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs hover:text-green-600 hover:bg-green-50"
                            onClick={() => openRenewDialog(tenant)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Renovar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`h-8 px-2 text-xs ${
                              tenant.license.status === 'suspended' 
                                ? 'text-green-600 hover:bg-green-100' 
                                : 'text-red-600 hover:bg-red-100'
                            }`}
                            onClick={() => handleToggleSuspend(tenant)}
                          >
                            {tenant.license.status === 'suspended' ? (
                              <><Play className="h-3 w-3 mr-1" /> Activar</>
                            ) : (
                              <><Pause className="h-3 w-3 mr-1" /> Suspender</>
                            )}
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

      {/* Modal para Renovar */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Licencia</DialogTitle>
            <DialogDescription>
              Actualiza el plan de suscripción de <span className="font-bold text-slate-800">{selectedTenant?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenew} className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plan Suscripción</label>
              <Select 
                value={renewForm.plan_id} 
                onValueChange={(val) => setRenewForm({...renewForm, plan_id: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} — ${p.price} ({p.max_users === 0 ? 'ILIMITADO' : `${p.max_users} users`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Duración (Meses)</label>
              <Select 
                value={renewForm.months} 
                onValueChange={(val) => setRenewForm({...renewForm, months: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Mes</SelectItem>
                  <SelectItem value="3">3 Meses (Trimestral)</SelectItem>
                  <SelectItem value="6">6 Meses (Semestral)</SelectItem>
                  <SelectItem value="12">12 Meses (Anual)</SelectItem>
                  <SelectItem value="60">5 Años</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                La fecha de expiración se actualizará sumando este tiempo.
              </p>
            </div>
            
            <DialogFooter>
              <Button type="submit">Aplicar Renovación</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
