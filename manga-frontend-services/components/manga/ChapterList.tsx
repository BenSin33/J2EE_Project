import Link from 'next/link';
import { Chapter } from '@/types/manga';
import { Clock } from 'lucide-react';

export function ChapterList({ chapters }: { chapters: Chapter[] }) {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-100">Chapters</h3>
      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {chapters.length === 0 ? (
          <p className="text-gray-400 italic">No chapters available.</p>
        ) : (
          chapters.map(chapter => (
            <Link 
              key={chapter.id} 
              href={`/chapter/${chapter.id}`}
              className="flex items-center justify-between p-4 bg-[#16161a] border border-gray-800 rounded-xl hover:border-blue-500 hover:bg-[#1a1a24] transition group"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-gray-200 group-hover:text-blue-400 transition">
                  Chapter {chapter.chapterNumber} {chapter.title && `: ${chapter.title}`}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1.5" />
                {new Date(chapter.publishAt).toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
