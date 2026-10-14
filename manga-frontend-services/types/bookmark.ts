export const BOOKMARK_FOLDERS = { reading: 'Đang đọc', plan_to_read: 'Muốn đọc', completed: 'Đã đọc', re_reading: 'Đọc lại', dropped: 'Ngừng đọc' } as const;
export type BookmarkFolder = keyof typeof BOOKMARK_FOLDERS;
export interface Bookmark { mangaId: string; title: string | null; coverImageUrl: string | null; folderType: BookmarkFolder; notificationsEnabled: boolean; createdAt: string; available: boolean; }
export interface Library { items: Bookmark[]; page: number; size: number; totalElements: number; }
export interface BookmarkPreferences { folderType?: BookmarkFolder; notificationsEnabled?: boolean; }
