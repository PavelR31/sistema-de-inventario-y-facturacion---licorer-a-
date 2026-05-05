<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('licenses:check-expired')->daily();

// ── Backups Automáticos (Spatie Laravel Backup) ─────────────────────
Schedule::command('backup:run --only-db')->daily()->at('02:00')
    ->onFailure(fn() => \Log::error('❌ Backup diario de BD falló'));

Schedule::command('backup:run')->weekly()->sundays()->at('03:00')
    ->onFailure(fn() => \Log::error('❌ Backup completo semanal falló'));

Schedule::command('backup:clean')->daily()->at('04:00');

Schedule::command('backup:monitor')->daily()->at('05:00');

