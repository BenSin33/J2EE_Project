'use client';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getNotifications,markNotificationRead,markAllNotificationsRead } from '@/lib/api';
import { Notification,NotificationPage } from '@/types/notification';
function Inbox({ unreadOnly }: { unreadOnly: boolean }) {
 const router=useRouter();
 const [data,setData]=useState<NotificationPage | null>(null);
 const [page,setPage]=useState(0);
 const [error,setError]=useState('');
 const [actionError,setActionError]=useState('');
 const [attempt,setAttempt]=useState(0);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{const controller=new AbortController();getNotifications(page,unreadOnly,controller.signal).then(value=>{
  if(controller.signal.aborted)return;
  if(!value.items.length&&page>0){setPage(p=>p-1);return;}setData(value);
 }).catch(err=>{if(!controller.signal.aborted)setError(err instanceof Error?err.message:'Không tải được thông báo.');});return ()=>controller.abort();},[page,unreadOnly,attempt]);
 function reload(){setError('');setAttempt(n=>n+1);}
 async function read(item?: Notification,open=false){
  if(busy)return;setBusy(true);setActionError('');
  try{if(item)await markNotificationRead(item.id);else await markAllNotificationsRead();window.dispatchEvent(new Event('notifications-changed'));
   if(open&&item?.available&&item.chapterId)router.push('/chapter/'+item.chapterId);else reload();
  }catch(err){setActionError(err instanceof Error?err.message:'Không đánh dấu đã đọc được.');}finally{setBusy(false);}
 }
 if(error)return <div role="alert"><p className="text-amber-300">{error}</p><button onClick={reload} className="mt-3 text-violet-300">Thử lại</button></div>;
 if(!data)return <p role="status">Đang tải thông báo…</p>;
 return <><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-gray-400">{data.totalElements} thông báo</p><button disabled={busy||!data.items.length} onClick={()=>read()} className="rounded bg-violet-600 px-4 py-2 disabled:opacity-40">Đánh dấu tất cả đã đọc</button></div>
 {actionError&&<p role="alert" className="mb-4 text-amber-300">{actionError}</p>}
 {!data.items.length?<p className="rounded-xl border border-gray-800 p-8 text-center">Không có thông báo{unreadOnly?' chưa đọc':''}.</p>:<div className="space-y-3">{data.items.map(item=><article key={item.id} className={'rounded-xl border p-4 '+(item.readAt?'border-gray-800 bg-[#16161a]':'border-violet-700 bg-violet-950/30')}>
 <h2 className="font-semibold">{item.mangaTitle} — Chương {item.chapterNumber||'?'}{item.chapterTitle?' · '+item.chapterTitle:''}</h2>
 <p className="mt-1 text-sm text-gray-400"><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN')}</time> · {item.readAt?'Đã đọc':'Chưa đọc'}</p>
 {!item.available&&<p className="mt-2 text-amber-300">Nội dung không còn khả dụng.</p>}
 <div className="mt-3 flex gap-4">{item.available&&item.chapterId&&<button disabled={busy} className="text-violet-300 disabled:opacity-40" onClick={()=>read(item,true)}>Mở chương</button>}{!item.readAt&&<button disabled={busy} onClick={()=>read(item)} className="text-gray-300 disabled:opacity-40">Đánh dấu đã đọc</button>}</div>
 </article>)}</div>}
 {data.totalElements>data.size&&<nav className="mt-6 flex gap-4" aria-label="Phân trang thông báo"><button disabled={page===0||busy} onClick={()=>{setData(null);setPage(p=>p-1);}}>Trước</button><span>Trang {page+1}</span><button disabled={(page+1)*data.size>=data.totalElements||busy} onClick={()=>{setData(null);setPage(p=>p+1);}}>Sau</button></nav>}</>;
}
export default function NotificationsPage(){const [unread,setUnread]=useState(false);return <main className="min-h-screen bg-[#0a0a0c] px-4 py-8 text-gray-100"><div className="mx-auto max-w-4xl"><nav className="flex gap-4"><Link href="/">← Trang chủ</Link><Link href="/library">Tủ sách</Link></nav><h1 className="mt-6 text-3xl font-bold">Thông báo</h1><label className="my-6 flex items-center gap-2"><input type="checkbox" checked={unread} onChange={event=>setUnread(event.target.checked)} />Chỉ hiện chưa đọc</label><Inbox key={String(unread)} unreadOnly={unread}/></div></main>;}
