import { NotificationBell } from '@/components/notifications/NotificationBell';
import Link from 'next/link';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';

export function Navbar() {
  return (
    <nav className="w-full border-b border-gray-800 bg-[#0a0a0c] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="font-bold text-2xl tracking-tighter">
              Manga<span className="text-blue-500">Hub</span>
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-1 max-w-md px-4 hidden sm:block">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="px-2 text-sm text-purple-400 font-medium hover:text-purple-300">Quản trị Admin</Link>
            <Link href="/library" className="px-2 text-sm text-violet-300">Tủ sách</Link>
            <Link href="/history" className="px-2 text-sm text-violet-300">Lịch sử</Link>
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
