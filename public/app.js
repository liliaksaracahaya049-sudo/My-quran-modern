(() => {
  "use strict";

  // ---------- Elemen ----------
  const tabMurotal = document.getElementById("tab-murotal");
  const tabQuran = document.getElementById("tab-quran");
  const viewMurotal = document.getElementById("view-murotal");
  const viewQuran = document.getElementById("view-quran");

  const daftarSurahQuran = document.getElementById("daftar-surah-quran");
  const daftarSurahMurotal = document.getElementById("daftar-surah-murotal");
  const cariSurahInput = document.getElementById("cari-surah");
  const pilihQori = document.getElementById("pilih-qori");

  const quranDaftarPanel = document.getElementById("quran-daftar");
  const quranBacaPanel = document.getElementById("quran-baca");
  const quranSurahInfo = document.getElementById("quran-surah-info");
  const quranAyatList = document.getElementById("quran-ayat-list");
  const btnKembaliQuran = document.getElementById("btn-kembali-quran");

  const murotalDaftarPanel = document.getElementById("murotal-daftar");
  const murotalPlayerPanel = document.getElementById("murotal-player");
  const murotalSurahInfo = document.getElementById("murotal-surah-info");
  const btnKembaliMurotal = document.getElementById("btn-kembali-murotal");

  const audioPlayer = document.getElementById("audio-player");
  const btnPutarJeda = document.getElementById("btn-putar-jeda");
  const ikonPutarJeda = document.getElementById("ikon-putar-jeda");
  const btnAyatSebelumnya = document.getElementById("btn-ayat-sebelumnya");
  const btnAyatBerikutnya = document.getElementById("btn-ayat-berikutnya");
  const playerStatus = document.getElementById("player-status");
  const pilihPengulangan = document.getElementById("pilih-pengulangan");
  const repeatCounterEl = document.getElementById("repeat-counter");

  const pesanError = document.getElementById("pesan-error");

  // ---------- State ----------
  let daftarSurah = [];
  let daftarQori = [];
  let ayatMurotalAktif = [];   // [{nomor, audio}]
  let indexAyatAktif = 0;
  let jumlahPengulanganSaatIni = 0;

  // ---------- Util ----------
  function tampilkanError(pesan) {
    pesanError.textContent = pesan;
    pesanError.hidden = false;
    window.setTimeout(() => { pesanError.hidden = true; }, 6000);
  }

  async function ambilJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Terjadi kesalahan mengambil data.");
    }
    return res.json();
  }

  // ---------- Navigasi tab ----------
  function pindahTab(tab) {
    const keMurotal = tab === "murotal";
    viewMurotal.hidden = !keMurotal;
    viewQuran.hidden = keMurotal;
    tabMurotal.setAttribute("aria-current", keMurotal ? "page" : "false");
    tabQuran.setAttribute("aria-current", !keMurotal ? "page" : "false");
    if (!keMurotal) {
      hentikanAudio();
    }
  }
  tabMurotal.addEventListener("click", () => pindahTab("murotal"));
  tabQuran.addEventListener("click", () => pindahTab("quran"));

  // ---------- Muat data awal ----------
  async function muatDaftarSurah() {
    daftarSurah = await ambilJSON("/api/surah");
    renderDaftarSurah(daftarSurahQuran, daftarSurah, bukaSurahQuran, false);
    renderDaftarSurah(daftarSurahMurotal, daftarSurah, bukaSurahMurotal, true);
  }

  async function muatDaftarQori() {
    daftarQori = await ambilJSON("/api/reciters");
    pilihQori.innerHTML = "";
    daftarQori.forEach((q) => {
      const opt = document.createElement("option");
      opt.value = q.identifier;
      opt.textContent = q.englishName;
      pilihQori.appendChild(opt);
    });
    // Prioritaskan Alafasy sebagai default kalau ada, karena paling umum dikenal
    const alafasy = daftarQori.find((q) => q.identifier === "ar.alafasy");
    if (alafasy) pilihQori.value = alafasy.identifier;
  }

  function renderDaftarSurah(container, list, onKlik, mode) {
    container.innerHTML = "";
    list.forEach((s) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "surah-item";
      btn.setAttribute(
        "aria-label",
        `Surah ${s.englishName}, ${s.numberOfAyahs} ayat, ${s.revelationType === "Meccan" ? "turun di Makkah" : "turun di Madinah"}`
      );
      btn.innerHTML = `
        <span class="surah-item__nomor">${s.number}</span>
        <span class="surah-item__teks">
          <span class="surah-item__nama-latin">${s.englishName}</span>
          <span class="surah-item__meta">${s.numberOfAyahs} ayat &middot; ${s.englishNameTranslation}</span>
        </span>
        <span class="surah-item__nama-arab" aria-hidden="true">${s.name}</span>
      `;
      btn.addEventListener("click", () => onKlik(s.number));
      li.appendChild(btn);
      container.appendChild(li);
    });
  }

  cariSurahInput.addEventListener("input", () => {
    const kunci = cariSurahInput.value.trim().toLowerCase();
    const hasil = daftarSurah.filter(
      (s) =>
        s.englishName.toLowerCase().includes(kunci) ||
        s.englishNameTranslation.toLowerCase().includes(kunci) ||
        String(s.number) === kunci
    );
    renderDaftarSurah(daftarSurahQuran, hasil, bukaSurahQuran, false);
  });

  // ---------- Tab Al-Qur'an: baca teks ----------
  async function bukaSurahQuran(nomor) {
    try {
      const data = await ambilJSON(`/api/surah/${nomor}/text`);
      quranSurahInfo.innerHTML = `
        <p class="surah-info__nama-arab">${data.nama}</p>
        <h3 class="surah-info__nama-latin">${data.namaLatin}</h3>
        <p class="surah-info__meta">${data.arti} &middot; ${data.jumlahAyat} ayat &middot; ${data.tempatTurun === "Meccan" ? "Makkiyah" : "Madaniyah"}</p>
      `;
      quranAyatList.innerHTML = "";
      data.ayat.forEach((a) => {
        const li = document.createElement("li");
        li.className = "ayat-item";
        li.innerHTML = `
          <span class="ayat-item__nomor">${a.nomor}</span>
          <p class="ayat-item__arab" lang="ar">${a.arab}</p>
          <p class="ayat-item__terjemahan">${a.terjemahan}</p>
        `;
        quranAyatList.appendChild(li);
      });
      quranDaftarPanel.hidden = true;
      quranBacaPanel.hidden = false;
      quranBacaPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      btnKembaliQuran.focus();
    } catch (err) {
      tampilkanError(err.message);
    }
  }
  btnKembaliQuran.addEventListener("click", () => {
    quranBacaPanel.hidden = true;
    quranDaftarPanel.hidden = false;
  });

  // ---------- Tab Murotal: player audio ----------
  async function bukaSurahMurotal(nomor) {
    try {
      const qori = pilihQori.value;
      const data = await ambilJSON(`/api/surah/${nomor}/audio/${qori}`);
      ayatMurotalAktif = data.ayat;
      indexAyatAktif = 0;
      jumlahPengulanganSaatIni = 0;

      murotalSurahInfo.innerHTML = `
        <h3 class="surah-info__nama-latin">${data.namaLatin}</h3>
        <p class="surah-info__meta">${data.jumlahAyat} ayat</p>
      `;

      muatAyatAktif(false);
      murotalDaftarPanel.hidden = true;
      murotalPlayerPanel.hidden = false;
      murotalPlayerPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      btnKembaliMurotal.focus();
    } catch (err) {
      tampilkanError(err.message);
    }
  }
  btnKembaliMurotal.addEventListener("click", () => {
    hentikanAudio();
    murotalPlayerPanel.hidden = true;
    murotalDaftarPanel.hidden = false;
  });

  function muatAyatAktif(autoplay) {
    const ayat = ayatMurotalAktif[indexAyatAktif];
    if (!ayat) return;
    audioPlayer.src = ayat.audio;
    playerStatus.textContent = `Ayat ${ayat.nomor} dari ${ayatMurotalAktif.length}`;
    perbaruiCounterPengulangan();
    if (autoplay) {
      audioPlayer.play().catch(() => {});
    } else {
      ikonPutarJeda.textContent = "▶";
      btnPutarJeda.setAttribute("aria-label", "Putar");
    }
  }

  function perbaruiCounterPengulangan() {
    const target = Number(pilihPengulangan.value);
    if (target > 1) {
      repeatCounterEl.textContent = `Pengulangan ${jumlahPengulanganSaatIni + 1} dari ${target}`;
    } else {
      repeatCounterEl.textContent = "";
    }
  }

  function hentikanAudio() {
    audioPlayer.pause();
    ikonPutarJeda.textContent = "▶";
    btnPutarJeda.setAttribute("aria-label", "Putar");
  }

  btnPutarJeda.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play().catch(() => tampilkanError("Tidak bisa memutar audio."));
    } else {
      audioPlayer.pause();
    }
  });
  audioPlayer.addEventListener("play", () => {
    ikonPutarJeda.textContent = "⏸";
    btnPutarJeda.setAttribute("aria-label", "Jeda");
  });
  audioPlayer.addEventListener("pause", () => {
    ikonPutarJeda.textContent = "▶";
    btnPutarJeda.setAttribute("aria-label", "Putar");
  });

  // Inti fitur pengulangan per-ayat: saat audio satu ayat selesai,
  // cek apakah target pengulangan sudah tercapai. Kalau belum, putar ulang
  // ayat yang sama. Kalau sudah, lanjut ke ayat berikutnya.
  audioPlayer.addEventListener("ended", () => {
    const target = Number(pilihPengulangan.value);
    jumlahPengulanganSaatIni += 1;

    if (jumlahPengulanganSaatIni < target) {
      perbaruiCounterPengulangan();
      audioPlayer.currentTime = 0;
      audioPlayer.play().catch(() => {});
      return;
    }

    jumlahPengulanganSaatIni = 0;
    if (indexAyatAktif < ayatMurotalAktif.length - 1) {
      indexAyatAktif += 1;
      muatAyatAktif(true);
    } else {
      hentikanAudio();
      playerStatus.textContent = "Surah selesai";
    }
  });

  btnAyatSebelumnya.addEventListener("click", () => {
    if (indexAyatAktif > 0) {
      indexAyatAktif -= 1;
      jumlahPengulanganSaatIni = 0;
      muatAyatAktif(!audioPlayer.paused);
    }
  });
  btnAyatBerikutnya.addEventListener("click", () => {
    if (indexAyatAktif < ayatMurotalAktif.length - 1) {
      indexAyatAktif += 1;
      jumlahPengulanganSaatIni = 0;
      muatAyatAktif(!audioPlayer.paused);
    }
  });
  pilihPengulangan.addEventListener("change", perbaruiCounterPengulangan);

  // Kalau qori diganti waktu masih di daftar (belum masuk player), tidak perlu aksi khusus;
  // kalau mau ganti qori saat sedang di player, sederhananya minta pengguna kembali ke daftar dulu.

  // ---------- Mulai ----------
  (async function mulai() {
    pindahTab("murotal");
    try {
      await Promise.all([muatDaftarSurah(), muatDaftarQori()]);
    } catch (err) {
      tampilkanError(err.message || "Gagal memuat data awal. Periksa koneksi internet.");
    }
  })();
})();
