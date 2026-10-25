/**
 * Plantrack — js/data.js
 * Modüller, Sınıflar, Dersler, Konular ve Sistem Sabitleri
 */

const MODULLER = [
  { id: 'ara-sinif', ad: 'Ara Sınıflar', kisaltma: 'ARA', siniflar: ['5', '6', '7', '9', '10', '11'] },
  { id: 'lgs',       ad: 'LGS Hazırlık', kisaltma: 'LGS', siniflar: ['8'] },
  { id: 'yks',       ad: 'TYT-AYT',      kisaltma: 'YKS', siniflar: ['12', 'mezun'] }
];

const SINIFLAR = [
  { deger: '5',     label: '5. Sınıf',  modulId: 'ara-sinif' },
  { deger: '6',     label: '6. Sınıf',  modulId: 'ara-sinif' },
  { deger: '7',     label: '7. Sınıf',  modulId: 'ara-sinif' },
  { deger: '8',     label: '8. Sınıf',  modulId: 'lgs' },
  { deger: '9',     label: '9. Sınıf',  modulId: 'ara-sinif' },
  { deger: '10',    label: '10. Sınıf', modulId: 'ara-sinif' },
  { deger: '11',    label: '11. Sınıf', modulId: 'ara-sinif' },
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

const HATA_TURLERI = [
  { id: 'Bilgi Eksikliği',   label: 'Bilgi Eksikliği',   renk: 'rose'   },
  { id: 'Dikkat Hatası',     label: 'Dikkat Hatası',     renk: 'amber'  },
  { id: 'Soru Kökü/Anlama',  label: 'Soru Kökü/Anlama',  renk: 'blue'   },
  { id: 'Süre/Yetişmedi',    label: 'Süre/Yetişmedi',    renk: 'purple' }
];

const ZAMAN_KATEGORILER = [
  { id: 'okul',    label: 'Okul / Ders',        renk: '#3b82f6', bg: '#eff6ff' },
  { id: 'soru',    label: 'Soru Çözümü',         renk: '#10b981', bg: '#ecfdf5' },
  { id: 'konu',    label: 'Konu Çalışması',       renk: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'deneme',  label: 'Deneme Sınavı',        renk: '#f59e0b', bg: '#fffbeb' },
  { id: 'mola',    label: 'Mola / Serbest Zaman', renk: '#6b7280', bg: '#f9fafb' },
  { id: 'ozel',    label: 'Özel Not',             renk: '#0d9488', bg: '#f0fdfa' },
  { id: 'silgi',   label: 'Silgi (Temizle)',       renk: null,      bg: null      }
];

// G14: Kapsamlı Faaliyet Kütüphanesi (Örnek Rutin Başlıkları Dahil)
const ZAMAN_FAALIYETLER = [
  {
    grupKey: 'akademik',
    grupBaslik: 'A. Akademik, Soru Çözümü ve Sınav Hazırlığı',
    ikon: 'graduation-cap',
    items: [
      { id: 'okul', label: 'Okul / Ders', aciklama: 'Örgün eğitim saatleri', renk: '#2563eb', bg: '#eff6ff', ikon: 'school' },
      { id: 'konu-calismasi', label: 'Konu Çalışması & Özet Çıkarma', aciklama: 'Yeni konu öğrenimi ve kavrama', renk: '#7c3aed', bg: '#f5f3ff', ikon: 'book-open' },
      { id: 'eksik-konu', label: 'Eksik Konu Çalışması', aciklama: 'Eksik kapatma ve konu tamamlama', renk: '#4f46e5', bg: '#eef2ff', ikon: 'file-check' },
      { id: 'soru-cozumu', label: 'Soru Çözümü', aciklama: 'Bireysel kazanım ve test çözümü', renk: '#059669', bg: '#ecfdf5', ikon: 'pencil' },
      { id: 'brans-sorulari', label: 'Branş Soruları', aciklama: 'Derse özel odaklı soru çözümü', renk: '#10b981', bg: '#f0fdf4', ikon: 'layers' },
      { id: 'aksam-soru-bankasi', label: 'Akşam Soru Bankası / Akşam Seansı', aciklama: 'Gün sonu pekiştirme ve soru bankası taraması', renk: '#0d9488', bg: '#f0fdfa', ikon: 'moon' },
      { id: 'karma-soru', label: 'Karma Soru Çözümü / Pekiştirme', aciklama: 'Farklı derslerden karma testler', renk: '#0891b2', bg: '#ecfeff', ikon: 'shuffle' },
      { id: 'deneme-sinavi', label: 'Deneme Sınavı', aciklama: 'Tam kapsamlı genel deneme veya branş denemesi', renk: '#d97706', bg: '#fffbeb', ikon: 'award' },
      { id: 'deneme-analizi', label: 'Deneme Analizi & Hata Defteri', aciklama: 'Sınav yanlışlarının analizi ve telafi çalışması', renk: '#e11d48', bg: '#fff1f2', ikon: 'clipboard-check' },
      { id: 'haftalik-tekrar', label: 'Haftalık Genel Tekrar', aciklama: 'Hafta sonu genel konu ve soru tekrarı', renk: '#9333ea', bg: '#faf5ff', ikon: 'repeat' },
      { id: 'paragraf-problem', label: 'Paragraf & Problem Rutini', aciklama: 'Günlük disiplin odaklı soru bloğu', renk: '#0284c7', bg: '#f0f9ff', ikon: 'target' },
      { id: 'ozel-ders-etut', label: 'Özel Ders / Kurs / Etüt', aciklama: 'Destekleyici dış ders ve etüt saatleri', renk: '#1d4ed8', bg: '#eff6ff', ikon: 'graduation-cap' }
    ]
  },
  {
    grupKey: 'kisisel',
    grupBaslik: 'B. Kişisel Gelişim ve Rutinler',
    ikon: 'sparkles',
    items: [
      { id: 'kitap-okuma', label: 'Kitap Okuma', aciklama: 'Günlük okuma ve anlama zamanı', renk: '#b45309', bg: '#fef3c7', ikon: 'bookmark' },
      { id: 'yabanci-dil', label: 'Yabancı Dil / Kelime Pratiği', aciklama: 'Düzenli dil çalışması', renk: '#475569', bg: '#f1f5f9', ikon: 'languages' },
      { id: 'proje-odev', label: 'Proje, Ödev ve Sunum Hazırlığı', aciklama: 'Okul görevleri ve performans ödevleri', renk: '#6366f1', bg: '#e0e7ff', ikon: 'briefcase' }
    ]
  },
  {
    grupKey: 'yasam',
    grupBaslik: 'C. Yaşam, Dinlenme ve Denge',
    ikon: 'heart',
    items: [
      { id: 'dinlenme-mola', label: 'Dinlenme / Mola', aciklama: 'Bloklar arası zihinsel dinlenme', renk: '#64748b', bg: '#f8fafc', ikon: 'coffee' },
      { id: 'serbest-zaman', label: 'Serbest Zaman & Hobi', aciklama: 'Bireysel ilgi alanları ve dinlendirici aktiviteler', renk: '#c026d3', bg: '#fdf4ff', ikon: 'smile' },
      { id: 'spor-egzersiz', label: 'Spor / Egzersiz', aciklama: 'Fiziksel aktivite ve yürüyüş', renk: '#ea580c', bg: '#fff7ed', ikon: 'activity' },
      { id: 'yemek-aile', label: 'Yemek & Aile Zamanı', aciklama: 'Günlük yaşam rutinleri', renk: '#ca8a04', bg: '#fefce8', ikon: 'utensils' },
      { id: 'uyku-dinlenme', label: 'Uyku / Gece Dinlenmesi', aciklama: 'Düzenli uyku saatleri', renk: '#334155', bg: '#f1f5f9', ikon: 'cloud-moon' }
    ]
  }
];

const ZAMAN_FAALIYETLER_FLAT = ZAMAN_FAALIYETLER.flatMap(g => g.items);

// G14: 06:00 – 24:00 Arası 30 Dakikalık Zaman Çözünürlüğü (36 Dilim)
const ZAMAN_SLOTLARI = [];
for (let h = 6; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  const nextH = String(h + 1).padStart(2, '0');
  ZAMAN_SLOTLARI.push({
    slotIdx: ZAMAN_SLOTLARI.length,
    slotKey: `${hh}:00`,
    startStr: `${hh}:00`,
    endStr: `${hh}:30`,
    label: `${hh}:00 – ${hh}:30`,
    isHourStart: true,
    hourLabel: `${hh}:00`
  });
  ZAMAN_SLOTLARI.push({
    slotIdx: ZAMAN_SLOTLARI.length,
    slotKey: `${hh}:30`,
    startStr: `${hh}:30`,
    endStr: `${nextH}:00`,
    label: `${hh}:30 – ${nextH}:00`,
    isHourStart: false,
    hourLabel: `${hh}:30`
  });
}

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
// DERSLER (Standart LGS & TYT-AYT Dersleri)
// ─────────────────────────────────────────────────────────────
const DERSLER = [
  {
    "id": "drs-lgs-turkce",
    "ad": "Türkçe",
    "kisaltma": "TÜR",
    "modulId": "lgs",
    "sinif": "8",
    "renk": "#3b82f6",
    "ikon": "book-open",
    "sinavdaMi": true,
    "soruSayisi": 20
  },
  {
    "id": "drs-lgs-matematik",
    "ad": "Matematik",
    "kisaltma": "MAT",
    "modulId": "lgs",
    "sinif": "8",
    "renk": "#ef4444",
    "ikon": "calculator",
    "sinavdaMi": true,
    "soruSayisi": 20
  },
  {
    "id": "drs-lgs-fen",
    "ad": "Fen Bilimleri",
    "kisaltma": "FEN",
    "modulId": "lgs",
    "sinif": "8",
    "renk": "#10b981",
    "ikon": "flask-conical",
    "sinavdaMi": true,
    "soruSayisi": 20
  },
  {
    "id": "drs-lgs-inkilap",
    "ad": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "kisaltma": "İNK",
    "modulId": "lgs",
    "sinif": "8",
    "renk": "#f59e0b",
    "ikon": "landmark",
    "sinavdaMi": true,
    "soruSayisi": 10
  },
  {
    "id": "drs-lgs-din",
    "ad": "Din Kültürü ve Ahlak Bilgisi",
    "kisaltma": "DİN",
    "modulId": "lgs",
    "sinif": "8",
    "renk": "#06b6d4",
    "ikon": "sun",
    "sinavdaMi": true,
    "soruSayisi": 10
  },
  {
    "id": "drs-lgs-ingilizce",
    "ad": "Yabancı Dil (İngilizce)",
    "kisaltma": "İNG",
    "modulId": "lgs",
    "sinif": "8",
    "renk": "#8b5cf6",
    "ikon": "languages",
    "sinavdaMi": true,
    "soruSayisi": 10
  },
  {
    "id": "drs-tyt-turkce",
    "ad": "TYT Türkçe",
    "kisaltma": "T-TÜR",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#3b82f6",
    "ikon": "book-open",
    "sinavdaMi": true,
    "soruSayisi": 40
  },
  {
    "id": "drs-tyt-matematik",
    "ad": "TYT Matematik",
    "kisaltma": "T-MAT",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#ef4444",
    "ikon": "calculator",
    "sinavdaMi": true,
    "soruSayisi": 30
  },
  {
    "id": "drs-tyt-geometri",
    "ad": "TYT Geometri",
    "kisaltma": "T-GEO",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#ec4899",
    "ikon": "shapes",
    "sinavdaMi": true,
    "soruSayisi": 10
  },
  {
    "id": "drs-tyt-fizik",
    "ad": "TYT Fizik",
    "kisaltma": "T-FİZ",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#6366f1",
    "ikon": "atom",
    "sinavdaMi": true,
    "soruSayisi": 7
  },
  {
    "id": "drs-tyt-kimya",
    "ad": "TYT Kimya",
    "kisaltma": "T-KİM",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#14b8a6",
    "ikon": "test-tube",
    "sinavdaMi": true,
    "soruSayisi": 7
  },
  {
    "id": "drs-tyt-biyoloji",
    "ad": "TYT Biyoloji",
    "kisaltma": "T-BİY",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#10b981",
    "ikon": "dna",
    "sinavdaMi": true,
    "soruSayisi": 6
  },
  {
    "id": "drs-tyt-tarih",
    "ad": "TYT Tarih",
    "kisaltma": "T-TAR",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#f59e0b",
    "ikon": "landmark",
    "sinavdaMi": true,
    "soruSayisi": 5
  },
  {
    "id": "drs-tyt-cografya",
    "ad": "TYT Coğrafya",
    "kisaltma": "T-COĞ",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#84cc16",
    "ikon": "globe",
    "sinavdaMi": true,
    "soruSayisi": 5
  },
  {
    "id": "drs-tyt-felsefe",
    "ad": "TYT Felsefe",
    "kisaltma": "T-FEL",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#a855f7",
    "ikon": "brain",
    "sinavdaMi": true,
    "soruSayisi": 5
  },
  {
    "id": "drs-tyt-din",
    "ad": "TYT Din Kültürü",
    "kisaltma": "T-DİN",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#06b6d4",
    "ikon": "sun",
    "sinavdaMi": true,
    "soruSayisi": 5
  },
  {
    "id": "drs-ayt-matematik",
    "ad": "AYT Matematik",
    "kisaltma": "A-MAT",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#dc2626",
    "ikon": "calculator",
    "sinavdaMi": true,
    "soruSayisi": 30
  },
  {
    "id": "drs-ayt-geometri",
    "ad": "AYT Geometri",
    "kisaltma": "A-GEO",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#db2777",
    "ikon": "shapes",
    "sinavdaMi": true,
    "soruSayisi": 10
  },
  {
    "id": "drs-ayt-fizik",
    "ad": "AYT Fizik",
    "kisaltma": "A-FİZ",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#4f46e5",
    "ikon": "atom",
    "sinavdaMi": true,
    "soruSayisi": 14
  },
  {
    "id": "drs-ayt-kimya",
    "ad": "AYT Kimya",
    "kisaltma": "A-KİM",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#0d9488",
    "ikon": "test-tube",
    "sinavdaMi": true,
    "soruSayisi": 13
  },
  {
    "id": "drs-ayt-biyoloji",
    "ad": "AYT Biyoloji",
    "kisaltma": "A-BİY",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#059669",
    "ikon": "dna",
    "sinavdaMi": true,
    "soruSayisi": 13
  },
  {
    "id": "drs-ayt-edebiyat",
    "ad": "AYT Türk Dili ve Edebiyatı",
    "kisaltma": "A-EDB",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#2563eb",
    "ikon": "feather",
    "sinavdaMi": true,
    "soruSayisi": 24
  },
  {
    "id": "drs-ayt-tarih1",
    "ad": "AYT Tarih-1",
    "kisaltma": "A-TR1",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#d97706",
    "ikon": "landmark",
    "sinavdaMi": true,
    "soruSayisi": 10
  },
  {
    "id": "drs-ayt-cografya1",
    "ad": "AYT Coğrafya-1",
    "kisaltma": "A-CG1",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#65a30d",
    "ikon": "globe",
    "sinavdaMi": true,
    "soruSayisi": 6
  },
  {
    "id": "drs-ayt-tarih2",
    "ad": "AYT Tarih-2",
    "kisaltma": "A-TR2",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#b45309",
    "ikon": "landmark",
    "sinavdaMi": true,
    "soruSayisi": 11
  },
  {
    "id": "drs-ayt-cografya2",
    "ad": "AYT Coğrafya-2",
    "kisaltma": "A-CG2",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#4d7c0f",
    "ikon": "globe",
    "sinavdaMi": true,
    "soruSayisi": 11
  },
  {
    "id": "drs-ayt-felsefe",
    "ad": "AYT Felsefe Grubu",
    "kisaltma": "A-FEL",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#9333ea",
    "ikon": "brain",
    "sinavdaMi": true,
    "soruSayisi": 12
  },
  {
    "id": "drs-ayt-din",
    "ad": "AYT Din Kültürü",
    "kisaltma": "A-DİN",
    "modulId": "yks",
    "sinif": "ortak",
    "renk": "#0891b2",
    "ikon": "sun",
    "sinavdaMi": true,
    "soruSayisi": 6
  }
];

// ─────────────────────────────────────────────────────────────
// KONULAR
// ─────────────────────────────────────────────────────────────
const KONULAR = [
  {
    "id": "kon-lgs-tur-1",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 1,
    "konuAdi": "Fiilimsiler",
    "kazanimlar": [
      "Fiilimsilerin cümledeki işlevlerini fark eder.",
      "İsim-fiil, sıfat-fiil ve zarf-fiil eklerini ve kullanım özelliklerini belirler.",
      "İsim-Fiil (Mastar)",
      "Sıfat-Fiil (Ortaç)",
      "Zarf-Fiil (Ulaç)",
      "Fiilimsilerle kurulan söz öbekleri"
    ],
    "aciklama": "İsim-fiil, sıfat-fiil, zarf-fiil ekleri ve görevleri"
  },
  {
    "id": "kon-lgs-tur-2",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Anlam Bilgisi",
    "siraNo": 2,
    "konuAdi": "Sözcük ve Söz Gruplarında Anlam",
    "kazanimlar": [
      "Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.",
      "Deyim, atasözü ve özdeyişlerin metne katkısını belirler.",
      "Söz sanatlarını (benzetme, kişileştirme, tezat, abartma) tespit eder.",
      "Kelimede (Sözcükte) Anlam",
      "Deyim ve Atasözü",
      "Gerçek, Mecaz ve Terim Anlam",
      "Söz Gruplarında Anlam"
    ],
    "aciklama": "Kelimede anlam, deyimler, atasözleri ve söz sanatları"
  },
  {
    "id": "kon-lgs-tur-3",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Anlam Bilgisi",
    "siraNo": 3,
    "konuAdi": "Cümlede Anlam & Cümlenin Ögeleri",
    "kazanimlar": [
      "Cümlenin ögelerini (özne, yüklem, nesne, yer tamlayıcısı, zarf tamlayıcısı) ayırt eder.",
      "Cümle Anlamı",
      "Cümle Yorumu",
      "Örtülü Anlam",
      "Neden-sonuç, amaç-sonuç, koşul-sonuç cümlelerini analiz eder.",
      "Öznel ve Nesnel Yargılar",
      "Cümlenin Ögeleri"
    ],
    "aciklama": "Cümlede anlam ilişkileri ve öge dizilimi"
  },
  {
    "id": "kon-lgs-tur-4",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 4,
    "konuAdi": "Fiilde Çatı",
    "kazanimlar": [
      "Fiillerin çatı özelliklerinin anlama olan katkısını değerlendirir.",
      "Öznesine ve nesnesine göre fiil çatılarını belirler.",
      "Etken ve Edilgen Fiiller",
      "Geçişli ve Geçişsiz Fiiller",
      "Dönüşlü ve İşteş Fiiller"
    ],
    "aciklama": "Özne ve nesnesine göre fiil çatıları"
  },
  {
    "id": "kon-lgs-tur-5",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 5,
    "konuAdi": "Cümle Türleri",
    "kazanimlar": [
      "Cümle türlerini yapısına, anlamına, yüklemin türüne ve yerine göre sınıflandırır.",
      "Tek Yüklemli Cümle (Basit)",
      "Fiilimsi Bulunan Cümle (Birleşik)",
      "Birden Çok Yüklemli Cümle (Sıralı)",
      "Bağlacı Olan Cümle (Bağlı)",
      "İsim ve Fiil Cümlesi",
      "Kurallı ve Devrik Cümle"
    ],
    "aciklama": "Yapısına, anlamına ve yüklemine göre cümleler"
  },
  {
    "id": "kon-lgs-tur-6",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Paragraf ve Muhakeme",
    "siraNo": 6,
    "konuAdi": "Paragrafta Anlam & Sözel Mantık",
    "kazanimlar": [
      "Metnin ana fikrini / ana duygusunu belirler.",
      "Metindeki yardımcı fikirleri ve çıkarımları tespit eder.",
      "Okudukları ile ilgili çıkarımlarda bulunur.",
      "Tablo, grafik ve görsel yorumlama; sözel mantık ve muhakeme sorularını çözer.",
      "Paragrafta Yapı ve Akışı Bozan Cümle",
      "Paragraf Bölme ve Cümle Yerleştirme",
      "Sözel Mantık ve Muhakeme"
    ],
    "aciklama": "Paragraf analizi, görsel okuma ve sözel mantık"
  },
  {
    "id": "kon-lgs-tur-7",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Yazım ve Noktalama",
    "siraNo": 7,
    "konuAdi": "Yazım Kuralları ve Noktalama İşaretleri",
    "kazanimlar": [
      "Noktalama işaretlerini işlevlerine uygun olarak kullanır.",
      "Yazım kurallarını (büyük harfler, de/da ve ki yazımı vb.) kavrar ve uygular.",
      "Büyük Harflerin Yazımı",
      "de/da, ki ve mi Yazımı",
      "Sayıların ve Kısaltmaların Yazımı",
      "Nokta, Virgül, Noktalı Virgül, İki Nokta, Kesme İşareti"
    ],
    "aciklama": "TDK kuralları, yazım ve noktalama uygulamaları"
  },
  {
    "id": "kon-lgs-tur-8",
    "dersId": "drs-lgs-turkce",
    "dersAdi": "Türkçe",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Metin Türleri",
    "siraNo": 8,
    "konuAdi": "Metin Türleri",
    "kazanimlar": [
      "Olay, düşünce ve bildirme yazılarını (fıkra, makale, deneme, söyleşi, anı, gezi yazısı) ayırt eder.",
      "Fıkra (Köşe Yazısı)",
      "Makale",
      "Deneme",
      "Söyleşi (Sohbet)",
      "Anı (Hatıra)",
      "Gezi Yazısı",
      "Biyografi ve Otobiyografi"
    ],
    "aciklama": "Olay, düşünce ve bilgilendirici metin türleri"
  },
  {
    "id": "kon-lgs-mat-1",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Sayılar ve İşlemler",
    "siraNo": 1,
    "konuAdi": "Çarpanlar ve Katlar",
    "kazanimlar": [
      "Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur, üslü ifadelerle yazar.",
      "İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar, ilgili problemleri çözer.",
      "Verilen iki doğal sayının aralarında asal olup olmadığını belirler.",
      "Pozitif tam sayı çarpanları",
      "EBOB - EKOK problemleri",
      "Aralarında asal sayılar"
    ],
    "aciklama": "Asal çarpanlar, EBOB-EKOK ve aralarında asallık"
  },
  {
    "id": "kon-lgs-mat-2",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Sayılar ve İşlemler",
    "siraNo": 2,
    "konuAdi": "Üslü İfadeler",
    "kazanimlar": [
      "Tam sayıların, tam sayı kuvvetlerini hesaplar.",
      "Üslü ifadelerle ilgili temel kuralları anlar, aynı veya farklı tabandaki ifadelerle çarpma ve bölme yapar.",
      "Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır.",
      "Üslü ifadelerde çarpma ve bölme",
      "Ondalık gösterimleri 10'un kuvvetleriyle çözümleme",
      "Bilimsel gösterim"
    ],
    "aciklama": "Üslü sayılarla işlemler ve bilimsel gösterim"
  },
  {
    "id": "kon-lgs-mat-3",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Sayılar ve İşlemler",
    "siraNo": 3,
    "konuAdi": "Kareköklü İfadeler",
    "kazanimlar": [
      "Tam kare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler.",
      "Tam kare olmayan sayıların karekök değerlerinin hangi iki doğal sayı arasında olduğunu belirler.",
      "Kareköklü bir ifadeyi a√b şeklinde yazar ve kareköklü ifadelerde dört işlem yapar.",
      "Kareköklü ifadelerde toplama ve çıkarma",
      "Kareköklü ifadelerde çarpma ve bölme",
      "Ondalık ifadelerin karekökleri",
      "Gerçek sayılar (rasyonel ve irrasyonel sayılar)"
    ],
    "aciklama": "Tam kare sayılar, kareköklü işlemler ve gerçek sayılar"
  },
  {
    "id": "kon-lgs-mat-4",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Veri İşleme",
    "siraNo": 4,
    "konuAdi": "Veri Analizi",
    "kazanimlar": [
      "En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar.",
      "Verileri sütun, daire veya çizgi grafiği ile gösterir ve bu gösterimler arasında uygun dönüşümleri yapar.",
      "Daire grafiği oluşturma ve yorumlama",
      "Çizgi ve sütun grafikleri",
      "Grafikler arası dönüşüm problemleri"
    ],
    "aciklama": "Çizgi, sütun, daire grafiği yorumlama ve dönüşüm"
  },
  {
    "id": "kon-lgs-mat-5",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Olasılık",
    "siraNo": 5,
    "konuAdi": "Basit Olayların Olasılığı",
    "kazanimlar": [
      "Bir olaya ait olası durumları belirler; \"daha fazla\", \"eşit\", \"daha az\" olasılıklı durumları ayırt eder.",
      "Basit bir olayın olma olasılığını hesaplar.",
      "Olası durumların sayısı",
      "Kesin olay ve imkânsız olay",
      "Basit olayların olasılık değeri (0 ile 1 arası)"
    ],
    "aciklama": "Olasılık hesaplama ve olay çeşitleri"
  },
  {
    "id": "kon-lgs-mat-6",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Cebir",
    "siraNo": 6,
    "konuAdi": "Cebirsel İfadeler ve Özdeşlikler",
    "kazanimlar": [
      "Basit cebirsel ifadeleri anlar, çarpar ve modeller.",
      "Özdeşlikleri (iki kare farkı, tam kare) modellerle açıklar.",
      "Cebirsel ifadeleri çarpanlarına ayırır.",
      "Cebirsel ifadelerin çarpımı",
      "İki kare farkı özdeşliği",
      "Tam kare özdeşlikler (a+b)² ve (a-b)²",
      "Ortak çarpan parantezine alma"
    ],
    "aciklama": "Cebirsel modelleme, özdeşlikler ve çarpanlara ayırma"
  },
  {
    "id": "kon-lgs-mat-7",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Denklemler",
    "siraNo": 7,
    "konuAdi": "Doğrusal Denklemler",
    "kazanimlar": [
      "Birinci dereceden bir bilinmeyenli denklemleri çözer.",
      "Koordinat sistemini özellikleriyle tanır ve sıralı ikilileri gösterir.",
      "Doğrusal denklemlerin grafiğini çizer; doğrunun eğimini modellerle açıklar.",
      "Birinci dereceden bir bilinmeyenli denklemler",
      "Koordinat sistemi ve sıralı ikililer",
      "Doğrusal denklem grafiği çizimi",
      "Eğim kavramı ve formülü"
    ],
    "aciklama": "Doğrusal ilişkiler, koordinat sistemi ve eğim"
  },
  {
    "id": "kon-lgs-mat-8",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Eşitsizlikler",
    "siraNo": 8,
    "konuAdi": "Eşitsizlikler",
    "kazanimlar": [
      "Birinci dereceden bir bilinmeyenli eşitsizlik içeren durumları ifade eder ve sayı doğrusunda gösterir.",
      "Birinci dereceden bir bilinmeyenli eşitsizlikleri çözer.",
      "Eşitsizlik kurma problemleri",
      "Sayı doğrusunda eşitsizlik çözümü"
    ],
    "aciklama": "Birinci dereceden eşitsizlikler ve çözümleri"
  },
  {
    "id": "kon-lgs-mat-9",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Geometri",
    "siraNo": 9,
    "konuAdi": "Üçgenler & Pisagor",
    "kazanimlar": [
      "Üçgende kenarortay, açıortay ve yüksekliği inşa eder.",
      "Üçgen eşitsizliğini ve açı-kenar bağıntılarını belirler.",
      "Pisagor bağıntısını oluşturur ve problemlerde uygular.",
      "Üçgende yardımcı elemanlar",
      "Üçgen eşitsizliği (a-b < c < a+b)",
      "Açı-kenar bağıntıları",
      "Pisagor teoremi (a² + b² = c²)"
    ],
    "aciklama": "Üçgen elemanları, bağıntılar ve Pisagor teoremi"
  },
  {
    "id": "kon-lgs-mat-10",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Geometri",
    "siraNo": 10,
    "konuAdi": "Eşlik ve Benzerlik",
    "kazanimlar": [
      "Eş ve benzer çokgenlerin kenar ve açı ilişkilerini belirler; benzerlik oranını hesaplar.",
      "Eş çokgenler ve eş üçgenler",
      "Benzerlik teoremleri ve benzerlik oranı (k)",
      "Benzerlik problemlerinin çözümü"
    ],
    "aciklama": "Çokgenlerde ve üçgenlerde eşlik/benzerlik"
  },
  {
    "id": "kon-lgs-mat-11",
    "dersId": "drs-lgs-matematik",
    "dersAdi": "Matematik",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 6,
    "uniteAdi": "Geometri ve Cisimler",
    "siraNo": 11,
    "konuAdi": "Dönüşüm Geometrisi ve Geometrik Cisimler",
    "kazanimlar": [
      "Nokta ve şekillerin öteleme ve yansıma altındaki görüntülerini çizer.",
      "Dik dairesel silindir, piramit ve koninin temel elemanlarını, açınımını ve yüzey alan/hacim bağıntılarını inceler.",
      "Öteleme ve yansıma dönüşümleri",
      "Dik dairesel silindirin açınımı ve alanı/hacmi",
      "Piramit ve dik koni elemanları"
    ],
    "aciklama": "Öteleme, yansıma, silindir, piramit ve koni"
  },
  {
    "id": "kon-lgs-fen-1",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Dünya ve Evren",
    "siraNo": 1,
    "konuAdi": "Mevsimler ve İklim",
    "kazanimlar": [
      "Mevsimlerin oluşumuna yönelik tahminlerde bulunur.",
      "İklim ve hava olayları arasındaki farkı açıklar.",
      "İklim biliminin (klimatoloji) bir bilim dalı olduğunu ve bu alanda çalışan uzmanları tanır.",
      "Küresel iklim değişikliklerinin nedenlerini ve olası sonuçlarını tartışır.",
      "Dünya'nın dönme ekseni eğikliği ve dolanma hareketi",
      "Hava olayları (rüzgar, yağmur, kar, dolu, kırağı, sis)",
      "Sera gazları ve küresel ısınma"
    ],
    "aciklama": "Mevsimlerin oluşumu, iklim ve hava olayları"
  },
  {
    "id": "kon-lgs-fen-2",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Canlılar ve Yaşam",
    "siraNo": 2,
    "konuAdi": "DNA ve Genetik Kod",
    "kazanimlar": [
      "Nükleotid, gen, DNA ve kromozom kavramlarını açıklayarak bu kavramlar arasında ilişki kurar.",
      "DNA'nın yapısını model üzerinde gösterir ve DNA'nın kendini nasıl eşlediğini açıklar.",
      "Kromozom, DNA, gen, nükleotid hiyerarşisi",
      "Adenin, Timin, Guanin, Sitozin bazları",
      "DNA replikasyonu ve onarımı"
    ],
    "aciklama": "DNA molekül yapısı ve kendini eşlemesi"
  },
  {
    "id": "kon-lgs-fen-3",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Canlılar ve Yaşam",
    "siraNo": 3,
    "konuAdi": "Kalıtım ve Biyoteknoloji",
    "kazanimlar": [
      "Kalıtım ile ilgili kavramları (genotip, fenotip, saf döl, melez döl) tanımlar ve tek karakter çaprazlamaları yapar.",
      "Mutasyon, modifikasyon ve adaptasyon kavramlarını örneklerle açıklar ve farklarını ayırt eder.",
      "Genetik mühendisliği ve biyoteknolojinin uygulama alanlarını ve olası etkilerini tartışır.",
      "Mendel ilkeleri ve çaprazlama",
      "İnsanda cinsiyetin belirlenmesi ve akraba evliliği",
      "Mutasyon ve modifikasyon farkı",
      "Adaptasyon ve doğal seçilim",
      "Biyoteknolojik uygulamalar ve klonlama"
    ],
    "aciklama": "Genetik çaprazlamalar, adaptasyon ve biyoteknoloji"
  },
  {
    "id": "kon-lgs-fen-4",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Fiziksel Olaylar",
    "siraNo": 4,
    "konuAdi": "Basınç",
    "kazanimlar": [
      "Katı, sıvı ve gaz basıncını etkileyen değişkenleri deneyerek keşfeder ve günlük yaşamdaki uygulamalarını (Pascal Prensibi vb.) açıklar.",
      "Katı basıncını etkileyen faktörler (ağırlık ve yüzey alanı)",
      "Sıvı basıncını etkileyen faktörler (derinlik ve yoğunluk)",
      "Pascal prensibi ve hidrolik sistemler",
      "Açık hava basıncı (Torricelli deneyi) ve kapalı kaplardaki gaz basıncı"
    ],
    "aciklama": "Katı, sıvı, gaz basıncı ve Pascal prensibi"
  },
  {
    "id": "kon-lgs-fen-5",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Madde ve Doğası",
    "siraNo": 5,
    "konuAdi": "Madde ve Endüstri",
    "kazanimlar": [
      "Periyodik sistemde elementlerin sınıflandırılmasını (metal, ametal, yarı metal, soygaz) açıklar.",
      "Fiziksel ve kimyasal değişim arasındaki farkları açıklar; kimyasal tepkime denklemlerini yorumlar ve kütlenin korunumunu kavrar.",
      "Periyodik tablo grup ve periyot özellikleri",
      "Metaller, ametaller, yarı metaller, soygazlar",
      "Fiziksel ve kimyasal değişimler",
      "Kimyasal tepkimeler ve kütlenin korunumu kanunu"
    ],
    "aciklama": "Periyodik sistem, kimyasal değişim ve tepkimeler"
  },
  {
    "id": "kon-lgs-fen-6",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Madde ve Doğası",
    "siraNo": 6,
    "konuAdi": "Asitler, Bazlar ve Isı",
    "kazanimlar": [
      "Asit ve bazların genel özelliklerini, pH cetvelini ve ayıraçları tanır.",
      "Asit yağmurlarının çevreye etkilerini değerlendirir.",
      "Maddenin ısı ile etkileşimini, öz ısı kavramını ve hâl değişim ısılarını hesaplar/yorumlar.",
      "Asit ve bazların pH aralıkları ve indikatörler",
      "Asit yağmurları ve çevre kirliliği",
      "Öz ısı (c) kavramı ve ısı-sıcaklık ilişkisi",
      "Erime, donma, buharlaşma, yoğuşma ısıları",
      "Isınma ve soğuma eğrileri"
    ],
    "aciklama": "pH dengesi, asit-bazlar, öz ısı ve hâl değişimi"
  },
  {
    "id": "kon-lgs-fen-7",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Fiziksel Olaylar",
    "siraNo": 7,
    "konuAdi": "Basit Makineler",
    "kazanimlar": [
      "Makaralar, kaldıraçlar, eğik düzlem, çıkrık gibi basit makinelerin kuvvet kazancı ve iş prensibini inceler.",
      "Sabit ve hareketli makaralar, palangalar",
      "Kaldıraç türleri (desteğin, yükün, kuvvetin ortada olduğu)",
      "Eğik düzlemde kuvvet kazancı",
      "Çıkrık, dişli çarklar, kasnaklar ve vida",
      "İşten ve enerjiden kazanç sağlanamaz kuralı"
    ],
    "aciklama": "Makaralar, kaldıraçlar, eğik düzlem ve kuvvet kazancı"
  },
  {
    "id": "kon-lgs-fen-8",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 6,
    "uniteAdi": "Canlılar ve Çevre",
    "siraNo": 8,
    "konuAdi": "Enerji Dönüşümleri ve Çevre Bilimi",
    "kazanimlar": [
      "Besin zincirinde üretici, tüketici ve ayrıştırıcı ilişkilerini kurar.",
      "Fotosentez ve solunum süreçlerini açıklar; madde döngüleri ve sürdürülebilir kalkınmayı analiz eder.",
      "Besin zinciri ve besin ağı",
      "Ekolojik piramit ve biyolojik birikim",
      "Fotosentez denklemi ve hızını etkileyen faktörler",
      "Oksijenli ve oksijensiz solunum",
      "Karbon, su, oksijen ve azot döngüsü"
    ],
    "aciklama": "Besin zinciri, fotosentez, solunum ve madde döngüleri"
  },
  {
    "id": "kon-lgs-fen-9",
    "dersId": "drs-lgs-fen",
    "dersAdi": "Fen Bilimleri",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 7,
    "uniteAdi": "Fiziksel Olaylar",
    "siraNo": 9,
    "konuAdi": "Elektrik Yükleri ve Elektrik Enerjisi",
    "kazanimlar": [
      "Cisimlerin elektriklenmesini (sürtünme, dokunma, etki) ve elektroskop mantığını kavrar; elektrik enerjisinin ısı ve ışığa dönüşümünü inceler.",
      "Sürtünme, dokunma ve etki ile elektriklenme",
      "Elektroskop çalışma prensibi",
      "Topraklama olayı",
      "Elektrik enerjisinin ısı, ışık ve hareket enerjisine dönüşümü",
      "Sigorta ve elektrik güvenliği"
    ],
    "aciklama": "Elektrostatik, elektroskop ve elektrik enerjisi dönüşümü"
  },
  {
    "id": "kon-lgs-ink-1",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Bir Kahraman Doğuyor",
    "siraNo": 1,
    "konuAdi": "Bir Kahraman Doğuyor",
    "kazanimlar": [
      "20. yüzyıl başlarında Osmanlı Devleti'nin durumunu ve Mustafa Kemal'in çocukluk/öğrenim hayatını kişilik özellikleriyle ilişkilendirir.",
      "Mustafa Kemal'in askerlik hayatı ile ilgili olayları ve fikir hayatını etkileyen unsurları analiz eder.",
      "Mustafa Kemal'in çocukluk ve öğrenim hayatından hareketle onun kişilik özelliklerinin oluşumunu kavrar.",
      "Mustafa Kemal'in askerlik hayatı ile ilgili olayları ve olguları onun kişilik özellikleri ile ilişkilendirir.",
      "Osmanlı Devleti'nin son dönemlerindeki fikir akımları (Osmanlıcılık, İslamcılık, Türkçülük, Batıcılık)",
      "Trablusgarp ve Balkan Savaşları"
    ],
    "aciklama": "Mustafa Kemal'in yetiştiği ortam, fikir hayatı ve ilk askeri başarıları"
  },
  {
    "id": "kon-lgs-ink-2",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Milli Uyanış",
    "siraNo": 2,
    "konuAdi": "Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar",
    "kazanimlar": [
      "1. Dünya Savaşı'nın nedenlerini ve Osmanlı'nın savaştığı cepheleri değerlendirir.",
      "Mondros Ateşkes Antlaşması ve Kuva-yı Milliye hareketini yorumlar; genelgeler ve kongreler sürecini açıklar.",
      "Avrupa'daki gelişmelerin yansımaları bağlamında Osmanlı Devleti'nin yirminci yüzyılın başlarındaki siyasi ve sosyal durumunu kavrar.",
      "1. Dünya Savaşı cepheleri (Çanakkale, Kafkas, Kanal vb.)",
      "Cemiyetler (Yararlı ve Zararlı Cemiyetler)",
      "Havza, Amasya Genelgeleri, Erzurum ve Sivas Kongresi",
      "Misak-ı Milli kararları ve BMM'nin açılışı"
    ],
    "aciklama": "1. Dünya Savaşı, Mondros, kongreler ve meclisin açılışı"
  },
  {
    "id": "kon-lgs-ink-3",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Milli Bir Destan",
    "siraNo": 3,
    "konuAdi": "Milli Bir Destan: Ya İstiklal Ya Ölüm!",
    "kazanimlar": [
      "Kurtuluş Savaşı cephelerindeki (Doğu, Güney, Batı) askeri ve siyasi gelişmeleri, Mudanya ve Lozan Barış Antlaşması'nı değerlendirir.",
      "Doğu ve Güney cephesi savaşları ve antlaşmaları (Gümrü, Ankara, Moskova)",
      "Batı cephesi: 1. ve 2. İnönü Muharebeleri",
      "Kütahya-Eskişehir Savaşları ve Tekalif-i Milliye Emirleri",
      "Sakarya Meydan Muharebesi ve Büyük Taarruz",
      "Mudanya Ateşkes Antlaşması ve Lozan Barış Antlaşması"
    ],
    "aciklama": "Kurtuluş Savaşı cepheleri, zaferler ve Lozan Antlaşması"
  },
  {
    "id": "kon-lgs-ink-4",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Atatürkçülük ve İnkılaplar",
    "siraNo": 4,
    "konuAdi": "Atatürkçülük ve Çağdaşlaşan Türkiye",
    "kazanimlar": [
      "Atatürk ilkelerini ve siyasi, hukuki, eğitim, toplumsal ve ekonomik alanda yapılan inkılapları açıklar.",
      "Atatürk İlkeleri (Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik, İnkılapçılık)",
      "Siyasi alanda inkılaplar (Saltanat ve Halifeliğin kaldırılması, Ankara'nın başkent oluşu)",
      "Hukuk alanında inkılaplar (Medeni Kanun)",
      "Eğitim ve kültür alanında inkılaplar (Tevhid-i Tedrisat, Harf İnkılabı, Türk Tarih ve Dil Kurumu)",
      "Toplumsal ve ekonomik alandaki gelişmeler (Kılık kıyafet, takvim, soyadı kanunu, İzmir İktisat Kongresi, Kabotaj Kanunu)"
    ],
    "aciklama": "Atatürk ilkeleri ve Türkiye'nin modernleşme adımları"
  },
  {
    "id": "kon-lgs-ink-5",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Demokratikleşme",
    "siraNo": 5,
    "konuAdi": "Demokratikleşme Çabaları",
    "kazanimlar": [
      "Çok partili hayata geçiş denemelerini ve cumhuriyete yönelik tehditleri değerlendirir.",
      "Cumhuriyet Halk Fırkası, Terakkiperver Cumhuriyet Fırkası, Serbest Cumhuriyet Fırkası",
      "Şeyh Sait İsyanı ve Menemen Olayı",
      "Mustafa Kemal'e suikast girişimi"
    ],
    "aciklama": "Çok partili rejim denemeleri ve rejime yönelik tepkiler"
  },
  {
    "id": "kon-lgs-ink-6",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 6,
    "uniteAdi": "Dış Politika",
    "siraNo": 6,
    "konuAdi": "Atatürk Dönemi Türk Dış Politikası",
    "kazanimlar": [
      "Türk dış politikasının temel ilkelerini ve Hatay sorunu, Boğazlar meselesi gibi gelişmeleri analiz eder.",
      "Yurtta sulh, cihanda sulh ilkesi",
      "Nüfus mübadelesi ve Musul meselesi",
      "Türkiye'nin Milletler Cemiyeti'ne girişi",
      "Balkan Antantı ve Sadabat Paktı",
      "Montrö Boğazlar Sözleşmesi",
      "Hatay'ın ana vatana katılması"
    ],
    "aciklama": "Dış politika ilkeleri, Boğazlar ve Hatay meselesi"
  },
  {
    "id": "kon-lgs-ink-7",
    "dersId": "drs-lgs-inkilap",
    "dersAdi": "T.C. İnkılap Tarihi ve Atatürkçülük",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 7,
    "uniteAdi": "Atatürk Sonrası Dönem",
    "siraNo": 7,
    "konuAdi": "Atatürk'ün Ölümü ve Sonrası",
    "kazanimlar": [
      "Atatürk'ün eserlerini, vefatını ve 2. Dünya Savaşı sürecinde Türkiye'nin tutumunu değerlendirir.",
      "Atatürk'ün vefatı ve dünya kamuoyundaki yankıları",
      "Nutuk ve Atatürk'ün diğer yazılı eserleri",
      "2. Dünya Savaşı'nda Türkiye'nin izlediği denge politikası",
      "Demokratik hayata kalıcı geçiş adımları"
    ],
    "aciklama": "Atatürk'ün mirası, 2. Dünya Savaşı ve çok partili hayat"
  },
  {
    "id": "kon-lgs-din-1",
    "dersId": "drs-lgs-din",
    "dersAdi": "Din Kültürü ve Ahlak Bilgisi",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Kader İnancı",
    "siraNo": 1,
    "konuAdi": "Kader İnancı",
    "kazanimlar": [
      "Kader ve kaza inancını ayet ve hadislerle açıklar.",
      "Kaza ve kader ile ilgili kavramları analiz eder.",
      "İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar.",
      "Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları (kader mahkumu, rızık, ecel vb.) sorgular.",
      "Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları sorgular.",
      "Hz. Musa'nın hayatını ve Ayet el-Kürsi'nin anlamını açıklar.",
      "Evrenin yasaları: Fiziksel, Biyolojik ve Toplumsal yasalar",
      "İnsanın iradesi (Küllî ve Cüz'î irade)",
      "Ömür, ecel, rızık, tevekkül, başarı ve sağlık kavramları"
    ],
    "aciklama": "Kaza ve kader inancı, evrensel yasalar ve tevekkül"
  },
  {
    "id": "kon-lgs-din-2",
    "dersId": "drs-lgs-din",
    "dersAdi": "Din Kültürü ve Ahlak Bilgisi",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Paylaşma ve Yardımlaşma",
    "siraNo": 2,
    "konuAdi": "Zekât ve Sadaka",
    "kazanimlar": [
      "İslam'ın paylaşma ve yardımlaşmaya verdiği önemi, zekât ve sadaka ibadetinin toplumsal faydalarını açıklar.",
      "İslam'ın paylaşma ve yardımlaşmaya verdiği önem",
      "Zekât ibadeti (nisap miktarı, oranlar ve kimlere verileceği)",
      "Sadaka çeşitleri: Fıtır sadakası (fitre) ve Sadaka-i cariye",
      "Zekât ve sadakanın bireysel ve toplumsal faydaları",
      "Hz. Şuayb'ın hayatı ve Maûn Suresi"
    ],
    "aciklama": "Zekât, sadaka ibadeti ve toplumsal dayanışma"
  },
  {
    "id": "kon-lgs-din-3",
    "dersId": "drs-lgs-din",
    "dersAdi": "Din Kültürü ve Ahlak Bilgisi",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Din ve Hayat",
    "siraNo": 3,
    "konuAdi": "Din ve Hayat",
    "kazanimlar": [
      "İslam dininin can, akıl, nesil, mal ve din emniyetini sağlama gayesini analiz eder.",
      "Dinin temel gayesi (Zarurat-ı Diniyye)",
      "Canın korunması",
      "Aklın korunması",
      "Neslin korunması",
      "Malın korunması",
      "Dinin korunması",
      "Hz. Yusuf'un hayatı ve Asr Suresi"
    ],
    "aciklama": "Dinin temel gayeleri ve can, mal, akıl emniyeti"
  },
  {
    "id": "kon-lgs-din-4",
    "dersId": "drs-lgs-din",
    "dersAdi": "Din Kültürü ve Ahlak Bilgisi",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Ahlaki Değerler",
    "siraNo": 4,
    "konuAdi": "Hz. Muhammed’in Doğruluğu ve Güvenilirliği",
    "kazanimlar": [
      "Hz. Muhammed’in istişareye verdiği önemi, merhametini, adaletini ve örnek şahsiyetini kavrar.",
      "Muhammedü'l-Emin sıfatı ve dürüstlüğü",
      "Hz. Muhammed'in merhametli ve affedici oluşu",
      "İstişareye (danışmaya) verdiği önem",
      "Hakkı gözetmedeki hassasiyeti ve cesareti",
      "Kureyş Suresi ve anlamı"
    ],
    "aciklama": "Peygamberimizin örnek ahlakı ve güvenilirliği"
  },
  {
    "id": "kon-lgs-din-5",
    "dersId": "drs-lgs-din",
    "dersAdi": "Din Kültürü ve Ahlak Bilgisi",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Kur'an-ı Kerim",
    "siraNo": 5,
    "konuAdi": "Kur’an-ı Kerim ve Özellikleri",
    "kazanimlar": [
      "İslam dininin ana kaynaklarını tanır ve Kur'an'ın temel eğitsel niteliklerini değerlendirir.",
      "İslam dininin ana kaynakları (Kur'an ve Sünnet)",
      "Kur'an-ı Kerim'in ana konuları (İnanç, İbadet, Ahlak, Muamelat, Kıssalar)",
      "Kur'an'ın yol göstericiliği ve akla verdiği önem"
    ],
    "aciklama": "Kur'an-ı Kerim'in ana konuları ve özellikleri"
  },
  {
    "id": "kon-lgs-ing-1",
    "dersId": "drs-lgs-ingilizce",
    "dersAdi": "Yabancı Dil (İngilizce)",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 1,
    "uniteAdi": "Unit 1",
    "siraNo": 1,
    "konuAdi": "Unit 1: Friendship",
    "kazanimlar": [
      "Accepting and refusing, apologizing, giving explanations and reasons.",
      "Personal traits, vocabulary related to true friendship.",
      "Making offers and invitations",
      "Traits of a good friend (honest, generous, supportive, reliable)"
    ],
    "aciklama": "Arkadaşlık ilişkileri, teklif yapma ve kabul/red"
  },
  {
    "id": "kon-lgs-ing-2",
    "dersId": "drs-lgs-ingilizce",
    "dersAdi": "Yabancı Dil (İngilizce)",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 2,
    "uniteAdi": "Unit 2",
    "siraNo": 2,
    "konuAdi": "Unit 2: Teen Life",
    "kazanimlar": [
      "Expressing preferences, talking about daily routines and leisure habits.",
      "Students will be able to ask questions related to the frequency of events.",
      "Students will be able to talk about arrangements and sequences.",
      "Students will be able to understand short and simple texts about teen life.",
      "Students will be able to understand the specific information in short texts.",
      "Teen Life (Expressing preferences)",
      "Daily routines, music and book genres"
    ],
    "aciklama": "Gençlerin günlük yaşamı, tercihler ve sıklık zarfları"
  },
  {
    "id": "kon-lgs-ing-3",
    "dersId": "drs-lgs-ingilizce",
    "dersAdi": "Yabancı Dil (İngilizce)",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 3,
    "uniteAdi": "Unit 3",
    "siraNo": 3,
    "konuAdi": "Unit 3: In the Kitchen",
    "kazanimlar": [
      "Describing a process, expressing steps of cooking, kitchen utensils and ingredients.",
      "Process sequencing: First, Second, Then, After that, Finally",
      "Cooking methods (boil, fry, roast, bake, steam)",
      "Kitchen tools and ingredients vocabulary"
    ],
    "aciklama": "Yemek tarifleri, mutfak araçları ve süreç sıralama"
  },
  {
    "id": "kon-lgs-ing-4",
    "dersId": "drs-lgs-ingilizce",
    "dersAdi": "Yabancı Dil (İngilizce)",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 4,
    "uniteAdi": "Unit 4",
    "siraNo": 4,
    "konuAdi": "Unit 4: On the Phone",
    "kazanimlar": [
      "Following phone conversations, making simple phone calls, taking phone messages.",
      "Telephone phrases (Hold on, Could you put me through, leave a message)",
      "Communication ways and technological history"
    ],
    "aciklama": "Telefon görüşmeleri ve iletişim ifadeleri"
  },
  {
    "id": "kon-lgs-ing-5",
    "dersId": "drs-lgs-ingilizce",
    "dersAdi": "Yabancı Dil (İngilizce)",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 5,
    "uniteAdi": "Unit 5",
    "siraNo": 5,
    "konuAdi": "Unit 5: The Internet",
    "kazanimlar": [
      "Accepting and refusing requests on the internet, talking about internet safety and habits.",
      "Internet terminology (log in, download, upload, attachment, browser)",
      "Internet safety rules and netiquette"
    ],
    "aciklama": "İnternet terimleri ve güvenli internet kullanımı"
  },
  {
    "id": "kon-lgs-ing-6",
    "dersId": "drs-lgs-ingilizce",
    "dersAdi": "Yabancı Dil (İngilizce)",
    "modulId": "lgs",
    "sinif": "8",
    "uniteNo": 6,
    "uniteAdi": "Unit 6-10",
    "siraNo": 6,
    "konuAdi": "Unit 6-10: Adventures, Tourism & Science",
    "kazanimlar": [
      "Unit 6: Adventures - Comparing extreme sports and activities, expressing preferences.",
      "Unit 7: Tourism - Talking about vacations, historical sites, attractions and weather.",
      "Unit 8: Chores - Expressing obligations and house responsibilities (must, have to).",
      "Unit 9: Science - Scientific achievements, inventions and laboratory actions.",
      "Unit 10: Natural Forces - Natural disasters, ecological problems and saving the planet."
    ],
    "aciklama": "Macera sporları, turizm, sorumluluklar, bilim ve doğa"
  },
  {
    "id": "kon-tyt-tur-1",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Anlam Bilgisi",
    "siraNo": 1,
    "konuAdi": "Sözcük ve Cümle Anlamı",
    "kazanimlar": [
      "Sözcükte Anlam, Söz Öbeklerinde Anlam, Gerçek, Mecaz, Terim ve Yan Anlam.",
      "Deyimler ve Atasözleri, İkilemeler.",
      "Cümlede Anlam, Cümle Yorumu, Kesin Yargı, Cümle Tamamlama ve Oluşturma.",
      "Neden-Sonuç, Amaç-Sonuç, Koşul Cümleleri",
      "Örtülü Anlam ve Doğrudan/Dolaylı Anlatım"
    ],
    "aciklama": "Kelime ve cümle düzeyinde anlam incelikleri"
  },
  {
    "id": "kon-tyt-tur-2",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Paragraf Bilgisi",
    "siraNo": 2,
    "konuAdi": "Paragraf Bilgisi",
    "kazanimlar": [
      "Paragrafta Ana Düşünce ve Konu, Paragrafta Yardımcı Düşünceler.",
      "Paragrafın Yapısı (Giriş, Gelişme, Sonuç, Akışı Bozan Cümle, Paragraf Bölme, Cümle Yerleştirme).",
      "Anlatım Teknikleri ve Düşünceyi Geliştirme Yolları.",
      "Diyalog Tamamlama ve Çoklu Paragraf Soruları"
    ],
    "aciklama": "Paragraf yapısı, ana/yardımcı düşünce ve anlatım teknikleri"
  },
  {
    "id": "kon-tyt-tur-3",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 3,
    "konuAdi": "Ses Bilgisi",
    "kazanimlar": [
      "Ünlü Düşmesi, Ünlü Daralması, Ünlü Türemesi.",
      "Ünsüz Benzeşmesi (Sertleşme), Ünsüz Yumuşaması, Ünsüz Düşmesi, Ünsüz Türemesi, Ulama.",
      "Büyük ve Küçük Ünlü Uyumu"
    ],
    "aciklama": "Türkçedeki ses olayları ve kuralları"
  },
  {
    "id": "kon-tyt-tur-4",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Yazım ve Noktalama",
    "siraNo": 4,
    "konuAdi": "Yazım Kuralları & Noktalama",
    "kazanimlar": [
      "Büyük Harflerin Yazımı, \"de/da\", \"ki\", \"mi\" Yazımı, Sayıların ve Kısaltmaların Yazımı.",
      "Nokta, Virgül, Noktalı Virgül, İki Nokta, Üç Nokta, Kesme İşareti ve Tırnak İşareti Kullanımı.",
      "Birleşik Sözcüklerin Yazımı"
    ],
    "aciklama": "TDK standart yazım ve noktalama kuralları"
  },
  {
    "id": "kon-tyt-tur-5",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 5,
    "konuAdi": "Sözcükte Yapı & Ekler",
    "kazanimlar": [
      "Kökler (İsim ve Fiil Kökü), Yapım Ekleri, Çekim Ekleri, Basit, Türemiş ve Birleşik Sözcükler.",
      "İsim Çekim Ekleri (Hâl, İyelik, Çokluk, İlgi)",
      "Fiil Çekim Ekleri (Kip ve Kişi Ekleri)"
    ],
    "aciklama": "Kök, gövde, ekler ve sözcük türetimi"
  },
  {
    "id": "kon-tyt-tur-6",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 6,
    "konuAdi": "Sözcük Türleri",
    "kazanimlar": [
      "İsim (Ad), Sıfat (Ön Ad), Zamir (Adıl), Zarf (Belirteç), Edat (İlgeç), Bağlaç, Ünlem, Eylemler (Fiiller), Ek Fiil.",
      "İsim Tamlamaları ve Sıfat Tamlamaları",
      "Fiilde Anlam Kayması ve Ek Eylem"
    ],
    "aciklama": "Ad ve eylem soylu sözcük türleri"
  },
  {
    "id": "kon-tyt-tur-7",
    "dersId": "drs-tyt-turkce",
    "dersAdi": "TYT Türkçe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Dil Bilgisi",
    "siraNo": 7,
    "konuAdi": "Cümle Bilgisi & Anlatım Bozukluğu",
    "kazanimlar": [
      "Cümlenin Ögeleri, Fiilde Çatı, Cümle Türleri (Basit, Birleşik, Sıralı, Bağlı), Anlatım Bozuklukları.",
      "Anlama Dayalı Anlatım Bozuklukları",
      "Dil Bilgisine Dayalı Anlatım Bozuklukları"
    ],
    "aciklama": "Cümle analizi, çatı özellikleri ve anlatım bozuklukları"
  },
  {
    "id": "kon-tyt-mat-1",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Temel Matematik",
    "siraNo": 1,
    "konuAdi": "Temel Kavramlar",
    "kazanimlar": [
      "Sayı Kümeleri (Doğal, Tam, Rasyonel, İrrasyonel, Gerçek Sayılar).",
      "Tek ve Çift Sayılar, Pozitif ve Negatif Sayılar, Ardışık Sayılar, Asal Sayılar ve Faktöriyel.",
      "Asal Çarpanlar ve Bölen Sayıları"
    ],
    "aciklama": "Sayı kümeleri ve temel aritmetik özellikler"
  },
  {
    "id": "kon-tyt-mat-2",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Temel Matematik",
    "siraNo": 2,
    "konuAdi": "Basamak Kavramı & Bölünebilme",
    "kazanimlar": [
      "Sayı Basamakları ve Çözümleme.",
      "Bölme ve Bölünebilme Kuralları (2, 3, 4, 5, 8, 9, 10, 11).",
      "Asal Çarpanlara Ayırma, EBOB ve EKOK Problemleri."
    ],
    "aciklama": "Basamak analizi, bölünebilme ve EBOB-EKOK"
  },
  {
    "id": "kon-tyt-mat-3",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Temel Matematik",
    "siraNo": 3,
    "konuAdi": "Rasyonel Sayılar & Basit Eşitsizlikler",
    "kazanimlar": [
      "Rasyonel Sayılarda Dört İşlem, Ondalık Sayılar, Devirli Ondalık Açılımlar.",
      "Gerçek Sayı Aralıkları, Eşitsizlik Özellikleri ve Çözüm Kümeleri.",
      "Sıralama ve Aralık İşlemleri"
    ],
    "aciklama": "Kesirler, ondalık sayılar ve birinci dereceden eşitsizlikler"
  },
  {
    "id": "kon-tyt-mat-4",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Temel Matematik",
    "siraNo": 4,
    "konuAdi": "Mutlak Değer",
    "kazanimlar": [
      "Mutlak Değerin Tanımı ve Geometrik Yorumu, Mutlak Değerli Denklem ve Eşitsizlikler.",
      "Mutlak Değer Özellikleri (|x.y| = |x|.|y| vb.)"
    ],
    "aciklama": "Mutlak değer özellikleri ve denklem/eşitsizlik çözümü"
  },
  {
    "id": "kon-tyt-mat-5",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Cebir",
    "siraNo": 5,
    "konuAdi": "Üslü ve Köklü Sayılar",
    "kazanimlar": [
      "Üslü İfadelerin Özellikleri ve Dört İşlem, Üslü Denklemler.",
      "Köklü İfadelerin Tanımı ve Özellikleri, Kök Dışına Çıkarma, Eşlenik ile Çarpma ve Köklü Denklemler."
    ],
    "aciklama": "Üs ve kök kuralları, eşlenik ve denklemler"
  },
  {
    "id": "kon-tyt-mat-6",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Cebir",
    "siraNo": 6,
    "konuAdi": "Çarpanlara Ayırma",
    "kazanimlar": [
      "Ortak Çarpan Parantezine Alma, Gruplandırma, Tam Kare ve İki Kare Farkı Özdeşlikleri, Küp Açılımları.",
      "Rasyonel İfadelerin Sadeleştirilmesi"
    ],
    "aciklama": "Özdeşlikler, çarpanlara ayırma yöntemleri ve sadeleştirme"
  },
  {
    "id": "kon-tyt-mat-7",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Problemler",
    "siraNo": 7,
    "konuAdi": "Problemler",
    "kazanimlar": [
      "Sayı ve Kesir Problemleri, Yaş Problemleri, İşçi Problemleri.",
      "Yüzde, Kâr-Zarar ve İskonto Problemleri, Karışım Problemleri.",
      "Hareket (Hız) Problemleri, Tablo ve Grafik Problemleri.",
      "Rutin Olmayan Muhakeme Problemleri"
    ],
    "aciklama": "Tüm problem türleri ve sayısal mantık"
  },
  {
    "id": "kon-tyt-mat-8",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Fonksiyonlar ve Kümeler",
    "siraNo": 8,
    "konuAdi": "Kümeler, Kartezyen Çarpım & Fonksiyonlar",
    "kazanimlar": [
      "Kümelerde İşlemler (Kesişim, Birleşim, Fark, Tümleme), Küme Problemleri.",
      "Fonksiyon Kavramı, Tanım, Değer ve Görüntü Kümesi, Fonksiyon Türleri ve Grafik Okuma.",
      "Bileşke Fonksiyon ve Ters Fonksiyon"
    ],
    "aciklama": "Küme işlemleri, fonksiyon tanımı, grafikleri ve bileşke"
  },
  {
    "id": "kon-tyt-mat-9",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 5,
    "uniteAdi": "Sayma ve Olasılık",
    "siraNo": 9,
    "konuAdi": "Mantık, Sayma & Olasılık",
    "kazanimlar": [
      "Önermeler ve Doğruluk Değerleri, Koşullu Önerme.",
      "Toplama ve Çarpma Yoluyla Sayma, Permütasyon, Kombinasyon, Binom Açılımı ve Olasılık.",
      "Koşullu Olasılık ve Deneysel/Teorik Olasılık"
    ],
    "aciklama": "Mantık bağlaçları, permütasyon, kombinasyon, binom ve olasılık"
  },
  {
    "id": "kon-tyt-mat-10",
    "dersId": "drs-tyt-matematik",
    "dersAdi": "TYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 6,
    "uniteAdi": "İstatistik",
    "siraNo": 10,
    "konuAdi": "Veri ve İstatistik",
    "kazanimlar": [
      "Merkezi Eğilim Ölçüleri (Aritmetik Ortalama, Tepe Değer/Mod, Ortanca/Medyan) ve Dağılım Ölçüleri (Açıklık, Standart Sapma).",
      "Kutu Grafiği ve Histogram"
    ],
    "aciklama": "Merkezi eğilim/dağılım ölçüleri ve veri analizi"
  },
  {
    "id": "kon-tyt-geo-1",
    "dersId": "drs-tyt-geometri",
    "dersAdi": "TYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Üçgenler",
    "siraNo": 1,
    "konuAdi": "Doğruda ve Üçgende Açılar",
    "kazanimlar": [
      "Paralel Doğrularda Açılar, Üçgenin İç ve Dış Açıları, Açı Bağıntıları.",
      "Açıortay Bağıntıları"
    ],
    "aciklama": "Açılar, açı kuralları ve üçgende açı bağıntıları"
  },
  {
    "id": "kon-tyt-geo-2",
    "dersId": "drs-tyt-geometri",
    "dersAdi": "TYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Üçgenler",
    "siraNo": 2,
    "konuAdi": "Özel Üçgenler & Alan",
    "kazanimlar": [
      "Dik Üçgen, Pisagor ve Öklid Teoremleri, İkizkenar ve Eşkenar Üçgen.",
      "Üçgende Kenarortay, Açıortay, Kenar Orta Dikme, Yükseklik.",
      "Üçgenin Alan Formülleri ve Benzerlik Teoremleri."
    ],
    "aciklama": "Dik üçgen, ikizkenar, eşkenar, üçgende alan ve benzerlik"
  },
  {
    "id": "kon-tyt-geo-3",
    "dersId": "drs-tyt-geometri",
    "dersAdi": "TYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Çokgenler ve Dörtgenler",
    "siraNo": 3,
    "konuAdi": "Çokgenler ve Dörtgenler",
    "kazanimlar": [
      "Dışbükey Çokgenler, Düzgün Çokgenler.",
      "Dörtgenler, Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Yamuk ve Deltoid."
    ],
    "aciklama": "Düzgün çokgenler, paralelkenar, kare, dikdörtgen ve yamuk"
  },
  {
    "id": "kon-tyt-geo-4",
    "dersId": "drs-tyt-geometri",
    "dersAdi": "TYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Çember ve Daire",
    "siraNo": 4,
    "konuAdi": "Çember ve Daire",
    "kazanimlar": [
      "Çemberde Açılar (Merkez, Çevre, Teğet-Kiriş Açı), Çemberde Uzunluk, Dairenin Çevresi ve Alanı.",
      "Daire Dilimi ve Daire Parçasının Alanı"
    ],
    "aciklama": "Çember açıları, kiriş/teğet özellikleri ve daire alanı"
  },
  {
    "id": "kon-tyt-geo-5",
    "dersId": "drs-tyt-geometri",
    "dersAdi": "TYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Uzay Geometri",
    "siraNo": 5,
    "konuAdi": "Katı Cisimler",
    "kazanimlar": [
      "Prizmalar, Piramitler, Silindir, Koni ve Küre (Yüzey Alanları ve Hacimleri)."
    ],
    "aciklama": "Prizma, piramit, silindir, koni ve küre alan/hacim hesabı"
  },
  {
    "id": "kon-tyt-fiz-1",
    "dersId": "drs-tyt-fizik",
    "dersAdi": "TYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Fizik Bilimi ve Madde",
    "siraNo": 1,
    "konuAdi": "Fizik Bilimine Giriş ve Madde",
    "kazanimlar": [
      "Fizik Bilimine Giriş ve Temel Büyüklükler.",
      "Madde ve Özellikleri (Özkütle, Dayanıklılık, Adezyon, Kohezyon, Yüzey Gerilimi)."
    ],
    "aciklama": "Fiziksel nicelikler, özkütle, adezyon ve kohezyon"
  },
  {
    "id": "kon-tyt-fiz-2",
    "dersId": "drs-tyt-fizik",
    "dersAdi": "TYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Kuvvet ve Hareket",
    "siraNo": 2,
    "konuAdi": "Hareket, Kuvvet ve Enerji",
    "kazanimlar": [
      "Hareket ve Kuvvet (Konum, Hız, İvme, Newton'ın Hareket Yasaları, Sürtünme).",
      "İş, Güç, Enerji ve Mekanik Enerjinin Korunumu."
    ],
    "aciklama": "Doğrusal hareket, Newton yasaları, kinetik/potansiyel enerji"
  },
  {
    "id": "kon-tyt-fiz-3",
    "dersId": "drs-tyt-fizik",
    "dersAdi": "TYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Termodinamik",
    "siraNo": 3,
    "konuAdi": "Isı, Sıcaklık ve Genleşme",
    "kazanimlar": [
      "Isı, Sıcaklık, Termometreler, Isı İletim Yolları ve Genleşme.",
      "Hâl Değişimi ve Isıl Denge"
    ],
    "aciklama": "Sıcaklık ölçekleri, ısı aktarımı ve genleşme"
  },
  {
    "id": "kon-tyt-fiz-4",
    "dersId": "drs-tyt-fizik",
    "dersAdi": "TYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Elektrik ve Manyetizma",
    "siraNo": 4,
    "konuAdi": "Elektrostatik ve Elektrik Akımı",
    "kazanimlar": [
      "Elektrostatik (Yükler, Elektriklenme Çeşitleri, Coulomb Kuvveti).",
      "Elektrik Akımı, Direnç, Ohm Kanunu, Seri/Paralel Bağlama, Elektriksel Güç ve Enerji, Mıknatıslar."
    ],
    "aciklama": "Elektrostatik yükler, devreler ve manyetizma temelleri"
  },
  {
    "id": "kon-tyt-fiz-5",
    "dersId": "drs-tyt-fizik",
    "dersAdi": "TYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 5,
    "uniteAdi": "Optik ve Dalgalar",
    "siraNo": 5,
    "konuAdi": "Optik ve Dalgalar",
    "kazanimlar": [
      "Optik (Gölge, Yansıma, Düzlem ve Küresel Aynalar, Kırılma, Mercekler, Renkler).",
      "Dalgalar (Yay, Su, Ses ve Deprem Dalgaları)."
    ],
    "aciklama": "Işığın yayılması, aynalar, mercekler ve dalga hareketleri"
  },
  {
    "id": "kon-tyt-kim-1",
    "dersId": "drs-tyt-kimya",
    "dersAdi": "TYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Kimya Bilimi",
    "siraNo": 1,
    "konuAdi": "Kimya Bilimi ve Atomun Yapısı",
    "kazanimlar": [
      "Kimya Disiplinleri, Güvenlik Uyarı İşaretleri, Simyadan Kimyaya.",
      "Atomun Yapısı, Atom Modelleri ve Periyodik Sistem.",
      "Periyodik Özelliklerin Değişimi"
    ],
    "aciklama": "Simyadan kimyaya, atom teorileri ve periyodik sistem"
  },
  {
    "id": "kon-tyt-kim-2",
    "dersId": "drs-tyt-kimya",
    "dersAdi": "TYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Kimyasal Etkileşimler",
    "siraNo": 2,
    "konuAdi": "Türler Arası Etkileşimler & Maddenin Halleri",
    "kazanimlar": [
      "Kimyasal Türler Arası Etkileşimler (Güçlü ve Zayıf Etkileşimler, Hidrojen Bağı).",
      "Maddenin Halleri (Katı, Sıvı, Gaz, Plazma; Buhar Basıncı, Viskozite).",
      "Doğa ve Kimya (Su ve Hayat, Çevre Kimyası)."
    ],
    "aciklama": "İyonik, kovalent, hidrojen bağları ve fiziksel haller"
  },
  {
    "id": "kon-tyt-kim-3",
    "dersId": "drs-tyt-kimya",
    "dersAdi": "TYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Hesaplamalar ve Karışımlar",
    "siraNo": 3,
    "konuAdi": "Kimyasal Hesaplamalar ve Karışımlar",
    "kazanimlar": [
      "Kimyanın Temel Kanunları ve Kimyasal Hesaplamalar (Mol Kavramı, Tepkime Türleri, Artanlı Tepkimeler).",
      "Karışımlar ve Çözeltiler (Homojen/Heterojen, Kütlece Yüzde Derişim, Ayırma Yöntemleri)."
    ],
    "aciklama": "Mol hesapları, kimyasal kanunlar ve karışım ayırma"
  },
  {
    "id": "kon-tyt-kim-4",
    "dersId": "drs-tyt-kimya",
    "dersAdi": "TYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Asit-Baz ve Günlük Kimya",
    "siraNo": 4,
    "konuAdi": "Asitler, Bazlar, Tuzlar ve Kimya Her Yerde",
    "kazanimlar": [
      "Asitler, Bazlar ve Tuzlar (pH, Nötralleşme, İndikatörler, Yaygın Tuzlar).",
      "Kimya Her Yerde (Temizlik Maddeleri, Polimerler, Kozmetikler, İlaçlar)."
    ],
    "aciklama": "Asit-baz tepkimeleri, tuzlar ve polimer/temizlik kimyası"
  },
  {
    "id": "kon-tyt-biy-1",
    "dersId": "drs-tyt-biyoloji",
    "dersAdi": "TYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Yaşam Bilimi Biyoloji",
    "siraNo": 1,
    "konuAdi": "Canlıların Temel Bileşenleri ve Hücre",
    "kazanimlar": [
      "Canlıların Ortak Özellikleri.",
      "Canlıların Temel Bileşenleri (İnorganik ve Organik Bileşikler, Enzimler, Nükleik Asitler, ATP).",
      "Hücre Yapısı, Hücre Zarı ve Organeller, Hücre Zarından Madde Geçişleri."
    ],
    "aciklama": "Organik bileşikler, enzimler, organeller ve osmoz/difüzyon"
  },
  {
    "id": "kon-tyt-biy-2",
    "dersId": "drs-tyt-biyoloji",
    "dersAdi": "TYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Canlılar Dünyası ve Üreme",
    "siraNo": 2,
    "konuAdi": "Sınıflandırma ve Hücre Bölünmeleri",
    "kazanimlar": [
      "Canlıların Çeşitliliği ve Sınıflandırılması (Virüsler, Bakteriler, Arkeler, Protistalar, Mantarlar, Bitkiler, Hayvanlar).",
      "Hücre Bölünmeleri (Mitoz, Mayoz, Eşeysiz ve Eşeyli Üreme)."
    ],
    "aciklama": "Canlı alemleri, sınıflandırma basamakları, mitoz ve mayoz"
  },
  {
    "id": "kon-tyt-biy-3",
    "dersId": "drs-tyt-biyoloji",
    "dersAdi": "TYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Kalıtım ve Ekoloji",
    "siraNo": 3,
    "konuAdi": "Kalıtım ve Ekosistem Ekolojisi",
    "kazanimlar": [
      "Kalıtımın Genel Esasları (Mendel Genetiği, Eş Baskınlık, Kan Grupları, Cinsiyete Bağlı Kalıtım).",
      "Ekosistem Ekolojisi, Besin Zinciri ve Ağları, Madde Döngüleri, Biyolojik Çeşitlilik ve Çevre Sorunları."
    ],
    "aciklama": "Mendel genetiği, soy ağaçları, besin piramidi ve ekoloji"
  },
  {
    "id": "kon-tyt-tar-1",
    "dersId": "drs-tyt-tarih",
    "dersAdi": "TYT Tarih",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Tarih",
    "siraNo": 1,
    "konuAdi": "Tarih ve Zaman & İlk Türk Devletleri",
    "kazanimlar": [
      "Tarih Bilimine Giriş, İlk Çağ Medeniyetleri.",
      "İlk ve Orta Çağlarda Türk Dünyası, İslam Medeniyetinin Doğuşu ve Yayılışı.",
      "Türklerin İslamiyet'i Kabulü ve İlk Türk İslam Devletleri."
    ],
    "aciklama": "Tarih bilimi, Orta Asya Türkleri ve İslam tarihi"
  },
  {
    "id": "kon-tyt-tar-2",
    "dersId": "drs-tyt-tarih",
    "dersAdi": "TYT Tarih",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Tarih",
    "siraNo": 2,
    "konuAdi": "Selçuklu, Osmanlı ve Milli Mücadele",
    "kazanimlar": [
      "Orta Çağ'da Dünya, Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiye'si.",
      "Beylikten Devlete Osmanlı, Dünya Gücü Osmanlı, Değişen Dünya Dengeleri.",
      "20. Yüzyıl Başlarında Osmanlı, Milli Mücadele Hazırlık ve Cepheler Dönemi.",
      "Atatürkçülük, Türk İnkılabı ve Atatürk İlkeleri."
    ],
    "aciklama": "Selçuklu, Osmanlı tarihi ve Kurtuluş Savaşı süreci"
  },
  {
    "id": "kon-tyt-cog-1",
    "dersId": "drs-tyt-cografya",
    "dersAdi": "TYT Coğrafya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Coğrafya",
    "siraNo": 1,
    "konuAdi": "Doğa, Harita ve İklim Bilgisi",
    "kazanimlar": [
      "Doğa ve İnsan, Coğrafi Koordinat Sistemi, Harita Bilgisi ve Projeksiyonlar.",
      "Dünyanın Şekli ve Hareketleri.",
      "İklim Bilgisi (Atmosfer, Sıcaklık, Basınç, Rüzgarlar, Nem, Yağış, Büyük İklim Tipleri)."
    ],
    "aciklama": "Coğrafi konum, izohips, dünyanın hareketleri ve iklim tipleri"
  },
  {
    "id": "kon-tyt-cog-2",
    "dersId": "drs-tyt-cografya",
    "dersAdi": "TYT Coğrafya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Coğrafya",
    "siraNo": 2,
    "konuAdi": "Yer Şekilleri, Nüfus ve Doğal Afetler",
    "kazanimlar": [
      "Yerin Şekillenmesi: İç Kuvvetler (Tektonizma, Volkanizma, Deprem, Orojenez) ve Dış Kuvvetler (Akarsular, Rüzgarlar, Buzullar, Dalgalar).",
      "Nüfus ve Yerleşme, Türkiye'de Nüfus ve Yerleşme.",
      "Ekonomik Faaliyet Türleri, Bölge Kavramı ve Türleri.",
      "Doğal Afetler ve Çevre Sorunları."
    ],
    "aciklama": "İç/dış kuvvetler, Türkiye ve dünyada nüfus, afetler"
  },
  {
    "id": "kon-tyt-fel-1",
    "dersId": "drs-tyt-felsefe",
    "dersAdi": "TYT Felsefe",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Felsefe",
    "siraNo": 1,
    "konuAdi": "Felsefenin Temel Alanları",
    "kazanimlar": [
      "Felsefenin Anlamı ve Alanı.",
      "Bilgi Felsefesi (Epistemoloji).",
      "Varlık Felsefesi (Ontoloji).",
      "Ahlak Felsefesi (Etik).",
      "Sanat Felsefesi (Estetik).",
      "Din Felsefesi, Siyaset Felsefesi, Bilim Felsefesi."
    ],
    "aciklama": "Epistemoloji, ontoloji, etik, estetik ve siyaset felsefesi"
  },
  {
    "id": "kon-tyt-din-1",
    "dersId": "drs-tyt-din",
    "dersAdi": "TYT Din Kültürü",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Din Kültürü",
    "siraNo": 1,
    "konuAdi": "İnanç, İbadet ve Ahlak",
    "kazanimlar": [
      "İslam ve İnanç Esasları.",
      "İslam ve İbadetler.",
      "Ahlak ve Değerler.",
      "Din, Kültür ve Medeniyet.",
      "Hz. Muhammed'in Örnekliği.",
      "Yaşayan Dinler ve Vahiy Geleneği."
    ],
    "aciklama": "İnanç esasları, ibadetler, ahlak ve vahiy geleneği"
  },
  {
    "id": "kon-ayt-mat-1",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İleri Cebir",
    "siraNo": 1,
    "konuAdi": "Polinomlar & İkinci Dereceden Denklemler",
    "kazanimlar": [
      "Polinom Kavramı, Polinomlarda Dört İşlem, Kalan Bulma Teoremi.",
      "İkinci Dereceden Bir Bilinmeyenli Denklemler, Kök-Katsayı Bağıntıları, Karmaşık Sayılar.",
      "Kökler ve katsayılar arasındaki bağıntılar (Vieta)"
    ],
    "aciklama": "Polinomlar, kalan teoremi ve 2. derece denklemler"
  },
  {
    "id": "kon-ayt-mat-2",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İleri Cebir",
    "siraNo": 2,
    "konuAdi": "Parabol & Eşitsizlikler",
    "kazanimlar": [
      "İkinci Dereceden Fonksiyonlar (Parabol), Tepe Noktası, Simetri Ekseni, Grafik Çizimi.",
      "İkinci Dereceden Eşitsizlikler ve Eşitsizlik Sistemleri, İşaret Tablosu."
    ],
    "aciklama": "Parabol grafikleri ve ikinci dereceden eşitsizlik sistemleri"
  },
  {
    "id": "kon-ayt-mat-3",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Trigonometri",
    "siraNo": 3,
    "konuAdi": "Trigonometri",
    "kazanimlar": [
      "Yönlü Açılar, Birim Çember, Trigonometrik Fonksiyonlar ve Özdeşlikler.",
      "Sinüs ve Kosinüs Teoremleri.",
      "Toplam-Fark ve Yarım Açı (İki Kat Açı) Formülleri.",
      "Trigonometrik Denklemler ve Ters Trigonometrik Fonksiyonlar (Arcsin, Arccos, Arctan)."
    ],
    "aciklama": "Birim çember, trigonometrik teoremler, yarım açı ve denklemler"
  },
  {
    "id": "kon-ayt-fiz-1",
    "dersId": "drs-ayt-fizik",
    "dersAdi": "AYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Mekanik",
    "siraNo": 1,
    "konuAdi": "Kuvvet, Hareket ve Newton Yasaları",
    "kazanimlar": [
      "Vektörler, İki Boyutta Vektör İşlemleri.",
      "Bağıl Hareket ve Nehir Problemleri.",
      "Newton'ın Hareket Yasaları (Sürtünmeli ve Eğik Düzlemde Hareket, Bağlı Cisimler).",
      "Bir ve İki Boyutta Sabit İvmeli Hareket (Serbest Düşme, Düşey Atış, Yatay ve Eğik Atış)."
    ],
    "aciklama": "Vektörler, bağıl hareket, eğik düzlem ve atış hareketleri"
  },
  {
    "id": "kon-ayt-fiz-2",
    "dersId": "drs-ayt-fizik",
    "dersAdi": "AYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Mekanik",
    "siraNo": 2,
    "konuAdi": "Momentum, Tork ve Basit Makineler",
    "kazanimlar": [
      "İtme ve Çizgisel Momentum, Momentumun Korunumu ve Çarpışmalar.",
      "Tork, Denge Şartları, Kütle ve Ağırlık Merkezi.",
      "Basit Makineler (Kaldıraç, Makara, Palanga, Eğik Düzlem, Vida, Çıkrık, Dişli Çarklar)."
    ],
    "aciklama": "Çarpışmalar, momentum korunumu, tork ve statik denge"
  },
  {
    "id": "kon-ayt-fiz-3",
    "dersId": "drs-ayt-fizik",
    "dersAdi": "AYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Elektromanyetizma",
    "siraNo": 3,
    "konuAdi": "Elektrik Alan, Manyetizma ve İndüksiyon",
    "kazanimlar": [
      "Elektriksel Kuvvet (Coulomb), Elektriksel Alan, Potansiyel Enerji ve Potansiyel Fark.",
      "Düzgün Elektrik Alan, Yüklü Paralel Levhalar ve Sığa (Kapasitörler).",
      "Manyetik Alan, Manyetik Kuvvet, Manyetik Akı ve Faraday/Lenz İndüksiyon Kanunları, Özindüksiyon.",
      "Alternatif Akım (R-L-C Devreleri, Rezonans), Transformatörler."
    ],
    "aciklama": "Elektriksel potansiyel, sığa, manyetik kuvvet, indüksiyon ve alternatif akım"
  },
  {
    "id": "kon-ayt-fiz-4",
    "dersId": "drs-ayt-fizik",
    "dersAdi": "AYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Dönme, Salınım ve Dalgalar",
    "siraNo": 4,
    "konuAdi": "Çembersel Hareket, Harmonik Hareket ve Dalga Mekaniği",
    "kazanimlar": [
      "Düzgün Çembersel Hareket (Çizgisel/Açısal Hız, Merkezcil İvme/Kuvvet, Dönerek Öteleme, Eylemsizlik Momenti, Açısal Momentum).",
      "Kütle Çekim Kuvveti ve Kepler Yasaları.",
      "Basit Harmonik Hareket (Yaylı ve Basit Sarkaç, Konum, Hız, İvme Bağıntıları).",
      "Dalga Mekaniği (Su Dalgalarında Kırınım ve Girişim, Işıkta Kırınım ve Çift Yarıkta Girişim/Young Deneyi, Doppler Olayı, Elektromanyetik Dalgalar)."
    ],
    "aciklama": "Dönme dinamiği, açısal momentum, harmonik hareket ve ışıkta girişim"
  },
  {
    "id": "kon-ayt-fiz-5",
    "dersId": "drs-ayt-fizik",
    "dersAdi": "AYT Fizik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Modern Fizik",
    "siraNo": 5,
    "konuAdi": "Atom Fiziği, Radyoaktivite ve Modern Fizik",
    "kazanimlar": [
      "Atom Fiziğine Giriş (Atom Modelleri, Fotoelektrik Olay, Compton Saçılması, De Broglie Dalga Boyu, Kararsız Çekirdekler ve Radyoaktivite).",
      "Modern Fizik (Özel Görelilik, Kuantum Fiziği) ve Modern Fiziğin Teknolojideki Uygulamaları (Görüntüleme Cihazları, Yarı İletkenler, Süper İletkenler, Nanoteknoloji, Lazer)."
    ],
    "aciklama": "Bohr atomu, fotoelektrik, Compton, radyoaktivite ve modern teknoloji"
  },
  {
    "id": "kon-ayt-kim-1",
    "dersId": "drs-ayt-kimya",
    "dersAdi": "AYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Fizikokimya",
    "siraNo": 1,
    "konuAdi": "Modern Atom Teorisi ve Gazlar",
    "kazanimlar": [
      "Modern Atom Teorisi (Kuantum Sayıları, Elektron Dizilimleri, Yükseltgenme Basamakları).",
      "Gazlar (Gaz Yasaları, İdeal Gaz Denklemi, Kinetik Teori, Gerçek Gazlar, Gaz Karışımları)."
    ],
    "aciklama": "Kuantum sayıları, orbital dizilimi ve gaz kanunları"
  },
  {
    "id": "kon-ayt-kim-2",
    "dersId": "drs-ayt-kimya",
    "dersAdi": "AYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Fizikokimya",
    "siraNo": 2,
    "konuAdi": "Sıvı Çözeltiler ve Termokimya",
    "kazanimlar": [
      "Sıvı Çözeltiler ve Koligatif Özellikler (Molarite, Molalite, Buhar Basıncı Düşmesi, Kaynama Noktası Yükselmesi, Donma Noktası Alçalması, Ozmotik Basınç).",
      "Kimyasal Tepkimelerde Enerji (Entalpi Değişimi, Standart Oluşum Entalpisi, Bağ Enerjileri, Hess Yasası)."
    ],
    "aciklama": "Koligatif özellikler, derişim birimleri ve entalpi hesapları"
  },
  {
    "id": "kon-ayt-kim-3",
    "dersId": "drs-ayt-kimya",
    "dersAdi": "AYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Tepkimelerde Denge",
    "siraNo": 3,
    "konuAdi": "Tepkime Hızı ve Kimyasal Denge",
    "kazanimlar": [
      "Kimyasal Tepkimelerde Hız (Tepkime Hızını Etkileyen Faktörler, Hız İfadesi, Mekanizmalı Tepkimeler).",
      "Kimyasal Denge (Dengeyi Etkileyen Faktörler, Le Chatelier İlkesi, Denge Sabitleri Kc ve Kp).",
      "Sulu Çözelti Dengeleri (Asit-Baz Dengeleri, Suyun Otoiyonizasyonu, pH/pOH, Tampon Çözeltiler, Tuzların Hidrolizi, Titrasyon).",
      "Çözünürlük Dengesi (Çözünürlük Çarpımı KÇÇ, Ortak İyon Etkisi, Çökelti Oluşumu)."
    ],
    "aciklama": "Hız bağıntıları, Le Chatelier, asit-baz titrasyonu ve KÇÇ"
  },
  {
    "id": "kon-ayt-kim-4",
    "dersId": "drs-ayt-kimya",
    "dersAdi": "AYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Elektrokimya ve Organik",
    "siraNo": 4,
    "konuAdi": "Elektrokimya ve Karbon Kimyası",
    "kazanimlar": [
      "Kimya ve Elektrik (İndirgenme-Yükseltgenme Tepkimeleri, Standart Elektrot Potansiyelleri, Galvanik Piller, Nernst Denklemi, Elektroliz ve Faraday Kanunları, Korozyon).",
      "Karbon Kimyasına Giriş (Doğada Karbon, Lewis Formülleri, Hibritleşme ve Molekül Geometrisi/VSEPR)."
    ],
    "aciklama": "Pil potansiyelleri, elektroliz, hibritleşme ve molekül geometrisi"
  },
  {
    "id": "kon-ayt-kim-5",
    "dersId": "drs-ayt-kimya",
    "dersAdi": "AYT Kimya",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Organik Kimya",
    "siraNo": 5,
    "konuAdi": "Organik Bileşikler",
    "kazanimlar": [
      "Alkanlar, Alkenler, Alkinler, Aromatik Bileşikler (Benzen).",
      "Alkoller ve Eterler.",
      "Karbonil Bileşikleri (Aldehitler ve Ketonlar).",
      "Karboksilik Asitler ve Esterler.",
      "Organik Bileşiklerde Adlandırma ve İzomeri"
    ],
    "aciklama": "Hidrokarbonlar ve oksijenli organik fonksiyonel gruplar"
  },
  {
    "id": "kon-ayt-biy-1",
    "dersId": "drs-ayt-biyoloji",
    "dersAdi": "AYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İnsan Fizyolojisi",
    "siraNo": 1,
    "konuAdi": "Denetleyici Sistemler ve Duyu Organları",
    "kazanimlar": [
      "Sinir Sistemi (Nöron, İmpuls İletimi, Merkezi ve Çevresel Sinir Sistemi).",
      "Endokrin Sistem (Hormonlar, Hipofiz, Tiroid, Pankreas, Böbrek Üstü Bezleri).",
      "Duyu Organları (Göz, Kulak, Burun, Dil, Deri ve Görme/İşitme Mekanizması)."
    ],
    "aciklama": "Sinirsel iletim, endokrin bezler ve duyu organları fizyolojisi"
  },
  {
    "id": "kon-ayt-biy-2",
    "dersId": "drs-ayt-biyoloji",
    "dersAdi": "AYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İnsan Fizyolojisi",
    "siraNo": 2,
    "konuAdi": "Destek, Sindirim ve Dolaşım Sistemleri",
    "kazanimlar": [
      "Destek ve Hareket Sistemi (Kemik, Kıkırdak, Eklem, Çizgili/Düz/Kalp Kası Kasılma Mekanizması).",
      "Sindirim Sistemi (Sindirim Kanalı, Enzimler, Emilim, Karaciğer ve Pankreasın Görevleri).",
      "Dolaşım ve Bağışıklık Sistemi (Kalp, Damarlar, Kan Dokusu, Lenf Dolaşımı, Özgül ve Özgül Olmayan Bağışıklık)."
    ],
    "aciklama": "Kas kasılması, besinlerin kimyasal sindirimi ve kalp-dolaşım"
  },
  {
    "id": "kon-ayt-biy-3",
    "dersId": "drs-ayt-biyoloji",
    "dersAdi": "AYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İnsan Fizyolojisi",
    "siraNo": 3,
    "konuAdi": "Solunum, Boşaltım ve Üreme Sistemleri",
    "kazanimlar": [
      "Solunum Sistemi (Solunum Organları, Gazların Kanda Taşınması/Hemoglobin).",
      "Üriner (Boşaltım) Sistemi (Böbrek Yapısı, Nefron, İdrar Oluşumu ve Homeostazi).",
      "Üreme Sistemi ve Embriyonik Gelişim (Erkek ve Dişi Üreme Organları, Gametogenez, Menstrüal Döngü)."
    ],
    "aciklama": "Gaz taşınımı, nefron çalışma mekanizması ve insanda üreme"
  },
  {
    "id": "kon-ayt-biy-4",
    "dersId": "drs-ayt-biyoloji",
    "dersAdi": "AYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Genetik ve Enerji",
    "siraNo": 4,
    "konuAdi": "Genden Proteine ve Enerji Dönüşümleri",
    "kazanimlar": [
      "DNA'nın Yapısı ve Replikasyonu, RNA Çeşitleri.",
      "Genetik Kod ve Protein Sentezi (Transkripsiyon ve Translasyon).",
      "Biyoteknoloji ve Gen Mühendisliği (Klonlama, Rekombinant DNA).",
      "Hücresel Solunum (Glikoliz, Krebs Döngüsü, ETS, Fermantasyon).",
      "Fotosentez (Işığa Bağımlı ve Bağımsız Reaksiyonlar) ve Kemosentez."
    ],
    "aciklama": "Protein sentezi, ATP üretimi, hücresel solunum ve fotosentez"
  },
  {
    "id": "kon-ayt-biy-5",
    "dersId": "drs-ayt-biyoloji",
    "dersAdi": "AYT Biyoloji",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Bitki Biyolojisi ve Ekoloji",
    "siraNo": 5,
    "konuAdi": "Bitki Biyolojisi ve Komünite Ekolojisi",
    "kazanimlar": [
      "Komünite ve Popülasyon Ekolojisi (Simbiotik İlişkiler, Süksesyon, Popülasyon Dinamiği).",
      "Bitkisel Dokular (Meristem, Temel, İletim, Örtü Doku) ve Bitkisel Organlar.",
      "Bitkilerde Madde Taşınması (Ksilem ve Floem, Terleme, Kohezyon-Gerilim).",
      "Bitkilerde Büyüme ve Hareket (Tropizma, Nasti, Bitkisel Hormonlar).",
      "Çiçekli Bitkilerde Üreme, Tozlaşma, Döllenme ve Tohum/Meyve Oluşumu.",
      "Canlılar ve Çevre (Adaptasyon, Doğal Seçilim, Çevre Şartları ve Genetik Değişimler)."
    ],
    "aciklama": "Bitki anatomisi, su/besin iletimi, tropizma ve popülasyon ekolojisi"
  },
  {
    "id": "kon-ayt-edb-1",
    "dersId": "drs-ayt-edebiyat",
    "dersAdi": "AYT Türk Dili ve Edebiyatı",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Şiir ve Edebi Sanatlar",
    "siraNo": 1,
    "konuAdi": "Şiir Bilgisi & Edebi Sanatlar",
    "kazanimlar": [
      "Nazım Birimi, Nazım Şekli, Nazım Türü, Ölçü (Hece, Aruz, Serbest), Uyak ve Redif.",
      "Teşbih, İstiare, Mecazımürsel, Teşhis, İntak, Tezat, Tenasüp, Hüsnütalil, Tecahülüarif, Kinaye, Tevriye, Tariz.",
      "Ahenk Unsurları ve Şiir Türleri (Lirik, Epik, Didaktik, Pastoral, Satirik)"
    ],
    "aciklama": "Nazım birimi, kafiye/redif ve söz sanatları analizi"
  },
  {
    "id": "kon-ayt-edb-2",
    "dersId": "drs-ayt-edebiyat",
    "dersAdi": "AYT Türk Dili ve Edebiyatı",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Eski Türk Edebiyatı",
    "siraNo": 2,
    "konuAdi": "İslamiyet Öncesi, Geçiş Dönemi ve Halk Edebiyatı",
    "kazanimlar": [
      "İslamiyet Öncesi Türk Edebiyatı (Koşuk, Sagu, Sav, Destanlar) ve Geçiş Dönemi Eserleri (Kutadgu Bilig, Divanü Lugati't-Türk vb.).",
      "Halk Edebiyatı (Anonim, Âşık ve Tekke/Tasavvuf Edebiyatı nazım şekilleri ve temsilcileri).",
      "Dede Korkut Hikayeleri"
    ],
    "aciklama": "Destan dönemi, ilk İslami eserler ve Halk edebiyatı kolları"
  },
  {
    "id": "kon-ayt-edb-3",
    "dersId": "drs-ayt-edebiyat",
    "dersAdi": "AYT Türk Dili ve Edebiyatı",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Eski Türk Edebiyatı",
    "siraNo": 3,
    "konuAdi": "Divan Edebiyatı",
    "kazanimlar": [
      "Divan Edebiyatı (Gazel, Kaside, Mesnevi, Şarkı, Tuyuğ vb., Divan şairleri ve nesir türleri).",
      "Divan Edebiyatı Akımları (Sebk-i Hindi, Türki-i Basit, Hikemi Tarz, Mahallileşme)",
      "13. - 19. Yüzyıl Divan Şairleri ve Eserleri"
    ],
    "aciklama": "Divan nazım şekilleri, aruz, şairler ve süslü nesir"
  },
  {
    "id": "kon-ayt-edb-4",
    "dersId": "drs-ayt-edebiyat",
    "dersAdi": "AYT Türk Dili ve Edebiyatı",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Batı Etkisindeki Edebiyat",
    "siraNo": 4,
    "konuAdi": "Tanzimat, Servet-i Fünun ve Fecr-i Âti Edebiyatı",
    "kazanimlar": [
      "Tanzimat Edebiyatı (1. ve 2. Dönem şair/yazarları, roman ve tiyatro gelişimi).",
      "Servet-i Fünun Edebiyatı (Edebiyat-ı Cedide) şairleri ve nesri.",
      "Fecr-i Âti Topluluğu ve Ahmet Haşim."
    ],
    "aciklama": "Batılılaşma dönemi, ilk romanlar, tiyatro ve Servet-i Fünun şiiri"
  },
  {
    "id": "kon-ayt-edb-5",
    "dersId": "drs-ayt-edebiyat",
    "dersAdi": "AYT Türk Dili ve Edebiyatı",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Batı Etkisindeki Edebiyat",
    "siraNo": 5,
    "konuAdi": "Millî Edebiyat ve Cumhuriyet Dönemi Türk Edebiyatı",
    "kazanimlar": [
      "Millî Edebiyat Dönemi (Genç Kalemler, Yeni Lisan, millî kaynaklara yöneliş ve temsilcileri).",
      "Cumhuriyet Dönemi Türk Edebiyatı (Saf Şiir, Toplumcu Gerçekçiler, Millî Edebiyat Zevk ve Anlayışını Sürdürenler, Garip Akımı, İkinci Yeni, 1980 Sonrası Şiir; Cumhuriyet roman ve hikâyesi, tiyatro).",
      "Edebi Akımlar (Klasisizm, Romantizm, Realizm, Natüralizm, Parnasizm, Sembolizm, Sürrealizm, Varoluşçuluk)."
    ],
    "aciklama": "Yeni Lisan hareketi, Cumhuriyet şiir ve romanı, Batı edebi akımları"
  },
  {
    "id": "kon-ayt-mat-4",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Fonksiyonlar ve Diziler",
    "siraNo": 4,
    "konuAdi": "Logaritma",
    "kazanimlar": [
      "Üstel fonksiyon ve logaritma fonksiyonu, logaritmanın özellikleri, taban değiştirme.",
      "Logaritmik denklem ve eşitsizlikler.",
      "Üstel ve Logaritmik Fonksiyonlar ve Günlük Hayat Problemleri"
    ],
    "aciklama": "Üstel ve logaritma fonksiyonu özellikleri, grafikler ve denklemler"
  },
  {
    "id": "kon-ayt-mat-5",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Fonksiyonlar ve Diziler",
    "siraNo": 5,
    "konuAdi": "Diziler",
    "kazanimlar": [
      "Dizi kavramı, genel terim, sonlu dizi, sabit dizi.",
      "Aritmetik dizi ve geometrik dizi, ilk n terim toplamı.",
      "Fibonacci dizisi ve dizi uygulamaları."
    ],
    "aciklama": "Aritmetik, geometrik diziler ve toplam formülleri"
  },
  {
    "id": "kon-ayt-mat-6",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Kalkülüs",
    "siraNo": 6,
    "konuAdi": "Limit ve Süreklilik",
    "kazanimlar": [
      "Bir noktada limit, sağdan ve soldan limit, limit özellikleri.",
      "Belirsizlik durumları (0/0 belirsizliği) ve sadeleştirme.",
      "Fonksiyonun sürekliliği ve süreksizlik noktaları."
    ],
    "aciklama": "Limit kavramı, 0/0 belirsizliği ve süreklilik incelemesi"
  },
  {
    "id": "kon-ayt-mat-7",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Kalkülüs",
    "siraNo": 7,
    "konuAdi": "Türev ve Uygulamaları",
    "kazanimlar": [
      "Türev tanımı ve anlık değişim oranı, türev alma kuralları.",
      "Bileşke fonksiyonun türevi (zincir kuralı), parçalı fonksiyonların türevi.",
      "Teğet ve normal denklemleri, artan ve azalan fonksiyonlar, yerel ekstremum noktaları, maksimum-minimum problemleri."
    ],
    "aciklama": "Türev kuralları, geometrik yorum, ekstremum ve optimizasyon problemleri"
  },
  {
    "id": "kon-ayt-mat-8",
    "dersId": "drs-ayt-matematik",
    "dersAdi": "AYT Matematik",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Kalkülüs",
    "siraNo": 8,
    "konuAdi": "İntegral ve Uygulamaları",
    "kazanimlar": [
      "Belirsiz integral ve integral alma kuralları, diferansiyel kavramı.",
      "Değişken değiştirme yöntemi.",
      "Belirli integral, Riemann toplamı, eğri altında kalan alan hesabı ve iki eğri arasındaki alan."
    ],
    "aciklama": "Belirsiz/belirli integral ve Riemann alan hesapları"
  },
  {
    "id": "kon-ayt-geo-1",
    "dersId": "drs-ayt-geometri",
    "dersAdi": "AYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Analitik Geometri",
    "siraNo": 1,
    "konuAdi": "Doğrunun Analitik İncelenmesi",
    "kazanimlar": [
      "Noktanın analitik incelenmesi, iki nokta arasındaki uzaklık, orta nokta.",
      "Doğrunun eğimi, eğim açısı ve doğru denklemleri.",
      "İki doğrunun birbirine göre durumları, kesişim noktası, noktanın doğruya uzaklığı ve paralel doğrular arası uzaklık."
    ],
    "aciklama": "Doğru denklemleri, paralellik, diklik ve uzaklık formülleri"
  },
  {
    "id": "kon-ayt-geo-2",
    "dersId": "drs-ayt-geometri",
    "dersAdi": "AYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Analitik Geometri",
    "siraNo": 2,
    "konuAdi": "Çemberin Analitik İncelenmesi",
    "kazanimlar": [
      "Merkezi ve yarıçapı bilinen çember denklemi, standart ve genel çember denklemi.",
      "Doğru ile çemberin birbirine göre durumları, teğet ve kesen bağıntıları."
    ],
    "aciklama": "Çember denklemi ve çember-doğru etkileşimleri"
  },
  {
    "id": "kon-ayt-geo-3",
    "dersId": "drs-ayt-geometri",
    "dersAdi": "AYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Dönüşümler ve Uzay Geometri",
    "siraNo": 3,
    "konuAdi": "Dönüşümler Geometrisi",
    "kazanimlar": [
      "Öteleme dönüşümü, dönme dönüşümü (orijin etrafında saat yönü ve tersi).",
      "Yansıma (simetri) dönüşümü (noktaya ve doğruya göre simetri)."
    ],
    "aciklama": "Analitik düzlemde öteleme, dönme ve simetri dönüşümleri"
  },
  {
    "id": "kon-ayt-geo-4",
    "dersId": "drs-ayt-geometri",
    "dersAdi": "AYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Dönüşümler ve Uzay Geometri",
    "siraNo": 4,
    "konuAdi": "Katı Cisimler (Prizma, Piramit, Koni, Küre)",
    "kazanimlar": [
      "Dik prizmalar ve dik piramitlerin alan ve hacim hesapları.",
      "Dönel cisimler: Silindir, dik dairesel koni ve kürenin yüzey alanı ve hacmi."
    ],
    "aciklama": "Üç boyutlu cisimlerin hacim ve alan bağıntıları"
  },
  {
    "id": "kon-ayt-geo-5",
    "dersId": "drs-ayt-geometri",
    "dersAdi": "AYT Geometri",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Vektörler",
    "siraNo": 5,
    "konuAdi": "Vektörler (Geometri)",
    "kazanimlar": [
      "Düzlemde vektörler, vektörlerde toplama, çıkarma ve skalerle çarpma.",
      "İki vektörün skaler (iç) çarpımı, diklik ve paralellik koşulları."
    ],
    "aciklama": "Vektörel işlemler ve iç çarpım"
  },
  {
    "id": "kon-ayt-tar1-1",
    "dersId": "drs-ayt-tarih1",
    "dersAdi": "AYT Tarih-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İlk Çağ ve Türk Dünyası",
    "siraNo": 1,
    "konuAdi": "Tarih ve Zaman & İlk ve Orta Çağlarda Türk Dünyası",
    "kazanimlar": [
      "Tarih biliminin yöntem ve kaynakları, takvim sistemleri.",
      "İlk Çağ medeniyet havzaları ve özellikleri.",
      "İlk ve Orta Çağlarda Türk Devletleri (Hunlar, Göktürkler, Uygurlar)."
    ],
    "aciklama": "İlk Çağ uygarlıkları ve İslamiyet öncesi Türk devletleri"
  },
  {
    "id": "kon-ayt-tar1-2",
    "dersId": "drs-ayt-tarih1",
    "dersAdi": "AYT Tarih-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "İslam ve Selçuklu Tarihi",
    "siraNo": 2,
    "konuAdi": "İslam Medeniyeti ve Türk İslam Devletleri",
    "kazanimlar": [
      "İslam Medeniyetinin doğuşu, Dört Halife ve Emevi-Abbasi dönemleri.",
      "Türklerin İslamiyeti kabulü, Karahanlılar, Gazneliler ve Büyük Selçuklu Devleti."
    ],
    "aciklama": "İslam tarihi ve ilk Türk İslam devletleri yapısı"
  },
  {
    "id": "kon-ayt-tar1-3",
    "dersId": "drs-ayt-tarih1",
    "dersAdi": "AYT Tarih-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Osmanlı Tarihi",
    "siraNo": 3,
    "konuAdi": "Osmanlı Devleti Kuruluş, Yükselme ve Dünya Gücü",
    "kazanimlar": [
      "Beylikten devlete Osmanlı siyaseti ve fetihleri.",
      "Dünya gücü Osmanlı (İstanbul'un fethi, Yavuz ve Kanuni dönemleri).",
      "Değişen dünya dengeleri karşısında Osmanlı (17. ve 18. yüzyıl ıslahatları)."
    ],
    "aciklama": "Osmanlı siyasi tarihi, askeri yapısı ve ıslahatları"
  },
  {
    "id": "kon-ayt-tar1-4",
    "dersId": "drs-ayt-tarih1",
    "dersAdi": "AYT Tarih-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "20. Yüzyıl ve Millî Mücadele",
    "siraNo": 4,
    "konuAdi": "20. Yüzyıl Başlarında Osmanlı ve Millî Mücadele",
    "kazanimlar": [
      "Trablusgarp ve Balkan Savaşları, 1. Dünya Savaşı cepheleri ve Mondros Ateşkesi.",
      "Millî Mücadeleye hazırlık dönemi (Kongreler, Misakımillî, BMM'nin açılışı).",
      "Kurtuluş Savaşı cepheleri, Mudanya ve Lozan Barış Antlaşması."
    ],
    "aciklama": "1. Dünya Savaşı, Kurtuluş Savaşı ve bağımsızlık antlaşmaları"
  },
  {
    "id": "kon-ayt-tar1-5",
    "dersId": "drs-ayt-tarih1",
    "dersAdi": "AYT Tarih-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 5,
    "uniteAdi": "Cumhuriyet Dönemi",
    "siraNo": 5,
    "konuAdi": "Atatürkçülük ve Türk İnkılabı",
    "kazanimlar": [
      "Atatürk İlkeleri (Cumhuriyetçilik, Milliyetçilik, Halkçılık, Devletçilik, Laiklik, İnkılapçılık).",
      "Siyasi, hukuki, eğitim, toplumsal ve ekonomik alanda yapılan inkılaplar.",
      "Atatürk Dönemi Türk Dış Politikası (Hatay, Boğazlar, Balkan Antantı, Sadabat Paktı)."
    ],
    "aciklama": "Atatürk ilkeleri, çağdaşlaşma inkılapları ve dış politika"
  },
  {
    "id": "kon-ayt-cog1-1",
    "dersId": "drs-ayt-cografya1",
    "dersAdi": "AYT Coğrafya-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Doğal Sistemler ve Biyoçeşitlilik",
    "siraNo": 1,
    "konuAdi": "Biyoçeşitlilik ve Madde Döngüleri",
    "kazanimlar": [
      "Biyoçeşitliliğin oluşumu ve dağılışını etkileyen faktörler (biyomlar).",
      "Madde döngüleri (karbon, azot, su döngüsü) ve enerji akışı.",
      "Su ekosistemleri ve sulak alanların korunması."
    ],
    "aciklama": "Ekosistemler, biyomlar ve madde döngüleri"
  },
  {
    "id": "kon-ayt-cog1-2",
    "dersId": "drs-ayt-cografya1",
    "dersAdi": "AYT Coğrafya-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Beşerî Sistemler ve Şehirler",
    "siraNo": 2,
    "konuAdi": "Nüfus Politikaları ve Şehirlerin Fonksiyonları",
    "kazanimlar": [
      "Dünya nüfusunun tarihsel gelişimi ve ülkelerin uyguladığı nüfus politikaları.",
      "Şehirlerin fonksiyonel özellikleri ve etki alanları (küresel, bölgesel, yerel).",
      "Türkiye'de nüfus projeksiyonları ve şehirleşme süreçleri."
    ],
    "aciklama": "Demografik politikalar, şehir fonksiyonları ve yerleşme"
  },
  {
    "id": "kon-ayt-cog1-3",
    "dersId": "drs-ayt-cografya1",
    "dersAdi": "AYT Coğrafya-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Türkiye Ekonomisi",
    "siraNo": 3,
    "konuAdi": "Türkiye Ekonomisi ve Sektörel Dağılım",
    "kazanimlar": [
      "Türkiye ekonomisinin sektörel yapısı ve kalkınma modelleri.",
      "Türkiye'de tarım ve hayvancılık, madenler ve enerji kaynakları.",
      "Türkiye'de sanayi sektörünün gelişimi ve dağılışı."
    ],
    "aciklama": "Tarım, sanayi, enerji ve maden potansiyeli"
  },
  {
    "id": "kon-ayt-cog1-4",
    "dersId": "drs-ayt-cografya1",
    "dersAdi": "AYT Coğrafya-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Küresel Ortam",
    "siraNo": 4,
    "konuAdi": "Küresel Ticaret, Turizm ve Uluslararası Örgütler",
    "kazanimlar": [
      "Küresel ticaretin temel merkezleri, hammadde-üretim-pazar ilişkisi.",
      "Dünya turizmi ve Türkiye turizminin ekonomik etkileri.",
      "Uluslararası ve bölgesel ekonomik, siyasi, askeri örgütler (BM, NATO, AB vb.)."
    ],
    "aciklama": "Uluslararası ticaret, turizm ve küresel örgütler"
  },
  {
    "id": "kon-ayt-cog1-5",
    "dersId": "drs-ayt-cografya1",
    "dersAdi": "AYT Coğrafya-1",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 5,
    "uniteAdi": "Çevre ve Toplum",
    "siraNo": 5,
    "konuAdi": "Çevre Sorunları ve Sürdürülebilirlik",
    "kazanimlar": [
      "Doğal kaynakların aşırı kullanımı ve küresel çevre sorunları (sera etkisi, asit yağmurları).",
      "Çevre koruma sözleşmeleri ve sürdürülebilir doğal kaynak yönetimi."
    ],
    "aciklama": "Küresel çevre sorunları ve çevre antlaşmaları"
  },
  {
    "id": "kon-ayt-tar2-1",
    "dersId": "drs-ayt-tarih2",
    "dersAdi": "AYT Tarih-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İlk Çağdan Yeni Çağa",
    "siraNo": 1,
    "konuAdi": "İlk Çağ, Orta Çağ ve Türk-İslam Medeniyeti",
    "kazanimlar": [
      "İlk Çağ hukuk sistemleri, askeri ve ticari yapılar.",
      "Orta Çağ'da feodalite, Haçlı Seferleri ve Moğol İstilası.",
      "Büyük Selçuklu ve Anadolu Selçuklu Devleti teşkilat yapısı."
    ],
    "aciklama": "Eski dünya medeniyetleri ve Selçuklu teşkilatlanması"
  },
  {
    "id": "kon-ayt-tar2-2",
    "dersId": "drs-ayt-tarih2",
    "dersAdi": "AYT Tarih-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Osmanlı Kurumları ve Islahatlar",
    "siraNo": 2,
    "konuAdi": "Osmanlı Devleti Kültür ve Medeniyeti & Tanzimat Dönemi",
    "kazanimlar": [
      "Osmanlı devlet idaresi, seyfiye, ilmiye, kalemiye sınıfları ve timar sistemi.",
      "Tanzimat, Islahat Fermanı ve 1. / 2. Meşrutiyet Dönemi fikir akımları."
    ],
    "aciklama": "Osmanlı kurumları, toprak sistemi ve anayasal gelişmeler"
  },
  {
    "id": "kon-ayt-tar2-3",
    "dersId": "drs-ayt-tarih2",
    "dersAdi": "AYT Tarih-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "2. Dünya Savaşı ve Soğuk Savaş",
    "siraNo": 3,
    "konuAdi": "2. Dünya Savaşı ve Soğuk Savaş Dönemi",
    "kazanimlar": [
      "2. Dünya Savaşı'nın nedenleri, Mihver ve Müttefik devletler, Türkiye'nin savaştaki politikası.",
      "Soğuk Savaş'ın başlaması, Doğu ve Batı blokları (NATO, Varşova Paktı), Kore Savaşı ve Türkiye."
    ],
    "aciklama": "2. Dünya Savaşı ve Soğuk Savaş dengeleri"
  },
  {
    "id": "kon-ayt-tar2-4",
    "dersId": "drs-ayt-tarih2",
    "dersAdi": "AYT Tarih-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 4,
    "uniteAdi": "Yumuşama Dönemi ve Küreselleşme",
    "siraNo": 4,
    "konuAdi": "Yumuşama (Detant) Dönemi ve 21. Yüzyıl",
    "kazanimlar": [
      "Yumuşama Dönemi (Küba Buhranı, Vietnam Savaşı, Kıbrıs Barış Harekâtı).",
      "SSCB'nin dağılması, Türk Cumhuriyetlerinin bağımsızlığı ve 21. yüzyılda küresel gelişmeler."
    ],
    "aciklama": "Detant süreci, Kıbrıs meselesi ve Soğuk Savaş sonrası dünya"
  },
  {
    "id": "kon-ayt-cog2-1",
    "dersId": "drs-ayt-cografya2",
    "dersAdi": "AYT Coğrafya-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Ekosistem ve Madde Döngüsü",
    "siraNo": 1,
    "konuAdi": "Ekosistemler ve Biyoçeşitlilik Dinamikleri",
    "kazanimlar": [
      "Karasal ve sucul ekosistemlerin özellikleri, enerji piramidi.",
      "Karbon, azot, oksijen döngüsünde insan müdahalesinin etkileri."
    ],
    "aciklama": "Ekosistem dinamikleri ve enerji akışı"
  },
  {
    "id": "kon-ayt-cog2-2",
    "dersId": "drs-ayt-cografya2",
    "dersAdi": "AYT Coğrafya-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Bölgesel Kalkınma",
    "siraNo": 2,
    "konuAdi": "Türkiye'nin Bölgesel Kalkınma Projeleri ve Ulaşım",
    "kazanimlar": [
      "Bölgesel kalkınma projeleri (GAP, DAP, DOKAP, ZBK, KOP, YHGP).",
      "Türkiye'de ulaşım sistemleri, enerji koridorları ve jeopolitik konum."
    ],
    "aciklama": "Kalkınma projeleri ve stratejik enerji hatları"
  },
  {
    "id": "kon-ayt-cog2-3",
    "dersId": "drs-ayt-cografya2",
    "dersAdi": "AYT Coğrafya-2",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Küresel Çevre ve Jeopolitik",
    "siraNo": 3,
    "konuAdi": "Küresel Sıcak Çatışma Bölgeleri ve Doğal Kaynaklar",
    "kazanimlar": [
      "Jeopolitik açıdan önemli boğazlar, kanallar ve enerji güzergâhları.",
      "Küresel sıcak çatışma bölgeleri (Ortadoğu, Kafkaslar vb.) ve su sorunları."
    ],
    "aciklama": "Jeopolitik güç mücadeleleri ve stratejik geçitler"
  },
  {
    "id": "kon-ayt-fel-1",
    "dersId": "drs-ayt-felsefe",
    "dersAdi": "AYT Felsefe Grubu",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "Mantık",
    "siraNo": 1,
    "konuAdi": "Klasik ve Modern Mantık",
    "kazanimlar": [
      "Mantığın tanımı, akıl ilkeleri (özdeşlik, çelişmezlik, üçüncü durumun olanaksızlığı, yeter sebep).",
      "Kavram ve terimler, önermeler (nitelik ve nicelik bakımından), karşı olma karesi.",
      "Kıyas kuralları ve sembolik mantığa giriş."
    ],
    "aciklama": "Mantık ilkeleri, önermeler, kıyas ve sembolik mantık"
  },
  {
    "id": "kon-ayt-fel-2",
    "dersId": "drs-ayt-felsefe",
    "dersAdi": "AYT Felsefe Grubu",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Psikoloji",
    "siraNo": 2,
    "konuAdi": "Psikolojinin Temel Süreçleri ve Öğrenme",
    "kazanimlar": [
      "Psikoloji yaklaşımları ve araştırma yöntemleri.",
      "Gelişim dönemleri, duyum ve algı, güdülenme ve heyecan.",
      "Öğrenme türleri (klasik/edimsel koşullanma, bilişsel öğrenme), bellek ve kişilik."
    ],
    "aciklama": "Duyum, algı, öğrenme kuramları ve bellek"
  },
  {
    "id": "kon-ayt-fel-3",
    "dersId": "drs-ayt-felsefe",
    "dersAdi": "AYT Felsefe Grubu",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 3,
    "uniteAdi": "Sosyoloji",
    "siraNo": 3,
    "konuAdi": "Sosyolojiye Giriş, Toplumsal Yapı ve Değişme",
    "kazanimlar": [
      "Sosyolojinin konusu ve yöntemleri.",
      "Toplumsal yapı, toplumsal statü, rol ve değerler.",
      "Toplumsal tabakalaşma, toplumsal değişme, hareketlilik ve kurumlar (aile, eğitim, din, ekonomi)."
    ],
    "aciklama": "Toplumsal yapı, tabakalaşma, değişme ve kurumlar"
  },
  {
    "id": "kon-ayt-din-1",
    "dersId": "drs-ayt-din",
    "dersAdi": "AYT Din Kültürü",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 1,
    "uniteAdi": "İnanç ve İbadet",
    "siraNo": 1,
    "konuAdi": "Dünya ve Ahiret & İnanç Meseleleri",
    "kazanimlar": [
      "Ahiret inancı ve evreleri (kıyamet, haşir, mizan, cennet/cehennem).",
      "Kur'an'a göre Hz. Muhammed ve sahabe örnekliği.",
      "İslam ve bilim ilişkisi, Müslüman bilginlerin medeniyete katkıları."
    ],
    "aciklama": "Ahiret hayatı, peygamberlik ve İslam medeniyetinde bilim"
  },
  {
    "id": "kon-ayt-din-2",
    "dersId": "drs-ayt-din",
    "dersAdi": "AYT Din Kültürü",
    "modulId": "yks",
    "sinif": "ortak",
    "uniteNo": 2,
    "uniteAdi": "Tasavvuf ve Güncel Meseleler",
    "siraNo": 2,
    "konuAdi": "İslam Düşüncesinde Tasavvufi Yorumlar ve Güncel Dini Meseleler",
    "kazanimlar": [
      "Tasavvufi düşüncenin oluşumu (Yesevilik, Kadirilik, Mevlevilik, Nakşibendilik, Alevilik-Bektaşilik).",
      "Güncel dini meseleler (tıp ve sağlıkla ilgili, ticari ve ekonomik konular).",
      "Din ve barış, şiddet karşıtı ilkeler."
    ],
    "aciklama": "Tasavvufi yorumlar, Alevilik-Bektaşilik ve güncel fıkhi meseleler"
  }
];

// G2: Sınav Havuzu Varsayılan Seed Verisi (8. Sınıf LGS, 12. Sınıf & Mezun YKS / MSÜ)
const SINAV_SEED = [
  // ── 8. SINIF: LGS (Liselere Geçiş Sistemi) ──
  {
    id: 'sinav-lgs-sozel',
    modulId: 'lgs',
    ad: 'LGS Sözel Bölüm',
    kisaltma: 'LGS-SÖZ',
    oturum: '1. Oturum (09:30)',
    soruSayisi: 50,
    sureDk: 75,
    hedefSinif: '8. Sınıf',
    aciklama: 'Türkçe (20), T.C. İnkılap Tarihi ve Atatürkçülük (10), Din Kültürü ve Ahlak Bilgisi (10), Yabancı Dil (10)'
  },
  {
    id: 'sinav-lgs-sayisal',
    modulId: 'lgs',
    ad: 'LGS Sayısal Bölüm',
    kisaltma: 'LGS-SAY',
    oturum: '2. Oturum (11:30)',
    soruSayisi: 40,
    sureDk: 80,
    hedefSinif: '8. Sınıf',
    aciklama: 'Matematik (20), Fen Bilimleri (20)'
  },
  {
    id: 'sinav-lgs-tam',
    modulId: 'lgs',
    ad: 'LGS Tam Deneme',
    kisaltma: 'LGS-TAM',
    oturum: '1. ve 2. Oturum (Tam Deneme)',
    soruSayisi: 90,
    sureDk: 155,
    hedefSinif: '8. Sınıf',
    aciklama: 'Sözel Bölüm (50 Soru - 75 dk) + Sayısal Bölüm (40 Soru - 80 dk) toplam 90 soru'
  },

  // ── 12. SINIF & MEZUN: YKS & MSÜ (Yükseköğretim Kurumları Sınavı) ──
  {
    id: 'sinav-yks-tyt',
    modulId: 'yks',
    ad: 'TYT (Temel Yeterlilik Testi)',
    kisaltma: 'TYT',
    oturum: '1. Oturum - Cumartesi (10:15)',
    soruSayisi: 120,
    sureDk: 165,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'Türkçe (40), Temel Matematik (40), Sosyal Bilimler (20) [Tarih 5, Coğrafya 5, Felsefe 5, Din 5], Fen Bilimleri (20) [Fizik 7, Kimya 7, Biyoloji 6]'
  },
  {
    id: 'sinav-yks-ayt-say',
    modulId: 'yks',
    ad: 'AYT Sayısal (SAY / MF)',
    kisaltma: 'AYT-SAY',
    oturum: '2. Oturum - Pazar (10:15)',
    soruSayisi: 80,
    sureDk: 180,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'Matematik (40) [İleri Matematik + Geometri], Fen Bilimleri (40) [Fizik 14, Kimya 13, Biyoloji 13]'
  },
  {
    id: 'sinav-yks-ayt-ea',
    modulId: 'yks',
    ad: 'AYT Eşit Ağırlık (EA / TM)',
    kisaltma: 'AYT-EA',
    oturum: '2. Oturum - Pazar (10:15)',
    soruSayisi: 80,
    sureDk: 180,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'Matematik (40) [İleri Matematik + Geometri], Türk Dili ve Edebiyatı - Sosyal Bilimler-1 (40) [Edebiyat 24, Tarih-1 10, Coğrafya-1 6]'
  },
  {
    id: 'sinav-yks-ayt-soz',
    modulId: 'yks',
    ad: 'AYT Sözel (SÖZ / TS)',
    kisaltma: 'AYT-SÖZ',
    oturum: '2. Oturum - Pazar (10:15)',
    soruSayisi: 80,
    sureDk: 180,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'Türk Dili ve Edebiyatı - Sosyal Bilimler-1 (40), Sosyal Bilimler-2 (40) [Tarih-2 11, Coğrafya-2 11, Felsefe Grubu 12, Din Kültürü 6]'
  },
  {
    id: 'sinav-yks-ayt-genel',
    modulId: 'yks',
    ad: 'AYT Genel (Tüm Alanlar)',
    kisaltma: 'AYT-GEN',
    oturum: '2. Oturum - Pazar (10:15)',
    soruSayisi: 160,
    sureDk: 180,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'Matematik (40), Fen Bilimleri (40), Edebiyat-Sosyal-1 (40), Sosyal Bilimler-2 (40) — Kurumsal ve çoklu alan deneme formatı'
  },
  {
    id: 'sinav-yks-ydt',
    modulId: 'yks',
    ad: 'YDT (Yabancı Dil Testi)',
    kisaltma: 'YDT',
    oturum: '3. Oturum - Pazar (15:45)',
    soruSayisi: 80,
    sureDk: 120,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'İngilizce / Almanca / Fransızca / Rusça / Arapça Yabancı Dil Testi (80 Soru, 120 dk)'
  },
  {
    id: 'sinav-yks-msu',
    modulId: 'yks',
    ad: 'MSÜ Sınavı (Askeri Öğrenci Belirleme)',
    kisaltma: 'MSÜ',
    oturum: 'Bahar Oturumu - Pazar (10:15)',
    soruSayisi: 120,
    sureDk: 165,
    hedefSinif: '12. Sınıf & Mezun',
    aciklama: 'Türkçe (40), Temel Matematik (40), Sosyal Bilimler (20), Fen Bilimleri (20) — ÖSYM TYT standart formatında genel prova'
  }
];

// G3: Zaman Bloklama Örnek Rutinler
const ZAMAN_RUTINLER = [
  // ── ARA SINIF ──
  {
    id: 'ara-okul-standart',
    modulId: 'ara-sinif',
    ad: 'Okul Dönemi Standart',
    aciklama: 'Hafta içi okul sonrası ders ve soru, hafta sonu tekrar',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '14', kategori: 'mola', baslik: 'Dinlenme' },
        { gun, saat: '15', kategori: 'konu', baslik: 'Konu Çalışması' },
        { gun, saat: '16', kategori: 'soru', baslik: 'Soru Çözümü' },
        { gun, saat: '19', kategori: 'soru', baslik: 'Akşam Tekrar' }
      ]),
      { gun: 'cmt', saat: '09', kategori: 'soru', baslik: 'Matematik' },
      { gun: 'cmt', saat: '10', kategori: 'konu', baslik: 'Fen / Türkçe' },
      { gun: 'cmt', saat: '11', kategori: 'soru', baslik: 'Karma Sorular' },
      { gun: 'cmt', saat: '14', kategori: 'mola', baslik: 'Serbest' },
      { gun: 'paz', saat: '10', kategori: 'konu', baslik: 'Haftalık Tekrar' },
      { gun: 'paz', saat: '11', kategori: 'mola', baslik: 'Serbest' }
    ]
  },
  {
    id: 'ara-yogun',
    modulId: 'ara-sinif',
    ad: 'Yoğunlaştırılmış',
    aciklama: 'Daha fazla soru çözümü ve akşam etütleri',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '14', kategori: 'mola', baslik: 'Dinlenme' },
        { gun, saat: '15', kategori: 'konu', baslik: 'Konu Çalışması' },
        { gun, saat: '16', kategori: 'soru', baslik: 'Soru Çözümü' },
        { gun, saat: '17', kategori: 'soru', baslik: 'Ek Soru' },
        { gun, saat: '19', kategori: 'soru', baslik: 'Akşam Seansı 1' },
        { gun, saat: '20', kategori: 'soru', baslik: 'Akşam Seansı 2' }
      ]),
      { gun: 'cmt', saat: '09', kategori: 'soru', baslik: 'Uzun Seans 1' },
      { gun: 'cmt', saat: '10', kategori: 'soru', baslik: 'Uzun Seans 2' },
      { gun: 'cmt', saat: '11', kategori: 'soru', baslik: 'Uzun Seans 3' },
      { gun: 'cmt', saat: '13', kategori: 'konu', baslik: 'Haftalık Konu' },
      { gun: 'cmt', saat: '14', kategori: 'konu', baslik: 'Konu Devam' },
      { gun: 'paz', saat: '10', kategori: 'konu', baslik: 'Haftalık Tekrar 1' },
      { gun: 'paz', saat: '11', kategori: 'konu', baslik: 'Haftalık Tekrar 2' },
      { gun: 'paz', saat: '14', kategori: 'soru', baslik: 'Pekiştirme' }
    ]
  },

  // ── LGS ──
  {
    id: 'lgs-standart',
    modulId: 'lgs',
    ad: 'LGS Standart',
    aciklama: 'Hafta içi branş soruları, hafta sonu deneme ve analiz',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '14', kategori: 'mola', baslik: 'Dinlenme' },
        { gun, saat: '15', kategori: 'soru', baslik: 'Branş Soruları 1' },
        { gun, saat: '16', kategori: 'soru', baslik: 'Branş Soruları 2' },
        { gun, saat: '17', kategori: 'konu', baslik: 'Eksik Konu' },
        { gun, saat: '19', kategori: 'soru', baslik: 'Akşam Soru Bankası 1' },
        { gun, saat: '20', kategori: 'soru', baslik: 'Akşam Soru Bankası 2' }
      ]),
      { gun: 'cmt', saat: '09', kategori: 'deneme', baslik: 'Deneme Sınavı 1' },
      { gun: 'cmt', saat: '10', kategori: 'deneme', baslik: 'Deneme Sınavı 2' },
      { gun: 'cmt', saat: '11', kategori: 'konu', baslik: 'Deneme Analizi' },
      { gun: 'cmt', saat: '12', kategori: 'konu', baslik: 'Telafi' },
      { gun: 'cmt', saat: '14', kategori: 'soru', baslik: 'Hata Soruları 1' },
      { gun: 'cmt', saat: '15', kategori: 'soru', baslik: 'Hata Soruları 2' },
      { gun: 'paz', saat: '10', kategori: 'konu', baslik: 'Zayıf Konu 1' },
      { gun: 'paz', saat: '11', kategori: 'konu', baslik: 'Zayıf Konu 2' },
      { gun: 'paz', saat: '13', kategori: 'soru', baslik: 'Pekiştirme' },
      { gun: 'paz', saat: '14', kategori: 'mola', baslik: 'Serbest' }
    ]
  },
  {
    id: 'lgs-yogun',
    modulId: 'lgs',
    ad: 'LGS Son 3 Ay Yoğun',
    aciklama: 'Hafta sonu tam deneme serisi, hafta içi rotasyon soruları',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '14', kategori: 'mola', baslik: 'Kısa Mola' },
        { gun, saat: '15', kategori: 'soru', baslik: 'Rotasyon 1' },
        { gun, saat: '16', kategori: 'soru', baslik: 'Rotasyon 2' },
        { gun, saat: '17', kategori: 'soru', baslik: 'Rotasyon 3' },
        { gun, saat: '19', kategori: 'konu', baslik: 'Akşam Konu' },
        { gun, saat: '20', kategori: 'soru', baslik: 'Akşam Soru' },
        { gun, saat: '21', kategori: 'konu', baslik: 'Gece Tekrar' }
      ]),
      { gun: 'cmt', saat: '09', kategori: 'deneme', baslik: 'LGS Tam Denemesi 1' },
      { gun: 'cmt', saat: '10', kategori: 'deneme', baslik: 'LGS Tam Denemesi 2' },
      { gun: 'cmt', saat: '11', kategori: 'deneme', baslik: 'LGS Tam Denemesi 3' },
      { gun: 'cmt', saat: '13', kategori: 'konu', baslik: 'Deneme Analizi 1' },
      { gun: 'cmt', saat: '14', kategori: 'konu', baslik: 'Deneme Analizi 2' },
      { gun: 'cmt', saat: '15', kategori: 'soru', baslik: 'Hata Soruları 1' },
      { gun: 'cmt', saat: '16', kategori: 'soru', baslik: 'Hata Soruları 2' },
      { gun: 'paz', saat: '09', kategori: 'soru', baslik: 'Karma Soru 1' },
      { gun: 'paz', saat: '10', kategori: 'soru', baslik: 'Karma Soru 2' },
      { gun: 'paz', saat: '11', kategori: 'soru', baslik: 'Karma Soru 3' },
      { gun: 'paz', saat: '13', kategori: 'konu', baslik: 'Kritik Eksikler 1' },
      { gun: 'paz', saat: '14', kategori: 'konu', baslik: 'Kritik Eksikler 2' }
    ]
  },

  // ── TYT-AYT (YKS) ──
  {
    id: 'yks-temel',
    modulId: 'yks',
    ad: '9-10. Sınıf Temel',
    aciklama: 'Okul dersleri ile paralel TYT temel oluşturma',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '14', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '15', kategori: 'konu', baslik: 'Günlük Konu 1' },
        { gun, saat: '16', kategori: 'konu', baslik: 'Günlük Konu 2' },
        { gun, saat: '17', kategori: 'soru', baslik: 'Konu Soruları' },
        { gun, saat: '19', kategori: 'soru', baslik: 'TYT Soruları 1' },
        { gun, saat: '20', kategori: 'soru', baslik: 'TYT Soruları 2' }
      ]),
      { gun: 'cmt', saat: '09', kategori: 'konu', baslik: 'Haftalık Tekrar 1' },
      { gun: 'cmt', saat: '10', kategori: 'konu', baslik: 'Haftalık Tekrar 2' },
      { gun: 'cmt', saat: '11', kategori: 'soru', baslik: 'Soru Bankası 1' },
      { gun: 'cmt', saat: '12', kategori: 'soru', baslik: 'Soru Bankası 2' },
      { gun: 'paz', saat: '10', kategori: 'soru', baslik: 'TYT Pratik 1' },
      { gun: 'paz', saat: '11', kategori: 'soru', baslik: 'TYT Pratik 2' },
      { gun: 'paz', saat: '14', kategori: 'mola', baslik: 'Serbest' }
    ]
  },
  {
    id: 'yks-hazirlik',
    modulId: 'yks',
    ad: '11. Sınıf Hazırlık',
    aciklama: 'Haftalık TYT ve AYT denemesi, konu ve soru dengesi',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '14', kategori: 'okul', baslik: 'Okul' },
        { gun, saat: '15', kategori: 'soru', baslik: 'TYT + AYT 1' },
        { gun, saat: '16', kategori: 'soru', baslik: 'TYT + AYT 2' },
        { gun, saat: '17', kategori: 'soru', baslik: 'TYT + AYT 3' },
        { gun, saat: '19', kategori: 'konu', baslik: 'AYT Konusu 1' },
        { gun, saat: '20', kategori: 'konu', baslik: 'AYT Konusu 2' },
        { gun, saat: '21', kategori: 'soru', baslik: 'Gece Pekiştirme' }
      ]),
      { gun: 'cmt', saat: '09', kategori: 'deneme', baslik: 'TYT Denemesi 1' },
      { gun: 'cmt', saat: '10', kategori: 'deneme', baslik: 'TYT Denemesi 2' },
      { gun: 'cmt', saat: '11', kategori: 'deneme', baslik: 'TYT Denemesi 3' },
      { gun: 'cmt', saat: '13', kategori: 'deneme', baslik: 'AYT Bölümü 1' },
      { gun: 'cmt', saat: '14', kategori: 'deneme', baslik: 'AYT Bölümü 2' },
      { gun: 'cmt', saat: '15', kategori: 'konu', baslik: 'Deneme Analizi 1' },
      { gun: 'cmt', saat: '16', kategori: 'konu', baslik: 'Deneme Analizi 2' },
      { gun: 'paz', saat: '09', kategori: 'konu', baslik: 'Zayıf Konular 1' },
      { gun: 'paz', saat: '10', kategori: 'konu', baslik: 'Zayıf Konular 2' },
      { gun: 'paz', saat: '11', kategori: 'konu', baslik: 'Zayıf Konular 3' },
      { gun: 'paz', saat: '13', kategori: 'soru', baslik: 'Hata Defteri 1' },
      { gun: 'paz', saat: '14', kategori: 'soru', baslik: 'Hata Defteri 2' }
    ]
  },
  {
    id: 'yks-sprint',
    modulId: 'yks',
    ad: '12. Sınıf / Mezun Sprint',
    aciklama: 'Yüksek yoğunluklu soru maratonu ve çift deneme',
    hucreler: [
      ...['pzt', 'sal', 'car', 'per', 'cum'].flatMap(gun => [
        { gun, saat: '08', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '09', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '10', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '11', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '12', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '13', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '14', kategori: 'okul', baslik: 'Okul (varsa)' },
        { gun, saat: '15', kategori: 'soru', baslik: 'TYT + AYT 1' },
        { gun, saat: '16', kategori: 'soru', baslik: 'TYT + AYT 2' },
        { gun, saat: '17', kategori: 'soru', baslik: 'TYT + AYT 3' },
        { gun, saat: '19', kategori: 'konu', baslik: 'Akşam Blok 1' },
        { gun, saat: '20', kategori: 'soru', baslik: 'Akşam Blok 2' },
        { gun, saat: '21', kategori: 'konu', baslik: 'Akşam Blok 3' },
        { gun, saat: '22', kategori: 'konu', baslik: 'Gece Özet' }
      ]),
      { gun: 'cmt', saat: '08', kategori: 'deneme', baslik: 'Tam TYT 1' },
      { gun: 'cmt', saat: '09', kategori: 'deneme', baslik: 'Tam TYT 2' },
      { gun: 'cmt', saat: '10', kategori: 'deneme', baslik: 'Tam TYT 3' },
      { gun: 'cmt', saat: '12', kategori: 'deneme', baslik: 'Tam AYT 1' },
      { gun: 'cmt', saat: '13', kategori: 'deneme', baslik: 'Tam AYT 2' },
      { gun: 'cmt', saat: '14', kategori: 'deneme', baslik: 'Tam AYT 3' },
      { gun: 'cmt', saat: '15', kategori: 'konu', baslik: 'Analiz & Telafi 1' },
      { gun: 'cmt', saat: '16', kategori: 'konu', baslik: 'Analiz & Telafi 2' },
      { gun: 'paz', saat: '09', kategori: 'soru', baslik: 'Soru Maratonu 1' },
      { gun: 'paz', saat: '10', kategori: 'soru', baslik: 'Soru Maratonu 2' },
      { gun: 'paz', saat: '11', kategori: 'soru', baslik: 'Soru Maratonu 3' },
      { gun: 'paz', saat: '12', kategori: 'soru', baslik: 'Soru Maratonu 4' },
      { gun: 'paz', saat: '14', kategori: 'konu', baslik: 'Kritik Konular 1' },
      { gun: 'paz', saat: '15', kategori: 'konu', baslik: 'Kritik Konular 2' },
      { gun: 'paz', saat: '16', kategori: 'konu', baslik: 'Hata Tekrarı' }
    ]
  }
];

