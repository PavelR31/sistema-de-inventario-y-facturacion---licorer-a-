import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Calendar, User, Truck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import DataPagination from '@/components/ui/data-pagination';
import PageHeader from '@/components/layout/PageHeader';

export default function ComprasHistory() {
  const [compras, setCompras] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCompras = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/compras', { params: { page } });
      setCompras(response.data.data ?? response.data);
      if (response.data.last_page) {
        setMeta({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          total: response.data.total
        });
      }
    } catch (error) {
      toast.error('Error al cargar el historial de compras');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Historial de Compras"
        subtitle="Abastecimiento de inventario"
        icon={FileText}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por factura o proveedor..."
        action={
          <Button variant="outline" className="gap-2 rounded-sm h-10">
             <Truck className="h-4 w-4" /> Nueva Orden
          </Button>
        }
      />

      <Card className="border shadow-sm bg-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="py-4 px-6">Fecha</TableHead>
                <TableHead>Factura</TableHead>
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
                  <TableRow key={compra.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="font-medium">{new Date(compra.fecha_compra).toLocaleDateString()}</span>
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
                    <TableCell className="text-muted-foreground text-sm">
                      {compra.sucursal?.nombre}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      ${compra.total}
                    </TableCell>
                    <TableCell>
                      <Badge variant={compra.estado === 'completado' ? 'default' : 'outline'} className="capitalize rounded-sm">
                        {compra.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t">
            <DataPagination meta={meta} onPageChange={fetchCompras} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
