import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

/**
 * Generic pagination hook for all list views.
 * @param {string} endpoint  – API endpoint (e.g. '/api/productos')
 * @param {object} params    – Extra query params to always send
 * @param {number} perPage   – Items per page (default 15)
 */
export function usePagination(endpoint, params = {}, perPage = 15) {
  const [data, setData]       = useState([]);
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPage = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get(endpoint, {
        params: { ...params, page, per_page: perPage },
      });

      // Support both Laravel paginate() format and plain array
      if (res.data?.data && res.data?.meta) {
        setData(res.data.data);
        setMeta(res.data.meta);
      } else if (res.data?.data && res.data?.last_page !== undefined) {
        // Laravel default paginate format
        setData(res.data.data);
        setMeta({
          current_page: res.data.current_page,
          last_page:    res.data.last_page,
          total:        res.data.total,
        });
      } else {
        // Fallback: plain array (not paginated)
        setData(Array.isArray(res.data) ? res.data : []);
        setMeta({ current_page: 1, last_page: 1, total: Array.isArray(res.data) ? res.data.length : 0 });
      }
    } catch (err) {
      toast.error('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, perPage, JSON.stringify(params)]);

  return { data, meta, isLoading, fetchPage };
}
