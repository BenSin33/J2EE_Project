package com.manga.manga_backend_services.controller;

import com.manga.manga_backend_services.dto.request.MangaApprovalUpdateRequest;
import com.manga.manga_backend_services.dto.request.UserRoleUpdateRequest;
import com.manga.manga_backend_services.dto.request.UserStatusUpdateRequest;
import com.manga.manga_backend_services.dto.response.AdminStatsResponse;
import com.manga.manga_backend_services.entity.ChapterReport;
import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.entity.Tag;
import com.manga.manga_backend_services.entity.User;
import com.manga.manga_backend_services.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class AdminController {

    private final MangaRepository mangaRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterPageRepository chapterPageRepository;
    private final UserRepository userRepository;
    private final ChapterReportRepository chapterReportRepository;
    private final TagRepository tagRepository;
    private final MangaAuthorRepository mangaAuthorRepository;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        long totalMangas = mangaRepository.count();
        long totalChapters = chapterRepository.count();
        long totalUsers = userRepository.count();
        long pendingReports = chapterReportRepository.countByStatus("pending");
        long pendingApprovals = mangaRepository.countByApprovalStatus("pending");
        long totalPages = chapterPageRepository.count();

        // Ước tính dung lượng lưu trữ (trung bình ~1.2MB / trang ảnh)
        double storageGb = (totalPages * 1.2) / 1024.0;
        String storageEst = String.format("%.2f GB", Math.max(0.05, storageGb));
        String bandwidthEst = String.format("%.1f GB / 500 GB", Math.max(1.5, storageGb * 3.8));

        return ResponseEntity.ok(AdminStatsResponse.builder()
                .totalMangas(totalMangas)
                .totalChapters(totalChapters)
                .totalUsers(totalUsers)
                .pendingReports(pendingReports)
                .pendingMangaApprovals(pendingApprovals)
                .totalViews(totalMangas * 1420L)
                .storageUsedEstimate(storageEst)
                .cdnBandwidthEstimate(bandwidthEst)
                .build());
    }

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int limit
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, limit), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> result;
        if (keyword != null && !keyword.trim().isEmpty()) {
            String kw = keyword.trim();
            result = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(kw, kw, pageable);
        } else {
            result = userRepository.findAll(pageable);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable UUID id, @RequestBody UserRoleUpdateRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        if (req.getRole() != null && !req.getRole().trim().isEmpty()) {
            user.setRole(req.getRole().trim().toUpperCase());
            userRepository.save(user);
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(@PathVariable UUID id, @RequestBody UserStatusUpdateRequest req) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        if (req.getIsBanned() != null) {
            user.setIsBanned(req.getIsBanned());
        }
        if (req.getIsMuted() != null) {
            user.setIsMuted(req.getIsMuted());
            if (Boolean.TRUE.equals(req.getIsMuted())) {
                int days = (req.getMuteDays() != null && req.getMuteDays() > 0) ? req.getMuteDays() : 7;
                user.setMutedUntil(OffsetDateTime.now().plusDays(days));
                user.setMuteReason(req.getReason() != null ? req.getReason() : "Vi phạm quy định bình luận");
            } else {
                user.setMutedUntil(null);
                user.setMuteReason(null);
            }
        }
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/mangas")
    public ResponseEntity<Page<Manga>> getMangas(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int limit
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, limit), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Manga> result;
        if (keyword != null && !keyword.trim().isEmpty()) {
            result = mangaRepository.findByTitleContainingIgnoreCase(keyword.trim(), pageable);
        } else {
            result = mangaRepository.findAll(pageable);
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/mangas/{id}/approval")
    public ResponseEntity<Manga> updateMangaApproval(@PathVariable UUID id, @RequestBody MangaApprovalUpdateRequest req) {
        Manga manga = mangaRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy truyện."));
        if (req.getApprovalStatus() != null) {
            manga.setApprovalStatus(req.getApprovalStatus().toLowerCase());
        }
        if (req.getRejectionReason() != null) {
            manga.setRejectionReason(req.getRejectionReason());
        }
        mangaRepository.save(manga);
        return ResponseEntity.ok(manga);
    }

    @DeleteMapping("/mangas/{id}")
    public ResponseEntity<Map<String, String>> deleteManga(@PathVariable UUID id) {
        if (!mangaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // Xóa liên kết tác giả trước
        mangaAuthorRepository.deleteByMangaId(id);
        mangaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa truyện thành công khỏi hệ thống."));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<ChapterReport>> getReports() {
        return ResponseEntity.ok(chapterReportRepository.findByStatusOrderByCreatedAtDesc("pending"));
    }

    @PutMapping("/reports/{id}/status")
    public ResponseEntity<ChapterReport> updateReportStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        ChapterReport report = chapterReportRepository.findById(id).orElseThrow(() -> new RuntimeException("Không tìm thấy báo cáo."));
        String status = body.getOrDefault("status", "resolved");
        report.setStatus(status);
        chapterReportRepository.save(report);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/tags")
    public ResponseEntity<List<Tag>> getTags() {
        return ResponseEntity.ok(tagRepository.findAll());
    }

    @PostMapping("/tags")
    public ResponseEntity<Tag> createTag(@RequestBody Tag tag) {
        if (tag.getName() == null || tag.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên thể loại không được rỗng.");
        }
        Tag saved = tagRepository.save(tag);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable UUID id) {
        tagRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
