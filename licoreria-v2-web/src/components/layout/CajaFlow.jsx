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
      <Card className="w-full max-w-md border-none shadow-xl bg-white animate-in zoom-in duration-300 rounded-[2rem]">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Check-in de Usuario</CardTitle>
          <CardDescription>
            Inicia tu turno seleccionando una caja física en <strong>{branch?.nombre}</strong>.
          </CardDescription>
        </CardHeader>

        {availableCajas.length === 0 && !loadingCajas && (
          <CardContent className="pb-8">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center space-y-4">
               <div className="mx-auto bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Store className="h-6 w-6 text-amber-600" />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">No hay cajas físicas registradas</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Debes registrar al menos una caja física en el panel de Administración antes de poder vender.
                  </p>
               </div>
               <Button 
                variant="outline" 
                className="w-full border-amber-200 text-amber-700 hover:bg-amber-100 font-bold"
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
              <label className="text-sm font-semibold text-slate-700">Caja Física Disponibles</label>
              <Select value={selectedCajaId} onValueChange={setSelectedCajaId}>
                <SelectTrigger className="h-12 border-slate-200">
                  <SelectValue placeholder="Selecciona una caja..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCajas.map((caja) => (
                    <SelectItem key={caja.id} value={caja.id.toString()}>
                      {caja.nombre} - Saldo Actual: {caja.balance_actual}
                    </SelectItem>
                  ))}
                  {availableCajas.length === 0 && !loadingCajas && (
                    <SelectItem disabled value="none">Sin cajas disponibles</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Monto Real en Efectivo</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  type="number" 
                  step="0.01"
                  className="pl-10 h-12 text-lg font-bold border-slate-200 focus:ring-primary/20"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                * Cuenta el dinero físico que hay en la gaveta en este momento.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button type="submit" className="w-full h-14 text-base font-bold gap-2 rounded-2xl shadow-lg shadow-primary/20" disabled={isSubmitting || availableCajas.length === 0}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Iniciar Sesión y Continuar <ArrowRight className="h-5 w-5" /></>}
            </Button>
          </CardFooter>
        </form>
        )}
      </Card>
    </div>
  );
}
