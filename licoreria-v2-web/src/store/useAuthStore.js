import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      roles: [], // Array de roles del usuario
      permissions: [], // Array de permisos dinámicos (nombres)
      token: null,
      tenant: null,
      branch: null, // Sucursal seleccionada
      mustChangePassword: false, // Flag para forzar cambio de contraseña
      currency: 'NIO', // 'NIO' para Córdobas, 'USD' para Dólares
      
      setAuth: (user, roles, permissions, token, tenant = null, mustChangePassword = false) => {
        set({ user, roles, permissions, token, tenant, mustChangePassword });
        if (token) localStorage.setItem('auth_token', token);
        if (tenant) localStorage.setItem('active_tenant', tenant);
        
        // Si el usuario ya tiene una sucursal fija asignada, la seteamos automáticamente
        if (user?.sucursal) {
           set({ branch: user.sucursal });
           localStorage.setItem('active_branch', JSON.stringify(user.sucursal));
        }
      },

      hasPermission: (permission) => {
        // El 'Administrador' siempre tiene todos los permisos por convención
        if (get().roles?.includes('Administrador')) return true;
        return get().permissions?.includes(permission);
      },

      hasRole: (role) => {
        return get().roles?.includes(role);
      },

      setCurrency: (currency) => {
        set({ currency });
      },

      setBranch: (branch) => {
        set({ branch });
        if (branch) localStorage.setItem('active_branch', JSON.stringify(branch));
      },
      
      logout: () => {
        set({ user: null, roles: [], permissions: [], token: null, tenant: null, branch: null, mustChangePassword: false });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('active_tenant');
        localStorage.removeItem('active_branch');
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
