import Image from 'next/image';
import { Manga } from '@/types/manga';
import { RatingStar } from './RatingStar';

interface MangaHeroProps {
  manga: Manga;
}

export function MangaHero({ manga }: MangaHeroProps) {
  return (
    <div className="relative w-full h-[45vh] min-h-[400px] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={manga.coverArtUrl}
          alt={`${manga.title} background`}
          fill
          className="object-cover opacity-20 blur-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-transparent" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
        <div className="flex flex-col md:flex-row gap-8 items-end md:items-end w-full">
          <div className="flex-shrink-0 w-40 md:w-56 aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl border border-gray-700">
            <Image
              src={manga.coverArtUrl}
              alt={manga.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">{manga.title}</h1>
            {manga.authors.length > 0 && (
              <h2 className="text-lg text-gray-400 mb-4 font-medium">{manga.authors.map(a => a.name).join(', ')}</h2>
            )}
            <div className="flex items-center gap-4">
              <RatingStar rating={4.8} />
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md">
                {manga.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
