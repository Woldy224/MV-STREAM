# MV-STREAM Backend (PHP + PostgreSQL)

## 1) Create DB + tables
- Create a PostgreSQL database named `mv_stream`
- Run `schema.sql`

## 2) Configure
Edit `src/config.php`:
- DB credentials
- `cors_origin` (React URL)

## 3) Run locally
If you have PHP 8+ installed:

```bash
cd backend
php -S localhost:8000 -t public
```

## 4) API Endpoints
- POST `/api/auth/register` { full_name, email, password }
- POST `/api/auth/login` { email, password }
- GET  `/api/auth/me` (Bearer token)
- POST `/api/auth/logout` (Bearer token)

- GET  `/api/content?type=movie|series|live` (Bearer token)
- GET  `/api/content/:id` (Bearer token)

## 5) Seed content (example)
Insert into `content` rows with `poster_url`, `backdrop_url`, and `video_url`.
