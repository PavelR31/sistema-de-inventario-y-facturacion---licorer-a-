import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { MapPin, Phone, ArrowRight, Loader2 } from 'lucide-react';

export default function BranchSelection() {
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const navigate = useNavigate();
  const { setBranch, roles, user } = useAuthStore();
  const role = roles?.[0] || 'cashier';

  useEffect(() => {
    api.get('/api/sucursales')
      .then(r => setBranches(r.data.data ?? r.data))
      .catch(() => toast.error('Error al cargar las sucursales'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = (branch) => {
    setSelecting(branch.id);
    setBranch(branch);
    setTimeout(() => {
      toast.success(`Operando en ${branch.nombre}`);
      if (role === 'Administrador' || role === 'Gerente') {
        navigate('/admin');
      } else {
        navigate('/pos');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 font-mono text-[10px] uppercase tracking-widest">
            {role}
          </Badge>
          <h1 className="text-2xl font-black tracking-tight">
            ¿Desde dónde operas hoy?
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Hola <span className="font-semibold text-foreground">{user?.name}</span> — selecciona tu punto de operación
          </p>
        </div>

        {/* Branch cards */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl">
            <p className="text-muted-foreground font-medium mb-4">No hay sucursales activas.</p>
            {(role === 'Administrador' || role === 'Gerente') && (
              <Button variant="outline" onClick={() => navigate('/admin/sucursales')}>
                Crear sucursal
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelect(branch)}
                disabled={selecting !== null}
                className="group text-left p-5 rounded-xl bg-card border border-border 
                           hover:border-primary/50 hover:shadow-md hover:shadow-primary/5
                           transition-all duration-200 disabled:opacity-60"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-bold text-base leading-tight truncate">
                      {branch.nombre}
                    </p>

                    {branch.direccion && (
                      <div className="flex items-start gap-1.5 mt-2">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {branch.direccion}
                        </p>
                      </div>
                    )}
                    {branch.telefono && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">{branch.telefono}</p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {selecting === branch.id ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
