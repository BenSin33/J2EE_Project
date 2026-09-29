-- 1. Bật extension tạo UUID ngẫu nhiên
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tài khoản
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'USER',
    is_banned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Cài đặt cá nhân
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    reader_theme VARCHAR(20) DEFAULT 'dark',
    reading_mode VARCHAR(20) DEFAULT 'vertical',
    fit_mode VARCHAR(20) DEFAULT 'fit-width',
    font_size VARCHAR(10) DEFAULT 'medium'
);

-- 4. Nhóm dịch
CREATE TABLE scanlation_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mangadex_id UUID UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    website VARCHAR(255),
    discord VARCHAR(255),
    donation_link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tác giả & Tag
CREATE TABLE authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mangadex_id UUID UNIQUE,
    name VARCHAR(150) NOT NULL,
    biography TEXT
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mangadex_id UUID UNIQUE,
    name VARCHAR(50) NOT NULL UNIQUE,
    group_type VARCHAR(30) DEFAULT 'genre'
);

-- 6. Bảng Manga
CREATE TABLE mangas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mangadex_id UUID UNIQUE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES scanlation_groups(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    alt_titles JSONB,
    description TEXT,
    cover_image_url VARCHAR(500),
    original_language VARCHAR(10) DEFAULT 'ja',
    origin_type VARCHAR(20) DEFAULT 'manga',
    status VARCHAR(20) DEFAULT 'ongoing',
    content_rating VARCHAR(20) DEFAULT 'safe',
    views_count BIGINT DEFAULT 0,
    bookmarks_count INT DEFAULT 0,
    rating_score NUMERIC(3, 2) DEFAULT 0.00,
    rating_count INT DEFAULT 0,
    approval_status VARCHAR(20) DEFAULT 'approved',
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bảng nối Manga - Tác giả & Tag
CREATE TABLE manga_authors (
    manga_id UUID REFERENCES mangas(id) ON DELETE CASCADE,
    author_id UUID REFERENCES authors(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'author',
    PRIMARY KEY (manga_id, author_id, role)
);

CREATE TABLE manga_tags (
    manga_id UUID REFERENCES mangas(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, tag_id)
);

-- 8. Chương truyện & Trang ảnh
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mangadex_id UUID UNIQUE,
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES scanlation_groups(id) ON DELETE SET NULL,
    volume VARCHAR(20),
    chapter_number VARCHAR(50),
    title VARCHAR(255),
    translated_language VARCHAR(10) DEFAULT 'vi',
    storage_type VARCHAR(20) DEFAULT 'mangadex_at_home',
    mangadex_hash VARCHAR(100),
    pinned_comment TEXT,
    status VARCHAR(20) DEFAULT 'published',
    publish_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chapter_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    image_file_name VARCHAR(255) NOT NULL,
    data_saver_file_name VARCHAR(255),
    s3_origin_url VARCHAR(500),
    s3_webp_url VARCHAR(500),
    width INT,
    height INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_page_per_chapter UNIQUE(chapter_id, page_number)
);

-- 9. Tương tác: Lịch sử, Tủ truyện, Đánh giá, Bình luận, Báo lỗi
CREATE TABLE reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    last_chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    last_page INT DEFAULT 1,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_manga_history UNIQUE(user_id, manga_id)
);

CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    folder_type VARCHAR(20) DEFAULT 'reading',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_bookmark UNIQUE(user_id, manga_id)
);

CREATE TABLE manga_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    rating_star SMALLINT CHECK (rating_star BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_rating UNIQUE(user_id, manga_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_spoiler BOOLEAN DEFAULT FALSE,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chapter_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE home_showcases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manga_id UUID NOT NULL REFERENCES mangas(id) ON DELETE CASCADE,
    display_section VARCHAR(50) NOT NULL,
    banner_custom_url VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);