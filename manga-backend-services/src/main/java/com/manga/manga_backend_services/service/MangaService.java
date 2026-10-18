package com.manga.manga_backend_services.service;

import com.manga.manga_backend_services.dto.response.MangaResponse;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface MangaService {

    List<MangaResponse> getRecentUpdates();

    List<MangaResponse> getTopTrending();

    Page<MangaResponse> getMangas(String keyword, int page, int limit);

    MangaResponse getMangaById(UUID id);
}
