'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, RefreshCw, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RateHistory } from '@/components/rate-history';

type Quote = { rate: number; updated: number; next: number; checked: number };
const KEY = 'usd-idr-quote-v1';
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 });
const date = (value: number) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(value * 1000) + ' WIB';
function valid(q: Quote) { return q && Number.isFinite(q.rate) && q.rate > 0 && Number.isFinite(q.updated) && q.updated > 0 && Number.isFinite(q.next) && q.next > q.updated && Number.isFinite(q.checked); }

export default function Home() {
  const [night, setNight] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem('kursaku-theme'); } catch {}
      const dark = saved === 'night' || (saved !== 'day' && media.matches);
      setNight(dark);
      document.documentElement.dataset.theme = dark ? 'night' : 'day';
    };
    apply();
    media.addEventListener('change', apply);
    window.addEventListener('storage', apply);
    return () => { media.removeEventListener('change', apply); window.removeEventListener('storage', apply); };
  }, []);
  function toggleTheme() {
    const theme = night ? 'day' : 'night';
    setNight(!night);
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('kursaku-theme', theme); } catch {}
  }
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('100');
  const [now, setNow] = useState(0);
  const busy = useRef(false);
  const current = useRef<Quote | null>(null);
  async function refresh(manual = false) {
    if (busy.current) return;
    const cached = current.current;
    if (!manual && cached && Date.now() - cached.checked < 3600000) { setLoading(false); return; }
    busy.current = true; setLoading(true); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 429 ? 'Terlalu banyak permintaan. Coba lagi dalam 20 menit.' : 'Layanan kurs sedang tidak tersedia. Coba lagi nanti.');
      const data = await response.json();
      const q: Quote = { rate: data.rates?.IDR, updated: data.time_last_update_unix, next: data.time_next_update_unix, checked: Date.now() };
      if (data.result !== 'success' || data.base_code !== 'USD' || !valid(q)) throw new Error('Data kurs dari layanan tidak valid. Coba lagi nanti.');
      current.current = q; setQuote(q); setNow(Date.now());
      try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* Storage may be disabled. */ }
    } catch (e) {
      setError(e instanceof Error && e.name !== 'TypeError' && e.name !== 'AbortError' ? e.message : 'Kurs belum bisa diperbarui. Periksa koneksi internet, lalu coba lagi.');
    } finally { clearTimeout(timeout); busy.current = false; setLoading(false); }
  }
  useEffect(() => {
    setNow(Date.now());
    try { const q = JSON.parse(localStorage.getItem(KEY) || 'null'); if (valid(q)) { current.current = q; setQuote(q); } } catch { /* Ignore broken cache. */ }
    void refresh();
    const timer = setInterval(() => { setNow(Date.now()); void refresh(); }, 60000);
    return () => clearInterval(timer);
  }, []);
  const number = Number(amount);
  const invalid = amount === '' || !Number.isFinite(number) || number < 0 || number > 1e12;
  const stale = quote && now >= quote.next * 1000;
  return (
    <main className="shell">
      <header className="topbar"><a className="brand" href="/" aria-label="Kursaku beranda"><span className="brand-icon">↗</span> kursaku<span className="brand-dot">.</span></a><div className="header-actions"><span className="edition">MONITOR KURS / USD–IDR</span><Button className="theme-toggle" variant="outline" onClick={toggleTheme} aria-label="Mode malam" aria-pressed={night}>{night ? <Moon size={16} /> : <Sun size={16} />}<span>{night ? 'Malam' : 'Siang'}</span></Button></div></header>
      <div className="heading"><div><p className="eyebrow">DOLAR AS → RUPIAH</p><h1>Pantau nilai dolar.</h1><p className="subtitle">Kurs USD ke IDR dalam satu tampilan.</p></div><span className="daily">Pembaruan harian</span></div>
      <section className="rate-card" aria-labelledby="rate-title" aria-busy={loading}>
        <div className="card-top"><h2 id="rate-title">1 Dolar Amerika Serikat</h2><span className="currency-tag">USD / IDR</span></div>
        <div className="rate" aria-live="polite">{quote ? rupiah.format(quote.rate) : 'Rp —'}</div>
        <p className="rate-caption">Rupiah Indonesia per 1 USD</p>
        <div className="rate-bottom"><span className="status"><i className={error || stale ? 'warn' : ''} />{loading ? 'Mengambil kurs…' : error ? 'Pembaruan gagal' : stale ? 'Menunggu data terbaru' : 'Kurs harian tersedia'}</span><button className="refresh" onClick={() => void refresh(true)} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} />{loading ? 'Memperbarui' : 'Refresh kurs'}</button></div>
      </section>
      {error && <p className="error" role="alert">{error}{quote ? ' Kurs terakhir yang tersimpan tetap ditampilkan.' : ''}</p>}
      <div className="details"><div><p>Data diperbarui</p><strong>{quote ? date(quote.updated) : '—'}</strong></div><div><p>Jadwal pembaruan berikutnya</p><strong>{quote ? date(quote.next) : '—'}</strong></div><div><p>Terakhir diperiksa</p><strong>{quote ? date(Math.floor(quote.checked / 1000)) : '—'}</strong></div></div>
      <section className="converter" aria-labelledby="converter-title"><div className="converter-heading"><span className="small-icon"><ArrowDown size={20} /></span><div><h2 id="converter-title">Hitung ke rupiah</h2><p>Konversi dengan kurs yang ditampilkan.</p></div></div><div className="conversion-grid"><div><label htmlFor="amount">Jumlah dolar</label><div className="input-wrap"><span>USD</span><input id="amount" type="number" min="0" max="1000000000000" step="any" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} aria-invalid={invalid} aria-describedby={invalid ? 'amount-error' : undefined} /></div></div><span className="equals" aria-hidden="true">=</span><div><p className="output-label">Nilai dalam rupiah</p><output>{quote && !invalid ? rupiah.format(number * quote.rate) : 'Rp —'}</output></div></div>{invalid && <p id="amount-error" className="input-error">Masukkan jumlah antara 0 dan 1 triliun USD.</p>}</section>
      <RateHistory />
      <footer><p>Kurs referensi harian. Kurs transaksi bank atau money changer dapat berbeda.</p><a href="https://www.exchangerate-api.com" target="_blank" rel="noreferrer">Rates By Exchange Rate API <ArrowUpRight size={14} /></a></footer>
    </main>
  );
}
