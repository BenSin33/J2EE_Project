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
  if (error) return <main className="p-8 text-center" role="alert"><p>{error}</p><button className="mt-4 rounded bg-gray-700 px-4 py-2" onClick={() => { setError(''); setChapter(null); setAttempt(a => a + 1); }}>Thử lại</button></main>;
  if (!chapter) return <main className="p-8 text-center" role="status">Đang tải chương…</main>;
  return <main className="relative min-h-screen bg-[#0a0a0c] pb-24 text-gray-100">
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-[#16161a]/90 p-4 backdrop-blur-md"><div className="mx-auto max-w-4xl">
      <h1 className="font-bold">Chương {chapter.chapterNumber} — {chapter.title}</h1><p className="text-sm text-gray-400">{chapter.totalPages} trang · {chapter.source}</p>
      <Link href="/history" className="text-sm text-violet-300">Lịch sử đọc</Link>
    </div></header>
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
