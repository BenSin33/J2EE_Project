'use client';

// Thành viên 2 - Upload chương LOCAL: kéo thả nhiều ảnh (sắp xếp lại được) hoặc một file .zip
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, FileArchive, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { Dropzone } from '@/components/uploader/Dropzone';
import { ErrorBox, inputClass, labelClass, primaryButton, secondaryButton } from '@/components/uploader/ui';
import { uploaderApi } from '@/lib/uploaderApi';
import type { UploaderChapter } from '@/types/uploader';

interface ChapterUploaderProps {
  mangaId: string;
  suggestedNumber: string;
  disabled?: boolean;
  onUploaded: (chapter: UploaderChapter) => void;
}

interface PageFile {
  key: string;
  file: File;
  preview: string | null;
}

const IMAGE_RE = /\.(jpe?g|png|webp|gif)$/i;
const MAX_FILE_MB = 20;

// Sắp xếp tự nhiên giống backend: 2.jpg trước 10.jpg
const naturalCompare = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function ChapterUploader({ mangaId, suggestedNumber, disabled, onUploaded }: ChapterUploaderProps) {
  const [chapterNumber, setChapterNumber] = useState(suggestedNumber);
  const [volume, setVolume] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('vi');
  const [publish, setPublish] = useState(true);
  const [pages, setPages] = useState<PageFile[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Gợi ý số chương tiếp theo mỗi khi danh sách chương thay đổi
  const [prevSuggested, setPrevSuggested] = useState(suggestedNumber);
  if (prevSuggested !== suggestedNumber) {
    setPrevSuggested(suggestedNumber);
    setChapterNumber(suggestedNumber);
  }

  // Thu hồi object URL của ảnh xem trước khi bỏ trang / rời trang
  const pagesRef = useRef<PageFile[]>([]);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);
  useEffect(() => () => pagesRef.current.forEach((p) => p.preview && URL.revokeObjectURL(p.preview)), []);
  const revoke = (list: PageFile[]) => list.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
  const clearPages = () => {
    revoke(pages);
    setPages([]);
  };

  const totalSize = useMemo(
    () => (zipFile ? zipFile.size : pages.reduce((sum, p) => sum + p.file.size, 0)),
    [pages, zipFile]
  );

  const addFiles = (files: File[]) => {
    setError('');
    const zip = files.find((f) => f.name.toLowerCase().endsWith('.zip'));
    if (zip) {
      clearPages();
      setZipFile(zip);
      return;
    }
    const images = files.filter((f) => IMAGE_RE.test(f.name));
    const rejected = files.filter((f) => !IMAGE_RE.test(f.name));
    const tooLarge = images.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (rejected.length) setError(`Bỏ qua file không phải ảnh: ${rejected.map((f) => f.name).join(', ')}`);
    if (tooLarge.length) setError(`Ảnh lớn hơn ${MAX_FILE_MB}MB: ${tooLarge.map((f) => f.name).join(', ')}`);
    const valid = images.filter((f) => f.size <= MAX_FILE_MB * 1024 * 1024);
    if (!valid.length) return;
    setZipFile(null);
    setPages((prev) =>
      [
        ...prev,
        ...valid
          .sort((a, b) => naturalCompare(a.name, b.name))
          .map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, file, preview: URL.createObjectURL(file) })),
      ]
    );
  };

  const move = (index: number, delta: number) =>
    setPages((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const removePage = (index: number) => {
    revoke([pages[index]]);
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    clearPages();
    setZipFile(null);
    setVolume('');
    setTitle('');
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!chapterNumber.trim()) {
      setError('Nhập số chương');
      return;
    }
    if (!zipFile && pages.length === 0) {
      setError('Chưa chọn ảnh trang nào');
      return;
    }
    setUploading(true);
    setError('');
    try {
      // Đổi tên theo thứ tự đang hiển thị để server giữ đúng thứ tự đã sắp xếp
      const files = zipFile
        ? [zipFile]
        : pages.map((p, i) => new File([p.file], `${String(i + 1).padStart(4, '0')}_${p.file.name}`, { type: p.file.type }));
      const chapter = await uploaderApi.createChapter(
        mangaId,
        { chapterNumber: chapterNumber.trim(), volume: volume.trim(), title: title.trim(), language, publish },
        files
      );
      reset();
      onUploaded(chapter);
    } catch (err) {
      setError((err as Error).message || 'Upload chương thất bại');
    } finally {
      setUploading(false);
    }
  };

  const busy = uploading || disabled;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className={labelClass} htmlFor="ch-number">Số chương *</label>
          <input id="ch-number" className={inputClass} value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} maxLength={50} disabled={busy} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="ch-volume">Tập</label>
          <input id="ch-volume" className={inputClass} value={volume} onChange={(e) => setVolume(e.target.value)} maxLength={20} disabled={busy} />
        </div>
        <div className="col-span-2">
          <label className={labelClass} htmlFor="ch-title">Tên chương</label>
          <input id="ch-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} disabled={busy} />
        </div>
        <div className="col-span-2 lg:col-span-1">
          <label className={labelClass} htmlFor="ch-lang">Ngôn ngữ</label>
          <select id="ch-lang" className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)} disabled={busy}>
            <option value="vi">Tiếng Việt</option>
            <option value="en">Tiếng Anh</option>
          </select>
        </div>
      </div>

      <Dropzone
        onFiles={addFiles}
        accept="image/jpeg,image/png,image/webp,image/gif,.zip,application/zip"
        title="Kéo thả ảnh trang hoặc một file .zip"
        hint={`jpg, png, webp, gif · tối đa ${MAX_FILE_MB}MB/ảnh · tự sắp xếp 1, 2, ..., 10`}
        disabled={busy}
      />

      {zipFile && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-[#121218]">
          <FileArchive className="w-8 h-8 text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-200 truncate">{zipFile.name}</p>
            <p className="text-xs text-gray-500">{formatSize(zipFile.size)} · ảnh trong file zip được sắp xếp theo tên</p>
          </div>
          <button type="button" onClick={() => setZipFile(null)} disabled={busy} className="w-8 h-8 rounded-lg hover:bg-gray-800 text-gray-400 flex items-center justify-center cursor-pointer" title="Bỏ file zip">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {pages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">
              {pages.length} trang · {formatSize(totalSize)} · dùng mũi tên để đổi thứ tự
            </p>
            <button type="button" onClick={clearPages} disabled={busy} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Xoá hết
            </button>
          </div>
          <ol className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {pages.map((p, i) => (
              <li key={p.key} className="group relative rounded-xl overflow-hidden border border-gray-800 bg-[#121218]">
                {p.preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.preview} alt={`Trang ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                )}
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 text-[10px] font-bold text-white">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removePage(i)}
                  disabled={busy}
                  title="Bỏ trang này"
                  className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/75 text-gray-200 hover:bg-rose-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center justify-between px-1 py-1 bg-black/40">
                  <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} className="p-1 rounded text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer" title="Lên trước">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-gray-500 truncate px-1" title={p.file.name}>{p.file.name}</span>
                  <button type="button" onClick={() => move(i, 1)} disabled={busy || i === pages.length - 1} className="p-1 rounded text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer" title="Ra sau">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} disabled={busy} className="w-4 h-4 accent-purple-600" />
        Xuất bản ngay (bỏ chọn để lưu nháp, người đọc chưa thấy)
      </label>

      {error && <ErrorBox message={error} />}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={primaryButton} disabled={busy}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {uploading ? 'Đang upload lên Cloudinary...' : 'Upload chương'}
        </button>
        {(pages.length > 0 || zipFile) && !uploading && (
          <button type="button" className={secondaryButton} onClick={reset}>Làm lại</button>
        )}
        {uploading && <p className="text-xs text-gray-500">Có thể mất vài phút với chương nhiều trang, đừng đóng trang.</p>}
      </div>
    </form>
  );
}
