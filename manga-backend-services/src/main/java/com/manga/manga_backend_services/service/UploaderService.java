package com.manga.manga_backend_services.service;

import com.manga.manga_backend_services.dto.request.UploaderChapterUpdateRequest;
import com.manga.manga_backend_services.dto.request.UploaderMangaRequest;
import com.manga.manga_backend_services.dto.response.*;
import com.manga.manga_backend_services.entity.*;
import com.manga.manga_backend_services.repository.*;
import jakarta.annotation.PreDestroy;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Thành viên 2 - Uploader Flow: quản lý truyện / chương nguồn LOCAL, upload ảnh lên Cloudinary.
 * Quyền: mọi tài khoản đã đăng nhập (USER, UPLOADER...) đăng được truyện và chỉ thao tác trên truyện của mình;
 * truyện của họ ở trạng thái pending cho tới khi Admin duyệt. ROLE_ADMIN thao tác được mọi truyện LOCAL.
 * Truyện nguồn MangaDex chỉ xem được ở đây, dữ liệu cập nhật bằng crawler.
 */
@Service
@Slf4j
public class UploaderService {

    private static final Set<String> STATUSES = Set.of("ongoing", "completed", "hiatus", "cancelled");
    private static final Set<String> RATINGS = Set.of("safe", "suggestive", "erotica");
    private static final Set<String> ORIGIN_TYPES = Set.of("manga", "manhwa", "manhua");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final int MAX_PAGES = 300;
    private static final long MAX_IMAGE_BYTES = 20L * 1024 * 1024;
    private static final long MAX_ZIP_TOTAL_BYTES = 400L * 1024 * 1024;
    private static final Pattern NUMBER_CHUNK = Pattern.compile("(\\d+)|(\\D+)");

    private final MangaRepository mangaRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterPageRepository chapterPageRepository;
    private final AuthorRepository authorRepository;
    private final MangaAuthorRepository mangaAuthorRepository;
    private final TagRepository tagRepository;
    private final MangaTagRepository mangaTagRepository;
    private final CloudinaryService cloudinaryService;
    private final ChapterNotificationService chapterNotificationService;
    private final EntityManager entityManager;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;
    private final ExecutorService uploadPool = Executors.newFixedThreadPool(4);
    private volatile Boolean notificationTablesReady;

