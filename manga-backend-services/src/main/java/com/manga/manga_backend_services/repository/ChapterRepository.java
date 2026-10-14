package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {
    List<Chapter> findByMangaIdOrderByChapterNumberAsc(UUID mangaId);
    List<Chapter> findByMangaId(UUID mangaId);
    Optional<Chapter> findByMangadexId(UUID mangadexId);
    boolean existsByMangadexId(UUID mangadexId);
}
