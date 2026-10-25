/**
 * Plantrack MCP — Veri Bekçisi (Validation & Reference Resolution)
 *
 * Amaç: MCP üzerinden gelen hiçbir yazma, veri tabanındaki mevcut kayıtlarla
 * eşleştirilmeden diske inmesin.
 *
 *   ham args → şema doğrulama → referans çözümleme → normalizasyon → db metodu
 *
 * Bu modül yalnızca MCP tarafında çalışır; tarayıcı (js/store.js) tarafına
 * bağımlı değildir. Anahtar üreticileri uygulamanın kullandığı formatla
 * birebir aynıdır (bkz. js/store.js:1863, 1926, 2034).
 */

'use strict';

// ─────────────────────────────────────────────────────────────
// SABİTLER (js/data.js ile eşleşir)
// ─────────────────────────────────────────────────────────────
const MODUL_IDS = ['ara-sinif', 'lgs', 'yks'];
const SINIF_DEGERLERI = ['5', '6', '7', '8', '9', '10', '11', '12', 'mezun'];
const GOREV_DURUMLARI = ['bekliyor', 'devam_ediyor', 'tamamlandi', 'gecikti'];
const KONU_DURUMLARI = ['islenmedi', 'calisiliyor', 'tamam', 'tekrar_lazim'];
const HATA_TURLERI = ['Bilgi Eksikliği', 'Dikkat Hatası', 'Soru Kökü/Anlama', 'Süre/Yetişmedi', 'Deneme Yanlışı'];
const KAYNAK_TURLERI = ['Soru Bankası', 'Fasikül', 'Deneme', 'Konu Anlatımı', 'Yaprak Test', 'Kitap'];
const NOT_TURLERI = ['yazili', 'performans', 'proje'];

const ZAMAN_KATEGORILERI = {
  okul: { label: 'Okul / Ders', renk: '#3b82f6', bg: '#eff6ff' },
  soru: { label: 'Soru Çözümü', renk: '#10b981', bg: '#ecfdf5' },
  konu: { label: 'Konu Çalışması', renk: '#8b5cf6', bg: '#f5f3ff' },
  deneme: { label: 'Deneme Sınavı', renk: '#f59e0b', bg: '#fffbeb' },
  mola: { label: 'Mola / Serbest Zaman', renk: '#6b7280', bg: '#f9fafb' },
  ozel: { label: 'Özel Not', renk: '#0d9488', bg: '#f0fdfa' }
};

const GUN_ALIAS = {
  pzt: 'pzt', pazartesi: 'pzt', pts: 'pzt', '1': 'pzt',
  sal: 'sal', sali: 'sal', '2': 'sal',
  car: 'car', carsamba: 'car', crs: 'car', '3': 'car',
  per: 'per', persembe: 'per', prs: 'per', '4': 'per',
  cum: 'cum', cuma: 'cum', '5': 'cum',
  cmt: 'cmt', cumartesi: 'cmt', cts: 'cmt', '6': 'cmt',
  paz: 'paz', pazar: 'paz', '7': 'paz', '0': 'paz'
};

const VERI_KOLEKSIYONLARI = [
  'ogrenciler', 'gorevler', 'ogrenciKonuDurumlari', 'hataKayitlari', 'sinifNotlari',
  'calismaKayitlari', 'denemeSinavlari', 'dersler', 'konular', 'kaynaklar', 'sinavlar'
];

// ─────────────────────────────────────────────────────────────
// HATA TİPİ
// ─────────────────────────────────────────────────────────────
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'INVALID_INPUT';
    this.details = details || null;
  }
}

// ─────────────────────────────────────────────────────────────
// METİN / TARİH / ANAHTAR YARDIMCILARI
// ─────────────────────────────────────────────────────────────
function trLower(value) {
  return String(value == null ? '' : value)
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLocaleLowerCase('tr-TR');
}

/** Aksan/Türkçe karakterleri sadeleştirir; karşılaştırma için. */
function fold(value) {
  return trLower(value)
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

function str(value, field) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') {
    throw new ValidationError(`"${field}" metin olmalı, nesne/dizi geldi.`);
  }
  const text = String(value).trim();
  // Bozuk kodlama koruması: U+FFFD (replacement character), yanlış charset ile
  // yazılmış metnin işaretidir (örn. "Öğle" → "Ö��le"). Veriye girmeden durdur.
  if (text.includes('\uFFFD')) {
    throw new ValidationError(
      `"${field}" bozuk karakter içeriyor (kodlama hatası): ${JSON.stringify(text)}. ` +
      'Metni UTF-8 olarak yeniden gönderin.'
    );
  }
  return text;
}

function num(value, field, { min = null, max = null, fallback = 0 } = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(String(value).replace(',', '.'));
  if (!isFinite(n)) {
    throw new ValidationError(`"${field}" sayı olmalı: ${JSON.stringify(value)}`);
  }
  if (min !== null && n < min) throw new ValidationError(`"${field}" en az ${min} olmalı: ${n}`);
  if (max !== null && n > max) throw new ValidationError(`"${field}" en fazla ${max} olmalı: ${n}`);
  return n;
}

function bool(value) {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === null || value === '') return false;
  return ['true', '1', 'evet', 'yes', 'e', 'var'].includes(trLower(value).trim());
}

function makeId(prefix, existingIds) {
  const set = existingIds || null;
  for (let i = 0; i < 100; i++) {
    const id = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!set || !set.has(id)) return id;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** YYYY-MM-DD üretir. dd.mm.yyyy / dd/mm/yyyy / ISO kabul eder. */
function normDate(value, field, { required = false } = {}) {
  const raw = str(value, field);
  if (!raw) {
    if (required) throw new ValidationError(`"${field}" zorunlu (YYYY-MM-DD).`);
    return '';
  }
  let y, m, d;
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    y = +match[1]; m = +match[2]; d = +match[3];
  } else {
    match = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (match) { d = +match[1]; m = +match[2]; y = +match[3]; }
  }
  if (!y) throw new ValidationError(`"${field}" tarih formatı geçersiz: "${raw}" (YYYY-MM-DD bekleniyor).`);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new ValidationError(`"${field}" geçersiz takvim tarihi: "${raw}"`);
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function normYilAy(value, field, { required = false } = {}) {
  const raw = str(value, field);
  if (!raw) {
    if (required) throw new ValidationError(`"${field}" zorunlu (YYYY-MM).`);
    return '';
  }
  const m = raw.match(/^(\d{4})[-\/.](\d{1,2})$/);
  if (!m) throw new ValidationError(`"${field}" dönem formatı geçersiz: "${raw}" (YYYY-MM bekleniyor).`);
  const month = +m[2];
  if (month < 1 || month > 12) throw new ValidationError(`"${field}" ay değeri geçersiz: ${month}`);
  return `${m[1]}-${String(month).padStart(2, '0')}`;
}

function normTur(value, field) {
  const raw = str(value, field);
  if (!raw) return '';
  const m = raw.match(/(\d{1,2})/);
  if (!m) throw new ValidationError(`"${field}" tur numarası olmalı: "${raw}"`);
  return String(parseInt(m[1], 10));
}

function normModulId(value, { sinif = null, required = false, field = 'modulId' } = {}) {
  const raw = fold(value);
  const bySinif = (() => {
    if (!sinif || String(sinif) === 'ortak') return '';
    const s = String(sinif);
    if (['5', '6', '7', '9', '10', '11'].includes(s)) return 'ara-sinif';
    if (s === '8') return 'lgs';
    if (['12', 'mezun'].includes(s)) return 'yks';
    return '';
  })();

  if (raw) {
    let modul = '';
    if (raw === 'arasinif' || raw === 'ortaokul' || raw === 'orta' || raw === 'ara') modul = 'ara-sinif';
    else if (raw === 'lgs' || raw === '8' || raw === 'liselergirissistemi') modul = 'lgs';
    else if (raw === 'yks' || raw === 'tyt' || raw === 'ayt' || raw === 'universite' || raw === '12' || raw === 'mezun') modul = 'yks';
    else throw new ValidationError(`"${field}" geçersiz: "${value}". Geçerli değerler: ${MODUL_IDS.join(', ')}`);
    if (bySinif && modul !== bySinif) {
      throw new ValidationError(`"${field}" (${modul}) sınıf (${sinif} → ${bySinif}) ile uyuşmuyor.`);
    }
    return modul;
  }
  if (bySinif) return bySinif;
  if (required) throw new ValidationError(`"${field}" zorunlu. Geçerli değerler: ${MODUL_IDS.join(', ')}`);
  return '';
}

function normSinif(value, { required = false, allowOrtak = false } = {}) {
  let raw = fold(value);
  if (!raw) {
    if (required) throw new ValidationError('"sinif" zorunlu (5-12 veya mezun).');
    return '';
  }
  const m = raw.match(/(\d{1,2})/);
  if (m) raw = String(parseInt(m[1], 10));
  if (raw === 'mezun') return 'mezun';
  if (allowOrtak && (raw === 'ortak' || raw === 'hepsi' || raw === 'all')) return 'ortak';
  if (!SINIF_DEGERLERI.includes(raw)) {
    throw new ValidationError(`"sinif" geçersiz: "${value}". Geçerli değerler: ${SINIF_DEGERLERI.join(', ')}`);
  }
  return raw;
}

function normTaskDurum(value, field = 'durum') {
  const raw = fold(value);
  if (!raw) return '';
  if (raw === 'tamam' || raw === 'tamamlandi' || raw === 'bitti' || raw === 'done') return 'tamamlandi';
  if (raw === 'bekliyor' || raw === 'beklemede' || raw === 'yapilacak') return 'bekliyor';
  if (raw === 'devamediyor' || raw === 'devam' || raw === 'suruyor') return 'devam_ediyor';
  if (raw === 'gecikti' || raw === 'gecikmis' || raw === 'suresigecti') return 'gecikti';
  throw new ValidationError(`"${field}" geçersiz: "${value}". Geçerli: ${GOREV_DURUMLARI.join(', ')}`);
}

function normKonuDurum(value, field = 'durum') {
  const raw = fold(value);
  if (!raw) return '';
  if (raw === 'tamam' || raw === 'tamamlandi' || raw === 'bitti' || raw === 'islenildi') return 'tamam';
  if (raw === 'islenmedi' || raw === 'yapilmadi' || raw === 'bos') return 'islenmedi';
  if (raw === 'calisiliyor' || raw === 'devamediyor' || raw === 'devam') return 'calisiliyor';
  if (raw === 'tekrarlazim' || raw === 'tekrar' || raw === 'zayif') return 'tekrar_lazim';
  throw new ValidationError(`"${field}" geçersiz: "${value}". Geçerli: ${KONU_DURUMLARI.join(', ')}`);
}

function normHataTuru(value, { required = false } = {}) {
  const raw = str(value, 'hataTuru');
  if (!raw) {
    if (required) throw new ValidationError(`"hataTuru" zorunlu. Geçerli: ${HATA_TURLERI.join(', ')}`);
    return '';
  }
  const f = fold(raw);
  if (f.includes('bilgi') || f.includes('eksik')) return 'Bilgi Eksikliği';
  if (f.includes('dikkat')) return 'Dikkat Hatası';
  if (f.includes('kok') || f.includes('anlama') || f.includes('okuma')) return 'Soru Kökü/Anlama';
  if (f.includes('sure') || f.includes('yetis')) return 'Süre/Yetişmedi';
  if (f.includes('deneme')) return 'Deneme Yanlışı';
  throw new ValidationError(`"hataTuru" geçersiz: "${value}". Geçerli: ${HATA_TURLERI.join(', ')}`);
}

function normSaat(value, field) {
  const raw = str(value, field).replace('.', ':');
  if (!raw) return '';
  const m = raw.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) throw new ValidationError(`"${field}" saat formatı geçersiz: "${value}" (HH:MM bekleniyor).`);
  const h = +m[1];
  const dk = m[2] ? +m[2] : 0;
  if (h > 23 || dk > 59) throw new ValidationError(`"${field}" saat aralığı geçersiz: "${value}"`);
  return `${String(h).padStart(2, '0')}:${String(dk).padStart(2, '0')}`;
}

