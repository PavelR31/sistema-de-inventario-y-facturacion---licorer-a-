<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 1.5cm; }
        * { box-sizing: border-box; }
        body { 
            font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; 
            color: #1a1a1a; 
            font-size: 10pt; 
            line-height: 1.4; 
            margin: 0;
            padding: 0;
        }
        
        /* Header section */
        .header { margin-bottom: 30px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .logo-container { width: 50%; vertical-align: top; }
        .company-info { width: 50%; text-align: right; vertical-align: top; }
        
        .logo-img { max-height: 60px; margin-bottom: 10px; }
        .company-name { font-size: 14pt; font-weight: 800; color: #000; text-transform: uppercase; letter-spacing: -0.5px; }
        .company-details { font-size: 8pt; color: #666; margin-top: 5px; }
        
        /* Report Title & Info */
        .report-header { 
            border-top: 2px solid #000;
            border-bottom: 1px solid #eee;
            padding: 15px 0;
            margin-bottom: 25px;
        }
        .report-title { font-size: 18pt; font-weight: 700; margin: 0; color: #000; }
        
        .metadata-grid { width: 100%; margin-top: 15px; }
        .metadata-item { width: 25%; vertical-align: top; }
        .label { font-size: 7pt; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 3px; display: block; }
        .value { font-size: 9pt; font-weight: 600; color: #111; }

        /* Data Table */
        .data-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .data-table th { 
            background: #000; 
            color: #fff; 
            text-align: left; 
            padding: 8px 10px; 
            font-size: 8pt; 
            font-weight: 700; 
            text-transform: uppercase;
        }
        .data-table td { 
            padding: 10px; 
            border-bottom: 1px solid #eee; 
            font-size: 9pt;
        }
        .data-table tr:nth-child(even) { background-color: #f9f9f9; }
        
        /* Helpers */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .mt-4 { margin-top: 1rem; }
        
        /* Total Section */
        .total-section { 
            margin-top: 20px;
            float: right;
            width: 300px;
        }
        .total-row { 
            border-top: 2px solid #000;
            padding: 10px;
            background: #f8f9fa;
        }
        .total-label { font-size: 10pt; font-weight: 700; }
        .total-value { font-size: 14pt; font-weight: 800; color: #000; }

        .footer { 
            position: fixed; 
            bottom: 0; 
            width: 100%; 
            text-align: left; 
            font-size: 7pt; 
            color: #999; 
            border-top: 1px solid #eee; 
            padding-top: 10px; 
        }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="logo-container">
                    @if(isset($logo) && !empty($logo))
                        <img src="{{ $logo }}" class="logo-img">
                    @else
                        <div class="company-name">{{ $nombreEmpresa }}</div>
                    @endif
                </td>
                <td class="company-info">
                    <div class="company-name">{{ $nombreEmpresa }}</div>
                    <div class="company-details">
                        Licora<br>
                        Sucursal: {{ $metadata['sucursal'] }}<br>
                        Generado: {{ $metadata['fecha_generacion'] }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="report-header">
        <h1 class="report-title">{{ $title }}</h1>
        <table class="metadata-grid">
            <tr>
                <td class="metadata-item">
                    <span class="label">Desde</span>
                    <span class="value">{{ date('d/m/Y', strtotime($fecha_inicio)) }}</span>
                </td>
                <td class="metadata-item">
                    <span class="label">Hasta</span>
                    <span class="value">{{ date('d/m/Y', strtotime($fecha_fin)) }}</span>
                </td>
                <td class="metadata-item">
                    <span class="label">Sucursal</span>
                    <span class="value">{{ $metadata['sucursal'] }}</span>
                </td>
                <td class="metadata-item">
                    <span class="label">Generado por</span>
                    <span class="value">{{ $metadata['generado_por'] }}</span>
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
                        <td class="{{ $loop->last ? 'text-right' : '' }} {{ $loop->index === 0 ? 'font-bold' : '' }}">
                            {{ $cell }}
                        </td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($total_formatted)
    <div class="total-section">
        <table width="100%">
            <tr class="total-row">
                <td class="total-label">RESUMEN TOTAL</td>
                <td class="total-value text-right">{{ $total_formatted }}</td>
            </tr>
        </table>
    </div>
    @endif

    <div class="footer">
        <table width="100%">
            <tr>
                <td>Este documento es un reporte oficial generado por Licora.</td>
                <td class="text-right">Página <span class="page-number"></span></td>
            </tr>
        </table>
    </div>
</body>
</html>
