-- Run once in Supabase SQL Editor for an existing group database before using Bookmark APIs.
-- Additive migration: keeps existing bookmarks and reading_history.
BEGIN;
ALTER TABLE bookmarks ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE;
COMMIT;
