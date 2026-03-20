import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Monitor, CheckCircle, XCircle } from 'lucide-react';
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Cajas Físicas"
        subtitle="Gestión de gavetas de dinero"
        icon={Monitor}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre..."
        action={
          <Button
            className="rounded-sm"
            onClick={() => {
              setEditingCaja(null);
              setFormData({ nombre: '', balance_actual: 0, activa: true });
              setIsOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Caja
          </Button>
        }
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
              <DialogTitle>{editingCaja ? 'Editar Caja' : 'Nueva Caja Física'}</DialogTitle>
              <CardDescription>Completa los datos para el registro.</CardDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nombre de la Caja</label>
                <Input
                  placeholder="Ej. Caja Principal, Caja 2"
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Saldo Inicial / Actual</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balance_actual}
                  onChange={e => setFormData({ ...formData, balance_actual: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={e => setFormData({ ...formData, activa: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="activa" className="text-sm font-medium text-slate-700">Caja Activa (Disponible para check-in)</label>
              </div>
              <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
                <Button type="button" variant="ghost" className="text-slate-500" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit" className="min-w-[120px] rounded-sm">
                  {editingCaja ? 'Guardar Cambios' : 'Registrar Caja'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden mt-6">
        <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-4 px-6">Estado</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Saldo Actual</TableHead>
              <TableHead className="text-right px-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium">Cargando cajas...</TableCell>
              </TableRow>
            ) : filteredCajas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500 font-medium">No hay cajas registradas.</TableCell>
              </TableRow>
            ) : filteredCajas.map((caja) => (
              <TableRow key={caja.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                <TableCell className="pl-8">
                  {caja.activa ? (
                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-3 py-1 rounded-sm gap-1.5 shadow-none">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Activa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-400 hover:bg-slate-100 border-none px-3 py-1 rounded-sm gap-1.5 shadow-none">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400"></div>
                      Inactiva
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-sm bg-primary/5 text-primary flex items-center justify-center border border-primary/10 transition-colors">
                      <Monitor size={18} />
                    </div>
                    <span className="font-bold text-slate-900">{caja.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="font-black text-slate-900 tracking-tight">
                  {formatMoney(caja.balance_actual)}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-slate-400 hover:text-black hover:bg-slate-100"
                      onClick={() => openEdit(caja)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => handleDelete(caja.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  );
}
