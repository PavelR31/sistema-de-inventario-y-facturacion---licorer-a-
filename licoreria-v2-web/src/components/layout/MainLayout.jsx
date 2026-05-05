import { useEffect, useRef, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, Package, Receipt, User, Loader2, Settings, 
  House, Shield, Database, Store, Banknote, Users, 
  Tag, Ruler, Truck, ArrowLeftRight, Plus, History, 
  BarChart3, XCircle, Percent, Image, Coins, LogOut, Star
} from "lucide-react";
import AppSidebar from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui/Logo";
import api from "@/lib/api";

import { useAuthStore } from "@/store/useAuthStore";

export default function MainLayout() {
  const { user } = useAuthStore();
  
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return "US";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "US";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [systemResults, setSystemResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const SYSTEM_PAGES = [
    // --- ADMINISTRACIÓN & DASHBOARD ---
    { title: 'Escritorio', type: 'Acceso', url: '/admin', icon: 'house', sub: 'Panel principal y estadísticas', keywords: 'dashboard home inicio pantalla principal metricas' },
    { title: 'Mi Perfil', type: 'Acceso', url: '/admin/profile', icon: 'user', sub: 'Editar información y contraseña', keywords: 'perfil cuenta password contraseña mis datos user info' },
    { title: 'Cerrar Sesión', type: 'Acción', url: '/logout', icon: 'log-out', sub: 'Salir del sistema de forma segura', keywords: 'salir logout cerrar session exit' },
    
    // --- CONFIGURACIÓN & SISTEMA ---
    { title: 'Configuración General', type: 'Sistema', url: '/admin/settings', icon: 'gear', sub: 'Ajustes globales del negocio', keywords: 'ajustes settings configuracion empresa' },
    { title: 'Editar IVA / Impuestos', type: 'Sistema', url: '/admin/settings', icon: 'percent', sub: 'Configurar tasas impositivas', keywords: 'iva impuestos tax tributos facturacion' },
    { title: 'Cambiar Logo', type: 'Sistema', url: '/admin/settings', icon: 'image', sub: 'Actualizar logo de la empresa', keywords: 'logo marca branding imagen identidad visual' },
    { title: 'Moneda y Formato', type: 'Sistema', url: '/admin/settings', icon: 'coins', sub: 'Símbolo de moneda y decimales', keywords: 'moneda cordobas dolares money divisas' },
    { title: 'Seguridad y Roles', type: 'Sistema', url: '/admin/settings', icon: 'shield', sub: 'Gestionar permisos y accesos', keywords: 'seguridad roles permisos accesos niveles privilegios' },
    { title: 'Respaldos / Backups', type: 'Sistema', url: '/admin/backups', icon: 'database', sub: 'Copias de seguridad', keywords: 'respaldos backups base de datos descargar copia dump' },

    // --- RECURSOS HUMANOS & LOCALES ---
    { title: 'Sucursales', type: 'Administración', url: '/admin/sucursales', icon: 'store', sub: 'Gestionar locales y tiendas', keywords: 'sucursales tiendas locales establecimientos' },
    { title: 'Cajas Físicas', type: 'Administración', url: '/admin/cajas', icon: 'cash', sub: 'Control de cajas de dinero', keywords: 'cajas efectivo dinero terminales punto de venta' },
    { title: 'Usuarios y Empleados', type: 'Administración', url: '/admin/usuarios', icon: 'users', sub: 'Gestionar personal y accesos', keywords: 'usuarios personal empleados vendedores administradores' },
    
    // --- INVENTARIO & CATÁLOGO ---
    { title: 'Productos', type: 'Inventario', url: '/admin/productos', icon: 'package', sub: 'Catálogo de productos', keywords: 'productos inventario stock mercaderia catalogo' },
    { title: 'Categorías', type: 'Inventario', url: '/admin/categorias', icon: 'tag', sub: 'Organizar productos por grupos', keywords: 'categorias grupos familias lineas' },
    { title: 'Medidas', type: 'Inventario', url: '/admin/medidas', icon: 'rulers', sub: 'Litros, Mililitros, Unidades', keywords: 'medidas unidades pesajes volumen empaques' },
    { title: 'Proveedores', type: 'Inventario', url: '/admin/proveedores', icon: 'truck', sub: 'Gestión de abastecimiento', keywords: 'proveedores compras distribuidores' },
    { title: 'Ajustes de Stock', type: 'Inventario', url: '/admin/inventario', icon: 'arrows', sub: 'Correcciones de inventario', keywords: 'stock ajustes inventario mermas perdidas' },

    // --- COMPRAS & ABASTECIMIENTO ---
    { title: 'Nueva Compra', type: 'Compras', url: '/admin/compras/nueva', icon: 'plus', sub: 'Registrar entrada de mercadería', keywords: 'compra adquisicion entrada abastecimiento' },
    { title: 'Historial de Compras', type: 'Compras', url: '/admin/compras', icon: 'history', sub: 'Ver facturas de proveedores', keywords: 'compras historial facturas gastos' },

    // --- VENTAS & POS ---
    { title: 'Punto de Venta (POS)', type: 'Ventas', url: '/pos', icon: 'receipt', sub: 'Abrir terminal de ventas rápida', keywords: 'pos caja vender factura facturacion' },
    { title: 'Mis Ventas de Hoy', type: 'Ventas', url: '/pos/mis-ventas', icon: 'user', sub: 'Tus ventas realizadas hoy', keywords: 'mis ventas personales hoy vendedor' },
    { title: 'Historial General de Ventas', type: 'Ventas', url: '/admin/ventas', icon: 'history', sub: 'Ver todas las facturas emitidas', keywords: 'ventas historial facturas emitidas boletas listado' },

    // --- REPORTES & ANÁLISIS ---
    { title: 'Reportes y Estadísticas', type: 'Análisis', url: '/admin/reportes', icon: 'chart', sub: 'Análisis de rendimiento', keywords: 'reportes ventas estadisticas graficos ingresos' },
    { title: 'Ventas Anuladas', type: 'Análisis', url: '/admin/reportes', icon: 'x', sub: 'Reporte de facturas canceladas', keywords: 'anulaciones canceladas facturas borradas eliminar' },
    { title: 'Arqueo de Caja', type: 'Análisis', url: '/admin/reportes', icon: 'cash', sub: 'Cuadre y cierre de caja diario', keywords: 'arqueo cuadre cierre caja dinero sobrante faltante' },
    { title: 'Productos más Vendidos', type: 'Análisis', url: '/admin/reportes', icon: 'star', sub: 'Top de productos populares', keywords: 'top ventas mas vendidos populares ranking' },

    // --- SUPER ADMIN (CENTRAL) ---
    { title: 'Panel Central', type: 'SuperAdmin', url: '/central', icon: 'shield', sub: 'Administración de inquilinos', keywords: 'central saas superadmin general' },
    { title: 'Gestión de Licorerías', type: 'SuperAdmin', url: '/central/tenants', icon: 'store', sub: 'Lista de clientes SaaS', keywords: 'tenants inquilinos licorerias clientes' },
    { title: 'Licencias y Suscripciones', type: 'SuperAdmin', url: '/central/licenses', icon: 'key', sub: 'Estado de pagos y licencias', keywords: 'licencias suscripciones pagos renovacion' },
  ];

  const ICON_MAP = {
    house: House,
    user: User,
    gear: Settings,
    shield: Shield,
    database: Database,
    store: Store,
    cash: Banknote,
    users: Users,
    package: Package,
    tag: Tag,
    rulers: Ruler,
    truck: Truck,
    arrows: ArrowLeftRight,
    plus: Plus,
    history: History,
    chart: BarChart3,
    x: XCircle,
    receipt: Receipt,
    percent: Percent,
    image: Image,
    coins: Coins,
    'log-out': LogOut,
    star: Star
  };

  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      setSystemResults([]);
      setShowResults(false);
      return;
    }

    // Local Search for System Pages
    const filteredSystem = SYSTEM_PAGES.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      p.keywords.toLowerCase().includes(search.toLowerCase())
    );
    setSystemResults(filteredSystem);

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/api/reportes/global-search?q=${search}`);
        setResults(res.data);
        setShowResults(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const allItems = [...systemResults, ...results];

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowResults(false);
        searchRef.current?.blur();
      }
    };

    const handleClickOutside = (e) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener("keydown", down);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const target = allItems[selectedIndex];
      window.location.href = target.url;
    }
  };

  const isMac = typeof window !== 'undefined' && navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
              <SidebarTrigger className="-ml-1" />
              <div className="h-4 w-px bg-border mx-1" />
              <div className="hidden md:flex relative max-w-sm flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                  ref={searchRef}
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Buscar en el sistema... (${isMac ? '⌘K' : 'Ctrl+K'})`} 
                  className="w-full pl-9 pr-4 h-9 bg-muted/50 border-none rounded-md text-sm focus:ring-1 focus:ring-primary transition-all outline-none text-foreground placeholder:text-muted-foreground/60"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {showResults && (
                  <div 
                    ref={resultsRef}
                    className="absolute top-full left-0 mt-2 w-[450px] bg-card border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="max-h-[450px] overflow-y-auto">
                      {(systemResults.length > 0 || results.length > 0) ? (
                        <div className="py-2">
                          {/* System Sections */}
                          {systemResults.length > 0 && (
                            <div className="mb-2">
                              <p className="px-4 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30">Secciones del Sistema</p>
                              {systemResults.map((res, i) => (
                                <Link
                                  key={`sys-${i}`}
                                  to={res.url}
                                  onClick={() => setShowResults(false)}
                                  className={`flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors ${
                                    selectedIndex === i ? 'bg-muted' : ''
                                  }`}
                                >
                                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                                    {(() => {
                                      const Icon = ICON_MAP[res.icon] || Settings;
                                      return <Icon className="h-4 w-4" />;
                                    })()}
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-bold text-foreground truncate">{res.title}</p>
                                    <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">{res.type} • {res.sub}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}

                          {/* Records */}
                          {results.length > 0 && (
                            <div>
                              <p className="px-4 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30">Resultados de Base de Datos</p>
                              {results.map((res, i) => {
                                const globalIdx = i + systemResults.length;
                                return (
                                  <Link
                                    key={`rec-${i}`}
                                    to={res.url}
                                    onClick={() => setShowResults(false)}
                                    className={`flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors ${
                                      selectedIndex === globalIdx ? 'bg-muted' : ''
                                    }`}
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border">
                                      {res.icon === 'package' && <Package className="h-4 w-4 text-foreground" />}
                                      {res.icon === 'receipt' && <Receipt className="h-4 w-4 text-foreground" />}
                                      {res.icon === 'user' && <User className="h-4 w-4 text-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="text-sm font-bold text-foreground truncate">{res.title}</p>
                                      <p className="text-[10px] text-muted-foreground truncate uppercase font-medium">{res.type} • {res.sub}</p>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-10 text-center text-muted-foreground">
                          <p className="text-sm">No se encontraron resultados para "{search}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border shadow-sm">
                <span className="text-[10px] font-bold">{getInitials(user?.name)}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </SidebarProvider>
  );
}