// Excel Kaynak Şablonu
const EXCEL_KAYNAK_SABLONU = {
  sutunlar: [
    { key: 'ad',       label: 'Kaynak Adı',  zorunlu: true,  aciklama: 'Örn: Kazanım Soru Bankası' },
    { key: 'yayinevi', label: 'Yayınevi',    zorunlu: true,  aciklama: 'Örn: MEB, Bilgi Sarmal, Hız' },
    { key: 'tur',      label: 'Tür',         zorunlu: true,  aciklama: 'Soru Bankası / Fasikül / Deneme / Kaynak Kitap' },
    { key: 'modulId',  label: 'Modül',       zorunlu: true,  aciklama: 'ara-sinif, lgs, yks (virgülle çoklu yazılabilir)' },
    { key: 'zorluk',   label: 'Zorluk (1-5)',zorunlu: false, aciklama: '1 ile 5 arası sayı (varsayılan: 3)' },
    { key: 'aciklama', label: 'Açıklama',    zorunlu: false, aciklama: 'Kaynak ile ilgili açıklama' }
  ],
  ornekSatir: {
    ad: 'Kazanım Soru Bankası',
    yayinevi: 'MEB',
    tur: 'Soru Bankası',
    modulId: 'ara-sinif, lgs, yks',
    zorluk: '3',
    aciklama: 'Temel düzey MEB kazanım testleri'
  }
};

