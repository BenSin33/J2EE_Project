'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount, ReaderApiError } from '@/lib/api';
export function NotificationBell() {
 const [count,setCount]=useState<number | null>(null);
 const [title,setTitle]=useState('Thông báo');
 useEffect(()=>{
  let request: AbortController | null=null;
  let active=true;
  async function refresh(){
   request?.abort();const controller=new AbortController();request=controller;
   try{const data=await getUnreadNotificationCount(controller.signal);if(active&&!controller.signal.aborted){setCount(data.count);setTitle('Thông báo');}}
   catch(err){if(active&&!controller.signal.aborted){setCount(null);setTitle(err instanceof ReaderApiError&&err.status===401?'Đăng nhập để xem thông báo':'Không tải được số thông báo chưa đọc');}}
  }
  refresh();const interval=setInterval(refresh,30000);
  window.addEventListener('notifications-changed',refresh);
  return ()=>{active=false;request?.abort();clearInterval(interval);window.removeEventListener('notifications-changed',refresh);};
 },[]);
 return <Link href="/notifications" title={title} aria-label={'Thông báo'+(count!==null?', '+count+' chưa đọc':'')} className="relative rounded-lg p-2 text-violet-300">
  <Bell className="h-5 w-5" aria-hidden="true" />{count!==null&&count>0&&<span className="absolute -right-1 -top-1 rounded-full bg-violet-600 px-1.5 text-xs text-white">{count>99?'99+':count}</span>}
 </Link>;
}
