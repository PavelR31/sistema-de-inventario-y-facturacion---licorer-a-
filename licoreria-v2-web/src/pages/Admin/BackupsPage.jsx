import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  HardDrives,
  UploadSimple,
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
} from "@phosphor-icons/react";
import { toast } from 'sonner';
import api from '@/lib/api';
import PageHeader from '@/components/layout/PageHeader';

export default function BackupsPage() {
  const fileInputRef = useRef(null);
  const [backups, setBackups] = useState([]);
  const [totalSize, setTotalSize] = useState('0 B');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, path: null, filename: null });

  useEffect(() => { fetchBackups(); }, []);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/backups');
      setBackups(res.data.backups || []);
      setTotalSize(res.data.total_size || '0 B');
    } catch (e) {
      toast.error('Error al cargar los respaldos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip') && !file.name.endsWith('.sql')) {
      toast.error('Solo se permiten archivos ZIP o SQL');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await api.post('/api/backups/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Archivo subido correctamente');
      fetchBackups();
      
      // Auto-trigger restore dialog for the uploaded file
      setConfirmDialog({ 
        open: true, 
        type: 'restore', 
        path: res.data.path, 
        filename: res.data.filename 
      });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setConfirmDialog({ open: false });
    try {
      await api.post('/api/backups');
      toast.success('Respaldo creado exitosamente');
      fetchBackups();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al crear el respaldo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (path, filename) => {
    try {
      const res = await api.post('/api/backups/download', { path }, { responseType: 'blob' });
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
      await api.delete('/api/backups', { data: { path } });
      toast.success('Respaldo eliminado');
      fetchBackups();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const handleRestore = async (path) => {
    setIsRestoring(path);
    setConfirmDialog({ open: false });
    try {
      const res = await api.post('/api/backups/restore', { path });
      toast.success(res.data.message || 'Respaldo restaurado exitosamente');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al restaurar');
    } finally {
      setIsRestoring(null);
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
          <h1 className="text-3xl font-black tracking-tight text-foreground">Respaldos</h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70">Copias de seguridad de tu base de datos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchBackups} disabled={isLoading} variant="outline" size="sm" className="h-9 px-3 border-border bg-card hover:bg-muted rounded-sm">
            <ArrowsClockwise size={14} className={isLoading ? 'animate-spin' : ''} weight="bold" />
          </Button>
          <input 
            type="file" 
            accept=".zip,.sql" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="h-9 px-4 rounded-sm gap-2 text-xs font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20"
          >
            {isUploading ? <ArrowsClockwise size={14} className="animate-spin" weight="bold" /> : <ArrowCounterClockwise size={14} weight="bold" />}
            Restaurar desde ZIP
          </Button>
          <Button
            onClick={() => setConfirmDialog({ open: true, type: 'create' })}
            disabled={isCreating}
            className="h-9 px-4 rounded-sm gap-2 text-xs font-bold uppercase tracking-wider"
          >
            {isCreating ? <ArrowsClockwise size={14} className="animate-spin" weight="bold" /> : <Plus size={14} weight="bold" />}
            Crear Respaldo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border shadow-sm bg-card overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Estado</span>
            <div className={`p-2 rounded-sm ${last ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
              {last ? <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" weight="duotone" /> : <WarningCircle size={18} className="text-amber-600 dark:text-amber-400" weight="duotone" />}
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className={`text-xl font-black tracking-tight leading-none mb-1 ${last ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {last ? 'Protegido' : 'Sin respaldos'}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">
              {last ? timeSince(last.created_at) : 'Crea tu primer respaldo'}
            </span>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Último Respaldo</span>
            <div className="p-2 rounded-sm bg-primary/10">
              <Clock size={18} className="text-primary" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-xl font-black tracking-tight text-foreground leading-none mb-1">
              {last ? timeSince(last.created_at) : '—'}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">
              {last ? formatDate(last.created_at) : 'Sin datos'}
            </span>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-card overflow-hidden hover:shadow-md transition-all duration-300 rounded-sm group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Almacenamiento</span>
            <div className="p-2 rounded-sm bg-violet-500/10">
              <Database size={18} className="text-violet-600 dark:text-violet-400" weight="duotone" />
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="text-xl font-black tracking-tight text-foreground leading-none mb-1">{totalSize}</div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-60">
              {backups.length} archivo{backups.length !== 1 ? 's' : ''}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Backups Table */}
      <Card className="border shadow-sm bg-card overflow-hidden rounded-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 px-6 pt-6">
          <div>
            <h2 className="text-base font-bold text-foreground">Historial de Respaldos</h2>
            <p className="text-xs text-muted-foreground font-medium">Archivos disponibles para descarga y restauración.</p>
          </div>
          <Badge className="bg-muted text-muted-foreground border-none font-bold text-[10px] rounded-sm">{backups.length} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center">
              <ArrowsClockwise className="h-6 w-6 animate-spin mx-auto mb-2 text-muted" weight="bold" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-16 text-center">
              <CloudArrowUp size={40} className="text-muted mx-auto mb-3" weight="duotone" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sin respaldos</p>
              <p className="text-xs font-medium text-muted-foreground">Crea tu primer respaldo para proteger los datos de tu negocio.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Archivo</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tamaño</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fecha</th>
                    <th className="h-10 px-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.path} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                            <FileZip size={16} weight="duotone" />
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{b.filename}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">{b.size_human}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-medium text-foreground/80">{formatDate(b.created_at)}</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{timeSince(b.created_at)}</p>
                        </div>
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

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent aria-describedby={undefined} className="border border-border shadow-xl rounded-sm p-6 bg-card">
          <DialogHeader>
            <DialogTitle className={
              confirmDialog.type === 'delete' ? 'text-destructive' :
              confirmDialog.type === 'restore' ? 'text-amber-600' : ''
            }>
              {confirmDialog.type === 'create' && '¿Crear un nuevo respaldo?'}
              {confirmDialog.type === 'delete' && '¿Eliminar este respaldo?'}
              {confirmDialog.type === 'restore' && '¿Restaurar este respaldo?'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'create' && 'Se creará una copia completa de la base de datos. Este proceso puede tardar unos segundos.'}
              {confirmDialog.type === 'delete' && (
                <>Se eliminará permanentemente <span className="font-bold text-foreground">{confirmDialog.filename}</span>. Esta acción no se puede deshacer.</>
              )}
              {confirmDialog.type === 'restore' && (
                <>
                  Se restaurará <span className="font-bold text-foreground">{confirmDialog.filename}</span>.
                  <span className="block mt-2 text-yellow-600 font-semibold">⚠ Esto reemplazará TODOS los datos actuales con los del respaldo. Los cambios realizados después de esta copia se perderán.</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDialog({ open: false })} className="rounded-sm">Cancelar</Button>
            {confirmDialog.type === 'create' && (
              <Button onClick={handleCreate} className="rounded-sm">Crear Respaldo</Button>
            )}
            {confirmDialog.type === 'delete' && (
              <Button variant="destructive" onClick={() => handleDelete(confirmDialog.path)} className="rounded-sm">Eliminar</Button>
            )}
            {confirmDialog.type === 'restore' && (
              <Button onClick={() => handleRestore(confirmDialog.path)} className="rounded-sm bg-yellow-600 hover:bg-yellow-700 text-white">
                Restaurar Base de Datos
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
