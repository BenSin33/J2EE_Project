import { useState } from 'react'

const CHAPTERS = [
  {
    id: 1,
    cover: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=120&h=160&fit=crop&auto=format',
    title: 'Solo Leveling',
    chapter: 'Ch. 200',
    group: 'Reaperscans',
    time: '2 hours ago',
    status: 'Ongoing',
    views: '48.2K',
  },
  {
    id: 2,
    cover: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=120&h=160&fit=crop&auto=format',
    title: 'Chainsaw Man',
    chapter: 'Ch. 185',
    group: 'MangaPlus',
    time: '5 hours ago',
    status: 'Ongoing',
    views: '36.7K',
  },
  {
    id: 3,
    cover: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=120&h=160&fit=crop&auto=format',
    title: 'Jujutsu Kaisen',
    chapter: 'Ch. 261',
    group: 'JJKScans',
    time: '8 hours ago',
    status: 'Ongoing',
    views: '29.4K',
  },
  {
    id: 4,
    cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=120&h=160&fit=crop&auto=format',
    title: 'One Piece',
    chapter: 'Ch. 1124.5',
    group: 'TCBScans',
    time: '12 hours ago',
    status: 'Ongoing',
    views: '67.1K',
  },
  {
    id: 5,
    cover: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=120&h=160&fit=crop&auto=format',
    title: 'Berserk',
    chapter: 'Ch. 374',
    group: 'Studio Gaga',
    time: '1 day ago',
    status: 'Ongoing',
    views: '52.8K',
  },
  {
    id: 6,
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=120&h=160&fit=crop&auto=format',
    title: 'Vinland Saga',
    chapter: 'Ch. 212',
    group: 'Kotonoha',
    time: '2 days ago',
    status: 'Ongoing',
    views: '18.3K',
  },
  {
    id: 7,
    cover: 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=120&h=160&fit=crop&auto=format',
    title: 'Omniscient Reader',
    chapter: 'Ch. 124.5',
    group: 'Flame Scans',
    time: '2 days ago',
    status: 'Ongoing',
    views: '22.6K',
  },
  {
    id: 8,
    cover: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=120&h=160&fit=crop&auto=format',
    title: 'Attack on Titan: No Regrets',
    chapter: 'Ch. 47',
    group: 'SnKScans',
    time: '3 days ago',
    status: 'Completed',
    views: '14.9K',
  },
]

function GroupBadge({ group }: { group: string }) {
  const colors: Record<string, string> = {
    'Reaperscans': '#8b5cf6',
    'MangaPlus': '#ef4444',
    'JJKScans': '#3b82f6',
    'TCBScans': '#10b981',
    'Studio Gaga': '#f59e0b',
    'Kotonoha': '#ec4899',
    'Flame Scans': '#f97316',
    'SnKScans': '#6366f1',
  }
  const color = colors[group] ?? '#a0a0b0'
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-md font-medium"
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
        fontFamily: 'Inter,sans-serif',
      }}
    >
      {group}
    </span>
  )
}

export default function RecentlyUpdated() {
  const [view, setView] = useState<'grid' | 'list'>('list')

  return (
    <section className="pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f4' }}>
            Recently Updated
          </h2>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontFamily: 'JetBrains Mono,monospace' }}
          >
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {(['list', 'grid'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="p-1.5 rounded-md transition-all"
                style={{
                  background: view === v ? 'rgba(139,92,246,0.2)' : 'transparent',
                  color: view === v ? '#8b5cf6' : '#606070',
                }}
              >
                {v === 'list' ? (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 4h11M2 7.5h11M2 11h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="8.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="1.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                    <rect x="8.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <a href="#" className="text-sm font-medium" style={{ color: '#8b5cf6', fontFamily: 'Inter,sans-serif' }}>
            See all →
          </a>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {CHAPTERS.map(ch => (
            <div
              key={ch.id}
              className="manga-card flex gap-4 rounded-xl p-3 cursor-pointer group"
              style={{ background: '#1a1a1e', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Cover */}
              <div className="relative shrink-0 rounded-lg overflow-hidden" style={{ width: '64px', height: '88px', background: '#26262e' }}>
                <img
                  src={ch.cover}
                  alt={ch.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {ch.status === 'Completed' && (
                  <div
                    className="absolute bottom-0 left-0 right-0 text-center text-[9px] py-0.5 font-bold"
                    style={{ background: '#10b981', color: 'white', fontFamily: 'Outfit,sans-serif' }}
                  >
                    DONE
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p
                    className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors"
                    style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}
                  >
                    {ch.title}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#8b5cf6', fontFamily: 'JetBrains Mono,monospace' }}
                    >
                      {ch.chapter}
                    </span>
                    <GroupBadge group={ch.group} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}>
                    {ch.time}
                  </span>
                  <div className="flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: '#606070' }}>
                      <path d="M1 5.5C1 5.5 2.8 2 5.5 2S10 5.5 10 5.5 8.2 9 5.5 9 1 5.5 1 5.5z" stroke="currentColor" strokeWidth="1.1" />
                      <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.1" />
                    </svg>
                    <span className="text-xs" style={{ color: '#606070', fontFamily: 'JetBrains Mono,monospace' }}>{ch.views}</span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#8b5cf6' }}>
                  <path d="M5 8h6M9 6l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {CHAPTERS.map(ch => (
            <div key={ch.id} className="manga-card cursor-pointer group">
              <div className="relative rounded-xl overflow-hidden mb-3" style={{ aspectRatio: '3/4', background: '#26262e' }}>
                <img
                  src={ch.cover}
                  alt={ch.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                <div
                  className="absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{ background: 'rgba(139,92,246,0.9)', color: 'white', fontFamily: 'JetBrains Mono,monospace' }}
                >
                  {ch.chapter}
                </div>
              </div>
              <p className="text-sm font-semibold line-clamp-1 mb-1" style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}>
                {ch.title}
              </p>
              <div className="flex items-center justify-between">
                <GroupBadge group={ch.group} />
                <span className="text-xs" style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}>{ch.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
