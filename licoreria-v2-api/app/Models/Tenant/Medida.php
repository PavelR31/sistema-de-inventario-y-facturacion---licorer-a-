<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Medida extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nombre',
        'abreviatura'
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class);
    }
}
