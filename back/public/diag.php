<?php
echo "PHP Version: " . phpversion() . "\n";
echo "Working Dir: " . getcwd() . "\n";
echo "MySQL Extensions: " . (extension_loaded('mysqli') ? 'YES' : 'NO') . " / " . (extension_loaded('pdo_mysql') ? 'YES' : 'NO') . "\n";

// Test direct PDO connection
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=elara', 'root', '');
    echo "✓ Direct PDO: Connected\n";
    $pdo = null;
} catch (PDOException $e) {
    echo "✗ Direct PDO: " . $e->getMessage() . "\n";
}

// Test via Laravel
try {
    require_once __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $db = $app->make('db');
    $result = $db->connection()->select('SELECT 1');
    echo "✓ Laravel DB: Connected\n";
} catch (\Exception $e) {
    echo "✗ Laravel DB: " . $e->getMessage() . "\n";
}
