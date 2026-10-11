'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReaderCanvas } from './ReaderCanvas';
import { getDemoProgress, saveDemoProgress, getReadingProgress, saveReadingProgress, ReaderApiError } from '@/lib/api';
import { ReaderChapter, ReadingProgress } from '@/types/reader';

export function DemoProgressReader({ chapter, demo = true }: { chapter: ReaderChapter; demo?: boolean }) {
  const [canSave, setCanSave] = useState(false);
  const [initial, setInitial] = useState<number | null>(null);
  const [current, setCurrent] = useState(1);
  const [saved, setSaved] = useState<ReadingProgress | null>(null);
  const [status, setStatus] = useState('Đang tải vị trí đã lưu…');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const latest = useRef(1);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    const controller = new AbortController();
    (demo ? getDemoProgress : getReadingProgress)(chapter.mangaId, controller.signal).then(progress => {
      if (controller.signal.aborted) return;
      const page = progress?.chapterId === chapter.chapterId ? Math.max(1, Math.min(progress.lastPage, chapter.totalPages)) : 1;
      latest.current = page;
      setCanSave(true);
      setCurrent(page); setInitial(page); setSaved(progress);
      setStatus(progress ? 'Đã khôi phục vị trí.' : 'Chưa có vị trí đã lưu.');
    }).catch(err => {
      if (controller.signal.aborted) return;
      if (err instanceof ReaderApiError && (err.status === 401 || err.status === 403)) {
        setCanSave(false); setInitial(1); setStatus(err.message);
      } else setStatus('Không tải được tiến độ. Bấm thử lại.');
    });
    return () => { active.current = false; controller.abort(); };
  }, [chapter, loadAttempt, demo]);
  const onPageChange = useCallback((page: number) => { latest.current = page; setCurrent(page); }, []);
  useEffect(() => {
    if (!canSave || initial === null || (saved?.lastPage === current && saved.chapterId === chapter.chapterId)) return;
    const timer = setTimeout(() => {
      // Serialize saves so a slow old response cannot overwrite a newer page.
      queue.current = queue.current.catch(() => undefined).then(async () => {
        if (!active.current || latest.current !== current) return;
        setStatus('Đang lưu…');
        try {
          const progress = await (demo ? saveDemoProgress : saveReadingProgress)(chapter.mangaId, chapter.chapterId, current);
          if (active.current && latest.current === current) { setSaved(progress); setStatus('Đã lưu.'); }
        } catch { if (active.current && latest.current === current) setStatus('Lưu thất bại. Bấm thử lại hoặc tiếp tục cuộn.'); }
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [chapter, current, initial, saved, saveAttempt, demo, canSave]);
  return <>
    <div className="mx-auto max-w-4xl px-4 py-2 text-sm" aria-live="polite">
      <p>{demo ? 'Tiến độ demo theo phiên trình duyệt — chưa lưu vào tài khoản.' : 'Tiến độ đọc của tài khoản'}</p>
      <p>Trang {current}/{chapter.totalPages} · {(current / chapter.totalPages * 100).toFixed(1)}% · {status}</p>
      <button className="mt-2 rounded bg-gray-700 px-3 py-1" onClick={() => !canSave || initial === null ? setLoadAttempt(n => n + 1) : setSaveAttempt(n => n + 1)}>Thử lại tiến độ</button>
    </div>
    {initial !== null && <ReaderCanvas pages={chapter.pages} initialPage={initial} onPageChange={onPageChange} />}
  </>;
}
