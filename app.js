/**
 * Plantrack — Ana Uygulama Mantığı (app.js)
 */

const App = {
  currentView: 'overview',
  currentTheme: localStorage.getItem('plantrack_theme') || 'dark',
  toastTimeout: null,

  init() {
    Store.init();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    this.initSidebarResizer();
    this.populateStudentDropdown();
    this.updateSidebarCoachInfo();
    this.navigateTo('overview');
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('plantrack_theme', theme);

    const icon = document.getElementById('theme-toggle-icon');
    if (icon) {
      // Koyu temada güneşi göster (açığa geçmek için), açık temada ayı göster (koyuya geçmek için)
      icon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
      if (window.lucide) {
        lucide.createIcons();
      }
    }
  },

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    this.showToast(nextTheme === 'dark' ? 'Koyu tema etkinleştirildi' : 'Açık tema etkinleştirildi');
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
        this.renderOverview();
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

  renderOverview() {
    const view = document.getElementById('view-overview');
    if (!view) return;

    const modul = this.getAktifModul() || { id: 'ara-sinif', ad: 'Ara Sınıflar', siniflar: ['5', '6', '7'] };
    const ogrenciler = Store.data.ogrenciler || [];
    const gorevler = Store.data.gorevler || [];
    const overdueCount = gorevler.filter(g => g.durum === 'gecikmis').length;
    const activeTasksCount = gorevler.filter(g => g.durum !== 'tamamlandi').length;

    const dateStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    view.innerHTML = `
      <div class="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        <!-- Header Banner: Workbench Identity -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="meta-pill">KONTROL MASASI</span>
              <span class="text-xs font-mono text-[var(--color-ink-faint)]">${dateStr}</span>
            </div>
            <h1 class="text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">Koçluk Yönetim Masası</h1>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Öğrenci çalışma programları, ödev döngüleri ve modüler müfredat takibi</p>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-2)] border border-[var(--color-rule-strong)] flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse"></div>
              <span class="text-xs font-mono text-[var(--color-ink-faint)]">Aktif Modül:</span>
              <span class="text-xs font-mono font-semibold text-[var(--color-ink)]">${modul.ad}</span>
            </div>
          </div>
        </div>

        <!-- Metric Grid (Strict 4pt spacing, OKLCH cards, JetBrains Mono numbers) -->
        <div class="workbench-grid">
          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Kayıtlı Öğrenciler</span>
              <i data-lucide="users" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value">${ogrenciler.length}</div>
            <div class="workbench-metric-sub flex items-center justify-between">
              <span>Toplam Portföy</span>
              <button onclick="App.navigateTo('students')" class="text-xs font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer">Yönet <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
            </div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Aktif Görevler</span>
              <i data-lucide="check-square" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value">${activeTasksCount}</div>
            <div class="workbench-metric-sub flex items-center justify-between">
              <span>Devam Eden Ödev Takibi</span>
              <button onclick="App.navigateTo('tasks')" class="text-xs font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer">İncele <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
            </div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Geciken Ödevler</span>
              <i data-lucide="alert-triangle" class="w-4 h-4 ${overdueCount > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-faint)]'}"></i>
            </div>
            <div class="workbench-metric-value ${overdueCount > 0 ? 'text-[var(--color-danger)]' : ''}">${overdueCount}</div>
            <div class="workbench-metric-sub flex items-center justify-between">
              <span>${overdueCount > 0 ? 'Müdahale Gerektiren' : 'Risk Bulunmuyor'}</span>
              <button onclick="App.navigateTo('cockpit')" class="text-xs font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer">Kokpit <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
            </div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Müfredat Kapsamı</span>
              <i data-lucide="layers" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value text-base font-semibold pt-1">${modul.ad}</div>
            <div class="workbench-metric-sub flex items-center justify-between">
              <span class="font-mono text-[11px]">${(modul.siniflar || []).map(s => s + '. Sınıf').join(', ')}</span>
              <button onclick="App.navigateTo('curriculum-pool')" class="text-xs font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1 cursor-pointer">Havuz <i data-lucide="arrow-right" class="w-3 h-3"></i></button>
            </div>
          </div>
        </div>

        <!-- Quick Access Instrument Deck -->
        <div class="pt-2">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xs font-mono font-semibold tracking-wider uppercase text-[var(--color-ink-faint)]">Hızlı Çalışma Masası Modülleri</h2>
            <span class="text-[11px] font-mono text-[var(--color-ink-faint)]">Tek Tıkla Geçiş</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div onclick="App.navigateTo('students')" class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all cursor-pointer group">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent)] group-hover:scale-105 transition-transform">
                  <i data-lucide="user-plus" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-xs font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">Öğrenci Portföyü</h3>
                  <p class="text-[11px] text-[var(--color-ink-faint)]">Kayıt & sınıf ataması</p>
                </div>
              </div>
              <p class="text-xs text-[var(--color-ink-muted)]">Öğrenci kayıtlarını ve hedef modül yapılandırmasını yönetin.</p>
            </div>

            <div onclick="App.navigateTo('matrix')" class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all cursor-pointer group">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent)] group-hover:scale-105 transition-transform">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-xs font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">Haftalık Takip Matrisi</h3>
                  <p class="text-[11px] text-[var(--color-ink-faint)]">Ders ve ödev dağılımı</p>
                </div>
              </div>
              <p class="text-xs text-[var(--color-ink-muted)]">Haftalık çalışma çizelgesi ve konu kazanımlarını planlayın.</p>
            </div>

            <div onclick="App.navigateTo('curriculum-pool')" class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all cursor-pointer group">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-center text-[var(--color-accent)] group-hover:scale-105 transition-transform">
                  <i data-lucide="book-marked" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="text-xs font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">Müfredat & Ders Havuzu</h3>
                  <p class="text-[11px] text-[var(--color-ink-faint)]">Kazanım ve kaynak haritası</p>
                </div>
              </div>
              <p class="text-xs text-[var(--color-ink-muted)]">Ders kazanımlarını ve soru bankası kaynaklarını koordine edin.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  showToast(msg, duration = 3000) {
    let toast = document.getElementById('plantrack-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'plantrack-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-[var(--color-accent)]"></i><span>${msg}</span>`;
    if (window.lucide) {
      lucide.createIcons();
    }
    toast.classList.add('active');

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
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

    // Tema değiştirme butonu
    const btnToggleTheme = document.getElementById('btn-toggle-theme');
    if (btnToggleTheme) {
      btnToggleTheme.addEventListener('click', () => this.toggleTheme());
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
