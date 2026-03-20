import * as React from "react"
import {
  Layout,
  SignOut,
  Package,
  Gear,
  ShoppingCart,
  Storefront,
  Users,
  CreditCard,
  ClockCounterClockwise,
  ShieldCheck,
  Buildings,
  Truck,
  FileText,
  Receipt,
  ChartPieSlice,
  CashRegister,
  House
} from "@phosphor-icons/react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store/useAuthStore"
import { Link, useLocation } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// Todos los ítems del menú con su permiso requerido.
// Si permission es null, cualquier usuario autenticado lo ve (ej. el Escritorio básico).
const ALL_MENU_ITEMS = [
  // Super Admin
  { role: 'super-admin', label: "General", title: "Dashboard", url: "/central", icon: Layout },
  { role: 'super-admin', label: "General", title: "Licorerías", url: "/central/tenants", icon: Buildings },
  { role: 'super-admin', label: "Configuración", title: "Ajustes Globales", url: "/central/settings", icon: Gear },

  // Administración (acceso al panel)
  { permission: 'ver.reporte-diario',    label: "Administración", title: "Escritorio",       url: "/admin",            icon: House },
  { permission: 'gestionar.sucursales',  label: "Administración", title: "Sucursales",        url: "/admin/sucursales", icon: Storefront },
  { permission: 'gestionar.sucursales',  label: "Administración", title: "Cajas Físicas",      url: "/admin/cajas",      icon: CashRegister },
  { permission: 'gestionar.usuarios',    label: "Administración", title: "Usuarios & Roles",  url: "/admin/usuarios",   icon: Users },

  // Inventario
  { permission: 'ver.productos',         label: "Inventario", title: "Productos",         url: "/admin/productos",   icon: Package },
  { permission: 'gestionar.categorias',  label: "Inventario", title: "Categorías",        url: "/admin/categorias",  icon: ShieldCheck },
  { permission: 'gestionar.proveedores', label: "Inventario", title: "Proveedores",       url: "/admin/proveedores", icon: Truck },
  { permission: 'ajustar.stock',         label: "Inventario", title: "Ajustes de Stock",  url: "/admin/inventario",  icon: ClockCounterClockwise },

  // Compras
  { permission: 'registrar.compra',      label: "Compras", title: "Nueva Compra",      url: "/admin/compras/nueva", icon: ShoppingCart },
  { permission: 'ver.historial-compras', label: "Compras", title: "Historial Compras", url: "/admin/compras",       icon: FileText },

  // Ventas & Caja
  { permission: 'acceso.pos',            label: "Ventas & Caja", title: "Punto de Venta",   url: "/pos",            icon: CashRegister },
  { permission: 'crear.venta',           label: "Ventas & Caja", title: "Mis Ventas",        url: "/pos/mis-ventas", icon: Receipt },
  { permission: 'ver.historial-ventas',  label: "Ventas & Caja", title: "Historial Ventas",  url: "/admin/ventas",   icon: ClockCounterClockwise },
  { permission: 'ver.reporte-utilidades',label: "Ventas & Caja", title: "Reportes",          url: "/admin/reportes", icon: ChartPieSlice },

  // Configuración
  { permission: 'gestionar.roles',       label: "Configuración", title: "Seguridad y Ajustes", url: "/admin/settings", icon: Gear },
];

export function AppSidebar() {
  const { roles, user, logout, branch, hasPermission, hasRole } = useAuthStore()
  const location = useLocation()
  const role = roles?.[0] || ''
  const isSuperAdmin = hasRole('super-admin')

  // Filtrar ítems según rol de super-admin o permisos individuales
  const visibleItems = ALL_MENU_ITEMS.filter(item => {
    if (item.role) return item.role === role
    if (item.permission) return hasPermission(item.permission)
    return true
  })

  // Agrupar los ítems visibles por label
  const groups = visibleItems.reduce((acc, item) => {
    const group = acc.find(g => g.label === item.label)
    if (group) {
      group.items.push(item)
    } else {
      acc.push({ label: item.label, items: [item] })
    }
    return acc
  }, [])

  return (
    <Sidebar variant="inset" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-20 border-b border-sidebar-border px-6 flex flex-col justify-center bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Buildings className="h-5 w-5 text-white" weight="regular" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white">Licora</span>
            <span className="text-[10px] font-medium text-sidebar-foreground/60 uppercase tracking-wider">Gestión POS</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-8 bg-sidebar space-y-8">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/40 mb-4">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                      className={`h-11 transition-all duration-150 rounded-md hover:bg-sidebar-accent group ${location.pathname === item.url ? 'bg-primary text-white hover:bg-primary/90' : 'text-sidebar-foreground hover:text-white'}`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon 
                          className={`h-4.5 w-4.5 transition-colors ${location.pathname === item.url ? 'text-white' : 'text-sidebar-foreground/50 group-hover:text-white'}`} 
                          weight="regular"
                        />
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-6 bg-sidebar">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="h-9 w-9 border border-sidebar-border bg-sidebar-accent">
            <AvatarFallback className="bg-transparent text-sidebar-foreground font-bold text-[10px]">
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-xs font-semibold text-white truncate">{user?.name || "Usuario"}</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate uppercase tracking-tighter">{branch?.nombre || role}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-10 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all gap-2"
          onClick={logout}
        >
          <SignOut className="h-4 w-4" weight="regular" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
