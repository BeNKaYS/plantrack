/**
 * Plantrack MCP Server — Veri Tabanı Katmanı (Data Access Layer)
 * 
 * Plantrack verilerini (data/plantrack_db.json) güvenli, atomik ve
 * eksiksiz şekilde yöneten veritabanı modülü.
 */

const fs = require('fs');
const path = require('path');
const V = require('./validate');

const AUTO_BACKUP_MS = 60 * 1000;   // en fazla dakikada bir otomatik yedek
const AUTO_BACKUP_KEEP = 20;        // döngüsel yedek sayısı

class PlantrackDB {
  constructor(customDbPath = null) {
    let dbPath = customDbPath || process.env.PLANTRACK_DB_PATH;
    let backupDir = null;

    if (!dbPath) {
      const isInsideAppBundle = __dirname.includes('.app/Contents/Resources') || __dirname.includes('/Applications/');
      if (isInsideAppBundle) {
        const homeDir = process.env.HOME || require('os').homedir();
        const userMcpDir = path.join(homeDir, 'PlantrackMCP');
        dbPath = path.join(userMcpDir, 'data/plantrack_db.json');
        backupDir = path.join(userMcpDir, 'jYedek');
      } else {
        const projectRoot = path.resolve(__dirname, '..');
        dbPath = path.join(projectRoot, 'data/plantrack_db.json');
        backupDir = path.join(projectRoot, 'jYedek');
      }
    } else {
      backupDir = path.join(path.dirname(dbPath), '../jYedek');
    }

    this.dbPath = dbPath;
    this.backupDir = backupDir;
    this.data = null;
    this.structureWarnings = [];
    this.recoveredFrom = '';
    this.readOnly = false;
    this.autoBackupLast = 0;
    this.init();
  }

