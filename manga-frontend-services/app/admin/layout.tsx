'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Palette,
  Server,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  LogOut,
  ArrowRight,
  Home,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    label: 'Tổng quan Master',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: '1. Quản lý nội dung & Cào',
    href: '/admin/content',
    icon: BookOpen,
  },
  {
    label: '2. Người dùng & Phân quyền',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: '3. Cấu hình giao diện & Thẻ',
    href: '/admin/ui-config',
    icon: Palette,
  },
  {
    label: '4. Giám sát hạ tầng & Nén',
    href: '/admin/infrastructure',
    icon: Server,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const { user, token, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Trạng thái chờ Hydration từ localStorage
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Đang kiểm tra quyền truy cập Quản trị...</p>
        </div>
      </div>
    );
  }

  // 2. Kiểm tra nếu chưa đăng nhập
  if (!isAuthenticated || !token || !user) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#16161f] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Yêu cầu đăng nhập Quản trị viên</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Phân hệ <span className="text-purple-400 font-semibold">Admin Master</span> chỉ dành riêng cho Quản trị viên hệ thống. Vui lòng đăng nhập với tài khoản có quyền Quản trị (<code className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-purple-300">ROLE_ADMIN</code>) để tiếp tục.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/login?redirect=${encodeURIComponent(pathname || '/admin')}`}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-600/30"
            >
              Đăng nhập ngay <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition"
            >
              <Home className="w-4 h-4" /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Kiểm tra vai trò quyền hạn (Role Check)
  const userRole = (user.role || '').toUpperCase();
  const isAdmin = userRole === 'ROLE_ADMIN' || userRole === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#16161f] border border-amber-500/30 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
              403 Forbidden - Quyền truy cập bị từ chối
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Không có quyền Quản trị</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Tài khoản <span className="font-semibold text-gray-200">@{user.username}</span> của bạn hiện có vai trò là{' '}
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-amber-300 font-semibold border border-amber-500/20">
                {user.role}
              </span>
              . Bạn không đủ thẩm quyền để vào trang quản trị.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                logout();
                router.push(`/login?redirect=${encodeURIComponent(pathname || '/admin')}`);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-600/30"
            >
              <LogOut className="w-4 h-4" /> Đổi tài khoản Admin
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition"
            >
              <Home className="w-4 h-4" /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Đã xác thực thành công và có quyền Quản trị viên
  return (
    <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-[#16161f]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
            A
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Manga<span className="text-purple-400">Hub</span> Admin Master
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v1.2
              </span>
            </h1>
            <p className="text-xs text-gray-400">Hệ thống quản trị &amp; kiểm duyệt nội dung</p>
          </div>
        </div>

        {/* User Status & Navigation Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-xs">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-200 leading-none">{user.username}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3" /> ROLE_ADMIN
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 transition"
          >
            Về trang chủ <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title="Đăng xuất khỏi hệ thống"
            className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-gray-800/80 bg-[#12121a]/60 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
              Menu Quản trị
            </p>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="rounded-xl border border-gray-800 bg-[#16161f] p-3 text-xs text-gray-400 space-y-1">
            <p className="font-semibold text-gray-300">Cơ sở dữ liệu:</p>
            <p className="text-emerald-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Supabase PostgreSQL
            </p>
            <p className="text-[11px] text-gray-500 pt-1">MangaDex API: v5 Ready</p>
          </div>
        </aside>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
