<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sucursal extends Model
{
    use HasFactory;

    protected $table = 'sucursales';

    protected $fillable = [
        'nombre',
        'direccion',
        'telefono',
        'estado',
    ];

    public function cajas()
    {
        return $this->hasMany(Caja::class);
    }

    public function ventas()
    {
        return $this->hasMany(Venta::class);
    }

    public function productos()
    {
        return $this->belongsToMany(Producto::class, 'producto_sucursal')
            ->withPivot('stock_actual', 'stock_minimo', 'precio_compra', 'precio_venta')
            ->withTimestamps();
    }
}
