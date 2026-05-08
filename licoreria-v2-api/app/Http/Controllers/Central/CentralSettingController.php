<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\CentralSetting;
use Illuminate\Http\Request;

class CentralSettingController extends Controller
{
    public function index()
    {
        $settings = CentralSetting::pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $data = $request->all();
        
        foreach ($data as $key => $value) {
            CentralSetting::setVal($key, $value);
        }

        return response()->json(['message' => 'Configuración actualizada exitosamente.']);
    }

    // Public endpoint for tenants/guests to know if system is under maintenance or has banner
    public function publicStatus()
    {
        return response()->json([
            'global_banner_active' => CentralSetting::getVal('global_banner_active', 'false') === 'true',
            'global_banner_text' => CentralSetting::getVal('global_banner_text', ''),
            'system_blocked' => CentralSetting::getVal('system_blocked', 'false') === 'true',
        ]);
    }
}
