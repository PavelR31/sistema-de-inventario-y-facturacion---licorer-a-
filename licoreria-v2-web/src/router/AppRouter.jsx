import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Auth/Login";
import ChangePassword from "@/pages/Auth/ChangePassword";
import BranchSelection from "@/pages/Auth/BranchSelection";
import TenantsList from "@/pages/Central/TenantsList";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import SucursalesList from "@/pages/Admin/SucursalesList";
import UsuariosList from "@/pages/Admin/UsuariosList";
import ProductosList from "@/pages/Admin/ProductosList";
import CategoriasList from "@/pages/Admin/CategoriasList";
import MedidasList from "@/pages/Admin/MedidasList";
import ProveedoresList from "@/pages/Admin/ProveedoresList";
import LicenseManagement from "@/pages/Central/LicenseManagement";
import NuevaCompra from "@/pages/Admin/NuevaCompra";
import ComprasHistory from "@/pages/Admin/ComprasHistory";
import SalesHistory from "@/pages/Admin/SalesHistory";
import SettingsPage from "@/pages/Admin/SettingsPage";
import Reportes from "@/pages/Admin/Reportes";
import CajasList from "@/pages/Admin/CajasList";
import POS from "@/pages/POS/POS";
import MySales from "@/pages/POS/MySales";
import CajaFlow from "@/components/layout/CajaFlow";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

import AjustesStock from "@/pages/Admin/AjustesStock";

// Placeholder Pages
const Dashboard = () => {
  const { roles } = useAuthStore();
  const role = roles?.[0];

  if (role === 'super-admin') return <Navigate to="/central" replace />;
  if (role === 'Administrador' || role === 'Gerente') return <Navigate to="/admin" replace />;
  return <Navigate to="/pos" replace />;
};

const SuperAdminDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    <div>
      <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-1">Centro de Control</h1>
      <p className="text-slate-500 text-sm font-medium tracking-tight">Gestión global de la red de negocios.</p>
    </div>
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="border-none shadow-xl shadow-slate-100/50 p-8 glass">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Total Negocios</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">12</p>
      </Card>
      <Card className="border-none shadow-xl shadow-slate-100/50 p-8 glass">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Ventas Globales</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">$125,430</p>
      </Card>
      <Card className="border-none shadow-xl shadow-slate-100/50 p-8 glass">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Suscripciones</h3>
        <p className="text-4xl font-black text-slate-900 tracking-tighter">10</p>
      </Card>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles, requiredPermission }) => {
  const { user, roles, branch, hasRole, hasPermission, mustChangePassword } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;

  // Si debe cambiar contraseña y no está en la página de cambio, redirigir
  if (mustChangePassword && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  const isSuperAdmin = hasRole('super-admin');

  // Si no es super-admin y no ha seleccionado sucursal, enviarlo a elegir una
  if (user && !isSuperAdmin && !branch && window.location.pathname !== '/select-branch' && !mustChangePassword) {
    return <Navigate to="/select-branch" replace />;
  }

  // Validación por Rol
  if (allowedRoles && !allowedRoles.some(r => roles.includes(r))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-4xl font-black text-slate-200">403</h1>
        <p className="text-slate-500 font-medium">No tienes el cargo necesario para ver esta sección.</p>
        <Button onClick={() => window.location.href = '/'}>Ir al Inicio</Button>
      </div>
    );
  }

  // Validación por Permiso (Dinámico)
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center p-6">
        <div className="bg-destructive/10 p-4 rounded-full">
          <ShieldCheck className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Acceso Restringido</h1>
        <p className="text-slate-500 text-sm max-w-xs">
          Tu usuario no cuenta con el permiso específico <code className="bg-slate-100 px-1 rounded text-primary">{requiredPermission}</code> para realizar esta acción.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>Regresar</Button>
      </div>
    );
  }
  
  return children;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/select-branch",
    element: (
      <ProtectedRoute>
        <BranchSelection />
      </ProtectedRoute>
    ),
  },
  {
    path: "/change-password",
    element: (
      <ProtectedRoute>
        <ChangePassword />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      // Super Admin Routes
      {
        path: "central",
        element: <ProtectedRoute allowedRoles={['super-admin']}><SuperAdminDashboard /></ProtectedRoute>,
      },
      {
        path: "central/tenants",
        element: <ProtectedRoute allowedRoles={['super-admin']}><TenantsList /></ProtectedRoute>,
      },
      {
        path: "central/licenses",
        element: <ProtectedRoute allowedRoles={['super-admin']}><LicenseManagement /></ProtectedRoute>,
      },
      // Tenant Admin Routes
      {
        path: "admin",
        element: <ProtectedRoute requiredPermission="ver.reporte-diario"><AdminDashboard /></ProtectedRoute>,
      },
      {
        path: "admin/sucursales",
        element: <ProtectedRoute requiredPermission="gestionar.sucursales"><SucursalesList /></ProtectedRoute>,
      },
      {
        path: "admin/usuarios",
        element: <ProtectedRoute requiredPermission="gestionar.usuarios"><UsuariosList /></ProtectedRoute>,
      },
      {
        path: "admin/cajas",
        element: <ProtectedRoute requiredPermission="gestionar.sucursales"><CajasList /></ProtectedRoute>,
      },
      {
        path: "admin/productos",
        element: <ProtectedRoute requiredPermission="ver.productos"><ProductosList /></ProtectedRoute>,
      },
      {
        path: "admin/categorias",
        element: <ProtectedRoute requiredPermission="gestionar.categorias"><CategoriasList /></ProtectedRoute>,
      },
      {
        path: "admin/medidas",
        element: <ProtectedRoute requiredPermission="ver.productos"><MedidasList /></ProtectedRoute>,
      },
      {
        path: "admin/inventario",
        element: <ProtectedRoute requiredPermission="ajustar.stock"><AjustesStock /></ProtectedRoute>,
      },
      {
        path: "admin/proveedores",
        element: <ProtectedRoute requiredPermission="gestionar.proveedores"><ProveedoresList /></ProtectedRoute>,
      },
      {
        path: "admin/compras",
        element: <ProtectedRoute requiredPermission="ver.historial-compras"><ComprasHistory /></ProtectedRoute>,
      },
      {
        path: "admin/compras/nueva",
        element: <ProtectedRoute requiredPermission="registrar.compra"><NuevaCompra /></ProtectedRoute>,
      },
      {
        path: "admin/ventas",
        element: <ProtectedRoute requiredPermission="ver.historial-ventas"><SalesHistory /></ProtectedRoute>,
      },
      {
        path: "admin/settings",
        element: <ProtectedRoute requiredPermission="gestionar.roles"><SettingsPage /></ProtectedRoute>,
      },
      {
        path: "admin/reportes",
        element: <ProtectedRoute requiredPermission="ver.reporte-utilidades"><Reportes /></ProtectedRoute>,
      },
      // POS Routes
      {
        path: "pos",
        element: (
          <ProtectedRoute requiredPermission="acceso.pos">
            <CajaFlow>
              <POS />
            </CajaFlow>
          </ProtectedRoute>
        ),
      },
      {
        path: "pos/mis-ventas",
        element: <ProtectedRoute requiredPermission="crear.venta"><MySales /></ProtectedRoute>,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
