-- Migration: create bin_collection_day table
-- Run this SQL against your Supabase/Postgres database.

CREATE TABLE IF NOT EXISTS bin_collection_day (
  property_id uuid PRIMARY KEY REFERENCES properties(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday..6=Saturday
  created_at timestamptz DEFAULT now()
);

-- optional: grant minimal privileges if needed
-- GRANT SELECT, INSERT, UPDATE ON bin_collection_day TO authenticated;
