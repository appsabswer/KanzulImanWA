/* ========================================================
   Kanzul Iman Quran & Tafsir - Progressive Web App Logic
   • Clean SVG Web Icons (Zero Emojis)
   • Adaptive: Windows Desktop (Master-Detail) & Android (Single-Pane)
   • 3 Platforms: WebApp (PWA), WindowsApp (Store), AndroidApp (Play)
   • 3 Languages: Bengali (বাংলা), Urdu (اردو), English
   • Makki & Madani Visual Artworks (ic_mecca.webp, ic_medina.webp)
   • Structured Tafsir Renderer (Clean Guillemets «...» & Markdown **)
   ======================================================== */

// Register Service Worker for 100% Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('[PWA] ServiceWorker registered with scope:', reg.scope))
      .catch(err => console.error('[PWA] ServiceWorker registration failed:', err));
  });
}

// Global State
const State = {
  suras: [],
  paras: [],
  sajdahs: [],
  about: [],
  currentSurah: null,
  activeSidebarTab: 'surah', // 'surah' | 'para' | 'sajdah' | 'about'
  viewMode: 'reader', // 'reader' | 'mushaf'
  activeLang: localStorage.getItem('ki_lang') || 'bn', // 'bn' | 'ur' | 'en'
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

// Clean SVG Web Icons (Zero Emojis)
const ICONS = {
  play: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  book: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  copy: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  speaker: `<svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`
};

// Localization Dictionary (3 Languages: BN, UR, EN)
const I18N = {
  bn: {
    appTitle: 'কানযুল ঈমান',
    appSubtitle: 'কুরআন ও খাযাইনুল ইরফান তাফসীর',
    tabSurah: 'সূরা তালিকা (১১৪)',
    tabPara: 'পারা (৩০)',
    tabSajdah: 'সিজদাহ্ (১৪)',
    tabAbout: 'পরিচিতি',
    searchPlaceholder: 'দ্রুত খুঁজুন (নাম বা নম্বর)...',
    searchTitle: 'কুরআন অনুসন্ধান',
    searchAllPlaceholder: 'আরবি, বাংলা বা উর্দু শব্দ লিখুন...',
    mushafMode: 'মুসহাফ পাঠ',
    tajweed: 'তাজবীদ কালার',
    settings: 'সেটিংস',
    recite: 'তিলাওয়াত',
    tafsir: 'তাফসীর',
    copy: 'কপি',
    copyTafsir: 'তাফসীর কপি',
    aya: 'আয়াত',
    ruku: 'রুকু',
    makki: 'মাক্কী',
    madani: 'মাদানী',
    sajdahWord: 'সিজদাহ্',
    tafsirTitle: 'খাযাইনুল ইরফান তাফসীর',
    shaanNuzul: 'শানে নুযূল',
    note: 'টীকা',
    preambleTitle: 'ভূমিকা ও মাহাত্ম্য',
    toastCopied: 'কপি হয়েছে!',
    toastTafsirCopied: 'সম্পূর্ণ তাফসীর কপি হয়েছে!',
    threePlatforms: 'অ্যাপের ৩টি প্ল্যাটফর্ম',
    webApp: 'WebApp (PWA ব্রাউজার)',
    winApp: 'WindowsApp (মাইক্রোসফট স্টোর)',
    androidApp: 'AndroidApp (গুগল প্লে স্টোর)',
  },
  ur: {
    appTitle: 'کنز الایمان',
    appSubtitle: 'قرآن و تفسیر خزائن العرفان',
    tabSurah: 'فہرست سورتیں (۱۱۴)',
    tabPara: 'پارے (۳۰)',
    tabSajdah: 'سجدے (۱۴)',
    tabAbout: 'تعارف و مقالات',
    searchPlaceholder: 'تلاش کریں (نام یا نمبر)...',
    searchTitle: 'تلاشِ قرآن',
    searchAllPlaceholder: 'عربی، اردو یا انگریزی الفاظ درج کریں...',
    mushafMode: 'مصحف تلاوت',
    tajweed: 'تجوید کلر',
    settings: 'ترتیبات',
    recite: 'تلاوت',
    tafsir: 'تفسیر',
    copy: 'کاپی',
    copyTafsir: 'تفسیر کاپی',
    aya: 'آیات',
    ruku: 'رکوع',
    makki: 'مکی',
    madani: 'مدنی',
    sajdahWord: 'سجدہ',
    tafsirTitle: 'تفسیر خزائن العرفان',
    shaanNuzul: 'شانِ نزول',
    note: 'حاشیہ',
    preambleTitle: 'فضائل و تعارف',
    toastCopied: 'کاپی ہو گیا!',
    toastTafsirCopied: 'مکمل آیت اور تفسیر کاپی ہو گئی!',
    threePlatforms: 'ایپ کے ۳ پلیٹ فارمز',
    webApp: 'WebApp (آن لائن PWA)',
    winApp: 'WindowsApp (مائیکروسافٹ اسٹور)',
    androidApp: 'AndroidApp (گوگل پلے اسٹور)',
  },
  en: {
    appTitle: 'Kanzul Iman',
    appSubtitle: "Quran & Khaza'in al-'Irfan Tafsir",
    tabSurah: 'Surahs (114)',
    tabPara: 'Paras (30)',
    tabSajdah: 'Sajdahs (14)',
    tabAbout: 'About & Articles',
    searchPlaceholder: 'Quick search (name or number)...',
    searchTitle: 'Search Quran',
    searchAllPlaceholder: 'Type Arabic, English or Bengali...',
    mushafMode: 'Mushaf Mode',
    tajweed: 'Tajweed Colors',
    settings: 'Settings',
    recite: 'Recite',
    tafsir: 'Tafsir',
    copy: 'Copy',
    copyTafsir: 'Copy Tafsir',
    aya: 'Verses',
    ruku: 'Rukus',
    makki: 'Meccan',
    madani: 'Medinan',
    sajdahWord: 'Sajdah',
    tafsirTitle: "Khaza'in al-'Irfan Tafsir",
    shaanNuzul: 'Occasion of Revelation',
    note: 'Note',
    preambleTitle: 'Introduction & Virtues',
    toastCopied: 'Copied to clipboard!',
    toastTafsirCopied: 'Ayah & Full Tafsir copied!',
    threePlatforms: '3 App Platforms',
    webApp: 'WebApp (Online PWA)',
    winApp: 'WindowsApp (Microsoft Store)',
    androidApp: 'AndroidApp (Google Play Store)',
  }
};

// Translation Helper
function t(key) {
  const dict = I18N[State.activeLang] || I18N.bn;
  return dict[key] || I18N.bn[key] || key;
}

// Localized Number Formatter (Bengali, Urdu, English digits)
const toLocalizedNum = (num, lang = State.activeLang) => {
  if (lang === 'bn') {
    const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).replace(/[0-9]/g, d => bnDigits[d]);
  } else if (lang === 'ur') {
    const urDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(num).replace(/[0-9]/g, d => urDigits[d]);
  }
  return String(num);
};

