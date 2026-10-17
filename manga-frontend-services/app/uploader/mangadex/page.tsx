'use client';

// Thành viên 2 - Cào truyện từ MangaDex trong Uploader Dashboard (chỉ ADMIN)
import { useAuthStore } from '@/store/authStore';
import { isAdminRole } from '@/lib/uploaderApi';
import { MangaDexImporter } from '@/components/uploader/MangaDexImporter';
import { ErrorBox } from '@/components/uploader/ui';

export default function UploaderMangaDexPage() {
  const { user } = useAuthStore();
  if (!isAdminRole(user?.role)) {
    return <ErrorBox message="Chỉ Quản trị viên (ROLE_ADMIN) mới được cào dữ liệu từ MangaDex." />;
  }
  return <MangaDexImporter />;
}
