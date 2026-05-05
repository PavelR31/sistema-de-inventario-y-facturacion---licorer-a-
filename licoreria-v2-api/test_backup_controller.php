<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$req = new Illuminate\Http\Request();
$req->merge(['full' => true]);
$user = \App\Models\User::first(); // Just for the log
$req->setUserResolver(function() use ($user) { return $user; });

$controller = new \App\Http\Controllers\Central\BackupController();
$response = $controller->store($req);

echo $response->getContent();