// Backward-compatible toBnNum
const toBnNum = (num) => toLocalizedNum(num, 'bn');

// Toast Notification
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
  text = text.replace(/(نْ|[ًٌٍ])\s*([تثجدذزسشصضطظفقك])/g, '<span class="tajweed-ikhfa">$1 $2</span>');

  return text;
}

// ========================================================
// Structured Tafsir Formatter (Clean Markdown ** & Guillemets «...» / <<...>>)
// ========================================================
function formatTafsirText(rawText, lang = 'bn') {
  if (!rawText || !rawText.trim()) {
    const emptyMsg = lang === 'ur' ? 'اس آیت کے لیے کوئی الگ تفسیری حاشیہ نہیں ہے۔' :
      (lang === 'en' ? 'No separate commentary note for this verse.' : 'এই আয়াতের জন্য আলাদা কোনো তাফসীর নোট নেই।');
    return `<div style="color:var(--text-muted); font-style:italic;">${emptyMsg}</div>`;
  }

  const trimmed = rawText.trim();
  const circleRegex = /([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳])/g;
  const matches = [...trimmed.matchAll(circleRegex)];

  function formatBody(str) {
    if (!str) return '';
    return str
      // Convert guillemets «...» or <<...>> into styled inline Arabic with RTL
      .replace(/(?:«|<<)(.*?)(?:»|>>)/g, (m, p1) => {
        return `<span class="tafsir-inline-ar" dir="rtl">${p1.trim()}</span>`;
      })
      // Convert **...** into strong bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert [হাদীস ...] brackets into styled citation badges
      .replace(/\[(.*?)\]/g, '<span class="tafsir-inline-ref">[$1]</span>')
      // Clean leading separator dashes/colons
      .replace(/^\s*[—–\-:]\s*/, '')
      .trim();
  }

  let html = '';
  if (matches.length > 0) {
    // 1. Preamble (Introduction or Chapter Virtues before note ①)
    const firstIdx = matches[0].index;
    if (firstIdx > 0) {
      const preambleRaw = trimmed.substring(0, firstIdx).trim();
      if (preambleRaw) {
        const lines = preambleRaw.split('\n').map(l => l.trim()).filter(Boolean);
        let title = lang === 'ur' ? 'فضائل و تعارف' : (lang === 'en' ? 'Introduction & Virtues' : 'ভূমিকা ও মাহাত্ম্য');
        let body = preambleRaw;
        if (lines.length > 0 && (lines[0].endsWith(':') || lines[0].endsWith('：') || lines[0].length <= 60)) {
          title = lines[0].replace(/[:：]$/, '');
          body = lines.slice(1).join('<br>');
        }
        html += `
          <div class="tafsir-preamble">
            <div class="tafsir-preamble-header">
              <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>${title}</span>
            </div>
            ${body ? `<div class="tafsir-preamble-body">${formatBody(body)}</div>` : ''}
          </div>
        `;
      }
    }

    // 2. Structured Notes (টীকা ১, টীকা ২, টীকা ৩ ...)
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const circleChar = match[0];
      const num = circleChar.charCodeAt(0) - '①'.charCodeAt(0) + 1;
      const numStr = toLocalizedNum(num, lang);
      const noteLabel = lang === 'ur' ? `حاشیہ ${numStr}` : (lang === 'en' ? `Note ${numStr}` : `টীকা ${numStr}`);

      const start = match.index + match[0].length;
      const end = (i + 1 < matches.length) ? matches[i + 1].index : trimmed.length;
      let rawNote = trimmed.substring(start, end).trim();

      let arabicHeading = null;
      let topicHeading = null;
      let bodyText = rawNote;

      const headingMatch = rawNote.match(/^\s*\*\*(.*?)\*\*\s*(?:[—–\-:]\s*)?/);
      if (headingMatch) {
        const rawH = headingMatch[1].trim();
        bodyText = rawNote.substring(headingMatch[0].length).trim();

        const guillemetMatch = rawH.match(/(?:«|<<)(.*?)(?:»|>>)/);
        if (guillemetMatch) {
          arabicHeading = guillemetMatch[1].trim();
          const leftover = rawH.replace(/(?:«|<<)(.*?)(?:»|>>)/, '').replace(/^[—–\-:\s]+|[—–\-:\s]+$/g, '').trim();
          if (leftover) topicHeading = leftover;
        } else {
          topicHeading = rawH.replace(/[:：]$/, '').trim();
        }
      }

      html += `
        <div class="tafsir-note-card">
          <div class="tafsir-note-top">
            <span class="tafsir-note-pill">
              <svg class="ui-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
              </svg>
              <span>${noteLabel}</span>
            </span>
            ${topicHeading ? `<span class="tafsir-note-topic">${topicHeading}</span>` : ''}
          </div>
          ${arabicHeading ? `
            <div class="tafsir-quran-quote" dir="rtl">
              <span class="tafsir-quote-ar">${arabicHeading}</span>
            </div>
          ` : ''}
          <div class="tafsir-note-body">${formatBody(bodyText)}</div>
        </div>
      `;
    }
  } else {
    // Fallback if no circled numbers
    html = `
      <div class="tafsir-note-card">
        <div class="tafsir-note-body">${formatBody(trimmed)}</div>
      </div>
    `;
  }
  return html;
}

