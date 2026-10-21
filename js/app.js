/* ========================================================
   Kanzul Iman Quran & Tafsir - Progressive Web App Logic
   ======================================================== */

// Register Service Worker for 100% Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] ServiceWorker registered with scope:', reg.scope))
      .catch(err => console.error('[PWA] ServiceWorker registration failed:', err));
  });
}

const State = {
  suras: [],
  paras: [],
  sajdahs: [],
  about: [],
  currentSurah: null,
  activeTab: 'surah', // 'surah' | 'para' | 'reader' | 'mushaf' | 'sajdah' | 'about'
  viewMode: 'reader', // 'reader' | 'mushaf'
  tajweedEnabled: localStorage.getItem('ki_tajweed') === 'true',
  audio: new Audio(),
  playingSura: 0,
  playingAya: 0,
  isPlaying: false,
  settings: {
    theme: localStorage.getItem('ki_theme') || 'dark',
    arabicSize: parseInt(localStorage.getItem('ki_ar_size') || '28'),
    transSize: parseInt(localStorage.getItem('ki_tr_size') || '16'),
    tafsirSize: parseInt(localStorage.getItem('ki_tf_size') || '15'),
    showBn: localStorage.getItem('ki_show_bn') !== 'false',
    showUr: localStorage.getItem('ki_show_ur') !== 'false',
    showEn: localStorage.getItem('ki_show_en') === 'true',
  }
};

// Bangladish / English Number mapping
const toBnNum = (num) => {
  const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/[0-9]/g, d => bnDigits[d]);
};

// Toast notification
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Tajweed Color Highlighter
function applyTajweed(arabicText) {
  if (!State.tajweedEnabled || !arabicText) return arabicText;

  let text = arabicText;
  // Ghunna (نّ / مّ)
  text = text.replace(/([نم]ّ[ًٌٍَُِ]?)/g, '<span class="tajweed-ghunna">$1</span>');
  // Iqlab (small meem ۢ / ۨ)
  text = text.replace(/([\u06e2\u06e8])/g, '<span class="tajweed-iqlab">$1</span>');
  // Madd marks (~ / ٓ / ٰ)
  text = text.replace(/([\u0653\u06e4\u0670])/g, '<span class="tajweed-madd">$1</span>');
  // Qalqalah (ق ط ب ج د with sukun)
  text = text.replace(/([قطبجد]ْ)/g, '<span class="tajweed-qalqalah">$1</span>');
  // Ikhfa pattern approximation
  text = text.replace(/(نْ|[ًٌٍ])\s*([تثجدذزسشصضطظفقك])/g, '<span class="tajweed-ikhfa">$1 $2</span>');

  return text;
}

