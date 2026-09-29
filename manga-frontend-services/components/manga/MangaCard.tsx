import Image from 'next/image';
import Link from 'next/link';
import { Manga } from '@/types/manga';

interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link href={`/manga/${manga.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#16161a] border border-gray-800">
        <Image
          src={manga.coverArtUrl}
          alt={manga.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold text-white backdrop-blur-sm">
          {manga.status}
        </div>
      </div>
      <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 group-hover:text-blue-400 transition-colors">
        {manga.title}
      </h3>
    </Link>
  );
}
