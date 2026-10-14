package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuthorRepository extends JpaRepository<Author, UUID> {
    Optional<Author> findByMangadexId(UUID mangadexId);
    Optional<Author> findByName(String name);
}
