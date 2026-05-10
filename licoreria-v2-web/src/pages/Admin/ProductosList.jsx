import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Package, Search, Tag, DollarSign, Layers, ImageIcon, ImagePlus, Trash2, Pencil, LayoutGrid, List, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { getImageUrl } from '@/lib/api';
import Can from '@/components/auth/Can';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';
import { FallbackImage } from '@/components/ui/fallback-image';

export default function ProductosList() {
  const [productos, setProductos] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [categorias, setCategorias] = useState([]);
  const [medidas, setMedidas] = useState([]);
  const [empaques, setEmpaques] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form States
  const initialFormState = {
    nombre: '', descripcion: '', precio: '', categoria_id: '', medida_id: '', codigo: '', imagen: null,
    presentaciones: []
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingProducto, setEditingProducto] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Bulk Select/Delete States
  const [selected, setSelected] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Bulk Insert States
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const initialBulkProduct = { nombre: '', empaque_nombre: '', precio_venta: '', codigo_barras: '', cantidad_unidades: 1, categoria_id: '', medida_id: '', imagen: null, imagenPreview: null };
  const [bulkProducts, setBulkProducts] = useState([initialBulkProduct]);
  const maxBulkLimit = 30;

  const openBulk = () => {
    setBulkProducts([initialBulkProduct]);
    setIsBulkOpen(true);
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === productos.length ? [] : productos.map(p => p.id));

  const handleBulkDelete = async () => {
    if (!window.confirm(`¿Eliminar ${selected.length} producto(s) seleccionado(s)?`)) return;
    setIsBulkDeleting(true);
    try {
      const res = await api.delete('/api/productos/bulk', { data: { ids: selected } });
      toast.success(res.data.message);
      setSelected([]);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al eliminar productos');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, medRes, empRes] = await Promise.all([
        api.get('/api/productos', { params: { page, search: searchTerm } }),
        api.get('/api/categorias', { params: { per_page: 100 } }),
        api.get('/api/medidas'),
        api.get('/api/empaques')
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
      setMedidas(medRes.data);
      setEmpaques(empRes.data.data ?? empRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const handleImageChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditingProducto({ ...editingProducto, nueva_imagen: file });
      } else {
        setFormData({ ...formData, imagen: file });
      }
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const appendDataToFormData = (dataObj, isEdit = false) => {
    const data = new FormData();
    if (isEdit) data.append('_method', 'PUT');

    data.append('nombre', dataObj.nombre);

    if (dataObj.categoria_id) data.append('categoria_id', dataObj.categoria_id);
    else data.append('categoria_id', '');

    if (dataObj.medida_id) data.append('medida_id', dataObj.medida_id);
    else data.append('medida_id', '');

    if (dataObj.imagen || dataObj.nueva_imagen) data.append('imagen', dataObj.imagen || dataObj.nueva_imagen);

    if (dataObj.presentaciones && dataObj.presentaciones.length > 0) {
      dataObj.presentaciones.forEach((pres, index) => {
        data.append(`presentaciones[${index}][nombre]`, pres.nombre);
        data.append(`presentaciones[${index}][cantidad_unidades]`, pres.cantidad_unidades);
        data.append(`presentaciones[${index}][precio_venta]`, pres.precio_venta);
        data.append(`presentaciones[${index}][es_principal]`, index === 0 ? 1 : 0);
        if (pres.codigo_barras) data.append(`presentaciones[${index}][codigo_barras]`, pres.codigo_barras);
        if (pres.id) data.append(`presentaciones[${index}][id]`, pres.id);
      });
    }

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/productos', appendDataToFormData(formData), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Producto guardado');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post(`/api/productos/${editingProducto.id}`, appendDataToFormData(editingProducto, true), {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Producto actualizado');
      setIsEditOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      bulkProducts.forEach((bp, index) => {
        formData.append(`productos[${index}][nombre]`, bp.nombre);
        if (bp.categoria_id) formData.append(`productos[${index}][categoria_id]`, bp.categoria_id);
        if (bp.medida_id) formData.append(`productos[${index}][medida_id]`, bp.medida_id);
        if (bp.codigo_barras) formData.append(`productos[${index}][sku]`, bp.codigo_barras);
        formData.append(`productos[${index}][activo]`, 1);

        if (bp.imagen) {
          formData.append(`productos[${index}][imagen]`, bp.imagen);
        }

        formData.append(`productos[${index}][presentaciones][0][nombre]`, bp.empaque_nombre || 'Unidad');
        formData.append(`productos[${index}][presentaciones][0][cantidad_unidades]`, bp.cantidad_unidades || 1);
        formData.append(`productos[${index}][presentaciones][0][precio_venta]`, bp.precio_venta);
        if (bp.codigo_barras) formData.append(`productos[${index}][presentaciones][0][codigo_barras]`, bp.codigo_barras);
        formData.append(`productos[${index}][presentaciones][0][es_principal]`, 1);
      });

      const res = await api.post('/api/productos/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Productos creados');
      setIsBulkOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al guardar productos masivos');
    } finally {
      setIsSubmitting(false);
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

  const resetForm = () => {
    setFormData(initialFormState);
    setImagePreview(null);
  };

  const openEdit = (producto) => {
    setEditingProducto({
      ...producto,
      categoria_id: producto.categoria_id?.toString() || '',
      medida_id: producto.medida_id?.toString() || '',
      presentaciones: producto.presentaciones || []
    });
    setImagePreview(getImageUrl(producto.imagen_ruta));
    setIsEditOpen(true);
  };

  // Presentation Handlers
  const addPresentacion = (isEdit = false) => {
    const state = isEdit ? editingProducto : formData;
    const isFirst = state.presentaciones.length === 0;
    const newPres = { nombre: '', cantidad_unidades: 1, precio_venta: '', codigo_barras: '', es_principal: isFirst };
    if (isEdit) {
      setEditingProducto({ ...editingProducto, presentaciones: [...editingProducto.presentaciones, newPres] });
    } else {
      setFormData({ ...formData, presentaciones: [...formData.presentaciones, newPres] });
    }
  };

  const updatePresentacion = (index, field, value, isEdit = false) => {
    if (isEdit) {
      const newPres = [...editingProducto.presentaciones];
      newPres[index][field] = value;
      setEditingProducto({ ...editingProducto, presentaciones: newPres });
    } else {
      const newPres = [...formData.presentaciones];
      newPres[index][field] = value;
      setFormData({ ...formData, presentaciones: newPres });
    }
  };

  const removePresentacion = (index, isEdit = false) => {
    if (isEdit) {
      setEditingProducto({
        ...editingProducto,
        presentaciones: editingProducto.presentaciones.filter((_, i) => i !== index)
      });
    } else {
      setFormData({
        ...formData,
        presentaciones: formData.presentaciones.filter((_, i) => i !== index)
      });
    }
  };

  const renderPresentacionesForm = (state, isEdit = false) => (
    <div className="space-y-3 mt-4 border-t border-border/50 pt-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase text-foreground/80 tracking-wider">Presentaciones (Empaques y Precios)</label>
        <Button type="button" variant="outline" size="sm" onClick={() => addPresentacion(isEdit)} className="h-7 text-xs rounded-sm">
          <Plus className="w-3 h-3 mr-1" /> Añadir
        </Button>
      </div>

      {state.presentaciones.length === 0 && (
        <div className="text-center py-4 bg-muted/30 border border-dashed border-border rounded-sm">
          <p className="text-xs text-muted-foreground">Solo se venderá por unidad base.</p>
        </div>
      )}

      {state.presentaciones.map((pres, idx) => (
        <div key={idx} className="bg-muted/30 p-3 rounded-sm border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-muted-foreground mb-1 block">Empaque</label>
              <Select 
                value={pres.nombre || "none"} 
                onValueChange={(val) => {
                  const selectedEmpaque = empaques.find(e => e.nombre === val);
                  if (selectedEmpaque) {
                    if (isEdit) {
                      const newPres = [...editingProducto.presentaciones];
                      newPres[idx].nombre = selectedEmpaque.nombre;
                      newPres[idx].cantidad_unidades = selectedEmpaque.cantidad_unidades;
                      setEditingProducto({ ...editingProducto, presentaciones: newPres });
                    } else {
                      const newPres = [...formData.presentaciones];
                      newPres[idx].nombre = selectedEmpaque.nombre;
                      newPres[idx].cantidad_unidades = selectedEmpaque.cantidad_unidades;
                      setFormData({ ...formData, presentaciones: newPres });
                    }
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Seleccione un empaque</SelectItem>
                  {empaques.map(e => (
                    <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground mb-1 block">Unidades</label>
                <Input
                  type="number" className="h-8 text-xs bg-muted cursor-not-allowed"
                  value={pres.cantidad_unidades || ''} readOnly disabled
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-muted-foreground mb-1 block">Precio Venta</label>
                <Input
                  type="number" step="0.01" placeholder="180.00" className="h-8 text-xs bg-background"
                  value={pres.precio_venta || ''} onChange={e => updatePresentacion(idx, 'precio_venta', e.target.value, isEdit)} required
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase text-muted-foreground mb-1 block">Código de Barras (opcional)</label>
              <Input
                placeholder="Ej. 7401234000891" className="h-8 text-xs bg-background font-mono tracking-wider"
                value={pres.codigo_barras || ''} onChange={e => updatePresentacion(idx, 'codigo_barras', e.target.value, isEdit)}
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-sm shrink-0 mt-4" onClick={() => removePresentacion(idx, isEdit)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Catálogo de Productos"
        subtitle="Gestión de inventario y presentaciones"
        icon={Package}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o código..."
        action={
          <div className="flex gap-2">
            {selected.length > 0 && (
              <Can permission="eliminar.producto">
                <Button variant="destructive" className="rounded-sm shadow-sm gap-2" onClick={handleBulkDelete} disabled={isBulkDeleting}>
                  {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Eliminar {selected.length}
                </Button>
              </Can>
            )}
            <Can permission="crear.producto">
              <Button onClick={openBulk} variant="secondary" className="rounded-sm shadow-sm border border-border">
                <Layers className="mr-2 h-4 w-4" /> Carga Masiva
              </Button>
              <Button onClick={() => setIsDialogOpen(true)} className="rounded-sm shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
              </Button>
            </Can>
          </div>
        }
      />

      {viewMode === 'table' ? (
        <Card className="border shadow-sm bg-card overflow-hidden animate-in fade-in duration-300">
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10 px-4">
                      <Checkbox checked={productos.length > 0 && selected.length === productos.length} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="w-[300px] py-4 px-6 font-semibold text-foreground/80">Producto y Medida</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Categoría</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Empaques</TableHead>
                    <TableHead className="font-semibold text-foreground/80">Stock U.</TableHead>
                    <TableHead className="text-right px-6 font-semibold text-foreground/80">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} className="px-6 py-4"><div className="h-10 bg-muted/50 animate-pulse rounded"></div></TableCell>
                      </TableRow>
                    ))
                  ) : productos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">No se encontraron productos</TableCell>
                    </TableRow>
                  ) : productos.map((p) => (
                    <TableRow key={p.id} className={`hover:bg-muted/30 transition-colors group ${selected.includes(p.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell className="px-4">
                        <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-background h-10 w-10 shrink-0 rounded-sm flex items-center justify-center border border-border/50 overflow-hidden">
                            {(p.imagen_url || p.imagen_ruta) ? (
                              <FallbackImage
                                src={p.imagen_url || getImageUrl(p.imagen_ruta)}
                                className="h-full w-full object-cover"
                                alt={p.nombre}
                                fallbackIcon={Package}
                                fallbackClass="text-muted-foreground/30 h-5 w-5 m-auto"
                              />
                            ) : (
                              <Package size={18} className="text-muted-foreground/30" weight="duotone" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{p.nombre} {p.medida ? <span className="text-xs font-bold text-muted-foreground">({p.medida.abreviatura || p.medida.nombre})</span> : ''}</span>
                            <span className="text-[10px] text-muted-foreground font-bold tracking-wider">{p.codigo || 'SIN CÓDIGO'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-semibold border-none">
                          {p.categoria?.nombre || 'General'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.presentaciones && p.presentaciones.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {p.presentaciones.map(pr => (
                              <Badge key={pr.id} variant="outline" className="text-[10px] border-border text-muted-foreground bg-background gap-1">
                                {pr.nombre}
                                <span className="text-muted-foreground/30">·</span>
                                <span className="text-muted-foreground/60">{pr.cantidad_unidades}u</span>
                                <span className="text-green-600 font-bold dark:text-green-400">${pr.precio_venta}</span>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Solo Unidad</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${(p.stock_total || 0) > 5 ? 'bg-green-500' : 'bg-destructive animate-pulse'}`}></div>
                          <span className="text-sm font-bold text-foreground">
                            {p.stock_total || 0} <span className="text-[10px] font-normal text-muted-foreground">unid.</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <Can permission="editar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Can>
                          <Can permission="eliminar.producto">
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm">
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
              <div className="py-4 border-t border-border flex justify-center">
                <DataPagination meta={meta} onPageChange={fetchData} />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in duration-300">
          {productos.map(p => (
            <Card
              key={p.id}
              onClick={() => toggleSelect(p.id)}
              className={`group overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 bg-card cursor-pointer ${selected.includes(p.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
            >
              <div className="aspect-[16/10] bg-muted/20 relative p-4 flex justify-center">
                {(p.imagen_url || p.imagen_ruta) ? (
                  <FallbackImage
                    src={p.imagen_url || getImageUrl(p.imagen_ruta)}
                    className="object-contain h-full"
                    alt="img"
                    fallbackIcon={Package}
                    fallbackClass="h-12 w-12 text-muted-foreground/20 opacity-50 m-auto"
                  />
                ) : <Package className="h-12 w-12 text-muted-foreground/20 opacity-50 m-auto" />}
                {selected.includes(p.id) && (
                  <div className="absolute top-2 left-2 h-5 w-5 rounded bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">{p.categoria?.nombre || 'General'}</p>
                <h3 className="font-semibold text-foreground">{p.nombre} <span className="text-muted-foreground text-xs">{p.medida?.abreviatura}</span></h3>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                  <span className="text-xs font-bold text-muted-foreground">{p.stock_total || 0} Unidades</span>
                  <Button size="icon-sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(p); }} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Nuevo / Editar extraído como Render */}

      {/* Nuevo Producto */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Nuevo Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">

            {/* Base Product Info */}
            <div className="flex gap-4">
              <div
                className="shrink-0 h-24 w-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-all overflow-hidden bg-muted/20"
                onClick={() => fileInputRef.current.click()}
              >
                {imagePreview ? <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" /> : <ImagePlus size={24} className="text-muted-foreground/40" />}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, false)} />
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Producto</label>
                  <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Toña" required className="h-9 bg-background" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Litraje / Medida</label>
                    <Select onValueChange={(v) => setFormData({ ...formData, medida_id: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>
                        {medidas.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre} ({m.abreviatura})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoría</label>
                    <Select onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>
                        {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {renderPresentacionesForm(formData, false)}

            <DialogFooter className="pt-4 mt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-sm" disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" className="rounded-sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : 'Guardar Producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar Producto */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">Editar Producto</DialogTitle>
          </DialogHeader>
          {editingProducto && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-2">
              <div className="flex gap-4">
                <div className="relative shrink-0 h-24 w-24 rounded-xl border-border border-2 overflow-hidden cursor-pointer bg-muted/20 flex items-center justify-center" onClick={() => fileInputRef.current.click()}>
                  {imagePreview ? <img src={imagePreview} className="object-cover h-full w-full" /> : <ImageIcon className="text-muted-foreground/40" />}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, true)} />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</label>
                    <Input value={editingProducto.nombre || ''} onChange={(e) => setEditingProducto({ ...editingProducto, nombre: e.target.value })} required className="h-9 bg-background" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Litraje / Medida</label>
                      <Select value={editingProducto.medida_id || "none"} onValueChange={(v) => setEditingProducto({ ...editingProducto, medida_id: v === 'none' ? '' : v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          {medidas.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Categoría</label>
                      <Select value={editingProducto.categoria_id || "none"} onValueChange={(v) => setEditingProducto({ ...editingProducto, categoria_id: v === 'none' ? '' : v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">General</SelectItem>
                          {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {renderPresentacionesForm(editingProducto, true)}

              <DialogFooter className="pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)} className="rounded-sm" disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" className="rounded-sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : 'Actualizar'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Dialog Carga Masiva */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-5 w-5" /> Carga Masiva de Productos
            </DialogTitle>
            <DialogDescription>
              Agrega múltiples productos rápidamente de manera tabular. Límite: {maxBulkLimit} productos por carga. Las presentaciones detalladas o imágenes pueden agregarse después al editar cada producto individualmente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBulkSubmit} className="space-y-4 pt-2">
            <div className="border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-[60px] text-center">Img</TableHead>
                    <TableHead className="min-w-[150px]">Nombre *</TableHead>
                    <TableHead className="w-[120px]">Empaque *</TableHead>
                    <TableHead className="w-[100px]">Precio *</TableHead>
                    <TableHead className="w-[120px]">Cod. Barras</TableHead>
                    <TableHead className="w-[130px]">Categoría</TableHead>
                    <TableHead className="w-[130px]">Medida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkProducts.map((bp, index) => (
                    <TableRow key={index} className="hover:bg-transparent">
                      <TableCell className="text-muted-foreground text-xs text-center">{index + 1}</TableCell>
                      <TableCell className="p-2">
                        <div className="relative h-8 w-8 rounded bg-muted/30 border border-dashed border-border flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-primary transition-colors">
                          <input 
                            type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const newBulk = [...bulkProducts];
                                newBulk[index].imagen = file;
                                newBulk[index].imagenPreview = URL.createObjectURL(file);
                                setBulkProducts(newBulk);
                              }
                            }}
                          />
                          {bp.imagenPreview ? <img src={bp.imagenPreview} className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-muted-foreground/50" />}
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Nombre del producto"
                          value={bp.nombre}
                          onChange={(e) => {
                            const newBulk = [...bulkProducts];
                            newBulk[index].nombre = e.target.value;
                            setBulkProducts(newBulk);
                          }}
                          required
                          className="h-8 text-xs bg-background"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Select 
                          value={bp.empaque_nombre || "none"} 
                          onValueChange={(val) => {
                            const selectedEmpaque = empaques.find(e => e.nombre === val);
                            if (selectedEmpaque) {
                              const newBulk = [...bulkProducts];
                              newBulk[index].empaque_nombre = selectedEmpaque.nombre;
                              newBulk[index].cantidad_unidades = selectedEmpaque.cantidad_unidades;
                              setBulkProducts(newBulk);
                            }
                          }}
                          required
                        >
                          <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue placeholder="Empaque" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" disabled>Empaque</SelectItem>
                            {empaques.map(e => (
                              <SelectItem key={e.id} value={e.nombre}>{e.nombre} ({e.cantidad_unidades}u)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="number" step="0.01" min="0"
                          placeholder="0.00"
                          value={bp.precio_venta}
                          onChange={(e) => {
                            const newBulk = [...bulkProducts];
                            newBulk[index].precio_venta = e.target.value;
                            setBulkProducts(newBulk);
                          }}
                          required
                          className="h-8 text-xs bg-background"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Opcional"
                          value={bp.codigo_barras}
                          onChange={(e) => {
                            const newBulk = [...bulkProducts];
                            newBulk[index].codigo_barras = e.target.value;
                            setBulkProducts(newBulk);
                          }}
                          className="h-8 text-xs bg-background font-mono"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Select value={bp.categoria_id || "none"} onValueChange={(v) => {
                          const newBulk = [...bulkProducts];
                          newBulk[index].categoria_id = v === "none" ? "" : v;
                          setBulkProducts(newBulk);
                        }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoría" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ninguna</SelectItem>
                            {categorias.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2">
                        <Select value={bp.medida_id || "none"} onValueChange={(v) => {
                          const newBulk = [...bulkProducts];
                          newBulk[index].medida_id = v === "none" ? "" : v;
                          setBulkProducts(newBulk);
                        }}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Medida" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ninguna</SelectItem>
                            {medidas.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.abreviatura}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center py-2">
              <Button
                type="button" variant="outline" size="sm"
                className="rounded-sm text-xs font-medium border-dashed border-border/70"
                disabled={bulkProducts.length >= maxBulkLimit}
                onClick={() => {
                  if (bulkProducts.length < maxBulkLimit) {
                    setBulkProducts([...bulkProducts, { ...initialBulkProduct }]);
                  }
                }}
              >
                <Plus className="mr-1 h-3 w-3" /> Agregar Fila ({bulkProducts.length}/{maxBulkLimit})
              </Button>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsBulkOpen(false)} className="rounded-sm" disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" className="rounded-sm gap-2" disabled={isSubmitting || bulkProducts.length === 0}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                Guardar {bulkProducts.length} Productos
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
