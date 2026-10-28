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
  manzils: [],
  sajdahs: [],
  roots: [],
  about: [],
  currentSurah: null,
  activeSidebarTab: 'surah', // 'surah' | 'para' | 'manzil' | 'sajdah' | 'root' | 'about'
  viewMode: 'reader', // 'reader' | 'mushaf'
  activeLang: localStorage.getItem('ki_lang') || 'bn', // 'bn' | 'ur' | 'en' | 'hi'
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
    showTranslit: localStorage.getItem('ki_show_translit') !== 'false',
    showBn: localStorage.getItem('ki_show_bn') !== 'false',
    showUr: localStorage.getItem('ki_show_ur') !== 'false',
    showEn: localStorage.getItem('ki_show_en') === 'true',
    showHi: localStorage.getItem('ki_show_hi') !== 'false',
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

// Localization Dictionary (4 Languages: BN, UR, EN, HI)
const I18N = {
  bn: {
    appTitle: 'কানযুল ঈমান',
    appSubtitle: 'কুরআন ও খাযাইনুল ইরফান তাফসীর',
    tabSurah: 'সূরা (১১৪)',
    tabPara: 'পারা (৩০)',
    tabManzil: 'মঞ্জিল (৭)',
    tabSajdah: 'সিজদাহ্ (১৪)',
    tabRoot: 'শব্দমূল (১,৬৬২)',
    tabAbout: 'পরিচিতি',
    searchPlaceholder: 'দ্রুত খুঁজুন (নাম বা নম্বর)...',
    searchRootsPlaceholder: 'শব্দমূল বা অর্থ খুঁজুন...',
    searchTitle: 'কুরআন অনুসন্ধান',
    searchAllPlaceholder: 'আরবি, বাংলা, উর্দু বা হিন্দি শব্দ লিখুন...',
    searchModalPlaceholder: 'সূরা বা পারার নাম লিখুন (যেমন: ইয়াসীন, রহমান, ১৮, ১১৪)...',
    mushafMode: 'মুসহাফ পাঠ',
    tajweed: 'তাজবীদ কালার',
    settings: 'সেটিংস',
    themeToggleTooltip: 'থিম পরিবর্তন (ডার্ক/লাইট/সেপিয়া)',
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
    welcomeQuranTafsir: 'কুরআন ও তাফসীর',
    welcomeDesc: 'বাম পাশের তালিকা থেকে যেকোনো সূরা, পারা বা মঞ্জিল নির্বাচন করুন। সম্পূর্ণ ১১৪টি সূরা, বিশুদ্ধ কানযুল ঈমান বাংলা, উর্দু ও হিন্দি অনুবাদ, এবং খাযাইনুল ইরফান তাফসীর পাঠ করুন।',
    closeDrawer: 'বন্ধ করুন',
    closeSearch: 'অনুসন্ধান বন্ধ করুন',
    // Settings Drawer Translations
    drawerTitle: 'সেটিংস ও পছন্দসমূহ',
    drawerPlatformsTitle: 'অ্যাপের ৩টি প্ল্যাটফর্ম:',
    drawerWebMain: '১. WebApp (PWA ব্রাউজার)',
    drawerWebSub: 'অনলাইন ও অফলাইনে সরাসরি ব্রাউজারে',
    drawerWinMain: '২. WindowsApp (ডেস্কটপ)',
    drawerWinSub: 'Microsoft Store থেকে ইনস্টল করুন',
    drawerPlayMain: '৩. AndroidApp (মোবাইল)',
    drawerPlaySub: 'Google Play Store থেকে ইনস্টল করুন',
    drawerLangTitle: 'অ্যাপের ভাষা (Language / زبان / भाषा)',
    drawerThemeTitle: 'থিম নির্বাচন',
    themeDark: 'ডার্ক',
    themeLight: 'লাইট',
    themeSepia: 'সেপিয়া',
    drawerArabicSize: 'আরবি ফন্ট সাইজ',
    drawerTransSize: 'অনুবাদ ফন্ট সাইজ',
    drawerTafsirSize: 'তাফসীর ফন্ট সাইজ',
    drawerDisplayTitle: 'উচ্চারণ ও অনুবাদ প্রদর্শন',
    chkTranslitLabel: 'উচ্চারণ প্রদর্শন (Transliteration)',
    chkBnLabel: 'বাংলা কানযুল ঈমান (মুহাম্মদ নুরুল আবছার)',
    chkUrLabel: 'উর্দু কানযুল ঈমান (ইমাম আহমদ রেজা খান রহ.)',
    chkHiLabel: 'হিন্দী কানযুল ঈমান (মুফতী মুহাম্মদ খান ক্বাদেরী)',
    chkEnLabel: 'ইংরেজি অনুবাদ (সংকলন: মুহাম্মদ নুরুল আবছার)',
    chkDrawerTajweedLabel: 'তাজবীদ কালার হাইলাইটার (Tajweed Colors)',
    drawerFooterText: 'কানযুল ঈমান কুরআন ও তাফসীর v2.0.0<br>ওয়েব, উইন্ডোজ ও এন্ড্রয়েড — ৩টি সংস্করণেই উন্মুক্ত<br>© 2026 Mohammad Norul Abswer',
    pronunciation: 'উচ্চারণ',
    transTranslation: 'অনুবাদ',
    backTooltip: 'তালিকায় ফিরুন',
    occurrences: 'বার ব্যবহৃত',
    derivatives: 'কুরআনিক রূপ',
    meaning: 'অর্থ',
    rootDetails: 'শব্দমূল বিশদ বিবরণ'
  },
  ur: {
    appTitle: 'کنز الایمان',
    appSubtitle: 'قرآن و تفسیر خزائن العرفان',
    tabSurah: 'سورتیں (۱۱۴)',
    tabPara: 'پارے (۳۰)',
    tabManzil: 'منزلیں (۷)',
    tabSajdah: 'سجدے (۱۴)',
    tabRoot: 'الفاظ و مفردات (۱،۶۶۲)',
    tabAbout: 'تعارف و مقالات',
    searchPlaceholder: 'تلاش کریں (نام یا نمبر)...',
    searchRootsPlaceholder: 'مادہ یا معنی تلاش کریں...',
    searchTitle: 'تلاشِ قرآن',
    searchAllPlaceholder: 'عربی، اردو، ہندی یا انگریزی الفاظ درج کریں...',
    searchModalPlaceholder: 'سورہ یا پارے کا نام لکھیں (جیسے: یٰسین، الرحمن، ۱۸، ۱۱۴)...',
    mushafMode: 'مصحف تلاوت',
    tajweed: 'تجوید کلر',
    settings: 'ترتیبات',
    themeToggleTooltip: 'تھیم تبدیل کریں (ڈارک/لائٹ/سیپیا)',
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
    welcomeQuranTafsir: 'قرآن و تفسیر',
    welcomeDesc: 'بائیں جانب کی فہرست سے کسی بھی سورہ، پارے یا منزل کا انتخاب کریں۔ مکمل ۱۱۴ سورتیں، مستند کنز الایمان اردو، بنگالی و ہندی ترجمہ، اور تفسیر خزائن العرفان کا مطالعہ فرمائیں۔',
    closeDrawer: 'بند کریں',
    closeSearch: 'تلاش بند کریں',
    // Settings Drawer Translations
    drawerTitle: 'ترتیبات و ترجیحات',
    drawerPlatformsTitle: 'ایپ کے ۳ پلیٹ فارمز:',
    drawerWebMain: '۱. WebApp (آن لائن PWA)',
    drawerWebSub: 'براؤزر اور آف لائن مطالعہ',
    drawerWinMain: '۲. WindowsApp (ڈیسک ٹاپ)',
    drawerWinSub: 'مائیکروسافٹ اسٹور سے ڈاؤن لوڈ کریں',
    drawerPlayMain: '۳. AndroidApp (موبائل)',
    drawerPlaySub: 'گوگل پلے اسٹور سے انسٹال کریں',
    drawerLangTitle: 'ایپ کی زبان (Language / زبان / भाषा)',
    drawerThemeTitle: 'تھیم کا انتخاب',
    themeDark: 'ڈارک',
    themeLight: 'لائٹ',
    themeSepia: 'سیپیا',
    drawerArabicSize: 'عربی فونٹ سائز',
    drawerTransSize: 'ترجمہ فونٹ سائز',
    drawerTafsirSize: 'تفسیر فونٹ سائز',
    drawerDisplayTitle: 'تلفظ اور ترجمہ کی ترتیبات',
    chkTranslitLabel: 'تلفظ دکھائیں (Transliteration)',
    chkBnLabel: 'بنگالی کنز الایمان (محمد نور الابصار)',
    chkUrLabel: 'اردو کنز الایمان (امام احمد رضا خان علیہ الرحمہ)',
    chkHiLabel: 'ہندی کنز الایمان (مفتی محمد خان قادری)',
    chkEnLabel: 'انگریزی ترجمہ (محمد نور الابصار)',
    chkDrawerTajweedLabel: 'تجوید کلر ہائی لائٹر (Tajweed Colors)',
    drawerFooterText: 'کنز الایمان قرآن و تفسیر v2.0.0<br>ویب، ونڈوز اور اینڈرائیڈ — تینوں پلیٹ فارمز پر دستیاب<br>© 2026 Mohammad Norul Abswer',
    pronunciation: 'تلفظ',
    transTranslation: 'ترجمہ',
    backTooltip: 'واپس فہرست میں جائیں',
    occurrences: 'بار استعمال ہوا',
    derivatives: 'قرآنی مشتقات',
    meaning: 'معنی',
    rootDetails: 'قرآنی مادہ کی تفصیل'
  },
  en: {
    appTitle: 'Kanzul Iman',
    appSubtitle: "Quran & Khaza'in al-'Irfan Tafsir",
    tabSurah: 'Surahs (114)',
    tabPara: 'Paras (30)',
    tabManzil: 'Manzils (7)',
    tabSajdah: 'Sajdahs (14)',
    tabRoot: 'Roots (1,662)',
    tabAbout: 'About & Articles',
    searchPlaceholder: 'Quick search (name or number)...',
    searchRootsPlaceholder: 'Search root or meaning...',
    searchTitle: 'Search Quran',
    searchAllPlaceholder: 'Type Arabic, English, Urdu or Hindi...',
    searchModalPlaceholder: 'Type Surah or Para name (e.g. Yaseen, Rahman, 18, 114)...',
    mushafMode: 'Mushaf Mode',
    tajweed: 'Tajweed Colors',
    settings: 'Settings',
    themeToggleTooltip: 'Switch Theme (Dark / Light / Sepia)',
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
    welcomeQuranTafsir: 'Quran & Tafsir',
    welcomeDesc: 'Select any Surah, Para, or Manzil from the sidebar list. Read all 114 Surahs with authentic Urdu & Bengali Kanzul Iman, Hindi and English translations, and Khaza\'in al-\'Irfan Tafsir.',
    closeDrawer: 'Close',
    closeSearch: 'Close Search',
    // Settings Drawer Translations
    drawerTitle: 'Settings & Preferences',
    drawerPlatformsTitle: '3 App Platforms:',
    drawerWebMain: '1. WebApp (PWA Browser)',
    drawerWebSub: 'Online & offline in browser',
    drawerWinMain: '2. WindowsApp (Desktop)',
    drawerWinSub: 'Install from Microsoft Store',
    drawerPlayMain: '3. AndroidApp (Mobile)',
    drawerPlaySub: 'Install from Google Play Store',
    drawerLangTitle: 'App Language (Language / زبان / भाषा)',
    drawerThemeTitle: 'Appearance Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeSepia: 'Sepia',
    drawerArabicSize: 'Arabic Font Size',
    drawerTransSize: 'Translation Font Size',
    drawerTafsirSize: 'Tafsir Font Size',
    drawerDisplayTitle: 'Pronunciation & Translation Options',
    chkTranslitLabel: 'Show Pronunciation (Transliteration)',
    chkBnLabel: 'Bengali Kanzul Iman (Mohammad Norul Abswer)',
    chkUrLabel: 'Urdu Kanzul Iman (Imam Ahmad Raza Khan)',
    chkHiLabel: 'Hindi Kanzul Iman (Mufti Muhammad Khan)',
    chkEnLabel: 'English Translation (Mohammad Norul Abswer)',
    chkDrawerTajweedLabel: 'Tajweed Color Highlighter',
    drawerFooterText: 'Kanzul Iman Quran & Tafsir v2.0.0<br>Web, Windows & Android — Available on 3 Platforms<br>© 2026 Mohammad Norul Abswer',
    pronunciation: 'Pronunciation',
    transTranslation: 'Translation',
    backTooltip: 'Back to list',
    occurrences: 'times used',
    derivatives: 'Quranic Derivatives',
    meaning: 'Meaning',
    rootDetails: 'Quranic Root Details'
  },
  hi: {
    appTitle: 'कन्ज़ुल ईमान',
    appSubtitle: 'क़ुरआन व ख़ज़ाइनुल इरफ़ान तफ़्सीर',
    tabSurah: 'सूरह (114)',
    tabPara: 'पारा (30)',
    tabManzil: 'मंज़िल (7)',
    tabSajdah: 'सजदा (14)',
    tabRoot: 'शब्दमूल (1,662)',
    tabAbout: 'परिचय व लेख',
    searchPlaceholder: 'त्वरित खोजें (नाम या संख्या)...',
    searchRootsPlaceholder: 'मूल शब्द या अर्थ खोजें...',
    searchTitle: 'क़ुरआन खोज',
    searchAllPlaceholder: 'अरबी, हिन्दी, उर्दू या अंग्रेज़ी शब्द लिखें...',
    searchModalPlaceholder: 'सूरह या पारा का नाम लिखें (उदा. यासीन, रहमान, 18, 114)...',
    mushafMode: 'मुसहफ़ पाठ',
    tajweed: 'तजवीद रंग',
    settings: 'सेटिंग्स',
    themeToggleTooltip: 'थीम बदलें (डार्क / लाइट / सेपिया)',
    recite: 'तिलावत',
    tafsir: 'तफ़्सीर',
    copy: 'कॉपी',
    copyTafsir: 'तफ़्सीर कॉपी',
    aya: 'आयत',
    ruku: 'रुकू',
    makki: 'मक्की',
    madani: 'मदनी',
    sajdahWord: 'सजदा',
    tafsirTitle: 'ख़ज़ाइनुल इरफ़ान तफ़्सीर',
    shaanNuzul: 'शाने नुज़ूल',
    note: 'हाशिया',
    preambleTitle: 'भूमिका व फ़ज़ीलत',
    toastCopied: 'कॉपी हो गया!',
    toastTafsirCopied: 'सम्पूर्ण आयत और तफ़्सीर कॉपी हो गई!',
    threePlatforms: 'ऐप के 3 प्लेटफ़ॉर्म',
    webApp: 'WebApp (ऑनलाइन PWA)',
    winApp: 'WindowsApp (माइक्रोसॉफ़्ट स्टोर)',
    androidApp: 'AndroidApp (गूगल प्ले स्टोर)',
    welcomeQuranTafsir: 'क़ुरआन व तफ़्सीर',
    welcomeDesc: 'बाईं ओर की सूची से कोई भी सूरह, पारा या मंज़िल चुनें। सम्पूर्ण 114 सूरह, प्रामाणिक कन्ज़ुल ईमान हिन्दी व उर्दू अनुवाद, और ख़ज़ाइनुल इरफ़ान तफ़्सीर का अध्ययन करें।',
    closeDrawer: 'बंद करें',
    closeSearch: 'खोज बंद करें',
    // Settings Drawer Translations
    drawerTitle: 'सेटिंग्स व प्राथमिकताएं',
    drawerPlatformsTitle: 'ऐप के 3 प्लेटफ़ॉर्म:',
    drawerWebMain: '१. WebApp (PWA ब्राउज़र)',
    drawerWebSub: 'ऑनलाइन व ऑफ़लाइन सीधे ब्राउज़र में',
    drawerWinMain: '२. WindowsApp (डेस्कटॉप)',
    drawerWinSub: 'Microsoft Store से इंस्टॉल करें',
    drawerPlayMain: '३. AndroidApp (मोबाइल)',
    drawerPlaySub: 'Google Play Store से इंस्टॉल करें',
    drawerLangTitle: 'ऐप की भाषा (Language / زبان / भाषा)',
    drawerThemeTitle: 'थीम चयन',
    themeDark: 'डार्क',
    themeLight: 'लाइट',
    themeSepia: 'सेपिया',
    drawerArabicSize: 'अरबी फ़ॉन्ट साइज़',
    drawerTransSize: 'अनुवाद फ़ॉन्ट साइज़',
    drawerTafsirSize: 'तफ़्सीर फ़ॉन्ट साइज़',
    drawerDisplayTitle: 'उच्चारण व अनुवाद प्रदर्शन',
    chkTranslitLabel: 'उच्चारण प्रदर्शन (Transliteration)',
    chkBnLabel: 'বাংলা কানযুল ঈমান (মুহাম্মদ নুরুল আবছার)',
    chkUrLabel: 'उर्दू कन्ज़ुल ईमान (इमाम अहमद रज़ा ख़ान)',
    chkHiLabel: 'हिन्दी कन्ज़ुल ईमान (मौलाना मुफ़्ती मोहम्मद ख़ान)',
    chkEnLabel: 'अंग्रेज़ी अनुवाद (मोहम्मद नुरुल अब्सार)',
    chkDrawerTajweedLabel: 'तजवीद रंग हाइलाइटर (Tajweed Colors)',
    drawerFooterText: 'कन्ज़ुल ईमान क़ुरआन व तफ़्सीर v2.0.0<br>वेब, विंडोज़ व एंड्रॉइड — तीनों संस्करणों में उपलब्ध<br>© 2026 Mohammad Norul Abswer',
    pronunciation: 'उच्चारण',
    transTranslation: 'अनुवाद',
    backTooltip: 'सूची में वापस जाएं',
    occurrences: 'बार प्रयुक्त',
    derivatives: 'क़ुरआनी रूप',
    meaning: 'अर्थ',
    rootDetails: 'क़ुरआनी मूल शब्द विवरण'
  }
};

