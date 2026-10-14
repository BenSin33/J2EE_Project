package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.MangaAuthor;
import com.manga.manga_backend_services.entity.MangaAuthorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MangaAuthorRepository extends JpaRepository<MangaAuthor, MangaAuthorId> {
    List<MangaAuthor> findByMangaId(UUID mangaId);
    boolean existsByMangaIdAndAuthorId(UUID mangaId, UUID authorId);
    @org.springframework.transaction.annotation.Transactional
    void deleteByMangaId(UUID mangaId);
}
