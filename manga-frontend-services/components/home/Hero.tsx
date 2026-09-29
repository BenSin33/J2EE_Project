import { useState, useEffect, useCallback } from 'react'

const SLIDES = [
  {
    id: 1,
    title: 'Solo Leveling',
    subtitle: 'Arise from the Ashes of the Weakest',
    author: 'Chugong',
    group: 'Reaperscans',
    genres: ['Action', 'Fantasy', 'Manhwa'],
    rating: 4.9,
    votes: '128K',
    chapter: 'Chapter 200',
    description: 'Ten years ago, mysterious gates connecting the real world to dungeons appeared. Sung Jin-Woo, the weakest hunter, discovers a hidden system that only he can see — transforming him into the world\'s most powerful Shadow Monarch.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1440&h=700&fit=crop&auto=format',
    accent: '#8b5cf6',
    gradient: 'from-[#0d0a1a] via-[#1a0f2e]/80 to-transparent',
  },
  {
    id: 2,
    title: 'Chainsaw Man',
    subtitle: 'The Devil Hunter of Tokyo',
    author: 'Tatsuki Fujimoto',
    group: 'MangaPlus Official',
    genres: ['Action', 'Dark Fantasy', 'Seinen'],
    rating: 4.8,
    votes: '94K',
    chapter: 'Chapter 185',
    description: 'Denji merges with his chainsaw devil dog Pochita to become Chainsaw Man — a hybrid devil hunter working for the Public Safety Devil Hunters, tearing through demons and conspiracies alike.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1440&h=700&fit=crop&auto=format',
    accent: '#f97316',
    gradient: 'from-[#1a0d07] via-[#2d1206]/80 to-transparent',
  },
  {
    id: 3,
    title: 'Berserk',
    subtitle: 'The Black Swordsman\'s Legacy',
    author: 'Kentaro Miura',
    group: 'Studio Gaga',
    genres: ['Dark Fantasy', 'Adventure', 'Seinen'],
    rating: 4.9,
    votes: '201K',
    chapter: 'Chapter 374',
    description: 'In a dark medieval world riddled with demons and monsters, Guts — a lone mercenary with a massive sword — seeks revenge against his former commander Griffith who sacrificed their comrades to become a God Hand.',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1440&h=700&fit=crop&auto=format',
    accent: '#dc2626',
    gradient: 'from-[#1a0a0a] via-[#2d0f0f]/80 to-transparent',
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <svg key={s} width="14" height="14" viewBox="0 0 14 14" fill={s <= Math.round(rating) ? '#f59e0b' : 'rgba(255,255,255,0.15)'}>
            <path d="M7 1l1.545 3.09L12 4.582l-2.5 2.464.59 3.454L7 8.745l-3.09 1.755.59-3.454L2 4.582l3.455-.492L7 1z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold" style={{ color: '#f59e0b', fontFamily: 'Outfit,sans-serif' }}>{rating.toFixed(1)}</span>
      <span className="text-xs" style={{ color: '#a0a0b0', fontFamily: 'Inter,sans-serif' }}>/ 5.0</span>
    </div>
  )
}

export default function Hero() {
  const [active, setActive] = useState(0)
  const [prev, setPrev] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goTo = useCallback((idx: number) => {
    if (isTransitioning || idx === active) return
    setPrev(active)
    setActive(idx)
    setIsTransitioning(true)
    setTimeout(() => setIsTransitioning(false), 600)
  }, [active, isTransitioning])

  useEffect(() => {
    const t = setInterval(() => {
      goTo((active + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(t)
  }, [active, goTo])

  const slide = SLIDES[active]

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '580px' }}>
      {/* Background images */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : 0, zIndex: i === active ? 1 : 0 }}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover"
          />
          {/* Dark overlays */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,8,18,0.97) 0%, rgba(10,8,18,0.85) 45%, rgba(10,8,18,0.3) 70%, rgba(10,8,18,0.15) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(18,18,20,1) 0%, transparent 40%)' }} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full max-w-[1440px] mx-auto px-6 lg:px-10 flex items-center">
        <div className="max-w-2xl" style={{ paddingTop: '20px' }}>
          {/* Featured badge */}
          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(139,92,246,0.15)',
                color: '#a78bfa',
                border: '1px solid rgba(139,92,246,0.25)',
                fontFamily: 'Outfit,sans-serif',
                letterSpacing: '0.08em',
              }}
            >
              ★ FEATURED
            </span>
            <span className="text-xs" style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}>
              Updated {slide.chapter}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-6xl font-black leading-none tracking-tight mb-2 transition-all duration-500"
            style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f4' }}
          >
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg font-medium mb-4 transition-all duration-500"
            style={{ color: '#a0a0b0', fontFamily: 'Inter,sans-serif', fontStyle: 'italic' }}
          >
            {slide.subtitle}
          </p>

          {/* Author + Group */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: '#606070' }}>
                <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M1.5 11.5c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="text-sm" style={{ color: '#a0a0b0', fontFamily: 'Inter,sans-serif' }}>{slide.author}</span>
            </div>
            <span style={{ color: '#303038' }}>•</span>
            <div className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: '#8b5cf6' }}>
                <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
                <path d="M4 4.5h5M4 7h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-medium" style={{ color: '#8b5cf6', fontFamily: 'Inter,sans-serif' }}>{slide.group}</span>
            </div>
          </div>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-2 mb-5">
            {slide.genres.map(g => (
              <span
                key={g}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139,92,246,0.2)',
                  fontFamily: 'Inter,sans-serif',
                }}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-6">
            <StarRating rating={slide.rating} />
            <span className="text-xs" style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}>
              {slide.votes} ratings
            </span>
          </div>

          {/* Description */}
          <p
            className="text-sm leading-relaxed mb-8 line-clamp-2"
            style={{ color: '#808090', fontFamily: 'Inter,sans-serif', maxWidth: '520px' }}
          >
            {slide.description}
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <button className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm"
              style={{ fontFamily: 'Outfit,sans-serif' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polygon points="5,3 13,8 5,13" fill="white" />
              </svg>
              Read {slide.chapter}
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#d4d4e4',
                fontFamily: 'Outfit,sans-serif',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M3 2h9a1 1 0 0 1 1 1v10l-4.5-3L4 13V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
              Add to Library
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? '28px' : '8px',
              height: '8px',
              background: i === active ? '#8b5cf6' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Slide thumbs on right */}
      <div
        className="absolute right-10 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3 hidden lg:flex"
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className="rounded-xl overflow-hidden transition-all duration-300"
            style={{
              width: '72px',
              height: '96px',
              outline: i === active ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.08)',
              outlineOffset: '2px',
              opacity: i === active ? 1 : 0.5,
              transform: i === active ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          </button>
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ height: '80px', background: 'linear-gradient(to top, #121214, transparent)' }}
      />
    </section>
  )
}
