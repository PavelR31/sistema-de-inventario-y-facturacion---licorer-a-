import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Calendar, User, Truck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ComprasHistory() {
  const [compras, setCompras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const response = await api.get('/api/compras');
        setCompras(response.data);
      } catch (error) {
        toast.error('Error al cargar el historial de compras');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompras();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Compras</h1>
          <p className="text-muted-foreground">Consulta todos los registros de abastecimiento realizados.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-4">Fecha</TableHead>
                <TableHead>Factura / Ref</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right px-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Cargando historial...
                  </TableCell>
                </TableRow>
              ) : compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No se han registrado compras aún.
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow key={compra.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(compra.fecha_compra).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">
                      {compra.numero_factura || 'S/N'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-primary/60" />
                        {compra.proveedor?.nombre}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {compra.sucursal?.nombre}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      ${compra.total}
                    </TableCell>
                    <TableCell>
                      <Badge variant={compra.estado === 'completado' ? 'default' : 'outline'} className="capitalize">
                        {compra.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-4 w-4" /> Ver Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
