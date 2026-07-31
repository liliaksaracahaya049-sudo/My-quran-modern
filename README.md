# My Quran Modern

Website Al-Qur'an & murotal digital. Teks Arab + terjemahan Indonesia diambil
langsung dari **Al Quran Cloud API** (sumber mushaf standar), jadi akurasinya
terjaga — bukan ketikan manual.

## Struktur project

```
my-quran-modern/
├── server.js          # Backend Express: static hosting + proxy/cache API
├── package.json
├── public/
│   ├── index.html      # Struktur halaman (2 tab: Murotal & Al-Qur'an)
│   ├── css/styles.css   # Desain visual
│   └── js/app.js        # Logika navigasi, baca Qur'an, player + pengulangan ayat
```

## Jalanin di komputer sendiri (opsional, buat coba-coba dulu)

```bash
npm install
npm start
```

Lalu buka `http://localhost:3000` di browser.

## Upload ke GitHub

1. Bikin repository baru di https://github.com/new (misal namanya `my-quran-modern`), **jangan** dicentang "Add README" biar nggak bentrok.
2. Di folder project ini, jalankan:

```bash
git init
git add .
git commit -m "Initial commit: My Quran Modern"
git branch -M main
git remote add origin https://github.com/USERNAME/my-quran-modern.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kamu.

## Deploy ke Railway

1. Buka https://railway.app, login pakai akun GitHub.
2. Klik **New Project** → **Deploy from GitHub repo** → pilih repo `my-quran-modern`.
3. Railway otomatis mendeteksi `package.json` dan menjalankan `npm start`.
4. Setelah selesai build, buka tab **Settings** pada service → **Networking** → klik **Generate Domain** untuk dapat link publik.
5. Ke depannya, tiap kali kamu `git push` ke GitHub, Railway otomatis re-deploy sendiri.

## Catatan aksesibilitas

- Semua tombol punya `aria-label` yang jelas.
- Status pemutaran audio dan hitungan pengulangan ayat pakai `aria-live`, jadi otomatis dibacakan screen reader tanpa perlu pindah fokus.
- Tab navigasi bawah pakai `aria-current` supaya screen reader tahu tab mana yang sedang aktif.
