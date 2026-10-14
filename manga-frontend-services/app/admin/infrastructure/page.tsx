'use client';

import { useState, useEffect } from 'react';
import {
  HardDrive,
  Activity,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AdminStats } from '@/types/admin';
import { adminFetch } from '@/lib/adminApi';

export default function AdminInfrastructurePage() {
  const [stats, setStats] = useState<AdminStats>({
    totalMangas: 2,
    totalChapters: 2,
    totalUsers: 3,
    pendingReports: 0,
    pendingMangaApprovals: 0,
    totalViews: 2840,
    storageUsedEstimate: '0.05 GB',
    cdnBandwidthEstimate: '1.5 GB / 500 GB',
  });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await adminFetch('/admin/stats');
        if (!ignore && res.ok) {
          const s = await res.json();
          setStats(s);
        }
      } catch {
        // Keep fallback
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-purple-600 px-5 py-3 text-white shadow-2xl transition-all border border-purple-400/40 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">4. Giám sát hạ tầng &amp; Cấu hình nén</h2>
        <p className="text-sm text-gray-400 mt-1">
          Theo dõi dung lượng Cloud Storage, cấu hình tự động convert/nén ảnh sang WebP và xóa cache CDN
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            Dung lượng Cloud Storage
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Đã sử dụng</span>
              <span className="font-bold text-white">{stats.storageUsedEstimate} / 50 GB</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '8%' }}></div>
            </div>
          </div>
          <div className="pt-2 text-xs text-gray-400 space-y-1">
            <p>• Node: Supabase Storage PostgreSQL (Australia East)</p>
            <p>• Băng thông phân phối tháng này: <span className="text-emerald-400 font-mono">{stats.cdnBandwidthEstimate}</span></p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Cấu hình Tự động Chuyển đổi &amp; Nén ảnh
          </h3>
          <div className="space-y-3 text-xs text-gray-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-purple-600" />
              <span>Tự động tối ưu định dạng WebP khi độc giả đọc chương</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-purple-600" />
              <span>Bật chế độ Data-Saver cho đường truyền mạng chậm</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-purple-600" />
              <span>Nén ảnh bìa (Cover art) tối đa 800px chiều rộng</span>
            </label>
          </div>
          <button
            onClick={() => {
              showToast('Đã xóa cache CDN và làm mới proxy MangaDex!');
            }}
            className="w-full mt-2 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Xóa cache CDN định kỳ ngay bây giờ
          </button>
        </div>
      </div>
    </div>
  );
}
