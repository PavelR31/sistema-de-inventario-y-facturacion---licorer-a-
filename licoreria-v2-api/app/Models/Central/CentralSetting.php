<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CentralSetting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value'];

    public static function getVal($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    public static function setVal($key, $value)
    {
        return self::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
