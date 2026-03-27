<?php
/**
 * MV-STREAM Content Import Tool
 * This script imports content from a JSON file into the PostgreSQL database.
 * Run this script from the terminal or via a PHP CLI.
 */

require_once __DIR__ . "/../db.php";

function import_from_json(string $filePath) {
    if (!file_exists($filePath)) {
        echo "Error: File not found at $filePath\n";
        return;
    }

    $jsonContent = file_get_contents($filePath);
    $items = json_decode($jsonContent, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        echo "Error: Invalid JSON format. " . json_last_error_msg() . "\n";
        return;
    }

    if (!is_array($items)) {
        echo "Error: JSON must be an array of objects.\n";
        return;
    }

    $pdo = db();
    $created = 0;
    $errors = 0;

    echo "Starting import of " . count($items) . " items...\n";

    foreach ($items as $index => $item) {
        try {
            $title = $item['title'] ?? '';
            if (empty($title)) {
                echo "Skip item #$index: Missing title.\n";
                $errors++;
                continue;
            }

            $type = $item['type'] ?? 'movie';
            $description = $item['description'] ?? null;
            $category = $item['category'] ?? null;
            $year = isset($item['year']) ? (int)$item['year'] : null;
            $age_rating = $item['age_rating'] ?? null;
            $duration_minutes = isset($item['duration_minutes']) ? (int)$item['duration_minutes'] : null;
            $production_house = $item['production_house'] ?? null;
            $distribution = $item['distribution'] ?? null;
            $poster_url = $item['poster_url'] ?? null;
            $backdrop_url = $item['backdrop_url'] ?? null;
            $video_url = $item['video_url'] ?? null;
            $source_type = $item['source_type'] ?? 'embed'; // Default to embed for external links
            
            $seasons_count = isset($item['seasons_count']) ? (int)$item['seasons_count'] : null;
            $episodes_count = isset($item['episodes_count']) ? (int)$item['episodes_count'] : null;

            // Prepare columns and values
            $cols = ["title", "description", "type", "category", "poster_url", "backdrop_url", "video_url", "year", "age_rating", "duration_minutes", "source_type"];
            $vals = [$title, $description, $type, $category, $poster_url, $backdrop_url, $video_url, $year, $age_rating, $duration_minutes, $source_type];

            // Add optional columns if they exist in schema
            if (db_has_column('content', 'production_house')) {
                $cols[] = 'production_house';
                $vals[] = $production_house;
            }
            if (db_has_column('content', 'distribution')) {
                $cols[] = 'distribution';
                $vals[] = $distribution;
            }
            if (db_has_column('content', 'seasons_count')) {
                $cols[] = 'seasons_count';
                $vals[] = $seasons_count;
            }
            if (db_has_column('content', 'episodes_count')) {
                $cols[] = 'episodes_count';
                $vals[] = $episodes_count;
            }

            $placeholders = implode(",", array_fill(0, count($cols), "?"));
            $columnsSql = implode(",", $cols);
            
            // PostgreSQL syntax for insertion
            $sql = "INSERT INTO content($columnsSql) VALUES($placeholders)";
            $st = $pdo->prepare($sql);
            $st->execute($vals);

            echo "Successfully imported: $title\n";
            $created++;
        } catch (Exception $e) {
            echo "Error importing #$index (" . ($item['title'] ?? 'Unknown') . "): " . $e->getMessage() . "\n";
            $errors++;
        }
    }

    echo "\nImport finished!\n";
    echo "Total created: $created\n";
    echo "Total errors: $errors\n";
}

// Example usage: php import_json.php
$importFile = __DIR__ . "/../../import_content.json";
import_from_json($importFile);
