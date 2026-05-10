<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sucursal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sucursales';

    protected $fillable = [
        'nombre',
        'direccion',
        'telefono',
        'estado',
    ];

    protected static function booted()
    {
        static::created(function ($sucursal) {
            $sucursal->cajas()->create([
                'nombre' => 'Caja Principal - ' . $sucursal->nombre,
                'activa' => true,
                'balance_actual' => 0,
            ]);
        });
    }

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
