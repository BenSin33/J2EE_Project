export function Footer() {
  return (
    <footer className="w-full bg-[#0a0a0c] border-t border-gray-800 text-gray-400 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} MangaHub. All rights reserved.</p>
        <p className="mt-2">This site does not store any files on its server. All contents are provided by non-affiliated third parties.</p>
      </div>
    </footer>
  );
}
