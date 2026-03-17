import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Lock, ShieldCheck } from 'lucide-react';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, user, roles, permissions, token, tenant } = useAuthStore();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      return toast.error('Contraseña muy corta', {
        description: 'Por seguridad, debe tener al menos 8 caracteres.'
      });
    }

    if (password !== passwordConfirmation) {
      return toast.error('Confirme su contraseña', {
        description: 'Las contraseñas ingresadas no coinciden entre sí.'
      });
    }

    setIsLoading(true);
    
    try {
      const isCentral = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const endpoint = isCentral ? '/api/central/update-password' : '/api/update-password';
      
      await api.post(endpoint, {
        password: password,
        password_confirmation: passwordConfirmation
      });
      
      toast.success('¡Seguridad Actualizada!', {
        description: 'Tu nueva contraseña ha sido establecida correctamente.'
      });
      
      // Actualizar el store para que mustChangePassword sea false
      setAuth(user, roles, permissions, token, tenant, false);
      
      // Redirigir según el rol
      const isSuperAdmin = roles.includes('super-admin');
      if (isSuperAdmin) {
        navigate('/central');
      } else if (roles.includes('Administrador') || roles.includes('Gerente')) {
        navigate('/admin');
      } else {
        navigate('/pos');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Hubo un problema al procesar tu solicitud.';
      toast.error('Error al Actualizar', {
        description: message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6 animate-in fade-in duration-700">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 group">
             <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none text-center">Actualizar Seguridad</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3 text-center">Debes cambiar tu contraseña temporal</p>
        </div>

        <Card className="border border-slate-200 rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
          <CardHeader className="pt-10 pb-6 text-center">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Nueva Contraseña</h2>
            <CardDescription className="text-slate-400 font-medium text-xs">
              Tu nueva contraseña debe ser segura y fácil de recordar.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleChangePassword}>
            <CardContent className="px-8 space-y-6">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-13 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-amber-500/20 transition-all font-medium text-slate-900"
                  required 
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Contraseña</label>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="h-13 bg-slate-50 border-slate-100 rounded-xl focus-visible:ring-amber-500/20 transition-all font-medium text-slate-900"
                  required 
                />
              </div>
            </CardContent>
            
            <CardFooter className="px-8 pb-10 pt-4 flex flex-col gap-6">
              <Button 
                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all group" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Actualizando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Establecer Contraseña</span>
                  </div>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
