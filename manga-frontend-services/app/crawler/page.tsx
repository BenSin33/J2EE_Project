'use client';

import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { MangaDexImporter } from '@/components/uploader/MangaDexImporter';

// Trang cào độc lập (giữ lại cho link cũ); bản chính nằm trong Uploader Dashboard: /uploader/mangadex
export default function CrawlerPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <MangaDexImporter />
      </main>
      <Footer />
    </div>
  );
}
