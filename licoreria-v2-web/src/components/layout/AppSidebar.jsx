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
  House,
  Tag,
  ChartBar,
  Key,
  CashRegister,
  HardDrives
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
import { Logo } from "@/components/ui/Logo"

// Todos los ítems del menú con su permiso requerido.
// Si permission es null, cualquier usuario autenticado lo ve (ej. el Escritorio básico).
const ALL_MENU_ITEMS = [
  // Super Admin
  { role: 'super-admin', label: "General", title: "Dashboard", url: "/central", icon: Layout },
  { role: 'super-admin', label: "General", title: "Licorerías", url: "/central/tenants", icon: Buildings },
  { role: 'super-admin', label: "General", title: "Licencias", url: "/central/licenses", icon: Key },
  { role: 'super-admin', label: "General", title: "Respaldos", url: "/central/backups", icon: HardDrives },
  { role: 'super-admin', label: "Configuración", title: "Ajustes Globales", url: "/central/settings", icon: Gear },

  // Administración (acceso al panel)
  { permission: 'ver.reporte-diario',    label: "Administración", title: "Escritorio",       url: "/admin",            icon: House },
  { permission: 'gestionar.sucursales',  label: "Administración", title: "Sucursales",        url: "/admin/sucursales", icon: Storefront },
  { permission: 'gestionar.sucursales',  label: "Administración", title: "Cajas Físicas",      url: "/admin/cajas",      icon: CashRegister },
  { permission: 'gestionar.usuarios',    label: "Administración", title: "Usuarios & Roles",  url: "/admin/usuarios",   icon: Users },

  // Inventario
  { permission: 'ver.productos',         label: "Inventario", title: "Productos",         url: "/admin/productos",   icon: Package },
  { permission: 'gestionar.categorias',  label: "Inventario", title: "Categorías",        url: "/admin/categorias",  icon: ShieldCheck },
  { permission: 'ver.productos',         label: "Inventario", title: "Medidas",           url: "/admin/medidas",     icon: Tag },
  { permission: 'gestionar.proveedores', label: "Inventario", title: "Proveedores",       url: "/admin/proveedores", icon: Truck },
  { permission: 'ajustar.stock',         label: "Inventario", title: "Ajustes de Stock",  url: "/admin/inventario",  icon: ClockCounterClockwise },

  // Compras
  { permission: 'registrar.compra',      label: "Compras", title: "Nueva Compra",      url: "/admin/compras/nueva", icon: ShoppingCart },
  { permission: 'ver.historial-compras', label: "Compras", title: "Historial Compras", url: "/admin/compras",       icon: FileText },

  // Ventas & Caja
  { permission: 'acceso.pos',            label: "Ventas & Caja", title: "Punto de Venta",   url: "/pos",            icon: CashRegister },
  { permission: 'crear.venta',           label: "Ventas & Caja", title: "Mis Ventas",        url: "/pos/mis-ventas", icon: Receipt },
  { permission: 'ver.historial-ventas',  label: "Ventas & Caja", title: "Historial Ventas",  url: "/admin/ventas",   icon: ClockCounterClockwise },
  { permission: 'ver.reporte-utilidades',label: "Ventas & Caja", title: "Reportes",          url: "/admin/reportes", icon: ChartBar },

  // Configuración
  { permission: 'gestionar.roles',       label: "Configuración", title: "Seguridad y Ajustes", url: "/admin/settings", icon: Gear },
  { permission: 'ajustes.sistema',        label: "Configuración", title: "Respaldos",            url: "/admin/backups",  icon: HardDrives },
];

export default function AppSidebar() {
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
    <Sidebar className="border-r bg-background">
      <SidebarHeader className="h-14 flex items-center justify-center border-none">
        <Logo className="h-8 w-auto" />
      </SidebarHeader>
      
      <SidebarContent className="px-4 py-4 space-y-4">
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive}
                        className={`h-9 px-3 transition-all rounded-lg group ${
                          isActive 
                            ? '!bg-primary !text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon 
                            className={`h-4 w-4 transition-colors ${
                              isActive ? '!text-primary-foreground' : 'group-hover:text-foreground'
                            }`} 
                            weight={isActive ? 'bold' : 'regular'}
                          />
                          <span className={`text-[13px] font-medium ${isActive ? '!text-primary-foreground' : ''}`}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t bg-muted/20 p-4">
        <Link to="/admin/perfil" className="flex items-center gap-3 mb-4 px-2 hover:bg-muted/50 p-2 rounded-lg transition-colors group">
          <Avatar className="h-9 w-9 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
            <AvatarFallback className="text-[11px] font-bold bg-primary text-primary-foreground">
                      {(() => {
                        if (!user?.name) return "US";
                        const parts = user.name.trim().split(/\s+/);
                        if (parts.length === 0) return "US";
                        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
                        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                      })()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">{user?.name || "Usuario"}</span>
            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter font-medium group-hover:text-primary/70 transition-colors">Mi Perfil</span>
          </div>
          <Gear className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full h-10 justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg px-2 transition-all gap-2"
          onClick={logout}
        >
          <SignOut className="h-4 w-4" weight="bold" />
          <span className="text-xs font-semibold">Cerrar Sesión</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
