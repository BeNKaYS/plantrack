/**
 * Plantrack — js/data.js
 * Modüller, Sınıflar, Dersler, Konular ve Sistem Sabitleri
 */

const MODULLER = [
  { id: 'ara-sinif', ad: 'Ara Sınıflar', kisaltma: 'ARA', siniflar: ['5', '6', '7'] },
  { id: 'lgs',       ad: 'LGS Hazırlık', kisaltma: 'LGS', siniflar: ['8'] },
  { id: 'yks',       ad: 'TYT-AYT',      kisaltma: 'YKS', siniflar: ['9', '10', '11', '12', 'mezun'] }
];

const SINIFLAR = [
  { deger: '5',     label: '5. Sınıf',  modulId: 'ara-sinif' },
  { deger: '6',     label: '6. Sınıf',  modulId: 'ara-sinif' },
  { deger: '7',     label: '7. Sınıf',  modulId: 'ara-sinif' },
  { deger: '8',     label: '8. Sınıf',  modulId: 'lgs' },
  { deger: '9',     label: '9. Sınıf',  modulId: 'yks' },
  { deger: '10',    label: '10. Sınıf', modulId: 'yks' },
  { deger: '11',    label: '11. Sınıf', modulId: 'yks' },
  { deger: '12',    label: '12. Sınıf', modulId: 'yks' },
  { deger: 'mezun', label: 'Mezun',     modulId: 'yks' }
];

const KONU_DURUMLARI = {
  islenmedi:    { label: 'İşlenmedi',    ikon: 'circle',         renk: 'slate'   },
  calisiliyor:  { label: 'Çalışılıyor',  ikon: 'clock',          renk: 'amber'   },
  tamam:        { label: 'Tamam',        ikon: 'check-circle-2', renk: 'emerald' },
  tekrar_lazim: { label: 'Tekrar Lazım', ikon: 'alert-circle',   renk: 'rose'    }
};

const GOREV_DURUMLARI = {
  bekliyor:     { label: 'Bekliyor',     renk: 'slate'   },
  devam_ediyor: { label: 'Devam Ediyor', renk: 'blue'    },
  tamamlandi:   { label: 'Tamamlandı',   renk: 'emerald' },
  gecikti:      { label: 'Gecikti',      renk: 'rose'    }
};

const EXCEL_OGRENCI_SABLONU = {
  sutunlar: [
    { key: 'ad',          label: 'Ad',               zorunlu: true,  aciklama: 'Öğrencinin adı' },
    { key: 'soyad',       label: 'Soyad',             zorunlu: true,  aciklama: 'Öğrencinin soyadı' },
    { key: 'sinif',       label: 'Sınıf',             zorunlu: true,  aciklama: '5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / Mezun' },
    { key: 'okul',        label: 'Okul',              zorunlu: false, aciklama: 'Öğrencinin okulu' },
    { key: 'ogrenciTel',  label: 'Öğrenci Telefon',   zorunlu: false, aciklama: 'WhatsApp numarası' },
    { key: 'veliAd',      label: 'Veli Adı',          zorunlu: false, aciklama: 'Velinin adı soyadı' },
    { key: 'veliTel',     label: 'Veli Telefon',      zorunlu: false, aciklama: 'WhatsApp numarası' },
    { key: 'hedef',       label: 'Hedef',             zorunlu: false, aciklama: 'Örn: Fen Lisesi, Boğaziçi Tıp' }
  ],
  ornekSatir: {
    ad: 'Ad', soyad: 'Soyad', sinif: '8', okul: 'Örnek Ortaokul',
    ogrenciTel: '05XX XXX XX XX', veliAd: 'Veli Adı Soyadı',
    veliTel: '05XX XXX XX XX', hedef: 'Hedef okul veya bölüm'
  }
};