    public UploaderService(
            MangaRepository mangaRepository,
            ChapterRepository chapterRepository,
            ChapterPageRepository chapterPageRepository,
            AuthorRepository authorRepository,
            MangaAuthorRepository mangaAuthorRepository,
            TagRepository tagRepository,
            MangaTagRepository mangaTagRepository,
            CloudinaryService cloudinaryService,
            ChapterNotificationService chapterNotificationService,
            EntityManager entityManager,
            JdbcTemplate jdbcTemplate,
            PlatformTransactionManager transactionManager
    ) {
        this.mangaRepository = mangaRepository;
        this.chapterRepository = chapterRepository;
        this.chapterPageRepository = chapterPageRepository;
        this.authorRepository = authorRepository;
        this.mangaAuthorRepository = mangaAuthorRepository;
        this.tagRepository = tagRepository;
        this.mangaTagRepository = mangaTagRepository;
        this.cloudinaryService = cloudinaryService;
        this.chapterNotificationService = chapterNotificationService;
        this.entityManager = entityManager;
        this.jdbcTemplate = jdbcTemplate;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @PreDestroy
    void shutdown() {
        uploadPool.shutdownNow();
    }

    // =====================================================================
    // Quyền
    // =====================================================================

    public static boolean isAdmin(User user) {
        String role = user.getRole() == null ? "" : user.getRole().toUpperCase();
        return role.equals("ROLE_ADMIN") || role.equals("ADMIN");
    }

    /** Mọi tài khoản không bị khoá đều được đăng truyện (truyện chờ Admin duyệt) */
    public static boolean isUploader(User user) {
        return !Boolean.TRUE.equals(user.getIsBanned());
    }

    private void requireUploader(User user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập");
        }
        if (!isUploader(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đang bị khoá, không thể đăng truyện");
        }
    }

    /** Lấy truyện và kiểm tra quyền xem (forWrite = false) hoặc sửa (forWrite = true) */
    private Manga requireManga(UUID mangaId, User user, boolean forWrite) {
        requireUploader(user);
        Manga manga = mangaRepository.findById(mangaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Truyện không tồn tại"));
        boolean owner = user.getId().equals(manga.getUploaderId());
        if (!isAdmin(user) && !owner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không phải người đăng truyện này");
        }
        if (forWrite && manga.getMangadexId() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Truyện nguồn MangaDex chỉ được cập nhật bằng công cụ cào, không sửa tay");
        }
        return manga;
    }

    private Chapter requireChapter(UUID chapterId, User user, boolean forWrite) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chương không tồn tại"));
        requireManga(chapter.getMangaId(), user, forWrite);
        return chapter;
    }

    // =====================================================================
    // Tổng quan
    // =====================================================================

    public UploaderStatsResponse stats(User user) {
        requireUploader(user);
        String scope = isAdmin(user) ? "" : " and m.uploaderId = :me";

        long local = count("select count(m) from Manga m where m.mangadexId is null" + scope, user);
        long mangadex = isAdmin(user) ? count("select count(m) from Manga m where m.mangadexId is not null", user) : 0;
        long pending = count("select count(m) from Manga m where m.mangadexId is null and m.approvalStatus = 'pending'" + scope, user);
        long rejected = count("select count(m) from Manga m where m.mangadexId is null and m.approvalStatus = 'rejected'" + scope, user);
        long chapters = count("select count(c) from Chapter c, Manga m where c.mangaId = m.id and m.mangadexId is null" + scope, user);
        long drafts = count("select count(c) from Chapter c, Manga m where c.mangaId = m.id and m.mangadexId is null and c.status = 'draft'" + scope, user);

        return UploaderStatsResponse.builder()
                .role(user.getRole())
                .admin(isAdmin(user))
                .canImportMangaDex(isAdmin(user))
                .cloudinaryEnabled(cloudinaryService.isEnabled())
                .totalMangas(local + mangadex)
                .localMangas(local)
                .mangadexMangas(mangadex)
                .pendingMangas(pending)
                .rejectedMangas(rejected)
                .totalChapters(chapters)
                .draftChapters(drafts)
                .build();
    }

    private long count(String jpql, User user) {
        var query = entityManager.createQuery(jpql, Long.class);
        if (jpql.contains(":me")) query.setParameter("me", user.getId());
        return query.getSingleResult();
    }

    public List<TagResponse> listTags() {
        return tagRepository.findAll().stream()
                .sorted(Comparator.comparing(Tag::getGroupType, Comparator.nullsLast(String::compareTo))
                        .thenComparing(Tag::getName, String.CASE_INSENSITIVE_ORDER))
                .map(t -> TagResponse.builder().id(t.getId()).name(t.getName()).groupType(t.getGroupType()).build())
                .toList();
    }

    // =====================================================================
    // Truyện
    // =====================================================================

    /**
     * Danh sách truyện. UPLOADER chỉ thấy truyện LOCAL của mình; ADMIN lọc được theo nguồn (local | mangadex | all).
     */
    public Map<String, Object> listMangas(User user, String source, String keyword, int page, int size) {
        requireUploader(user);
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        String src = isAdmin(user) && source != null ? source.toLowerCase() : "local";

        StringBuilder where = new StringBuilder(" where 1 = 1");
        if (!isAdmin(user)) where.append(" and m.uploaderId = :me");
        if (src.equals("local")) where.append(" and m.mangadexId is null");
        if (src.equals("mangadex")) where.append(" and m.mangadexId is not null");
        boolean hasKeyword = keyword != null && !keyword.isBlank();
        if (hasKeyword) where.append(" and lower(m.title) like :kw");

        var query = entityManager.createQuery("select m from Manga m" + where + " order by m.updatedAt desc", Manga.class);
        var countQuery = entityManager.createQuery("select count(m) from Manga m" + where, Long.class);
        if (!isAdmin(user)) {
            query.setParameter("me", user.getId());
            countQuery.setParameter("me", user.getId());
        }
        if (hasKeyword) {
            String kw = "%" + keyword.trim().toLowerCase() + "%";
            query.setParameter("kw", kw);
            countQuery.setParameter("kw", kw);
        }
        List<Manga> mangas = query.setFirstResult(safePage * safeSize).setMaxResults(safeSize).getResultList();
        long total = countQuery.getSingleResult();

        Map<UUID, Long> chapterCounts = new HashMap<>();
        if (!mangas.isEmpty()) {
            List<Object[]> rows = entityManager.createQuery(
                            "select c.mangaId, count(c) from Chapter c where c.mangaId in :ids group by c.mangaId", Object[].class)
                    .setParameter("ids", mangas.stream().map(Manga::getId).toList())
                    .getResultList();
            rows.forEach(r -> chapterCounts.put((UUID) r[0], (Long) r[1]));
        }

        List<UploaderMangaSummary> content = mangas.stream().map(m -> UploaderMangaSummary.builder()
                .id(m.getId())
                .mangadexId(m.getMangadexId())
                .title(m.getTitle())
                .coverImageUrl(m.getCoverImageUrl())
                .status(m.getStatus())
                .approvalStatus(m.getApprovalStatus())
                .rejectionReason(m.getRejectionReason())
                .source(m.getMangadexId() == null ? "LOCAL" : "MANGADEX")
                .chapterCount(chapterCounts.getOrDefault(m.getId(), 0L))
                .updatedAt(m.getUpdatedAt())
                .build()).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content", content);
        result.put("page", safePage);
        result.put("size", safeSize);
        result.put("totalElements", total);
        result.put("totalPages", (int) Math.ceil(total / (double) safeSize));
        return result;
    }

    public MangaResponse getManga(UUID mangaId, User user) {
        return toResponse(requireManga(mangaId, user, false));
    }

    public MangaResponse createManga(UploaderMangaRequest request, User user) {
        requireUploader(user);
        validate(request);
        Manga saved = transactionTemplate.execute(status -> {
            Manga manga = Manga.builder()
                    .uploaderId(user.getId())
                    .title(request.getTitle().trim())
                    // Truyện do ADMIN tạo được duyệt luôn, của UPLOADER chờ Admin duyệt
                    .approvalStatus(isAdmin(user) ? "approved" : "pending")
                    .build();
            applyFields(manga, request);
            manga = mangaRepository.save(manga);
            saveRelations(manga.getId(), request);
            return manga;
        });
        return toResponse(saved);
    }

    public MangaResponse updateManga(UUID mangaId, UploaderMangaRequest request, User user) {
        Manga manga = requireManga(mangaId, user, true);
        validate(request);
        Manga saved = transactionTemplate.execute(status -> {
            manga.setTitle(request.getTitle().trim());
            applyFields(manga, request);
            // Truyện bị từ chối, uploader sửa lại thì gửi duyệt lại
            if ("rejected".equals(manga.getApprovalStatus()) && !isAdmin(user)) {
                manga.setApprovalStatus("pending");
                manga.setRejectionReason(null);
            }
            Manga m = mangaRepository.save(manga);
            mangaAuthorRepository.deleteByMangaId(m.getId());
            mangaTagRepository.deleteAll(mangaTagRepository.findByMangaId(m.getId()));
            mangaTagRepository.flush();
            saveRelations(m.getId(), request);
            return m;
        });
        return toResponse(saved);
    }

    public MangaResponse uploadCover(UUID mangaId, MultipartFile file, User user) {
        Manga manga = requireManga(mangaId, user, true);
        requireCloudinary();
        if (file == null || file.isEmpty() || !isImageName(file.getOriginalFilename())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh bìa phải là file jpg, png, webp hoặc gif");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh bìa tối đa 20MB");
        }
        String url;
        try {
            url = cloudinaryService.upload(file.getBytes(), "covers",
                    "local_" + mangaId + "_" + System.currentTimeMillis(), true).secureUrl();
        } catch (IOException | IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Upload ảnh bìa thất bại: " + e.getMessage());
        }
        manga.setCoverImageUrl(url);
        return toResponse(mangaRepository.save(manga));
    }

