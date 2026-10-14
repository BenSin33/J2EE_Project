'use client';
import { useEffect, useRef, useState } from 'react';
import { ReaderPage } from '@/types/reader';
function PageImage({ page, eager }: { page: ReaderPage; eager: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <div data-reader-page={page.pageNumber} className="relative w-full bg-[#16161a]" style={{ aspectRatio: page.width + '/' + page.height }}>
    {failed ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" role="alert">
      <p>Không tải được ảnh trang {page.pageNumber}.</p>
      <button className="rounded bg-gray-700 px-4 py-2" onClick={() => { setFailed(false); setAttempt(a => a + 1); }}>Thử lại ảnh</button>
    </div> : (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={attempt} src={page.imageUrl} alt={'Trang ' + page.pageNumber} width={page.width} height={page.height}
        loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} className="block h-auto w-full" />
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
