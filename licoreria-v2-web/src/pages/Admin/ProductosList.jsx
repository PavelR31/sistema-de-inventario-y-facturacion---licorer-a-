import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
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
import PageHeader from '@/components/layout/PageHeader';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Catálogo de Productos"
        subtitle="Gestión global de inventario"
        icon={Package}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o código..."
        action={
          <Can permission="crear.producto">
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-sm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
            </Button>
          </Can>
        }
      />

      {viewMode === 'table' ? (
        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[350px] py-4 px-6 font-semibold text-slate-800">Producto</TableHead>
                    <TableHead className="font-semibold text-slate-800">Categoría</TableHead>
                    <TableHead className="font-semibold text-slate-800">Código</TableHead>
                    <TableHead className="font-semibold text-slate-800">Precio</TableHead>
                    <TableHead className="font-semibold text-slate-800">Stock</TableHead>
                    <TableHead className="text-right px-6 font-semibold text-slate-800">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 animate-pulse rounded"></div></TableCell>
                        <TableCell><div className="h-4 w-24 bg-slate-100 animate-pulse rounded"></div></TableCell>
                        <TableCell><div className="h-4 w-20 bg-slate-100 animate-pulse rounded"></div></TableCell>
                        <TableCell><div className="h-4 w-16 bg-slate-100 animate-pulse rounded"></div></TableCell>
                        <TableCell><div className="h-4 w-12 bg-slate-100 animate-pulse rounded"></div></TableCell>
                        <TableCell className="text-right px-6"><div className="h-8 w-20 bg-slate-100 animate-pulse rounded ml-auto"></div></TableCell>
                      </TableRow>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                        No se encontraron productos
                      </TableCell>
                    </TableRow>
                  ) : filteredProducts.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-white h-10 w-10 shrink-0 rounded-sm flex items-center justify-center border border-slate-100 overflow-hidden">
                            {p.imagen_url ? (
                              <img src={p.imagen_url} className="h-full w-full object-cover" alt={p.nombre} />
                            ) : (
                              <Package size={18} className="text-slate-300" weight="duotone" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">{p.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">REF: {p.id}00X</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold border-none">
                          {p.categoria?.nombre || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium text-slate-500">{p.codigo || '--'}</TableCell>
                      <TableCell className="font-bold text-slate-800">${p.precio}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className={`h-1.5 w-1.5 rounded-full ${p.stock_total > 5 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                           <span className="text-xs font-bold text-slate-600">{p.stock_total || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Can permission="editar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} className="text-slate-400 hover:text-black hover:bg-slate-100">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(p.id)} className="text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </Can>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {meta.last_page > 1 && (
              <div className="py-4 border-t border-slate-50 flex justify-center">
                <DataPagination meta={meta} onPageChange={fetchData} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                 [...Array(8)].map((_, i) => (
                    <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                 ))
              ) : filteredProducts.length === 0 ? (
                 <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-200">
                    <Package className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No se encontraron productos</p>
                 </div>
              ) : filteredProducts.map(p => (
                 <Card key={p.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-white">
                    <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
                       {p.imagen_url ? (
                          <img src={p.imagen_url} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" alt={p.nombre} />
                       ) : (
                          <Package size={48} className="text-slate-200 group-hover:scale-110 transition-transform duration-500" weight="duotone" />
                       )}
                       <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border border-slate-100 text-slate-800">
                             ${p.precio}
                          </span>
                       </div>
                    </div>
                    <CardContent className="p-4">
                       <div className="flex justify-between items-start mb-2">
                          <div>
                             <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 opacity-80">{p.categoria?.nombre || 'General'}</p>
                             <h3 className="font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">{p.nombre}</h3>
                          </div>
                       </div>
                       <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md">
                             <Layers size={14} className="text-slate-400" weight="duotone" />
                             <span className="text-[11px] font-bold text-slate-500">{p.stock_total || 0} u.</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                             <Can permission="editar.producto">
                                <Button variant="secondary" size="icon-sm" className="h-8 w-8 rounded-sm bg-slate-100 hover:bg-black hover:text-white" onClick={() => openEdit(p)}>
                                   <Pencil className="w-4 h-4" />
                                </Button>
                             </Can>
                             <Can permission="eliminar.producto">
                                <Button variant="secondary" size="icon-sm" className="h-8 w-8 rounded-sm bg-slate-100 hover:bg-rose-50 hover:text-rose-600" onClick={() => handleDelete(p.id)}>
                                   <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                             </Can>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
              ))}
           </div>
           {meta.last_page > 1 && (
             <div className="flex justify-center">
               <DataPagination meta={meta} onPageChange={fetchData} />
             </div>
           )}
        </div>
      )}

      {/* Dialog: Nuevo Producto */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Nuevo Producto</DialogTitle>
            <DialogDescription className="text-slate-500">Añade un nuevo producto al catálogo global.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="flex justify-center pb-2">
              <div 
                className="relative h-28 w-28 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden bg-slate-50 group"
                onClick={() => fileInputRef.current.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                    <ImagePlus size={32} weight="duotone" />
                    <span className="text-[10px] font-bold uppercase mt-1">Imagen</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre del Producto</label>
                <Input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej. Tequila Herradura 750ml"
                  required 
                  className="bg-slate-50/50 border-slate-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Código / EAN</label>
                  <Input 
                    value={formData.codigo} 
                    onChange={(e) => setFormData({...formData, codigo: e.target.value})} 
                    placeholder="750123456789"
                    className="bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Precio Venta</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <Input 
                      className="pl-9 bg-slate-50/50 border-slate-200" 
                      type="number" 
                      step="0.01" 
                      value={formData.precio} 
                      onChange={(e) => setFormData({...formData, precio: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Categoría</label>
                <Select onValueChange={(v) => setFormData({...formData, categoria_id: v})}>
                  <SelectTrigger className="w-full bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] shadow-lg shadow-primary/20">
                Guardar Producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Producto */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-800">Editar Producto</DialogTitle>
            <DialogDescription className="text-slate-500">Modifica los detalles del producto en el catálogo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-5 pt-4">
            <div className="flex justify-center pb-2">
                <div 
                  className="relative h-28 w-28 rounded-sm border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden bg-slate-50 group"
                  onClick={() => fileInputRef.current.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                      <ImageIcon size={32} weight="duotone" />
                      <span className="text-[10px] font-bold uppercase mt-1">Cambiar</span>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleEditImageChange} />
                </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nombre del Producto</label>
                <Input 
                  value={editingProducto?.nombre || ''} 
                  onChange={(e) => setEditingProducto({...editingProducto, nombre: e.target.value})} 
                  required 
                  className="bg-slate-50/50 border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Código / EAN</label>
                  <Input 
                    value={editingProducto?.codigo || ''} 
                    onChange={(e) => setEditingProducto({...editingProducto, codigo: e.target.value})} 
                    className="bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Precio Venta</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <Input 
                      className="pl-9 bg-slate-50/50 border-slate-200" 
                      type="number" 
                      step="0.01" 
                      value={editingProducto?.precio || ''} 
                      onChange={(e) => setEditingProducto({...editingProducto, precio: e.target.value})} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Categoría</label>
                <Select 
                  value={editingProducto?.categoria_id || ''} 
                  onValueChange={(v) => setEditingProducto({...editingProducto, categoria_id: v})}
                >
                  <SelectTrigger className="w-full bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-50 gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-500">
                Cancelar
              </Button>
              <Button type="submit" className="min-w-[120px] rounded-sm">
                Actualizar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
