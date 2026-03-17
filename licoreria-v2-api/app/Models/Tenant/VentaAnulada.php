<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VentaAnulada extends Model
{
    protected $table = 'ventas_anuladas';

    protected $fillable = [
        'venta_id',
        'user_id',
        'motivo',
        'fecha_anulacion',
    ];

    protected $casts = [
        'fecha_anulacion' => 'datetime',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