// G8: Örnek Deneme Sınavı Verisi (8. Sınıf LGS Denemesi)
const SAMPLE_DENEME_CSV = `,,,,,,,,
,Bilgi,Değer,,,,,,
,Grubu,O8/A,,,,,,
,Öğrenci No,00416,,,,,,
,Soyadı - Adı,ÖZDEMİR ŞEVİN ELFİN,,,,,,
,Sınav Tarihi,2026-09-25,,,,,,
,Sınav Adı,8. Sınıf Okul Deneme 2,,,,,,
,Puanı,374.261,,,,,,
,Genel Derecesi,509,,,,,,
,Kurum Derecesi,11,,,,,,
,Şube Derecesi,2,,,,,,
,Genel Katılım,747,,,,,,
,Kurum Katılım,23,,,,,,
,Şube Katılım,10,,,,,,
,,,,,,,,
,Dersler,Türkçe,Matematik,Din Kül.,Fen ve Tekn.,Sosyal Bilg.,Y. Dil,Toplam
,Soru Sayısı,20,20,10,20,10,10,90
,Doğru Cevap,19,7,7,14,7,10,64
,Yanlış Cevap,1,12,3,6,3,0,25
,Net,18.67,3,6,12,6,10,55.67
,Başarı Oranı (%),93.33,15,60,60,60,100,61.85
,Kurum Net Ort.,15.48,8.7,6.52,13.65,5.35,6.26,55.96
,Sınav Net Ort.,16,10,7,15,6,6,60
,,,,,,
,Ders,Konu Adı,Soru Sayısı (SS),Doğru (D),Yanlış (Y),Başarı (%)
,TÜRKÇE,Cümle Anlamı,7,7,0,100
,TÜRKÇE,Deyim ve Atasözü,3,2,1,56
,TÜRKÇE,Kelimede (Sözcükte) Anlam,1,1,0,100
,TÜRKÇE,Okudukları ile ilgili çıkarımlarda bulunur.,1,1,0,100
,TÜRKÇE,Cümle Yorumu,6,6,0,100
,TÜRKÇE,"Deyim, atasözü ve özdeyişlerin metne katkısını belirler.",1,1,0,100
,TÜRKÇE,Metnin ana fikrini/ana duygusunu belirler.,1,1,0,100
,SOSYAL BİLG.,Mustafa Kemal'in askerlik hayatı ile ilgili olayları ve olguları onun...,1,1,0,100
,SOSYAL BİLG.,Avrupa'daki gelişmelerin yansımaları bağlamında Osmanlı Devle...,4,3,1,67
,SOSYAL BİLG.,Mustafa Kemal'in çocukluk ve öğrenim hayatından hareketle onu...,5,3,2,47
,MATEMATİK,İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ort...,8,1,6,-12
,MATEMATİK,"Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur, po...",7,3,4,24
,MATEMATİK,Verilen iki doğal sayının aralarında asal olup olmadığını belirler.,5,3,2,47
,FEN VE TEKN.,İklim ve hava olayları arasındaki farkı açıklar.,6,4,2,56
,FEN VE TEKN.,Mevsimlerin oluşumuna yönelik tahminlerde bulunur.,12,10,2,78
,FEN VE TEKN.,İklim biliminin (klimatoloji) bir bilim dalı olduğunu ve bu alanda ça...,1,0,1,-33
,FEN VE TEKN.,Küresel iklim değişikliklerinin nedenlerini ve olası sonuçlarını tartı...,1,0,1,-33
,DİN KÜL.,Kaza ve kader ile ilgili kavramları analiz eder.,5,4,1,73
,DİN KÜL.,Kader ve kaza inancını ayet ve hadislerle açıklar.,3,1,2,11
,DİN KÜL.,Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları so...,2,2,0,100
,İNGİLİZCE,Students will be able to understand short and simple texts about...,4,4,0,100
,İNGİLİZCE,Students will be able to understand the specific information in sh...,4,4,0,100
,İNGİLİZCE,Students will be able to understand short and simple texts about...,1,1,0,100
,İNGİLİZCE,Teen Life (Expressing preferences),1,1,0,100`;

