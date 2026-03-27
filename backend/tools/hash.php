<?php
// run: php backend/tools/make_admin.php
$pass = "Admin123@";
echo password_hash($pass, PASSWORD_BCRYPT) . PHP_EOL;