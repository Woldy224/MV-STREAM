<?php
require_once __DIR__ . "/../db.php";
require_once __DIR__ . "/../helpers.php";
require_once __DIR__ . "/../auth.php";

function content_list(): void {
  // Public endpoint
$type = $_GET["type"] ?? null;

  $pdo = db();
  if ($type) {
    $st = $pdo->prepare("SELECT * FROM content WHERE type = ? ORDER BY created_at DESC LIMIT 200");
    $st->execute([$type]);
  } else {
    $st = $pdo->query("SELECT * FROM content ORDER BY created_at DESC LIMIT 200");
  }
  json_response(["items" => $st->fetchAll()]);
}

function content_get($id): void {
  // Public endpoint
$pdo = db();
  $st = $pdo->prepare("SELECT * FROM content WHERE id = ? LIMIT 1");
  $st->execute([(int)$id]);
  $item = $st->fetch();
  if (!$item) json_response(["error" => "Not found"], 404);
  json_response(["item" => $item]);
}

function content_create(): void {
  require_admin();

  $isMultipart = isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;

  $fields = [];
  if ($isMultipart) {
    $fields = $_POST;
  } else {
    $fields = read_json();
  }

  $type = trim((string)($fields["type"] ?? "movie"));
  $title = trim((string)($fields["title"] ?? ""));
  $description = trim((string)($fields["description"] ?? ""));
  $category = trim((string)($fields["category"] ?? ""));
  $year = $fields["year"] ?? null;
  $duration = $fields["duration_minutes"] ?? null;
  $age = trim((string)($fields["age_rating"] ?? ""));
  $productionHouse = trim((string)($fields["production_house"] ?? ""));
  $distribution = trim((string)($fields["distribution"] ?? ""));
  $seasonsCount = $fields["seasons_count"] ?? null;
  $episodesCount = $fields["episodes_count"] ?? null;

  $sourceType = strtolower(trim((string)($fields["source_type"] ?? "upload")));
  if (!in_array($sourceType, ["upload", "embed", "hls", "m3u8"], true)) $sourceType = "upload";

  if ($title === "") json_response(["error" => "Title required"], 422);
  if (!in_array($type, ["movie", "series", "live"], true)) json_response(["error" => "Invalid type"], 422);

  $uploadDir = __DIR__ . "/../../public/uploads";
  if (!is_dir($uploadDir)) @mkdir($uploadDir, 0775, true);

  $posterUrl = trim((string)($fields["poster_url"] ?? ""));
  $backdropUrl = trim((string)($fields["backdrop_url"] ?? ""));
  $videoUrl = trim((string)($fields["video_url"] ?? ""));

  // Handle uploads (poster + video/m3u8)
  if ($isMultipart) {
    if (isset($_FILES['poster_file']) && $_FILES['poster_file']['error'] === UPLOAD_ERR_OK) {
      $posterUrl = save_upload($_FILES['poster_file'], $uploadDir, ["jpg","jpeg","png","webp"]);
    }

    if (isset($_FILES['backdrop_file']) && $_FILES['backdrop_file']['error'] === UPLOAD_ERR_OK) {
      $backdropUrl = save_upload($_FILES['backdrop_file'], $uploadDir, ["jpg","jpeg","png","webp"]);
    }

    if ($sourceType === 'upload' && isset($_FILES['video_file']) && $_FILES['video_file']['error'] === UPLOAD_ERR_OK) {
      $videoUrl = save_upload($_FILES['video_file'], $uploadDir, ["mp4","mkv","webm","mov","avi"]);
    }

    if ($sourceType === 'm3u8' && isset($_FILES['m3u8_file']) && $_FILES['m3u8_file']['error'] === UPLOAD_ERR_OK) {
      $videoUrl = save_upload($_FILES['m3u8_file'], $uploadDir, ["m3u8"]);
    }

    // For URL-based sources
    $streamUrl = trim((string)($fields['stream_url'] ?? ''));
    if ($streamUrl !== '' && in_array($sourceType, ['embed','hls','m3u8'], true)) {
      $videoUrl = $streamUrl;
    }
  }

  // JSON body source
  if (!$isMultipart) {
    $streamUrl = trim((string)($fields['stream_url'] ?? ''));
    if ($streamUrl !== '' && in_array($sourceType, ['embed','hls','m3u8'], true)) {
      $videoUrl = $streamUrl;
    }
  }

  if ($posterUrl === "") json_response(["error" => "Poster required"], 422);
  if ($videoUrl === "" && $type !== 'live') json_response(["error" => "Video/Stream required"], 422);
  if ($type === 'live' && $videoUrl === "") json_response(["error" => "Stream required"], 422);

  $pdo = db();

  $cols = ["title", "description", "type", "category", "poster_url", "backdrop_url", "video_url", "year", "age_rating", "duration_minutes"]; 
  $vals = [$title, $description === "" ? null : $description, $type, $category === "" ? null : $category, $posterUrl, $backdropUrl === "" ? null : $backdropUrl, $videoUrl, $year ?: null, $age === "" ? null : $age, $duration ?: null];

  if (db_has_column('content', 'production_house')) {
    $cols[] = 'production_house';
    $vals[] = $productionHouse === "" ? null : $productionHouse;
  }
  if (db_has_column('content', 'distribution')) {
    $cols[] = 'distribution';
    $vals[] = $distribution === "" ? null : $distribution;
  }
  if (db_has_column('content', 'seasons_count')) {
    $cols[] = 'seasons_count';
    $vals[] = $seasonsCount === '' || $seasonsCount === null ? null : $seasonsCount;
  }
  if (db_has_column('content', 'episodes_count')) {
    $cols[] = 'episodes_count';
    $vals[] = $episodesCount === '' || $episodesCount === null ? null : $episodesCount;
  }

  if (db_has_column('content', 'source_type')) {
    $cols[] = 'source_type';
    $vals[] = $sourceType;
  }

  $placeholders = implode(",", array_fill(0, count($cols), "?"));
  $columnsSql = implode(",", $cols);
  $st = $pdo->prepare("INSERT INTO content($columnsSql) VALUES($placeholders) RETURNING id");
  $st->execute($vals);
  $id = (int)$st->fetchColumn();

  $st2 = $pdo->prepare("SELECT * FROM content WHERE id = ? LIMIT 1");
  $st2->execute([$id]);
  $item = $st2->fetch();
  json_response(["item" => $item], 201);
}

