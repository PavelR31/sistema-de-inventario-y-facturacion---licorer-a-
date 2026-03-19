import { useState, useEffect } from 'react';
import { useCajaStore } from '@/store/useCajaStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Wallet, Landmark, ArrowRight, Loader2 } from 'lucide-react';

export default function CajaFlow({ children }) {
  const { branch } = useAuthStore();
  const { isCajaOpen, checkCajaStatus, abrirCaja, isLoading } = useCajaStore();
  const [monto, setMonto] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (branch?.id) {
      checkCajaStatus(branch.id);
    } else {
      useCajaStore.setState({ isLoading: false });
    }
  }, [branch?.id]);

  const handleAbrir = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await abrirCaja(branch.id, parseFloat(monto));
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success('Caja abierta correctamente');
    } else {
      toast.error(result.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Validando estado de caja...</p>
      </div>
    );
  }

  if (isCajaOpen) {
    return children;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md border-none shadow-xl bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Apertura de Caja</CardTitle>
          <CardDescription>
            Debes iniciar una caja en <strong>{branch?.nombre}</strong> para poder realizar ventas.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAbrir}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Monto Inicial en Efectivo</label>
              <div className="relative">
                <Landmark className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input 
                  type="number" 
                  step="0.01"
                  className="pl-10 h-12 text-lg font-bold"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                * Este es el dinero físico con el que inicias el turno (fondo de caja).
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-base font-bold gap-2" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Abrir Caja y Continuar <ArrowRight className="h-5 w-5" /></>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
