/**
 * Plantrack — js/store.js
 * Veri Yönetimi, Durum Saklama, Excel ve Yazdırma Motorları
 */

const STORAGE_KEY = 'plantrack_db_v1';

const Store = {
  data: {
    version: '1.0.0',
    aktifModulId: 'ara-sinif',
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
    calismaKayitlari: []
  },

  // ─────────────────────────────────────────────────────────────
  // TEMEL METODLAR
  // ─────────────────────────────────────────────────────────────
  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = Object.assign(this.getSeedData(), parsed);
      } else {
        this.data = this.getSeedData();
        this.save();
      }
    } catch (err) {
      console.error('Store verisi yüklenirken hata oluştu:', err);
      this.data = this.getSeedData();
      this.save();
    }

    this.refreshDeadlines();
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Store kaydedilirken hata oluştu:', err);
    }
  },

  getSeedData() {
    return {
      version: '1.0.0',
      aktifModulId: 'ara-sinif',
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
      calismaKayitlari: []
    };
  },

  resetToFactory() {
    this.data = this.getSeedData();
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // MODÜL METODLARI
  // ─────────────────────────────────────────────────────────────
  getAktifModul() {
    if (typeof MODULLER === 'undefined' || !Array.isArray(MODULLER)) return null;
    return MODULLER.find(m => m.id === this.data.aktifModulId) || null;
  },

  setAktifModul(modulId) {
    this.data.aktifModulId = modulId;
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // KOÇ PROFİLİ METODLARI
  // ─────────────────────────────────────────────────────────────
  getKocProfili() {
    return this.data.kocProfili || {};
  },

  saveKocProfili(profil) {
    const ad = (profil.ad || '').trim();
    const soyad = (profil.soyad || '').trim();
    const avatarKisa = ((ad[0] || '') + (soyad[0] || '')).toUpperCase() || 'KD';

    this.data.kocProfili = {
      ad,
      soyad,
      unvan: profil.unvan || 'Eğitim Koçu',
      kurum: profil.kurum || '',
      telefon: profil.telefon || '',
      avatarKisa
    };

    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // ÖĞRENCİ METODLARI
  // ─────────────────────────────────────────────────────────────
  getOgrenciler() {
    return Array.isArray(this.data.ogrenciler) ? this.data.ogrenciler : [];
  },

  getOgrenci(id) {
    if (!id) return null;
    return this.getOgrenciler().find(o => String(o.id) === String(id)) || null;
  },

  getAktifOgrenci() {
    return this.getOgrenci(this.data.aktifOgrenciId);
  },

  setAktifOgrenci(id) {
    this.data.aktifOgrenciId = id ? String(id) : '';
    const ogr = this.getAktifOgrenci();
    if (ogr && ogr.modulId) {
      this.data.aktifModulId = ogr.modulId;
    }
    this.save();
  },

  addOgrenci(veri) {
    const timestamp = Date.now();
    const id = 'ogr-' + timestamp;
    const ad = (veri.ad || '').trim();
    const soyad = (veri.soyad || '').trim();
    const adSoyad = `${ad} ${soyad}`.trim();
    const sinif = String(veri.sinif || '5');

    // Sınıftan modulId tespiti
    let modulId = 'ara-sinif';
    if (typeof SINIFLAR !== 'undefined') {
      const sinifObj = SINIFLAR.find(s => String(s.deger) === sinif);
      if (sinifObj && sinifObj.modulId) {
        modulId = sinifObj.modulId;
      }
    }

    const yeniOgrenci = {
      id,
      ad,
      soyad,
      adSoyad,
      sinif,
      modulId,
      okul: (veri.okul || '').trim(),
      ogrenciTel: (veri.ogrenciTel || '').trim(),
      veliAd: (veri.veliAd || '').trim(),
      veliTel: (veri.veliTel || '').trim(),
      hedef: (veri.hedef || '').trim(),
      kayitTarihi: new Date().toISOString(),
      renk: veri.renk || 'teal',
      seciliKaynaklar: Array.isArray(veri.seciliKaynaklar) ? veri.seciliKaynaklar : []
    };

    if (!Array.isArray(this.data.ogrenciler)) {
      this.data.ogrenciler = [];
    }
    this.data.ogrenciler.push(yeniOgrenci);

    // İlk öğrenci eklendiğinde aktif öğrenci yap
    if (!this.data.aktifOgrenciId) {
      this.data.aktifOgrenciId = id;
      this.data.aktifModulId = modulId;
    }

    this.save();
    return yeniOgrenci;
  },

  updateOgrenci(id, updates) {
    const ogrenciler = this.getOgrenciler();
    const idx = ogrenciler.findIndex(o => String(o.id) === String(id));
    if (idx === -1) return null;

    const mevcut = ogrenciler[idx];
    const ad = updates.ad !== undefined ? updates.ad.trim() : mevcut.ad;
    const soyad = updates.soyad !== undefined ? updates.soyad.trim() : mevcut.soyad;
    const sinif = updates.sinif !== undefined ? String(updates.sinif) : mevcut.sinif;

    let modulId = mevcut.modulId;
    if (updates.sinif !== undefined && typeof SINIFLAR !== 'undefined') {
      const sinifObj = SINIFLAR.find(s => String(s.deger) === sinif);
      if (sinifObj && sinifObj.modulId) {
        modulId = sinifObj.modulId;
      }
    }

    const guncel = Object.assign({}, mevcut, updates, {
      ad,
      soyad,
      adSoyad: `${ad} ${soyad}`.trim(),
      sinif,
      modulId
    });

    this.data.ogrenciler[idx] = guncel;

    if (String(this.data.aktifOgrenciId) === String(id)) {
      this.data.aktifModulId = modulId;
    }

    this.save();
    return guncel;
  },

  deleteOgrenci(id) {
    const targetId = String(id);
    this.data.ogrenciler = this.getOgrenciler().filter(o => String(o.id) !== targetId);

    // Kademeli (Cascade) Temizlik
    this.data.gorevler = (this.data.gorevler || []).filter(g => String(g.ogrenciId) !== targetId);
    this.data.ogrenciKonuDurumlari = (this.data.ogrenciKonuDurumlari || []).filter(k => String(k.ogrenciId) !== targetId);
    this.data.hataKayitlari = (this.data.hataKayitlari || []).filter(h => String(h.ogrenciId) !== targetId);
    this.data.sinifNotlari = (this.data.sinifNotlari || []).filter(n => String(n.ogrenciId) !== targetId);
    this.data.calismaKayitlari = (this.data.calismaKayitlari || []).filter(c => String(c.ogrenciId) !== targetId);

    if (String(this.data.aktifOgrenciId) === targetId) {
      this.data.aktifOgrenciId = this.data.ogrenciler.length > 0 ? this.data.ogrenciler[0].id : '';
      if (this.data.aktifOgrenciId) {
        const yeniAktif = this.getAktifOgrenci();
        if (yeniAktif) this.data.aktifModulId = yeniAktif.modulId;
      }
    }

    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // GÖREV METODLARI
  // ─────────────────────────────────────────────────────────────
  getGorevler(ogrenciId) {
    const gorevler = Array.isArray(this.data.gorevler) ? this.data.gorevler : [];
    if (!ogrenciId) return gorevler;
    return gorevler.filter(g => String(g.ogrenciId) === String(ogrenciId));
  },

  getAktifGorevler(ogrenciId) {
    return this.getGorevler(ogrenciId).filter(g => g.durum !== 'tamamlandi');
  },

  getGecikmisGorevler(ogrenciId) {
    return this.getGorevler(ogrenciId).filter(g => g.durum === 'gecikti');
  },

  addGorev(veri) {
    const id = 'grv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const yeniGorev = {
      id,
      ogrenciId: veri.ogrenciId || this.data.aktifOgrenciId,
      dersId: veri.dersId || '',
      konuId: veri.konuId || '',
      kaynakId: veri.kaynakId || '',
      baslik: (veri.baslik || '').trim(),
      aciklama: (veri.aciklama || '').trim(),
      hedefSoru: Number(veri.hedefSoru) || 0,
      cozulenSoru: Number(veri.cozulenSoru) || 0,
      dogruSoru: Number(veri.dogruSoru) || 0,
      yanlisSoru: Number(veri.yanlisSoru) || 0,
      sureDk: Number(veri.sureDk) || 0,
      durum: veri.durum || 'bekliyor',
      deadline: veri.deadline || '',
      olusturmaTarihi: new Date().toISOString(),
      tamamlanmaTarihi: veri.durum === 'tamamlandi' ? new Date().toISOString() : '',
      not: (veri.not || '').trim()
    };

    if (!Array.isArray(this.data.gorevler)) {
      this.data.gorevler = [];
    }
    this.data.gorevler.push(yeniGorev);
    this.save();
    return yeniGorev;
  },

  updateGorev(id, updates) {
    const gorevler = this.data.gorevler || [];
    const idx = gorevler.findIndex(g => String(g.id) === String(id));
    if (idx === -1) return null;

    const guncel = Object.assign({}, gorevler[idx], updates);
    if (updates.durum === 'tamamlandi' && !guncel.tamamlanmaTarihi) {
      guncel.tamamlanmaTarihi = new Date().toISOString();
    }

    this.data.gorevler[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteGorev(id) {
    this.data.gorevler = (this.data.gorevler || []).filter(g => String(g.id) !== String(id));
    this.save();
  },

  gorevTamamla(id) {
    return this.updateGorev(id, {
      durum: 'tamamlandi',
      tamamlanmaTarihi: new Date().toISOString()
    });
  },

  refreshDeadlines() {
    if (!Array.isArray(this.data.gorevler)) {
      this.data.gorevler = [];
      return;
    }

    const bugunStr = new Date().toISOString().split('T')[0];
    let degisiklikVar = false;

    this.data.gorevler.forEach(gorev => {
      if (gorev.durum !== 'tamamlandi' && gorev.deadline && gorev.deadline < bugunStr) {
        if (gorev.durum !== 'gecikti') {
          gorev.durum = 'gecikti';
          degisiklikVar = true;
        }
      }
    });

    if (degisiklikVar) {
      this.save();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // KONU DURUMU METODLARI
  // ─────────────────────────────────────────────────────────────
  getKonuDurumu(ogrenciId, konuId) {
    if (!ogrenciId || !konuId) return { durum: 'islenmedi', not: '' };
    const list = Array.isArray(this.data.ogrenciKonuDurumlari) ? this.data.ogrenciKonuDurumlari : [];
    const found = list.find(k => String(k.ogrenciId) === String(ogrenciId) && String(k.konuId) === String(konuId));
    return found ? found : { durum: 'islenmedi', not: '' };
  },

  setKonuDurumu(ogrenciId, konuId, durum, not = '') {
    if (!ogrenciId || !konuId) return null;
    if (!Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = [];
    }

    const idx = this.data.ogrenciKonuDurumlari.findIndex(
      k => String(k.ogrenciId) === String(ogrenciId) && String(k.konuId) === String(konuId)
    );

    const now = new Date().toISOString();
    if (idx !== -1) {
      this.data.ogrenciKonuDurumlari[idx].durum = durum;
      if (not !== undefined) this.data.ogrenciKonuDurumlari[idx].not = not;
      this.data.ogrenciKonuDurumlari[idx].guncellenmeTarihi = now;
      this.save();
      return this.data.ogrenciKonuDurumlari[idx];
    } else {
      const yeni = {
        id: 'okd-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        ogrenciId: String(ogrenciId),
        konuId: String(konuId),
        durum: durum || 'islenmedi',
        not: not || '',
        guncellenmeTarihi: now
      };
      this.data.ogrenciKonuDurumlari.push(yeni);
      this.save();
      return yeni;
    }
  },

  getKonuIstatistik(ogrenciId, dersId) {
    const konular = typeof KONULAR !== 'undefined' ? KONULAR.filter(k => k.dersId === dersId) : [];
    const toplam = konular.length;
    if (toplam === 0) {
      return { toplam: 0, islenmedi: 0, calisiliyor: 0, tamam: 0, tekrar_lazim: 0, yuzde: 0 };
    }

    let islenmedi = 0;
    let calisiliyor = 0;
    let tamam = 0;
    let tekrar_lazim = 0;

    konular.forEach(konu => {
      const kd = this.getKonuDurumu(ogrenciId, konu.id);
      if (kd.durum === 'tamam') tamam++;
      else if (kd.durum === 'calisiliyor') calisiliyor++;
      else if (kd.durum === 'tekrar_lazim') tekrar_lazim++;
      else islenmedi++;
    });

    const yuzde = Math.round((tamam / toplam) * 100);
    return { toplam, islenmedi, calisiliyor, tamam, tekrar_lazim, yuzde };
  },

  // ─────────────────────────────────────────────────────────────
  // HATA DEFTERİ METODLARI
  // ─────────────────────────────────────────────────────────────
  getHatalar(ogrenciId) {
    const list = Array.isArray(this.data.hataKayitlari) ? this.data.hataKayitlari : [];
    if (!ogrenciId) return list;
    return list.filter(h => String(h.ogrenciId) === String(ogrenciId));
  },

  addHata(veri) {
    const id = 'hta-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const yeniHata = {
      id,
      ogrenciId: veri.ogrenciId || this.data.aktifOgrenciId,
      dersId: veri.dersId || '',
      konuId: veri.konuId || '',
      hataTuru: veri.hataTuru || 'Bilgi Eksikliği',
      aciklama: (veri.aciklama || '').trim(),
      telafiDurumu: Boolean(veri.telafiDurumu),
      olusturmaTarihi: new Date().toISOString(),
      tekrarTarihi: veri.tekrarTarihi || ''
    };

    if (!Array.isArray(this.data.hataKayitlari)) {
      this.data.hataKayitlari = [];
    }
    this.data.hataKayitlari.push(yeniHata);
    this.save();
    return yeniHata;
  },

  updateHata(id, updates) {
    const list = this.data.hataKayitlari || [];
    const idx = list.findIndex(h => String(h.id) === String(id));
    if (idx === -1) return null;

    const guncel = Object.assign({}, list[idx], updates);
    this.data.hataKayitlari[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteHata(id) {
    this.data.hataKayitlari = (this.data.hataKayitlari || []).filter(h => String(h.id) !== String(id));
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // SINIF NOTLARI METODLARI
  // ─────────────────────────────────────────────────────────────
  getSinifNotlari(ogrenciId, dersId = null) {
    const list = Array.isArray(this.data.sinifNotlari) ? this.data.sinifNotlari : [];
    let filtered = list;
    if (ogrenciId) {
      filtered = filtered.filter(n => String(n.ogrenciId) === String(ogrenciId));
    }
    if (dersId) {
      filtered = filtered.filter(n => String(n.dersId) === String(dersId));
    }
    return filtered;
  },

  addSinifNotu(veri) {
    const id = 'not-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const yeniNot = {
      id,
      ogrenciId: veri.ogrenciId || this.data.aktifOgrenciId,
      dersId: veri.dersId || '',
      sinavAdi: veri.sinavAdi || '1. Yazılı',
      not: Number(veri.not) || 0,
      tur: veri.tur || 'yazili',
      tarih: veri.tarih || new Date().toISOString().split('T')[0]
    };

    if (!Array.isArray(this.data.sinifNotlari)) {
      this.data.sinifNotlari = [];
    }
    this.data.sinifNotlari.push(yeniNot);
    this.save();
    return yeniNot;
  },

  updateSinifNotu(id, updates) {
    const list = this.data.sinifNotlari || [];
    const idx = list.findIndex(n => String(n.id) === String(id));
    if (idx === -1) return null;

    const guncel = Object.assign({}, list[idx], updates);
    this.data.sinifNotlari[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteSinifNotu(id) {
    this.data.sinifNotlari = (this.data.sinifNotlari || []).filter(n => String(n.id) !== String(id));
    this.save();
  },

  getNotOrtalamasi(ogrenciId, dersId) {
    const notlar = this.getSinifNotlari(ogrenciId, dersId);
    if (!notlar || notlar.length === 0) return null;

    const toplam = notlar.reduce((acc, curr) => acc + Number(curr.not || 0), 0);
    return Math.round((toplam / notlar.length) * 10) / 10;
  },

  // ─────────────────────────────────────────────────────────────
  // MÜFREDAT VE MODEL YARDIMCILARI
  // ─────────────────────────────────────────────────────────────
  getDerslerForOgrenci(ogrenci) {
    if (!ogrenci) return [];
    if (typeof DERSLER === 'undefined') return [];

    return DERSLER.filter(ders => {
      if (ders.modulId !== ogrenci.modulId) return false;
      return ders.sinif === String(ogrenci.sinif) || ders.sinif === 'ortak';
    });
  },

  getKonularForDers(dersId) {
    if (!dersId || typeof KONULAR === 'undefined') return [];
    return KONULAR.filter(k => k.dersId === dersId);
  },

  getModulForOgrenci(ogrenci) {
    if (!ogrenci || typeof MODULLER === 'undefined') return null;
    return MODULLER.find(m => m.id === ogrenci.modulId) || null;
  }
};

// ─────────────────────────────────────────────────────────────
// EXCEL İÇE / DIŞA AKTARIM MOTORU
// ─────────────────────────────────────────────────────────────
const ExcelEngine = {
  sablonIndir() {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS (XLSX) kütüphanesi yüklenemedi.');
      return;
    }

    const sutunlar = EXCEL_OGRENCI_SABLONU.sutunlar;
    const baslikSatiri = sutunlar.map(s => s.label);
    const aciklamaSatiri = sutunlar.map(s => `(${s.aciklama})`);
    const ornekSatir = sutunlar.map(s => EXCEL_OGRENCI_SABLONU.ornekSatir[s.key] || '');

    const wsData = [
      baslikSatiri,
      aciklamaSatiri,
      ornekSatir
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Sütun genişlikleri ayarla
    ws['!cols'] = sutunlar.map(s => ({ wch: Math.max(s.label.length, s.aciklama.length, 16) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenci Şablonu');
    XLSX.writeFile(wb, 'plantrack_ogrenci_sablonu.xlsx');
  },

  ogrenciIceAktar(file, onSonuc) {
    if (typeof XLSX === 'undefined') {
      if (onSonuc) onSonuc({ basarili: [], hatali: [{ satir: 0, sebep: 'SheetJS kütüphanesi bulunamadı' }] });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const basarili = [];
        const hatali = [];

        // Satır 1: Başlık, Satır 2: Açıklama -> İndeks 2'den itibaren veri
        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          const satirNo = i + 1;
          if (!row || row.length === 0) continue;

          const ad = row[0] ? String(row[0]).trim() : '';
          const soyad = row[1] ? String(row[1]).trim() : '';
          const sinifHam = row[2] ? String(row[2]).trim().toLowerCase().replace('.sınıf', '').replace('.', '').trim() : '';

          if (!ad) {
            hatali.push({ satir: satirNo, sebep: 'Öğrenci adı boş bırakılamaz.' });
            continue;
          }
          if (!soyad) {
            hatali.push({ satir: satirNo, sebep: 'Öğrenci soyadı boş bırakılamaz.' });
            continue;
          }

          // Sınıf doğrulama
          let gecerliSinif = null;
          if (typeof SINIFLAR !== 'undefined') {
            const eslesme = SINIFLAR.find(s => s.deger === sinifHam || s.label.toLowerCase() === sinifHam);
            if (eslesme) {
              gecerliSinif = eslesme.deger;
            }
          }

          if (!gecerliSinif) {
            hatali.push({ satir: satirNo, sebep: `Geçersiz sınıf değeri: "${row[2]}". (5, 6, 7, 8, 9, 10, 11, 12 veya mezun olmalıdır)` });
            continue;
          }

          basarili.push({
            satir: satirNo,
            veri: {
              ad,
              soyad,
              sinif: gecerliSinif,
              okul: row[3] ? String(row[3]).trim() : '',
              ogrenciTel: row[4] ? String(row[4]).trim() : '',
              veliAd: row[5] ? String(row[5]).trim() : '',
              veliTel: row[6] ? String(row[6]).trim() : '',
              hedef: row[7] ? String(row[7]).trim() : ''
            }
          });
        }

        if (onSonuc) onSonuc({ basarili, hatali });
      } catch (err) {
        console.error('Excel okuma hatası:', err);
        if (onSonuc) onSonuc({ basarili: [], hatali: [{ satir: 0, sebep: 'Dosya okunurken bir hata meydana geldi: ' + err.message }] });
      }
    };

    reader.readAsArrayBuffer(file);
  },

  ogrenciDisaAktar() {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS kütüphanesi bulunamadı');
      return;
    }

    const ogrenciler = Store.getOgrenciler();
    const sutunlar = EXCEL_OGRENCI_SABLONU.sutunlar;
    const baslikSatiri = sutunlar.map(s => s.label);

    const rows = [baslikSatiri];
    ogrenciler.forEach(ogr => {
      rows.push([
        ogr.ad,
        ogr.soyad,
        ogr.sinif,
        ogr.okul || '',
        ogr.ogrenciTel || '',
        ogr.veliAd || '',
        ogr.veliTel || '',
        ogr.hedef || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = sutunlar.map(s => ({ wch: 18 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Öğrenciler');

    const bugunStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `plantrack_ogrenciler_${bugunStr}.xlsx`);
  }
};

// ─────────────────────────────────────────────────────────────
// YAZDIRMA MOTORU (PRINT ENGINE)
// ─────────────────────────────────────────────────────────────
const PrintEngine = {
  yazdir(icerik, ayarlar = {}) {
    let printArea = document.getElementById('print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'print-area';
      printArea.className = 'hidden';
      document.body.appendChild(printArea);
    }

    let printStyle = document.getElementById('print-page-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'print-page-style';
      document.head.appendChild(printStyle);
    }

    const isLandscape = ayarlar && ayarlar.yatay === true;
    printStyle.textContent = `@page { size: A4 ${isLandscape ? 'landscape' : 'portrait'}; margin: 8mm; }`;

    document.body.setAttribute('data-print-mode', 'true');
    printArea.innerHTML = icerik;

    const cleanup = () => {
      document.body.removeAttribute('data-print-mode');
      if (printArea) printArea.innerHTML = '';
      if (printStyle) printStyle.textContent = '';
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
    }, 100);
  }
};

// Global scope bağlantıları
if (typeof window !== 'undefined') {
  window.Store = Store;
  window.ExcelEngine = ExcelEngine;
  window.PrintEngine = PrintEngine;
}
