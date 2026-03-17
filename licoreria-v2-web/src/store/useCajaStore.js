import { create } from 'zustand';
import api from '@/lib/api';

export const useCajaStore = create((set, get) => ({
  isCajaOpen: false,
  activeCaja: null,
  isLoading: true,

  checkCajaStatus: async (sucursalId) => {
    if (!sucursalId) return;
    set({ isLoading: true });
    try {
      const response = await api.get(`/api/caja/status?sucursal_id=${sucursalId}`);
      set({ 
        isCajaOpen: response.data.is_open, 
        activeCaja: response.data.caja,
        isLoading: false 
      });
    } catch (error) {
      set({ isCajaOpen: false, activeCaja: null, isLoading: false });
    }
  },

  abrirCaja: async (sucursalId, monto) => {
    try {
      const response = await api.post('/api/caja/abrir', {
        sucursal_id: sucursalId,
        monto_apertura: monto
      });
      set({ isCajaOpen: true, activeCaja: response.data });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al abrir caja' };
    }
  },

  cerrarCaja: async (monto) => {
    const { activeCaja } = get();
    if (!activeCaja) return;
    try {
      await api.post(`/api/caja/cerrar/${activeCaja.id}`, {
        monto_cierre: monto
      });
      set({ isCajaOpen: false, activeCaja: null });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al cerrar caja' };
    }
  }
}));
