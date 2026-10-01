/**
 * Plantrack — Store (Veri Yöneticisi)
 * LocalStorage anahtarı: plantrack_db_v1
 */

const STORAGE_KEY = 'plantrack_db_v1';

const Store = {
  data: {
    version: '1.0.0',
    aktifModulId: 'ara-sinif',
    kocProfili: {
      ad: 'Eren',
      soyad: 'Kaya',
      unvan: 'Eğitim Koçu',
      avatarKisa: 'EK'
    },
    aktifOgrenciId: '',
    ogrenciler: [],
    gorevler: [],
    konuDurumlari: []
  },

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = Object.assign({}, this.data, parsed);
        // Varsayılan profil alanlarının eksik kalmamasını garantiye al
        if (!this.data.kocProfili) {
          this.data.kocProfili = { ad: 'Eren', soyad: 'Kaya', unvan: 'Eğitim Koçu', avatarKisa: 'EK' };
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Store verisi yüklenirken hata oluştu:', err);
      this.save();
    }
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error('Store verisi kaydedilirken hata oluştu:', err);
    }
  },

  getAktifOgrenci() {
    if (!this.data.aktifOgrenciId || !Array.isArray(this.data.ogrenciler)) return null;
    return this.data.ogrenciler.find(o => String(o.id) === String(this.data.aktifOgrenciId)) || null;
  },

  setAktifOgrenci(id) {
    this.data.aktifOgrenciId = id || '';
    const ogrenci = this.getAktifOgrenci();
    if (ogrenci) {
      if (ogrenci.modulId) {
        this.data.aktifModulId = ogrenci.modulId;
      } else if (ogrenci.sinif) {
        const sinifObj = typeof SINIFLAR !== 'undefined' ? SINIFLAR.find(s => String(s.deger) === String(ogrenci.sinif)) : null;
        if (sinifObj && sinifObj.modulId) {
          this.data.aktifModulId = sinifObj.modulId;
        }
      }
    }
    this.save();
  },

  setAktifModul(modulId) {
    this.data.aktifModulId = modulId;
    this.save();
  },

  refreshDeadlines() {
    // Sonraki aşamalarda ödevlerin gecikme durumu güncellenecek
    if (!Array.isArray(this.data.gorevler)) {
      this.data.gorevler = [];
    }
  }
};
