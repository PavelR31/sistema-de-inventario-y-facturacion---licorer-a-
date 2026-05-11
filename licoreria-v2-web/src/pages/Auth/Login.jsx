import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CircleNotch } from "@phosphor-icons/react";
import api from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

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

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsSubmittingForgot(true);
    
    try {
      const isCentral = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Por ahora implementamos la del tenant, que es la solicitada
      const endpoint = isCentral ? '/api/central/forgot-password' : '/api/forgot-password';
      
      const response = await api.post(endpoint, { email: forgotEmail });
      
      toast.success('Correo enviado', {
        description: response.data.message || 'Se ha enviado una nueva contraseña a tu correo.',
      });
      
      setIsForgotOpen(false);
      setForgotEmail('');
    } catch (error) {
      console.error('Forgot Password Error:', error);
      toast.error('Error', {
        description: error.response?.data?.message || 'No se pudo procesar la solicitud.',
      });
    } finally {
      setIsSubmittingForgot(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in duration-500">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo className="h-14" />
          </div>
          <p className="text-sm text-muted-foreground">Ingrese sus credenciales para continuar</p>
        </div>

        <Card className="border shadow-sm p-2">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  type="email" 
                  placeholder="admin@licora.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Contraseña</label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required 
                />
              </div>
            </CardContent>
            
            <CardFooter className="pt-2 pb-6 flex flex-col gap-4">
              <Button 
                className="w-full h-11" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <CircleNotch className="h-4 w-4 animate-spin" />
                    <span>Iniciando...</span>
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
          © 2026 Licora
        </p>
      </div>

      {/* Forgot Password Modal (Simulated) */}
      <Dialog open={isForgotOpen} onOpenChange={setIsForgotOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold tracking-tight">Recuperar Acceso</DialogTitle>
            <DialogDescription className="text-sm">
              Le enviaremos un código de seguridad a su casilla de correo corporativa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Dirección de correo</label>
              <Input 
                type="email" 
                placeholder="admin@licora.com" 
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="h-11 rounded-lg border-slate-200"
                required 
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button 
                type="submit" 
                className="h-11 rounded-lg bg-slate-900 font-semibold"
                disabled={isSubmittingForgot}
              >
                {isSubmittingForgot ? <CircleNotch className="h-4 w-4 animate-spin mr-2" /> : null}
                {isSubmittingForgot ? 'Enviando...' : 'Enviar enlace'}
              </Button>
              <Button 
                variant="ghost" 
                type="button"
                className="h-11 text-slate-500 rounded-lg font-medium"
                onClick={() => setIsForgotOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
