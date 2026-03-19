<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class VentasUsuarioExport implements FromCollection, WithHeadings, WithTitle, ShouldAutoSize
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = collect($data);
    }

    public function collection()
    {
        return $this->data->map(function($item) {
            return [
                'Usuario'         => $item['name'],
                'Sucursal'        => $item['sucursal'],
                'Total Vendido'   => $item['total_ventas'],
                'N° Operaciones'  => $item['num_ventas'],
                'Ticket Promedio' => $item['ticket_promedio'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Usuario / Vendedor',
            'Sucursal Principal',
            'Total Vendido',
            'N° Operaciones',
            'Ticket Promedio',
        ];
    }

    public function title(): string
    {
        return 'Ventas por Usuario';
    }
}
