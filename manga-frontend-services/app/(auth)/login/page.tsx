'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/authStore'
import { axiosClient } from '@/lib/axiosClient'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, X, ShieldCheck, UserCheck } from 'lucide-react'

const DEMO_GOOGLE_ACCOUNTS = [
  {
    name: 'Nguyễn Văn A (Độc giả)',
    email: 'nguyenvana.reader@gmail.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nguyenvana',
  },
  {
    name: 'Trần Thị B (Uploader / Nhóm dịch)',
    email: 'tranthib.uploader@gmail.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tranthib',
  },
]

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

  // State phục vụ Modal chọn tài khoản Google OAuth2 (Yêu cầu 1)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [customGoogleEmail, setCustomGoogleEmail] = useState('')
  const [customGoogleName, setCustomGoogleName] = useState('')

  const login = useAuthStore((state) => state.login)
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  // Khởi tạo Google Identity Services nếu đã cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID
  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return
    const existingScript = document.getElementById('google-gsi-script')
    if (existingScript) return

    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }, [googleClientId])

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

  // Thực hiện gọi API Backend /api/auth/google và đồng bộ phiên đăng nhập
  const executeGoogleAuth = async (payload: { idToken?: string; email?: string; name?: string; avatarUrl?: string }) => {
    setError('')
    setIsLoading(true)
    try {
      const { data } = await axiosClient.post('/auth/google', payload)
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
      setShowGoogleModal(false)
      const redirect = searchParams.get('redirect')
      router.push(redirect || '/')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Đăng nhập bằng Google thất bại.')
    } finally {
      setIsLoading(false)
    }
  }

  // Mở luồng đăng nhập bằng Google (Yêu cầu 1)
  const handleGoogleLogin = () => {
    setError('')
    const win = window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void }) => void
            prompt: () => void
          }
        }
      }
    }

    if (googleClientId && win.google?.accounts?.id) {
      win.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          if (response.credential) {
            executeGoogleAuth({ idToken: response.credential })
          }
        },
      })
      win.google.accounts.id.prompt()
      return
    }

    // Hiển thị hộp thoại chọn tài khoản Google OAuth2 trực quan
    setShowGoogleModal(true)
  }

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customGoogleEmail.trim()) return
    const cleanEmail = customGoogleEmail.trim().toLowerCase()
    const displayName = customGoogleName.trim() || cleanEmail.split('@')[0]
    executeGoogleAuth({
      email: cleanEmail,
      name: displayName,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
    })
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

      {/* MODAL CHỌN TÀI KHOẢN GOOGLE OAUTH2 (Yêu cầu 1) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-[#161826] p-6 shadow-2xl space-y-5 font-body">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-white">Đăng nhập bằng Google</h3>
                  <p className="text-[11px] text-gray-400">Chọn tài khoản để tiếp tục tới MangaHub</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Danh sách tài khoản Google gợi ý nhanh */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tài khoản có sẵn trên thiết bị</p>
              {DEMO_GOOGLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isLoading}
                  onClick={() => executeGoogleAuth({ email: acc.email, name: acc.name.split(' (')[0], avatarUrl: acc.avatarUrl })}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/60 hover:bg-purple-500/10 hover:border-purple-500/40 text-left transition cursor-pointer"
                >
                  <img src={acc.avatarUrl} alt={acc.name} className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{acc.name}</p>
                    <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                  </div>
                  <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
                </button>
              ))}
            </div>

            {/* Hoặc nhập địa chỉ Gmail bất kỳ */}
            <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-3 border-t border-gray-800">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sử dụng tài khoản Gmail khác</p>
              <input
                type="email"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                placeholder="Nhập địa chỉ Gmail của bạn (vd: tenban@gmail.com)"
                className="w-full h-10 px-3.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
              <input
                type="text"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                placeholder="Tên hiển thị (không bắt buộc)"
                className="w-full h-10 px-3.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác thực OAuth2 & Tiếp tục'}
              </button>
            </form>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Google OAuth2 tự động đồng bộ hồ sơ và gửi email chào mừng qua Spring Email.</span>
            </div>
          </div>
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
