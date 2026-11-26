'use client';
import { CommentSection } from '@/components/comments/CommentSection';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DemoProgressReader } from '@/components/reader/DemoProgressReader';
import { ReaderToolbar } from '@/components/reader/ReaderToolbar';
import { SettingsModal } from '@/components/reader/SettingsModal';
import { fetchReaderChapter } from '@/lib/api';
import { ReaderChapter } from '@/types/reader';
function ChapterReader({ chapterId }: { chapterId: string }) {
  const [chapter, setChapter] = useState<ReaderChapter | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetchReaderChapter(chapterId, controller.signal).then(setChapter).catch(err => {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không kết nối được backend.');
    });
    return () => controller.abort();
  }, [chapterId, attempt]);
  if (error) return <main className="min-h-screen bg-[#0a0a0c] p-8 text-center text-gray-100" role="alert"><p>{error}</p><div className="mt-4 flex justify-center gap-3"><button className="rounded bg-gray-700 px-4 py-2" onClick={() => { setError(''); setChapter(null); setAttempt(a => a + 1); }}>Thử lại</button><Link href="/" className="rounded bg-violet-600 px-4 py-2 text-white">← Về trang chủ</Link></div></main>;
  if (!chapter) return <main className="min-h-screen bg-[#0a0a0c] p-8 text-center text-gray-100" role="status">Đang tải chương…</main>;
  return <main className="relative min-h-screen bg-[#0a0a0c] pb-24 text-gray-100">
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-[#16161a]/95 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-bold text-white">Chương {chapter.chapterNumber} — {chapter.title}</h1>
          <p className="text-xs text-gray-400">{chapter.totalPages} trang · {chapter.source}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/" className="rounded-lg bg-white/5 px-3 py-1.5 text-gray-200 transition hover:bg-white/10 hover:text-white">← Trang chủ</Link>
          <Link href={`/manga/${chapter.mangaId}`} className="rounded-lg bg-purple-500/15 px-3 py-1.5 text-purple-300 transition hover:bg-purple-500/25">Chi tiết truyện</Link>
          <Link href="/library" className="text-gray-300 transition hover:text-white">Tủ sách</Link>
          <Link href="/history" className="text-gray-300 transition hover:text-white">Lịch sử đọc</Link>
        </nav>
      </div>
    </header>
    {chapter.chapterId === '33333333-3333-4333-8333-333333333333' ? <DemoProgressReader chapter={chapter} /> : <DemoProgressReader chapter={chapter} demo={false} />}
    <CommentSection key={chapter.chapterId} mangaId={chapter.mangaId} chapterId={chapter.chapterId} />
    <ReaderToolbar mangaId={chapter.mangaId} chapterNumber={chapter.chapterNumber} onOpenSettings={() => setIsSettingsOpen(true)} />
    <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
  </main>;
}
export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  return <ChapterReader key={chapterId} chapterId={chapterId} />;
}
