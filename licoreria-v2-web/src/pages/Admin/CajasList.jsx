import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Monitor, 
  Plus, 
  PencilLine, 
  Trash, 
  ArrowsClockwise, 
  Wallet,
  CheckCircle,
  XCircle
} from "@phosphor-icons/react";
import api from '@/lib/api';
import { useCurrency } from '@/hooks/useCurrency';
import PageHeader from '@/components/layout/PageHeader';

export default function CajasList() {
  const { branch } = useAuthStore();
  const { formatMoney } = useCurrency();
  const [cajas, setCajas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingCaja, setEditingCaja] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    balance_actual: 0,
    activa: true
  });

  useEffect(() => {
    if (branch?.id) fetchCajas();
  }, [branch?.id]);

  const fetchCajas = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/cajas', {
        params: { sucursal_id: branch.id }
      });
      setCajas(response.data.data || response.data);
    } catch (e) {
      toast.error('Error al cargar cajas físicas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...formData, sucursal_id: branch.id };
      if (editingCaja) {
        await api.put(`/api/cajas/${editingCaja.id}`, data);
        toast.success('Caja actualizada');
      } else {
        await api.post('/api/cajas', data);
        toast.success('Caja creada');
      }
      setIsOpen(false);
      setEditingCaja(null);
      setFormData({ nombre: '', balance_actual: 0, activa: true });
      fetchCajas();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta caja?')) return;
    try {
      await api.delete(`/api/cajas/${id}`);
      toast.success('Caja eliminada');
      fetchCajas();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al eliminar');
    }
  };

  const openEdit = (caja) => {
    setEditingCaja(caja);
    setFormData({
      nombre: caja.nombre,
      balance_actual: caja.balance_actual,
      activa: caja.activa
    });
    setIsOpen(true);
  };

  const filteredCajas = cajas.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <PageHeader 
        title="Cajas Físicas"
        subtitle="Administración de gavetas de efectivo por sucursal."
        viewMode="none"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre..."
        action={
          <Button
            onClick={() => {
              setEditingCaja(null);
              setFormData({ nombre: '', balance_actual: 0, activa: true });
              setIsOpen(true);
            }}
            className="gap-2 shadow-sm"
          >
            <Plus weight="bold" className="h-4 w-4" /> Nueva Caja
          </Button>
        }
      />

      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Estado</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Caja / Gaveta</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">Saldo Actual</TableHead>
                <TableHead className="text-right px-6 font-bold text-[10px] uppercase tracking-widest">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center text-muted-foreground">
                    <ArrowsClockwise size={24} className="animate-spin mx-auto opacity-20 mb-2" />
                    Cargando cajas...
                  </TableCell>
                </TableRow>
              ) : filteredCajas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-muted-foreground text-xs italic">
                    No hay cajas registradas en esta sucursal.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCajas.map((caja) => (
                  <TableRow key={caja.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-6 py-4">
                      {caja.activa ? (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-green-500/10 text-green-600 border-green-600/20 gap-1.5 py-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest gap-1.5 py-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"></div>
                          Inactiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
                          <Wallet size={18} weight="bold" />
                        </div>
                        <span className="font-bold">{caja.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-base tracking-tight">{formatMoney(caja.balance_actual)}</span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => openEdit(caja)}
                        >
                          <PencilLine size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDelete(caja.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCaja ? 'Editar Caja' : 'Nueva Caja Física'}</DialogTitle>
            <DialogDescription>Completa los datos para el registro de la gaveta.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre de la Caja</label>
              <Input
                placeholder="Ej. Caja Principal, Caja 2"
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Saldo Actual</label>
                <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Restringido</span>
              </div>
              <Input
                type="text"
                value={formatMoney(formData.balance_actual)}
                disabled
                className="bg-muted/50 font-bold text-primary"
              />
              <p className="text-[10px] text-muted-foreground italic">
                * El saldo se actualiza automáticamente con ventas, egresos y cierres de sesión.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Caja Activa</label>
                <p className="text-[10px] text-muted-foreground italic">Disponible para apertura y cierre</p>
              </div>
              <Switch
                checked={formData.activa}
                onCheckedChange={checked => setFormData({ ...formData, activa: checked })}
              />
            </div>
            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingCaja ? 'Guardar Cambios' : 'Registrar Caja'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
