import { useAuthStore } from '@/store/useAuthStore';

/**
 * Componente de Control de Permisos.
 * Renderiza sus hijos SOLO si el usuario tiene el permiso indicado.
 * 
 * Uso:
 *   <Can permission="crear.producto">
 *     <Button>Nuevo Producto</Button>
 *   </Can>
 * 
 * Para múltiples permisos (el usuario necesita AL MENOS UNO):
 *   <Can permission={["editar.producto", "eliminar.producto"]}>
 *     ...
 *   </Can>
 */
export default function Can({ permission, children, fallback = null }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const allowed = Array.isArray(permission)
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission);

  return allowed ? children : fallback;
}
