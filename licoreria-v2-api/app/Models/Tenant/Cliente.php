<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $fillable = [
        'nombre',
        'identificacion',
        'telefono',
        'email',
        'direccion',
    ];

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class);
    }
}
