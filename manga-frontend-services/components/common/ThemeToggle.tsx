'use client';
import { Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  
  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-300"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
