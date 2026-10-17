package com.manga.manga_backend_services.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manga.manga_backend_services.dto.request.MangaDexImportRequest;
import com.manga.manga_backend_services.dto.response.ChapterMirrorResponse;
import com.manga.manga_backend_services.dto.response.ChapterResponse;
import com.manga.manga_backend_services.dto.response.MangaDexImportResponse;
import com.manga.manga_backend_services.dto.response.MangaDexSearchResult;
import com.manga.manga_backend_services.dto.response.ReaderChapterResponse;
import com.manga.manga_backend_services.entity.Author;
import com.manga.manga_backend_services.entity.Chapter;
import com.manga.manga_backend_services.entity.ChapterPage;
import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.entity.MangaAuthor;
import com.manga.manga_backend_services.entity.MangaTag;
import com.manga.manga_backend_services.entity.Tag;
import com.manga.manga_backend_services.repository.AuthorRepository;
import com.manga.manga_backend_services.repository.ChapterPageRepository;
import com.manga.manga_backend_services.repository.ChapterRepository;
import com.manga.manga_backend_services.repository.MangaAuthorRepository;
import com.manga.manga_backend_services.repository.MangaRepository;
import com.manga.manga_backend_services.repository.MangaTagRepository;
import com.manga.manga_backend_services.repository.TagRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class MangaDexService {

    private static final Pattern UUID_PATTERN = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");
    private static final String UPLOADS_BASE = "https://uploads.mangadex.org";
    /** MangaDex giới hạn ~5 request/giây, nghỉ giữa các request phân trang cho an toàn */
    private static final long REQUEST_DELAY_MS = 250;
    private static final int FEED_PAGE_SIZE = 100;
    private static final int MAX_CHAPTERS = 500;
    private static final int MAX_MIRROR_CHAPTERS = 5;

    private final MangaRepository mangaRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterPageRepository chapterPageRepository;
    private final AuthorRepository authorRepository;
    private final MangaAuthorRepository mangaAuthorRepository;
    private final TagRepository tagRepository;
    private final MangaTagRepository mangaTagRepository;
    private final CloudinaryService cloudinaryService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final RestTemplate restTemplate;

    @Value("${mangadex.api.base-url:https://api.mangadex.org}")
    private String baseUrl;

    @Value("${mangadex.api.user-agent:MangaHub-Crawler/1.0 (contact: student@mangahub.local)}")
    private String userAgent;

    public MangaDexService(
            MangaRepository mangaRepository,
            ChapterRepository chapterRepository,
            ChapterPageRepository chapterPageRepository,
            AuthorRepository authorRepository,
            MangaAuthorRepository mangaAuthorRepository,
            TagRepository tagRepository,
            MangaTagRepository mangaTagRepository,
            CloudinaryService cloudinaryService,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager,
            @Value("${mangadex.api.proxy.host:}") String proxyHost,
            @Value("${mangadex.api.proxy.port:0}") int proxyPort
    ) {
        this.mangaRepository = mangaRepository;
        this.chapterRepository = chapterRepository;
        this.chapterPageRepository = chapterPageRepository;
        this.authorRepository = authorRepository;
        this.mangaAuthorRepository = mangaAuthorRepository;
        this.tagRepository = tagRepository;
        this.mangaTagRepository = mangaTagRepository;
        this.cloudinaryService = cloudinaryService;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(30000);

        if (proxyHost != null && !proxyHost.trim().isEmpty() && proxyPort > 0) {
            log.info("Configuring MangaDex proxy: {}:{}", proxyHost, proxyPort);
            factory.setProxy(new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyHost.trim(), proxyPort)));
        }

        this.restTemplate = new RestTemplate(factory);
    }

    // =====================================================================
    // Tìm kiếm
    // =====================================================================

    /**
     * Tìm kiếm truyện trên MangaDex theo từ khóa
     */
    public List<MangaDexSearchResult> search(String title, int limit) {
        if (title == null || title.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Từ khóa tìm kiếm không được để trống");
        }
        int safeLimit = Math.max(1, Math.min(limit, 30));
        URI uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/manga")
                .queryParam("title", "{title}")
                .queryParam("limit", safeLimit)
                .queryParam("includes[]", "cover_art", "author")
                .queryParam("contentRating[]", "safe", "suggestive")
                .queryParam("order[relevance]", "desc")
                .encode()
                .buildAndExpand(title.trim())
                .toUri();

        JsonNode root = getJson(uri, "Không kết nối được MangaDex");
        List<MangaDexSearchResult> results = new ArrayList<>();

        for (JsonNode item : root.path("data")) {
            UUID mangadexId = UUID.fromString(item.path("id").asText());
            JsonNode attributes = item.path("attributes");

            String coverFileName = null;
            String authorName = null;
            for (JsonNode rel : item.path("relationships")) {
                String type = rel.path("type").asText();
                if ("cover_art".equals(type) && rel.has("attributes")) {
                    coverFileName = rel.path("attributes").path("fileName").asText(null);
                } else if ("author".equals(type) && rel.has("attributes") && authorName == null) {
                    authorName = rel.path("attributes").path("name").asText(null);
                }
            }

            List<String> languages = new ArrayList<>();
            for (JsonNode lang : attributes.path("availableTranslatedLanguages")) {
                if (!lang.isNull()) languages.add(lang.asText());
            }

            results.add(MangaDexSearchResult.builder()
                    .mangadexId(mangadexId)
                    .title(extractLocalizedText(attributes.path("title")))
                    .description(extractLocalizedText(attributes.path("description")))
                    .coverImageUrl(buildCoverUrl(mangadexId, coverFileName))
                    .status(attributes.path("status").asText("ongoing"))
                    .originalLanguage(attributes.path("originalLanguage").asText("ja"))
                    .contentRating(attributes.path("contentRating").asText("safe"))
                    .authorName(authorName)
                    .tags(parseTags(attributes).stream().map(ParsedTag::name).toList())
                    .availableLanguages(languages)
                    .importedMangaId(mangaRepository.findByMangadexId(mangadexId).map(Manga::getId).orElse(null))
                    .build());
        }

        return results;
    }

    // =====================================================================
    // Cào truyện
    // =====================================================================

    /**
     * Trích xuất MangaDex UUID từ chuỗi hoặc URL
     */
    public UUID extractMangadexId(String input) {
        if (input == null || input.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL hoặc MangaDex ID không được để trống");
        }
        Matcher matcher = UUID_PATTERN.matcher(input.trim());
        if (matcher.find()) {
            return UUID.fromString(matcher.group());
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy UUID hợp lệ trong: " + input);
    }

    public MangaDexImportResponse importManga(String urlOrId, String language, int maxChapters) {
        return importManga(MangaDexImportRequest.builder()
                .urlOrId(urlOrId)
                .language(language)
                .maxChapters(maxChapters)
                .build());
    }

    /**
     * Cào một bộ truyện (thông tin, tác giả, thể loại, ảnh bìa, danh sách chương) từ MangaDex lưu vào CSDL.
     * Gọi lại với cùng truyện sẽ cập nhật thông tin và bổ sung chương mới (không tạo bản trùng).
     * Toàn bộ việc gọi MangaDex/Cloudinary làm trước, sau đó mới mở transaction ghi DB một lần.
     */
    public MangaDexImportResponse importManga(MangaDexImportRequest request) {
        UUID mangadexId = extractMangadexId(request.getUrlOrId());
        String lang = (request.getLanguage() == null || request.getLanguage().trim().isEmpty())
                ? "vi" : request.getLanguage().trim().toLowerCase();
        // Các trường tuỳ chọn có thể null khi client không gửi (vd. tab cào trong trang Admin)
        int maxChapters = request.getMaxChapters() == null ? 50 : request.getMaxChapters();
        int limitChapters = Math.max(1, Math.min(maxChapters, MAX_CHAPTERS));
        boolean uploadCover = !Boolean.FALSE.equals(request.getUploadCover());
        int requestedMirror = request.getMirrorChapters() == null ? 0 : request.getMirrorChapters();
        List<String> warnings = new ArrayList<>();

        // 1. Lấy chi tiết truyện
        URI mangaUri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/manga/{id}")
                .queryParam("includes[]", "cover_art", "author", "artist")
                .encode()
                .buildAndExpand(mangadexId)
                .toUri();
        JsonNode mangaNode = getJson(mangaUri, "Không tải được truyện từ MangaDex").path("data");
        ParsedManga parsed = parseManga(mangadexId, mangaNode);

        // 2. Lấy danh sách chương (fallback sang tiếng Anh nếu không có bản tiếng Việt)
        FeedResult feed = fetchChapterFeed(mangadexId, lang, limitChapters);
        String chapterLanguage = lang;
        if (feed.chapters().isEmpty() && "vi".equals(lang)) {
            warnings.add("Truyện chưa có chương tiếng Việt khả dụng, đã chuyển sang cào chương tiếng Anh");
            feed = fetchChapterFeed(mangadexId, "en", limitChapters);
            chapterLanguage = "en";
        }

        // 3. Ảnh bìa: upload lên Cloudinary (nếu đã cấu hình), lỗi thì giữ link MangaDex
        String coverUrl = parsed.coverUrl();
        boolean coverOnCloudinary = false;
        Optional<Manga> existing = mangaRepository.findByMangadexId(mangadexId);
        if (parsed.coverFileName() != null && uploadCover) {
            String publicId = coverPublicId(mangadexId, parsed.coverFileName());
            String currentCover = existing.map(Manga::getCoverImageUrl).orElse(null);
            if (currentCover != null && currentCover.contains(publicId)) {
                coverUrl = currentCover;
                coverOnCloudinary = true;
            } else if (cloudinaryService.isEnabled()) {
                try {
                    byte[] bytes = downloadBytes(coverUrl);
                    coverUrl = cloudinaryService.upload(bytes, "covers", publicId, true).secureUrl();
                    coverOnCloudinary = true;
                } catch (Exception e) {
                    log.warn("Upload cover {} lên Cloudinary thất bại: {}", mangadexId, e.getMessage());
                    warnings.add("Không upload được ảnh bìa lên Cloudinary, đang dùng link MangaDex: " + e.getMessage());
                }
            } else {
                warnings.add("Cloudinary chưa được cấu hình, ảnh bìa đang dùng link MangaDex");
            }
        }

        // 4. Ghi vào CSDL trong một transaction
        final String finalCoverUrl = coverUrl;
        final List<ParsedChapter> chapters = feed.chapters();
        SaveResult saved = transactionTemplate.execute(status -> saveImport(parsed, finalCoverUrl, chapters));

        // 5. (Tuỳ chọn) Upload trang ảnh của vài chương đầu lên Cloudinary
        int mirrored = 0;
        int mirrorCount = Math.max(0, Math.min(requestedMirror, MAX_MIRROR_CHAPTERS));
        if (mirrorCount > 0) {
            if (!cloudinaryService.isEnabled()) {
                warnings.add("Cloudinary chưa được cấu hình nên không upload được trang ảnh chương");
            } else {
                for (UUID chapterId : saved.chapterIds().stream().limit(mirrorCount).toList()) {
                    try {
                        mirrorChapterToCloudinary(chapterId);
                        mirrored++;
                    } catch (Exception e) {
                        log.warn("Mirror chương {} thất bại: {}", chapterId, e.getMessage());
                        warnings.add("Upload trang ảnh chương thất bại (" + chapterId + "): " + e.getMessage());
                    }
                }
            }
        }

        int skipped = feed.skipped() + saved.duplicates();
        return MangaDexImportResponse.builder()
                .mangaId(saved.mangaId())
                .mangadexId(mangadexId)
                .title(parsed.title())
                .coverImageUrl(finalCoverUrl)
                .coverOnCloudinary(coverOnCloudinary)
                .chapterLanguage(chapterLanguage)
                .chaptersImported(saved.chaptersSaved())
                .chaptersSkipped(skipped)
                .chaptersMirrored(mirrored)
                .tags(parsed.tags().stream().map(ParsedTag::name).toList())
                .authors(parsed.people().stream().map(ParsedPerson::name).distinct().toList())
                .warnings(warnings)
                .message(String.format("Đã cào thành công truyện '%s': %d chương (%s), bỏ qua %d chương",
                        parsed.title(), saved.chaptersSaved(), chapterLanguage, skipped))
                .build();
    }

    private SaveResult saveImport(ParsedManga parsed, String coverUrl, List<ParsedChapter> chapters) {
        Manga manga = mangaRepository.findByMangadexId(parsed.mangadexId())
                .orElse(Manga.builder().mangadexId(parsed.mangadexId()).build());

        manga.setTitle(parsed.title());
        manga.setAltTitles(parsed.altTitles());
        manga.setDescription(parsed.description());
        manga.setCoverImageUrl(coverUrl);
        manga.setStatus(parsed.status());
        manga.setOriginalLanguage(parsed.originalLanguage());
        manga.setOriginType(parsed.originType());
        manga.setContentRating(parsed.contentRating());
        if (manga.getApprovalStatus() == null) {
            manga.setApprovalStatus("approved");
        }
        manga = mangaRepository.save(manga);
        UUID mangaId = manga.getId();

        // Tác giả / hoạ sĩ
        for (ParsedPerson person : parsed.people()) {
            Author author = authorRepository.findByMangadexId(person.mangadexId())
                    .or(() -> authorRepository.findByName(person.name()))
                    .orElse(Author.builder().mangadexId(person.mangadexId()).name(person.name()).build());
            if (author.getMangadexId() == null) {
                author.setMangadexId(person.mangadexId());
            }
            author = authorRepository.save(author);
            mangaAuthorRepository.save(MangaAuthor.builder()
                    .mangaId(mangaId)
                    .authorId(author.getId())
                    .role(person.role())
                    .build());
        }

        // Thể loại (tag)
        for (ParsedTag parsedTag : parsed.tags()) {
            Tag tag = tagRepository.findByNameIgnoreCase(parsedTag.name())
                    .orElse(Tag.builder().mangadexId(parsedTag.mangadexId()).name(parsedTag.name()).groupType(parsedTag.group()).build());
            if (tag.getMangadexId() == null) {
                tag.setMangadexId(parsedTag.mangadexId());
            }
            tag = tagRepository.save(tag);
            mangaTagRepository.save(MangaTag.builder().mangaId(mangaId).tagId(tag.getId()).build());
        }

        // Chương: cập nhật chương đã có, bỏ qua chương trùng số với chương khác đã lưu
        Set<String> existingNumbers = new HashSet<>();
        for (Chapter c : chapterRepository.findByMangaId(mangaId)) {
            existingNumbers.add(chapterKey(c.getChapterNumber(), c.getTranslatedLanguage()));
        }

        List<UUID> chapterIds = new ArrayList<>();
        int duplicates = 0;
        for (ParsedChapter pc : chapters) {
            Optional<Chapter> found = chapterRepository.findByMangadexId(pc.mangadexId());
            String key = chapterKey(pc.chapterNumber(), pc.language());
            if (found.isEmpty() && existingNumbers.contains(key)) {
                duplicates++;
                continue;
            }

            Chapter chapter = found.orElse(Chapter.builder().mangadexId(pc.mangadexId()).mangaId(mangaId).build());
            chapter.setMangaId(mangaId);
            chapter.setVolume(pc.volume());
            chapter.setChapterNumber(pc.chapterNumber());
            chapter.setTitle(pc.title());
            chapter.setTranslatedLanguage(pc.language());
            if (!"cloudinary".equals(chapter.getStorageType())) {
                chapter.setStorageType("mangadex_at_home");
            }
            chapter.setStatus("published");
            if (pc.publishAt() != null) {
                chapter.setPublishAt(pc.publishAt());
            }
            chapter = chapterRepository.save(chapter);
            existingNumbers.add(key);
            chapterIds.add(chapter.getId());
        }

        return new SaveResult(mangaId, chapterIds.size(), duplicates, chapterIds);
    }

    /**
     * Lấy toàn bộ feed chương (có phân trang), bỏ chương link ngoài / không có trang / trùng số chương.
     */
    private FeedResult fetchChapterFeed(UUID mangadexId, String lang, int limitChapters) {
        List<ParsedChapter> chapters = new ArrayList<>();
        Set<String> seenNumbers = new HashSet<>();
        int skipped = 0;
        int offset = 0;
        int total = Integer.MAX_VALUE;

        while (chapters.size() < limitChapters && offset < total && offset < 10000) {
            URI feedUri = UriComponentsBuilder.fromUriString(baseUrl)
                    .path("/manga/{id}/feed")
                    .queryParam("translatedLanguage[]", lang)
                    .queryParam("order[volume]", "asc")
                    .queryParam("order[chapter]", "asc")
                    .queryParam("contentRating[]", "safe", "suggestive", "erotica")
                    .queryParam("includeExternalUrl", 0)
                    .queryParam("includeEmptyPages", 0)
                    .queryParam("includeFuturePublishAt", 0)
                    .queryParam("limit", FEED_PAGE_SIZE)
                    .queryParam("offset", offset)
                    .encode()
                    .buildAndExpand(mangadexId)
                    .toUri();

            JsonNode root;
            try {
                root = getJson(feedUri, "Không tải được danh sách chương từ MangaDex");
            } catch (ResponseStatusException e) {
                if (chapters.isEmpty()) throw e;
                log.warn("Dừng phân trang feed của {} tại offset {}: {}", mangadexId, offset, e.getReason());
                break;
            }
            total = root.path("total").asInt(0);
            JsonNode data = root.path("data");
            if (data.isEmpty()) break;

            for (JsonNode item : data) {
                JsonNode attr = item.path("attributes");
                boolean external = !attr.path("externalUrl").isNull() && !attr.path("externalUrl").asText("").isEmpty();
                boolean unavailable = attr.path("isUnavailable").asBoolean(false);
                int pages = attr.path("pages").asInt(0);
                if (external || unavailable || pages <= 0) {
                    skipped++;
                    continue;
                }

                String chapterNumber = textOrNull(attr.path("chapter"));
                if (chapterNumber == null) chapterNumber = "Oneshot";
                if (!seenNumbers.add(chapterNumber)) {
                    // Nhiều nhóm dịch cùng một chương: giữ bản đầu tiên
                    skipped++;
                    continue;
                }
                if (chapters.size() >= limitChapters) break;

                OffsetDateTime publishAt = null;
                String publishText = textOrNull(attr.path("publishAt"));
                if (publishText != null) {
                    try {
                        publishAt = OffsetDateTime.parse(publishText);
                    } catch (Exception ignored) {
                        // giữ null, entity sẽ tự dùng thời điểm hiện tại
                    }
                }

                chapters.add(new ParsedChapter(
                        UUID.fromString(item.path("id").asText()),
                        textOrNull(attr.path("volume")),
                        chapterNumber,
                        textOrNull(attr.path("title")),
                        attr.path("translatedLanguage").asText(lang),
                        publishAt
                ));
            }

            offset += FEED_PAGE_SIZE;
            pause();
        }

        return new FeedResult(chapters, skipped);
    }

    // =====================================================================
    // Đọc chương
    // =====================================================================

    /**
     * Lấy danh sách chương (đã xuất bản, bỏ chương nháp của Uploader) của một truyện theo Manga UUID nội bộ
     */
    @Transactional(readOnly = true)
    public List<ChapterResponse> getChaptersByMangaId(UUID mangaId) {
        List<Chapter> chapters = new ArrayList<>(chapterRepository.findByMangaId(mangaId).stream()
                .filter(c -> !"draft".equalsIgnoreCase(c.getStatus()))
                .toList());
        // Sắp xếp theo số chương (1, 2, 3...)
        chapters.sort((a, b) -> {
            try {
                double numA = Double.parseDouble(a.getChapterNumber());
                double numB = Double.parseDouble(b.getChapterNumber());
                return Double.compare(numA, numB);
            } catch (Exception e) {
                return String.valueOf(a.getChapterNumber()).compareTo(String.valueOf(b.getChapterNumber()));
            }
        });

        return chapters.stream().map(c -> ChapterResponse.builder()
                .id(c.getId())
                .mangadexId(c.getMangadexId())
                .mangaId(c.getMangaId())
                .volume(c.getVolume())
                .chapterNumber(c.getChapterNumber())
                .title(c.getTitle())
                .translatedLanguage(c.getTranslatedLanguage())
                .storageType(c.getStorageType())
                .status(c.getStatus())
                .publishAt(c.getPublishAt())
                .createdAt(c.getCreatedAt())
                .build()
        ).toList();
    }

    /**
     * Lấy danh sách trang ảnh của chương.
     * Ưu tiên ảnh đã upload lên Cloudinary, sau đó tới ảnh MangaDex đã lưu, cuối cùng gọi MangaDex@Home để lấy danh sách trang.
     */
    @Transactional
    public ReaderChapterResponse getChapterPages(UUID chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chương không tồn tại"));

        List<ChapterPage> existingPages = chapterPageRepository.findByChapterIdOrderByPageNumberAsc(chapterId);

        if (!existingPages.isEmpty()) {
            String hash = chapter.getMangadexHash();
            boolean allOnCloudinary = existingPages.stream().allMatch(p -> p.getS3WebpUrl() != null);
            List<ReaderChapterResponse.Page> pages = existingPages.stream().map(p -> {
                String imgUrl;
                if (p.getS3WebpUrl() != null) {
                    imgUrl = p.getS3WebpUrl();
                } else if (p.getDataSaverFileName() != null && hash != null) {
                    imgUrl = String.format("%s/data-saver/%s/%s", UPLOADS_BASE, hash, p.getDataSaverFileName());
                } else if (p.getImageFileName() != null && hash != null) {
                    imgUrl = String.format("%s/data/%s/%s", UPLOADS_BASE, hash, p.getImageFileName());
                } else {
                    imgUrl = "/api/v1/reader-demo/images/" + p.getPageNumber();
                }
                return new ReaderChapterResponse.Page(
                        p.getPageNumber(),
                        imgUrl,
                        p.getWidth() != null && p.getWidth() > 0 ? p.getWidth() : 800,
                        p.getHeight() != null && p.getHeight() > 0 ? p.getHeight() : 1100
                );
            }).toList();

            return new ReaderChapterResponse(
                    chapter.getMangaId(),
                    chapter.getId(),
                    chapterTitle(chapter),
                    chapter.getChapterNumber(),
                    allOnCloudinary ? "CLOUDINARY" : "MANGADEX",
                    pages.size(),
                    pages
            );
        }

        // Chương từ MangaDex chưa có trang trong DB: gọi At-Home Server để lấy danh sách trang
        if (chapter.getMangadexId() != null) {
            AtHomeChapter atHome = fetchAtHome(chapter.getMangadexId());

            chapter.setMangadexHash(atHome.hash());
            chapterRepository.save(chapter);

            List<ReaderChapterResponse.Page> pages = new ArrayList<>();
            for (int i = 0; i < atHome.size(); i++) {
                int pageNum = i + 1;
                String dataSaverFile = atHome.dataSaverFile(i);
                String originalFile = atHome.originalFile(i);

                chapterPageRepository.save(ChapterPage.builder()
                        .chapterId(chapterId)
                        .pageNumber(pageNum)
                        .dataSaverFileName(dataSaverFile)
                        .imageFileName(originalFile != null ? originalFile : dataSaverFile)
                        .width(800)
                        .height(1100)
                        .build());

                String imgUrl = dataSaverFile != null
                        ? String.format("%s/data-saver/%s/%s", UPLOADS_BASE, atHome.hash(), dataSaverFile)
                        : String.format("%s/data/%s/%s", UPLOADS_BASE, atHome.hash(), originalFile);
                pages.add(new ReaderChapterResponse.Page(pageNum, imgUrl, 800, 1100));
            }

            return new ReaderChapterResponse(
                    chapter.getMangaId(),
                    chapter.getId(),
                    chapterTitle(chapter),
                    chapter.getChapterNumber(),
                    "MANGADEX",
                    pages.size(),
                    pages
            );
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chương chưa có nội dung trang");
    }

    // =====================================================================
    // Upload trang chương lên Cloudinary
    // =====================================================================

    /**
     * Tải ảnh gốc của từng trang chương từ MangaDex, convert sang WebP và lưu lên Cloudinary.
     * Trang nào đã có link Cloudinary thì bỏ qua (chạy lại được nếu bị lỗi giữa chừng).
     */
    public ChapterMirrorResponse mirrorChapterToCloudinary(UUID chapterId) {
        if (!cloudinaryService.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cloudinary chưa được cấu hình (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)");
        }

        // Đảm bảo đã có danh sách trang + hash trong DB
        getChapterPages(chapterId);
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chương không tồn tại"));
        String hash = chapter.getMangadexHash();
        List<ChapterPage> pages = chapterPageRepository.findByChapterIdOrderByPageNumberAsc(chapterId);
        if (hash == null && pages.stream().anyMatch(p -> p.getS3WebpUrl() == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chương không phải nguồn MangaDex, không thể upload tự động");
        }

        int uploaded = 0;
        int skipped = 0;
        for (ChapterPage page : pages) {
            if (page.getS3WebpUrl() != null) {
                skipped++;
                continue;
            }
            String sourceUrl = page.getImageFileName() != null
                    ? String.format("%s/data/%s/%s", UPLOADS_BASE, hash, page.getImageFileName())
                    : String.format("%s/data-saver/%s/%s", UPLOADS_BASE, hash, page.getDataSaverFileName());

            byte[] bytes;
            try {
                bytes = downloadBytes(sourceUrl);
            } catch (Exception e) {
                // Ảnh gốc lỗi thì thử bản data-saver
                if (page.getDataSaverFileName() == null) throw e;
                sourceUrl = String.format("%s/data-saver/%s/%s", UPLOADS_BASE, hash, page.getDataSaverFileName());
                bytes = downloadBytes(sourceUrl);
            }

            CloudinaryService.UploadResult result = cloudinaryService.upload(
                    bytes, "chapters/" + chapterId, String.format("page-%03d", page.getPageNumber()), true);
            page.setS3OriginUrl(sourceUrl);
            page.setS3WebpUrl(result.secureUrl());
            if (result.width() > 0) page.setWidth(result.width());
            if (result.height() > 0) page.setHeight(result.height());
            chapterPageRepository.save(page);
            uploaded++;
        }

        chapter.setStorageType("cloudinary");
        chapterRepository.save(chapter);

        return ChapterMirrorResponse.builder()
                .chapterId(chapterId)
                .chapterNumber(chapter.getChapterNumber())
                .totalPages(pages.size())
                .pagesUploaded(uploaded)
                .pagesSkipped(skipped)
                .message(String.format("Đã upload %d/%d trang của chương %s lên Cloudinary",
                        uploaded + skipped, pages.size(), chapter.getChapterNumber()))
                .build();
    }

    // =====================================================================
    // Helpers
    // =====================================================================

    private ParsedManga parseManga(UUID mangadexId, JsonNode mangaNode) {
        JsonNode attributes = mangaNode.path("attributes");
        String title = extractLocalizedText(attributes.path("title"));
        if (title.isBlank()) {
            title = "MangaDex " + mangadexId;
        }

        List<Map<String, String>> altTitles = new ArrayList<>();
        for (JsonNode alt : attributes.path("altTitles")) {
            alt.fields().forEachRemaining(e -> altTitles.add(Map.of(e.getKey(), e.getValue().asText())));
        }

        String coverFileName = null;
        List<ParsedPerson> people = new ArrayList<>();
        for (JsonNode rel : mangaNode.path("relationships")) {
            String type = rel.path("type").asText();
            if ("cover_art".equals(type) && rel.has("attributes")) {
                coverFileName = rel.path("attributes").path("fileName").asText(null);
            } else if (("author".equals(type) || "artist".equals(type)) && rel.has("attributes")) {
                String name = rel.path("attributes").path("name").asText("").trim();
                if (!name.isEmpty()) {
                    people.add(new ParsedPerson(UUID.fromString(rel.path("id").asText()), name, type));
                }
            }
        }

        String originalLanguage = attributes.path("originalLanguage").asText("ja");
        return new ParsedManga(
                mangadexId,
                title,
                altTitles,
                extractLocalizedText(attributes.path("description")),
                attributes.path("status").asText("ongoing"),
                originalLanguage,
                originType(originalLanguage),
                attributes.path("contentRating").asText("safe"),
                coverFileName,
                buildCoverUrl(mangadexId, coverFileName),
                people,
                parseTags(attributes)
        );
    }

    private List<ParsedTag> parseTags(JsonNode attributes) {
        List<ParsedTag> tags = new ArrayList<>();
        for (JsonNode tagNode : attributes.path("tags")) {
            String name = extractLocalizedText(tagNode.path("attributes").path("name")).trim();
            if (name.isEmpty()) continue;
            if (name.length() > 50) name = name.substring(0, 50);
            tags.add(new ParsedTag(
                    UUID.fromString(tagNode.path("id").asText()),
                    name,
                    tagNode.path("attributes").path("group").asText("genre")
            ));
        }
        return tags;
    }

    private AtHomeChapter fetchAtHome(UUID chapterMangadexId) {
        URI uri = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/at-home/server/{id}")
                .encode()
                .buildAndExpand(chapterMangadexId)
                .toUri();
        JsonNode chapterNode = getJson(uri, "Không tải được trang chương từ MangaDex").path("chapter");
        String hash = chapterNode.path("hash").asText(null);
        if (hash == null || hash.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "MangaDex không trả về hash cho chương này");
        }
        List<String> data = new ArrayList<>();
        chapterNode.path("data").forEach(n -> data.add(n.asText()));
        List<String> dataSaver = new ArrayList<>();
        chapterNode.path("dataSaver").forEach(n -> dataSaver.add(n.asText()));
        return new AtHomeChapter(hash, data, dataSaver);
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", userAgent);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private JsonNode getJson(URI uri, String errorPrefix) {
        try {
            ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, new HttpEntity<>(createHeaders()), String.class);
            if (response.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, errorPrefix + ": MangaDex trả về rỗng");
            }
            return objectMapper.readTree(response.getBody());
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, errorPrefix + ": không tồn tại trên MangaDex");
        } catch (HttpClientErrorException.TooManyRequests e) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, errorPrefix + ": MangaDex đang giới hạn tốc độ, thử lại sau ít phút");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("{} ({}): {}", errorPrefix, uri, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, errorPrefix + ": " + e.getMessage());
        }
    }

    private byte[] downloadBytes(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", userAgent);
        headers.setAccept(List.of(MediaType.ALL));
        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(URI.create(url), HttpMethod.GET, new HttpEntity<>(headers), byte[].class);
            if (response.getBody() == null || response.getBody().length == 0) {
                throw new IllegalStateException("ảnh rỗng");
            }
            return response.getBody();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không tải được ảnh " + url + ": " + e.getMessage());
        }
    }

    private void pause() {
        try {
            Thread.sleep(REQUEST_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static String buildCoverUrl(UUID mangadexId, String coverFileName) {
        if (coverFileName == null || coverFileName.isEmpty()) return null;
        return String.format("%s/covers/%s/%s.512.jpg", UPLOADS_BASE, mangadexId, coverFileName);
    }

    private static String coverPublicId(UUID mangadexId, String coverFileName) {
        int dot = coverFileName.lastIndexOf('.');
        String base = dot > 0 ? coverFileName.substring(0, dot) : coverFileName;
        return mangadexId + "_" + base;
    }

    private static String originType(String originalLanguage) {
        if (originalLanguage == null) return "manga";
        return switch (originalLanguage) {
            case "ko" -> "manhwa";
            case "zh", "zh-hk" -> "manhua";
            default -> "manga";
        };
    }

    private static String chapterKey(String chapterNumber, String language) {
        return (chapterNumber == null ? "Oneshot" : chapterNumber) + "|" + language;
    }

    private static String chapterTitle(Chapter chapter) {
        return chapter.getTitle() != null ? chapter.getTitle() : "Chương " + chapter.getChapterNumber();
    }

    private static String textOrNull(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        String text = node.asText().trim();
        return text.isEmpty() ? null : text;
    }

    private String extractLocalizedText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return "";
        if (node.isTextual()) return node.asText();
        if (node.has("vi") && !node.path("vi").asText().trim().isEmpty()) {
            return node.path("vi").asText();
        }
        if (node.has("en") && !node.path("en").asText().trim().isEmpty()) {
            return node.path("en").asText();
        }
        Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
        if (fields.hasNext()) {
            return fields.next().getValue().asText();
        }
        return "";
    }

    private record ParsedManga(UUID mangadexId, String title, List<Map<String, String>> altTitles, String description,
                               String status, String originalLanguage, String originType, String contentRating,
                               String coverFileName, String coverUrl, List<ParsedPerson> people, List<ParsedTag> tags) {}

    private record ParsedPerson(UUID mangadexId, String name, String role) {}

    private record ParsedTag(UUID mangadexId, String name, String group) {}

    private record ParsedChapter(UUID mangadexId, String volume, String chapterNumber, String title, String language,
                                 OffsetDateTime publishAt) {}

    private record FeedResult(List<ParsedChapter> chapters, int skipped) {}

    private record SaveResult(UUID mangaId, int chaptersSaved, int duplicates, List<UUID> chapterIds) {}

    private record AtHomeChapter(String hash, List<String> data, List<String> dataSaver) {
        int size() {
            return Math.max(data.size(), dataSaver.size());
        }

        String originalFile(int i) {
            return i < data.size() ? data.get(i) : null;
        }

        String dataSaverFile(int i) {
            return i < dataSaver.size() ? dataSaver.get(i) : null;
        }
    }
}
