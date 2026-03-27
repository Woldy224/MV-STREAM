ALTER TABLE content ADD COLUMN IF NOT EXISTS production_house VARCHAR(180);
ALTER TABLE content ADD COLUMN IF NOT EXISTS distribution TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS seasons_count INT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS episodes_count INT;

-- backdrop_url already exists in recent schemas, but keep this for older installs
ALTER TABLE content ADD COLUMN IF NOT EXISTS backdrop_url TEXT;
