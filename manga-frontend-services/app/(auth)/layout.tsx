import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: '#121214' }}>
      <Link
        href="/"
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-gray-300 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
      >
        ← Về trang chủ
      </Link>
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ background: 'rgba(139,92,246,0.15)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]" style={{ background: 'rgba(124,58,237,0.1)' }} />
      </div>
      
      {/* Glass card container */}
      <div className="w-full max-w-md z-10">
        {children}
      </div>
    </div>
  )
}
