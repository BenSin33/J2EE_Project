import { useState } from 'react'

const GENRES = [
  { label: 'All', count: null },
  { label: 'Action', count: 2841 },
  { label: 'Romance', count: 1934 },
  { label: 'Fantasy', count: 2207 },
  { label: 'Isekai', count: 987 },
  { label: 'Shounen', count: 1653 },
  { label: 'Seinen', count: 1102 },
  { label: 'Shoujo', count: 876 },
  { label: 'Horror', count: 642 },
  { label: 'Slice of Life', count: 1455 },
  { label: 'Mecha', count: 289 },
  { label: 'Sports', count: 437 },
  { label: 'Mystery', count: 734 },
  { label: 'Psychological', count: 615 },
  { label: 'Martial Arts', count: 1089 },
  { label: 'Manhwa', count: 1348 },
  { label: 'Manhua', count: 892 },
  { label: 'Comedy', count: 1876 },
  { label: 'Drama', count: 1543 },
  { label: 'Supernatural', count: 1221 },
]

export default function GenreExplorer() {
  const [active, setActive] = useState('All')

  return (
    <section className="py-10">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f4' }}>
          Genres &amp; Tags
        </h2>
        <a href="#" className="text-sm font-medium" style={{ color: '#8b5cf6', fontFamily: 'Inter,sans-serif' }}>
          View all →
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {GENRES.map(g => {
          const isActive = g.label === active
          return (
            <button
              key={g.label}
              onClick={() => setActive(g.label)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
              style={{
                fontFamily: 'Inter,sans-serif',
                background: isActive
                  ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)'
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#fff' : '#a0a0b0',
                border: isActive
                  ? '1px solid rgba(139,92,246,0.4)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isActive ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                transform: isActive ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {g.label}
              {g.count !== null && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                    color: isActive ? '#fff' : '#606070',
                    fontFamily: 'JetBrains Mono,monospace',
                    fontSize: '10px',
                  }}
                >
                  {g.count >= 1000 ? `${(g.count / 1000).toFixed(1)}k` : g.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
