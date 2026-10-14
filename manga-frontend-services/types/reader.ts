export interface ReaderPage { pageNumber: number; imageUrl: string; width: number; height: number; }
export interface ReaderChapter { mangaId: string; chapterId: string; title: string; chapterNumber: string; source: 'LOCAL' | 'MANGADEX'; totalPages: number; pages: ReaderPage[]; }

export interface ReadingProgress { mangaId: string; chapterId: string; lastPage: number; totalPages: number; percentage: number; readAt: string; }

export interface HistoryEntry extends ReadingProgress { title: string | null; chapterTitle: string | null; coverImageUrl: string | null; available: boolean; }
export interface ReadingHistory { items: HistoryEntry[]; page: number; size: number; totalElements: number; }
