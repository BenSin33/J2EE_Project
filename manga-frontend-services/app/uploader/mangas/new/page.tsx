'use client';

// Thành viên 2 - Đăng truyện mới (nguồn LOCAL)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploaderApi } from '@/lib/uploaderApi';
import { MangaForm } from '@/components/uploader/MangaForm';
import { Card, ErrorBox, PageHeader } from '@/components/uploader/ui';
import type { TagItem } from '@/types/uploader';

export default function NewMangaPage() {
  const router = useRouter();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagError, setTagError] = useState('');

  useEffect(() => {
    uploaderApi.tags().then(setTags).catch((err: Error) => setTagError(err.message));
  }, []);

  return (
    <div>
      <PageHeader
        title="Đăng truyện mới"
        description="Truyện của bạn sẽ ở trạng thái Chờ duyệt cho tới khi Admin duyệt (truyện do Admin tạo được duyệt luôn). Sau khi tạo, bạn có thể upload chương ngay."
      />
      {tagError && <div className="mb-4"><ErrorBox message={tagError} /></div>}
      <Card>
        <MangaForm
          tags={tags}
          submitLabel="Tạo truyện"
          onCancel={() => router.push('/uploader/mangas')}
          onSubmit={async (payload, coverFile) => {
            const manga = await uploaderApi.createManga(payload);
            let coverFailed = '';
            if (coverFile) {
              try {
                await uploaderApi.uploadCover(manga.id, coverFile);
              } catch (err) {
                coverFailed = (err as Error).message;
              }
            }
            const query = coverFailed ? `?coverError=${encodeURIComponent(coverFailed)}` : '?created=1';
            router.push(`/uploader/mangas/${manga.id}${query}`);
          }}
        />
      </Card>
    </div>
  );
}
