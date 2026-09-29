package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.Manga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MangaRepository extends JpaRepository<Manga, UUID> {
    // Kế thừa sẵn findAll(), findById(), save(), deleteById()...
}