<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleCompra extends Model
{
    protected $table = 'detalle_compras';

    protected $fillable = [
        'compra_id',
        'producto_id',
        'presentacion_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    public function compra(): BelongsTo
    {
        return $this->belongsTo(CompraProveedor::class, 'compra_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}
