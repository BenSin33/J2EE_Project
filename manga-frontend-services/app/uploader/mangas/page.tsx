'use client';

// Thành viên 2 - Danh sách truyện của Uploader (Admin xem được cả nguồn MangaDex)
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { BookPlus, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { isAdminRole, uploaderApi } from '@/lib/uploaderApi';
import { useAuthStore } from '@/store/authStore';
import {
  ApprovalBadge,
  CoverImage,
  ErrorBox,
  PageHeader,
  SourceBadge,
  STATUS_LABELS,
  inputClass,
  primaryButton,
  secondaryButton,
} from '@/components/uploader/ui';
import type { MangaSource, PageResult, UploaderMangaSummary } from '@/types/uploader';

const SOURCES: { value: MangaSource; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'mangadex', label: 'MangaDex' },
  { value: 'all', label: 'Tất cả' },
];

export default function UploaderMangasPage() {
  const { user } = useAuthStore();
  const admin = isAdminRole(user?.role);
  const [source, setSource] = useState<MangaSource>('local');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  // Kết quả gắn với bộ lọc đã tải; khác bộ lọc hiện tại nghĩa là đang tải
  const [result, setResult] = useState<{ key: string; data: PageResult<UploaderMangaSummary> | null; error: string }>({
    key: '',
    data: null,
    error: '',
  });
  const requestKey = `${source}|${keyword}|${page}`;
  const loading = result.key !== requestKey;
  const { data, error } = result;

  useEffect(() => {
    let cancelled = false;
    uploaderApi
      .listMangas({ source, keyword, page, size: 12 })
      .then((d) => !cancelled && setResult({ key: requestKey, data: d, error: '' }))
      .catch((err: Error) => !cancelled && setResult((prev) => ({ key: requestKey, data: prev.data, error: err.message })));
    return () => {
      cancelled = true;
    };
  }, [source, keyword, page, requestKey]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
    setKeyword(keywordInput.trim());
  };

  return (
    <div>
      <PageHeader
        title="Truyện của tôi"
        description="Chọn một truyện để sửa thông tin và upload chương."
        actions={
          <Link href="/uploader/mangas/new" className={primaryButton}>
            <BookPlus className="w-4 h-4" /> Đăng truyện mới
          </Link>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <form onSubmit={onSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Tìm theo tên truyện..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>
          <button type="submit" className={`${secondaryButton} h-11`}>Tìm</button>
        </form>
        {admin && (
          <div className="flex rounded-xl border border-gray-800 bg-[#16161f] p-1 shrink-0" role="tablist">
            {SOURCES.map((s) => (
              <button
                key={s.value}
                role="tab"
                aria-selected={source === s.value}
                onClick={() => {
                  setSource(s.value);
                  setPage(0);
                }}
                className={`px-4 h-9 rounded-lg text-sm font-medium transition cursor-pointer ${
                  source === s.value ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách...
        </div>
      ) : data && data.content.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-800">
          <p className="text-sm text-gray-400">{keyword ? `Không có truyện nào khớp "${keyword}".` : 'Chưa có truyện nào.'}</p>
          {!keyword && source !== 'mangadex' && (
            <Link href="/uploader/mangas/new" className={`${primaryButton} mt-4`}>Đăng truyện mới</Link>
          )}
        </div>
      ) : (
        data && (
          <>
            <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4 ${loading ? 'opacity-60' : ''}`}>
              {data.content.map((m) => (
                <Link
                  key={m.id}
                  href={`/uploader/mangas/${m.id}`}
                  className="group rounded-2xl overflow-hidden border border-gray-800 bg-[#16161f] hover:border-purple-500/50 transition flex flex-col"
                >
                  <div className="relative">
                    <CoverImage src={m.coverImageUrl} alt={m.title} className="w-full aspect-[3/4] border-0" />
                    <div className="absolute top-2 left-2">
                      <SourceBadge source={m.source} />
                    </div>
                  </div>
                  <div className="p-3 space-y-1.5 flex-1">
                    <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-purple-300 transition">{m.title}</p>
                    <ApprovalBadge status={m.approvalStatus} />
                    <p className="text-xs text-gray-500">
                      {m.chapterCount} chương · {STATUS_LABELS[m.status] ?? m.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button className={secondaryButton} disabled={page === 0 || loading} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="w-4 h-4" /> Trước
                </button>
                <span className="text-sm text-gray-400">
                  Trang {data.page + 1} / {data.totalPages}
                </span>
                <button className={secondaryButton} disabled={page + 1 >= data.totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                  Sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
