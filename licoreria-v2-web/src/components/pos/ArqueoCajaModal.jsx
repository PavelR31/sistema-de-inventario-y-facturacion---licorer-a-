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

  const expectedCash = (parseFloat(activeCaja?.apertura_real) || 0) + (parseFloat(activeCaja?.ventas_efectivo) || 0) - (parseFloat(activeCaja?.egresos_totales) || 0);
  const diferenciaCaja = totalContado - expectedCash;

  const handleConfirm = () => {
    onConfirm(totalContado);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border-border shadow-2xl p-0 bg-card">
        <DialogHeader className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Calculator size={20} weight="bold" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground tracking-tight">Cierre de Sesión y Arqueo</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-medium">
                Caja Física: <span className="text-foreground">{activeCaja?.caja?.nombre || 'N/A'}</span> • Sucursal: <span className="text-foreground">{activeCaja?.caja?.sucursal?.nombre || 'Principal'}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Conteo Section */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-border space-y-4">
            <div className="flex items-center gap-2 mb-4 text-foreground">
              <Coins size={18} weight="bold" className="text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-widest">Efectivo Físico en Gaveta</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.keys(denominaciones).sort((a, b) => b - a).map((val) => (
                <div key={val} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card group focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  <div className="w-12 h-9 flex items-center justify-center bg-muted rounded-md font-black text-foreground text-sm border border-border">
                    {val}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominaciones[val] || ''}
                    onChange={(e) => setDenominaciones({...denominaciones, [val]: e.target.value})}
                    className="h-9 border-none bg-transparent focus-visible:ring-0 text-right font-bold text-foreground"
                  />
                  <div className="w-20 text-right text-[11px] font-bold text-muted-foreground tabular-nums">
                    {formatMoney(parseInt(val) * (parseInt(denominaciones[val]) || 0))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="lg:col-span-5 p-6 bg-muted/10 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
                <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Total Contado (Declarado)</p>
                <p className="text-4xl font-black tracking-tighter tabular-nums">{formatMoney(totalContado)}</p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Apertura (Fondo)</span>
                  <span className="font-bold text-foreground tabular-nums">{formatMoney(activeCaja?.apertura_real || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Ventas Efectivo</span>
                  <span className="font-bold text-foreground tabular-nums">{formatMoney(activeCaja?.ventas_efectivo || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-destructive">
                  <span className="font-medium">Egresos (Gastos)</span>
                  <span className="font-bold tabular-nums">-{formatMoney(activeCaja?.egresos_totales || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-border border-dashed">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Esperado en Sistema</span>
                  <span className="font-bold text-muted-foreground tabular-nums">{formatMoney(expectedCash)}</span>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center">
                  <span className="text-sm font-black text-foreground uppercase tracking-tight">Diferencia</span>
                  <span className={`text-lg font-black tabular-nums ${
                    Math.abs(diferenciaCaja) < 0.01
                    ? 'text-foreground' 
                    : diferenciaCaja > 0 
                      ? 'text-blue-500' 
                      : 'text-destructive'
                  }`}>
                    {diferenciaCaja > 0 ? '+' : ''}{formatMoney(diferenciaCaja)}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className={`flex gap-3 p-4 rounded-xl border text-sm ${
                Math.abs(diferenciaCaja) < 0.01
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : diferenciaCaja > 0 
                  ? 'bg-blue-50 border-blue-100 text-blue-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <div className="pt-0.5">
                  {Math.abs(diferenciaCaja) < 0.01
                   ? <CheckCircle size={18} weight="fill" />
                   : <Warning size={18} weight="fill" />}
                </div>
                <p className="leading-tight font-medium">
                  {Math.abs(diferenciaCaja) < 0.01 
                   ? "La sesión cuadra perfectamente."
                   : diferenciaCaja > 0 
                     ? "Hay un excedente respecto al sistema." 
                     : "Hay un faltante respecto al sistema."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/30 gap-3 text-[10px] font-bold text-muted-foreground/60 text-center px-6 uppercase tracking-widest">
           Al confirmar, se guardará la discrepancia de {formatMoney(diferenciaCaja)} y se cerrará la sesión.
        </DialogFooter>
        <DialogFooter className="p-4 border-t border-border bg-card gap-3">
          <Button 
              variant="outline" 
              className="h-11 rounded-xl font-bold border-border text-muted-foreground hover:bg-muted transition-all sm:flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
          >
              Cancelar
          </Button>
          <Button 
              className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black transition-all sm:flex-1 shadow-lg shadow-primary/20"
              onClick={handleConfirm}
              disabled={isProcessing}
          >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  <span>Cerrando Sesión...</span>
                </div>
              ) : 'Finalizar Turno y Cerrar Caja'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
