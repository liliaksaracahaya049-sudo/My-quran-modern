// server.js
// My Quran Modern — backend Express.
// Tugas server ini: (1) menyajikan file frontend statis, (2) jadi proxy + cache
// ke Al Quran Cloud API supaya frontend tidak perlu memanggil API luar berkali-kali,
// dan supaya kalau suatu saat sumber data diganti, cukup diubah di satu tempat.

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = "https://api.alquran.cloud/v1";

// Cache sederhana di memori. Teks Al-Qur'an tidak pernah berubah,
// jadi aman disimpan selama proses server hidup.
const cache = new Map();

async function cachedFetch(key, url) {
  if (cache.has(key)) return cache.get(key);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data dari sumber (${res.status})`);
  }
  const data = await res.json();
  cache.set(key, data);
  return data;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Daftar 114 surah beserta metadata (nama, jumlah ayat, arti, tempat turun)
app.get("/api/surah", async (req, res) => {
  try {
    const data = await cachedFetch("surah-list", `${API_BASE}/surah`);
    res.json(data.data);
  } catch (err) {
    res.status(502).json({ error: "Tidak bisa memuat daftar surah. Coba lagi ya." });
  }
});

// Daftar qori (edisi audio) yang tersedia
app.get("/api/reciters", async (req, res) => {
  try {
    const data = await cachedFetch(
      "reciters",
      `${API_BASE}/edition/format/audio`
    );
    // Fokus ke resitasi Arab (bukan audio terjemahan bahasa lain)
    const reciters = data.data.filter((e) => e.language === "ar");
    res.json(reciters);
  } catch (err) {
    res.status(502).json({ error: "Tidak bisa memuat daftar qori. Coba lagi ya." });
  }
});

// Teks satu surah: Arab (Uthmani) + terjemahan Indonesia, digabung per ayat
app.get("/api/surah/:number/text", async (req, res) => {
  const { number } = req.params;
  try {
    const data = await cachedFetch(
      `surah-text-${number}`,
      `${API_BASE}/surah/${number}/editions/quran-uthmani,id.indonesian`
    );
    const [arab, terjemahan] = data.data;
    const ayat = arab.ayahs.map((a, i) => ({
      nomor: a.numberInSurah,
      arab: a.text,
      terjemahan: terjemahan.ayahs[i].text,
    }));
    res.json({
      nama: arab.name,
      namaLatin: arab.englishName,
      arti: arab.englishNameTranslation,
      tempatTurun: arab.revelationType,
      jumlahAyat: arab.numberOfAyahs,
      ayat,
    });
  } catch (err) {
    res.status(502).json({ error: "Tidak bisa memuat teks surah. Coba lagi ya." });
  }
});

// Audio satu surah untuk qori tertentu, per ayat (dibutuhkan untuk fitur pengulangan per-ayat)
app.get("/api/surah/:number/audio/:reciter", async (req, res) => {
  const { number, reciter } = req.params;
  try {
    const data = await cachedFetch(
      `surah-audio-${number}-${reciter}`,
      `${API_BASE}/surah/${number}/${reciter}`
    );
    const ayat = data.data.ayahs.map((a) => ({
      nomor: a.numberInSurah,
      audio: a.audio,
    }));
    res.json({
      nama: data.data.name,
      namaLatin: data.data.englishName,
      jumlahAyat: data.data.numberOfAyahs,
      ayat,
    });
  } catch (err) {
    res.status(502).json({ error: "Tidak bisa memuat audio surah. Coba lagi ya." });
  }
});

app.listen(PORT, () => {
  console.log(`My Quran Modern jalan di port ${PORT}`);
});
