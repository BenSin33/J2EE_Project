import { MangaHero } from '@/components/manga/MangaHero';
import { MangaInfo } from '@/components/manga/MangaInfo';
import { ChapterList } from '@/components/manga/ChapterList';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { Manga, Chapter } from '@/types/manga';
// import { fetchMangaById, fetchChaptersByMangaId } from '@/lib/api';

export default async function MangaDetailPage({ params }: { params: { id: string } }) {
  // Mock data fetching based on the ID for layout demonstration
  const manga: Manga = {
    id: params.id,
    title: 'Solo Leveling',
    description: '10 years ago, after "the Gate" that connected the real world with the monster world opened, some of the ordinary, everyday people received the power to hunt monsters within the Gate. They are known as "Hunters". However, not all Hunters are powerful. My name is Sung Jin-Woo, an E-rank Hunter. I\'m someone who has to risk his life in the lowliest of dungeons, the "World\'s Weakest". Having no skills whatsoever to display, I barely earned the required money by fighting in low-leveled dungeons... at least until I found a hidden dungeon with the hardest difficulty within the D-rank dungeons!',
    status: 'ONGOING',
    contentRating: 'SAFE',
    coverArtUrl: 'https://uploads.mangadex.org/covers/32d76d19-8a05-4db0-9fc2-e0b0648fe9d0/37452d3c-9149-43c3-88bc-38fbcf6a26d7.jpg',
    tags: [
      { id: '1', name: 'Action' },
      { id: '2', name: 'Adventure' },
      { id: '3', name: 'Fantasy' }
    ],
    authors: [{ id: 'a1', name: 'Chugong' }],
    artists: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const chapters: Chapter[] = [
    {
      id: 'c1',
      mangaId: params.id,
      title: 'The Awakening',
      chapterNumber: '1',
      pages: [],
      publishAt: new Date().toISOString(),
      readableAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'c2',
      mangaId: params.id,
      title: 'Dungeon',
      chapterNumber: '2',
      pages: [],
      publishAt: new Date().toISOString(),
      readableAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 w-full pb-12">
        <MangaHero manga={manga} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <MangaInfo manga={manga} />
            <ChapterList chapters={chapters} />
          </div>
          <div className="hidden lg:block space-y-6">
            <div className="bg-[#16161a] border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 text-white">About the Author</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {manga.authors.map(a => a.name).join(', ')} is a South Korean web novel author renowned for their phenomenal action sequences and world-building.
              </p>
            </div>
            
            <div className="bg-[#16161a] border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 text-white">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-gray-200 font-medium">{manga.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Format</span>
                  <span className="text-gray-200 font-medium">Long Strip</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
