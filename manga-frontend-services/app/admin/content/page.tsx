'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  DownloadCloud,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Loader2,
  Check,
} from 'lucide-react';
import { MangaItem, MangaDexSearchResult } from '@/types/admin';
import { adminFetch } from '@/lib/adminApi';

export default function AdminContentPage() {
  const [subTab, setSubTab] = useState<'crawler' | 'list'>('crawler');

  // Mangas List State
  const [mangas, setMangas] = useState<MangaItem[]>([]);
  const [mangaSearch, setMangaSearch] = useState('');
  const [isLoadingMangas, setIsLoadingMangas] = useState(false);

  // Crawler State
  const [crawlerKeyword, setCrawlerKeyword] = useState('');
  const [isCrawlerSearching, setIsCrawlerSearching] = useState(false);
  const [crawlerResults, setCrawlerResults] = useState<MangaDexSearchResult[]>([]);
  const [crawlerError, setCrawlerError] = useState('');
  const [crawlerDirectUrl, setCrawlerDirectUrl] = useState('');
  const [crawlerLang, setCrawlerLang] = useState('vi');
  const [crawlerMaxChapters, setCrawlerMaxChapters] = useState(50);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string; mangaId?: string } | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMangas = useCallback(async () => {
    setIsLoadingMangas(true);
    try {
      const query = mangaSearch ? `?keyword=${encodeURIComponent(mangaSearch)}&limit=30` : '?limit=30';
      const res = await adminFetch(`/admin/mangas${query}`);
      if (res.ok) {
        const data = await res.json();
        setMangas(data.content || []);
      }
    } catch {
      // Keep fallback
    } finally {
      setIsLoadingMangas(false);
    }
  }, [mangaSearch]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await adminFetch(`/admin/mangas?limit=30`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setMangas(data.content || []);
        }
      } catch {
        // Keep fallback
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCrawlerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlerKeyword.trim()) return;
    setIsCrawlerSearching(true);
    setCrawlerError('');
    setCrawlerResults([]);

    try {
      const res = await adminFetch(`/crawler/mangadex/search?title=${encodeURIComponent(crawlerKeyword.trim())}&limit=12`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Không kết nối được MangaDex. Vui lòng bật Cloudflare WARP (1.1.1.1) hoặc VPN.');
      }
      const data: MangaDexSearchResult[] = await res.json();
      setCrawlerResults(data);
      if (data.length === 0) {
        setCrawlerError('Không tìm thấy bộ truyện nào phù hợp.');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setCrawlerError(e.message || 'Lỗi khi gọi MangaDex API.');
    } finally {
      setIsCrawlerSearching(false);
    }
  };

  const handleCrawlerImport = async (urlOrId: string) => {
    setIsImporting(true);
    setImportMessage(null);

    try {
      const res = await adminFetch(`/crawler/mangadex/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlOrId: urlOrId.trim(),
          language: crawlerLang,
          maxChapters: crawlerMaxChapters,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Lỗi khi cào dữ liệu từ MangaDex.');
      }

      setImportMessage({
        type: 'success',
        text: `Đã cào thành công "${data.title}" với ${data.chaptersImported} chương vào Database!`,
        mangaId: data.mangaId,
      });
      fetchMangas();
      showToast(`Đã cào thành công "${data.title}"!`);
    } catch (err: unknown) {
      const e = err as Error;
      setImportMessage({
        type: 'error',
        text: e.message || 'Không thể cào truyện. Kiểm tra lại kết nối hoặc WARP/VPN.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateMangaApproval = async (mangaId: string, status: string, reason = '') => {
    try {
      const res = await adminFetch(`/admin/mangas/${mangaId}/approval`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status, rejectionReason: reason }),
      });
      if (res.ok) {
        showToast(`Đã chuyển trạng thái truyện sang: ${status}`);
        fetchMangas();
      }
    } catch {
      showToast('Lỗi khi duyệt truyện');
    }
  };

  const handleDeleteManga = async (mangaId: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn truyện "${title}" khỏi hệ thống?`)) return;
    try {
      const res = await adminFetch(`/admin/mangas/${mangaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Đã xóa vĩnh viễn truyện "${title}"`);
        fetchMangas();
      }
    } catch {
      showToast('Lỗi khi xóa truyện');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-purple-600 px-5 py-3 text-white shadow-2xl transition-all border border-purple-400/40 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Header and Subtab switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/60 pb-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-white tracking-tight">1. Quản lý nội dung &amp; Cào truyện</h2>
          <p className="text-sm text-gray-400 mt-1">
            Cào dữ liệu từ MangaDex, duyệt truyện mới và xử lý vi phạm bản quyền theo sơ đồ quy trình
          </p>
        </div>

        <div className="flex bg-[#161622] rounded-xl p-1 border border-gray-800 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setSubTab('crawler')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              subTab === 'crawler'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cào nguồn MangaDex
          </button>
          <button
            onClick={() => setSubTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              subTab === 'list'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Danh sách truyện &amp; Kiểm duyệt ({mangas.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CRAWLER */}
      {subTab === 'crawler' && (
        <div className="space-y-8">
          {/* Warning banner */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200/90 leading-relaxed space-y-1">
                <p className="font-semibold text-amber-300">Lưu ý mạng Việt Nam khi Admin cào dữ liệu:</p>
                <p>Các ISP trong nước (Viettel, VNPT, FPT) chặn tên miền <code>api.mangadex.org</code>. Để cào thành công:</p>
                <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-200/80">
                  <li>Bật <strong>Cloudflare WARP (1.1.1.1)</strong> hoặc bất kỳ VPN nào trên máy.</li>
                  <li>Hoặc cấu hình proxy trong <code>application.properties</code>.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {importMessage && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                importMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {importMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0" />
                )}
                <span className="text-sm font-medium">{importMessage.text}</span>
              </div>
              {importMessage.mangaId && (
                <Link
                  href={`/manga/${importMessage.mangaId}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition"
                >
                  Xem trang truyện →
                </Link>
              )}
            </div>
          )}

          {/* Method 1: Import via Direct URL/UUID */}
          <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Cách 1: Cào theo Link hoặc MangaDex UUID</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Link hoặc UUID truyện MangaDex
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: https://mangadex.org/title/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0 hoặc UUID"
                  value={crawlerDirectUrl}
                  onChange={(e) => setCrawlerDirectUrl(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Ngôn ngữ chương
                </label>
                <select
                  value={crawlerLang}
                  onChange={(e) => setCrawlerLang(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                >
                  <option value="vi">Tiếng Việt (vi)</option>
                  <option value="en">Tiếng Anh (en)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                  Số chương tối đa
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={crawlerMaxChapters}
                  onChange={(e) => setCrawlerMaxChapters(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <button
              onClick={() => handleCrawlerImport(crawlerDirectUrl)}
              disabled={isImporting || !crawlerDirectUrl.trim()}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
              Bắt đầu cào về Database
            </button>
          </div>

          {/* Method 2: Search MangaDex & Pick */}
          <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg text-white">Cách 2: Tìm kiếm trên MangaDex và chọn bộ muốn cào</h3>
              <p className="text-xs text-gray-400 mt-1">Gõ từ khóa tên truyện tiếng Anh hoặc Romaji</p>
            </div>

            <form onSubmit={handleCrawlerSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nhập tên truyện (ví dụ: Naruto, One Piece, Dandadan, Solo Leveling)..."
                  value={crawlerKeyword}
                  onChange={(e) => setCrawlerKeyword(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isCrawlerSearching}
                className="px-6 h-11 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 transition"
              >
                {isCrawlerSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Tìm kiếm
              </button>
            </form>

            {crawlerError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {crawlerError}
              </div>
            )}

            {crawlerResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {crawlerResults.map((item) => (
                  <div
                    key={item.mangadexId}
                    className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-col justify-between hover:border-purple-500/40 transition group"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-22 rounded-lg bg-gray-800 shrink-0 overflow-hidden relative border border-gray-700/60">
                        {item.coverImageUrl ? (
                          <Image
                            src={item.coverImageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            No cover
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white truncate group-hover:text-purple-300 transition">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {item.description || 'Chưa có mô tả'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-300 uppercase">
                            {item.status}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Gốc: {item.originalLanguage}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCrawlerImport(item.mangadexId)}
                      disabled={isImporting}
                      className="mt-4 w-full py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <DownloadCloud className="w-3.5 h-3.5" />
                      Cào bộ này về Database
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: LIST & MODERATION */}
      {subTab === 'list' && (
        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm truyện trong database..."
                value={mangaSearch}
                onChange={(e) => setMangaSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') fetchMangas(); }}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>
            <button
              onClick={fetchMangas}
              className="px-4 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white transition"
            >
              Tìm
            </button>
          </div>

          {isLoadingMangas ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
              Đang tải danh sách truyện...
            </div>
          ) : mangas.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Chưa có truyện nào trong database. Hãy chuyển sang tab &quot;Cào nguồn MangaDex&quot; để nhập truyện!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs uppercase bg-gray-900/60 text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Truyện</th>
                    <th className="px-4 py-3">Nguồn</th>
                    <th className="px-4 py-3">Kiểm duyệt</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {mangas.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded bg-gray-800 relative overflow-hidden shrink-0 border border-gray-700/60">
                            {m.coverImageUrl && (
                              <Image
                                src={m.coverImageUrl}
                                alt={m.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <div>
                            <Link href={`/manga/${m.id}`} className="font-semibold text-white hover:text-purple-300 transition">
                              {m.title}
                            </Link>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{m.description || 'Chưa có mô tả'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        {m.mangadexId ? (
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">
                            MangaDex
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
                            LOCAL
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                            m.approvalStatus === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : m.approvalStatus === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {m.approvalStatus.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-gray-400 capitalize">
                        {m.status}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-2">
                        {m.approvalStatus !== 'approved' && (
                          <button
                            onClick={() => handleUpdateMangaApproval(m.id, 'approved')}
                            className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition"
                          >
                            Duyệt
                          </button>
                        )}
                        {m.approvalStatus !== 'rejected' && (
                          <button
                            onClick={() => {
                              const reason = prompt('Nhập lý do từ chối/vi phạm:');
                              if (reason !== null) handleUpdateMangaApproval(m.id, 'rejected', reason);
                            }}
                            className="px-2.5 py-1 rounded bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-medium border border-amber-500/30 transition"
                          >
                            Từ chối
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteManga(m.id, m.title)}
                          className="p-1 rounded text-gray-500 hover:text-rose-400 transition"
                          title="Xóa vĩnh viễn truyện"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