function normGun(value) {
  const f = fold(value);
  const day = GUN_ALIAS[f];
  if (!day) throw new ValidationError(`"gun" geçersiz: "${value}". Geçerli: pzt, sal, car, per, cum, cmt, paz`);
  return day;
}

function normSlotKey(value) {
  const raw = str(value, 'slotKey');
  const m = raw.match(/^([^_]+)[_\- ](\d{1,2}(?:[:.]\d{2})?)$/);
  if (!m) throw new ValidationError(`"slotKey" geçersiz: "${value}" (örn: Pzt_08:30).`);
  return `${normGun(m[1])}_${normSaat(m[2], 'slotKey')}`;
}

/** Uygulamanın kullandığı anahtarlar — js/store.js ile aynı format. */
function keyKonuSoru(ogrenciId, konuId, yilAy, tur) {
  return `${ogrenciId}_${konuId}_${yilAy}_hf${tur}`;
}
function keyAliskanlikAySonu(ogrenciId, aliskanlikId, yilAy) {
  return `${ogrenciId}_${aliskanlikId}_${yilAy}`;
}
function keyAliskanlikNot(ogrenciId, yilAy) {
  return `${ogrenciId}_${yilAy}`;
}

// ─────────────────────────────────────────────────────────────
// YAZMA GÜVENLİĞİ: alan beyaz listesi
// ─────────────────────────────────────────────────────────────
function pickAllowed(input, allowed, warnings, label) {
  const out = {};
  const unknown = [];
  Object.keys(input || {}).forEach(key => {
    if (allowed.includes(key)) out[key] = input[key];
    else unknown.push(key);
  });
  if (unknown.length && warnings) {
    warnings.push(`${label}: tanınmayan alan(lar) yok sayıldı → ${unknown.join(', ')}`);
  }
  return out;
}

const ALANLAR = {
  ogrenci: ['ad', 'soyad', 'adSoyad', 'sinif', 'modulId', 'okul', 'ogrenciTel', 'veliAd', 'veliTel', 'hedef', 'kayitTarihi', 'renk', 'seciliKaynaklar', 'ogrenciNo', 'sube', 'grup'],
  gorev: ['ogrenciId', 'dersId', 'konuId', 'kaynakId', 'baslik', 'aciklama', 'hedefSoru', 'cozulenSoru', 'dogruSoru', 'yanlisSoru', 'sureDk', 'durum', 'deadline', 'olusturmaTarihi', 'tamamlanmaTarihi', 'not'],
  hata: ['ogrenciId', 'dersId', 'konuId', 'hataTuru', 'aciklama', 'asama', 'telafiDurumu', 'tekrarTarihi', 'olusturmaTarihi'],
  ders: ['modulId', 'sinif', 'ad', 'kisaltma', 'renk', 'ikon', 'haftalikSaat', 'sinavdaMi', 'soruSayisi'],
  konu: ['dersId', 'modulId', 'sinif', 'uniteNo', 'uniteAdi', 'siraNo', 'konuAdi', 'aciklama', 'kazanimlar'],
  kaynak: ['ad', 'yayinevi', 'yayinEvi', 'modulId', 'tur', 'zorluk', 'aciklama', 'dersId'],
  not: ['ogrenciId', 'dersId', 'sinavAdi', 'not', 'tur', 'tarih'],
  deneme: ['ogrenciId', 'ad', 'sinavAdi', 'baslik', 'tarih', 'sinavTarihi', 'tur', 'dersler', 'konular', 'toplam', 'puan', 'dosyaAdi', 'grup', 'ogrenciNo']
};

// ─────────────────────────────────────────────────────────────
// REFERANS ÇÖZÜMLEME
// ─────────────────────────────────────────────────────────────
function adayListesi(list, mapFn, limit) {
  return list.slice(0, limit || 8).map(mapFn).join(' | ');
}

function resolveStudent(db, ref, { required = true, field = 'ogrenciId' } = {}) {
  const raw = str(ref, field);
  if (!raw) {
    if (required) throw new ValidationError(`"${field}" zorunlu. Önce plantrack_list_students ile öğrenci seçin.`);
    return null;
  }
  const students = (db.data && db.data.ogrenciler) || [];
  let found = students.find(s => String(s.id) === raw);
  let warning = '';
  if (!found) {
    const f = fold(raw);
    const exact = students.filter(s => fold(s.adSoyad) === f || fold(`${s.ad} ${s.soyad}`) === f);
    if (exact.length === 1) found = exact[0];
    else if (exact.length > 1) {
      throw new ValidationError(`Öğrenci adı birden fazla kayda uyuyor: "${raw}". ID ile seçin.`, {
        adaylar: exact.map(s => ({ id: s.id, adSoyad: s.adSoyad }))
      });
    } else {
      const partial = students.filter(s => fold(s.adSoyad).includes(f) || fold(s.ad || '').includes(f));
      if (partial.length === 1) { found = partial[0]; warning = `Öğrenci adı eşleştirildi: "${raw}" → ${found.adSoyad} (${found.id})`; }
      else if (partial.length > 1) {
        throw new ValidationError(`Öğrenci adı birden fazla kayda benziyor: "${raw}". ID ile seçin.`, {
          adaylar: partial.map(s => ({ id: s.id, adSoyad: s.adSoyad }))
        });
      }
    }
  }
  if (!found) {
    throw new ValidationError(`Öğrenci bulunamadı: "${raw}". Kayıtlı öğrenciler: ${adayListesi(students, s => s.adSoyad + ' (' + s.id + ')') || '(yok)'}`);
  }
  return { id: String(found.id), record: found, warning };
}

function findCourses(db, ref, opts) {
  const courses = (db.data && db.data.dersler) || [];
  const raw = str(ref, 'dersId');
  if (!raw) return [];
  let pool = courses;
  if (opts && opts.modulId) pool = pool.filter(c => c.modulId === opts.modulId);
  if (opts && opts.sinif) {
    const s = String(opts.sinif);
    const bySinif = pool.filter(c => String(c.sinif) === s || String(c.sinif) === 'ortak');
    if (bySinif.length) pool = bySinif;
  }
  const exactId = pool.find(c => String(c.id) === raw);
  if (exactId) return [exactId];
  const f = fold(raw);
  const exact = pool.filter(c => fold(c.ad) === f || fold(c.kisaltma) === f);
  if (exact.length) return exact;
  return pool.filter(c => fold(c.ad).includes(f) || fold(c.kisaltma) === f || f.includes(fold(c.ad)));
}

