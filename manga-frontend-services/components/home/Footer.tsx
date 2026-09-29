export default function Footer() {
  return (
    <footer
      className="border-t mt-2"
      style={{ background: '#0e0e10', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
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
                className="text-xl font-bold"
                style={{ fontFamily: 'Outfit,sans-serif', color: '#f0f0f4' }}
              >
                Manga<span style={{ color: '#8b5cf6' }}>Hub</span>
              </span>
            </div>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ color: '#606070', fontFamily: 'Inter,sans-serif', maxWidth: '220px' }}
            >
              Your community-driven destination for manga, manhwa, and webtoons. Free to read. Always.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2">
              {[
                {
                  label: 'Discord',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
                      <path d="M12.7 2.4A12.3 12.3 0 0 0 9.6 1.5c-.15.27-.3.63-.41.91a11.5 11.5 0 0 0-3.4 0A9.1 9.1 0 0 0 5.4 1.5a12.4 12.4 0 0 0-3.1.9C.83 5.46.39 8.47.6 11.44a12.5 12.5 0 0 0 3.77 1.9c.3-.42.58-.87.82-1.34a7.9 7.9 0 0 1-1.28-.62c.1-.08.21-.16.31-.24a8.8 8.8 0 0 0 7.56 0l.31.24c-.41.24-.84.45-1.29.62.24.47.52.92.82 1.34a12.4 12.4 0 0 0 3.77-1.9c.31-3.4-.54-6.35-2.65-8.97zM5.16 9.68c-.74 0-1.34-.68-1.34-1.51s.59-1.51 1.34-1.51c.76 0 1.36.68 1.34 1.51 0 .83-.58 1.51-1.34 1.51zm4.68 0c-.74 0-1.34-.68-1.34-1.51s.59-1.51 1.34-1.51c.76 0 1.36.68 1.34 1.51 0 .83-.58 1.51-1.34 1.51z" />
                    </svg>
                  ),
                },
                {
                  label: 'Twitter',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                      <path d="M11.96 1.5h2.3L9.44 6.77 15 13.5h-4.56l-3.36-4.4-3.84 4.4H.93l5.15-5.9L0 1.5h4.68l3.04 4.02L11.96 1.5zm-.8 10.78h1.27L3.85 2.8H2.49l8.67 9.48z" />
                    </svg>
                  ),
                },
                {
                  label: 'Reddit',
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
                      <path d="M15 7.5c0-.97-.8-1.75-1.77-1.75-.47 0-.9.18-1.22.48a8.6 8.6 0 0 0-4.5-1.4l.77-3.62 2.5.53a1.25 1.25 0 1 0 1.27-1.24 1.26 1.26 0 0 0-1.1.65l-2.8-.6a.25.25 0 0 0-.3.19l-.85 4a8.64 8.64 0 0 0-4.46 1.4A1.75 1.75 0 1 0 1.5 9.2c0 .1.01.2.03.3C1.52 12.5 4.14 15 7.5 15s5.98-2.5 5.97-5.5c.02-.1.03-.2.03-.3 0-.59-.32-1.1-.5-1.7zm-7.5 6.25c-1.72 0-3.12-.98-3.12-2.19 0-1.2 1.4-2.19 3.12-2.19s3.12.98 3.12 2.19c0 1.21-1.4 2.19-3.12 2.19zM5.5 9.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0zm4.28 2.84a2.7 2.7 0 0 1-2.28 0 .25.25 0 0 1 .2-.46 2.2 2.2 0 0 0 1.88 0 .25.25 0 1 1 .2.46zm-.28-2.09a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" />
                    </svg>
                  ),
                },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#606070' }}
                  title={s.label}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {[
            {
              title: 'Platform',
              links: ['Browse Catalog', 'Top Trending', 'New Releases', 'Completed Series', 'Random Manga'],
            },
            {
              title: 'Community',
              links: ['Discord Server', 'Reddit Community', 'Scanlation Groups', 'Join as Translator', 'Submit a Title'],
            },
            {
              title: 'Legal & Support',
              links: ['Terms of Service', 'Privacy Policy', 'DMCA Policy', 'Content Guidelines', 'Contact Us'],
            },
          ].map(col => (
            <div key={col.title}>
              <h4
                className="text-sm font-bold mb-4 tracking-wide"
                style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif', letterSpacing: '0.04em' }}
              >
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: '#606070', fontFamily: 'Inter,sans-serif' }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Apply CTA banner */}
        <div
          className="rounded-2xl p-6 mb-8 flex items-center justify-between gap-4 flex-wrap"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(109,40,217,0.05) 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div>
            <p
              className="font-bold text-base mb-1"
              style={{ color: '#f0f0f4', fontFamily: 'Outfit,sans-serif' }}
            >
              Are you a Scanlation Group?
            </p>
            <p className="text-sm" style={{ color: '#a0a0b0', fontFamily: 'Inter,sans-serif' }}>
              Partner with MangaHub to host your releases and reach millions of readers.
            </p>
          </div>
          <a
            href="#"
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
            style={{ fontFamily: 'Outfit,sans-serif' }}
          >
            Apply Now →
          </a>
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center justify-between flex-wrap gap-4 pt-6 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs" style={{ color: '#404050', fontFamily: 'Inter,sans-serif' }}>
            © 2024 MangaHub. All rights reserved. MangaHub does not store any files on its server. All manga hosted are property of their respective owners.
          </p>

          <div className="flex items-center gap-4">
            {['Terms', 'Privacy', 'DMCA', 'Cookies'].map(link => (
              <a
                key={link}
                href="#"
                className="text-xs transition-colors hover:text-white"
                style={{ color: '#404050', fontFamily: 'Inter,sans-serif' }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
