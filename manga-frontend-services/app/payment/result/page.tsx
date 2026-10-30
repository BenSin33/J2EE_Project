'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { axiosClient } from '@/lib/axiosClient'
import { CheckCircle2, XCircle, Loader2, Coins, ArrowRight, MailCheck } from 'lucide-react'
import Link from 'next/link'

interface CallbackResult {
  status: 'SUCCESS' | 'FAILED'
  message: string
  txnRef?: string
  amount?: number
  coinsAdded?: number
  vnpTransactionNo?: string
}

function PaymentResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [result, setResult] = useState<CallbackResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Thu thập tất cả tham số trả về từ VNPay
    const params: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    if (Object.keys(params).length === 0) {
      setResult({
        status: 'FAILED',
        message: 'Không tìm thấy thông tin giao dịch từ VNPay.',
      })
      setIsLoading(false)
      return
    }

    // Gửi tham số về backend để kiểm tra chữ ký checksum và ghi nhận nạp xu
    axiosClient.get('/payment/vnpay-callback', { params })
      .then(({ data }) => {
        setResult(data)
      })
      .catch((err) => {
        setResult({
          status: 'FAILED',
          message: err.response?.data?.message || 'Có lỗi xảy ra khi xác thực giao dịch với VNPay.',
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="glass max-w-md mx-auto p-10 rounded-3xl border border-gray-800 text-center shadow-2xl">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-display text-white mb-2">Đang xác thực giao dịch VNPay...</h2>
        <p className="text-sm text-gray-400">Hệ thống đang kiểm tra chữ ký số bảo mật, vui lòng đợi trong giây lát.</p>
      </div>
    )
  }

  const isSuccess = result?.status === 'SUCCESS'

  return (
    <div className="glass max-w-lg mx-auto p-8 md:p-10 rounded-3xl border border-gray-800 text-center shadow-2xl font-body">
      {isSuccess ? (
        <div>
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold font-display text-white mb-2">Thanh Toán Thành Công! 🎉</h2>
          <p className="text-sm text-gray-400 mb-6">
            Giao dịch qua cổng <strong>VNPay Sandbox</strong> của bạn đã được xác nhận.
          </p>

          <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 text-left text-xs space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-400">Mã giao dịch (TxnRef):</span>
              <span className="font-mono font-bold text-purple-300">{result?.txnRef}</span>
            </div>
            {result?.vnpTransactionNo && (
              <div className="flex justify-between">
                <span className="text-gray-400">Mã giao dịch VNPay:</span>
                <span className="font-mono text-gray-300">{result?.vnpTransactionNo}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Số tiền:</span>
              <span className="font-bold text-white">
                {result?.amount ? result.amount.toLocaleString('vi-VN') : 0} VND
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <span className="text-gray-400">Số xu cộng vào ví:</span>
              <span className="text-base font-extrabold text-amber-400 flex items-center gap-1">
                <Coins className="w-4 h-4" /> +{result?.coinsAdded} Xu
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-center gap-2 mb-6">
            <MailCheck className="w-4 h-4 shrink-0 text-purple-400" />
            <span>Biên lai xác nhận đã được gửi tự động về hòm thư Email của bạn (Spring Email)!</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              Tiếp tục đọc truyện <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/payment"
              className="py-3 px-4 rounded-xl border border-gray-700 bg-gray-900/60 hover:bg-gray-800 text-gray-300 font-semibold text-xs transition"
            >
              Xem ví xu
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold font-display text-white mb-2">Giao Dịch Thất Bại</h2>
          <p className="text-sm text-gray-400 mb-6">{result?.message || 'Giao dịch bị hủy hoặc không thành công.'}</p>

          <Link
            href="/payment"
            className="inline-flex items-center justify-center py-3 px-6 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs transition"
          >
            Quay lại trang nạp xu
          </Link>
        </div>
      )}
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Suspense fallback={
        <div className="glass max-w-md mx-auto p-10 rounded-3xl border border-gray-800 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
        </div>
      }>
        <PaymentResultContent />
      </Suspense>
    </div>
  )
}