// Initialize Application
async function initApp() {
  applyTheme(State.settings.theme);
  applyFontSizes();

  try {
    const [surasRes, parasRes, sajdahsRes, aboutRes] = await Promise.all([
      fetch('./data/suras.json').then(r => r.json()),
      fetch('./data/paras.json').then(r => r.json()),
      fetch('./data/sajdahs.json').then(r => r.json()),
      fetch('./data/about.json').then(r => r.json())
    ]);

    State.suras = surasRes;
    State.paras = parasRes;
    State.sajdahs = sajdahsRes;
    State.about = aboutRes;

    renderSurahList();
    renderParaList();
    renderSajdahList();
    renderAboutArticles();
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('ডাটা লোড করতে সমস্যা হয়েছে!');
  }

  setupEventListeners();
  setupAudioListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      switchTab(target);
    });
  });

  // Settings Drawer Toggle
  document.getElementById('btnSettings').addEventListener('click', () => {
    document.getElementById('settingsDrawer').classList.add('open');
    document.getElementById('drawerBackdrop').classList.add('open');
  });

  document.getElementById('btnCloseDrawer').addEventListener('click', closeDrawer);
  document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);

  // Settings Controls
  document.getElementById('sliderArabic').addEventListener('input', (e) => {
    State.settings.arabicSize = parseInt(e.target.value);
    localStorage.setItem('ki_ar_size', State.settings.arabicSize);
    applyFontSizes();
  });

  document.getElementById('sliderTrans').addEventListener('input', (e) => {
    State.settings.transSize = parseInt(e.target.value);
    localStorage.setItem('ki_tr_size', State.settings.transSize);
    applyFontSizes();
  });

  document.getElementById('sliderTafsir').addEventListener('input', (e) => {
    State.settings.tafsirSize = parseInt(e.target.value);
    localStorage.setItem('ki_tf_size', State.settings.tafsirSize);
    applyFontSizes();
  });

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      applyTheme(theme);
    });
  });

  // Translation Display Toggles
  document.getElementById('chkBn').addEventListener('change', (e) => {
    State.settings.showBn = e.target.checked;
    localStorage.setItem('ki_show_bn', e.target.checked);
    if (State.currentSurah) renderReaderView();
  });

  document.getElementById('chkUr').addEventListener('change', (e) => {
    State.settings.showUr = e.target.checked;
    localStorage.setItem('ki_show_ur', e.target.checked);
    if (State.currentSurah) renderReaderView();
  });

  document.getElementById('chkEn').addEventListener('change', (e) => {
    State.settings.showEn = e.target.checked;
    localStorage.setItem('ki_show_en', e.target.checked);
    if (State.currentSurah) renderReaderView();
  });

  // Tajweed Toggle
  document.getElementById('btnTajweed').addEventListener('click', () => {
    State.tajweedEnabled = !State.tajweedEnabled;
    localStorage.setItem('ki_tajweed', State.tajweedEnabled);
    document.getElementById('btnTajweed').classList.toggle('active', State.tajweedEnabled);
    showToast(State.tajweedEnabled ? 'তাজবীদ কালার চালু হয়েছে' : 'তাজবীদ কালার বন্ধ হয়েছে');
    if (State.currentSurah) {
      if (State.viewMode === 'mushaf') renderMushafView();
      else renderReaderView();
    }
  });

  // Mushaf View Toggle
  document.getElementById('btnMushaf').addEventListener('click', () => {
    if (!State.currentSurah) {
      loadSurah(1, () => {
        setReaderMode(State.viewMode === 'mushaf' ? 'reader' : 'mushaf');
      });
      return;
    }
    setReaderMode(State.viewMode === 'mushaf' ? 'reader' : 'mushaf');
  });

  // Search Modal
  document.getElementById('btnSearch').addEventListener('click', openSearch);
  document.getElementById('modalSearch').addEventListener('click', (e) => {
    if (e.target.id === 'modalSearch') closeSearch();
  });
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Global Shortcut
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeDrawer();
    }
  });

  // Audio Controls
  document.getElementById('btnPlayPause').addEventListener('click', togglePlayPause);
  document.getElementById('btnStopAudio').addEventListener('click', stopAudio);
  document.getElementById('btnNextAya').addEventListener('click', playNextAya);
  document.getElementById('btnPrevAya').addEventListener('click', playPrevAya);
}

function closeDrawer() {
  document.getElementById('settingsDrawer').classList.remove('open');
  document.getElementById('drawerBackdrop').classList.remove('open');
}

function applyTheme(theme) {
  State.settings.theme = theme;
  localStorage.setItem('ki_theme', theme);
  document.body.className = '';
  if (theme === 'light') document.body.classList.add('theme-light');
  else if (theme === 'sepia') document.body.classList.add('theme-sepia');

  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
}

function applyFontSizes() {
  document.documentElement.style.setProperty('--arabic-size', `${State.settings.arabicSize}px`);
  document.documentElement.style.setProperty('--trans-size', `${State.settings.transSize}px`);
  document.documentElement.style.setProperty('--tafsir-size', `${State.settings.tafsirSize}px`);

  document.getElementById('lblArabicSize').textContent = `${State.settings.arabicSize}px`;
  document.getElementById('lblTransSize').textContent = `${State.settings.transSize}px`;
  document.getElementById('lblTafsirSize').textContent = `${State.settings.tafsirSize}px`;

  document.getElementById('sliderArabic').value = State.settings.arabicSize;
  document.getElementById('sliderTrans').value = State.settings.transSize;
  document.getElementById('sliderTafsir').value = State.settings.tafsirSize;
}

