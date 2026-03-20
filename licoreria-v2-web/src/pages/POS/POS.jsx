import { useState, useEffect, useRef } from 'react';
import { usePOSStore } from '@/store/usePOSStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCajaStore } from '@/store/useCajaStore';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
    MagnifyingGlass, ShoppingCart, Trash, Plus, Minus, CreditCard, 
    Bank, Package, CircleNotch, ArrowRight, Printer, 
    SquaresFour, List, Tag, User, Receipt, X, LockKey, SignOut,
    CaretRight, CaretLeft, CheckCircle, Money, Bag, BeerStein, BeerBottle,
    Scan
} from "@phosphor-icons/react"
import { toast } from 'sonner';
import api from '@/lib/api';
import ArqueoCajaModal from '@/components/pos/ArqueoCajaModal';

export default function POS() {
  const { branch, user } = useAuthStore();
  const { cerrarCaja, activeSesion, checkCajaStatus } = useCajaStore();
  const { formatMoney, currencySymbol } = useCurrency();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getTotal } = usePOSStore();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // UI State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'grid' ? 6 : 10;
  
  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Receipt State
  const [lastSale, setLastSale] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Configuration State (IVA/Impuestos)
  const [ivaPorcentaje, setIvaPorcentaje] = useState(0);
  const [globalDiscount, setGlobalDiscount] = useState(0);

  // Close Box State
  const [isCloseCajaOpen, setIsCloseCajaOpen] = useState(false);

  // Egresos State
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [egresoMonto, setEgresoMonto] = useState('');
  const [egresoMotivo, setEgresoMotivo] = useState('');
  const [isRecordingEgreso, setIsRecordingEgreso] = useState(false);

  const handleEgresoSubmit = async (e) => {
    e.preventDefault();
    if (!egresoMonto || !egresoMotivo) return;
    
    setIsRecordingEgreso(true);
    try {
      const { registrarEgreso } = useCajaStore.getState();
      const result = await registrarEgreso(parseFloat(egresoMonto), egresoMotivo);
      
      if (result.success) {
        toast.success('Egreso registrado correctamente');
        setIsEgresoModalOpen(false);
        setEgresoMonto('');
        setEgresoMotivo('');
        // Recargar el estado de la sesión si es necesario
        checkCajaStatus(branch.id, true);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al registrar egreso');
    } finally {
      setIsRecordingEgreso(false);
    }
  };

  const fetchInitialData = async () => {
    if (!branch?.id) return;
    setIsLoading(true);
    try {
      const [prodRes, catRes, configRes] = await Promise.all([
        api.get(`/api/productos?sucursal_id=${branch.id}&activo=1&per_page=100`),
        api.get('/api/categorias', { params: { per_page: 100 } }),
        api.get('/api/configuraciones')
      ]);
      setProducts(prodRes.data.data ?? prodRes.data);
      setCategories(catRes.data.data ?? catRes.data);
      
      if (configRes.data?.iva_porcentaje) {
        setIvaPorcentaje(parseFloat(configRes.data.iva_porcentaje) || 0);
      }
    } catch (e) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    // checkCajaStatus ya lo hace el padre CajaFlow, no llamarlo aquí para evitar bucle
  }, [branch?.id]);

  const handleCerrarCaja = async (montoFinal) => {
      setIsProcessing(true);
      const result = await cerrarCaja(montoFinal); 
      setIsProcessing(false);
      if (result.success) {
          toast.success('Caja cerrada correctamente. Redirigiendo...');
          setIsCloseCajaOpen(false);
          window.location.reload(); 
      } else {
          toast.error(result.message);
      }
  };

  const openPayment = (method) => {
    if (cart.length === 0) return toast.error('El carrito está vacío');
    setPaymentMethod(method);
    setMontoPagado(totalFinal.toString());
    setIsPaymentModalOpen(true);
  };

  const handleProcessSale = async () => {
    if (isProcessing) return;
    
    const totalVenta = getTotal();
    let pagado = parseFloat(montoPagado) || 0;

    // Si no es efectivo, asumimos que se paga el total exacto
    if (paymentMethod !== 'efectivo') {
        pagado = totalVenta;
    }

    if (pagado < totalVenta && paymentMethod === 'efectivo') {
        return toast.error('El monto pagado no puede ser menor al total');
    }

    setIsProcessing(true);
    try {
      const response = await api.post('/api/ventas', {
        sucursal_id: branch.id,
        items: cart.map(i => ({ 
            producto_id: i.id, 
            cantidad: i.quantity,
            descuento: i.discount || 0
        })),
        descuento_global: globalDiscount,
        impuesto_porcentaje: ivaPorcentaje,
        metodo_pago: paymentMethod,
        monto_pagado: pagado,
      });
      
      setLastSale(response.data);
      toast.success('Venta realizada con éxito');
      clearCart();
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      fetchInitialData(); // Refresh stock
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPay = (amount) => {
      setMontoPagado(amount.toString());
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo?.includes(searchTerm);
    const matchesCategory = selectedCategory ? p.categoria_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [searchTerm, selectedCategory, viewMode]);

  const subtotalCart = getTotal(); // Engloba (precio * qty) - descuentos_ite
  const montoImponible = Math.max(0, subtotalCart - globalDiscount);
  const montoIVA = Math.round(montoImponible * (ivaPorcentaje / 100) * 100) / 100;
  const totalFinal = montoImponible + montoIVA;

  const cambio = Math.max(0, (parseFloat(montoPagado) || 0) - totalFinal);

  // Bill denominations for NIO (common)
  const bills = [10, 20, 50, 100, 200, 500, 1000];

  const handlePrint = () => {
      if (!lastSale) return;
      const hostname = window.location.hostname;
      const printUrl = `http://${hostname}:8000/api/ventas/${lastSale.id}/print`;
      window.open(printUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] -m-6 lg:-m-10 bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* POS Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Scan className="h-4.5 w-4.5 text-white" weight="regular" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">Punto de Venta</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{branch?.nombre || 'Sucursal'} • Caja Central</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px] shadow-emerald-500/50"></div>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Sistema Online</span>
            </div>
            
            <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-rose-100 text-rose-600 font-bold bg-rose-50/50 hover:bg-rose-50 transition-all"
                onClick={() => setIsEgresoModalOpen(true)}
            >
                <Money className="h-4 w-4 mr-2" />
                Registrar Egreso
            </Button>

            <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-slate-200 text-slate-600 font-medium bg-white hover:bg-slate-50 transition-all"
                onClick={() => {
                    checkCajaStatus(branch.id, true);
                    setIsCloseCajaOpen(true);
                }}
            >
                <LockKey className="h-4 w-4 mr-2" />
                Cerrar Caja
            </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Section: Catalog */}
        <div className="flex-1 flex flex-col p-8 space-y-6 overflow-hidden">
          {/* Search & Categories */}
          <div className="flex flex-col gap-5">
            <div className="relative group">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Buscar por nombre o código de barras..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-14 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-2">
                <Button 
                  variant={!selectedCategory ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${!selectedCategory ? 'bg-primary shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </Button>
                {categories.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${selectedCategory === cat.id ? 'bg-primary shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.nombre}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm ml-auto">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-primary shadow-sm' : 'text-slate-400'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <SquaresFour size={18} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-primary shadow-sm' : 'text-slate-400'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List size={18} weight={viewMode === 'list' ? 'fill' : 'regular'} />
                </Button>
              </div>
            </div>
          </div>

          {/* Product View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[...Array(itemsPerPage)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] rounded-2xl bg-slate-100 animate-pulse"></div>
                  ))}
                </div>
              ) : currentProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 py-20 text-center">
                      <Package className="h-16 w-16 text-slate-200 mb-4" weight="thin" />
                      <p className="text-sm font-bold text-slate-400">No se encontraron productos</p>
                  </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in zoom-in duration-300">
                  {currentProducts.map(product => (
                    <Card 
                      key={product.id}
                      className={`group cursor-pointer border border-slate-200 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col bg-white ${product.stock_actual <= 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      onClick={() => addToCart(product)}
                    >
                      <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center p-6">
                        {product.imagen_url ? (
                            <img src={product.imagen_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.nombre} />
                        ) : (
                            <BeerStein className="h-16 w-16 text-slate-200 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500" />
                        )}
                        <div className="absolute top-3 right-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${product.stock_actual < 5 ? 'bg-rose-50 text-rose-600' : 'bg-white/90 border border-slate-100 text-slate-400'}`}>
                              Stock: {product.stock_actual}
                            </span>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 bg-white border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{product.categoria?.nombre || 'General'}</p>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {product.nombre}
                        </h3>
                        <div className="mt-auto flex items-center justify-between pt-2">
                           <span className="text-lg font-black text-slate-900 tracking-tighter">{formatMoney(product.precio_venta)}</span>
                           <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary transition-colors">
                              <Plus className="h-4 w-4 text-slate-400 group-hover:text-white" weight="bold" />
                           </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                   {currentProducts.map(product => (
                     <div 
                      key={product.id}
                      className={`flex items-center gap-4 p-3 bg-white rounded-2xl border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group ${product.stock_actual <= 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      onClick={() => addToCart(product)}
                     >
                        <div className="h-14 w-14 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                           {product.imagen_url ? <img src={product.imagen_url} className="h-full w-full object-cover" /> : <BeerBottle className="h-7 w-7 text-slate-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary transition-colors">{product.nombre}</h3>
                              <Badge variant="outline" className="text-[8px] font-bold uppercase h-4 px-1">{product.categoria?.nombre || 'General'}</Badge>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Existencia: {product.stock_actual} unidades</p>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{formatMoney(product.precio_venta)}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Precio Unitario</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary transition-colors ml-2">
                           <Plus className="h-5 w-5 text-slate-300 group-hover:text-white" weight="bold" />
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-4">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length}
                 </p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 disabled:opacity-30"
                    >
                      <CaretLeft size={16} weight="bold" className="mr-1" /> Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                       {[...Array(totalPages)].map((_, i) => (
                         <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`h-2 w-2 rounded-full transition-all ${currentPage === i + 1 ? 'bg-primary w-6' : 'bg-slate-200 hover:bg-slate-300'}`}
                         />
                       ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="h-9 px-3 rounded-xl border-slate-200 text-slate-600 disabled:opacity-30"
                    >
                      Siguiente <CaretRight size={16} weight="bold" className="ml-1" />
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Shopping Cart */}
        <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <ShoppingCart className="h-5 w-5" weight="regular" />
                </div>
                <div>
                   <h2 className="text-sm font-bold text-slate-800">Orden Actual</h2>
                   <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mt-0.5">{cart.length} Artículos</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-rose-500 rounded-xl" onClick={clearCart}>
                <Trash className="h-5 w-5" weight="regular" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Bag className="h-10 w-10 text-slate-200" weight="thin" />
                </div>
                <div>
                   <p className="text-sm font-bold text-slate-300">El carrito está vacío</p>
                   <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Inicie agregando productos</p>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="group p-4 rounded-2xl border border-slate-50 bg-white hover:border-slate-100 hover:shadow-sm transition-all animate-in slide-in-from-right-4 duration-300">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                        {item.imagen_url ? <img src={item.imagen_url} className="h-full w-full object-cover rounded-xl" /> : <BeerBottle className="h-6 w-6 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate leading-none mb-1">{item.nombre}</h4>
                      <p className="text-[11px] font-bold text-primary tracking-tighter">{formatMoney(item.precio_venta)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-slate-200 hover:text-rose-500 transition-colors self-start"
                    >
                      <Trash className="h-4 w-4" weight="bold" />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white text-slate-400 hover:text-slate-900 transition-all font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white text-slate-400 hover:text-slate-900 transition-all font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-primary">
                                    <Tag size={14} weight={item.discount > 0 ? "fill" : "regular"} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[280px]">
                                <DialogHeader>
                                    <DialogTitle className="text-sm font-bold">Descuento del Artículo</DialogTitle>
                                    <DialogDescription className="text-[10px]">Aplica un descuento fijo a este producto.</DialogDescription>
                                </DialogHeader>
                                <div className="py-2">
                                    <Input 
                                        type="number" 
                                        placeholder="Monto de descuento"
                                        defaultValue={item.discount}
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            usePOSStore.getState().updateDiscount(item.id, val);
                                        }}
                                        className="h-10 text-center font-bold"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                        <span className="text-sm font-black text-slate-900 tracking-tighter">
                          {formatMoney((item.precio_venta * item.quantity) - (item.discount || 0))}
                        </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-200 space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal Items</span>
                  <span className="text-xs font-bold">{formatMoney(subtotalCart)}</span>
                </div>
                
                <div className="flex items-center justify-between group cursor-pointer hover:text-primary transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    Descuento Global <Tag size={10} />
                  </span>
                  <input 
                    type="number"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right bg-transparent border-none text-xs font-bold focus:ring-0 p-0 text-slate-600 group-hover:text-primary"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Impuestos ({ivaPorcentaje}%)</span>
                  <span className="text-xs font-bold">{formatMoney(montoIVA)}</span>
                </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-slate-900">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total a Cobrar</span>
              <span className="text-4xl font-black tracking-tighter">{formatMoney(totalFinal)}</span>
            </div>

            <Button 
               className="w-full h-15 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 transition-all disabled:opacity-50 mt-4 group"
               disabled={cart.length === 0 || isProcessing}
               onClick={() => {
                 setMontoPagado(totalFinal.toString());
                 setIsPaymentModalOpen(true);
               }}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                   <CircleNotch className="h-5 w-5 animate-spin" />
                   <span>Liquidando...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                   <span>Finalizar Venta</span>
                   <CaretRight className="h-5 w-5 transition-transform group-hover:translate-x-1" weight="bold" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal Redesign */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-3xl rounded-[2.5rem] p-0 overflow-hidden bg-white">
          <div className="p-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 bg-slate-50 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CreditCard className="h-8 w-8" weight="regular" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finalizar Operación</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{paymentMethod === 'efectivo' ? 'Efectivo Seleccionado' : 'Tarjeta Seleccionada'}</p>
              <div className="mt-6">
                <p className="text-5xl font-black text-slate-900 tracking-tighter">{formatMoney(totalFinal)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 ${paymentMethod === 'efectivo' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 text-slate-300'}`}
                >
                  <Money className="h-8 w-8" weight="regular" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Efectivo</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 ${paymentMethod === 'tarjeta' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 text-slate-300'}`}
                >
                  <CreditCard className="h-8 w-8" weight="regular" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Tarjeta</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'efectivo' && (
              <div className="space-y-5 animate-in slide-in-from-top-4 duration-400">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recibido</label>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Vuelto: {formatMoney(cambio)}</span>
                </div>
                <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                    <Input 
                      type="number" 
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                      className="h-18 bg-slate-50 border-none text-3xl font-black text-slate-900 text-center rounded-2xl shadow-inner focus-visible:ring-primary/20 pl-14"
                      placeholder="0.00"
                      autoFocus
                    />
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {bills.slice(-4).map(bill => (
                        <button key={bill} onClick={() => quickPay(bill)} className="h-10 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-[10px] font-black transition-all">
                            +{bill}
                        </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-400" onClick={() => setIsPaymentModalOpen(false)}>
                    Cancelar
                </Button>
                <Button 
                    className="flex-[2] h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 gap-2"
                    onClick={handleProcessSale}
                    disabled={isProcessing}
                >
                    {isProcessing ? <CircleNotch className="h-5 w-5 animate-spin" /> : 'Confirmar Venta'}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Receipt Modal: Formal & Clean */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="sm:max-w-md border-none shadow-3xl rounded-[3rem] p-0 overflow-hidden bg-white">
          <div className="p-10 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-700">
               <CheckCircle className="h-12 w-12" weight="fill" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Venta Completada</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date().toLocaleString()}</p>
            
            <div className="w-full mt-10 p-8 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3">
                    <span>Folio</span>
                    <span className="text-slate-900">{lastSale?.numero_factura || '#----'}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pagado</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">{formatMoney(lastSale?.total || 0)}</span>
                </div>
            </div>

            <div className="w-full mt-10 grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-bold uppercase tracking-widest text-[10px] gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" /> Imprimir Ticket
                </Button>
                <Button className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-[10px]" onClick={() => { setIsReceiptModalOpen(false); clearCart(); }}>
                    Nueva Venta
                </Button>
            </div>
            
            <p className="mt-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Licora SaaS v2</p>
          </div>
        </DialogContent>
      </Dialog>

      <ArqueoCajaModal 
        isOpen={isCloseCajaOpen}
        onOpenChange={setIsCloseCajaOpen}
        activeCaja={activeSesion}
        formatMoney={formatMoney}
        isProcessing={isProcessing}
        onConfirm={handleCerrarCaja}
      />

      {/* Modal de Egresos */}
      <Dialog open={isEgresoModalOpen} onOpenChange={setIsEgresoModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Money className="h-6 w-6" weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-slate-900 leading-none">Registrar Egreso</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-0.5">Salida de efectivo de gaveta</p>
              </div>
            </div>

            <form onSubmit={handleEgresoSubmit} className="space-y-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Monto a Retirar</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300 group-focus-within:text-rose-500 transition-colors">{currencySymbol}</span>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="h-14 bg-slate-50 border-none text-2xl font-black text-slate-900 pl-12 rounded-xl focus-visible:ring-rose-500/20"
                    value={egresoMonto}
                    onChange={(e) => setEgresoMonto(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Motivo / Descripción</label>
                <Input 
                  placeholder="Ej. Pago de hielo, proveedores..."
                  className="h-14 bg-slate-50 border-none text-sm font-bold text-slate-900 rounded-xl focus-visible:ring-rose-500/20"
                  value={egresoMotivo}
                  onChange={(e) => setEgresoMotivo(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-xs font-bold text-slate-400" onClick={() => setIsEgresoModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" className="flex-[2] h-12 rounded-xl bg-rose-500 hover:bg-rose-600 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200" disabled={isRecordingEgreso}>
                  {isRecordingEgreso ? <CircleNotch className="h-4 w-4 animate-spin" /> : 'Confirmar Salida'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
