-- PostgreSQL schema for MV-STREAM
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

CREATE TABLE content (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('movie','series','live')),
  source_type VARCHAR(20) NOT NULL DEFAULT 'upload' CHECK (source_type IN ('upload','embed','hls','m3u8')),
  category VARCHAR(60),
  poster_url TEXT,
  backdrop_url TEXT,
  video_url TEXT,
  year INT,
  age_rating VARCHAR(10),
  duration_minutes INT,
  production_house VARCHAR(180),
  distribution TEXT,
  seasons_count INT,
  episodes_count INT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_category ON content(category);

-- Seed an initial admin account for first login (change after install)
-- Email: admin@mvstream.local
-- Password: Admin123!
INSERT INTO users (full_name, email, password_hash, role)
VALUES (
  'Administrator',
  'admin@mvstream.local',
  '$2y$10$PtxNmyWcH/nBi7XqRzAUpeEKZZdRFmF92Gqzcw22qHHeWOxzWeBoC',
  'admin'
);