// Set Application Language (3 Languages)
function setAppLanguage(lang) {
  State.activeLang = lang;
  localStorage.setItem('ki_lang', lang);

  // Update active button state
  document.querySelectorAll('.lang-btn, .lang-setting-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang;
  if (lang === 'ur') {
    document.body.classList.add('lang-ur');
  } else {
    document.body.classList.remove('lang-ur');
  }

  // Update Header & UI texts
  if (State.currentSurah && document.body.classList.contains('mobile-reader-active')) {
    const s = State.currentSurah.sura;
    const name = lang === 'ur' ? s.name_ur : (lang === 'en' ? s.name_en : s.name_bn);
    document.getElementById('topHeaderTitle').textContent = `${toLocalizedNum(s.sura_index, lang)}. ${name}`;
    document.getElementById('topHeaderSubtitle').textContent = s.name_ar;
  } else {
    document.getElementById('topHeaderTitle').textContent = t('appTitle');
    document.getElementById('topHeaderSubtitle').textContent = t('appSubtitle');
  }

  const tabSurahBtn = document.querySelector('.sidebar-tab[data-target="surah"]');
  if (tabSurahBtn) tabSurahBtn.textContent = t('tabSurah');
  const tabParaBtn = document.querySelector('.sidebar-tab[data-target="para"]');
  if (tabParaBtn) tabParaBtn.textContent = t('tabPara');
  const tabSajdahBtn = document.querySelector('.sidebar-tab[data-target="sajdah"]');
  if (tabSajdahBtn) tabSajdahBtn.textContent = t('tabSajdah');
  const tabAboutBtn = document.querySelector('.sidebar-tab[data-target="about"]');
  if (tabAboutBtn) tabAboutBtn.textContent = t('tabAbout');

  // Update Mobile Bottom Nav Labels
  const navSurah = document.querySelector('.bottom-nav-item[data-nav="surah"] .nav-label');
  if (navSurah) navSurah.textContent = lang === 'ur' ? 'سورتیں' : (lang === 'en' ? 'Surah' : 'সূরা');
  const navPara = document.querySelector('.bottom-nav-item[data-nav="para"] .nav-label');
  if (navPara) navPara.textContent = lang === 'ur' ? 'پارے' : (lang === 'en' ? 'Para' : 'পারা');
  const navSajdah = document.querySelector('.bottom-nav-item[data-nav="sajdah"] .nav-label');
  if (navSajdah) navSajdah.textContent = lang === 'ur' ? 'سجدے' : (lang === 'en' ? 'Sajdah' : 'সিজদাহ্');
  const navAbout = document.querySelector('.bottom-nav-item[data-nav="about"] .nav-label');
  if (navAbout) navAbout.textContent = lang === 'ur' ? 'تعارف' : (lang === 'en' ? 'About' : 'প্রবন্ধ');
  const navSettings = document.querySelector('.bottom-nav-item[data-nav="settings"] .nav-label');
  if (navSettings) navSettings.textContent = lang === 'ur' ? 'ترتیبات' : (lang === 'en' ? 'Settings' : 'সেটিংস');

  const searchInput = document.getElementById('sidebarSearch');
  if (searchInput) searchInput.placeholder = t('searchPlaceholder');

  // Re-render lists
  renderSidebarSurahs();
  renderSidebarParas();
  renderSidebarSajdahs();
  renderSidebarAbout();

  // Re-render reader view if Surah loaded
  if (State.currentSurah) {
    if (State.viewMode === 'mushaf') renderMushafView();
    else renderReaderView();
  }
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

    // Check URL parameters for deep linking, SEO indexing & AI search
    const urlParams = new URLSearchParams(window.location.search);
    const surahParam = parseInt(urlParams.get('surah'));
    const ayaParam = parseInt(urlParams.get('aya'));
    const paraParam = parseInt(urlParams.get('para'));
    const tabParam = urlParams.get('tab');
    const langParam = urlParams.get('lang');

    if (langParam && (langParam === 'bn' || langParam === 'ur' || langParam === 'en')) {
      setAppLanguage(langParam);
    } else {
      setAppLanguage(State.activeLang);
    }

    if (tabParam) {
      switchSidebarTab(tabParam);
      document.querySelectorAll('.sidebar-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.target === tabParam);
      });
    }

    if (surahParam && surahParam >= 1 && surahParam <= 114) {
      loadSurah(surahParam, null, ayaParam || null);
    } else if (paraParam && paraParam >= 1 && paraParam <= 30) {
      const p = State.paras.find(item => item.para_no === paraParam);
      if (p) loadSurah(p.start_sura, null, p.start_aya);
    } else if (window.innerWidth >= 1024) {
      loadSurah(1);
    }
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('ডাটা লোড করতে সমস্যা হয়েছে!');
  }

  setupEventListeners();
  setupAudioListeners();
}

// Mobile Reader Navigation & Back Handler
function exitMobileReader() {
  document.body.classList.remove('mobile-reader-active');
  const btn = document.getElementById('btnMobileBack');
  if (btn) btn.style.display = 'none';
  document.getElementById('topHeaderTitle').textContent = t('appTitle');
  document.getElementById('topHeaderSubtitle').textContent = t('appSubtitle');
  if (history.state && history.state.reader) {
    history.back();
  }
}

window.addEventListener('popstate', (e) => {
  if (document.body.classList.contains('mobile-reader-active')) {
    document.body.classList.remove('mobile-reader-active');
    const btn = document.getElementById('btnMobileBack');
    if (btn) btn.style.display = 'none';
    document.getElementById('topHeaderTitle').textContent = t('appTitle');
    document.getElementById('topHeaderSubtitle').textContent = t('appSubtitle');
  }
});

// Setup Event Listeners
function setupEventListeners() {
  // Mobile Back Button
  document.getElementById('btnMobileBack').addEventListener('click', () => {
    exitMobileReader();
  });

  // Language Switcher Buttons (Header & Settings)
  document.querySelectorAll('.lang-btn, .lang-setting-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setAppLanguage(btn.dataset.lang);
    });
  });

  // Sidebar Tabs (Surahs, Paras, Sajdahs, About)
  document.querySelectorAll('.sidebar-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      switchSidebarTab(tab.dataset.target);
    });
  });

  // Mobile Bottom Navigation
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const nav = item.dataset.nav;

      if (nav === 'settings') {
        openDrawer();
        return;
      }

      // Exit mobile reader mode to show list
      if (document.body.classList.contains('mobile-reader-active')) {
        document.body.classList.remove('mobile-reader-active');
        const btn = document.getElementById('btnMobileBack');
        if (btn) btn.style.display = 'none';
        document.getElementById('topHeaderTitle').textContent = t('appTitle');
        document.getElementById('topHeaderSubtitle').textContent = t('appSubtitle');
      }

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

  // Tajweed & Mushaf Toggles
  const btnTajweed = document.getElementById('btnTajweed');
  if (btnTajweed) btnTajweed.addEventListener('click', toggleTajweed);

  const btnMushaf = document.getElementById('btnMushaf');
  if (btnMushaf) btnMushaf.addEventListener('click', toggleMushafMode);

  // Global Search Modal
  document.getElementById('btnSearch').addEventListener('click', openSearch);
  document.getElementById('searchInput').addEventListener('input', handleGlobalSearch);

  // Audio Player Controls
  document.getElementById('btnPlayPause').addEventListener('click', togglePlayPause);
  document.getElementById('btnStopAudio').addEventListener('click', stopAudio);
  document.getElementById('btnNextAya').addEventListener('click', playNextAya);
  document.getElementById('btnPrevAya').addEventListener('click', playPrevAya);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeDrawer();
    }
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      togglePlayPause();
    }
  });
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
  document.documentElement.setAttribute('data-theme', theme);

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

