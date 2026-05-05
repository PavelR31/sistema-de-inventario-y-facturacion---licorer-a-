import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, Mail, Building, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.put('/api/perfil/update', {
        name: form.name,
        email: form.email
      });
      setUser(res.data.user);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      return toast.error('Las contraseñas no coinciden');
    }
    setIsLoading(true);
    try {
      await api.put('/api/perfil/password', {
        current_password: form.current_password,
        password: form.new_password,
        password_confirmation: form.confirm_password
      });
      toast.success('Contraseña actualizada correctamente');
      setForm({ ...form, current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y seguridad.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Personal */}
        <Card className="border shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <User size={18} className="text-primary" />
              <CardTitle className="text-lg">Información Personal</CardTitle>
            </div>
            <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    className="pl-9" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    className="pl-9" 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})} 
                  />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                Guardar Cambios
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="border shadow-none">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Key size={18} className="text-primary" />
              <CardTitle className="text-lg">Seguridad</CardTitle>
            </div>
            <CardDescription>Cambia tu contraseña para mantener tu cuenta segura.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Contraseña Actual</Label>
                <Input 
                  id="current_password" 
                  type="password" 
                  value={form.current_password} 
                  onChange={e => setForm({...form, current_password: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Nueva Contraseña</Label>
                <Input 
                  id="new_password" 
                  type="password" 
                  value={form.new_password} 
                  onChange={e => setForm({...form, new_password: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                <Input 
                  id="confirm_password" 
                  type="password" 
                  value={form.confirm_password} 
                  onChange={e => setForm({...form, confirm_password: e.target.value})} 
                />
              </div>
              <Button type="submit" variant="secondary" disabled={isLoading} className="w-full">
                Actualizar Contraseña
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info de Rol y Sucursal (Read Only) */}
        <Card className="md:col-span-2 border shadow-none bg-muted/20">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} className="text-primary" />
              <CardTitle className="text-lg">Detalles del Sistema</CardTitle>
            </div>
            <CardDescription>Información sobre tu acceso y ubicación asignada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rol Asignado</p>
                <p className="font-semibold">{user?.roles?.[0]?.name || 'Usuario'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Sucursal Actual</p>
                <p className="font-semibold">{user?.sucursal?.nombre || 'Central / Todas'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] pt-10">Licora</p>
    </div>
  );
}
