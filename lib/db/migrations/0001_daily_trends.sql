CREATE TABLE IF NOT EXISTS "daily_trends" (
  "id" serial PRIMARY KEY NOT NULL,
  "topics" text,
  "hashtags" text,
  "songs" text,
  "creators" text,
  "created_at" timestamp DEFAULT now() NOT NULL
); 