const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchMangaList(page = 1, limit = 20) {
  const res = await fetch(`${API_BASE_URL}/manga?page=${page}&limit=${limit}`, { cache: 'no-store' });
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
