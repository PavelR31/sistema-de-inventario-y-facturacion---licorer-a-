<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Empaque extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nombre',
        'cantidad_unidades',
    ];
}