// G2: Excel Ders & Konu Şablonları
const EXCEL_DERS_SABLONU = {
  sutunlar: [
    { key: 'ad',          label: 'Ders Adı',        zorunlu: true,  aciklama: 'Örn: Matematik' },
    { key: 'kisaltma',    label: 'Kısaltma',         zorunlu: true,  aciklama: 'Örn: MAT (max 5 karakter)' },
    { key: 'modulId',     label: 'Modül',            zorunlu: true,  aciklama: 'ara-sinif / lgs / yks' },
    { key: 'sinif',       label: 'Sınıf',            zorunlu: true,  aciklama: '5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / ortak' },
    { key: 'haftalikSaat',label: 'Haftalık Saat',    zorunlu: false, aciklama: 'Sayı, örn: 5' },
    { key: 'sinavdaMi',   label: 'Sınavda mı?',      zorunlu: false, aciklama: 'evet / hayır' },
    { key: 'soruSayisi',  label: 'Soru Sayısı',      zorunlu: false, aciklama: 'Sınavdaysa kaç soru, örn: 20' }
  ],
  ornekSatir: {
    ad: 'Matematik', kisaltma: 'MAT', modulId: 'lgs', sinif: '8',
    haftalikSaat: '5', sinavdaMi: 'evet', soruSayisi: '20'
  }
};