// ─────────────────────────────────────────────────────────────
// DERSLER
// ─────────────────────────────────────────────────────────────
const DERSLER = [
  // ── ARA SINIFLAR (5. Sınıf) ──
  { id: 'ara-5-turkce',  modulId: 'ara-sinif', sinif: '5', ad: 'Türkçe',          kisaltma: 'TR5',  renk: 'rose',    ikon: 'book',           haftalikSaat: 6, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-mat',     modulId: 'ara-sinif', sinif: '5', ad: 'Matematik',       kisaltma: 'MAT5', renk: 'blue',    ikon: 'calculator',     haftalikSaat: 5, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-fen',     modulId: 'ara-sinif', sinif: '5', ad: 'Fen Bilimleri',   kisaltma: 'FEN5', renk: 'emerald', ikon: 'flask-conical',  haftalikSaat: 4, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-sos',     modulId: 'ara-sinif', sinif: '5', ad: 'Sosyal Bilgiler', kisaltma: 'SOS5', renk: 'amber',   ikon: 'compass',        haftalikSaat: 3, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-ing',     modulId: 'ara-sinif', sinif: '5', ad: 'İngilizce',       kisaltma: 'ING5', renk: 'purple',  ikon: 'languages',      haftalikSaat: 3, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-din',     modulId: 'ara-sinif', sinif: '5', ad: 'Din Kültürü',     kisaltma: 'DIN5', renk: 'teal',    ikon: 'heart-handshake',haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-gorsel',  modulId: 'ara-sinif', sinif: '5', ad: 'Görsel Sanatlar', kisaltma: 'GSA5', renk: 'orange',  ikon: 'palette',        haftalikSaat: 1, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-muzik',   modulId: 'ara-sinif', sinif: '5', ad: 'Müzik',           kisaltma: 'MUZ5', renk: 'cyan',    ikon: 'music',          haftalikSaat: 1, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-beden',   modulId: 'ara-sinif', sinif: '5', ad: 'Beden Eğitimi',   kisaltma: 'BED5', renk: 'indigo',  ikon: 'activity',       haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-5-bit',     modulId: 'ara-sinif', sinif: '5', ad: 'Bilişim Tek.',    kisaltma: 'BIT5', renk: 'slate',   ikon: 'laptop',         haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },

  // ── ARA SINIFLAR (6. Sınıf) ──
  { id: 'ara-6-turkce',  modulId: 'ara-sinif', sinif: '6', ad: 'Türkçe',          kisaltma: 'TR6',  renk: 'rose',    ikon: 'book',           haftalikSaat: 6, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-mat',     modulId: 'ara-sinif', sinif: '6', ad: 'Matematik',       kisaltma: 'MAT6', renk: 'blue',    ikon: 'calculator',     haftalikSaat: 5, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-fen',     modulId: 'ara-sinif', sinif: '6', ad: 'Fen Bilimleri',   kisaltma: 'FEN6', renk: 'emerald', ikon: 'flask-conical',  haftalikSaat: 4, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-sos',     modulId: 'ara-sinif', sinif: '6', ad: 'Sosyal Bilgiler', kisaltma: 'SOS6', renk: 'amber',   ikon: 'compass',        haftalikSaat: 3, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-ing',     modulId: 'ara-sinif', sinif: '6', ad: 'İngilizce',       kisaltma: 'ING6', renk: 'purple',  ikon: 'languages',      haftalikSaat: 3, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-din',     modulId: 'ara-sinif', sinif: '6', ad: 'Din Kültürü',     kisaltma: 'DIN6', renk: 'teal',    ikon: 'heart-handshake',haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-gorsel',  modulId: 'ara-sinif', sinif: '6', ad: 'Görsel Sanatlar', kisaltma: 'GSA6', renk: 'orange',  ikon: 'palette',        haftalikSaat: 1, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-muzik',   modulId: 'ara-sinif', sinif: '6', ad: 'Müzik',           kisaltma: 'MUZ6', renk: 'cyan',    ikon: 'music',          haftalikSaat: 1, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-beden',   modulId: 'ara-sinif', sinif: '6', ad: 'Beden Eğitimi',   kisaltma: 'BED6', renk: 'indigo',  ikon: 'activity',       haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-6-bit',     modulId: 'ara-sinif', sinif: '6', ad: 'Bilişim Tek.',    kisaltma: 'BIT6', renk: 'slate',   ikon: 'laptop',         haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },

  // ── ARA SINIFLAR (7. Sınıf) ──
  { id: 'ara-7-turkce',  modulId: 'ara-sinif', sinif: '7', ad: 'Türkçe',          kisaltma: 'TR7',  renk: 'rose',    ikon: 'book',           haftalikSaat: 5, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-mat',     modulId: 'ara-sinif', sinif: '7', ad: 'Matematik',       kisaltma: 'MAT7', renk: 'blue',    ikon: 'calculator',     haftalikSaat: 5, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-fen',     modulId: 'ara-sinif', sinif: '7', ad: 'Fen Bilimleri',   kisaltma: 'FEN7', renk: 'emerald', ikon: 'flask-conical',  haftalikSaat: 4, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-sos',     modulId: 'ara-sinif', sinif: '7', ad: 'Sosyal Bilgiler', kisaltma: 'SOS7', renk: 'amber',   ikon: 'compass',        haftalikSaat: 3, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-ing',     modulId: 'ara-sinif', sinif: '7', ad: 'İngilizce',       kisaltma: 'ING7', renk: 'purple',  ikon: 'languages',      haftalikSaat: 4, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-din',     modulId: 'ara-sinif', sinif: '7', ad: 'Din Kültürü',     kisaltma: 'DIN7', renk: 'teal',    ikon: 'heart-handshake',haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-gorsel',  modulId: 'ara-sinif', sinif: '7', ad: 'Görsel Sanatlar', kisaltma: 'GSA7', renk: 'orange',  ikon: 'palette',        haftalikSaat: 1, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-muzik',   modulId: 'ara-sinif', sinif: '7', ad: 'Müzik',           kisaltma: 'MUZ7', renk: 'cyan',    ikon: 'music',          haftalikSaat: 1, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-beden',   modulId: 'ara-sinif', sinif: '7', ad: 'Beden Eğitimi',   kisaltma: 'BED7', renk: 'indigo',  ikon: 'activity',       haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },
  { id: 'ara-7-teknoloji',modulId: 'ara-sinif',sinif: '7', ad: 'Teknoloji Tasarım',kisaltma: 'TEK7', renk: 'slate',  ikon: 'cpu',            haftalikSaat: 2, sinavdaMi: false, soruSayisi: 0 },

  // ── LGS HAZIRLIK (8. Sınıf) ──
  { id: 'lgs-turkce',  modulId: 'lgs', sinif: '8', ad: 'Türkçe',           kisaltma: 'TR',  renk: 'rose',    ikon: 'book',           haftalikSaat: 5, sinavdaMi: true, soruSayisi: 20 },
  { id: 'lgs-mat',     modulId: 'lgs', sinif: '8', ad: 'Matematik',        kisaltma: 'MAT', renk: 'blue',    ikon: 'calculator',     haftalikSaat: 5, sinavdaMi: true, soruSayisi: 20 },
  { id: 'lgs-fen',     modulId: 'lgs', sinif: '8', ad: 'Fen Bilimleri',    kisaltma: 'FEN', renk: 'emerald', ikon: 'flask-conical',  haftalikSaat: 4, sinavdaMi: true, soruSayisi: 20 },
  { id: 'lgs-inkilap', modulId: 'lgs', sinif: '8', ad: 'İnkılap Tarihi',  kisaltma: 'INK', renk: 'amber',   ikon: 'landmark',       haftalikSaat: 2, sinavdaMi: true, soruSayisi: 10 },
  { id: 'lgs-din',     modulId: 'lgs', sinif: '8', ad: 'Din Kültürü',      kisaltma: 'DIN', renk: 'teal',    ikon: 'heart-handshake',haftalikSaat: 2, sinavdaMi: true, soruSayisi: 10 },
  { id: 'lgs-ing',     modulId: 'lgs', sinif: '8', ad: 'İngilizce',        kisaltma: 'ING', renk: 'purple',  ikon: 'languages',      haftalikSaat: 4, sinavdaMi: true, soruSayisi: 10 },

  // ── YKS (TYT) ──
  { id: 'tyt-turkce',    modulId: 'yks', sinif: 'ortak', ad: 'TYT Türkçe',       kisaltma: 'TYT-TR',  renk: 'rose',    ikon: 'book',        haftalikSaat: 4, sinavdaMi: true, soruSayisi: 40 },
  { id: 'tyt-mat',       modulId: 'yks', sinif: 'ortak', ad: 'TYT Matematik',    kisaltma: 'TYT-MAT', renk: 'blue',    ikon: 'calculator',  haftalikSaat: 5, sinavdaMi: true, soruSayisi: 30 },
  { id: 'tyt-geo',       modulId: 'yks', sinif: 'ortak', ad: 'TYT Geometri',     kisaltma: 'TYT-GEO', renk: 'indigo',  ikon: 'shapes',      haftalikSaat: 2, sinavdaMi: true, soruSayisi: 10 },
  { id: 'tyt-fizik',     modulId: 'yks', sinif: 'ortak', ad: 'TYT Fizik',        kisaltma: 'TYT-FIZ', renk: 'cyan',    ikon: 'atom',        haftalikSaat: 2, sinavdaMi: true, soruSayisi: 7  },
  { id: 'tyt-kimya',     modulId: 'yks', sinif: 'ortak', ad: 'TYT Kimya',        kisaltma: 'TYT-KIM', renk: 'teal',    ikon: 'test-tube',   haftalikSaat: 2, sinavdaMi: true, soruSayisi: 7  },
  { id: 'tyt-biyo',      modulId: 'yks', sinif: 'ortak', ad: 'TYT Biyoloji',     kisaltma: 'TYT-BIO', renk: 'emerald', ikon: 'dna',         haftalikSaat: 2, sinavdaMi: true, soruSayisi: 6  },
  { id: 'tyt-tarih',     modulId: 'yks', sinif: 'ortak', ad: 'TYT Tarih',        kisaltma: 'TYT-TAR', renk: 'amber',   ikon: 'landmark',    haftalikSaat: 2, sinavdaMi: true, soruSayisi: 5  },
  { id: 'tyt-cografya',  modulId: 'yks', sinif: 'ortak', ad: 'TYT Coğrafya',     kisaltma: 'TYT-COG', renk: 'orange',  ikon: 'globe',       haftalikSaat: 2, sinavdaMi: true, soruSayisi: 5  },
  { id: 'tyt-felsefe',   modulId: 'yks', sinif: 'ortak', ad: 'TYT Felsefe',      kisaltma: 'TYT-FEL', renk: 'purple',  ikon: 'brain',       haftalikSaat: 2, sinavdaMi: true, soruSayisi: 5  },
  { id: 'tyt-din',       modulId: 'yks', sinif: 'ortak', ad: 'TYT Din Kültürü',  kisaltma: 'TYT-DIN', renk: 'slate',   ikon: 'heart-handshake', haftalikSaat: 1, sinavdaMi: true, soruSayisi: 5 },

  // ── YKS (AYT) ──
  { id: 'ayt-mat',       modulId: 'yks', sinif: 'ortak', ad: 'AYT Matematik',    kisaltma: 'AYT-MAT', renk: 'blue',    ikon: 'calculator',  haftalikSaat: 6, sinavdaMi: true, soruSayisi: 40 },
  { id: 'ayt-fizik',     modulId: 'yks', sinif: 'ortak', ad: 'AYT Fizik',        kisaltma: 'AYT-FIZ', renk: 'cyan',    ikon: 'atom',        haftalikSaat: 4, sinavdaMi: true, soruSayisi: 14 },
  { id: 'ayt-kimya',     modulId: 'yks', sinif: 'ortak', ad: 'AYT Kimya',        kisaltma: 'AYT-KIM', renk: 'teal',    ikon: 'test-tube',   haftalikSaat: 4, sinavdaMi: true, soruSayisi: 13 },
  { id: 'ayt-biyo',      modulId: 'yks', sinif: 'ortak', ad: 'AYT Biyoloji',     kisaltma: 'AYT-BIO', renk: 'emerald', ikon: 'dna',         haftalikSaat: 4, sinavdaMi: true, soruSayisi: 13 },
  { id: 'ayt-edebiyat',  modulId: 'yks', sinif: 'ortak', ad: 'AYT Edebiyat',     kisaltma: 'AYT-EDB', renk: 'rose',    ikon: 'scroll',      haftalikSaat: 5, sinavdaMi: true, soruSayisi: 24 },
  { id: 'ayt-tarih1',    modulId: 'yks', sinif: 'ortak', ad: 'AYT Tarih-1',      kisaltma: 'AYT-TR1', renk: 'amber',   ikon: 'landmark',    haftalikSaat: 3, sinavdaMi: true, soruSayisi: 10 },
  { id: 'ayt-cog1',      modulId: 'yks', sinif: 'ortak', ad: 'AYT Coğrafya-1',   kisaltma: 'AYT-CG1', renk: 'orange',  ikon: 'globe',       haftalikSaat: 3, sinavdaMi: true, soruSayisi: 6  },
  { id: 'ayt-tarih2',    modulId: 'yks', sinif: 'ortak', ad: 'AYT Tarih-2',      kisaltma: 'AYT-TR2', renk: 'amber',   ikon: 'landmark',    haftalikSaat: 3, sinavdaMi: true, soruSayisi: 11 },
  { id: 'ayt-cog2',      modulId: 'yks', sinif: 'ortak', ad: 'AYT Coğrafya-2',   kisaltma: 'AYT-CG2', renk: 'orange',  ikon: 'globe',       haftalikSaat: 3, sinavdaMi: true, soruSayisi: 11 },
  { id: 'ayt-felsefe',   modulId: 'yks', sinif: 'ortak', ad: 'AYT Felsefe Grubu',kisaltma: 'AYT-FEL', renk: 'purple',  ikon: 'brain',       haftalikSaat: 3, sinavdaMi: true, soruSayisi: 12 },
  { id: 'ayt-din',       modulId: 'yks', sinif: 'ortak', ad: 'AYT Din Kültürü',  kisaltma: 'AYT-DIN', renk: 'slate',   ikon: 'heart-handshake', haftalikSaat: 1, sinavdaMi: true, soruSayisi: 6 },
  { id: 'ydt-ing',       modulId: 'yks', sinif: 'ortak', ad: 'YDT İngilizce',    kisaltma: 'YDT-ING', renk: 'indigo',  ikon: 'languages',   haftalikSaat: 6, sinavdaMi: true, soruSayisi: 80 }
];

// ─────────────────────────────────────────────────────────────
// KONULAR
// ─────────────────────────────────────────────────────────────
const KONULAR = [
  // ═════════════════════════════════════════════════════════════
  // 5. SINIF MEB MÜFREDATI
  // ═════════════════════════════════════════════════════════════
  // 5. Sınıf Türkçe
  { id: 'kon-ara-tr5-01', dersId: 'ara-5-turkce', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Sözcükte Anlam', konuAdi: 'Gerçek, Mecaz ve Terim Anlam', aciklama: 'Kelimelerin temel ve yan anlamları' },
  { id: 'kon-ara-tr5-02', dersId: 'ara-5-turkce', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Sözcükte Anlam', konuAdi: 'Eş, Zıt Anlam ve Eş Sesli Sözcükler', aciklama: 'Anlam ilişkileri' },
  { id: 'kon-ara-tr5-03', dersId: 'ara-5-turkce', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Cümlede Anlam', konuAdi: 'Neden-Sonuç, Amaç-Sonuç, Koşul', aciklama: 'Cümleler arası anlam ilişkileri' },
  { id: 'kon-ara-tr5-04', dersId: 'ara-5-turkce', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Cümlede Anlam', konuAdi: 'Öznel ve Nesnel Yargılar', aciklama: 'Kanıtlanabilirlik açısından cümleler' },
  { id: 'kon-ara-tr5-05', dersId: 'ara-5-turkce', modulId: 'ara-sinif', sinif: '5', uniteNo: 3, uniteAdi: 'Paragrafta Anlam', konuAdi: 'Ana Fikir ve Yardımcı Fikirler', aciklama: 'Metin analizi ve kavrama' },
  { id: 'kon-ara-tr5-06', dersId: 'ara-5-turkce', modulId: 'ara-sinif', sinif: '5', uniteNo: 4, uniteAdi: 'Yazım ve Noktalama', konuAdi: 'Noktalama İşaretleri ve Büyük Harfler', aciklama: 'Temel imla kuralları' },

  // 5. Sınıf Matematik
  { id: 'kon-ara-mat5-01', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Doğal Sayılar', konuAdi: 'Milyonlar ve Sayı Basamakları', aciklama: '9 basamağa kadar doğal sayılar' },
  { id: 'kon-ara-mat5-02', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Doğal Sayılarla İşlemler', konuAdi: 'Dört İşlem ve Zihinden İşlemler', aciklama: 'Problem çözme stratejileri' },
  { id: 'kon-ara-mat5-03', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Kesirler', konuAdi: 'Birim Kesirler ve Kesirlerde Sıralama', aciklama: 'Basit, bileşik ve tam sayılı kesirler' },
  { id: 'kon-ara-mat5-04', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Kesirlerle İşlemler', konuAdi: 'Kesirlerde Toplama ve Çıkarma', aciklama: 'Payda eşitleme ve modelleme' },
  { id: 'kon-ara-mat5-05', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 3, uniteAdi: 'Ondalık Gösterim', konuAdi: 'Ondalık Kesirleri Okuma ve Yazma', aciklama: 'Basamak değerleri ve sıralama' },
  { id: 'kon-ara-mat5-06', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 3, uniteAdi: 'Yüzdeler', konuAdi: 'Yüzde Kavramı ve Karşılaştırma', aciklama: 'Kesir-ondalık-yüzde dönüşümleri' },
  { id: 'kon-ara-mat5-07', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 4, uniteAdi: 'Temel Geometrik Kavramlar', konuAdi: 'Doğru, Işın, Doğru Parçası ve Açılar', aciklama: 'Açı çeşitleri ve çizim' },
  { id: 'kon-ara-mat5-08', dersId: 'ara-5-mat', modulId: 'ara-sinif', sinif: '5', uniteNo: 5, uniteAdi: 'Veri İşleme', konuAdi: 'Araştırma Soruları ve Sıklık Tablosu', aciklama: 'Sütun grafiği oluşturma ve yorumlama' },

  // 5. Sınıf Fen Bilimleri
  { id: 'kon-ara-fen5-01', dersId: 'ara-5-fen', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Güneş, Dünya ve Ay', konuAdi: 'Güneş, Dünya ve Ay’ın Yapısı ve Hareketleri', aciklama: 'Ay’ın evreleri ve hareket döngüleri' },
  { id: 'kon-ara-fen5-02', dersId: 'ara-5-fen', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Canlılar Dünyası', konuAdi: 'Canlıları Tanıyalım (Bitkiler, Hayvanlar, Mantarlar, Mikroskobik)', aciklama: 'Canlıların sınıflandırılması' },
  { id: 'kon-ara-fen5-03', dersId: 'ara-5-fen', modulId: 'ara-sinif', sinif: '5', uniteNo: 3, uniteAdi: 'Kuvvetin Ölçülmesi ve Sürtünme', konuAdi: 'Dinamometre ve Sürtünme Kuvveti', aciklama: 'Kuvvet birimleri ve sürtünme etkileri' },
  { id: 'kon-ara-fen5-04', dersId: 'ara-5-fen', modulId: 'ara-sinif', sinif: '5', uniteNo: 4, uniteAdi: 'Madde ve Değişim', konuAdi: 'Maddenin Hâl Değişimi ve Ayırt Edici Özellikler', aciklama: 'Erime, donma, kaynama, buharlaşma' },
  { id: 'kon-ara-fen5-05', dersId: 'ara-5-fen', modulId: 'ara-sinif', sinif: '5', uniteNo: 5, uniteAdi: 'Işığın Yayılması', konuAdi: 'Işığın Yayılması, Yansıması ve Maddeyle Etkileşimi', aciklama: 'Saydam, yarı saydam ve opak maddeler' },

  // 5. Sınıf Sosyal Bilgiler
  { id: 'kon-ara-sos5-01', dersId: 'ara-5-sos', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Birey ve Toplum', konuAdi: 'Haklarımız, Sorumluluklarımız ve Gruplarımız', aciklama: 'Sosyal roller ve çocuk hakları' },
  { id: 'kon-ara-sos5-02', dersId: 'ara-5-sos', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Kültür ve Miras', konuAdi: 'Tarihe Yolculuk (Anadolu ve Mezopotamya Uygarlıkları)', aciklama: 'Kültürel zenginliklerimiz' },
  { id: 'kon-ara-sos5-03', dersId: 'ara-5-sos', modulId: 'ara-sinif', sinif: '5', uniteNo: 3, uniteAdi: 'İnsanlar, Yerler ve Çevreler', konuAdi: 'Haritayı Tanıyorum ve İklimin Etkileri', aciklama: 'Yeryüzü şekilleri ve afetler' },
  { id: 'kon-ara-sos5-04', dersId: 'ara-5-sos', modulId: 'ara-sinif', sinif: '5', uniteNo: 4, uniteAdi: 'Bilim, Teknoloji ve Toplum', konuAdi: 'Doğru ve Güvenilir Bilgiye Ulaşma', aciklama: 'Teknolojinin kullanımı ve telif' },

  // 5. Sınıf İngilizce
  { id: 'kon-ara-ing5-01', dersId: 'ara-5-ing', modulId: 'ara-sinif', sinif: '5', uniteNo: 1, uniteAdi: 'Unit 1: Hello!', konuAdi: 'Nationalities, Countries & Languages', aciklama: 'Greeting and introducing oneself' },
  { id: 'kon-ara-ing5-02', dersId: 'ara-5-ing', modulId: 'ara-sinif', sinif: '5', uniteNo: 2, uniteAdi: 'Unit 2: My Town', konuAdi: 'Directions and Town Locations', aciklama: 'Giving simple directions' },
  { id: 'kon-ara-ing5-03', dersId: 'ara-5-ing', modulId: 'ara-sinif', sinif: '5', uniteNo: 3, uniteAdi: 'Unit 3: Games and Hobbies', konuAdi: 'Expressing Likes/Dislikes & Abilities', aciklama: 'Can/can’t and leisure activities' },
  { id: 'kon-ara-ing5-04', dersId: 'ara-5-ing', modulId: 'ara-sinif', sinif: '5', uniteNo: 4, uniteAdi: 'Unit 4: My Daily Routine', konuAdi: 'Telling Time and Daily Habits', aciklama: 'Simple present tense daily routines' },

  // ═════════════════════════════════════════════════════════════
  // 6. SINIF MEB MÜFREDATI
  // ═════════════════════════════════════════════════════════════
  // 6. Sınıf Matematik
  { id: 'kon-ara-mat6-01', dersId: 'ara-6-mat', modulId: 'ara-sinif', sinif: '6', uniteNo: 1, uniteAdi: 'Doğal Sayılarla İşlemler', konuAdi: 'Üslü İfadeler ve İşlem Önceliği', aciklama: 'Üs kavramı ve parantezli işlemler' },
  { id: 'kon-ara-mat6-02', dersId: 'ara-6-mat', modulId: 'ara-sinif', sinif: '6', uniteNo: 1, uniteAdi: 'Çarpanlar ve Katlar', konuAdi: 'Bölünebilme Kuralları ve Asal Sayılar', aciklama: '2, 3, 4, 5, 6, 9, 10 ile bölünebilme' },
  { id: 'kon-ara-mat6-03', dersId: 'ara-6-mat', modulId: 'ara-sinif', sinif: '6', uniteNo: 1, uniteAdi: 'Kümeler', konuAdi: 'Küme Kavramı ve Kümelerde İşlemler', aciklama: 'Kesişim ve birleşim' },
  { id: 'kon-ara-mat6-04', dersId: 'ara-6-mat', modulId: 'ara-sinif', sinif: '6', uniteNo: 2, uniteAdi: 'Tam Sayılar', konuAdi: 'Tam Sayı Kavramı ve Karşılaştırma', aciklama: 'Negatif sayılar ve mutlak değer' },
  { id: 'kon-ara-mat6-05', dersId: 'ara-6-mat', modulId: 'ara-sinif', sinif: '6', uniteNo: 3, uniteAdi: 'Cebirsel İfadeler', konuAdi: 'Cebirsel İfadeleri Yazma ve Değerini Bulma', aciklama: 'Değişken kavramı' },

  // 6. Sınıf Fen Bilimleri
  { id: 'kon-ara-fen6-01', dersId: 'ara-6-fen', modulId: 'ara-sinif', sinif: '6', uniteNo: 1, uniteAdi: 'Güneş Sistemi ve Tutulmalar', konuAdi: 'Gezegenler, Güneş ve Ay Tutulması', aciklama: 'Güneş sistemi modelleri' },
  { id: 'kon-ara-fen6-02', dersId: 'ara-6-fen', modulId: 'ara-sinif', sinif: '6', uniteNo: 2, uniteAdi: 'Vücudumuzdaki Sistemler', konuAdi: 'Destek, Hareket, Dolaşım ve Solunum Sistemi', aciklama: 'İnsan anatomisi temelleri' },
  { id: 'kon-ara-fen6-03', dersId: 'ara-6-fen', modulId: 'ara-sinif', sinif: '6', uniteNo: 3, uniteAdi: 'Kuvvet ve Hareket', konuAdi: 'Bileşke Kuvvet ve Sabit Süratli Hareket', aciklama: 'Dengelenmiş ve dengelenmemiş kuvvetler' },

  // ═════════════════════════════════════════════════════════════
  // 7. SINIF MEB MÜFREDATI
  // ═════════════════════════════════════════════════════════════
  // 7. Sınıf Matematik
  { id: 'kon-ara-mat7-01', dersId: 'ara-7-mat', modulId: 'ara-sinif', sinif: '7', uniteNo: 1, uniteAdi: 'Tam Sayılarla İşlemler', konuAdi: 'Tam Sayılarda Dört İşlem', aciklama: 'İşaret kuralları ve üslü nicelikler' },
  { id: 'kon-ara-mat7-02', dersId: 'ara-7-mat', modulId: 'ara-sinif', sinif: '7', uniteNo: 2, uniteAdi: 'Rasyonel Sayılar', konuAdi: 'Rasyonel Sayılarda Sıralama ve İşlemler', aciklama: 'Devirli sayılar ve rasyonel problemler' },
  { id: 'kon-ara-mat7-03', dersId: 'ara-7-mat', modulId: 'ara-sinif', sinif: '7', uniteNo: 3, uniteAdi: 'Cebirsel İfadeler ve Denklemler', konuAdi: 'Birinci Dereceden Bir Bilinmeyenli Denklemler', aciklama: 'Denklem kurma ve çözme' },
  { id: 'kon-ara-mat7-04', dersId: 'ara-7-mat', modulId: 'ara-sinif', sinif: '7', uniteNo: 4, uniteAdi: 'Oran ve Orantı', konuAdi: 'Doğru ve Ters Orantı, Yüzdeler', aciklama: 'Faiz, indirim ve kâr problemleri' },

  // ═════════════════════════════════════════════════════════════
  // 8. SINIF (LGS HAZIRLIK) TAM MÜFREDAT
  // ═════════════════════════════════════════════════════════════
  // LGS Türkçe
  { id: 'kon-lgs-tr-01', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Fiilimsiler', konuAdi: 'İsim-Fiil, Sıfat-Fiil, Zarf-Fiil', aciklama: 'Ekler ve görevleri' },
  { id: 'kon-lgs-tr-02', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Sözcük ve Söz Gruplarında Anlam', konuAdi: 'Deyimler, Atasözleri ve Söz Sanatları', aciklama: 'Benzetme, kişileştirme, tezat' },
  { id: 'kon-lgs-tr-03', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Cümlenin Ögeleri', konuAdi: 'Temel ve Yardımcı Ögeler, Vurgu', aciklama: 'Yüklem, özne, nesne, tümleç' },
  { id: 'kon-lgs-tr-04', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Fiilde Çatı', konuAdi: 'Öznesine ve Nesnesine Göre Fiiller', aciklama: 'Etken, edilgen, geçişli, geçişsiz' },
  { id: 'kon-lgs-tr-05', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Cümle Türleri', konuAdi: 'Yapısına, Anlamına ve Yüklemin Türüne Göre', aciklama: 'Basit, birleşik, sıralı, bağlı' },
  { id: 'kon-lgs-tr-06', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 6, uniteAdi: 'Paragrafta Anlam & Mantık', konuAdi: 'Sözel Mantık, Muhakeme ve Görsel Okuma', aciklama: 'Yeni nesil analiz soruları' },
  { id: 'kon-lgs-tr-07', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 7, uniteAdi: 'Yazım Kuralları ve Noktalama', konuAdi: 'Yazım Yanlışları ve Noktalama İşaretleri', aciklama: 'TDK kuralları' },
  { id: 'kon-lgs-tr-08', dersId: 'lgs-turkce', modulId: 'lgs', sinif: '8', uniteNo: 8, uniteAdi: 'Metin Türleri', konuAdi: 'Olay, Düşünce ve Bildirme Yazıları', aciklama: 'Deneme, makale, fıkra, hikâye' },

  // LGS Matematik
  { id: 'kon-lgs-mat-01', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Çarpanlar ve Katlar', konuAdi: 'EBOB - EKOK ve Aralarında Asal Sayılar', aciklama: 'Yeni nesil problem modelleri' },
  { id: 'kon-lgs-mat-02', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Üslü İfadeler', konuAdi: 'Üslü Sayılarda İşlemler ve Bilimsel Gösterim', aciklama: 'Ondalık çözümleme ve çok büyük/küçük sayılar' },
  { id: 'kon-lgs-mat-03', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Kareköklü İfadeler', konuAdi: 'Tam Kare Sayılar, Karekökte Dört İşlem', aciklama: 'a√b gösterimi ve gerçek sayılar' },
  { id: 'kon-lgs-mat-04', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Veri Analizi', konuAdi: 'Çizgi, Sütun ve Daire Grafikleri Dönüşümü', aciklama: 'Grafik yorumlama ve karşılaştırma' },
  { id: 'kon-lgs-mat-05', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Basit Olayların Olasılığı', konuAdi: 'Olasılık Değeri ve Olası Durumlar', aciklama: 'Eşit, daha fazla, daha az olasılık' },
  { id: 'kon-lgs-mat-06', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Cebirsel İfadeler ve Özdeşlikler', konuAdi: 'Özdeşlikler ve Çarpanlara Ayırma', aciklama: 'Tam kare ve iki kare farkı özdeşliği' },
  { id: 'kon-lgs-mat-07', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Doğrusal Denklemler', konuAdi: 'Koordinat Sistemi, Doğru Grafiği ve Eğim', aciklama: 'Denklem sistemleri ve eğim hesabı' },
  { id: 'kon-lgs-mat-08', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Eşitsizlikler', konuAdi: 'Birinci Dereceden Bir Bilinmeyenli Eşitsizlikler', aciklama: 'Sayı doğrusunda gösterme ve problem çözümü' },
  { id: 'kon-lgs-mat-09', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Üçgenler', konuAdi: 'Üçgen Eşitsizliği, Açı-Kenar Bağıntıları ve Pisagor', aciklama: 'Kenarortay, açıortay, yükseklik' },
  { id: 'kon-lgs-mat-10', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Eşlik ve Benzerlik', konuAdi: 'Benzerlik Oranı ve Eş Çokgenler', aciklama: 'Kenar-açı benzerlik kuralları' },
  { id: 'kon-lgs-mat-11', dersId: 'lgs-mat', modulId: 'lgs', sinif: '8', uniteNo: 6, uniteAdi: 'Dönüşüm Geometrisi & Cisimler', konuAdi: 'Öteleme, Yansıma ve Geometrik Cisimler', aciklama: 'Silindir, piramit ve koni hacim/alan' },

  // LGS Fen Bilimleri
  { id: 'kon-lgs-fen-01', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Mevsimler ve İklim', konuAdi: 'Mevsimlerin Oluşumu ve İklim-Hava Hareketleri', aciklama: 'Eksen eğikliği, rüzgâr ve sera etkisi' },
  { id: 'kon-lgs-fen-02', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'DNA ve Genetik Kod', konuAdi: 'DNA Yapısı, Eşlenmesi ve Nükleotidler', aciklama: 'Kromozom, gen, DNA ilişkisi' },
  { id: 'kon-lgs-fen-03', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Kalıtım ve Biyoteknoloji', konuAdi: 'Mendel Genetiği, Mutasyon, Modifikasyon, Adaptasyon', aciklama: 'Çaprazlamalar ve genetik mühendisliği' },
  { id: 'kon-lgs-fen-04', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Basınç', konuAdi: 'Katı, Sıvı ve Gaz Basıncı (Pascal Prensibi)', aciklama: 'Günlük hayat uygulamaları ve deneyler' },
  { id: 'kon-lgs-fen-05', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Madde ve Endüstri', konuAdi: 'Periyodik Sistem, Fiziksel/Kimyasal Değişimler', aciklama: 'Metaller, ametaller, tepkime denklemleri' },
  { id: 'kon-lgs-fen-06', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Asitler, Bazlar ve Isı', konuAdi: 'Asit-Baz Tepkimeleri, pH ve Öz Isı', aciklama: 'Asit yağmurları ve ısı alışverişi' },
  { id: 'kon-lgs-fen-07', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Basit Makineler', konuAdi: 'Kaldıraç, Makara, Eğik Düzlem, Çıkrık, Dişli', aciklama: 'Kuvvet kazancı ve iş prensibi' },
  { id: 'kon-lgs-fen-08', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 6, uniteAdi: 'Enerji Dönüşümleri & Çevre', konuAdi: 'Besin Zinciri, Fotosentez ve Solunum', aciklama: 'Madde döngüleri ve sürdürülebilirlik' },
  { id: 'kon-lgs-fen-09', dersId: 'lgs-fen', modulId: 'lgs', sinif: '8', uniteNo: 7, uniteAdi: 'Elektrik Yükleri & Enerji', konuAdi: 'Elektriklenme, Elektroskop ve Güvenlik', aciklama: 'Sürtünme, dokunma, etki ile elektriklenme' },

  // LGS T.C. İnkılap Tarihi
  { id: 'kon-lgs-ink-01', dersId: 'lgs-inkilap', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Bir Kahraman Doğuyor', konuAdi: 'Mustafa Kemal’in Çocukluğu ve Fikir Hayatı', aciklama: '20. yy başlarında Osmanlı Devleti' },
  { id: 'kon-lgs-ink-02', dersId: 'lgs-inkilap', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Milli Uyanış', konuAdi: '1. Dünya Savaşı ve Genelgeler-Kongreler', aciklama: 'Mondros, Kuva-yı Milliye, Sevr' },
  { id: 'kon-lgs-ink-03', dersId: 'lgs-inkilap', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Milli Bir Destan: Ya İstiklal Ya Ölüm', konuAdi: 'Kurtuluş Savaşı Cepheleri ve Lozan Barış Antlaşması', aciklama: 'Doğu, Güney, Batı cepheleri ve Mudanya' },
  { id: 'kon-lgs-ink-04', dersId: 'lgs-inkilap', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Atatürkçülük ve Çağdaşlaşan Türkiye', konuAdi: 'Atatürk İlkeleri ve İnkılaplar', aciklama: 'Siyasi, hukuki, eğitim ve toplumsal inkılaplar' },
  { id: 'kon-lgs-ink-05', dersId: 'lgs-inkilap', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Demokratikleşme Çabaları', konuAdi: 'Çok Partili Hayata Geçiş Denemeleri', aciklama: 'Mustafa Kemal’e suikast girişimi' },
  { id: 'kon-lgs-ink-06', dersId: 'lgs-inkilap', modulId: 'lgs', sinif: '8', uniteNo: 6, uniteAdi: 'Atatürk Dönemi Türk Dış Politikası', konuAdi: 'Hatay’ın Katılması, Boğazlar ve Sadabat Paktı', aciklama: 'Yurtta sulh, cihanda sulh ilkesi' },

  // LGS Din Kültürü
  { id: 'kon-lgs-din-01', dersId: 'lgs-din', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Kader İnancı', konuAdi: 'Kader ve Kaza Kavramları, İnsanın İradesi', aciklama: 'Tevekkül ve evrensel yasalar' },
  { id: 'kon-lgs-din-02', dersId: 'lgs-din', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Zekât ve Sadaka', konuAdi: 'Zekâtın Hükmü, Kimlere Verilir, Sadaka-i Cariye', aciklama: 'İslam’da paylaşma ve yardımlaşma' },
  { id: 'kon-lgs-din-03', dersId: 'lgs-din', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Din ve Hayat', konuAdi: 'Dinin Temel Gayesi (Zarurat-ı Diniyye)', aciklama: 'Canın, aklın, dinin, malın, neslin korunması' },
  { id: 'kon-lgs-din-04', dersId: 'lgs-din', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Hz. Muhammed’in Örnekliği', konuAdi: 'Merhameti, İstişareye Verdiği Önem ve Cesareti', aciklama: 'Peygamberimizin ahlaki vasıfları' },
  { id: 'kon-lgs-din-05', dersId: 'lgs-din', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Kuran-ı Kerim ve Özellikleri', konuAdi: 'İslam Dininin Ana Kaynakları', aciklama: 'Kuran’ın temel mesajları' },

  // LGS İngilizce
  { id: 'kon-lgs-ing-01', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 1, uniteAdi: 'Unit 1: Friendship', konuAdi: 'Accepting/Refusing Invitations and Making Excuses', aciklama: 'Personal traits and good friendships' },
  { id: 'kon-lgs-ing-02', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 2, uniteAdi: 'Unit 2: Teen Life', konuAdi: 'Preferences, Daily Activities and Music Genres', aciklama: 'Expressing likes, dislikes and regular habits' },
  { id: 'kon-lgs-ing-03', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 3, uniteAdi: 'Unit 3: In the Kitchen', konuAdi: 'Cooking Processes, Recipes and Utensils', aciklama: 'Sequencing words (First, Second, Then, Finally)' },
  { id: 'kon-lgs-ing-04', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 4, uniteAdi: 'Unit 4: On the Phone', konuAdi: 'Phone Conversations and Communication Ways', aciklama: 'Taking and leaving messages' },
  { id: 'kon-lgs-ing-05', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 5, uniteAdi: 'Unit 5: The Internet', konuAdi: 'Internet Safety Rules and Online Activities', aciklama: 'Giving advice and posting comments' },
  { id: 'kon-lgs-ing-06', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 6, uniteAdi: 'Unit 6: Adventures', konuAdi: 'Extreme Sports and Comparison of Preferences', aciklama: 'Comparing challenging outdoor activities' },
  { id: 'kon-lgs-ing-07', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 7, uniteAdi: 'Unit 7: Tourism', konuAdi: 'Vacation Types, Historical Sites and Weather', aciklama: 'Describing past travel experiences' },
  { id: 'kon-lgs-ing-08', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 8, uniteAdi: 'Unit 8: Chores', konuAdi: 'Obligations and Responsibilities at Home', aciklama: 'Expressing duties with must/have to' },
  { id: 'kon-lgs-ing-09', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 9, uniteAdi: 'Unit 9: Science', konuAdi: 'Scientific Inventions and Discoveries', aciklama: 'Past and present scientific progress' },
  { id: 'kon-lgs-ing-10', dersId: 'lgs-ing', modulId: 'lgs', sinif: '8', uniteNo: 10, uniteAdi: 'Unit 10: Natural Forces', konuAdi: 'Natural Disasters, Causes and Precautions', aciklama: 'Expressing predictions and reasons' },

  // ═════════════════════════════════════════════════════════════
  // YKS (TYT) TEMEL MÜFREDAT
  // ═════════════════════════════════════════════════════════════
  // TYT Türkçe
  { id: 'kon-tyt-tr-01', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'Sözcük ve Cümle Anlamı', konuAdi: 'Sözcükte ve Cümlede Anlam Olayları', aciklama: 'Mecaz, deyim, atasözü, cümle yorumu' },
  { id: 'kon-tyt-tr-02', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'Paragraf Bilgisi', konuAdi: 'Paragrafta Yapı, Ana Düşünce ve Anlatım Teknikleri', aciklama: 'ÖSYM tarzı hızlı paragraf çözümü' },
  { id: 'kon-tyt-tr-03', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 3, uniteAdi: 'Ses Bilgisi', konuAdi: 'Ünlü ve Ünsüz Uyumları, Ses Olayları', aciklama: 'Düşme, türeme, benzeşme' },
  { id: 'kon-tyt-tr-04', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 4, uniteAdi: 'Yazım Kuralları & Noktalama', konuAdi: 'İmla ve Noktalama İşaretleri', aciklama: 'Güncel TDK kılavuzu' },
  { id: 'kon-tyt-tr-05', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 5, uniteAdi: 'Sözcükte Yapı & Ekler', konuAdi: 'Kökler, Yapım ve Çekim Ekleri', aciklama: 'Basit, türemiş, birleşik sözcükler' },
  { id: 'kon-tyt-tr-06', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 6, uniteAdi: 'Sözcük Türleri', konuAdi: 'İsim, Sıfat, Zamir, Zarf, Edat, Bağlaç, Ünlem', aciklama: 'Sözcük öbekleri ve görevleri' },
  { id: 'kon-tyt-tr-07', dersId: 'tyt-turkce', modulId: 'yks', sinif: 'ortak', uniteNo: 7, uniteAdi: 'Cümle Bilgisi', konuAdi: 'Cümlenin Ögeleri ve Cümle Çeşitleri', aciklama: 'Yapısına ve anlamına göre' },

  // TYT Matematik
  { id: 'kon-tyt-mat-01', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'Temel Kavramlar', konuAdi: 'Sayı Kümeleri, Tek-Çift ve Asal Sayılar', aciklama: 'Ardışık sayılar, faktöriyel' },
  { id: 'kon-tyt-mat-02', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'Basamak Kavramı & Bölünebilme', konuAdi: 'Sayı Basamakları ve EBOB-EKOK', aciklama: 'Bölme ve bölünebilme kuralları' },
  { id: 'kon-tyt-mat-03', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'Rasyonel Sayılar & Basit Eşitsizlik', konuAdi: 'Rasyonel Sayılar ve Sıralama', aciklama: 'Aralık kavramı' },
  { id: 'kon-tyt-mat-04', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'Mutlak Değer', konuAdi: 'Mutlak Değer Özellikleri ve Denklemleri', aciklama: 'Geometrik mutlak değer' },
  { id: 'kon-tyt-mat-05', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 3, uniteAdi: 'Üslü ve Köklü Sayılar', konuAdi: 'Üslü ve Köklü Sayılarda İşlemler', aciklama: 'Kök dışına çıkarma ve eşlenik' },
  { id: 'kon-tyt-mat-06', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 4, uniteAdi: 'Çarpanlara Ayırma', konuAdi: 'Özdeşlikler ve Çarpanlara Ayırma Yöntemleri', aciklama: 'Ortak parantez, gruplandırma' },
  { id: 'kon-tyt-mat-07', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 5, uniteAdi: 'Problemler', konuAdi: 'Sayı, Kesir, Yaş, İşçi, Hız, Yüzde, Kâr-Zarar, Karışım', aciklama: 'Yeni nesil kurgusal problemler' },
  { id: 'kon-tyt-mat-08', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 6, uniteAdi: 'Kümeler & Fonksiyonlar', konuAdi: 'Küme İşlemleri ve Fonksiyon Temelleri', aciklama: 'Tanım, değer kümesi ve grafik' },
  { id: 'kon-tyt-mat-09', dersId: 'tyt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 7, uniteAdi: 'Mantık & Sayma', konuAdi: 'Permütasyon, Kombinasyon, Binom ve Olasılık', aciklama: 'Temel sayma ilkeleri' },

  // TYT Geometri
  { id: 'kon-tyt-geo-01', dersId: 'tyt-geo', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'Doğruda ve Üçgende Açılar', konuAdi: 'Açı Bağıntıları ve Özel Üçgenler', aciklama: '30-60-90, 45-45-90 üçgenleri' },
  { id: 'kon-tyt-geo-02', dersId: 'tyt-geo', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'Üçgende Alan ve Benzerlik', konuAdi: 'Açıortay, Kenarortay ve Benzerlik Teoremleri', aciklama: 'Alan formülleri ve oranlar' },
  { id: 'kon-tyt-geo-03', dersId: 'tyt-geo', modulId: 'yks', sinif: 'ortak', uniteNo: 3, uniteAdi: 'Çokgenler ve Dörtgenler', konuAdi: 'Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Yamuk', aciklama: 'Dörtgen özellikleri ve alan hesabı' },
  { id: 'kon-tyt-geo-04', dersId: 'tyt-geo', modulId: 'yks', sinif: 'ortak', uniteNo: 4, uniteAdi: 'Çember ve Daire', konuAdi: 'Çemberde Açılar, Teğet-Kiriş ve Dairede Alan', aciklama: 'Yay uzunluğu ve daire dilimi' },
  { id: 'kon-tyt-geo-05', dersId: 'tyt-geo', modulId: 'yks', sinif: 'ortak', uniteNo: 5, uniteAdi: 'Katı Cisimler', konuAdi: 'Prizma, Piramit, Silindir, Koni, Küre', aciklama: 'Alan ve hacim hesapları' },

  // ═════════════════════════════════════════════════════════════
  // YKS (AYT) MÜFREDATI
  // ═════════════════════════════════════════════════════════════
  // AYT Matematik
  { id: 'kon-ayt-mat-01', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'İkinci Dereceden Denklemler & Karmaşık Sayılar', konuAdi: 'Kök-Katsayı İlişkisi ve Diskriminant', aciklama: 'İkinci dereceden eşitsizlikler' },
  { id: 'kon-ayt-mat-02', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'Parabol', konuAdi: 'Tepe Noktası, Simetri Ekseni ve Grafik Çizimi', aciklama: 'Parabolün doğru ile durumu' },
  { id: 'kon-ayt-mat-03', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 3, uniteAdi: 'Polinomlar', konuAdi: 'Polinomlarda Bölme ve Kalan Bulma', aciklama: 'Derece kavramı ve kök bulma' },
  { id: 'kon-ayt-mat-04', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 4, uniteAdi: 'Trigonometri', konuAdi: 'Trigonometrik Fonksiyonlar, Toplam-Fark ve Yarım Açı', aciklama: 'Trigonometrik denklemler ve periyot' },
  { id: 'kon-ayt-mat-05', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 5, uniteAdi: 'Logaritma', konuAdi: 'Logaritma Fonksiyonu ve Özellikleri', aciklama: 'Üstel ve logaritmik denklemler' },
  { id: 'kon-ayt-mat-06', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 6, uniteAdi: 'Diziler', konuAdi: 'Aritmetik ve Geometrik Diziler', aciklama: 'Genel terim ve toplam formülleri' },
  { id: 'kon-ayt-mat-07', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 7, uniteAdi: 'Limit ve Süreklilik', konuAdi: 'Sağdan-Soldan Limit ve Belirsizlikler', aciklama: '0/0 belirsizliği ve süreklilik kuralları' },
  { id: 'kon-ayt-mat-08', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 8, uniteAdi: 'Türev', konuAdi: 'Türev Alma Kuralları ve Geometrik Yorum', aciklama: 'Teğet denklemi, artan-azalanlık, ekstremum' },
  { id: 'kon-ayt-mat-09', dersId: 'ayt-mat', modulId: 'yks', sinif: 'ortak', uniteNo: 9, uniteAdi: 'İntegral', konuAdi: 'Belirsiz ve Belirli İntegral, Alan Hesabı', aciklama: 'Değişken değiştirme ve eğri altındaki alan' },

  // AYT Fizik
  { id: 'kon-ayt-fiz-01', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'Vektörler ve Bağıl Hareket', konuAdi: 'Bileşke Vektör ve Nehir Problemleri', aciklama: 'Bağıl hız formülü' },
  { id: 'kon-ayt-fiz-02', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'Newton’ın Hareket Yasaları', konuAdi: 'Eğik Düzlem, Sürtünme ve Serbest Cisim Diyagramı', aciklama: 'Net kuvvet ve ivme ilişkileri' },
  { id: 'kon-ayt-fiz-03', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 3, uniteAdi: 'Bir ve İki Boyutta Sabit İvmeli Hareket', konuAdi: 'Atış Hareketleri (Düşey, Yatay, Eğik Atış)', aciklama: 'Uçuş süresi ve menzil' },
  { id: 'kon-ayt-fiz-04', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 4, uniteAdi: 'İş, Güç, Enerji ve İtme-Momentum', konuAdi: 'Mekanik Enerji Korunumu ve Çarpışmalar', aciklama: 'Esnek ve esnek olmayan çarpışmalar' },
  { id: 'kon-ayt-fiz-05', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 5, uniteAdi: 'Tork, Denge ve Kütle Merkezi', konuAdi: 'Dönme Momenti ve Denge Şartları', aciklama: 'Ağırlık merkezi bulma' },
  { id: 'kon-ayt-fiz-06', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 6, uniteAdi: 'Elektrostatik & Manyetizma', konuAdi: 'Elektriksel Alan, Potansiyel, Manyetik Alan ve İndüksiyon', aciklama: 'Faraday ve Lenz yasaları, transformatörler' },
  { id: 'kon-ayt-fiz-07', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 7, uniteAdi: 'Çembersel Hareket & Basit Harmonik Hareket', konuAdi: 'Merkezcil İvme, Açısal Momentum, Yay ve Sarkaç', aciklama: 'Periyot formülleri ve dönme kinetik enerjisi' },
  { id: 'kon-ayt-fiz-08', dersId: 'ayt-fizik', modulId: 'yks', sinif: 'ortak', uniteNo: 8, uniteAdi: 'Dalga Mekaniği & Modern Fizik', konuAdi: 'Girişim, Kırınım, Fotoelektrik ve Compton Olayı', aciklama: 'Işığın dalga ve tanecik modeli' },

  // AYT Edebiyat
  { id: 'kon-ayt-edb-01', dersId: 'ayt-edebiyat', modulId: 'yks', sinif: 'ortak', uniteNo: 1, uniteAdi: 'Şiir Bilgisi & Edebi Sanatlar', konuAdi: 'Nazım Birimi, Ölçü, Uyak ve Söz Sanatları', aciklama: 'Şiir çözümleme kuralları' },
  { id: 'kon-ayt-edb-02', dersId: 'ayt-edebiyat', modulId: 'yks', sinif: 'ortak', uniteNo: 2, uniteAdi: 'İslamiyet Öncesi & Geçiş Dönemi', konuAdi: 'Koşuk, Sagu, Sav, Destan ve İlk İslami Eserler', aciklama: 'Kutadgu Bilig, Dîvânu Lugâti\'t-Türk' },
  { id: 'kon-ayt-edb-03', dersId: 'ayt-edebiyat', modulId: 'yks', sinif: 'ortak', uniteNo: 3, uniteAdi: 'Halk ve Divan Edebiyatı', konuAdi: 'Âşık/Tekke Şiiri, Divan Nazım Şekilleri ve Şairleri', aciklama: 'Fuzulî, Bâkî, Nedîm, Yunus Emre' },
  { id: 'kon-ayt-edb-04', dersId: 'ayt-edebiyat', modulId: 'yks', sinif: 'ortak', uniteNo: 4, uniteAdi: 'Tanzimat, Servet-i Fünun, Fecr-i Âti', konuAdi: 'Dönem Özellikleri, Türler ve Öncü Yazarlar', aciklama: 'Namık Kemal, Tevfik Fikret, Halit Ziya' },
  { id: 'kon-ayt-edb-05', dersId: 'ayt-edebiyat', modulId: 'yks', sinif: 'ortak', uniteNo: 5, uniteAdi: 'Milli Edebiyat & Cumhuriyet Dönemi', konuAdi: 'Şiir Akımları, Roman, Hikâye ve Tiyatro', aciklama: 'Garip, İkinci Yeni, Toplumcu Gerçekçiler' }
];

// Global scope bağlantıları
if (typeof window !== 'undefined') {
  window.MODULLER = MODULLER;
  window.SINIFLAR = SINIFLAR;
  window.DERSLER = DERSLER;
  window.KONULAR = KONULAR;
  window.KONU_DURUMLARI = KONU_DURUMLARI;
  window.GOREV_DURUMLARI = GOREV_DURUMLARI;
  window.EXCEL_OGRENCI_SABLONU = EXCEL_OGRENCI_SABLONU;
}
