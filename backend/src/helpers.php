<?php
function json_response($data, int $status = 200): void {
  http_response_code($status);
  header("Content-Type: application/json; charset=utf-8");
  echo json_encode($data);
  exit;
}

function read_json(): array {
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function base64url_random(int $bytes = 32): string {
  $b = random_bytes($bytes);
  return rtrim(strtr(base64_encode($b), '+/', '-_'), '=');
}

function bearer_token(): ?string {
  // Some servers (notably Apache/FastCGI) may not populate HTTP_AUTHORIZATION.
  // Try common alternatives and finally getallheaders().
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ($_SERVER['Authorization'] ?? ($_SERVER['HTTP_X_AUTHORIZATION'] ?? '')));
  if (!$h && function_exists('getallheaders')) {
    $headers = getallheaders();
    $h = $headers['Authorization'] ?? ($headers['authorization'] ?? '');
  }
  if (preg_match('/Bearer\s+(.+)/i', (string)$h, $m)) return trim($m[1]);
  return null;
}
