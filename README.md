# Undangan Pernikahan + Admin (Supabase + Vercel)

Situs statis tanpa build. Data disimpan di Supabase, halaman admin ada di `/admin`.

## 1. Supabase
1. Buat project di supabase.com.
2. **SQL Editor** > jalankan `supabase/schema.sql`, lalu `supabase/seed.sql`.
3. **Authentication > Users > Add user**: buat email dan password admin (centang *Auto Confirm*).
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

## Pakai
- Undangan: `https://domain-anda.vercel.app/?to=Nama+Tamu`
- Admin: `https://domain-anda.vercel.app/admin` lalu login, ubah, klik **Simpan**.
- Video galeri: tempel link YouTube atau .mp4 di admin. Video otomatis diputar saat galeri terlihat. Browser hanya mengizinkan autoplay jika suara mati, jadi video mulai tanpa suara dan tamu bisa menyalakannya.
- Tanggal dan jam acara: hitung mundur memakai zona WIB (+07:00).
