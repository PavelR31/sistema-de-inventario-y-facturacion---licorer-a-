import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, Calculator, CircleNotch, Warning, CheckCircle } from "@phosphor-icons/react";

export default function ArqueoCajaModal({ isOpen, onOpenChange, activeCaja, onConfirm, formatMoney, isProcessing }) {
  const [denominaciones, setDenominaciones] = useState({
    '1000': 0, '500': 0, '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '1': 0
  });

  const totalContado = Object.entries(denominaciones).reduce((acc, [val, cant]) => {
    return acc + (parseInt(val) * (parseInt(cant) || 0));
  }, 0);

  const diferenciaCaja = totalContado - (activeCaja?.monto_caja || 0);

  const handleConfirm = () => {
    onConfirm(totalContado);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border-slate-200 shadow-2xl p-0">
        <DialogHeader className="p-6 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <Calculator size={20} weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Arqueo de Caja</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Turno actual: {activeCaja?.sucursal?.nombre || 'Sucursal Principal'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Conteo Section */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r space-y-4">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <Coins size={18} weight="bold" />
              <h3 className="font-bold">Efectivo Físico</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(denominaciones).sort((a, b) => b - a).map((val) => (
                <div key={val} className="flex items-center gap-3 p-2 rounded-lg border border-slate-100 bg-white group focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all">
                  <div className="w-12 h-9 flex items-center justify-center bg-slate-50 rounded-md font-bold text-slate-600 text-sm border border-slate-200">
                    {val}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominaciones[val] || ''}
                    onChange={(e) => setDenominaciones({...denominaciones, [val]: e.target.value})}
                    className="h-9 border-none bg-transparent focus-visible:ring-0 text-right font-bold text-slate-900"
                  />
                  <div className="w-20 text-right text-[11px] font-bold text-slate-400 tabular-nums">
                    {formatMoney(parseInt(val) * (parseInt(denominaciones[val]) || 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="lg:col-span-5 p-6 bg-slate-50/30 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Total Contado</p>
                <p className="text-4xl font-bold tracking-tight tabular-nums">{formatMoney(totalContado)}</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Efectivo en Sistema</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatMoney(activeCaja?.monto_caja || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Ventas de hoy</span>
                  <span className="font-bold text-slate-900 tabular-nums">{formatMoney(activeCaja?.ventas_totales || 0)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Diferencia</span>
                  <span className={`text-lg font-bold tabular-nums ${
                    diferenciaCaja === 0 
                    ? 'text-slate-900' 
                    : diferenciaCaja > 0 
                      ? 'text-blue-600' 
                      : 'text-rose-600'
                  }`}>
                    {diferenciaCaja > 0 ? '+' : ''}{formatMoney(diferenciaCaja)}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className={`flex gap-3 p-4 rounded-xl border text-sm ${
                diferenciaCaja === 0 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : diferenciaCaja > 0 
                  ? 'bg-blue-50 border-blue-100 text-blue-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <div className="pt-0.5">
                  {diferenciaCaja === 0 
                   ? <CheckCircle size={18} weight="fill" />
                   : <Warning size={18} weight="fill" />}
                </div>
                <p className="leading-tight font-medium">
                  {diferenciaCaja === 0 
                   ? "La caja está cuadrada. Todo en orden para el cierre."
                   : diferenciaCaja > 0 
                     ? "Hay un excedente de efectivo. Verifique ingresos no registrados." 
                     : "Falta efectivo en caja. Revise el conteo o ventas pendientes."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-slate-50/50 gap-3">
          <Button 
              variant="outline" 
              className="h-11 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-100 transition-all sm:flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
          >
              Cancelar
          </Button>
          <Button 
              className="h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all sm:flex-1 shadow-lg shadow-slate-900/10"
              onClick={handleConfirm}
              disabled={isProcessing}
          >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              ) : 'Confirmar Cierre de Caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
