<?php
require_once __DIR__ . "/db.php";
require_once __DIR__ . "/helpers.php";

function create_session_token(int $userId): string {
  $cfg = require __DIR__ . "/config.php";
  $token = base64url_random(48);
  $hash = hash("sha256", $token);
  $ttl = (int)$cfg["app"]["token_ttl_minutes"];
  $expiresAt = (new DateTime())->modify("+{$ttl} minutes")->format("Y-m-d H:i:s");

  $pdo = db();
  $st = $pdo->prepare("INSERT INTO sessions(user_id, token_hash, expires_at) VALUES(?,?,?)");
  $st->execute([$userId, $hash, $expiresAt]);

  return $token;
}

function require_auth(): array {
  $token = bearer_token();
  if (!$token) json_response(["error" => "Unauthorized"], 401);

  $hash = hash("sha256", $token);
  $pdo = db();
  $st = $pdo->prepare("
    SELECT u.id, u.full_name, u.email, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > NOW()
    LIMIT 1
  ");
  $st->execute([$hash]);
  $user = $st->fetch();

  if (!$user) json_response(["error" => "Invalid/expired token"], 401);
  return $user;
}

function require_admin(): array {
  $user = require_auth();
  $role = strtolower((string)($user["role"] ?? ""));
  if ($role !== "admin") {
    json_response(["error" => "Forbidden"], 403);
  }
  return $user;
}

function logout_token(): void {
  $token = bearer_token();
  if (!$token) json_response(["ok" => true]);

  $hash = hash("sha256", $token);
  $pdo = db();
  $st = $pdo->prepare("DELETE FROM sessions WHERE token_hash = ?");
  $st->execute([$hash]);

  json_response(["ok" => true]);
}
