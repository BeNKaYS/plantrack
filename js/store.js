/**
 * Plantrack — js/store.js
 * Veri Yönetimi, Durum Saklama, Excel ve Yazdırma Motorları
 */

const STORAGE_KEY = 'plantrack_db_v1';

const Store = {
  data: {
    version: '1.0.0',
    aktifModulId: 'ara-sinif',
    kurulumTamamlandi: true,
    ogretimYili: '2025-2026',
    kocProfili: {
      ad: '',
      soyad: '',
      unvan: 'Eğitim Koçu & Danışman',
      kurum: 'Plantrack Koçluk',
      telefon: '',
      avatarKisa: 'KD'
    },
    aktifOgrenciId: '',
    ogrenciler: [],
    gorevler: [],
    ogrenciKonuDurumlari: [],
    hataKayitlari: [],
    sinifNotlari: [],
    calismaKayitlari: [],
    aliskanlikZincirleri: {},
    zamanPlanlari: {},
    zamanAyarlari: {},
    genelZamanAyarlari: { baslangicSaat: '06:00', bitisSaat: '24:00' },
    konuSoruKayitlari: {},
    cizelgeNotlari: {},
    sinavlar: [],
    dersler: [],
    konular: [],
    kaynaklar: [],
    denemeSinavlari: []
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
        if (typeof this.data.kurulumTamamlandi === 'undefined') {
          this.data.kurulumTamamlandi = Boolean(this.data.ogrenciler && this.data.ogrenciler.length > 0);
        }
        if (!this.data.aliskanlikZincirleri) this.data.aliskanlikZincirleri = {};
        if (!this.data.aliskanlikAySonu) this.data.aliskanlikAySonu = {};
        if (!this.data.aliskanlikNotlari) this.data.aliskanlikNotlari = {};
        if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
        if (!this.data.zamanAyarlari) this.data.zamanAyarlari = {};
        if (!this.data.genelZamanAyarlari) this.data.genelZamanAyarlari = { baslangicSaat: '06:00', bitisSaat: '24:00' };
        if (!this.data.konuSoruKayitlari) this.data.konuSoruKayitlari = {};
        if (!this.data.cizelgeNotlari) this.data.cizelgeNotlari = {};
        if (!Array.isArray(this.data.denemeSinavlari)) this.data.denemeSinavlari = [];
        if (!Array.isArray(this.data.sinavlar)) {
          this.data.sinavlar = [];
        }
      } else {
        this.data = this.getSeedData();
        this.save();
      }
    } catch (err) {
      console.error('Store verisi yüklenirken hata oluştu:', err);
      this.data = this.getSeedData();
      this.save();
    }

    if (!Array.isArray(this.data.sinavlar)) {
      this.data.sinavlar = [];
    }

    if (!Array.isArray(this.data.dersler)) {
      this.data.dersler = [];
    }

    if (!Array.isArray(this.data.konular)) {
      this.data.konular = [];
    }

    // Temiz boş yapı: Kullanıcı talebiyle tüm çekirdek verileri (öğrenci, görev, ders, konu, kaynak, deneme, sınav vb.) sıfırla
    if (localStorage.getItem('plantrack_clean_empty_structure_v1') !== 'true') {
      this.data.ogrenciler = [];
      this.data.aktifOgrenciId = '';
      this.data.gorevler = [];
      this.data.ogrenciKonuDurumlari = [];
      this.data.hataKayitlari = [];
      this.data.sinifNotlari = [];
      this.data.calismaKayitlari = [];
      this.data.denemeSinavlari = [];
      this.data.dersler = [];
      this.data.konular = [];
      this.data.kaynaklar = [];
      this.data.sinavlar = [];
      this.data.aliskanlikZincirleri = {};
      this.data.aliskanlikAySonu = {};
      this.data.aliskanlikNotlari = {};
      this.data.zamanPlanlari = {};
      this.data.konuSoruKayitlari = {};
      this.data.cizelgeNotlari = {};
      this.data.kurulumTamamlandi = true;
      this.save();
      localStorage.setItem('plantrack_clean_empty_structure_v1', 'true');
    }

    if (!Array.isArray(this.data.kaynaklar)) {
      this.data.kaynaklar = [];
    }

    // Müfredat derslerini ve konularını senkronize et (boşsa boş kalır)
    this.syncCurriculumKazanimlar();

    // Derslerin sembol ve renklerini ders adlarına göre otomatik senkronize et
    this.autoSyncAllDersIkonlari();

    this.refreshDeadlines();

    // Canlı MCP Sunucusu (127.0.0.1:38888) ile Çift Yönlü Canlı Köprü Başlat
    this.initLiveSync();
  },

  // ─────────────────────────────────────────────────────────────
  // CANLI MCP / API SENKRONİZASYONU (SEÇENEK B)
  // ─────────────────────────────────────────────────────────────
  syncUrl: 'http://127.0.0.1:38888/api/data',
  lastServerModified: 0,
  isSyncing: false,
  _pendingPush: false,
  liveSyncConnected: false,
  lastSyncTime: null,

  initLiveSync() {
    // Uygulama açılışında MCP sunucusundan hemen verileri çek
    setTimeout(() => {
      this.syncWithServer(false).catch(() => {});
    }, 50);

    // Pencereye her odaklanıldığında (kullanıcı Gemini/Claude'dan Plantrack'e döndüğünde) otomatik yenile
    if (typeof window !== 'undefined' && !this._syncListenerAttached) {
      this._syncListenerAttached = true;
      window.addEventListener('focus', () => {
        this.syncWithServer(false).catch(() => {});
      });
      // Arka planda 8 saniyede bir hafif yoklama
      setInterval(() => {
        this.syncWithServer(false).catch(() => {});
      }, 8000);
    }
  },

  async syncWithServer(forcePush = false) {
    if (this.isSyncing) {
      if (forcePush) this._pendingPush = true;
      return false;
    }
    this.isSyncing = true;
    let updatedFromServer = false;
    try {
      if (forcePush) {
        this._pendingPush = false;
        // Plantrack.app'teki değişikliği MCP veritabanına gönder
        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 2000) : null;
        const res = await fetch(this.syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: this.data, baseModified: this.lastServerModified || 0 }),
          ...(controller ? { signal: controller.signal } : {})
        });
        if (timer) clearTimeout(timer);
        if (res.ok) {
          const json = await res.json();
          if (json && json.lastModified) {
            this.lastServerModified = json.lastModified;
          }
          this.liveSyncConnected = true;
          this.lastSyncTime = new Date();
          if (typeof window !== 'undefined' && window.App && typeof App.renderMcpStatusBadges === 'function') {
            App.renderMcpStatusBadges(true);
          }
        } else if (res.status === 409) {
          // Çakışma: MCP (yapay zekâ) bizden sonra yazmış. Kendi kopyamızı göndermeyi bırak,
          // sunucudaki güncel veriyi çek. Aksi hâlde AI'ın yazdığı veri ezilir.
          const json = await res.json().catch(() => null);
          this._pendingPush = false;
          this._conflictPull = true;
          this.lastServerModified = 0;
          this.liveSyncConnected = true;
          console.warn('[Store] MCP verisi bu sırada değişti; sunucudaki güncel veri çekilecek.', json);
        }
      } else {
        // MCP sunucusundan güncel veriyi çek
        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 1500) : null;
        const res = await fetch(this.syncUrl, controller ? { signal: controller.signal } : {});
        if (timer) clearTimeout(timer);
        if (res.ok) {
          this.liveSyncConnected = true;
          this.lastSyncTime = new Date();
          const json = await res.json();
          if (json && json.data && Array.isArray(json.data.ogrenciler)) {
            const serverMod = json.lastModified || 0;
            // Eğer sunucudaki veri daha yeni ise güncelle
            if (serverMod > this.lastServerModified) {
              this.lastServerModified = serverMod;
              this.data = Object.assign(this.getSeedData(), json.data);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
              updatedFromServer = true;
              if (typeof window !== 'undefined' && window.App) {
                if (typeof App.populateStudentDropdown === 'function') App.populateStudentDropdown();
                if (typeof App.updateSidebarCoachInfo === 'function') App.updateSidebarCoachInfo();
                if (typeof App.updateGlobalBadges === 'function') App.updateGlobalBadges();
                if (typeof App.renderCurrentView === 'function') App.renderCurrentView();
              }
            }
          }
          if (typeof window !== 'undefined' && window.App && typeof App.renderMcpStatusBadges === 'function') {
            App.renderMcpStatusBadges(true);
          }
        }
      }
    } catch (_) {
      // MCP sunucusu o an kapalıysa sessizce yerel depolama ile devam edilir
      this.liveSyncConnected = false;
    } finally {
      this.isSyncing = false;
      if (this._conflictPull) {
        this._conflictPull = false;
        this.syncWithServer(false).catch(() => {});
      } else if (this._pendingPush) {
        this._pendingPush = false;
        this.syncWithServer(true).catch(() => {});
      }
    }
    return updatedFromServer;
  },

  async forceSyncNow() {
    await this.syncWithServer(false);
    await this.syncWithServer(true);
    if (typeof window !== 'undefined' && window.App && typeof App.checkMcpStatus === 'function') {
      await App.checkMcpStatus();
    }
    return this.liveSyncConnected;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      // Canlı MCP sunucusu açıksa arka planda otomatik push et
      this.syncWithServer(true).catch(() => {});
    } catch (err) {
      console.error('Store kaydedilirken hata oluştu:', err);
    }
  },

  getSeedData() {
    return {
      version: '1.0.0',
      kurulumTamamlandi: true,
      ogretimYili: '2025-2026',
      aktifModulId: 'ara-sinif',
      kocProfili: {
        ad: '',
        soyad: '',
        unvan: 'Eğitim Koçu & Danışman',
        kurum: 'Plantrack Koçluk',
        telefon: '',
        avatarKisa: 'KD'
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
      denemeSinavlari: []
    };
  },

  getSeedSinavlar() {
    return [];
  },

  getSeedDersler() {
    return [];
  },

  getSeedKonular() {
    return [];
  },

  resetCurriculum() {
    this.data.dersler = [];
    this.data.konular = [];
    this.save();
  },

  detectDersIkonVeRenk(ad = '', kisaltma = '') {
    const norm = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/İ/g, 'i')
        .replace(/I/g, 'ı')
        .toLowerCase()
        .replace(/ç/g, 'c')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ş/g, 's')
        .replace(/ü/g, 'u')
        .trim();
    };

    const adNorm = norm(ad);
    const kisNorm = norm(kisaltma);
    const fullNorm = `${adNorm} ${kisNorm}`;
    const words = fullNorm.split(/[^a-z0-9]+/).filter(Boolean);

    const hasWord = (...list) => list.some(w => words.includes(norm(w)));
    const hasPhrase = (...list) => list.some(p => fullNorm.includes(norm(p)));

    // 1. Geometri
    if (hasWord('geometri', 'geo') || hasPhrase('geometri')) {
      return { ikon: 'shapes', renk: 'indigo' };
    }

    // 2. Matematik
    if (hasWord('matematik', 'mat', 'cebir', 'aritmetik', 'sayisal') || hasPhrase('matematik', 'temel mat', 'ileri mat')) {
      return { ikon: 'calculator', renk: 'blue' };
    }

    // 3. Fizik
    if (hasWord('fizik', 'fiz') || hasPhrase('fizik')) {
      return { ikon: 'atom', renk: 'cyan' };
    }

    // 4. Kimya
    if (hasWord('kimya', 'kim') || hasPhrase('kimya')) {
      return { ikon: 'test-tube', renk: 'teal' };
    }

    // 5. Biyoloji
    if (hasWord('biyoloji', 'biyo', 'bio', 'genetik') || hasPhrase('biyoloji')) {
      return { ikon: 'dna', renk: 'emerald' };
    }

    // 6. Fen Bilimleri / Fen
    if (hasWord('fen') || hasPhrase('fen bilim', 'fen bilgisi')) {
      return { ikon: 'flask-conical', renk: 'emerald' };
    }

    // 7. Tarih / İnkılap / Atatürkçülük / Çağdaş
    if (hasWord('tarih', 'inkilap', 'trh', 'ink', 'ataturk') || hasPhrase('tarih', 'inkilap', 'ataturkculuk', 'cagdas turk')) {
      return { ikon: 'landmark', renk: 'amber' };
    }

    // 8. Edebiyat
    if (hasWord('edebiyat', 'edb') || hasPhrase('edebiyat')) {
      return { ikon: 'scroll', renk: 'rose' };
    }

    // 9. Türkçe
    if (hasWord('turkce', 'tr') || hasPhrase('turkce', 'turk dili', 'dil ve anlatim', 'dil bilgisi', 'paragraf')) {
      return { ikon: 'book', renk: 'rose' };
    }

    // 10. Coğrafya
    if (hasWord('cografya', 'cog') || hasPhrase('cografya', 'jeoloji')) {
      return { ikon: 'globe', renk: 'orange' };
    }

    // 11. Felsefe Grubu (Felsefe, Mantık, Sosyoloji, Psikoloji)
    if (hasWord('felsefe', 'fel', 'mantik', 'sosyoloji', 'psikoloji') || hasPhrase('felsefe', 'felsefe grubu')) {
      return { ikon: 'brain', renk: 'purple' };
    }

    // 12. Sosyal Bilgiler
    if (hasWord('sosyal', 'sos') || hasPhrase('sosyal bilgiler', 'sosyal')) {
      return { ikon: 'compass', renk: 'amber' };
    }

    // 13. Din Kültürü / Ahlak Bilgisi / Siyer / Kuran
    if (hasWord('din', 'ahlak', 'siyer', 'kuran', 'hadis', 'fikih') || hasPhrase('din kulturu', 'temel dini')) {
      return { ikon: 'heart-handshake', renk: 'teal' };
    }

    // 14. Yabancı Dil (İngilizce, Almanca, Fransızca, Dil, YDT)
    if (hasWord('ingilizce', 'ing', 'almanca', 'alm', 'fransizca', 'fra', 'arapca', 'rusca', 'ydt', 'dil') || hasPhrase('yabanci dil', 'ingilizce', 'almanca')) {
      return { ikon: 'languages', renk: 'purple' };
    }

    // 15. Müzik
    if (hasWord('muzik', 'muz', 'nota') || hasPhrase('muzik')) {
      return { ikon: 'music', renk: 'cyan' };
    }

    // 16. Görsel Sanatlar / Resim / Sanat
    if (hasWord('gorsel', 'resim', 'sanat', 'gsa') || hasPhrase('gorsel sanatlar', 'sanat tarihi')) {
      return { ikon: 'palette', renk: 'orange' };
    }

    // 17. Beden Eğitimi / Spor
    if (hasWord('beden', 'spor', 'bed') || hasPhrase('beden egitimi')) {
      return { ikon: 'activity', renk: 'indigo' };
    }

    // 18. Bilişim Teknolojileri / Bilgisayar / Kodlama
    if (hasWord('bilisim', 'bilgisayar', 'yazilim', 'kodlama', 'robotik', 'bit') || hasPhrase('bilisim tek', 'bilgisayar bilimi')) {
      return { ikon: 'laptop', renk: 'slate' };
    }

    // 19. Teknoloji Tasarım / Tasarım
    if (hasWord('tasarim', 'tek') || hasPhrase('teknoloji ve tasarim', 'teknoloji tasarim')) {
      return { ikon: 'cpu', renk: 'slate' };
    }

    // 20. Proje / Araştırma
    if (hasWord('proje', 'arastirma') || hasPhrase('proje hazirlama')) {
      return { ikon: 'microscope', renk: 'blue' };
    }

    // 21. Rehberlik / Kariyer / Koçluk
    if (hasWord('rehberlik', 'rehber', 'kariyer', 'kocluk') || hasPhrase('rehberlik')) {
      return { ikon: 'user-check', renk: 'blue' };
    }

    // 22. Hukuk / Demokrasi / Vatandaşlık
    if (hasWord('hukuk', 'demokrasi', 'vatandaslik') || hasPhrase('insan haklari')) {
      return { ikon: 'scale', renk: 'amber' };
    }

    // 23. Ekonomi / Girişimcilik / Muhasebe / İşletme
    if (hasWord('ekonomi', 'iktisat', 'girisimcilik', 'finans', 'muhasebe', 'isletme')) {
      return { ikon: 'trending-up', renk: 'emerald' };
    }

    // 24. Astronomi / Uzay
    if (hasWord('astronomi', 'uzay', 'ast') || hasPhrase('astronomi ve uzay')) {
      return { ikon: 'telescope', renk: 'indigo' };
    }

    // 25. Sağlık / İlk Yardım / Trafik
    if (hasWord('saglik', 'trafik') || hasPhrase('ilk yardim', 'saglik bilgisi')) {
      return { ikon: 'shield-alert', renk: 'rose' };
    }

    return { ikon: 'book-open', renk: 'blue' };
  },

  autoSyncAllDersIkonlari() {
    if (!this.data || !Array.isArray(this.data.dersler)) return 0;
    let degisenSayisi = 0;
    this.data.dersler.forEach(d => {
      const detected = this.detectDersIkonVeRenk(d.ad, d.kisaltma);
      let guncellendi = false;
      // İkon varsayılan ise veya tespit edilen geçerli bir ikon varsa ve mevcut ile uyuşmuyorsa
      if (!d.ikon || d.ikon === 'book' || d.ikon === 'book-open' || (detected.ikon !== 'book-open' && d.ikon !== detected.ikon)) {
        d.ikon = detected.ikon;
        guncellendi = true;
      }
      // Renk varsayılan blue ise veya tespit edilen renkle uyuşmuyorsa
      if (!d.renk || d.renk === 'blue' || (detected.renk !== 'blue' && d.renk !== detected.renk)) {
        d.renk = detected.renk;
        guncellendi = true;
      }
      if (guncellendi) degisenSayisi++;
    });
    if (degisenSayisi > 0) {
      this.save();
    }
    return degisenSayisi;
  },

  resetToFactory() {
    this.data = this.getSeedData();
    this.save();
  },

  getDefaultKaynaklar() {
    return [];
  },

  getKaynaklar() {
    if (!Array.isArray(this.data.kaynaklar)) {
      this.data.kaynaklar = [];
      this.save();
    }
    return this.data.kaynaklar;
  },

  getKaynak(id) {
    if (!id) return null;
    return this.getKaynaklar().find(k => String(k.id) === String(id)) || null;
  },

  addKaynak(veri) {
    const id = 'kyn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const moduller = Array.isArray(veri.modulId)
      ? veri.modulId
      : (veri.modulId ? [veri.modulId] : ['yks']);

    const yeniKaynak = {
      id,
      ad: (veri.ad || 'Soru Bankası').trim(),
      yayinevi: (veri.yayinevi || 'Genel').trim(),
      modulId: moduller,
      tur: veri.tur || 'Soru Bankası',
      zorluk: Math.max(1, Math.min(5, Number(veri.zorluk) || 3)),
      aciklama: (veri.aciklama || '').trim(),
      dersId: veri.dersId || ''
    };
    if (!Array.isArray(this.data.kaynaklar)) {
      this.data.kaynaklar = this.getDefaultKaynaklar();
    }
    this.data.kaynaklar.push(yeniKaynak);
    this.save();
    return yeniKaynak;
  },

  updateKaynak(id, updates) {
    const list = this.getKaynaklar();
    const idx = list.findIndex(k => String(k.id) === String(id));
    if (idx === -1) return null;

    if (updates.modulId && !Array.isArray(updates.modulId)) {
      updates.modulId = [updates.modulId];
    }
    const guncel = Object.assign({}, list[idx], updates);
    this.data.kaynaklar[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteKaynak(id) {
    this.data.kaynaklar = (this.data.kaynaklar || []).filter(k => String(k.id) !== String(id));
    // Cascade: o kaynağa bağlı görevlerdeki kaynakId alanını temizle
    if (Array.isArray(this.data.gorevler)) {
      this.data.gorevler.forEach(g => {
        if (String(g.kaynakId) === String(id)) {
          g.kaynakId = '';
        }
      });
    }
    this.save();
  },

  getKaynakCozulenSoruSayisi(kaynakId) {
    if (!kaynakId) return 0;
    const gorevler = this.data.gorevler || [];
    return gorevler
      .filter(g => String(g.kaynakId) === String(kaynakId))
      .reduce((sum, g) => sum + (Number(g.cozulenSoru) || 0), 0);
  },

  // ─────────────────────────────────────────────────────────────
  // MODÜL METODLARI
  // ─────────────────────────────────────────────────────────────
  getAktifModul() {
    if (!this.data.aktifModulId || this.data.aktifModulId === 'all' || this.data.aktifModulId === 'tumu') return null;
    if (typeof MODULLER === 'undefined' || !Array.isArray(MODULLER)) return null;
    return MODULLER.find(m => m.id === this.data.aktifModulId) || null;
  },

  setAktifModul(modulId) {
    this.data.aktifModulId = modulId || '';
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
      gunlukHedefSoru: Number(profil.gunlukHedefSoru) || 0,
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
    const konular = this.getKonularForDers(dersId);
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
    
    // Otomatik 1 gün sonraya tekrar tarihi
    let defaultTekrar = '';
    const d = new Date();
    d.setDate(d.getDate() + 1);
    defaultTekrar = d.toISOString().split('T')[0];

    const yeniHata = {
      id,
      ogrenciId: veri.ogrenciId || this.data.aktifOgrenciId,
      dersId: veri.dersId || '',
      konuId: veri.konuId || '',
      hataTuru: veri.hataTuru || 'Bilgi Eksikliği',
      aciklama: (veri.aciklama || '').trim(),
      asama: Number(veri.asama) || 1, // 1: 1 gün sonra, 2: 3 gün sonra, 3: 7 gün sonra, 4: tamamlandı
      telafiDurumu: Boolean(veri.telafiDurumu),
      olusturmaTarihi: new Date().toISOString(),
      tekrarTarihi: veri.tekrarTarihi || defaultTekrar,
      tamamlanmaTarihi: veri.tamamlanmaTarihi || ''
    };

    if (!Array.isArray(this.data.hataKayitlari)) {
      this.data.hataKayitlari = [];
    }
    this.data.hataKayitlari.push(yeniHata);
    this.save();
    return yeniHata;
  },

  telafiIlerletHata(id) {
    const list = this.data.hataKayitlari || [];
    const idx = list.findIndex(h => String(h.id) === String(id));
    if (idx === -1) return null;

    const hata = list[idx];
    const curAsama = Number(hata.asama) || 1;
    const bugun = new Date();

    if (curAsama === 1) {
      // 1. gün tamamlandı -> 3 gün sonra
      const nextDate = new Date();
      nextDate.setDate(bugun.getDate() + 3);
      hata.asama = 2;
      hata.tekrarTarihi = nextDate.toISOString().split('T')[0];
      hata.telafiDurumu = false;
    } else if (curAsama === 2) {
      // 3. gün tamamlandı -> 7 gün sonra
      const nextDate = new Date();
      nextDate.setDate(bugun.getDate() + 7);
      hata.asama = 3;
      hata.tekrarTarihi = nextDate.toISOString().split('T')[0];
      hata.telafiDurumu = false;
    } else {
      // 7. gün tamamlandı -> Döngü tamamlandı
      hata.asama = 4;
      hata.telafiDurumu = true;
      hata.tamamlanmaTarihi = bugun.toISOString().split('T')[0];
    }

    this.save();
    return hata;
  },

  updateHata(id, updates) {
    const list = this.data.hataKayitlari || [];
    const idx = list.findIndex(h => String(h.id) === String(id));
    if (idx === -1) return null;

    // Eğer sadece { telafiDurumu: true } gönderildiyse döngüyü ilerlet
    if (updates.telafiDurumu === true && updates.asama === undefined) {
      return this.telafiIlerletHata(id);
    }

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
    if (dersId && dersId !== 'tum') {
      filtered = filtered.filter(n => String(n.dersId) === String(dersId));
    }
    return filtered.slice().sort((a, b) => new Date(b.tarih || 0) - new Date(a.tarih || 0));
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
  // MÜFREDAT VE DERS METODLARI
  // ─────────────────────────────────────────────────────────────
  getDersler() {
    if (!Array.isArray(this.data.dersler) || this.data.dersler.length === 0) {
      this.data.dersler = this.getSeedDersler();
      this.save();
    }
    return this.data.dersler;
  },

  getDers(dersId) {
    if (!dersId) return null;
    return this.getDersler().find(d => String(d.id) === String(dersId)) || null;
  },

  addDers(veri) {
    const id = veri.id || ('drs-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));
    const detected = this.detectDersIkonVeRenk(veri.ad, veri.kisaltma);
    const yeniDers = {
      id,
      modulId: veri.modulId || 'yks',
      sinif: String(veri.sinif || 'ortak'),
      ad: (veri.ad || 'Yeni Ders').trim(),
      kisaltma: (veri.kisaltma || 'DRS').trim().toUpperCase().slice(0, 5),
      renk: (veri.renk && veri.renk !== 'blue') ? veri.renk : (detected.renk || 'blue'),
      ikon: (veri.ikon && veri.ikon !== 'book') ? veri.ikon : (detected.ikon || 'book'),
      haftalikSaat: Number(veri.haftalikSaat) || 0,
      sinavdaMi: Boolean(veri.sinavdaMi),
      soruSayisi: Number(veri.soruSayisi) || 0
    };
    if (!Array.isArray(this.data.dersler)) {
      this.data.dersler = [];
    }
    this.data.dersler.push(yeniDers);
    this.save();
    return yeniDers;
  },

  updateDers(id, updates) {
    const list = this.getDersler();
    const idx = list.findIndex(d => String(d.id) === String(id));
    if (idx === -1) return null;

    if (updates.kisaltma) {
      updates.kisaltma = updates.kisaltma.trim().toUpperCase().slice(0, 5);
    }
    const current = list[idx];
    const adDegisti = updates.ad && updates.ad !== current.ad;
    if ((adDegisti || !updates.ikon || updates.ikon === 'book') && !updates.manualIkon) {
      const detected = this.detectDersIkonVeRenk(updates.ad || current.ad, updates.kisaltma || current.kisaltma);
      if (!updates.ikon || updates.ikon === 'book') {
        updates.ikon = detected.ikon;
      }
      if (!updates.renk || updates.renk === 'blue') {
        updates.renk = detected.renk;
      }
    }
    const guncel = Object.assign({}, current, updates);
    this.data.dersler[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteDers(id) {
    const targetId = String(id);
    this.data.dersler = (this.data.dersler || []).filter(d => String(d.id) !== targetId);

    // Cascade: o derse ait tüm konuları da siler
    const silinecekKonular = (this.data.konular || []).filter(k => String(k.dersId) === targetId);
    const silinecekKonuIds = new Set(silinecekKonular.map(k => String(k.id)));

    this.data.konular = (this.data.konular || []).filter(k => String(k.dersId) !== targetId);

    // Görevleri temizle
    if (Array.isArray(this.data.gorevler)) {
      this.data.gorevler = this.data.gorevler.filter(g => String(g.dersId) !== targetId);
    }

    // Konu durumlarını temizle
    if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = this.data.ogrenciKonuDurumlari.filter(
        kd => !silinecekKonuIds.has(String(kd.konuId))
      );
    }

    // Sınav notlarını temizle
    if (Array.isArray(this.data.sinifNotlari)) {
      this.data.sinifNotlari = this.data.sinifNotlari.filter(n => String(n.dersId) !== targetId);
    }

    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // KONU METODLARI
  // ─────────────────────────────────────────────────────────────
  getKonular() {
    if (!Array.isArray(this.data.konular) || this.data.konular.length === 0) {
      this.data.konular = this.getSeedKonular();
      this.save();
    }
    return this.data.konular;
  },

  getKonu(konuId) {
    if (!konuId) return null;
    return this.getKonular().find(k => String(k.id) === String(konuId)) || null;
  },

  getKonularForDers(dersId) {
    if (!dersId) return [];
    return this.getKonular().filter(k => String(k.dersId) === String(dersId));
  },

  addKonu(veri) {
    const id = veri.id || ('kon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4));
    const yeniKonu = {
      id,
      dersId: String(veri.dersId || ''),
      modulId: veri.modulId || '',
      sinif: String(veri.sinif || ''),
      uniteNo: Number(veri.uniteNo) || 1,
      uniteAdi: (veri.uniteAdi || 'Ünite 1').trim(),
      konuAdi: (veri.konuAdi || 'Yeni Konu').trim(),
      aciklama: (veri.aciklama || '').trim(),
      siraNo: Number(veri.siraNo) || 1,
      kazanimlar: Array.isArray(veri.kazanimlar) ? veri.kazanimlar : []
    };
    if (!Array.isArray(this.data.konular)) {
      this.data.konular = this.getSeedKonular();
    }
    this.data.konular.push(yeniKonu);
    this.save();
    return yeniKonu;
  },

  updateKonu(id, updates) {
    const list = this.getKonular();
    const idx = list.findIndex(k => String(k.id) === String(id));
    if (idx === -1) return null;

    const guncel = Object.assign({}, list[idx], updates);
    if (updates.kazanimlar && Array.isArray(updates.kazanimlar)) {
      guncel.kazanimlar = updates.kazanimlar;
    }
    this.data.konular[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteKonu(id) {
    const targetId = String(id);
    this.data.konular = (this.data.konular || []).filter(k => String(k.id) !== targetId);

    if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = this.data.ogrenciKonuDurumlari.filter(
        kd => String(kd.konuId) !== targetId
      );
    }
    this.save();
  },

  clearAllKonular() {
    this.data.konular = [];
    if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = [];
    }
    this.save();
  },

  addOrUpdateKonularBatch(satirlar) {
    if (!Array.isArray(this.data.konular)) {
      this.data.konular = [];
    }
    const konuMap = new Map((this.data.konular || []).map(k => [String(k.id), k]));
    let eklenen = 0;
    let guncellenen = 0;

    satirlar.forEach(s => {
      if (s.durum === 'guncellenecek' && s.mevcutId && konuMap.has(String(s.mevcutId))) {
        const existing = konuMap.get(String(s.mevcutId));
        Object.assign(existing, s.veri);
        if (s.veri && Array.isArray(s.veri.kazanimlar)) {
          existing.kazanimlar = s.veri.kazanimlar;
        }
        guncellenen++;
      } else {
        const id = (s.veri && s.veri.id) || ('kon-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6));
        const yeniKonu = {
          id,
          dersId: String(s.veri.dersId || ''),
          modulId: s.veri.modulId || '',
          sinif: String(s.veri.sinif || ''),
          uniteNo: Number(s.veri.uniteNo) || 1,
          uniteAdi: (s.veri.uniteAdi || 'Ünite 1').trim(),
          konuAdi: (s.veri.konuAdi || 'Yeni Konu').trim(),
          aciklama: (s.veri.aciklama || '').trim(),
          siraNo: Number(s.veri.siraNo) || 1,
          kazanimlar: Array.isArray(s.veri.kazanimlar) ? s.veri.kazanimlar : []
        };
        this.data.konular.push(yeniKonu);
        konuMap.set(String(id), yeniKonu);
        eklenen++;
      }
    });

    this.save();
    return { eklenen, guncellenen };
  },

  // G11: Müfredat derslerini, konularını ve MEB/ÖSYM kazanımlarını yerel depolama verilerine güvenle aktar/senkronize et
  syncCurriculumKazanimlar() {
    const norm = s => (s || '').toString().toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');

    // 1. Standart Dersleri Senkronize Et
    if (typeof DERSLER !== 'undefined' && Array.isArray(DERSLER) && DERSLER.length > 0) {
      if (!Array.isArray(this.data.dersler) || this.data.dersler.length === 0) {
        this.data.dersler = JSON.parse(JSON.stringify(DERSLER));
      } else {
        DERSLER.forEach(dMaster => {
          const exists = this.data.dersler.find(d => d.id === dMaster.id || (norm(d.ad) === norm(dMaster.ad) && d.modulId === dMaster.modulId));
          if (!exists) {
            this.data.dersler.push(JSON.parse(JSON.stringify(dMaster)));
          }
        });
      }
    }

    // 2. Standart Konuları ve MEB/ÖSYM Kazanımlarını Senkronize Et
    if (typeof KONULAR !== 'undefined' && Array.isArray(KONULAR) && KONULAR.length > 0) {
      if (!Array.isArray(this.data.konular) || this.data.konular.length === 0) {
        this.data.konular = JSON.parse(JSON.stringify(KONULAR));
      } else {
        KONULAR.forEach(kMaster => {
          const masterKonuNorm = norm(kMaster.konuAdi);
          // Mevcut konu var mı? (ID veya ders + konu adı bazında)
          const existing = this.data.konular.find(k =>
            String(k.id) === String(kMaster.id) ||
            (norm(k.konuAdi) === masterKonuNorm && (String(k.dersId) === String(kMaster.dersId) || norm(k.dersAdi) === norm(kMaster.dersAdi)))
          );

          if (existing) {
            // Kazanımları güncelle/zenginleştir (öğrenci durumlarını ve mevcut ID'yi korur)
            if (!Array.isArray(existing.kazanimlar) || existing.kazanimlar.length < (kMaster.kazanimlar || []).length) {
              existing.kazanimlar = JSON.parse(JSON.stringify(kMaster.kazanimlar || []));
            }
            if (!existing.aciklama && kMaster.aciklama) {
              existing.aciklama = kMaster.aciklama;
            }
            if (!existing.dersAdi && kMaster.dersAdi) {
              existing.dersAdi = kMaster.dersAdi;
            }
          }
          // NOT: Eksik gömülü (seed) konu artık havuza EKLENMEZ. Müfredat, kullanıcının
          // veritabanından (MCP) gelir; seed yalnızca isimle eşleşen mevcut konuyu
          // kazanım/açıklama ile zenginleştirir. (Aksi hâlde her açılışta eski konular
          // geri eklenip veritabanı bozuluyordu.)
        });
      }
    }
    // 3. Daha önceden aktarılmış deneme yer tutucu konularını resmi konulara yeniden bağla (öğrenci durumlarını koruyarak)
    if (Array.isArray(this.data.konular) && this.data.konular.length > 0) {
      const placeholders = this.data.konular.filter(k => k.aciklama && k.aciklama.includes('Deneme sınavından aktarıldı'));
      if (placeholders.length > 0) {
        placeholders.forEach(ph => {
          const phClean = norm(ph.konuAdi.replace(/\.+$/, ''));
          let official = this.data.konular.find(k => {
            if (k.id === ph.id || (k.aciklama && k.aciklama.includes('Deneme sınavından aktarıldı'))) return false;
            const kClean = norm(k.konuAdi);
            if (kClean === phClean || kClean.includes(phClean) || phClean.includes(kClean)) return true;
            if (Array.isArray(k.kazanimlar) && k.kazanimlar.length > 0) {
              return k.kazanimlar.some(kaz => {
                const kazClean = norm(kaz);
                return kazClean.includes(phClean) || phClean.includes(kazClean);
              });
            }
            return false;
          });

          if (!official) {
            const words = ph.konuAdi.toLowerCase().replace(/[^a-z0-9ğüşıöç\s]/gi, ' ').split(/\s+/).filter(w => w.length > 3);
            let best = 0;
            this.data.konular.forEach(k => {
              if (k.id === ph.id || (k.aciklama && k.aciklama.includes('Deneme sınavından aktarıldı'))) return;
              const txt = [k.konuAdi, ...(k.kazanimlar || [])].join(' ').toLowerCase();
              let s = 0;
              words.forEach(w => { if (txt.includes(w)) s++; });
              if (s > best && s >= 2) { best = s; official = k; }
            });
          }

          if (official) {
            if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
              this.data.ogrenciKonuDurumlari.forEach(kd => {
                if (String(kd.konuId) === String(ph.id)) {
                  kd.konuId = official.id;
                }
              });
            }
            this.data.konular = this.data.konular.filter(k => k.id !== ph.id);
          }
        });
      }
    }
    this.save();
  },

  // G16: Akıllı Ders Eşleştirme Motoru (Kanonik eşleştirme, sınıf ön eki temizleme, alias haritası)
  findMatchingDers(dersAdi, ogrenciOrModulId = null, sinifParam = null) {
    if (!dersAdi) return null;

    // Türkçe karakter normalizasyonu
    const cleanTr = s => (s || '').toString().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    // Sınıf öneki ve seviye temizleme (örn: "8 Fen Bilimleri", "8. Sınıf Fen", "08/A Fen ve Teknoloji" -> "Fen ve Teknoloji")
    const stripClassPrefix = s => {
      let str = (s || '').toString().trim();
      return str
        .replace(/^(\d{1,2})(\.|\/|\s*sınıf|\s*sinif|\/[a-z])*\s*[-:]?\s*/i, '')
        .replace(/^(lgs|tyt|ayt|ydt)\s*[-:]?\s*/i, '')
        .trim();
    };

    const rawClean = cleanTr(dersAdi);
    const strippedClean = cleanTr(stripClassPrefix(dersAdi));

    // Kanonik anahtar belirleme (Alias Map)
    const getCanonicalKey = (cleanStr) => {
      if (!cleanStr) return '';
      // Din Kültürü
      if (cleanStr.includes('din') || cleanStr.includes('ahlak') || cleanStr.includes('dkab')) return 'din';
      // İnkılap Tarihi / Sosyal Bilgiler
      if (cleanStr.includes('inkilap') || cleanStr.includes('sosyal') || cleanStr.includes('ataturk') ||
          cleanStr.startsWith('tcinkilap') || cleanStr.includes('inkilaptarihi')) return 'inkilap';
      // Fen Bilimleri / Fen ve Teknoloji
      if (cleanStr.includes('fen') || cleanStr.includes('teknoloji') || cleanStr.includes('fenvetekn')) return 'fen';
      // İngilizce / Yabancı Dil
      if (cleanStr.includes('ingilizce') || cleanStr.includes('yabanci') || cleanStr.includes('english') || cleanStr === 'ing') return 'ingilizce';
      // Geometri (Matematikten ayrı tutulmalı)
      if (cleanStr.includes('geometri') || cleanStr === 'geo') return 'geometri';
      // Matematik
      if (cleanStr.includes('matematik') || cleanStr === 'mat') return 'matematik';
      // Edebiyat (Türkçeden ayrı tutulmalı)
      if (cleanStr.includes('edebiyat') || cleanStr.includes('turkdili')) return 'edebiyat';
      // Türkçe
      if (cleanStr.includes('turkce') || cleanStr === 'tur') return 'turkce';
      // YKS Dersleri
      if (cleanStr.includes('fizik') || cleanStr === 'fiz') return 'fizik';
      if (cleanStr.includes('kimya') || cleanStr === 'kim') return 'kimya';
      if (cleanStr.includes('biyoloji') || cleanStr === 'biyo') return 'biyoloji';
      if (cleanStr.includes('cografya') || cleanStr === 'cog') return 'cografya';
      if (cleanStr.includes('felsefe') || cleanStr === 'fel') return 'felsefe';
      if (cleanStr.includes('tarih') || cleanStr === 'tar') return 'tarih';
      return cleanStr;
    };

    const targetKey = getCanonicalKey(strippedClean) || getCanonicalKey(rawClean);

    // Arama yapılacak havuz
    let havuz = this.getDersler() || [];

    if (ogrenciOrModulId) {
      const ogr = typeof ogrenciOrModulId === 'object' ? ogrenciOrModulId : this.getOgrenci(ogrenciOrModulId);
      if (ogr) {
        const ogrDersler = this.getDerslerForOgrenci(ogr);
        if (ogrDersler.length > 0) {
          havuz = ogrDersler;
        }
      } else if (typeof ogrenciOrModulId === 'string' && ['lgs', 'yks', 'ara-sinif'].includes(ogrenciOrModulId)) {
        havuz = havuz.filter(d => d.modulId === ogrenciOrModulId);
      }
    }

    if (sinifParam) {
      const sinifStr = String(sinifParam);
      const sinifFiltreli = havuz.filter(d => String(d.sinif) === sinifStr || d.sinif === 'ortak');
      if (sinifFiltreli.length > 0) {
        havuz = sinifFiltreli;
      }
    }

    // 1. Aşama: Tam ad veya kısaltma eşleşmesi
    let match = havuz.find(d => {
      const dRaw = cleanTr(d.ad);
      const dStripped = cleanTr(stripClassPrefix(d.ad));
      const dKis = cleanTr(d.kisaltma);
      return dRaw === rawClean || dStripped === strippedClean || dKis === rawClean || dKis === strippedClean;
    });
    if (match) return match;

    // 2. Aşama: Kanonik anahtar (Alias Map) eşleşmesi
    if (targetKey) {
      match = havuz.find(d => {
        const dStripped = cleanTr(stripClassPrefix(d.ad));
        const dKey = getCanonicalKey(dStripped) || getCanonicalKey(cleanTr(d.ad));
        return dKey === targetKey;
      });
      if (match) return match;
    }

    // 3. Aşama: Alt dizgi / kelime kapsama kontrolü
    match = havuz.find(d => {
      const dStripped = cleanTr(stripClassPrefix(d.ad));
      return (strippedClean.length >= 3 && dStripped.includes(strippedClean)) ||
             (dStripped.length >= 3 && strippedClean.includes(dStripped));
    });
    if (match) return match;

    // 4. Aşama: Eğer öğrenci havuzunda bulunamadıysa, tüm sistem dersleri havuzunda kanonik anahtarla ara
    const tumDersler = this.getDersler() || [];
    if (havuz.length !== tumDersler.length && targetKey) {
      match = tumDersler.find(d => {
        const dStripped = cleanTr(stripClassPrefix(d.ad));
        const dKey = getCanonicalKey(dStripped) || getCanonicalKey(cleanTr(d.ad));
        return dKey === targetKey;
      });
      if (match) return match;
    }

    return null;
  },

  // G16: Mevcut Mükerrer Dersleri Birleştirme & Temizleme Aracı
  birlestirMukerrerDersler() {
    const cleanTr = s => (s || '').toString().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    const stripClassPrefix = s => {
      let str = (s || '').toString().trim();
      return str
        .replace(/^(\d{1,2})(\.|\/|\s*sınıf|\s*sinif|\/[a-z])*\s*[-:]?\s*/i, '')
        .replace(/^(lgs|tyt|ayt|ydt)\s*[-:]?\s*/i, '')
        .trim();
    };

    const getCanonicalKey = (cleanStr) => {
      if (!cleanStr) return '';
      if (cleanStr.includes('din') || cleanStr.includes('ahlak') || cleanStr.includes('dkab')) return 'din';
      if (cleanStr.includes('inkilap') || cleanStr.includes('sosyal') || cleanStr.includes('ataturk') ||
          cleanStr.startsWith('tcinkilap') || cleanStr.includes('inkilaptarihi')) return 'inkilap';
      if (cleanStr.includes('fen') || cleanStr.includes('teknoloji') || cleanStr.includes('fenvetekn')) return 'fen';
      if (cleanStr.includes('ingilizce') || cleanStr.includes('yabanci') || cleanStr.includes('english') || cleanStr === 'ing') return 'ingilizce';
      if (cleanStr.includes('geometri') || cleanStr === 'geo') return 'geometri';
      if (cleanStr.includes('matematik') || cleanStr === 'mat') return 'matematik';
      if (cleanStr.includes('edebiyat') || cleanStr.includes('turkdili')) return 'edebiyat';
      if (cleanStr.includes('turkce') || cleanStr === 'tur') return 'turkce';
      if (cleanStr.includes('fizik') || cleanStr === 'fiz') return 'fizik';
      if (cleanStr.includes('kimya') || cleanStr === 'kim') return 'kimya';
      if (cleanStr.includes('biyoloji') || cleanStr === 'biyo') return 'biyoloji';
      if (cleanStr.includes('cografya') || cleanStr === 'cog') return 'cografya';
      if (cleanStr.includes('felsefe') || cleanStr === 'fel') return 'felsefe';
      if (cleanStr.includes('tarih') || cleanStr === 'tar') return 'tarih';
      return cleanStr;
    };

    const getExamLevel = (d) => {
      const adClean = cleanTr(d.ad);
      const idClean = cleanTr(d.id);
      if (adClean.includes('tarih1') || idClean.includes('tarih1')) return 'ayt1';
      if (adClean.includes('tarih2') || idClean.includes('tarih2')) return 'ayt2';
      if (adClean.includes('cografya1') || idClean.includes('cografya1')) return 'ayt1';
      if (adClean.includes('cografya2') || idClean.includes('cografya2')) return 'ayt2';
      if (adClean.includes('ayt') || idClean.includes('ayt') || adClean.includes('edebiyat')) return 'ayt';
      if (adClean.includes('tyt') || idClean.includes('tyt')) return 'tyt';
      return String(d.sinif || 'ortak');
    };

    const dersler = this.getDersler() || [];
    const gruplar = new Map();

    dersler.forEach(d => {
      const stripped = cleanTr(stripClassPrefix(d.ad));
      const key = getCanonicalKey(stripped) || getCanonicalKey(cleanTr(d.ad)) || stripped;
      const level = getExamLevel(d);
      const groupKey = `${d.modulId || 'lgs'}_${level}_${key}`;
      if (!gruplar.has(groupKey)) {
        gruplar.set(groupKey, []);
      }
      gruplar.get(groupKey).push(d);
    });

    let birlestirilenDersSayisi = 0;
    let tasinanKonuSayisi = 0;
    const raporDetay = [];

    gruplar.forEach((grupDersleri, groupKey) => {
      if (grupDersleri.length <= 1) return; // Mükerrer yok

      // Ana ders puanlama (en yüksek puanlı ders ana ders seçilir)
      const scoreDers = (d) => {
        let score = 0;
        if (/^drs-(lgs|tyt|ayt|ara)-/i.test(d.id)) score += 100;
        if (/^\d{1,2}\s+[A-ZÇĞİÖŞÜ]/i.test(d.ad)) score += 50;
        const konuSayisi = (this.data.konular || []).filter(k => String(k.dersId) === String(d.id)).length;
        score += konuSayisi * 2;
        if (!/^[A-ZÇĞİÖŞÜ0-9\.\s]+$/.test(d.ad) || d.ad.length > 10) score += 20;
        return score;
      };

      grupDersleri.sort((a, b) => scoreDers(b) - scoreDers(a));
      const anaDers = grupDersleri[0];
      const mukerrerler = grupDersleri.slice(1);

      mukerrerler.forEach(mDers => {
        birlestirilenDersSayisi++;
        const tasinanBuDersten = [];

        // 1. Konuları ve durumları ana derse aktar
        const mKonular = (this.data.konular || []).filter(k => String(k.dersId) === String(mDers.id));
        mKonular.forEach(k => {
          const anaKonu = this.findMatchingKonu(anaDers.id, k.konuAdi);
          if (anaKonu && String(anaKonu.id) !== String(k.id)) {
            // Durumları aktar
            (this.data.ogrenciKonuDurumlari || []).forEach(kd => {
              if (String(kd.konuId) === String(k.id)) {
                const existing = (this.data.ogrenciKonuDurumlari || []).find(x => 
                  String(x.ogrenciId) === String(kd.ogrenciId) && String(x.konuId) === String(anaKonu.id)
                );
                if (existing) {
                  if (kd.durum === 'tekrar_lazim') existing.durum = 'tekrar_lazim';
                  if (kd.not) existing.not = (existing.not ? existing.not + ' | ' : '') + kd.not;
                } else {
                  kd.konuId = anaKonu.id;
                }
              }
            });

            // Görev referanslarını güncelle
            (this.data.gorevler || []).forEach(g => {
              if (String(g.konuId) === String(k.id)) {
                g.konuId = anaKonu.id;
                g.dersId = anaDers.id;
              }
            });

            // Yinelenen konuyu sil
            this.data.konular = (this.data.konular || []).filter(item => String(item.id) !== String(k.id));
            tasinanKonuSayisi++;
            tasinanBuDersten.push(`${k.konuAdi} -> ${anaKonu.konuAdi}`);
          } else {
            // Ana derste bu konu yok, konuyu ana derse taşı
            k.dersId = anaDers.id;
            tasinanKonuSayisi++;
            tasinanBuDersten.push(`${k.konuAdi} (Taşındı)`);
          }
        });

        // 2. Kalan görevler ve kaynakları ana derse aktar
        (this.data.gorevler || []).forEach(g => {
          if (String(g.dersId) === String(mDers.id)) {
            g.dersId = anaDers.id;
          }
        });
        (this.data.kaynaklar || []).forEach(kaynak => {
          if (String(kaynak.dersId) === String(mDers.id)) {
            kaynak.dersId = anaDers.id;
          }
        });

        // 3. Deneme kayıtlarındaki dersId referansını güncelle
        (this.data.denemeSinavlari || []).forEach(deneme => {
          if (Array.isArray(deneme.dersler)) {
            deneme.dersler.forEach(d => {
              if (String(d.dersId) === String(mDers.id) || d.ders === mDers.ad) {
                d.dersId = anaDers.id;
              }
            });
          }
        });

        // 4. Mükerrer dersi sil
        this.data.dersler = (this.data.dersler || []).filter(d => String(d.id) !== String(mDers.id));

        raporDetay.push({
          silinenDers: mDers.ad,
          anaDers: anaDers.ad,
          tasinanKonular: tasinanBuDersten
        });
      });
    });

    this.save();
    return {
      birlestirilenDersSayisi,
      tasinanKonuSayisi,
      detay: raporDetay
    };
  },

  // G11: Deneme sınavlarından ve analizlerden gelen konu ve MEB kazanım cümlelerini müfredat havuzunda akıllı eşleştir
  findMatchingKonu(dersIdOrName, konuOrKazanimText) {
    if (!konuOrKazanimText) return null;
    const norm = s => (s || '').toString().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    const targetClean = norm(konuOrKazanimText.replace(/\.+$/, ''));
    if (!targetClean) return null;

    let candidateKonular = (this.getKonular() || []).filter(k => !(k.aciklama && k.aciklama.includes('Deneme sınavından aktarıldı')));
    if (candidateKonular.length === 0) {
      candidateKonular = this.getKonular() || [];
    }
    if (dersIdOrName) {
      const dClean = norm(dersIdOrName);
      const matchedDers = (this.getDersler() || []).find(d => {
        const nd = norm(d.ad);
        return String(d.id) === String(dersIdOrName) ||
          nd === dClean ||
          nd.includes(dClean) ||
          dClean.includes(nd) ||
          (dClean.includes('sosyal') && nd.includes('inkilap')) ||
          (dClean.includes('fen') && nd.includes('fen')) ||
          (dClean.includes('din') && nd.includes('din')) ||
          (dClean.includes('ingilizce') && nd.includes('ingilizce'));
      });
      if (matchedDers) {
        candidateKonular = candidateKonular.filter(k => String(k.dersId) === String(matchedDers.id));
      }
    }

    // 1. Kazanımlar listesi (kazanimlar dizisi) içerisindeki resmi MEB/ÖSYM kazanım cümleleri ile eşleşme
    let match = candidateKonular.find(k => {
      if (!Array.isArray(k.kazanimlar) || k.kazanimlar.length === 0) return false;
      return k.kazanimlar.some(kaz => {
        const kazClean = norm(kaz);
        return kazClean === targetClean ||
               kazClean.includes(targetClean) ||
               targetClean.includes(kazClean);
      });
    });
    if (match) return match;

    // 2. Doğrudan konuAdi eşleşmesi (tam veya kapsayan)
    match = candidateKonular.find(k => {
      const kClean = norm(k.konuAdi);
      return kClean === targetClean || kClean.includes(targetClean) || targetClean.includes(kClean);
    });
    if (match) return match;

    // 3. Kelime bazlı akıllı eşleşme (özellikle '...' ile kesilmiş deneme metinleri için)
    const targetWords = konuOrKazanimText.toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    if (targetWords.length >= 2) {
      let bestScore = 0;
      let bestKonu = null;

      candidateKonular.forEach(k => {
        const fullTopicText = [k.konuAdi, ...(k.kazanimlar || []), k.aciklama || ''].join(' ').toLowerCase();
        let score = 0;
        targetWords.forEach(w => {
          if (fullTopicText.includes(w)) score++;
        });
        if (score > bestScore && score >= 2) {
          bestScore = score;
          bestKonu = k;
        }
      });

      if (bestKonu) return bestKonu;
    }

    // 4. Eğer ders filtresiyle bulunamadıysa, tüm havuzdaki konularda kazanımlara bak
    if (candidateKonular.length < (this.getKonular() || []).length) {
      const allKonular = this.getKonular() || [];
      match = allKonular.find(k => {
        if (!Array.isArray(k.kazanimlar)) return false;
        return k.kazanimlar.some(kaz => {
          const kazClean = norm(kaz);
          return kazClean.includes(targetClean) || targetClean.includes(kazClean);
        });
      });
      if (match) return match;
    }

    return null;
  },

  clearKonularForDers(dersId) {
    if (!dersId) return;
    const targetId = String(dersId);
    this.data.konular = (this.data.konular || []).filter(k => String(k.dersId) !== targetId);
    if (Array.isArray(this.data.ogrenciKonuDurumlari)) {
      this.data.ogrenciKonuDurumlari = this.data.ogrenciKonuDurumlari.filter(kd => {
        const konu = this.getKonu(kd.konuId);
        return !konu || String(konu.dersId) !== targetId;
      });
    }
    this.save();
  },

  getDerslerForOgrenci(ogrenci) {
    if (!ogrenci) return [];
    const dersler = this.getDersler();

    return dersler.filter(ders => {
      if (ders.modulId !== ogrenci.modulId) return false;
      return ders.sinif === String(ogrenci.sinif) || ders.sinif === 'ortak' || !ders.sinif;
    });
  },

  getModulForOgrenci(ogrenci) {
    if (!ogrenci || typeof MODULLER === 'undefined') return null;
    return MODULLER.find(m => m.id === ogrenci.modulId) || null;
  },

  // ─────────────────────────────────────────────────────────────
  // G1: ALIŞKANLIK ZİNCİRİ METODLARI
  // ─────────────────────────────────────────────────────────────
  getDefaultAliskanliklar(modulId) {
    if (modulId === 'ara-sinif') {
      return [
        { id: 'al-1', baslik: 'Günlük 20 dk okuma / kitap',      renk: 'blue'    },
        { id: 'al-2', baslik: 'Matematik alıştırması (10 soru)', renk: 'indigo'  },
        { id: 'al-3', baslik: 'İngilizce kelime kartı (5 kart)', renk: 'purple'  },
        { id: 'al-4', baslik: 'Ders özetini gözden geçir',       renk: 'teal'    },
        { id: 'al-5', baslik: 'Günlük ödev tamamlama',           renk: 'emerald' },
        { id: 'al-6', baslik: 'Okumadan önce su iç / mola',      renk: 'sky'     }
      ];
    } else if (modulId === 'yks') {
      return [
        { id: 'al-1', baslik: 'TYT sorusu (40 soru)',              renk: 'rose'    },
        { id: 'al-2', baslik: 'AYT konu çalışması (1 konu)',       renk: 'blue'    },
        { id: 'al-3', baslik: 'Net takibi & hata analizi',         renk: 'amber'   },
        { id: 'al-4', baslik: 'Deneme sonucu konu haritası',       renk: 'emerald' },
        { id: 'al-5', baslik: 'Yanlış soru tekrarı',               renk: 'purple'  },
        { id: 'al-6', baslik: 'Motivasyon & günlük hedef yazma',   renk: 'teal'    }
      ];
    } else {
      // Varsayılan: lgs
      return [
        { id: 'al-1', baslik: 'Paragraf sorusu (5 paragraf)',       renk: 'rose'    },
        { id: 'al-2', baslik: 'Matematik yeni nesil soru (10 S)',   renk: 'blue'    },
        { id: 'al-3', baslik: 'Fen / sözel deneme sorusu (20 S)',   renk: 'emerald' },
        { id: 'al-4', baslik: 'Hata defterini gözden geçir',        renk: 'amber'   },
        { id: 'al-5', baslik: 'Haftalık deneme analizi',            renk: 'indigo'  },
        { id: 'al-6', baslik: 'Gece ders tekrarı (15 dk)',          renk: 'purple'  }
      ];
    }
  },

  getAliskanliklar(ogrenciId) {
    if (!ogrenciId) return this.getDefaultAliskanliklar('lgs');
    if (!this.data.aliskanlikZincirleri) this.data.aliskanlikZincirleri = {};
    if (this.data.aliskanlikZincirleri[ogrenciId] && Array.isArray(this.data.aliskanlikZincirleri[ogrenciId]) && this.data.aliskanlikZincirleri[ogrenciId].length > 0) {
      return this.data.aliskanlikZincirleri[ogrenciId];
    }
    const ogr = this.getOgrenci(ogrenciId);
    const modulId = ogr ? (ogr.modulId || 'lgs') : 'lgs';
    const varsayilan = JSON.parse(JSON.stringify(this.getDefaultAliskanliklar(modulId)));
    this.data.aliskanlikZincirleri[ogrenciId] = varsayilan;
    this.save();
    return varsayilan;
  },

  saveAliskanliklar(ogrenciId, liste) {
    if (!ogrenciId) return;
    if (!this.data.aliskanlikZincirleri) this.data.aliskanlikZincirleri = {};
    this.data.aliskanlikZincirleri[ogrenciId] = liste;
    this.save();
  },

  getAliskanlikDurum(ogrenciId, aliskanlikId, tarihStr) {
    if (!this.data.calismaKayitlari) return false;
    return this.data.calismaKayitlari.some(k => 
      String(k.ogrenciId) === String(ogrenciId) &&
      k.tur === 'aliskanlik' &&
      String(k.aliskanlikId) === String(aliskanlikId) &&
      k.tarih === tarihStr &&
      k.tamamlandi
    );
  },

  toggleAliskanlikGun(ogrenciId, aliskanlikId, tarihStr) {
    if (!ogrenciId || !aliskanlikId || !tarihStr) return false;
    if (!this.data.calismaKayitlari) this.data.calismaKayitlari = [];
    const idx = this.data.calismaKayitlari.findIndex(k => 
      String(k.ogrenciId) === String(ogrenciId) &&
      k.tur === 'aliskanlik' &&
      String(k.aliskanlikId) === String(aliskanlikId) &&
      k.tarih === tarihStr
    );
    let newState = false;
    if (idx >= 0) {
      this.data.calismaKayitlari.splice(idx, 1);
      newState = false;
    } else {
      this.data.calismaKayitlari.push({
        id: 'cal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        ogrenciId,
        tur: 'aliskanlik',
        aliskanlikId,
        tarih: tarihStr,
        tamamlandi: true
      });
      newState = true;
    }
    this.save();
    return newState;
  },

  getAliskanlikAySonu(ogrenciId, aliskanlikId, yilAyStr) {
    if (!ogrenciId || !aliskanlikId || !yilAyStr) return null;
    if (!this.data.aliskanlikAySonu) this.data.aliskanlikAySonu = {};
    const key = `${ogrenciId}_${aliskanlikId}_${yilAyStr}`;
    return this.data.aliskanlikAySonu[key] || null;
  },

  saveAliskanlikAySonu(ogrenciId, aliskanlikId, yilAyStr, veri, autoSyncTable = true) {
    if (!ogrenciId || !aliskanlikId || !yilAyStr) return null;
    if (!this.data.aliskanlikAySonu) this.data.aliskanlikAySonu = {};
    const key = `${ogrenciId}_${aliskanlikId}_${yilAyStr}`;
    const prev = this.data.aliskanlikAySonu[key] || {};
    const updated = {
      ...prev,
      ...veri,
      updatedAt: new Date().toISOString()
    };
    this.data.aliskanlikAySonu[key] = updated;

    if (veri.gun !== undefined && autoSyncTable) {
      const gunSayisi = Math.max(0, parseInt(veri.gun, 10) || 0);
      this.syncAliskanlikTableDays(ogrenciId, aliskanlikId, yilAyStr, gunSayisi);
    }

    this.save();
    return updated;
  },

  syncAliskanlikTableDays(ogrenciId, aliskanlikId, yilAyStr, gunSayisi) {
    if (!ogrenciId || !aliskanlikId || !yilAyStr) return;
    if (!this.data.calismaKayitlari) this.data.calismaKayitlari = [];

    const parts = yilAyStr.split('-');
    const yil = parseInt(parts[0], 10);
    const ay = parseInt(parts[1], 10);
    const daysInMonth = new Date(yil, ay, 0).getDate();

    // Bu ay ve bu alışkanlığa ait mevcut kayıtları filtrele
    this.data.calismaKayitlari = this.data.calismaKayitlari.filter(k => {
      if (String(k.ogrenciId) === String(ogrenciId) &&
          k.tur === 'aliskanlik' &&
          String(k.aliskanlikId) === String(aliskanlikId) &&
          k.tarih && k.tarih.startsWith(yilAyStr)) {
        return false;
      }
      return true;
    });

    // İlk `gunSayisi` kadar günü tamamlandı olarak ekle
    const count = Math.min(gunSayisi, daysInMonth);
    for (let d = 1; d <= count; d++) {
      const tarihStr = `${yil}-${String(ay).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.data.calismaKayitlari.push({
        id: 'cal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) + '-' + d,
        ogrenciId,
        tur: 'aliskanlik',
        aliskanlikId,
        tarih: tarihStr,
        tamamlandi: true
      });
    }
  },

  getAliskanlikNot(ogrenciId, yilAyStr) {
    if (!ogrenciId || !yilAyStr) return '';
    if (!this.data.aliskanlikNotlari) this.data.aliskanlikNotlari = {};
    return this.data.aliskanlikNotlari[`${ogrenciId}_${yilAyStr}`] || '';
  },

  saveAliskanlikNot(ogrenciId, yilAyStr, metin) {
    if (!ogrenciId || !yilAyStr) return;
    if (!this.data.aliskanlikNotlari) this.data.aliskanlikNotlari = {};
    this.data.aliskanlikNotlari[`${ogrenciId}_${yilAyStr}`] = metin || '';
    this.save();
  },

  clearAliskanlikAySonu(ogrenciId, yilAyStr) {
    if (!ogrenciId || !yilAyStr) return;
    if (this.data.aliskanlikAySonu) {
      Object.keys(this.data.aliskanlikAySonu).forEach(k => {
        if (k.startsWith(`${ogrenciId}_`) && k.endsWith(`_${yilAyStr}`)) {
          delete this.data.aliskanlikAySonu[k];
        }
      });
    }
    if (this.data.calismaKayitlari) {
      this.data.calismaKayitlari = this.data.calismaKayitlari.filter(k => {
        if (String(k.ogrenciId) === String(ogrenciId) &&
            k.tur === 'aliskanlik' &&
            k.tarih && k.tarih.startsWith(yilAyStr)) {
          return false;
        }
        return true;
      });
    }
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // G1: ZAMAN BLOKLAMA METODLARI
  // ─────────────────────────────────────────────────────────────
  getZamanPlani(ogrenciId) {
    if (!ogrenciId) return {};
    if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
    return this.data.zamanPlanlari[ogrenciId] || {};
  },

  saveZamanHucresi(ogrenciId, gun, saat, veri) {
    if (!ogrenciId) return;
    if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
    if (!this.data.zamanPlanlari[ogrenciId]) this.data.zamanPlanlari[ogrenciId] = {};
    const key = `${gun}_${saat}`;
    this.data.zamanPlanlari[ogrenciId][key] = veri;
    this.save();
  },

  deleteZamanHucresi(ogrenciId, gun, saat) {
    if (!ogrenciId) return;
    if (!this.data.zamanPlanlari || !this.data.zamanPlanlari[ogrenciId]) return;
    const key = `${gun}_${saat}`;
    delete this.data.zamanPlanlari[ogrenciId][key];
    this.save();
  },

  resetZamanPlani(ogrenciId) {
    if (!ogrenciId) return;
    if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
    this.data.zamanPlanlari[ogrenciId] = {};
    this.save();
  },

  saveZamanHucresiBatch(ogrenciId, toSave = [], toDelete = []) {
    if (!ogrenciId) return;
    if (!this.data.zamanPlanlari) this.data.zamanPlanlari = {};
    if (!this.data.zamanPlanlari[ogrenciId]) this.data.zamanPlanlari[ogrenciId] = {};

    toDelete.forEach(({ gun, saat }) => {
      const key = `${gun}_${saat}`;
      delete this.data.zamanPlanlari[ogrenciId][key];
    });

    toSave.forEach(({ gun, saat, veri }) => {
      const key = `${gun}_${saat}`;
      this.data.zamanPlanlari[ogrenciId][key] = veri;
    });

    this.save();
  },

  getZamanAyarlari(ogrenciId) {
    if (!this.data.zamanAyarlari) this.data.zamanAyarlari = {};
    const defaultSettings = (this.data.genelZamanAyarlari && this.data.genelZamanAyarlari.baslangicSaat) 
      ? this.data.genelZamanAyarlari 
      : { baslangicSaat: '06:00', bitisSaat: '24:00' };
    if (!ogrenciId) return Object.assign({}, defaultSettings);
    return Object.assign({}, defaultSettings, this.data.zamanAyarlari[ogrenciId] || {});
  },

  saveZamanAyarlari(ogrenciId, ayarlar) {
    if (!this.data.zamanAyarlari) this.data.zamanAyarlari = {};
    if (!this.data.genelZamanAyarlari) this.data.genelZamanAyarlari = { baslangicSaat: '06:00', bitisSaat: '24:00' };
    
    this.data.genelZamanAyarlari = Object.assign({}, this.data.genelZamanAyarlari, ayarlar);
    if (ogrenciId) {
      this.data.zamanAyarlari[ogrenciId] = Object.assign({}, this.data.zamanAyarlari[ogrenciId] || {}, ayarlar);
    }
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // G1: KONU & SORU ÇİZELGESİ METODLARI
  // ─────────────────────────────────────────────────────────────
  getKonuSoruVeri(ogrenciId, konuId, haftaIndex, yilAyStr) {
    if (!this.data.konuSoruKayitlari) this.data.konuSoruKayitlari = {};
    const key = `${ogrenciId}_${konuId}_${yilAyStr}_hf${haftaIndex}`;
    return this.data.konuSoruKayitlari[key] || { d: 0, y: 0, b: 0, s: 0 };
  },

  saveKonuSoruVeri(ogrenciId, konuId, haftaIndex, yilAyStr, veri) {
    if (!this.data.konuSoruKayitlari) this.data.konuSoruKayitlari = {};
    const key = `${ogrenciId}_${konuId}_${yilAyStr}_hf${haftaIndex}`;
    const d = Number(veri.d) || 0;
    const y = Number(veri.y) || 0;
    const b = Number(veri.b) || 0;
    const s = (veri.s !== undefined && veri.s !== null && veri.s !== '') ? Number(veri.s) : (d + y + b);
    this.data.konuSoruKayitlari[key] = { d, y, b, s };
    this.save();
  },

  saveKonuSoruHucre(ogrenciId, konuId, turNo, yilAyStr, alan, deger) {
    if (!ogrenciId || !konuId || !yilAyStr) return;
    if (!this.data.konuSoruKayitlari) this.data.konuSoruKayitlari = {};
    const key = `${ogrenciId}_${konuId}_${yilAyStr}_hf${turNo}`;
    const prev = this.data.konuSoruKayitlari[key] || { d: 0, y: 0, b: 0, s: 0 };
    const num = (deger === '' || deger === null || isNaN(Number(deger))) ? 0 : Math.max(0, parseInt(deger, 10));
    prev[alan] = num;
    if (alan === 'd' || alan === 'y' || alan === 'b') {
      if (!prev.sManual) {
        prev.s = (prev.d || 0) + (prev.y || 0) + (prev.b || 0);
      }
    } else if (alan === 's') {
      prev.sManual = true;
    }
    this.data.konuSoruKayitlari[key] = prev;
    this.save();
    return prev;
  },

  getKonuTakipNot(ogrenciId, dersId) {
    if (!this.data.cizelgeNotlari) this.data.cizelgeNotlari = {};
    return this.data.cizelgeNotlari[`${ogrenciId}_${dersId}`] || '';
  },

  saveKonuTakipNot(ogrenciId, dersId, metin) {
    if (!this.data.cizelgeNotlari) this.data.cizelgeNotlari = {};
    this.data.cizelgeNotlari[`${ogrenciId}_${dersId}`] = metin || '';
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // G2: SINAV HAVUZU METODLARI
  // ─────────────────────────────────────────────────────────────
  getSinavlar(modulId = null) {
    if (!Array.isArray(this.data.sinavlar) || this.data.sinavlar.length === 0) {
      this.data.sinavlar = (typeof SINAV_SEED !== 'undefined') ? JSON.parse(JSON.stringify(SINAV_SEED)) : [];
    }
    if (!modulId) return this.data.sinavlar;
    return this.data.sinavlar.filter(s => s.modulId === modulId);
  },

  getSinav(id) {
    return (this.data.sinavlar || []).find(s => String(s.id) === String(id)) || null;
  },

  addSinav(veri) {
    if (!Array.isArray(this.data.sinavlar)) {
      this.data.sinavlar = [];
    }
    const id = `sinav-${Date.now()}`;
    const yeni = {
      id,
      modulId: veri.modulId || 'lgs',
      ad: veri.ad || 'Yeni Sınav',
      kisaltma: (veri.kisaltma || 'SNV').toUpperCase().slice(0, 8),
      oturum: veri.oturum || '',
      soruSayisi: Number(veri.soruSayisi) || 0,
      sureDk: Number(veri.sureDk) || 0,
      hedefSinif: veri.hedefSinif || (veri.modulId === 'lgs' ? '8. Sınıf' : '12. Sınıf & Mezun'),
      aciklama: veri.aciklama || ''
    };
    this.data.sinavlar.push(yeni);
    this.save();
    return yeni;
  },

  resetSinavlarToSeed() {
    this.data.sinavlar = this.getSeedSinavlar();
    this.save();
    return this.data.sinavlar;
  },

  updateSinav(id, updates) {
    const list = this.data.sinavlar || [];
    const idx = list.findIndex(s => String(s.id) === String(id));
    if (idx === -1) return null;
    if (updates.kisaltma) {
      updates.kisaltma = updates.kisaltma.trim().toUpperCase().slice(0, 8);
    }
    if (updates.soruSayisi !== undefined) {
      updates.soruSayisi = Number(updates.soruSayisi) || 0;
    }
    if (updates.sureDk !== undefined) {
      updates.sureDk = Number(updates.sureDk) || 0;
    }
    const guncel = Object.assign({}, list[idx], updates);
    this.data.sinavlar[idx] = guncel;
    this.save();
    return guncel;
  },

  deleteSinav(id) {
    this.data.sinavlar = (this.data.sinavlar || []).filter(s => String(s.id) !== String(id));
    this.save();
  },

  // ─────────────────────────────────────────────────────────────
  // G8: DENEME SINAVI RAPORLARI METODLARI
  // ─────────────────────────────────────────────────────────────
  getDenemeSinavlari(ogrenciId = null) {
    if (!Array.isArray(this.data.denemeSinavlari)) {
      this.data.denemeSinavlari = [];
    }
    if (!ogrenciId) return this.data.denemeSinavlari;
    return this.data.denemeSinavlari.filter(d => String(d.ogrenciId) === String(ogrenciId));
  },

  getDenemeSinavi(id) {
    return (this.data.denemeSinavlari || []).find(d => String(d.id) === String(id)) || null;
  },

  addDenemeSinavi(veri) {
    if (!Array.isArray(this.data.denemeSinavlari)) {
      this.data.denemeSinavlari = [];
    }
    const id = veri.id || `deneme-${Date.now()}`;
    const yeni = Object.assign({}, veri, {
      id,
      olusturmaTarihi: veri.olusturmaTarihi || new Date().toISOString()
    });
    this.data.denemeSinavlari.unshift(yeni);
    this.save();
    return yeni;
  },

  deleteDenemeSinavi(id) {
    this.data.denemeSinavlari = (this.data.denemeSinavlari || []).filter(d => String(d.id) !== String(id));
    this.save();
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
  },

  // ─────────────────────────────────────────────────────────────
  // G2: DERSLER EXCEL İÇE / DIŞA AKTARIM
  // ─────────────────────────────────────────────────────────────
  derslerSablonIndir() {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS (XLSX) kütüphanesi yüklenemedi.');
      return;
    }

    const sutunlar = (typeof EXCEL_DERS_SABLONU !== 'undefined') ? EXCEL_DERS_SABLONU.sutunlar : [];
    const baslikSatiri = sutunlar.map(s => s.label);
    const aciklamaSatiri = sutunlar.map(s => `(${s.aciklama})`);
    const ornekSatir = sutunlar.map(s => EXCEL_DERS_SABLONU.ornekSatir[s.key] || '');

    const wsData = [
      baslikSatiri,
      aciklamaSatiri,
      ornekSatir
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = sutunlar.map(s => ({ wch: Math.max(s.label.length, s.aciklama.length, 16) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ders Şablonu');
    XLSX.writeFile(wb, 'plantrack_ders_sablonu.xlsx');
  },

  derslerDisaAktar(modulId = null) {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS kütüphanesi bulunamadı');
      return;
    }

    let dersler = Store.getDersler();
    if (modulId) {
      dersler = dersler.filter(d => d.modulId === modulId);
    }

    const sutunlar = (typeof EXCEL_DERS_SABLONU !== 'undefined') ? EXCEL_DERS_SABLONU.sutunlar : [];
    const baslikSatiri = sutunlar.map(s => s.label);

    const rows = [baslikSatiri];
    dersler.forEach(d => {
      rows.push([
        d.ad,
        d.kisaltma || '',
        d.modulId,
        d.sinif || 'ortak',
        (d.haftalikSaat !== undefined && d.haftalikSaat !== null) ? d.haftalikSaat : '',
        d.sinavdaMi ? 'evet' : 'hayır',
        d.soruSayisi || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = sutunlar.map(s => ({ wch: 18 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dersler');

    const bugunStr = new Date().toISOString().split('T')[0];
    const modulStr = modulId || 'tumu';
    XLSX.writeFile(wb, `plantrack_dersler_${modulStr}_${bugunStr}.xlsx`);
  },

  derslerIceAktar(file, onSonuc) {
    if (typeof XLSX === 'undefined') {
      if (onSonuc) onSonuc({ eklenen: 0, guncellenen: 0, atlanan: 0, hatali: [{ satir: 0, sebep: 'SheetJS kütüphanesi bulunamadı' }], satirlar: [] });
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

        const hatali = [];
        const incelenenSatirlar = [];

        const gecerliModuller = (typeof MODULLER !== 'undefined') ? MODULLER.map(m => m.id) : ['ara-sinif', 'lgs', 'yks'];
        const gecerliSiniflar = (typeof SINIFLAR !== 'undefined') ? SINIFLAR.map(s => String(s.deger)) : ['5', '6', '7', '8', '9', '10', '11', '12', 'mezun'];

        // Satır 1: Başlık, Satır 2: Açıklama -> İndeks 2'den itibaren veri
        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          const satirNo = i + 1;
          if (!row || row.length === 0 || row.every(c => c === null || c === undefined || String(c).trim() === '')) continue;

          const ad = row[0] ? String(row[0]).trim() : '';
          const kisaltma = row[1] ? String(row[1]).trim().toUpperCase() : '';
          const modulId = row[2] ? String(row[2]).trim().toLowerCase() : '';
          let sinifHam = row[3] ? String(row[3]).trim().toLowerCase().replace('.sınıf', '').replace('.', '').trim() : '';
          const haftalikSaat = row[4] ? Number(row[4]) || 0 : 0;
          const sinavdaMiStr = row[5] ? String(row[5]).trim().toLowerCase() : 'hayır';
          const soruSayisi = row[6] ? Number(row[6]) || 0 : 0;

          if (!ad) {
            hatali.push({ satir: satirNo, sebep: 'Ders adı boş bırakılamaz.' });
            continue;
          }
          if (!kisaltma || kisaltma.length > 5) {
            hatali.push({ satir: satirNo, sebep: 'Kısaltma boş olamaz ve 5 karakterden uzun olamaz.' });
            continue;
          }
          if (!gecerliModuller.includes(modulId)) {
            hatali.push({ satir: satirNo, sebep: `Geçersiz modül: "${modulId}". (ara-sinif, lgs veya yks olmalıdır)` });
            continue;
          }
          if (sinifHam !== 'ortak' && !gecerliSiniflar.includes(sinifHam)) {
            hatali.push({ satir: satirNo, sebep: `Geçersiz sınıf: "${row[3]}". (5-12, mezun veya ortak olmalıdır)` });
            continue;
          }

          const sinavdaMi = ['evet', 'true', '1', 'e'].includes(sinavdaMiStr);

          // Mevcut kontrolü
          const mevcut = Store.getDersler().find(d => 
            d.ad.toLowerCase() === ad.toLowerCase() && 
            d.modulId === modulId && 
            String(d.sinif).toLowerCase() === sinifHam.toLowerCase()
          );

          const detected = Store.detectDersIkonVeRenk(ad, kisaltma);

          incelenenSatirlar.push({
            satir: satirNo,
            mevcutId: mevcut ? mevcut.id : null,
            durum: mevcut ? 'guncellenecek' : 'eklenecek',
            veri: {
              ad,
              kisaltma,
              modulId,
              sinif: sinifHam,
              haftalikSaat,
              sinavdaMi,
              soruSayisi,
              ikon: (mevcut && mevcut.ikon && mevcut.ikon !== 'book') ? mevcut.ikon : detected.ikon,
              renk: (mevcut && mevcut.renk && mevcut.renk !== 'blue') ? mevcut.renk : detected.renk
            }
          });
        }

        const eklenenSayisi = incelenenSatirlar.filter(s => s.durum === 'eklenecek').length;
        const guncellenecekSayisi = incelenenSatirlar.filter(s => s.durum === 'guncellenecek').length;

        if (onSonuc) {
          onSonuc({
            eklenen: eklenenSayisi,
            guncellenen: guncellenecekSayisi,
            atlanan: 0,
            hatali,
            satirlar: incelenenSatirlar
          });
        }
      } catch (err) {
        console.error('Excel ayrıştırma hatası:', err);
        if (onSonuc) {
          onSonuc({
            eklenen: 0,
            guncellenen: 0,
            atlanan: 0,
            hatali: [{ satir: 0, sebep: `Dosya okunamadı: ${err.message}` }],
            satirlar: []
          });
        }
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // ─────────────────────────────────────────────────────────────
  // KAYNAKLAR EXCEL İÇE / DIŞA AKTARIM
  // ─────────────────────────────────────────────────────────────
  kaynaklarSablonIndir() {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS (XLSX) kütüphanesi yüklenemedi.');
      return;
    }

    const sutunlar = (typeof EXCEL_KAYNAK_SABLONU !== 'undefined') ? EXCEL_KAYNAK_SABLONU.sutunlar : [];
    const baslikSatiri = sutunlar.map(s => s.label);
    const aciklamaSatiri = sutunlar.map(s => `(${s.aciklama})`);
    const ornekSatir = sutunlar.map(s => EXCEL_KAYNAK_SABLONU.ornekSatir[s.key] || '');

    const wsData = [
      baslikSatiri,
      aciklamaSatiri,
      ornekSatir
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = sutunlar.map(s => ({ wch: Math.max(s.label.length, s.aciklama.length, 16) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kaynak Şablonu');
    XLSX.writeFile(wb, 'plantrack_kaynak_sablonu.xlsx');
  },

  kaynaklarDisaAktar(modulFilter = null) {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS kütüphanesi bulunamadı');
      return;
    }

    let kaynaklar = Store.getKaynaklar();
    if (modulFilter) {
      kaynaklar = kaynaklar.filter(k => {
        const kMods = Array.isArray(k.modulId) ? k.modulId : [k.modulId];
        return kMods.includes(modulFilter);
      });
    }

    const sutunlar = (typeof EXCEL_KAYNAK_SABLONU !== 'undefined') ? EXCEL_KAYNAK_SABLONU.sutunlar : [];
    const baslikSatiri = sutunlar.map(s => s.label);

    const rows = [baslikSatiri];
    kaynaklar.forEach(k => {
      const kMods = Array.isArray(k.modulId) ? k.modulId.join(', ') : (k.modulId || 'yks');
      rows.push([
        k.ad || '',
        k.yayinevi || '',
        k.tur || 'Soru Bankası',
        kMods,
        k.zorluk || 3,
        k.aciklama || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = sutunlar.map(s => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kaynaklar');

    const bugunStr = new Date().toISOString().split('T')[0];
    const modulStr = modulFilter || 'tumu';
    XLSX.writeFile(wb, `plantrack_kaynaklar_${modulStr}_${bugunStr}.xlsx`);
  },

  kaynaklarIceAktar(file, onSonuc) {
    if (typeof XLSX === 'undefined') {
      if (onSonuc) onSonuc({ eklenen: 0, guncellenen: 0, atlanan: 0, hatali: [{ satir: 0, sebep: 'SheetJS kütüphanesi bulunamadı' }], satirlar: [] });
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

        const hatali = [];
        const incelenenSatirlar = [];

        // Satır 1: Başlık, Satır 2: Açıklama -> İndeks 2'den itibaren veri
        for (let i = 2; i < rows.length; i++) {
          const row = rows[i];
          const satirNo = i + 1;
          if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
            continue;
          }

          const ad = row[0] ? String(row[0]).trim() : '';
          const yayinevi = row[1] ? String(row[1]).trim() : '';
          const tur = row[2] ? String(row[2]).trim() : 'Soru Bankası';
          const modulStr = row[3] ? String(row[3]).trim().toLowerCase() : '';
          const zorlukHam = row[4] ? parseInt(row[4], 10) : 3;
          const zorluk = (!isNaN(zorlukHam) && zorlukHam >= 1 && zorlukHam <= 5) ? zorlukHam : 3;
          const aciklama = row[5] ? String(row[5]).trim() : '';

          if (!ad) {
            hatali.push({ satir: satirNo, sebep: 'Kaynak adı boş olamaz.' });
            continue;
          }
          if (!yayinevi) {
            hatali.push({ satir: satirNo, sebep: 'Yayınevi boş olamaz.' });
            continue;
          }

          // Modülleri parse et
          let modulList = [];
          if (modulStr) {
            const rawParts = modulStr.split(/[,;/+]+/).map(p => p.trim());
            rawParts.forEach(p => {
              if (['ara-sinif', 'ara', 'ara sinif', 'ara sınıf'].includes(p)) modulList.push('ara-sinif');
              else if (['lgs', 'lgs hazirlik', 'lgs hazırlık'].includes(p)) modulList.push('lgs');
              else if (['yks', 'tyt', 'ayt', 'tyt-ayt'].includes(p)) modulList.push('yks');
            });
          }
          if (modulList.length === 0) {
            modulList = ['yks'];
          }

          // Mevcut kaynak kontrolü (aynı ad ve aynı yayınevi)
          const mevcutKaynak = Store.getKaynaklar().find(
            k => k.ad.toLowerCase() === ad.toLowerCase() && (k.yayinevi || '').toLowerCase() === yayinevi.toLowerCase()
          );

          incelenenSatirlar.push({
            satir: satirNo,
            durum: mevcutKaynak ? 'guncellenecek' : 'eklenecek',
            mevcutId: mevcutKaynak ? mevcutKaynak.id : null,
            veri: {
              ad,
              yayinevi,
              tur,
              modulId: modulList,
              zorluk,
              aciklama
            }
          });
        }

        const eklenenSayisi = incelenenSatirlar.filter(s => s.durum === 'eklenecek').length;
        const guncellenecekSayisi = incelenenSatirlar.filter(s => s.durum === 'guncellenecek').length;

        if (onSonuc) {
          onSonuc({
            eklenen: eklenenSayisi,
            guncellenen: guncellenecekSayisi,
            atlanan: 0,
            hatali,
            satirlar: incelenenSatirlar
          });
        }
      } catch (err) {
        console.error('Excel kaynak ayrıştırma hatası:', err);
        if (onSonuc) {
          onSonuc({
            eklenen: 0,
            guncellenen: 0,
            atlanan: 0,
            hatali: [{ satir: 0, sebep: `Dosya okunamadı: ${err.message}` }],
            satirlar: []
          });
        }
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // ─────────────────────────────────────────────────────────────
  // KONULAR EXCEL İÇE / DIŞA AKTARIM
  // ─────────────────────────────────────────────────────────────
  konularSablonIndir(seciliDersId = null) {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS (XLSX) kütüphanesi yüklenemedi.');
      return;
    }

    const seciliDers = seciliDersId ? Store.getDers(seciliDersId) : null;
    const dersAdi = seciliDers ? seciliDers.ad : 'Matematik';

    const sutunlar = (typeof EXCEL_KONU_SABLONU !== 'undefined') ? EXCEL_KONU_SABLONU.sutunlar : [
      { key: 'dersAdi',     label: 'Ders Adı',           zorunlu: true,  aciklama: 'Örn: Matematik' },
      { key: 'uniteNo',     label: 'Ünite No',           zorunlu: true,  aciklama: 'Sayı, örn: 1' },
      { key: 'uniteAdi',    label: 'Ünite Adı',          zorunlu: true,  aciklama: 'Örn: Doğal Sayılar' },
      { key: 'siraNo',      label: 'Sıra No',            zorunlu: false, aciklama: 'Sayı, örn: 1' },
      { key: 'konuAdi',     label: 'Konu / Kazanım Adı', zorunlu: true,  aciklama: 'Örn: Dört İşlem' },
      { key: 'aciklama',    label: 'Açıklama / Detay',   zorunlu: false, aciklama: 'Konu açıklaması veya kazanım' }
    ];

    const baslikSatiri = sutunlar.map(s => s.label);
    const aciklamaSatiri = sutunlar.map(s => `(${s.aciklama})`);
    const ornekSatir = [
      dersAdi,
      '1',
      '1. Ünite',
      '1',
      'Örnek Konu Başlığı',
      'Temel kazanım ve konu detayları'
    ];

    const wsData = [
      baslikSatiri,
      aciklamaSatiri,
      ornekSatir
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = sutunlar.map(s => ({ wch: Math.max(s.label.length, s.aciklama.length, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Konu Şablonu');
    XLSX.writeFile(wb, 'plantrack_konu_sablonu.xlsx');
  },

  konularDisaAktar(dersId = null, modulId = null) {
    if (typeof XLSX === 'undefined') {
      console.error('SheetJS kütüphanesi bulunamadı');
      return;
    }

    let konular = Store.getKonular();
    const dersler = Store.getDersler();
    const dersMap = new Map(dersler.map(d => [String(d.id), d]));

    if (dersId) {
      konular = konular.filter(k => String(k.dersId) === String(dersId));
    } else if (modulId) {
      konular = konular.filter(k => {
        const d = dersMap.get(String(k.dersId));
        return d && d.modulId === modulId;
      });
    }

    // Sıralama: Ders Adı, Ünite No, Sıra No
    konular.sort((a, b) => {
      const da = dersMap.get(String(a.dersId))?.ad || '';
      const db = dersMap.get(String(b.dersId))?.ad || '';
      if (da !== db) return da.localeCompare(db, 'tr');
      if (Number(a.uniteNo) !== Number(b.uniteNo)) return Number(a.uniteNo) - Number(b.uniteNo);
      return (Number(a.siraNo) || 1) - (Number(b.siraNo) || 1);
    });

    const sutunlar = [
      'Ders Adı',
      'Ünite No',
      'Ünite Adı',
      'Sıra No',
      'Konu / Kazanım Adı',
      'Açıklama / Detay'
    ];

    const rows = [sutunlar];
    konular.forEach(k => {
      const d = dersMap.get(String(k.dersId));
      rows.push([
        d ? d.ad : 'Genel',
        Number(k.uniteNo) || 1,
        k.uniteAdi || `Ünite ${k.uniteNo || 1}`,
        Number(k.siraNo) || 1,
        k.konuAdi || '',
        k.aciklama || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 22 }, // Ders Adı
      { wch: 10 }, // Ünite No
      { wch: 24 }, // Ünite Adı
      { wch: 10 }, // Sıra No
      { wch: 32 }, // Konu Adı
      { wch: 30 }  // Açıklama
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Konular');

    const bugunStr = new Date().toISOString().split('T')[0];
    const seciliDers = dersId ? dersMap.get(String(dersId)) : null;
    const dosyaAdi = seciliDers
      ? `plantrack_konular_${seciliDers.ad.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ_-]/g, '_')}_${bugunStr}.xlsx`
      : `plantrack_konular_${modulId || 'tumu'}_${bugunStr}.xlsx`;

    XLSX.writeFile(wb, dosyaAdi);
  },

  konularIceAktar(file, onSonuc, varsayilanDersId = null) {
    if (typeof XLSX === 'undefined') {
      if (onSonuc) onSonuc({ eklenen: 0, guncellenen: 0, atlanan: 0, hatali: [{ satir: 0, sebep: 'SheetJS kütüphanesi bulunamadı' }], satirlar: [], dersOzet: {} });
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

        const hatali = [];
        const incelenenSatirlar = [];

        const tumDersler = Store.getDersler();
        const varsayilanDers = varsayilanDersId ? Store.getDers(varsayilanDersId) : null;

        // Türkçe harf duyarlı temizleme ve normalizasyon fonksiyonu
        const trClean = (s) => (s || '')
          .toString()
          .trim()
          .toLocaleLowerCase('tr-TR')
          .normalize('NFC')
          .replace(/\s+/g, ' ');

        // Akıllı ders eşleştirme yardımcısı
        const findMatchingDers = (name) => {
          if (!name) return null;
          const target = trClean(name);

          // 1. Doğrudan ad veya kısaltma eşleşmesi
          let matched = tumDersler.find(d => trClean(d.ad) === target || trClean(d.kisaltma) === target);
          if (matched) return matched;

          // 2. Sınıf öneki ayıklama: örn. "5 Matematik" -> sınıf "5", saf ad "matematik"
          const numMatch = target.match(/^(\d{1,2})\.?\s*(sınıf|sinif)?\s*(.+)$/);
          if (numMatch) {
            const prefixNum = numMatch[1];
            const pureSubj = trClean(numMatch[3]);
            matched = tumDersler.find(d => 
              String(d.sinif) === prefixNum && 
              (trClean(d.ad) === pureSubj || trClean(d.kisaltma) === pureSubj || trClean(d.ad) === target)
            );
            if (matched) return matched;
          }

          // 3. LGS eşleşmesi: örn. "LGS Matematik" veya "LGS Fen Bilimleri"
          if (target.includes('lgs')) {
            const pureLgs = trClean(target.replace(/^lgs\s*/, ''));
            matched = tumDersler.find(d => 
              (d.modulId === 'lgs' || String(d.sinif) === '8') && 
              (trClean(d.ad) === pureLgs || trClean(d.kisaltma) === pureLgs || trClean(d.ad) === target)
            );
            if (matched) return matched;
          }

          // 4. YKS eşleşmesi: örn. "TYT Matematik", "AYT Fizik", "YDT İngilizce"
          if (/^(tyt|ayt|ydt)/.test(target)) {
            const pureYks = trClean(target.replace(/^(tyt|ayt|ydt)\s*/, ''));
            matched = tumDersler.find(d => 
              d.modulId === 'yks' && 
              (trClean(d.ad) === pureYks || trClean(d.kisaltma) === pureYks || trClean(d.ad) === target)
            );
            if (matched) return matched;
          }

          // 5. Ters kombinasyon kontrolü (sistemdeki ders: ad "Matematik", sınıf "5" ise "5 Matematik" ile eşleşir)
          matched = tumDersler.find(d => {
            const comb1 = trClean(`${d.sinif} ${d.ad}`);
            const comb2 = trClean(`${d.ad} ${d.sinif}`);
            return comb1 === target || comb2 === target;
          });
          if (matched) return matched;

          // 6. Eğer varsayılan ders bu isimle birebir veya kombinasyonla uyuşuyorsa
          if (varsayilanDers) {
            const vAd = trClean(varsayilanDers.ad);
            const vKis = trClean(varsayilanDers.kisaltma);
            const vComb = trClean(`${varsayilanDers.sinif} ${varsayilanDers.ad}`);
            if (vAd === target || vKis === target || vComb === target) {
              return varsayilanDers;
            }
          }

          return null;
        };

        // Bu içe aktarma partisinde oluşturulan veya eşleşen derslerin önbelleği
        const dersCache = new Map();
        tumDersler.forEach(d => {
          dersCache.set(trClean(d.ad), d);
          if (d.kisaltma) dersCache.set(trClean(d.kisaltma), d);
          if (d.sinif && d.ad) dersCache.set(trClean(`${d.sinif} ${d.ad}`), d);
        });

        // 1. indeksten başla (0. satır tablo başlığıdır)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const satirNo = i + 1;
          if (!row || row.length === 0 || row.every(c => c === null || c === undefined || String(c).trim() === '')) continue;

          let dersAdiHam = row[0] ? String(row[0]).trim() : '';
          const uniteNo = row[1] ? Number(row[1]) || 1 : 1;
          const uniteAdi = row[2] ? String(row[2]).trim() : `Ünite ${uniteNo}`;
          const siraNo = row[3] ? Number(row[3]) || 1 : 1;
          const konuAdi = row[4] ? String(row[4]).trim() : '';
          const aciklama = row[5] ? String(row[5]).trim() : '';

          // Şablon açıklama satırlarını veya yinelenen başlık satırlarını atla
          if (dersAdiHam.startsWith('(') || (row[1] && String(row[1]).trim().startsWith('(')) || trClean(dersAdiHam).includes('ders adı')) {
            continue;
          }

          if (!konuAdi) {
            hatali.push({ satir: satirNo, sebep: 'Konu / Kazanım adı boş bırakılamaz.' });
            continue;
          }

          // Ders eşleştirme
          let hedefDers = null;

          if (dersAdiHam) {
            const cleanedHam = trClean(dersAdiHam);
            if (dersCache.has(cleanedHam)) {
              hedefDers = dersCache.get(cleanedHam);
            } else {
              hedefDers = findMatchingDers(dersAdiHam);
            }

            // Sistemde henüz yoksa bu ders adına özel otomatik oluştur!
            // (Asla başka/alakasız bir varsayılan derse aktarılmaz!)
            if (!hedefDers) {
              const cleanName = dersAdiHam.trim();
              let sinif = 'ortak';
              let modulId = 'ara-sinif';

              const numMatch = cleanName.match(/^(\d{1,2})\.?\s*(sınıf|sinif)?/i);
              if (numMatch) {
                sinif = numMatch[1];
                modulId = sinif === '8' ? 'lgs' : (['12', 'mezun'].includes(sinif) ? 'yks' : 'ara-sinif');
              } else if (/lgs/i.test(cleanName)) {
                sinif = '8';
                modulId = 'lgs';
              } else if (/tyt|ayt|ydt/i.test(cleanName)) {
                sinif = '12';
                modulId = 'yks';
              }

              const detected = Store.detectDersIkonVeRenk(cleanName);

              // Akıllı kısaltma üretimi
              let kisaltma = 'DRS';
              const pMatch = cleanName.match(/^(\d{1,2})\s*(.+)$/);
              if (pMatch) {
                const s = pMatch[1];
                const rest = pMatch[2].replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/g, '').toUpperCase();
                kisaltma = (rest.slice(0, 3) + s).slice(0, 5);
              } else if (/^LGS/i.test(cleanName)) {
                const rest = cleanName.replace(/^LGS\s*/i, '').replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/g, '').toUpperCase();
                kisaltma = ('L' + rest.slice(0, 4)).slice(0, 5);
              } else if (/^TYT/i.test(cleanName)) {
                const rest = cleanName.replace(/^TYT\s*/i, '').replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/g, '').toUpperCase();
                kisaltma = ('TY' + rest.slice(0, 3)).slice(0, 5);
              } else if (/^AYT/i.test(cleanName)) {
                const rest = cleanName.replace(/^AYT\s*/i, '').replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/g, '').toUpperCase();
                kisaltma = ('AY' + rest.slice(0, 3)).slice(0, 5);
              } else if (/^YDT/i.test(cleanName)) {
                const rest = cleanName.replace(/^YDT\s*/i, '').replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/g, '').toUpperCase();
                kisaltma = ('YD' + rest.slice(0, 3)).slice(0, 5);
              } else {
                kisaltma = cleanName.replace(/[^a-zA-Z0-9çÇğĞıİöÖşŞüÜ]/g, '').slice(0, 4).toUpperCase() || 'DRS';
              }

              hedefDers = Store.addDers({
                ad: cleanName,
                kisaltma,
                modulId,
                sinif,
                renk: detected.renk,
                ikon: detected.ikon,
                haftalikSaat: 2,
                sinavdaMi: true
              });

              tumDersler.push(hedefDers);
              dersCache.set(cleanedHam, hedefDers);
              dersCache.set(trClean(hedefDers.ad), hedefDers);
              dersCache.set(trClean(hedefDers.kisaltma), hedefDers);
            }
          } else if (varsayilanDers) {
            // Ders adı sütunu satırda tamamen boş bırakılmışsa varsayılan dersi kullan
            hedefDers = varsayilanDers;
          }

          if (!hedefDers) {
            hatali.push({ satir: satirNo, sebep: 'Ders adı belirtilmemiş veya eşleşen bir ders bulunamadı.' });
            continue;
          }

          // Mevcut konu kontrolü (hem veritabanında hem de bu içe aktarım partisinde)
          const cleanKonu = trClean(konuAdi);
          const mevcutKonular = Store.getKonularForDers(hedefDers.id);
          const mevcutDb = mevcutKonular.find(k => 
            trClean(k.konuAdi) === cleanKonu &&
            Number(k.uniteNo) === Number(uniteNo)
          );

          const ayniPartideki = incelenenSatirlar.find(s => 
            String(s.veri.dersId) === String(hedefDers.id) &&
            trClean(s.veri.konuAdi) === cleanKonu &&
            Number(s.veri.uniteNo) === Number(uniteNo)
          );

          if (ayniPartideki) {
            ayniPartideki.veri.uniteAdi = uniteAdi;
            ayniPartideki.veri.siraNo = siraNo;
            ayniPartideki.veri.aciklama = aciklama;
            continue;
          }

          incelenenSatirlar.push({
            satir: satirNo,
            mevcutId: mevcutDb ? mevcutDb.id : null,
            durum: mevcutDb ? 'guncellenecek' : 'eklenecek',
            veri: {
              dersId: hedefDers.id,
              modulId: hedefDers.modulId,
              sinif: hedefDers.sinif,
              uniteNo,
              uniteAdi,
              siraNo,
              konuAdi,
              aciklama
            },
            dersAdi: hedefDers.ad
          });
        }

        const eklenenSayisi = incelenenSatirlar.filter(s => s.durum === 'eklenecek').length;
        const guncellenecekSayisi = incelenenSatirlar.filter(s => s.durum === 'guncellenecek').length;

        // Ders özet dağılımı
        const dersOzet = {};
        incelenenSatirlar.forEach(s => {
          dersOzet[s.dersAdi] = (dersOzet[s.dersAdi] || 0) + 1;
        });

        if (onSonuc) {
          onSonuc({
            eklenen: eklenenSayisi,
            guncellenen: guncellenecekSayisi,
            atlanan: 0,
            hatali,
            satirlar: incelenenSatirlar,
            dersOzet
          });
        }
      } catch (err) {
        console.error('Konular Excel ayrıştırma hatası:', err);
        if (onSonuc) {
          onSonuc({
            eklenen: 0,
            guncellenen: 0,
            atlanan: 0,
            hatali: [{ satir: 0, sebep: `Dosya okunamadı: ${err.message}` }],
            satirlar: [],
            dersOzet: {}
          });
        }
      }
    };

    reader.readAsArrayBuffer(file);
  },

  // ── G8: DENEME SINAVI OPTİK / EXCEL İÇE AKTARIM ──
  parseCSVToRows(text) {
    const lines = text.split(/\r?\n/);
    const rows = [];
    for (let line of lines) {
      if (!line.trim()) continue;
      const row = [];
      let insideQuotes = false;
      let currentCell = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuotes && line[i + 1] === '"') {
            currentCell += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          row.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      row.push(currentCell.trim());
      rows.push(row);
    }
    return rows;
  },

  cleanTr(s) {
    return (s || '').toString().trim()
      .replace(/İ/g, 'i').replace(/I/g, 'ı')
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  parseSingleExamChunk(rows) {
    const result = {
      bilgi: {},
      dersler: [],
      toplam: null,
      konular: []
    };

    let section = 'bilgi'; // 'bilgi' | 'dersler_header' | 'dersler' | 'konular_header' | 'konular'
    let dersColMap = {};
    const seenKonular = new Set();

    const parseNum = val => {
      if (val === undefined || val === null || val === '') return 0;
      const cleaned = String(val).replace('%', '').replace(',', '.').trim();
      return parseFloat(cleaned) || 0;
    };

    for (let r = 0; r < rows.length; r++) {
      const rawRow = rows[r] || [];
      const nonEmpties = rawRow.map(c => String(c !== undefined && c !== null ? c : '').trim()).filter(Boolean);
      if (nonEmpties.length === 0) continue;

      const rowClean = this.cleanTr(nonEmpties.join(' '));

      // 1. Bölüm Geçiş Kontrolleri (Öncelikli)
      if (rowClean.includes('ders bazli sonuclar') || (rowClean.startsWith('ders') && rowClean.includes('net') && rowClean.includes('dogru'))) {
        if (nonEmpties.some(c => this.cleanTr(c) === 'ders') && nonEmpties.some(c => this.cleanTr(c).includes('net'))) {
          section = 'dersler';
          dersColMap = {};
          rawRow.forEach((cell, idx) => {
            const c = this.cleanTr(cell);
            if (c === 'ders' || c.includes('ders')) dersColMap[idx] = 'ders';
            else if (c.includes('soru')) dersColMap[idx] = 'soruSayisi';
            else if (c === 'dogru' || c === 'd') dersColMap[idx] = 'dogru';
            else if (c === 'yanlis' || c === 'y') dersColMap[idx] = 'yanlis';
            else if (c === 'bos' || c === 'b') dersColMap[idx] = 'bos';
            else if (c === 'net') dersColMap[idx] = 'net';
            else if (c.includes('basari') || c.includes('%')) dersColMap[idx] = 'basariYuzde';
            else if (c.includes('kurum')) dersColMap[idx] = 'kurumNetOrt';
            else if (c.includes('sinav') || c.includes('genel')) dersColMap[idx] = 'sinavNetOrt';
          });
        } else {
          section = 'dersler_header';
        }
        continue;
      } 
      
      if (rowClean.includes('konu analizi') || (rowClean.startsWith('ders') && rowClean.includes('konu') && rowClean.includes('soru'))) {
        if (nonEmpties.some(c => this.cleanTr(c) === 'ders') && nonEmpties.some(c => this.cleanTr(c).includes('konu'))) {
          section = 'konular';
        } else {
          section = 'konular_header';
        }
        continue;
      }

      // 2. DERSLER HEADER
      if (section === 'dersler_header') {
        dersColMap = {};
        rawRow.forEach((cell, idx) => {
          const c = this.cleanTr(cell);
          if (c === 'ders' || c.includes('ders')) dersColMap[idx] = 'ders';
          else if (c.includes('soru')) dersColMap[idx] = 'soruSayisi';
          else if (c === 'dogru' || c === 'd') dersColMap[idx] = 'dogru';
          else if (c === 'yanlis' || c === 'y') dersColMap[idx] = 'yanlis';
          else if (c === 'bos' || c === 'b') dersColMap[idx] = 'bos';
          else if (c === 'net') dersColMap[idx] = 'net';
          else if (c.includes('basari') || c.includes('%')) dersColMap[idx] = 'basariYuzde';
          else if (c.includes('kurum')) dersColMap[idx] = 'kurumNetOrt';
          else if (c.includes('sinav') || c.includes('genel')) dersColMap[idx] = 'sinavNetOrt';
        });
        section = 'dersler';
        continue;
      }

      // 3. KONULAR HEADER
      if (section === 'konular_header') {
        section = 'konular';
        continue;
      }

      // 4. VERİ PARSELLEME
      if (section === 'bilgi') {
        for (let c = 0; c < rawRow.length; c++) {
          const cell = String(rawRow[c] || '').trim();
          if (!cell) continue;

          const cellClean = this.cleanTr(cell);
          if (cellClean.includes('ogrenci bilgileri') || cellClean.includes('sinav bilgileri')) {
            continue;
          }

          let val = '';
          let valIdx = -1;
          for (let k = c + 1; k < rawRow.length; k++) {
            const next = String(rawRow[k] || '').trim();
            if (next) {
              val = next;
              valIdx = k;
              break;
            }
          }

          if (val && valIdx > c) {
            result.bilgi[cell] = val;
            c = valIdx;
          }
        }
      } else if (section === 'dersler') {
        const dersAd = String(rawRow[0] || nonEmpties[0] || '').trim();
        const dersClean = this.cleanTr(dersAd);
        if (!dersAd || dersClean.includes('ders bazli') || dersClean.includes('konu analizi')) continue;

        const dObj = {
          ders: dersAd,
          soruSayisi: 0,
          dogru: 0,
          yanlis: 0,
          bos: 0,
          net: 0,
          basariYuzde: 0,
          kurumNetOrt: 0,
          sinavNetOrt: 0
        };

        if (Object.keys(dersColMap).length > 0) {
          Object.entries(dersColMap).forEach(([colIdx, metric]) => {
            const val = rawRow[colIdx];
            if (metric === 'ders') dObj.ders = String(val || dersAd).trim();
            else dObj[metric] = parseNum(val);
          });
        } else {
          dObj.soruSayisi = parseNum(nonEmpties[1]);
          dObj.dogru = parseNum(nonEmpties[2]);
          dObj.yanlis = parseNum(nonEmpties[3]);
          dObj.bos = parseNum(nonEmpties[4]);
          dObj.net = parseNum(nonEmpties[5]);
          dObj.basariYuzde = parseNum(nonEmpties[6]);
          dObj.kurumNetOrt = parseNum(nonEmpties[7]);
          dObj.sinavNetOrt = parseNum(nonEmpties[8]);
        }

        if (this.cleanTr(dObj.ders) === 'toplam') {
          result.toplam = dObj;
        } else {
          result.dersler.push(dObj);
        }
      } else if (section === 'konular') {
        if (nonEmpties.length >= 5) {
          const ders = nonEmpties[0].trim();
          const konuAdi = nonEmpties[1].trim();
          const dClean = this.cleanTr(ders);
          const kClean = this.cleanTr(konuAdi);
          if (dClean === 'ders' || kClean === 'konu') continue;

          const soruSayisi = parseNum(nonEmpties[2]);
          const dogru = parseNum(nonEmpties[3]);
          const yanlis = parseNum(nonEmpties[4]);
          let basari = parseNum(nonEmpties[5]);

          let basariYuzde = basari;
          if (basari > 0 && basari <= 1) {
            basariYuzde = Math.round(basari * 100);
          }

          const uniqueKey = `${ders.toUpperCase()}___${konuAdi.toLowerCase()}`;
          if (!seenKonular.has(uniqueKey)) {
            seenKonular.add(uniqueKey);
            result.konular.push({
              ders,
              konuAdi,
              soruSayisi,
              dogru,
              yanlis,
              bos: Math.max(0, soruSayisi - (dogru + yanlis)),
              basari: basariYuzde,
              hataVar: yanlis > 0
            });
          }
        }
      }
    }

    // Katılım ve Derece alanlarını ayıkla (Örn: "0 / 26 / 13" -> Genel, Kurum, Şube)
    const katilimKey = Object.keys(result.bilgi).find(k => this.cleanTr(k).includes('katilim'));
    if (katilimKey && result.bilgi[katilimKey]) {
      const parts = String(result.bilgi[katilimKey]).split('/').map(p => parseInt(p.trim()) || 0);
      result.bilgi['Genel Katılım'] = parts[0] || 0;
      result.bilgi['Kurum Katılım'] = parts[1] || 0;
      result.bilgi['Şube Katılım'] = parts[2] || 0;
    }

    const dereceKey = Object.keys(result.bilgi).find(k => this.cleanTr(k).includes('derece'));
    if (dereceKey && result.bilgi[dereceKey]) {
      const parts = String(result.bilgi[dereceKey]).split('/').map(p => parseInt(p.trim()) || 0);
      result.bilgi['Genel Derecesi'] = parts[0] || 0;
      result.bilgi['Kurum Derecesi'] = parts[1] || 0;
      result.bilgi['Şube Derecesi'] = parts[2] || 0;
    }

    return result;
  },

  parseDenemeRows(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { bilgi: {}, dersler: [], toplam: null, konular: [], exams: [] };
    }

    // Çoklu sınav tespiti (sayfa içinde ardışık öğrenci/sınav blokları)
    const chunks = [];
    let currentChunk = [];

    for (let r = 0; r < rows.length; r++) {
      const rawRow = rows[r] || [];
      const rowClean = this.cleanTr(rawRow.map(c => String(c || '').trim()).join(' '));

      const isExamStart = (rowClean.includes('ogrenci bilgileri') && rowClean.includes('sinav bilgileri')) ||
                          (rowClean.includes('sinav adi') && currentChunk.length > 6);

      if (isExamStart && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
      }
      currentChunk.push(rawRow);
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    const parsedExams = chunks
      .map(c => this.parseSingleExamChunk(c))
      .filter(e => (e.dersler && e.dersler.length > 0) || (e.konular && e.konular.length > 0));

    if (parsedExams.length === 0) {
      const single = this.parseSingleExamChunk(rows);
      single.exams = [single];
      return single;
    }

    const mainExam = parsedExams[0];
    mainExam.exams = parsedExams;
    return mainExam;
  },

  denemeIceAktar(file, onSonuc) {
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');

    if (isCsv) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const rows = this.parseCSVToRows(text);
          const parsed = this.parseDenemeRows(rows);
          if (onSonuc) onSonuc({ basarili: true, parsed, dosyaAdi: file.name });
        } catch (err) {
          console.error('CSV okuma hatası:', err);
          if (onSonuc) onSonuc({ basarili: false, hata: err.message });
        }
      };
      reader.onerror = () => {
        if (onSonuc) onSonuc({ basarili: false, hata: 'CSV dosyası okunamadı' });
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert('SheetJS (XLSX) kütüphanesi yüklenemedi.');
      if (onSonuc) onSonuc({ basarili: false, hata: 'SheetJS bulunamadı' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Çoklu sayfa (sheet) desteği
        let allExams = [];
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) return;
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (rows && rows.length > 0) {
            const parsed = this.parseDenemeRows(rows);
            if (parsed && Array.isArray(parsed.exams) && parsed.exams.length > 0) {
              allExams.push(...parsed.exams);
            } else if (parsed && (parsed.dersler?.length > 0 || parsed.konular?.length > 0)) {
              allExams.push(parsed);
            }
          }
        });

        if (allExams.length === 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          const single = this.parseDenemeRows(rows);
          allExams = [single];
        }

        const finalParsed = allExams[0];
        finalParsed.exams = allExams;

        if (onSonuc) onSonuc({ basarili: true, parsed: finalParsed, dosyaAdi: file.name });
      } catch (err) {
        console.error('Excel okuma hatası:', err);
        if (onSonuc) onSonuc({ basarili: false, hata: err.message });
      }
    };
    reader.onerror = () => {
      if (onSonuc) onSonuc({ basarili: false, hata: 'Excel dosyası okunamadı' });
    };
    reader.readAsArrayBuffer(file);
  }
};

// ─────────────────────────────────────────────────────────────
// YAZDIRMA MOTORU (PRINT ENGINE) - DOĞRUDAN DOM & WEBKIT/DESKTOP UYUMLU BASKI
// ─────────────────────────────────────────────────────────────
const PrintEngine = {
  _isPrinting: false,

  yazdir(icerik, ayarlar = {}) {
    if (this._isPrinting) {
      console.warn('Yazdırma motoru zaten devrede, mükerrer istek engellendi.');
      return;
    }
    this._isPrinting = true;
    setTimeout(() => { this._isPrinting = false; }, 3000);

    const yatay = ayarlar.yatay === true;
    const baslik = ayarlar.baslik || 'Plantrack Baskı';
    const oncekiBaslik = document.title;
    document.title = baslik;

    // 1. Varsa eski iframe kalıntılarını temizle
    const oldFrame = document.getElementById('print-engine-iframe');
    if (oldFrame) oldFrame.remove();

    // 2. #print-area elementini hazırla ve içeriği doğrudan yerleştir
    let printArea = document.getElementById('print-area');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'print-area';
      document.body.appendChild(printArea);
    }
    printArea.innerHTML = icerik;
    printArea.classList.remove('hidden');

    // 3. Dinamik sayfa yönlendirme stilini ayarla
    let printStyle = document.getElementById('print-page-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'print-page-style';
      document.head.appendChild(printStyle);
    }
    printStyle.textContent = `
      @page {
        size: ${yatay ? 'A4 landscape' : 'A4 portrait'};
        margin: ${yatay ? '6mm 8mm' : '7mm 9mm'};
      }
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          overflow: visible !important;
          display: block !important;
        }
        body > *:not(#print-area) {
          display: none !important;
        }
        #print-area {
          display: block !important;
          position: static !important;
          width: 100% !important;
          height: auto !important;
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }
        .print-page-break {
          page-break-after: always !important;
          break-after: page !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-page-break:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .print-avoid-break {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-page-yatay {
          margin: 0 auto !important;
          width: 100% !important;
          height: 196mm !important;
          min-height: 196mm !important;
          max-height: 196mm !important;
          padding: 2mm 3mm !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-page-dikey {
          margin: 0 auto !important;
          width: 100% !important;
          min-height: 281mm !important;
          padding: 2mm 3mm !important;
          box-sizing: border-box !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          background: #ffffff !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }
        .print-page-dikey.print-single-page {
          height: 281mm !important;
          max-height: 281mm !important;
          overflow: hidden !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        .print-page-dikey.print-multi-page {
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          display: block !important;
          page-break-inside: auto !important;
          break-inside: auto !important;
        }
        table {
          border-collapse: collapse;
        }
        .cizelge-sol-kenar {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 0.52rem;
          color: #64748b;
          font-weight: 700;
          letter-spacing: 0.08em;
          white-space: nowrap;
          padding: 4px 3px;
          border-right: 1px solid #cbd5e1;
        }
      }
    `;

    document.body.setAttribute('data-print-mode', yatay ? 'landscape' : 'portrait');

    // 4. Temizleme ve geri yükleme fonksiyonu
    let temizlendi = false;
    const temizle = () => {
      if (temizlendi) return;
      temizlendi = true;
      document.title = oncekiBaslik;
      if (printArea) {
        printArea.innerHTML = '';
        printArea.classList.add('hidden');
      }
      if (printStyle) {
        printStyle.textContent = '';
      }
      document.body.removeAttribute('data-print-mode');
      window.removeEventListener('afterprint', temizle);
    };

    window.addEventListener('afterprint', temizle);
    // Güvenlik zamanlayıcısı (afterprint bazı webview pencerelerinde tetiklenmezse 60sn)
    setTimeout(temizle, 60000);

    // 5. DOM ve fontların tam boyanması için kısa gecikmeyle yazdırmayı tetikle
    requestAnimationFrame(() => {
      // WebKit'in @page (kağıt yönü) kuralını yeniden hesaplaması için reflow
      void document.body.offsetHeight;
      setTimeout(() => {
        try {
          void document.body.offsetHeight;
          window.focus();
          window.print();
        } catch (err) {
          console.error('Yazdırma tetikleme hatası:', err);
          if (typeof App !== 'undefined' && App.showToast) {
            App.showToast('Yazdırma penceresi açılamadı: ' + err.message);
          }
        }
      }, 150);
    });
  },

  // Iframe tabanlı yazdırma: @page yönü (yatay/dikey) webview'da da geçerli olur
  yazdirIframe(icerik, ayarlar = {}) {
    if (this._isPrinting) return;
    this._isPrinting = true;
    setTimeout(() => { this._isPrinting = false; }, 5000);

    const yatay = ayarlar.yatay === true;
    const baslik = ayarlar.baslik || 'Plantrack Baskı';

    const eski = document.getElementById('print-engine-iframe');
    if (eski) eski.remove();

    const frame = document.createElement('iframe');
    frame.id = 'print-engine-iframe';
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(frame);

    const doc = frame.contentDocument || frame.contentWindow.document;
    const stiller = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .filter(el => el.id !== 'print-page-style')
      .map(el => el.outerHTML)
      .join('\n');

    doc.open();
    doc.write(
      '<!doctype html><html lang="tr"><head><meta charset="utf-8">' +
      `<title>${baslik}</title>` +
      stiller +
      `<style>
        @page { size: ${yatay ? 'A4 landscape' : 'A4 portrait'}; margin: ${yatay ? '6mm 8mm' : '7mm 9mm'}; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
        }
      </style></head><body><div id="print-area">${icerik}</div></body></html>`
    );
    doc.close();

    let tetiklendi = false;
    const temizle = () => {
      try { frame.remove(); } catch (_) {}
      this._isPrinting = false;
    };

    const tetikle = () => {
      if (tetiklendi) return;
      tetiklendi = true;
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (err) {
        console.error('Yazdırma hatası:', err);
        if (typeof App !== 'undefined' && App.showToast) App.showToast('Yazdırma açılamadı: ' + err.message);
      }
      setTimeout(temizle, 60000);
    };

    frame.onload = () => setTimeout(tetikle, 300);
    setTimeout(tetikle, 800);
  },

  // Yardımcı: HTML dosyası olarak dışa aktar/indir (tarayıcıda açmak veya paylaşmak için)
  indirHTML(icerik, ayarlar = {}) {
    const yatay = ayarlar.yatay === true;
    const baslik = ayarlar.baslik || 'Plantrack_Rapor';
    const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const tamHTML = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baslik}</title>
  ${headStyles}
  <style>
    @page { size: ${yatay ? 'A4 landscape' : 'A4 portrait'}; margin: ${yatay ? '6mm 8mm' : '7mm 9mm'}; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box !important; }
    html, body { margin: 0; padding: 0; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #print-area { display: block; width: 100%; margin: 0; padding: 0; background: #ffffff; }
    .print-page-break { page-break-after: always; break-after: page; }
    .print-page-break:last-child { page-break-after: auto; break-after: auto; }
    .print-page-yatay { margin: 0 auto; width: 100%; min-height: 196mm; display: flex; flex-direction: column; justify-content: space-between; box-shadow: none; background: #ffffff; }
    .print-page-dikey { margin: 0 auto; width: 100%; min-height: 281mm; display: flex; flex-direction: column; justify-content: space-between; box-shadow: none; background: #ffffff; }
    table { border-collapse: collapse; }
    .cizelge-sol-kenar { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 0.52rem; color: #64748b; font-weight: 700; letter-spacing: 0.08em; white-space: nowrap; padding: 4px 3px; border-right: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  <div id="print-area">
    ${icerik}
  </div>
</body>
</html>`;

    const blob = new Blob([tamHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baslik}.html`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
};

// Global scope bağlantıları
if (typeof window !== 'undefined') {
  window.Store = Store;
  window.ExcelEngine = ExcelEngine;
  window.PrintEngine = PrintEngine;
}