function resolveCourse(db, ref, opts) {
  const raw = str(ref, 'dersId');
  if (!raw) {
    if (opts && opts.required) throw new ValidationError('"dersId" zorunlu. Önce plantrack_list_courses ile ders seçin.');
    return null;
  }
  const found = findCourses(db, raw, opts || {});
  if (!found.length) {
    const all = (db.data && db.data.dersler) || [];
    throw new ValidationError(`Ders bulunamadı: "${raw}". Kayıtlı dersler: ${adayListesi(all, c => c.ad + ' (' + c.id + ')') || '(yok)'}`);
  }
  if (found.length > 1) {
    throw new ValidationError(`Ders adı birden fazla kayda uyuyor: "${raw}". ID ile seçin.`, {
      adaylar: found.map(c => ({ id: c.id, ad: c.ad, modulId: c.modulId, sinif: c.sinif }))
    });
  }
  return { id: String(found[0].id), record: found[0], warning: String(found[0].id) === raw ? '' : `Ders eşleştirildi: "${raw}" → ${found[0].ad} (${found[0].id})` };
}

function resolveTopic(db, ref, opts) {
  const raw = str(ref, 'konuId');
  if (!raw) {
    if (opts && opts.required) throw new ValidationError('"konuId" zorunlu. Önce plantrack_list_topics ile konu seçin.');
    return null;
  }
  const topics = (db.data && db.data.konular) || [];
  let pool = topics;
  if (opts && opts.dersId) pool = pool.filter(k => String(k.dersId) === String(opts.dersId));
  if (!pool.length) pool = topics;

  const byId = pool.find(k => String(k.id) === raw);
  if (byId) return { id: String(byId.id), record: byId, warning: '' };

  const f = fold(raw);
  const exact = pool.filter(k => fold(k.konuAdi) === f);
  if (exact.length === 1) return { id: String(exact[0].id), record: exact[0], warning: `Konu eşleştirildi: "${raw}" → ${exact[0].konuAdi} (${exact[0].id})` };
  if (exact.length > 1) {
    throw new ValidationError(`Konu adı birden fazla kayda uyuyor: "${raw}". Konu ID ile seçin.`, {
      adaylar: exact.map(k => ({ id: k.id, konuAdi: k.konuAdi, dersId: k.dersId }))
    });
  }
  const partial = pool.filter(k => fold(k.konuAdi).includes(f) || f.includes(fold(k.konuAdi)));
  if (partial.length === 1) return { id: String(partial[0].id), record: partial[0], warning: `Konu eşleştirildi: "${raw}" → ${partial[0].konuAdi} (${partial[0].id})` };
  if (partial.length > 1) {
    throw new ValidationError(`Konu adı birden fazla kayda benziyor: "${raw}". Daha belirgin bir ad veya ID kullanın.`, {
      adaylar: partial.slice(0, 10).map(k => ({ id: k.id, konuAdi: k.konuAdi, dersId: k.dersId }))
    });
  }
  throw new ValidationError(`Konu bulunamadı: "${raw}". Önce plantrack_list_topics ile konuyu doğrulayın.` + (opts && opts.dersId ? ` (ders: ${opts.dersId})` : ''));
}

function resolveTask(db, ref) {
  const raw = str(ref, 'taskId');
  const task = ((db.data && db.data.gorevler) || []).find(t => String(t.id) === raw);
  if (!task) throw new ValidationError(`Görev bulunamadı: "${raw}". Önce plantrack_list_tasks ile doğrulayın.`);
  return task;
}

function resolveMistake(db, ref) {
  const raw = str(ref, 'mistakeId');
  const rec = ((db.data && db.data.hataKayitlari) || []).find(t => String(t.id) === raw);
  if (!rec) throw new ValidationError(`Hata kaydı bulunamadı: "${raw}".`);
  return rec;
}

function resolveGrade(db, ref) {
  const raw = str(ref, 'gradeId');
  const rec = ((db.data && db.data.sinifNotlari) || []).find(t => String(t.id) === raw);
  if (!rec) throw new ValidationError(`Sınav notu bulunamadı: "${raw}".`);
  return rec;
}

function resolveResource(db, ref) {
  const raw = str(ref, 'resourceId');
  const rec = ((db.data && db.data.kaynaklar) || []).find(t => String(t.id) === raw);
  if (!rec) throw new ValidationError(`Kaynak bulunamadı: "${raw}".`);
  return rec;
}

function resolveExam(db, ref) {
  const raw = str(ref, 'examId');
  const rec = ((db.data && db.data.denemeSinavlari) || []).find(t => String(t.id) === raw);
  if (!rec) throw new ValidationError(`Deneme sınavı bulunamadı: "${raw}".`);
  return rec;
}

function resolveHabit(db, ogrenciId, ref) {
  const raw = str(ref, 'aliskanlikId');
  const chains = (db.data && db.data.aliskanlikZincirleri && db.data.aliskanlikZincirleri[ogrenciId]) || [];
  if (!raw) throw new ValidationError('"aliskanlikId" zorunlu.');
  let found = chains.find(z => String(z.id) === raw);
  if (!found) {
    const m = raw.match(/^al?-?(\d+)$/i) || raw.match(/^h(\d+)$/i) || raw.match(/^(\d+)$/);
    if (m) found = chains.find(z => String(z.id) === `al-${m[1]}`) || chains.find(z => String(z.id) === `h${m[1]}`);
  }
  if (!found) {
    throw new ValidationError(`Alışkanlık bulunamadı: "${raw}". Öğrencinin zincirleri: ${chains.map(z => z.baslik + ' (' + z.id + ')').join(' | ') || '(yok)'}`);
  }
  return { id: String(found.id), record: found };
}

// ─────────────────────────────────────────────────────────────
// ALAN NORMALİZASYONLARI
// ─────────────────────────────────────────────────────────────
function normalizeStudentInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.ogrenci, warnings, 'ogrenci');
  if (raw.id !== undefined) warnings.push('ogrenci: "id" yok sayıldı; kimlik sunucu tarafından üretilir.');
  const out = {};

  if (!isUpdate || raw.ad !== undefined) out.ad = str(raw.ad, 'ad');
  if (!isUpdate || raw.soyad !== undefined) out.soyad = str(raw.soyad, 'soyad');
  if (raw.adSoyad !== undefined) out.adSoyad = str(raw.adSoyad, 'adSoyad');
  if (!out.adSoyad && (out.ad || out.soyad)) out.adSoyad = `${out.ad || ''} ${out.soyad || ''}`.trim();

  if (!isUpdate) {
    if (!out.ad && !out.soyad && !out.adSoyad) throw new ValidationError('Öğrenci için "ad" ve "soyad" (veya "adSoyad") gerekli.');
    if (!out.ad && out.adSoyad) {
      const parts = out.adSoyad.split(/\s+/);
      out.ad = parts.shift() || '';
      out.soyad = parts.join(' ');
    }
  }

  if (!isUpdate || raw.sinif !== undefined) out.sinif = normSinif(raw.sinif, { required: !isUpdate });
  if (raw.modulId !== undefined) out.modulId = normModulId(raw.modulId, { sinif: out.sinif || (isUpdate ? '' : null) });
  else if (out.sinif) out.modulId = normModulId('', { sinif: out.sinif, required: true });

  ['okul', 'ogrenciTel', 'veliAd', 'veliTel', 'hedef', 'renk', 'ogrenciNo', 'sube', 'grup'].forEach(k => {
    if (raw[k] !== undefined) out[k] = str(raw[k], k);
  });
  if (raw.kayitTarihi !== undefined) out.kayitTarihi = normDate(raw.kayitTarihi, 'kayitTarihi') || new Date().toISOString();
  if (raw.seciliKaynaklar !== undefined) {
    if (!Array.isArray(raw.seciliKaynaklar)) throw new ValidationError('"seciliKaynaklar" dizi olmalı.');
    out.seciliKaynaklar = raw.seciliKaynaklar.map(v => str(v, 'seciliKaynaklar')).filter(Boolean);
  }
  return out;
}

function normalizeTaskInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.gorev, warnings, 'gorev');
  const out = {};
  let ogrenci = null;
  if (!isUpdate || raw.ogrenciId !== undefined) {
    const s = resolveStudent(db, raw.ogrenciId, { required: !isUpdate });
    if (s) { out.ogrenciId = s.id; ogrenci = s.record; if (s.warning) warnings.push(s.warning); }
  } else if (isUpdate && input.taskId) {
    const task = ((db.data && db.data.gorevler) || []).find(t => String(t.id) === String(input.taskId));
    ogrenci = task ? ((db.data.ogrenciler || []).find(s => String(s.id) === String(task.ogrenciId)) || null) : null;
  }
  const dersBaglam = ogrenci ? { modulId: ogrenci.modulId, sinif: ogrenci.sinif } : {};
  if (raw.dersId !== undefined && str(raw.dersId, 'dersId')) {
    const d = resolveCourse(db, raw.dersId, dersBaglam);
    if (d) { out.dersId = d.id; if (d.warning) warnings.push(d.warning); }
    if (raw.konuId !== undefined && str(raw.konuId, 'konuId')) {
      const k = resolveTopic(db, raw.konuId, { dersId: out.dersId });
      if (k) { out.konuId = k.id; if (k.warning) warnings.push(k.warning); }
    }
  } else if (raw.konuId !== undefined && str(raw.konuId, 'konuId')) {
    const k = resolveTopic(db, raw.konuId);
    if (k) { out.konuId = k.id; if (!out.dersId && k.record.dersId) out.dersId = String(k.record.dersId); if (k.warning) warnings.push(k.warning); }
  }
  if (raw.kaynakId !== undefined && str(raw.kaynakId, 'kaynakId')) {
    const r = ((db.data && db.data.kaynaklar) || []).find(x => String(x.id) === str(raw.kaynakId, 'kaynakId'));
    if (!r) throw new ValidationError(`Kaynak bulunamadı: "${raw.kaynakId}".`);
    out.kaynakId = String(r.id);
  }
  if (!isUpdate || raw.baslik !== undefined) out.baslik = str(raw.baslik, 'baslik');
  if (!isUpdate && !out.baslik) throw new ValidationError('"baslik" zorunlu.');
  ['aciklama', 'not'].forEach(k => { if (raw[k] !== undefined) out[k] = str(raw[k], k); });
  ['hedefSoru', 'cozulenSoru', 'dogruSoru', 'yanlisSoru', 'sureDk'].forEach(k => {
    if (raw[k] !== undefined) out[k] = num(raw[k], k, { min: 0 });
  });
  if (raw.durum !== undefined && str(raw.durum, 'durum')) out.durum = normTaskDurum(raw.durum);
  if (raw.deadline !== undefined) out.deadline = normDate(raw.deadline, 'deadline');
  return out;
}

function normalizeMistakeInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.hata, warnings, 'hata');
  const out = {};
  let ogrenci = null;
  if (!isUpdate || raw.ogrenciId !== undefined) {
    const s = resolveStudent(db, raw.ogrenciId, { required: !isUpdate });
    if (s) { out.ogrenciId = s.id; ogrenci = s.record; if (s.warning) warnings.push(s.warning); }
  } else if (input.mistakeId) {
    const rec = ((db.data && db.data.hataKayitlari) || []).find(h => String(h.id) === String(input.mistakeId));
    ogrenci = rec ? ((db.data.ogrenciler || []).find(s => String(s.id) === String(rec.ogrenciId)) || null) : null;
  }
  const dersBaglam = ogrenci ? { modulId: ogrenci.modulId, sinif: ogrenci.sinif } : {};
  if (!isUpdate || raw.dersId !== undefined) {
    const d = resolveCourse(db, raw.dersId, Object.assign({ required: !isUpdate }, dersBaglam));
    if (d) { out.dersId = d.id; if (d.warning) warnings.push(d.warning); }
  }
  if (raw.konuId !== undefined && str(raw.konuId, 'konuId')) {
    const k = resolveTopic(db, raw.konuId, { dersId: out.dersId });
    if (k) { out.konuId = k.id; if (k.warning) warnings.push(k.warning); }
  }
  if (!isUpdate || raw.hataTuru !== undefined) out.hataTuru = normHataTuru(raw.hataTuru, { required: !isUpdate });
  if (raw.aciklama !== undefined) out.aciklama = str(raw.aciklama, 'aciklama');
  if (raw.asama !== undefined) out.asama = num(raw.asama, 'asama', { min: 1, max: 5, fallback: 1 });
  if (raw.telafiDurumu !== undefined) out.telafiDurumu = bool(raw.telafiDurumu);
  if (raw.tekrarTarihi !== undefined) out.tekrarTarihi = normDate(raw.tekrarTarihi, 'tekrarTarihi');
  return out;
}

function normalizeCourseInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.ders, warnings, 'ders');
  if (raw.id !== undefined) warnings.push('ders: "id" yok sayıldı; kimlik sunucu tarafından üretilir.');
  const out = {};
  if (!isUpdate || raw.sinif !== undefined) out.sinif = normSinif(raw.sinif, { required: false, allowOrtak: true }) || 'ortak';
  if (!isUpdate || raw.modulId !== undefined) out.modulId = normModulId(raw.modulId, { sinif: out.sinif, required: !isUpdate });
  if (!isUpdate || raw.ad !== undefined) out.ad = str(raw.ad, 'ad');
  if (!isUpdate && !out.ad) throw new ValidationError('"ad" zorunlu.');
  if (raw.kisaltma !== undefined) {
    out.kisaltma = str(raw.kisaltma, 'kisaltma').toUpperCase().slice(0, 5);
  } else if (!isUpdate && out.ad) {
    out.kisaltma = out.ad.slice(0, 5).toUpperCase();
  }
  ['renk', 'ikon'].forEach(k => { if (raw[k] !== undefined) out[k] = str(raw[k], k); });
  ['haftalikSaat', 'soruSayisi'].forEach(k => { if (raw[k] !== undefined) out[k] = num(raw[k], k, { min: 0 }); });
  if (raw.sinavdaMi !== undefined) out.sinavdaMi = bool(raw.sinavdaMi);
  return out;
}

function normalizeTopicInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.konu, warnings, 'konu');
  if (raw.id !== undefined) warnings.push('konu: "id" yok sayıldı; kimlik sunucu tarafından üretilir.');
  const out = {};
  let course = null;
  if (!isUpdate || raw.dersId !== undefined) {
    const d = resolveCourse(db, raw.dersId, { required: !isUpdate });
    if (d) { out.dersId = d.id; course = d.record; if (d.warning) warnings.push(d.warning); }
  } else if (input.konuId) {
    const existing = resolveTopic(db, input.konuId);
    course = ((db.data && db.data.dersler) || []).find(c => String(c.id) === String(existing.record.dersId)) || null;
  }
  if (!isUpdate || raw.modulId !== undefined) {
    out.modulId = raw.modulId !== undefined
      ? normModulId(raw.modulId, { required: true })
      : (course && course.modulId) || 'yks';
  }
  if (!isUpdate || raw.sinif !== undefined) {
    out.sinif = raw.sinif !== undefined
      ? (normSinif(raw.sinif, { allowOrtak: true }) || 'ortak')
      : (course && String(course.sinif)) || 'ortak';
  }
  if (!isUpdate || raw.konuAdi !== undefined) out.konuAdi = str(raw.konuAdi, 'konuAdi');
  if (!isUpdate && !out.konuAdi) throw new ValidationError('"konuAdi" zorunlu.');
  if (raw.uniteNo !== undefined) out.uniteNo = num(raw.uniteNo, 'uniteNo', { min: 1, fallback: 1 });
  if (raw.siraNo !== undefined) out.siraNo = num(raw.siraNo, 'siraNo', { min: 1, fallback: 1 });
  if (raw.uniteAdi !== undefined) out.uniteAdi = str(raw.uniteAdi, 'uniteAdi');
  if (raw.aciklama !== undefined) out.aciklama = str(raw.aciklama, 'aciklama');
  if (raw.kazanimlar !== undefined) {
    if (!Array.isArray(raw.kazanimlar)) throw new ValidationError('"kazanimlar" dizi olmalı.');
    out.kazanimlar = raw.kazanimlar.map(v => str(v, 'kazanimlar')).filter(Boolean);
  }
  return out;
}

function normalizeResourceInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.kaynak, warnings, 'kaynak');
  const out = {};
  if (!isUpdate || raw.ad !== undefined) out.ad = str(raw.ad, 'ad');
  if (!isUpdate && !out.ad) throw new ValidationError('"ad" zorunlu.');
  if (!isUpdate || raw.yayinevi !== undefined || raw.yayinEvi !== undefined) {
    out.yayinevi = str(raw.yayinevi || raw.yayinEvi, 'yayinevi');
  }
  if (!isUpdate && !out.yayinevi) throw new ValidationError('"yayinevi" zorunlu.');
  if (raw.modulId !== undefined) {
    const list = Array.isArray(raw.modulId) ? raw.modulId : [raw.modulId];
    out.modulId = Array.from(new Set(list.map(v => normModulId(v, { required: true }))));
  } else if (!isUpdate) {
    out.modulId = MODUL_IDS.slice();
  }
  if (!isUpdate || raw.tur !== undefined) {
    const t = str(raw.tur, 'tur');
    if (t && !KAYNAK_TURLERI.some(x => fold(x) === fold(t))) {
      warnings.push(`kaynak: "${t}" bilinen türlerden biri değil; olduğu gibi kaydedildi.`);
    }
    out.tur = t || 'Soru Bankası';
  }
  if (raw.zorluk !== undefined) out.zorluk = num(raw.zorluk, 'zorluk', { min: 1, max: 5, fallback: 3 });
  if (raw.aciklama !== undefined) out.aciklama = str(raw.aciklama, 'aciklama');
  if (raw.dersId !== undefined && str(raw.dersId, 'dersId')) {
    const d = resolveCourse(db, raw.dersId);
    if (d) { out.dersId = d.id; if (d.warning) warnings.push(d.warning); }
  }
  return out;
}

