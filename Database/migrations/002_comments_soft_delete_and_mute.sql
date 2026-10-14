BEGIN;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS muted_until TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS mute_reason TEXT;
CREATE INDEX IF NOT EXISTS idx_comments_scope_parent_created ON public.comments(manga_id,chapter_id,parent_id,created_at,id);
COMMIT;
