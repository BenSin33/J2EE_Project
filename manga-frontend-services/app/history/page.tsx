'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getReadingHistory } from '@/lib/api';
import { ReadingHistory } from '@/types/reader';
function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const fmt = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  if (seconds < 60) return 'Vừa đọc';
  if (seconds < 3600) return fmt.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return fmt.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 2592000) return fmt.format(-Math.floor(seconds / 86400), 'day');
  return fmt.format(-Math.floor(seconds / 2592000), 'month');
}
function HistoryList({ page }: { page: number }) {
  const [data, setData] = useState<ReadingHistory | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getReadingHistory(page, controller.signal).then(result => { if (!controller.signal.aborted) setData(result); }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không tải được lịch sử.');
    });
    return () => controller.abort();
  }, [page, attempt]);
  if (error) return <div role="alert" className="rounded-xl border border-gray-700 p-6"><p>{error}</p><button className="mt-4 rounded bg-violet-600 px-4 py-2" onClick={() => { setError(''); setAttempt(n => n + 1); }}>Thử lại</button></div>;
  if (!data) return <p role="status">Đang tải lịch sử…</p>;
  if (!data.items.length) return <p>Chưa có truyện trong trang lịch sử này.</p>;
  return <><p className="mb-4 text-gray-400">{data.totalElements} truyện · trang {page + 1}</p><div className="space-y-4">
    {data.items.map(entry => <article key={entry.mangaId} className="flex gap-4 rounded-xl border border-gray-800 bg-[#16161a] p-4">
      {entry.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.coverImageUrl} alt="" width={80} height={112} className="h-28 w-20 rounded object-cover" />
      )}
      <div className="flex-1"><h2 className="text-lg font-semibold">{entry.title || 'Truyện không còn khả dụng'}</h2>
        <p className="text-gray-400">{entry.chapterTitle || 'Chương đã đọc'} · Trang {entry.lastPage}/{entry.totalPages || '?'}</p>
        <p>{entry.percentage.toFixed(1)}% · <time dateTime={entry.readAt}>{relativeTime(entry.readAt)}</time></p>
        <progress value={entry.percentage} max={100} className="mt-2 w-full accent-violet-500" aria-label="Tiến độ chương" />
        {entry.available ? <Link className="mt-2 inline-block rounded bg-violet-600 px-4 py-2" href={'/chapter/' + entry.chapterId}>Đọc tiếp</Link> : <p className="mt-2 text-amber-300">Không còn khả dụng</p>}
      </div>
    </article>)}
  </div></>;
}
export default function HistoryPage() {
  const [page, setPage] = useState(0);
  return <main className="min-h-screen bg-[#0a0a0c] px-4 py-8 text-gray-100"><div className="mx-auto max-w-4xl">
    <Link href="/" className="text-violet-300">← Trang chủ</Link><h1 className="mb-2 mt-6 text-3xl font-bold">Lịch sử đọc</h1>
    <p className="mb-6 text-gray-400">Tiếp tục từ vị trí đã lưu gần nhất.</p><HistoryList key={page} page={page} />
    <nav className="mt-6 flex gap-4" aria-label="Phân trang lịch sử"><button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded bg-gray-700 px-4 py-2 disabled:opacity-40">Trang trước</button><button onClick={() => setPage(p => p + 1)} className="rounded bg-gray-700 px-4 py-2">Trang sau</button></nav>
  </div></main>;
}
