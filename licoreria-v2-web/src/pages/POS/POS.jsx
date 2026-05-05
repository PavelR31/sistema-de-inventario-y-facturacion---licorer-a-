import { useState, useEffect, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
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
import api, { getImageUrl } from '@/lib/api';
import { FallbackImage } from '@/components/ui/fallback-image';
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
  
  // Presentation Selection State
  const [selectedProductForPresentation, setSelectedProductForPresentation] = useState(null);

  // Barcode search handler: triggered on Enter key in search field
  const handleBarcodeSearch = async (term) => {
    if (!term.trim()) return;
    // If it's a pure name search (no special chars, matches locally), skip barcode API
    const localNameMatch = products.find(p =>
      p.nombre.toLowerCase().includes(term.toLowerCase())
    );
    // A barcode is unlikely to match by name; only skip API if term looks like a plain name
    // We always call the API if it could be a barcode (contains digits or hyphens)
    const looksLikeBarcode = /[\d\-]/.test(term);
    if (localNameMatch && !looksLikeBarcode) return;

    try {
      const res = await api.get('/api/productos/buscar-barcode', { params: { code: term } });
      if (res.data.found) {
        const producto = res.data.producto;
        const presentacionId = res.data.matched_presentacion_id;
        const presentacion = presentacionId
          ? producto.presentaciones?.find(p => p.id === presentacionId) || null
          : null;

        if (producto.stock_actual <= 0) {
          toast.error(`Sin stock para '${producto.nombre}'`);
          return;
        }

        addToCart(producto, presentacion);
        toast.success(presentacion
          ? `${producto.nombre} (${presentacion.nombre}) → carrito`
          : `${producto.nombre} → carrito`);
        setSearchTerm('');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Código no encontrado');
      }
    }
  };

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

  const fetchInitialData = async (silent = false) => {
    if (!branch?.id) return;
    if (!silent) setIsLoading(true);
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
            presentacion_id: i.presentacion_id || null,
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
      // NO clearCart here to avoid UI flash in background
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      
      // Delay fetch slightly but it's now mostly background and silent
      setTimeout(() => {
        fetchInitialData(true);
      }, 2000);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  const quickPay = (amount) => {
      setMontoPagado(amount.toString());
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter(p => p.categoria_id === selectedCategory);
    }

    if (searchTerm) {
      const fuse = new Fuse(result, {
        keys: ['nombre', 'codigo'],
        threshold: 0.3, // Permite errores ortográficos
        ignoreLocation: true,
      });
      result = fuse.search(searchTerm).map(res => res.item);
    }

    return result;
  }, [products, searchTerm, selectedCategory]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  const currentProducts = useMemo(() => {
    return filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredProducts, indexOfFirstItem, indexOfLastItem]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [searchTerm, selectedCategory, viewMode]);

  const subtotalCart = useMemo(() => getTotal(), [cart]);
  const montoImponible = useMemo(() => Math.max(0, subtotalCart - globalDiscount), [subtotalCart, globalDiscount]);
  const montoIVA = useMemo(() => Math.round(montoImponible * (ivaPorcentaje / 100) * 100) / 100, [montoImponible, ivaPorcentaje]);
  const totalFinal = useMemo(() => montoImponible + montoIVA, [montoImponible, montoIVA]);

  const cambio = Math.max(0, (parseFloat(montoPagado) || 0) - totalFinal);

  // Bill denominations for NIO (common)
  const bills = [10, 20, 50, 100, 200, 500, 1000];

  const handlePrint = () => {
      if (!lastSale) return;
      const hostname = window.location.hostname;
      const printUrl = `http://${hostname}:8000/api/ventas/${lastSale.id}/print`;
      
      // Create hidden iframe for printing to avoid window.open "freeze"
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      iframe.src = printUrl;
      
      document.body.appendChild(iframe);
      
      // Cleanup after a reasonable time
      setTimeout(() => {
          if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
          }
      }, 5000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] -m-6 lg:-m-10 bg-background overflow-hidden animate-in fade-in duration-500">
      {/* POS Top Header */}
      <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Scan className="h-4.5 w-4.5 text-primary-foreground" weight="regular" />
          </div>
          <div>
            <h1 className="text-sm font-black text-foreground leading-none">Punto de Venta</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-70">{branch?.nombre || 'Sucursal'} • Caja Central</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px] shadow-green-500/50"></div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sistema Online</span>
            </div>
            
            <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-destructive/20 text-destructive font-bold bg-destructive/10 hover:bg-destructive/20 transition-all rounded-lg"
                onClick={() => setIsEgresoModalOpen(true)}
            >
                <Money className="h-4 w-4 mr-2" />
                Registrar Egreso
            </Button>

            <Button 
                variant="outline" 
                size="sm" 
                className="h-9 border-border text-foreground font-bold bg-muted hover:bg-muted/80 transition-all rounded-lg"
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
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input 
                placeholder="Buscar por nombre o escanear código de barras..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBarcodeSearch(searchTerm);
                  }
                }}
                className="pl-12 h-14 bg-card border-border rounded-xl shadow-sm focus-visible:ring-primary/20 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-2">
                <Button 
                  variant={!selectedCategory ? 'default' : 'outline'}
                  size="sm"
                  className={`h-9 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${!selectedCategory ? 'bg-primary shadow-sm' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  Todos
                </Button>
                {categories.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    className={`h-9 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-primary shadow-sm' : 'border-border bg-card text-muted-foreground hover:bg-muted'}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.nombre}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border shadow-sm ml-auto">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={`h-8 w-8 rounded-lg ${viewMode === 'grid' ? 'bg-primary shadow-sm' : 'text-muted-foreground'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <SquaresFour size={18} weight={viewMode === 'grid' ? 'fill' : 'regular'} />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="icon" 
                  className={`h-8 w-8 rounded-lg ${viewMode === 'list' ? 'bg-primary shadow-sm' : 'text-muted-foreground'}`}
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
                    <div key={i} className="aspect-[4/5] rounded-2xl bg-muted animate-pulse border border-border/50"></div>
                  ))}
                </div>
              ) : currentProducts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center bg-muted/20 rounded-3xl border-2 border-dashed border-border py-20 text-center">
                      <Package className="h-16 w-16 text-muted-foreground/20 mb-4" weight="thin" />
                      <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">No se encontraron productos</p>
                  </div>
              ) : viewMode === 'grid' ? (
                <div key={`grid-${selectedCategory || 'all'}`} className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in zoom-in duration-300">
                  {currentProducts.map(product => (
                    <Card 
                      key={product.id}
                      className={`group cursor-pointer border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col bg-card ${product.stock_actual <= 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      onClick={() => {
                        if (product.presentaciones && product.presentaciones.length > 0) {
                          setSelectedProductForPresentation(product);
                        } else {
                          addToCart(product, null);
                        }
                      }}
                    >
                      <div className="aspect-square bg-muted/30 relative overflow-hidden flex items-center justify-center p-6">
                        {(product.imagen_url || product.imagen_ruta) ? (
                            <FallbackImage 
                              src={product.imagen_url || getImageUrl(product.imagen_ruta)} 
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              alt={product.nombre} 
                              fallbackIcon={BeerStein}
                              fallbackClass="h-16 w-16 text-muted-foreground group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500"
                            />
                        ) : (
                            <BeerStein className="h-16 w-16 text-muted-foreground group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500" />
                        )}
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${product.stock_actual < 5 ? 'bg-destructive/10 text-destructive' : 'bg-card/90 border border-border text-muted-foreground'}`}>
                              Stock: {product.stock_actual}
                            </span>
                            {product.presentaciones && product.presentaciones.length > 0 && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                {product.presentaciones.length} Formato{product.presentaciones.length > 1 ? 's' : ''}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-1 bg-card border-t border-border">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{product.categoria?.nombre || 'General'}</p>
                        <h3 className="font-bold text-foreground text-sm leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {product.nombre}
                        </h3>
                        <div className="mt-auto flex items-center justify-between pt-2">
                           <span className="text-lg font-black text-foreground tracking-tighter">{formatMoney(product.precio_venta)}</span>
                           <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary transition-colors">
                              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary-foreground" weight="bold" />
                           </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div key={`list-${selectedCategory || 'all'}`} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                   {currentProducts.map(product => (
                     <div 
                      key={product.id}
                      className={`flex items-center gap-4 p-3 bg-card rounded-2xl border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group ${product.stock_actual <= 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                      onClick={() => {
                        if (product.presentaciones && product.presentaciones.length > 0) {
                          setSelectedProductForPresentation(product);
                        } else {
                          addToCart(product, null);
                        }
                      }}
                     >
                        <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border overflow-hidden">
                            {(product.imagen_url || product.imagen_ruta) ? (
                              <FallbackImage 
                                src={product.imagen_url || getImageUrl(product.imagen_ruta)} 
                                className="h-full w-full object-cover" 
                                alt={product.nombre}
                                fallbackIcon={BeerBottle}
                                fallbackClass="h-7 w-7 text-muted-foreground"
                              />
                            ) : <BeerBottle className="h-7 w-7 text-muted-foreground" />}
                         </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-foreground text-sm truncate group-hover:text-primary transition-colors">{product.nombre}</h3>
                              <Badge variant="outline" className="text-[8px] font-black uppercase h-4 px-1 border-border text-muted-foreground tracking-widest">{product.categoria?.nombre || 'General'}</Badge>
                           </div>
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">Existencia: {product.stock_actual} unidades</p>
                        </div>
                        <div className="text-right">
                           <p className="text-lg font-black text-foreground tracking-tighter leading-none">{formatMoney(product.precio_venta)}</p>
                           <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Precio Unitario</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary transition-colors ml-2">
                           <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary-foreground" weight="bold" />
                        </div>
                     </div>
                   ))}
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-border mt-4">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                    Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length}
                 </p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="h-9 px-4 rounded-xl border-border bg-card text-muted-foreground font-black uppercase tracking-widest text-[9px] hover:bg-muted"
                    >
                      <CaretLeft size={14} weight="bold" className="mr-1" /> Anterior
                    </Button>
                    <div className="flex items-center gap-1.5 mx-2">
                       {[...Array(totalPages)].map((_, i) => (
                         <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`h-2 rounded-full transition-all duration-300 ${currentPage === i + 1 ? 'bg-primary w-6' : 'bg-muted hover:bg-muted-foreground/20 w-2'}`}
                         />
                       ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="h-9 px-4 rounded-xl border-border bg-card text-muted-foreground font-black uppercase tracking-widest text-[9px] hover:bg-muted"
                    >
                      Siguiente <CaretRight size={14} weight="bold" className="ml-1" />
                    </Button>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Shopping Cart */}
        <div className="w-[400px] bg-card border-l border-border flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)]">
          <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground border border-border/50">
                    <ShoppingCart className="h-5 w-5" weight="regular" />
                </div>
                <div>
                   <h2 className="text-sm font-black text-foreground tracking-tight">Orden Actual</h2>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1 opacity-60">{cart.length} Artículos</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" onClick={clearCart}>
                <Trash className="h-5 w-5" weight="regular" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-5">
                <div className="h-20 w-20 rounded-[2rem] bg-muted/50 flex items-center justify-center border border-border">
                    <Bag className="h-10 w-10 text-muted-foreground/30" weight="thin" />
                </div>
                <div>
                   <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">El carrito está vacío</p>
                   <p className="text-[10px] text-muted-foreground/30 mt-1 uppercase tracking-[0.2em]">Inicie agregando productos</p>
                </div>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartId} className="group p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-all animate-in slide-in-from-right-4 duration-300">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border">
                        {item.imagen_ruta ? (
                            <FallbackImage 
                              src={getImageUrl(item.imagen_ruta)} 
                              className="h-full w-full object-cover rounded-xl" 
                              alt={item.nombre}
                              fallbackIcon={BeerBottle}
                              fallbackClass="h-6 w-6 text-muted-foreground"
                            />
                        ) : <BeerBottle className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-foreground truncate leading-tight mb-1 uppercase tracking-tight">{item.nombre_mostrar}</h4>
                      <p className="text-[11px] font-black text-primary tracking-tighter">{formatMoney(item.precio_venta)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.cartId)}
                      className="text-muted-foreground/30 hover:text-destructive transition-colors self-start"
                    >
                      <Trash className="h-4 w-4" weight="bold" />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
                      <button 
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition-all font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-foreground">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition-all font-bold"
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
                                    <DialogTitle className="text-sm font-black uppercase tracking-widest">Descuento del Artículo</DialogTitle>
                                    <DialogDescription className="text-[10px] font-medium">Aplica un descuento fijo a este producto.</DialogDescription>
                                </DialogHeader>
                                <div className="py-2">
                                    <Input 
                                        type="number" 
                                        placeholder="Monto de descuento"
                                        defaultValue={item.discount}
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            usePOSStore.getState().updateDiscount(item.cartId, val);
                                        }}
                                        className="h-10 text-center font-black border-border bg-muted rounded-lg"
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                        <span className="text-sm font-black text-foreground tracking-tighter">
                          {formatMoney((item.precio_venta * item.quantity) - (item.discount || 0))}
                        </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-muted/30 border-t border-border space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-muted-foreground/60">
                  <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Items</span>
                  <span className="text-xs font-bold">{formatMoney(subtotalCart)}</span>
                </div>
                
                <div className="flex items-center justify-between group cursor-pointer hover:text-primary transition-colors">
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    Descuento Global <Tag size={10} />
                  </span>
                  <input 
                    type="number"
                    value={globalDiscount}
                    onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                    className="w-20 text-right bg-transparent border-none text-xs font-black focus:ring-0 p-0 text-muted-foreground group-hover:text-primary"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center justify-between text-muted-foreground/60">
                  <span className="text-[10px] font-black uppercase tracking-widest">Impuestos ({ivaPorcentaje}%)</span>
                  <span className="text-xs font-bold">{formatMoney(montoIVA)}</span>
                </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border text-foreground">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Total a Cobrar</span>
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
        <DialogContent className="sm:max-w-md border border-border shadow-2xl rounded-[2.5rem] p-0 overflow-hidden bg-card">
          <div className="p-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="h-16 w-16 bg-muted text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 border border-border">
                <CreditCard className="h-8 w-8" weight="regular" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">Finalizar Operación</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{paymentMethod === 'efectivo' ? 'Efectivo Seleccionado' : 'Tarjeta Seleccionada'}</p>
              <div className="mt-6">
                <p className="text-5xl font-black text-foreground tracking-tighter">{formatMoney(totalFinal)}</p>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Recibido</label>
                    <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Vuelto: {formatMoney(cambio)}</span>
                </div>
                <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-muted-foreground group-focus-within:text-primary transition-colors">{currencySymbol}</span>
                    <Input 
                      type="number" 
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                      className="h-18 bg-muted border-border text-3xl font-black text-foreground text-center rounded-2xl shadow-inner focus-visible:ring-primary/20 pl-14"
                      placeholder="0.00"
                      autoFocus
                    />
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {bills.slice(-4).map(bill => (
                        <button key={bill} onClick={() => quickPay(bill)} className="h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground text-[10px] font-black transition-all border border-border">
                            +{bill}
                        </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
                <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] text-muted-foreground/60 hover:bg-muted" onClick={() => setIsPaymentModalOpen(false)}>
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
        <DialogContent className="sm:max-w-md border border-border shadow-2xl rounded-2xl p-0 overflow-hidden bg-card">
          <div className="p-10 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 animate-in fade-in duration-500 border border-green-500/20">
               <CheckCircle className="h-12 w-12" weight="fill" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Venta Completada</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2 opacity-60">{new Date().toLocaleString()}</p>
            
            <div className="w-full mt-10 p-8 rounded-2xl bg-muted/30 border border-border space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border pb-3">
                    <span>Folio</span>
                    <span className="text-foreground">{lastSale?.numero_factura || '#----'}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Pagado</span>
                    <span className="text-3xl font-black text-primary tracking-tighter">{formatMoney(lastSale?.total || 0)}</span>
                </div>
            </div>

            <div className="w-full mt-10 grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-xl border-border bg-card hover:bg-muted font-black uppercase tracking-widest text-[10px] gap-2 text-muted-foreground" onClick={handlePrint}>
                    <Printer className="h-4 w-4" /> Imprimir Ticket
                </Button>
                <Button className="h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20" onClick={() => { 
                    setIsReceiptModalOpen(false); 
                    clearCart(); 
                }}>
                    Nueva Venta
                </Button>
            </div>
            
            <p className="mt-10 text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground">Licora</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Presentation Selection Modal */}
      <Dialog 
        open={!!selectedProductForPresentation} 
        onOpenChange={(open) => !open && setSelectedProductForPresentation(null)}
      >
        <DialogContent className="sm:max-w-md border border-border shadow-2xl rounded-[2rem] p-0 overflow-hidden bg-card">
          {selectedProductForPresentation && (
            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="h-16 w-16 bg-muted text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
                  <Package className="h-8 w-8" weight="regular" />
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight leading-tight">
                  Formato de Venta
                </h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none opacity-60">
                  {selectedProductForPresentation.nombre}
                </p>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                {/* Base Unit Option */}
                <button
                  onClick={() => {
                    addToCart(selectedProductForPresentation, null);
                    setSelectedProductForPresentation(null);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-left bg-card"
                >
                  <div>
                    <span className="block text-sm font-black text-foreground group-hover:text-primary transition-colors">
                      Unidad Suelta
                    </span>
                    <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                      Descuenta 1 unidad
                    </span>
                  </div>
                  <span className="text-lg font-black text-foreground tracking-tighter">
                    {formatMoney(selectedProductForPresentation.precio_venta)}
                  </span>
                </button>

                {/* Presentations Options — only show if they have stock */}
                {selectedProductForPresentation.presentaciones
                  ?.filter(pres => (pres.stock_sucursal ?? 0) > 0)
                  .map(pres => (
                    <button
                      key={pres.id}
                      onClick={() => {
                        addToCart(selectedProductForPresentation, pres);
                        setSelectedProductForPresentation(null);
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-left bg-card"
                    >
                      <div>
                        <span className="block text-sm font-black text-foreground group-hover:text-primary transition-colors">
                          {pres.nombre}
                        </span>
                        <span className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                          Descuenta {pres.cantidad_unidades} unid. &bull; {pres.stock_sucursal} disp.
                        </span>
                      </div>
                      <span className="text-lg font-black text-foreground tracking-tighter">
                        {formatMoney(pres.precio_venta)}
                      </span>
                    </button>
                  ))
                }

                {/* Info if no presentations have stock */}
                {selectedProductForPresentation.presentaciones?.every(p => (p.stock_sucursal ?? 0) === 0) &&
                  selectedProductForPresentation.presentaciones?.length > 0 && (
                  <p className="text-[10px] text-center text-muted-foreground font-black uppercase tracking-[0.2em] py-2 opacity-40">
                    No hay empaques sellados en stock
                  </p>
                )}
              </div>
              
              <Button variant="ghost" className="w-full h-12 rounded-xl text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:bg-muted" onClick={() => setSelectedProductForPresentation(null)}>
                Cancelar
              </Button>
            </div>
          )}
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
        <DialogContent className="sm:max-w-[400px] border border-border shadow-2xl rounded-[2rem] p-0 overflow-hidden bg-card">
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
                <Money className="h-6 w-6" weight="fill" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-foreground tracking-tight leading-none">Registrar Egreso</h3>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2 px-0.5 opacity-60">Salida de efectivo de gaveta</p>
              </div>
            </div>

            <form onSubmit={handleEgresoSubmit} className="space-y-6 pt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Monto a Retirar</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-muted-foreground group-focus-within:text-destructive transition-colors">{currencySymbol}</span>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    className="h-14 bg-muted border-border text-2xl font-black text-foreground pl-12 rounded-xl focus-visible:ring-destructive/20"
                    value={egresoMonto}
                    onChange={(e) => setEgresoMonto(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Motivo / Descripción</label>
                <Input 
                  placeholder="Ej. Pago de hielo, proveedores..."
                  className="h-14 bg-muted border-border text-sm font-bold text-foreground rounded-xl focus-visible:ring-destructive/20"
                  value={egresoMotivo}
                  onChange={(e) => setEgresoMotivo(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1 h-12 rounded-xl text-[10px] font-black text-muted-foreground uppercase tracking-widest" onClick={() => setIsEgresoModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" className="flex-[2] h-12 rounded-xl bg-destructive hover:bg-destructive/90 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20" disabled={isRecordingEgreso}>
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
