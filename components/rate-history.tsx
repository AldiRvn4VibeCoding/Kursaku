'use client';

import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

type Point = { date: string; rate: number; time: number };
const day = 86400000;
const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
const label = (time: number) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(time);
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 2 }).format(value);

export function RateHistory() {
  const [points, setPoints] = useState<Point[]>([]);
  const [end, setEnd] = useState(0);
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    const today = Date.parse(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()) + 'T00:00:00Z');
    setEnd(today); setLoading(true); setError('');
    async function load() {
      try {
        const query = new URLSearchParams({ base: 'USD', quotes: 'IDR', from: iso(today - 29 * day), to: iso(today) });
        const response = await fetch(`https://api.frankfurter.dev/v2/rates?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error('request failed');
        const rows: unknown = await response.json();
        if (!Array.isArray(rows)) throw new Error('invalid response');
        const data: Point[] = rows.filter(row => row && row.base === 'USD' && row.quote === 'IDR' && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(row.rate) && row.rate > 0)
          .map(row => ({ date: row.date, rate: row.rate, time: Date.parse(row.date + 'T00:00:00Z') }))
          .filter(row => Number.isFinite(row.time) && row.time >= today - 29 * day && row.time <= today)
          .sort((a, b) => a.time - b.time);
        if (active) setPoints(data);
      } catch {
        if (active) setError('Riwayat belum bisa dimuat. Periksa koneksi internet lalu coba lagi.');
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  const data = points.filter(point => point.time >= end - (Number(period) - 1) * day);
  return <section className="history" aria-labelledby="history-title">
    <Tabs value={period} onValueChange={value => setPeriod(String(value))}>
      <div className="history-heading">
        <div><h2 id="history-title">Riwayat kurs USD/IDR</h2><p>Rupiah per 1 USD · {period} hari kalender terakhir</p></div>
        <TabsList className="history-tabs" aria-label="Periode grafik">
          <TabsTrigger value="7">7 hari</TabsTrigger><TabsTrigger value="30">30 hari</TabsTrigger>
        </TabsList>
      </div>
      {['7', '30'].map(value => <TabsContent key={value} value={value}>
        {loading ? <p className="history-state" role="status">Memuat riwayat kurs…</p> : error ? <div className="history-state"><p role="alert">{error}</p><Button className="theme-toggle" onClick={() => setAttempt(n => n + 1)}>Coba lagi</Button></div> : data.length < 2 ? <p className="history-state" role="status">Data belum cukup untuk menampilkan grafik pada periode ini.</p> : <>
          <div className="history-chart" aria-label={`Grafik kurs dari ${label(data[0].time)} hingga ${label(data[data.length - 1].time)}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} accessibilityLayer margin={{ top: 12, right: 14, bottom: 6, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={label} tick={{ fill: 'var(--history-muted)', fontSize: 12 }} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} width={70} tickFormatter={value => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value)} tick={{ fill: 'var(--history-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={value => label(Number(value))} formatter={value => [money(Number(value)), '1 USD']} contentStyle={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Line type="linear" dataKey="rate" stroke="var(--history-line)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="history-caption">{label(data[0].time)}–{label(data[data.length - 1].time)} · {data.length} titik data. Arahkan kursor atau gunakan tombol panah pada grafik untuk melihat kurs.</p>
        </>}
      </TabsContent>)}
    </Tabs>
    <p className="history-source">Sumber: <a href="https://frankfurter.dev" target="_blank" rel="noreferrer">Frankfurter</a>. Kurs dapat berbeda dari kartu utama (ExchangeRate-API). Tanggal tanpa data tidak ditambahkan.</p>
  </section>;
}
