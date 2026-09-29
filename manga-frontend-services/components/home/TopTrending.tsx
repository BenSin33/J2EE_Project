import { useRef, useState } from 'react'

const TRENDING = [
  {
    rank: 1,
    title: 'Solo Leveling',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=220&h=310&fit=crop&auto=format',
    genre: 'Action · Fantasy',
    bookmarks: '1.2M',
    rating: 4.9,
    badge: 'HOT',
  },
  {
    rank: 2,
    title: 'One Piece',
    cover: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=220&h=310&fit=crop&auto=format',
    genre: 'Adventure · Shounen',
    bookmarks: '2.1M',
    rating: 4.8,
    badge: null,
  },
  {
    rank: 3,
    title: 'Berserk',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=220&h=310&fit=crop&auto=format',
    genre: 'Dark Fantasy · Seinen',
    bookmarks: '980K',
    rating: 4.9,
    badge: null,
  },
  {
    rank: 4,
    title: 'Chainsaw Man',
    cover: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=220&h=310&fit=crop&auto=format',
    genre: 'Action · Dark',
    bookmarks: '870K',
    rating: 4.8,
    badge: 'NEW',
  },
  {
    rank: 5,
    title: 'Jujutsu Kaisen',
    cover: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=220&h=310&fit=crop&auto=format',
    genre: 'Action · Supernatural',
    bookmarks: '760K',
    rating: 4.7,
    badge: null,
  },
  {
    rank: 6,
    title: 'Omniscient Reader',
    cover: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=220&h=310&fit=crop&auto=format',
    genre: 'Isekai · Manhwa',
    bookmarks: '640K',
    rating: 4.8,
    badge: null,
  },
  {
    rank: 7,
    title: 'Vinland Saga',
    cover: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=220&h=310&fit=crop&auto=format',
    genre: 'Historical · Seinen',
    bookmarks: '520K',
    rating: 4.8,
    badge: null,
  },
  {
    rank: 8,
    title: 'Tower of God',
    cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=220&h=310&fit=crop&auto=format',
    genre: 'Fantasy · Manhwa',
    bookmarks: '495K',
    rating: 4.7,
    badge: null,
  },
  {
    rank: 9,
    title: 'Blue Lock',
    cover: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=220&h=310&fit=crop&auto=format',
    genre: 'Sports · Shounen',
    bookmarks: '430K',
    rating: 4.6,
    badge: 'RISING',
  },
  {
    rank: 10,
    title: 'Kingdom',
    cover: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=220&h=310&fit=crop&auto=format',
    genre: 'Historical · Action',
    bookmarks: '380K',
    rating: 4.9,
    badge: null,
  },
]

const RANK_COLORS: Record<number, string> = {
  1: '#f59e0b',
  2: '#9ca3af',
  3: '#cd7c2a',
}

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  HOT: { bg: '#ef444418', color: '#f87171' },
  NEW: { bg: '#10b98118', color: '#34d399' },
  RISING: { bg: '#f59e0b18', color: '#fbbf24' },
}

export default function TopTrending() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const scroll = (dir: 'left' | 'right') => {
    if (!trackRef.current) return
    const amount = 300
    trackRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
    setTimeout(() => {
      if (!trackRef.current) return
      setCanLeft(trackRef.current.scrollLeft > 0)
      setCanRight(
        trackRef.current.scrollLeft + trackRef.current.clientWidth < trackRef.current.scrollWidth - 4
      )
    }, 350)
  }

  return (
    <section className="pb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f4' }}>
            Top Trending
          </h2>
          <span className="text-sm" style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}>
            This week
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a href="#" className="text-sm font-medium mr-2" style={{ color: '#8b5cf6', fontFamily: 'Inter,sans-serif' }}>
            Full chart →
          </a>
          {/* Scroll controls */}
          {[{ dir: 'left', can: canLeft }, { dir: 'right', can: canRight }].map(({ dir, can }) => (
            <button
              key={dir}
              onClick={() => scroll(dir as 'left' | 'right')}
              disabled={!can}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: can ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                border: '1px solid ' + (can ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'),
                color: can ? '#8b5cf6' : '#303038',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                {dir === 'left' ? (
                  <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div ref={trackRef} className="scroll-x flex gap-4 pb-2">
        {TRENDING.map(item => (
          <div
            key={item.rank}
            className="manga-card shrink-0 cursor-pointer group"
            style={{ width: '180px' }}
          >
            {/* Cover art */}
            <div className="relative rounded-xl overflow-hidden mb-3" style={{ height: '250px', background: '#26262e' }}>
              <img
                src={item.cover}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }}
              />

              {/* Rank badge */}
              <div
                className="absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center font-black text-base"
                style={{
                  background: RANK_COLORS[item.rank] ? `${RANK_COLORS[item.rank]}22` : 'rgba(18,18,20,0.9)',
                  border: `1.5px solid ${RANK_COLORS[item.rank] ?? 'rgba(255,255,255,0.12)'}`,
                  color: RANK_COLORS[item.rank] ?? '#a0a0b0',
                  fontFamily: 'Outfit,sans-serif',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {item.rank}
              </div>

              {/* Status badge */}
              {item.badge && (
                <div
                  className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                  style={{ ...BADGE_STYLES[item.badge], fontFamily: 'Outfit,sans-serif', letterSpacing: '0.05em' }}
                >
                  {item.badge}
                </div>
              )}

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="#f59e0b">
                    <polygon points="5.5,1 7,4 10,4.2 7.8,6.5 8.6,10 5.5,8.2 2.4,10 3.2,6.5 1,4.2 4,4" />
                  </svg>
                  <span className="text-xs font-semibold" style={{ color: '#f59e0b', fontFamily: 'JetBrains Mono,monospace' }}>
                    {item.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <p
              className="font-bold text-sm line-clamp-1 mb-1 group-hover:text-purple-400 transition-colors"
              style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}
            >
              {item.title}
            </p>

            <p
              className="text-xs mb-2 line-clamp-1"
              style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}
            >
              {item.genre}
            </p>

            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#8b5cf6' }}>
                <path d="M2 2h8a1 1 0 0 1 1 1v7.5L7.5 9 3 10.5V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: '#8b5cf6', fontFamily: 'JetBrains Mono,monospace' }}>
                {item.bookmarks}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
