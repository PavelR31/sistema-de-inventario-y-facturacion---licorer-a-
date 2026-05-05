import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Auth/Login";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";

// Lazy Loaded Pages
const ChangePassword = React.lazy(() => import("@/pages/Auth/ChangePassword"));
const BranchSelection = React.lazy(() => import("@/pages/Auth/BranchSelection"));
const TenantsList = React.lazy(() => import("@/pages/Central/TenantsList"));
const CentralDashboard = React.lazy(() => import("@/pages/Central/CentralDashboard"));
const CentralBackups = React.lazy(() => import("@/pages/Central/CentralBackups"));
const AdminDashboard = React.lazy(() => import("@/pages/Admin/AdminDashboard"));
const SucursalesList = React.lazy(() => import("@/pages/Admin/SucursalesList"));
const UsuariosList = React.lazy(() => import("@/pages/Admin/UsuariosList"));
const ProductosList = React.lazy(() => import("@/pages/Admin/ProductosList"));
const CategoriasList = React.lazy(() => import("@/pages/Admin/CategoriasList"));
const MedidasList = React.lazy(() => import("@/pages/Admin/MedidasList"));
const ProveedoresList = React.lazy(() => import("@/pages/Admin/ProveedoresList"));
const LicenseManagement = React.lazy(() => import("@/pages/Central/LicenseManagement"));
const NuevaCompra = React.lazy(() => import("@/pages/Admin/NuevaCompra"));
const ComprasHistory = React.lazy(() => import("@/pages/Admin/ComprasHistory"));
const SalesHistory = React.lazy(() => import("@/pages/Admin/SalesHistory"));
const SettingsPage = React.lazy(() => import("@/pages/Admin/SettingsPage"));
const Reportes = React.lazy(() => import("@/pages/Admin/Reportes"));
const CajasList = React.lazy(() => import("@/pages/Admin/CajasList"));
const POS = React.lazy(() => import("@/pages/POS/POS"));
const MySales = React.lazy(() => import("@/pages/POS/MySales"));
const CajaFlow = React.lazy(() => import("@/components/layout/CajaFlow"));
const AjustesStock = React.lazy(() => import("@/pages/Admin/AjustesStock"));
const BackupsPage = React.lazy(() => import("@/pages/Admin/BackupsPage"));
const ProfilePage = React.lazy(() => import("@/pages/Admin/ProfilePage"));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);




// Placeholder Pages
const Dashboard = () => {
  const { roles } = useAuthStore();
  const role = roles?.[0];

  if (role === 'super-admin') return <Navigate to="/central" replace />;
  if (role === 'Administrador' || role === 'Gerente') return <Navigate to="/admin" replace />;
  return <Navigate to="/pos" replace />;
};

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
        element: <ProtectedRoute allowedRoles={['super-admin']}><CentralDashboard /></ProtectedRoute>,
      },
      {
        path: "central/tenants",
        element: <ProtectedRoute allowedRoles={['super-admin']}><TenantsList /></ProtectedRoute>,
      },
      {
        path: "central/licenses",
        element: <ProtectedRoute allowedRoles={['super-admin']}><LicenseManagement /></ProtectedRoute>,
      },
      {
        path: "central/backups",
        element: <ProtectedRoute allowedRoles={['super-admin']}><CentralBackups /></ProtectedRoute>,
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
      {
        path: "admin/backups",
        element: <ProtectedRoute requiredPermission="ajustes.sistema"><BackupsPage /></ProtectedRoute>,
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
      {
        path: "admin/perfil",
        element: <ProtectedRoute><ProfilePage /></ProtectedRoute>,
      },
    ],
  },
]);

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
