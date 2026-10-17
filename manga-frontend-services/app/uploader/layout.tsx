'use client';

// Thành viên 2 - Layout riêng cho Uploader Dashboard (cùng phong cách với Admin Master)
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookPlus,
  DownloadCloud,
  ExternalLink,
  Home,
  Library,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isAdminRole, isUploaderRole } from '@/lib/uploaderApi';

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/uploader', icon: LayoutDashboard, adminOnly: false },
  { label: 'Truyện của tôi', href: '/uploader/mangas', icon: Library, adminOnly: false },
  { label: 'Đăng truyện mới', href: '/uploader/mangas/new', icon: BookPlus, adminOnly: false },
  { label: 'Cào từ MangaDex', href: '/uploader/mangadex', icon: DownloadCloud, adminOnly: true },
];

export default function UploaderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // false khi render trên server, true sau khi hydrate (authStore đọc từ localStorage)
  const isMounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const { user, token, isAuthenticated, logout } = useAuthStore();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Đang kiểm tra quyền Uploader...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token || !user) {
    return (
      <Gate
        icon={<Lock className="w-8 h-8" />}
        title="Đăng nhập để đăng truyện"
        description={
          <>
            Đăng nhập để vào <span className="text-purple-400 font-semibold">Uploader Dashboard</span> và đăng truyện của bạn.
            Truyện mới sẽ được Quản trị viên duyệt trước khi hiển thị cho người đọc.
          </>
        }
        primary={
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname || '/uploader')}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-600/30"
          >
            Đăng nhập ngay <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />
    );
  }

  if (!isUploaderRole(user.role)) {
    return (
      <Gate
        warning
        icon={<ShieldAlert className="w-8 h-8" />}
        title="Không có quyền Uploader"
        description={
          <>
            Tài khoản <span className="font-semibold text-gray-200">@{user.username}</span> đang có vai trò{' '}
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-800 text-amber-300 font-semibold border border-amber-500/20">{user.role}</span>.
            Liên hệ Quản trị viên để được cấp quyền đăng truyện.
          </>
        }
        primary={
          <button
            onClick={() => {
              logout();
              router.push(`/login?redirect=${encodeURIComponent(pathname || '/uploader')}`);
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Đổi tài khoản
          </button>
        }
      />
    );
  }

  const admin = isAdminRole(user.role);
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || admin);
  const isActive = (href: string) => {
    if (href === '/uploader') return pathname === '/uploader';
    if (href === '/uploader/mangas') {
      return pathname === '/uploader/mangas' || (pathname?.startsWith('/uploader/mangas/') && pathname !== '/uploader/mangas/new');
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-[#16161f]/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
              Manga<span className="text-purple-400">Hub</span> Uploader
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">Đăng truyện, upload chương &amp; đồng bộ MangaDex</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gray-800/50 border border-gray-700/50 text-xs">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-200 leading-none">{user.username}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{user.role}</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 transition"
          >
            <span className="hidden sm:inline">Về trang chủ</span> <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            title="Đăng xuất"
            className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1.5 font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
        {/* Sidebar (desktop) / thanh tab cuộn ngang (mobile) */}
        <aside className="md:w-60 md:border-r border-b md:border-b-0 border-gray-800/80 bg-[#12121a]/60 p-3 md:p-4 shrink-0 md:flex md:flex-col md:justify-between">
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto">
            <p className="hidden md:block text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">Menu Uploader</p>
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                    active ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            {admin && (
              <Link
                href="/admin/content"
                className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap text-gray-500 hover:text-white hover:bg-gray-800/50 transition"
              >
                <ShieldAlert className="w-4 h-4" /> Duyệt truyện (Admin)
              </Link>
            )}
          </nav>

          <div className="hidden md:block rounded-xl border border-gray-800 bg-[#16161f] p-3 text-xs text-gray-400 space-y-1 mt-4">
            <p className="font-semibold text-gray-300">Lưu trữ ảnh:</p>
            <p className="text-sky-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span> Cloudinary (WebP)
            </p>
            <p className="text-[11px] text-gray-500 pt-1">Truyện mới cần Admin duyệt trước khi hiển thị cho người đọc.</p>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

const subscribeNoop = () => () => {};

function Gate({
  icon,
  title,
  description,
  primary,
  warning = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  primary: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#0d0d12] text-gray-100 flex items-center justify-center p-4 sm:p-6">
      <div className={`max-w-md w-full bg-[#16161f] border ${warning ? 'border-amber-500/30' : 'border-gray-800'} rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-6`}>
        <div
          className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border ${
            warning ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
          }`}
        >
          {icon}
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          {primary}
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