// Translation Helper
function t(key) {
  const dict = I18N[State.activeLang] || I18N.bn;
  return dict[key] || I18N.bn[key] || key;
}

// Localized Number Formatter (Bengali, Urdu, Hindi, English digits)
const toLocalizedNum = (num, lang = State.activeLang) => {
  if (lang === 'bn') {
    const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(num).replace(/[0-9]/g, d => bnDigits[d]);
  } else if (lang === 'ur') {
    const urDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(num).replace(/[0-9]/g, d => urDigits[d]);
  } else if (lang === 'hi') {
    const hiDigits = ['०','१','२','३','४','५','६','७','८','९'];
    return String(num).replace(/[0-9]/g, d => hiDigits[d]);
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

// ========================================================
// Pinpoint Character-Level Tajweed Engine (Android/Desktop Parity)
// With Lam-Alef Ligature Protection & Zero Whole-Word Bleeding
// ========================================================
const maddRegex = /.?[\u0653\u06E4]/g;
const ghunnahRegex = /[نم][\u064E\u064F\u0650\u0670]?[\u0651]/g;
const qalqalahRegex = /[قطبجد][\u0652\u06E1]/g;
const iqlabRegex = /.?[\u06E2\u0658]/g;
const waqfRegex = /[\u06D6-\u06DC\u06DF-\u06E1\u06E8\u06EA-\u06ED]+/g;
const lamAlefRegex = /\u0644[\u064B-\u065F\u0670]*[\u0622\u0623\u0625\u0627\u0671]/g;

function applyTajweed(arabicText) {
  if (!State.tajweedEnabled || !arabicText) return arabicText;

  // 1. Locate all Lam-Alef ligature clusters to avoid breaking ligatures
  const lamAlefRanges = [];
  let m;
  lamAlefRegex.lastIndex = 0;
  while ((m = lamAlefRegex.exec(arabicText)) !== null) {
    lamAlefRanges.push({ start: m.index, end: m.index + m[0].length });
  }

  function protectRange(start, end) {
    let s = start, e = end;
    for (const r of lamAlefRanges) {
      if (s < r.end && e > r.start) {
        s = Math.min(s, r.start);
        e = Math.max(e, r.end);
      }
    }
    return { start: s, end: e };
  }

  const rawSpans = [];

  function collect(regex, cls) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(arabicText)) !== null) {
      const p = protectRange(match.index, match.index + match[0].length);
      rawSpans.push({ start: p.start, end: p.end, cls });
    }
  }

  // Priority order: Waqf marks first, then Madd, Ghunnah, Iqlab, Qalqalah
  collect(waqfRegex, 'tajweed-waqf');
  collect(maddRegex, 'tajweed-madd');
  collect(ghunnahRegex, 'tajweed-ghunnah');
  collect(iqlabRegex, 'tajweed-iqlab');
  collect(qalqalahRegex, 'tajweed-qalqalah');

  if (rawSpans.length === 0) return arabicText;

  // Sort by start position
  rawSpans.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  // Merge non-overlapping spans
  const cleanSpans = [];
  let lastEnd = 0;
  for (const s of rawSpans) {
    if (s.start >= lastEnd) {
      cleanSpans.push(s);
      lastEnd = s.end;
    } else if (s.end > lastEnd) {
      cleanSpans.push({ start: lastEnd, end: s.end, cls: s.cls });
      lastEnd = s.end;
    }
  }

  // Build final HTML string
  let result = '';
  let cursor = 0;
  for (const s of cleanSpans) {
    if (s.start > cursor) {
      result += arabicText.slice(cursor, s.start);
    }
    result += `<span class="${s.cls}">${arabicText.slice(s.start, s.end)}</span>`;
    cursor = s.end;
  }
  if (cursor < arabicText.length) {
    result += arabicText.slice(cursor);
  }
  return result;
}

