<?php
require_once __DIR__ . "/../db.php";
require_once __DIR__ . "/../helpers.php";
require_once __DIR__ . "/../auth.php";

function admin_create_user(): void {
  require_admin();
  $data = read_json();

  $name = trim($data["full_name"] ?? "");
  $email = strtolower(trim($data["email"] ?? ""));
  $pass = (string)($data["password"] ?? "");
  $role = strtolower(trim($data["role"] ?? "user"));
  if ($role !== "admin") $role = "user";

  if ($name === "" || $email === "" || strlen($pass) < 6) {
    json_response(["error" => "Invalid data (password >= 6)"], 422);
  }

  $pdo = db();
  $exists = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
  $exists->execute([$email]);
  if ($exists->fetch()) json_response(["error" => "Email already used"], 409);

  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $st = $pdo->prepare("INSERT INTO users(full_name, email, password_hash, role) VALUES(?,?,?,?) RETURNING id");
  $st->execute([$name, $email, $hash, $role]);
  $id = (int)$st->fetchColumn();

  json_response([
    "user" => ["id" => $id, "full_name" => $name, "email" => $email, "role" => $role]
  ], 201);
}

function admin_analytics(): void {
  require_admin();
  $pdo = db();

  $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
  $totalContent = (int)$pdo->query("SELECT COUNT(*) FROM content")->fetchColumn();

  $byType = $pdo->query("SELECT type, COUNT(*) AS count FROM content GROUP BY type ORDER BY type")->fetchAll();

  $newUsers7d = (int)$pdo
    ->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'")
    ->fetchColumn();
  $newContent7d = (int)$pdo
    ->query("SELECT COUNT(*) FROM content WHERE created_at >= NOW() - INTERVAL '7 days'")
    ->fetchColumn();

  json_response([
    "totals" => [
      "users" => $totalUsers,
      "content" => $totalContent,
      "new_users_7d" => $newUsers7d,
      "new_content_7d" => $newContent7d,
    ],
    "content_by_type" => $byType,
  ]);
}
