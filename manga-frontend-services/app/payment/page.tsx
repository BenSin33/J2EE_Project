'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { axiosClient } from '@/lib/axiosClient'
import { Coins, Crown, CheckCircle2, ShieldCheck, ArrowRight, History, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaymentPackage {
  id: string
  name: string
  amount: number
  coins: number
  bonus: string
  popular: boolean
}

interface Transaction {
  id: string
  amount: number
  coinsAdded: number
  orderInfo: string
  txnRef: string
  bankCode?: string
  status: string
  createdAt: string
}

export default function PaymentPage() {
  const { user, isAuthenticated, login, token } = useAuthStore()
  const router = useRouter()

  const [packages, setPackages] = useState<PaymentPackage[]>([])
  const [selectedPkg, setSelectedPkg] = useState<PaymentPackage | null>(null)
  const [bankCode, setBankCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [history, setHistory] = useState<Transaction[]>([])
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  // Tải thông tin người dùng mới nhất (coins, vip)
  useEffect(() => {
    if (token) {
      axiosClient.get('/auth/me')
        .then(({ data }) => {
          if (user) {
            login(
              {
                ...user,
                coins: data.coins,
                isVip: data.isVip,
              },
              token
            )
          }
        })
        .catch(() => {})
    }
  }, [token])

  // Tải danh sách gói nạp
  useEffect(() => {
    axiosClient.get('/payment/packages')
      .then(({ data }) => {
        setPackages(data)
        if (data.length > 0) {
          const defaultPkg = data.find((p: PaymentPackage) => p.popular) || data[0]
          setSelectedPkg(defaultPkg)
        }
      })
      .catch(() => {})
  }, [])

  // Tải lịch sử nạp
  useEffect(() => {
    if (isAuthenticated) {
      setHistoryLoading(true)
      axiosClient.get('/payment/history')
        .then(({ data }) => {
          setHistory(data.content || [])
        })
        .catch(() => {})
        .finally(() => setHistoryLoading(false))
    }
  }, [isAuthenticated])

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/payment')
      return
    }

    if (!selectedPkg) return

    setIsLoading(true)
    setError('')

    try {
      const { data } = await axiosClient.post('/payment/create', {
        amount: selectedPkg.amount,
        coins: selectedPkg.coins,
        orderInfo: `Nap ${selectedPkg.coins} xu MangaHub - ${selectedPkg.name}`,
        bankCode: bankCode || undefined,
      })

      if (data.paymentUrl) {
        // Chuyển hướng sang cổng thanh toán VNPay Sandbox
        window.location.href = data.paymentUrl
      } else {
        setError('Không thể tạo liên kết thanh toán. Vui lòng thử lại!')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch VNPay.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-body text-gray-100">
      {/* HEADER SECTION */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Cổng thanh toán VNPay Sandbox
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-white mb-3">
          Nạp Xu & Nâng Cấp VIP
        </h1>
        <p className="text-gray-400 text-sm">
          Mở khóa toàn bộ chương truyện chất lượng cao, ủng hộ nhóm dịch và trải nghiệm đọc không giới hạn.
        </p>
      </div>

      {/* USER WALLET OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Số dư xu của bạn</p>
              <h2 className="text-3xl font-extrabold text-amber-400 font-display">
                {user?.coins != null ? user.coins.toLocaleString('vi-VN') : 0} <span className="text-sm font-normal text-amber-300">Xu</span>
              </h2>
            </div>
          </div>
          <button
            onClick={() => window.scrollTo({ top: 350, behavior: 'smooth' })}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
          >
            Nạp thêm
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Cấp bậc tài khoản</p>
              <h2 className="text-2xl font-extrabold text-purple-300 font-display flex items-center gap-2">
                {user?.isVip ? 'VIP Member 👑' : 'Thành viên thường'}
              </h2>
            </div>
          </div>
          <span className="text-xs px-3 py-1 rounded-full border text-purple-300 border-purple-500/30 bg-purple-500/10">
            {user?.isVip ? 'Đang kích hoạt' : 'Nạp từ 50K tặng VIP'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DANH SÁCH GÓI NẠP */}
      <div className="mb-12">
        <h3 className="text-xl font-bold font-display text-white mb-6 flex items-center gap-2">
          <span>Chọn gói nạp xu</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const isSelected = selectedPkg?.id === pkg.id
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg)}
                className={`relative rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10 scale-[1.02]'
                    : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/50'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-md">
                    PHỔ BIẾN NHẤT
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-white text-base">{pkg.name}</h4>
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-purple-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-700" />
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-amber-400 font-display">+{pkg.coins}</span>
                    <span className="text-xs text-gray-400 ml-1">Xu</span>
                  </div>

                  <p className="text-xs text-emerald-400 font-medium mb-6 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md inline-block">
                    {pkg.bonus}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-800/80">
                  <p className="text-lg font-bold text-white">
                    {pkg.amount.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">VND</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CHỌN NGÂN HÀNG & NÚT THANH TOÁN */}
      <div className="p-6 md:p-8 rounded-2xl bg-gray-900/80 border border-gray-800 mb-12">
        <h3 className="text-lg font-bold text-white mb-4">Phương thức & Ngân hàng thanh toán</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { id: '', label: 'Tất cả (Tại cổng VNPay)' },
            { id: 'NCB', label: 'Ngân hàng NCB (Sandbox)' },
            { id: 'VNPAYQR', label: 'Cổng VNPAY-QR' },
            { id: 'INTCARD', label: 'Thẻ Quốc Tế (Visa/Master)' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setBankCode(item.id)}
              className={`p-3 rounded-xl border text-xs font-semibold transition ${
                bankCode === item.id
                  ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                  : 'border-gray-800 bg-gray-950/60 text-gray-400 hover:border-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thanh toán an toàn bảo mật qua cổng VNPay Sandbox (Hỗ trợ thẻ test demo)</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isLoading || !selectedPkg}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chuyển tới VNPay...
              </>
            ) : (
              <>
                Thanh toán {selectedPkg?.amount.toLocaleString('vi-VN')} VND
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* LỊCH SỬ GIAO DỊCH */}
      <div className="p-6 md:p-8 rounded-2xl bg-gray-900/60 border border-gray-800">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <span>Lịch sử giao dịch nạp xu</span>
        </h3>

        {historyLoading ? (
          <div className="py-8 flex justify-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào được ghi nhận.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="pb-3">Mã GD</th>
                  <th className="pb-3">Nội dung</th>
                  <th className="pb-3">Số tiền</th>
                  <th className="pb-3">Xu nhận</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {history.map((tx) => (
                  <tr key={tx.id} className="text-gray-300">
                    <td className="py-3 font-mono text-purple-300">{tx.txnRef}</td>
                    <td className="py-3">{tx.orderInfo}</td>
                    <td className="py-3 font-semibold text-white">{tx.amount.toLocaleString('vi-VN')} VND</td>
                    <td className="py-3 text-amber-400 font-bold">+{tx.coinsAdded}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
