'use client';
import { useState } from 'react';
import { followManga, unfollowManga, updateBookmark } from '@/lib/api';
import { Bookmark, BookmarkFolder, BookmarkPreferences, BOOKMARK_FOLDERS } from '@/types/bookmark';
export function BookmarkControls({ mangaId, bookmark, onChanged }: { mangaId: string; bookmark: Bookmark | null; onChanged: (bookmark: Bookmark | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function mutate(action: 'follow' | 'unfollow' | 'update', preferences?: BookmarkPreferences) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const next = action === 'follow' ? await followManga(mangaId) : action === 'unfollow' ? await unfollowManga(mangaId) : await updateBookmark(mangaId, preferences || {});
      onChanged(next);
    } catch (err) { setError(err instanceof Error ? err.message : 'Thao tác thất bại. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={busy} onClick={() => mutate(bookmark ? 'unfollow' : 'follow')} className="rounded-lg bg-violet-600 px-4 py-2 font-medium disabled:opacity-50">{busy ? 'Đang cập nhật…' : bookmark ? 'Bỏ theo dõi' : 'Theo dõi'}</button>
      {bookmark && <>
        <label className="text-sm">Trạng thái đọc <select aria-label="Trạng thái đọc" disabled={busy} value={bookmark.folderType} onChange={event => mutate('update', { folderType: event.target.value as BookmarkFolder })} className="ml-2 rounded border border-gray-700 bg-gray-900 px-2 py-2">
          {Object.entries(BOOKMARK_FOLDERS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={busy} checked={bookmark.notificationsEnabled} onChange={event => mutate('update', { notificationsEnabled: event.target.checked })} />Nhận thông báo chương mới</label>
      </>}
    </div>
    {error && <p className="text-amber-300" role="alert">{error}</p>}
  </div>;
}
