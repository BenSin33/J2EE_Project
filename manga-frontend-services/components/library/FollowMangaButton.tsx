'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBookmark } from '@/lib/api';
import { Bookmark } from '@/types/bookmark';
import { BookmarkControls } from './BookmarkControls';
export function FollowMangaButton({ mangaId }: { mangaId: string }) {
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    getBookmark(mangaId,controller.signal).then(value => { if (!controller.signal.aborted) { setBookmark(value); setLoaded(true); } }).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không tải được trạng thái theo dõi.');
    });
    return () => controller.abort();
  },[mangaId,validId,attempt]);
  return <section className="mt-6 space-y-3 rounded-xl border border-gray-800 bg-[#16161a] p-4" aria-label="Theo dõi truyện">
    {!validId ? <p>Truyện chưa sẵn sàng để theo dõi.</p> : error ? <div role="alert"><p>{error}</p><button className="mt-2 rounded bg-gray-700 px-3 py-1" onClick={() => { setError(''); setAttempt(n => n + 1); }}>Thử lại</button></div> : !loaded ? <p role="status">Đang tải trạng thái theo dõi…</p> : <BookmarkControls mangaId={mangaId} bookmark={bookmark} onChanged={setBookmark} />}
    <Link href="/library" className="inline-block text-violet-300">Mở Tủ sách →</Link>
  </section>;
}