function content_update($id): void {
  require_admin();

  $isMultipart = isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
  $fields = $isMultipart ? $_POST : read_json();

  $pdo = db();
  $st = $pdo->prepare("SELECT * FROM content WHERE id = ? LIMIT 1");
  $st->execute([(int)$id]);
  $existing = $st->fetch();
  if (!$existing) json_response(["error" => "Not found"], 404);

  $uploadDir = __DIR__ . "/../../public/uploads";
  if (!is_dir($uploadDir)) @mkdir($uploadDir, 0775, true);

  // Incoming fields (all optional)
  $type = isset($fields['type']) ? trim((string)$fields['type']) : null;
  $title = isset($fields['title']) ? trim((string)$fields['title']) : null;
  $description = isset($fields['description']) ? trim((string)$fields['description']) : null;
  $category = isset($fields['category']) ? trim((string)$fields['category']) : null;
  $year = array_key_exists('year', $fields) ? ($fields['year'] === '' ? null : $fields['year']) : null;
  $duration = array_key_exists('duration_minutes', $fields) ? ($fields['duration_minutes'] === '' ? null : $fields['duration_minutes']) : null;
  $age = isset($fields['age_rating']) ? trim((string)$fields['age_rating']) : null;
  $productionHouse = isset($fields['production_house']) ? trim((string)$fields['production_house']) : null;
  $distribution = isset($fields['distribution']) ? trim((string)$fields['distribution']) : null;
  $seasonsCount = array_key_exists('seasons_count', $fields) ? ($fields['seasons_count'] === '' ? null : $fields['seasons_count']) : null;
  $episodesCount = array_key_exists('episodes_count', $fields) ? ($fields['episodes_count'] === '' ? null : $fields['episodes_count']) : null;

  $sourceType = isset($fields['source_type']) ? strtolower(trim((string)$fields['source_type'])) : null;
  if ($sourceType !== null && !in_array($sourceType, ['upload','embed','hls','m3u8'], true)) {
    $sourceType = null;
  }

  // URLs / uploads
  $posterUrl = isset($fields['poster_url']) ? trim((string)$fields['poster_url']) : null;
  $backdropUrl = isset($fields['backdrop_url']) ? trim((string)$fields['backdrop_url']) : null;
  $videoUrl = isset($fields['video_url']) ? trim((string)$fields['video_url']) : null;

  // Prefer stream_url if provided
  $streamUrl = isset($fields['stream_url']) ? trim((string)$fields['stream_url']) : null;
  if ($streamUrl !== null && $streamUrl !== '') {
    $videoUrl = $streamUrl;
  }

  // Handle uploaded poster
  if ($isMultipart && isset($_FILES['poster_file']) && $_FILES['poster_file']['error'] === UPLOAD_ERR_OK) {
    $posterUrl = save_upload($_FILES['poster_file'], $uploadDir, ["jpg","jpeg","png","webp"]);
  }
  if ($isMultipart && isset($_FILES['backdrop_file']) && $_FILES['backdrop_file']['error'] === UPLOAD_ERR_OK) {
    $backdropUrl = save_upload($_FILES['backdrop_file'], $uploadDir, ["jpg","jpeg","png","webp"]);
  }

  // Handle uploaded video (optional)
  if ($isMultipart && isset($_FILES['video_file']) && $_FILES['video_file']['error'] === UPLOAD_ERR_OK) {
    $videoUrl = save_upload($_FILES['video_file'], $uploadDir, ["mp4","mkv","webm","mov","avi"]);
    $sourceType = $sourceType ?? 'upload';
  }
  if ($isMultipart && isset($_FILES['m3u8_file']) && $_FILES['m3u8_file']['error'] === UPLOAD_ERR_OK) {
    $videoUrl = save_upload($_FILES['m3u8_file'], $uploadDir, ["m3u8"]);
    $sourceType = 'm3u8';
  }

  // Validate type if provided
  if ($type !== null && !in_array($type, ['movie','series','live'], true)) {
    json_response(["error" => "Invalid type"], 422);
  }
  if ($title !== null && $title === '') {
    json_response(["error" => "Title required"], 422);
  }

  // Build update query dynamically
  $sets = [];
  $vals = [];

  $map = [
    'title' => $title,
    'description' => $description,
    'type' => $type,
    'category' => $category,
    'poster_url' => $posterUrl,
    'backdrop_url' => $backdropUrl,
    'video_url' => $videoUrl,
    'year' => $year,
    'age_rating' => $age,
    'duration_minutes' => $duration,
  ];

  if (db_has_column('content', 'production_house')) {
    $map['production_house'] = $productionHouse;
  }
  if (db_has_column('content', 'distribution')) {
    $map['distribution'] = $distribution;
  }
  if (db_has_column('content', 'seasons_count')) {
    $map['seasons_count'] = $seasonsCount;
  }
  if (db_has_column('content', 'episodes_count')) {
    $map['episodes_count'] = $episodesCount;
  }

  foreach ($map as $col => $val) {
    if ($val !== null) {
      // Normalize empty strings to NULL for nullable columns
      if (in_array($col, ['description','category','poster_url','backdrop_url','video_url','age_rating','production_house','distribution'], true) && $val === '') {
        $val = null;
      }
      $sets[] = "$col = ?";
      $vals[] = $val;
    }
  }

  if ($sourceType !== null && db_has_column('content', 'source_type')) {
    $sets[] = "source_type = ?";
    $vals[] = $sourceType;
  }

  if (count($sets) === 0) {
    json_response(["error" => "No changes"], 422);
  }

  $vals[] = (int)$id;
  $sql = "UPDATE content SET " . implode(', ', $sets) . " WHERE id = ?";
  $upd = $pdo->prepare($sql);
  $upd->execute($vals);

  // Best-effort cleanup old local files if replaced
  $uploadsDir = realpath(__DIR__ . "/../../public/uploads");
  if ($uploadsDir) {
    foreach (['poster_url' => $posterUrl, 'backdrop_url' => $backdropUrl, 'video_url' => $videoUrl] as $k => $newUrl) {
      if ($newUrl === null || $newUrl === '') continue;
      $oldUrl = (string)($existing[$k] ?? '');
      if ($oldUrl !== '' && $oldUrl !== $newUrl && strpos($oldUrl, '/uploads/') === 0) {
        $fp = $uploadsDir . DIRECTORY_SEPARATOR . basename($oldUrl);
        if (is_file($fp)) @unlink($fp);
      }
    }
  }

  $st2 = $pdo->prepare("SELECT * FROM content WHERE id = ? LIMIT 1");
  $st2->execute([(int)$id]);
  $item = $st2->fetch();
  json_response(["item" => $item]);
}

