<?php
/**
 * TMDB Action Movies Fetcher
 * Fetches 500 Action movies from TMDB API and generates import_content.json
 * Run: php fetch_tmdb_action.php
 */

$apiKey = '8265bd1679663a7ea12ac168da84d2e8';
$outputFile = __DIR__ . '/import_content.json';

$movies = [];
$totalPages = 25; // 20 movies per page = 500 movies

echo "Fetching Action movies from TMDB...\n";

for ($page = 1; $page <= $totalPages; $page++) {
    $url = "https://api.themoviedb.org/3/discover/movie"
         . "?api_key={$apiKey}"
         . "&with_genres=28"
         . "&sort_by=popularity.desc"
         . "&language=fr-FR"
         . "&page={$page}";

    $ctx = stream_context_create(['http' => [
        'timeout' => 15,
        'header'  => "Accept: application/json\r\n"
    ]]);

    $response = @file_get_contents($url, false, $ctx);

    if (!$response) {
        echo "  [!] Page $page: failed to fetch, skipping\n";
        continue;
    }

    $data = json_decode($response, true);

    if (!isset($data['results'])) {
        echo "  [!] Page $page: no results\n";
        continue;
    }

    foreach ($data['results'] as $m) {
        $title = trim($m['title'] ?? '');
        if (!$title) continue;

        $year = null;
        $release = $m['release_date'] ?? '';
        if (strlen($release) >= 4) {
            $year = (int)substr($release, 0, 4);
        }

        $posterUrl   = $m['poster_path']   ? "https://image.tmdb.org/t/p/w500{$m['poster_path']}"   : null;
        $backdropUrl = $m['backdrop_path'] ? "https://image.tmdb.org/t/p/w1280{$m['backdrop_path']}" : null;

        $movies[] = [
            "title"           => $title,
            "description"     => $m['overview'] ?? null,
            "type"            => "movie",
            "category"        => "Action",
            "year"            => $year,
            "age_rating"      => null,
            "duration_minutes"=> null,
            "production_house"=> null,
            "distribution"    => null,
            "poster_url"      => $posterUrl,
            "backdrop_url"    => $backdropUrl,
            "video_url"       => "",
            "source_type"     => "embed"
        ];
    }

    echo "  Page $page done — total movies so far: " . count($movies) . "\n";

    // Respect TMDB rate limit (max ~40 req/10s)
    usleep(260000); // 0.26s
}

// Trim to exactly 500 if we got more
$movies = array_slice($movies, 0, 500);

$json = json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
file_put_contents($outputFile, $json);

echo "\nDone! " . count($movies) . " movies saved to import_content.json\n";
