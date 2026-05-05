import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Impersonate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Configuramos el estado de autenticación con el nuevo token
      // Para saber de quién es, el ProtectedRoute o Dashboard validarán el token después
      setAuth({
        token: token,
        // Al dejar el resto vacío o null, la app intentará hacer fetch de /api/user 
        // automáticamente porque hay un token válido pero faltan datos
        user: null,
        roles: [],
        permissions: []
      });
      
      toast.success('Sesión iniciada como administrador del negocio.');
      navigate('/', { replace: true });
    } else {
      toast.error('Token de acceso inválido o ausente.');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex flex-col h-screen items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Entrando al sistema del cliente...</p>
    </div>
  );
}
