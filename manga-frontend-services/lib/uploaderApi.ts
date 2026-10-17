// Thành viên 2 - Gọi API Uploader Dashboard (tự gắn JWT qua adminFetch)
import { adminFetch } from '@/lib/adminApi';
import type {
  MangaSource,
  PageResult,
  TagItem,
  UploaderChapter,
  UploaderManga,
  UploaderMangaPayload,
  UploaderMangaSummary,
  UploaderStats,
} from '@/types/uploader';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await adminFetch(endpoint, options);
  } catch {
    throw new ApiError(0, 'Không kết nối được backend (http://localhost:8080). Kiểm tra server Spring Boot đã chạy chưa.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const fallback =
      res.status === 401 || res.status === 403
        ? 'Bạn cần đăng nhập (hoặc tài khoản đang bị khoá).'
        : `Lỗi ${res.status}`;
    throw new ApiError(res.status, data?.message || fallback);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const uploaderApi = {
  stats: () => request<UploaderStats>('/uploader/stats'),
  tags: () => request<TagItem[]>('/uploader/tags'),

  listMangas: (params: { source?: MangaSource; keyword?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params.source) q.set('source', params.source);
    if (params.keyword) q.set('keyword', params.keyword);
    q.set('page', String(params.page ?? 0));
    q.set('size', String(params.size ?? 12));
    return request<PageResult<UploaderMangaSummary>>(`/uploader/mangas?${q.toString()}`);
  },
  getManga: (id: string) => request<UploaderManga>(`/uploader/mangas/${id}`),
  createManga: (payload: UploaderMangaPayload) => request<UploaderManga>('/uploader/mangas', json('POST', payload)),
  updateManga: (id: string, payload: UploaderMangaPayload) =>
    request<UploaderManga>(`/uploader/mangas/${id}`, json('PUT', payload)),
  uploadCover: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<UploaderManga>(`/uploader/mangas/${id}/cover`, { method: 'POST', body: form });
  },

  listChapters: (mangaId: string) => request<UploaderChapter[]>(`/uploader/mangas/${mangaId}/chapters`),
  createChapter: (
    mangaId: string,
    data: { chapterNumber: string; volume?: string; title?: string; language: string; publish: boolean },
    files: File[]
  ) => {
    const form = new FormData();
    form.append('chapterNumber', data.chapterNumber);
    if (data.volume) form.append('volume', data.volume);
    if (data.title) form.append('title', data.title);
    form.append('language', data.language);
    form.append('publish', String(data.publish));
    files.forEach((f) => form.append('files', f, f.name));
    return request<UploaderChapter>(`/uploader/mangas/${mangaId}/chapters`, { method: 'POST', body: form });
  },
  updateChapter: (
    chapterId: string,
    data: Partial<{ chapterNumber: string; volume: string; title: string; status: 'published' | 'draft' }>
  ) => request<UploaderChapter>(`/uploader/chapters/${chapterId}`, json('PATCH', data)),
  deleteChapter: (chapterId: string) => request<void>(`/uploader/chapters/${chapterId}`, { method: 'DELETE' }),

  // Chỉ ADMIN (endpoint crawler)
  mirrorChapter: (chapterId: string) =>
    request<{ message: string; pagesUploaded: number; totalPages: number }>(
      `/crawler/mangadex/chapters/${chapterId}/mirror`,
      { method: 'POST' }
    ),
};

// Mọi tài khoản đã đăng nhập đều đăng được truyện; truyện của người không phải Admin chờ duyệt
export function isUploaderRole(role?: string | null) {
  return !!role;
}

export function isAdminRole(role?: string | null) {
  const r = (role || '').toUpperCase();
  return r === 'ROLE_ADMIN' || r === 'ADMIN';
}
