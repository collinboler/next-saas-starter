CREATE TABLE IF NOT EXISTS daily_trends (
    id SERIAL PRIMARY KEY,
    topics JSONB,
    hashtags JSONB,
    songs JSONB,
    creators JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 