const EXCEL_KONU_SABLONU = {
  sutunlar: [
    { key: 'dersAdi',     label: 'Ders Adı',           zorunlu: true,  aciklama: 'Örn: Matematik' },
    { key: 'uniteNo',     label: 'Ünite No',           zorunlu: true,  aciklama: 'Sayı, örn: 1' },
    { key: 'uniteAdi',    label: 'Ünite Adı',          zorunlu: true,  aciklama: 'Örn: Doğal Sayılarla İşlemler' },
    { key: 'siraNo',      label: 'Sıra No',            zorunlu: false, aciklama: 'Sayı, örn: 1' },
    { key: 'konuAdi',     label: 'Konu / Kazanım Adı', zorunlu: true,  aciklama: 'Örn: Milyonlar ve Basamak Değerleri' },
    { key: 'aciklama',    label: 'Açıklama / Detay',   zorunlu: false, aciklama: 'Kazanım detayı veya konu notu' }
  ],
  ornekSatir: {
    dersAdi: 'Matematik',
    uniteNo: '1',
    uniteAdi: 'Doğal Sayılarla İşlemler',
    siraNo: '1',
    konuAdi: 'Milyonlar ve Sayı Basamakları',
    aciklama: 'Basamak analizi ve bölük kavramı'
  }
};