function content_update_post($id): void {
  // Fallback for servers that block PATCH/PUT
  content_update($id);
}

function parse_m3u(string $text): array {
  $text = str_replace(["\r\n", "\r"], "\n", $text);
  // Strip UTF-8 BOM
  $text = preg_replace('/^\xEF\xBB\xBF/', '', $text);
  $lines = explode("\n", $text);

  $items = [];
  $current = null;

  foreach ($lines as $raw) {
    $line = trim($raw);
    if ($line === '') continue;

    if (strpos($line, '#EXTINF') === 0) {
      // Example:
      // #EXTINF:-1 tvg-id="" tvg-name="..." tvg-logo="https://..." group-title="Sports",Channel Name
      $current = [
        'title' => null,
        'logo' => null,
        'group' => null,
      ];

      // attributes in the metadata
      if (preg_match_all('/([a-zA-Z0-9\-]+)\s*=\s*"([^"]*)"/', $line, $m, PREG_SET_ORDER)) {
        foreach ($m as $kv) {
          $k = strtolower(trim($kv[1]));
          $v = trim($kv[2]);
          if ($k === 'tvg-logo') $current['logo'] = $v;
          if ($k === 'group-title') $current['group'] = $v;
          if ($k === 'tvg-name' && $current['title'] === null) $current['title'] = $v;
        }
      }

      // channel name after the last comma
      $pos = strrpos($line, ',');
      if ($pos !== false) {
        $name = trim(substr($line, $pos + 1));
        if ($name !== '') $current['title'] = $name;
      }
      continue;
    }

    if ($line[0] === '#') continue; // comments

    // URL line
    if ($current && $current['title']) {
      $items[] = [
        'title' => (string)$current['title'],
        'poster_url' => $current['logo'] ?: null,
        'category' => $current['group'] ?: null,
        'video_url' => $line,
      ];
    }
    $current = null;
  }

  return $items;
}

