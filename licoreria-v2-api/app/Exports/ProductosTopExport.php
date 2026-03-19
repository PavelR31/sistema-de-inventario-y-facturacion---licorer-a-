<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProductosTopExport implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = collect($data);
    }

    public function collection()
    {
        return $this->data->map(function($item, $index) {
            return [
                $index + 1,
                $item['nombre'],
                $item['sku'] ?? '—',
                $item['total_vendido'],
                $item['num_ventas'],
                $item['total_monto'],
            ];
        });
    }

    public function title(): string
    {
        return 'Productos Mas Vendidos';
    }

    public function headings(): array
    {
        return [
            ['Ranking de Productos más Vendidos'],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [''],
            ['Posición', 'Producto', 'SKU', 'Unidades Vendidas', 'N° Transacciones', 'Total Ingresos']
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
