export interface AdminStats {
  totalMangas: number;
  totalChapters: number;
  totalUsers: number;
  pendingReports: number;
  pendingMangaApprovals: number;
  totalViews: number;
  storageUsedEstimate: string;
  cdnBandwidthEstimate: string;
}

export interface UserItem {
  id: string;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
  isMuted: boolean;
  mutedUntil?: string;
  muteReason?: string;
  createdAt: string;
}

export interface MangaItem {
  id: string;
  mangadexId?: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  status: string;
  approvalStatus: string;
  rejectionReason?: string;
  viewsCount: number;
  createdAt: string;
}

export interface ChapterReportItem {
  id: string;
  chapterId: string;
  userId?: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface TagItem {
  id: string;
  name: string;
  groupType: string;
}

export interface MangaDexSearchResult {
  mangadexId: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  status: string;
  originalLanguage: string;
  contentRating: string;
  authorName?: string;
}