// ========================================================
// Structured Tafsir Formatter (Clean Markdown ** & Guillemets «...» / <<...>>)
// ========================================================
function formatTafsirText(rawText, lang = 'bn') {
  if (!rawText || !rawText.trim()) {
    const emptyMsg = lang === 'ur' ? 'اس آیت کے لیے کوئی الگ تفسیری حاشیہ نہیں ہے۔' :
      (lang === 'hi' ? 'इस आयत के लिए कोई अलग तफ़्सीरी हाशिया नहीं है।' :
      (lang === 'en' ? 'No separate commentary note for this verse.' : 'এই আয়াতের জন্য আলাদা কোনো তাফসীর নোট নেই।'));
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
        let title = lang === 'ur' ? 'فضائل و تعارف' : (lang === 'hi' ? 'भूमिका व फ़ज़ीलत' : (lang === 'en' ? 'Introduction & Virtues' : 'ভূমিকা ও মাহাত্ম্য'));
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
      const noteLabel = lang === 'ur' ? `حاشیہ ${numStr}` : (lang === 'hi' ? `हाशिया ${numStr}` : (lang === 'en' ? `Note ${numStr}` : `টীকা ${numStr}`));

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

// Update Settings Drawer Language & Controls
function updateSettingsDrawerLanguage(lang = State.activeLang) {
  const drawerTitle = document.getElementById('drawerTitle');
  if (drawerTitle) drawerTitle.textContent = t('drawerTitle');

  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  if (btnCloseDrawer) btnCloseDrawer.title = t('closeDrawer');

  const drawerPlatformsHeading = document.getElementById('drawerPlatformsHeading');
  if (drawerPlatformsHeading) drawerPlatformsHeading.textContent = t('drawerPlatformsTitle');

  const badgeWebMain = document.getElementById('badgeWebMain');
  if (badgeWebMain) badgeWebMain.textContent = t('drawerWebMain');
  const badgeWebSub = document.getElementById('badgeWebSub');
  if (badgeWebSub) badgeWebSub.textContent = t('drawerWebSub');

  const badgeWinMain = document.getElementById('badgeWinMain');
  if (badgeWinMain) badgeWinMain.textContent = t('drawerWinMain');
  const badgeWinSub = document.getElementById('badgeWinSub');
  if (badgeWinSub) badgeWinSub.textContent = t('drawerWinSub');

  const badgePlayMain = document.getElementById('badgePlayMain');
  if (badgePlayMain) badgePlayMain.textContent = t('drawerPlayMain');
  const badgePlaySub = document.getElementById('badgePlaySub');
  if (badgePlaySub) badgePlaySub.textContent = t('drawerPlaySub');

  const lblDrawerLang = document.getElementById('lblDrawerLang');
  if (lblDrawerLang) lblDrawerLang.textContent = t('drawerLangTitle');

  const lblDrawerTheme = document.getElementById('lblDrawerTheme');
  if (lblDrawerTheme) lblDrawerTheme.textContent = t('drawerThemeTitle');

  const btnThemeDark = document.getElementById('btnThemeDark');
  if (btnThemeDark) btnThemeDark.textContent = t('themeDark');
  const btnThemeLight = document.getElementById('btnThemeLight');
  if (btnThemeLight) btnThemeLight.textContent = t('themeLight');
  const btnThemeSepia = document.getElementById('btnThemeSepia');
  if (btnThemeSepia) btnThemeSepia.textContent = t('themeSepia');

  const lblHeadingArabicSize = document.getElementById('lblHeadingArabicSize');
  if (lblHeadingArabicSize) lblHeadingArabicSize.textContent = t('drawerArabicSize');
  const lblHeadingTransSize = document.getElementById('lblHeadingTransSize');
  if (lblHeadingTransSize) lblHeadingTransSize.textContent = t('drawerTransSize');
  const lblHeadingTafsirSize = document.getElementById('lblHeadingTafsirSize');
  if (lblHeadingTafsirSize) lblHeadingTafsirSize.textContent = t('drawerTafsirSize');

  const lblHeadingDisplayOpts = document.getElementById('lblHeadingDisplayOpts');
  if (lblHeadingDisplayOpts) lblHeadingDisplayOpts.textContent = t('drawerDisplayTitle');

  const lblChkTranslit = document.getElementById('lblChkTranslit');
  if (lblChkTranslit) lblChkTranslit.textContent = t('chkTranslitLabel');
  const lblChkBn = document.getElementById('lblChkBn');
  if (lblChkBn) lblChkBn.textContent = t('chkBnLabel');
  const lblChkUr = document.getElementById('lblChkUr');
  if (lblChkUr) lblChkUr.textContent = t('chkUrLabel');
  const lblChkHi = document.getElementById('lblChkHi');
  if (lblChkHi) lblChkHi.textContent = t('chkHiLabel');
  const lblChkEn = document.getElementById('lblChkEn');
  if (lblChkEn) lblChkEn.textContent = t('chkEnLabel');
  const lblChkDrawerTajweed = document.getElementById('lblChkDrawerTajweed');
  if (lblChkDrawerTajweed) lblChkDrawerTajweed.textContent = t('chkDrawerTajweedLabel');

  const drawerFooter = document.getElementById('drawerFooter');
  if (drawerFooter) drawerFooter.innerHTML = t('drawerFooterText');

  // Sync Checkbox states
  const chkBn = document.getElementById('chkBn');
  if (chkBn) chkBn.checked = State.settings.showBn;
  const chkUr = document.getElementById('chkUr');
  if (chkUr) chkUr.checked = State.settings.showUr;
  const chkHi = document.getElementById('chkHi');
  if (chkHi) chkHi.checked = State.settings.showHi;
  const chkEn = document.getElementById('chkEn');
  if (chkEn) chkEn.checked = State.settings.showEn;
  const chkTranslit = document.getElementById('chkTranslit');
  if (chkTranslit) chkTranslit.checked = State.settings.showTranslit !== false;
  const chkDrawerTajweed = document.getElementById('chkDrawerTajweed');
  if (chkDrawerTajweed) chkDrawerTajweed.checked = State.tajweedEnabled;

  // Sync button active highlights in settings
  document.querySelectorAll('.lang-setting-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === State.settings.theme);
  });
}

// Set Application Language (4 Languages: Bengali, Urdu, English, Hindi)
function setAppLanguage(lang) {
  State.activeLang = lang;
  try {
    localStorage.setItem('ki_lang', lang);
  } catch (e) {}

  // Update active button state in header and settings
  document.querySelectorAll('.lang-btn, .lang-setting-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang;
  document.body.classList.remove('lang-bn', 'lang-ur', 'lang-en', 'lang-hi');
  document.body.classList.add(`lang-${lang}`);

  // Set RTL for Urdu, LTR for others
  if (lang === 'ur') {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }

  // Automatically switch primary translation matching selected language
  if (lang === 'bn') {
    State.settings.showBn = true;
    State.settings.showUr = false;
    State.settings.showEn = false;
    State.settings.showHi = false;
  } else if (lang === 'ur') {
    State.settings.showBn = false;
    State.settings.showUr = true;
    State.settings.showEn = false;
    State.settings.showHi = false;
  } else if (lang === 'en') {
    State.settings.showBn = false;
    State.settings.showUr = false;
    State.settings.showEn = true;
    State.settings.showHi = false;
  } else if (lang === 'hi') {
    State.settings.showBn = false;
    State.settings.showUr = false;
    State.settings.showEn = false;
    State.settings.showHi = true;
  }
  try {
    localStorage.setItem('ki_show_bn', State.settings.showBn);
    localStorage.setItem('ki_show_ur', State.settings.showUr);
    localStorage.setItem('ki_show_en', State.settings.showEn);
    localStorage.setItem('ki_show_hi', State.settings.showHi);
  } catch (e) {}

  // Update Settings Drawer Translations & Checkboxes
  updateSettingsDrawerLanguage(lang);

  // Search Modal localization
  const searchModalTitle = document.getElementById('searchModalTitle');
  if (searchModalTitle) searchModalTitle.textContent = t('searchTitle');
  const searchInputModal = document.getElementById('searchInput');
  if (searchInputModal) searchInputModal.placeholder = t('searchModalPlaceholder');
  const btnCloseSearch = document.getElementById('btnCloseSearch');
  if (btnCloseSearch) btnCloseSearch.title = t('closeSearch');
  const btnMobileBack = document.getElementById('btnMobileBack');
  if (btnMobileBack) btnMobileBack.title = t('backTooltip');

  // Tooltips for Header Buttons
  const btnTajweed = document.getElementById('btnTajweed');
  if (btnTajweed) btnTajweed.title = t('tajweed');
  const btnMushaf = document.getElementById('btnMushaf');
  if (btnMushaf) btnMushaf.title = t('mushafMode');
  const btnSettings = document.getElementById('btnSettings');
  if (btnSettings) btnSettings.title = t('settings');
  const btnSearch = document.getElementById('btnSearch');
  if (btnSearch) btnSearch.title = t('searchTitle');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) btnThemeToggle.title = t('themeToggleTooltip');

  // Update Header Title & Subtitle
  if (State.currentSurah && document.body.classList.contains('mobile-reader-active')) {
    const s = State.currentSurah.sura;
    const name = lang === 'ur' ? s.name_ur : (lang === 'hi' ? (s.name_hi || s.name_en) : (lang === 'en' ? s.name_en : s.name_bn));
    document.getElementById('topHeaderTitle').textContent = `${toLocalizedNum(s.sura_index, lang)}. ${name}`;
    document.getElementById('topHeaderSubtitle').textContent = s.name_ar;
  } else {
    document.getElementById('topHeaderTitle').textContent = t('appTitle');
    document.getElementById('topHeaderSubtitle').textContent = t('appSubtitle');
  }

  // Sidebar Tabs
  const tabSurahBtn = document.querySelector('.sidebar-tab[data-target="surah"]');
  if (tabSurahBtn) tabSurahBtn.textContent = t('tabSurah');
  const tabParaBtn = document.querySelector('.sidebar-tab[data-target="para"]');
  if (tabParaBtn) tabParaBtn.textContent = t('tabPara');
  const tabManzilBtn = document.querySelector('.sidebar-tab[data-target="manzil"]');
  if (tabManzilBtn) tabManzilBtn.textContent = t('tabManzil');
  const tabSajdahBtn = document.querySelector('.sidebar-tab[data-target="sajdah"]');
  if (tabSajdahBtn) tabSajdahBtn.textContent = t('tabSajdah');
  const tabRootBtn = document.querySelector('.sidebar-tab[data-target="root"]');
  if (tabRootBtn) tabRootBtn.textContent = t('tabRoot');
  const tabAboutBtn = document.querySelector('.sidebar-tab[data-target="about"]');
  if (tabAboutBtn) tabAboutBtn.textContent = t('tabAbout');

  // Sidebar Search Box Placeholder
  const searchInput = document.getElementById('sidebarSearch');
  if (searchInput) {
    if (State.activeSidebarTab === 'root') searchInput.placeholder = t('searchRootsPlaceholder');
    else searchInput.placeholder = t('searchPlaceholder');
  }

  // Sidebar Promo Card (3 Platforms)
  const sidebarPromoTitle = document.getElementById('sidebarPromoTitle');
  if (sidebarPromoTitle) sidebarPromoTitle.textContent = t('threePlatforms');
  const promoWebTxt = document.getElementById('promoWebTxt');
  if (promoWebTxt) promoWebTxt.textContent = t('drawerWebMain');
  const promoWinTxt = document.getElementById('promoWinTxt');
  if (promoWinTxt) promoWinTxt.textContent = t('drawerWinMain');
  const promoPlayTxt = document.getElementById('promoPlayTxt');
  if (promoPlayTxt) promoPlayTxt.textContent = t('drawerPlayMain');

  // Welcome Screen Box (when no Surah is loaded)
  const welcomeTitle = document.getElementById('welcomeTitle');
  if (welcomeTitle) welcomeTitle.textContent = `${t('appTitle')} ${t('welcomeQuranTafsir')}`;
  const welcomeDesc = document.getElementById('welcomeDesc');
  if (welcomeDesc) welcomeDesc.textContent = t('welcomeDesc');

  const welcomeBtn1 = document.getElementById('welcomeBtn1');
  if (welcomeBtn1) welcomeBtn1.textContent = `${toLocalizedNum(1, lang)}. ${lang === 'ur' ? 'سورۃ الفاتحہ' : (lang === 'hi' ? 'सूरह अल-फ़ातिहा' : (lang === 'en' ? 'Surah Al-Fatihah' : 'সূরা ফাতিহা'))}`;
  const welcomeBtn36 = document.getElementById('welcomeBtn36');
  if (welcomeBtn36) welcomeBtn36.textContent = `${toLocalizedNum(36, lang)}. ${lang === 'ur' ? 'سورۃ یٰس' : (lang === 'hi' ? 'सूरह यासीन' : (lang === 'en' ? 'Surah Yaseen' : 'সূরা ইয়াসীন'))}`;
  const welcomeBtn55 = document.getElementById('welcomeBtn55');
  if (welcomeBtn55) welcomeBtn55.textContent = `${toLocalizedNum(55, lang)}. ${lang === 'ur' ? 'سورۃ الرحمٰن' : (lang === 'hi' ? 'सूरह अर-रहमान' : (lang === 'en' ? 'Surah Ar-Rahman' : 'সূরা আর-রহমান'))}`;
  const welcomeBtn67 = document.getElementById('welcomeBtn67');
  if (welcomeBtn67) welcomeBtn67.textContent = `${toLocalizedNum(67, lang)}. ${lang === 'ur' ? 'سورۃ الملک' : (lang === 'hi' ? 'सूरह अल-मुल्क' : (lang === 'en' ? 'Surah Al-Mulk' : 'সূরা মুলক'))}`;

  // Update Mobile Bottom Nav Labels
  const navSurah = document.getElementById('navLblSurah');
  if (navSurah) navSurah.textContent = lang === 'ur' ? 'سورتیں' : (lang === 'hi' ? 'सूरह' : (lang === 'en' ? 'Surah' : 'সূরা'));
  const navPara = document.getElementById('navLblPara');
  if (navPara) navPara.textContent = lang === 'ur' ? 'پارے' : (lang === 'hi' ? 'पारा' : (lang === 'en' ? 'Para' : 'পারা'));
  const navManzil = document.getElementById('navLblManzil');
  if (navManzil) navManzil.textContent = lang === 'ur' ? 'منزلیں' : (lang === 'hi' ? 'मंज़िल' : (lang === 'en' ? 'Manzil' : 'মঞ্জিল'));
  const navRoot = document.getElementById('navLblRoot');
  if (navRoot) navRoot.textContent = lang === 'ur' ? 'مفردات' : (lang === 'hi' ? 'शब्दमूल' : (lang === 'en' ? 'Roots' : 'শব্দমূল'));
  const navSettings = document.getElementById('navLblSettings');
  if (navSettings) navSettings.textContent = lang === 'ur' ? 'ترتیبات' : (lang === 'hi' ? 'सेटिंग्स' : (lang === 'en' ? 'Settings' : 'সেটিংস'));

  // Re-render lists
  if (State.suras && State.suras.length > 0) renderSidebarSurahs();
  if (State.paras && State.paras.length > 0) renderSidebarParas();
  if (State.manzils && State.manzils.length > 0) renderSidebarManzils();
  if (State.sajdahs && State.sajdahs.length > 0) renderSidebarSajdahs();
  if (State.roots && State.roots.length > 0) renderSidebarRoots();
  if (State.about && State.about.length > 0) renderSidebarAbout();

  // Re-render reader view if Surah loaded
  if (State.currentSurah) {
    if (State.viewMode === 'mushaf') renderMushafView();
    else renderReaderView();
  }
}

// Initialize Application
async function initApp() {
  setupEventListeners();
  setupAudioListeners();

  applyTheme(State.settings.theme);
  applyFontSizes();

  try {
    const [surasRes, parasRes, sajdahsRes, aboutRes, manzilsRes, rootsRes] = await Promise.all([
      fetch('./data/suras.json').then(r => r.json()),
      fetch('./data/paras.json').then(r => r.json()),
      fetch('./data/sajdahs.json').then(r => r.json()),
      fetch('./data/about.json').then(r => r.json()),
      fetch('./data/manzils.json').then(r => r.json()),
      fetch('./data/roots.json').then(r => r.json())
    ]);

    State.suras = surasRes;
    State.paras = parasRes;
    State.sajdahs = sajdahsRes;
    State.about = aboutRes;
    State.manzils = manzilsRes;
    State.roots = rootsRes;

    // Check URL parameters for deep linking, SEO indexing & AI search
    const urlParams = new URLSearchParams(window.location.search);
    const surahParam = parseInt(urlParams.get('surah'));
    const ayaParam = parseInt(urlParams.get('aya'));
    const paraParam = parseInt(urlParams.get('para'));
    const tabParam = urlParams.get('tab');
    const langParam = urlParams.get('lang');

    if (langParam && (langParam === 'bn' || langParam === 'ur' || langParam === 'en' || langParam === 'hi')) {
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
    handleSidebarSearch(e.target.value.trim().toLowerCase());
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

  // Translation & Pronunciation Visibility Toggles
  const chkTranslit = document.getElementById('chkTranslit');
  if (chkTranslit) {
    chkTranslit.addEventListener('change', (e) => {
      State.settings.showTranslit = e.target.checked;
      localStorage.setItem('ki_show_translit', e.target.checked);
      if (State.currentSurah) renderReaderView();
    });
  }

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

  const chkHi = document.getElementById('chkHi');
  if (chkHi) {
    chkHi.addEventListener('change', (e) => {
      State.settings.showHi = e.target.checked;
      localStorage.setItem('ki_show_hi', e.target.checked);
      if (State.currentSurah) renderReaderView();
    });
  }

  document.getElementById('chkEn').addEventListener('change', (e) => {
    State.settings.showEn = e.target.checked;
    localStorage.setItem('ki_show_en', e.target.checked);
    if (State.currentSurah) renderReaderView();
  });

  const chkDrawerTajweed = document.getElementById('chkDrawerTajweed');
  if (chkDrawerTajweed) {
    chkDrawerTajweed.addEventListener('change', (e) => {
      if (State.tajweedEnabled !== e.target.checked) {
        toggleTajweed();
      }
    });
  }

  // Tajweed & Mushaf Toggles
  const btnTajweed = document.getElementById('btnTajweed');
  if (btnTajweed) btnTajweed.addEventListener('click', toggleTajweed);

  const btnMushaf = document.getElementById('btnMushaf');
  if (btnMushaf) btnMushaf.addEventListener('click', toggleMushafMode);

  // Quick Header Theme Toggle
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const themes = ['dark', 'light', 'sepia'];
      const current = State.settings.theme || 'dark';
      const nextIdx = (themes.indexOf(current) + 1) % themes.length;
      applyTheme(themes[nextIdx]);
    });
  }

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
  updateSettingsDrawerLanguage(State.activeLang);
  document.getElementById('settingsDrawer').classList.add('open');
  document.getElementById('drawerBackdrop').classList.add('open');
}

