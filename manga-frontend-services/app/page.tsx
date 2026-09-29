'use client';
import { useState } from 'react';
import Navbar from '@/components/home/Navbar';
import Hero from '@/components/home/Hero';
import RecentlyUpdated from '@/components/home/RecentlyUpdated';
import TopTrending from '@/components/home/TopTrending';
import GenreExplorer from '@/components/home/GenreExplorer';
import Footer from '@/components/home/Footer';

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: '#121214' }}>
      <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
      <main>
        <Hero />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <GenreExplorer />
          <RecentlyUpdated />
          <TopTrending />
        </div>
      </main>
      <Footer />
    </div>
  );
}