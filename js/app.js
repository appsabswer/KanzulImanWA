/* ========================================================
   Kanzul Iman Quran & Tafsir - Progressive Web App Logic
   • Clean SVG Web Icons (Zero Emojis)
   • Adaptive: Windows Desktop (Master-Detail) & Android (Single-Pane)
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
  activeSidebarTab: 'surah', // 'surah' | 'para' | 'sajdah' | 'about'
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

// SVG Icon Helpers
const ICONS = {
  play: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  book: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  copy: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  speaker: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`
};

// Bengali Numbers
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
  text = text.replace(/([نم]ّ[ًٌٍَُِ]?)/g, '<span class="tajweed-ghunna">$1</span>');
  text = text.replace(/([\u06e2\u06e8])/g, '<span class="tajweed-iqlab">$1</span>');
  text = text.replace(/([\u0653\u06e4\u0670])/g, '<span class="tajweed-madd">$1</span>');
  text = text.replace(/([قطبجد]ْ)/g, '<span class="tajweed-qalqalah">$1</span>');
  text = text.replace(/(نْ|[ًٌٍ])\s*([تثجدذزسশصضطظفقك])/g, '<span class="tajweed-ikhfa">$1 $2</span>');

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

    renderSidebarSurahs();
    renderSidebarParas();
    renderSidebarSajdahs();
    renderSidebarAbout();

    // Default load Surah 1 on Desktop
    if (window.innerWidth >= 1024) {
      loadSurah(1);
    }
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('ডাটা লোড করতে সমস্যা হয়েছে!');
  }

  setupEventListeners();
  setupAudioListeners();
}

// Setup Event Listeners
function setupEventListeners() {
  // Mobile Back Button
  document.getElementById('btnMobileBack').addEventListener('click', () => {
    document.body.classList.remove('mobile-reader-active');
    document.getElementById('btnMobileBack').style.display = 'none';
    document.getElementById('topHeaderTitle').textContent = 'কানযুল ঈমান';
    document.getElementById('topHeaderSubtitle').textContent = 'কুরআন ও খাযাইনুল ইরফান তাফসীর';
  });

  // Sidebar Tabs (Desktop + Mobile)
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.target;
      switchSidebarTab(target);
    });
  });

  // Mobile Bottom Navigation
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const nav = item.dataset.nav;
      if (nav === 'settings') {
        openDrawer();
        return;
      }

      document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.body.classList.remove('mobile-reader-active');
      document.getElementById('btnMobileBack').style.display = 'none';

      // Sync sidebar tab
      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.target === nav);
      });
      switchSidebarTab(nav);
    });
  });

  // Sidebar Search Box Filter
  document.getElementById('sidebarSearch').addEventListener('input', (e) => {
    filterSidebarSurahs(e.target.value.trim().toLowerCase());
  });

  // Settings Drawer Toggle
  document.getElementById('btnSettings').addEventListener('click', openDrawer);
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
      applyTheme(btn.dataset.theme);
    });
  });

  // Translation Visibility Toggles
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
  document.getElementById('searchInput').addEventListener('input', handleGlobalSearch);

  // Global Keyboard Shortcut
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

function openDrawer() {
  document.getElementById('settingsDrawer').classList.add('open');
  document.getElementById('drawerBackdrop').classList.add('open');
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

function switchSidebarTab(tabName) {
  State.activeSidebarTab = tabName;
  document.getElementById('listSurahs').style.display = tabName === 'surah' ? 'block' : 'none';
  document.getElementById('listParas').style.display = tabName === 'para' ? 'block' : 'none';
  document.getElementById('listSajdahs').style.display = tabName === 'sajdah' ? 'block' : 'none';
  document.getElementById('listAbout').style.display = tabName === 'about' ? 'block' : 'none';

  // Toggle search box visibility for non-surah tabs
  document.getElementById('sidebarSearch').style.display = (tabName === 'surah' || tabName === 'para') ? 'block' : 'none';
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

// Render Sidebar Surahs List
function renderSidebarSurahs(filtered = null) {
  const list = filtered || State.suras;
  const container = document.getElementById('listSurahs');
  container.innerHTML = list.map(s => {
    const isCurrent = State.currentSurah && State.currentSurah.sura.sura_index === s.sura_index;
    return `
      <div class="sidebar-list-item ${isCurrent ? 'active' : ''}" id="sidebar-surah-${s.sura_index}" onclick="loadSurah(${s.sura_index})">
        <div class="item-num">${toBnNum(s.sura_index)}</div>
        <div class="item-info">
          <div class="item-title">সূরা ${s.name_bn}</div>
          <div class="item-sub">${s.type_bn} • ${toBnNum(s.total_ayats)} আয়াত</div>
        </div>
        <div class="item-ar">${s.name_ar}</div>
      </div>
    `;
  }).join('');
}

function filterSidebarSurahs(query) {
  if (!query) {
    renderSidebarSurahs();
    return;
  }
  const filtered = State.suras.filter(s =>
    String(s.sura_index).includes(query) ||
    s.name_bn.toLowerCase().includes(query) ||
    s.name_ar.includes(query) ||
    (s.name_en && s.name_en.toLowerCase().includes(query))
  );
  renderSidebarSurahs(filtered);
}

// Render Sidebar Paras List
function renderSidebarParas() {
  const container = document.getElementById('listParas');
  container.innerHTML = State.paras.map(p => `
    <div class="sidebar-list-item" onclick="loadSurah(${p.start_sura}, null, ${p.start_aya})">
      <div class="item-num">${toBnNum(p.para_no)}</div>
      <div class="item-info">
        <div class="item-title">পারা ${toBnNum(p.para_no)} (${p.name_bn})</div>
        <div class="item-sub">সূরা ${toBnNum(p.start_sura)}:${toBnNum(p.start_aya)} হতে ${toBnNum(p.end_sura)}:${toBnNum(p.end_aya)}</div>
      </div>
      <div class="item-ar">${p.name_ar}</div>
    </div>
  `).join('');
}

// Render Sidebar Sajdahs List
function renderSidebarSajdahs() {
  const container = document.getElementById('listSajdahs');
  container.innerHTML = State.sajdahs.map(s => `
    <div class="ayat-card" style="margin-bottom:12px; padding:14px;">
      <div class="ayat-top-bar" style="margin-bottom:8px; padding-bottom:6px;">
        <span class="ayat-badge">সিজদাহ্ ${toBnNum(s.sajdah_no)}</span>
        <button class="ayat-btn" onclick="loadSurah(${s.sura_index}, null, ${s.aya_index})">${ICONS.book} আয়াতে যান</button>
      </div>
      <div style="font-weight:700; color:var(--primary-gold); font-size:14px; margin-bottom:4px;">
        সূরা ${s.sura_name_bn} (${s.sura_name_ar}) — আয়াত: ${toBnNum(s.aya_index)}
      </div>
      <div style="font-size:12px; margin-bottom:6px;">${s.verse_context_bn}</div>
      <div style="background:var(--gold-tint); padding:6px 10px; border-radius:6px; font-size:12px; border-left:3px solid var(--primary-gold);">
        <strong>হুকুম (হানাফি):</strong> ${s.hukm_bn}
      </div>
    </div>
  `).join('');
}

// Render Sidebar About Articles
function renderSidebarAbout() {
  const container = document.getElementById('listAbout');
  container.innerHTML = State.about.map(a => `
    <div class="ayat-card" style="margin-bottom:14px; padding:14px;">
      <h4 style="color:var(--primary-gold); margin-bottom:6px; font-size:15px;">${a.title_bn || a.title_ur}</h4>
      <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">লেখক: ${a.author_bn || a.author_ur}</div>
      <div style="line-height:1.7; font-size:13px; white-space:pre-line;">${a.content_bn || a.content_ur}</div>
    </div>
  `).join('');
}

// Load Surah Data
async function loadSurah(suraIndex, callback, targetAya = null) {
  try {
    const res = await fetch(`./data/surah/${suraIndex}.json`);
    State.currentSurah = await res.json();

    // On Mobile: Switch to Reader Pane and Show Back Button
    if (window.innerWidth < 1024) {
      document.body.classList.add('mobile-reader-active');
      document.getElementById('btnMobileBack').style.display = 'flex';
      document.getElementById('topHeaderTitle').textContent = `সূরা ${State.currentSurah.sura.name_bn}`;
      document.getElementById('topHeaderSubtitle').textContent = `${State.currentSurah.sura.type_bn} • ${toBnNum(State.currentSurah.sura.total_ayats)} আয়াত`;
    }

    // Highlight active in sidebar
    document.querySelectorAll('.sidebar-list-item').forEach(el => el.classList.remove('active'));
    const sideItem = document.getElementById(`sidebar-surah-${suraIndex}`);
    if (sideItem) sideItem.classList.add('active');

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
      }, 250);
    } else {
      const readingPane = document.getElementById('readingPane');
      if (readingPane) readingPane.scrollTo({ top: 0, behavior: 'smooth' });
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
            <button class="ayat-btn" onclick="playSingleAya(${sura.sura_index}, ${v.aya})">${ICONS.speaker} তিলাওয়াত</button>
            <button class="ayat-btn" onclick="toggleTafsir(${v.aya})">${ICONS.book} তাফসীর</button>
            <button class="ayat-btn" onclick="copyAyatText(${sura.sura_index}, ${v.aya})">${ICONS.copy} কপি</button>
          </div>
        </div>

        <div class="ayat-arabic">${arabicText}</div>

        ${State.settings.showBn && v.tr_bn ? `<div class="ayat-trans-bn"><strong>অনুবাদ:</strong> ${v.tr_bn}</div>` : ''}
        ${State.settings.showUr && v.tr_ur ? `<div class="ayat-trans-ur">${v.tr_ur}</div>` : ''}
        ${State.settings.showEn && v.tr_en ? `<div class="ayat-trans-en"><strong>En:</strong> ${v.tr_en}</div>` : ''}

        <div class="tafsir-box" id="tafsir-${v.aya}">
          <div class="tafsir-header">
            <span>খাযাইনুল ইরফান তাফসীর</span>
            <button class="ayat-btn" onclick="copyFullTafsir(${sura.sura_index}, ${v.aya})">${ICONS.copy} তাফসীর কপি</button>
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
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:12px;">মোট আয়াত: ${toBnNum(sura.total_ayats)}</div>
      <button class="ayat-btn" onclick="playSurahAudio(${sura.sura_index}, ${sura.total_ayats})" style="font-size:14px; padding:8px 16px;">
        ${ICONS.play} পূর্ণ সূরা তিলাওয়াত শুনুন
      </button>
    </div>
    <div class="mushaf-container">
      ${bismillahHtml}
      ${textHtml}
    </div>
  `;
}

// Toggle Tafsir
function toggleTafsir(aya) {
  const el = document.getElementById(`tafsir-${aya}`);
  if (el) el.classList.toggle('open');
}

// Copy single Ayat text
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

// Audio Engine (Alafasy 128kbps)
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

  const playPauseBtn = document.getElementById('btnPlayPause');
  playPauseBtn.innerHTML = State.isPlaying ? ICONS.pause : ICONS.play;
}

// Global Search Modal Handlers
function openSearch() {
  document.getElementById('modalSearch').classList.add('open');
  document.getElementById('searchInput').focus();
}

function closeSearch() {
  document.getElementById('modalSearch').classList.remove('open');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

function handleGlobalSearch(e) {
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
