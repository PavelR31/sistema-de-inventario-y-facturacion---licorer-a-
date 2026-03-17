import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const isCentral = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const endpoint = isCentral ? '/api/central/login' : '/api/login';
      
      const response = await api.post(endpoint, { email, password });
      const { user, token, roles, permissions, must_change_password } = response.data;
      
      // Asegurarnos de que roles y permissions sean arrays
      const finalRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);
      const finalPermissions = Array.isArray(permissions) ? permissions : (permissions ? [permissions] : []);

      setAuth(user, finalRoles, finalPermissions, token, null, !!must_change_password);
      
      toast.success('¡Bienvenido de nuevo, ' + (user.name || 'Admin') + '!');

      if (must_change_password) {
        navigate('/change-password');
      } else if (isCentral || finalRoles.includes('super-admin')) {
        navigate('/central');
      } else if (finalRoles.includes('Administrador') || finalRoles.includes('Gerente')) {
        navigate('/admin');
      } else {
        navigate('/pos');
      }
    } catch (error) {
      console.error('Login Error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Acceso Denegado', {
          description: 'El correo o la contraseña son incorrectos. Por favor, verifica tus datos de acceso.',
        });
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Error de Conexión', {
          description: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
        });
      } else {
        const message = error.response?.data?.message || 'Ocurrió un error inesperado al iniciar sesión.';
        toast.error('Error de Sistema', {
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-6 group hover:rotate-6 transition-transform duration-500">
             <div className="h-6 w-6 border-2 border-white rounded-md flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-full"></div>
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Licora</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Smart Business Logic</p>
        </div>

        <Card className="border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardHeader className="pt-10 pb-6 text-center">
            <h2 className="text-xl font-bold text-slate-800">Bienvenido</h2>
            <CardDescription className="text-slate-400 font-medium">
              Ingrese a su terminal administrativa
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="px-8 space-y-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Correo Corporativo</label>
                <Input 
                  type="email" 
                  placeholder="usuario@licora.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-13 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-primary/20 transition-all font-medium text-slate-900"
                  required 
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña</label>
                    <button type="button" className="text-[10px] font-bold text-primary hover:underline">¿La olvidó?</button>
                </div>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-13 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-primary/20 transition-all font-medium text-slate-900"
                  required 
                />
              </div>
            </CardContent>
            
            <CardFooter className="px-8 pb-10 pt-4 flex flex-col gap-6">
              <Button 
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all group" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Autenticando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Acceder al Sistema</span>
                  </div>
                )}
              </Button>
              
              <p className="text-[10px] text-slate-300 font-medium text-center uppercase tracking-widest">
                Protegido por Licora Security Layer v2
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
