import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Truck, Phone, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';

export default function ProveedoresList() {
  const [proveedores, setProveedores] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruc: '',
    telefono: '',
    direccion: ''
  });

  const fetchProveedores = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/proveedores', { params: { page } });
      setProveedores(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
      }
    } catch (error) {
      toast.error('Error al cargar proveedores');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProveedor) {
        await api.put(`/api/proveedores/${editingProveedor.id}`, formData);
        toast.success('Proveedor actualizado');
      } else {
        await api.post('/api/proveedores', formData);
        toast.success('Proveedor creado');
      }
      setIsDialogOpen(false);
      resetForm();
      fetchProveedores();
    } catch (error) {
      toast.error('Error al guardar el proveedor');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', ruc: '', telefono: '', direccion: '' });
    setEditingProveedor(null);
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      ruc: proveedor.ruc || '',
      telefono: proveedor.telefono || '',
      direccion: proveedor.direccion || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await api.delete(`/api/proveedores/${id}`);
      toast.success('Proveedor eliminado');
      fetchProveedores();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar el proveedor');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Socios Comerciales</h1>
          <p className="text-slate-500 text-xs font-medium mt-1">Gestión de proveedores y cadenas de abastecimiento.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-slate-50 text-slate-400"
            onClick={() => fetchProveedores()}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Can permission="crear.proveedor">
            <Button
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-[10px] h-10 px-6 shadow-lg shadow-slate-200 transition-all active:scale-95"
              onClick={() => { resetForm(); setIsDialogOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
            </Button>
          </Can>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-none">
              <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 pl-10">Entidad / Razón Social</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">RUC / Registro</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Contacto Directo</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6">Ubicación</TableHead>
              <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] py-6 text-right pr-10">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-50">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-80 text-center">
                  <RefreshCcw className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-100" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Sincronizando Proveedores...</p>
                </TableCell>
              </TableRow>
            ) : proveedores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-80 text-center">
                  <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 opacity-40">
                    <Truck size={40} className="text-slate-300" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No se encontraron registros activos</p>
                </TableCell>
              </TableRow>
            ) : (
              proveedores.map((prov) => (
                <TableRow key={prov.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                  <TableCell className="py-6 pl-10">
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                        <Truck size={24} weight="duotone" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-slate-900 text-sm uppercase tracking-tight">{prov.nombre}</span>
                        <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">PROV-ID: {prov.id.toString().padStart(3, '0')}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold text-slate-500">{prov.ruc || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{prov.telefono || 'SIN CONTACTO'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {prov.direccion || 'DIRECCIÓN NO DISPONIBLE'}
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <Can permission="editar.proveedor">
                        <Button
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md text-slate-400 hover:text-slate-900"
                          onClick={() => handleEdit(prov)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Can>
                      <Can permission="eliminar.proveedor">
                        <Button
                          variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          onClick={() => handleDelete(prov.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
          <DataPagination meta={meta} onPageChange={fetchProveedores} />
        </div>
      </div>

      {/* Modal de Registro/Edición */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white max-w-lg">
          <div className="bg-slate-900 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-4 -translate-y-4">
              <Truck size={120} weight="fill" className="text-white" />
            </div>
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight">
                {editingProveedor ? 'Modificar Registro' : 'Nuevo Socio'}
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mt-2">
                Ficha maestra de proveedor del negocio
              </DialogDescription>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Razón Social</label>
              <Input
                placeholder="Ej. DISTRIBUIDORA CENTRAL S.A."
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-slate-900 font-bold uppercase transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">RUC / ID TRIBUTARIO</label>
                <Input
                  placeholder="000-000-000"
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-slate-900 font-bold uppercase transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Teléfono Directo</label>
                <Input
                  placeholder="555-0000"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-slate-900 font-bold uppercase transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Dirección Operativa</label>
              <Input
                placeholder="Calle comercial #123"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-slate-900 font-bold uppercase transition-all"
              />
            </div>
            <div className="pt-4 grid grid-cols-2 gap-4">
              <Button type="button" variant="ghost" className="h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-slate-100 active:scale-95 transition-all">
                {editingProveedor ? 'Actualizar Ficha' : 'Vincular Socio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
