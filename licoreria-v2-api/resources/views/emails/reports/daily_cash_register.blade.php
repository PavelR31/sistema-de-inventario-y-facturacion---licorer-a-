<x-mail::message>
# Reporte de Cierre de Caja

Se ha realizado el cierre de caja de la sucursal **{{ $reportData['sucursal'] }}**. Aquí tienes un resumen del movimiento del día:

<x-mail::table>
| Concepto | Monto |
| :--- | :--- |
| **Fecha de Apertura** | {{ $reportData['apertura'] }} |
| **Fecha de Cierre** | {{ $reportData['cierre'] }} |
| **Cajero** | {{ $reportData['usuario'] }} |
| **Monto Inicial** | {{ $reportData['monto_inicial'] }} |
| **Ventas Totales** | {{ $reportData['ventas_totales'] }} |
| **Ingresos Extra** | {{ $reportData['ingresos_extra'] }} |
| **Egresos/Gastos** | {{ $reportData['egresos'] }} |
| **Monto Esperado** | {{ $reportData['monto_esperado'] }} |
| **Monto Real (Contado)** | {{ $reportData['monto_real'] }} |
| **Diferencia** | {{ $reportData['diferencia'] }} |
</x-mail::table>

<x-mail::panel>
**Observaciones:**  
{{ $reportData['observaciones'] ?? 'Sin observaciones.' }}
</x-mail::panel>

Atentamente,<br>
Sistema de Inventario Licora
</x-mail::message>
