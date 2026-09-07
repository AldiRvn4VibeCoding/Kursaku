import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Kursaku — Kurs USD ke IDR', description: 'Pantau kurs harian dolar Amerika Serikat ke rupiah dan hitung konversi USD ke IDR.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
