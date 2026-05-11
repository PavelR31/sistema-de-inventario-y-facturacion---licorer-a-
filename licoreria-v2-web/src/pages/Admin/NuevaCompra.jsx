import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Search, Plus, Trash2, Save, Truck, Package, Calculator, Calendar, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

import { Dialog, DialogContent } from '@/components/ui/dialog';
export default function NuevaCompra() {
  const { branch } = useAuthStore();
  const navigate = useNavigate();

  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Datos de la compra
  const [selectedProveedor, setSelectedProveedor] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState([]);

  // Búsqueda de producto
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [provRes, prodRes] = await Promise.all([
          api.get('/api/proveedores'),
          api.get('/api/productos')
        ]);
        setProveedores(provRes.data.data ?? provRes.data);
        setProductos(prodRes.data.data ?? prodRes.data);
      } catch (error) {
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const [selectedProductForPresentation, setSelectedProductForPresentation] = useState(null);

  const confirmAddToCart = (producto, presentacion = null) => {
    const cartId = `${producto.id}_${presentacion ? presentacion.id : 'base'}`;
    const exists = cart.find(item => item.cartId === cartId);
    
    if (exists) {
      setCart(cart.map(item =>
        item.cartId === cartId ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      const nombre_mostrar = presentacion ? `${producto.nombre} (${presentacion.nombre})` : producto.nombre;
      const costo_base = parseFloat(producto.precio_compra) || 0;
      // El costo debe ser por presentación completa (no multiplicamos aquí, el backend multiplica por cantidad_unidades)
      // Si hay precio_venta en la presentación lo usamos de referencia, pero el campo real es lo que ingresa el usuario
      const costo_estimado = presentacion
        ? (costo_base * parseInt(presentacion.cantidad_unidades)) // precio estimado de una caja/six-pack
        : costo_base;
      const unidades_por_item = presentacion ? parseInt(presentacion.cantidad_unidades) : 1;

      setCart([...cart, { 
        ...producto, 
        cartId, 
        presentacion_id: presentacion?.id || null,
        nombre_mostrar,
        cantidad: 1, 
        costo: costo_estimado,
        unidades_por_item,
      }]);
    }
    setSearchTerm('');
    setSelectedProductForPresentation(null);
  };

  const handleProductClick = (producto) => {
    if (producto.presentaciones && producto.presentaciones.length > 0) {
      setSelectedProductForPresentation(producto);
    } else {
      confirmAddToCart(producto, null);
    }
  };

  const removeFromCart = (cartId) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const updateItem = (cartId, field, value) => {
    setCart(cart.map(item =>
      item.cartId === cartId ? { ...item, [field]: parseFloat(value) || 0 } : item
    ));
  };

  const totalCompra = cart.reduce((acc, item) => acc + (item.cantidad * item.costo), 0);

  const handleSubmit = async () => {
    if (!selectedProveedor) return toast.error('Selecciona un proveedor');
    if (cart.length === 0) return toast.error('Agrega al menos un producto');

    try {
      const data = {
        sucursal_id: branch.id,
        proveedor_id: selectedProveedor,
        numero_factura: numeroFactura,
        fecha_compra: fechaCompra,
        items: cart.map(item => ({
          producto_id: item.id,
          presentacion_id: item.presentacion_id || null,
          cantidad: item.cantidad,
          precio_unitario: item.costo
        }))
      };

      await api.post('/api/compras', data);
      toast.success('Compra registrada y stock actualizado');
      navigate('/admin/compras');
    } catch (error) {
      toast.error('Error al procesar la compra');
    }
  };

  const filteredSearch = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Abastecimiento</h1>
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-1 opacity-70">
            Registrar compras para cargar stock en <strong>{branch?.nombre}</strong>
          </p>
        </div>
        <Button size="lg" className="gap-2 rounded-sm" onClick={handleSubmit}>
          <Save className="h-4 w-4" /> Finalizar Compra
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cabecera de Compra */}
        <Card className="lg:col-span-1 shadow-sm border-border rounded-sm bg-card">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" /> Datos del Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Proveedor</label>
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Número de Factura</label>
              <Input
                placeholder="Ej. F-001-992"
                className="rounded-sm bg-background"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Fecha de Compra</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 rounded-sm"
                  value={fechaCompra}
                  onChange={(e) => setFechaCompra(e.target.value)}
                />
                              </div>
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Total de Artículos:</span>
                <span className="font-bold text-foreground">{cart.length}</span>
              </div>
              <div className="flex justify-between items-center text-xl">
                <span className="font-bold text-foreground">TOTAL:</span>
                <span className="font-black text-primary">${totalCompra.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de Productos */}
        <Card className="lg:col-span-2 shadow-sm border-border rounded-sm bg-card">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Items de la Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Escribe el nombre o código del producto para agregar..."
                className="pl-10 h-11 pr-10 rounded-sm"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value) setShowFullList(false); }}
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                onClick={() => { setShowFullList(p => !p); setSearchTerm(''); }}
                title="Ver lista completa"
              >
                {showFullList ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Dropdown on search */}
              {searchTerm.length > 0 && (
                <div className="absolute z-10 w-full bg-card border border-border mt-1 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {filteredSearch.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Sin resultados</div>
                  ) : filteredSearch.map(p => (
                    <div
                      key={p.id}
                      className="p-3 hover:bg-muted/30 cursor-pointer flex justify-between items-center border-b border-border last:border-0"
                      onClick={() => handleProductClick(p)}
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{p.nombre}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">COD: {p.codigo || 'S/C'} &bull; Stock: {p.stock}</p>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Short product list (up to 15) */}
            {showFullList && (
              <div className="border border-border rounded-sm overflow-hidden shadow-sm bg-card">
                <div className="max-h-48 overflow-auto divide-y divide-border">
                  {productos.slice(0, 15).map(p => {
                    const inCart = cart.some(i => i.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${inCart ? 'bg-green-500/10 opacity-60 cursor-default' : 'hover:bg-muted/30'
                          }`}
                        onClick={() => handleProductClick(p)}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{p.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">{p.categoria?.nombre || 'General'} &bull; Stock: {p.stock}</p>
                        </div>
                        {inCart ? (
                          <Badge className="ml-2 bg-green-500/10 text-green-600 border-none text-[10px] shrink-0">Añadido</Badge>
                        ) : (
                          <Plus className="h-4 w-4 text-primary shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                  {productos.length > 15 && (
                    <div className="px-4 py-2 text-center text-[11px] text-muted-foreground bg-muted/30">
                      Usa el buscador para encontrar más productos
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border border-border rounded-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-[100px] text-center">Cant.</TableHead>
                    <TableHead className="w-[80px] text-center">Unid.</TableHead>
                    <TableHead className="w-[140px]">Costo / Item</TableHead>
                    <TableHead className="w-[110px]">Subtotal</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No hay productos en la lista. Usa el buscador para agregar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item) => {
                      const totalUnidades = item.cantidad * (item.unidades_por_item ?? 1);
                      return (
                        <TableRow key={item.cartId}>
                          <TableCell>
                            <p className="font-semibold text-sm text-foreground">{item.nombre_mostrar || item.nombre}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {item.unidades_por_item > 1
                                ? `+${totalUnidades} unidades al stock`
                                : `+${totalUnidades} unidad al stock`}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              className="h-8 rounded-sm text-center"
                              value={item.cantidad}
                              onChange={(e) => updateItem(item.cartId, 'cantidad', e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              item.unidades_por_item > 1
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              ×{item.unidades_por_item ?? 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                className="pl-6 h-8 font-mono rounded-sm"
                                value={item.costo}
                                onChange={(e) => updateItem(item.cartId, 'costo', e.target.value)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-foreground">
                            ${(item.cantidad * item.costo).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-sm" onClick={() => removeFromCart(item.cartId)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presentation Selection Modal */}
      <Dialog 
        open={!!selectedProductForPresentation} 
        onOpenChange={(open) => !open && setSelectedProductForPresentation(null)}
      >
        <DialogContent className="sm:max-w-md border border-border shadow-xl rounded-sm p-0 overflow-hidden bg-card">
          {selectedProductForPresentation && (
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="h-16 w-16 bg-muted/50 text-primary rounded-sm flex items-center justify-center mx-auto mb-4 border border-border">
                  <Package className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight leading-tight">
                  Formato de Compra
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  {selectedProductForPresentation?.nombre}
                </p>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">


                {/* Presentations Options */}
                {selectedProductForPresentation.presentaciones?.map(pres => (
                  <button
                    key={pres.id}
                    onClick={() => confirmAddToCart(selectedProductForPresentation, pres)}
                    className="w-full flex items-center justify-between p-4 rounded-sm border border-border hover:border-primary hover:bg-muted/30 transition-all group text-left bg-card"
                  >
                    <div>
                      <span className="block text-sm font-bold text-foreground">
                        {pres.nombre}
                      </span>
                      <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                        Agrega {pres.cantidad_unidades} unidades al inventario
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              <Button variant="ghost" className="w-full h-10 rounded-sm text-xs font-bold text-muted-foreground uppercase tracking-widest" onClick={() => setSelectedProductForPresentation(null)}>
                Cancelar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
