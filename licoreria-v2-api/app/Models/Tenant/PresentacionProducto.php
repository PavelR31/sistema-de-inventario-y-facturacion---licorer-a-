<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PresentacionProducto extends Model
{
    use HasFactory;

    protected $table = 'presentaciones_producto';

    protected $fillable = [
        'producto_id',
        'nombre',
        'cantidad_unidades',
        'precio_venta',
        'codigo_barras',
        'es_principal'
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    /**
     * Sucursales donde esta presentación tiene stock registrado.
     */
    public function sucursales()
    {
        return $this->belongsToMany(
            \App\Models\Tenant\Sucursal::class,
            'presentacion_sucursal',
            'presentacion_id',
            'sucursal_id'
        )->withPivot('stock_actual')->withTimestamps();
    }

    /**
     * Devuelve el stock de esta presentación en una sucursal específica.
     */
    public function stockEnSucursal(int $sucursalId): int
    {
        $pivot = $this->sucursales()->where('sucursal_id', $sucursalId)->first();
        return $pivot ? (int)$pivot->pivot->stock_actual : 0;
    }
}
