<?php

namespace App\Models\Tenant;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venta extends Model
{
    protected $fillable = [
        'sucursal_id',
        'caja_sesion_id',
        'cliente_id',
        'user_id',
        'numero_factura',
        'subtotal',
        'descuento',
        'impuesto',
        'impuesto_porcentaje',
        'total',
        'metodo_pago',
        'monto_pagado',
        'cambio',
        'estado',
    ];

    public function sucursal(): BelongsTo
    {
        return $this->belongsTo(Sucursal::class);
    }

    public function sesión(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'caja_sesion_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleVenta::class);
    }

    public function ventas_anuladas(): HasMany
    {
        return $this->hasMany(VentaAnulada::class);
    }
}
