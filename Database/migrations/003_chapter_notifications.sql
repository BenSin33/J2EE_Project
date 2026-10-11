BEGIN;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS first_published_at TIMESTAMPTZ;
-- Existing public chapters must not be announced as new after deployment.
UPDATE public.chapters SET first_published_at=coalesce(publish_at,created_at,current_timestamp) WHERE lower(status)='published' AND first_published_at IS NULL;
CREATE TABLE IF NOT EXISTS public.chapter_notification_events (
 chapter_id UUID PRIMARY KEY REFERENCES public.chapters(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp, processed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS public.chapter_notification_recipients (
 chapter_id UUID NOT NULL REFERENCES public.chapter_notification_events(chapter_id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 PRIMARY KEY(chapter_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.notifications (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 manga_id UUID REFERENCES public.mangas(id) ON DELETE SET NULL,
 chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
 manga_title TEXT NOT NULL, chapter_title TEXT, chapter_number TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT current_timestamp, read_at TIMESTAMPTZ,
 CONSTRAINT unique_user_chapter_notification UNIQUE(user_id,chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id,created_at DESC,id DESC);
COMMIT;
