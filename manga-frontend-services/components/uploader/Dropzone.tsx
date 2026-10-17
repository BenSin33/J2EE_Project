'use client';

// Thành viên 2 - Vùng kéo thả file (Drag & Drop) dùng cho ảnh bìa và trang chương
import { useRef, useState, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  title?: string;
  hint?: string;
  compact?: boolean;
}

export function Dropzone({
  onFiles,
  accept = 'image/*',
  multiple = true,
  disabled = false,
  title = 'Kéo thả file vào đây',
  hint,
  compact = false,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (list: FileList | null) => {
    if (!list || list.length === 0 || disabled) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handle(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-2xl border-2 border-dashed text-center transition select-none ${
        compact ? 'p-4' : 'p-8'
      } ${
        disabled
          ? 'border-gray-800 bg-[#121218] opacity-60 cursor-not-allowed'
          : dragging
            ? 'border-purple-400 bg-purple-500/10 cursor-copy'
            : 'border-gray-700 bg-[#1a1a22]/60 hover:border-purple-500/60 hover:bg-purple-500/5 cursor-pointer'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handle(e.target.files);
          e.target.value = '';
        }}
      />
      <UploadCloud className={`mx-auto mb-2 text-purple-400 ${compact ? 'w-6 h-6' : 'w-9 h-9'}`} />
      <p className="text-sm font-semibold text-gray-200">{title}</p>
      <p className="text-xs text-gray-500 mt-1">hoặc bấm để chọn file{hint ? ` · ${hint}` : ''}</p>
    </div>
  );
}
