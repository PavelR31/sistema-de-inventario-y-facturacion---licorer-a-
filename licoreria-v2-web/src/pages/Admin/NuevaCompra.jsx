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

  const addToCart = (producto) => {
    const exists = cart.find(item => item.id === producto.id);
    if (exists) {
      toast.error('El producto ya está en la lista');
      return;
    }
    setCart([...cart, { ...producto, cantidad: 1, costo: producto.precio_compra || 0 }]);
    setSearchTerm('');
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, [field]: parseFloat(value) || 0 } : item
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Abastecimiento</h1>
          <p className="text-muted-foreground">Registra compras a proveedores para cargar stock en <strong>{branch?.nombre}</strong>.</p>
        </div>
        <Button size="lg" className="gap-2" onClick={handleSubmit}>
          <Save className="h-5 w-5" /> Finalizar Compra
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cabecera de Compra */}
        <Card className="lg:col-span-1 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" /> Datos del Proveedor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Proveedor</label>
              <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Número de Factura</label>
              <Input 
                placeholder="Ej. F-001-992" 
                value={numeroFactura} 
                onChange={(e) => setNumeroFactura(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Fecha de Compra</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="date" 
                  className="pl-10"
                  value={fechaCompra} 
                  onChange={(e) => setFechaCompra(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="pt-4 border-t mt-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500 font-medium">Total de Artículos:</span>
                    <span className="font-bold">{cart.length}</span>
                </div>
                <div className="flex justify-between items-center text-xl">
                    <span className="font-bold text-slate-900">TOTAL:</span>
                    <span className="font-black text-primary">${totalCompra.toFixed(2)}</span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalle de Productos */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Items de la Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Escribe el nombre o código del producto para agregar..." 
                className="pl-10 h-11 pr-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); if(e.target.value) setShowFullList(false); }}
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
                <div className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {filteredSearch.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Sin resultados</div>
                  ) : filteredSearch.map(p => (
                    <div 
                      key={p.id} 
                      className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                      onClick={() => addToCart(p)}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800">{p.nombre}</p>
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
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-48 overflow-auto divide-y divide-slate-50">
                  {productos.slice(0, 15).map(p => {
                    const inCart = cart.some(i => i.id === p.id);
                    return (
                      <div
                        key={p.id}
                        className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          inCart ? 'bg-green-50 opacity-60 cursor-default' : 'hover:bg-slate-50'
                        }`}
                        onClick={() => !inCart && addToCart(p)}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-800 truncate">{p.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">{p.categoria?.nombre || 'General'} &bull; Stock: {p.stock}</p>
                        </div>
                        {inCart ? (
                          <Badge className="ml-2 bg-green-100 text-green-700 border-0 text-[10px] shrink-0">Añadido</Badge>
                        ) : (
                          <Plus className="h-4 w-4 text-primary shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })}
                  {productos.length > 15 && (
                    <div className="px-4 py-2 text-center text-[11px] text-muted-foreground bg-slate-50">
                      Usa el buscador para encontrar más productos
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="w-[120px]">Cantidad</TableHead>
                    <TableHead className="w-[150px]">Costo Unit.</TableHead>
                    <TableHead className="w-[120px]">Subtotal</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No hay productos en la lista. Usa el buscador para agregar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-sm">{item.nombre}</p>
                          <p className="text-[10px] text-muted-foreground">{item.categoria?.nombre || 'General'}</p>
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="1" 
                            className="h-8"
                            value={item.cantidad} 
                            onChange={(e) => updateItem(item.id, 'cantidad', e.target.value)} 
                          />
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <DollarSign className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="pl-6 h-8 font-mono"
                              value={item.costo} 
                              onChange={(e) => updateItem(item.id, 'costo', e.target.value)} 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-700">
                          ${(item.cantidad * item.costo).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
