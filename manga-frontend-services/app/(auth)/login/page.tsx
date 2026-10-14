'use client'

import { useState, Suspense } from 'react'
import { useAuthStore } from '@/store/authStore'
import { axiosClient } from '@/lib/axiosClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock } from 'lucide-react'

function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const login = useAuthStore((state) => state.login)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data } = await axiosClient.post('/auth/login', { usernameOrEmail, password })
      login(
        { id: data.id, username: data.username, email: data.email, role: data.role, avatarUrl: data.avatarUrl },
        data.token
      )
      
      const redirect = searchParams.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else if (data.role === 'ROLE_ADMIN' || data.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-8 border shadow-2xl" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-4">
          <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="14" rx="1.5" fill="white" />
              <rect x="10" y="2" width="6" height="9" rx="1.5" fill="white" opacity="0.7" />
              <rect x="10" y="13" width="6" height="3" rx="1.5" fill="white" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#f0f0f4' }}>Chào mừng trở lại</h1>
        </Link>
        <p className="text-sm font-body" style={{ color: '#a0a0b0' }}>Đăng nhập vào MangaHub</p>
      </div>

      {searchParams.get('redirect') && (
        <div className="mb-4 p-3 rounded-lg text-xs border text-purple-300 bg-purple-500/10 border-purple-500/20">
          Vui lòng đăng nhập để tiếp tục truy cập trang đích.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm border" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>TÊN ĐĂNG NHẬP HOẶC EMAIL</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f0f0f4' }}
              placeholder="admin1 hoặc email..."
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>MẬT KHẨU</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f0f0f4' }}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-11 rounded-lg text-white font-medium flex items-center justify-center gap-2 mt-6 cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập'}
        </button>
      </form>

      <p className="text-center text-sm mt-6 font-body" style={{ color: '#a0a0b0' }}>
        Chưa có tài khoản? <Link href="/register" className="font-medium hover:underline" style={{ color: '#8b5cf6' }}>Đăng ký ngay</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="glass rounded-2xl p-8 border shadow-2xl flex items-center justify-center min-h-[350px]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
