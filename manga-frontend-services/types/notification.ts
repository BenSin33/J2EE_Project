export interface Notification { id: string; mangaId: string | null; chapterId: string | null; mangaTitle: string; chapterTitle: string | null; chapterNumber: string | null; createdAt: string; readAt: string | null; available: boolean; }
export interface NotificationPage { items: Notification[]; page: number; size: number; totalElements: number; }
