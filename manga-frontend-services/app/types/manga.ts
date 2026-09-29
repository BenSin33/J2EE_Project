export interface Manga {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string | null;
  viewsCount?: number;
  ratingScore?: number;
}

export interface Chapter {
  id: string;
  mangaId: string;
  chapterNumber: number;
  title: string | null;
  viewsCount: number;
  createdAt: string;
}