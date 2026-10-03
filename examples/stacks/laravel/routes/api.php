<?php
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
Route::match(['get', 'post'], '/count', function(Request $request) {
    $dir = getenv('PODS_APP_DATA') ?: '/data';
    if (!is_dir($dir)) mkdir($dir, 0770, true);
    $db = new PDO('sqlite:'.$dir.'/counter.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, value INTEGER NOT NULL); INSERT OR IGNORE INTO counter VALUES (1,0)');
    if ($request->isMethod('post')) $db->exec('UPDATE counter SET value=value+1 WHERE id=1');
    return ['count'=>(int)$db->query('SELECT value FROM counter WHERE id=1')->fetchColumn()];
});
