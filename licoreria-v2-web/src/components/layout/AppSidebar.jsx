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

const data = {
  'super-admin': [
    {
      label: "General",
      items: [
        { title: "Dashboard", url: "/central", icon: Layout },
        { title: "Licorerías", url: "/central/tenants", icon: Buildings },
      ],
    },
    {
      label: "Configuración",
      items: [
        { title: "Ajustes Globales", url: "/central/settings", icon: Gear },
        { title: "Logs del Sistema", url: "/central/logs", icon: ClockCounterClockwise },
      ],
    },
  ],
  'Administrador': [
    {
      label: "Administración",
      items: [
        { title: "Escritorio", url: "/admin", icon: House },
        { title: "Sucursales", url: "/admin/sucursales", icon: Storefront },
        { title: "Usuarios & Roles", url: "/admin/usuarios", icon: Users },
      ],
    },
    {
      label: "Inventario",
      items: [
        { title: "Productos", url: "/admin/productos", icon: Package },
        { title: "Categorías", url: "/admin/categorias", icon: ShieldCheck },
        { title: "Proveedores", url: "/admin/proveedores", icon: Truck },
        { title: "Ajustes de Stock", url: "/admin/inventario", icon: ClockCounterClockwise },
      ],
    },
    {
      label: "Compras",
      items: [
        { title: "Nueva Compra", url: "/admin/compras/nueva", icon: ShoppingCart },
        { title: "Historial Compras", url: "/admin/compras", icon: FileText },
      ],
    },
    {
      label: "Ventas & Caja",
      items: [
        { title: "Punto de Venta", url: "/pos", icon: CashRegister },
        { title: "Historial Ventas", url: "/admin/ventas", icon: Receipt },
        { title: "Reportes", url: "/admin/reportes", icon: ChartPieSlice },
      ],
    },
    {
      label: "Configuración",
      items: [
        { title: "Seguridad y Ajustes", url: "/admin/settings", icon: Gear },
      ],
    },
  ],
  'Gerente': [
    {
        label: "Administración",
        items: [
          { title: "Escritorio", url: "/admin", icon: House },
        ],
      },
      {
        label: "Inventario",
        items: [
          { title: "Productos", url: "/admin/productos", icon: Package },
          { title: "Categorías", url: "/admin/categorias", icon: ShieldCheck },
          { title: "Ajustes de Stock", url: "/admin/inventario", icon: ClockCounterClockwise },
        ],
      },
      {
        label: "Ventas & Caja",
        items: [
          { title: "Punto de Venta", url: "/pos", icon: CashRegister },
          { title: "Historial Ventas", url: "/admin/ventas", icon: Receipt },
        ],
      },
  ],
  'Cajero': [
    {
      label: "Ventas",
      items: [
        { title: "Punto de Venta", url: "/pos", icon: CashRegister },
        { title: "Mis Ventas", url: "/pos/mis-ventas", icon: ClockCounterClockwise },
      ],
    },
  ],
}

export function AppSidebar() {
  const { roles, user, logout, branch } = useAuthStore()
  const location = useLocation()
  const role = roles?.[0] || 'Cajero'
  const groups = data[role] || []

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
