<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producto extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'categoria_id',
        'nombre',
        'sku',
        'upc',
        'descripcion',
        'imagen_ruta',
        'activo',
        'medida_id',
    ];

    public function medida()
    {
        return $this->belongsTo(Medida::class);
    }

    public function presentaciones()
    {
        return $this->hasMany(PresentacionProducto::class);
    }

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

    public function getImagenUrlAttribute()
    {
        if (!$this->imagen_ruta) {
            return null;
        }

        // Si es una URL externa (seeders, etc)
        if (filter_var($this->imagen_ruta, FILTER_VALIDATE_URL)) {
            return $this->imagen_ruta;
        }

        // En entornos multi-tenant con dominios dinámicos, tenant_asset() a veces usa el APP_URL base.
        // Forzamos el uso del host actual para que coincida con el dominio del inquilino.
        try {
            if (app()->runningInConsole()) {
                return tenant_asset($this->imagen_ruta);
            }
            
            $host = request()->getSchemeAndHttpHost();
            // Aseguramos que no haya doble slash y que use la ruta de activos de tenancy
            $path = ltrim($this->imagen_ruta, '/');
            return "{$host}/tenancy/assets/{$path}";
        } catch (\Exception $e) {
            return tenant_asset($this->imagen_ruta);
        }
    }

    protected $appends = ['imagen_url'];
}