function switchTab(tabName) {
  State.activeTab = tabName;
  document.getElementById('viewSurahList').style.display = tabName === 'surah' ? 'block' : 'none';
  document.getElementById('viewParaList').style.display = tabName === 'para' ? 'block' : 'none';
  document.getElementById('viewReader').style.display = (tabName === 'reader' || tabName === 'mushaf') ? 'block' : 'none';
  document.getElementById('viewSajdah').style.display = tabName === 'sajdah' ? 'block' : 'none';
  document.getElementById('viewAbout').style.display = tabName === 'about' ? 'block' : 'none';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setReaderMode(mode) {
  State.viewMode = mode;
  document.getElementById('btnMushaf').classList.toggle('active', mode === 'mushaf');
  if (mode === 'mushaf') {
    renderMushafView();
  } else {
    renderReaderView();
  }
}

// Render Surah List
function renderSurahList() {
  const container = document.getElementById('surahGrid');
  container.innerHTML = State.suras.map(s => `
    <div class="surah-card" onclick="loadSurah(${s.sura_index})">
      <div class="surah-num">${toBnNum(s.sura_index)}</div>
      <div class="surah-info">
        <div class="surah-name-bn">সূরা ${s.name_bn}</div>
        <div class="surah-meta">${s.type_bn} • ${toBnNum(s.total_ayats)} আয়াত</div>
      </div>
      <div class="surah-name-ar">${s.name_ar}</div>
    </div>
  `).join('');
}

// Render Para List
function renderParaList() {
  const container = document.getElementById('paraGrid');
  container.innerHTML = State.paras.map(p => `
    <div class="surah-card" onclick="loadSurah(${p.start_sura}, null, ${p.start_aya})">
      <div class="surah-num">${toBnNum(p.para_no)}</div>
      <div class="surah-info">
        <div class="surah-name-bn">পারা ${toBnNum(p.para_no)} (${p.name_bn})</div>
        <div class="surah-meta">সূরা ${toBnNum(p.start_sura)}:${toBnNum(p.start_aya)} থেকে ${toBnNum(p.end_sura)}:${toBnNum(p.end_aya)}</div>
      </div>
      <div class="surah-name-ar">${p.name_ar}</div>
    </div>
  `).join('');
}

// Render Sajdah List
function renderSajdahList() {
  const container = document.getElementById('sajdahList');
  container.innerHTML = State.sajdahs.map(s => `
    <div class="ayat-card">
      <div class="ayat-top-bar">
        <span class="ayat-badge">সিজদাহ্ নং ${toBnNum(s.sajdah_no)}</span>
        <button class="ayat-btn" onclick="loadSurah(${s.sura_index}, null, ${s.aya_index})">📖 আয়াতে যান</button>
      </div>
      <div style="font-weight:700; color:var(--primary-gold); margin-bottom:6px;">
        সূরা ${s.sura_name_bn} (${s.sura_name_ar}) — আয়াত: ${toBnNum(s.aya_index)} (পারা: ${toBnNum(s.juz_no)})
      </div>
      <div style="font-size:14px; margin-bottom:8px;">${s.verse_context_bn}</div>
      <div style="background:var(--gold-tint); padding:8px 12px; border-radius:8px; font-size:13px; border-left:3px solid var(--primary-gold);">
        <strong>হুকুম (হানাফি মাযহাব):</strong> ${s.hukm_bn}
      </div>
    </div>
  `).join('');
}

// Render About Articles
function renderAboutArticles() {
  const container = document.getElementById('aboutList');
  container.innerHTML = State.about.map(a => `
    <div class="ayat-card" style="margin-bottom:20px;">
      <h3 style="color:var(--primary-gold); margin-bottom:8px;">${a.title_bn || a.title_ur}</h3>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">লেখক: ${a.author_bn || a.author_ur} | গ্রন্থ: ${a.work_name_bn || a.work_name_ur}</div>
      <div style="line-height:1.8; white-space:pre-line;">${a.content_bn || a.content_ur}</div>
    </div>
  `).join('');
}

// Load Surah Data
async function loadSurah(suraIndex, callback, targetAya = null) {
  try {
    const res = await fetch(`./data/surah/${suraIndex}.json`);
    State.currentSurah = await res.json();

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.nav-tab[data-target="reader"]').classList.add('active');
    switchTab('reader');

    if (State.viewMode === 'mushaf') {
      renderMushafView();
    } else {
      renderReaderView();
    }

    if (callback) callback();

    if (targetAya) {
      setTimeout(() => {
        const el = document.getElementById(`ayat-${targetAya}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  } catch (err) {
    console.error('Error loading surah:', err);
    showToast('সূরা লোড করতে ব্যর্থ হয়েছে');
  }
}

// Render Reader View (Verse-by-Verse)
function renderReaderView() {
  const { sura, verses } = State.currentSurah;
  const container = document.getElementById('readerContent');

  const bismillahHtml = sura.sura_index !== 9 && sura.sura_index !== 1
    ? `<div class="reader-bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ</div>`
    : '';

  let html = `
    <div class="reader-header">
      <div class="reader-title-ar">${sura.name_ar}</div>
      <div class="reader-title-bn">সূরা ${sura.name_bn} • ${sura.type_bn}</div>
      <div style="font-size:13px; color:var(--text-muted);">আয়াত সংখ্যা: ${toBnNum(sura.total_ayats)} | রুকু: ${toBnNum(sura.total_rukus)}</div>
      ${bismillahHtml}
    </div>
  `;

  html += verses.map(v => {
    const isPlaying = State.isPlaying && State.playingSura === sura.sura_index && State.playingAya === v.aya;
    const arabicText = applyTajweed(v.ar);
    const sajdahBadge = v.is_sajdah ? `<span class="ayat-badge" style="background:#E91E63; color:#fff; border:none;">সিজদাহ্</span>` : '';

    return `
      <div class="ayat-card ${isPlaying ? 'playing' : ''}" id="ayat-${v.aya}">
        <div class="ayat-top-bar">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="ayat-badge">${toBnNum(sura.sura_index)}:${toBnNum(v.aya)}</span>
            ${sajdahBadge}
          </div>
          <div class="ayat-actions">
            <button class="ayat-btn" onclick="playSingleAya(${sura.sura_index}, ${v.aya})">🔊 তিলাওয়াত</button>
            <button class="ayat-btn" onclick="toggleTafsir(${v.aya})">📖 তাফসীর</button>
            <button class="ayat-btn" onclick="copyAyatText(${sura.sura_index}, ${v.aya})">📋 কপি</button>
          </div>
        </div>

        <div class="ayat-arabic">${arabicText}</div>

        ${State.settings.showBn && v.tr_bn ? `<div class="ayat-trans-bn"><strong>অনুবাদ:</strong> ${v.tr_bn}</div>` : ''}
        ${State.settings.showUr && v.tr_ur ? `<div class="ayat-trans-ur">${v.tr_ur}</div>` : ''}
        ${State.settings.showEn && v.tr_en ? `<div class="ayat-trans-en"><strong>En:</strong> ${v.tr_en}</div>` : ''}

        <div class="tafsir-box" id="tafsir-${v.aya}">
          <div class="tafsir-header">
            <span>খাযাইনুল ইরফান তাফসীর</span>
            <button class="ayat-btn" onclick="copyFullTafsir(${sura.sura_index}, ${v.aya})">তাফসীর কপি</button>
          </div>
          ${v.asb_bn ? `<div class="tafsir-shaan"><strong>শানে নুযূল:</strong> ${v.asb_bn}</div>` : ''}
          <div style="white-space:pre-line;">${v.tf_bn || 'এই আয়াতের জন্য আলাদা তাফসীর নোট নেই।'}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// Render Mushaf View (Continuous Arabic text)
function renderMushafView() {
  const { sura, verses } = State.currentSurah;
  const container = document.getElementById('readerContent');

  const bismillahHtml = sura.sura_index !== 9 && sura.sura_index !== 1
    ? `<div class="reader-bismillah" style="text-align:center; margin-bottom:20px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ</div>`
    : '';

  let textHtml = verses.map(v => {
    const arText = applyTajweed(v.ar);
    return `${arText} <span class="mushaf-aya-end" id="mushaf-aya-${v.aya}" onclick="playSingleAya(${sura.sura_index}, ${v.aya})">${v.aya}</span> `;
  }).join('');

  container.innerHTML = `
    <div class="reader-header">
      <div class="reader-title-ar">${sura.name_ar}</div>
      <div class="reader-title-bn">সূরা ${sura.name_bn} (মুসহাফ পাঠ)</div>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:10px;">মোট আয়াত: ${toBnNum(sura.total_ayats)}</div>
      <button class="ayat-btn" onclick="playSurahAudio(${sura.sura_index}, ${sura.total_ayats})">▶️ পূর্ণ সূরা তিলাওয়াত শুনুন</button>
    </div>
    <div class="mushaf-container">
      ${bismillahHtml}
      ${textHtml}
    </div>
  `;
}

// Toggle Tafsir accordion
function toggleTafsir(aya) {
  const el = document.getElementById(`tafsir-${aya}`);
  if (el) el.classList.toggle('open');
}

// Copy single verse text
function copyAyatText(suraIndex, aya) {
  const v = State.currentSurah.verses.find(item => item.aya === aya);
  if (!v) return;

  const text = `সূরা ${State.currentSurah.sura.name_bn} [${suraIndex}:${aya}]\n\n${v.ar}\n\nঅনুবাদ: ${v.tr_bn}\n\nউর্দু কানযুল ঈমান:\n${v.tr_ur}`;
  navigator.clipboard.writeText(text).then(() => showToast('আয়াত ও অনুবাদ কপি হয়েছে!'));
}

// Copy full Ayat + Tafsir
function copyFullTafsir(suraIndex, aya) {
  const v = State.currentSurah.verses.find(item => item.aya === aya);
  if (!v) return;

  let text = `সূরা ${State.currentSurah.sura.name_bn} [${suraIndex}:${aya}]\n\n${v.ar}\n\nঅনুবাদ: ${v.tr_bn}\n\nখাযাইনুল ইরফান তাফসীর:\n`;
  if (v.asb_bn) text += `শানে নুযূল: ${v.asb_bn}\n`;
  text += `${v.tf_bn || 'তাফসীর নোট সংযোজিত'}`;

  navigator.clipboard.writeText(text).then(() => showToast('সম্পূর্ণ তাফসীর কপি হয়েছে!'));
}

// Audio Engine (EveryAyah Alafasy)
function setupAudioListeners() {
  State.audio.addEventListener('ended', () => {
    if (State.playingAya < State.currentSurah.verses.length) {
      playSingleAya(State.playingSura, State.playingAya + 1);
    } else {
      stopAudio();
      showToast('সূরা তিলাওয়াত সম্পন্ন হয়েছে');
    }
  });

  State.audio.addEventListener('error', () => {
    showToast('অডিও লোড করতে সমস্যা হয়েছে');
    stopAudio();
  });
}

function playSingleAya(sura, aya) {
  State.playingSura = sura;
  State.playingAya = aya;
  State.isPlaying = true;

  const suraPad = String(sura).padStart(3, '0');
  const ayaPad = String(aya).padStart(3, '0');
  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${suraPad}${ayaPad}.mp3`;

  State.audio.src = audioUrl;
  State.audio.play();

  updateAudioBar();

  // Highlight card and scroll
  document.querySelectorAll('.ayat-card').forEach(c => c.classList.remove('playing'));
  const card = document.getElementById(`ayat-${aya}`);
  if (card) {
    card.classList.add('playing');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function playSurahAudio(sura, totalAyats) {
  playSingleAya(sura, 1);
}

function togglePlayPause() {
  if (State.isPlaying) {
    State.audio.pause();
    State.isPlaying = false;
  } else {
    State.audio.play();
    State.isPlaying = true;
  }
  updateAudioBar();
}

function stopAudio() {
  State.audio.pause();
  State.audio.currentTime = 0;
  State.isPlaying = false;
  document.getElementById('audioBar').classList.remove('active');
  document.querySelectorAll('.ayat-card').forEach(c => c.classList.remove('playing'));
}

function playNextAya() {
  if (State.playingAya < State.currentSurah.verses.length) {
    playSingleAya(State.playingSura, State.playingAya + 1);
  }
}

function playPrevAya() {
  if (State.playingAya > 1) {
    playSingleAya(State.playingSura, State.playingAya - 1);
  }
}

function updateAudioBar() {
  const bar = document.getElementById('audioBar');
  bar.classList.add('active');

  const sura = State.suras.find(s => s.sura_index === State.playingSura);
  const suraName = sura ? sura.name_bn : '';

  document.getElementById('audioTitle').textContent = `সূরা ${suraName}`;
  document.getElementById('audioMeta').textContent = `আয়াত: ${toBnNum(State.playingAya)} (কারী মিশারি রাশিদ)`;
  document.getElementById('btnPlayPause').textContent = State.isPlaying ? '⏸' : '▶';
}

// Search Modal Handlers
function openSearch() {
  document.getElementById('modalSearch').classList.add('open');
  document.getElementById('searchInput').focus();
}

function closeSearch() {
  document.getElementById('modalSearch').classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

function handleSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  const resultsContainer = document.getElementById('searchResults');
  if (!q) {
    resultsContainer.innerHTML = '';
    return;
  }

  const matches = State.suras.filter(s =>
    String(s.sura_index).includes(q) ||
    (s.name_bn && s.name_bn.toLowerCase().includes(q)) ||
    (s.name_en && s.name_en.toLowerCase().includes(q)) ||
    (s.name_ar && s.name_ar.includes(q))
  );

  resultsContainer.innerHTML = matches.map(s => `
    <div class="search-item" onclick="loadSurah(${s.sura_index}); closeSearch();">
      <div>
        <strong style="color:var(--primary-gold);">${toBnNum(s.sura_index)}. সূরা ${s.name_bn}</strong>
        <div style="font-size:12px; color:var(--text-muted);">${s.type_bn} • ${toBnNum(s.total_ayats)} আয়াত</div>
      </div>
      <div style="font-family:var(--font-arabic); font-size:18px; color:var(--primary-gold);">${s.name_ar}</div>
    </div>
  `).join('');
}

// Launch application
window.addEventListener('DOMContentLoaded', initApp);