// Global scope bağlantıları
if (typeof window !== 'undefined') {
  window.MODULLER = MODULLER;
  window.SINIFLAR = SINIFLAR;
  window.DERSLER = DERSLER;
  window.KONULAR = KONULAR;
  window.KONU_DURUMLARI = KONU_DURUMLARI;
  window.GOREV_DURUMLARI = GOREV_DURUMLARI;
  window.EXCEL_OGRENCI_SABLONU = EXCEL_OGRENCI_SABLONU;
  window.ZAMAN_KATEGORILER = ZAMAN_KATEGORILER;
  window.ZAMAN_FAALIYETLER = ZAMAN_FAALIYETLER;
  window.ZAMAN_FAALIYETLER_FLAT = ZAMAN_FAALIYETLER_FLAT;
  window.ZAMAN_SLOTLARI = ZAMAN_SLOTLARI;
  window.EXCEL_DERS_SABLONU = EXCEL_DERS_SABLONU;
  window.EXCEL_KONU_SABLONU = EXCEL_KONU_SABLONU;
  window.EXCEL_KAYNAK_SABLONU = EXCEL_KAYNAK_SABLONU;
  window.SINAV_SEED = SINAV_SEED;
  window.ZAMAN_RUTINLER = ZAMAN_RUTINLER;
  window.SAMPLE_DENEME_CSV = SAMPLE_DENEME_CSV;
}
