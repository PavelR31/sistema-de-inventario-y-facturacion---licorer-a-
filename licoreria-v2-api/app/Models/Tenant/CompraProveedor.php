<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class CompraProveedor extends Model
{
    protected $table = 'compras';

    protected $fillable = [
        'sucursal_id',
        'proveedor_id',
        'user_id',
        'numero_factura',
        'fecha_compra',
        'total',
        'estado',
        'observaciones',
    ];

    public function sucursal()
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class);
    }

    public function detalles()
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }
}
