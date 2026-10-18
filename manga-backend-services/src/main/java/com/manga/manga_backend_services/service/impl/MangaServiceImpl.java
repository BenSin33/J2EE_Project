package com.manga.manga_backend_services.service.impl;

import com.manga.manga_backend_services.dto.response.MangaResponse;
import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.repository.MangaRepository;
import com.manga.manga_backend_services.service.MangaService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MangaServiceImpl implements MangaService {

    private final MangaRepository mangaRepository;

    @Override
    public List<MangaResponse> getRecentUpdates() {
        return mangaRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<MangaResponse> getTopTrending() {
        return mangaRepository.findTop10ByOrderByViewsCountDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public Page<MangaResponse> getMangas(String keyword, int page, int limit) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.max(1, limit),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Page<Manga> pageResult;
        if (keyword != null && !keyword.trim().isEmpty()) {
            pageResult = mangaRepository.findByTitleContainingIgnoreCase(keyword.trim(), pageable);
        } else {
            pageResult = mangaRepository.findAll(pageable);
        }

        return pageResult.map(this::mapToResponse);
    }

    @Override
    public MangaResponse getMangaById(UUID id) {
        return mangaRepository.findById(id)
                .map(this::mapToResponse)
                .orElse(null);
    }

    private MangaResponse mapToResponse(Manga manga) {
        if (manga == null) {
            return null;
        }
        return MangaResponse.builder()
                .id(manga.getId())
                .mangadexId(manga.getMangadexId())
                .uploaderId(manga.getUploaderId())
                .title(manga.getTitle())
                .altTitles(manga.getAltTitles())
                .description(manga.getDescription())
                .coverImageUrl(manga.getCoverImageUrl())
                .originalLanguage(manga.getOriginalLanguage())
                .originType(manga.getOriginType())
                .status(manga.getStatus())
                .contentRating(manga.getContentRating())
                .viewsCount(manga.getViewsCount())
                .bookmarksCount(manga.getBookmarksCount())
                .ratingScore(manga.getRatingScore())
                .ratingCount(manga.getRatingCount())
                .approvalStatus(manga.getApprovalStatus())
                .rejectionReason(manga.getRejectionReason())
                .createdAt(manga.getCreatedAt())
                .updatedAt(manga.getUpdatedAt())
                .build();
    }
}