function content_import_playlist(): void {
  require_admin();

  $isMultipart = isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
  if (!$isMultipart) {
    json_response(["error" => "multipart/form-data required"], 415);
  }

  if (!isset($_FILES['playlist_file']) || $_FILES['playlist_file']['error'] !== UPLOAD_ERR_OK) {
    json_response(["error" => "Playlist file required"], 422);
  }

  $file = $_FILES['playlist_file'];
  $name = $file['name'] ?? 'playlist.m3u';
  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if (!in_array($ext, ['m3u', 'm3u8'], true)) {
    json_response(["error" => "Invalid file type (m3u/m3u8)"], 422);
  }

  $uploadDir = __DIR__ . "/../../public/uploads";
  if (!is_dir($uploadDir)) @mkdir($uploadDir, 0775, true);

  $pdo = db();

  // Some installations may use an older DB schema without the source_type column.
  // Keep import compatible by inserting without source_type when missing.
  $hasSourceType = db_has_column('content', 'source_type');

  // If it's a single .m3u8 file (HLS playlist/manifest), add one LIVE item
  if ($ext === 'm3u8') {
    $saved = save_upload($file, $uploadDir, ["m3u8"]);
    $title = preg_replace('/\.[^.]+$/', '', basename($name));
    $title = trim((string)$title);
    if ($title === '') $title = 'Live stream';

    if ($hasSourceType) {
      $st = $pdo->prepare("INSERT INTO content(title, description, type, category, poster_url, video_url, source_type) VALUES(?,?,?,?,?,?,?) RETURNING id");
      $st->execute([$title, null, 'live', null, null, $saved, 'm3u8']);
    } else {
      $st = $pdo->prepare("INSERT INTO content(title, description, type, category, poster_url, video_url) VALUES(?,?,?,?,?,?) RETURNING id");
      $st->execute([$title, null, 'live', null, null, $saved]);
    }
    $id = (int)$st->fetchColumn();
    $st2 = $pdo->prepare("SELECT * FROM content WHERE id = ? LIMIT 1");
    $st2->execute([$id]);
    json_response([
      'created' => 1,
      'skipped' => 0,
      'items' => [$st2->fetch()],
    ], 201);
  }

  // For .m3u playlist: parse multiple channels
  $txt = file_get_contents($file['tmp_name'] ?? '') ?: '';
  $parsed = parse_m3u($txt);
  if (count($parsed) === 0) {
    json_response(["error" => "No channels found in playlist"], 422);
  }

  $pdo->beginTransaction();
  try {
    if ($hasSourceType) {
      $ins = $pdo->prepare("INSERT INTO content(title, description, type, category, poster_url, video_url, source_type) VALUES(?,?,?,?,?,?,?) RETURNING id");
    } else {
      $ins = $pdo->prepare("INSERT INTO content(title, description, type, category, poster_url, video_url) VALUES(?,?,?,?,?,?) RETURNING id");
    }
    $chk = $pdo->prepare("SELECT id FROM content WHERE type = 'live' AND video_url = ? LIMIT 1");
    $get = $pdo->prepare("SELECT * FROM content WHERE id = ? LIMIT 1");

    $created = 0;
    $skipped = 0;
    $items = [];

    foreach ($parsed as $row) {
      $url = trim((string)($row['video_url'] ?? ''));
      $title = trim((string)($row['title'] ?? ''));
      if ($url === '' || $title === '') continue;

      // Skip duplicates by same stream URL
      $chk->execute([$url]);
      $existingId = $chk->fetchColumn();
      if ($existingId) {
        $skipped++;
        continue;
      }

      $poster = $row['poster_url'] ?? null;
      $cat = $row['category'] ?? null;
      $source = (strpos(strtolower($url), '.m3u8') !== false) ? 'hls' : 'embed';

      if ($hasSourceType) {
        $ins->execute([$title, null, 'live', $cat, $poster, $url, $source]);
      } else {
        $ins->execute([$title, null, 'live', $cat, $poster, $url]);
      }
      $id = (int)$ins->fetchColumn();
      $created++;

      // Return only first 20 created items to keep response small
      if (count($items) < 20) {
        $get->execute([$id]);
        $items[] = $get->fetch();
      }
    }

    $pdo->commit();

    json_response([
      'created' => $created,
      'skipped' => $skipped,
      'items' => $items,
    ], 201);
  } catch (Throwable $e) {
    $pdo->rollBack();
    json_response(["error" => "Import failed", "detail" => $e->getMessage()], 500);
  }
}



