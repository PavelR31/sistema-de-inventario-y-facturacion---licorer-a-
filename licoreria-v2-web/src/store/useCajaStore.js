import { create } from 'zustand';
import api from '@/lib/api';

export const useCajaStore = create((set, get) => ({
  isCajaOpen: false,
  activeSesion: null,
  isLoading: true,

  checkCajaStatus: async (sucursalId, silent = false) => {
    if (!sucursalId) {
      set({ isLoading: false });
      return;
    }
    if (!silent) set({ isLoading: true });
    try {
      const response = await api.get('/api/caja-sesiones/active');
      const sesion = response.data && response.data.id ? response.data : null;
      set({ 
        isCajaOpen: !!sesion, 
        activeSesion: sesion,
        isLoading: false 
      });
    } catch (error) {
      set({ isCajaOpen: false, activeSesion: null, isLoading: false });
    }
  },

  abrirCaja: async (cajaId, monto) => {
    try {
      const response = await api.post('/api/caja-sesiones/abrir', {
        caja_id: cajaId,
        monto_real: monto
      });
      set({ isCajaOpen: true, activeSesion: response.data });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al abrir caja' };
    }
  },

  cerrarCaja: async (monto) => {
    const { activeSesion } = get();
    if (!activeSesion || !activeSesion.id || activeSesion.id === 'undefined') return { success: false, message: 'ID de sesión inválido' };
    try {
      await api.post(`/api/caja-sesiones/cerrar/${activeSesion.id}`, {
        monto_real: monto
      });
      set({ isCajaOpen: false, activeSesion: null });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al cerrar caja' };
    }
  },

  registrarEgreso: async (monto, motivo) => {
    try {
      const response = await api.post('/api/caja-egresos', { monto, motivo });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error al registrar egreso' };
    }
  }
}));
