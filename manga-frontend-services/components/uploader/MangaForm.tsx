'use client';

// Thành viên 2 - Form tạo / sửa truyện LOCAL
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Save, Search, X } from 'lucide-react';
import { Dropzone } from '@/components/uploader/Dropzone';
import { CoverImage, ErrorBox, inputClass, labelClass, primaryButton, secondaryButton } from '@/components/uploader/ui';
import type { TagItem, UploaderManga, UploaderMangaPayload } from '@/types/uploader';

interface MangaFormProps {
  initial?: UploaderManga | null;
  tags: TagItem[];
  submitLabel: string;
  onSubmit: (payload: UploaderMangaPayload, coverFile: File | null) => Promise<void>;
  onCancel?: () => void;
}

const LANGUAGES = [
  { value: 'ja', label: 'Tiếng Nhật' },
  { value: 'ko', label: 'Tiếng Hàn' },
  { value: 'zh', label: 'Tiếng Trung' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'Tiếng Anh' },
];

const GROUP_LABELS: Record<string, string> = {
  genre: 'Thể loại',
  theme: 'Chủ đề',
  format: 'Định dạng',
  content: 'Nội dung nhạy cảm',
};

const splitList = (value: string) =>
  value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export function MangaForm({ initial, tags, submitLabel, onSubmit, onCancel }: MangaFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [altTitles, setAltTitles] = useState(
    (initial?.altTitles ?? []).flatMap((m) => Object.values(m)).join('\n')
  );
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'ongoing');
  const [originType, setOriginType] = useState(initial?.originType ?? 'manga');
  const [originalLanguage, setOriginalLanguage] = useState(initial?.originalLanguage ?? 'ja');
  const [contentRating, setContentRating] = useState(initial?.contentRating ?? 'safe');
  const [authors, setAuthors] = useState(
    (initial?.authors ?? []).filter((a) => a.role !== 'artist').map((a) => a.name).join(', ')
  );
  const [artists, setArtists] = useState(
    (initial?.authors ?? []).filter((a) => a.role === 'artist').map((a) => a.name).join(', ')
  );
  const [tagIds, setTagIds] = useState<string[]>((initial?.tags ?? []).map((t) => t.id));
  const [tagFilter, setTagFilter] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const coverPreview = useMemo(() => (coverFile ? URL.createObjectURL(coverFile) : null), [coverFile]);
  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const groupedTags = useMemo(() => {
    const keyword = tagFilter.trim().toLowerCase();
    const groups = new Map<string, TagItem[]>();
    tags
      .filter((t) => !keyword || t.name.toLowerCase().includes(keyword))
      .forEach((t) => {
        const g = t.groupType || 'genre';
        groups.set(g, [...(groups.get(g) ?? []), t]);
      });
    return Array.from(groups.entries());
  }, [tags, tagFilter]);

  const toggleTag = (id: string) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tên truyện không được để trống');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(
        {
          title: title.trim(),
          altTitles: altTitles.split('\n').map((s) => s.trim()).filter(Boolean),
          description: description.trim(),
          status: status as UploaderMangaPayload['status'],
          originType: originType as UploaderMangaPayload['originType'],
          originalLanguage,
          contentRating: contentRating as UploaderMangaPayload['contentRating'],
          tagIds,
          authorNames: splitList(authors),
          artistNames: splitList(artists),
        },
        coverFile
      );
    } catch (err) {
      setError((err as Error).message || 'Lưu truyện thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Ảnh bìa */}
      <div className="space-y-3">
        <p className={labelClass}>Ảnh bìa</p>
        <div className="relative">
          <CoverImage
            src={coverPreview ?? initial?.coverImageUrl}
            alt={title || 'Ảnh bìa'}
            className="w-full aspect-[3/4] rounded-2xl"
          />
          {coverFile && (
            <button
              type="button"
              onClick={() => setCoverFile(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 hover:bg-black text-gray-200 flex items-center justify-center cursor-pointer"
              title="Bỏ ảnh vừa chọn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Dropzone
          compact
          multiple={false}
          accept="image/jpeg,image/png,image/webp,image/gif"
          title={coverFile ? coverFile.name : 'Kéo thả ảnh bìa'}
          hint="jpg, png, webp · tối đa 20MB"
          onFiles={(files) => setCoverFile(files[0] ?? null)}
          disabled={saving}
        />
        <p className="text-[11px] text-gray-500">Ảnh được convert sang WebP và lưu trên Cloudinary.</p>
      </div>

      {/* Thông tin */}
      <div className="space-y-5 min-w-0">
        <div>
          <label className={labelClass} htmlFor="title">Tên truyện *</label>
          <input id="title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} required />
        </div>

        <div>
          <label className={labelClass} htmlFor="alt">Tên khác (mỗi dòng một tên)</label>
          <textarea
            id="alt"
            rows={2}
            className={`${inputClass} h-auto py-3 resize-y`}
            value={altTitles}
            onChange={(e) => setAltTitles(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="desc">Mô tả</label>
          <textarea
            id="desc"
            rows={5}
            maxLength={10000}
            className={`${inputClass} h-auto py-3 resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className={labelClass} htmlFor="status">Trạng thái</label>
            <select id="status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ongoing">Đang tiến hành</option>
              <option value="completed">Hoàn thành</option>
              <option value="hiatus">Tạm ngưng</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="type">Loại</label>
            <select id="type" className={inputClass} value={originType} onChange={(e) => setOriginType(e.target.value)}>
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="manhua">Manhua</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="lang">Ngôn ngữ gốc</label>
            <select id="lang" className={inputClass} value={originalLanguage} onChange={(e) => setOriginalLanguage(e.target.value)}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="rating">Độ tuổi</label>
            <select id="rating" className={inputClass} value={contentRating} onChange={(e) => setContentRating(e.target.value)}>
              <option value="safe">An toàn</option>
              <option value="suggestive">Gợi cảm nhẹ</option>
              <option value="erotica">Nhạy cảm (18+)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="authors">Tác giả (cách nhau bởi dấu phẩy)</label>
            <input id="authors" className={inputClass} value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="VD: Endou Tatsuya" />
          </div>
          <div>
            <label className={labelClass} htmlFor="artists">Hoạ sĩ</label>
            <input id="artists" className={inputClass} value={artists} onChange={(e) => setArtists(e.target.value)} placeholder="Để trống nếu trùng tác giả" />
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <p className={`${labelClass} mb-0`}>Thể loại ({tagIds.length} đã chọn)</p>
            <div className="relative sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#1a1a22] border border-gray-700 text-xs text-gray-100 outline-none focus:border-purple-500"
                placeholder="Lọc thể loại..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#121218] p-3 max-h-64 overflow-y-auto space-y-3">
            {tags.length === 0 && <p className="text-xs text-gray-500">Chưa có thể loại nào trong hệ thống. Cào một truyện MangaDex để có sẵn danh sách thể loại.</p>}
            {groupedTags.map(([group, items]) => (
              <div key={group}>
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5">{GROUP_LABELS[group] ?? group}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((t) => {
                    const active = tagIds.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.id)}
                        aria-pressed={active}
                        className={`px-2.5 py-1 rounded-lg text-xs border transition cursor-pointer ${
                          active
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:border-purple-500/60'
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <ErrorBox message={error} />}

        <div className="flex flex-wrap gap-3 pt-1">
          <button type="submit" className={primaryButton} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Đang lưu...' : submitLabel}
          </button>
          {onCancel && (
            <button type="button" className={secondaryButton} onClick={onCancel} disabled={saving}>
              Huỷ
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