    private void validate(UploaderMangaRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên truyện không được để trống");
        }
        if (request.getStatus() != null && !STATUSES.contains(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ: " + request.getStatus());
        }
        if (request.getContentRating() != null && !RATINGS.contains(request.getContentRating())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phân loại độ tuổi không hợp lệ: " + request.getContentRating());
        }
        if (request.getOriginType() != null && !ORIGIN_TYPES.contains(request.getOriginType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại truyện không hợp lệ: " + request.getOriginType());
        }
        if (request.getOriginalLanguage() != null && request.getOriginalLanguage().length() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã ngôn ngữ không hợp lệ");
        }
    }

    private void applyFields(Manga manga, UploaderMangaRequest request) {
        List<Map<String, String>> altTitles = new ArrayList<>();
        if (request.getAltTitles() != null) {
            request.getAltTitles().stream().map(String::trim).filter(s -> !s.isEmpty()).distinct()
                    .forEach(t -> altTitles.add(Map.of("vi", t)));
        }
        manga.setAltTitles(altTitles);
        manga.setDescription(request.getDescription() == null ? null : request.getDescription().trim());
        if (request.getStatus() != null) manga.setStatus(request.getStatus());
        if (request.getOriginalLanguage() != null && !request.getOriginalLanguage().isBlank()) {
            manga.setOriginalLanguage(request.getOriginalLanguage().trim().toLowerCase());
        }
        if (request.getOriginType() != null) manga.setOriginType(request.getOriginType());
        if (request.getContentRating() != null) manga.setContentRating(request.getContentRating());
    }

    private void saveRelations(UUID mangaId, UploaderMangaRequest request) {
        savePeople(mangaId, request.getAuthorNames(), "author");
        savePeople(mangaId, request.getArtistNames(), "artist");
        if (request.getTagIds() != null) {
            for (Tag tag : tagRepository.findAllById(new LinkedHashSet<>(request.getTagIds()))) {
                mangaTagRepository.save(MangaTag.builder().mangaId(mangaId).tagId(tag.getId()).build());
            }
        }
    }

    private void savePeople(UUID mangaId, List<String> names, String role) {
        if (names == null) return;
        for (String raw : new LinkedHashSet<>(names)) {
            String name = raw == null ? "" : raw.trim();
            if (name.isEmpty()) continue;
            Author author = authorRepository.findByName(name)
                    .orElseGet(() -> authorRepository.save(Author.builder().name(name).build()));
            mangaAuthorRepository.save(MangaAuthor.builder().mangaId(mangaId).authorId(author.getId()).role(role).build());
        }
    }

    private MangaResponse toResponse(Manga m) {
        List<MangaAuthor> links = mangaAuthorRepository.findByMangaId(m.getId());
        Map<UUID, Author> authors = new HashMap<>();
        authorRepository.findAllById(links.stream().map(MangaAuthor::getAuthorId).toList())
                .forEach(a -> authors.put(a.getId(), a));
        List<AuthorResponse> authorResponses = links.stream()
                .filter(l -> authors.containsKey(l.getAuthorId()))
                .map(l -> AuthorResponse.builder()
                        .id(l.getAuthorId())
                        .name(authors.get(l.getAuthorId()).getName())
                        .role(l.getRole())
                        .build())
                .toList();

        List<TagResponse> tags = tagRepository.findAllById(
                        mangaTagRepository.findByMangaId(m.getId()).stream().map(MangaTag::getTagId).toList())
                .stream()
                .map(t -> TagResponse.builder().id(t.getId()).name(t.getName()).groupType(t.getGroupType()).build())
                .toList();

        return MangaResponse.builder()
                .id(m.getId())
                .mangadexId(m.getMangadexId())
                .uploaderId(m.getUploaderId())
                .title(m.getTitle())
                .altTitles(m.getAltTitles())
                .description(m.getDescription())
                .coverImageUrl(m.getCoverImageUrl())
                .originalLanguage(m.getOriginalLanguage())
                .originType(m.getOriginType())
                .status(m.getStatus())
                .contentRating(m.getContentRating())
                .viewsCount(m.getViewsCount())
                .bookmarksCount(m.getBookmarksCount())
                .ratingScore(m.getRatingScore())
                .ratingCount(m.getRatingCount())
                .approvalStatus(m.getApprovalStatus())
                .rejectionReason(m.getRejectionReason())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .authors(authorResponses)
                .tags(tags)
                .build();
    }

    // =====================================================================
    // Chương
    // =====================================================================

    public List<UploaderChapterResponse> listChapters(UUID mangaId, User user) {
        requireManga(mangaId, user, false);
        List<Chapter> chapters = new ArrayList<>(chapterRepository.findByMangaId(mangaId));
        chapters.sort((a, b) -> naturalCompare(String.valueOf(a.getChapterNumber()), String.valueOf(b.getChapterNumber())));

        Map<UUID, Long> pageCounts = new HashMap<>();
        Map<UUID, String> previews = new HashMap<>();
        if (!chapters.isEmpty()) {
            List<UUID> ids = chapters.stream().map(Chapter::getId).toList();
            entityManager.createQuery(
                            "select p.chapterId, count(p) from ChapterPage p where p.chapterId in :ids group by p.chapterId", Object[].class)
                    .setParameter("ids", ids)
                    .getResultList()
                    .forEach(r -> pageCounts.put((UUID) r[0], (Long) r[1]));
            entityManager.createQuery(
                            "select p.chapterId, p.s3WebpUrl from ChapterPage p where p.chapterId in :ids and p.pageNumber = 1 and p.s3WebpUrl is not null", Object[].class)
                    .setParameter("ids", ids)
                    .getResultList()
                    .forEach(r -> previews.put((UUID) r[0], (String) r[1]));
        }

        return chapters.stream().map(c -> toChapterResponse(c, pageCounts.getOrDefault(c.getId(), 0L), previews.get(c.getId()))).toList();
    }

    /**
     * Upload một chương mới: nhận nhiều file ảnh và/hoặc file .zip, sắp xếp theo tên (1, 2, ..., 10),
     * convert WebP và lưu lên Cloudinary, sau đó lưu chương + trang trong một transaction.
     */
    public UploaderChapterResponse createChapter(UUID mangaId, String chapterNumber, String volume, String title,
                                                 String language, boolean publish, List<MultipartFile> files, User user) {
        Manga manga = requireManga(mangaId, user, true);
        requireCloudinary();

        String number = chapterNumber == null ? "" : chapterNumber.trim();
        if (number.isEmpty() || number.length() > 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số chương không được để trống (tối đa 50 ký tự)");
        }
        String lang = language == null || language.isBlank() ? "vi" : language.trim().toLowerCase();
        ensureChapterNumberFree(mangaId, number, lang, null);

        List<ImageInput> images = extractImages(files);
        if (images.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa có ảnh trang nào (chấp nhận jpg, png, webp, gif hoặc file .zip)");
        }
        if (images.size() > MAX_PAGES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Một chương tối đa " + MAX_PAGES + " trang");
        }

        // Upload song song (4 luồng), giữ đúng thứ tự trang
        String folder = "chapters/local/" + UUID.randomUUID();
        List<Future<CloudinaryService.UploadResult>> futures = new ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            byte[] bytes = images.get(i).bytes();
            String publicId = String.format("page-%03d", i + 1);
            futures.add(uploadPool.submit(() -> cloudinaryService.upload(bytes, folder, publicId, true)));
        }
        List<CloudinaryService.UploadResult> uploaded = new ArrayList<>();
        try {
            for (Future<CloudinaryService.UploadResult> f : futures) {
                uploaded.add(f.get(2, TimeUnit.MINUTES));
            }
        } catch (Exception e) {
            futures.forEach(f -> f.cancel(true));
            Throwable cause = e instanceof ExecutionException && e.getCause() != null ? e.getCause() : e;
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Upload ảnh lên Cloudinary thất bại: " + cause.getMessage());
        }

        Chapter saved = transactionTemplate.execute(status -> {
            Chapter chapter = chapterRepository.saveAndFlush(Chapter.builder()
                    .mangaId(mangaId)
                    .uploaderId(user.getId())
                    .chapterNumber(number)
                    .volume(blankToNull(volume))
                    .title(blankToNull(title))
                    .translatedLanguage(lang)
                    .storageType("cloudinary")
                    .status(publish ? "published" : "draft")
                    .build());
            for (int i = 0; i < uploaded.size(); i++) {
                CloudinaryService.UploadResult r = uploaded.get(i);
                chapterPageRepository.save(ChapterPage.builder()
                        .chapterId(chapter.getId())
                        .pageNumber(i + 1)
                        .imageFileName(truncate(images.get(i).name(), 255))
                        .s3WebpUrl(r.secureUrl())
                        .width(r.width() > 0 ? r.width() : null)
                        .height(r.height() > 0 ? r.height() : null)
                        .build());
            }
            chapterPageRepository.flush();
            if (publish) notifyFirstPublication(chapter, manga);
            touch(manga);
            return chapter;
        });

        return toChapterResponse(saved, uploaded.size(), uploaded.getFirst().secureUrl());
    }

