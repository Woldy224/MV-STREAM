<?php
function db(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;

  $cfg = require __DIR__ . "/config.php";
  $dsn = "pgsql:host={$cfg['db']['host']};port={$cfg['db']['port']};dbname={$cfg['db']['name']}";
  $pdo = new PDO($dsn, $cfg["db"]["user"], $cfg["db"]["pass"], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function db_has_column(string $table, string $column): bool {
  $pdo = db();
  $st = $pdo->prepare(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? AND column_name = ? LIMIT 1"
  );
  $st->execute([strtolower($table), strtolower($column)]);
  return (bool)$st->fetchColumn();
}
