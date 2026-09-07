# Kursaku — USD ke IDR

Web pemantau kurs harian USD/IDR dengan konverter, refresh manual, waktu pembaruan dalam WIB, dan cache lokal saat koneksi gagal.

## Menjalankan

Gunakan Node.js >= 22.13.0.

```sh
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan terminal. Untuk build produksi: `npm run build`.

Jika menggunakan Just, jalankan `just r` untuk development. Perintah `just` menampilkan seluruh perintah yang tersedia, termasuk `just install`, `just build`, dan `just start`.

`components.json` menggunakan salinan schema resmi Shadcn di `schemas/shadcn.schema.json` agar validasi editor tidak perlu mengakses URL schema eksternal. Sumber schema: https://ui.shadcn.com/schema.json.

## Sumber kurs

Endpoint publik: https://open.er-api.com/v6/latest/USD

Dokumentasi: https://www.exchangerate-api.com/docs/free

Tidak memerlukan API key. Penyedia memperbarui data sekali sehari, bukan kurs real-time. Atribusi penyedia disertakan di halaman. Web memeriksa pembaruan otomatis setiap satu jam saat halaman terbuka; respons disimpan dalam localStorage. Tombol refresh meminta ulang secara manual. Jika penyedia gagal, data terakhir tetap ditampilkan dengan status kegagalan. Kurs referensi dapat berbeda dari kurs transaksi bank.

Proyek lokal memakai React, TypeScript, dan Vinext. Tidak ada pengujian otomatis yang dijalankan, sesuai instruksi workspace.

## Grafik riwayat

Grafik 7/30 hari kalender memakai API publik Frankfurter v2, tanpa API key: `https://api.frankfurter.dev/v2/rates?base=USD&quotes=IDR&from=YYYY-MM-DD&to=YYYY-MM-DD`. Riwayat 30 hari diambil ketika halaman dibuka; pergantian periode tidak melakukan request tambahan. Tanggal dihitung berdasarkan WIB. Grafik hanya menampilkan data yang tersedia, tanpa menambahkan data buatan. Sumber ini berbeda dari kartu kurs utama sehingga nilainya dapat berbeda. Grafik mengikuti tema siang/malam. Penambahan grafik membuat halaman lebih panjang dan tetap mengizinkan scroll.
