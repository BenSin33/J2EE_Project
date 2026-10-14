const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchMangaList(page = 0, limit = 20, keyword = '') {
  const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (keyword) query.set('keyword', keyword);
  const res = await fetch(`${API_BASE_URL}/mangas?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch manga list');
  return res.json();
}

export async function fetchMangaById(id: string) {
  const res = await fetch(`${API_BASE_URL}/manga/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch manga');
  return res.json();
}

export async function fetchChaptersByMangaId(mangaId: string) {
  const res = await fetch(`${API_BASE_URL}/manga/${mangaId}/chapters`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function fetchChapterById(chapterId: string) {
  const res = await fetch(`${API_BASE_URL}/chapter/${chapterId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch chapter');
  return res.json();
}

export async function fetchReaderChapter(chapterId: string, signal?: AbortSignal): Promise<import('@/types/reader').ReaderChapter> {
  const res = await fetch(API_BASE_URL + '/chapters/' + encodeURIComponent(chapterId) + '/pages', { cache: 'no-store', signal });
  if (!res.ok) throw new Error(res.status === 404 ? 'Chương không còn khả dụng.' : 'Không tải được chương (HTTP ' + res.status + ').');
  const chapter: import('@/types/reader').ReaderChapter = await res.json();
  if (chapter.chapterId !== chapterId || chapter.totalPages < 1 || chapter.totalPages !== chapter.pages.length
      || chapter.pages.some((page, index) => page.pageNumber !== index + 1 || !page.imageUrl || page.width <= 0 || page.height <= 0)) {
    throw new Error('Dữ liệu trang chương không hợp lệ.');
  }
  return { ...chapter, pages: chapter.pages.map(page => ({ ...page, imageUrl: new URL(page.imageUrl, API_BASE_URL + '/').href })) };
}

export async function getDemoProgress(mangaId: string, signal?: AbortSignal): Promise<import('@/types/reader').ReadingProgress | null> {
  const res = await fetch(API_BASE_URL + '/reader-demo/progress/' + encodeURIComponent(mangaId), { credentials: 'include', cache: 'no-store', signal });
  if (!res.ok) throw new Error('Không tải được tiến độ demo.');
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
export async function saveDemoProgress(mangaId: string, chapterId: string, lastPage: number): Promise<import('@/types/reader').ReadingProgress> {
  const res = await fetch(API_BASE_URL + '/reader-demo/progress/' + encodeURIComponent(mangaId), {
    method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, lastPage }),
  });
  if (!res.ok) throw new Error('Chưa lưu được vị trí đọc.');
  return res.json();
}

export class ReaderApiError extends Error { constructor(public status: number, message: string) { super(message); } }
async function readerAccountRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(API_BASE_URL + '/me/' + path, { ...options, credentials: 'include', cache: 'no-store' });
  if (!res.ok) throw new ReaderApiError(res.status, res.status === 401 ? 'Bạn cần đăng nhập để dùng chức năng này.' : res.status === 403 ? 'Tài khoản không được phép thực hiện thao tác.' : 'Không thực hiện được thao tác (HTTP ' + res.status + ').');
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
export async function getReadingProgress(mangaId: string, signal?: AbortSignal): Promise<import('@/types/reader').HistoryEntry | null> {
  return readerAccountRequest('reading-progress/' + encodeURIComponent(mangaId), { signal });
}
export async function saveReadingProgress(mangaId: string, chapterId: string, lastPage: number): Promise<import('@/types/reader').HistoryEntry> {
  return readerAccountRequest('reading-progress/' + encodeURIComponent(mangaId), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chapterId, lastPage }) });
}
export async function getReadingHistory(page = 0, signal?: AbortSignal): Promise<import('@/types/reader').ReadingHistory> {
  return readerAccountRequest('reading-history?page=' + page + '&size=20', { signal });
}

export async function getBookmark(mangaId: string, signal?: AbortSignal): Promise<import('@/types/bookmark').Bookmark | null> {
  return readerAccountRequest('bookmarks/' + encodeURIComponent(mangaId), { signal });
}
export async function followManga(mangaId: string): Promise<import('@/types/bookmark').Bookmark> {
  return readerAccountRequest('bookmarks/' + encodeURIComponent(mangaId), { method: 'PUT' });
}
export async function unfollowManga(mangaId: string): Promise<null> {
  return readerAccountRequest('bookmarks/' + encodeURIComponent(mangaId), { method: 'DELETE' });
}
export async function updateBookmark(mangaId: string, preferences: import('@/types/bookmark').BookmarkPreferences): Promise<import('@/types/bookmark').Bookmark> {
  return readerAccountRequest('bookmarks/' + encodeURIComponent(mangaId), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preferences) });
}
export async function getLibrary(page = 0, folderType = '', signal?: AbortSignal): Promise<import('@/types/bookmark').Library> {
  return readerAccountRequest('bookmarks?page=' + page + '&size=20' + (folderType ? '&folderType=' + encodeURIComponent(folderType) : ''), { signal });
}

export async function getComments(mangaId: string, chapterId?: string, parentId?: string, page = 0, signal?: AbortSignal): Promise<import('@/types/comment').CommentPage> {
  const params = new URLSearchParams({ page: String(page), size: '20' });
  if (chapterId) params.set('chapterId', chapterId);
  if (parentId) params.set('parentId', parentId);
  const res = await fetch(API_BASE_URL + '/mangas/' + encodeURIComponent(mangaId) + '/comments?' + params, { credentials: 'include', cache: 'no-store', signal });
  if (!res.ok) throw new Error(res.status === 404 ? 'Nội dung không còn khả dụng để xem bình luận.' : 'Không tải được bình luận.');
  return res.json();
}
export async function createComment(mangaId: string, chapterId: string | undefined, parentId: string | undefined, content: string, spoiler: boolean): Promise<import('@/types/comment').Comment> {
  return readerAccountRequest('comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mangaId, chapterId, parentId, content, spoiler }) });
}
export async function editComment(id: string, content: string, spoiler: boolean): Promise<import('@/types/comment').Comment> {
  return readerAccountRequest('comments/' + encodeURIComponent(id), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, spoiler }) });
}
export async function deleteComment(id: string): Promise<null> {
  return readerAccountRequest('comments/' + encodeURIComponent(id), { method: 'DELETE' });
}

export async function getRating(mangaId: string, signal?: AbortSignal): Promise<import('@/types/rating').RatingSummary> {
  const res = await fetch(API_BASE_URL + '/mangas/' + encodeURIComponent(mangaId) + '/rating', { credentials: 'include', cache: 'no-store', signal });
  if (!res.ok) throw new Error(res.status === 404 ? 'Truyện không còn khả dụng để đánh giá.' : 'Không tải được điểm đánh giá.');
  return res.json();
}
export async function saveRating(mangaId: string, rating: number): Promise<import('@/types/rating').RatingSummary> {
  return readerAccountRequest('mangas/' + encodeURIComponent(mangaId) + '/rating', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating }) });
}

export async function getNotifications(page = 0, unreadOnly = false, signal?: AbortSignal): Promise<import('@/types/notification').NotificationPage> {
 return readerAccountRequest('notifications?page=' + page + '&size=20&unreadOnly=' + unreadOnly, { signal });
}
export async function getUnreadNotificationCount(signal?: AbortSignal): Promise<{ count: number }> {
 return readerAccountRequest('notifications/unread-count', { signal });
}
export async function markNotificationRead(id: string): Promise<null> {
 return readerAccountRequest('notifications/' + encodeURIComponent(id) + '/read', { method: 'PATCH' });
}
export async function markAllNotificationsRead(): Promise<null> {
 return readerAccountRequest('notifications/read-all', { method: 'PATCH' });
}
