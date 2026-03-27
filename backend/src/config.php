<?php
return [
  "db" => [
    "host" => "127.0.0.1",
    "port" => "5432",
    "name" => "mv_stream",
    "user" => "postgres",
    "pass" => "rubech2001",
  ],
  "app" => [
    "cors_origin" => "http://localhost:5173",
    "token_ttl_minutes" => 60 * 24 * 7, // 7 days
  ]
];
