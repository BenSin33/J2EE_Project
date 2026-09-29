export interface Tag {
  id: string;
  name: string;
  description?: string;
  group?: string;
}

export interface Author {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
}

export interface Manga {
  id: string;
  title: string;
  altTitles?: string[];
  description: string;
  status: 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'HIATUS';
  year?: number;
  contentRating: 'SAFE' | 'SUGGESTIVE' | 'EROTICA' | 'PORNOGRAPHIC';
  tags: Tag[];
  authors: Author[];
  artists: Author[];
  coverArtUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterPage {
  id: string;
  url: string;
  pageNumber: number;
}

export interface Chapter {
  id: string;
  mangaId: string;
  title?: string;
  chapterNumber: string;
  volumeNumber?: string;
  pages: ChapterPage[];
  publishAt: string;
  readableAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  readingMode: 'VERTICAL' | 'PAGED';
  readerWidth: 'NORMAL' | 'WIDE' | 'FULL';
}
