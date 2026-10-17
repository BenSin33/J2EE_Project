// Thành viên 2 - Kiểu dữ liệu cho Uploader Dashboard (khớp với /api/v1/uploader)

export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
export type ContentRating = 'safe' | 'suggestive' | 'erotica';
export type OriginType = 'manga' | 'manhwa' | 'manhua';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | string;
export type MangaSource = 'local' | 'mangadex' | 'all';

export interface UploaderStats {
  role: string;
  admin: boolean;
  canImportMangaDex: boolean;
  cloudinaryEnabled: boolean;
  totalMangas: number;
  localMangas: number;
  mangadexMangas: number;
  pendingMangas: number;
  rejectedMangas: number;
  totalChapters: number;
  draftChapters: number;
}

export interface UploaderMangaSummary {
  id: string;
  mangadexId?: string | null;
  title: string;
  coverImageUrl?: string | null;
  status: string;
  approvalStatus: ApprovalStatus;
  rejectionReason?: string | null;
  source: 'LOCAL' | 'MANGADEX';
  chapterCount: number;
  updatedAt?: string;
}

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TagItem {
  id: string;
  name: string;
  groupType?: string;
}

export interface AuthorItem {
  id: string;
  name: string;
  role?: string;
}

export interface UploaderManga {
  id: string;
  mangadexId?: string | null;
  uploaderId?: string | null;
  title: string;
  altTitles?: Array<Record<string, string>> | null;
  description?: string | null;
  coverImageUrl?: string | null;
  originalLanguage?: string;
  originType?: string;
  status?: string;
  contentRating?: string;
  approvalStatus?: ApprovalStatus;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  authors?: AuthorItem[];
  tags?: TagItem[];
}

export interface UploaderMangaPayload {
  title: string;
  altTitles: string[];
  description: string;
  status: MangaStatus;
  originalLanguage: string;
  originType: OriginType;
  contentRating: ContentRating;
  tagIds: string[];
  authorNames: string[];
  artistNames: string[];
}

export interface UploaderChapter {
  id: string;
  mangaId: string;
  mangadexId?: string | null;
  volume?: string | null;
  chapterNumber: string;
  title?: string | null;
  translatedLanguage?: string;
  storageType?: string;
  status: 'published' | 'draft' | string;
  pageCount: number;
  previewUrl?: string | null;
  publishAt?: string;
  createdAt?: string;
}