function normalizeGradeInput(db, input, warnings, { isUpdate = false } = {}) {
  const raw = pickAllowed(input, ALANLAR.not, warnings, 'not');
  const out = {};
  let ogrenci = null;
  if (!isUpdate || raw.ogrenciId !== undefined) {
    const s = resolveStudent(db, raw.ogrenciId, { required: !isUpdate });
    if (s) { out.ogrenciId = s.id; ogrenci = s.record; if (s.warning) warnings.push(s.warning); }
  } else if (input.gradeId) {
    const rec = ((db.data && db.data.sinifNotlari) || []).find(n => String(n.id) === String(input.gradeId));
    ogrenci = rec ? ((db.data.ogrenciler || []).find(s => String(s.id) === String(rec.ogrenciId)) || null) : null;
  }
  const dersBaglam = ogrenci ? { modulId: ogrenci.modulId, sinif: ogrenci.sinif } : {};
  if (!isUpdate || raw.dersId !== undefined) {
    const d = resolveCourse(db, raw.dersId, Object.assign({ required: !isUpdate }, dersBaglam));
    if (d) { out.dersId = d.id; if (d.warning) warnings.push(d.warning); }
  }
  if (!isUpdate || raw.not !== undefined) out.not = num(raw.not, 'not', { min: 0, max: 100, fallback: 0 });
  if (raw.sinavAdi !== undefined) out.sinavAdi = str(raw.sinavAdi, 'sinavAdi');
  if (!isUpdate || raw.tur !== undefined) {
    const t = fold(raw.tur);
    out.tur = NOT_TURLERI.includes(t) ? t : (t ? 'yazili' : 'yazili');
    if (t && !NOT_TURLERI.includes(t)) warnings.push(`not: "${raw.tur}" tanınmadı, "yazili" olarak kaydedildi.`);
  }
  if (raw.tarih !== undefined) out.tarih = normDate(raw.tarih, 'tarih');
  return out;
}

function normalizeExamDersler(db, list, warnings, ogrenci) {
  if (list === undefined) return undefined;
  if (!Array.isArray(list)) throw new ValidationError('"dersler" dizi olmalı.');
  return list.map((item, i) => {
    if (!item || typeof item !== 'object') throw new ValidationError(`dersler[${i}] nesne olmalı.`);
    const dersAdi = str(item.ders || item.dersAdi || item.ad, `dersler[${i}].ders`);
    let dersId = str(item.dersId, `dersler[${i}].dersId`);
    if (!dersId && dersAdi) {
      try {
        const d = resolveCourse(db, dersAdi, { modulId: ogrenci && ogrenci.modulId });
        if (d) { dersId = d.id; if (d.warning) warnings.push(`dersler[${i}]: ${d.warning}`); }
      } catch (err) {
        warnings.push(`dersler[${i}]: "${dersAdi}" müfredatta bulunamadı, yalnızca ad olarak kaydedildi.`);
      }
    } else if (dersId) {
      try {
        const d = resolveCourse(db, dersId);
        if (d) { dersId = d.id; if (d.warning) warnings.push(`dersler[${i}]: ${d.warning}`); }
      } catch (err) {
        warnings.push(`dersler[${i}]: "${dersId}" müfredatta bulunamadı.`);
      }
    }
    const soruSayisi = num(item.soruSayisi !== undefined ? item.soruSayisi : item.soru, `dersler[${i}].soruSayisi`, { min: 0, fallback: 0 });
    const dogru = num(item.dogru, `dersler[${i}].dogru`, { min: 0, fallback: 0 });
    const yanlis = num(item.yanlis, `dersler[${i}].yanlis`, { min: 0, fallback: 0 });
    const bos = item.bos !== undefined ? num(item.bos, `dersler[${i}].bos`, { min: 0 }) : Math.max(0, soruSayisi - dogru - yanlis);
    const net = item.net !== undefined ? num(item.net, `dersler[${i}].net`) : Math.round((dogru - yanlis / 4) * 100) / 100;
    const basariYuzde = item.basariYuzde !== undefined
      ? num(item.basariYuzde, `dersler[${i}].basariYuzde`, { min: 0, max: 100 })
      : (soruSayisi ? Math.round((dogru / soruSayisi) * 10000) / 100 : 0);
    return {
      ders: dersAdi || dersId || `Ders ${i + 1}`,
      dersId,
      soruSayisi, dogru, yanlis, bos, net, basariYuzde,
      kurumNetOrt: num(item.kurumNetOrt, `dersler[${i}].kurumNetOrt`, { fallback: 0 }),
      sinavNetOrt: num(item.sinavNetOrt, `dersler[${i}].sinavNetOrt`, { fallback: 0 })
    };
  });
}

function normalizeMockExamInput(db, input, warnings) {
  const raw = pickAllowed(input, ALANLAR.deneme, warnings, 'deneme');
  const s = resolveStudent(db, raw.ogrenciId, { required: true });
  if (s.warning) warnings.push(s.warning);
  const out = { ogrenciId: s.id };

  const ad = str(raw.sinavAdi || raw.ad || raw.baslik, 'ad');
  if (!ad) throw new ValidationError('"ad" (deneme adı) zorunlu.');
  out.ad = ad;
  out.sinavAdi = ad;
  out.baslik = str(raw.baslik || ad, 'baslik');

  const tarih = normDate(raw.sinavTarihi || raw.tarih, 'tarih', { required: true });
  out.tarih = tarih;
  out.sinavTarihi = tarih;

  if (raw.tur !== undefined) out.tur = str(raw.tur, 'tur');
  if (raw.puan !== undefined) out.puan = num(raw.puan, 'puan', { min: 0 });
  ['dosyaAdi', 'grup', 'ogrenciNo'].forEach(k => { if (raw[k] !== undefined) out[k] = str(raw[k], k); });

  const dersler = normalizeExamDersler(db, raw.dersler, warnings, s.record);
  if (dersler !== undefined) out.dersler = dersler;

  if (raw.konular !== undefined) {
    if (!Array.isArray(raw.konular)) throw new ValidationError('"konular" dizi olmalı.');
    out.konular = raw.konular.map((k, i) => {
      if (!k || typeof k !== 'object') throw new ValidationError(`konular[${i}] nesne olmalı.`);
      const konuAdi = str(k.konuAdi || k.konu || k.ad, `konular[${i}].konuAdi`);
      let dersId = str(k.dersId, `konular[${i}].dersId`);
      if (!dersId && k.ders) {
        try {
          const d = resolveCourse(db, k.ders, { modulId: s.record && s.record.modulId });
          if (d) dersId = d.id;
        } catch (_) {}
      }
      return {
        ders: str(k.ders, `konular[${i}].ders`),
        dersId,
        konuAdi,
        soruSayisi: num(k.soruSayisi, `konular[${i}].soruSayisi`, { min: 0, fallback: 0 }),
        dogru: num(k.dogru, `konular[${i}].dogru`, { min: 0, fallback: 0 }),
        yanlis: num(k.yanlis, `konular[${i}].yanlis`, { min: 0, fallback: 0 }),
        bos: num(k.bos, `konular[${i}].bos`, { min: 0, fallback: 0 })
      };
    });
  }

  // toplam: verilmemişse derslerden hesapla (uygulama toplam olmadan denemeyi 0 net gösteriyor)
  let toplam;
  if (raw.toplam !== undefined && raw.toplam !== null) {
    if (typeof raw.toplam !== 'object') throw new ValidationError('"toplam" nesne olmalı.');
    toplam = {
      ders: 'Toplam',
      soruSayisi: num(raw.toplam.soruSayisi, 'toplam.soruSayisi', { min: 0, fallback: 0 }),
      dogru: num(raw.toplam.dogru, 'toplam.dogru', { min: 0, fallback: 0 }),
      yanlis: num(raw.toplam.yanlis, 'toplam.yanlis', { min: 0, fallback: 0 }),
      bos: num(raw.toplam.bos, 'toplam.bos', { min: 0, fallback: 0 }),
      net: num(raw.toplam.net, 'toplam.net', { fallback: 0 }),
      basariYuzde: num(raw.toplam.basariYuzde, 'toplam.basariYuzde', { min: 0, max: 100, fallback: 0 }),
      kurumNetOrt: num(raw.toplam.kurumNetOrt, 'toplam.kurumNetOrt', { fallback: 0 }),
      sinavNetOrt: num(raw.toplam.sinavNetOrt, 'toplam.sinavNetOrt', { fallback: 0 })
    };
  } else if (Array.isArray(dersler) && dersler.length) {
    const sum = dersler.reduce((acc, d) => {
      acc.soruSayisi += d.soruSayisi; acc.dogru += d.dogru; acc.yanlis += d.yanlis; acc.bos += d.bos;
      return acc;
    }, { soruSayisi: 0, dogru: 0, yanlis: 0, bos: 0 });
    toplam = {
      ders: 'Toplam',
      soruSayisi: sum.soruSayisi,
      dogru: sum.dogru,
      yanlis: sum.yanlis,
      bos: sum.bos,
      net: Math.round((sum.dogru - sum.yanlis / 4) * 100) / 100,
      basariYuzde: sum.soruSayisi ? Math.round((sum.dogru / sum.soruSayisi) * 10000) / 100 : 0,
      kurumNetOrt: 0,
      sinavNetOrt: 0
    };
    warnings.push('deneme: "toplam" verilmedi, derslerden hesaplandı.');
  }
  if (toplam) out.toplam = toplam;
  return out;
}

function normalizeZamanHucre(data, warnings) {
  if (data === undefined || data === null) return null;
  if (typeof data === 'string' || typeof data === 'number') {
    return { kategori: 'konu', label: String(data), renk: ZAMAN_KATEGORILERI.konu.renk, bg: ZAMAN_KATEGORILERI.konu.bg, not: '' };
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('"data" nesne, metin veya null olmalı.');
  }
  const rawKategori = fold(data.kategori || data.kategoriId || data.tur || 'konu');
  const bilinen = ZAMAN_KATEGORILERI[rawKategori];
  // Uygulama ZAMAN_FAALIYETLER içindeki onlarca faaliyet kimliğini kullanır
  // (örn. "ozel-ders-etut", "eksik-konu", "dinlenme-mola"). Bunları "konu"ya
  // çevirmek veriyi bozar; tanınmayan kimlik olduğu gibi korunur.
  const kategori = data.kategori ? String(data.kategori) : (bilinen ? rawKategori : 'konu');
  const base = bilinen || ZAMAN_KATEGORILERI.konu;
  if (!bilinen && data.kategori) {
    warnings.push(`zaman: "${data.kategori}" standart kategori listesinde yok; olduğu gibi korundu (renk verilmezse nötr kullanılır).`);
  }
  return {
    kategori,
    label: str(data.label || data.baslik || data.ad || base.label, 'data.label'),
    renk: str(data.renk, 'data.renk') || base.renk,
    bg: str(data.bg, 'data.bg') || base.bg,
    not: str(data.not, 'data.not')
  };
}