  /**
   * Veritabanını başlat: mevcut dosyadan yükle ya da en son yedekten/varsayılandan üret.
   *
   * Bozuk JSON ASLA sessizce sıfırlanmaz:
   *   1) Bozuk dosya .corrupt-<zaman> olarak saklanır (kanıt korunur)
   *   2) Sırayla en yeni yedekler denenir
   *   3) Hiçbiri açılamazsa salt-okunur moda geçilir; diske yazılmaz
   */
  init() {
    this.structureWarnings = [];
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch (parseErr) {
          return this.recoverFromCorruptFile(parseErr);
        }
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return this.recoverFromCorruptFile(new Error('Kök nesne bekleniyordu'));
        }
        this.data = parsed;
        this.ensureStructure();
        this.migrateLegacyKeys();
        return;
      }

      // Dosya henüz yoksa yedek klasöründen en güncelini ara
      const restored = this.loadLatestBackup();
      if (restored) {
        this.data = restored;
        this.ensureStructure();
        this.migrateLegacyKeys();
        process.stderr.write(`[DB INIT] Veri dosyası yok; yedekten geri yüklendi: ${this.recoveredFrom}\n`);
        this.save();
        return;
      }

      // Yedek de yoksa varsayılan boş şablon
      this.data = this.getDefaultTemplate();
      this.save();
    } catch (err) {
      process.stderr.write(`[DB INIT ERROR] ${err.message}\n`);
      this.data = this.getDefaultTemplate();
      this.readOnly = true;
    }
  }

  /** Veri dosyası bozuk: kanıtı sakla, yedekten dön, olmazsa salt-okunur başla. */
  recoverFromCorruptFile(parseErr) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const corruptPath = `${this.dbPath}.corrupt-${stamp}`;
    try {
      fs.copyFileSync(this.dbPath, corruptPath);
      process.stderr.write(`[DB CORRUPT] ${parseErr.message} · bozuk kopya: ${corruptPath}\n`);
    } catch (copyErr) {
      process.stderr.write(`[DB CORRUPT] ${parseErr.message} · bozuk kopya alınamadı: ${copyErr.message}\n`);
    }

    const restored = this.loadLatestBackup();
    if (restored) {
      this.data = restored;
      this.ensureStructure();
      this.migrateLegacyKeys();
      this.recoveredFrom = corruptPath;
      process.stderr.write('[DB RECOVERY] Son geçerli yedekten geri yüklendi; bozuk dosya korundu.\n');
      this.save();
      return;
    }

    this.data = this.getDefaultTemplate();
    this.readOnly = true;
    this.recoveredFrom = corruptPath;
    process.stderr.write('[DB RECOVERY] Geçerli yedek bulunamadı. SALT OKUNUR mod: diske yazılmayacak.\n');
  }

  /** Yedek klasöründeki en yeni açılabilir JSON dosyasını döndürür. */
  loadLatestBackup() {
    try {
      if (!fs.existsSync(this.backupDir)) return null;
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.json') && !f.startsWith('.'))
        .sort()
        .reverse()
        .slice(0, 20);
      for (const file of files) {
        const full = path.join(this.backupDir, file);
        try {
          const parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.ogrenciler)) {
            this.recoveredFrom = full;
            return parsed;
          }
        } catch (_) { /* bu yedek de bozuk, sıradakini dene */ }
      }
    } catch (_) {}
    return null;
  }

  /** Eski (uygulamayla uyuşmayan) anahtarları güncel formata çevirir. */
  migrateLegacyKeys() {
    let changed = false;
    const d = this.data || {};

    // 1) konuSoruKayitlari: ogr_konu_2026-09_1 → ogr_konu_2026-09_hf1
    if (d.konuSoruKayitlari && typeof d.konuSoruKayitlari === 'object') {
      Object.keys(d.konuSoruKayitlari).forEach(key => {
        const legacy = key.match(/^(.+)_(\d{1,2})$/);
        if (legacy && !/_hf\d+$/.test(key)) {
          const yeni = `${legacy[1]}_hf${legacy[2]}`;
          if (!d.konuSoruKayitlari[yeni]) d.konuSoruKayitlari[yeni] = d.konuSoruKayitlari[key];
          delete d.konuSoruKayitlari[key];
          changed = true;
        }
      });
    }

    // 2) aliskanlikAySonu: [ogr][yilAy][no] → ogr_al-X_yilAy
    if (d.aliskanlikAySonu && typeof d.aliskanlikAySonu === 'object') {
      Object.keys(d.aliskanlikAySonu).forEach(ogr => {
        const months = d.aliskanlikAySonu[ogr];
        if (!months || typeof months !== 'object' || Array.isArray(months)) return;
        const chains = (d.aliskanlikZincirleri && d.aliskanlikZincirleri[ogr]) || [];
        Object.keys(months).forEach(yilAy => {
          const byHabit = months[yilAy];
          if (!/^\d{4}-\d{2}$/.test(yilAy) || !byHabit || typeof byHabit !== 'object' || Array.isArray(byHabit)) return;
          Object.keys(byHabit).forEach(no => {
            const habitId = (chains[Number(no) - 1] && chains[Number(no) - 1].id) || `al-${no}`;
            const key = V.keyAliskanlikAySonu(ogr, habitId, yilAy);
            if (!d.aliskanlikAySonu[key]) {
              const val = Object.assign({}, byHabit[no]);
              if (val.gun === undefined && val.gunSayisi !== undefined) val.gun = Number(val.gunSayisi) || 0;
              d.aliskanlikAySonu[key] = val;
            }
          });
          changed = true;
        });
        delete d.aliskanlikAySonu[ogr];
      });
    }

    // 3) aliskanlikNotlari: [ogr][yilAy] = metin → ogr_yilAy
    if (d.aliskanlikNotlari && typeof d.aliskanlikNotlari === 'object') {
      Object.keys(d.aliskanlikNotlari).forEach(ogr => {
        const months = d.aliskanlikNotlari[ogr];
        if (!months || typeof months !== 'object' || Array.isArray(months)) return;
        Object.keys(months).forEach(yilAy => {
          if (!/^\d{4}-\d{2}$/.test(yilAy)) return;
          const key = V.keyAliskanlikNot(ogr, yilAy);
          const val = months[yilAy];
          if (typeof val === 'string' && !d.aliskanlikNotlari[key]) d.aliskanlikNotlari[key] = val;
          changed = true;
        });
        delete d.aliskanlikNotlari[ogr];
      });
    }

    if (changed) {
      process.stderr.write('[DB MIGRATION] Eski anahtar biçimleri güncel formata çevrildi.\n');
    }
  }

  /** Bütünlük raporu — salt okunur, veriyi değiştirmez. */
  validateDatabase() {
    return V.validateDatabase(this.data);
  }

  ensureStructure() {
    if (!this.data) this.data = {};
    const warnings = this.structureWarnings;

    const asArray = (key) => {
      const value = this.data[key];
      if (Array.isArray(value)) return;
      if (value && typeof value === 'object') {
        this.data[key] = Object.values(value).filter(v => v && typeof v === 'object');
        warnings.push(`${key}: nesne → diziye çevrildi (${this.data[key].length} kayıt)`);
        return;
      }
      if (value !== undefined && value !== null) warnings.push(`${key}: ${typeof value} değeri atıldı → []`);
      this.data[key] = [];
    };

    const asObject = (key, defaultValue) => {
      const value = this.data[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) return;
      if (value !== undefined && value !== null) warnings.push(`${key}: ${Array.isArray(value) ? 'dizi' : typeof value} → nesne yapıldı`);
      this.data[key] = defaultValue;
    };

    ['ogrenciler', 'gorevler', 'ogrenciKonuDurumlari', 'hataKayitlari', 'sinifNotlari',
      'calismaKayitlari', 'denemeSinavlari', 'dersler', 'konular', 'kaynaklar', 'sinavlar'
    ].forEach(asArray);

    asObject('aliskanlikZincirleri', {});
    asObject('aliskanlikAySonu', {});
    asObject('aliskanlikNotlari', {});
    asObject('zamanPlanlari', {});
    asObject('zamanAyarlari', {});
    asObject('konuSoruKayitlari', {});
    asObject('cizelgeNotlari', {});

    if (!this.data.kocProfili || typeof this.data.kocProfili !== 'object') {
      this.data.kocProfili = {
        ad: 'Eren',
        soyad: 'Kaya',
        unvan: 'Eğitim Koçu & Danışman',
        kurum: 'Plantrack Koçluk',
        telefon: '',
        avatarKisa: 'EK'
      };
    }

    if (warnings.length) {
      process.stderr.write(`[DB STRUCTURE] ${warnings.join(' | ')}\n`);
    }
  }

  getDefaultTemplate() {
    return {
      version: '1.0.0',
      kurulumTamamlandi: true,
      ogretimYili: '2025-2026',
      aktifModulId: 'lgs',
      kocProfili: {
        ad: 'Eren',
        soyad: 'Kaya',
        unvan: 'Eğitim Koçu & Danışman',
        kurum: 'Plantrack Koçluk',
        telefon: '',
        avatarKisa: 'EK'
      },
      aktifOgrenciId: '',
      ogrenciler: [],
      gorevler: [],
      ogrenciKonuDurumlari: [],
      hataKayitlari: [],
      sinifNotlari: [],
      calismaKayitlari: [],
      aliskanlikZincirleri: {},
      aliskanlikAySonu: {},
      aliskanlikNotlari: {},
      zamanPlanlari: {},
      konuSoruKayitlari: {},
      cizelgeNotlari: {},
      sinavlar: [],
      dersler: [],
      konular: [],
      kaynaklar: [],
      denemeSinavlari: [],
      zamanAyarlari: {},
      genelZamanAyarlari: { baslangicSaat: '06:00', bitisSaat: '24:00' }
    };
  }

  /**
   * Atomik dosya kaydetme (tmp dosya yazıp rename ederek).
   * Her yazmadan önce (en fazla dakikada bir) döngüsel yedek alınır.
   */
  save() {
    if (this.readOnly) {
      process.stderr.write('[DB SAVE BLOCKED] Salt okunur mod: veri dosyası yazılmadı.\n');
      return false;
    }
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.autoBackup();
      const tmpPath = `${this.dbPath}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.dbPath);
      return true;
    } catch (err) {
      process.stderr.write(`[DB SAVE ERROR] ${err.message}\n`);
      return false;
    }
  }

  /** Döngüsel otomatik yedek: jYedek/auto_<zaman>.json, en fazla 20 dosya. */
  autoBackup() {
    try {
      const now = Date.now();
      if (now - (this.autoBackupLast || 0) < AUTO_BACKUP_MS) return;
      if (!fs.existsSync(this.dbPath)) return;
      if (!fs.existsSync(this.backupDir)) fs.mkdirSync(this.backupDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const dest = path.join(this.backupDir, `auto_${stamp}.json`);
      fs.copyFileSync(this.dbPath, dest);
      this.autoBackupLast = now;

      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('auto_') && f.endsWith('.json'))
        .sort();
      while (files.length > AUTO_BACKUP_KEEP) {
        const old = files.shift();
        try { fs.unlinkSync(path.join(this.backupDir, old)); } catch (_) {}
      }
    } catch (err) {
      process.stderr.write(`[DB AUTO BACKUP WARN] ${err.message}\n`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. GENEL BİLGİ & SİSTEM ÖZETİ
  // ─────────────────────────────────────────────────────────────
  getOverview() {
    const students = this.data.ogrenciler || [];
    const tasks = this.data.gorevler || [];
    const pendingTasks = tasks.filter(t => t.durum === 'bekliyor');
    const inProgressTasks = tasks.filter(t => t.durum === 'devam_ediyor');
    const completedTasks = tasks.filter(t => t.durum === 'tamamlandi');
    const overdueTasks = tasks.filter(t => t.durum === 'gecikti');

    const modulesSummary = {
      'ara-sinif': students.filter(s => s.modulId === 'ara-sinif').length,
      'lgs': students.filter(s => s.modulId === 'lgs').length,
      'yks': students.filter(s => s.modulId === 'yks').length
    };

    return {
      version: this.data.version || '1.0.0',
      ogretimYili: this.data.ogretimYili || '2025-2026',
      kocProfili: this.data.kocProfili || {},
      aktifModulId: this.data.aktifModulId || 'lgs',
      aktifOgrenciId: this.data.aktifOgrenciId || '',
      istatistikler: {
        toplamOgrenci: students.length,
        modulDagilimi: modulesSummary,
        toplamGorev: tasks.length,
        bekleyenGorevler: pendingTasks.length,
        devamEdenGorevler: inProgressTasks.length,
        tamamlananGorevler: completedTasks.length,
        gecikenGorevler: overdueTasks.length,
        toplamDenemeSinavi: (this.data.denemeSinavlari || []).length,
        toplamDers: (this.data.dersler || []).length,
        toplamKonu: (this.data.konular || []).length,
        toplamKaynak: (this.data.kaynaklar || []).length,
        toplamHataKaydi: (this.data.hataKayitlari || []).length
      }
    };
  }

  getCoachProfile() {
    return this.data.kocProfili || {};
  }

  updateCoachProfile(updates) {
    if (!this.data.kocProfili) this.data.kocProfili = {};
    Object.assign(this.data.kocProfili, updates);
    if (this.data.kocProfili.ad && this.data.kocProfili.soyad) {
      this.data.kocProfili.avatarKisa = (this.data.kocProfili.ad[0] + this.data.kocProfili.soyad[0]).toUpperCase();
    }
    this.save();
    return this.data.kocProfili;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ÖĞRENCİLER
  // ─────────────────────────────────────────────────────────────
  getStudents({ modulId, sinif, search } = {}) {
    let list = this.data.ogrenciler || [];
    if (modulId) list = list.filter(s => s.modulId === modulId);
    if (sinif) list = list.filter(s => String(s.sinif) === String(sinif));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.adSoyad && s.adSoyad.toLowerCase().includes(q)) ||
        (s.okul && s.okul.toLowerCase().includes(q)) ||
        (s.hedef && s.hedef.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getStudent(idOrName) {
    if (!idOrName) return null;
    const q = String(idOrName).trim().toLowerCase();
    const students = this.data.ogrenciler || [];
    let student = students.find(s => s.id === idOrName);
    if (!student) {
      student = students.find(s => s.adSoyad && s.adSoyad.toLowerCase().includes(q));
    }
    if (!student) return null;

    // Öğrenciye ait özet istatistikleri iliştir
    const studentTasks = (this.data.gorevler || []).filter(t => t.ogrenciId === student.id);
    const mockExams = (this.data.denemeSinavlari || []).filter(m => m.ogrenciId === student.id);
    const mistakes = (this.data.hataKayitlari || []).filter(h => h.ogrenciId === student.id);
    const topicProgress = (this.data.ogrenciKonuDurumlari || []).filter(p => p.ogrenciId === student.id);
    const habits = (this.data.aliskanlikZincirleri && this.data.aliskanlikZincirleri[student.id]) || [];

    return {
      ...student,
      ozet: {
        gorevSayisi: studentTasks.length,
        tamamlananGorev: studentTasks.filter(t => t.durum === 'tamamlandi').length,
        bekleyenGorev: studentTasks.filter(t => t.durum === 'bekliyor').length,
        gecikenGorev: studentTasks.filter(t => t.durum === 'gecikti').length,
        denemeSinaviSayisi: mockExams.length,
        hataKaydiSayisi: mistakes.length,
        islenenKonuSayisi: topicProgress.filter(p => p.durum === 'tamam').length,
        calisilanKonuSayisi: topicProgress.filter(p => p.durum === 'calisiliyor').length,
        aliskanlikSayisi: habits.length
      }
    };
  }

  addStudent(studentData) {
    const id = studentData.id || V.makeId('ogr', new Set((this.data.ogrenciler || []).map(s => String(s.id))));
    const ad = (studentData.ad || '').trim();
    const soyad = (studentData.soyad || '').trim();
    const adSoyad = studentData.adSoyad || `${ad} ${soyad}`.trim();
    const sinif = String(studentData.sinif || '8');
    
    // Sınıfa göre modül tayini
    let modulId = studentData.modulId;
    if (!modulId) {
      if (['5', '6', '7', '9', '10', '11'].includes(sinif)) modulId = 'ara-sinif';
      else if (['8'].includes(sinif)) modulId = 'lgs';
      else if (['12', 'mezun'].includes(sinif)) modulId = 'yks';
      else modulId = 'ara-sinif';
    }

    const student = {
      id,
      ad,
      soyad,
      adSoyad,
      sinif,
      modulId,
      okul: studentData.okul || '',
      ogrenciTel: studentData.ogrenciTel || '',
      veliAd: studentData.veliAd || '',
      veliTel: studentData.veliTel || '',
      hedef: studentData.hedef || '',
      kayitTarihi: studentData.kayitTarihi || new Date().toISOString(),
      renk: studentData.renk || 'teal',
      seciliKaynaklar: studentData.seciliKaynaklar || []
    };

    this.data.ogrenciler.push(student);

    // Varsayılan alışkanlık zincirleri başlat (eğer boşsa)
    if (!this.data.aliskanlikZincirleri) this.data.aliskanlikZincirleri = {};
    if (!this.data.aliskanlikZincirleri[id]) {
      this.data.aliskanlikZincirleri[id] = [
        { id: 'al-1', baslik: 'Günde 20 Paragraf & Soru', renk: 'rose' },
        { id: 'al-2', baslik: 'Matematik Alıştırması', renk: 'blue' },
        { id: 'al-3', baslik: 'Kitap Okuma (30 dk)', renk: 'emerald' }
      ];
    }

    this.save();
    return student;
  }

  updateStudent(id, updates) {
    const idx = (this.data.ogrenciler || []).findIndex(s => s.id === id);
    if (idx === -1) return null;

    const existing = this.data.ogrenciler[idx];
    const merged = { ...existing, ...updates, id: existing.id };

    if (updates.ad || updates.soyad) {
      const ad = (updates.ad || existing.ad || '').trim();
      const soyad = (updates.soyad || existing.soyad || '').trim();
      merged.adSoyad = `${ad} ${soyad}`.trim();
    }

    if (updates.sinif && !updates.modulId) {
      const s = String(updates.sinif);
      if (['5', '6', '7', '9', '10', '11'].includes(s)) merged.modulId = 'ara-sinif';
      else if (['8'].includes(s)) merged.modulId = 'lgs';
      else if (['12', 'mezun'].includes(s)) merged.modulId = 'yks';
    }

    this.data.ogrenciler[idx] = merged;
    this.save();
    return merged;
  }

  deleteStudent(id) {
    const idx = (this.data.ogrenciler || []).findIndex(s => s.id === id);
    if (idx === -1) return false;

    this.data.ogrenciler.splice(idx, 1);

    // Cascade silme
    this.data.gorevler = (this.data.gorevler || []).filter(t => t.ogrenciId !== id);
    this.data.ogrenciKonuDurumlari = (this.data.ogrenciKonuDurumlari || []).filter(k => k.ogrenciId !== id);
    this.data.hataKayitlari = (this.data.hataKayitlari || []).filter(h => h.ogrenciId !== id);
    this.data.sinifNotlari = (this.data.sinifNotlari || []).filter(n => n.ogrenciId !== id);
    this.data.calismaKayitlari = (this.data.calismaKayitlari || []).filter(c => c.ogrenciId !== id);
    this.data.denemeSinavlari = (this.data.denemeSinavlari || []).filter(d => d.ogrenciId !== id);

    if (this.data.aliskanlikZincirleri) delete this.data.aliskanlikZincirleri[id];
    if (this.data.zamanPlanlari) delete this.data.zamanPlanlari[id];
    if (this.data.zamanAyarlari) delete this.data.zamanAyarlari[id];

    // Konu soru kayıtlarında ogrenciId ile başlayan anahtarları temizle
    if (this.data.konuSoruKayitlari) {
      for (const k of Object.keys(this.data.konuSoruKayitlari)) {
        if (k.startsWith(`${id}_`)) {
          delete this.data.konuSoruKayitlari[k];
        }
      }
    }

    if (this.data.aktifOgrenciId === id) {
      this.data.aktifOgrenciId = this.data.ogrenciler.length > 0 ? this.data.ogrenciler[0].id : '';
    }

    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. GÖREVLER & ÖDEVLER
  // ─────────────────────────────────────────────────────────────
  getTasks({ ogrenciId, durum, dersId, konuId, search } = {}) {
    let list = this.data.gorevler || [];
    if (ogrenciId) list = list.filter(t => t.ogrenciId === ogrenciId);
    if (durum) list = list.filter(t => t.durum === durum);
    if (dersId) list = list.filter(t => t.dersId === dersId);
    if (konuId) list = list.filter(t => t.konuId === konuId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.baslik && t.baslik.toLowerCase().includes(q)) ||
        (t.aciklama && t.aciklama.toLowerCase().includes(q)) ||
        (t.not && t.not.toLowerCase().includes(q))
      );
    }

    // Ders ve konu adlarını çözümle
    const derslerMap = new Map((this.data.dersler || []).map(d => [d.id, d.ad]));
    const konularMap = new Map((this.data.konular || []).map(k => [k.id, k.konuAdi]));
    const ogrencilerMap = new Map((this.data.ogrenciler || []).map(o => [o.id, o.adSoyad]));

    return list.map(t => ({
      ...t,
      dersAdi: derslerMap.get(t.dersId) || t.dersId,
      konuAdi: konularMap.get(t.konuId) || t.konuId,
      ogrenciAdi: ogrencilerMap.get(t.ogrenciId) || t.ogrenciId
    }));
  }

  getTask(id) {
    const task = (this.data.gorevler || []).find(t => t.id === id);
    if (!task) return null;
    const ders = (this.data.dersler || []).find(d => d.id === task.dersId);
    const konu = (this.data.konular || []).find(k => k.id === task.konuId);
    const ogrenci = (this.data.ogrenciler || []).find(o => o.id === task.ogrenciId);
    return {
      ...task,
      dersAdi: ders ? ders.ad : task.dersId,
      konuAdi: konu ? konu.konuAdi : task.konuId,
      ogrenciAdi: ogrenci ? ogrenci.adSoyad : task.ogrenciId
    };
  }

  addTask(taskData) {
    const id = taskData.id || V.makeId('grv', new Set((this.data.gorevler || []).map(t => String(t.id))));
    const task = {
      id,
      ogrenciId: taskData.ogrenciId,
      dersId: taskData.dersId || '',
      konuId: taskData.konuId || '',
      kaynakId: taskData.kaynakId || '',
      baslik: taskData.baslik || 'Ödev / Çalışma',
      aciklama: taskData.aciklama || '',
      hedefSoru: Number(taskData.hedefSoru) || 0,
      cozulenSoru: Number(taskData.cozulenSoru) || 0,
      dogruSoru: Number(taskData.dogruSoru) || 0,
      yanlisSoru: Number(taskData.yanlisSoru) || 0,
      sureDk: Number(taskData.sureDk) || 0,
      durum: taskData.durum || 'bekliyor',
      deadline: taskData.deadline || '',
      olusturmaTarihi: taskData.olusturmaTarihi || new Date().toISOString(),
      tamamlanmaTarihi: taskData.tamamlanmaTarihi || '',
      not: taskData.not || ''
    };

    this.data.gorevler.push(task);
    this.save();
    return this.getTask(id);
  }

  updateTask(id, updates) {
    const idx = (this.data.gorevler || []).findIndex(t => t.id === id);
    if (idx === -1) return null;

    const existing = this.data.gorevler[idx];
    const merged = { ...existing, ...updates, id: existing.id };

    if (updates.durum === 'tamamlandi' && !existing.tamamlanmaTarihi) {
      merged.tamamlanmaTarihi = new Date().toISOString();
    }

    this.data.gorevler[idx] = merged;
    this.save();
    return this.getTask(id);
  }

  completeTask(id, { cozulenSoru, dogruSoru, yanlisSoru, sureDk, not } = {}) {
    const idx = (this.data.gorevler || []).findIndex(t => t.id === id);
    if (idx === -1) return null;

    const t = this.data.gorevler[idx];
    t.durum = 'tamamlandi';
    t.tamamlanmaTarihi = new Date().toISOString();
    if (cozulenSoru !== undefined) t.cozulenSoru = Number(cozulenSoru);
    if (dogruSoru !== undefined) t.dogruSoru = Number(dogruSoru);
    if (yanlisSoru !== undefined) t.yanlisSoru = Number(yanlisSoru);
    if (sureDk !== undefined) t.sureDk = Number(sureDk);
    if (not !== undefined) t.not = not;

    this.save();
    return this.getTask(id);
  }

  deleteTask(id) {
    const idx = (this.data.gorevler || []).findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.gorevler.splice(idx, 1);
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. MÜFREDAT, DERSLER & KONULAR
  // ─────────────────────────────────────────────────────────────
  getModulesAndClasses() {
    return {
      moduller: [
        { id: 'ara-sinif', ad: 'Ara Sınıflar', kisaltma: 'ARA', siniflar: ['5', '6', '7', '9', '10', '11'] },
        { id: 'lgs',       ad: 'LGS Hazırlık', kisaltma: 'LGS', siniflar: ['8'] },
        { id: 'yks',       ad: 'TYT-AYT',      kisaltma: 'YKS', siniflar: ['12', 'mezun'] }
      ],
      siniflar: [
        { deger: '5',     label: '5. Sınıf',  modulId: 'ara-sinif' },
        { deger: '6',     label: '6. Sınıf',  modulId: 'ara-sinif' },
        { deger: '7',     label: '7. Sınıf',  modulId: 'ara-sinif' },
        { deger: '8',     label: '8. Sınıf',  modulId: 'lgs' },
        { deger: '9',     label: '9. Sınıf',  modulId: 'ara-sinif' },
        { deger: '10',    label: '10. Sınıf', modulId: 'ara-sinif' },
        { deger: '11',    label: '11. Sınıf', modulId: 'ara-sinif' },
        { deger: '12',    label: '12. Sınıf', modulId: 'yks' },
        { deger: 'mezun', label: 'Mezun',     modulId: 'yks' }
      ]
    };
  }

  getCourses({ modulId, sinif, search } = {}) {
    let list = this.data.dersler || [];
    if (modulId) list = list.filter(d => d.modulId === modulId);
    if (sinif) list = list.filter(d => d.sinif === sinif || d.sinif === 'ortak');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        (d.ad && d.ad.toLowerCase().includes(q)) ||
        (d.kisaltma && d.kisaltma.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getCourse(id) {
    return (this.data.dersler || []).find(d => d.id === id) || null;
  }

  getTopics({ dersId, modulId, sinif, search, limit = 100 } = {}) {
    let list = this.data.konular || [];
    if (dersId) list = list.filter(k => k.dersId === dersId);
    if (modulId) list = list.filter(k => k.modulId === modulId);
    if (sinif) list = list.filter(k => k.sinif === sinif);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(k =>
        (k.konuAdi && k.konuAdi.toLowerCase().includes(q)) ||
        (k.uniteAdi && k.uniteAdi.toLowerCase().includes(q)) ||
        (k.aciklama && k.aciklama.toLowerCase().includes(q))
      );
    }
    const derslerMap = new Map((this.data.dersler || []).map(d => [d.id, d.ad]));
    return list.slice(0, limit).map(k => ({
      ...k,
      dersAdi: derslerMap.get(k.dersId) || k.dersId
    }));
  }

  getTopic(id) {
    const topic = (this.data.konular || []).find(k => k.id === id);
    if (!topic) return null;
    const ders = (this.data.dersler || []).find(d => d.id === topic.dersId);
    return {
      ...topic,
      dersAdi: ders ? ders.ad : topic.dersId
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ÖĞRENCİ KONU TAKİP & MATRİS
  // ─────────────────────────────────────────────────────────────
  getStudentTopicProgress({ ogrenciId, dersId } = {}) {
    if (!ogrenciId) return null;
    let records = (this.data.ogrenciKonuDurumlari || []).filter(r => r.ogrenciId === ogrenciId);
    let topics = this.data.konular || [];

    if (dersId) {
      topics = topics.filter(t => t.dersId === dersId);
      const topicIds = new Set(topics.map(t => t.id));
      records = records.filter(r => topicIds.has(r.konuId));
    }

    const recordsMap = new Map(records.map(r => [r.konuId, r]));
    const derslerMap = new Map((this.data.dersler || []).map(d => [d.id, d.ad]));

    const items = topics.map(topic => {
      const rec = recordsMap.get(topic.id);
      return {
        konuId: topic.id,
        konuAdi: topic.konuAdi,
        uniteNo: topic.uniteNo,
        uniteAdi: topic.uniteAdi,
        dersId: topic.dersId,
        dersAdi: derslerMap.get(topic.dersId) || topic.dersId,
        durum: rec ? rec.durum : 'islenmedi',
        not: rec ? (rec.not || '') : '',
        guncellenmeTarihi: rec ? (rec.guncellenmeTarihi || '') : ''
      };
    });

    const total = items.length;
    const tamam = items.filter(i => i.durum === 'tamam').length;
    const calisiliyor = items.filter(i => i.durum === 'calisiliyor').length;
    const tekrar_lazim = items.filter(i => i.durum === 'tekrar_lazim').length;
    const islenmedi = items.filter(i => i.durum === 'islenmedi').length;
    const yuzde = total > 0 ? Math.round((tamam / total) * 100) : 0;

    return {
      ogrenciId,
      dersId: dersId || 'tum_dersler',
      istatistik: {
        toplamKonu: total,
        tamamlanan: tamam,
        calisilan: calisiliyor,
        tekrarGereken: tekrar_lazim,
        islenmemis: islenmedi,
        tamamlanmaYuzdesi: yuzde
      },
      konular: items
    };
  }

  updateStudentTopicStatus({ ogrenciId, konuId, durum, not }) {
    if (!ogrenciId || !konuId) return null;
    if (!Array.isArray(this.data.ogrenciKonuDurumlari)) this.data.ogrenciKonuDurumlari = [];

    const idx = this.data.ogrenciKonuDurumlari.findIndex(r => r.ogrenciId === ogrenciId && r.konuId === konuId);
    const now = new Date().toISOString();

    if (idx >= 0) {
      if (durum) this.data.ogrenciKonuDurumlari[idx].durum = durum;
      if (not !== undefined) this.data.ogrenciKonuDurumlari[idx].not = not;
      this.data.ogrenciKonuDurumlari[idx].guncellenmeTarihi = now;
    } else {
      this.data.ogrenciKonuDurumlari.push({
        id: V.makeId('okd', new Set(this.data.ogrenciKonuDurumlari.map(r => String(r.id)))),
        ogrenciId,
        konuId,
        durum: durum || 'islenmedi',
        not: not || '',
        guncellenmeTarihi: now
      });
    }

    this.save();
    return this.data.ogrenciKonuDurumlari.find(r => r.ogrenciId === ogrenciId && r.konuId === konuId);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. HATA DEFTERİ (MISTAKE TRACKER)
  // ─────────────────────────────────────────────────────────────
  getMistakes({ ogrenciId, dersId, hataTuru, telafiDurumu } = {}) {
    let list = this.data.hataKayitlari || [];
    if (ogrenciId) list = list.filter(h => h.ogrenciId === ogrenciId);
    if (dersId) list = list.filter(h => h.dersId === dersId);
    if (hataTuru) list = list.filter(h => h.hataTuru === hataTuru);
    if (telafiDurumu !== undefined) list = list.filter(h => Boolean(h.telafiDurumu) === Boolean(telafiDurumu));

    const derslerMap = new Map((this.data.dersler || []).map(d => [d.id, d.ad]));
    const konularMap = new Map((this.data.konular || []).map(k => [k.id, k.konuAdi]));
    const ogrencilerMap = new Map((this.data.ogrenciler || []).map(o => [o.id, o.adSoyad]));

    return list.map(h => ({
      ...h,
      dersAdi: derslerMap.get(h.dersId) || h.dersId,
      konuAdi: konularMap.get(h.konuId) || h.konuId,
      ogrenciAdi: ogrencilerMap.get(h.ogrenciId) || h.ogrenciId
    }));
  }

  addMistake(mistakeData) {
    const id = mistakeData.id || `hta-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record = {
      id,
      ogrenciId: mistakeData.ogrenciId,
      dersId: mistakeData.dersId || '',
      konuId: mistakeData.konuId || '',
      hataTuru: mistakeData.hataTuru || 'Bilgi Eksikliği',
      aciklama: mistakeData.aciklama || '',
      asama: mistakeData.asama || 1,
      telafiDurumu: Boolean(mistakeData.telafiDurumu),
      olusturmaTarihi: mistakeData.olusturmaTarihi || new Date().toISOString(),
      tekrarTarihi: mistakeData.tekrarTarihi || '',
      tamamlanmaTarihi: ''
    };

    this.data.hataKayitlari.push(record);
    this.save();
    return record;
  }

  updateMistake(id, updates) {
    const idx = (this.data.hataKayitlari || []).findIndex(h => h.id === id);
    if (idx === -1) return null;

    const existing = this.data.hataKayitlari[idx];
    const merged = { ...existing, ...updates, id: existing.id };

    if (updates.telafiDurumu === true && !existing.tamamlanmaTarihi) {
      merged.tamamlanmaTarihi = new Date().toISOString();
    }

    this.data.hataKayitlari[idx] = merged;
    this.save();
    return merged;
  }

  deleteMistake(id) {
    const idx = (this.data.hataKayitlari || []).findIndex(h => h.id === id);
    if (idx === -1) return false;
    this.data.hataKayitlari.splice(idx, 1);
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 7. DENEME SINAVLARI & ANALİZLERİ
  // ─────────────────────────────────────────────────────────────
  getMockExams({ ogrenciId, tur } = {}) {
    let list = this.data.denemeSinavlari || [];
    if (ogrenciId) list = list.filter(m => m.ogrenciId === ogrenciId);
    if (tur) {
      list = list.filter(m => {
        const ad = m.sinavAdi || m.ad || '';
        const t = (m.tur || (ad.includes('LGS') || ad.includes('8.') ? 'LGS' : (ad.includes('TYT') || ad.includes('AYT') || ad.includes('YKS') ? 'YKS' : ''))).toLowerCase();
        return t === tur.toLowerCase();
      });
    }

    const ogrencilerMap = new Map((this.data.ogrenciler || []).map(o => [o.id, o.adSoyad]));
    return list.map(m => {
      const ad = m.sinavAdi || m.ad || (m.dosyaAdi ? m.dosyaAdi.replace(/\.xlsx$/i, '') : 'Deneme Sınavı');
      const tarih = m.sinavTarihi || m.tarih || (m.olusturmaTarihi ? m.olusturmaTarihi.split('T')[0] : '');
      const hesaplananTur = m.tur || (ad.includes('LGS') || ad.includes('8.') ? 'LGS' : (ad.includes('TYT') || ad.includes('AYT') || ad.includes('YKS') ? 'YKS' : 'Genel'));
      return {
        id: m.id,
        ogrenciId: m.ogrenciId,
        ogrenciAdi: ogrencilerMap.get(m.ogrenciId) || m.ogrenciAdi || m.ogrenciId,
        tur: hesaplananTur,
        ad,
        tarih,
        puan: m.puan || null,
        toplamSoru: m.toplam ? m.toplam.soruSayisi : 0,
        dogru: m.toplam ? m.toplam.dogru : 0,
        yanlis: m.toplam ? m.toplam.yanlis : 0,
        bos: m.toplam ? m.toplam.bos : 0,
        net: m.toplam ? m.toplam.net : 0,
        basariYuzde: m.toplam ? m.toplam.basariYuzde : 0,
        dosyaAdi: m.dosyaAdi || ''
      };
    });
  }

  getMockExam(id) {
    const exam = (this.data.denemeSinavlari || []).find(m => m.id === id);
    if (!exam) return null;
    const ogrenci = (this.data.ogrenciler || []).find(o => o.id === exam.ogrenciId);
    return {
      ...exam,
      ogrenciAdi: ogrenci ? ogrenci.adSoyad : exam.ogrenciId
    };
  }

  addMockExam(examData) {
    const id = examData.id || V.makeId('dnm', new Set((this.data.denemeSinavlari || []).map(e => String(e.id))));
    const exam = {
      ...examData,
      id,
      olusturmaTarihi: examData.olusturmaTarihi || new Date().toISOString()
    };
    this.data.denemeSinavlari.push(exam);
    this.save();
    return exam;
  }

  deleteMockExam(id) {
    const idx = (this.data.denemeSinavlari || []).findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.denemeSinavlari.splice(idx, 1);
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 8. KAYNAK & YAYIN KÜTÜPHANESİ
  // ─────────────────────────────────────────────────────────────
  getResources({ yayinEvi, tur, search, modulId } = {}) {
    let list = this.data.kaynaklar || [];
    if (yayinEvi) list = list.filter(k => (k.yayinevi || k.yayinEvi || '').toLowerCase() === yayinEvi.toLowerCase());
    if (tur) list = list.filter(k => (k.tur || '').toLowerCase() === tur.toLowerCase());
    if (modulId) list = list.filter(k => Array.isArray(k.modulId) ? k.modulId.includes(modulId) : k.modulId === modulId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(k =>
        (k.ad && k.ad.toLowerCase().includes(q)) ||
        ((k.yayinevi || k.yayinEvi) && (k.yayinevi || k.yayinEvi).toLowerCase().includes(q))
      );
    }
    return list;
  }

  getResource(id) {
    return (this.data.kaynaklar || []).find(k => k.id === id) || null;
  }

  addResource(resourceData) {
    const id = resourceData.id || V.makeId('kyn', new Set((this.data.kaynaklar || []).map(k => String(k.id))));
    const resource = {
      id,
      ad: resourceData.ad || 'Kaynak Kitap',
      yayinevi: resourceData.yayinevi || resourceData.yayinEvi || 'Yayınevi',
      modulId: resourceData.modulId || ['lgs', 'yks', 'ara-sinif'],
      tur: resourceData.tur || 'Soru Bankası',
      zorluk: Number(resourceData.zorluk) || 3,
      aciklama: resourceData.aciklama || '',
      dersId: resourceData.dersId || ''
    };
    this.data.kaynaklar.push(resource);
    this.save();
    return resource;
  }

  updateResource(id, updates) {
    const idx = (this.data.kaynaklar || []).findIndex(k => k.id === id);
    if (idx === -1) return null;
    const merged = { ...this.data.kaynaklar[idx], ...updates, id };
    this.data.kaynaklar[idx] = merged;
    this.save();
    return merged;
  }

  deleteResource(id) {
    const idx = (this.data.kaynaklar || []).findIndex(k => k.id === id);
    if (idx === -1) return false;
    this.data.kaynaklar.splice(idx, 1);
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 9. ALIŞKANLIK ZİNCİRLERİ & GÜNLÜK ÇALIŞMA KAYITLARI
  // ─────────────────────────────────────────────────────────────
  getStudentHabits(ogrenciId) {
    if (!ogrenciId) return null;
    const chains = (this.data.aliskanlikZincirleri && this.data.aliskanlikZincirleri[ogrenciId]) || [];
    const logs = (this.data.calismaKayitlari || []).filter(c => c.ogrenciId === ogrenciId && c.tur === 'aliskanlik');
    // Notlar uygulamada düz anahtar kullanır: ogrenciId_yilAy (js/store.js:1926)
    const notes = {};
    const prefix = `${ogrenciId}_`;
    Object.keys(this.data.aliskanlikNotlari || {}).forEach(key => {
      const value = this.data.aliskanlikNotlari[key];
      if (key.startsWith(prefix) && typeof value !== 'object') {
        notes[key.slice(prefix.length)] = value;
      }
    });
    return {
      ogrenciId,
      zincirler: chains,
      kayitlar: logs,
      notlar: notes
    };
  }

  logHabitActivity({ ogrenciId, aliskanlikId, tarih, tamamlandi }) {
    if (!ogrenciId || !aliskanlikId || !tarih) return null;
    if (!Array.isArray(this.data.calismaKayitlari)) this.data.calismaKayitlari = [];

    const idx = this.data.calismaKayitlari.findIndex(k =>
      k.ogrenciId === ogrenciId &&
      k.tur === 'aliskanlik' &&
      k.aliskanlikId === aliskanlikId &&
      k.tarih === tarih
    );

    const isCompleted = tamamlandi !== undefined ? Boolean(tamamlandi) : (idx < 0);

    if (idx >= 0) {
      if (isCompleted) {
        this.data.calismaKayitlari[idx].tamamlandi = true;
      } else {
        this.data.calismaKayitlari.splice(idx, 1);
      }
    } else if (isCompleted) {
      this.data.calismaKayitlari.push({
        id: `cal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ogrenciId,
        tur: 'aliskanlik',
        aliskanlikId,
        tarih,
        tamamlandi: true
      });
    }

    this.save();
    return { ogrenciId, aliskanlikId, tarih, tamamlandi: isCompleted };
  }

  // ─────────────────────────────────────────────────────────────
  // 10. ZAMAN BLOKLAMA & ÇİZELGE
  // ─────────────────────────────────────────────────────────────
  getStudentSchedule(ogrenciId) {
    if (!ogrenciId) return null;
    const plan = (this.data.zamanPlanlari && this.data.zamanPlanlari[ogrenciId]) || {};
    const settings = (this.data.zamanAyarlari && this.data.zamanAyarlari[ogrenciId]) || {};
    const generalSettings = this.data.genelZamanAyarlari || { baslangicSaat: '06:00', bitisSaat: '24:00' };

    return {
      ogrenciId,
      plan,
      ayarlar: settings,
      genelAyarlar: generalSettings
    };
  }

  updateStudentSchedule({ ogrenciId, slotKey, data }) {
    if (!ogrenciId || !slotKey) return null;
    if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
    if (!this.data.zamanPlanlari[ogrenciId]) this.data.zamanPlanlari[ogrenciId] = {};

    if (data === null || data === undefined) {
      delete this.data.zamanPlanlari[ogrenciId][slotKey];
    } else {
      this.data.zamanPlanlari[ogrenciId][slotKey] = data;
    }

    this.save();
    return { ogrenciId, slotKey, slot: this.data.zamanPlanlari[ogrenciId][slotKey] || null };
  }

  // ─────────────────────────────────────────────────────────────
  // 11. KONU SORU TAKİBİ (ÇİZELGE)
  // ─────────────────────────────────────────────────────────────
  getQuestionTracking({ ogrenciId, donem, dersId } = {}) {
    if (!ogrenciId) return null;
    const records = this.data.konuSoruKayitlari || {};
    const result = {};

    for (const [key, value] of Object.entries(records)) {
      if (key.startsWith(`${ogrenciId}_`)) {
        if (donem && !key.includes(donem)) continue;
        result[key] = value;
      }
    }

    return {
      ogrenciId,
      kayitlar: result
    };
  }

  recordQuestionCount({ ogrenciId, konuId, yilAy, donem, tur, hafta, dogru = 0, yanlis = 0, bos = 0, toplam = null }) {
    if (!ogrenciId || !konuId) return null;
    const period = yilAy || donem;
    const week = tur !== undefined && tur !== null && tur !== '' ? tur : hafta;
    if (!period || week === undefined || week === null || week === '') return null;
    if (!this.data.konuSoruKayitlari) this.data.konuSoruKayitlari = {};

    // Uygulama anahtarı: ogrenciId_konuId_yilAy_hf<tur>  (js/store.js:2034)
    const key = V.keyKonuSoru(ogrenciId, konuId, period, String(week).replace(/^hf/i, ''));
    const s = toplam !== null && toplam !== undefined ? Number(toplam) : (Number(dogru) + Number(yanlis) + Number(bos));
    const val = {
      d: Number(dogru),
      y: Number(yanlis),
      b: Number(bos),
      s: s
    };

    this.data.konuSoruKayitlari[key] = val;
    this.save();
    return { key, ...val };
  }

  // ─────────────────────────────────────────────────────────────
  // 12. YEDEKLEME & HAM VERİ ERİŞİMİ
  // ─────────────────────────────────────────────────────────────
  exportBackup(targetFileName = null) {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const filename = targetFileName || `plantrack_yedek_${dateStr}_mcp.json`;
      const exportPath = path.join(this.backupDir, filename);

      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      fs.writeFileSync(exportPath, JSON.stringify(this.data, null, 2), 'utf8');
      return {
        basarili: true,
        dosyaYolu: exportPath,
        dosyaAdi: filename,
        boyut: fs.statSync(exportPath).size
      };
    } catch (err) {
      return {
        basarili: false,
        hata: err.message
      };
    }
  }

  getRawData(key = null) {
    if (!key) return this.data;
    return this.data[key] !== undefined ? this.data[key] : null;
  }

  customQuery({ collection, filter = {}, limit = 50 } = {}) {
    if (!collection || !Array.isArray(this.data[collection])) {
      return { hata: `Koleksiyon bulunamadı veya bir dizi değil: '${collection}'` };
    }

    let items = this.data[collection];
    if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
      items = items.filter(item => {
        for (const [k, v] of Object.entries(filter)) {
          if (typeof v === 'string') {
            if (String(item[k]).toLowerCase() !== v.toLowerCase()) return false;
          } else if (item[k] !== v) {
            return false;
          }
        }
        return true;
      });
    }

    return {
      toplamBulunan: items.length,
      sonuclar: items.slice(0, limit)
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 13. MÜFREDAT DERS YÖNETİMİ (ADD / UPDATE / DELETE)
  // ─────────────────────────────────────────────────────────────
  addCourse(courseData) {
    const id = courseData.id || `drs-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const course = {
      id,
      modulId: courseData.modulId || 'yks',
      sinif: String(courseData.sinif || 'ortak'),
      ad: (courseData.ad || 'Yeni Ders').trim(),
      kisaltma: (courseData.kisaltma || 'DRS').trim().toUpperCase().slice(0, 5),
      renk: courseData.renk || 'blue',
      ikon: courseData.ikon || 'book',
      haftalikSaat: Number(courseData.haftalikSaat) || 0,
      sinavdaMi: Boolean(courseData.sinavdaMi),
      soruSayisi: Number(courseData.soruSayisi) || 0
    };
    if (!Array.isArray(this.data.dersler)) this.data.dersler = [];
    this.data.dersler.push(course);
    this.save();
    return course;
  }

  updateCourse(id, updates) {
    if (!Array.isArray(this.data.dersler)) this.data.dersler = [];
    const idx = this.data.dersler.findIndex(d => String(d.id) === String(id));
    if (idx === -1) return null;
    if (updates.kisaltma) updates.kisaltma = updates.kisaltma.trim().toUpperCase().slice(0, 5);
    const merged = { ...this.data.dersler[idx], ...updates, id };
    this.data.dersler[idx] = merged;
    this.save();
    return merged;
  }

  deleteCourse(id) {
    const targetId = String(id);
    if (!Array.isArray(this.data.dersler)) this.data.dersler = [];
    const beforeLen = this.data.dersler.length;
    this.data.dersler = this.data.dersler.filter(d => String(d.id) !== targetId);
    if (this.data.dersler.length === beforeLen) return false;

    // cascade topics
    const silinecekKonular = (this.data.konular || []).filter(k => String(k.dersId) === targetId);
    const silinecekKonuIds = new Set(silinecekKonular.map(k => String(k.id)));
    this.data.konular = (this.data.konular || []).filter(k => String(k.dersId) !== targetId);

    // cascade tasks
    if (Array.isArray(this.data.gorevler)) {
      this.data.gorevler = this.data.gorevler.filter(g => String(g.dersId) !== targetId);
    }
    // cascade topic progress
    if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = this.data.ogrenciKonuDurumlari.filter(kd => !silinecekKonuIds.has(String(kd.konuId)));
    }
    // cascade grades
    if (Array.isArray(this.data.sinifNotlari)) {
      this.data.sinifNotlari = this.data.sinifNotlari.filter(n => String(n.dersId) !== targetId);
    }
    // cascade resources
    if (Array.isArray(this.data.kaynaklar)) {
      this.data.kaynaklar = this.data.kaynaklar.filter(k => String(k.dersId) !== targetId);
    }
    // deneme kayıtlarındaki ders bağını kopart (deneme silinmez, yalnızca dersId temizlenir)
    if (Array.isArray(this.data.denemeSinavlari)) {
      this.data.denemeSinavlari.forEach(exam => {
        (Array.isArray(exam.dersler) ? exam.dersler : []).forEach(d => {
          if (String(d.dersId) === targetId) d.dersId = '';
        });
      });
    }
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 14. MÜFREDAT KONU YÖNETİMİ (ADD / UPDATE / DELETE)
  // ─────────────────────────────────────────────────────────────
  addTopic(topicData) {
    const id = topicData.id || `knu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const topic = {
      id,
      dersId: topicData.dersId || '',
      modulId: topicData.modulId || 'yks',
      sinif: String(topicData.sinif || 'ortak'),
      uniteNo: Number(topicData.uniteNo) || 1,
      uniteAdi: topicData.uniteAdi || 'Ünite 1',
      siraNo: Number(topicData.siraNo) || ((this.data.konular || []).filter(k => k.dersId === topicData.dersId).length + 1),
      konuAdi: (topicData.konuAdi || 'Yeni Konu').trim(),
      aciklama: topicData.aciklama || ''
    };
    if (!Array.isArray(this.data.konular)) this.data.konular = [];
    this.data.konular.push(topic);
    this.save();
    return topic;
  }

  updateTopic(id, updates) {
    if (!Array.isArray(this.data.konular)) this.data.konular = [];
    const idx = this.data.konular.findIndex(k => String(k.id) === String(id));
    if (idx === -1) return null;
    const merged = { ...this.data.konular[idx], ...updates, id };
    this.data.konular[idx] = merged;
    this.save();
    return merged;
  }

  deleteTopic(id) {
    const targetId = String(id);
    if (!Array.isArray(this.data.konular)) this.data.konular = [];
    const beforeLen = this.data.konular.length;
    this.data.konular = this.data.konular.filter(k => String(k.id) !== targetId);
    if (this.data.konular.length === beforeLen) return false;

    if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = this.data.ogrenciKonuDurumlari.filter(kd => String(kd.konuId) !== targetId);
    }
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 15. OKUL SINIF / YAZILI NOTLARI (GRADES)
  // ─────────────────────────────────────────────────────────────
  getSchoolGrades({ ogrenciId, dersId } = {}) {
    let list = Array.isArray(this.data.sinifNotlari) ? this.data.sinifNotlari : [];
    if (ogrenciId) list = list.filter(n => String(n.ogrenciId) === String(ogrenciId));
    if (dersId && dersId !== 'tum') list = list.filter(n => String(n.dersId) === String(dersId));

    const derslerMap = new Map((this.data.dersler || []).map(d => [d.id, d.ad]));
    const ogrencilerMap = new Map((this.data.ogrenciler || []).map(o => [o.id, o.adSoyad]));

    const notlar = list.map(n => ({
      ...n,
      dersAdi: derslerMap.get(n.dersId) || n.dersId,
      ogrenciAdi: ogrencilerMap.get(n.ogrenciId) || n.ogrenciId
    }));

    const ortalama = notlar.length > 0
      ? Math.round((notlar.reduce((acc, curr) => acc + Number(curr.not || 0), 0) / notlar.length) * 10) / 10
      : null;

    return {
      toplamKayit: notlar.length,
      ortalama,
      notlar
    };
  }

  addSchoolGrade(gradeData) {
    const id = gradeData.id || `not-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const grade = {
      id,
      ogrenciId: gradeData.ogrenciId || this.data.aktifOgrenciId || '',
      dersId: gradeData.dersId || '',
      sinavAdi: gradeData.sinavAdi || '1. Yazılı',
      not: Number(gradeData.not) || 0,
      tur: gradeData.tur || 'yazili',
      tarih: gradeData.tarih || new Date().toISOString().split('T')[0]
    };
    if (!Array.isArray(this.data.sinifNotlari)) this.data.sinifNotlari = [];
    this.data.sinifNotlari.push(grade);
    this.save();
    return grade;
  }

  updateSchoolGrade(id, updates) {
    if (!Array.isArray(this.data.sinifNotlari)) this.data.sinifNotlari = [];
    const idx = this.data.sinifNotlari.findIndex(n => String(n.id) === String(id));
    if (idx === -1) return null;
    const merged = { ...this.data.sinifNotlari[idx], ...updates, id };
    if (updates.not !== undefined) merged.not = Number(updates.not);
    this.data.sinifNotlari[idx] = merged;
    this.save();
    return merged;
  }

  deleteSchoolGrade(id) {
    if (!Array.isArray(this.data.sinifNotlari)) this.data.sinifNotlari = [];
    const idx = this.data.sinifNotlari.findIndex(n => String(n.id) === String(id));
    if (idx === -1) return false;
    this.data.sinifNotlari.splice(idx, 1);
    this.save();
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 16. MERKEZİ SINAV ŞABLONLARI (EXAMS)
  // ─────────────────────────────────────────────────────────────
  getExams(modulId) {
    let exams = this.data.sinavlar || [
      { id: 'lgs', ad: 'LGS (Liselere Geçiş Sistemi)', modulId: 'lgs', toplamSoru: 90, dersler: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'İnkılap Tarihi', 'Din Kültürü', 'İngilizce'] },
      { id: 'tyt', ad: 'TYT (Temel Yeterlilik Testi)', modulId: 'yks', toplamSoru: 120, dersler: ['Türkçe', 'Matematik', 'Sosyal Bilimler', 'Fen Bilimleri'] },
      { id: 'ayt-say', ad: 'AYT Sayısal', modulId: 'yks', toplamSoru: 80, dersler: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'] },
      { id: 'ayt-ea', ad: 'AYT Eşit Ağırlık', modulId: 'yks', toplamSoru: 80, dersler: ['Matematik', 'Edebiyat', 'Tarih-1', 'Coğrafya-1'] },
      { id: 'ayt-soz', ad: 'AYT Sözel', modulId: 'yks', toplamSoru: 80, dersler: ['Edebiyat', 'Tarih-1', 'Coğrafya-1', 'Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din'] },
      { id: 'ydt', ad: 'YDT (Yabancı Dil Testi)', modulId: 'yks', toplamSoru: 80, dersler: ['Yabancı Dil'] }
    ];
    if (modulId) exams = exams.filter(e => e.modulId === modulId);
    return exams;
  }

  // ─────────────────────────────────────────────────────────────
  // 17. ALIŞKANLIK ÖZELLEŞTİRME VE AY SONU
  // ─────────────────────────────────────────────────────────────
  updateStudentHabits({ ogrenciId, zincirler, sifirla }) {
    if (!ogrenciId) return null;
    if (!this.data.aliskanlikZincirleri) this.data.aliskanlikZincirleri = {};
    if (sifirla) {
      const student = this.getStudent(ogrenciId);
      const isLgs = student && student.modulId === 'lgs';
      this.data.aliskanlikZincirleri[ogrenciId] = isLgs ? [
        { id: 'h1', baslik: 'Günde 30 Paragraf', renk: 'rose', aktif: true },
        { id: 'h2', baslik: 'Günde 20 Yeni Nesil Mat', renk: 'blue', aktif: true },
        { id: 'h3', baslik: 'Kitap Okuma (30 dk)', renk: 'emerald', aktif: true },
        { id: 'h4', baslik: 'Hata Defteri Tekrarı', renk: 'amber', aktif: true },
        { id: 'h5', baslik: 'Erken Uyanma (07:00)', renk: 'purple', aktif: true },
        { id: 'h6', baslik: 'Dijital Detoks', renk: 'indigo', aktif: true }
      ] : [
        { id: 'h1', baslik: 'Günde 30 Paragraf', renk: 'rose', aktif: true },
        { id: 'h2', baslik: 'Günde 30 Problem / Geometri', renk: 'blue', aktif: true },
        { id: 'h3', baslik: 'MEB Kitabı Okuma / Tekrar', renk: 'emerald', aktif: true },
        { id: 'h4', baslik: 'Hata Defteri / 1-3-7 Tekrar', renk: 'amber', aktif: true },
        { id: 'h5', baslik: 'Erken Uyanma & Rutin', renk: 'purple', aktif: true },
        { id: 'h6', baslik: 'Masa Düzeni & Telefon Ayrımı', renk: 'indigo', aktif: true }
      ];
    } else if (Array.isArray(zincirler)) {
      this.data.aliskanlikZincirleri[ogrenciId] = zincirler.map((z, i) => ({
        id: z.id || `h${i + 1}`,
        baslik: z.baslik || `Alışkanlık ${i + 1}`,
        renk: z.renk || 'blue',
        aktif: z.aktif !== false
      }));
    }
    this.save();
    return { ogrenciId, zincirler: this.data.aliskanlikZincirleri[ogrenciId] };
  }

  updateHabitMonthEnd({ ogrenciId, yilAy, aliskanlikId, aliskanlikNo, gunSayisi, not, genelAyNotu }) {
    if (!ogrenciId || !yilAy) return null;
    if (!this.data.aliskanlikAySonu) this.data.aliskanlikAySonu = {};
    if (!this.data.aliskanlikNotlari) this.data.aliskanlikNotlari = {};

    let habitId = aliskanlikId;
    if (!habitId && aliskanlikNo !== undefined && aliskanlikNo !== null && aliskanlikNo !== '') {
      const chains = (this.data.aliskanlikZincirleri && this.data.aliskanlikZincirleri[ogrenciId]) || [];
      const idx = Number(aliskanlikNo) - 1;
      habitId = (chains[idx] && chains[idx].id) || `al-${aliskanlikNo}`;
    }

    let aySonu = null;
    if (habitId) {
      // Uygulama anahtarı: ogrenciId_aliskanlikId_yilAy  (js/store.js:1863)
      const key = V.keyAliskanlikAySonu(ogrenciId, habitId, yilAy);
      const prev = this.data.aliskanlikAySonu[key] || {};
      if (gunSayisi !== undefined) prev.gun = Math.max(0, Math.min(31, Number(gunSayisi) || 0));
      if (not !== undefined) prev.not = String(not);
      prev.updatedAt = new Date().toISOString();
      this.data.aliskanlikAySonu[key] = prev;
      aySonu = prev;
    }

    if (genelAyNotu !== undefined) {
      // Uygulama anahtarı: ogrenciId_yilAy  (js/store.js:1926)
      this.data.aliskanlikNotlari[V.keyAliskanlikNot(ogrenciId, yilAy)] = String(genelAyNotu);
    }

    this.save();
    return {
      ogrenciId,
      yilAy,
      aliskanlikId: habitId || '',
      aySonu: aySonu || {},
      genelAyNotu: this.data.aliskanlikNotlari[V.keyAliskanlikNot(ogrenciId, yilAy)] || ''
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 18. ÇİZELGE ROBOTU & DEĞERLENDİRME NOTLARI
  // ─────────────────────────────────────────────────────────────
  updateChartNote({ ogrenciId, dersId, not }) {
    if (!ogrenciId || !dersId) return null;
    if (!this.data.cizelgeNotlari) this.data.cizelgeNotlari = {};
    const key = `${ogrenciId}_${dersId}`;
    this.data.cizelgeNotlari[key] = String(not || '');
    this.save();
    return { key, ogrenciId, dersId, not: this.data.cizelgeNotlari[key] };
  }

  getChartSummary({ ogrenciId, sablon, dersId, yilAy }) {
    if (!ogrenciId) return null;
    const student = this.getStudent(ogrenciId);
    if (!student) return null;

    switch (sablon) {
      case 'zaman-blok':
        return this.getStudentSchedule(ogrenciId);
      case 'odev-takip':
        return {
          ogrenciId,
          gorevler: this.getTasks({ ogrenciId, dersId: dersId !== 'tum' ? dersId : undefined })
        };
      case 'konu-takip':
        return this.getStudentTopicProgress({ ogrenciId, dersId });
      case 'konu-soru':
        return {
          ogrenciId,
          soruTakibi: this.getQuestionTracking({ ogrenciId, dersId }),
          cizelgeNotu: this.data.cizelgeNotlari && dersId ? this.data.cizelgeNotlari[`${ogrenciId}_${dersId}`] : ''
        };
      case 'aliskanlik': {
        const ay = yilAy || new Date().toISOString().slice(0, 7);
        const prefix = `${ogrenciId}_`;
        const suffix = `_${ay}`;
        const aySonu = {};
        Object.keys(this.data.aliskanlikAySonu || {}).forEach(key => {
          if (key.startsWith(prefix) && key.endsWith(suffix)) {
            const habitId = key.slice(prefix.length, key.length - suffix.length);
            const value = this.data.aliskanlikAySonu[key];
            if (value && typeof value === 'object') {
              aySonu[habitId] = Object.assign({}, value, {
                gunSayisi: value.gun !== undefined ? value.gun : (value.gunSayisi !== undefined ? value.gunSayisi : 0)
              });
            }
          }
        });
        return {
          ogrenciId,
          yilAy: ay,
          aliskanliklar: this.getStudentHabits(ogrenciId),
          aySonu,
          genelNot: this.data.aliskanlikNotlari ? (this.data.aliskanlikNotlari[V.keyAliskanlikNot(ogrenciId, ay)] || '') : ''
        };
      }
      default:
        throw new Error(`Bilinmeyen şablon türü: ${sablon}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 19. TOPLU ZAMAN BLOKLAMA
  // ─────────────────────────────────────────────────────────────
  batchUpdateSchedule({ ogrenciId, gunler, baslangicSaat, bitisSaat, data, ornekRutin, temizle, zamanPenceresi }) {
    if (!ogrenciId) return null;
    if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
    if (!this.data.zamanAyarlari) this.data.zamanAyarlari = {};

    if (temizle) {
      this.data.zamanPlanlari[ogrenciId] = {};
      this.save();
      return { ogrenciId, mesaj: 'Tüm zaman blokları sıfırlandı.', plan: {} };
    }

    if (zamanPenceresi) {
      this.data.zamanAyarlari[ogrenciId] = {
        baslangicSaat: zamanPenceresi.baslangicSaat || '07:00',
        bitisSaat: zamanPenceresi.bitisSaat || '23:30'
      };
    }

    if (!this.data.zamanPlanlari[ogrenciId]) this.data.zamanPlanlari[ogrenciId] = {};

    if (ornekRutin) {
      const defaultRutins = {
        lgs: {
          'Pzt_08:30': { kategori: 'okul', baslik: 'Okul / Ders' },
          'Pzt_16:00': { kategori: 'mola', baslik: 'Dinlenme & Atıştırma' },
          'Pzt_17:00': { kategori: 'etut', baslik: 'LGS Matematik Etüdü' },
          'Pzt_18:30': { kategori: 'etut', baslik: 'LGS Fen Bilimleri' },
          'Pzt_20:00': { kategori: 'rutin', baslik: 'Paragraf & Kitap Okuma' }
        },
        yks: {
          'Pzt_08:00': { kategori: 'okul', baslik: 'Okul / Dershane' },
          'Pzt_16:30': { kategori: 'mola', baslik: 'Yemek & Dinlenme' },
          'Pzt_17:30': { kategori: 'etut', baslik: 'TYT Matematik Problem' },
          'Pzt_19:30': { kategori: 'etut', baslik: 'AYT Fizik / Edebiyat' },
          'Pzt_21:30': { kategori: 'rutin', baslik: 'Paragraf & Hata Defteri' }
        },
        'ara-sinif': {
          'Pzt_09:00': { kategori: 'okul', baslik: 'Okul Dersleri' },
          'Pzt_16:30': { kategori: 'mola', baslik: 'Dinlenme & Oyun' },
          'Pzt_17:30': { kategori: 'etut', baslik: 'Günlük Ödev & Tekrar' },
          'Pzt_19:00': { kategori: 'rutin', baslik: 'Kitap Okuma' }
        }
      };
      const rutin = defaultRutins[ornekRutin] || defaultRutins.lgs;
      Object.assign(this.data.zamanPlanlari[ogrenciId], rutin);
    }

    if (Array.isArray(gunler) && baslangicSaat && bitisSaat) {
      const [bSaat, bDk] = baslangicSaat.split(':').map(Number);
      const [bitSaat, bitDk] = bitisSaat.split(':').map(Number);
      const bTotal = bSaat * 60 + bDk;
      const bitTotal = bitSaat * 60 + bitDk;

      for (let t = bTotal; t < bitTotal; t += 30) {
        const hh = String(Math.floor(t / 60)).padStart(2, '0');
        const mm = String(t % 60).padStart(2, '0');
        const timeKey = `${hh}:${mm}`;

        for (const gun of gunler) {
          const slotKey = `${gun}_${timeKey}`;
          if (data === null) {
            delete this.data.zamanPlanlari[ogrenciId][slotKey];
          } else {
            this.data.zamanPlanlari[ogrenciId][slotKey] = data;
          }
        }
      }
    }

    this.save();
    return {
      ogrenciId,
      ayarlar: this.data.zamanAyarlari[ogrenciId] || {},
      plan: this.data.zamanPlanlari[ogrenciId]
    };
  }

}

module.exports = PlantrackDB;
