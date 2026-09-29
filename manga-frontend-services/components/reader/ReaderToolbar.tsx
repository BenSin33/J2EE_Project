'use client';
import { Settings, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

interface ReaderToolbarProps {
  mangaId: string;
  chapterNumber: string;
  onOpenSettings: () => void;
}

export function ReaderToolbar({ mangaId, chapterNumber, onOpenSettings }: ReaderToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#16161a]/90 backdrop-blur-md border-t border-gray-800 p-4 z-50 transform transition-transform">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href={`/manga/${mangaId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
          <Home className="w-5 h-5" />
          <span className="hidden sm:inline">Details</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition" aria-label="Previous Chapter">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-200">Ch. {chapterNumber}</span>
          <button className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition" aria-label="Next Chapter">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={onOpenSettings}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <Settings className="w-5 h-5" />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </div>
  );
}
