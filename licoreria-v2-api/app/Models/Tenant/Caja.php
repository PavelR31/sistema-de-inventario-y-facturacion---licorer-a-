<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    protected $fillable = [
        'sucursal_id',
        'user_id',
        'monto_apertura',
        'monto_cierre',
        'estado',
        'fecha_apertura',
        'fecha_cierre',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class);
    }
}
