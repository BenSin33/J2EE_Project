import { Manga } from '@/types/manga';

export function MangaInfo({ manga }: { manga: Manga }) {
  return (
    <div className="bg-[#16161a] rounded-xl p-6 border border-gray-800">
      <h3 className="text-xl font-bold mb-4 text-gray-100">Synopsis</h3>
      <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
        {manga.description}
      </p>
      
      <div className="flex flex-wrap gap-2">
        {manga.tags.map(tag => (
          <span 
            key={tag.id} 
            className="px-3 py-1 bg-gray-800 text-gray-300 rounded-md text-sm font-medium hover:bg-gray-700 transition cursor-pointer"
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
