'use client';

// Thành viên 2 - Quản lý một truyện: sửa thông tin, upload chương, xuất bản / nháp / xoá chương
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CloudUpload,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { isAdminRole, uploaderApi } from '@/lib/uploaderApi';
import { useAuthStore } from '@/store/authStore';
import { MangaForm } from '@/components/uploader/MangaForm';
import { ChapterUploader } from '@/components/uploader/ChapterUploader';
import {
  ApprovalBadge,
  Card,
  CoverImage,
  ErrorBox,
  SourceBadge,
  STATUS_LABELS,
  SuccessBox,
  secondaryButton,
} from '@/components/uploader/ui';
import type { TagItem, UploaderChapter, UploaderManga } from '@/types/uploader';

type Tab = 'chapters' | 'info';

function nextChapterNumber(chapters: UploaderChapter[]) {
  const nums = chapters.map((c) => parseFloat(c.chapterNumber)).filter((n) => !Number.isNaN(n));
  return nums.length ? String(Math.floor(Math.max(...nums)) + 1) : '1';
}

export default function UploaderMangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const admin = isAdminRole(user?.role);

  const [manga, setManga] = useState<UploaderManga | null>(null);
  const [chapters, setChapters] = useState<UploaderChapter[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tab, setTab] = useState<Tab>('chapters');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyChapter, setBusyChapter] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; chapterNumber: string; title: string } | null>(null);

  const isMangaDex = !!manga?.mangadexId;

  const loadChapters = useCallback(() => uploaderApi.listChapters(id).then(setChapters), [id]);

  useEffect(() => {
    Promise.all([uploaderApi.getManga(id), uploaderApi.listChapters(id), uploaderApi.tags()])
      .then(([m, c, t]) => {
        setManga(m);
        setChapters(c);
        setTags(t);
        // Thông báo chuyển từ trang tạo truyện
        const params = new URLSearchParams(window.location.search);
        if (params.get('created')) setNotice('Đã tạo truyện. Giờ bạn có thể upload chương đầu tiên.');
        if (params.get('coverError')) setError(`Đã tạo truyện nhưng upload ảnh bìa thất bại: ${params.get('coverError')}`);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const suggested = useMemo(() => nextChapterNumber(chapters), [chapters]);

  const runChapterAction = async (chapterId: string, action: () => Promise<unknown>, success: string) => {
    setBusyChapter(chapterId);
    setError('');
    setNotice('');
    try {
      await action();
      await loadChapters();
      setNotice(success);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyChapter(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải truyện...
      </div>
    );
  }
  if (!manga) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error || 'Không tìm thấy truyện'} />
        <Link href="/uploader/mangas" className={secondaryButton}><ArrowLeft className="w-4 h-4" /> Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/uploader/mangas" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Truyện của tôi
      </Link>

      {/* Header truyện */}
      <Card className="flex flex-col sm:flex-row gap-5">
        <CoverImage src={manga.coverImageUrl} alt={manga.title} className="w-28 sm:w-32 aspect-[3/4] rounded-xl shrink-0 self-start" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <SourceBadge source={isMangaDex ? 'MANGADEX' : 'LOCAL'} />
            <ApprovalBadge status={manga.approvalStatus} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight break-words">{manga.title}</h2>
          <p className="text-sm text-gray-400">
            {STATUS_LABELS[manga.status ?? ''] ?? manga.status} · {(manga.originType ?? 'manga').toUpperCase()} · {chapters.length} chương
            {manga.authors && manga.authors.length > 0 && ` · ${manga.authors.map((a) => a.name).join(', ')}`}
          </p>
          {manga.approvalStatus === 'rejected' && manga.rejectionReason && (
            <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              Lý do từ chối: {manga.rejectionReason}. Sửa lại thông tin để gửi duyệt lại.
            </p>
          )}
          {manga.approvalStatus === 'pending' && (
            <p className="text-xs text-amber-300/90">Truyện đang chờ Admin duyệt; người đọc chưa thấy truyện này.</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href={`/manga/${manga.id}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-3 py-1.5 rounded-lg">
              Xem trang người đọc <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            {isMangaDex && (
              <a href={`https://mangadex.org/title/${manga.mangadexId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                Mở trên MangaDex <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800" role="tablist">
        {([
          ['chapters', `Chương (${chapters.length})`],
          ['info', isMangaDex ? 'Thông tin' : 'Sửa thông tin'],
        ] as [Tab, string][]).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition cursor-pointer ${
              tab === value ? 'border-purple-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && <SuccessBox message={notice} />}
      {error && <ErrorBox message={error} />}

      {tab === 'chapters' && (
        <div className="space-y-6">
          {isMangaDex ? (
            <p className="text-sm text-gray-400 bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3">
              Truyện nguồn MangaDex: chương được đồng bộ bằng công cụ cào (cào lại để thêm chương mới).
              {admin && ' Bấm "Lên Cloudinary" để lưu ảnh của chương về Cloudinary, giúp người đọc ở VN không cần VPN.'}
            </p>
          ) : (
            <Card>
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <CloudUpload className="w-5 h-5 text-purple-400" /> Upload chương mới
              </h3>
              <ChapterUploader
                mangaId={manga.id}
                suggestedNumber={suggested}
                onUploaded={(chapter) => {
                  setChapters((prev) => [...prev, chapter]);
                  setNotice(`Đã upload chương ${chapter.chapterNumber} (${chapter.pageCount} trang)${chapter.status === 'draft' ? ' ở trạng thái nháp' : ''}.`);
                  setError('');
                  loadChapters().catch(() => undefined);
                }}
              />
            </Card>
          )}

          <Card className="!p-0 overflow-hidden">
            {chapters.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có chương nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#121218] text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Chương</th>
                      <th className="text-left font-semibold px-4 py-3">Trang</th>
                      <th className="text-left font-semibold px-4 py-3">Lưu trữ</th>
                      <th className="text-left font-semibold px-4 py-3">Trạng thái</th>
                      <th className="text-right font-semibold px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {chapters.map((c) => {
                      const busy = busyChapter === c.id;
                      const isEditing = editing?.id === c.id;
                      return (
                        <tr key={c.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3 min-w-[220px]">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <input
                                  aria-label="Số chương"
                                  className="w-20 h-9 px-2 rounded-lg bg-[#1a1a22] border border-gray-700 text-sm outline-none focus:border-purple-500"
                                  value={editing.chapterNumber}
                                  onChange={(e) => setEditing({ ...editing, chapterNumber: e.target.value })}
                                />
                                <input
                                  aria-label="Tên chương"
                                  className="flex-1 min-w-0 h-9 px-2 rounded-lg bg-[#1a1a22] border border-gray-700 text-sm outline-none focus:border-purple-500"
                                  placeholder="Tên chương"
                                  value={editing.title}
                                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                {c.previewUrl && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.previewUrl} alt="" className="w-8 h-11 rounded object-cover border border-gray-700 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-100">
                                    {c.volume ? `Tập ${c.volume} · ` : ''}Chương {c.chapterNumber}
                                  </p>
                                  {c.title && <p className="text-xs text-gray-500 truncate max-w-xs">{c.title}</p>}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400">{c.pageCount || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs ${c.storageType === 'cloudinary' ? 'text-sky-300' : 'text-orange-300'}`}>
                              {c.storageType === 'cloudinary' ? 'Cloudinary' : 'MangaDex@Home'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {c.status === 'published' ? (
                              <span className="text-xs font-semibold text-emerald-300">Đã xuất bản</span>
                            ) : (
                              <span className="text-xs font-semibold text-amber-300">Nháp</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              {busy && <Loader2 className="w-4 h-4 animate-spin text-gray-400 self-center" />}
                              <Link href={`/chapter/${c.id}`} target="_blank" title="Đọc thử" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              {isMangaDex && admin && c.storageType !== 'cloudinary' && (
                                <button
                                  disabled={busy}
                                  onClick={() =>
                                    runChapterAction(c.id, () => uploaderApi.mirrorChapter(c.id), `Đã lưu ảnh chương ${c.chapterNumber} lên Cloudinary.`)
                                  }
                                  className="px-2.5 h-8 rounded-lg text-xs text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 disabled:opacity-50 cursor-pointer"
                                >
                                  Lên Cloudinary
                                </button>
                              )}
                              {!isMangaDex && (
                                <>
                                  {isEditing ? (
                                    <>
                                      <button
                                        title="Lưu"
                                        disabled={busy}
                                        onClick={() =>
                                          runChapterAction(
                                            c.id,
                                            () => uploaderApi.updateChapter(c.id, { chapterNumber: editing.chapterNumber, title: editing.title }).then(() => setEditing(null)),
                                            'Đã cập nhật chương.'
                                          )
                                        }
                                        className="p-2 rounded-lg text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button title="Huỷ" onClick={() => setEditing(null)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 cursor-pointer">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      title="Sửa số / tên chương"
                                      disabled={busy}
                                      onClick={() => setEditing({ id: c.id, chapterNumber: c.chapterNumber, title: c.title ?? '' })}
                                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    title={c.status === 'published' ? 'Chuyển về nháp' : 'Xuất bản'}
                                    disabled={busy}
                                    onClick={() =>
                                      runChapterAction(
                                        c.id,
                                        () => uploaderApi.updateChapter(c.id, { status: c.status === 'published' ? 'draft' : 'published' }),
                                        c.status === 'published' ? `Chương ${c.chapterNumber} đã chuyển về nháp.` : `Đã xuất bản chương ${c.chapterNumber}.`
                                      )
                                    }
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 cursor-pointer"
                                  >
                                    {c.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    title="Xoá chương"
                                    disabled={busy}
                                    onClick={() => {
                                      if (window.confirm(`Xoá chương ${c.chapterNumber}? Không thể hoàn tác.`)) {
                                        runChapterAction(c.id, () => uploaderApi.deleteChapter(c.id), `Đã xoá chương ${c.chapterNumber}.`);
                                      }
                                    }}
                                    className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'info' &&
        (isMangaDex ? (
          <Card className="space-y-3 text-sm text-gray-300">
            <p className="text-gray-400">Thông tin truyện MangaDex được cập nhật tự động khi cào lại.</p>
            {manga.description && <p className="whitespace-pre-line leading-relaxed">{manga.description}</p>}
            {manga.tags && manga.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {manga.tags.map((t) => (
                  <span key={t.id} className="px-2 py-0.5 rounded-md bg-gray-800 text-xs text-gray-300">{t.name}</span>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <MangaForm
              key={manga.updatedAt}
              initial={manga}
              tags={tags}
              submitLabel="Lưu thay đổi"
              onSubmit={async (payload, coverFile) => {
                let updated = await uploaderApi.updateManga(manga.id, payload);
                if (coverFile) updated = await uploaderApi.uploadCover(manga.id, coverFile);
                setManga(updated);
                setError('');
                setNotice(updated.approvalStatus === 'pending' && manga.approvalStatus === 'rejected'
                  ? 'Đã lưu và gửi duyệt lại.'
                  : 'Đã lưu thông tin truyện.');
              }}
            />
          </Card>
        ))}
    </div>
  );
}
