import { useState } from 'react'

const genres = ['Action', 'Romance', 'Fantasy', 'Isekai', 'Shounen', 'Horror', 'Slice of Life', 'Mecha']
const statuses = ['Ongoing', 'Completed', 'Hiatus', 'Dropped']

interface NavbarProps {
  darkMode: boolean
  onToggleDark: () => void
}

export default function Navbar({ darkMode, onToggleDark }: NavbarProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState<'Genre' | 'Status'>('Genre')
  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 glass border-b"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="14" rx="1.5" fill="white" />
              <rect x="10" y="2" width="6" height="9" rx="1.5" fill="white" opacity="0.7" />
              <rect x="10" y="13" width="6" height="3" rx="1.5" fill="white" opacity="0.5" />
            </svg>
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0f4' }}
          >
            Manga<span style={{ color: '#8b5cf6' }}>Hub</span>
          </span>
        </a>

        {/* Search bar */}
        <div className="flex-1 max-w-xl relative">
          <div
            className="flex items-center rounded-xl overflow-hidden border"
            style={{ background: '#1a1a1e', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {/* Filter dropdown trigger */}
            <button
              onClick={() => setFilterOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 h-10 border-r text-sm font-medium shrink-0 transition-colors hover:text-white"
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                color: '#a0a0b0',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {filterType}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>

            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="16" height="16" viewBox="0 0 16 16" fill="none"
                style={{ color: '#606070' }}
              >
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search manga, author, or series…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 text-sm bg-transparent outline-none"
                style={{ color: '#f0f0f4', fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Filter dropdown */}
          {filterOpen && (
            <div
              className="absolute top-12 left-0 rounded-xl border p-2 z-50 min-w-[140px]"
              style={{ background: '#202026', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
            >
              <p className="text-xs font-semibold px-2 py-1 mb-1" style={{ color: '#606070', fontFamily: 'Outfit,sans-serif', letterSpacing: '0.06em' }}>FILTER BY</p>
              {(['Genre', 'Status'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => { setFilterType(opt); setFilterOpen(false) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    color: filterType === opt ? '#8b5cf6' : '#a0a0b0',
                    background: filterType === opt ? 'rgba(139,92,246,0.1)' : 'transparent',
                    fontFamily: 'Inter,sans-serif',
                  }}
                >
                  {opt}
                </button>
              ))}
              <div className="border-t my-2" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
              <div className="max-h-40 overflow-y-auto">
                {(filterType === 'Genre' ? genres : statuses).map(item => (
                  <button
                    key={item}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors hover:text-white"
                    style={{ color: '#a0a0b0', fontFamily: 'Inter,sans-serif' }}
                    onClick={() => { setQuery(item); setFilterOpen(false) }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {[
            { label: 'Browse', href: '#' },
            { label: 'Bookmarks', href: '#' },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-white"
              style={{ color: '#a0a0b0', fontFamily: 'Inter, sans-serif' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: '#a0a0b0', background: 'rgba(255,255,255,0.04)' }}
            title="Toggle theme"
          >
            {darkMode ? (
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <circle cx="8.5" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8.5 1v1.5M8.5 14.5V16M1 8.5h1.5M14.5 8.5H16M3.1 3.1l1.06 1.06M12.84 12.84l1.06 1.06M12.84 4.16l-1.06 1.06M4.16 12.84l-1.06 1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8.5A6 6 0 1 1 7.5 2a4.5 4.5 0 0 0 6.5 6.5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(o => !o)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative"
              style={{ color: '#a0a0b0', background: 'rgba(255,255,255,0.04)' }}
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M8.5 1.5a5 5 0 0 1 5 5v2.5l1.5 2H2l1.5-2V6.5a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M6.5 13a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
                style={{ background: '#8b5cf6', borderColor: '#121214' }}
              />
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-11 rounded-xl border p-3 z-50 w-80"
                style={{ background: '#202026', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
              >
                <p className="text-sm font-semibold mb-3" style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}>Notifications</p>
                {[
                  { title: 'Solo Leveling Ch. 200 released', time: '5 min ago', dot: '#8b5cf6' },
                  { title: 'Chainsaw Man Ch. 185 is out', time: '1 hour ago', dot: '#a78bfa' },
                  { title: 'New chapter: Berserk Ch. 374', time: '3 hours ago', dot: '#7c3aed' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.dot }} />
                    <div>
                      <p className="text-sm" style={{ color: '#f0f0f4', fontFamily: 'Inter,sans-serif' }}>{n.title}</p>
                      <p className="text-xs" style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="relative">
            <button onClick={() => setProfileOpen(o => !o)} className="relative">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop&auto=format"
                alt="User avatar"
                className="w-9 h-9 rounded-lg object-cover"
                style={{ border: '2px solid rgba(139,92,246,0.5)' }}
              />
            </button>
            {profileOpen && (
              <div
                className="absolute right-0 top-11 rounded-xl border p-2 z-50 w-48"
                style={{ background: '#202026', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
              >
                <div className="px-3 py-2 mb-1">
                  <p className="text-sm font-semibold" style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}>Akira_Reader</p>
                  <p className="text-xs" style={{ color: '#606070' }}>akira@example.com</p>
                </div>
                <div className="border-t mb-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                {['My Library', 'Reading History', 'Settings', 'Sign Out'].map(item => (
                  <button
                    key={item}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:text-white"
                    style={{ color: item === 'Sign Out' ? '#f87171' : '#a0a0b0', fontFamily: 'Inter,sans-serif' }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
