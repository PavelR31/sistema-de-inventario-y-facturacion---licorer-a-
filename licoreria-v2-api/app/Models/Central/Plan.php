<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    // Los modelos centrales viven en la conexión central (mysql)
    protected $connection = 'mysql';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'max_users',
        'price',
        'is_active',
    ];

    protected $casts = [
        'max_users' => 'integer',
        'price'     => 'float',
        'is_active' => 'boolean',
    ];

    /**
     * Los tenants que tienen este plan asignado.
     */
    public function tenants(): HasMany
    {
        return $this->hasMany(Tenant::class, 'plan_id_fk');
    }

    /**
     * ¿El límite de usuarios es ilimitado?
     */
    public function isUnlimited(): bool
    {
        return $this->max_users === 0;
    }

    /**
     * Representación del límite de usuarios legible.
     */
    public function maxUsersLabel(): string
    {
        return $this->isUnlimited() ? 'Ilimitado' : (string) $this->max_users;
    }
}
