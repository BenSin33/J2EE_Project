'use client'

import { useState } from 'react'
import { axiosClient } from '@/lib/axiosClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, User, Mail, Lock } from 'lucide-react'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await axiosClient.post('/auth/register', { username, email, password })
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="glass rounded-2xl p-8 border shadow-2xl text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-white mb-2">Registration Successful!</h2>
        <p className="text-sm font-body text-gray-400">Redirecting you to login page...</p>
      </div>
    )
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
          <h1 className="text-2xl font-bold font-display" style={{ color: '#f0f0f4' }}>Create an Account</h1>
        </Link>
        <p className="text-sm font-body" style={{ color: '#a0a0b0' }}>Join MangaHub to bookmark and track your reading</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm border" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 font-body">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>USERNAME</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f0f0f4' }}
              placeholder="akira_reader"
              minLength={3}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>EMAIL ADDRESS</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f0f0f4' }}
              placeholder="akira@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a0b0' }}>PASSWORD</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#606070' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-transparent border outline-none focus:border-purple-500 transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#f0f0f4' }}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-11 rounded-lg text-white font-medium flex items-center justify-center gap-2 mt-6 cursor-pointer"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm mt-6 font-body" style={{ color: '#a0a0b0' }}>
        Already have an account? <Link href="/login" className="font-medium hover:underline" style={{ color: '#8b5cf6' }}>Sign in</Link>
      </p>
    </div>
  )
}
