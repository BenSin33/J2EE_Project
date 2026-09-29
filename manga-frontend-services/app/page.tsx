import { Manga } from "./types/manga";
import MangaCard from "./component/MangaCard";

async function getMangas(): Promise<Manga[]> {
  try {
    const res = await fetch("http://localhost:8080/api/v1/mangas", {
      cache: "no-store", // Luôn fetch mới nhất
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Lỗi fetch API:", error);
    return [];
  }
}

export default async function HomePage() {
  const mangas = await getMangas();

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white md:px-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Truyện Mới Cập Nhật</h1>
          <p className="text-sm text-zinc-400">Danh sách truyện đọc trực tuyến</p>
        </div>
      </div>

      {mangas.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
          Chưa có truyện nào hoặc không thể kết nối tới Backend Spring Boot (Port 8080).
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {mangas.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      )}
    </main>
  );
}