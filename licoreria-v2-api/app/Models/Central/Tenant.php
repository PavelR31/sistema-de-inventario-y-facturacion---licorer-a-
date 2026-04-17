<?php

namespace App\Models\Central;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'email',
            'plan_id_fk',
            'license_status',
            'license_starts_at',
            'license_expires_at',
            'max_users',
        ];
    }

    protected $casts = [
        'license_starts_at'  => 'datetime',
        'license_expires_at' => 'datetime',
        'max_users'          => 'integer',
    ];

    // ─── Relaciones ────────────────────────────────────────────────

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class, 'plan_id_fk');
    }

    // ─── Helpers de Licencia ────────────────────────────────────────

    public function isLicenseActive(): bool
    {
        return $this->license_status === 'active';
    }

    public function isLicenseTrial(): bool
    {
        return $this->license_status === 'trial';
    }

    public function isLicenseSuspended(): bool
    {
        return $this->license_status === 'suspended';
    }

    public function isLicenseExpired(): bool
    {
        return $this->license_status === 'expired';
    }

    /**
     * Una licencia es "usable" si está activa o en trial Y no ha expirado.
     */
    public function isLicenseUsable(): bool
    {
        if ($this->isLicenseSuspended()) {
            return false;
        }

        if ($this->license_expires_at && $this->license_expires_at->isPast()) {
            return false;
        }

        return in_array($this->license_status, ['active', 'trial']);
    }

    /**
     * Días hasta la expiración. Null si no tiene fecha fijada.
     */
    public function daysUntilExpiration(): ?int
    {
        if (! $this->license_expires_at) {
            return null;
        }

        $days = (int) now()->diffInDays($this->license_expires_at, false);

        return max(0, $days);
    }

    /**
     * ¿La licencia ya venció?
     */
    public function hasExpiredDate(): bool
    {
        return $this->license_expires_at && $this->license_expires_at->isPast();
    }

    /**
     * Cantidad de usuarios activos en la BD del tenant.
     * Usa una conexión dinámica al tenant para contar.
     */
    public function activeUserCount(): int
    {
        try {
            // Utilizamos el helper run() de tenancy para ejecutar la consulta
            // en el contexto específico de la base de datos de este tenant.
            return $this->run(function () {
                return \DB::table('users')->where('active', true)->count();
            });
        } catch (\Throwable $e) {
            \Log::error("Error contando usuarios activos en tenant {$this->id}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * ¿Se excedió el límite de usuarios? (0 = ilimitado)
     */
    public function isUserLimitReached(): bool
    {
        if ($this->max_users === 0) {
            return false; // ilimitado
        }

        return $this->activeUserCount() >= $this->max_users;
    }

    /**
     * Porcentaje de ocupación de seats (0-100).
     */
    public function userUsagePercent(): int
    {
        if ($this->max_users === 0) {
            return 0;
        }

        $count = $this->activeUserCount();

        return (int) min(100, round(($count / $this->max_users) * 100));
    }
}
