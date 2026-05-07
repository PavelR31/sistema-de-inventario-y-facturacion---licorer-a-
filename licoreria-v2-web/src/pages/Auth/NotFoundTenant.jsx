import { Button } from "@/components/ui/button";
import { House, Warning } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";

export default function NotFoundTenant() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="mb-12">
        <Logo className="h-16" />
      </div>
      
      <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center">
            <Warning size={40} className="text-amber-500" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Licorería No Encontrada</h1>
          <p className="text-slate-500 text-sm">
            Lo sentimos, pero el subdominio que intentas acceder no está registrado en nuestra plataforma o ha sido desactivado.
          </p>
        </div>
        
        <div className="pt-4 space-y-3">
          <Button 
            className="w-full h-12 rounded-xl font-bold gap-2" 
            onClick={() => window.location.href = 'http://localhost:5173'}
          >
            <House size={18} weight="bold" />
            Ir al Portal Central
          </Button>
          
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest pt-4">
            Licora SaaS • Red de Distribución
          </p>
        </div>
      </div>
    </div>
  );
}
