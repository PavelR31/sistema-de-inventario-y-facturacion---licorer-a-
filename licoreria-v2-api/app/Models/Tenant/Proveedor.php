<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    use SoftDeletes;
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
