#!/usr/bin/env node
/**
 * Plantrack — Müfredat İçe Aktarıcı (geliştirme aracı)
 *
 * assets/Müfredatlar/TUM_MUFREDAT_VE_KONU_DAGILIMI.md dosyasını ayrıştırır,
 * ders + konu kayıtlarını üretir ve (--apply ile) çalışan MCP sunucusunun
 * veritabanına yazar. Bu bir SEED değildir; doğrudan veritabanına işlenir.
 *
 * Kullanım:
 *   node import_mufredat.js            → özet (dry-run)
 *   node import_mufredat.js --apply    → veritabanına yaz
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const os = require('os');

const REPO = path.resolve(__dirname, '..', '..');
const MD = path.join(REPO, 'assets', 'Müfredatlar', 'TUM_MUFREDAT_VE_KONU_DAGILIMI.md');
const PORT = 38888;
const APPLY = process.argv.includes('--apply');

// İşlenecek sınıflar ve kademeleri
const GRADES = {
  '5': { modulId: 'ara-sinif' },
  '6': { modulId: 'ara-sinif' },
  '7': { modulId: 'ara-sinif' },
  '8': { modulId: 'lgs' }
};

// Ders başlığı → kanonik ad / kısaltma / stil
// (8. sınıf mevcut lgs dersleriyle id bazında eşleşir)
const DERS_STIL = {
  'Türkçe':                            { kisaltma: 'TÜR', renk: 'rose',    ikon: 'book' },
  'Matematik':                         { kisaltma: 'MAT', renk: '#ef4444', ikon: 'calculator' },
  'Fen Bilimleri':                     { kisaltma: 'FEN', renk: 'emerald', ikon: 'flask-conical' },
  'Sosyal Bilgiler':                   { kisaltma: 'SOS', renk: 'orange',  ikon: 'globe' },
  'Din Kültürü ve Ahlak Bilgisi':      { kisaltma: 'DİN', renk: 'teal',    ikon: 'heart-handshake' },
  'İngilizce':                         { kisaltma: 'İNG', renk: 'purple',  ikon: 'languages' },
  'T.C. İnkılap Tarihi ve Atatürkçülük': { kisaltma: 'İNK', renk: 'amber', ikon: 'landmark' }
};

function kanonikDers(baslik) {
  const b = baslik.toLocaleUpperCase('tr-TR');
  if (b.includes('TÜRKÇE') || b.includes('TURKCE')) return 'Türkçe';
  if (b.includes('MATEMATİK') || b.includes('MATEMATIK')) return 'Matematik';
  if (b.includes('FEN')) return 'Fen Bilimleri';
  if (b.includes('SOSYAL')) return 'Sosyal Bilgiler';
  if (b.includes('İNKILAP') || b.includes('INKILAP')) return 'T.C. İnkılap Tarihi ve Atatürkçülük';
  if (b.includes('DİN') || b.includes('DIN')) return 'Din Kültürü ve Ahlak Bilgisi';
  if (b.includes('İNGİLİZCE') || b.includes('INGILIZCE') || b.includes('İNGILIZCE')) return 'İngilizce';
  return null;
}

// 8. sınıf için mevcut lgs dersleri (id korunur)
const LGS_DERS_ID = {
  'Türkçe': 'drs-lgs-turkce',
  'Matematik': 'drs-lgs-matematik',
  'Fen Bilimleri': 'drs-lgs-fen',
  'T.C. İnkılap Tarihi ve Atatürkçülük': 'drs-lgs-inkilap',
  'Din Kültürü ve Ahlak Bilgisi': 'drs-lgs-din',
  'İngilizce': 'drs-lgs-ingilizce'
};

function slug(s) {
  return s.toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/i̇/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Ayrıştırma ────────────────────────────────────────────────
const lines = fs.readFileSync(MD, 'utf8').split(/\r?\n/);
const gradeRe = /^##\s+(\d{1,2})\.\s*S[ıi]n[ıi]f\b(.*)$/;
const subjRe = /^###\s+(.+?)\s*\(Toplam\s+\d+\s+Konu\)\s*$/;
const unitRe = /^\*\*\[\s*Ünite\s*\/\s*Tema\s*:\s*(.*?)\s*\]\*\*\s*$/;
const konuRe = /^(\d{1,3})\.\s+(.+?)\s*$/;

// grade -> ders -> { uniteler: [ { ad, konular:[{sira, ad}] } ] }
const sonuc = {};
let grade = null, ders = null, unite = null;

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  let m = line.match(gradeRe);
  if (m) {
    grade = GRADES[m[1]] ? m[1] : null;
    ders = null; unite = null;
    if (grade && !sonuc[grade]) sonuc[grade] = {};
    continue;
  }
  if (!grade) continue;

  m = line.match(subjRe);
  if (m) {
    const kan = kanonikDers(m[1]);
    if (!kan) { ders = null; continue; }
    if (!sonuc[grade][kan]) sonuc[grade][kan] = { uniteler: [] };
    ders = sonuc[grade][kan];
    unite = null;
    continue;
  }

  if (!ders) continue;

  m = line.match(unitRe);
  if (m) {
    const ad = m[1].trim() || `Ünite ${ders.uniteler.length + 1}`;
    ders.uniteler.push({ ad, konular: [] });
    unite = ders.uniteler[ders.uniteler.length - 1];
    continue;
  }

  m = line.match(konuRe);
  if (m && unite) {
    unite.konular.push({ sira: Number(m[1]), ad: m[2].trim() });
    continue;
  }
}

// ── Kayıt üretimi ─────────────────────────────────────────────
function buildDerslerVeKonular() {
  const dersler = [], konular = [];
  for (const g of Object.keys(sonuc).sort()) {
    const modulId = GRADES[g].modulId;
    for (const dersAdi of Object.keys(sonuc[g])) {
      const bilgi = sonuc[g][dersAdi];
      const stil = DERS_STIL[dersAdi] || {};
      let dersId;
      if (g === '8' && LGS_DERS_ID[dersAdi]) {
        dersId = LGS_DERS_ID[dersAdi];
        dersler.push({ id: dersId, ad: dersAdi === 'İngilizce' ? 'Yabancı Dil (İngilizce)' : (dersAdi === 'T.C. İnkılap Tarihi ve Atatürkçülük' ? 'T.C. İnkılap Tarihi ve Atatürkçülük' : dersAdi), kisaltma: stil.kisaltma, modulId, sinif: g, renk: stil.renk, ikon: stil.ikon, sinavdaMi: true, soruSayisi: 0 });
      } else {
        dersId = `drs-${slug(modulId)}-${g}-${slug(dersAdi)}`;
        dersler.push({ id: dersId, ad: dersAdi, kisaltma: stil.kisaltma || '', modulId, sinif: g, renk: stil.renk || 'slate', ikon: stil.ikon || 'book', sinavdaMi: false, soruSayisi: 0 });
      }
      bilgi.uniteler.forEach((u, ui) => {
        u.konular.forEach(k => {
          konular.push({
            id: `kon-${slug(modulId)}-${g}-${slug(dersAdi)}-${k.sira}`,
            dersId, dersAdi: dersler[dersler.length - 1].ad, modulId, sinif: g,
            uniteNo: ui + 1, uniteAdi: u.ad, siraNo: k.sira, konuAdi: k.ad,
            kazanimlar: [], aciklama: ''
          });
        });
      });
    }
  }
  return { dersler, konular };
}

const { dersler, konular } = buildDerslerVeKonular();

// ── Özet ──────────────────────────────────────────────────────
console.log('=== AYRIŞTIRMA ÖZETİ ===');
for (const g of Object.keys(sonuc).sort()) {
  const dersSayisi = Object.keys(sonuc[g]).length;
  const konuSayisi = Object.values(sonuc[g]).reduce((a, d) => a + d.uniteler.reduce((b, u) => b + u.konular.length, 0), 0);
  console.log(`  ${g}. Sınıf: ${dersSayisi} ders, ${konuSayisi} konu`);
  for (const [ad, d] of Object.entries(sonuc[g])) {
    const kn = d.uniteler.reduce((b, u) => b + u.konular.length, 0);
    console.log(`     - ${ad}: ${d.uniteler.length} ünite, ${kn} konu`);
  }
}
console.log(`TOPLAM: ${dersler.length} ders, ${konular.length} konu`);

if (!APPLY) {
  console.log('\n(dry-run) Veritabanına yazmak için: --apply');
  process.exit(0);
}

// ── Veritabanına yaz (çalışan sunucu üzerinden) ───────────────
function httpJson(method, p, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, path: p, method, headers: body ? { 'Content-Type': 'application/json' } : {} }, res => {
      let data = ''; res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(data.slice(0, 200))); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  const yedekDir = path.join(os.homedir(), 'PlantrackMCP', 'jYedek');
  fs.mkdirSync(yedekDir, { recursive: true });
  const dbPath = path.join(os.homedir(), 'PlantrackMCP', 'data', 'plantrack_db.json');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(dbPath, path.join(yedekDir, `plantrack_db_mufredat_oncesi_${ts}.json`));
  console.log(`\nYedek alındı: jYedek/plantrack_db_mufredat_oncesi_${ts}.json`);

  const cur = await httpJson('GET', '/api/data');
  const data = cur.data;
  const oncekiKonu = (data.konular || []).length;

  // Sadece 5-8 sınıf müfredatını değiştir: bu sınıfların eski ders/konularını çıkar
  const hedefSiniflar = Object.keys(GRADES);
  data.dersler = (data.dersler || []).filter(d => !hedefSiniflar.includes(String(d.sinif)));
  data.konular = (data.konular || []).filter(k => !hedefSiniflar.includes(String(k.sinif)));

  const mevcutDersId = new Set(data.dersler.map(d => d.id));
  for (const d of dersler) if (!mevcutDersId.has(d.id)) { data.dersler.push(d); mevcutDersId.add(d.id); }
  data.konular.push(...konular);

  // ── Öğrenciler (veritabanına işlenir, seed değildir) ──
  if (!Array.isArray(data.ogrenciler)) data.ogrenciler = [];
  // Kişisel veri içermemesi için örnek kayıt boş bırakıldı.
  // Kendi öğrencilerinizi eklemek için şu şablonu kullanın:
  // { ad: 'Ad', soyad: 'Soyad', sinif: '8', modulId: 'lgs', renk: 'teal',
  //   okul: 'Okul Adı', veliAd: 'Veli Ad Soyad', veliTel: '05XXXXXXXXX', hedef: 'Hedef' }
  const yeniOgrenciler = [];
  let eklenenOgrenci = 0;
  for (const o of yeniOgrenciler) {
    const adSoyad = `${o.ad} ${o.soyad}`.trim();
    const varMi = data.ogrenciler.some(x => x.adSoyad === adSoyad && String(x.sinif) === o.sinif);
    if (varMi) { console.log(`  (atlandı, zaten var) ${adSoyad} (${o.sinif}. sınıf)`); continue; }
    const id = 'ogr-' + (Date.now() + eklenenOgrenci);
    data.ogrenciler.push({
      id, ad: o.ad, soyad: o.soyad, adSoyad, sinif: o.sinif, modulId: o.modulId,
      okul: o.okul, ogrenciTel: '', veliAd: o.veliAd, veliTel: o.veliTel, hedef: o.hedef,
      kayitTarihi: new Date().toISOString(), renk: o.renk, seciliKaynaklar: []
    });
    eklenenOgrenci++;
    console.log(`  + Öğrenci eklendi: ${adSoyad} (${o.sinif}. sınıf, ${o.modulId})`);
  }
  if (!data.aktifOgrenciId && data.ogrenciler.length > 0) {
    data.aktifOgrenciId = data.ogrenciler[0].id;
    data.aktifModulId = data.ogrenciler[0].modulId;
  }

  const res = await httpJson('POST', '/api/data', { data });
  console.log('POST sonucu:', JSON.stringify(res));
  console.log(`Ders: ${(data.dersler||[]).length}, Konu: ${(data.konular||[]).length} (önceki konu: ${oncekiKonu})`);
})().catch(e => { console.error('HATA:', e.message); process.exit(1); });
