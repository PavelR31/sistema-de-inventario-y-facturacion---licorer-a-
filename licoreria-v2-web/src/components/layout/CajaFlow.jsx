import { useState, useEffect } from 'react';
import { useCajaStore } from '@/store/useCajaStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Wallet, Landmark, ArrowRight, Loader2, Store } from 'lucide-react';
import api from '@/lib/api';

export default function CajaFlow({ children }) {
  const { branch } = useAuthStore();
  const { isCajaOpen, checkCajaStatus, abrirCaja, isLoading } = useCajaStore();
  
  const [availableCajas, setAvailableCajas] = useState([]);
  const [selectedCajaId, setSelectedCajaId] = useState('');
  const [monto, setMonto] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCajas, setLoadingCajas] = useState(false);

  useEffect(() => {
    if (branch?.id) {
      checkCajaStatus(branch.id);
      fetchAvailableCajas();
    } else {
      useCajaStore.setState({ isLoading: false });
    }
  }, [branch?.id]);

  const fetchAvailableCajas = async () => {
    setLoadingCajas(true);
    try {
        const response = await api.get('/api/caja-sesiones/disponibles');
        setAvailableCajas(response.data);
        if (response.data.length > 0) {
            setSelectedCajaId(response.data[0].id.toString());
        }
    } catch (e) {
        toast.error("No se pudieron cargar las cajas físicas");
    } finally {
        setLoadingCajas(false);
    }
  };

  const handleAbrir = async (e) => {
    e.preventDefault();
    if (!selectedCajaId) return toast.error("Selecciona una caja física");
    
    setIsSubmitting(true);
    const result = await abrirCaja(parseInt(selectedCajaId), parseFloat(monto));
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success('Sesión de caja iniciada correctamente');
    } else {
      toast.error(result.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Validando sesión de caja...</p>
      </div>
    );
  }

  if (isCajaOpen) {
    return children;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md border border-border shadow-xl bg-card animate-in zoom-in duration-300 rounded-[1.5rem]">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black text-foreground tracking-tight">Check-in de Usuario</CardTitle>
          <CardDescription className="text-muted-foreground font-medium">
            Inicia tu turno seleccionando una caja física en <strong className="text-foreground">{branch?.nombre}</strong>.
          </CardDescription>
        </CardHeader>

        {availableCajas.length === 0 && !loadingCajas && (
          <CardContent className="pb-8">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center space-y-4">
               <div className="mx-auto bg-yellow-500/20 w-12 h-12 rounded-full flex items-center justify-center">
                  <Store className="h-6 w-6 text-yellow-600" />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">No hay cajas físicas registradas</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Debes registrar al menos una caja física en el panel de Administración antes de poder vender.
                  </p>
               </div>
               <Button 
                variant="outline" 
                className="w-full border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/20 font-bold rounded-xl"
                onClick={() => window.location.href = '/admin/cajas'}
               >
                 Ir a Configuración
               </Button>
            </div>
          </CardContent>
        )}

        {availableCajas.length > 0 && (
          <form onSubmit={handleAbrir}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Caja Física Disponible</label>
              <Select value={selectedCajaId} onValueChange={setSelectedCajaId}>
                <SelectTrigger className="h-12 border-border bg-background rounded-xl">
                  <SelectValue placeholder="Selecciona una caja..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCajas.map((caja) => (
                    <SelectItem key={caja.id} value={caja.id.toString()}>
                      {caja.nombre} - Saldo: {caja.balance_actual}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Monto Inicial en Efectivo</label>
              <div className="relative">
                <Landmark className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="number" 
                  step="0.01"
                  className="pl-12 h-14 text-xl font-black border-border bg-background focus:ring-primary/20 rounded-xl"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-[10px] text-muted-foreground font-medium pl-1 italic">
                * Cuenta el dinero físico que hay en la gaveta ahora mismo.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button type="submit" className="w-full h-14 text-base font-bold gap-2 rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Iniciar Sesión de Caja <ArrowRight className="h-5 w-5" /></>}
            </Button>
          </CardFooter>
        </form>
        )}
      </Card>
    </div>
  );
}
