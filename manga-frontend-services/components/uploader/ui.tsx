// Thành viên 2 - Thành phần giao diện dùng chung cho Uploader Dashboard (cùng tông màu với trang Admin)
import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Clock, XCircle, Globe, HardDrive } from 'lucide-react';

export const inputClass =
  'w-full h-11 px-4 rounded-xl bg-[#1a1a22] border border-gray-700 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-purple-500 transition-colors disabled:opacity-60';

export const labelClass = 'block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider';

export const primaryButton =
  'inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-[#16161f] border border-gray-800 rounded-2xl p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
      <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
      <div className="break-words min-w-0">{message}</div>
    </div>
  );
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2">
      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
      <div className="break-words min-w-0">{message}</div>
    </div>
  );
}

const APPROVAL: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  approved: { label: 'Đã duyệt', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: CheckCircle2 },
  pending: { label: 'Chờ duyệt', className: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Clock },
  rejected: { label: 'Bị từ chối', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30', icon: XCircle },
};

export function ApprovalBadge({ status }: { status?: string | null }) {
  const cfg = APPROVAL[(status || '').toLowerCase()] ?? {
    label: status || 'Không rõ',
    className: 'bg-gray-700/40 text-gray-300 border-gray-600',
    icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.className}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export function SourceBadge({ source }: { source: 'LOCAL' | 'MANGADEX' }) {
  return source === 'MANGADEX' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-orange-500/15 text-orange-300 border-orange-500/30">
      <Globe className="w-3 h-3" /> MangaDex
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-sky-500/15 text-sky-300 border-sky-500/30">
      <HardDrive className="w-3 h-3" /> Local
    </span>
  );
}

export const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Đang tiến hành',
  completed: 'Hoàn thành',
  hiatus: 'Tạm ngưng',
  cancelled: 'Đã huỷ',
};

export function CoverImage({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`bg-gray-800 border border-gray-700 flex items-center justify-center text-[11px] text-gray-500 ${className}`}>
        Chưa có bìa
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`object-cover bg-gray-800 border border-gray-700 ${className}`} />;
}
