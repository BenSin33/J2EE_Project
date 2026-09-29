import Image from "next/image";
import Link from "next/link";
import { Manga } from "../types/manga";

interface MangaCardProps {
  manga: Manga;
}

export default function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link
      href={`/manga/${manga.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:border-zinc-700 hover:shadow-lg"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
        <Image
          src={manga.coverImageUrl || "https://placehold.co/300x400/png?text=No+Cover"}
          alt={manga.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {manga.status && (
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {manga.status}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-blue-400">
          {manga.title}
        </h3>
        {manga.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
            {manga.description}
          </p>
        )}
      </div>
    </Link>
  );
}