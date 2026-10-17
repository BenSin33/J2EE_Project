'use client';

// Thành viên 2 - Công cụ cào MangaDex (dùng ở /crawler và /uploader/mangadex). API yêu cầu ROLE_ADMIN.

import { useState } from 'react';
import Link from 'next/link';
import { Search, DownloadCloud, AlertCircle, CheckCircle, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import { adminFetch } from '@/lib/adminApi';

interface MangaDexSearchResult {
  mangadexId: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  status: string;
  originalLanguage: string;
  contentRating: string;
  authorName?: string;
  tags?: string[];
  availableLanguages?: string[];
  importedMangaId?: string | null;
}

interface ImportResponse {
  mangaId: string;
  mangadexId: string;
  title: string;
  coverImageUrl?: string;
  coverOnCloudinary?: boolean;
  chapterLanguage?: string;
  chaptersImported: number;
  chaptersSkipped?: number;
  chaptersMirrored?: number;
  tags?: string[];
  authors?: string[];
  warnings?: string[];
  message: string;
}

// Endpoint crawler yêu cầu quyền ADMIN: adminFetch tự gắn JWT từ authStore
function errorMessage(status: number, data: { message?: string } | null, fallback: string) {
  if (status === 401 || status === 403) return 'Bạn cần đăng nhập bằng tài khoản ADMIN để dùng công cụ cào.';
  return data?.message || fallback;
}

export function MangaDexImporter() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MangaDexSearchResult[]>([]);
  const [searchError, setSearchError] = useState('');

  const [directUrl, setDirectUrl] = useState('');
  const [language, setLanguage] = useState('vi');
  const [maxChapters, setMaxChapters] = useState(50);
  const [uploadCover, setUploadCover] = useState(true);
  const [mirrorChapters, setMirrorChapters] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [importError, setImportError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const res = await adminFetch(`/crawler/mangadex/search?title=${encodeURIComponent(searchKeyword.trim())}&limit=12`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorMessage(res.status, errorData, 'Không thể tìm kiếm trên MangaDex. Nếu bạn ở VN, hãy kiểm tra kết nối WARP/VPN.'));
      }
      const data: MangaDexSearchResult[] = await res.json();
      setSearchResults(data);
      if (data.length === 0) {
        setSearchError('Không tìm thấy bộ truyện nào phù hợp trên MangaDex.');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setSearchError(e.message || 'Lỗi kết nối MangaDex API.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (urlOrId: string) => {
    setIsImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const res = await adminFetch(`/crawler/mangadex/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlOrId,
          language,
          maxChapters: Number(maxChapters) || 50,
          uploadCover,
          mirrorChapters: Number(mirrorChapters) || 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorMessage(res.status, errorData, 'Cào dữ liệu thất bại. Vui lòng thử lại.'));
      }

      const data: ImportResponse = await res.json();
      setImportResult(data);
      setSearchResults((prev) =>
        prev.map((m) => (m.mangadexId === data.mangadexId ? { ...m, importedMangaId: data.mangaId } : m))
      );
    } catch (err: unknown) {
      const e = err as Error;
      setImportError(e.message || 'Lỗi khi import truyện từ MangaDex.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
    <div className="mb-8 border-b border-gray-800 pb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center">
          <DownloadCloud className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MangaDex Source Crawler</h1>
          <p className="text-sm text-gray-400">Công cụ cào truyện, tác giả, ảnh bìa và danh sách chương từ MangaDex về CSDL MangaHub</p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <p className="font-semibold">Lưu ý mạng tại Việt Nam (DPI / SNI Reset):</p>
          <p className="text-xs text-amber-200/80 mt-1">
            Các nhà mạng VN (Viettel, VNPT, FPT) chặn tên miền mangadex.org. Nếu gặp lỗi <code>502 BAD_GATEWAY</code> hoặc Connection Refused khi cào, bạn hãy bật <strong>Cloudflare WARP (1.1.1.1)</strong> hoặc VPN trên máy tính để backend kết nối thông suốt tới MangaDex.
          </p>
        </div>
      </div>
    </div>

    {/* Section 1: Nhập link trực tiếp */}
    <div className="bg-[#121216] border border-gray-800 rounded-2xl p-6 mb-8 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>Cách 1: Cào theo Link hoặc MangaDex UUID</span>
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (directUrl.trim()) handleImport(directUrl.trim());
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Link truyện hoặc UUID MangaDex
          </label>
          <input
            type="text"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="Ví dụ: https://mangadex.org/title/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/one-piece hoặc 32d76d19-8a05-4db0-9fc2-e0b0648fe9d0"
            className="w-full h-11 px-4 rounded-xl bg-[#1a1a22] border border-gray-700 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-violet-500 transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Ngôn ngữ chương dịch
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#1a1a22] border border-gray-700 text-sm text-gray-100 outline-none focus:border-violet-500 transition-colors"
            >
              <option value="vi">Tiếng Việt (vi) - Mặc định</option>
              <option value="en">Tiếng Anh (en)</option>
              <option value="ja">Tiếng Nhật (ja)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Số lượng chương tối đa
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={maxChapters}
              onChange={(e) => setMaxChapters(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-xl bg-[#1a1a22] border border-gray-700 text-sm text-gray-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 h-11">
            <input
              type="checkbox"
              checked={uploadCover}
              onChange={(e) => setUploadCover(e.target.checked)}
              className="w-4 h-4 accent-violet-600"
            />
            <span>Upload ảnh bìa lên Cloudinary</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Upload trang ảnh N chương đầu lên Cloudinary (0-5)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={mirrorChapters}
              onChange={(e) => setMirrorChapters(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-xl bg-[#1a1a22] border border-gray-700 text-sm text-gray-100 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isImporting}
          className="px-6 h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
          <span>{isImporting ? 'Đang cào dữ liệu từ MangaDex...' : 'Bắt đầu cào về Database'}</span>
        </button>
      </form>

      {/* Kết quả import */}
      {importResult && (
        <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-green-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-green-200">{importResult.message}</p>
            <p className="text-xs text-green-300/80 mt-1">Manga UUID trong hệ thống: <code>{importResult.mangaId}</code></p>
            <p className="text-xs text-green-300/80 mt-1">
              Ảnh bìa: {importResult.coverOnCloudinary ? 'Cloudinary' : 'MangaDex'}
              {!!importResult.chaptersMirrored &&
                ` · ${importResult.chaptersMirrored} chương đã upload trang lên Cloudinary`}
            </p>
            {importResult.authors && importResult.authors.length > 0 && (
              <p className="text-xs text-green-300/80 mt-1">Tác giả: {importResult.authors.join(', ')}</p>
            )}
            {importResult.tags && importResult.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {importResult.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-green-500/15 text-[11px] text-green-200">{tag}</span>
                ))}
              </div>
            )}
            {importResult.warnings && importResult.warnings.length > 0 && (
              <ul className="mt-2 text-xs text-amber-300 list-disc pl-4 space-y-0.5">
                {importResult.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            )}
            <div className="mt-3 flex gap-3">
              <Link
                href={`/manga/${importResult.mangaId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Xem trang truyện</span>
              </Link>
              <Link
                href={`/uploader/mangas/${importResult.mangaId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-100 text-xs font-medium transition-colors"
              >
                <span>Quản lý chương</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {importError && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <div>{importError}</div>
        </div>
      )}
    </div>

    {/* Section 2: Tìm kiếm trên MangaDex */}
    <div className="bg-[#121216] border border-gray-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span>Cách 2: Tìm kiếm trên MangaDex và chọn bộ muốn cào</span>
      </h2>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Nhập tên truyện cần tìm (ví dụ: Naruto, One Piece, Dandadan...)"
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#1a1a22] border border-gray-700 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-6 h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span>Tìm kiếm</span>
        </button>
      </form>

      {searchError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <div>{searchError}</div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((manga) => (
            <div
              key={manga.mangadexId}
              className="bg-[#18181f] border border-gray-800 rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition-colors"
            >
              <div className="flex gap-3 mb-3">
                {manga.coverImageUrl ? (
                  <img
                    src={manga.coverImageUrl}
                    alt={manga.title}
                    className="w-16 h-24 object-cover rounded-lg shrink-0 border border-gray-700 bg-gray-800"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.ico'; }}
                  />
                ) : (
                  <div className="w-16 h-24 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 text-xs text-gray-500">
                    No cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white line-clamp-2" title={manga.title}>
                    {manga.title}
                  </h3>
                  {manga.authorName && (
                    <p className="text-xs text-gray-400 mt-1 truncate">Tác giả: {manga.authorName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 capitalize">Trạng thái: {manga.status}</p>
                  {manga.availableLanguages && (
                    <p className="text-xs text-gray-500 mt-1">
                      {manga.availableLanguages.includes('vi') ? 'Có bản tiếng Việt' : 'Chưa có bản tiếng Việt'}
                    </p>
                  )}
                  {manga.importedMangaId && (
                    <Link
                      href={`/manga/${manga.importedMangaId}`}
                      className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-md bg-green-500/15 text-green-300"
                    >
                      Đã có trong hệ thống
                    </Link>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 line-clamp-3 mb-4">
                {manga.description || 'Chưa có mô tả tóm tắt.'}
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-800/80">
                <button
                  onClick={() => handleImport(manga.mangadexId)}
                  disabled={isImporting}
                  className="flex-1 h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>{manga.importedMangaId ? 'Cập nhật lại' : 'Cào bộ này'}</span>
                </button>
                <a
                  href={`https://mangadex.org/title/${manga.mangadexId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center transition-colors"
                  title="Mở trên MangaDex"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
