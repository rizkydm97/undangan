# Undangan Pernikahan + Admin (Supabase + Vercel)

Situs statis tanpa build. Data disimpan di Supabase, halaman admin ada di `/admin`.

## 1. Supabase
1. Buat project di supabase.com.
2. **SQL Editor** > jalankan `supabase/schema.sql`, lalu `supabase/seed.sql`.
3. Jalankan `supabase/admin-user.sql` di SQL Editor. Login admin: username `admin`, password `admin123` (segera ganti, lihat komentar di file itu).
4. **Authentication > Sign In / Providers**: matikan **Allow new users to sign up** (penting: semua akun terdaftar dianggap admin).
5. **Settings > API**: salin *Project URL* dan *anon public key* ke `config.js`.

## 2. GitHub
```
git init && git add . && git commit -m "undangan"
git branch -M main
git remote add origin https://github.com/USERNAME/undangan.git
git push -u origin main
```

## 3. Vercel
Import repo di vercel.com. Framework Preset: **Other**, tanpa Build Command, Output Directory dikosongkan. Deploy.
Halaman utama disajikan oleh `api/index.js` (membaca `template.html`) supaya preview link WhatsApp memakai judul/gambar dari admin.

## Pakai
- Undangan: `https://domain-anda.vercel.app/?to=Nama+Tamu`
- Admin: `https://domain-anda.vercel.app/admin`. Tab terpisah (Umum, Mempelai, Acara, Ayat, Cerita, Galeri, Hadiah, Media, Kehadiran, Ucapan). Ubah lalu klik **Simpan ke Supabase** di bar bawah.
- Foto Cover, Hero, dan Penutup kini terpisah (tab Umum). Foto mempelai di tab Mempelai.
- Hadiah: tiap rekening bisa diberi **logo bank**, dan bisa menambah satu atau lebih **QR/QRIS**.
- Video galeri: unggah file `.mp4` (paling bersih, maks 50 MB di paket gratis Supabase) atau tempel link YouTube. Video diputar otomatis tanpa kontrol/tampilan YouTube, ada tombol suara sendiri.
- Kirim Ucapan: satu form (nama, ucapan, hadir / berhalangan, jumlah tamu dengan tombol + / -). Batas jumlah tamu diatur di tab Umum.
- Kehadiran: tab **Kehadiran** menampilkan total tamu dan daftar, tombol **Cetak PDF** (pilih "Simpan sebagai PDF" di jendela cetak).
- Tanggal dan jam acara: hitung mundur memakai zona WIB (+07:00).
- Tidak perlu menjalankan ulang SQL; skema database tidak berubah.
- Preview link (WhatsApp/Instagram): atur judul, deskripsi, dan gambar di admin, tab **Umum > Tampilan Link**. Kosong = otomatis dari nama pasangan, kalimat hero, dan foto cover. WhatsApp menyimpan preview lama; untuk tes, kirim link dengan tambahan `?v=2`.
