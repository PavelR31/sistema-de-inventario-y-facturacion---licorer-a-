<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BitacoraActividad extends Model
{
    protected $table = 'bitacora_actividades';

    protected $fillable = [
        'sucursal_id',
        'user_id',
        'accion',
        'tabla_afectada',
        'descripcion',
        'ip_origen',
    ];

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
