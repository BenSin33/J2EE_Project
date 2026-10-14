'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Lock,
  Unlock,
  VolumeX,
  Loader2,
  Check,
} from 'lucide-react';
import { UserItem } from '@/types/admin';
import { adminFetch } from '@/lib/adminApi';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const query = userSearch ? `?keyword=${encodeURIComponent(userSearch)}&limit=30` : '?limit=30';
      const res = await adminFetch(`/admin/users${query}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.content || []);
      }
    } catch {
      // Keep fallback
    } finally {
      setIsLoadingUsers(false);
    }
  }, [userSearch]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await adminFetch(`/admin/users?limit=30`);
        if (!ignore && res.ok) {
          const data = await res.json();
          setUsers(data.content || []);
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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await adminFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        showToast(`Đã cập nhật quyền thành ${newRole}`);
        fetchUsers();
      }
    } catch {
      showToast('Lỗi khi cập nhật vai trò');
    }
  };

  const handleToggleBan = async (userId: string, currentBan: boolean) => {
    const nextBan = !currentBan;
    try {
      const res = await adminFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBanned: nextBan, reason: nextBan ? 'Vi phạm chính sách' : '' }),
      });
      if (res.ok) {
        showToast(nextBan ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
        fetchUsers();
      }
    } catch {
      showToast('Lỗi khi thay đổi trạng thái');
    }
  };

  const handleToggleMute = async (userId: string, currentMute: boolean) => {
    const nextMute = !currentMute;
    try {
      const res = await adminFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMuted: nextMute,
          muteDays: 7,
          reason: nextMute ? 'Cấm bình luận 7 ngày do vi phạm' : '',
        }),
      });
      if (res.ok) {
        showToast(nextMute ? 'Đã cấm bình luận (Mute 7 ngày)' : 'Đã gỡ cấm bình luận');
        fetchUsers();
      }
    } catch {
      showToast('Lỗi khi thay đổi trạng thái');
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
        <h2 className="text-2xl font-bold text-white tracking-tight">2. Quản lý người dùng &amp; Phân quyền</h2>
        <p className="text-sm text-gray-400 mt-1">
          Tìm kiếm tài khoản, nâng/hạ quyền (User, Moderator, Admin) và xử lý kỷ luật (Mute, Ban) theo quy chuẩn
        </p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-[#161622] p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo username hoặc email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchUsers(); }}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white focus:outline-none focus:border-purple-500 transition"
            />
          </div>
          <button
            onClick={fetchUsers}
            className="px-4 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-white transition"
          >
            Tìm
          </button>
        </div>

        {isLoadingUsers ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-400" />
            Đang tải danh sách người dùng...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            Không tìm thấy người dùng phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="text-xs uppercase bg-gray-900/60 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-4 py-3">Tài khoản</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Kỷ luật</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3.5 font-semibold text-white">
                      {u.username}
                    </td>

                    <td className="px-4 py-3.5 text-gray-400 text-xs">
                      {u.email}
                    </td>

                    <td className="px-4 py-3.5">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="bg-gray-900 border border-gray-700 text-xs text-purple-300 font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-purple-500"
                      >
                        <option value="ROLE_USER">ROLE_USER</option>
                        <option value="ROLE_MODERATOR">ROLE_MODERATOR</option>
                        <option value="ROLE_ADMIN">ROLE_ADMIN</option>
                        <option value="ROLE_UPLOADER">ROLE_UPLOADER</option>
                      </select>
                    </td>

                    <td className="px-4 py-3.5 space-x-1.5">
                      {u.isBanned && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30">
                          BANNED
                        </span>
                      )}
                      {u.isMuted && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                          MUTED
                        </span>
                      )}
                      {!u.isBanned && !u.isMuted && (
                        <span className="text-xs text-emerald-400 font-medium">Bình thường</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleToggleMute(u.id, u.isMuted)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          u.isMuted
                            ? 'bg-amber-600/30 text-amber-200 border-amber-500/50'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                        }`}
                      >
                        <VolumeX className="w-3.5 h-3.5 inline mr-1" />
                        {u.isMuted ? 'Bỏ Mute' : 'Mute'}
                      </button>

                      <button
                        onClick={() => handleToggleBan(u.id, u.isBanned)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          u.isBanned
                            ? 'bg-rose-600/30 text-rose-200 border-rose-500/50'
                            : 'bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {u.isBanned ? <Unlock className="w-3.5 h-3.5 inline mr-1" /> : <Lock className="w-3.5 h-3.5 inline mr-1" />}
                        {u.isBanned ? 'Mở Ban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
