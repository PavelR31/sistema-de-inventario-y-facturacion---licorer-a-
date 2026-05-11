import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Gear,
  Database,
  ArrowsClockwise,
  Crown,
  CheckCircle,
  PencilSimple,
  Trash,
  Plus,
  Users,
  Buildings,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';

const EMPTY_PLAN = {
  name: '',
  description: '',
  price: '',
  max_users: '',
  max_branches: '',
  is_active: true,
};

export default function CentralSettings() {
  const [activeTab, setActiveTab] = useState('plans');

  // Plans state
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch Plans ──────────────────────────────────────────────────
  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await api.get('/api/central/plans');
      setPlans(res.data);
    } catch {
      toast.error('Error al cargar planes');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  // ── Open Modal ───────────────────────────────────────────────────
  const openCreate = () => {
    setEditingPlan(null);
    setForm(EMPTY_PLAN);
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name:         plan.name,
      description:  plan.description ?? '',
      price:        plan.price,
      max_users:    plan.max_users,
      max_branches: plan.max_branches,
      is_active:    plan.is_active,
    });
    setModalOpen(true);
  };

  // ── Save (Create / Update) ───────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || form.price === '' || form.max_users === '' || form.max_branches === '') {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:        parseFloat(form.price),
        max_users:    parseInt(form.max_users),
        max_branches: parseInt(form.max_branches),
      };

      if (editingPlan) {
        await api.put(`/api/central/plans/${editingPlan.id}`, payload);
        toast.success('Plan actualizado');
      } else {
        await api.post('/api/central/plans', payload);
        toast.success('Plan creado');
      }
      setModalOpen(false);
      fetchPlans();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Error al guardar plan');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (plan) => {
    if (!confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(plan.id);
    try {
      await api.delete(`/api/central/plans/${plan.id}`);
      toast.success('Plan eliminado');
      fetchPlans();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'No se pudo eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Technical Actions ────────────────────────────────────────────
  const runAction = async (action) => {
    toast.loading('Ejecutando...', { id: 'action' });
    try {
      const res = await api.post('/api/central/health-action', { action });
      toast.success(res.data.message, { id: 'action' });
    } catch {
      toast.error('Error al ejecutar acción', { id: 'action' });
    }
  };

  const tabs = [
    { key: 'plans', label: 'Planes', icon: Crown },
    { key: 'maintenance', label: 'Mantenimiento', icon: Gear },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Ajustes Globales</h1>
          <p className="text-muted-foreground text-sm font-medium mt-0.5">Configuración central de la plataforma SaaS</p>
        </div>
        {activeTab === 'plans' && (
          <Button onClick={openCreate} className="gap-2 font-bold text-xs uppercase tracking-widest shadow-sm">
            <Plus size={16} weight="bold" /> Nuevo Plan
          </Button>
        )}
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 bg-card p-1.5 rounded-xl border border-border shadow-sm w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon size={15} weight={activeTab === key ? 'bold' : 'regular'} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Planes ── */}
      {activeTab === 'plans' && (
        <div>
          {loadingPlans ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Crown size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold text-sm">No hay planes registrados</p>
              <p className="text-xs mt-1">Crea el primer plan para empezar</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className={`shadow-sm rounded-xl border relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md ${!plan.is_active ? 'opacity-60' : ''}`}>
                  <div className={`h-1.5 w-full ${plan.is_active ? 'bg-primary' : 'bg-muted'}`} />
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{plan.description || 'Sin descripción'}</p>
                        <p className="text-xl font-black tracking-tight text-foreground mt-0.5">{plan.name}</p>
                      </div>
                      {!plan.is_active && (
                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest">Inactivo</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-3xl font-black tracking-tighter text-primary">${parseFloat(plan.price).toFixed(2)}</span>
                      <span className="text-xs font-bold text-muted-foreground">/mes</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-2 text-xs font-medium">
                        <Users size={14} className="text-primary shrink-0" weight="bold" />
                        {plan.max_users === 0 ? 'Usuarios ilimitados' : `${plan.max_users} usuarios`}
                      </li>
                      <li className="flex items-center gap-2 text-xs font-medium">
                        <Buildings size={14} className="text-primary shrink-0" weight="bold" />
                        {plan.max_branches === 0 ? 'Sucursales ilimitadas' : `${plan.max_branches} sucursales`}
                      </li>
                    </ul>
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-widest gap-1" onClick={() => openEdit(plan)}>
                        <PencilSimple size={13} weight="bold" /> Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] font-black uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleDelete(plan)}
                        disabled={deletingId === plan.id}
                      >
                        {deletingId === plan.id
                          ? <ArrowsClockwise size={13} className="animate-spin" />
                          : <Trash size={13} weight="bold" />
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Mantenimiento Técnico ── */}
      {activeTab === 'maintenance' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="shadow-sm border-border bg-card rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ArrowsClockwise size={20} className="text-amber-600" weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black tracking-tight">Limpieza de Sistema</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Borra caché de rutas, config y aplicación.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-widest" onClick={() => runAction('clear_cache')}>
                Limpiar Caché
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-widest" onClick={() => runAction('optimize')}>
                Optimizar App
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Database size={20} className="text-indigo-600" weight="bold" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black tracking-tight">Estructura de BD</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Ejecuta migraciones pendientes masivamente.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-widest" onClick={() => runAction('run_migrations')}>
                Migrar Central
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-[10px] font-black uppercase tracking-widest" onClick={() => runAction('migrate_tenants')}>
                Migrar Tenants
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Modal Crear / Editar Plan ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight">
              {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Plan *</Label>
              <Input
                placeholder="Ej. Pro, Enterprise, Básico"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-lg font-medium"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</Label>
              <Input
                placeholder="Ej. Para pequeños negocios"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="rounded-lg font-medium"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <CurrencyDollar size={12} /> Precio/mes *
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="29.99"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="rounded-lg font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Users size={12} /> Max Usuarios *
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0 = ∞"
                  value={form.max_users}
                  onChange={e => setForm(f => ({ ...f, max_users: e.target.value }))}
                  className="rounded-lg font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Buildings size={12} /> Max Sucursales *
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0 = ∞"
                  value={form.max_branches}
                  onChange={e => setForm(f => ({ ...f, max_branches: e.target.value }))}
                  className="rounded-lg font-medium"
                />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground font-medium">Ingresa 0 en Usuarios o Sucursales para configurar límites ilimitados.</p>

            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
              <div>
                <Label className="text-sm font-bold">Plan Activo</Label>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Si está inactivo no aparece en la lista de planes al renovar licencias.</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="font-bold text-xs uppercase tracking-widest">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="font-bold text-xs uppercase tracking-widest gap-2">
              {saving ? <ArrowsClockwise size={14} className="animate-spin" /> : <CheckCircle size={14} weight="bold" />}
              {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
