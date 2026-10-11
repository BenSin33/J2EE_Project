'use client';
import { useEffect, useState } from 'react';
import { createComment, deleteComment, editComment, getComments } from '@/lib/api';
import { Comment, CommentPage } from '@/types/comment';
interface Scope { mangaId: string; chapterId?: string; parentId?: string; }
function CommentForm({ scope, comment, onDone, onCancel }: { scope: Scope; comment?: Comment; onDone: () => void; onCancel?: () => void }) {
  const [content,setContent] = useState(comment?.content || '');
  const [spoiler,setSpoiler] = useState(comment?.spoiler || false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || !content.trim()) return;
    setBusy(true); setError('');
    try {
      if (comment) await editComment(comment.id,content,spoiler);
      else await createComment(scope.mangaId,scope.chapterId,scope.parentId,content,spoiler);
      setContent(''); setSpoiler(false); onDone();
    } catch(err) { setError(err instanceof Error ? err.message : 'Không gửi được bình luận.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-3">
    <label className="block text-sm">{comment ? 'Sửa bình luận' : scope.parentId ? 'Nội dung trả lời' : 'Viết bình luận'}
      <textarea aria-label="Nội dung bình luận" disabled={busy} value={content} maxLength={2000} onChange={event => setContent(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 p-3" required />
    </label>
    <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={spoiler} disabled={busy} onChange={event => setSpoiler(event.target.checked)} />Có spoiler</label>
      <button disabled={busy || !content.trim()} className="rounded bg-violet-600 px-4 py-2 disabled:opacity-40">{busy ? 'Đang gửi…' : comment ? 'Lưu thay đổi' : 'Gửi'}</button>
      {onCancel && <button type="button" disabled={busy} onClick={onCancel} className="text-gray-400">Hủy</button>}
      <span className="text-xs text-gray-500">{content.length}/2000</span>
    </div>{error && <p role="alert" className="text-amber-300">{error}</p>}
  </form>;
}
function CommentItem({ comment, scope, onChanged }: { comment: Comment; scope: Scope; onChanged: () => void }) {
  const [reveal,setReveal] = useState(false);
  const [editing,setEditing] = useState(false);
  const [replies,setReplies] = useState(false);
  const [replying,setReplying] = useState(false);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [replyVersion,setReplyVersion] = useState(0);
  async function remove() {
    setBusy(true); setError('');
    try { await deleteComment(comment.id); onChanged(); }
    catch(err) { setError(err instanceof Error ? err.message : 'Không xóa được bình luận.'); }
    finally { setBusy(false); }
  }
  return <article className="space-y-3 rounded-xl border border-gray-800 bg-[#16161a] p-4">
    <header className="flex flex-wrap gap-3 text-sm"><strong>{comment.username}</strong><time dateTime={comment.createdAt} className="text-gray-400">{new Date(comment.createdAt).toLocaleString('vi-VN')}</time>{comment.updatedAt && !comment.deleted && <span className="text-gray-500">Đã sửa</span>}</header>
    {editing ? <CommentForm scope={scope} comment={comment} onCancel={() => setEditing(false)} onDone={() => { setEditing(false); onChanged(); }} /> : comment.deleted ? <p className="italic text-gray-500">Bình luận đã được xóa.</p> : comment.hidden ? <p className="italic text-gray-500">Bình luận đã bị ẩn.</p> : comment.spoiler && !reveal ? <button className="rounded border border-amber-700 px-3 py-2 text-amber-300" onClick={() => setReveal(true)}>Có spoiler — bấm để xem</button> : <div><p className="whitespace-pre-wrap break-words">{comment.content}</p>{comment.spoiler && <button className="mt-2 text-sm text-amber-300" onClick={() => setReveal(false)}>Ẩn spoiler</button>}</div>}
    <div className="flex flex-wrap gap-4 text-sm text-violet-300">
      {!comment.parentId && !comment.hidden && !comment.deleted && <button onClick={() => setReplying(value => !value)}>Trả lời</button>}
      {comment.canEdit && <button disabled={busy} onClick={() => setEditing(true)}>Sửa</button>}
      {comment.canDelete && <button disabled={busy} onClick={remove}>{busy ? 'Đang xóa…' : 'Xóa'}</button>}
      {!comment.parentId && comment.replyCount > 0 && <button onClick={() => setReplies(value => !value)}>{replies ? 'Ẩn trả lời' : 'Xem ' + comment.replyCount + ' trả lời'}</button>}
    </div>{error && <p role="alert" className="text-amber-300">{error}</p>}
    {replying && <CommentForm scope={{ ...scope,parentId:comment.id }} onCancel={() => setReplying(false)} onDone={() => { setReplying(false); setReplies(true); setReplyVersion(n => n + 1); onChanged(); }} />}
    {replies && <div className="border-l border-violet-800 pl-4"><CommentList key={replyVersion} scope={{ ...scope,parentId:comment.id }} /></div>}
  </article>;
}
function CommentList({ scope }: { scope: Scope }) {
  const [data,setData] = useState<CommentPage | null>(null);
  const [page,setPage] = useState(0);
  const [error,setError] = useState('');
  const [attempt,setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getComments(scope.mangaId,scope.chapterId,scope.parentId,page,controller.signal).then(value => { if(!controller.signal.aborted) setData(value); }).catch(err => { if(!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Không tải được bình luận.'); });
    return () => controller.abort();
  },[scope.mangaId,scope.chapterId,scope.parentId,page,attempt]);
  function reload() { setError(''); setAttempt(n => n + 1); }
  function go(next: number) { setData(null); setError(''); setPage(next); }
  if(error) return <div role="alert"><p className="text-amber-300">{error}</p><button onClick={reload} className="mt-2 text-violet-300">Thử lại</button></div>;
  if(!data) return <p role="status">Đang tải bình luận…</p>;
  return <div className="space-y-4">{!data.items.length ? <p className="text-gray-400">Chưa có bình luận.</p> : data.items.map(comment => <CommentItem key={comment.id} comment={comment} scope={scope} onChanged={reload} />)}
    {data.totalElements>data.size && <nav className="flex gap-4" aria-label="Phân trang bình luận"><button disabled={page===0} onClick={() => go(page-1)}>Trước</button><span>Trang {page+1}</span><button disabled={(page+1)*data.size>=data.totalElements} onClick={() => go(page+1)}>Sau</button></nav>}
  </div>;
}
export function CommentSection({ mangaId,chapterId }: Scope) {
  const [version,setVersion] = useState(0);
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
  if (!valid) return <section className="mt-8"><h2 className="text-2xl font-semibold">Bình luận</h2><p className="mt-3 text-gray-400">Truyện chưa sẵn sàng để bình luận.</p></section>;
  const scope = { mangaId,chapterId };
  return <section className="mx-auto mt-8 max-w-4xl space-y-6 px-4 pb-8"><h2 className="text-2xl font-semibold">Bình luận</h2><p className="text-sm text-gray-400">Đăng nhập để bình luận hoặc trả lời. Đánh dấu spoiler nếu tiết lộ nội dung truyện.</p><CommentForm scope={scope} onDone={() => setVersion(n => n + 1)} /><CommentList key={version} scope={scope} /></section>;
}
