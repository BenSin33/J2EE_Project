package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.MangaTag;
import com.manga.manga_backend_services.entity.MangaTagId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MangaTagRepository extends JpaRepository<MangaTag, MangaTagId> {
    List<MangaTag> findByMangaId(UUID mangaId);
}
