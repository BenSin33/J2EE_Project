import { notFound } from 'next/navigation';
import { Manga, Chapter } from '../../types/manga';
import { Clock, Eye, Star, BookOpen, Bookmark, List } from 'lucide-react';
import Link from 'next/link';

// Mock data for chapters since backend doesn't have it yet
const mockChapters: Chapter[] = Array.from({ length: 15 }, (_, i) => ({
  id: `chap-${15 - i}`,
  mangaId: 'mock', // Will be replaced by actual ID
  chapterNumber: 15 - i,
  title: i % 3 === 0 ? 'Hành trình mới' : null,
  viewsCount: Math.floor(Math.random() * 50000) + 1000,
  createdAt: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

async function getManga(id: string): Promise<Manga | null> {
  try {
    const res = await fetch(`http://localhost:8080/api/v1/mangas/${id}`, {
      // Use cache: 'no-store' if you want fresh data every time, or revalidate
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch manga');
    }
    
    return res.json();
  } catch (error) {
    console.error('Error fetching manga:', error);
    return null;
  }
}

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manga = await getManga(id);

  if (!manga) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200 pb-20">
      {/* Hero Section with Backdrop */}
      <div className="relative w-full overflow-hidden">
        {/* Blurred Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110"
          style={{ backgroundImage: `url(${manga.coverImageUrl || 'https://via.placeholder.com/800x600'})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/60 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0 w-64 md:w-72 lg:w-80 group">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]">
                <img
                  src={manga.coverImageUrl || 'https://via.placeholder.com/600x800'}
                  alt={manga.title}
                  className="w-full h-full object-cover"
                />
                {/* Status Badge */}
                <div className="absolute top-3 left-3 bg-[#141414]/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg">
                  {manga.status || 'Ongoing'}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-end space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  {manga.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  {manga.ratingScore && (
                    <div className="flex items-center text-amber-400 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                      <Star className="w-4 h-4 mr-1.5 fill-current" />
                      {manga.ratingScore.toFixed(1)}
                    </div>
                  )}
                  {manga.viewsCount && (
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1.5" />
                      {manga.viewsCount.toLocaleString()}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {/* Placeholder for genres */}
                    <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">Action</span>
                    <span className="bg-white/5 border border-white/10 px-3 py-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer">Fantasy</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg shadow-red-600/20">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Đọc từ đầu
                </button>
                <button className="flex items-center bg-[#141414] hover:bg-[#1f1f1f] border border-white/10 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
                  Đọc mới nhất
                </button>
                <button className="flex items-center bg-[#141414] hover:bg-[#1f1f1f] border border-white/10 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 tooltip-trigger" title="Theo dõi">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <div className="bg-[#141414]/50 backdrop-blur-sm border border-white/5 rounded-xl p-5 mt-4">
                <h3 className="text-white font-semibold mb-2">Tóm tắt nội dung</h3>
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-300">
                  {manga.description || 'Chưa có thông tin mô tả cho truyện này.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chapter List Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-600/10 rounded-lg">
            <List className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Danh sách chương</h2>
        </div>

        <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden shadow-xl">
          <div className="flex flex-col">
            {mockChapters.map((chapter, index) => (
              <Link 
                href={`/manga/${id}/chapter/${chapter.chapterNumber}`} // Placeholder link
                key={chapter.id} 
                className={`flex items-center justify-between p-4 hover:bg-white/5 transition-colors duration-200 group ${index !== mockChapters.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 text-sm font-medium w-6 text-center">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-white font-medium group-hover:text-red-400 transition-colors">
                      Chương {chapter.chapterNumber}
                      {chapter.title && <span className="text-gray-400 font-normal ml-2 hidden sm:inline">- {chapter.title}</span>}
                    </h4>
                    <span className="text-xs text-gray-500 mt-1 block sm:hidden">
                      {new Date(chapter.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {new Date(chapter.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric', month: '2-digit', day: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 w-16 justify-end">
                    <Eye className="w-3.5 h-3.5 mr-1.5 group-hover:text-red-400 transition-colors" />
                    <span className="group-hover:text-red-400 transition-colors">
                      {chapter.viewsCount > 1000 ? `${(chapter.viewsCount / 1000).toFixed(1)}k` : chapter.viewsCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
