<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    protected $table = 'configuraciones';

    protected $fillable = [
        'clave',
        'valor',
    ];

    /**
     * Obtener una configuración por su clave.
     */
    public static function getVal($clave, $default = null)
    {
        $config = self::where('clave', $clave)->first();
        return $config ? $config->valor : $default;
    }

    /**
     * Establecer o actualizar una configuración.
     */
    public static function setVal($clave, $valor)
    {
        return self::updateOrCreate(
            ['clave' => $clave],
            ['valor' => $valor]
        );
    }
}
