import { useEffect, useState, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Search, Tag, DollarSign, Layers, ImageIcon, ImagePlus, Trash2, Pencil, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';

export default function ProductosList() {
  const [productos, setProductos] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [categorias, setCategorias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', precio: '', categoria_id: '', codigo: '', imagen: null });
  const [editingProducto, setEditingProducto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const fileInputRef = useRef(null);

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/api/productos', { params: { page, search: searchTerm } }),
        api.get('/api/categorias', { params: { per_page: 100 } })
      ]);
      setProductos(prodRes.data.data ?? prodRes.data);
      if (prodRes.data.last_page) {
        setMeta({
          current_page: prodRes.data.current_page,
          last_page: prodRes.data.last_page,
          total: prodRes.data.total
        });
      }
      setCategorias(catRes.data.data ?? catRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imagen: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditingProducto({ ...editingProducto, nueva_imagen: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('nombre', formData.nombre);
    data.append('codigo', formData.codigo);
    data.append('precio', formData.precio);
    if (formData.categoria_id) data.append('categoria_id', formData.categoria_id);
    if (formData.imagen) data.append('imagen', formData.imagen);

    try {
      await api.post('/api/productos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Producto guardado');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Error al guardar producto');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', descripcion: '', precio: '', categoria_id: '', codigo: '', imagen: null });
    setImagePreview(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Laravel a veces tiene problemas con PUT y multipart/form-data, usamos POST con _method
    const data = new FormData();
    data.append('_method', 'PUT');
    data.append('nombre', editingProducto.nombre);
    data.append('codigo', editingProducto.codigo || '');
    data.append('precio', editingProducto.precio);
    if (editingProducto.categoria_id) data.append('categoria_id', editingProducto.categoria_id);
    if (editingProducto.nueva_imagen) data.append('imagen', editingProducto.nueva_imagen);

    try {
      await api.post(`/api/productos/${editingProducto.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Producto actualizado');
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar producto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
      await api.delete(`/api/productos/${id}`);
      toast.success('Producto eliminado');
      fetchData();
    } catch (error) {
      toast.error('No se pudo eliminar el producto');
    }
  };

  const openEdit = (producto) => {
    setEditingProducto({ 
      ...producto, 
      categoria_id: producto.categoria_id?.toString() || '' 
    });
    setImagePreview(producto.imagen_url);
    setIsEditOpen(true);
  };

  const filteredProducts = productos.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.codigo?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Catálogo</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus productos globales y categorías del negocio.</p>
        </div>
        <div className="flex gap-2">
          <Can permission="crear.producto">
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Detalles del Producto</DialogTitle>
                <DialogDescription>Añade un nuevo producto al catálogo global de tu negocio.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2 flex justify-center pb-2">
                  <div 
                    className="relative h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-slate-50"
                    onClick={() => fileInputRef.current.click()}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <ImagePlus className="h-8 w-8" />
                        <span className="text-[10px] font-medium">Subir Imagen</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Nombre</label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Código / EAN</label>
                  <Input value={formData.codigo} onChange={(e) => setFormData({...formData, codigo: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Precio Venta</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" type="number" step="0.01" value={formData.precio} onChange={(e) => setFormData({...formData, precio: e.target.value})} required />
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Categoría</label>
                  <Select onValueChange={(v) => setFormData({...formData, categoria_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="col-span-2 pt-4">
                  <Button type="submit" className="w-full">Guardar Producto</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </Can>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, código o SKU..." 
            className="pl-9 bg-slate-50 border-none shadow-none h-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border">
          <Button 
            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3 gap-2 text-xs font-bold uppercase transition-all"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" /> Lista
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="h-8 px-3 gap-2 text-xs font-bold uppercase transition-all"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" /> Cuadrícula
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card className="shadow-sm border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[350px] py-4">Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Código / SKU</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Stock Global</TableHead>
                    <TableHead className="text-right px-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20">Cargando catálogo...</TableCell></TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No se encontraron productos.</TableCell></TableRow>
                  ) : filteredProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-100 h-10 w-10 shrink-0 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} className="h-full w-full object-cover" alt={p.nombre} />
                            ) : (
                              <Package className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{p.nombre}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">SKU: {p.id}00X</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {p.categoria?.nombre || 'Sin Categoría'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium text-slate-500">{p.codigo || 'S/C'}</TableCell>
                      <TableCell className="font-bold text-slate-900">${p.precio}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 w-1.5 rounded-full ${p.stock_total > 10 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                           <span className="text-sm font-medium">{p.stock_total || 0} u.</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Can permission="editar.producto">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.producto">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DataPagination meta={meta} onPageChange={fetchData} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                 [...Array(8)].map((_, i) => (
                    <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                 ))
              ) : filteredProducts.length === 0 ? (
                 <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                    <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No se encontraron productos en la vista de cuadrícula.</p>
                 </div>
              ) : filteredProducts.map(p => (
                 <Card key={p.id} className="group overflow-hidden border-slate-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                    <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
                       {p.imagen_url ? (
                          <img src={p.imagen_url} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" alt={p.nombre} />
                       ) : (
                          <Package className="h-16 w-16 text-slate-200 group-hover:scale-110 transition-transform duration-500" />
                       )}
                       <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <span className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm border border-slate-100">
                             ${p.precio}
                          </span>
                       </div>
                    </div>
                    <CardContent className="p-4">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <p className="text-[10px] font-bold text-primary uppercase mb-1">{p.categoria?.nombre || 'General'}</p>
                             <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{p.nombre}</h3>
                          </div>
                       </div>
                       <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                             <Layers className="h-3.5 w-3.5 text-slate-400" />
                             <span className="text-xs font-bold text-slate-500">{p.stock_total || 0} en stock</span>
                          </div>
                          <div className="flex gap-1">
                             <Can permission="editar.producto">
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}>
                                   <Pencil className="h-3.5 w-3.5" />
                                </Button>
                             </Can>
                             <Can permission="eliminar.producto">
                                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(p.id)}>
                                   <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                             </Can>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
              ))}
           </div>
           <DataPagination meta={meta} onPageChange={fetchData} />
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 flex justify-center pb-2">
                <div 
                  className="relative h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden bg-slate-50"
                  onClick={() => fileInputRef.current.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleEditImageChange} />
                </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Nombre</label>
              <Input 
                value={editingProducto?.nombre || ''} 
                onChange={(e) => setEditingProducto({...editingProducto, nombre: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Código / EAN</label>
              <Input 
                value={editingProducto?.codigo || ''} 
                onChange={(e) => setEditingProducto({...editingProducto, codigo: e.target.value})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Precio Venta</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9" 
                  type="number" 
                  step="0.01" 
                  value={editingProducto?.precio || ''} 
                  onChange={(e) => setEditingProducto({...editingProducto, precio: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Categoría</label>
              <Select 
                value={editingProducto?.categoria_id || ''} 
                onValueChange={(v) => setEditingProducto({...editingProducto, categoria_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="col-span-2 pt-4">
              <Button type="submit" className="w-full">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
