<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AnulacionesExport implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = collect($data);
    }

    public function collection()
    {
        return $this->data->map(function($v) {
            return [
                $v['numero_factura'],
                isset($v['created_at']) ? date('d/m/Y H:i', strtotime($v['created_at'])) : '—',
                $v['total'],
                $v['sucursal']['nombre'] ?? '—',
                $v['user']['name'] ?? '—',
                $v['ventas_anuladas'][0]['motivo'] ?? '—',
            ];
        });
    }

    public function title(): string
    {
        return 'Ventas Anuladas';
    }

    public function headings(): array
    {
        return [
            ['Reporte de Ventas Anuladas'],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [''],
            ['Factura', 'Fecha', 'Monto', 'Sucursal', 'Cajero', 'Motivo de Anulación']
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14]],
            4 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'EEEEEE']]],
        ];
    }
}
