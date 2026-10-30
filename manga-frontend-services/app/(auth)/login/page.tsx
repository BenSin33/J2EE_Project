'use client'

import { useState, Suspense } from 'react'
import { useAuthStore } from '@/store/authStore'
import { axiosClient } from '@/lib/axiosClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react'

function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // State phục vụ Quên mật khẩu & Gửi OTP qua Spring Email (Yêu cầu 5)
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  const login = useAuthStore((state) => state.login)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      const { data } = await axiosClient.post('/auth/login', { usernameOrEmail, password })
      login(
        {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          avatarUrl: data.avatarUrl,
          coins: data.coins,
          isVip: data.isVip,
          authProvider: data.authProvider,
        },
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

  // Đăng nhập bằng Google (Yêu cầu 1)
  const handleGoogleLogin = async () => {
    setError('')
    setIsLoading(true)
    try {
      // Prompt nhập nhanh email Google để đăng nhập thử nghiệm hoặc OAuth
      const inputEmail = prompt('Nhập địa chỉ Gmail để đăng nhập bằng Google:', 'user.google@gmail.com')
      if (!inputEmail) {
        setIsLoading(false)
        return
      }

      const { data } = await axiosClient.post('/auth/google', {
        email: inputEmail,
        name: inputEmail.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${inputEmail}`,
      })

      login(
        {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          avatarUrl: data.avatarUrl,
          coins: data.coins,
          isVip: data.isVip,
          authProvider: data.authProvider,
        },
        data.token
      )

      router.push('/')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Đăng nhập bằng Google thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  // Gửi mã OTP xác thực qua Spring Email (Yêu cầu 5)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsEmailLoading(true)
    try {
      const { data } = await axiosClient.post('/auth/forgot-password', { email: forgotEmail })
      setOtpSent(true)
      setSuccessMsg(data.message || 'Mã OTP đã được gửi về email của bạn!')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Không tìm thấy tài khoản với email này.')
    } finally {
      setIsEmailLoading(false)
    }
  }

  // Đặt lại mật khẩu với OTP (Yêu cầu 5)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsEmailLoading(true)
    try {
      const { data } = await axiosClient.post('/auth/reset-password', {
        email: forgotEmail,
        otpCode,
        newPassword,
      })
      setSuccessMsg(data.message || 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
      setIsForgotMode(false)
      setOtpSent(false)
      setUsernameOrEmail(forgotEmail)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.')
    } finally {
      setIsEmailLoading(false)
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
          <h1 className="text-2xl font-bold font-display" style={{ color: '#f0f0f4' }}>
            {isForgotMode ? 'Khôi phục mật khẩu' : 'Chào mừng trở lại'}
          </h1>
        </Link>
        <p className="text-sm font-body" style={{ color: '#a0a0b0' }}>
          {isForgotMode ? 'Xác thực OTP qua Spring Email' : 'Đăng nhập vào MangaHub'}
        </p>
      </div>

      {searchParams.get('redirect') && !isForgotMode && (
        <div className="mb-4 p-3 rounded-lg text-xs border text-purple-300 bg-purple-500/10 border-purple-500/20">
          Vui lòng đăng nhập để tiếp tục truy cập trang đích.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm border" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg text-sm border flex items-center gap-2" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', borderColor: 'rgba(52,211,153,0.2)' }}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM QUÊN MẬT KHẨU (GỬI EMAIL OTP) */}
      {isForgotMode ? (
        <div className="space-y-4 font-body">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>NHẬP EMAIL ĐÃ ĐĂNG KÝ</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors text-white"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEmailLoading}
                className="btn-primary w-full h-11 rounded-lg text-white font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                {isEmailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi mã xác thực OTP qua Email'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>MÃ OTP (6 CHỮ SỐ)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors text-white tracking-widest font-mono text-center text-lg"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                    placeholder="123456"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>MẬT KHẨU MỚI</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors text-white"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isEmailLoading}
                className="btn-primary w-full h-11 rounded-lg text-white font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                {isEmailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận đổi mật khẩu'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => { setIsForgotMode(false); setOtpSent(false); setError(''); }}
            className="w-full text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 mt-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại đăng nhập
          </button>
        </div>
      ) : (
        /* FORM ĐĂNG NHẬP CHÍNH */
        <div>
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
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold" style={{ color: '#a0a0b0' }}>MẬT KHẨU</label>
                <button
                  type="button"
                  onClick={() => { setIsForgotMode(true); setError(''); setSuccessMsg(''); }}
                  className="text-xs text-purple-400 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>
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

          {/* NÚT ĐĂNG NHẬP VỚI GOOGLE (Yêu cầu 1) */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <span className="relative px-3 bg-[#11131f] text-xs text-gray-500 uppercase tracking-wider">Hoặc tiếp tục với</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-11 rounded-lg border border-gray-700 bg-gray-900/60 hover:bg-gray-800 text-gray-200 text-sm font-medium flex items-center justify-center gap-3 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            Đăng nhập bằng Google
          </button>

          <p className="text-center text-sm mt-6 font-body" style={{ color: '#a0a0b0' }}>
            Chưa có tài khoản? <Link href="/register" className="font-medium hover:underline" style={{ color: '#8b5cf6' }}>Đăng ký ngay</Link>
          </p>
        </div>
      )}
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
