'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  BookOpen,
  ShieldAlert,
  HardDrive,
  CheckCircle,
  DownloadCloud,
  Users,
  Palette,
  Server,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { AdminStats, ChapterReportItem } from '@/types/admin';
import { adminFetch } from '@/lib/adminApi';

export default function AdminOverviewPage() {
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
  const [reports, setReports] = useState<ChapterReportItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, reportsRes] = await Promise.all([
        adminFetch('/admin/stats'),
        adminFetch('/admin/reports'),
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setReports(r || []);
      }
    } catch {
      // Keep fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          adminFetch('/admin/stats'),
          adminFetch('/admin/reports'),
        ]);
        if (!ignore && statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }
        if (!ignore && reportsRes.ok) {
          const r = await reportsRes.json();
          setReports(r || []);
        }
      } catch {
        // Keep fallback
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await adminFetch(`/admin/reports/${reportId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Master Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Tổng quan lượt truy cập, cảnh báo vi phạm, tồn đọng kiểm duyệt và tài nguyên toàn sàn
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800/80 hover:bg-gray-800 px-3.5 py-2 rounded-xl border border-gray-700/60 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards matching Admin.png */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lượt truy cập toàn sàn</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">
            {stats.totalViews.toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
            <span>↑ +18.4%</span> so với tuần trước
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng số truyện &amp; Chapter</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">
            {stats.totalMangas} <span className="text-lg font-normal text-gray-400">truyện</span>
          </p>
          <p className="text-xs text-blue-400 mt-2">
            {stats.totalChapters} chương đã phát hành
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cảnh báo vi phạm &amp; Duyệt</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-300">
            {stats.pendingReports + stats.pendingMangaApprovals}
          </p>
          <p className="text-xs text-amber-400/90 mt-2">
            {stats.pendingReports} báo cáo · {stats.pendingMangaApprovals} truyện chờ duyệt
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Storage / Băng thông CDN</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {stats.storageUsedEstimate}
          </p>
          <p className="text-xs text-emerald-400 mt-2">
            CDN: {stats.cdnBandwidthEstimate}
          </p>
        </div>
      </div>

      {/* Reports & Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-gray-800 bg-[#161622] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Tồn đọng kiểm duyệt &amp; Báo cáo vi phạm gần nhất
            </h3>
            <span className="text-xs text-gray-400">{reports.length} báo cáo</span>
          </div>

          {reports.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              Không có báo cáo hoặc khiếu nại vi phạm nào tồn đọng. Hệ thống vận hành tốt!
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 mr-2">
                      {r.reportType}
                    </span>
                    <span className="text-sm text-gray-200">{r.description || 'Không có mô tả chi tiết'}</span>
                    <p className="text-xs text-gray-500 mt-1">Mã chương: {r.chapterId}</p>
                  </div>
                  <button
                    onClick={() => handleResolveReport(r.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium border border-emerald-500/30 transition"
                  >
                    Đã giải quyết
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation shortcuts */}
        <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
          <h3 className="font-bold text-white text-base">Điều hướng chức năng quản trị</h3>
          <div className="space-y-2">
            <Link
              href="/admin/content"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 text-left text-sm text-purple-200 transition"
            >
              <span className="flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-purple-400" />
                1. Quản lý nội dung &amp; Cào MangaDex
              </span>
              <ChevronRight className="w-4 h-4 text-purple-400" />
            </Link>

            <Link
              href="/admin/users"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800 text-left text-sm text-gray-300 transition"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                2. Quản lý người dùng &amp; Phân quyền
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Link>

            <Link
              href="/admin/ui-config"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800 text-left text-sm text-gray-300 transition"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-400" />
                3. Cấu hình Thể loại &amp; Banner
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Link>

            <Link
              href="/admin/infrastructure"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-900/60 hover:bg-gray-800/60 border border-gray-800 text-left text-sm text-gray-300 transition"
            >
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                4. Giám sát hạ tầng &amp; Nén ảnh
              </span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
