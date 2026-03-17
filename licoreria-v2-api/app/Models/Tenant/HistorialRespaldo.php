<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistorialRespaldo extends Model
{
    protected $table = 'historial_respaldos';

    protected $fillable = [
        'user_id',
        'nombre_archivo',
        'estado',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
