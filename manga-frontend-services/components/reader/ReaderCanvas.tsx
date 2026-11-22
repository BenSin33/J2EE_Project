'use client';
import { useEffect, useRef, useState } from 'react';
import { ReaderPage } from '@/types/reader';
function PageImage({ page, eager }: { page: ReaderPage; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div
    data-reader-page={page.pageNumber}
    className="relative w-full bg-[#16161a] rounded-lg overflow-hidden"
    style={failed ? { minHeight: '420px' } : undefined}
  >
    {failed ? <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 p-6 text-center border border-gray-800/60 rounded-lg" role="alert">
      <p className="font-semibold text-gray-200">Không tải được ảnh trang {page.pageNumber}.</p>
      {page.imageUrl.includes('uploads.mangadex.org') && (
        <p className="max-w-md text-xs text-gray-400 leading-relaxed">
          Máy chủ <code className="text-amber-300">uploads.mangadex.org</code> hiện đang bật cổng xác thực chống Bot (<code className="text-amber-300">POWBlock</code>) trả về HTML thay vì ảnh trực tiếp nên trình duyệt chặn bằng <code className="text-rose-400">ERR_BLOCKED_BY_ORB</code>.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        <button className="rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-xs font-medium transition cursor-pointer" onClick={() => { setFailed(false); setAttempt(a => a + 1); }}>Thử lại ảnh</button>
        <a href={page.imageUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-300 px-4 py-2 text-xs font-medium transition">
          Mở link ảnh gốc ↗
        </a>
      </div>
    </div> : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={attempt}
        src={page.imageUrl}
        alt={'Trang ' + page.pageNumber}
        loading={eager ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="block h-auto w-full object-contain"
      />
    )}
  </div>;
}
export function ReaderCanvas({ pages, initialPage = 1, onPageChange }: { pages: ReaderPage[]; initialPage?: number; onPageChange?: (page: number) => void }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const nodes = Array.from(element.querySelectorAll<HTMLElement>('[data-reader-page]'));
    const target = nodes.find(node => Number(node.dataset.readerPage) === initialPage);
    if (initialPage > 1) target?.scrollIntoView({ block: 'start', behavior: 'instant' });
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length) onPageChange?.(Number((visible[0].target as HTMLElement).dataset.readerPage));
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [pages, initialPage, onPageChange]);
  return <div ref={container} className="flex w-full flex-col items-center bg-[#0a0a0c] py-4">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-2">
      {pages.map((page, index) => <PageImage key={page.pageNumber + ':' + page.imageUrl} page={page} eager={index < 2} />)}
    </div>
  </div>;
}
