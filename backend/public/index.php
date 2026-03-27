<?php
// Load config FIRST (this fixes: Undefined variable $cfg)
$cfg = require __DIR__ . "/../src/config.php";

// CORS (dev)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$cors = (string)($cfg['app']['cors_origin'] ?? '');
$allowed = [];
if ($cors !== '') {
  // allow comma-separated origins in config
  $allowed = array_values(array_filter(array_map('trim', explode(',', $cors))));
}

if ($origin) {
  $allowAll = in_array('*', $allowed, true);
  if ($allowAll || in_array($origin, $allowed, true)) {
    // When using credentials, do NOT send "*" as Access-Control-Allow-Origin.
    $ao = $origin;
    header("Access-Control-Allow-Origin: $ao");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Vary: Origin");
  }
}

require_once __DIR__ . "/../src/helpers.php";
require_once __DIR__ . "/../src/routes/auth.php";
require_once __DIR__ . "/../src/routes/content.php";
require_once __DIR__ . "/../src/routes/admin.php";
require_once __DIR__ . "/../src/auth.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// ---- Base path handling (works in subfolder like /Projet/.../backend/public) ----
$fullPath = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH) ?? "/";
$base = rtrim(dirname($_SERVER["SCRIPT_NAME"]), "/"); // ex: /Projet/MV-STREAMReact/backend/public

$path = $fullPath;
if ($base !== "" && strpos($fullPath, $base) === 0) {
  $path = substr($fullPath, strlen($base));
}
if ($path === "") $path = "/";

// ---- Routes ----
if ($path === "/api/auth/register" && $_SERVER["REQUEST_METHOD"] === "POST") auth_register();
if ($path === "/api/auth/login" && $_SERVER["REQUEST_METHOD"] === "POST") auth_login();
if ($path === "/api/auth/me" && $_SERVER["REQUEST_METHOD"] === "GET") auth_me();
if ($path === "/api/auth/logout" && $_SERVER["REQUEST_METHOD"] === "POST") logout_token();

if ($path === "/api/content" && $_SERVER["REQUEST_METHOD"] === "GET") content_list();
if ($path === "/api/content" && $_SERVER["REQUEST_METHOD"] === "POST") content_create();
if ($path === "/api/content/import" && $_SERVER["REQUEST_METHOD"] === "POST") content_import_playlist();
if ($path === "/api/content/import-json" && $_SERVER["REQUEST_METHOD"] === "POST") content_import_json();
if (preg_match("#^/api/content/(\d+)$#", $path, $m) && $_SERVER["REQUEST_METHOD"] === "GET") content_get($m[1]);
if (preg_match("#^/api/content/(\d+)$#", $path, $m) && $_SERVER["REQUEST_METHOD"] === "DELETE") content_delete($m[1]);
if (preg_match("#^/api/content/(\d+)$#", $path, $m) && ($_SERVER["REQUEST_METHOD"] === "PUT" || $_SERVER["REQUEST_METHOD"] === "PATCH")) content_update($m[1]);
if (preg_match("#^/api/content/(\d+)/delete$#", $path, $m) && $_SERVER["REQUEST_METHOD"] === "POST") content_delete_post($m[1]);
if (preg_match("#^/api/content/(\d+)/update$#", $path, $m) && $_SERVER["REQUEST_METHOD"] === "POST") content_update_post($m[1]);

if ($path === "/api/admin/users" && $_SERVER["REQUEST_METHOD"] === "POST") admin_create_user();
if ($path === "/api/admin/analytics" && $_SERVER["REQUEST_METHOD"] === "GET") admin_analytics();

json_response(["error" => "Route not found", "path" => $path], 404);