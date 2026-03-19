<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $fillable = [
        'categoria_id',
        'nombre',
        'sku',
        'upc',
        'descripcion',
        'imagen_ruta',
        'activo',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function sucursales()
    {
        return $this->belongsToMany(Sucursal::class, 'producto_sucursal')
            ->withPivot('stock_actual', 'stock_minimo', 'precio_compra', 'precio_venta')
            ->withTimestamps();
    }

    /**
     * Accessor para la URL de la imagen.
     */
    public function getImagenUrlAttribute()
    {
        if (!$this->imagen_ruta) {
            return null;
        }
        
        // Usar tenant_asset() para que Stancl/Tenancy maneje la ruta correcta del inquilino
        return tenant_asset($this->imagen_ruta);
    }

    protected $appends = ['imagen_url'];
}
