package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.ChapterPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChapterPageRepository extends JpaRepository<ChapterPage, UUID> {
    List<ChapterPage> findByChapterIdOrderByPageNumberAsc(UUID chapterId);
    long countByChapterId(UUID chapterId);
    void deleteByChapterId(UUID chapterId);
}
