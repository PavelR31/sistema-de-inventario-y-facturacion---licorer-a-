import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Store } from 'lucide-react';

export default function BranchSelection() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const setBranch = useAuthStore((state) => state.setBranch);
  const roles = useAuthStore((state) => state.roles);
  const role = roles?.[0] || 'cashier';

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/api/sucursales');
        setBranches(response.data);
      } catch (error) {
        toast.error('Error al cargar las sucursales');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleSelect = (branch) => {
    setBranch(branch);
    toast.success(`Sucursal ${branch.nombre} seleccionada`);
    
    if (role === 'Administrador' || role === 'Gerente') {
      navigate('/admin');
    } else {
      navigate('/pos');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <p className="text-sm text-muted-foreground animate-pulse">Cargando sucursales...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50/50 p-6 animate-in fade-in duration-1000">
      <Card className="w-full max-w-2xl border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden bg-white">
        <div className="bg-slate-900 p-12 text-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,#3b82f6,transparent)]"></div>
            <div className="flex justify-center mb-6 relative">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-16 w-16 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 rotate-3">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.4em] text-white/40 mt-4">Licora</span>
                </div>
            </div>
            <CardTitle className="text-4xl font-black tracking-tighter mb-2 relative">Seleccionar Origen</CardTitle>
            <CardDescription className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] relative">
              Elige la sucursal de operación
            </CardDescription>
        </div>
        <CardContent className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((branch) => (
              <Button
                key={branch.id}
                variant="outline"
                className="h-auto py-8 px-6 flex flex-col gap-2 border-slate-100 bg-white hover:border-primary hover:bg-slate-50 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                onClick={() => handleSelect(branch)}
              >
                <span className="text-xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{branch.nombre}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {branch.direccion || 'Ubicación Central'}
                </span>
              </Button>
            ))}
            
            {branches.length === 0 && (
              <div className="col-span-full text-center py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200/60">
                <p className="text-slate-400 font-bold text-sm mb-4">No se encontraron sucursales activas.</p>
                {(role === 'Administrador' || role === 'Gerente') && (
                  <Button 
                    className="bg-slate-900 text-white rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200" 
                    onClick={() => navigate('/admin/sucursales')}
                  >
                    Crear Nueva Sucursal
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