function toggleMushafMode() {
  const newMode = State.viewMode === 'reader' ? 'mushaf' : 'reader';
  setReaderMode(newMode);
}

function toggleTajweed() {
  State.tajweedEnabled = !State.tajweedEnabled;
  localStorage.setItem('ki_tajweed', State.tajweedEnabled);
  const btn = document.getElementById('btnTajweed');
  if (btn) btn.classList.toggle('active', State.tajweedEnabled);
  showToast(State.tajweedEnabled 
    ? (State.activeLang === 'ur' ? 'تجوید کلر فعال' : (State.activeLang === 'en' ? 'Tajweed colors enabled' : 'তাজবীদ কালার চালু হয়েছে'))
    : (State.activeLang === 'ur' ? 'تجوید کلر بند' : (State.activeLang === 'en' ? 'Tajweed colors disabled' : 'তাজবীদ কালার বন্ধ হয়েছে')));
  if (State.currentSurah) {
    if (State.viewMode === 'mushaf') renderMushafView();
    else renderReaderView();
  }
}

function setReaderMode(mode) {
  State.viewMode = mode;
  const btn = document.getElementById('btnMushaf');
  if (btn) btn.classList.toggle('active', mode === 'mushaf');
  if (mode === 'mushaf') {
    renderMushafView();
  } else {
    renderReaderView();
  }
}

