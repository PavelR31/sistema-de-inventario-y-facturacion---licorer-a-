<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class VentasExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;
    protected $totales;

    public function __construct($data, $totales)
    {
        $this->data = collect($data);
        $this->totales = $totales;
    }

    public function collection()
    {
        return $this->data;
    }

    public function title(): string
    {
        return 'Ventas por Período';
    }

    public function headings(): array
    {
        return [
            ['Reporte de Ventas por Período'],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [''],
            ['Fecha', 'N° Ventas', 'Efectivo', 'Tarjeta', 'Transferencia', 'Total']
        ];
    }

    public function map($row): array
    {
        return [
            $row['fecha'],
            $row['num_ventas'],
            $row['efectivo'],
            $row['tarjeta'],
            $row['transferencia'],
            $row['total'],
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
