## Quick Setup (React + PHP + PostgreSQL)

### 1) Backend
```bash
cd backend
# edit src/config.php
php -S localhost:8000 -t public
```

### 2) Database
- Create DB `mv_stream`
- Run `backend/schema.sql`

### 3) Frontend
```bash
npm install
npm run dev
```

### 4) .env
Frontend uses:
`VITE_API_BASE_URL=http://localhost:8000`

### 5) Add content rows
Insert rows into `content` with:
- type: movie | series | live
- poster_url / backdrop_url
- video_url (mp4 link or HLS stream)
