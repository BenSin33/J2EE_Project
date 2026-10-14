package com.manga.manga_backend_services.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.manga.manga_backend_services.dto.response.ChapterResponse;
import com.manga.manga_backend_services.dto.response.MangaDexImportResponse;
import com.manga.manga_backend_services.dto.response.MangaDexSearchResult;
import com.manga.manga_backend_services.dto.response.ReaderChapterResponse;
import com.manga.manga_backend_services.entity.Author;
import com.manga.manga_backend_services.entity.Chapter;
import com.manga.manga_backend_services.entity.ChapterPage;
import com.manga.manga_backend_services.entity.Manga;
import com.manga.manga_backend_services.entity.MangaAuthor;
import com.manga.manga_backend_services.repository.AuthorRepository;
import com.manga.manga_backend_services.repository.ChapterPageRepository;
import com.manga.manga_backend_services.repository.ChapterRepository;
import com.manga.manga_backend_services.repository.MangaAuthorRepository;
import com.manga.manga_backend_services.repository.MangaRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.net.InetSocketAddress;
import java.net.Proxy;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class MangaDexService {

    private final MangaRepository mangaRepository;
    private final ChapterRepository chapterRepository;
    private final ChapterPageRepository chapterPageRepository;
    private final AuthorRepository authorRepository;
    private final MangaAuthorRepository mangaAuthorRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${mangadex.api.base-url:https://api.mangadex.org}")
    private String baseUrl;

    @Value("${mangadex.api.user-agent:MangaHub-Crawler/1.0 (contact: student@mangahub.local)}")
    private String userAgent;

    private static final Pattern UUID_PATTERN = Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    public MangaDexService(
            MangaRepository mangaRepository,
            ChapterRepository chapterRepository,
            ChapterPageRepository chapterPageRepository,
            AuthorRepository authorRepository,
            MangaAuthorRepository mangaAuthorRepository,
            ObjectMapper objectMapper,
            @Value("${mangadex.api.proxy.host:}") String proxyHost,
            @Value("${mangadex.api.proxy.port:0}") int proxyPort
    ) {
        this.mangaRepository = mangaRepository;
        this.chapterRepository = chapterRepository;
        this.chapterPageRepository = chapterPageRepository;
        this.authorRepository = authorRepository;
        this.mangaAuthorRepository = mangaAuthorRepository;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000);
        factory.setReadTimeout(20000);

        if (proxyHost != null && !proxyHost.trim().isEmpty() && proxyPort > 0) {
            log.info("Configuring MangaDex proxy: {}:{}", proxyHost, proxyPort);
            factory.setProxy(new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyHost.trim(), proxyPort)));
        }

        this.restTemplate = new RestTemplate(factory);
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", userAgent);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    /**
     * Tìm kiếm truyện trên MangaDex theo từ khóa
     */
    public List<MangaDexSearchResult> search(String title, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 30));
        String url = String.format("%s/manga?title=%s&limit=%d&includes[]=cover_art&includes[]=author",
                baseUrl, title, safeLimit);

        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode dataArray = root.path("data");
            List<MangaDexSearchResult> results = new ArrayList<>();

            for (JsonNode item : dataArray) {
                UUID mangadexId = UUID.fromString(item.path("id").asText());
                JsonNode attributes = item.path("attributes");

                String resolvedTitle = extractLocalizedText(attributes.path("title"));
                String description = extractLocalizedText(attributes.path("description"));
                String status = attributes.path("status").asText("ongoing");
                String originalLanguage = attributes.path("originalLanguage").asText("ja");
                String contentRating = attributes.path("contentRating").asText("safe");

                String coverFileName = null;
                String authorName = null;
                for (JsonNode rel : item.path("relationships")) {
                    String type = rel.path("type").asText();
                    if ("cover_art".equals(type) && rel.has("attributes")) {
                        coverFileName = rel.path("attributes").path("fileName").asText(null);
                    } else if ("author".equals(type) && rel.has("attributes")) {
                        authorName = rel.path("attributes").path("name").asText(null);
                    }
                }

                String coverUrl = null;
                if (coverFileName != null && !coverFileName.isEmpty()) {
                    coverUrl = String.format("https://uploads.mangadex.org/covers/%s/%s.512.jpg", mangadexId, coverFileName);
                }

                results.add(MangaDexSearchResult.builder()
                        .mangadexId(mangadexId)
                        .title(resolvedTitle)
                        .description(description)
                        .coverImageUrl(coverUrl)
                        .status(status)
                        .originalLanguage(originalLanguage)
                        .contentRating(contentRating)
                        .authorName(authorName)
                        .build());
            }

            return results;
        } catch (Exception e) {
            log.error("Failed to search MangaDex: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không kết nối được MangaDex: " + e.getMessage());
        }
    }

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

    /**
     * Cào một bộ truyện và danh sách chương từ MangaDex lưu vào CSDL
     */
    @Transactional
    public MangaDexImportResponse importManga(String urlOrId, String language, int maxChapters) {
        UUID mangadexId = extractMangadexId(urlOrId);
        String lang = (language == null || language.trim().isEmpty()) ? "vi" : language.trim().toLowerCase();
        int limitChapters = Math.max(1, Math.min(maxChapters, 200));

        // 1. Lấy chi tiết truyện
        String mangaUrl = String.format("%s/manga/%s?includes[]=cover_art&includes[]=author&includes[]=artist",
                baseUrl, mangadexId);

        JsonNode mangaNode;
        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(mangaUrl, HttpMethod.GET, entity, String.class);
            mangaNode = objectMapper.readTree(response.getBody()).path("data");
        } catch (Exception e) {
            log.error("Failed to fetch MangaDex manga {}: {}", mangadexId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không tải được truyện từ MangaDex: " + e.getMessage());
        }

        JsonNode attributes = mangaNode.path("attributes");
        String title = extractLocalizedText(attributes.path("title"));
        String description = extractLocalizedText(attributes.path("description"));
        String status = attributes.path("status").asText("ongoing");
        String originalLanguage = attributes.path("originalLanguage").asText("ja");
        String contentRating = attributes.path("contentRating").asText("safe");

        String coverFileName = null;
        UUID authorMangadexId = null;
        String authorName = null;

        for (JsonNode rel : mangaNode.path("relationships")) {
            String type = rel.path("type").asText();
            if ("cover_art".equals(type) && rel.has("attributes")) {
                coverFileName = rel.path("attributes").path("fileName").asText(null);
            } else if ("author".equals(type)) {
                authorMangadexId = UUID.fromString(rel.path("id").asText());
                if (rel.has("attributes")) {
                    authorName = rel.path("attributes").path("name").asText(null);
                }
            }
        }

        String coverUrl = null;
        if (coverFileName != null && !coverFileName.isEmpty()) {
            coverUrl = String.format("https://uploads.mangadex.org/covers/%s/%s.512.jpg", mangadexId, coverFileName);
        }

        // Lưu / cập nhật Manga
        Manga manga = mangaRepository.findByMangadexId(mangadexId)
                .orElse(Manga.builder().mangadexId(mangadexId).build());

        manga.setTitle(title);
        manga.setDescription(description);
        manga.setCoverImageUrl(coverUrl);
        manga.setStatus(status);
        manga.setOriginalLanguage(originalLanguage);
        manga.setContentRating(contentRating);
        manga.setApprovalStatus("approved");
        manga = mangaRepository.save(manga);

        // Xử lý Tác giả
        if (authorName != null && !authorName.isEmpty()) {
            final UUID finalAuthorId = authorMangadexId;
            final String finalAuthorName = authorName;
            Author author = null;
            if (finalAuthorId != null) {
                author = authorRepository.findByMangadexId(finalAuthorId).orElse(null);
            }
            if (author == null) {
                author = authorRepository.findByName(finalAuthorName).orElse(null);
            }
            if (author == null) {
                author = Author.builder().mangadexId(finalAuthorId).name(finalAuthorName).build();
            }
            author = authorRepository.save(author);

            if (!mangaAuthorRepository.existsByMangaIdAndAuthorId(manga.getId(), author.getId())) {
                mangaAuthorRepository.save(MangaAuthor.builder()
                        .mangaId(manga.getId())
                        .authorId(author.getId())
                        .role("author")
                        .build());
            }
        }

        // 2. Lấy danh sách chương
        int chaptersImported = importChapters(manga.getId(), mangadexId, lang, limitChapters);
        // Nếu không có chương tiếng Việt, thử cào thêm tiếng Anh
        if (chaptersImported == 0 && "vi".equals(lang)) {
            chaptersImported = importChapters(manga.getId(), mangadexId, "en", limitChapters);
        }

        return MangaDexImportResponse.builder()
                .mangaId(manga.getId())
                .mangadexId(mangadexId)
                .title(manga.getTitle())
                .coverImageUrl(manga.getCoverImageUrl())
                .chaptersImported(chaptersImported)
                .message(String.format("Đã cào thành công truyện '%s' và %d chương", manga.getTitle(), chaptersImported))
                .build();
    }

    private int importChapters(UUID internalMangaId, UUID mangadexId, String lang, int limitChapters) {
        String feedUrl = String.format("%s/manga/%s/feed?translatedLanguage[]=%s&order[chapter]=asc&limit=%d",
                baseUrl, mangadexId, lang, Math.min(limitChapters, 100));

        try {
            HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
            ResponseEntity<String> response = restTemplate.exchange(feedUrl, HttpMethod.GET, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return 0;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode dataArray = root.path("data");
            int count = 0;

            for (JsonNode item : dataArray) {
                if (count >= limitChapters) break;

                UUID chapterMangadexId = UUID.fromString(item.path("id").asText());
                JsonNode attr = item.path("attributes");

                String volume = attr.path("volume").isNull() ? null : attr.path("volume").asText(null);
                String chapterNumber = attr.path("chapter").asText(String.valueOf(count + 1));
                String chapterTitle = attr.path("title").isNull() ? null : attr.path("title").asText(null);
                String translatedLanguage = attr.path("translatedLanguage").asText(lang);

                Chapter chapter = chapterRepository.findByMangadexId(chapterMangadexId)
                        .orElse(Chapter.builder().mangadexId(chapterMangadexId).mangaId(internalMangaId).build());

                chapter.setMangaId(internalMangaId);
                chapter.setVolume(volume);
                chapter.setChapterNumber(chapterNumber);
                chapter.setTitle(chapterTitle);
                chapter.setTranslatedLanguage(translatedLanguage);
                chapter.setStorageType("mangadex_at_home");
                chapter.setStatus("published");

                chapterRepository.save(chapter);
                count++;
            }

            return count;
        } catch (Exception e) {
            log.warn("Failed to fetch chapters for manga {}: {}", mangadexId, e.getMessage());
            return 0;
        }
    }

    /**
     * Lấy danh sách chương của một truyện theo Manga UUID nội bộ
     */
    @Transactional(readOnly = true)
    public List<ChapterResponse> getChaptersByMangaId(UUID mangaId) {
        List<Chapter> chapters = chapterRepository.findByMangaId(mangaId);
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
     * Lấy danh sách trang ảnh của chương (hỗ trợ MangaDex@Home on-demand)
     */
    @Transactional
    public ReaderChapterResponse getChapterPages(UUID chapterId) {
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chương không tồn tại"));

        List<ChapterPage> existingPages = chapterPageRepository.findByChapterIdOrderByPageNumberAsc(chapterId);

        // Nếu đã có trang trong database, trả về luôn
        if (!existingPages.isEmpty()) {
            String hash = chapter.getMangadexHash();
            List<ReaderChapterResponse.Page> pages = existingPages.stream().map(p -> {
                String imgUrl = p.getDataSaverFileName() != null && hash != null
                        ? String.format("https://uploads.mangadex.org/data-saver/%s/%s", hash, p.getDataSaverFileName())
                        : (p.getImageFileName() != null && hash != null
                        ? String.format("https://uploads.mangadex.org/data/%s/%s", hash, p.getImageFileName())
                        : "/api/v1/reader-demo/images/" + p.getPageNumber());
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
                    chapter.getTitle() != null ? chapter.getTitle() : "Chương " + chapter.getChapterNumber(),
                    chapter.getChapterNumber(),
                    chapter.getStorageType() != null ? chapter.getStorageType() : "MANGADEX",
                    pages.size(),
                    pages
            );
        }

        // Nếu là chương từ MangaDex và chưa cào trang, gọi At-Home Server để lấy danh sách trang
        if (chapter.getMangadexId() != null) {
            String atHomeUrl = String.format("%s/at-home/server/%s", baseUrl, chapter.getMangadexId());

            try {
                HttpEntity<Void> entity = new HttpEntity<>(createHeaders());
                ResponseEntity<String> response = restTemplate.exchange(atHomeUrl, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    String hash = root.path("chapter").path("hash").asText();
                    JsonNode dataSaverArray = root.path("chapter").path("dataSaver");
                    JsonNode dataArray = root.path("chapter").path("data");

                    chapter.setMangadexHash(hash);
                    chapterRepository.save(chapter);

                    int total = Math.max(dataSaverArray.size(), dataArray.size());
                    List<ReaderChapterResponse.Page> pages = new ArrayList<>();

                    for (int i = 0; i < total; i++) {
                        int pageNum = i + 1;
                        String dataSaverFile = i < dataSaverArray.size() ? dataSaverArray.get(i).asText() : null;
                        String originalFile = i < dataArray.size() ? dataArray.get(i).asText() : null;

                        ChapterPage page = ChapterPage.builder()
                                .chapterId(chapterId)
                                .pageNumber(pageNum)
                                .dataSaverFileName(dataSaverFile)
                                .imageFileName(originalFile != null ? originalFile : dataSaverFile)
                                .width(800)
                                .height(1100)
                                .build();
                        chapterPageRepository.save(page);

                        String activeFile = dataSaverFile != null ? dataSaverFile : originalFile;
                        String imgUrl = String.format("https://uploads.mangadex.org/data-saver/%s/%s", hash, activeFile);

                        pages.add(new ReaderChapterResponse.Page(pageNum, imgUrl, 800, 1100));
                    }

                    return new ReaderChapterResponse(
                            chapter.getMangaId(),
                            chapter.getId(),
                            chapter.getTitle() != null ? chapter.getTitle() : "Chương " + chapter.getChapterNumber(),
                            chapter.getChapterNumber(),
                            "MANGADEX",
                            pages.size(),
                            pages
                    );
                }
            } catch (Exception e) {
                log.error("Failed to load MangaDex@Home pages for chapter {}: {}", chapter.getMangadexId(), e.getMessage());
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không tải được trang chương từ MangaDex: " + e.getMessage());
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chương chưa có nội dung trang");
    }

    private String extractLocalizedText(JsonNode node) {
        if (node == null || node.isMissingNode()) return "";
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
        return node.isTextual() ? node.asText() : "";
    }
}
