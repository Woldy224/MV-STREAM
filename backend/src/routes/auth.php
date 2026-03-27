<?php
require_once __DIR__ . "/../db.php";
require_once __DIR__ . "/../helpers.php";
require_once __DIR__ . "/../auth.php";

function auth_register(): void {
  $data = read_json();
  $name = trim($data["full_name"] ?? "");
  $email = strtolower(trim($data["email"] ?? ""));
  $pass = $data["password"] ?? "";

  if ($name === "" || $email === "" || strlen($pass) < 6) {
    json_response(["error" => "Invalid data (password >= 6)"], 422);
  }

  $pdo = db();
  $exists = $pdo->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
  $exists->execute([$email]);
  if ($exists->fetch()) json_response(["error" => "Email already used"], 409);

  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $st = $pdo->prepare("INSERT INTO users(full_name, email, password_hash) VALUES(?,?,?) RETURNING id");
  $st->execute([$name, $email, $hash]);
  $id = (int)$st->fetchColumn();

  $token = create_session_token($id);
  json_response(["token" => $token, "user" => ["id" => $id, "full_name" => $name, "email" => $email, "role" => "user"]], 201);
}

function auth_login(): void {
  $data = read_json();
  $email = strtolower(trim($data["email"] ?? ""));
  $pass = $data["password"] ?? "";

  $pdo = db();
  $st = $pdo->prepare("SELECT id, full_name, email, role, password_hash FROM users WHERE email = ? LIMIT 1");
  $st->execute([$email]);
  $u = $st->fetch();

  if (!$u || !password_verify($pass, $u["password_hash"])) {
    json_response(["error" => "Invalid credentials"], 401);
  }

  $token = create_session_token((int)$u["id"]);
  unset($u["password_hash"]);
  json_response(["token" => $token, "user" => $u]);
}

function auth_me(): void {
  $user = require_auth();
  json_response(["user" => $user]);
}