// ─────────────────────────────────────────────────────────────
// ŞEMA DOĞRULAMA (tools/call öncesi)
// ─────────────────────────────────────────────────────────────
function typeOf(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateSchema(schema, args, path) {
  const where = path || 'args';
  if (!schema) return;
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new ValidationError(`${where} nesne olmalı.`);
  }
  (schema.required || []).forEach(key => {
    const v = args[key];
    if (v === undefined || v === null || v === '') {
      throw new ValidationError(`Zorunlu alan eksik: "${key}"`);
    }
  });
  Object.keys(schema.properties || {}).forEach(key => {
    const v = args[key];
    if (v === undefined || v === null) return;
    const spec = schema.properties[key];
    if (spec.type) {
      const actual = typeOf(v);
      const ok = spec.type === 'number'
        ? (actual === 'number' || (typeof v === 'string' && v.trim() !== '' && isFinite(Number(v))))
        : spec.type === 'integer'
          ? (actual === 'number' && Number.isInteger(v))
          : spec.type === 'boolean'
            ? actual === 'boolean' || v === 'true' || v === 'false' || v === '1' || v === '0'
            : spec.type === 'string'
              // model "8" yerine 8 gönderebiliyor; normalizasyon metne çevirir
              ? (actual === 'string' || actual === 'number' || actual === 'boolean')
              : actual === spec.type;
      if (!ok) throw new ValidationError(`"${key}" tipi ${spec.type} olmalı, ${actual} geldi.`);
    }
    // enum kontrolü bilinçli olarak normalizeToolArgs'a bırakıldı:
    // model "tamam" / "tamamlandı" gibi eşanlamlıları gönderebiliyor,
    // normalizasyon bunları geçerli değere çeviriyor. Burada reddetmek
    // doğru veriyi hatalı sayardı.
    if (spec.type === 'array' && spec.items) {
      v.forEach((item, i) => {
        if (spec.items.type) {
          const actual = typeOf(item);
          if (actual !== spec.items.type) {
            throw new ValidationError(`"${key}[${i}]" tipi ${spec.items.type} olmalı, ${actual} geldi.`);
          }
        }
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// ARAÇ BAZLI NORMALİZASYON
// ─────────────────────────────────────────────────────────────
function normalizeToolArgs(db, name, input) {
  const args = Object.assign({}, input || {});
  const warnings = [];

  switch (name) {
    // ── Öğrenci ──
    case 'plantrack_add_student':
      return { args: normalizeStudentInput(db, args, warnings), warnings };
    case 'plantrack_update_student': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const patch = Object.assign({}, args);
      delete patch.ogrenciId;
      return { args: Object.assign({ ogrenciId: s.id }, normalizeStudentInput(db, patch, warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_delete_student':
    case 'plantrack_get_student':
    case 'plantrack_get_student_habits':
    case 'plantrack_get_student_schedule': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      return { args: Object.assign({}, args, { ogrenciId: s.id }), warnings };
    }

    // ── Görev ──
    case 'plantrack_add_task':
      return { args: normalizeTaskInput(db, args, warnings), warnings };
    case 'plantrack_update_task': {
      resolveTask(db, args.taskId);
      const patch = Object.assign({}, args);
      delete patch.taskId;
      return { args: Object.assign({ taskId: args.taskId }, normalizeTaskInput(db, Object.assign({ taskId: args.taskId }, patch), warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_complete_task': {
      resolveTask(db, args.taskId);
      const out = { taskId: args.taskId };
      ['cozulenSoru', 'dogruSoru', 'yanlisSoru', 'sureDk'].forEach(k => {
        if (args[k] !== undefined) out[k] = num(args[k], k, { min: 0 });
      });
      if (args.not !== undefined) out.not = str(args.not, 'not');
      return { args: out, warnings };
    }
    case 'plantrack_delete_task':
    case 'plantrack_get_task':
      resolveTask(db, args.taskId);
      return { args, warnings };

    // ── Hata defteri ──
    case 'plantrack_add_mistake':
      return { args: normalizeMistakeInput(db, args, warnings), warnings };
    case 'plantrack_update_mistake': {
      resolveMistake(db, args.mistakeId);
      const patch = Object.assign({}, args);
      delete patch.mistakeId;
      return { args: Object.assign({ mistakeId: args.mistakeId }, normalizeMistakeInput(db, Object.assign({ mistakeId: args.mistakeId }, patch), warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_delete_mistake':
      resolveMistake(db, args.mistakeId);
      return { args, warnings };

    // ── Ders / Konu ──
    case 'plantrack_add_course':
      return { args: normalizeCourseInput(db, args, warnings), warnings };
    case 'plantrack_update_course': {
      const c = resolveCourse(db, args.dersId);
      if (c.warning) warnings.push(c.warning);
      const patch = Object.assign({}, args);
      delete patch.dersId;
      return { args: Object.assign({ dersId: c.id }, normalizeCourseInput(db, patch, warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_delete_course':
    case 'plantrack_get_course': {
      const c = resolveCourse(db, args.dersId);
      if (c.warning) warnings.push(c.warning);
      return { args: Object.assign({}, args, { dersId: c.id }), warnings };
    }
    case 'plantrack_add_topic':
      return { args: normalizeTopicInput(db, args, warnings), warnings };
    case 'plantrack_update_topic': {
      const t = resolveTopic(db, args.konuId);
      if (t.warning) warnings.push(t.warning);
      const patch = Object.assign({}, args);
      delete patch.konuId;
      return { args: Object.assign({ konuId: t.id }, normalizeTopicInput(db, Object.assign({ konuId: t.id }, patch), warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_delete_topic':
    case 'plantrack_get_topic': {
      const t = resolveTopic(db, args.konuId);
      if (t.warning) warnings.push(t.warning);
      return { args: Object.assign({}, args, { konuId: t.id }), warnings };
    }

    // ── Konu takibi ──
    case 'plantrack_update_topic_status': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const dersId = args.dersId ? resolveCourse(db, args.dersId).id : '';
      const t = resolveTopic(db, args.konuId, { dersId });
      if (t.warning) warnings.push(t.warning);
      const out = { ogrenciId: s.id, konuId: t.id };
      if (args.durum !== undefined) out.durum = normKonuDurum(args.durum);
      if (args.not !== undefined) out.not = str(args.not, 'not');
      if (t.record.dersId) out.dersId = String(t.record.dersId);
      return { args: out, warnings };
    }
    case 'plantrack_get_topic_progress': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const out = { ogrenciId: s.id };
      if (args.dersId) out.dersId = resolveCourse(db, args.dersId).id;
      return { args: out, warnings };
    }

    // ── Deneme ──
    case 'plantrack_add_mock_exam':
      return { args: normalizeMockExamInput(db, args, warnings), warnings };
    case 'plantrack_delete_mock_exam':
    case 'plantrack_get_mock_exam_detail':
      resolveExam(db, args.examId);
      return { args, warnings };

    // ── Kaynak ──
    case 'plantrack_add_resource':
      return { args: normalizeResourceInput(db, args, warnings), warnings };
    case 'plantrack_update_resource': {
      resolveResource(db, args.resourceId);
      const patch = Object.assign({}, args);
      delete patch.resourceId;
      return { args: Object.assign({ resourceId: args.resourceId }, normalizeResourceInput(db, patch, warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_delete_resource':
    case 'plantrack_get_resource':
      resolveResource(db, args.resourceId);
      return { args, warnings };

    // ── Okul notları ──
    case 'plantrack_add_school_grade':
      return { args: normalizeGradeInput(db, args, warnings), warnings };
    case 'plantrack_update_school_grade': {
      resolveGrade(db, args.gradeId);
      const patch = Object.assign({}, args);
      delete patch.gradeId;
      return { args: Object.assign({ gradeId: args.gradeId }, normalizeGradeInput(db, Object.assign({ gradeId: args.gradeId }, patch), warnings, { isUpdate: true })), warnings };
    }
    case 'plantrack_delete_school_grade':
      resolveGrade(db, args.gradeId);
      return { args, warnings };

    // ── Alışkanlıklar ──
    case 'plantrack_update_student_habits': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const out = { ogrenciId: s.id };
      if (args.sifirla !== undefined) out.sifirla = bool(args.sifirla);
      if (args.zincirler !== undefined) {
        if (!Array.isArray(args.zincirler)) throw new ValidationError('"zincirler" dizi olmalı.');
        const used = new Set(((db.data.aliskanlikZincirleri || {})[s.id] || []).map(z => String(z.id)));
        out.zincirler = args.zincirler.map((z, i) => {
          if (!z || typeof z !== 'object') throw new ValidationError(`zincirler[${i}] nesne olmalı.`);
          let id = str(z.id, `zincirler[${i}].id`);
          if (!id || used.has(id)) id = makeId('al', used);
          used.add(id);
          return {
            id,
            baslik: str(z.baslik || z.ad, `zincirler[${i}].baslik`) || `Alışkanlık ${i + 1}`,
            renk: str(z.renk, `zincirler[${i}].renk`) || 'blue',
            aktif: z.aktif === undefined ? true : bool(z.aktif)
          };
        });
      }
      return { args: out, warnings };
    }
    case 'plantrack_log_habit_activity': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const h = resolveHabit(db, s.id, args.aliskanlikId);
      return {
        args: {
          ogrenciId: s.id,
          aliskanlikId: h.id,
          tarih: normDate(args.tarih, 'tarih', { required: true }),
          tamamlandi: bool(args.tamamlandi)
        },
        warnings
      };
    }
    case 'plantrack_update_habit_month_end': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const out = { ogrenciId: s.id, yilAy: normYilAy(args.yilAy, 'yilAy', { required: true }) };
      if (args.aliskanlikId !== undefined || args.aliskanlikNo !== undefined) {
        const ref = args.aliskanlikId !== undefined ? args.aliskanlikId : args.aliskanlikNo;
        out.aliskanlikId = resolveHabit(db, s.id, ref).id;
      }
      if (args.gunSayisi !== undefined) out.gunSayisi = Math.round(num(args.gunSayisi, 'gunSayisi', { min: 0, max: 31, fallback: 0 }));
      if (args.not !== undefined) out.not = str(args.not, 'not');
      if (args.genelAyNotu !== undefined) out.genelAyNotu = str(args.genelAyNotu, 'genelAyNotu');
      return { args: out, warnings };
    }

    // ── Zaman / çizelge ──
    case 'plantrack_update_student_schedule': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      return {
        args: {
          ogrenciId: s.id,
          slotKey: normSlotKey(args.slotKey),
          data: normalizeZamanHucre(args.data, warnings)
        },
        warnings
      };
    }
    case 'plantrack_batch_update_schedule': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const out = { ogrenciId: s.id };
      if (args.gunler !== undefined) {
        if (!Array.isArray(args.gunler)) throw new ValidationError('"gunler" dizi olmalı.');
        out.gunler = args.gunler.map(g => normGun(g));
      }
      if (args.baslangicSaat !== undefined) out.baslangicSaat = normSaat(args.baslangicSaat, 'baslangicSaat');
      if (args.bitisSaat !== undefined) out.bitisSaat = normSaat(args.bitisSaat, 'bitisSaat');
      if (args.temizle !== undefined) out.temizle = bool(args.temizle);
      if (args.ornekRutin !== undefined) {
        const r = fold(args.ornekRutin);
        out.ornekRutin = MODUL_IDS.includes(r) ? r : (r ? 'lgs' : '');
      }
      if (args.zamanPenceresi !== undefined) {
        if (!args.zamanPenceresi || typeof args.zamanPenceresi !== 'object') throw new ValidationError('"zamanPenceresi" nesne olmalı.');
        out.zamanPenceresi = {
          baslangicSaat: normSaat(args.zamanPenceresi.baslangicSaat || '07:00', 'zamanPenceresi.baslangicSaat'),
          bitisSaat: normSaat(args.zamanPenceresi.bitisSaat || '23:30', 'zamanPenceresi.bitisSaat')
        };
      }
      if (args.data !== undefined) out.data = normalizeZamanHucre(args.data, warnings);
      return { args: out, warnings };
    }
    case 'plantrack_get_chart_summary': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const out = { ogrenciId: s.id, sablon: str(args.sablon, 'sablon') };
      if (args.dersId && args.dersId !== 'tum') out.dersId = resolveCourse(db, args.dersId).id;
      if (args.yilAy) out.yilAy = normYilAy(args.yilAy, 'yilAy');
      return { args: out, warnings };
    }
    case 'plantrack_update_chart_note': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      return {
        args: { ogrenciId: s.id, dersId: resolveCourse(db, args.dersId, { required: true }).id, not: str(args.not, 'not') },
        warnings
      };
    }

    // ── Soru takibi ──
    case 'plantrack_get_question_tracking': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const out = { ogrenciId: s.id };
      if (args.donem) out.donem = normYilAy(args.donem, 'donem');
      if (args.dersId) out.dersId = resolveCourse(db, args.dersId).id;
      return { args: out, warnings };
    }
    case 'plantrack_record_question_count': {
      const s = resolveStudent(db, args.ogrenciId);
      if (s.warning) warnings.push(s.warning);
      const t = resolveTopic(db, args.konuId, { dersId: args.dersId ? resolveCourse(db, args.dersId).id : '' });
      if (t.warning) warnings.push(t.warning);
      const yilAy = normYilAy(args.yilAy || args.donem, 'yilAy', { required: true });
      const tur = normTur(args.tur !== undefined ? args.tur : args.hafta, 'tur');
      if (!tur) throw new ValidationError('"tur" (1, 2, 3...) zorunlu.');
      const out = {
        ogrenciId: s.id,
        konuId: t.id,
        yilAy,
        tur,
        dogru: num(args.dogru, 'dogru', { min: 0 }),
        yanlis: num(args.yanlis, 'yanlis', { min: 0 }),
        bos: num(args.bos, 'bos', { min: 0 })
      };
      if (args.toplam !== undefined) out.toplam = num(args.toplam, 'toplam', { min: 0 });
      if (t.record.dersId) out.dersId = String(t.record.dersId);
      return { args: out, warnings };
    }

    // ── Profil / sorgu ──
    case 'plantrack_update_coach_profile': {
      const out = {};
      ['ad', 'soyad', 'unvan', 'kurum', 'telefon'].forEach(k => {
        if (args[k] !== undefined) out[k] = str(args[k], k);
      });
      if (args.avatarKisa !== undefined) out.avatarKisa = str(args.avatarKisa, 'avatarKisa').slice(0, 4).toUpperCase();
      return { args: out, warnings };
    }
    case 'plantrack_custom_query': {
      const collection = str(args.collection, 'collection');
      if (!VERI_KOLEKSIYONLARI.includes(collection)) {
        throw new ValidationError(`"${collection}" sorgulanamaz. Geçerli koleksiyonlar: ${VERI_KOLEKSIYONLARI.join(', ')}`);
      }
      if (args.filter !== undefined && (typeof args.filter !== 'object' || Array.isArray(args.filter))) {
        throw new ValidationError('"filter" nesne olmalı.');
      }
      return { args: { collection, filter: args.filter || {}, limit: Math.min(num(args.limit, 'limit', { min: 1, fallback: 20 }), 200) }, warnings };
    }
    case 'plantrack_get_raw_data': {
      if (args.collectionKey !== undefined && args.collectionKey !== '') {
        const key = str(args.collectionKey, 'collectionKey');
        if (!VERI_KOLEKSIYONLARI.includes(key) && !['kocProfili', 'genelZamanAyarlari', 'zamanAyarlari', 'aliskanlikZincirleri', 'aliskanlikAySonu', 'aliskanlikNotlari', 'zamanPlanlari', 'konuSoruKayitlari', 'cizgeNotlari', 'cizelgeNotlari'].includes(key)) {
          throw new ValidationError(`"${key}" ham veri anahtarı değil. Koleksiyonlardan birini seçin.`);
        }
        return { args: { collectionKey: key }, warnings };
      }
      return { args: {}, warnings };
    }

    // ── Okuma listeleri: isteğe bağlı filtreleri normalize et ──
    default:
      return { args: normalizeReadFilters(db, name, args, warnings), warnings };
  }
}

function normalizeReadFilters(db, name, args, warnings) {
  const out = Object.assign({}, args);
  if (out.ogrenciId !== undefined && out.ogrenciId !== '') {
    const s = resolveStudent(db, out.ogrenciId);
    if (s.warning) warnings.push(s.warning);
    out.ogrenciId = s.id;
  }
  if (out.dersId !== undefined && out.dersId !== '' && out.dersId !== 'tum') {
    const d = resolveCourse(db, out.dersId);
    if (d) { out.dersId = d.id; if (d.warning) warnings.push(d.warning); }
  }
  if (out.konuId !== undefined && out.konuId !== '') {
    const t = resolveTopic(db, out.konuId, { dersId: out.dersId });
    if (t) { out.konuId = t.id; if (t.warning) warnings.push(t.warning); }
  }
  if (out.modulId !== undefined && out.modulId !== '' && out.modulId !== 'all' && out.modulId !== 'tumu') {
    out.modulId = normModulId(out.modulId, { required: true });
  }
  if (out.sinif !== undefined && out.sinif !== '') out.sinif = normSinif(out.sinif);
  if (out.durum !== undefined && out.durum !== '') {
    out.durum = (name === 'plantrack_list_tasks') ? normTaskDurum(out.durum) : out.durum;
  }
  if (out.hataTuru !== undefined && out.hataTuru !== '') out.hataTuru = normHataTuru(out.hataTuru);
  if (out.limit !== undefined) out.limit = Math.min(num(out.limit, 'limit', { min: 1, fallback: 100 }), 1000);
  return out;
}

// ─────────────────────────────────────────────────────────────
// VERİ TABANI BÜTÜNLÜK KONTROLÜ
// ─────────────────────────────────────────────────────────────
function validateDatabase(data) {
  const d = data || {};
  const errors = [];
  const warnings = [];
  const ids = {
    ogrenciler: new Set(),
    dersler: new Set(),
    konular: new Set(),
    gorevler: new Set(),
    hataKayitlari: new Set(),
    denemeSinavlari: new Set(),
    kaynaklar: new Set(),
    sinifNotlari: new Set()
  };
  const arrays = {
    ogrenciler: d.ogrenciler,
    dersler: d.dersler,
    konular: d.konular,
    gorevler: d.gorevler,
    hataKayitlari: d.hataKayitlari,
    denemeSinavlari: d.denemeSinavlari,
    kaynaklar: d.kaynaklar,
    sinifNotlari: d.sinifNotlari,
    ogrenciKonuDurumlari: d.ogrenciKonuDurumlari,
    calismaKayitlari: d.calismaKayitlari
  };

  Object.keys(arrays).forEach(k => {
    if (arrays[k] !== undefined && !Array.isArray(arrays[k])) {
      errors.push(`${k}: dizi olmalı, ${typeOf(arrays[k])} geldi.`);
    }
  });
  Object.keys(ids).forEach(k => {
    (Array.isArray(d[k]) ? d[k] : []).forEach(item => {
      if (!item || typeof item !== 'object') {
        errors.push(`${k}: kayıt nesne değil.`);
        return;
      }
      if (item.id === undefined || item.id === null || item.id === '') {
        errors.push(`${k}: ${item.adSoyad || item.ad || item.konuAdi || item.baslik || '?'} kaydında id yok.`);
        return;
      }
      const id = String(item.id);
      if (ids[k].has(id)) errors.push(`${k}: yinelenen id → ${id}`);
      ids[k].add(id);
    });
  });

  const missingStudent = (name, list) => {
    (Array.isArray(list) ? list : []).forEach(item => {
      if (item.ogrenciId === undefined || item.ogrenciId === '') {
        warnings.push(`${name}: ${item.id || '?'} kaydında ogrenciId yok.`);
      } else if (!ids.ogrenciler.has(String(item.ogrenciId))) {
        errors.push(`${name}: ${item.id || '?'} → öğrenci yok (${item.ogrenciId})`);
      }
    });
  };
  missingStudent('gorevler', d.gorevler);
  missingStudent('ogrenciKonuDurumlari', d.ogrenciKonuDurumlari);
  missingStudent('hataKayitlari', d.hataKayitlari);
  missingStudent('sinifNotlari', d.sinifNotlari);
  missingStudent('denemeSinavlari', d.denemeSinavlari);
  missingStudent('calismaKayitlari', d.calismaKayitlari);

  (Array.isArray(d.gorevler) ? d.gorevler : []).forEach(t => {
    if (t.dersId && !ids.dersler.has(String(t.dersId))) errors.push(`gorevler: ${t.id} → ders yok (${t.dersId})`);
    if (t.konuId && !ids.konular.has(String(t.konuId))) errors.push(`gorevler: ${t.id} → konu yok (${t.konuId})`);
    if (t.durum && !GOREV_DURUMLARI.includes(t.durum)) errors.push(`gorevler: ${t.id} → geçersiz durum (${t.durum})`);
    if (t.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(String(t.deadline).slice(0, 10))) warnings.push(`gorevler: ${t.id} → deadline biçimi beklenmedik (${t.deadline})`);
  });
  (Array.isArray(d.hataKayitlari) ? d.hataKayitlari : []).forEach(h => {
    if (h.dersId && !ids.dersler.has(String(h.dersId))) errors.push(`hataKayitlari: ${h.id} → ders yok (${h.dersId})`);
    if (h.konuId && !ids.konular.has(String(h.konuId))) errors.push(`hataKayitlari: ${h.id} → konu yok (${h.konuId})`);
    if (h.hataTuru && !HATA_TURLERI.includes(h.hataTuru)) warnings.push(`hataKayitlari: ${h.id} → bilinmeyen hata türü (${h.hataTuru})`);
  });
  (Array.isArray(d.sinifNotlari) ? d.sinifNotlari : []).forEach(n => {
    if (n.dersId && !ids.dersler.has(String(n.dersId))) errors.push(`sinifNotlari: ${n.id} → ders yok (${n.dersId})`);
  });
  (Array.isArray(d.denemeSinavlari) ? d.denemeSinavlari : []).forEach(e => {
    (Array.isArray(e.dersler) ? e.dersler : []).forEach(x => {
      if (x.dersId && !ids.dersler.has(String(x.dersId))) warnings.push(`denemeSinavlari: ${e.id} → ders eşleşmemiş (${x.dersId})`);
    });
  });
  (Array.isArray(d.ogrenciKonuDurumlari) ? d.ogrenciKonuDurumlari : []).forEach(k => {
    if (k.konuId && !ids.konular.has(String(k.konuId))) errors.push(`ogrenciKonuDurumlari: ${k.id} → konu yok (${k.konuId})`);
    if (k.durum && !KONU_DURUMLARI.includes(k.durum)) errors.push(`ogrenciKonuDurumlari: ${k.id} → geçersiz durum (${k.durum})`);
  });
  (Array.isArray(d.konular) ? d.konular : []).forEach(k => {
    if (k.dersId && !ids.dersler.has(String(k.dersId))) errors.push(`konular: ${k.id} → ders yok (${k.dersId})`);
  });
  (Array.isArray(d.kaynaklar) ? d.kaynaklar : []).forEach(r => {
    if (r.dersId && !ids.dersler.has(String(r.dersId))) warnings.push(`kaynaklar: ${r.id} → ders yok (${r.dersId})`);
    if (r.modulId) {
      const mods = Array.isArray(r.modulId) ? r.modulId : [r.modulId];
      mods.forEach(m => { if (!MODUL_IDS.includes(m)) errors.push(`kaynaklar: ${r.id} → geçersiz modül (${m})`); });
    }
  });

  Object.keys(d.zamanPlanlari || {}).forEach(ogr => {
    if (!ids.ogrenciler.has(String(ogr))) errors.push(`zamanPlanlari: öğrenci yok (${ogr})`);
  });
  Object.keys(d.aliskanlikZincirleri || {}).forEach(ogr => {
    if (!ids.ogrenciler.has(String(ogr))) errors.push(`aliskanlikZincirleri: öğrenci yok (${ogr})`);
  });
  Object.keys(d.aliskanlikAySonu || {}).forEach(key => {
    if (typeof d.aliskanlikAySonu[key] === 'object' && !String(key).match(/^.+_.+_\d{4}-\d{2}$/)) {
      warnings.push(`aliskanlikAySonu: eski (iç içe) anahtar → ${key}`);
    } else if (!String(key).match(/^.+_.+_\d{4}-\d{2}$/)) {
      warnings.push(`aliskanlikAySonu: anahtar biçimi beklenmedik → ${key}`);
    }
  });
  Object.keys(d.aliskanlikNotlari || {}).forEach(key => {
    if (typeof d.aliskanlikNotlari[key] === 'object') warnings.push(`aliskanlikNotlari: eski (iç içe) anahtar → ${key}`);
    else if (!String(key).match(/^.+_\d{4}-\d{2}$/)) warnings.push(`aliskanlikNotlari: anahtar biçimi beklenmedik → ${key}`);
  });
  Object.keys(d.konuSoruKayitlari || {}).forEach(key => {
    if (!/^.+_.+_\d{4}-\d{2}_hf\d+$/.test(key)) warnings.push(`konuSoruKayitlari: anahtar biçimi beklenmedik → ${key}`);
  });
  Object.keys(d.cizelgeNotlari || {}).forEach(key => {
    if (!/^.+_.+$/.test(key)) warnings.push(`cizelgeNotlari: anahtar biçimi beklenmedik → ${key}`);
  });

  if (!MODUL_IDS.includes(d.aktifModulId) && d.aktifModulId !== '' && d.aktifModulId !== undefined) {
    errors.push(`aktifModulId: geçersiz değer (${d.aktifModulId})`);
  }
  if (d.aktifOgrenciId && !ids.ogrenciler.has(String(d.aktifOgrenciId))) {
    warnings.push(`aktifOgrenciId: kayıtlı öğrenci yok (${d.aktifOgrenciId})`);
  }

  return {
    ok: errors.length === 0,
    hataSayisi: errors.length,
    uyariSayisi: warnings.length,
    hatalar: errors.slice(0, 100),
    uyarilar: warnings.slice(0, 100),
    sayilar: {
      ogrenci: ids.ogrenciler.size,
      gorev: ids.gorevler.size,
      ders: ids.dersler.size,
      konu: ids.konular.size,
      hata: ids.hataKayitlari.size,
      deneme: ids.denemeSinavlari.size,
      kaynak: ids.kaynaklar.size
    }
  };
}

module.exports = {
  ValidationError,
  MODUL_IDS,
  SINIF_DEGERLERI,
  GOREV_DURUMLARI,
  KONU_DURUMLARI,
  HATA_TURLERI,
  KAYNAK_TURLERI,
  NOT_TURLERI,
  VERI_KOLEKSIYONLARI,
  fold,
  str,
  num,
  bool,
  makeId,
  normDate,
  normYilAy,
  normTur,
  normModulId,
  normSinif,
  normTaskDurum,
  normKonuDurum,
  normHataTuru,
  normSaat,
  normGun,
  normSlotKey,
  keyKonuSoru,
  keyAliskanlikAySonu,
  keyAliskanlikNot,
  resolveStudent,
  resolveCourse,
  resolveTopic,
  resolveHabit,
  validateSchema,
  normalizeToolArgs,
  validateDatabase
};
