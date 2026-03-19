<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockExport implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize, WithStyles
{
    protected $data;

    public function __construct($data)
    {
        $this->data = collect($data);
    }

    public function collection()
    {
        return $this->data->map(function($item) {
            return [
                $item['nombre'],
                $item['categoria'] ?? '—',
                $item['sucursal'],
                $item['stock_actual'],
                $item['stock_minimo'],
                $item['diferencia'],
                $item['precio_venta'],
            ];
        });
    }

    public function title(): string
    {
        return 'Stock Crítico';
    }

    public function headings(): array
    {
        return [
            ['Reporte de Stock Crítico'],
            ['Generado el: ' . now()->format('d/m/Y H:i')],
            [''],
            ['Producto', 'Categoría', 'Sucursal', 'Stock Actual', 'Stock Mínimo', 'Déficit', 'Precio Venta']
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
