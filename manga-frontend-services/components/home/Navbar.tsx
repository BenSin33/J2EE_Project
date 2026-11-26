'use client'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const genres = ['Action', 'Romance', 'Fantasy', 'Isekai', 'Shounen', 'Horror', 'Slice of Life', 'Mecha']
const statuses = ['Ongoing', 'Completed', 'Hiatus', 'Dropped']

interface NavbarProps {
  darkMode?: boolean
  onToggleDark?: () => void
}

export default function Navbar({ darkMode: externalDarkMode, onToggleDark }: NavbarProps = {}) {
  const [internalDarkMode, setInternalDarkMode] = useState(true)
  const darkMode = externalDarkMode ?? internalDarkMode
  const handleToggleDark = onToggleDark ?? (() => setInternalDarkMode(d => !d))

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState<'Genre' | 'Status'>('Genre')
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <nav
      className="sticky top-0 z-50 glass border-b"
      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-16 flex items-center gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
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
        </Link>

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
        <div className="hidden md:flex items-center gap-0.5 xl:gap-1">
          {[
            { label: 'Trang chủ', href: '/' },
            { label: 'Tủ sách', href: '/library' },
            { label: 'Lịch sử', href: '/history' },
            { label: 'Đăng truyện', href: '/uploader' },
            { label: 'Nạp Xu (VNPay)', href: '/payment' },
            { label: 'Quản trị', href: '/admin' },
          ].map(link => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname?.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 xl:px-3 py-2 rounded-lg text-xs xl:text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'text-[#a0a0b0] hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={handleToggleDark}
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

          <NotificationBell />

          {/* User Profile / Login Button */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button onClick={() => setProfileOpen(o => !o)} className="relative flex items-center gap-2 cursor-pointer">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.username)}`}
                  alt="User avatar"
                  className="w-9 h-9 rounded-lg object-cover bg-gray-800"
                  style={{ border: '2px solid rgba(139,92,246,0.5)' }}
                />
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 top-11 rounded-xl border p-2 z-50 w-56"
                  style={{ background: '#202026', borderColor: 'rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
                >
                  <div className="px-3 py-2 mb-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-semibold truncate" style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}>
                        {user.username} {user.isVip ? '👑' : ''}
                      </p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {user.role?.replace('ROLE_', '')}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: '#606070' }}>{user.email}</p>
                    <p className="text-xs font-semibold text-amber-400 mt-1">
                      Số dư: {(user.coins ?? 0).toLocaleString('vi-VN')} Xu
                    </p>
                  </div>
                  <div className="border-t mb-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                  {[
                    { label: 'Tủ sách (Bookmark)', href: '/library' },
                    { label: 'Lịch sử đọc', href: '/history' },
                    { label: 'Ví Xu & Nạp VNPay', href: '/payment' },
                    { label: 'Uploader Dashboard', href: '/uploader' },
                    { label: 'Quản trị Admin', href: '/admin' },
                  ].map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="border-t my-1" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />
                  <button
                    onClick={() => {
                      logout()
                      setProfileOpen(false)
                      router.push('/login')
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-rose-500/10 cursor-pointer"
                    style={{ color: '#f87171', fontFamily: 'Inter,sans-serif' }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition shadow-md shadow-purple-600/20"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