function content_delete($id): void {
  require_admin();
  $pdo = db();
  // Fetch current item to delete uploaded files too
  $st = $pdo->prepare("SELECT poster_url, video_url, source_type FROM content WHERE id = ? LIMIT 1");
  $st->execute([(int)$id]);
  $row = $st->fetch();
  if (!$row) json_response(["error" => "Not found"], 404);

  // Delete DB row
  $del = $pdo->prepare("DELETE FROM content WHERE id = ?");
  $del->execute([(int)$id]);

  // Best-effort delete local uploaded files (only if they are under /uploads/)
  $uploadsDir = realpath(__DIR__ . "/../../public/uploads");
  if ($uploadsDir) {
    foreach (['poster_url','backdrop_url','video_url'] as $k) {
      $url = (string)($row[$k] ?? '');
      if ($url === '') continue;
      // only delete local /uploads/ files (not remote links or embed)
      if (strpos($url, '/uploads/') === 0) {
        $fname = basename($url);
        $fp = $uploadsDir . DIRECTORY_SEPARATOR . $fname;
        if (is_file($fp)) @unlink($fp);
      }
    }
  }

  json_response(["ok" => true]);
}

function content_delete_post($id): void {
  // Fallback for servers that block DELETE method
  content_delete($id);
}

function content_import_json(): void {
  require_admin();

  $isMultipart = isset($_SERVER['CONTENT_TYPE']) && stripos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false;
  if (!$isMultipart) {
    json_response(["error" => "multipart/form-data required"], 415);
  }

  if (!isset($_FILES['json_file']) || $_FILES['json_file']['error'] !== UPLOAD_ERR_OK) {
    json_response(["error" => "JSON file required"], 422);
  }

  $file = $_FILES['json_file'];
  $name = $file['name'] ?? 'import.json';
  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if ($ext !== 'json') {
    json_response(["error" => "Invalid file type (.json required)"], 422);
  }

  $txt = file_get_contents($file['tmp_name'] ?? '') ?: '';
  $items = json_decode($txt, true);

  if (json_last_error() !== JSON_ERROR_NONE) {
    json_response(["error" => "Invalid JSON format: " . json_last_error_msg()], 422);
  }

  if (!is_array($items)) {
    json_response(["error" => "JSON must be an array of objects"], 422);
  }

  $pdo = db();
  $hasSourceType = db_has_column('content', 'source_type');
  $hasProdHouse = db_has_column('content', 'production_house');
  $hasDist = db_has_column('content', 'distribution');
  $hasSeasons = db_has_column('content', 'seasons_count');
  $hasEpisodes = db_has_column('content', 'episodes_count');

  $pdo->beginTransaction();
  try {
    $created = 0;
    $skipped = 0;

    // Prepare dedup check: skip if same title + type already exists
    $chk = $pdo->prepare("SELECT 1 FROM content WHERE LOWER(title) = LOWER(?) AND type = ? LIMIT 1");

    foreach ($items as $item) {
      $title = trim((string)($item['title'] ?? ''));
      if ($title === '') continue;

      $type = trim((string)($item['type'] ?? 'movie'));
      if (!in_array($type, ['movie', 'series', 'live'], true)) $type = 'movie';

      // --- Deduplication check ---
      $chk->execute([$title, $type]);
      if ($chk->fetchColumn()) {
        $skipped++;
        continue;
      }

      $cols = ["title", "description", "type", "category", "poster_url", "backdrop_url", "video_url", "year", "age_rating", "duration_minutes"];
      $vals = [
        $title,
        $item['description'] ?? null,
        $type,
        $item['category'] ?? null,
        $item['poster_url'] ?? null,
        $item['backdrop_url'] ?? null,
        $item['video_url'] ?? null,
        $item['year'] ?? null,
        $item['age_rating'] ?? null,
        $item['duration_minutes'] ?? null
      ];

      if ($hasSourceType) {
        $cols[] = 'source_type';
        $vals[] = $item['source_type'] ?? 'embed';
      }
      if ($hasProdHouse) {
        $cols[] = 'production_house';
        $vals[] = $item['production_house'] ?? null;
      }
      if ($hasDist) {
        $cols[] = 'distribution';
        $vals[] = $item['distribution'] ?? null;
      }
      if ($hasSeasons) {
        $cols[] = 'seasons_count';
        $vals[] = $item['seasons_count'] ?? null;
      }
      if ($hasEpisodes) {
        $cols[] = 'episodes_count';
        $vals[] = $item['episodes_count'] ?? null;
      }

      $placeholders = implode(",", array_fill(0, count($cols), "?"));
      $columnsSql = implode(",", $cols);
      $st = $pdo->prepare("INSERT INTO content($columnsSql) VALUES($placeholders)");
      $st->execute($vals);
      $created++;
    }

    $pdo->commit();
    json_response(["created" => $created, "skipped" => $skipped], 201);
  } catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    json_response(["error" => "Import failed", "detail" => $e->getMessage()], 500);
  }
}

function save_upload(array $file, string $dir, array $allowedExts): string {
  $name = $file['name'] ?? 'file';
  $tmp = $file['tmp_name'] ?? '';
  $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
  if (!in_array($ext, $allowedExts, true)) {
    json_response(["error" => "Invalid file type"], 422);
  }
  $safe = base64url_random(12) . "." . $ext;
  $dest = rtrim($dir, "/") . "/" . $safe;
  if (!move_uploaded_file($tmp, $dest)) {
    json_response(["error" => "Upload failed"], 500);
  }
  // Public URL (served by web server from backend/public)
  return "/uploads/" . $safe;
}