// Render Sidebar Surahs List (with Makki / Madani Visual Artworks)
function renderSidebarSurahs(filtered = null) {
  const list = filtered || State.suras;
  const container = document.getElementById('listSurahs');
  const lang = State.activeLang;

  container.innerHTML = list.map(s => {
    const isCurrent = State.currentSurah && State.currentSurah.sura.sura_index === s.sura_index;
    const isMakki = (s.type_en || '').toLowerCase().includes('mecc') || (s.type_bn || '').includes('মাক্কী');
    const emblemImg = isMakki ? 'icons/ic_mecca.webp' : 'icons/ic_medina.webp';

    let sName = s.name_bn;
    let sType = s.type_bn;
    if (lang === 'ur') {
      sName = s.name_ur;
      sType = s.type_ur;
    } else if (lang === 'en') {
      sName = s.name_en;
      sType = s.type_en;
    }

    const ayaWord = t('aya');

    return `
      <div class="sidebar-list-item ${isCurrent ? 'active' : ''}" id="sidebar-surah-${s.sura_index}" onclick="loadSurah(${s.sura_index})">
        <div class="item-num">${toLocalizedNum(s.sura_index, lang)}</div>
        <div class="item-info">
          <div class="item-title">${sName}</div>
          <div class="item-sub">
            <span class="type-pill ${isMakki ? 'makki-pill' : 'madani-pill'}">
              <img src="${emblemImg}" alt="" class="list-type-icon">
              <span>${sType}</span>
            </span>
            <span>• ${toLocalizedNum(s.total_ayats, lang)} ${ayaWord}</span>
          </div>
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
    (s.name_bn && s.name_bn.toLowerCase().includes(query)) ||
    (s.name_ur && s.name_ur.includes(query)) ||
    (s.name_ar && s.name_ar.includes(query)) ||
    (s.name_en && s.name_en.toLowerCase().includes(query))
  );
  renderSidebarSurahs(filtered);
}

// Render Sidebar Paras List
function renderSidebarParas() {
  const container = document.getElementById('listParas');
  const lang = State.activeLang;

  container.innerHTML = State.paras.map(p => {
    const pName = lang === 'ur' ? p.name_ur : (lang === 'en' ? p.name_en : p.name_bn);
    const paraLabel = lang === 'ur' ? 'پارہ' : (lang === 'en' ? 'Para' : 'পারা');

    return `
      <div class="sidebar-list-item" onclick="loadSurah(${p.start_sura}, null, ${p.start_aya})">
        <div class="item-num">${toLocalizedNum(p.para_no, lang)}</div>
        <div class="item-info">
          <div class="item-title">${paraLabel} ${toLocalizedNum(p.para_no, lang)} (${pName})</div>
          <div class="item-sub">${toLocalizedNum(p.start_sura, lang)}:${toLocalizedNum(p.start_aya, lang)} – ${toLocalizedNum(p.end_sura, lang)}:${toLocalizedNum(p.end_aya, lang)}</div>
        </div>
        <div class="item-ar">${p.name_ar}</div>
      </div>
    `;
  }).join('');
}

// Render Sidebar Sajdahs List
function renderSidebarSajdahs() {
  const container = document.getElementById('listSajdahs');
  const lang = State.activeLang;

  container.innerHTML = State.sajdahs.map(s => {
    const sName = lang === 'ur' ? s.sura_name_ur : (lang === 'en' ? s.sura_name_en : s.sura_name_bn);
    const sajdahLabel = lang === 'ur' ? 'سجدہ' : (lang === 'en' ? 'Sajdah' : 'সিজদাহ্');

    return `
      <div class="ayat-card" style="margin-bottom:12px; padding:14px; cursor:pointer;" onclick="loadSurah(${s.sura_index}, null, ${s.aya_no})">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span class="ayat-badge" style="background:#E91E63; color:#fff; border:none;">
            ${sajdahLabel} ${toLocalizedNum(s.sajdah_no, lang)}
          </span>
          <span style="font-size:12px; color:var(--text-muted);">
            ${toLocalizedNum(s.sura_index, lang)}:${toLocalizedNum(s.aya_no, lang)}
          </span>
        </div>
        <h4 style="color:var(--primary-gold); margin-bottom:6px; font-size:15px;">${sName}</h4>
        <div style="font-family:var(--font-arabic); font-size:20px; direction:rtl; color:var(--primary-gold); line-height:1.6; margin-bottom:6px;">
          ${s.ar}
        </div>
        <div style="font-size:13px; line-height:1.6;">${lang === 'ur' ? s.tr_ur : (lang === 'en' ? s.tr_en : s.tr_bn)}</div>
      </div>
    `;
  }).join('');
}

// Render Sidebar About Articles (3 Platforms & Credits Featured)
function renderSidebarAbout() {
  const container = document.getElementById('listAbout');
  const lang = State.activeLang;

  const projectCardHtml = `
    <div class="ayat-card" style="margin-bottom:16px; padding:16px; border:1px solid var(--primary-gold); background:var(--gold-tint); border-radius:12px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <svg class="ui-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary-gold);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <h3 style="color:var(--primary-gold); margin:0; font-size:16px; font-weight:700;">${lang === 'ur' ? 'کنز الایمان قرآن و تفسیر پروجیکٹ' : (lang === 'en' ? 'Kanzul Iman Quran & Tafsir Project' : 'কানযুল ঈমান কুরআন ও তাফসীর প্রজেক্ট')}</h3>
      </div>
      <p style="font-size:13px; line-height:1.7; margin-bottom:12px;">
        ${lang === 'ur' 
          ? 'قرآنِ مجید کا مستند ترجمہ کنز الایمان اور تفسیر خزائن العرفان ۳ مختلف پلیٹ فارمز پر دستیاب ہے۔' 
          : (lang === 'en'
            ? 'The authentic translation Kanzul Iman and exegesis Khaza\'in al-\'Irfan are available across 3 distinct platforms.'
            : 'পবিত্র কুরআনুল কারীমের প্রামাণ্য অনুবাদ কানযুল ঈমান এবং তাফসীরে খাযাইনুল ইরফান ৩টি ভিন্ন ভিন্ন প্ল্যাটফর্মে সর্বাধুনিক প্রযুক্তিতে প্রস্তুত করা হয়েছে।')}
      </p>

      <div style="font-weight:700; color:var(--primary-gold); font-size:13px; margin-bottom:8px;">${t('threePlatforms')}:</div>
      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
        <a href="https://quran.abswer.com" class="store-badge-btn web-badge" style="text-decoration:none;">
          <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; color:var(--primary-gold);"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          <div class="badge-text">
            <span class="badge-sub">১. অনলাইন ও অফলাইন ব্রাউজার PWA</span>
            <span class="badge-main">WebApp (quran.abswer.com)</span>
          </div>
        </a>
        <a href="https://apps.microsoft.com/detail/9n96n14jd5n6?cid=DevShareMCLPCS" target="_blank" rel="noopener" class="store-badge-btn win-badge" style="text-decoration:none;">
          <svg class="badge-icon" viewBox="0 0 88 88" fill="currentColor" style="width:18px; height:18px;"><path d="M0 12.402l35.687-4.86.016 34.423-35.67.202L0 12.402zm35.67 33.529l.028 34.453L.028 75.48.016 46.129l35.654-.198zM40.065 6.843L87.95 0v41.527l-47.885.344V6.843zm47.896 39.539l-.011 41.618-47.885-6.744V46.038l47.896.344z"/></svg>
          <div class="badge-text">
            <span class="badge-sub">২. অফিসিয়াল মাইক্রোসফট স্টোর ডেস্কটপ অ্যাপ</span>
            <span class="badge-main">WindowsApp (Microsoft Store)</span>
          </div>
        </a>
        <a href="https://play.google.com/store/apps/details?id=com.abswer.kanzuliman" target="_blank" rel="noopener" class="store-badge-btn play-badge" style="text-decoration:none;">
          <svg class="badge-icon" viewBox="0 0 512 512" fill="currentColor" style="width:18px; height:18px;"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
          <div class="badge-text">
            <span class="badge-sub">৩. অফিসিয়াল গুগল প্লে স্টোর মোবাইল অ্যাপ</span>
            <span class="badge-main">AndroidApp (Google Play)</span>
          </div>
        </a>
      </div>

      <div style="font-weight:700; color:var(--primary-gold); font-size:13px; margin-bottom:6px;">
        ${lang === 'ur' ? 'مستند مآخذ و اعترافِ خدمات:' : (lang === 'en' ? 'Scholarly Sources & Credits:' : 'প্রামাণ্য তথ্যসূত্র ও কৃতজ্ঞতা স্বীকার:')}
      </div>
      <div style="font-size:12px; line-height:1.75; color:var(--text-main); background:var(--card-bg); padding:10px 12px; border-radius:8px; border:1px solid var(--card-border);">
        ${lang === 'ur' ? `
          • <strong>اصل اردو کنز الایمان:</strong> اعلیٰ حضرت امام احمد رضا خان فاضلِ بریلوی قدس سرہٗ العزیز<br>
          • <strong>تفسیر خزائن العرفان:</strong> صدر الافاضل علامہ سید محمد نعیم الدین مراد آبادی علیہ الرحمہ<br>
          • <strong>بنگلہ کنز الایمان ڈیجیٹلائزیشن:</strong> مستند نسخے سے گوگل ویژن اے آئی ٹیکنالوجی کی مدد سے مکمل پروف ریڈنگ و ڈیجیٹلائزیشن بذریعہ <strong>محمد نور الابصار</strong> (Mohammad Norul Abswer)۔<br>
          • <strong>انگریزی ترجمہ:</strong> ڈیجیٹل کمپائلیشن، اسٹرکچرنگ و ایڈجسٹمنٹ بذریعہ <strong>محمد نور الابصار</strong> (Mohammad Norul Abswer)۔<br>
          • <strong>سافٹ ویئر ڈیولپمنٹ و پبلشنگ:</strong> Apps Abswer (محمد نور الابصار)۔
        ` : (lang === 'en' ? `
          • <strong>Original Urdu Kanz al-Iman:</strong> Ala Hazrat Imam Ahmad Raza Khan Barelvi (Rahimahullah)<br>
          • <strong>Khaza'in al-'Irfan Tafsir:</strong> Sadr al-Afadil Allama Syed Muhammad Naeem-ud-Deen Muradabadi (Rahimahullah)<br>
          • <strong>Bengali Kanzul Iman Translation:</strong> Precision transcription, proofreading, and digitization directly compiled from authoritative editions using Google Vision AI by <strong>Mohammad Norul Abswer</strong>.<br>
          • <strong>English Translation:</strong> Digitally structured, verified, and integrated by <strong>Mohammad Norul Abswer</strong>.<br>
          • <strong>Software Architecture & Publishing:</strong> Apps Abswer (Mohammad Norul Abswer).
        ` : `
          • <strong>মূল উর্দু কানযুল ঈমান:</strong> আ'লা হযরত ইমাম আহমদ রেজা খান ফাযেলে বেরলভী (রহ.)<br>
          • <strong>তাফসীরে খাযাইনুল ইরফান:</strong> সদরুল আফাযিল আল্লামা সৈয়দ মুহাম্মদ নাঈম উদ্দীন মুরাদাবাদী (রহ.)<br>
          • <strong>বাংলা কানযুল ঈমান ডিজিটালাইজেশন:</strong> Google Vision AI প্রযুক্তির সহায়তায় প্রামাণ্য নুসখা থেকে ডিজিটাইজড, প্রুফরিডিং ও সংকলন: <strong>মুহাম্মদ নুরুল আবছার</strong> (Mohammad Norul Abswer)।<br>
          • <strong>ইংরেজি অনুবাদ:</strong> ডিজিটাল সংকলন ও বিন্যাস: <strong>মুহাম্মদ নুরুল আবছার</strong> (Mohammad Norul Abswer)।<br>
          • <strong>সফটওয়্যার উন্নয়ন ও প্রকাশনা:</strong> Apps Abswer (মুহাম্মদ নুরুল আবছার)।
        `)}
      </div>
    </div>
  `;

  container.innerHTML = projectCardHtml + State.about.map(a => {
    let aTitle = a.title_bn;
    let aAuthor = a.author_bn;
    let aContent = a.content_bn;

    if (lang === 'ur') {
      aTitle = a.title_ur || a.title_bn;
      aAuthor = a.author_ur || a.author_bn;
      aContent = a.content_ur || a.content_bn;
    } else if (lang === 'en') {
      aTitle = a.title_en || a.title_bn;
      aAuthor = a.author_en || a.author_bn;
      aContent = a.content_en || a.content_bn;
    }

    const authorLabel = lang === 'ur' ? 'مصنف / محقق' : (lang === 'en' ? 'Author / Scholar' : 'লেখক / সংকলক');

    return `
      <div class="ayat-card" style="margin-bottom:14px; padding:14px;">
        <h4 style="color:var(--primary-gold); margin-bottom:6px; font-size:15px;">${aTitle}</h4>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px;">${authorLabel}: ${aAuthor}</div>
        <div style="line-height:1.75; font-size:13px; white-space:pre-line;">${aContent}</div>
      </div>
    `;
  }).join('');
}

// Load Surah Data
async function loadSurah(suraIndex, callback, targetAya = null) {
  try {
    const res = await fetch(`./data/surah/${suraIndex}.json`);
    State.currentSurah = await res.json();

    // On Mobile: Switch to Reader Pane and Show Back Button
    if (window.innerWidth < 1024) {
      document.body.classList.add('mobile-reader-active');
      const btnBack = document.getElementById('btnMobileBack');
      if (btnBack) btnBack.style.display = 'flex';
      const name = State.activeLang === 'ur' ? State.currentSurah.sura.name_ur :
        (State.activeLang === 'en' ? State.currentSurah.sura.name_en : State.currentSurah.sura.name_bn);
      document.getElementById('topHeaderTitle').textContent = `${toLocalizedNum(suraIndex, State.activeLang)}. ${name}`;
      document.getElementById('topHeaderSubtitle').textContent = State.currentSurah.sura.name_ar;

      if (!history.state || !history.state.reader || history.state.suraIndex !== suraIndex) {
        history.pushState({ reader: true, suraIndex }, '');
      }
    }

    // Update active highlight in sidebar
    document.querySelectorAll('.sidebar-list-item').forEach(el => el.classList.remove('active'));
    const currentItem = document.getElementById(`sidebar-surah-${suraIndex}`);
    if (currentItem) currentItem.classList.add('active');

    if (State.viewMode === 'mushaf') {
      renderMushafView();
    } else {
      renderReaderView();
    }

    // Dynamic SEO & AI Search Metadata Updater
    updateDynamicSEO(suraIndex, targetAya);

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

// Dynamic SEO & AI Head Metadata updater
function updateDynamicSEO(suraIndex, targetAya = null) {
  if (!State.currentSurah) return;
  const { sura } = State.currentSurah;
  const lang = State.activeLang;

  let suraName = sura.name_bn;
  let suraMeaning = sura.meaning_bn;
  let intro = sura.intro_bn || '';

  if (lang === 'ur') {
    suraName = sura.name_ur;
    suraMeaning = sura.meaning_ur;
    intro = sura.intro_ur || '';
  } else if (lang === 'en') {
    suraName = sura.name_en;
    suraMeaning = sura.meaning_en;
    intro = sura.intro_en || '';
  }

  const ayaStr = targetAya ? ` (${lang === 'ur' ? 'آیت' : (lang === 'en' ? 'Ayah' : 'আয়াত')} ${toLocalizedNum(targetAya, lang)})` : '';
  const pageTitle = `${suraName}${ayaStr} - ${sura.name_ar} | ${t('appTitle')}`;
  document.title = pageTitle;

  const firstFewSentences = (intro.split('\n')[0] || `পবিত্র কুরআনুল কারীমের সূরা ${sura.name_bn} (${sura.name_ar})।`).trim();
  const desc = `${firstFewSentences} কানযুল ঈমান বাংলা ও উর্দু অনুবাদ এবং খাযাইনুল ইরফান তাফসীর।`;

  const metaDesc = document.getElementById('metaDescription');
  if (metaDesc) metaDesc.setAttribute('content', desc);

  const ogTitle = document.getElementById('ogTitle');
  if (ogTitle) ogTitle.setAttribute('content', pageTitle);

  const ogDesc = document.getElementById('ogDescription');
  if (ogDesc) ogDesc.setAttribute('content', desc);

  const twTitle = document.getElementById('twTitle');
  if (twTitle) twTitle.setAttribute('content', pageTitle);

  const twDesc = document.getElementById('twDescription');
  if (twDesc) twDesc.setAttribute('content', desc);

  const newUrl = `https://quran.abswer.com/?surah=${suraIndex}${targetAya ? `&aya=${targetAya}` : ''}&lang=${lang}`;
  const canonical = document.getElementById('canonicalUrl');
  if (canonical) canonical.setAttribute('href', newUrl);

  const ogUrl = document.getElementById('ogUrl');
  if (ogUrl) ogUrl.setAttribute('content', newUrl);

  if (window.history && window.history.replaceState) {
    window.history.replaceState({ surah: suraIndex, aya: targetAya, lang }, pageTitle, `?surah=${suraIndex}${targetAya ? `&aya=${targetAya}` : ''}&lang=${lang}`);
  }
}

// Render Reader View (Verse-by-Verse with Makki/Madani Artwork & Structured Tafsir)
function renderReaderView() {
  const { sura, verses } = State.currentSurah;
  const container = document.getElementById('readerContent');
  const lang = State.activeLang;

  const isMakki = (sura.type_en || '').toLowerCase().includes('mecc') || (sura.type_bn || '').includes('মাক্কী');
  const emblemImg = isMakki ? 'icons/ic_mecca.webp' : 'icons/ic_medina.webp';

  let surahTitle = sura.name_bn;
  let surahMeaning = sura.meaning_bn;
  let typeName = sura.type_bn;
  if (lang === 'ur') {
    surahTitle = sura.name_ur;
    surahMeaning = sura.meaning_ur;
    typeName = sura.type_ur;
  } else if (lang === 'en') {
    surahTitle = sura.name_en;
    surahMeaning = sura.meaning_en;
    typeName = sura.type_en;
  }

  const ayaWord = t('aya');
  const rukuWord = t('ruku');
  const tafsirHeading = t('tafsirTitle');
  const copyTafsirLabel = t('copyTafsir');
  const reciteLabel = t('recite');
  const tafsirLabel = t('tafsir');
  const copyLabel = t('copy');
  const shaanLabel = t('shaanNuzul');

  const bismillahHtml = sura.sura_index !== 9 && sura.sura_index !== 1
    ? `<div class="reader-bismillah" style="text-align:center; margin-bottom:20px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ</div>`
    : '';

  let html = `
    <div class="surah-header-card">
      <div class="surah-header-info">
        <div class="reader-title-ar">${sura.name_ar}</div>
        <div class="reader-title-local">${surahTitle} ${surahMeaning ? `• <span class="surah-meaning">${surahMeaning}</span>` : ''}</div>
        <div class="reader-meta">
          <span class="type-pill ${isMakki ? 'makki-pill' : 'madani-pill'}">
            <img src="${emblemImg}" alt="" class="list-type-icon">
            <span>${typeName}</span>
          </span>
          <span>•</span>
          <span>${toLocalizedNum(sura.total_ayats, lang)} ${ayaWord}</span>
          <span>•</span>
          <span>${toLocalizedNum(sura.total_rukus, lang)} ${rukuWord}</span>
        </div>
        <div class="surah-quick-actions">
          <button class="surah-action-pill" onclick="playSurahAudio(${sura.sura_index}, ${sura.total_ayats})">
            ${ICONS.speaker} <span>${lang === 'ur' ? 'مکمل تلاوت' : (lang === 'en' ? 'Full Recitation' : 'পূর্ণ তিলাওয়াত')}</span>
          </button>
          <button class="surah-action-pill ${State.viewMode === 'mushaf' ? 'active' : ''}" onclick="toggleMushafMode()">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span>${t('mushafMode')}</span>
          </button>
          <button class="surah-action-pill ${State.tajweedEnabled ? 'active' : ''}" onclick="toggleTajweed()">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
            <span>${t('tajweed')}</span>
          </button>
        </div>
      </div>
      <div class="surah-header-artwork">
        <img src="${emblemImg}" alt="${typeName}" class="surah-artwork-img" title="${typeName}">
      </div>
    </div>
    ${bismillahHtml}
  `;

  html += verses.map(v => {
    const isPlaying = State.isPlaying && State.playingSura === sura.sura_index && State.playingAya === v.aya;
    const arabicText = applyTajweed(v.ar);
    const sajdahBadge = v.is_sajdah ? `<span class="ayat-badge" style="background:#E91E63; color:#fff; border:none;">${t('sajdahWord')}</span>` : '';

    const tafsirContent = (lang === 'ur' && v.tf_ur) ? v.tf_ur : ((lang === 'en' && v.tf_en) ? v.tf_en : v.tf_bn);
    const formattedTafsir = formatTafsirText(tafsirContent, lang);
    const shaanContent = (lang === 'ur' && v.asb_ur) ? v.asb_ur : v.asb_bn;

    return `
      <div class="ayat-card ${isPlaying ? 'playing' : ''}" id="ayat-${v.aya}">
        <div class="ayat-top-bar">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="ayat-badge">${toLocalizedNum(sura.sura_index, lang)}:${toLocalizedNum(v.aya, lang)}</span>
            ${sajdahBadge}
          </div>
          <div class="ayat-actions">
            <button class="ayat-btn" onclick="playSingleAya(${sura.sura_index}, ${v.aya})">${ICONS.speaker} ${reciteLabel}</button>
            <button class="ayat-btn" onclick="toggleTafsir(${v.aya})">${ICONS.book} ${tafsirLabel}</button>
            <button class="ayat-btn" onclick="copyAyatText(${sura.sura_index}, ${v.aya})">${ICONS.copy} ${copyLabel}</button>
          </div>
        </div>

        <div class="ayat-arabic">${arabicText}</div>

        ${State.settings.showBn && v.tr_bn ? `<div class="ayat-trans-bn"><strong>অনুবাদ (বাংলা):</strong> ${v.tr_bn}</div>` : ''}
        ${State.settings.showUr && v.tr_ur ? `<div class="ayat-trans-ur">${v.tr_ur}</div>` : ''}
        ${State.settings.showEn && v.tr_en ? `<div class="ayat-trans-en"><strong>En:</strong> ${v.tr_en}</div>` : ''}

        <div class="tafsir-box" id="tafsir-${v.aya}">
          <div class="tafsir-header">
            <div style="display:flex; align-items:center; gap:6px;">
              <svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--primary-gold);"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              <span>${tafsirHeading}</span>
            </div>
            <button class="ayat-btn" onclick="copyFullTafsir(${sura.sura_index}, ${v.aya})">${ICONS.copy} ${copyTafsirLabel}</button>
          </div>
          ${shaanContent ? `<div class="tafsir-shaan"><strong>${shaanLabel}:</strong> ${shaanContent}</div>` : ''}
          <div class="tafsir-body-container">
            ${formattedTafsir}
          </div>
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
  const lang = State.activeLang;

  const bismillahHtml = sura.sura_index !== 9 && sura.sura_index !== 1
    ? `<div class="reader-bismillah" style="text-align:center; margin-bottom:20px;">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ</div>`
    : '';

  let textHtml = verses.map(v => {
    const arText = applyTajweed(v.ar);
    return `${arText} <span class="mushaf-aya-end" id="mushaf-aya-${v.aya}" onclick="playSingleAya(${sura.sura_index}, ${v.aya})">${toLocalizedNum(v.aya, lang)}</span> `;
  }).join('');

  const surahName = lang === 'ur' ? sura.name_ur : (lang === 'en' ? sura.name_en : sura.name_bn);
  const isMakki = (sura.type_en || '').toLowerCase().includes('mecc') || (sura.type_bn || '').includes('মাক্কী');
  const emblemImg = isMakki ? 'icons/ic_mecca.webp' : 'icons/ic_medina.webp';
  const typeName = lang === 'ur' ? sura.type_ur : (lang === 'en' ? sura.type_en : sura.type_bn);

  container.innerHTML = `
    <div class="surah-header-card">
      <div class="surah-header-info">
        <div class="reader-title-ar">${sura.name_ar}</div>
        <div class="reader-title-local">${surahName} (${t('mushafMode')})</div>
        <div class="reader-meta">
          <span class="type-pill ${isMakki ? 'makki-pill' : 'madani-pill'}">
            <img src="${emblemImg}" alt="" class="list-type-icon">
            <span>${typeName}</span>
          </span>
          <span>•</span>
          <span>${toLocalizedNum(sura.total_ayats, lang)} ${t('aya')}</span>
          <span>•</span>
          <span>${toLocalizedNum(sura.total_rukus, lang)} ${t('ruku')}</span>
        </div>
        <div class="surah-quick-actions">
          <button class="surah-action-pill" onclick="playSurahAudio(${sura.sura_index}, ${sura.total_ayats})">
            ${ICONS.speaker} <span>${lang === 'ur' ? 'مکمل تلاوت' : (lang === 'en' ? 'Full Recitation' : 'পূর্ণ তিলাওয়াত')}</span>
          </button>
          <button class="surah-action-pill active" onclick="toggleMushafMode()">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 1 3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span>${lang === 'ur' ? 'آیت بہ آیت ترجمہ' : (lang === 'en' ? 'Verse-by-Verse' : 'আয়াতভিত্তিক অনুবাদ')}</span>
          </button>
          <button class="surah-action-pill ${State.tajweedEnabled ? 'active' : ''}" onclick="toggleTajweed()">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
            <span>${t('tajweed')}</span>
          </button>
        </div>
      </div>
      <div class="surah-header-artwork">
        <img src="${emblemImg}" alt="" class="surah-artwork-img">
      </div>
    </div>
    <div class="mushaf-container">
      ${bismillahHtml}
      ${textHtml}
    </div>
  `;
}

// Toggle Tafsir Box
function toggleTafsir(aya) {
  const el = document.getElementById(`tafsir-${aya}`);
  if (el) el.classList.toggle('open');
}

// Copy Single Ayat Text
function copyAyatText(suraIndex, aya) {
  const v = State.currentSurah.verses.find(item => item.aya === aya);
  if (!v) return;

  const lang = State.activeLang;
  const sura = State.currentSurah.sura;
  const sName = lang === 'ur' ? sura.name_ur : (lang === 'en' ? sura.name_en : sura.name_bn);

  const text = `${sName} [${toLocalizedNum(suraIndex, lang)}:${toLocalizedNum(aya, lang)}]\n\n${v.ar}\n\nবাংলা অনুবাদ: ${v.tr_bn}\n\nاردو کنز الایمان:\n${v.tr_ur}\n\nEnglish: ${v.tr_en}`;
  navigator.clipboard.writeText(text).then(() => showToast(t('toastCopied')));
}

// Copy Full Ayat + Tafsir
function copyFullTafsir(suraIndex, aya) {
  const v = State.currentSurah.verses.find(item => item.aya === aya);
  if (!v) return;

  const lang = State.activeLang;
  const sura = State.currentSurah.sura;
  const sName = lang === 'ur' ? sura.name_ur : (lang === 'en' ? sura.name_en : sura.name_bn);

  let cleanTafsir = (v.tf_bn || '')
    .replace(/(?:«|<<)(.*?)(?:»|>>)/g, '«$1»')
    .replace(/\*\*/g, '')
    .trim();

  let text = `${sName} [${toLocalizedNum(suraIndex, lang)}:${toLocalizedNum(aya, lang)}]\n\n${v.ar}\n\nবাংলা অনুবাদ: ${v.tr_bn}\n\nখাযাইনুল ইরফান তাফসীর:\n`;
  if (v.asb_bn) text += `শানে নুযূল: ${v.asb_bn}\n\n`;
  text += cleanTafsir;

  navigator.clipboard.writeText(text).then(() => showToast(t('toastTafsirCopied')));
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
  document.body.classList.remove('audio-playing');
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
  document.body.classList.add('audio-playing');

  const sura = State.suras.find(s => s.sura_index === State.playingSura);
  const suraName = sura ? (State.activeLang === 'ur' ? sura.name_ur : (State.activeLang === 'en' ? sura.name_en : sura.name_bn)) : '';

  document.getElementById('audioTitle').textContent = suraName;
  document.getElementById('audioMeta').textContent = `${t('aya')}: ${toLocalizedNum(State.playingAya, State.activeLang)} (কারী মিশারি রাশিদ)`;

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
    (s.name_ur && s.name_ur.includes(q)) ||
    (s.name_en && s.name_en.toLowerCase().includes(q)) ||
    (s.name_ar && s.name_ar.includes(q))
  );

  resultsContainer.innerHTML = matches.map(s => {
    const sName = State.activeLang === 'ur' ? s.name_ur : (State.activeLang === 'en' ? s.name_en : s.name_bn);
    const sType = State.activeLang === 'ur' ? s.type_ur : (State.activeLang === 'en' ? s.type_en : s.type_bn);

    return `
      <div class="search-item" onclick="loadSurah(${s.sura_index}); closeSearch();">
        <div>
          <strong style="color:var(--primary-gold);">${toLocalizedNum(s.sura_index, State.activeLang)}. ${sName}</strong>
          <div style="font-size:12px; color:var(--text-muted);">${sType} • ${toLocalizedNum(s.total_ayats, State.activeLang)} ${t('aya')}</div>
        </div>
        <div style="font-family:var(--font-arabic); font-size:18px; color:var(--primary-gold);">${s.name_ar}</div>
      </div>
    `;
  }).join('');
}

// Launch Application
window.addEventListener('DOMContentLoaded', initApp);
