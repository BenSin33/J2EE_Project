-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  avatar_url text,
  role character varying NOT NULL DEFAULT 'ROLE_USER'::character varying,
  is_banned boolean NOT NULL DEFAULT false,
  is_muted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  reader_theme character varying NOT NULL DEFAULT 'dark'::character varying,
  reading_mode character varying NOT NULL DEFAULT 'vertical'::character varying,
  fit_mode character varying NOT NULL DEFAULT 'fit-width'::character varying,
  font_size character varying NOT NULL DEFAULT 'medium'::character varying,
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.scanlation_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mangadex_id uuid UNIQUE,
  name character varying NOT NULL,
  description text,
  leader_id uuid,
  website character varying,
  discord character varying,
  donation_link character varying,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT scanlation_groups_pkey PRIMARY KEY (id),
  CONSTRAINT fk_groups_leader FOREIGN KEY (leader_id) REFERENCES public.users(id)
);
CREATE TABLE public.authors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mangadex_id uuid UNIQUE,
  name character varying NOT NULL,
  biography text,
  CONSTRAINT authors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mangadex_id uuid UNIQUE,
  name character varying NOT NULL UNIQUE,
  group_type character varying NOT NULL DEFAULT 'genre'::character varying,
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mangas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mangadex_id uuid UNIQUE,
  uploader_id uuid,
  title character varying NOT NULL,
  alt_titles jsonb,
  description text,
  cover_image_url text,
  original_language character varying NOT NULL DEFAULT 'ja'::character varying,
  origin_type character varying NOT NULL DEFAULT 'manga'::character varying,
  status character varying NOT NULL DEFAULT 'ongoing'::character varying,
  content_rating character varying NOT NULL DEFAULT 'safe'::character varying,
  views_count bigint NOT NULL DEFAULT 0,
  bookmarks_count integer NOT NULL DEFAULT 0,
  rating_score numeric NOT NULL DEFAULT 0.00,
  rating_count integer NOT NULL DEFAULT 0,
  approval_status character varying NOT NULL DEFAULT 'approved'::character varying,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mangas_pkey PRIMARY KEY (id),
  CONSTRAINT fk_mangas_uploader FOREIGN KEY (uploader_id) REFERENCES public.users(id)
);
CREATE TABLE public.manga_authors (
  manga_id uuid NOT NULL,
  author_id uuid NOT NULL,
  role character varying NOT NULL DEFAULT 'author'::character varying,
  CONSTRAINT manga_authors_pkey PRIMARY KEY (manga_id, author_id, role),
  CONSTRAINT fk_manga_authors_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT fk_manga_authors_author FOREIGN KEY (author_id) REFERENCES public.authors(id)
);
CREATE TABLE public.manga_tags (
  manga_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  CONSTRAINT manga_tags_pkey PRIMARY KEY (manga_id, tag_id),
  CONSTRAINT fk_manga_tags_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT fk_manga_tags_tag FOREIGN KEY (tag_id) REFERENCES public.tags(id)
);
CREATE TABLE public.chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mangadex_id uuid UNIQUE,
  manga_id uuid NOT NULL,
  uploader_id uuid,
  group_id uuid,
  volume character varying,
  chapter_number character varying,
  title character varying,
  translated_language character varying NOT NULL DEFAULT 'vi'::character varying,
  storage_type character varying NOT NULL DEFAULT 'mangadex_at_home'::character varying,
  mangadex_hash character varying,
  pinned_comment text,
  status character varying NOT NULL DEFAULT 'published'::character varying,
  publish_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chapters_pkey PRIMARY KEY (id),
  CONSTRAINT fk_chapters_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT fk_chapters_uploader FOREIGN KEY (uploader_id) REFERENCES public.users(id),
  CONSTRAINT fk_chapters_group FOREIGN KEY (group_id) REFERENCES public.scanlation_groups(id)
);
CREATE TABLE public.chapter_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  page_number integer NOT NULL,
  image_file_name character varying NOT NULL,
  data_saver_file_name character varying,
  s3_origin_url text,
  s3_webp_url text,
  width integer,
  height integer,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chapter_pages_pkey PRIMARY KEY (id),
  CONSTRAINT fk_chapter_pages_chapter FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT unique_page_per_chapter UNIQUE (chapter_id, page_number)
);
CREATE TABLE public.reading_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL,
  last_chapter_id uuid NOT NULL,
  last_page integer NOT NULL DEFAULT 1,
  read_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reading_history_pkey PRIMARY KEY (id),
  CONSTRAINT fk_reading_history_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_reading_history_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT fk_reading_history_chapter FOREIGN KEY (last_chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT unique_user_manga_history UNIQUE (user_id, manga_id)
);
CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL,
  folder_type character varying NOT NULL DEFAULT 'reading'::character varying CHECK (folder_type::text = ANY (ARRAY['reading'::character varying, 'plan_to_read'::character varying, 'completed'::character varying, 're_reading'::character varying, 'dropped'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notifications_enabled boolean NOT NULL DEFAULT false,
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_bookmarks_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT unique_user_bookmark UNIQUE (user_id, manga_id)
);
CREATE TABLE public.manga_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL,
  rating_star smallint NOT NULL CHECK (rating_star >= 1 AND rating_star <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT manga_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT fk_manga_ratings_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_manga_ratings_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT unique_user_rating UNIQUE (user_id, manga_id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  manga_id uuid NOT NULL,
  chapter_id uuid,
  parent_id uuid,
  content text NOT NULL,
  is_spoiler boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone,
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_comments_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT fk_comments_chapter FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES public.comments(id)
);
CREATE TABLE public.chapter_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  user_id uuid,
  report_type character varying NOT NULL,
  description text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chapter_reports_pkey PRIMARY KEY (id),
  CONSTRAINT fk_chapter_reports_chapter FOREIGN KEY (chapter_id) REFERENCES public.chapters(id),
  CONSTRAINT fk_chapter_reports_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.home_showcases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  manga_id uuid NOT NULL,
  display_section character varying NOT NULL,
  banner_custom_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  CONSTRAINT home_showcases_pkey PRIMARY KEY (id),
  CONSTRAINT fk_home_showcases_manga FOREIGN KEY (manga_id) REFERENCES public.mangas(id),
  CONSTRAINT fk_home_showcases_creator FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- ==========================================
-- DUMMY DATA FOR TESTING
-- ==========================================

-- 1. Users
INSERT INTO public.users (id, username, email, password_hash, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@example.com', '$2a$10$slYQmyNdGzTn7ZLBDIbfPh9tlvRo9D.M.g58D/f1.O6Uf9B9q.31e', 'ROLE_ADMIN'),
('22222222-2222-2222-2222-222222222222', 'uploader_1', 'uploader@example.com', '$2a$10$slYQmyNdGzTn7ZLBDIbfPh9tlvRo9D.M.g58D/f1.O6Uf9B9q.31e', 'ROLE_UPLOADER'),
('33333333-3333-3333-3333-333333333333', 'akira_reader', 'akira@example.com', '$2a$10$slYQmyNdGzTn7ZLBDIbfPh9tlvRo9D.M.g58D/f1.O6Uf9B9q.31e', 'ROLE_USER');

-- 2. User Settings
INSERT INTO public.user_settings (user_id, reader_theme) VALUES 
('33333333-3333-3333-3333-333333333333', 'dark');

-- 3. Scanlation Groups
INSERT INTO public.scanlation_groups (id, name, leader_id) VALUES 
('a0000000-0000-0000-0000-000000000001', 'Manga VN Group', '22222222-2222-2222-2222-222222222222');

-- 4. Authors
INSERT INTO public.authors (id, name) VALUES 
('b0000000-0000-0000-0000-000000000001', 'Oda Eiichiro'),
('b0000000-0000-0000-0000-000000000002', 'Kishimoto Masashi');

-- 5. Tags
INSERT INTO public.tags (id, name) VALUES 
('c0000000-0000-0000-0000-000000000001', 'Action'),
('c0000000-0000-0000-0000-000000000002', 'Adventure'),
('c0000000-0000-0000-0000-000000000003', 'Romance');

-- 6. Mangas
INSERT INTO public.mangas (id, uploader_id, title, description, cover_image_url) VALUES 
('d0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'One Piece', 'Vua hải tặc', 'https://example.com/op.jpg'),
('d0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Naruto', 'Hokage đệ thất', 'https://example.com/na.jpg');

-- 7. Manga Authors
INSERT INTO public.manga_authors (manga_id, author_id) VALUES 
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002');

-- 8. Manga Tags
INSERT INTO public.manga_tags (manga_id, tag_id) VALUES 
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001');

-- 9. Chapters
INSERT INTO public.chapters (id, manga_id, uploader_id, group_id, chapter_number, title) VALUES 
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', '1', 'Romance Dawn'),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', '2', 'Luffy vs Alvida');

-- 10. Chapter Pages
INSERT INTO public.chapter_pages (chapter_id, page_number, image_file_name) VALUES 
('e0000000-0000-0000-0000-000000000001', 1, 'page_1.jpg'),
('e0000000-0000-0000-0000-000000000001', 2, 'page_2.jpg');

-- 11. Reading History
INSERT INTO public.reading_history (user_id, manga_id, last_chapter_id, last_page) VALUES 
('33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 2);

-- 12. Bookmarks
INSERT INTO public.bookmarks (user_id, manga_id, folder_type) VALUES 
('33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 'reading');

-- 13. Manga Ratings
INSERT INTO public.manga_ratings (user_id, manga_id, rating_star) VALUES 
('33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 5);

-- 14. Comments
INSERT INTO public.comments (id, user_id, manga_id, content) VALUES 
('f0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'd0000000-0000-0000-0000-000000000001', 'Truyện hay quá!');

-- 15. Home Showcases
INSERT INTO public.home_showcases (manga_id, display_section, created_by) VALUES 
('d0000000-0000-0000-0000-000000000001', 'trending', '11111111-1111-1111-1111-111111111111');