    public UploaderChapterResponse updateChapter(UUID chapterId, UploaderChapterUpdateRequest request, User user) {
        Chapter chapter = requireChapter(chapterId, user, true);
        Manga manga = mangaRepository.findById(chapter.getMangaId()).orElseThrow();

        if (request.getChapterNumber() != null) {
            String number = request.getChapterNumber().trim();
            if (number.isEmpty() || number.length() > 50) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số chương không hợp lệ");
            }
            ensureChapterNumberFree(chapter.getMangaId(), number, chapter.getTranslatedLanguage(), chapterId);
            chapter.setChapterNumber(number);
        }
        if (request.getVolume() != null) chapter.setVolume(blankToNull(request.getVolume()));
        if (request.getTitle() != null) chapter.setTitle(blankToNull(request.getTitle()));

        boolean publishNow = false;
        if (request.getStatus() != null) {
            String status = request.getStatus().trim().toLowerCase();
            if (!status.equals("published") && !status.equals("draft")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái chương chỉ nhận published hoặc draft");
            }
            publishNow = status.equals("published") && !"published".equals(chapter.getStatus());
            chapter.setStatus(status);
            if (publishNow) chapter.setPublishAt(OffsetDateTime.now());
        }

        final boolean notify = publishNow;
        Chapter saved = transactionTemplate.execute(status -> {
            Chapter c = chapterRepository.saveAndFlush(chapter);
            if (notify) notifyFirstPublication(c, manga);
            touch(manga);
            return c;
        });
        return toChapterResponse(saved, chapterPageRepository.countByChapterId(chapterId), null);
    }

    /** Xoá chương LOCAL (ảnh trên Cloudinary chưa xoá). Chương đã có bình luận / lịch sử đọc thì báo 409. */
    public void deleteChapter(UUID chapterId, User user) {
        Chapter chapter = requireChapter(chapterId, user, true);
        try {
            transactionTemplate.executeWithoutResult(status -> {
                chapterPageRepository.deleteAll(chapterPageRepository.findByChapterIdOrderByPageNumberAsc(chapterId));
                chapterPageRepository.flush();
                chapterRepository.delete(chapter);
                chapterRepository.flush();
            });
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Chương đã có dữ liệu liên quan (bình luận, lịch sử đọc, thông báo...). Hãy chuyển chương về nháp thay vì xoá.");
        }
    }

    private void ensureChapterNumberFree(UUID mangaId, String number, String lang, UUID exceptChapterId) {
        boolean taken = chapterRepository.findByMangaId(mangaId).stream()
                .anyMatch(c -> !c.getId().equals(exceptChapterId)
                        && number.equalsIgnoreCase(String.valueOf(c.getChapterNumber()))
                        && Objects.equals(lang, c.getTranslatedLanguage()));
        if (taken) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Chương " + number + " (" + lang + ") đã tồn tại");
        }
    }

    /**
     * Gọi service thông báo của thành viên 3 trong cùng transaction xuất bản.
     * Chỉ khi truyện đã duyệt và migration 003 đã chạy (có bảng chapter_notification_events).
     */
    private void notifyFirstPublication(Chapter chapter, Manga manga) {
        if (!"approved".equalsIgnoreCase(manga.getApprovalStatus()) || !notificationTablesReady()) return;
        chapterNotificationService.enqueueFirstPublication(chapter.getId());
    }

    private boolean notificationTablesReady() {
        if (notificationTablesReady == null) {
            Boolean exists = jdbcTemplate.queryForObject(
                    "select to_regclass('public.chapter_notification_events') is not null", Boolean.class);
            notificationTablesReady = Boolean.TRUE.equals(exists);
            if (!notificationTablesReady) {
                log.warn("Chưa chạy migration 003_chapter_notifications.sql - bỏ qua tạo thông báo chương mới");
            }
        }
        return notificationTablesReady;
    }

    private void touch(Manga manga) {
        manga.setUpdatedAt(OffsetDateTime.now());
        mangaRepository.save(manga);
    }

    private UploaderChapterResponse toChapterResponse(Chapter c, long pageCount, String previewUrl) {
        return UploaderChapterResponse.builder()
                .id(c.getId())
                .mangaId(c.getMangaId())
                .mangadexId(c.getMangadexId())
                .volume(c.getVolume())
                .chapterNumber(c.getChapterNumber())
                .title(c.getTitle())
                .translatedLanguage(c.getTranslatedLanguage())
                .storageType(c.getStorageType())
                .status(c.getStatus())
                .pageCount(pageCount)
                .previewUrl(previewUrl)
                .publishAt(c.getPublishAt())
                .createdAt(c.getCreatedAt())
                .build();
    }

    // =====================================================================
    // Xử lý file ảnh / zip
    // =====================================================================

    record ImageInput(String name, byte[] bytes) {}

    List<ImageInput> extractImages(List<MultipartFile> files) {
        List<ImageInput> images = new ArrayList<>();
        if (files == null) return images;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            String name = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            try {
                if (name.toLowerCase().endsWith(".zip")) {
                    images.addAll(readZip(file.getInputStream()));
                } else if (isImageName(name)) {
                    if (file.getSize() > MAX_IMAGE_BYTES) {
                        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh " + name + " lớn hơn 20MB");
                    }
                    images.add(new ImageInput(name, file.getBytes()));
                } else {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File không hỗ trợ: " + name);
                }
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đọc được file " + name + ": " + e.getMessage());
            }
        }
        images.sort((a, b) -> naturalCompare(a.name(), b.name()));
        return images;
    }

    private List<ImageInput> readZip(InputStream in) throws IOException {
        List<ImageInput> images = new ArrayList<>();
        long total = 0;
        try (ZipInputStream zip = new ZipInputStream(in)) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String entryName = entry.getName();
                String baseName = entryName.substring(entryName.lastIndexOf('/') + 1);
                if (entry.isDirectory() || entryName.startsWith("__MACOSX/") || baseName.startsWith(".") || !isImageName(baseName)) {
                    continue;
                }
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                byte[] buffer = new byte[64 * 1024];
                int read;
                long size = 0;
                while ((read = zip.read(buffer)) != -1) {
                    size += read;
                    total += read;
                    if (size > MAX_IMAGE_BYTES) {
                        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh " + baseName + " trong file zip lớn hơn 20MB");
                    }
                    if (total > MAX_ZIP_TOTAL_BYTES) {
                        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Tổng dung lượng ảnh trong file zip vượt 400MB");
                    }
                    out.write(buffer, 0, read);
                }
                images.add(new ImageInput(entryName, out.toByteArray()));
            }
        }
        return images;
    }

    private static boolean isImageName(String name) {
        if (name == null) return false;
        int dot = name.lastIndexOf('.');
        return dot > 0 && IMAGE_EXTENSIONS.contains(name.substring(dot + 1).toLowerCase());
    }

    /** So sánh tự nhiên: "2.jpg" đứng trước "10.jpg", "5" trước "5.5" */
    static int naturalCompare(String a, String b) {
        Matcher ma = NUMBER_CHUNK.matcher(a.toLowerCase());
        Matcher mb = NUMBER_CHUNK.matcher(b.toLowerCase());
        while (ma.find() && mb.find()) {
            String ca = ma.group();
            String cb = mb.group();
            int cmp;
            if (ma.group(1) != null && mb.group(1) != null) {
                cmp = new java.math.BigInteger(ca).compareTo(new java.math.BigInteger(cb));
            } else {
                cmp = ca.compareTo(cb);
            }
            if (cmp != 0) return cmp;
        }
        return Integer.compare(a.length(), b.length());
    }

    private void requireCloudinary() {
        if (!cloudinaryService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Cloudinary chưa được cấu hình trên server, chưa upload ảnh được");
        }
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(s.length() - max);
    }
}
