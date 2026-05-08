<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Empaque extends Model
{
    use HasFactory;

    protected $fillable = [
        'nombre',
        'cantidad_unidades',
    ];
}
