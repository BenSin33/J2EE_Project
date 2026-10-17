'use client';

// Thành viên 2 - Tổng quan Uploader Dashboard
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, BookOpen, BookPlus, Clock, DownloadCloud, FileText, Loader2, XCircle } from 'lucide-react';
import { uploaderApi } from '@/lib/uploaderApi';
import { ApprovalBadge, Card, CoverImage, ErrorBox, PageHeader, SourceBadge, primaryButton, secondaryButton } from '@/components/uploader/ui';
import type { UploaderMangaSummary, UploaderStats } from '@/types/uploader';

export default function UploaderOverviewPage() {
  const [stats, setStats] = useState<UploaderStats | null>(null);
  const [recent, setRecent] = useState<UploaderMangaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([uploaderApi.stats(), uploaderApi.listMangas({ source: 'local', size: 6 })])
      .then(([s, page]) => {
        setStats(s);
        setRecent(page.content);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải số liệu...
      </div>
    );
  }
  if (error || !stats) return <ErrorBox message={error || 'Không tải được dữ liệu'} />;

  const cards = [
    { label: 'Truyện LOCAL', value: stats.localMangas, icon: BookOpen, color: 'text-purple-300 bg-purple-500/10 border-purple-500/20' },
    { label: 'Chương đã đăng', value: stats.totalChapters, icon: FileText, color: 'text-sky-300 bg-sky-500/10 border-sky-500/20' },
    { label: 'Chờ duyệt', value: stats.pendingMangas, icon: Clock, color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
    { label: 'Bị từ chối', value: stats.rejectedMangas, icon: XCircle, color: 'text-rose-300 bg-rose-500/10 border-rose-500/20' },
  ];
  if (stats.admin) {
    cards.push({ label: 'Truyện MangaDex', value: stats.mangadexMangas, icon: DownloadCloud, color: 'text-orange-300 bg-orange-500/10 border-orange-500/20' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan"
        description={stats.admin ? 'Bạn đang xem toàn bộ truyện LOCAL của hệ thống (quyền Admin).' : 'Thống kê truyện và chương bạn đã đăng.'}
        actions={
          <>
            <Link href="/uploader/mangas/new" className={primaryButton}>
              <BookPlus className="w-4 h-4" /> Đăng truyện mới
            </Link>
            {stats.canImportMangaDex && (
              <Link href="/uploader/mangadex" className={secondaryButton}>
                <DownloadCloud className="w-4 h-4" /> Cào MangaDex
              </Link>
            )}
          </>
        }
      />

      {!stats.cloudinaryEnabled && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold">Server chưa cấu hình Cloudinary</p>
            <p className="text-xs text-amber-200/80 mt-1">
              Vẫn tạo và sửa thông tin truyện được, nhưng chưa upload được ảnh bìa và trang chương. Cần đặt cloudinary.cloud-name / api-key / api-secret cho backend.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="!p-4">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${c.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
            </Card>
          );
        })}
      </div>

      {stats.draftChapters > 0 && (
        <p className="text-xs text-gray-400">
          Có <span className="text-amber-300 font-semibold">{stats.draftChapters}</span> chương đang ở trạng thái nháp, người đọc chưa thấy.
        </p>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Truyện cập nhật gần đây</h3>
          <Link href="/uploader/mangas" className="text-xs text-purple-400 hover:text-purple-300">Xem tất cả →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-10">
            <BookPlus className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Bạn chưa đăng truyện nào.</p>
            <Link href="/uploader/mangas/new" className={`${primaryButton} mt-4`}>Đăng truyện đầu tiên</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {recent.map((m) => (
              <Link
                key={m.id}
                href={`/uploader/mangas/${m.id}`}
                className="flex gap-3 p-3 rounded-xl border border-gray-800 bg-[#121218] hover:border-purple-500/40 transition"
              >
                <CoverImage src={m.coverImageUrl} alt={m.title} className="w-14 h-20 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-semibold text-white line-clamp-2">{m.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <ApprovalBadge status={m.approvalStatus} />
                    <SourceBadge source={m.source} />
                  </div>
                  <p className="text-xs text-gray-500">{m.chapterCount} chương</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
