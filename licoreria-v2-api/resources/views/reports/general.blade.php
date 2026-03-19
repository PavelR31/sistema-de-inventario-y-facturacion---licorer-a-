<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 1cm; }
        body { font-family: 'Helvetica', sans-serif; color: #333; font-size: 11pt; line-height: 1.5; }
        .header { border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 20px; }
        .header table { width: 100%; }
        .logo { font-size: 24px; font-weight: bold; color: #1e293b; }
        .report-title { text-align: right; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .summary-box { background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .summary-box table { width: 100%; }
        .summary-label { color: #64748b; font-size: 9pt; }
        .summary-value { font-size: 14pt; font-weight: bold; color: #0f172a; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.data-table th { background: #f1f5f9; color: #475569; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; font-size: 9pt; }
        table.data-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
        .text-right { text-align: right; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td class="logo">{{ $nombreEmpresa ?? 'LICORERÍA V2' }}</td>
                <td class="report-title">{{ $title }}</td>
            </tr>
        </table>
    </div>

    <div class="summary-box">
        <table>
            <tr>
                <td>
                    <span class="summary-label">PERIODO</span><br>
                    <span class="summary-value" style="font-size: 11pt;">{{ $fecha_inicio }} - {{ $fecha_fin }}</span>
                </td>
                @if(isset($sucursal_nombre))
                <td>
                    <span class="summary-label">SUCURSAL</span><br>
                    <span class="summary-value" style="font-size: 11pt;">{{ $sucursal_nombre }}</span>
                </td>
                @endif
                <td class="text-right">
                    <span class="summary-label">TOTAL REPORTE</span><br>
                    <span class="summary-value">{{ $total_formatted ?? '' }}</span>
                </td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                @foreach($headers as $header)
                    <th class="{{ $loop->last ? 'text-right' : '' }}">{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    @foreach($row as $cell)
                        <td class="{{ $loop->last ? 'text-right' : '' }}">{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Generado el {{ now()->format('d/m/Y H:i') }} | {{ $nombreEmpresa ?? 'Licorería V2' }} - Gestión Inteligente
    </div>
</body>
</html>
