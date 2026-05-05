import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  HardDrives,
  DownloadSimple,
  Trash,
  Plus,
  Clock,
  Database,
  CloudArrowUp,
  CheckCircle,
  WarningCircle,
  FileZip,
  ArrowsClockwise,
  ArrowCounterClockwise,
  Broom,
  Heartbeat,
  Buildings,
} from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';

export default function CentralBackups() {
  const [backups, setBackups] = useState([]);
  const [totalSize, setTotalSize] = useState('0 B');
  const [health, setHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);
  const fileInputRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, path: null, filename: null });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [bRes, hRes] = await Promise.allSettled([
        api.get('/api/central/backups'),
        api.get('/api/central/backups/health'),
      ]);
      if (bRes.status === 'fulfilled') {
        setBackups(bRes.value.data.backups || []);
        setTotalSize(bRes.value.data.total_size || '0 B');
      }
      if (hRes.status === 'fulfilled') setHealth(hRes.value.data);
    } catch (e) {
      toast.error('Error al cargar backups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (full = false) => {
    setIsCreating(true);
    setConfirmDialog({ open: false });
    try {
      const body = full ? { full: true } : { only_db: true };
      const res = await api.post('/api/central/backups', body);
      toast.success(res.data.message || 'Backup creado');
      if (res.data.errors?.length > 0) res.data.errors.forEach(e => toast.warning(e));
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al crear backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (path, filename) => {
    try {
      const res = await api.post('/api/central/backups/download', { path }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Error al descargar');
    }
  };

  const handleDelete = async (path) => {
    setConfirmDialog({ open: false });
    try {
      await api.delete('/api/central/backups', { data: { path } });
      toast.success('Backup eliminado');
      fetchAll();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      await api.post('/api/central/backups/cleanup');
      toast.success('Limpieza completada');
      fetchAll();
    } catch (e) {
      toast.error('Error en la limpieza');
    } finally {
      setIsCleaning(false);
    }
  };

  const fetchTenantsList = async () => {
    if (tenants.length === 0) {
      try {
        const res = await api.get('/api/central/tenants');
        setTenants(res.data.data || res.data);
      } catch (e) {
        toast.error('Error al cargar licorerías');
      }
    }
  };

  const openRestoreDialog = () => {
    setConfirmDialog({ open: true, type: 'restore_tenant' });
    setSelectedTenant('');
    setRestoreFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchTenantsList();
  };

  const openCreateTenantBackupDialog = () => {
    setConfirmDialog({ open: true, type: 'create_tenant_backup' });
    setSelectedTenant('');
    fetchTenantsList();
  };

  const handleCreateTenantBackup = async () => {
    if (!selectedTenant) {
      toast.warning('Selecciona una licorería.');
      return;
    }
    setIsCreating(true);
    setConfirmDialog({ open: false });
    try {
      const res = await api.post('/api/central/backups/tenant', { tenant_id: selectedTenant }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers['content-disposition'];
      let filename = `backup_${selectedTenant}.zip`;
      if (disposition && disposition.indexOf('filename="') !== -1) {
          filename = disposition.split('filename="')[1].split('"')[0];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup individual descargado correctamente.');
    } catch (e) {
      toast.error('Error al descargar backup individual.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreTenant = async () => {
    if (!selectedTenant || !restoreFile) {
      toast.warning('Selecciona una licorería y un archivo ZIP o SQL.');
      return;
    }
    const formData = new FormData();
    formData.append('tenant_id', selectedTenant);
    formData.append('file', restoreFile);

    setIsRestoring(true);
    try {
      const res = await api.post('/api/central/backups/restore-tenant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Licorería restaurada exitosamente.');
      setConfirmDialog({ open: false });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al restaurar.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const timeSince = (d) => {
    if (!d) return 'Nunca';
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h >= 24) return `Hace ${Math.floor(h / 24)}d`;
    if (h > 0) return `Hace ${h}h`;
    return 'Reciente';
  };

  const last = backups[0] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Respaldos Globales</h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70">Sistema central + todas las licorerías</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAll} disabled={isLoading} variant="outline" size="sm" className="h-9 px-3 border-slate-200 bg-white rounded-sm">
            <ArrowsClockwise size={14} className={isLoading ? 'animate-spin' : ''} weight="bold" />
          </Button>
          <Button onClick={handleCleanup} disabled={isCleaning} variant="outline" size="sm" className="h-9 px-3 border-slate-200 bg-white rounded-sm gap-2 text-xs font-bold uppercase tracking-wider">
            {isCleaning ? <ArrowsClockwise size={14} className="animate-spin" weight="bold" /> : <Broom size={14} weight="bold" />}
            Limpiar
          </Button>
          <Button onClick={openRestoreDialog} disabled={isCreating} className="h-9 px-4 rounded-sm gap-2 text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 border border-amber-200">
            <ArrowCounterClockwise size={14} weight="bold" />
            Restaurar Licorería
          </Button>
          <Button onClick={() => setConfirmDialog({ open: true, type: 'create' })} disabled={isCreating} className="h-9 px-4 rounded-sm gap-2 text-xs font-bold uppercase tracking-wider">
            {isCreating ? <ArrowsClockwise size={14} className="animate-spin" weight="bold" /> : <Plus size={14} weight="bold" />}
            Crear Backup
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Salud</span>
            <div className={`p-2 rounded-sm ${health?.status === 'ok' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              <Heartbeat size={18} className={health?.status === 'ok' ? 'text-emerald-600' : 'text-amber-600'} weight="duotone" />
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className={`text-xl font-black tracking-tight leading-none mb-1 ${health?.status === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {health?.status === 'ok' ? 'Saludable' : 'Verificar'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Último Backup</span>
            <div className="p-2 rounded-sm bg-primary/10"><Clock size={18} className="text-primary" weight="duotone" /></div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">{last ? timeSince(last.created_at) : '—'}</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">{last ? formatDate(last.created_at) : 'Sin datos'}</span>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Almacenamiento</span>
            <div className="p-2 rounded-sm bg-violet-500/10"><Database size={18} className="text-violet-600" weight="duotone" /></div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">{totalSize}</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">{backups.length} archivos</span>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Backups Completos</span>
            <div className="p-2 rounded-sm bg-sky-500/10"><Buildings size={18} className="text-sky-600" weight="duotone" /></div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-xl font-black tracking-tight text-slate-900 leading-none mb-1">{backups.filter(b => b.type === 'full').length}</div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">Central + tenants</span>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-4 px-6 pt-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Historial de Backups</h2>
            <p className="text-xs text-slate-500 font-medium">Respaldos del sistema central y completos.</p>
          </div>
          <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] rounded-sm">{backups.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center">
              <ArrowsClockwise className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-200" weight="bold" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Cargando...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-16 text-center">
              <CloudArrowUp size={40} className="text-slate-100 mx-auto mb-3" weight="duotone" />
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1">Sin respaldos</p>
              <p className="text-xs font-medium text-slate-400">Crea un backup para proteger el sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/30">
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Archivo</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tamaño</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400">Fecha</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.path} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-primary/5 flex items-center justify-center text-primary">
                            <FileZip size={16} weight="duotone" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 truncate max-w-[220px]">{b.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm ${b.type === 'full' ? 'text-violet-600 bg-violet-50' : 'text-primary bg-primary/5'}`}>
                          {b.type === 'full' ? 'Completo' : 'Central'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-500">{b.size_human}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-slate-600">{formatDate(b.created_at)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{timeSince(b.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:text-primary hover:bg-primary/5 rounded-sm"
                            onClick={() => handleDownload(b.path, b.filename)}>
                            <DownloadSimple size={14} weight="bold" className="mr-1" /> Descargar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 rounded-sm"
                            onClick={() => setConfirmDialog({ open: true, type: 'delete', path: b.path, filename: b.filename })}>
                            <Trash size={14} weight="bold" className="mr-1" /> Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog({ ...confirmDialog, open: o })}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'create' && 'Crear Backup'}
              {confirmDialog.type === 'delete' && 'Eliminar Backup'}
              {confirmDialog.type === 'restore_tenant' && 'Restaurar Licorería'}
              {confirmDialog.type === 'create_tenant_backup' && 'Backup Individual'}
            </DialogTitle>
            {confirmDialog.type === 'create' && (
              <DialogDescription>Selecciona el tipo de respaldo que deseas crear.</DialogDescription>
            )}
            {confirmDialog.type === 'delete' && (
              <DialogDescription>
                Se eliminará permanentemente <span className="font-bold text-slate-800">{confirmDialog.filename}</span>. Esta acción no se puede deshacer.
              </DialogDescription>
            )}
            {confirmDialog.type === 'restore_tenant' && (
              <DialogDescription>Restaura los datos de una licorería desde un archivo .zip o .sql</DialogDescription>
            )}
            {confirmDialog.type === 'create_tenant_backup' && (
              <DialogDescription>Selecciona la licorería para generar y descargar su respaldo.</DialogDescription>
            )}
          </DialogHeader>

          {confirmDialog.type === 'create' && (
            <div className="space-y-2 py-2">
              <Button variant="outline" className="w-full justify-start h-12 rounded-sm gap-3 text-left" onClick={() => handleCreate(false)}>
                <Database size={18} weight="duotone" className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold">Solo BD Central</p>
                  <p className="text-[10px] text-slate-400">Rápido — solo la base de datos principal</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 rounded-sm gap-3 text-left" onClick={() => handleCreate(true)}>
                <Buildings size={18} weight="duotone" className="text-violet-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Backup Completo</p>
                  <p className="text-[10px] text-slate-400">Central + todas las BDs de licorerías</p>
                </div>
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 rounded-sm gap-3 text-left" onClick={openCreateTenantBackupDialog}>
                <Database size={18} weight="duotone" className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Backup Individual (Licorería)</p>
                  <p className="text-[10px] text-slate-400">Descarga un respaldo en ZIP de un tenant específico</p>
                </div>
              </Button>
            </div>
          )}

          {confirmDialog.type === 'delete' && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirmDialog({ open: false })} className="rounded-sm">Cancelar</Button>
              <Button variant="destructive" onClick={() => handleDelete(confirmDialog.path)} className="rounded-sm">Eliminar</Button>
            </DialogFooter>
          )}

          {confirmDialog.type === 'restore_tenant' && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Licorería a restaurar</label>
                <select 
                  className="w-full text-sm rounded-sm border-slate-200 h-9 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all border"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                >
                  <option value="">Selecciona una licorería...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Archivo de respaldo (ZIP o SQL)</label>
                <input 
                  type="file" 
                  accept=".zip,.sql"
                  ref={fileInputRef}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  onChange={(e) => setRestoreFile(e.target.files[0])}
                />
              </div>
              <div className="p-3 bg-amber-50 rounded-sm border border-amber-200 flex gap-2 items-start mt-2">
                <WarningCircle size={16} className="text-amber-600 shrink-0 mt-0.5" weight="fill" />
                <p className="text-xs text-amber-800 leading-tight">
                  <strong className="block mb-1">¡Advertencia crítica!</strong>
                  Esto sobreescribirá todos los datos de la licorería seleccionada con el contenido del respaldo. Esta acción es irreversible.
                </p>
              </div>
              <DialogFooter className="mt-4 border-t border-slate-50 pt-4">
                <Button variant="ghost" onClick={() => setConfirmDialog({ open: false })} className="rounded-sm" disabled={isRestoring}>Cancelar</Button>
                <Button variant="destructive" className="bg-amber-600 hover:bg-amber-700 text-white rounded-sm" onClick={handleRestoreTenant} disabled={isRestoring || !selectedTenant || !restoreFile}>
                  {isRestoring ? <ArrowsClockwise size={14} className="animate-spin mr-2" /> : <ArrowCounterClockwise size={14} className="mr-2" />}
                  Restaurar Datos
                </Button>
              </DialogFooter>
            </div>
          )}

          {confirmDialog.type === 'create_tenant_backup' && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Licorería a respaldar</label>
                <select 
                  className="w-full text-sm rounded-sm border-slate-200 h-9 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all border"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                >
                  <option value="">Selecciona una licorería...</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                  ))}
                </select>
              </div>
              <DialogFooter className="mt-4 border-t border-slate-50 pt-4">
                <Button variant="ghost" onClick={() => setConfirmDialog({ open: false })} className="rounded-sm" disabled={isCreating}>Cancelar</Button>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-sm" onClick={handleCreateTenantBackup} disabled={isCreating || !selectedTenant}>
                  {isCreating ? <ArrowsClockwise size={14} className="animate-spin mr-2" /> : <DownloadSimple size={14} className="mr-2" />}
                  Descargar Respaldo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
