<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    protected $table = 'proveedores';

    protected $fillable = [
        'nombre',
        'ruc',
        'telefono',
        'direccion',
    ];

    public function compras()
    {
        return $this->hasMany(CompraProveedor::class, 'proveedor_id');
    }
}
