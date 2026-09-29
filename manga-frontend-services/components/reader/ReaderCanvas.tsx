'use client';
import { ChapterPage } from '@/types/manga';
import { resolveImageUrl } from '@/lib/image-resolver';

interface ReaderCanvasProps {
  pages: ChapterPage[];
  sourceType: 'mangadex_at_home' | 's3';
  hash: string;
}

export function ReaderCanvas({ pages, sourceType, hash }: ReaderCanvasProps) {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[#0a0a0c] py-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-2">
        {pages.map((page, index) => (
          <div key={page.id} className="relative w-full flex justify-center bg-[#16161a]">
            {/* Sử dụng thẻ img tự nhiên có loading="lazy" và set aspect-ratio/min-height theo yêu cầu để tránh layout shift */}
            <img
              src={resolveImageUrl(sourceType, hash, page.url)}
              alt={`Page ${page.pageNumber}`}
              loading={index < 2 ? 'eager' : 'lazy'}
              className="max-w-full h-auto block"
              style={{ minHeight: '800px' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
