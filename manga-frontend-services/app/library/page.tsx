'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLibrary } from '@/lib/api';
import { Library, BOOKMARK_FOLDERS } from '@/types/bookmark';
import { BookmarkControls } from '@/components/library/BookmarkControls';
function LibraryContent({ folder }: { folder: string }) {
  const [data,setData] = useState<Library | null>(null);
  const [page,setPage] = useState(0);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getLibrary(page,folder,controller.signal).then(value => {
      if (controller.signal.aborted) return;
      if (!value.items.length && page > 0) { setPage(p => p - 1); return; }
      setData(value);
    }).catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không tải được Tủ sách.'); });
    return () => controller.abort();
  },[page,folder,attempt]);
  function reload() { setError(''); setData(null); setAttempt(n => n + 1); }
  function go(next: number) { setData(null); setError(''); setPage(next); }
  if (error) return <div role="alert" className="rounded-xl border border-gray-700 p-6"><p>{error}</p><button className="mt-4 rounded bg-violet-600 px-4 py-2" onClick={reload}>Thử lại</button></div>;
  if (!data) return <p role="status">Đang tải Tủ sách…</p>;
  if (!data.items.length) return <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center"><p>{folder ? 'Chưa có truyện trong trạng thái này.' : 'Tủ sách của bạn đang trống.'}</p><Link href="/" className="mt-3 inline-block text-violet-300">Khám phá truyện</Link></div>;
  return <><p className="mb-4 text-gray-400">{data.totalElements} truyện</p><div className="space-y-4">
    {data.items.map(item => <article key={item.mangaId} className="flex flex-col gap-4 rounded-xl border border-gray-800 bg-[#16161a] p-4 sm:flex-row">
      {item.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.coverImageUrl} alt="" width={96} height={144} className="h-36 w-24 rounded-lg object-cover" />
      )}
      <div className="min-w-0 flex-1 space-y-3"><h2 className="text-xl font-semibold">{item.available ? <Link href={'/manga/' + item.mangaId}>{item.title || 'Truyện'}</Link> : item.title || 'Truyện không còn khả dụng'}</h2>
        {!item.available && <p className="text-amber-300">Không còn khả dụng</p>}
        <p className="text-sm text-gray-400">Theo dõi từ {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
        <BookmarkControls mangaId={item.mangaId} bookmark={item} onChanged={reload} />
      </div>
    </article>)}
  </div><nav aria-label="Phân trang Tủ sách" className="mt-6 flex items-center gap-4"><button disabled={page===0} onClick={() => go(page-1)} className="rounded bg-gray-700 px-4 py-2 disabled:opacity-40">Trang trước</button><span>Trang {page+1}</span><button disabled={(page+1)*data.size >= data.totalElements} onClick={() => go(page+1)} className="rounded bg-gray-700 px-4 py-2 disabled:opacity-40">Trang sau</button></nav></>;
}
export default function LibraryPage() {
  const [folder,setFolder] = useState('');
  return <main className="min-h-screen bg-[#0a0a0c] px-4 py-8 text-gray-100"><div className="mx-auto max-w-5xl">
    <nav className="flex gap-4"><Link href="/" className="text-violet-300">← Trang chủ</Link><Link href="/history" className="text-violet-300">Lịch sử đọc</Link></nav>
    <h1 className="mb-2 mt-6 text-3xl font-bold">Tủ sách</h1><p className="mb-6 text-gray-400">Quản lý truyện bạn theo dõi và trạng thái đọc.</p>
    <label className="mb-6 block">Lọc trạng thái <select className="ml-2 rounded border border-gray-700 bg-gray-900 px-3 py-2" value={folder} onChange={event => setFolder(event.target.value)}><option value="">Tất cả</option>{Object.entries(BOOKMARK_FOLDERS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <LibraryContent key={folder} folder={folder} />
  </div></main>;
}
