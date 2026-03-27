<?php
require_once __DIR__ . "/src/db.php";

$pdo = db();
$email = 'admin@mvstream.local';

try {
    $st = $pdo->prepare("UPDATE users SET role = 'admin' WHERE email = ?");
    $st->execute([$email]);
    echo "Successfully updated role to admin for $email\n";
    
    // Check if it worked
    $st = $pdo->prepare("SELECT id, email, role FROM users WHERE email = ?");
    $st->execute([$email]);
    $user = $st->fetch();
    print_r($user);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
