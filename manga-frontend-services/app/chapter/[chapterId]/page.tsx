'use client';
import { useState } from 'react';
import { ReaderCanvas } from '@/components/reader/ReaderCanvas';
import { ReaderToolbar } from '@/components/reader/ReaderToolbar';
import { SettingsModal } from '@/components/reader/SettingsModal';
// import { fetchChapterById } from '@/lib/api';

export default function ChapterPage({ params }: { params: { chapterId: string } }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mock data for demonstration
  const chapter = {
    id: params.chapterId,
    mangaId: 'manga-123',
    title: 'Beginning of the End',
    chapterNumber: '1',
    hash: 'mock-hash-123',
    pages: [
      { id: 'p1', url: '1.jpg', pageNumber: 1 },
      { id: 'p2', url: '2.jpg', pageNumber: 2 },
      { id: 'p3', url: '3.jpg', pageNumber: 3 },
    ]
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-gray-100 relative pb-20">
      <div className="sticky top-0 z-40 bg-[#16161a]/90 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="font-bold">Chapter {chapter.chapterNumber} {chapter.title && `- ${chapter.title}`}</h1>
        </div>
      </div>
      
      <ReaderCanvas 
        pages={chapter.pages} 
        sourceType="mangadex_at_home" 
        hash={chapter.hash} 
      />

      <ReaderToolbar 
        mangaId={chapter.mangaId} 
        chapterNumber={chapter.chapterNumber}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  );
}
