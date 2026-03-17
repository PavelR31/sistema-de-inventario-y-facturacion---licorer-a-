<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket - {{ $venta->numero_factura }}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.2;
            margin: 0;
            padding: 10px;
            width: 80mm;
            color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .header { margin-bottom: 15px; }
        .header h1 { font-size: 18px; margin: 0; }
        .header p { margin: 2px 0; font-size: 11px; }
        .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
        .info { margin-bottom: 10px; font-size: 11px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { border-bottom: 1px dashed #000; text-align: left; padding: 5px 0; font-size: 11px; }
        .table td { padding: 5px 0; vertical-align: top; font-size: 11px; }
        .totals { margin-top: 10px; }
        .totals-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .total-final { font-size: 14px; font-weight: bold; margin-top: 5px; border-top: 1px dashed #000; pt: 5px; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; }
        
        @media print {
            body { padding: 0; margin: 0; width: 80mm; }
            @page { margin: 0; }
        }
    </style>
</head>
<body onload="window.print();">
    <div class="header text-center">
        <h1 class="font-bold uppercase">{{ $venta->sucursal->nombre ?? 'LICORA' }}</h1>
        <p>{{ $venta->sucursal->direccion ?? 'Dirección no disponible' }}</p>
        <p>TEL: {{ $venta->sucursal->telefono ?? 'N/A' }}</p>
    </div>

    <div class="divider"></div>

    <div class="info">
        <p><strong>FOLIO:</strong> {{ $venta->numero_factura }}</p>
        <p><strong>FECHA:</strong> {{ $venta->created_at->format('d/m/Y H:i') }}</p>
        <p><strong>CAJERO:</strong> {{ $venta->user->name ?? 'Sistema' }}</p>
    </div>

    <div class="divider"></div>

    <table class="table">
        <thead>
            <tr>
                <th>DESCRIPCIÓN</th>
                <th class="text-right">SUBTOTAL</th>
            </tr>
        </thead>
        <tbody>
            @foreach($venta->detalles as $detalle)
            <tr>
                <td>
                    {{ $detalle->producto->nombre }}<br>
                    <small>{{ $detalle->cantidad }} x C$ {{ number_format($detalle->precio_unitario, 2) }}</small>
                </td>
                <td class="text-right">C$ {{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="divider"></div>

    <div class="totals">
        <div class="totals-row">
            <span>SUBTOTAL:</span>
            <span>C$ {{ number_format($venta->total, 2) }}</span>
        </div>
        <div class="totals-row">
            <span>IMPUESTOS (0%):</span>
            <span>C$ 0.00</span>
        </div>
        <div class="totals-row total-final">
            <span>TOTAL A PAGAR:</span>
            <span>C$ {{ number_format($venta->total, 2) }}</span>
        </div>
        <div class="divider" style="margin: 5px 0;"></div>
        <div class="totals-row">
            <span class="uppercase">RECIBIDO ({{ $venta->metodo_pago }}):</span>
            <span>C$ {{ number_format($venta->monto_pagado, 2) }}</span>
        </div>
        <div class="totals-row border-t">
            <span>SU CAMBIO:</span>
            <span class="font-bold">C$ {{ number_format($venta->cambio, 2) }}</span>
        </div>
    </div>

    <div class="footer">
        <p class="font-bold">¡GRACIAS POR SU COMPRA!</p>
        <p>Vuelva pronto</p>
        <p style="margin-top: 10px; font-weight: normal; opacity: 0.6;">Powered by Licora SaaS</p>
    </div>
</body>
</html>
