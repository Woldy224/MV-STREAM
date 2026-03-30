<?php
return [
  "db" => [
    "host" => "postgres.railway.internal",
    "port" => "5432",
    "name" => "railway",
    "user" => "postgres",
    "pass" => "KfxvJhsSfZnAAqaCcpadQIcqcQaYSaFf",
  ],
  "app" => [
    "cors_origin" => "http://localhost:5173, https://mvstream.ct.ws",
    "token_ttl_minutes" => 60 * 24 * 7, // 7 days
  ]
];
