'use client';
import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search for manga..."
        className="w-full bg-[#16161a] border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
      />
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
    </div>
  );
}