function closeDrawer() {
  document.getElementById('settingsDrawer').classList.remove('open');
  document.getElementById('drawerBackdrop').classList.remove('open');
}

function applyTheme(theme) {
  State.settings.theme = theme;
  try {
    localStorage.setItem('ki_theme', theme);
  } catch (e) {}

  document.documentElement.setAttribute('data-theme', theme);
  document.body.setAttribute('data-theme', theme);
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-sepia');
  document.body.classList.add(`theme-${theme}`);

  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });

  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const svgThemeIcon = document.getElementById('svgThemeIcon');
  if (btnThemeToggle) {
    btnThemeToggle.title = t('themeToggleTooltip');
  }
  if (svgThemeIcon) {
    if (theme === 'light') {
      svgThemeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else if (theme === 'sepia') {
      svgThemeIcon.innerHTML = '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>';
    } else {
      svgThemeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
  }
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
  document.getElementById('listManzils').style.display = tabName === 'manzil' ? 'block' : 'none';
  document.getElementById('listSajdahs').style.display = tabName === 'sajdah' ? 'block' : 'none';
  document.getElementById('listRoots').style.display = tabName === 'root' ? 'block' : 'none';
  document.getElementById('listAbout').style.display = tabName === 'about' ? 'block' : 'none';

  // Toggle search box visibility & placeholder for active tab
  const searchBox = document.getElementById('sidebarSearch');
  if (searchBox) {
    if (tabName === 'root') {
      searchBox.style.display = 'block';
      searchBox.placeholder = t('searchRootsPlaceholder');
    } else if (tabName === 'surah' || tabName === 'para' || tabName === 'manzil') {
      searchBox.style.display = 'block';
      searchBox.placeholder = t('searchPlaceholder');
    } else {
      searchBox.style.display = 'none';
    }
    searchBox.value = '';
  }
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

  const chkDrawer = document.getElementById('chkDrawerTajweed');
  if (chkDrawer) chkDrawer.checked = State.tajweedEnabled;

  const msgActive = State.activeLang === 'ur' ? 'تجوید کلر فعال' : (State.activeLang === 'hi' ? 'तजवीद रंग सक्रिय' : (State.activeLang === 'en' ? 'Tajweed colors enabled' : 'তাজবীদ কালার চালু হয়েছে'));
  const msgInactive = State.activeLang === 'ur' ? 'تجوید کلر بند' : (State.activeLang === 'hi' ? 'तजवीद रंग निष्क्रिय' : (State.activeLang === 'en' ? 'Tajweed colors disabled' : 'তাজবীদ কালার বন্ধ হয়েছে'));
  showToast(State.tajweedEnabled ? msgActive : msgInactive);

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

// Global Sidebar Search Handler
function handleSidebarSearch(query) {
  if (State.activeSidebarTab === 'root') {
    filterSidebarRoots(query);
  } else if (State.activeSidebarTab === 'manzil') {
    filterSidebarManzils(query);
  } else if (State.activeSidebarTab === 'para') {
    filterSidebarParas(query);
  } else {
    filterSidebarSurahs(query);
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
    } else if (lang === 'hi') {
      sName = s.name_hi || s.name_en;
      sType = s.type_hi || s.type_en;
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
    (s.name_hi && s.name_hi.includes(query)) ||
    (s.name_en && s.name_en.toLowerCase().includes(query))
  );
  renderSidebarSurahs(filtered);
}

// Render Sidebar Paras List
function renderSidebarParas() {
  const container = document.getElementById('listParas');
  const lang = State.activeLang;

  container.innerHTML = State.paras.map(p => {
    const pName = lang === 'ur' ? p.name_ur : (lang === 'hi' ? (p.name_en || p.name_bn) : (lang === 'en' ? p.name_en : p.name_bn));
    const paraLabel = lang === 'ur' ? 'پارہ' : (lang === 'hi' ? 'पारा' : (lang === 'en' ? 'Para' : 'পারা'));

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

function filterSidebarParas(query) {
  if (!query) {
    renderSidebarParas();
    return;
  }
  const filtered = State.paras.filter(p =>
    String(p.para_no).includes(query) ||
    (p.name_bn && p.name_bn.toLowerCase().includes(query)) ||
    (p.name_ur && p.name_ur.includes(query)) ||
    (p.name_en && p.name_en.toLowerCase().includes(query)) ||
    (p.name_ar && p.name_ar.includes(query))
  );
  const container = document.getElementById('listParas');
  const lang = State.activeLang;
  container.innerHTML = filtered.map(p => {
    const pName = lang === 'ur' ? p.name_ur : (lang === 'hi' ? (p.name_en || p.name_bn) : (lang === 'en' ? p.name_en : p.name_bn));
    const paraLabel = lang === 'ur' ? 'پارہ' : (lang === 'hi' ? 'पारा' : (lang === 'en' ? 'Para' : 'পারা'));

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

// Render Sidebar Manzils List (7 Manzils)
function renderSidebarManzils(filtered = null) {
  const container = document.getElementById('listManzils');
  if (!container) return;
  const list = filtered || State.manzils;
  const lang = State.activeLang;

  container.innerHTML = list.map(m => {
    let mName = m.name_bn;
    let mDay = m.day_bn;
    let startSuraName = m.start_sura_name_bn;
    let endSuraName = m.end_sura_name_bn;
    let instruction = m.instruction_bn;

    if (lang === 'ur') {
      mName = m.name_ur;
      mDay = m.day_ur;
      startSuraName = m.start_sura_name_ur;
      endSuraName = m.end_sura_name_ur;
      instruction = m.instruction_ur;
    } else if (lang === 'en') {
      mName = m.name_en;
      mDay = m.day_en;
      startSuraName = m.start_sura_name_en;
      endSuraName = m.end_sura_name_en;
      instruction = m.instruction_en;
    } else if (lang === 'hi') {
      mName = m.name_hi || m.name_en;
      mDay = m.day_hi || m.day_en;
      startSuraName = m.start_sura_name_hi || m.start_sura_name_en;
      endSuraName = m.end_sura_name_hi || m.end_sura_name_en;
      instruction = m.instruction_hi || m.instruction_en;
    }

    return `
      <div class="manzil-card" onclick="loadSurah(${m.start_sura})">
        <div class="manzil-header">
          <span class="manzil-badge">${t('tabManzil').replace(/\s*\(.*?\)/, '')} ${toLocalizedNum(m.manzil_no, lang)}</span>
          <span class="manzil-day">${mDay}</span>
        </div>
        <div class="manzil-title">${mName}</div>
        <div class="manzil-range">
          <strong>${startSuraName}</strong> (${toLocalizedNum(m.start_sura, lang)}) – <strong>${endSuraName}</strong> (${toLocalizedNum(m.end_sura, lang)})
          <span style="color:var(--text-muted); font-size:11.5px; margin-left:6px;">• ${toLocalizedNum(m.total_ayas, lang)} ${t('aya')}</span>
        </div>
        <div class="manzil-instruction">${instruction}</div>
      </div>
    `;
  }).join('');
}

function filterSidebarManzils(query) {
  if (!query) {
    renderSidebarManzils();
    return;
  }
  const filtered = State.manzils.filter(m =>
    String(m.manzil_no).includes(query) ||
    (m.name_bn && m.name_bn.toLowerCase().includes(query)) ||
    (m.name_ur && m.name_ur.includes(query)) ||
    (m.name_en && m.name_en.toLowerCase().includes(query)) ||
    (m.name_hi && m.name_hi.includes(query)) ||
    (m.start_sura_name_bn && m.start_sura_name_bn.toLowerCase().includes(query)) ||
    (m.end_sura_name_bn && m.end_sura_name_bn.toLowerCase().includes(query))
  );
  renderSidebarManzils(filtered);
}

// Render Sidebar Sajdahs List
function renderSidebarSajdahs() {
  const container = document.getElementById('listSajdahs');
  const lang = State.activeLang;

  container.innerHTML = State.sajdahs.map(s => {
    const sName = lang === 'ur' ? s.sura_name_ur : (lang === 'hi' ? (s.sura_name_en || s.sura_name_bn) : (lang === 'en' ? s.sura_name_en : s.sura_name_bn));
    const sajdahLabel = lang === 'ur' ? 'سجدہ' : (lang === 'hi' ? 'सजदा' : (lang === 'en' ? 'Sajdah' : 'সিজদাহ্'));
    const trText = lang === 'ur' ? s.tr_ur : (lang === 'hi' ? (s.tr_hi || s.tr_en || s.tr_bn) : (lang === 'en' ? s.tr_en : s.tr_bn));

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
        <div style="font-size:13px; line-height:1.6;">${trText}</div>
      </div>
    `;
  }).join('');
}

// Render Sidebar Quran Roots List (1,662 roots)
function renderSidebarRoots(filtered = null) {
  const container = document.getElementById('listRoots');
  if (!container) return;
  const list = filtered || State.roots;
  const lang = State.activeLang;

  const displayList = list.slice(0, 120);

  let html = displayList.map(r => {
    let rName = r.root_bn;
    let rMeaning = r.meaning_bn;
    if (lang === 'ur') {
      rName = r.root_ur;
      rMeaning = r.meaning_ur;
    } else if (lang === 'en') {
      rName = r.root_en;
      rMeaning = r.meaning_en;
    } else if (lang === 'hi') {
      rName = r.root_hi || r.root_en;
      rMeaning = r.meaning_hi || r.meaning_en;
    }

    return `
      <div class="root-item" onclick="openRootModal(${r.id})">
        <div class="root-left">
          <div class="root-ar">${r.root_ar}</div>
          <div class="root-info">
            <div class="root-name">${rName}</div>
            <div class="root-meaning">${rMeaning || ''}</div>
          </div>
        </div>
        <div class="root-badge">${toLocalizedNum(r.occurrences, lang)} ${t('occurrences')}</div>
      </div>
    `;
  }).join('');

  if (list.length > 120) {
    const totalMsg = lang === 'ur' 
      ? `کل ${toLocalizedNum(list.length, lang)} مفردات میں سے ۱۲۰ دکھائے جا رہے ہیں۔ تلاش کر کے مزید تلاش فرمائیں۔`
      : (lang === 'hi'
        ? `कुल ${toLocalizedNum(list.length, lang)} शब्दमूलों में से पहले 120 प्रदर्शित हैं। अधिक सटीक परिणाम हेतु खोजें।`
        : (lang === 'en'
          ? `Showing first 120 of ${toLocalizedNum(list.length, lang)} roots. Use search above to narrow down.`
          : `${toLocalizedNum(list.length, lang)} টি শব্দমূলের মধ্যে প্রথম ১২০টি দেখানো হচ্ছে। আরো নির্দিষ্ট করতে অনুসন্ধান করুন।`));
    html += `
      <div style="text-align:center; padding:12px; color:var(--text-muted); font-size:12px;">
        ${totalMsg}
      </div>
    `;
  }

  container.innerHTML = html;
}

function filterSidebarRoots(query) {
  if (!query) {
    renderSidebarRoots();
    return;
  }
  const filtered = State.roots.filter(r =>
    (r.root_ar && r.root_ar.includes(query)) ||
    (r.root_bn && r.root_bn.toLowerCase().includes(query)) ||
    (r.root_ur && r.root_ur.includes(query)) ||
    (r.root_en && r.root_en.toLowerCase().includes(query)) ||
    (r.root_hi && r.root_hi.includes(query)) ||
    (r.meaning_bn && r.meaning_bn.toLowerCase().includes(query)) ||
    (r.meaning_en && r.meaning_en.toLowerCase().includes(query)) ||
    (r.meaning_hi && r.meaning_hi.includes(query)) ||
    (r.meaning_ur && r.meaning_ur.includes(query))
  );
  renderSidebarRoots(filtered);
}

// Open Root Detail Modal
function openRootModal(rootId) {
  const root = State.roots.find(r => r.id === rootId);
  if (!root) return;
  const lang = State.activeLang;

  let rName = root.root_bn;
  let rMeaning = root.meaning_bn;
  let rDetails = root.details_en;
  if (lang === 'ur') {
    rName = root.root_ur;
    rMeaning = root.meaning_ur;
    rDetails = root.details_en;
  } else if (lang === 'en') {
    rName = root.root_en;
    rMeaning = root.meaning_en;
    rDetails = root.details_en;
  } else if (lang === 'hi') {
    rName = root.root_hi || root.root_en;
    rMeaning = root.meaning_hi || root.meaning_en;
    rDetails = root.details_hi || root.details_en;
  }

  let derivatives = [];
  try {
    derivatives = JSON.parse(root.derivatives_ar || '[]');
  } catch (e) {
    derivatives = [];
  }

  const modalTitle = document.getElementById('rootModalTitle');
  if (modalTitle) modalTitle.textContent = t('rootDetails');

  const modalBody = document.getElementById('rootModalBody');
  if (modalBody) {
    const lexHeading = lang === 'ur' ? 'تفصیل و لغت:' : (lang === 'hi' ? 'कोश व विवरण:' : (lang === 'en' ? 'Lexicon & Details:' : 'অভিধান ও শাব্দিক বিশদ:'));
    modalBody.innerHTML = `
      <div class="root-modal-box">
        <div class="root-modal-ar">${root.root_ar}</div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:16px; color:var(--text-main);">${rName}</strong>
          <span class="root-badge" style="font-size:12px; padding:4px 10px;">${toLocalizedNum(root.occurrences, lang)} ${t('occurrences')}</span>
        </div>
        <div style="background:var(--translit-bg); padding:10px 12px; border-radius:8px; border-left:3px solid var(--primary-gold);">
          <div style="font-weight:700; font-size:12px; color:var(--primary-gold); margin-bottom:4px;">${t('meaning')}:</div>
          <div style="font-size:13.5px; line-height:1.6;">${rMeaning || ''}</div>
        </div>
        ${derivatives.length > 0 ? `
          <div>
            <div style="font-weight:700; font-size:12px; color:var(--primary-gold); margin-bottom:6px;">${t('derivatives')}:</div>
            <div>${derivatives.map(d => `<span class="root-derivative-tag">${d}</span>`).join(' ')}</div>
          </div>
        ` : ''}
        ${rDetails ? `
          <div style="background:var(--card-bg); border:1px solid var(--card-border); padding:10px 12px; border-radius:8px;">
            <div style="font-weight:700; font-size:11.5px; color:var(--text-muted); margin-bottom:4px;">${lexHeading}</div>
            <div style="font-size:12.5px; line-height:1.65; white-space:pre-line;">${rDetails}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  const modal = document.getElementById('modalRoot');
  if (modal) modal.classList.add('open');
}

function closeRootModal() {
  const modal = document.getElementById('modalRoot');
  if (modal) modal.classList.remove('open');
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
        ${lang === 'ur' ? 'مستند مآخذ و اعترافِ خدمات:' : (lang === 'hi' ? 'प्रामाणिक स्रोत व आभार:' : (lang === 'en' ? 'Scholarly Sources & Credits:' : 'প্রামাণ্য তথ্যসূত্র ও কৃতজ্ঞতা স্বীকার:'))}
      </div>
      <div style="font-size:12px; line-height:1.75; color:var(--text-main); background:var(--card-bg); padding:10px 12px; border-radius:8px; border:1px solid var(--card-border);">
        ${lang === 'ur' ? `
          • <strong>اصل اردو کنز الایمان:</strong> اعلیٰ حضرت امام احمد رضا خان فاضلِ بریلوی قدس سرہٗ العزیز<br>
          • <strong>تفسیر خزائن العرفان:</strong> صدر الافاضل علامہ سید محمد نعیم الدین مراد آبادی علیہ الرحمہ<br>
          • <strong>بنگلہ کنز الایمان ڈیجیٹلائزیشن:</strong> مستند نسخے سے گوگل ویژن اے آئی ٹیکنالوجی کی مدد سے مکمل پروف ریڈنگ و ڈیجیٹلائزیشن بذریعہ <strong>محمد نور الابصار</strong> (Mohammad Norul Abswer)۔<br>
          • <strong>ہندی کنز الایمان:</strong> مستند نسخہ بنام कन्ज़ुल ईमान شریف مترجمہ مولانا مفتی محمد خان قادری۔<br>
          • <strong>انگریزی ترجمہ:</strong> ڈیجیٹل کمپائلیشن، اسٹرکچرنگ و ایڈجسٹمنٹ بذریعہ <strong>محمد نور الابصار</strong> (Mohammad Norul Abswer)۔<br>
          • <strong>سافٹ ویئر ڈیولپمنٹ و پبلشنگ:</strong> Apps Abswer (محمد نور الابصار)۔
        ` : (lang === 'hi' ? `
          • <strong>मूल उर्दू कन्ज़ुल ईमान:</strong> आला हज़रत इमाम अहमद रज़ा ख़ान फ़ाज़िले बरेलवी (रहमतुल्लाह अलैह)<br>
          • <strong>तफ़्सीर ख़ज़ाइनुल इरफ़ान:</strong> सदरुल अफ़ाज़िल अल्लामा सैयद मुहम्मद नईमुद्दीन मुरादाबादी (रहमतुल्लाह अलैह)<br>
          • <strong>हिन्दी कन्ज़ुल ईमान:</strong> मौलाना मुफ़्ती मोहम्मद ख़ान क़ादरी<br>
          • <strong>बंगाली अनुवाद डिजिटलाइज़ेशन:</strong> Google Vision AI तकनीक की सहायता से प्रामाणिक नुस्ख़े से डिजिटल संकलन व प्रूफरीडिंग: <strong>मोहम्मद नुरुल अब्सार</strong> (Mohammad Norul Abswer)<br>
          • <strong>अंग्रेज़ी अनुवाद:</strong> डिजिटल संकलन व संरचना: <strong>मोहम्मद नुरुल अब्सार</strong> (Mohammad Norul Abswer)<br>
          • <strong>सॉफ़्टवेयर विकास व प्रकाशन:</strong> Apps Abswer (मोहम्मद नुरुल अब्सार)
        ` : (lang === 'en' ? `
          • <strong>Original Urdu Kanz al-Iman:</strong> Ala Hazrat Imam Ahmad Raza Khan Barelvi (Rahimahullah)<br>
          • <strong>Khaza'in al-'Irfan Tafsir:</strong> Sadr al-Afadil Allama Syed Muhammad Naeem-ud-Deen Muradabadi (Rahimahullah)<br>
          • <strong>Hindi Kanzul Iman:</strong> Maulana Mufti Muhammad Khan Qadri<br>
          • <strong>Bengali Kanzul Iman Translation:</strong> Precision transcription, proofreading, and digitization directly compiled from authoritative editions using Google Vision AI by <strong>Mohammad Norul Abswer</strong>.<br>
          • <strong>English Translation:</strong> Digitally structured, verified, and integrated by <strong>Mohammad Norul Abswer</strong>.<br>
          • <strong>Software Architecture & Publishing:</strong> Apps Abswer (Mohammad Norul Abswer).
        ` : `
          • <strong>মূল উর্দু কানযুল ঈমান:</strong> আ'লা হযরত ইমাম আহমদ রেজা খান ফাযেলে বেরলভী (রহ.)<br>
          • <strong>তাফসীরে খাযাইনুল ইরফান:</strong> সদরুল আফাযিল আল্লামা সৈয়দ মুহাম্মদ নাঈম উদ্দীন মুরাদাবাদী (রহ.)<br>
          • <strong>হিন্দি কানযুল ঈমান:</strong> মাওলানা মুফতী মুহাম্মদ খান ক্বাদেরী<br>
          • <strong>বাংলা কানযুল ঈমান ডিজিটালাইজেশন:</strong> Google Vision AI প্রযুক্তির সহায়তায় প্রামাণ্য নুসখা থেকে ডিজিটাইজড, প্রুফরিডিং ও সংকলন: <strong>মুহাম্মদ নুরুল আবছার</strong> (Mohammad Norul Abswer)।<br>
          • <strong>ইংরেজি অনুবাদ:</strong> ডিজিটাল সংকলন ও বিন্যাস: <strong>মুহাম্মদ নুরুল আবছার</strong> (Mohammad Norul Abswer)।<br>
          • <strong>সফটওয়্যার উন্নয়ন ও প্রকাশনা:</strong> Apps Abswer (মুহাম্মদ নুরুল আবছার)।
        `))}
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
    } else if (lang === 'hi') {
      aTitle = a.title_hi || a.title_bn;
      aAuthor = a.author_hi || a.author_bn;
      aContent = a.content_hi || a.content_bn;
    }

    const authorLabel = lang === 'ur' ? 'مصنف / محقق' : (lang === 'hi' ? 'लेखक / शोधकर्ता' : (lang === 'en' ? 'Author / Scholar' : 'লেখক / সংকলক'));

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
        (State.activeLang === 'hi' ? (State.currentSurah.sura.name_hi || State.currentSurah.sura.name_en) :
        (State.activeLang === 'en' ? State.currentSurah.sura.name_en : State.currentSurah.sura.name_bn));
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
  } else if (lang === 'hi') {
    suraName = sura.name_hi;
    suraMeaning = sura.meaning_hi;
    intro = sura.intro_hi || '';
  }

  const ayaStr = targetAya ? ` (${lang === 'ur' ? 'آیت' : (lang === 'en' ? 'Ayah' : (lang === 'hi' ? 'आयत' : 'আয়াত'))} ${toLocalizedNum(targetAya, lang)})` : '';
  const pageTitle = `${suraName}${ayaStr} - ${sura.name_ar} | ${t('appTitle')}`;
  document.title = pageTitle;

  let desc = '';
  if (lang === 'hi') {
    const firstFewSentences = (intro.split('\n')[0] || `पवित्र क़ुरआन की सूरह ${sura.name_hi} (${sura.name_ar})।`).trim();
    desc = `${firstFewSentences} कन्ज़ुल ईमान हिन्दी, उर्दू व बांग्ला अनुवाद तथा ख़ज़ाइनुल इरफ़ान तफ़्सीर।`;
  } else if (lang === 'ur') {
    const firstFewSentences = (intro.split('\n')[0] || `قرآن پاک کی سورت ${sura.name_ur} (${sura.name_ar})۔`).trim();
    desc = `${firstFewSentences} کنز الایمان اردو ترجمہ اور خزائن العرفان تفسیر۔`;
  } else if (lang === 'en') {
    const firstFewSentences = (intro.split('\n')[0] || `Surah ${sura.name_en} (${sura.name_ar}) of the Holy Quran.`).trim();
    desc = `${firstFewSentences} Kanzul Iman translation & Khazainul Irfan commentary.`;
  } else {
    const firstFewSentences = (intro.split('\n')[0] || `পবিত্র কুরআনুল কারীমের সূরা ${sura.name_bn} (${sura.name_ar})।`).trim();
    desc = `${firstFewSentences} কানযুল ঈমান বাংলা ও উর্দু অনুবাদ এবং খাযাইনুল ইরফান তাফসীর।`;
  }

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
  } else if (lang === 'hi') {
    surahTitle = sura.name_hi;
    surahMeaning = sura.meaning_hi;
    typeName = sura.type_hi;
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
            ${ICONS.speaker} <span>${lang === 'ur' ? 'مکمل تلاوت' : (lang === 'en' ? 'Full Recitation' : (lang === 'hi' ? 'पूर्ण तिलावत' : 'পূর্ণ তিলাওয়াত'))}</span>
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

    // Pronunciation / Transliteration
    let translitHtml = '';
    if (State.settings.showTranslit !== false) {
      let translitText = '';
      const translitBadge = t('pronunciation');
      if (lang === 'bn') {
        translitText = v.trnl_bn || '';
      } else if (lang === 'en') {
        translitText = v.trnl_en || v.trnl_bn || '';
      } else if (lang === 'ur') {
        translitText = v.trnl_en || v.trnl_bn || '';
      } else if (lang === 'hi') {
        translitText = v.trnl_bn || v.trnl_en || '';
      }
      if (translitText) {
        translitHtml = `
          <div class="ayat-translit">
            <span class="translit-badge">${translitBadge}:</span>
            <span class="translit-text ${lang === 'en' ? 'translit-en' : ''}">${translitText}</span>
          </div>
        `;
      }
    }

    // Dynamic Translations (Primary selected language first, then other user-selected languages)
    let transHtml = '';
    if (lang === 'bn' && State.settings.showBn && v.tr_bn) {
      transHtml += `<div class="ayat-trans-bn active-lang-trans"><strong class="trans-label">অনুবাদ (কানযুল ঈমান):</strong> ${v.tr_bn}</div>`;
    } else if (lang === 'ur' && State.settings.showUr && v.tr_ur) {
      transHtml += `<div class="ayat-trans-ur active-lang-trans dir-rtl"><strong class="trans-label">ترجمہ کنز الایمان:</strong> ${v.tr_ur}</div>`;
    } else if (lang === 'en' && State.settings.showEn && v.tr_en) {
      transHtml += `<div class="ayat-trans-en active-lang-trans"><strong class="trans-label">Translation (Mohammad Norul Abswer):</strong> ${v.tr_en}</div>`;
    } else if (lang === 'hi' && State.settings.showHi && v.tr_hi) {
      transHtml += `<div class="ayat-trans-hi active-lang-trans"><strong class="trans-label">अनुवाद (कन्ज़ुल ईमान):</strong> ${v.tr_hi}</div>`;
    }

    // Additional secondary translations if enabled by user in settings
    if (lang !== 'bn' && State.settings.showBn && v.tr_bn) {
      const bnLabel = lang === 'ur' ? 'بنگالی کنز الایمان (محمد نور الابصار):' : (lang === 'hi' ? 'बांग्ला कन्ज़ुल ईमान (मोहम्मद नूरुल अब्सार):' : 'Bengali Kanzul Iman (Mohammad Norul Abswer):');
      transHtml += `<div class="ayat-trans-bn sub-trans"><strong class="trans-sub-label">${bnLabel}</strong> ${v.tr_bn}</div>`;
    }
    if (lang !== 'ur' && State.settings.showUr && v.tr_ur) {
      const urLabel = lang === 'en' ? 'Urdu Kanzul Iman (Ala Hazrat):' : (lang === 'hi' ? 'उर्दू कन्ज़ुल ईमान (आला हज़रत):' : 'উর্দু কানযুল ঈমান (আলা হযরত):');
      transHtml += `<div class="ayat-trans-ur sub-trans dir-rtl"><strong class="trans-sub-label">${urLabel}</strong> ${v.tr_ur}</div>`;
    }
    if (lang !== 'en' && State.settings.showEn && v.tr_en) {
      const enLabel = lang === 'ur' ? 'انگریزی ترجمہ (محمد نور الابصار):' : (lang === 'hi' ? 'अंग्रेज़ी अनुवाद (मोहम्मद नूरुल अब्सार):' : 'ইংরেজি অনুবাদ (মুহাম্মদ নুরুল আবছার):');
      transHtml += `<div class="ayat-trans-en sub-trans"><strong class="trans-sub-label">${enLabel}</strong> ${v.tr_en}</div>`;
    }
    if (lang !== 'hi' && State.settings.showHi && v.tr_hi) {
      const hiLabel = lang === 'ur' ? 'ہندی کنز الایمان:' : (lang === 'en' ? 'Hindi Kanzul Iman:' : (lang === 'bn' ? 'হিন্দি কানযুল ঈমান:' : 'हिन्दी कन्ज़ुल ईमान:'));
      transHtml += `<div class="ayat-trans-hi sub-trans"><strong class="trans-sub-label">${hiLabel}</strong> ${v.tr_hi}</div>`;
    }

    const tafsirContent = (lang === 'ur' && v.tf_ur) ? v.tf_ur : ((lang === 'en' && v.tf_en) ? v.tf_en : ((lang === 'hi' && v.tf_hi) ? v.tf_hi : v.tf_bn));
    const formattedTafsir = formatTafsirText(tafsirContent, lang);
    const shaanContent = lang === 'ur' ? (v.asb_ur || v.asb_bn) : (lang === 'en' ? (v.asb_en || v.asb_bn) : (lang === 'hi' ? (v.asb_hi || v.asb_bn) : v.asb_bn));

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

        ${translitHtml}

        ${transHtml}

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

  const surahName = lang === 'ur' ? sura.name_ur : (lang === 'en' ? sura.name_en : (lang === 'hi' ? sura.name_hi : sura.name_bn));
  const isMakki = (sura.type_en || '').toLowerCase().includes('mecc') || (sura.type_bn || '').includes('মাক্কী');
  const emblemImg = isMakki ? 'icons/ic_mecca.webp' : 'icons/ic_medina.webp';
  const typeName = lang === 'ur' ? sura.type_ur : (lang === 'en' ? sura.type_en : (lang === 'hi' ? sura.type_hi : sura.type_bn));

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
            ${ICONS.speaker} <span>${lang === 'ur' ? 'مکمل تلاوت' : (lang === 'en' ? 'Full Recitation' : (lang === 'hi' ? 'पूर्ण तिलावत' : 'পূর্ণ তিলাওয়াত'))}</span>
          </button>
          <button class="surah-action-pill active" onclick="toggleMushafMode()">
            <svg class="ui-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 1 3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span>${lang === 'ur' ? 'آیت بہ آیت ترجمہ' : (lang === 'en' ? 'Verse-by-Verse' : (lang === 'hi' ? 'आयत-दर-आयत अनुवाद' : 'আয়াতভিত্তিক অনুবাদ'))}</span>
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
  const sName = lang === 'ur' ? sura.name_ur : (lang === 'en' ? sura.name_en : (lang === 'hi' ? sura.name_hi : sura.name_bn));

  let parts = [];
  parts.push(`${sName} [${toLocalizedNum(suraIndex, lang)}:${toLocalizedNum(aya, lang)}]`);
  parts.push(v.ar);

  // Pronunciation
  if (State.settings.showTranslit !== false) {
    if (lang === 'bn' && v.trnl_bn) parts.push(`উচ্চারণ: ${v.trnl_bn}`);
    else if (lang === 'en' && (v.trnl_en || v.trnl_bn)) parts.push(`Pronunciation: ${v.trnl_en || v.trnl_bn}`);
    else if (lang === 'ur' && (v.trnl_en || v.trnl_bn)) parts.push(`تلفظ: ${v.trnl_en || v.trnl_bn}`);
    else if (lang === 'hi' && (v.trnl_bn || v.trnl_en)) parts.push(`उच्चारण: ${v.trnl_bn || v.trnl_en}`);
  }

  // Active translation
  if (lang === 'bn') {
    if (v.tr_bn) parts.push(`বাংলা অনুবাদ: ${v.tr_bn}`);
    if (State.settings.showUr && v.tr_ur) parts.push(`اردو کنز الایمان:\n${v.tr_ur}`);
    if (State.settings.showEn && v.tr_en) parts.push(`English: ${v.tr_en}`);
    if (State.settings.showHi && v.tr_hi) parts.push(`हिन्दी: ${v.tr_hi}`);
  } else if (lang === 'ur') {
    if (v.tr_ur) parts.push(`ترجمہ کنز الایمان:\n${v.tr_ur}`);
    if (State.settings.showBn && v.tr_bn) parts.push(`বাংলা অনুবাদ: ${v.tr_bn}`);
    if (State.settings.showEn && v.tr_en) parts.push(`English: ${v.tr_en}`);
    if (State.settings.showHi && v.tr_hi) parts.push(`हिन्दी: ${v.tr_hi}`);
  } else if (lang === 'en') {
    if (v.tr_en) parts.push(`Translation: ${v.tr_en}`);
    if (State.settings.showBn && v.tr_bn) parts.push(`Bengali: ${v.tr_bn}`);
    if (State.settings.showUr && v.tr_ur) parts.push(`Urdu Kanzul Iman:\n${v.tr_ur}`);
    if (State.settings.showHi && v.tr_hi) parts.push(`Hindi: ${v.tr_hi}`);
  } else if (lang === 'hi') {
    if (v.tr_hi) parts.push(`हिन्दी अनुवाद: ${v.tr_hi}`);
    if (State.settings.showUr && v.tr_ur) parts.push(`اردو کنز الایمان:\n${v.tr_ur}`);
    if (State.settings.showBn && v.tr_bn) parts.push(`বাংলা অনুবাদ: ${v.tr_bn}`);
    if (State.settings.showEn && v.tr_en) parts.push(`English: ${v.tr_en}`);
  }

  const text = parts.join('\n\n');
  navigator.clipboard.writeText(text).then(() => showToast(t('toastCopied')));
}

// Copy Full Ayat + Tafsir
function copyFullTafsir(suraIndex, aya) {
  const v = State.currentSurah.verses.find(item => item.aya === aya);
  if (!v) return;

  const lang = State.activeLang;
  const sura = State.currentSurah.sura;
  const sName = lang === 'ur' ? sura.name_ur : (lang === 'en' ? sura.name_en : (lang === 'hi' ? sura.name_hi : sura.name_bn));

  const tafsirRaw = (lang === 'ur' && v.tf_ur) ? v.tf_ur : ((lang === 'en' && v.tf_en) ? v.tf_en : ((lang === 'hi' && v.tf_hi) ? v.tf_hi : v.tf_bn));
  let cleanTafsir = (tafsirRaw || '')
    .replace(/(?:«|<<)(.*?)(?:»|>>)/g, '«$1»')
    .replace(/\*\*/g, '')
    .trim();

  const shaanRaw = lang === 'ur' ? (v.asb_ur || v.asb_bn) : (lang === 'en' ? (v.asb_en || v.asb_bn) : (lang === 'hi' ? (v.asb_hi || v.asb_bn) : v.asb_bn));

  let parts = [];
  parts.push(`${sName} [${toLocalizedNum(suraIndex, lang)}:${toLocalizedNum(aya, lang)}]`);
  parts.push(v.ar);

  // Pronunciation
  if (State.settings.showTranslit !== false) {
    if (lang === 'bn' && v.trnl_bn) parts.push(`উচ্চারণ: ${v.trnl_bn}`);
    else if (lang === 'en' && (v.trnl_en || v.trnl_bn)) parts.push(`Pronunciation: ${v.trnl_en || v.trnl_bn}`);
    else if (lang === 'ur' && (v.trnl_en || v.trnl_bn)) parts.push(`تلفظ: ${v.trnl_en || v.trnl_bn}`);
    else if (lang === 'hi' && (v.trnl_bn || v.trnl_en)) parts.push(`उच्चारण: ${v.trnl_bn || v.trnl_en}`);
  }

  // Active translation
  if (lang === 'bn' && v.tr_bn) parts.push(`বাংলা অনুবাদ: ${v.tr_bn}`);
  else if (lang === 'ur' && v.tr_ur) parts.push(`ترجمہ کنز الایمان:\n${v.tr_ur}`);
  else if (lang === 'en' && v.tr_en) parts.push(`Translation: ${v.tr_en}`);
  else if (lang === 'hi' && v.tr_hi) parts.push(`हिन्दी अनुवाद: ${v.tr_hi}`);

  // Tafsir Heading & Shaan
  const tafsirHeading = t('tafsirTitle');
  let tafsirSec = `${tafsirHeading}:\n`;
  if (shaanRaw) tafsirSec += `${t('shaanNuzul')}: ${shaanRaw}\n\n`;
  tafsirSec += cleanTafsir;
  parts.push(tafsirSec);

  const text = parts.join('\n\n');
  navigator.clipboard.writeText(text).then(() => showToast(t('toastTafsirCopied')));
}

// Audio Engine (Alafasy 128kbps)
function setupAudioListeners() {
  State.audio.addEventListener('ended', () => {
    if (State.playingAya < State.currentSurah.verses.length) {
      playSingleAya(State.playingSura, State.playingAya + 1);
    } else {
      stopAudio();
      showToast(State.activeLang === 'ur' ? 'سورت کی تلاوت مکمل ہو گئی' : (State.activeLang === 'hi' ? 'सूरह तिलावत पूरी हो गई' : (State.activeLang === 'en' ? 'Surah recitation finished' : 'সূরা তিলাওয়াত সম্পন্ন হয়েছে')));
    }
  });

  State.audio.addEventListener('error', () => {
    showToast(State.activeLang === 'ur' ? 'آڈیو لوڈ کرنے میں خرابی' : (State.activeLang === 'hi' ? 'ऑडियो लोड करने में त्रुटि' : (State.activeLang === 'en' ? 'Error loading audio' : 'অডিও লোড করতে সমস্যা হয়েছে')));
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
  const suraName = sura ? (State.activeLang === 'ur' ? sura.name_ur : (State.activeLang === 'en' ? sura.name_en : (State.activeLang === 'hi' ? sura.name_hi : sura.name_bn))) : '';

  const reciterName = State.activeLang === 'ur' ? 'قاری مشاری راشد' : (State.activeLang === 'hi' ? 'क़ारी मिशारी राशिद' : (State.activeLang === 'en' ? 'Qari Mishary Rashid' : 'কারী মিশারি রাশিদ'));
  document.getElementById('audioTitle').textContent = suraName;
  document.getElementById('audioMeta').textContent = `${t('aya')}: ${toLocalizedNum(State.playingAya, State.activeLang)} (${reciterName})`;

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
    (s.name_hi && s.name_hi.toLowerCase().includes(q)) ||
    (s.name_ar && s.name_ar.includes(q))
  );

  resultsContainer.innerHTML = matches.map(s => {
    const sName = State.activeLang === 'ur' ? s.name_ur : (State.activeLang === 'en' ? s.name_en : (State.activeLang === 'hi' ? s.name_hi : s.name_bn));
    const sType = State.activeLang === 'ur' ? s.type_ur : (State.activeLang === 'en' ? s.type_en : (State.activeLang === 'hi' ? s.type_hi : s.type_bn));

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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
