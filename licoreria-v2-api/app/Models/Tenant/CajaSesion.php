<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CajaSesion extends Model
{
    protected $table = 'caja_sesiones';

    protected $fillable = [
        'caja_id',
        'user_id',
        'apertura_esperada',
        'apertura_real',
        'discrepancia_apertura',
        'cierre_esperado',
        'cierre_real',
        'discrepancia_cierre',
        'estado',
        'fecha_apertura',
        'fecha_cierre',
    ];

    protected $casts = [
        'apertura_esperada' => 'decimal:2',
        'apertura_real' => 'decimal:2',
        'discrepancia_apertura' => 'decimal:2',
        'cierre_esperado' => 'decimal:2',
        'cierre_real' => 'decimal:2',
        'discrepancia_cierre' => 'decimal:2',
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
    ];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'caja_sesion_id');
    }
}
