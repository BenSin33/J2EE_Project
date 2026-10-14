'use client';
import { useEffect, useId, useState } from 'react';
import { Star } from 'lucide-react';
import { getRating, saveRating } from '@/lib/api';
import { RatingSummary } from '@/types/rating';
import { RatingStar } from './RatingStar';
export function RatingPanel({ mangaId }: { mangaId: string }) {
  const name = useId();
  const [summary,setSummary] = useState<RatingSummary | null>(null);
  const [selected,setSelected] = useState(0);
  const [busy,setBusy] = useState(false);
  const [loadError,setLoadError] = useState('');
  const [saveError,setSaveError] = useState('');
  const [message,setMessage] = useState('');
  const [attempt,setAttempt] = useState(0);
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mangaId);
  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    getRating(mangaId,controller.signal).then(value => {
      if (!controller.signal.aborted) { setSummary(value); setSelected(value.myRating || 0); }
    }).catch(err => { if (!controller.signal.aborted) setLoadError(err instanceof Error ? err.message : 'Không tải được đánh giá.'); });
    return () => controller.abort();
  },[mangaId,valid,attempt]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy || selected<1 || selected>5) return;
    setBusy(true); setSaveError(''); setMessage('');
    try { const result = await saveRating(mangaId,selected); setSummary(result); setSelected(result.myRating || 0); setMessage('Đã lưu đánh giá.'); }
    catch(err) { setSaveError(err instanceof Error ? err.message : 'Không lưu được đánh giá.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-6 space-y-3 rounded-xl border border-gray-800 bg-[#16161a] p-4" aria-label="Đánh giá truyện">
    <h2 className="text-lg font-semibold">Đánh giá truyện</h2>
    {!valid ? <p className="text-gray-400">Truyện chưa sẵn sàng để đánh giá.</p> : loadError ? <div role="alert"><p className="text-amber-300">{loadError}</p><button className="mt-2 text-violet-300" onClick={() => { setLoadError(''); setSummary(null); setAttempt(n=>n+1); }}>Thử lại</button></div> : !summary ? <p role="status">Đang tải đánh giá…</p> : <>
      <div className="flex flex-wrap items-center gap-3">{summary.ratingCount>0 ? <RatingStar rating={summary.averageRating} /> : <span>Chưa có đánh giá</span>}<span className="text-sm text-gray-400">{summary.ratingCount} lượt đánh giá</span></div>
      <form onSubmit={submit} className="space-y-3">
        <fieldset disabled={busy}><legend className="mb-2 text-sm text-gray-300">Đánh giá của bạn{summary.myRating ? ': ' + summary.myRating + '/5' : ''}</legend>
          <div className="flex gap-2">{[1,2,3,4,5].map(star => <label key={star} className="relative cursor-pointer rounded p-1">
            <input type="radio" name={name} value={star} checked={selected===star} onChange={() => { setSelected(star); setMessage(''); }} aria-label={star + ' sao'} className="peer sr-only" />
            <Star aria-hidden="true" className={'h-8 w-8 rounded peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400 ' + (star<=selected ? 'fill-yellow-500 text-yellow-500' : 'text-gray-500')} />
          </label>)}</div>
        </fieldset>
        <p className="text-xs text-gray-400">Đăng nhập để đánh giá. Chọn lại sao để cập nhật đánh giá của bạn.</p>
        <button disabled={busy || selected===0 || selected===summary.myRating} className="rounded bg-violet-600 px-4 py-2 disabled:opacity-40">{busy ? 'Đang lưu…' : summary.myRating ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}</button>
      </form>{saveError && <p role="alert" className="text-amber-300">{saveError}</p>}{message && <p role="status" className="text-green-300">{message}</p>}
    </>}
  </section>;
}
