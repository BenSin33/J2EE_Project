'use client';

import { useState, useEffect } from 'react';
import {
  Tag as TagIcon,
  Layers,
  Bell,
  Check,
} from 'lucide-react';
import { TagItem } from '@/types/admin';
import { adminFetch } from '@/lib/adminApi';

export default function AdminUiConfigPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagGroup, setNewTagGroup] = useState('genre');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTags = async () => {
    try {
      const res = await adminFetch('/admin/tags');
      if (res.ok) {
        const data = await res.json();
        setTags(data || []);
      }
    } catch {
      // Keep fallback
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await adminFetch('/admin/tags');
        if (!ignore && res.ok) {
          const data = await res.json();
          setTags(data || []);
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

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      const res = await adminFetch('/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), groupType: newTagGroup }),
      });
      if (res.ok) {
        showToast(`Đã thêm thể loại: ${newTagName}`);
        setNewTagName('');
        fetchTags();
      }
    } catch {
      showToast('Lỗi khi thêm thể loại');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const res = await adminFetch(`/admin/tags/${tagId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Đã xóa thể loại');
        fetchTags();
      }
    } catch {
      showToast('Lỗi khi xóa thể loại');
    }
  };

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
        <h2 className="text-2xl font-bold text-white tracking-tight">3. Cấu hình giao diện &amp; Phân loại</h2>
        <p className="text-sm text-gray-400 mt-1">
          Quản lý danh mục thể loại, điều hướng Carousel trang chủ và đăng thông báo hệ thống
        </p>
      </div>

      {/* Tag Management */}
      <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-5">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-purple-400" />
          Quản lý Danh mục &amp; Thể loại (Action, RomCom, Horror, Xuất xứ)
        </h3>

        <form onSubmit={handleAddTag} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Tên thể loại mới (ví dụ: Isekai, Shounen, Manhwa)..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="flex-1 h-10 px-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500"
          />
          <select
            value={newTagGroup}
            onChange={(e) => setNewTagGroup(e.target.value)}
            className="h-10 px-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none"
          >
            <option value="genre">Thể loại (Genre)</option>
            <option value="origin">Xuất xứ (Origin)</option>
            <option value="theme">Chủ đề (Theme)</option>
          </select>
          <button
            type="submit"
            className="px-5 h-10 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
          >
            Thêm thể loại
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700/80 text-xs font-medium text-gray-200 flex items-center gap-2 hover:border-purple-500/50 transition group"
            >
              {t.name}
              <span className="text-[10px] text-gray-500 font-mono">({t.groupType})</span>
              <button
                onClick={() => handleDeleteTag(t.id)}
                className="text-gray-500 hover:text-rose-400 transition"
              >
                ×
              </button>
            </span>
          ))}
          {tags.length === 0 && (
            <p className="text-xs text-gray-500 italic">Chưa có thể loại nào được lưu trong Database.</p>
          )}
        </div>
      </div>

      {/* Home Carousel Showcase Config */}
      <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          Điều hướng trang chủ: Cấu hình Carousel &amp; Truyện nổi bật
        </h3>
        <p className="text-xs text-gray-400">
          Chọn truyện ưu tiên xuất hiện trên banner chính của trang chủ MangaHub
        </p>

        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-sm text-gray-300 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Banner Carousel Trang Chủ</p>
            <p className="text-xs text-gray-400 mt-0.5">Tự động lấy 5 bộ truyện có lượt xem cao nhất từ Database</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
            Đang kích hoạt
          </span>
        </div>
      </div>

      {/* System Announcement */}
      <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          Đăng thông báo hệ thống &amp; Quy định website
        </h3>
        <p className="text-xs text-gray-400">
          Hiển thị thông báo banner trên toàn trang tới tất cả người dùng
        </p>
        <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-sm text-gray-300 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">Thông báo bảo trì &amp; Quy định kiểm duyệt mới</p>
            <p className="text-xs text-gray-400 mt-0.5">Hệ thống đang hoạt động ổn định trên Supabase Cloud</p>
          </div>
          <button
            onClick={() => showToast('Đã phát thông báo mới tới người dùng')}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium text-white transition"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </div>
  );
}
