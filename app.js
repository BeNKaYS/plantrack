/**
 * Plantrack — Ana Uygulama Mantığı (app.js)
 */

const App = {
  currentView: 'overview',
  toastTimeout: null,

  init() {
    Store.init();
    this.bindEvents();
    this.initSidebarResizer();
    this.populateStudentDropdown();
    this.updateSidebarCoachInfo();
    this.navigateTo('overview');
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  getAktifModul() {
    const modulId = Store.data.aktifModulId;
    if (typeof MODULLER === 'undefined' || !Array.isArray(MODULLER)) return null;
    return MODULLER.find(m => m.id === modulId) || null;
  },

  navigateTo(view) {
    this.currentView = view;

    // Nav butonlarının aktiflik durumunu güncelle
    const navItems = document.querySelectorAll('[data-nav]');
    navItems.forEach(btn => {
      if (btn.getAttribute('data-nav') === view) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // View section görünürlüklerini ayarla
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.add('hidden'));

    const targetSection = document.getElementById(`view-${view}`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    // Topbar kontrolü: overview görünümünde gizli, diğerlerinde görünür
    const topbar = document.getElementById('topbar');
    if (topbar) {
      if (view === 'overview') {
        topbar.classList.add('hidden');
      } else {
        topbar.classList.remove('hidden');
      }
    }

    this.renderCurrentView();

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderCurrentView() {
    Store.refreshDeadlines();
    this.updateGlobalBadges();

    // Sonraki aşamalarda ilgili view render fonksiyonları çağrılacak
    switch (this.currentView) {
      case 'overview':
        break;
      case 'cockpit':
        break;
      case 'matrix':
        break;
      case 'tasks':
        break;
      case 'report':
        break;
      case 'hata-defteri':
        break;
      case 'cizelge-robotu':
        break;
      case 'curriculum-pool':
        break;
      case 'library':
        break;
      case 'students':
        break;
      case 'sinav-notlari':
        break;
      default:
        break;
    }
  },

  updateGlobalBadges() {
    const ogrenciler = Store.data.ogrenciler || [];
    const gorevler = Store.data.gorevler || [];

    // 1. Overview rozeti (toplam öğrenci sayısı, daima görünür)
    const badgeOverview = document.getElementById('nav-badge-overview');
    if (badgeOverview) {
      badgeOverview.textContent = ogrenciler.length;
    }

    // Gecikmiş ve aktif ödev hesaplamaları
    const overdueTasks = gorevler.filter(g => g.durum === 'gecikmis');
    const overdueCount = overdueTasks.length;

    const activeTasks = gorevler.filter(g => g.durum !== 'tamamlandi');
    const activeTasksCount = activeTasks.length;

    // 2. Cockpit rozeti (geciken ödev sayısı, 0 ise gizli)
    const badgeCockpit = document.getElementById('nav-badge-cockpit');
    if (badgeCockpit) {
      badgeCockpit.textContent = overdueCount;
      badgeCockpit.classList.toggle('hidden', overdueCount === 0);
    }

    // 3. Tasks rozeti (aktif ödev sayısı, 0 ise gizli)
    const badgeTasks = document.getElementById('nav-badge-tasks');
    if (badgeTasks) {
      badgeTasks.textContent = activeTasksCount;
      badgeTasks.classList.toggle('hidden', activeTasksCount === 0);
    }

    // 4. Topbar gecikme uyarısı
    const topbarOverdueAlert = document.getElementById('topbar-overdue-alert');
    const topbarOverdueCount = document.getElementById('topbar-overdue-count');
    if (topbarOverdueAlert && topbarOverdueCount) {
      topbarOverdueCount.textContent = overdueCount;
      topbarOverdueAlert.classList.toggle('hidden', overdueCount === 0);
    }

    // 5. Sidebar aktif modül rozeti
    const sidebarModulBadge = document.getElementById('sidebar-modul-badge');
    const sidebarModulText = document.getElementById('sidebar-modul-text');
    const aktifOgrenci = Store.getAktifOgrenci();

    if (sidebarModulBadge && sidebarModulText) {
      if (aktifOgrenci) {
        const modul = this.getAktifModul();
        const modulAd = modul ? modul.ad : 'Modül';
        const sinifText = aktifOgrenci.sinif ? `${aktifOgrenci.sinif}. Sınıf` : '';
        sidebarModulText.textContent = sinifText ? `${modulAd} · ${sinifText}` : modulAd;
        sidebarModulBadge.classList.remove('hidden');
      } else {
        sidebarModulBadge.classList.add('hidden');
      }
    }

    // 6. Topbar aktif öğrenci rozeti
    const activeStudentBadge = document.getElementById('active-student-badge');
    if (activeStudentBadge) {
      if (aktifOgrenci) {
        const modul = this.getAktifModul();
        activeStudentBadge.textContent = `${aktifOgrenci.ad || ''} ${aktifOgrenci.soyad || ''} (${modul ? modul.ad : ''})`;
        activeStudentBadge.classList.remove('hidden');
      } else {
        activeStudentBadge.classList.add('hidden');
      }
    }
  },

  populateStudentDropdown() {
    const select = document.getElementById('select-active-student');
    if (!select) return;

    const ogrenciler = Store.data.ogrenciler || [];
    select.innerHTML = '';

    if (ogrenciler.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Öğrenci Kaydı Yok';
      select.appendChild(opt);
    } else {
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = '— Öğrenci Seçiniz —';
      select.appendChild(defaultOpt);

      ogrenciler.forEach(ogrenci => {
        const opt = document.createElement('option');
        opt.value = ogrenci.id;
        const sinifStr = ogrenci.sinif ? ` (${ogrenci.sinif}. Sınıf)` : '';
        opt.textContent = `${ogrenci.ad} ${ogrenci.soyad}${sinifStr}`;
        if (String(ogrenci.id) === String(Store.data.aktifOgrenciId)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });
    }

    this.updateGlobalBadges();
  },

  updateSidebarCoachInfo() {
    const koc = Store.data.kocProfili || {
      ad: 'Eren',
      soyad: 'Kaya',
      unvan: 'Eğitim Koçu',
      avatarKisa: 'EK'
    };

    const avatarEl = document.getElementById('sidebar-coach-avatar');
    const nameEl = document.getElementById('sidebar-coach-name');
    const titleEl = document.getElementById('sidebar-coach-title');

    if (avatarEl) {
      avatarEl.textContent = koc.avatarKisa || `${(koc.ad || '').charAt(0)}${(koc.soyad || '').charAt(0)}`.toUpperCase();
    }
    if (nameEl) {
      nameEl.textContent = `${koc.ad || ''} ${koc.soyad || ''}`.trim() || 'Koç Profili';
    }
    if (titleEl) {
      titleEl.textContent = koc.unvan || 'Eğitim Koçu & Danışman';
    }
  },

  initSidebarResizer() {
    const resizer = document.getElementById('sidebar-resizer');
    const dynamicStyle = document.getElementById('sidebar-dynamic-width');
    if (!resizer || !dynamicStyle) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.classList.add('select-none', 'cursor-col-resize');
      resizer.classList.add('resizing');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(e.clientX, 180), 520);
      dynamicStyle.textContent = `#sidebar { width: ${newWidth}px !important; min-width: ${newWidth}px !important; max-width: ${newWidth}px !important; }`;
      localStorage.setItem('plantrack_sidebar_width', String(newWidth));
    });

    window.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.classList.remove('select-none', 'cursor-col-resize');
        resizer.classList.remove('resizing');
      }
    });

    resizer.addEventListener('dblclick', () => {
      localStorage.removeItem('plantrack_sidebar_width');
      dynamicStyle.textContent = '';
      this.showToast('Sidebar genişliği sıfırlandı');
    });
  },

  openModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;

    content.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay) return;

    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    if (content) {
      content.innerHTML = '';
    }
  },

  showToast(msg, duration = 3000) {
    let toast = document.getElementById('plantrack-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'plantrack-toast';
      toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 pointer-events-none bg-slate-900 text-slate-100 border border-slate-700/80 flex items-center gap-2';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>${msg}</span>`;
    toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      toast.classList.remove('opacity-100', 'translate-y-0');
    }, duration);
  },

  exportBackup() {
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const dataStr = JSON.stringify(Store.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantrack_yedek_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('Yedek dosyası indirildi');
    } catch (err) {
      console.error('Yedek dışa aktarma hatası:', err);
      this.showToast('Yedek oluşturulurken hata meydana geldi');
    }
  },

  importBackup(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.ogrenciler)) {
          this.showToast('Geçersiz yedek dosyası: Öğrenci verisi bulunamadı');
          return;
        }

        Store.data = parsed;
        Store.save();
        this.populateStudentDropdown();
        this.updateSidebarCoachInfo();
        this.navigateTo('overview');
        this.showToast('Yedek başarıyla geri yüklendi');
      } catch (err) {
        console.error('Yedek okuma hatası:', err);
        this.showToast('Dosya okunurken bir hata oluştu');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  },

  openTaskModal() {
    this.showToast('Hızlı Görev Ekleme Yakında!');
  },

  openCoachSettingsModal() {
    this.showToast('Koç Profili Ayarları Yakında!');
  },

  bindEvents() {
    // Nav butonları
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-nav');
        if (view) {
          this.navigateTo(view);
        }
      });
    });

    // Öğrenci değiştirme dropdown'ı
    const studentSelect = document.getElementById('select-active-student');
    if (studentSelect) {
      studentSelect.addEventListener('change', (e) => {
        Store.setAktifOgrenci(e.target.value);
        this.updateGlobalBadges();
        this.renderCurrentView();
      });
    }

    // Modal overlay tıklaması (dışına tıklanınca kapat)
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeModal();
        }
      });
    }

    // Yedekleme butonları
    const btnExport = document.getElementById('btn-export-backup');
    if (btnExport) {
      btnExport.addEventListener('click', () => this.exportBackup());
    }

    const btnImport = document.getElementById('btn-sidebar-import-json');
    const inputImport = document.getElementById('input-import-json');
    if (btnImport && inputImport) {
      btnImport.addEventListener('click', () => inputImport.click());
      inputImport.addEventListener('change', (e) => this.importBackup(e));
    }

    // Topbar gecikme uyarısına tıklandığında cockpit'e git
    const overdueAlert = document.getElementById('topbar-overdue-alert');
    if (overdueAlert) {
      overdueAlert.addEventListener('click', () => this.navigateTo('cockpit'));
    }

    // Logo tıklanınca overview'a git
    const logoEl = document.getElementById('sidebar-logo-btn');
    if (logoEl) {
      logoEl.addEventListener('click', () => this.navigateTo('overview'));
    }
  }
};

// Sayfa yüklendiğinde başlat
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
