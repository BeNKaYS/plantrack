/**
 * Plantrack — Ana Uygulama Mantığı (app.js)
 * Prompt 3: Ana Panel (Overview) ve Öğrenci Kokpiti (Cockpit)
 */

const App = {
  currentView: 'overview',
  currentTheme: localStorage.getItem('plantrack_theme') || 'dark',
  toastTimeout: null,

  // Arama ve Filtre Durumları (View geçişlerinde korunur)
  overviewSearchQuery: '',
  overviewSinifFilter: '',

  // Matris State
  matrisAktifDersId: '',
  matrisAktifKonuId: null,

  // Görevler (Tasks) State
  tasksSearchQuery: '',
  tasksDurumFilter: '',
  tasksDersFilter: '',
  tasksHideCompleted: false,

  // Raporlar State
  reportAktifSablon: 'slip', // 'slip' | 'full'
  reportSelectedOgrenciId: '',

  // Hata Defteri State
  hataAktifSekme: 'a4', // 'a4' | 'dijital'
  hataSelectedOgrenciId: '',
  hataFormModu: 'dolu', // 'dolu' | 'bos'
  hataSatirSayisi: 15, // 10 | 15 | 20
  hataDersFilter: '',
  hataTurFilter: '',

  // Havuz & Portföy State
  poolModulFilter: '',
  poolSinifFilter: '',
  poolAktifDersId: '',

  libraryModulFilter: '',
  librarySearchQuery: '',

  studentsModulFilter: '',
  studentsSearchQuery: '',

  // Çizelge Robotu State
  cizelgeAktifSablon: 'haftalik-plan', // 'haftalik-plan' | 'odev-takip' | 'konu-takip'
  cizelgeOgrenciId: '',
  cizelgeDersId: '',
  cizelgeKonuBosMod: false, // false: Mevcut Durumları Doldur, true: Boş Şablon
  cizelgeGorevleriYerlestir: true, // Görevleri günlere dağıt

  // Sınav Notları State
  sinavNotlariDersFilter: '', // '' (Tümü) veya dersId
  sinavNotlariTurFilter: '', // '' (Tümü) veya 'yazili' | 'sozlu' | 'proje' | 'kisa-sinav'
  sinavNotlariAktifDersId: '', // Trend grafiği için aktif ders

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
    if (!modulId || modulId === 'all' || modulId === 'tumu') return null;
    if (typeof MODULLER === 'undefined' || !Array.isArray(MODULLER)) return null;
    return MODULLER.find(m => m.id === modulId) || null;
  },

  formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? isoStr : d.toLocaleDateString('tr-TR');
    } catch (e) {
      return isoStr;
    }
  },

  calculateOverdueDays(deadlineStr) {
    if (!deadlineStr) return 0;
    try {
      const parts = deadlineStr.split('-');
      if (parts.length === 3) {
        const deadline = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59);
        const now = new Date();
        const diffMs = now.getTime() - deadline.getTime();
        return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
      }
    } catch (e) {}
    return 0;
  },

  getDers(dersId) {
    const d = Store.getDers(dersId);
    if (d) return d;
    return { id: dersId, ad: dersId || 'Genel', renk: 'blue', kisaltma: 'DRS', ikon: 'book' };
  },

  getKonu(konuId) {
    const k = Store.getKonu(konuId);
    if (k) return k;
    return { id: konuId, konuAdi: konuId || 'Genel Konu' };
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

    switch (this.currentView) {
      case 'overview':
        this.renderOverview();
        break;
      case 'cockpit':
        this.renderCockpit();
        break;
      case 'matrix':
        this.renderMatrix();
        break;
      case 'tasks':
        this.renderTasks();
        break;
      case 'report':
        this.renderReport();
        break;
      case 'hata-defteri':
        this.renderHataDefteri();
        break;
      case 'cizelge-robotu':
        this.renderCizelgeRobotu();
        break;
      case 'curriculum-pool':
        this.renderCurriculumPool();
        break;
      case 'library':
        this.renderLibrary();
        break;
      case 'students':
        this.renderStudents();
        break;
      case 'sinav-notlari':
        this.renderSinavNotlari();
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
    const overdueTasks = gorevler.filter(g => g.durum === 'gecikti');
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
        const modul = Store.getModulForOgrenci(aktifOgrenci);
        const modulAd = modul ? modul.ad : (aktifOgrenci.modulId || 'Modül');
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
        const modul = Store.getModulForOgrenci(aktifOgrenci);
        const modulAd = modul ? modul.ad : (aktifOgrenci.modulId || '');
        activeStudentBadge.textContent = `${aktifOgrenci.ad || ''} ${aktifOgrenci.soyad || ''}${modulAd ? ` (${modulAd})` : ''}`;
        activeStudentBadge.classList.remove('hidden');
      } else {
        activeStudentBadge.classList.add('hidden');
      }
    }
  },

  populateStudentDropdown() {
    const select = document.getElementById('select-active-student');
    if (!select) return;

    const aktifModul = this.getAktifModul();
    const allStudents = Store.getOgrenciler();
    select.innerHTML = '';

    if (allStudents.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Öğrenci Kaydı Yok';
      select.appendChild(opt);
    } else {
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = aktifModul ? `— ${aktifModul.ad} (${allStudents.filter(o => o.modulId === aktifModul.id).length} Öğrenci) —` : '— Öğrenci Seçiniz —';
      select.appendChild(defaultOpt);

      const modulStudents = aktifModul ? allStudents.filter(o => o.modulId === aktifModul.id) : allStudents;

      modulStudents.forEach(ogrenci => {
        const opt = document.createElement('option');
        opt.value = ogrenci.id;
        const sinifStr = ogrenci.sinif ? ` (${ogrenci.sinif}. Sınıf)` : '';
        opt.textContent = `${ogrenci.ad} ${ogrenci.soyad}${sinifStr}`;
        if (String(ogrenci.id) === String(Store.data.aktifOgrenciId)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      if (aktifModul) {
        const otherStudents = allStudents.filter(o => o.modulId !== aktifModul.id);
        if (otherStudents.length > 0) {
          const group = document.createElement('optgroup');
          group.label = 'Diğer Modüllerdeki Öğrenciler';
          otherStudents.forEach(ogrenci => {
            const opt = document.createElement('option');
            opt.value = ogrenci.id;
            const sinifStr = ogrenci.sinif ? ` (${ogrenci.sinif}. Sınıf)` : '';
            opt.textContent = `${ogrenci.ad} ${ogrenci.soyad}${sinifStr}`;
            if (String(ogrenci.id) === String(Store.data.aktifOgrenciId)) {
              opt.selected = true;
            }
            group.appendChild(opt);
          });
          select.appendChild(group);
        }
      }
    }

    this.updateGlobalBadges();
  },

  updateSidebarCoachInfo() {
    const koc = Store.getKocProfili();
    const avatarEl = document.getElementById('sidebar-coach-avatar');
    const nameEl = document.getElementById('sidebar-coach-name');
    const titleEl = document.getElementById('sidebar-coach-title');

    if (avatarEl) {
      avatarEl.textContent = koc.avatarKisa || 'KD';
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

    resizer.addEventListener('mousedown', () => {
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

  openConfirmModal(title, message, onConfirm) {
    const html = `
      <div class="space-y-4">
        <div class="flex items-center gap-3 pb-3 border-b border-[var(--color-rule)]">
          <div class="w-8 h-8 rounded-full bg-[var(--color-danger-bg)] text-[var(--color-danger)] flex items-center justify-center">
            <i data-lucide="alert-triangle" class="w-4 h-4"></i>
          </div>
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${title}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Bu işlem geri alınamaz.</p>
          </div>
        </div>
        <p class="text-sm text-[var(--color-ink)]">${message}</p>
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
          <button onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
          <button id="btn-confirm-action" class="btn-tactile bg-[var(--color-danger)] text-white hover:opacity-90">Onayla ve Sil</button>
        </div>
      </div>
    `;
    this.openModal(html);

    const btn = document.getElementById('btn-confirm-action');
    if (btn) {
      btn.addEventListener('click', () => {
        this.closeModal();
        if (typeof onConfirm === 'function') onConfirm();
      });
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

  // ─────────────────────────────────────────────────────────────
  // VIEW 1: ANA PANEL (RENDER OVERVIEW)
  // ─────────────────────────────────────────────────────────────
  renderOverview() {
    const view = document.getElementById('view-overview');
    if (!view) return;

    const aktifModul = this.getAktifModul();
    const allStudents = Store.getOgrenciler();
    const allTasks = Store.getGorevler();

    // Aktif modüle göre öğrenci ve görev kapsamı
    const modulOgrenciler = aktifModul
      ? allStudents.filter(o => o.modulId === aktifModul.id)
      : allStudents;

    const modulOgrenciIds = new Set(modulOgrenciler.map(o => String(o.id)));
    const modulTasks = aktifModul
      ? allTasks.filter(g => modulOgrenciIds.has(String(g.ogrenciId)))
      : allTasks;

    // KPI Hesaplamaları
    const toplamOgrenci = modulOgrenciler.length;
    const aktifOdevSayisi = modulTasks.filter(g => g.durum !== 'tamamlandi').length;
    const gecikenOdevSayisi = modulTasks.filter(g => g.durum === 'gecikti').length;

    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const buHaftaTamamlanan = modulTasks.filter(g => {
      if (g.durum !== 'tamamlandi' || !g.tamamlanmaTarihi) return false;
      const t = new Date(g.tamamlanmaTarihi).getTime();
      return !isNaN(t) && t >= sevenDaysAgo;
    }).length;

    // Sınıf Filtre Seçenekleri: Seçili modüle ait sınıflar
    const visibleSiniflar = (typeof SINIFLAR !== 'undefined' ? SINIFLAR : []).filter(s => {
      if (!aktifModul) return true;
      return s.modulId === aktifModul.id;
    });

    // Eğer mevcut seçili sınıf yeni modülün sınıfları arasında yoksa sıfırla
    if (this.overviewSinifFilter && !visibleSiniflar.some(s => s.deger === this.overviewSinifFilter)) {
      this.overviewSinifFilter = '';
    }

    const sinifOptions = visibleSiniflar.map(s =>
      `<option value="${s.deger}" ${this.overviewSinifFilter === s.deger ? 'selected' : ''}>${s.label}</option>`
    ).join('');

    const modulTitle = aktifModul ? aktifModul.ad : 'Tüm Modüller (Portföy)';
    const modulSubtitle = aktifModul
      ? `${aktifModul.ad} kademesindeki öğrencilerin akademik durumu ve takibi`
      : 'Tüm kademelerdeki öğrencilerin akademik durumu ve ödev takibi';

    view.innerHTML = `
      <div class="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <!-- Bölüm 1: Sayfa Başlığı -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="meta-pill">YÖNETİM</span>
              <span class="text-xs font-mono text-[var(--color-ink-faint)]">Sistem Özeti</span>
            </div>
            <h1 class="text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">Kurum Geneli Yönetim Paneli</h1>
            <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">${modulSubtitle}</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="App.openModulSeciciModal()" class="btn-tactile btn-tactile-ghost flex items-center gap-2 py-2 px-3 border border-[var(--color-rule-strong)] hover:border-[var(--color-accent)]" title="Modül Filtresini Değiştir">
              <span class="w-2.5 h-2.5 rounded-full ${aktifModul ? 'bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]' : 'bg-[var(--color-ink-faint)]'}"></span>
              <span class="font-mono text-xs font-semibold text-[var(--color-ink)]">${modulTitle}</span>
              <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5 text-[var(--color-ink-faint)]"></i>
            </button>
            <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary">
              <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
              <span>+ Yeni Öğrenci</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: KPI Kartları (4 kart, yatay sıra) -->
        <div class="workbench-grid">
          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Toplam Öğrenci</span>
              <i data-lucide="users" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value">${toplamOgrenci}</div>
            <div class="workbench-metric-sub">${aktifModul ? `${aktifModul.ad} Portföyü` : 'Kayıtlı Portföy'}</div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Aktif Ödev</span>
              <i data-lucide="check-square" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value text-[var(--color-accent)]">${aktifOdevSayisi}</div>
            <div class="workbench-metric-sub">Süren / Bekleyen Görevler</div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Gecikmiş Ödev</span>
              <i data-lucide="alert-triangle" class="w-4 h-4 ${gecikenOdevSayisi > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}"></i>
            </div>
            <div class="workbench-metric-value ${gecikenOdevSayisi > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}">
              ${gecikenOdevSayisi}
            </div>
            <div class="workbench-metric-sub ${gecikenOdevSayisi > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}">
              ${gecikenOdevSayisi > 0 ? 'Müdahale Gerekiyor' : 'Tümü Zamanında'}
            </div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Bu Hafta Tamamlanan</span>
              <i data-lucide="award" class="w-4 h-4 text-[var(--color-success)]"></i>
            </div>
            <div class="workbench-metric-value text-[var(--color-success)]">${buHaftaTamamlanan}</div>
            <div class="workbench-metric-sub">Son 7 günde biten</div>
          </div>
        </div>

        <!-- Bölüm 3: Öğrenci Listesi Tablosu -->
        <div class="space-y-4">
          <!-- Üst Araç Çubuğu (Arama ve Sınıf Filtresi) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--color-paper-2)] p-3 rounded-[var(--radius-md)] border border-[var(--color-rule)]">
            <div class="relative flex-1 max-w-sm">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"></i>
              <input type="text" id="overview-search" value="${this.overviewSearchQuery}" placeholder="Öğrenci adı, soyadı veya okul ara..." class="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-ghost)]">
            </div>
            <div class="flex items-center gap-2">
              <select id="overview-sinif-filter" class="select-instrument text-xs py-1.5">
                <option value="">${aktifModul ? `Tüm ${aktifModul.ad} Sınıfları` : 'Tüm Sınıflar'}</option>
                ${sinifOptions}
              </select>
            </div>
          </div>

          <!-- Tablo Kapsayıcısı -->
          <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-[var(--color-rule-strong)] bg-[var(--color-paper-3)] font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-faint)]">
                    <th class="py-3 px-4">Öğrenci</th>
                    <th class="py-3 px-4">Sınıf & Modül</th>
                    <th class="py-3 px-4">Hedef</th>
                    <th class="py-3 px-4">Ödev Durumu</th>
                    <th class="py-3 px-4 text-center">Geciken</th>
                    <th class="py-3 px-4 text-center">Kritik Eksik</th>
                    <th class="py-3 px-4 text-right">Hızlı Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody id="overview-tbody" class="divide-y divide-[var(--color-rule)]">
                  <!-- JS ile doldurulur -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Bölüm 4: Kurum Geneli Gecikmiş Ödevler Paneli -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
            <div class="flex items-center gap-2">
              <i data-lucide="alert-circle" class="w-4 h-4 ${gecikenOdevSayisi > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}"></i>
              <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">
                ${aktifModul ? `${aktifModul.ad} Gecikmiş Ödevler` : 'Kurum Geneli Gecikmiş Ödevler'}
              </h2>
            </div>
            <span class="meta-pill ${gecikenOdevSayisi > 0 ? 'text-[var(--color-danger)] bg-[var(--color-danger-bg)] border-[var(--color-danger-border)]' : ''}">
              ${gecikenOdevSayisi} Geciken Ödev
            </span>
          </div>
          <div id="overview-overdue-list">
            <!-- Gecikmiş ödev listesi -->
          </div>
        </div>
      </div>
    `;

    // Tablo Satırlarını ve Gecikmiş Listeyi Doldur
    this.renderOverviewTableRows();
    this.renderOverviewOverdueList();

    // Event Dinleyicilerini Bağla
    const searchInput = document.getElementById('overview-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.overviewSearchQuery = e.target.value.toLowerCase().trim();
        this.renderOverviewTableRows();
      });
    }

    const sinifFilter = document.getElementById('overview-sinif-filter');
    if (sinifFilter) {
      sinifFilter.addEventListener('change', (e) => {
        this.overviewSinifFilter = e.target.value;
        this.renderOverviewTableRows();
      });
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderOverviewTableRows() {
    const tbody = document.getElementById('overview-tbody');
    if (!tbody) return;

    let ogrenciler = Store.getOgrenciler();
    const aktifModul = this.getAktifModul();

    // 1. Modül Filtresi (Başlıktaki modül seçiciden aktif olan modüle göre)
    if (aktifModul) {
      ogrenciler = ogrenciler.filter(o => o.modulId === aktifModul.id);
    }

    // 2. Arama Filtresi
    if (this.overviewSearchQuery) {
      const q = this.overviewSearchQuery;
      ogrenciler = ogrenciler.filter(o =>
        (o.ad && o.ad.toLowerCase().includes(q)) ||
        (o.soyad && o.soyad.toLowerCase().includes(q)) ||
        (o.okul && o.okul.toLowerCase().includes(q))
      );
    }

    // 3. Sınıf Filtresi
    if (this.overviewSinifFilter) {
      ogrenciler = ogrenciler.filter(o => String(o.sinif) === String(this.overviewSinifFilter));
    }

    if (ogrenciler.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center">
            <div class="max-w-xs mx-auto text-center space-y-3">
              <div class="w-10 h-10 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
                <i data-lucide="users" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="font-medium text-xs text-[var(--color-ink)]">Henüz öğrenci kaydı bulunamadı</p>
                <p class="text-[11px] text-[var(--color-ink-muted)]">
                  ${aktifModul ? `${aktifModul.ad} kademesinde kriterlere uygun öğrenci bulunamadı.` : 'Kriterlere uygun öğrenci yok veya henüz kayıt yapılmadı.'}
                </p>
              </div>
              <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary text-xs">
                + Yeni Öğrenci Ekle
              </button>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    tbody.innerHTML = ogrenciler.map(ogr => {
      const tasks = Store.getGorevler(ogr.id);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(g => g.durum === 'tamamlandi').length;
      const overdueTasks = tasks.filter(g => g.durum === 'gecikti').length;
      const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Kritik eksik konu sayısı (durum === 'tekrar_lazim')
      const tekrarLazimSayisi = (Store.data.ogrenciKonuDurumlari || []).filter(
        k => String(k.ogrenciId) === String(ogr.id) && k.durum === 'tekrar_lazim'
      ).length;

      // Modül ve Sınıf Etiketleri
      const modulObj = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null;
      const modulAd = modulObj ? (modulObj.kisaltma || modulObj.ad) : (ogr.modulId || 'Modül');
      const sinifLabel = ogr.sinif ? `${ogr.sinif}. Sınıf` : '—';
      const hedefStr = ogr.hedef ? (ogr.hedef.length > 26 ? ogr.hedef.slice(0, 26) + '…' : ogr.hedef) : '—';

      return `
        <tr class="hover:bg-[var(--color-paper-3)] transition-colors">
          <td class="py-3 px-4">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-[var(--radius-xs)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] flex items-center justify-center font-mono font-bold text-xs">
                ${(ogr.ad ? ogr.ad[0] : '') + (ogr.soyad ? ogr.soyad[0] : '')}
              </div>
              <div>
                <div class="font-semibold text-[var(--color-ink)]">${ogr.ad} ${ogr.soyad}</div>
                <div class="text-[11px] text-[var(--color-ink-faint)]">${ogr.okul || 'Okul belirtilmedi'}</div>
              </div>
            </div>
          </td>

          <td class="py-3 px-4">
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-medium text-[var(--color-ink)]">${sinifLabel}</span>
              <span class="meta-pill text-[9px]">${modulAd}</span>
            </div>
          </td>

          <td class="py-3 px-4 text-[var(--color-ink-muted)]">
            ${hedefStr}
          </td>

          <td class="py-3 px-4 min-w-[130px]">
            <div class="space-y-1">
              <div class="flex justify-between text-[10px] font-mono text-[var(--color-ink-faint)]">
                <span>${completedTasks}/${totalTasks}</span>
                <span>%${pct}</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-[var(--color-paper-4)] overflow-hidden">
                <div class="h-full bg-[var(--color-accent)] transition-all" style="width: ${pct}%"></div>
              </div>
            </div>
          </td>

          <td class="py-3 px-4 text-center">
            ${
              overdueTasks === 0
                ? `<span class="inline-flex items-center justify-center text-[var(--color-success)]"><i data-lucide="check" class="w-4 h-4"></i></span>`
                : `<span class="badge-count badge-danger">${overdueTasks}</span>`
            }
          </td>

          <td class="py-3 px-4 text-center">
            ${
              tekrarLazimSayisi === 0
                ? `<span class="text-[var(--color-ink-ghost)] font-mono">0</span>`
                : `<span class="badge-count text-[var(--color-warning)] bg-[var(--color-warning-bg)] border-[var(--color-warning-border)]">${tekrarLazimSayisi}</span>`
            }
          </td>

          <td class="py-3 px-4 text-right">
            <div class="inline-flex items-center gap-1.5">
              <button onclick="Store.setAktifOgrenci('${ogr.id}'); App.navigateTo('cockpit');" class="btn-tactile btn-tactile-ghost py-1 px-2 text-xs" title="Öğrenci Kokpitini Aç">
                <span>Kokpite Git</span>
                <i data-lucide="arrow-right" class="w-3 h-3"></i>
              </button>
              <button onclick="App.openGorevModal('${ogr.id}')" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-4)] transition-colors" title="Hızlı Ödev Ekle">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderOverviewOverdueList() {
    const container = document.getElementById('overview-overdue-list');
    if (!container) return;

    const aktifModul = this.getAktifModul();
    const allTasks = Store.getGorevler();
    let overdueTasks = allTasks.filter(g => g.durum === 'gecikti');

    if (aktifModul) {
      const modulOgrenciIds = new Set(Store.getOgrenciler().filter(o => o.modulId === aktifModul.id).map(o => String(o.id)));
      overdueTasks = overdueTasks.filter(g => modulOgrenciIds.has(String(g.ogrenciId)));
    }

    if (overdueTasks.length === 0) {
      container.innerHTML = `
        <div class="py-6 text-center text-xs text-[var(--color-success)] flex items-center justify-center gap-2">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          <span>${aktifModul ? `${aktifModul.ad} kademesi için geciken ödev bulunmuyor.` : 'Tüm ödevler zamanında, harika! Geciken görev bulunmuyor.'}</span>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = `
      <div class="divide-y divide-[var(--color-rule)]">
        ${overdueTasks.map(gorev => {
          const ogr = Store.getOgrenci(gorev.ogrenciId);
          const ders = this.getDers(gorev.dersId);
          const overdueDays = this.calculateOverdueDays(gorev.deadline);

          return `
            <div class="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div class="flex items-center gap-3 min-w-0">
                <span class="meta-pill text-[10px] text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border-[var(--color-accent-border)] font-semibold shrink-0">
                  ${ders.ad}
                </span>
                <div class="min-w-0">
                  <div class="font-semibold text-[var(--color-ink)] truncate">${gorev.baslik}</div>
                  <div class="text-[11px] text-[var(--color-ink-faint)] truncate">
                    Öğrenci: <span class="text-[var(--color-ink)] font-medium">${ogr ? ogr.adSoyad : '—'}</span>
                    ${gorev.deadline ? ` · Son Teslim: ${App.formatDate(gorev.deadline)}` : ''}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 shrink-0">
                <span class="badge-count badge-danger text-[10px] px-2">
                  ${overdueDays > 0 ? `${overdueDays} gün gecikti` : 'Gecikti'}
                </span>
                <button onclick="Store.gorevTamamla('${gorev.id}'); App.renderOverview(); App.showToast('Görev tamamlandı');" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-success)] hover:border-[var(--color-success-border)]">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  <span>Tamamla</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 2: ÖĞRENCİ KOKPİTİ (RENDER COCKPIT)
  // ─────────────────────────────────────────────────────────────
  renderCockpit() {
    const view = document.getElementById('view-cockpit');
    if (!view) return;

    const ogr = Store.getAktifOgrenci();

    // Aktif öğrenci yoksa boş durum uyarısı
    if (!ogr) {
      view.innerHTML = `
        <div class="max-w-md mx-auto py-20 text-center space-y-4">
          <div class="w-14 h-14 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
            <i data-lucide="user-x" class="w-7 h-7"></i>
          </div>
          <div>
            <h2 class="text-base font-bold font-display text-[var(--color-ink)]">Aktif Öğrenci Seçilmedi</h2>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Öğrenci kokpitini görüntülemek için üst menüden bir öğrenci seçin veya yeni bir öğrenci ekleyin.</p>
          </div>
          <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary">
            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
            <span>+ Yeni Öğrenci Ekle</span>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const tasks = Store.getGorevler(ogr.id);
    const aktifGorevler = Store.getAktifGorevler(ogr.id);
    const gecikmisGorevler = Store.getGecikmisGorevler(ogr.id);
    const tamamlananGorevler = tasks.filter(g => g.durum === 'tamamlandi');

    const toplamGorev = tasks.length;
    const tamamlanmaOrani = toplamGorev > 0 ? Math.round((tamamlananGorevler.length / toplamGorev) * 100) : 0;

    // Kritik eksik konular listesi (durum === 'tekrar_lazim')
    const kritikEksikKonular = (Store.data.ogrenciKonuDurumlari || []).filter(
      k => String(k.ogrenciId) === String(ogr.id) && k.durum === 'tekrar_lazim'
    );

    const modulObj = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null;
    const modulAd = modulObj ? modulObj.ad : (ogr.modulId || 'Modül');
    const sinifLabel = ogr.sinif ? `${ogr.sinif}. Sınıf` : '';

    // Aktif ödevler (tamamlanmamış ve henüz gecikmemiş)
    const devamEdenGorevler = aktifGorevler.filter(g => g.durum !== 'gecikti');

    view.innerHTML = `
      <div class="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <!-- Bölüm 1: Öğrenci Profil Başlığı -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
          <div class="flex items-center gap-4 min-w-0">
            <div class="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] flex items-center justify-center font-mono font-bold text-lg shrink-0">
              ${(ogr.ad ? ogr.ad[0] : '') + (ogr.soyad ? ogr.soyad[0] : '')}
            </div>
            <div class="min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-xl font-bold font-display tracking-tight text-[var(--color-ink)] truncate">${ogr.ad} ${ogr.soyad}</h1>
                <span class="meta-pill text-xs font-semibold">${sinifLabel} · ${modulAd}</span>
              </div>
              <div class="text-xs text-[var(--color-ink-muted)] flex items-center gap-3 flex-wrap">
                <span><i data-lucide="building" class="w-3.5 h-3.5 inline mr-1 text-[var(--color-ink-faint)]"></i>${ogr.okul || 'Okul girilmedi'}</span>
                <span><i data-lucide="target" class="w-3.5 h-3.5 inline mr-1 text-[var(--color-accent)]"></i>Hedef: <strong class="text-[var(--color-ink)]">${ogr.hedef || 'Belirtilmedi'}</strong></span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0">
            <button onclick="App.openGorevModal('${ogr.id}')" class="btn-tactile btn-tactile-primary">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Ödev Ekle</span>
            </button>
            <button onclick="App.openOgrenciModal('${ogr.id}')" class="btn-tactile btn-tactile-ghost">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Düzenle</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: KPI Kartları (4 kart) -->
        <div class="workbench-grid">
          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Aktif Ödev</span>
              <i data-lucide="check-square" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value text-[var(--color-accent)]">${aktifGorevler.length}</div>
            <div class="workbench-metric-sub">Takipteki görevler</div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Gecikmiş Ödev</span>
              <i data-lucide="alert-triangle" class="w-4 h-4 ${gecikmisGorevler.length > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}"></i>
            </div>
            <div class="workbench-metric-value ${gecikmisGorevler.length > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}">
              ${gecikmisGorevler.length}
            </div>
            <div class="workbench-metric-sub ${gecikmisGorevler.length > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}">
              ${gecikmisGorevler.length > 0 ? 'Müdahale gerekiyor' : 'Zamanında ilerliyor'}
            </div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Tamamlama Oranı</span>
              <i data-lucide="pie-chart" class="w-4 h-4 text-[var(--color-ink-faint)]"></i>
            </div>
            <div class="workbench-metric-value">%${tamamlanmaOrani}</div>
            <div class="workbench-metric-sub">${tamamlananGorevler.length} / ${toplamGorev} görev bitti</div>
          </div>

          <div class="workbench-card">
            <div class="workbench-card-header">
              <span class="workbench-card-title">Kritik Eksik Konu</span>
              <i data-lucide="alert-octagon" class="w-4 h-4 ${kritikEksikKonular.length > 0 ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-faint)]'}"></i>
            </div>
            <div class="workbench-metric-value ${kritikEksikKonular.length > 0 ? 'text-[var(--color-warning)]' : ''}">
              ${kritikEksikKonular.length}
            </div>
            <div class="workbench-metric-sub">Tekrar gereken kazanımlar</div>
          </div>
        </div>

        <!-- Bölüm 3: İki Kolon Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sol Kolon (7/12 genişlik) — Acil Müdahale Paneli -->
          <div class="lg:col-span-7 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
              <div class="flex items-center gap-2">
                <i data-lucide="flame" class="w-4 h-4 ${gecikmisGorevler.length > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}"></i>
                <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Acil Müdahale Paneli (Gecikenler)</h2>
              </div>
              <span class="badge-count ${gecikmisGorevler.length > 0 ? 'badge-danger' : ''}">${gecikmisGorevler.length}</span>
            </div>

            <div class="space-y-3">
              ${
                gecikmisGorevler.length === 0
                  ? `<div class="py-8 text-center text-xs text-[var(--color-success)] flex items-center justify-center gap-2">
                      <i data-lucide="check-circle" class="w-4 h-4"></i>
                      <span>Gecikmiş ödev yok, çalışma süreci planlandığı gibi gidiyor.</span>
                    </div>`
                  : gecikmisGorevler.map(gorev => {
                      const ders = this.getDers(gorev.dersId);
                      const overdueDays = this.calculateOverdueDays(gorev.deadline);
                      return `
                        <div class="p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] space-y-2">
                          <div class="flex items-center justify-between gap-2">
                            <span class="meta-pill text-[10px] text-[var(--color-accent)] font-semibold">${ders.ad}</span>
                            <span class="badge-count badge-danger text-[10px]">${overdueDays > 0 ? `${overdueDays} gün gecikti` : 'Gecikti'}</span>
                          </div>
                          <div class="font-semibold text-xs text-[var(--color-ink)]">${gorev.baslik}</div>
                          ${gorev.aciklama ? `<div class="text-[11px] text-[var(--color-ink-muted)]">${gorev.aciklama}</div>` : ''}
                          <div class="flex items-center justify-between pt-2 border-t border-[var(--color-rule)] text-[11px]">
                            <span class="font-mono text-[var(--color-ink-faint)]">Teslim: ${App.formatDate(gorev.deadline)}</span>
                            <div class="flex items-center gap-2">
                              <button onclick="Store.gorevTamamla('${gorev.id}'); App.renderCockpit(); App.showToast('Görev tamamlandı');" class="btn-tactile btn-tactile-ghost py-1 px-2 text-[var(--color-success)] hover:border-[var(--color-success-border)]">
                                <i data-lucide="check" class="w-3 h-3"></i> Tamamlandı
                              </button>
                              <button onclick="App.openGorevModal('${ogr.id}', '${gorev.id}')" class="p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                              </button>
                              <button onclick="App.openConfirmModal('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', () => { Store.deleteGorev('${gorev.id}'); App.renderCockpit(); });" class="p-1 text-[var(--color-danger)] hover:opacity-80">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      `;
                    }).join('')
              }
            </div>
          </div>

          <!-- Sağ Kolon (5/12 genişlik) — Kritik Eksik Konu Radarı -->
          <div class="lg:col-span-5 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
              <div class="flex items-center gap-2">
                <i data-lucide="radar" class="w-4 h-4 text-[var(--color-warning)]"></i>
                <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Kritik Eksik Konu Radarı</h2>
              </div>
              <span class="meta-pill text-[var(--color-warning)]">${kritikEksikKonular.length}</span>
            </div>

            <div class="space-y-3">
              ${
                kritikEksikKonular.length === 0
                  ? `<div class="py-8 text-center text-xs text-[var(--color-success)] flex items-center justify-center gap-2">
                      <i data-lucide="smile" class="w-4 h-4"></i>
                      <span>Kritik eksik konu yok. Tüm işlenen kazanımlar sağlam!</span>
                    </div>`
                  : kritikEksikKonular.map(item => {
                      const konu = this.getKonu(item.konuId);
                      const ders = this.getDers(konu.dersId);
                      return `
                        <div class="p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] space-y-2">
                          <div class="flex items-center justify-between">
                            <span class="meta-pill text-[10px] font-semibold">${ders.ad}</span>
                            <span class="text-[10px] font-mono text-[var(--color-warning)]">Tekrar Lazım</span>
                          </div>
                          <div class="font-semibold text-xs text-[var(--color-ink)]">${konu.konuAdi}</div>
                          ${item.not ? `<p class="text-[11px] text-[var(--color-ink-muted)] italic">${item.not}</p>` : ''}
                          <div class="pt-2 border-t border-[var(--color-rule)] text-right">
                            <button onclick="App.openGorevModal('${ogr.id}', null, '${item.konuId}')" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)] hover:border-[var(--color-accent-border)]">
                              <i data-lucide="plus-circle" class="w-3 h-3"></i>
                              <span>Telafi Ödevi Oluştur</span>
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')
              }
            </div>
          </div>
        </div>

        <!-- Bölüm 4: Aktif Ödevler Tablosu -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
            <div class="flex items-center gap-2">
              <i data-lucide="list-todo" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Aktif Çalışma & Ödev Listesi</h2>
            </div>
            <button onclick="App.openGorevModal('${ogr.id}')" class="btn-tactile btn-tactile-primary text-xs py-1 px-2.5">
              <i data-lucide="plus" class="w-3 h-3"></i>
              <span>Yeni Ödev Ekle</span>
            </button>
          </div>

          ${
            devamEdenGorevler.length === 0
              ? `<div class="py-8 text-center text-xs text-[var(--color-ink-muted)]">Aktif ödev bulunmuyor. Yeni bir görev ekleyerek başlayabilirsiniz.</div>`
              : `
                <div class="overflow-x-auto">
                  <table class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr class="border-b border-[var(--color-rule-strong)] text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-faint)]">
                        <th class="py-2.5 px-3">Ders</th>
                        <th class="py-2.5 px-3">Görev Başlığı</th>
                        <th class="py-2.5 px-3 text-center">Hedef Soru</th>
                        <th class="py-2.5 px-3">Teslim Tarihi</th>
                        <th class="py-2.5 px-3">Durum</th>
                        <th class="py-2.5 px-3 text-right">Aksiyonlar</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--color-rule)]">
                      ${devamEdenGorevler.map(g => {
                        const ders = this.getDers(g.dersId);
                        const bugunStr = new Date().toISOString().split('T')[0];
                        const isToday = g.deadline === bugunStr;

                        const durumOptions = Object.keys(typeof GOREV_DURUMLARI !== 'undefined' ? GOREV_DURUMLARI : { bekliyor: 'Bekliyor', devam_ediyor: 'Devam Ediyor', tamamlandi: 'Tamamlandı' }).map(key => {
                          const lbl = GOREV_DURUMLARI[key]?.label || key;
                          return `<option value="${key}" ${g.durum === key ? 'selected' : ''}>${lbl}</option>`;
                        }).join('');

                        return `
                          <tr class="hover:bg-[var(--color-paper-3)] transition-colors">
                            <td class="py-2.5 px-3">
                              <span class="meta-pill text-[10px] font-semibold">${ders.ad}</span>
                            </td>
                            <td class="py-2.5 px-3 font-semibold text-[var(--color-ink)]">
                              ${g.baslik}
                            </td>
                            <td class="py-2.5 px-3 text-center font-mono">
                              ${g.hedefSoru ? g.hedefSoru : '—'}
                            </td>
                            <td class="py-2.5 px-3 font-mono text-[11px]">
                              ${
                                isToday
                                  ? `<span class="px-1.5 py-0.5 rounded bg-[var(--color-warning-bg)] text-[var(--color-warning)] font-semibold">Bugün</span>`
                                  : App.formatDate(g.deadline)
                              }
                            </td>
                            <td class="py-2.5 px-3">
                              <select onchange="Store.updateGorev('${g.id}', { durum: this.value }); App.renderCockpit();" class="select-instrument text-xs py-1 px-2">
                                ${durumOptions}
                              </select>
                            </td>
                            <td class="py-2.5 px-3 text-right">
                              <div class="inline-flex items-center gap-1.5">
                                <button onclick="Store.gorevTamamla('${g.id}'); App.renderCockpit(); App.showToast('Görev tamamlandı');" class="p-1 text-[var(--color-success)] hover:opacity-80" title="Tamamla">
                                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                                </button>
                                <button onclick="App.openGorevModal('${ogr.id}', '${g.id}')" class="p-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]" title="Düzenle">
                                  <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="App.openConfirmModal('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', () => { Store.deleteGorev('${g.id}'); App.renderCockpit(); });" class="p-1 text-[var(--color-danger)] hover:opacity-80" title="Sil">
                                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              `
          }
        </div>

        <!-- Bölüm 5: Koçun Haftalık Notu -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
            <div class="flex items-center gap-2">
              <i data-lucide="message-square" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Koçun Haftalık Notu & Geri Bildirimi</h2>
            </div>
            <span class="text-[11px] font-mono text-[var(--color-ink-faint)]">Düzenlemek için tıklayın</span>
          </div>

          <div id="coach-note-display-wrapper" class="cursor-pointer group p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all">
            <p id="coach-note-text" class="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              ${ogr.kocNotu ? ogr.kocNotu : '<span class="text-[var(--color-ink-ghost)] italic">Henüz haftalık koçluk notu eklenmedi. Eklemek için tıklayın...</span>'}
            </p>
          </div>

          <div id="coach-note-editor-wrapper" class="hidden space-y-2">
            <textarea id="coach-note-textarea" rows="3" class="w-full text-xs p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">${ogr.kocNotu || ''}</textarea>
            <div class="flex items-center justify-end gap-2">
              <button id="btn-cancel-coach-note" class="btn-tactile btn-tactile-ghost text-xs py-1 px-3">Vazgeç</button>
              <button id="btn-save-coach-note" class="btn-tactile btn-tactile-primary text-xs py-1 px-3">Kaydet</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Koç notu inline editör bağlama
    const displayWrapper = document.getElementById('coach-note-display-wrapper');
    const editorWrapper = document.getElementById('coach-note-editor-wrapper');
    const textarea = document.getElementById('coach-note-textarea');
    const btnSave = document.getElementById('btn-save-coach-note');
    const btnCancel = document.getElementById('btn-cancel-coach-note');

    if (displayWrapper && editorWrapper) {
      displayWrapper.addEventListener('click', () => {
        displayWrapper.classList.add('hidden');
        editorWrapper.classList.remove('hidden');
        if (textarea) textarea.focus();
      });
    }

    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        editorWrapper.classList.add('hidden');
        displayWrapper.classList.remove('hidden');
      });
    }

    if (btnSave && textarea) {
      btnSave.addEventListener('click', () => {
        const val = textarea.value.trim();
        Store.updateOgrenci(ogr.id, { kocNotu: val });
        this.showToast('Koç notu kaydedildi');
        this.renderCockpit();
      });
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 3: ÇALIŞMA & ÖDEV MATRİSİ (RENDER MATRIX)
  // ─────────────────────────────────────────────────────────────
  renderMatrix() {
    const view = document.getElementById('view-matrix');
    if (!view) return;

    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      view.innerHTML = `
        <div class="max-w-7xl mx-auto p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div class="max-w-md w-full text-center space-y-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-8">
            <div class="w-12 h-12 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
              <i data-lucide="grid" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Öğrenci Seçilmedi</h3>
              <p class="text-xs text-[var(--color-ink-muted)] mt-1">
                Çalışma ve ödev matrisini görüntülemek için lütfen üst menüden bir öğrenci seçin veya yeni öğrenci kaydı oluşturun.
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary text-xs">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span>+ Yeni Öğrenci Ekle</span>
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const dersler = Store.getDerslerForOgrenci(ogr);
    const modul = Store.getModulForOgrenci(ogr) || { ad: 'Modül', id: ogr.modulId };

    // Kural 1: App.matrisAktifDersId ilk açılışta öğrencinin ilk dersi olarak set edilir
    if (!this.matrisAktifDersId || !dersler.some(d => d.id === this.matrisAktifDersId)) {
      this.matrisAktifDersId = dersler.length > 0 ? dersler[0].id : '';
    }

    const seciliDers = dersler.find(d => d.id === this.matrisAktifDersId) || dersler[0];
    const tumKonular = seciliDers ? Store.getKonularForDers(seciliDers.id) : [];

    // Kural 2: App.matrisAktifKonuId ilk açılışta null
    if (this.matrisAktifKonuId && !tumKonular.some(k => k.id === this.matrisAktifKonuId)) {
      this.matrisAktifKonuId = null;
    }

    // Tamamlanan konu sayısı ve yüzdesi
    const tamamlananKonuSayisi = tumKonular.filter(k => {
      const kd = Store.getKonuDurumu(ogr.id, k.id);
      return kd && kd.durum === 'tamam';
    }).length;
    const konuIlerlemePct = tumKonular.length > 0 ? Math.round((tamamlananKonuSayisi / tumKonular.length) * 100) : 0;

    // Ünite gruplaması
    const unitMap = new Map();
    tumKonular.forEach(k => {
      const key = k.uniteNo || k.uniteAdi || '1';
      if (!unitMap.has(key)) {
        unitMap.set(key, {
          uniteNo: k.uniteNo || 1,
          uniteAdi: k.uniteAdi || 'Ünite ' + key,
          konular: []
        });
      }
      unitMap.get(key).konular.push(k);
    });

    // Seçili konu detayı
    const seciliKonu = this.matrisAktifKonuId ? Store.getKonu(this.matrisAktifKonuId) : null;
    const konuDurumu = seciliKonu ? Store.getKonuDurumu(ogr.id, seciliKonu.id) : { durum: 'islenmedi', not: '' };

    // Bu konuya ait görevler
    const konuTasks = seciliKonu ? Store.getGorevler(ogr.id).filter(g => g.konuId === seciliKonu.id) : [];
    const toplamCozulen = konuTasks.reduce((acc, g) => acc + (g.cozulenSoru || 0), 0);
    const toplamDogru = konuTasks.reduce((acc, g) => acc + (g.dogruSoru || 0), 0);
    const toplamYanlis = konuTasks.reduce((acc, g) => acc + (g.yanlisSoru || 0), 0);
    const toplamHedef = konuTasks.reduce((acc, g) => acc + (g.hedefSoru || 0), 0);
    const dogrulukPct = toplamCozulen > 0 ? Math.round((toplamDogru / toplamCozulen) * 100) : 0;

    // Öğrencinin seçili kaynakları
    const seciliKaynakIds = Array.isArray(ogr.seciliKaynaklar) ? ogr.seciliKaynaklar : [];
    const kaynaklar = seciliKaynakIds.map(id => Store.getKaynak(id)).filter(Boolean);

    view.innerHTML = `
      <div class="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <!-- Bölüm 1: Sayfa Başlığı & Ders Seçici -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="meta-pill">AKADEMİK MATRİS</span>
              <span class="text-xs font-mono text-[var(--color-ink-faint)]">${ogr.adSoyad} (${ogr.sinif}. Sınıf · ${modul.ad})</span>
            </div>
            <h1 class="text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">Çalışma & Ödev Matrisi</h1>
            <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">Ders kazanımları, konu tamamlama durumları ve kaynak bazlı soru takibi</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button onclick="App.openKaynakModal()" class="btn-tactile btn-tactile-ghost flex items-center gap-1.5" title="Sisteme Yeni Kaynak Ekle">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Kaynak Ekle</span>
            </button>
            <button onclick="App.openMatrisSutunModal()" class="btn-tactile btn-tactile-ghost flex items-center gap-1.5" title="Öğrencinin Takip Ettiği Kaynakları Düzenle">
              <i data-lucide="columns" class="w-3.5 h-3.5"></i>
              <span>Sütunları Düzenle</span>
            </button>
          </div>
        </div>

        <!-- Ders Sekmeleri (Tabs) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--color-rule)]">
          ${dersler.map(d => {
            const isDersActive = d.id === this.matrisAktifDersId;
            return `
              <button onclick="App.selectMatrisDers('${d.id}')" class="px-4 py-2 text-xs font-semibold rounded-[var(--radius-sm)] transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${isDersActive ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] border border-[var(--color-rule)]'}">
                <span>${d.ad}</span>
                ${isDersActive ? `<span class="w-1.5 h-1.5 rounded-full bg-white"></span>` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Bölüm 2: Ana İçerik (İki Kolon: Sol 4/12, Sağ 8/12) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Sol Kolon (4/12): Konu Listesi -->
          <div class="lg:col-span-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
              <div>
                <h3 class="font-display font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]">${seciliDers ? seciliDers.ad : 'Ders'} Konuları</h3>
                <p class="text-[11px] font-mono text-[var(--color-ink-faint)] mt-0.5">${tamamlananKonuSayisi} / ${tumKonular.length} konu tamamlandı (%${konuIlerlemePct})</p>
              </div>
              <div class="w-16 h-1.5 rounded-full bg-[var(--color-paper-4)] overflow-hidden">
                <div class="h-full bg-[var(--color-accent)]" style="width: ${konuIlerlemePct}%"></div>
              </div>
            </div>

            <div class="space-y-4 max-h-[620px] overflow-y-auto pr-1">
              ${tumKonular.length === 0 ? `
                <div class="py-12 text-center text-xs text-[var(--color-ink-muted)]">
                  Bu ders için müfredat konusu bulunamadı.
                </div>
              ` : Array.from(unitMap.values()).map(u => `
                <div class="space-y-1.5">
                  <div class="text-[11px] font-mono font-semibold uppercase text-[var(--color-ink-faint)] px-2 py-1 bg-[var(--color-paper-3)] rounded-[var(--radius-xs)] flex items-center justify-between">
                    <span>▼ Ünite ${u.uniteNo} — ${u.uniteAdi}</span>
                    <span>${u.konular.length}</span>
                  </div>
                  <div class="space-y-1 pl-1">
                    ${u.konular.map(konu => {
                      const kd = Store.getKonuDurumu(ogr.id, konu.id);
                      const kdMeta = KONU_DURUMLARI[kd.durum] || KONU_DURUMLARI.islenmedi;
                      const isSelected = konu.id === this.matrisAktifKonuId;
                      return `
                        <div onclick="App.selectMatrisKonu('${konu.id}')" class="p-2.5 rounded-[var(--radius-sm)] border cursor-pointer transition-all flex items-center justify-between gap-2 group ${isSelected ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'bg-[var(--color-paper)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-paper-3)]'}">
                          <div class="min-w-0 flex items-center gap-2">
                            <i data-lucide="${kdMeta.ikon || 'circle'}" class="w-3.5 h-3.5 shrink-0 ${kd.durum === 'tamam' ? 'text-[var(--color-success)]' : kd.durum === 'tekrar_lazim' ? 'text-[var(--color-danger)]' : kd.durum === 'calisiliyor' ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-ghost)]'}"></i>
                            <span class="text-xs font-medium text-[var(--color-ink)] truncate ${isSelected ? 'font-semibold text-[var(--color-accent)]' : ''}">${konu.konuAdi}</span>
                          </div>
                          <span class="meta-pill text-[10px] shrink-0 ${kd.durum === 'tamam' ? 'text-[var(--color-success)] bg-[var(--color-success-bg)]' : kd.durum === 'tekrar_lazim' ? 'text-[var(--color-danger)] bg-[var(--color-danger-bg)]' : kd.durum === 'calisiliyor' ? 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]' : ''}">
                            ${kdMeta.label}
                          </span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Sağ Kolon (8/12): Konu Detay Paneli -->
          <div class="lg:col-span-8 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-6">
            ${!seciliKonu ? `
              <div class="py-24 text-center space-y-3">
                <div class="w-12 h-12 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
                  <i data-lucide="mouse-pointer-click" class="w-6 h-6"></i>
                </div>
                <div>
                  <h4 class="font-display font-semibold text-sm text-[var(--color-ink)]">Sol panelden bir konu seçin</h4>
                  <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">Konunun tamamlama durumunu değiştirebilir, soru sayılarını girebilir ve kaynak ödevlerini yönetebilirsiniz.</p>
                </div>
              </div>
            ` : `
              <!-- Konu Başlığı Alanı -->
              <div class="space-y-3 pb-4 border-b border-[var(--color-rule)]">
                <div>
                  <div class="text-[11px] font-mono text-[var(--color-ink-faint)]">Ünite ${seciliKonu.uniteNo || 1} — ${seciliKonu.uniteAdi}</div>
                  <h2 class="text-xl font-bold font-display text-[var(--color-ink)] mt-0.5">${seciliKonu.konuAdi}</h2>
                  ${seciliKonu.aciklama ? `<p class="text-xs text-[var(--color-ink-muted)] mt-0.5">${seciliKonu.aciklama}</p>` : ''}
                </div>

                <!-- Durum Değiştirici (4 Buton) -->
                <div>
                  <label class="block text-[11px] font-mono font-medium text-[var(--color-ink-faint)] mb-1.5 uppercase">Kazanım Durumu</label>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    ${Object.keys(KONU_DURUMLARI).map(kKey => {
                      const kMeta = KONU_DURUMLARI[kKey];
                      const isCurrent = konuDurumu.durum === kKey;
                      return `
                        <button onclick="App.setKonuDurumu('${seciliKonu.id}', '${kKey}')" class="p-2 rounded-[var(--radius-sm)] border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isCurrent ? 'bg-[var(--color-paper-4)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] text-[var(--color-ink)]' : 'bg-[var(--color-paper-3)] border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:border-[var(--color-rule-strong)] hover:text-[var(--color-ink)]'}">
                          <i data-lucide="${kMeta.ikon || 'circle'}" class="w-3.5 h-3.5 ${kKey === 'tamam' ? 'text-[var(--color-success)]' : kKey === 'tekrar_lazim' ? 'text-[var(--color-danger)]' : kKey === 'calisiliyor' ? 'text-[var(--color-warning)]' : 'text-[var(--color-ink-faint)]'}"></i>
                          <span>${kMeta.label}</span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>

                <!-- Koç Not Alanı -->
                <div class="p-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-sm)] space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                      <i data-lucide="edit-3" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                      <span>Koç Notu & Çalışma Direktifi</span>
                    </span>
                    <button onclick="App.saveKonuNotu('${seciliKonu.id}')" class="btn-tactile btn-tactile-ghost py-1 px-2 text-xs">
                      <i data-lucide="save" class="w-3 h-3"></i>
                      <span>Notu Kaydet</span>
                    </button>
                  </div>
                  <textarea id="matris-konu-not" rows="2" placeholder="Bu konuyla ilgili öğrenciye özel not veya direktif..." class="w-full p-2 rounded-[var(--radius-xs)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">${konuDurumu.not || ''}</textarea>
                </div>
              </div>

              <!-- İlerleme Özeti (Konu Bazlı Toplam) -->
              <div class="bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-sm)] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] flex items-center justify-center font-bold text-xs">
                    %${dogrulukPct}
                  </div>
                  <div>
                    <div class="font-bold text-xs text-[var(--color-ink)]">${toplamCozulen} Soru Çözüldü</div>
                    <div class="text-[11px] text-[var(--color-ink-muted)]">Doğruluk: %${dogrulukPct} · Doğru: ${toplamDogru} · Yanlış: ${toplamYanlis}</div>
                  </div>
                </div>
                <div class="text-right font-mono text-[11px] text-[var(--color-ink-faint)]">
                  Toplam Hedef: ${toplamHedef || toplamCozulen} Soru
                </div>
              </div>

              <!-- Kaynak Kartları -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h3 class="font-display font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]">
                    Takip Edilen Kaynaklar (${kaynaklar.length})
                  </h3>
                  <button onclick="App.openMatrisSutunModal()" class="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1">
                    <i data-lucide="settings" class="w-3 h-3"></i>
                    <span>Kaynakları Yönet</span>
                  </button>
                </div>

                ${kaynaklar.length === 0 ? `
                  <div class="p-6 text-center rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-dashed border-[var(--color-rule-strong)] space-y-2">
                    <p class="text-xs text-[var(--color-ink-muted)]">Henüz bu öğrenci için çalışma kaynağı seçilmemiş.</p>
                    <button onclick="App.openMatrisSutunModal()" class="btn-tactile btn-tactile-primary text-xs">
                      <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                      <span>Kaynak Seç & Ekle</span>
                    </button>
                  </div>
                ` : `
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${kaynaklar.map(kyn => {
                      const kTasks = konuTasks.filter(g => g.kaynakId === kyn.id);
                      const kHedef = kTasks.reduce((acc, g) => acc + (g.hedefSoru || 0), 0);
                      const kCozulen = kTasks.reduce((acc, g) => acc + (g.cozulenSoru || 0), 0);
                      const kDogru = kTasks.reduce((acc, g) => acc + (g.dogruSoru || 0), 0);
                      const kYanlis = kTasks.reduce((acc, g) => acc + (g.yanlisSoru || 0), 0);
                      const kBos = Math.max(0, kCozulen - kDogru - kYanlis);
                      const kPct = kHedef > 0 ? Math.min(100, Math.round((kCozulen / kHedef) * 100)) : (kCozulen > 0 ? 100 : 0);

                      return `
                        <div class="p-3.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all space-y-3">
                          <div class="flex items-start justify-between gap-2">
                            <div>
                              <div class="font-bold text-xs text-[var(--color-ink)]">${kyn.yayinevi}</div>
                              <div class="text-[11px] text-[var(--color-ink-muted)] truncate">${kyn.ad}</div>
                            </div>
                            <span class="meta-pill text-[10px] font-mono">%${kPct}</span>
                          </div>

                          <!-- Soru & İlerleme Çubuğu -->
                          <div class="space-y-1">
                            <div class="flex justify-between text-[11px] font-mono text-[var(--color-ink-faint)]">
                              <span>Çözülen: ${kCozulen} / ${kHedef || kCozulen} soru</span>
                              <span>${kPct}%</span>
                            </div>
                            <div class="w-full h-1.5 rounded-full bg-[var(--color-paper-4)] overflow-hidden">
                              <div class="h-full bg-[var(--color-accent)]" style="width: ${kPct}%"></div>
                            </div>
                          </div>

                          <!-- D / Y / B İstatistikleri -->
                          <div class="flex items-center gap-3 text-xs font-mono">
                            <span class="text-[var(--color-success)] font-semibold">D: ${kDogru}</span>
                            <span class="text-[var(--color-danger)] font-semibold">Y: ${kYanlis}</span>
                            <span class="text-[var(--color-ink-muted)]">B: ${kBos}</span>
                          </div>

                          <!-- Aksiyon Butonları -->
                          <div class="flex items-center gap-2 pt-2 border-t border-[var(--color-rule)]">
                            <button onclick="App.openSoruGirisiModal('${ogr.id}', '${seciliKonu.id}', '${kyn.id}')" class="btn-tactile btn-tactile-ghost py-1 px-2 text-[11px] flex-1 flex items-center justify-center gap-1">
                              <i data-lucide="plus" class="w-3 h-3"></i>
                              <span>+ Soru Ekle / Güncelle</span>
                            </button>
                            <button onclick="App.openGorevModal('${ogr.id}', null, '${seciliKonu.id}', '${kyn.id}')" class="btn-tactile btn-tactile-primary py-1 px-2 text-[11px] flex-1 flex items-center justify-center gap-1">
                              <i data-lucide="check-square" class="w-3 h-3"></i>
                              <span>Ödev Oluştur</span>
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                `}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  selectMatrisDers(dersId) {
    this.matrisAktifDersId = dersId;
    this.matrisAktifKonuId = null;
    this.renderMatrix();
  },

  selectMatrisKonu(konuId) {
    this.matrisAktifKonuId = konuId;
    this.renderMatrix();
  },

  setKonuDurumu(konuId, durum) {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) return;
    const kd = Store.getKonuDurumu(ogr.id, konuId);
    Store.setKonuDurumu(ogr.id, konuId, durum, kd.not || '');
    const meta = KONU_DURUMLARI[durum] || { label: durum };
    this.showToast(`Konu durumu "${meta.label}" olarak güncellendi`);
    this.renderMatrix();
  },

  saveKonuNotu(konuId) {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) return;
    const textarea = document.getElementById('matris-konu-not');
    const val = textarea ? textarea.value.trim() : '';
    const kd = Store.getKonuDurumu(ogr.id, konuId);
    Store.setKonuDurumu(ogr.id, konuId, kd.durum || 'islenmedi', val);
    this.showToast('Konu notu kaydedildi');
  },

  openSoruGirisiModal(ogrenciId, konuId, kaynakId) {
    const ogr = Store.getOgrenci(ogrenciId);
    const konu = Store.getKonu(konuId);
    const kaynak = Store.getKaynak(kaynakId);
    if (!ogr || !konu || !kaynak) return;

    // Mevcut bir görev var mı bak
    const existing = Store.getGorevler(ogr.id).find(g => g.konuId === konuId && g.kaynakId === kaynakId);
    const defDogru = existing ? (existing.dogruSoru || 0) : 0;
    const defYanlis = existing ? (existing.yanlisSoru || 0) : 0;
    const defHedef = existing ? (existing.hedefSoru || 0) : 0;
    const defBos = existing ? Math.max(0, (existing.cozulenSoru || 0) - defDogru - defYanlis) : 0;

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Soru Girişi & Sonuç Takibi</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">
              ${kaynak.yayinevi} · <strong class="text-[var(--color-ink)]">${konu.konuAdi}</strong>
            </p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-soru-girisi" class="space-y-4 text-xs">
          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Hedef Soru Sayısı</label>
            <input type="number" id="sg-hedef" min="0" value="${defHedef || 40}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-success)] mb-1">Doğru (D)</label>
              <input type="number" id="sg-dogru" min="0" value="${defDogru}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-success)]">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-danger)] mb-1">Yanlış (Y)</label>
              <input type="number" id="sg-yanlis" min="0" value="${defYanlis}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-danger)]">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Boş (B)</label>
              <input type="number" id="sg-bos" min="0" value="${defBos}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <div class="p-3 bg-[var(--color-paper-3)] rounded-[var(--radius-sm)] border border-[var(--color-rule)] flex items-center justify-between text-xs">
            <span class="text-[var(--color-ink-muted)]">Toplam Çözülen:</span>
            <span id="sg-toplam-preview" class="font-mono font-bold text-[var(--color-ink)]">${defDogru + defYanlis + defBos} Soru</span>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">Kaydet</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const inputHedef = document.getElementById('sg-hedef');
    const inputDogru = document.getElementById('sg-dogru');
    const inputYanlis = document.getElementById('sg-yanlis');
    const inputBos = document.getElementById('sg-bos');
    const preview = document.getElementById('sg-toplam-preview');

    const updatePreview = () => {
      const d = Math.max(0, parseInt(inputDogru?.value) || 0);
      const y = Math.max(0, parseInt(inputYanlis?.value) || 0);
      const b = Math.max(0, parseInt(inputBos?.value) || 0);
      if (preview) preview.textContent = `${d + y + b} Soru`;
    };

    [inputDogru, inputYanlis, inputBos, inputHedef].forEach(el => {
      if (el) el.addEventListener('input', updatePreview);
    });

    const form = document.getElementById('form-soru-girisi');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = parseInt(inputDogru.value) || 0;
        const y = parseInt(inputYanlis.value) || 0;
        const b = parseInt(inputBos.value) || 0;
        const hedef = parseInt(inputHedef.value) || (d + y + b);

        // Kural 6: Negatif sayı kabul edilmez
        if (d < 0 || y < 0 || b < 0 || hedef < 0) {
          this.showToast('Soru sayıları negatif olamaz!');
          return;
        }

        const toplamCozulen = d + y + b;
        // Kural 6: Toplam hedefSoru'yu aşamaz
        if (hedef > 0 && toplamCozulen > hedef) {
          this.showToast(`Çözülen soru (${toplamCozulen}), hedef soru sayısını (${hedef}) aşamaz!`);
          return;
        }

        if (existing) {
          Store.updateGorev(existing.id, {
            dogruSoru: d,
            yanlisSoru: y,
            cozulenSoru: toplamCozulen,
            hedefSoru: Math.max(existing.hedefSoru || 0, hedef, toplamCozulen),
            durum: 'tamamlandi'
          });
        } else {
          Store.addGorev({
            ogrenciId: ogr.id,
            konuId,
            kaynakId,
            dersId: konu.dersId,
            baslik: `${kaynak.yayinevi} - ${konu.konuAdi}`,
            hedefSoru: hedef || toplamCozulen,
            cozulenSoru: toplamCozulen,
            dogruSoru: d,
            yanlisSoru: y,
            durum: 'tamamlandi'
          });
        }

        // Konu durumunu otomatik olarak 'calisiliyor' ya da 'tamam' yap (eğer henüz islenmedi ise)
        const kd = Store.getKonuDurumu(ogr.id, konuId);
        if (kd.durum === 'islenmedi') {
          Store.setKonuDurumu(ogr.id, konuId, 'calisiliyor', kd.not);
        }

        this.closeModal();
        this.showToast('Soru verisi başarıyla kaydedildi');
        this.renderMatrix();
      });
    }
  },

  openMatrisSutunModal() {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }

    const tumKaynaklar = Store.getKaynaklar();
    const seciliSet = new Set(Array.isArray(ogr.seciliKaynaklar) ? ogr.seciliKaynaklar : []);

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Matris Kaynak Sütunları</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Öğrencinin çalışma matrisinde takip edilecek kaynakları seçin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-matris-sutunlar" class="space-y-3 text-xs">
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            ${tumKaynaklar.map(k => {
              const isChecked = seciliSet.has(k.id);
              return `
                <label class="p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] flex items-center justify-between cursor-pointer transition-colors">
                  <div class="flex items-center gap-3">
                    <input type="checkbox" name="matris-kaynak" value="${k.id}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]">
                    <div>
                      <div class="font-semibold text-[var(--color-ink)]">${k.yayinevi}</div>
                      <div class="text-[11px] text-[var(--color-ink-muted)]">${k.ad}</div>
                    </div>
                  </div>
                  <span class="meta-pill text-[10px] font-mono">Kaynak</span>
                </label>
              `;
            }).join('')}
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.openKaynakModal()" class="btn-tactile btn-tactile-ghost text-xs">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Yeni Kaynak Tanımla</span>
            </button>
            <div class="flex items-center gap-2">
              <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
              <button type="submit" class="btn-tactile btn-tactile-primary">Sütunları Kaydet</button>
            </div>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-matris-sutunlar');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkedBoxes = Array.from(form.querySelectorAll('input[name="matris-kaynak"]:checked'));
        const selectedIds = checkedBoxes.map(cb => cb.value);

        Store.updateOgrenci(ogr.id, { seciliKaynaklar: selectedIds });
        this.closeModal();
        this.showToast('Kaynak sütunları güncellendi');
        this.renderMatrix();
      });
    }
  },

  openKaynakModal(kaynakId = null) {
    const isEdit = Boolean(kaynakId);
    const kaynak = isEdit ? Store.getKaynak(kaynakId) : null;
    const ogr = Store.getAktifOgrenci();
    const dersler = ogr ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();

    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const turler = ['Soru Bankası', 'Deneme', 'Fasikül', 'Kaynak Kitap', 'Diğer'];
    const seciliModuller = kaynak && Array.isArray(kaynak.modulId)
      ? kaynak.modulId
      : (kaynak && kaynak.modulId ? [kaynak.modulId] : ['yks']);

    const seciliTur = kaynak ? kaynak.tur || 'Soru Bankası' : 'Soru Bankası';
    const seciliZorluk = kaynak ? Math.max(1, Math.min(5, Number(kaynak.zorluk) || 3)) : 3;
    const seciliDersId = kaynak ? kaynak.dersId || '' : '';

    const dersOptions = `<option value="">— Genel (Tüm Dersler) —</option>` +
      dersler.map(d => `<option value="${d.id}" ${seciliDersId === d.id ? 'selected' : ''}>${d.ad}</option>`).join('');

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Kütüphaneye yeni bir yayın, soru bankası veya deneme kaydedin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-kaynak" class="space-y-3.5 text-xs">
          <!-- Yayın Adı -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">Yayın / Kitap Adı <span class="text-[var(--color-danger)]">*</span></label>
            <input type="text" id="kyn-input-ad" value="${kaynak ? kaynak.ad : ''}" required placeholder="Örn: Nitelik Süper LGS Soru Bankası" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
          </div>

          <!-- Yayınevi & Tür -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Yayınevi <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="kyn-input-yayinevi" value="${kaynak ? kaynak.yayinevi : ''}" required placeholder="Örn: Nitelik, Bilgi Sarmal, Hız" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Türü</label>
              <select id="kyn-input-tur" class="select-instrument w-full p-2">
                ${turler.map(t => `<option value="${t}" ${seciliTur === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Ders İlişkisi -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">Ders İlişkisi</label>
            <select id="kyn-input-ders" class="select-instrument w-full p-2">
              ${dersOptions}
            </select>
          </div>

          <!-- Hedef Modüller (Checkboxes) -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1.5">Hedef Eğitim Kademesi / Modüller</label>
            <div class="flex items-center gap-4 flex-wrap">
              ${moduller.map(m => `
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" name="kyn-modul" value="${m.id}" ${seciliModuller.includes(m.id) ? 'checked' : ''} class="rounded border-[var(--color-rule)] text-[var(--color-accent)]">
                  <span class="text-[var(--color-ink)] font-medium">${m.ad}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Zorluk Derecesi (1-5 Slider) -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-semibold text-[var(--color-ink)]">Zorluk Seviyesi</label>
              <span id="kyn-zorluk-val" class="font-mono font-bold text-[var(--color-accent)]">${seciliZorluk} / 5</span>
            </div>
            <input type="range" id="kyn-input-zorluk" min="1" max="5" value="${seciliZorluk}" oninput="document.getElementById('kyn-zorluk-val').textContent = this.value + ' / 5'" class="w-full accent-[var(--color-accent)] cursor-pointer">
            <div class="flex justify-between text-[10px] text-[var(--color-ink-muted)] px-0.5">
              <span>1 (Temel)</span>
              <span>3 (Orta)</span>
              <span>5 (İleri / Maraton)</span>
            </div>
          </div>

          <!-- Açıklama -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">Açıklama / Not</label>
            <textarea id="kyn-input-aciklama" class="input-editorial w-full text-xs p-2.5 h-16" placeholder="Kaynak içeriği, yeni nesil soru oranı...">${kaynak ? (kaynak.aciklama || '') : ''}</textarea>
          </div>

          <!-- Butonlar -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">İptal</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Kaynağı Ekle'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-kaynak');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ad = document.getElementById('kyn-input-ad').value.trim();
        const yayinevi = document.getElementById('kyn-input-yayinevi').value.trim();
        const tur = document.getElementById('kyn-input-tur').value;
        const dersId = document.getElementById('kyn-input-ders').value;
        const zorluk = parseInt(document.getElementById('kyn-input-zorluk').value) || 3;
        const aciklama = document.getElementById('kyn-input-aciklama').value.trim();

        const secilenModuller = Array.from(document.querySelectorAll('input[name="kyn-modul"]:checked')).map(cb => cb.value);
        const modulId = secilenModuller.length > 0 ? secilenModuller : ['yks'];

        if (!ad || !yayinevi) {
          this.showToast('Lütfen yayın adı ve yayınevini giriniz.');
          return;
        }

        if (isEdit) {
          Store.updateKaynak(kaynakId, { ad, yayinevi, tur, dersId, zorluk, aciklama, modulId });
          this.showToast('Kaynak güncellendi');
        } else {
          const yeni = Store.addKaynak({ ad, yayinevi, tur, dersId, zorluk, aciklama, modulId });

          // Eğer aktif öğrenci varsa, seçili kaynaklarına otomatik ekle
          if (ogr) {
            const sec = Array.isArray(ogr.seciliKaynaklar) ? [...ogr.seciliKaynaklar] : [];
            if (!sec.includes(yeni.id)) {
              sec.push(yeni.id);
              Store.updateOgrenci(ogr.id, { seciliKaynaklar: sec });
            }
          }
          this.showToast(`${yayinevi} - ${ad} kaynağı eklendi`);
        }

        this.closeModal();
        this.renderCurrentView();
      });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 4: ÖDEV GEÇMİŞİ (RENDER TASKS)
  // ─────────────────────────────────────────────────────────────
  renderTasks() {
    const view = document.getElementById('view-tasks');
    if (!view) return;

    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      view.innerHTML = `
        <div class="max-w-7xl mx-auto p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div class="max-w-md w-full text-center space-y-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-8">
            <div class="w-12 h-12 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
              <i data-lucide="check-square" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Öğrenci Seçilmedi</h3>
              <p class="text-xs text-[var(--color-ink-muted)] mt-1">
                Ödev geçmişini ve görev takibini görüntülemek için lütfen üst menüden bir öğrenci seçin.
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary text-xs">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span>+ Yeni Öğrenci Ekle</span>
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const dersler = Store.getDerslerForOgrenci(ogr);
    const allTasks = Store.getGorevler(ogr.id);
    const modul = Store.getModulForOgrenci(ogr) || { ad: 'Modül' };

    // Bölüm 2: Özet Satırı Hesaplamaları
    const aktifCount = allTasks.filter(g => g.durum !== 'tamamlandi').length;
    const gecikenCount = allTasks.filter(g => g.durum === 'gecikti').length;
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const buHaftaCount = allTasks.filter(g => {
      if (g.durum !== 'tamamlandi' || !g.tamamlanmaTarihi) return false;
      const t = new Date(g.tamamlanmaTarihi).getTime();
      return !isNaN(t) && t >= sevenDaysAgo;
    }).length;

    // Filtreleme
    let filtered = allTasks;
    if (this.tasksSearchQuery) {
      const q = this.tasksSearchQuery.toLowerCase();
      filtered = filtered.filter(g => {
        const ders = Store.getDers(g.dersId);
        const konu = Store.getKonu(g.konuId);
        return (g.baslik && g.baslik.toLowerCase().includes(q)) ||
               (ders && ders.ad.toLowerCase().includes(q)) ||
               (konu && konu.konuAdi.toLowerCase().includes(q));
      });
    }

    if (this.tasksDurumFilter) {
      filtered = filtered.filter(g => g.durum === this.tasksDurumFilter);
    }

    if (this.tasksDersFilter) {
      filtered = filtered.filter(g => g.dersId === this.tasksDersFilter);
    }

    if (this.tasksHideCompleted) {
      filtered = filtered.filter(g => g.durum !== 'tamamlandi');
    }

    // Bölüm 3: Gruplar
    const bugunStr = new Date().toISOString().split('T')[0];
    const groupGeciken = filtered.filter(g => g.durum === 'gecikti');
    const groupBugun = filtered.filter(g => g.durum !== 'tamamlandi' && g.durum !== 'gecikti' && g.deadline === bugunStr);
    const groupYaklasan = filtered.filter(g => g.durum !== 'tamamlandi' && g.durum !== 'gecikti' && g.deadline !== bugunStr);
    const groupTamamlanan = filtered.filter(g => g.durum === 'tamamlandi');

    const renderTaskItem = (g) => {
      const ders = Store.getDers(g.dersId) || { ad: 'Genel', renk: 'blue' };
      const konu = Store.getKonu(g.konuId);
      const kaynak = Store.getKaynak(g.kaynakId);
      const durumMeta = GOREV_DURUMLARI[g.durum] || GOREV_DURUMLARI.bekliyor;
      const isCompleted = g.durum === 'tamamlandi';

      return `
        <div class="p-3.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCompleted ? 'opacity-70 bg-[var(--color-paper-3)]' : ''}" style="border-left: 4px solid var(--color-${ders.renk || 'accent'});">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="meta-pill text-[10px] text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border-[var(--color-accent-border)] font-semibold">
                ${ders.ad}
              </span>
              ${konu ? `<span class="text-[11px] font-mono text-[var(--color-ink-faint)]">· ${konu.konuAdi}</span>` : ''}
              ${kaynak ? `<span class="meta-pill text-[10px] text-[var(--color-ink-muted)]">${kaynak.yayinevi}</span>` : ''}
            </div>
            <div class="font-bold text-xs text-[var(--color-ink)] ${isCompleted ? 'line-through text-[var(--color-ink-muted)]' : ''}">
              ${g.baslik}
            </div>
            <div class="flex items-center gap-3 text-[11px] text-[var(--color-ink-muted)] font-mono flex-wrap">
              ${g.hedefSoru ? `<span><i data-lucide="target" class="w-3 h-3 inline mr-1 text-[var(--color-ink-faint)]"></i>${g.hedefSoru} Soru</span>` : ''}
              ${g.sureDk ? `<span><i data-lucide="clock" class="w-3 h-3 inline mr-1 text-[var(--color-ink-faint)]"></i>${g.sureDk} Dk</span>` : ''}
              ${g.deadline ? `<span><i data-lucide="calendar" class="w-3 h-3 inline mr-1 text-[var(--color-ink-faint)]"></i>${App.formatDate(g.deadline)}</span>` : ''}
            </div>
            ${g.not ? `<div class="text-[11px] italic text-[var(--color-ink-muted)] mt-1">"${g.not}"</div>` : ''}
          </div>

          <div class="flex items-center gap-2 shrink-0 sm:self-center">
            <span class="meta-pill text-[10px] font-medium ${g.durum === 'tamamlandi' ? 'text-[var(--color-success)] bg-[var(--color-success-bg)]' : g.durum === 'gecikti' ? 'text-[var(--color-danger)] bg-[var(--color-danger-bg)]' : g.durum === 'devam_ediyor' ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]' : ''}">
              ${durumMeta.label}
            </span>

            ${!isCompleted ? `
              <button onclick="Store.gorevTamamla('${g.id}'); App.renderTasks(); App.showToast('Görev tamamlandı!');" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-success)] hover:bg-[var(--color-success-bg)] transition-colors" title="Görevi Tamamla">
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
            ` : ''}

            <button onclick="App.openGorevModal('${ogr.id}', '${g.id}')" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors" title="Düzenle">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>

            <button onclick="App.openConfirmModal('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', () => { Store.deleteGorev('${g.id}'); App.renderTasks(); App.showToast('Görev silindi'); });" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Sil">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    };

    const hasAnyTask = groupGeciken.length > 0 || groupBugun.length > 0 || groupYaklasan.length > 0 || groupTamamlanan.length > 0;

    view.innerHTML = `
      <div class="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
        <!-- Başlık -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="meta-pill">GÖREV TAKİBİ</span>
              <span class="text-xs font-mono text-[var(--color-ink-faint)]">${ogr.adSoyad} (${ogr.sinif}. Sınıf · ${modul.ad})</span>
            </div>
            <h1 class="text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">Ödev & Görev Geçmişi</h1>
            <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">Tüm ödevlerin teslim durumu, hedef soru sayıları ve koç notları</p>
          </div>
          <div>
            <button onclick="App.openGorevModal('${ogr.id}')" class="btn-tactile btn-tactile-primary">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>+ Yeni Ödev</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 4: Haftalık Direktif Banner -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0 flex-1">
            <div class="w-8 h-8 rounded-[var(--radius-xs)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="compass" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-[11px] font-mono uppercase tracking-wider text-[var(--color-accent)] font-semibold">Haftalık Koç Direktifi & Odak Noktası</div>
              <div id="tasks-directive-text" ondblclick="App.editDirective()" class="text-xs text-[var(--color-ink)] mt-0.5 cursor-pointer hover:underline" title="Düzenlemek için çift tıklayın">
                ${ogr.kocNotu ? ogr.kocNotu : '<span class="text-[var(--color-ink-muted)] italic">Henüz bu hafta için direktif girilmedi. Çift tıklayarak veya düzenle butonuna basarak direktif ekleyebilirsiniz.</span>'}
              </div>
              <div id="tasks-directive-editor" class="hidden mt-2 space-y-2">
                <textarea id="input-koc-direktif" rows="2" class="w-full p-2 text-xs rounded-[var(--radius-xs)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">${ogr.kocNotu || ''}</textarea>
                <div class="flex items-center gap-2">
                  <button onclick="App.saveDirective()" class="btn-tactile btn-tactile-primary py-1 px-2.5 text-xs">Kaydet</button>
                  <button onclick="App.cancelDirective()" class="btn-tactile btn-tactile-ghost py-1 px-2.5 text-xs">Vazgeç</button>
                </div>
              </div>
            </div>
          </div>
          <button onclick="App.editDirective()" class="btn-tactile btn-tactile-ghost py-1 px-2 text-xs shrink-0" title="Direktifi Düzenle">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            <span>Düzenle</span>
          </button>
        </div>

        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--color-paper-2)] p-3 rounded-[var(--radius-md)] border border-[var(--color-rule)]">
          <div class="relative flex-1 max-w-sm">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"></i>
            <input type="text" id="tasks-search" value="${this.tasksSearchQuery}" placeholder="Görev, ders veya konu ara..." class="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-sm)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-ghost)]">
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <select id="tasks-durum-filter" class="select-instrument text-xs py-1.5">
              <option value="">Tüm Durumlar</option>
              ${Object.keys(GOREV_DURUMLARI).map(k => `<option value="${k}" ${this.tasksDurumFilter === k ? 'selected' : ''}>${GOREV_DURUMLARI[k].label}</option>`).join('')}
            </select>
            <select id="tasks-ders-filter" class="select-instrument text-xs py-1.5">
              <option value="">Tüm Dersler</option>
              ${dersler.map(d => `<option value="${d.id}" ${this.tasksDersFilter === d.id ? 'selected' : ''}>${d.ad}</option>`).join('')}
            </select>
            <label class="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] cursor-pointer select-none px-2 py-1 bg-[var(--color-paper-3)] rounded-[var(--radius-xs)] border border-[var(--color-rule)]">
              <input type="checkbox" id="tasks-hide-completed" ${this.tasksHideCompleted ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-[var(--color-accent)]">
              <span>Tamamlananları Gizle</span>
            </label>
          </div>
        </div>

        <!-- Bölüm 2: Özet Satırı -->
        <div class="flex items-center justify-between text-xs text-[var(--color-ink-muted)] px-1">
          <div class="flex items-center gap-2 font-mono">
            <span><strong>${aktifCount}</strong> aktif</span>
            <span>·</span>
            <span class="${gecikenCount > 0 ? 'text-[var(--color-danger)] font-bold' : ''}"><strong>${gecikenCount}</strong> gecikmiş</span>
            <span>·</span>
            <span><strong>${buHaftaCount}</strong> bu hafta tamamlandı</span>
          </div>
          <div class="font-mono text-[11px] text-[var(--color-ink-faint)]">
            Toplam: ${allTasks.length} Görev
          </div>
        </div>

        <!-- Bölüm 3: Görev Listesi (Gruplu) -->
        <div class="space-y-6">
          ${!hasAnyTask ? `
            <div class="p-12 text-center rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-3">
              <div class="w-10 h-10 rounded-full bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
                <i data-lucide="inbox" class="w-5 h-5"></i>
              </div>
              <div>
                <p class="font-medium text-xs text-[var(--color-ink)]">Kriterlere uygun ödev bulunamadı</p>
                <p class="text-[11px] text-[var(--color-ink-muted)]">Arama filtrenizi temizleyebilir veya yeni bir ödev oluşturabilirsiniz.</p>
              </div>
              <button onclick="App.openGorevModal('${ogr.id}')" class="btn-tactile btn-tactile-primary text-xs">
                + Yeni Ödev Ekle
              </button>
            </div>
          ` : `
            <!-- 1. Gecikmiş Görevler (Kural 5: Boşsa gizlenir) -->
            ${groupGeciken.length > 0 ? `
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold font-display text-[var(--color-danger)] uppercase tracking-wider">
                  <span class="w-2 h-2 rounded-full bg-[var(--color-danger)]"></span>
                  <span>Gecikmiş Ödevler (${groupGeciken.length})</span>
                </div>
                <div class="space-y-2">
                  ${groupGeciken.map(renderTaskItem).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 2. Bugün Teslim (Kural 5: Boşsa gizlenir) -->
            ${groupBugun.length > 0 ? `
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold font-display text-[var(--color-warning)] uppercase tracking-wider">
                  <span class="w-2 h-2 rounded-full bg-[var(--color-warning)]"></span>
                  <span>Bugün Teslim Edilecekler (${groupBugun.length})</span>
                </div>
                <div class="space-y-2">
                  ${groupBugun.map(renderTaskItem).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 3. Yaklaşan Görevler (Kural 5: Boşsa gizlenir) -->
            ${groupYaklasan.length > 0 ? `
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-bold font-display text-[var(--color-accent)] uppercase tracking-wider">
                  <span class="w-2 h-2 rounded-full bg-[var(--color-accent)]"></span>
                  <span>Yaklaşan Ödevler (${groupYaklasan.length})</span>
                </div>
                <div class="space-y-2">
                  ${groupYaklasan.map(renderTaskItem).join('')}
                </div>
              </div>
            ` : ''}

            <!-- 4. Tamamlananlar (Kural 5: Boşsa gizlenir; Varsayılan kapalı) -->
            ${groupTamamlanan.length > 0 ? `
              <details class="group bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 space-y-3">
                <summary class="cursor-pointer font-display font-semibold text-xs text-[var(--color-ink)] flex items-center justify-between select-none">
                  <div class="flex items-center gap-2 text-[var(--color-success)]">
                    <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                    <span>Tamamlanan Ödevler (${groupTamamlanan.length})</span>
                  </div>
                  <i data-lucide="chevron-down" class="w-4 h-4 text-[var(--color-ink-faint)] transition-transform group-open:rotate-180"></i>
                </summary>
                <div class="space-y-2 pt-3 border-t border-[var(--color-rule)]">
                  ${groupTamamlanan.map(renderTaskItem).join('')}
                </div>
              </details>
            ` : ''}
          `}
        </div>
      </div>
    `;

    // Event Dinleyicileri (Kural 4: State view'lar arası geçişte korunur)
    const searchInput = document.getElementById('tasks-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.tasksSearchQuery = e.target.value.trim();
        this.renderTasks();
      });
    }

    const durumFilter = document.getElementById('tasks-durum-filter');
    if (durumFilter) {
      durumFilter.addEventListener('change', (e) => {
        this.tasksDurumFilter = e.target.value;
        this.renderTasks();
      });
    }

    const dersFilter = document.getElementById('tasks-ders-filter');
    if (dersFilter) {
      dersFilter.addEventListener('change', (e) => {
        this.tasksDersFilter = e.target.value;
        this.renderTasks();
      });
    }

    const hideCompleted = document.getElementById('tasks-hide-completed');
    if (hideCompleted) {
      hideCompleted.addEventListener('change', (e) => {
        this.tasksHideCompleted = e.target.checked;
        this.renderTasks();
      });
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  editDirective() {
    const txt = document.getElementById('tasks-directive-text');
    const editor = document.getElementById('tasks-directive-editor');
    if (txt && editor) {
      txt.classList.add('hidden');
      editor.classList.remove('hidden');
      const input = document.getElementById('input-koc-direktif');
      if (input) input.focus();
    }
  },

  cancelDirective() {
    const txt = document.getElementById('tasks-directive-text');
    const editor = document.getElementById('tasks-directive-editor');
    if (txt && editor) {
      txt.classList.remove('hidden');
      editor.classList.add('hidden');
    }
  },

  saveDirective() {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) return;
    const input = document.getElementById('input-koc-direktif');
    const val = input ? input.value.trim() : '';
    Store.updateOgrenci(ogr.id, { kocNotu: val });
    this.showToast('Haftalık koç direktifi güncellendi');
    this.renderTasks();
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 5: RAPORLAR (renderReport)
  // ─────────────────────────────────────────────────────────────
  setReportSablon(sablon) {
    this.reportAktifSablon = sablon;
    this.renderReport();
  },

  onReportOgrenciChange(ogrId) {
    this.reportSelectedOgrenciId = ogrId;
    this.renderReport();
  },

  fillReportAktifOgrenci() {
    const aktif = Store.getAktifOgrenci();
    if (!aktif) {
      this.showToast('Aktif öğrenci bulunamadı');
      return;
    }
    this.reportSelectedOgrenciId = aktif.id;
    this.renderReport();
    this.showToast(`${aktif.ad} ${aktif.soyad} rapora yüklendi`);
  },

  getThisWeekDateRangeStr() {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mStr = monday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    const sStr = sunday.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${mStr} – ${sStr}`;
  },

  renderReport() {
    const container = document.getElementById('view-report');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    if (!this.reportSelectedOgrenciId) {
      this.reportSelectedOgrenciId = Store.data.aktifOgrenciId || (allStudents[0] ? allStudents[0].id : '');
    }

    const ogr = Store.getOgrenci(this.reportSelectedOgrenciId);
    const isSlip = this.reportAktifSablon === 'slip';

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Şablon Seçici & Öğrenci Seçici -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center p-1 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <button onclick="App.setReportSablon('slip')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${isSlip ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="clipboard-list" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Haftalık Ödev Fişi
              </button>
              <button onclick="App.setReportSablon('full')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${!isSlip ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="graduation-cap" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Akademik Karne
              </button>
            </div>

            <div class="h-6 w-px bg-[var(--color-rule)] hidden sm:block"></div>

            <div class="flex items-center gap-2">
              <label for="report-ogrenci-select" class="text-xs font-medium text-[var(--color-ink-muted)] hidden sm:inline">Öğrenci:</label>
              <select id="report-ogrenci-select" onchange="App.onReportOgrenciChange(this.value)" class="select-instrument text-xs py-1.5 px-3 min-w-[180px]">
                ${allStudents.length === 0 ? '<option value="">Öğrenci Kaydı Yok</option>' : ''}
                ${allStudents.map(o => `
                  <option value="${o.id}" ${String(o.id) === String(this.reportSelectedOgrenciId) ? 'selected' : ''}>
                    ${o.ad} ${o.soyad} (${o.sinif ? o.sinif + '. Sınıf' : 'Öğrenci'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Sağ Kısım: Doldur & Yazdır -->
          <div class="flex items-center gap-2.5">
            <button onclick="App.fillReportAktifOgrenci()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3" title="Üst panelde seçili aktif öğrenciyi rapora getirir">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              <span>Aktif Öğrenciyi Doldur</span>
            </button>
            <button onclick="App.printAktifRapor()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 shadow-sm">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Yazdır (A4)</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: Rapor Önizleme Alanı -->
        <div class="flex justify-center pb-12">
    `;

    if (!ogr) {
      html += `
          <div class="w-full max-w-[850px] p-12 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] space-y-4">
            <i data-lucide="file-question" class="w-12 h-12 text-[var(--color-ink-faint)] mx-auto"></i>
            <h3 class="font-display font-bold text-lg text-[var(--color-ink)]">Önizlenecek Öğrenci Bulunamadı</h3>
            <p class="text-sm text-[var(--color-ink-muted)]">Rapor oluşturmak için lütfen yukarıdan bir öğrenci seçin veya yeni öğrenci kaydı ekleyin.</p>
          </div>
        </div>
      </div>`;
    } else {
      const reportHtml = isSlip ? this.renderReportSlipHTML(ogr) : this.renderReportFullHTML(ogr);
      html += `
          <div id="report-preview-area" class="w-full max-w-[850px] bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm p-8 sm:p-10 font-sans print:shadow-none print:p-0 print:border-none print:max-w-none print:w-full">
            ${reportHtml}
          </div>
        </div>
      </div>`;
    }

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderReportSlipHTML(ogr) {
    const koc = Store.getKocProfili() || {};
    const kocAd = (koc.ad || 'Eğitim') + ' ' + (koc.soyad || 'Koçu');
    const kocUnvan = koc.unvan || 'Eğitim Koçu';
    const kocKurum = koc.kurum ? ` · ${koc.kurum}` : '';

    const modul = Store.getModulForOgrenci(ogr);
    const modulAd = modul ? modul.ad : (ogr.modulId || 'Müfredat');
    const tarihAraligi = this.getThisWeekDateRangeStr();

    const gorevler = Store.getAktifGorevler(ogr.id);

    return `
      <div class="space-y-6 text-slate-900 leading-normal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Üst Başlık Bandı -->
        <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div class="space-y-0.5">
            <div class="font-bold text-base text-slate-900 tracking-tight">${kocAd}</div>
            <div class="text-xs text-slate-600">${kocUnvan}${kocKurum}</div>
          </div>
          <div class="text-center">
            <h1 class="font-black text-lg sm:text-xl tracking-tight uppercase text-slate-900">HAFTALIK ÇALIŞMA & ÖDEV FİŞİ</h1>
            <span class="inline-block px-2.5 py-0.5 mt-1 text-[11px] font-semibold bg-slate-100 text-slate-800 rounded border border-slate-300">Haftalık Plan</span>
          </div>
          <div class="text-right space-y-0.5">
            <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dönem / Hafta</div>
            <div class="text-xs font-bold text-slate-900">${tarihAraligi}</div>
          </div>
        </div>

        <!-- Öğrenci Bilgi Bandı -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded border border-slate-200 text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Öğrenci Adı Soyadı</span>
            <span class="font-bold text-slate-900 text-sm">${ogr.ad} ${ogr.soyad}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Sınıf / Kademesi</span>
            <span class="font-semibold text-slate-900">${ogr.sinif ? ogr.sinif + '. Sınıf' : '—'}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Okul</span>
            <span class="font-semibold text-slate-900 truncate block" title="${ogr.okul || '—'}">${ogr.okul || '—'}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Modül</span>
            <span class="font-bold text-slate-900">${modulAd}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Hedef</span>
            <span class="font-semibold text-slate-900 truncate block" title="${ogr.hedef || '—'}">${ogr.hedef || '—'}</span>
          </div>
        </div>

        <!-- Aktif Ödevler Tablosu -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800">Bu Haftanın Görev & Soru Hedefleri (${gorevler.length} Görev)</h2>
            <span class="text-[10px] text-slate-500 italic">Tamamlanan görevlerin kutucuğunu işaretleyiniz</span>
          </div>
          <table class="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
                <th class="p-2 border-r border-slate-300 w-28">Ders</th>
                <th class="p-2 border-r border-slate-300">Konu</th>
                <th class="p-2 border-r border-slate-300">Görev / Kaynak</th>
                <th class="p-2 border-r border-slate-300 text-center w-20">Hedef Soru</th>
                <th class="p-2 border-r border-slate-300 text-center w-16">Süre</th>
                <th class="p-2 border-r border-slate-300 text-center w-24">Teslim</th>
                <th class="p-2 text-center w-16">Durum</th>
              </tr>
            </thead>
            <tbody>
              ${gorevler.length === 0 ? `
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-500 italic bg-white">
                    Bu hafta için tanımlanmış aktif ödev veya çalışma görevi bulunmuyor.
                  </td>
                </tr>
              ` : gorevler.map((g, idx) => {
                const ders = Store.getDers(g.dersId);
                const konu = Store.getKonu(g.konuId);
                const kaynak = (Store.data.kaynaklar || []).find(k => k.id === g.kaynakId);
                const dersAd = ders ? ders.ad : 'Genel';
                const konuAd = konu ? konu.konuAdi : (g.baslik || '—');
                const kaynakAd = kaynak ? kaynak.ad : (g.kaynakId ? g.kaynakId : 'Bireysel Çalışma');
                const bgClass = idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white';

                return `
                  <tr class="border-b border-slate-200 ${bgClass}">
                    <td class="p-2 border-r border-slate-300 font-bold text-slate-900">${dersAd}</td>
                    <td class="p-2 border-r border-slate-300 text-slate-800 font-medium">${konuAd}</td>
                    <td class="p-2 border-r border-slate-300 text-slate-700">${kaynakAd}</td>
                    <td class="p-2 border-r border-slate-300 text-center font-mono font-bold text-slate-900">${g.hedefSoru ? g.hedefSoru + ' Soru' : '—'}</td>
                    <td class="p-2 border-r border-slate-300 text-center font-mono text-slate-700">${g.sureDk ? g.sureDk + ' dk' : '—'}</td>
                    <td class="p-2 border-r border-slate-300 text-center font-mono text-slate-700">${App.formatDate(g.deadline)}</td>
                    <td class="p-2 text-center">
                      <div style="width:16px; height:16px; border:1.5px solid #475569; border-radius:3px; margin:0 auto; background:#ffffff;"></div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Koçun Notu & Direktif -->
        <div class="space-y-1.5 p-3.5 bg-slate-50 rounded border border-slate-200">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <span>Koçun Notu & Haftalık Direktif</span>
            <span class="text-[10px] text-slate-500 font-normal italic">Öğrenciye özel çalışma tavsiyeleri</span>
          </div>
          <div class="text-xs text-slate-800 min-h-[50px] leading-relaxed whitespace-pre-wrap ${ogr.kocNotu ? 'font-medium' : 'text-slate-400 italic'}">
            ${ogr.kocNotu || 'Bu hafta konu tekrarları ve günlük soru hedeflerine titizlikle uyulması hedeflenmektedir. Çözülemeyen sorular Hata Defterine işlenecektir.'}
          </div>
        </div>

        <!-- Alt İmza Bandı -->
        <div class="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div class="space-y-8">
            <div class="font-semibold">Öğrenci / Veli Onayı:</div>
            <div class="border-b border-dashed border-slate-400 w-48"></div>
          </div>
          <div class="space-y-8 text-right">
            <div class="font-semibold">Eğitim Koçu: <span class="font-bold text-slate-900">${kocAd}</span></div>
            <div class="border-b border-dashed border-slate-400 w-48 ml-auto"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderReportFullHTML(ogr) {
    const koc = Store.getKocProfili() || {};
    const kocAd = (koc.ad || 'Eğitim') + ' ' + (koc.soyad || 'Koçu');
    const kocUnvan = koc.unvan || 'Eğitim Koçu';
    const kocKurum = koc.kurum ? ` · ${koc.kurum}` : '';

    const modul = Store.getModulForOgrenci(ogr);
    const modulAd = modul ? modul.ad : (ogr.modulId || 'Müfredat');
    const bugunTarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

    // KPI Hesaplamaları
    const allGorevler = Store.getGorevler(ogr.id);
    const tamamlananGorevler = allGorevler.filter(g => g.durum === 'tamamlandi');
    const gecikmisGorevler = Store.getGecikmisGorevler(ogr.id);
    const tamamlamaYuzde = allGorevler.length > 0 ? Math.round((tamamlananGorevler.length / allGorevler.length) * 100) : 0;

    // Ders bazlı ilerleme
    const dersler = Store.getDerslerForOgrenci(ogr);
    const dersRaporlari = dersler.map(d => {
      const konular = Store.getKonularForDers(d.id);
      const totalKonu = konular.length;
      let tamamCount = 0;
      let tekrarCount = 0;

      konular.forEach(k => {
        const kd = Store.getKonuDurumu(ogr.id, k.id);
        if (kd.durum === 'tamam') tamamCount++;
        else if (kd.durum === 'tekrar_lazim') tekrarCount++;
      });

      const yuzde = totalKonu > 0 ? Math.round((tamamCount / totalKonu) * 100) : 0;
      const notlar = Store.getSinifNotlari(ogr.id, d.id);
      const sonNotObj = notlar.length > 0 ? notlar[notlar.length - 1] : null;
      const sonNot = sonNotObj ? `${sonNotObj.not}` : '—';

      return {
        ders: d,
        totalKonu,
        tamamCount,
        tekrarCount,
        yuzde,
        sonNot
      };
    });

    // Kritik Eksik Konular
    const kritikKonular = [];
    dersler.forEach(d => {
      const konular = Store.getKonularForDers(d.id);
      konular.forEach(k => {
        const kd = Store.getKonuDurumu(ogr.id, k.id);
        if (kd.durum === 'tekrar_lazim') {
          kritikKonular.push({ dersAd: d.ad, konuAd: k.konuAdi, not: kd.not });
        }
      });
    });

    return `
      <div class="space-y-6 text-slate-900 leading-normal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Üst Kısım — Başlık & Koç Bilgisi -->
        <div class="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div class="space-y-1">
            <h1 class="font-black text-xl sm:text-2xl tracking-tight uppercase text-slate-900">AKADEMİK TAKİP & PERFORMANS RAPORU</h1>
            <div class="text-xs font-semibold text-slate-600">Rapor Tarihi: <span class="text-slate-900">${bugunTarih}</span></div>
          </div>
          <div class="text-right space-y-0.5">
            <div class="font-bold text-sm text-slate-900">${kocAd}</div>
            <div class="text-xs text-slate-600">${kocUnvan}${kocKurum}</div>
          </div>
        </div>

        <!-- Öğrenci Profil Bandı -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-slate-50 rounded border border-slate-200 text-xs">
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Öğrenci Adı Soyadı</span>
            <span class="font-bold text-slate-900 text-sm">${ogr.ad} ${ogr.soyad}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Sınıf / Şube</span>
            <span class="font-semibold text-slate-900">${ogr.sinif ? ogr.sinif + '. Sınıf' : '—'}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Okul</span>
            <span class="font-semibold text-slate-900 truncate block">${ogr.okul || '—'}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Modül</span>
            <span class="font-bold text-slate-900">${modulAd}</span>
          </div>
          <div>
            <span class="text-slate-500 block text-[10px] uppercase font-bold">Akademik Hedef</span>
            <span class="font-semibold text-slate-900 truncate block">${ogr.hedef || '—'}</span>
          </div>
        </div>

        <!-- 4 KPI Kutusu (Yatay Sıra) -->
        <div class="grid grid-cols-4 gap-3 text-center">
          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="block text-[10px] font-bold uppercase text-slate-500">Toplam Görev</span>
            <span class="font-mono font-black text-xl text-slate-900">${allGorevler.length}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="block text-[10px] font-bold uppercase text-slate-500">Tamamlanan</span>
            <span class="font-mono font-black text-xl text-emerald-700">${tamamlananGorevler.length}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="block text-[10px] font-bold uppercase text-slate-500">Tamamlama Oranı</span>
            <span class="font-mono font-black text-xl text-blue-700">%${tamamlamaYuzde}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded border border-slate-200">
            <span class="block text-[10px] font-bold uppercase text-slate-500">Geciken Görev</span>
            <span class="font-mono font-black text-xl ${gecikmisGorevler.length > 0 ? 'text-rose-700' : 'text-slate-700'}">${gecikmisGorevler.length}</span>
          </div>
        </div>

        <!-- Ders Bazlı İlerleme Tablosu -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-800">Ders Bazlı Müfredat İlerleme Durumu</h2>
            <span class="text-[10px] text-slate-500 font-semibold">Toplam ${dersler.length} Ders</span>
          </div>
          <table class="w-full text-left border-collapse text-xs border border-slate-300">
            <thead>
              <tr class="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
                <th class="p-2 border-r border-slate-300">Ders</th>
                <th class="p-2 border-r border-slate-300 text-center w-24">Toplam Konu</th>
                <th class="p-2 border-r border-slate-300 text-center w-24">Tamamlanan</th>
                <th class="p-2 border-r border-slate-300 text-center w-24">Tekrar Lazım</th>
                <th class="p-2 border-r border-slate-300 w-36">İlerleme</th>
                <th class="p-2 text-center w-20">Son Not</th>
              </tr>
            </thead>
            <tbody>
              ${dersRaporlari.length === 0 ? `
                <tr><td colspan="6" class="p-6 text-center text-slate-500 italic bg-white">Öğrencinin kayıtlı dersi bulunmuyor.</td></tr>
              ` : dersRaporlari.map((r, idx) => {
                const bg = idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white';
                return `
                  <tr class="border-b border-slate-200 ${bg}">
                    <td class="p-2 border-r border-slate-300 font-bold text-slate-900">${r.ders.ad}</td>
                    <td class="p-2 border-r border-slate-300 text-center font-mono">${r.totalKonu}</td>
                    <td class="p-2 border-r border-slate-300 text-center font-mono font-bold text-emerald-700">${r.tamamCount}</td>
                    <td class="p-2 border-r border-slate-300 text-center font-mono font-bold ${r.tekrarCount > 0 ? 'text-rose-600' : 'text-slate-400'}">${r.tekrarCount}</td>
                    <td class="p-2 border-r border-slate-300">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
                          <div class="h-full bg-blue-600" style="width: ${r.yuzde}%"></div>
                        </div>
                        <span class="font-mono font-bold text-[11px] text-slate-800 w-8 text-right">%${r.yuzde}</span>
                      </div>
                    </td>
                    <td class="p-2 text-center font-mono font-bold text-slate-900">${r.sonNot}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 2 Sütunlu Alt Panel: Kritik Eksikler + Gecikmiş Ödevler & Koç Değerlendirmesi -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Sol Kısım: Kritik Eksikler & Gecikmişler -->
          <div class="space-y-4">
            <!-- Kritik Eksik Konular -->
            <div class="p-3 bg-rose-50/60 border border-rose-200 rounded text-xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-rose-800 block mb-2">Kritik Eksik Konular (Tekrar Lazım)</span>
              ${kritikKonular.length === 0 ? `
                <div class="text-slate-500 italic">Tekrar gerektiren kritik eksik konu bulunmuyor.</div>
              ` : `
                <ul class="space-y-1">
                  ${kritikKonular.map(k => `
                    <li class="flex items-start gap-1.5 text-slate-800">
                      <span class="text-rose-600 font-bold">•</span>
                      <span><strong>${k.dersAd}:</strong> ${k.konuAd}</span>
                    </li>
                  `).join('')}
                </ul>
              `}
            </div>

            <!-- Gecikmiş Ödevler -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-800 block mb-2">Gecikmiş Ödevler & Takip</span>
              ${gecikmisGorevler.length === 0 ? `
                <div class="text-emerald-700 font-medium">Harika! Gecikmiş ödev bulunmamaktadır.</div>
              ` : `
                <ul class="space-y-1">
                  ${gecikmisGorevler.slice(0, 4).map(g => {
                    const d = Store.getDers(g.dersId);
                    return `
                      <li class="flex items-center justify-between text-slate-800 text-[11px]">
                        <span><strong class="text-slate-900">${d ? d.ad : 'Ödev'}:</strong> ${g.baslik}</span>
                        <span class="text-rose-600 font-mono font-bold text-[10px]">Gecikti (${App.formatDate(g.deadline)})</span>
                      </li>
                    `;
                  }).join('')}
                </ul>
              `}
            </div>
          </div>

          <!-- Sağ Kısım: Koçun Genel Değerlendirmesi -->
          <div class="p-3.5 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between text-xs">
            <div class="space-y-2">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">Koçun Genel Değerlendirmesi</span>
              <div class="text-slate-800 leading-relaxed whitespace-pre-wrap ${ogr.kocNotu ? 'font-medium' : 'text-slate-400 italic'}">
                ${ogr.kocNotu || 'Öğrencinin haftalık çalışma performansı ve konu anlama düzeyleri düzenli takip edilmektedir. Soru çözümlerinde hız ve dikkat unsurlarına odaklanılacaktır.'}
              </div>
            </div>
            <div class="pt-4 border-t border-slate-200 text-[11px] text-slate-500 italic">
              * Bu rapor öğrencinin bireysel gelişim takibi amacıyla eğitim koçu tarafından hazırlanmıştır.
            </div>
          </div>
        </div>

        <!-- En Alt — İmza Bandı -->
        <div class="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div class="p-3 bg-slate-50 rounded border border-slate-200 space-y-4">
            <div class="font-bold text-slate-800">Veli Bilgilendirme ve Onay:</div>
            <div class="text-[10px] text-slate-500">Rapor incelenmiş olup öğrencinin çalışma planı onaylanmıştır.</div>
            <div class="border-b border-dashed border-slate-400 w-40 pt-4"></div>
          </div>
          <div class="p-3 bg-slate-50 rounded border border-slate-200 space-y-4 text-right">
            <div class="font-bold text-slate-800">Koç Onayı: <span class="text-slate-900">${kocAd}</span></div>
            <div class="text-[10px] text-slate-500">${kocUnvan}</div>
            <div class="border-b border-dashed border-slate-400 w-40 ml-auto pt-4"></div>
          </div>
        </div>
      </div>
    `;
  },

  printAktifRapor() {
    const ogrenciSelect = document.getElementById('report-ogrenci-select');
    const ogrenciId = ogrenciSelect ? ogrenciSelect.value : (this.reportSelectedOgrenciId || Store.data.aktifOgrenciId);
    const ogr = Store.getOgrenci(ogrenciId);
    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin');
      return;
    }

    const isSlip = this.reportAktifSablon === 'slip';
    const icerik = isSlip ? this.renderReportSlipHTML(ogr) : this.renderReportFullHTML(ogr);

    const bugunStr = new Date().toISOString().split('T')[0];
    const safeName = `${ogr.ad}_${ogr.soyad}`.replace(/\s+/g, '_');
    const dosyaAdi = isSlip ? `HaftalikFis_${safeName}_${bugunStr}` : `AkademikKarne_${safeName}_${bugunStr}`;

    this.showToast(`Yazdırma başlatılıyor: ${dosyaAdi}`);
    PrintEngine.yazdir(icerik, { yatay: false });
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 6: HATA DEFTERİ & TELAFİ (renderHataDefteri)
  // ─────────────────────────────────────────────────────────────
  setHataSekme(sekme) {
    this.hataAktifSekme = sekme;
    this.renderHataDefteri();
  },

  setHataFormModu(mod) {
    this.hataFormModu = mod;
    this.renderHataDefteri();
  },

  setHataSatirSayisi(sayi) {
    this.hataSatirSayisi = Number(sayi) || 15;
    this.renderHataDefteri();
  },

  onHataOgrenciChange(ogrId) {
    this.hataSelectedOgrenciId = ogrId;
    this.renderHataDefteri();
  },

  fillHataAktifOgrenci() {
    const aktif = Store.getAktifOgrenci();
    if (!aktif) {
      this.showToast('Aktif öğrenci bulunamadı');
      return;
    }
    this.hataSelectedOgrenciId = aktif.id;
    this.renderHataDefteri();
    this.showToast(`${aktif.ad} ${aktif.soyad} hata defterine yüklendi`);
  },

  renderHataDefteri() {
    const container = document.getElementById('view-hata-defteri');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    if (!this.hataSelectedOgrenciId) {
      this.hataSelectedOgrenciId = Store.data.aktifOgrenciId || (allStudents[0] ? allStudents[0].id : '');
    }

    const ogr = Store.getOgrenci(this.hataSelectedOgrenciId);
    const isA4 = this.hataAktifSekme === 'a4';

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Sekme Seçici & Öğrenci Seçici -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center p-1 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <button onclick="App.setHataSekme('a4')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${isA4 ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="printer" class="w-3.5 h-3.5 inline-block mr-1.5"></i>A4 Form
              </button>
              <button onclick="App.setHataSekme('dijital')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${!isA4 ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="layers" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Dijital Havuz
              </button>
            </div>

            <div class="h-6 w-px bg-[var(--color-rule)] hidden sm:block"></div>

            <div class="flex items-center gap-2">
              <label for="hata-ogrenci-select" class="text-xs font-medium text-[var(--color-ink-muted)] hidden sm:inline">Öğrenci:</label>
              <select id="hata-ogrenci-select" onchange="App.onHataOgrenciChange(this.value)" class="select-instrument text-xs py-1.5 px-3 min-w-[180px]">
                ${allStudents.length === 0 ? '<option value="">Öğrenci Kaydı Yok</option>' : ''}
                ${allStudents.map(o => `
                  <option value="${o.id}" ${String(o.id) === String(this.hataSelectedOgrenciId) ? 'selected' : ''}>
                    ${o.ad} ${o.soyad} (${o.sinif ? o.sinif + '. Sınıf' : 'Öğrenci'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Sağ Kısım: Butonlar -->
          <div class="flex items-center gap-2.5">
            <button onclick="App.fillHataAktifOgrenci()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3" title="Üst panelde seçili aktif öğrenciyi getirir">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              <span>Aktif Öğrenciyi Doldur</span>
            </button>
            ${isA4 ? `
              <button onclick="App.printHataA4()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 shadow-sm">
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>Yazdır (A4 Yatay)</span>
              </button>
            ` : `
              <button onclick="App.openHataModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 shadow-sm">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Hata Ekle</span>
              </button>
            `}
          </div>
        </div>
    `;

    if (!ogr) {
      html += `
        <div class="p-12 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] space-y-4">
          <i data-lucide="file-question" class="w-12 h-12 text-[var(--color-ink-faint)] mx-auto"></i>
          <h3 class="font-display font-bold text-lg text-[var(--color-ink)]">Öğrenci Seçilmedi</h3>
          <p class="text-sm text-[var(--color-ink-muted)]">Hata kayıtlarını görüntülemek için lütfen yukarıdan bir öğrenci seçin.</p>
        </div>
      </div>`;
    } else {
      if (isA4) {
        html += this.renderHataA4(ogr);
      } else {
        html += this.renderHataDijital(ogr);
      }
      html += `</div>`;
    }

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderHataA4(ogr) {
    const htmlA4 = this.renderHataA4HTML(ogr);

    return `
      <!-- A4 Form Ayarları & Önizleme -->
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs">
          <div class="flex items-center gap-2">
            <span class="text-[var(--color-ink-muted)] font-medium">Veri Modu:</span>
            <div class="flex items-center bg-[var(--color-paper-2)] p-0.5 rounded-[var(--radius-xs)] border border-[var(--color-rule)]">
              <button onclick="App.setHataFormModu('dolu')" class="px-2.5 py-1 rounded-[var(--radius-xs)] font-semibold transition-all ${this.hataFormModu === 'dolu' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                Dolu (Kayıtlı Hatalar)
              </button>
              <button onclick="App.setHataFormModu('bos')" class="px-2.5 py-1 rounded-[var(--radius-xs)] font-semibold transition-all ${this.hataFormModu === 'bos' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                Boş Şablon (Elle Yazım)
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[var(--color-ink-muted)] font-medium">Satır Sayısı:</span>
            <div class="flex items-center gap-1">
              ${[10, 15, 20].map(cnt => `
                <button onclick="App.setHataSatirSayisi(${cnt})" class="px-2.5 py-1 rounded-[var(--radius-xs)] font-mono font-semibold transition-all ${this.hataSatirSayisi === cnt ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] border border-[var(--color-rule-strong)] shadow-xs' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]'}">
                  ${cnt}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="overflow-x-auto flex justify-center pb-8">
          <div id="hata-a4-preview-area" class="w-full max-w-[1050px] bg-white text-slate-900 border border-slate-300 shadow-2xl rounded-sm p-8 sm:p-10 font-sans print:shadow-none print:p-0 print:border-none print:max-w-none print:w-full">
            ${htmlA4}
          </div>
        </div>
      </div>
    `;
  },

  renderHataA4HTML(ogr) {
    const bugunTarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const modul = Store.getModulForOgrenci(ogr);
    const modulAd = modul ? modul.ad : (ogr.modulId || '');

    const hatalar = this.hataFormModu === 'dolu' ? Store.getHatalar(ogr.id) : [];
    const satirSayisi = this.hataSatirSayisi || 15;

    const rows = [];
    for (let i = 0; i < satirSayisi; i++) {
      const h = hatalar[i];
      if (h) {
        const ders = Store.getDers(h.dersId);
        const konu = Store.getKonu(h.konuId);
        rows.push({
          no: i + 1,
          ders: ders ? ders.ad : '—',
          konu: konu ? konu.konuAdi : '—',
          tur: h.hataTuru || 'Bilgi Eksikliği',
          aciklama: h.aciklama || '—',
          telafiTarihi: h.tekrarTarihi ? App.formatDate(h.tekrarTarihi) : '—',
          telafiEdildi: h.telafiDurumu
        });
      } else {
        rows.push({
          no: i + 1,
          ders: '',
          konu: '',
          tur: '',
          aciklama: '',
          telafiTarihi: '',
          telafiEdildi: false
        });
      }
    }

    return `
      <div class="space-y-5 text-slate-900 leading-normal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- Üst Başlık Bandı (Yatay A4) -->
        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3">
          <div>
            <h1 class="font-black text-xl tracking-tight uppercase text-slate-900">HATA DEFTERİ & TELAFİ FORMU</h1>
            <p class="text-xs text-slate-600">Öğrenci Yanlış Soru ve Telafi Takip Çizelgesi (1-3-7 Gün Döngüsü)</p>
          </div>
          <div class="flex items-center gap-6 text-xs">
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Öğrenci:</span>
              <span class="font-bold text-slate-900 text-sm">${ogr.ad} ${ogr.soyad}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Sınıf & Modül:</span>
              <span class="font-semibold text-slate-900">${ogr.sinif ? ogr.sinif + '. Sınıf' : ''} (${modulAd})</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[10px] uppercase font-bold">Tarih:</span>
              <span class="font-semibold text-slate-900">${bugunTarih}</span>
            </div>
          </div>
        </div>

        <!-- Hata Tablosu -->
        <table class="w-full text-left border-collapse text-xs border border-slate-300">
          <thead>
            <tr class="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold text-[11px]">
              <th class="p-2 border-r border-slate-300 text-center w-10">#</th>
              <th class="p-2 border-r border-slate-300 w-32">Ders</th>
              <th class="p-2 border-r border-slate-300 w-44">Konu</th>
              <th class="p-2 border-r border-slate-300 w-36">Hata Türü</th>
              <th class="p-2 border-r border-slate-300">Açıklama / Yanlış Nedeni</th>
              <th class="p-2 border-r border-slate-300 text-center w-28">Telafi Tarihi</th>
              <th class="p-2 text-center w-24">Telafi Edildi</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr class="border-b border-slate-200 h-9">
                <td class="p-1.5 border-r border-slate-300 text-center font-mono text-slate-500">${r.no}</td>
                <td class="p-1.5 border-r border-slate-300 font-semibold text-slate-900">${r.ders}</td>
                <td class="p-1.5 border-r border-slate-300 text-slate-800">${r.konu}</td>
                <td class="p-1.5 border-r border-slate-300">
                  ${r.tur ? `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 border border-slate-300 text-slate-800">${r.tur}</span>` : ''}
                </td>
                <td class="p-1.5 border-r border-slate-300 text-slate-700 truncate max-w-[200px]">${r.aciklama}</td>
                <td class="p-1.5 border-r border-slate-300 text-center font-mono text-slate-700">${r.telafiTarihi}</td>
                <td class="p-1.5 text-center">
                  <div style="width:16px; height:16px; border:1.5px solid #475569; border-radius:3px; margin:0 auto; background:#ffffff; ${r.telafiEdildi ? 'background:#059669; color:#fff; display:flex; align-items:center; justify-content:center; font-size:11px;' : ''}">
                    ${r.telafiEdildi ? '✓' : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Alt Kısım: Açıklama ve İmza -->
        <div class="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200">
          <div>
            <strong>1-3-7 Gün Telafi Döngüsü:</strong> Hata ilk tespit: +1 gün sonra tekrar çöz · Doğru ise: +3 gün sonra tekrar çöz · Doğru ise: +7 gün sonra kalıcı telafi.
          </div>
          <div class="text-right">
            Koç Kontrolü: ____________________
          </div>
        </div>
      </div>
    `;
  },

  printHataA4() {
    const ogr = Store.getOgrenci(this.hataSelectedOgrenciId);
    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin');
      return;
    }

    const html = this.renderHataA4HTML(ogr);
    const bugunStr = new Date().toISOString().split('T')[0];
    const safeName = `${ogr.ad}_${ogr.soyad}`.replace(/\s+/g, '_');
    const dosyaAdi = `HataDefteri_${safeName}_${bugunStr}`;

    this.showToast(`Yazdırma başlatılıyor: ${dosyaAdi}`);
    PrintEngine.yazdir(html, { yatay: true });
  },

  renderHataDijital(ogr) {
    const allHatalar = Store.getHatalar(ogr.id);
    const dersler = Store.getDerslerForOgrenci(ogr);

    // Filtreleme
    const filtered = allHatalar.filter(h => {
      if (this.hataDersFilter && String(h.dersId) !== String(this.hataDersFilter)) return false;
      if (this.hataTurFilter && h.hataTuru !== this.hataTurFilter) return false;
      return true;
    });

    const bugunStr = new Date().toISOString().split('T')[0];

    return `
      <!-- Dijital Havuz İçeriği -->
      <div class="space-y-6">
        <!-- Filtre Araç Çubuğu -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1.5">
              <span class="text-[var(--color-ink-muted)] font-medium">Ders:</span>
              <select onchange="App.hataDersFilter = this.value; App.renderHataDefteri();" class="select-instrument text-xs py-1 px-2.5">
                <option value="">Tüm Dersler</option>
                ${dersler.map(d => `<option value="${d.id}" ${this.hataDersFilter === d.id ? 'selected' : ''}>${d.ad}</option>`).join('')}
              </select>
            </div>

            <div class="flex items-center gap-1.5">
              <span class="text-[var(--color-ink-muted)] font-medium">Hata Türü:</span>
              <select onchange="App.hataTurFilter = this.value; App.renderHataDefteri();" class="select-instrument text-xs py-1 px-2.5">
                <option value="">Tüm Hata Türleri</option>
                ${HATA_TURLERI.map(t => `<option value="${t.id}" ${this.hataTurFilter === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="text-xs font-mono text-[var(--color-ink-muted)]">
            Toplam: <span class="font-bold text-[var(--color-ink)]">${filtered.length}</span> Hata Kaydı
          </div>
        </div>

        <!-- Hata Kartları Grid -->
        ${filtered.length === 0 ? `
          <div class="p-12 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] space-y-3">
            <i data-lucide="check-circle-2" class="w-10 h-10 text-[var(--color-success)] mx-auto"></i>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Kayıtlı Hata Bulunamadı</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Seçili filtrelere uygun hata kaydı bulunmuyor. Yeni bir hata eklemek için yukarıdaki butonu kullanabilirsiniz.</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filtered.map(h => {
              const ders = Store.getDers(h.dersId);
              const konu = Store.getKonu(h.konuId);
              const asama = Number(h.asama) || 1;
              const isDone = Boolean(h.telafiDurumu);
              const isOverdue = !isDone && h.tekrarTarihi && h.tekrarTarihi < bugunStr;

              const turObj = HATA_TURLERI.find(t => t.id === h.hataTuru) || { label: h.hataTuru, renk: 'slate' };

              return `
                <div class="card-editorial p-4 flex flex-col justify-between space-y-4 border ${isDone ? 'border-[var(--color-success-border)] bg-[var(--color-success-bg)]/20' : isOverdue ? 'border-[var(--color-danger-border)]' : 'border-[var(--color-rule)]'} transition-all">
                  <div class="space-y-2.5">
                    <!-- Üst Başlık: Ders & Hata Türü -->
                    <div class="flex items-center justify-between gap-2">
                      <span class="meta-pill text-[10px] font-semibold bg-[var(--color-paper-3)] text-[var(--color-ink)] border-[var(--color-rule)]">
                        ${ders ? ders.ad : 'Ders'}
                      </span>
                      <span class="meta-pill text-[10px] font-medium ${turObj.renk === 'rose' ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger-border)]' : turObj.renk === 'amber' ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning-border)]' : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)]'}">
                        ${turObj.label}
                      </span>
                    </div>

                    <!-- Konu Adı -->
                    <div>
                      <h4 class="font-display font-bold text-sm text-[var(--color-ink)] leading-snug">
                        ${konu ? konu.konuAdi : 'Genel Hata'}
                      </h4>
                      ${h.aciklama ? `
                        <p class="text-xs text-[var(--color-ink-muted)] mt-1.5 leading-relaxed line-clamp-3 italic">
                          "${h.aciklama}"
                        </p>
                      ` : ''}
                    </div>

                    <!-- 1-3-7 Gün Telafi Döngüsü Stepper -->
                    <div class="pt-2">
                      <div class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)] mb-1.5 flex items-center justify-between">
                        <span>Telafi Döngüsü</span>
                        <span class="font-mono text-[9px] ${isDone ? 'text-[var(--color-success)] font-bold' : isOverdue ? 'text-[var(--color-danger)] font-bold' : 'text-[var(--color-ink-muted)]'}">
                          ${isDone ? 'Tamamlandı' : isOverdue ? 'Tekrar Gecikti' : (h.tekrarTarihi ? App.formatDate(h.tekrarTarihi) : '')}
                        </span>
                      </div>
                      <div class="grid grid-cols-4 gap-1 text-center">
                        <div class="py-1 px-1 rounded-[var(--radius-xs)] text-[9px] font-mono font-semibold ${asama >= 2 || isDone ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]' : asama === 1 ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-bold' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] border border-[var(--color-rule)]'}">
                          1. Gün
                        </div>
                        <div class="py-1 px-1 rounded-[var(--radius-xs)] text-[9px] font-mono font-semibold ${asama >= 3 || isDone ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]' : asama === 2 ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-bold' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] border border-[var(--color-rule)]'}">
                          3. Gün
                        </div>
                        <div class="py-1 px-1 rounded-[var(--radius-xs)] text-[9px] font-mono font-semibold ${asama >= 4 || isDone ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]' : asama === 3 ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)] font-bold' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] border border-[var(--color-rule)]'}">
                          7. Gün
                        </div>
                        <div class="py-1 px-1 rounded-[var(--radius-xs)] text-[9px] font-mono font-semibold ${isDone ? 'bg-[var(--color-success)] text-white font-bold' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] border border-[var(--color-rule)]'}">
                          ✓ Bitti
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Alt İşlem Butonları -->
                  <div class="pt-3 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
                    <div>
                      ${isDone ? `
                        <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-success)]">
                          <i data-lucide="check" class="w-3.5 h-3.5"></i>Telafi Edildi
                        </span>
                      ` : `
                        <button onclick="Store.telafiIlerletHata('${h.id}'); App.renderHataDefteri(); App.showToast('Telafi adımı ilerletildi');" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-success)] hover:border-[var(--color-success-border)]">
                          <i data-lucide="check" class="w-3.5 h-3.5"></i>
                          <span>Telafi Edildi</span>
                        </button>
                      `}
                    </div>
                    <div class="flex items-center gap-1">
                      <button onclick="App.openHataModal('${h.id}')" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors" title="Düzenle">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="App.openConfirmModal('Hatayı Sil', 'Bu hata kaydını silmek istediğinize emin misiniz?', () => { Store.deleteHata('${h.id}'); App.renderHataDefteri(); App.showToast('Hata kaydı silindi'); });" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Sil">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  openHataModal(hataId = null) {
    const isEdit = Boolean(hataId);
    const hata = isEdit ? (Store.data.hataKayitlari || []).find(h => String(h.id) === String(hataId)) : null;

    const ogr = Store.getOgrenci(this.hataSelectedOgrenciId) || Store.getAktifOgrenci();
    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin');
      return;
    }

    const dersler = Store.getDerslerForOgrenci(ogr);
    const seciliDersId = hata ? hata.dersId : (dersler[0] ? dersler[0].id : '');
    const seciliKonuId = hata ? hata.konuId : '';

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Hata Kaydını Düzenle' : 'Yeni Hata Kaydı Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">${ogr.ad} ${ogr.soyad} için telafi kaydı oluşturun.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-hata" onsubmit="event.preventDefault(); App.saveHata('${hataId || ''}');" class="space-y-3.5 text-xs">
          <!-- Ders -->
          <div>
            <label class="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Ders *</label>
            <select id="hata-input-ders" onchange="App.onHataModalDersChange(this.value)" class="select-instrument w-full text-xs py-1.5 px-3" required>
              ${dersler.map(d => `<option value="${d.id}" ${d.id === seciliDersId ? 'selected' : ''}>${d.ad}</option>`).join('')}
            </select>
          </div>

          <!-- Konu -->
          <div>
            <label class="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Konu</label>
            <select id="hata-input-konu" class="select-instrument w-full text-xs py-1.5 px-3">
              <!-- Dinamik olarak dolacak -->
            </select>
          </div>

          <!-- Hata Türü -->
          <div>
            <label class="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Hata Türü *</label>
            <select id="hata-input-tur" class="select-instrument w-full text-xs py-1.5 px-3" required>
              ${HATA_TURLERI.map(t => `<option value="${t.id}" ${hata && hata.hataTuru === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
            </select>
          </div>

          <!-- Açıklama -->
          <div>
            <label class="block text-[11px] font-semibold text-[var(--color-ink)] mb-1">Açıklama / Soru Notu</label>
            <textarea id="hata-input-aciklama" class="input-editorial w-full text-xs p-2.5 h-20" placeholder="Sorunun kökünde ne kaçırıldı? Hangi formül veya bilgi eksikti?">${hata ? (hata.aciklama || '') : ''}</textarea>
          </div>

          <!-- Butonlar -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3">İptal</button>
            <button type="submit" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4">${isEdit ? 'Güncelle' : 'Kaydet'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);
    this.onHataModalDersChange(seciliDersId, seciliKonuId);
  },

  onHataModalDersChange(dersId, seciliKonuId = '') {
    const konuSelect = document.getElementById('hata-input-konu');
    if (!konuSelect) return;

    const konular = Store.getKonularForDers(dersId);
    konuSelect.innerHTML = '<option value="">— Konu Seçiniz (Opsiyonel) —</option>' +
      konular.map(k => `<option value="${k.id}" ${k.id === seciliKonuId ? 'selected' : ''}>${k.konuAdi}</option>`).join('');
  },

  saveHata(hataId = '') {
    const ogr = Store.getOgrenci(this.hataSelectedOgrenciId) || Store.getAktifOgrenci();
    if (!ogr) return;

    const dersId = document.getElementById('hata-input-ders')?.value || '';
    const konuId = document.getElementById('hata-input-konu')?.value || '';
    const hataTuru = document.getElementById('hata-input-tur')?.value || 'Bilgi Eksikliği';
    const aciklama = document.getElementById('hata-input-aciklama')?.value || '';

    if (!dersId) {
      this.showToast('Lütfen ders seçin');
      return;
    }

    if (hataId) {
      Store.updateHata(hataId, { dersId, konuId, hataTuru, aciklama });
      this.showToast('Hata kaydı güncellendi');
    } else {
      Store.addHata({
        ogrenciId: ogr.id,
        dersId,
        konuId,
        hataTuru,
        aciklama
      });
      this.showToast('Hata kaydı eklendi');
    }

    this.closeModal();
    this.renderHataDefteri();
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 7: MÜFREDAT & DERS HAVUZU (renderCurriculumPool)
  // ─────────────────────────────────────────────────────────────
  renderCurriculumPool() {
    const container = document.getElementById('view-curriculum-pool');
    if (!container) return;

    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const siniflar = typeof SINIFLAR !== 'undefined' ? SINIFLAR : [];
    const allDersler = Store.getDersler();

    // Filtreleme
    const filteredDersler = allDersler.filter(d => {
      if (this.poolModulFilter && d.modulId !== this.poolModulFilter) return false;
      if (this.poolSinifFilter && d.sinif !== this.poolSinifFilter && d.sinif !== 'ortak') return false;
      return true;
    });

    // Aktif dersi ayarla
    if (!this.poolAktifDersId || !filteredDersler.some(d => d.id === this.poolAktifDersId)) {
      this.poolAktifDersId = filteredDersler.length > 0 ? filteredDersler[0].id : '';
    }

    const seciliDers = this.poolAktifDersId ? Store.getDers(this.poolAktifDersId) : null;
    const dersKonulari = seciliDers ? Store.getKonularForDers(seciliDers.id) : [];

    // Konuları ünitelerine göre grupla
    const unitelerMap = new Map();
    dersKonulari.forEach(k => {
      const uNo = Number(k.uniteNo) || 1;
      const uAdi = k.uniteAdi || `Ünite ${uNo}`;
      const key = `${uNo}:::${uAdi}`;
      if (!unitelerMap.has(key)) {
        unitelerMap.set(key, { no: uNo, ad: uAdi, konular: [] });
      }
      unitelerMap.get(key).konular.push(k);
    });

    const uniteler = Array.from(unitelerMap.values()).sort((a, b) => a.no - b.no);
    uniteler.forEach(u => u.konular.sort((a, b) => (Number(a.siraNo) || 1) - (Number(b.siraNo) || 1)));

    // Sınıf filtre seçenekleri (seçili modüle göre)
    const sinifOptions = siniflar
      .filter(s => !this.poolModulFilter || s.modulId === this.poolModulFilter)
      .map(s => `<option value="${s.deger}" ${this.poolSinifFilter === s.deger ? 'selected' : ''}>${s.label}</option>`)
      .join('');

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Başlık & Filtreler -->
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <h2 class="font-display font-bold text-lg text-[var(--color-ink)] leading-tight">Müfredat & Ders Havuzu</h2>
              <p class="text-xs text-[var(--color-ink-muted)]">MEB/ÖSYM kazanım standartları ve özel ders müfredatı yönetimi</p>
            </div>

            <div class="h-6 w-px bg-[var(--color-rule)] hidden sm:block"></div>

            <div class="flex items-center gap-2">
              <label for="pool-modul-filter" class="text-xs font-medium text-[var(--color-ink-muted)]">Modül:</label>
              <select id="pool-modul-filter" onchange="App.poolModulFilter = this.value; App.poolSinifFilter = ''; App.renderCurriculumPool();" class="select-instrument text-xs py-1.5 px-3 min-w-[140px]">
                <option value="">Tüm Modüller</option>
                ${moduller.map(m => `<option value="${m.id}" ${this.poolModulFilter === m.id ? 'selected' : ''}>${m.ad}</option>`).join('')}
              </select>
            </div>

            <div class="flex items-center gap-2">
              <label for="pool-sinif-filter" class="text-xs font-medium text-[var(--color-ink-muted)]">Sınıf:</label>
              <select id="pool-sinif-filter" onchange="App.poolSinifFilter = this.value; App.renderCurriculumPool();" class="select-instrument text-xs py-1.5 px-3 min-w-[120px]">
                <option value="">Tüm Sınıflar</option>
                ${sinifOptions}
              </select>
            </div>
          </div>

          <!-- Sağ Kısım: Butonlar -->
          <div class="flex items-center gap-2.5">
            <button onclick="App.openConfirmModal('Müfredatı Sıfırla', 'Müfredat standart MEB/ÖSYM fabrika ayarlarına sıfırlanacaktır. Eklediğiniz özel ders ve konular silinecektir. Onaylıyor musunuz?', () => { Store.resetCurriculum(); App.renderCurriculumPool(); App.showToast('Müfredat fabrika ayarlarına sıfırlandı'); });" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3 text-[var(--color-ink-faint)] hover:text-[var(--color-danger)]" title="Müfredatı Fabrika Ayarlarına Döndür">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span>Müfredatı Sıfırla</span>
            </button>
            <button onclick="App.openDersModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Ders Ekle</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: Ders & Konu Listesi Grid (4/12 & 8/12) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Sol Panel (4/12): Ders Listesi -->
          <div class="lg:col-span-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-4 space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
              <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]">Dersler (${filteredDersler.length})</span>
              <span class="text-[10px] text-[var(--color-ink-muted)]">Tıklayarak konuları açın</span>
            </div>

            <div class="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              ${filteredDersler.length === 0 ? `
                <div class="p-8 text-center text-xs text-[var(--color-ink-muted)] italic">
                  Seçili filtrelere uygun ders bulunamadı.
                </div>
              ` : filteredDersler.map(d => {
                const isSelected = seciliDers && d.id === seciliDers.id;
                const mod = moduller.find(m => m.id === d.modulId);
                const modAd = mod ? mod.kisaltma : d.modulId;
                const sinifStr = d.sinif === 'ortak' ? 'Ortak' : (d.sinif ? `${d.sinif}. Sınıf` : '');
                const kCount = Store.getKonularForDers(d.id).length;

                return `
                  <div onclick="App.poolAktifDersId = '${d.id}'; App.renderCurriculumPool();" class="group relative flex items-center justify-between p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer ${isSelected ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] shadow-xs' : 'bg-[var(--color-paper-1)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
                    <!-- Sol Kenar Renk Şeridi -->
                    <div class="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-${d.renk || 'blue'}-500"></div>

                    <div class="pl-2 min-w-0 flex-1 space-y-1">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="font-display font-bold text-xs text-[var(--color-ink)] truncate">${d.ad}</span>
                        <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-[var(--color-paper-4)] text-[var(--color-ink-muted)] border border-[var(--color-rule)] font-semibold">${d.kisaltma || 'DRS'}</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-[10px] text-[var(--color-ink-muted)]">
                        <span class="meta-pill text-[9px] py-0 px-1.5">${modAd}</span>
                        ${sinifStr ? `<span>${sinifStr}</span> · ` : ''}
                        <span>${kCount} konu</span>
                      </div>
                    </div>

                    <!-- Aksiyon İkonları -->
                    <div class="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                      <button onclick="App.openDersModal('${d.id}')" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-4)] transition-colors" title="Dersi Düzenle">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="App.openConfirmModal('Dersi Sil', '${d.ad} dersi ve bu derse ait tüm konular kalıcı olarak silinecektir. Onaylıyor musunuz?', () => { Store.deleteDers('${d.id}'); App.renderCurriculumPool(); App.showToast('Ders ve konuları silindi'); });" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Dersi Sil">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Sağ Panel (8/12): Seçili Dersin Konu Listesi -->
          <div class="lg:col-span-8 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-5 space-y-5">
            ${!seciliDers ? `
              <div class="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
                <i data-lucide="book-open" class="w-10 h-10 text-[var(--color-ink-faint)] mx-auto"></i>
                <p>Konuları görüntülemek için sol taraftan bir ders seçin veya yeni bir ders ekleyin.</p>
              </div>
            ` : `
              <!-- Üst Kısım: Seçili Ders Bilgisi & Ekleme Butonları -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-rule)]">
                <div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-${seciliDers.renk || 'blue'}-500 shrink-0"></div>
                    <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${seciliDers.ad}</h3>
                    <span class="meta-pill text-[10px]">${seciliDers.modulId.toUpperCase()}</span>
                    ${seciliDers.sinif ? `<span class="meta-pill text-[10px]">${seciliDers.sinif === 'ortak' ? 'Ortak' : seciliDers.sinif + '. Sınıf'}</span>` : ''}
                  </div>
                  <p class="text-xs text-[var(--color-ink-muted)] mt-1">
                    Toplam <strong class="text-[var(--color-ink)]">${dersKonulari.length}</strong> konu · ${uniteler.length} ünite ${seciliDers.haftalikSaat ? `· Haftada ${seciliDers.haftalikSaat} Saat` : ''}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button onclick="App.openUniteModal('${seciliDers.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3">
                    <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                    <span>+ Ünite Ekle</span>
                  </button>
                  <button onclick="App.openKonuModal('${seciliDers.id}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 shadow-sm">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>+ Konu Ekle</span>
                  </button>
                </div>
              </div>

              <!-- Konular Listesi (Ünite Gruplu) -->
              <div class="space-y-5 max-h-[640px] overflow-y-auto pr-1">
                ${uniteler.length === 0 ? `
                  <div class="p-10 text-center bg-[var(--color-paper-1)] border border-[var(--color-rule)] rounded-[var(--radius-md)] space-y-3">
                    <i data-lucide="list-plus" class="w-8 h-8 text-[var(--color-ink-faint)] mx-auto"></i>
                    <h4 class="font-display font-bold text-sm text-[var(--color-ink)]">Henüz Konu Eklenmedi</h4>
                    <p class="text-xs text-[var(--color-ink-muted)]">Bu derse ait kazanım ve konuları oluşturmak için "+ Konu Ekle" butonunu kullanın.</p>
                    <button onclick="App.openKonuModal('${seciliDers.id}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                      <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                      <span>İlk Konuyu Ekle</span>
                    </button>
                  </div>
                ` : uniteler.map(u => `
                  <div class="border border-[var(--color-rule)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-paper-1)]">
                    <!-- Ünite Başlığı -->
                    <div class="flex items-center justify-between p-2.5 px-3.5 bg-[var(--color-paper-3)] border-b border-[var(--color-rule)] text-xs">
                      <div class="flex items-center gap-2 font-display font-bold text-[var(--color-ink)]">
                        <span class="meta-pill text-[9px] font-mono">Ünite ${u.no}</span>
                        <span>${u.ad}</span>
                        <span class="text-[10px] font-normal text-[var(--color-ink-muted)]">(${u.konular.length} konu)</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <button onclick="App.openKonuModal('${seciliDers.id}', null, ${u.no}, '${encodeURIComponent(u.ad)}')" class="btn-tactile btn-tactile-ghost text-[10px] py-1 px-2" title="Bu üniteye yeni konu ekle">
                          <i data-lucide="plus" class="w-3 h-3"></i>
                          <span>Konu Ekle</span>
                        </button>
                      </div>
                    </div>

                    <!-- Konu Satırları -->
                    <div class="divide-y divide-[var(--color-rule)]">
                      ${u.konular.map((k, kIdx) => `
                        <div class="flex items-center justify-between p-2.5 px-3.5 hover:bg-[var(--color-paper-2)] transition-colors text-xs group">
                          <div class="flex items-start gap-3 min-w-0 pr-2">
                            <span class="font-mono text-[10px] text-[var(--color-ink-faint)] w-5 pt-0.5 shrink-0 text-right">${k.siraNo || kIdx + 1}.</span>
                            <div class="min-w-0">
                              <span class="font-medium text-[var(--color-ink)] leading-snug block">${k.konuAdi}</span>
                              ${k.aciklama ? `<span class="text-[11px] text-[var(--color-ink-muted)] leading-tight block mt-0.5">${k.aciklama}</span>` : ''}
                            </div>
                          </div>

                          <div class="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                            <button onclick="App.openKonuModal('${seciliDers.id}', '${k.id}')" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors" title="Konuyu Düzenle">
                              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="App.openConfirmModal('Konuyu Sil', '${k.konuAdi} konusu silinecektir. Emin misiniz?', () => { Store.deleteKonu('${k.id}'); App.renderCurriculumPool(); App.showToast('Konu silindi'); });" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Konuyu Sil">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  openDersModal(dersId = null) {
    const isEdit = Boolean(dersId);
    const d = isEdit ? Store.getDers(dersId) : null;

    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const siniflar = typeof SINIFLAR !== 'undefined' ? SINIFLAR : [];
    const renkler = ['rose', 'blue', 'emerald', 'amber', 'purple', 'teal', 'orange', 'cyan', 'indigo', 'slate'];

    const seciliModulId = d ? d.modulId : (this.poolModulFilter || 'yks');
    const seciliSinif = d ? String(d.sinif || 'ortak') : 'ortak';
    const seciliRenk = d ? d.renk || 'blue' : 'blue';

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Müfredat havuzuna ders tanımı ve parametrelerini kaydedin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-ders" class="space-y-3.5 text-xs">
          <!-- Ders Adı & Kısaltma -->
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Ders Adı <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="ders-input-ad" value="${d ? d.ad : ''}" required placeholder="Örn: Geometri, Biyoloji" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Kısaltma <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="ders-input-kisaltma" maxlength="5" value="${d ? d.kisaltma : ''}" required placeholder="GEO" class="w-full p-2 uppercase font-mono rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <!-- Modül & Sınıf -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Modül *</label>
              <select id="ders-input-modul" class="select-instrument w-full p-2">
                ${moduller.map(m => `<option value="${m.id}" ${m.id === seciliModulId ? 'selected' : ''}>${m.ad}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Kademesi / Sınıf</label>
              <select id="ders-input-sinif" class="select-instrument w-full p-2">
                <option value="ortak" ${seciliSinif === 'ortak' ? 'selected' : ''}>Ortak (Tüm Kademeler)</option>
                ${siniflar.map(s => `<option value="${s.deger}" ${String(s.deger) === seciliSinif ? 'selected' : ''}>${s.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Haftalık Saat & Sınavda Mı? & Soru Sayısı -->
          <div class="grid grid-cols-3 gap-3 items-center">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Haftalık Saat</label>
              <input type="number" id="ders-input-saat" min="0" max="40" value="${d ? d.haftalikSaat || 0 : 4}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Sınav Sorusu</label>
              <input type="number" id="ders-input-soru" min="0" max="100" value="${d ? d.soruSayisi || 0 : 0}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div class="pt-5 flex items-center gap-2">
              <input type="checkbox" id="ders-input-sinavda" ${d && d.sinavdaMi ? 'checked' : ''} class="rounded border-[var(--color-rule)] text-[var(--color-accent)]">
              <label for="ders-input-sinavda" class="font-medium text-[var(--color-ink)] select-none">Sınav Kapsamında</label>
            </div>
          </div>

          <!-- Renk Seçimi -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1.5">Ders Vurgu Rengi</label>
            <div class="flex items-center gap-2 flex-wrap">
              ${renkler.map(r => `
                <label class="cursor-pointer">
                  <input type="radio" name="ders-renk" value="${r}" class="sr-only peer" ${seciliRenk === r ? 'checked' : ''}>
                  <div class="w-6 h-6 rounded-full bg-${r}-500 border-2 border-transparent peer-checked:border-[var(--color-ink)] transition-all"></div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Butonlar -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">İptal</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Dersi Ekle'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-ders');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ad = document.getElementById('ders-input-ad').value.trim();
        const kisaltma = document.getElementById('ders-input-kisaltma').value.trim();
        const modulId = document.getElementById('ders-input-modul').value;
        const sinif = document.getElementById('ders-input-sinif').value;
        const haftalikSaat = parseInt(document.getElementById('ders-input-saat').value) || 0;
        const soruSayisi = parseInt(document.getElementById('ders-input-soru').value) || 0;
        const sinavdaMi = document.getElementById('ders-input-sinavda').checked;
        const secilenRenkEl = document.querySelector('input[name="ders-renk"]:checked');
        const renk = secilenRenkEl ? secilenRenkEl.value : 'blue';

        if (!ad || !kisaltma) {
          this.showToast('Lütfen ders adı ve kısaltmasını girin.');
          return;
        }

        if (isEdit) {
          Store.updateDers(dersId, { ad, kisaltma, modulId, sinif, haftalikSaat, soruSayisi, sinavdaMi, renk });
          this.showToast('Ders güncellendi');
        } else {
          const yeni = Store.addDers({ ad, kisaltma, modulId, sinif, haftalikSaat, soruSayisi, sinavdaMi, renk });
          this.poolAktifDersId = yeni.id;
          this.showToast('Yeni ders havuza eklendi');
        }

        this.closeModal();
        this.renderCurriculumPool();
      });
    }
  },

  openKonuModal(dersId, konuId = null, defaultUniteNo = null, defaultUniteAdi = null) {
    const isEdit = Boolean(konuId);
    const ders = Store.getDers(dersId);
    const konu = isEdit ? Store.getKonu(konuId) : null;
    if (!ders) return;

    const dersKonulari = Store.getKonularForDers(dersId);
    const sonUniteNo = dersKonulari.length > 0 ? Math.max(...dersKonulari.map(k => Number(k.uniteNo) || 1)) : 1;

    const uniteNo = konu ? konu.uniteNo : (defaultUniteNo || sonUniteNo);
    const uniteAdi = konu ? konu.uniteAdi : (defaultUniteAdi ? decodeURIComponent(defaultUniteAdi) : `Ünite ${uniteNo}`);
    const siraNo = konu ? (konu.siraNo || 1) : (dersKonulari.filter(k => (Number(k.uniteNo) || 1) === uniteNo).length + 1);

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Konuyu Düzenle' : 'Yeni Konu Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]"><strong>${ders.ad}</strong> dersi için konu ve kazanım tanımı</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-konu" class="space-y-3.5 text-xs">
          <!-- Ders Adı (Disabled) -->
          <div>
            <label class="block font-semibold text-[var(--color-ink-muted)] mb-1">Ders</label>
            <input type="text" disabled value="${ders.ad} (${ders.kisaltma || 'DRS'})" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-4)] border border-[var(--color-rule)] text-[var(--color-ink-muted)]">
          </div>

          <!-- Ünite No & Ünite Adı -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Ünite No</label>
              <input type="number" id="konu-input-unite-no" min="1" max="50" value="${uniteNo}" required class="w-full p-2 font-mono rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div class="col-span-2">
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Ünite Başlığı</label>
              <input type="text" id="konu-input-unite-ad" value="${uniteAdi}" required placeholder="Örn: Fonksiyonlar, Hücre Bölünmesi" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <!-- Konu Adı & Sıra No -->
          <div class="grid grid-cols-4 gap-3">
            <div class="col-span-3">
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Konu / Kazanım Adı <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="konu-input-ad" value="${konu ? konu.konuAdi : ''}" required placeholder="Örn: Bileşke Fonksiyon ve Ters Fonksiyon" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Sıra No</label>
              <input type="number" id="konu-input-sira" min="1" value="${siraNo}" class="w-full p-2 font-mono rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <!-- Açıklama -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">Konu Açıklaması / Kazanım Detayı</label>
            <textarea id="konu-input-aciklama" class="input-editorial w-full text-xs p-2.5 h-16" placeholder="Kazanım hedefleri, dikkat edilmesi gereken soru tipleri...">${konu ? (konu.aciklama || '') : ''}</textarea>
          </div>

          <!-- Butonlar -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">İptal</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Konuyu Ekle'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-konu');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const konuAdi = document.getElementById('konu-input-ad').value.trim();
        const uniteNoVal = parseInt(document.getElementById('konu-input-unite-no').value) || 1;
        const uniteAdiVal = document.getElementById('konu-input-unite-ad').value.trim() || `Ünite ${uniteNoVal}`;
        const siraNoVal = parseInt(document.getElementById('konu-input-sira').value) || 1;
        const aciklama = document.getElementById('konu-input-aciklama').value.trim();

        if (!konuAdi) {
          this.showToast('Lütfen konu adını giriniz.');
          return;
        }

        if (isEdit) {
          Store.updateKonu(konuId, {
            konuAdi,
            uniteNo: uniteNoVal,
            uniteAdi: uniteAdiVal,
            siraNo: siraNoVal,
            aciklama
          });
          this.showToast('Konu güncellendi');
        } else {
          Store.addKonu({
            dersId: ders.id,
            modulId: ders.modulId,
            sinif: ders.sinif,
            uniteNo: uniteNoVal,
            uniteAdi: uniteAdiVal,
            konuAdi,
            siraNo: siraNoVal,
            aciklama
          });
          this.showToast('Yeni konu eklendi');
        }

        this.closeModal();
        this.renderCurriculumPool();
      });
    }
  },

  openUniteModal(dersId) {
    const ders = Store.getDers(dersId);
    if (!ders) return;

    const dersKonulari = Store.getKonularForDers(dersId);
    const maxUniteNo = dersKonulari.length > 0 ? Math.max(...dersKonulari.map(k => Number(k.uniteNo) || 1)) : 0;
    const nextUniteNo = maxUniteNo + 1;

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Yeni Ünite Ekle</h3>
            <p class="text-xs text-[var(--color-ink-muted)]"><strong>${ders.ad}</strong> dersi için yeni ünite başlığı oluşturun.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-unite" class="space-y-3.5 text-xs">
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Ünite No</label>
              <input type="number" id="unite-input-no" min="1" value="${nextUniteNo}" required class="w-full p-2 font-mono rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)]">
            </div>
            <div class="col-span-2">
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Ünite Başlığı *</label>
              <input type="text" id="unite-input-ad" required placeholder="Örn: Geometrik Cisimler" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)]">
            </div>
          </div>

          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">İlk Konu Adı *</label>
            <input type="text" id="unite-input-ilk-konu" required placeholder="Örn: Prizmalar ve Temel Özellikler" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)]">
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">İptal</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">Üniteyi Oluştur</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-unite');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const uNo = parseInt(document.getElementById('unite-input-no').value) || nextUniteNo;
        const uAd = document.getElementById('unite-input-ad').value.trim();
        const ilkKonu = document.getElementById('unite-input-ilk-konu').value.trim();

        if (!uAd || !ilkKonu) {
          this.showToast('Lütfen gerekli alanları doldurunuz.');
          return;
        }

        Store.addKonu({
          dersId: ders.id,
          modulId: ders.modulId,
          sinif: ders.sinif,
          uniteNo: uNo,
          uniteAdi: uAd,
          konuAdi: ilkKonu,
          siraNo: 1
        });

        this.closeModal();
        this.renderCurriculumPool();
        this.showToast(`"${uAd}" ünitesi oluşturuldu`);
      });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 8: KAYNAK KÜTÜPHANESİ (renderLibrary)
  // ─────────────────────────────────────────────────────────────
  renderLibrary() {
    const container = document.getElementById('view-library');
    if (!container) return;

    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const allKaynaklar = Store.getKaynaklar();

    // Filtreleme
    const filtered = allKaynaklar.filter(k => {
      if (this.libraryModulFilter) {
        const kMods = Array.isArray(k.modulId) ? k.modulId : [k.modulId];
        if (!kMods.includes(this.libraryModulFilter)) return false;
      }
      if (this.librarySearchQuery) {
        const q = this.librarySearchQuery.toLowerCase();
        const adMatch = (k.ad || '').toLowerCase().includes(q);
        const yayMatch = (k.yayinevi || '').toLowerCase().includes(q);
        if (!adMatch && !yayMatch) return false;
      }
      return true;
    });

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Başlık & Filtreler -->
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <h2 class="font-display font-bold text-lg text-[var(--color-ink)] leading-tight">Kaynak & Yayın Kütüphanesi</h2>
              <p class="text-xs text-[var(--color-ink-muted)]">Soru bankası, fasikül ve deneme setleri envanteri</p>
            </div>

            <div class="h-6 w-px bg-[var(--color-rule)] hidden sm:block"></div>

            <div class="flex items-center gap-2">
              <label for="library-modul-filter" class="text-xs font-medium text-[var(--color-ink-muted)]">Modül:</label>
              <select id="library-modul-filter" onchange="App.libraryModulFilter = this.value; App.renderLibrary();" class="select-instrument text-xs py-1.5 px-3 min-w-[140px]">
                <option value="">Tüm Modüller</option>
                ${moduller.map(m => `<option value="${m.id}" ${this.libraryModulFilter === m.id ? 'selected' : ''}>${m.ad}</option>`).join('')}
              </select>
            </div>

            <!-- Metin Arama -->
            <div class="relative">
              <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--color-ink-faint)]"></i>
              <input type="text" id="library-search" value="${this.librarySearchQuery || ''}" oninput="App.librarySearchQuery = this.value; App.renderLibrary();" placeholder="Kaynak veya yayınevi ara..." class="input-editorial text-xs pl-8 pr-3 py-1.5 w-48 sm:w-56">
            </div>
          </div>

          <!-- Sağ Kısım: Buton -->
          <div>
            <button onclick="App.openKaynakModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Kaynak Ekle</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: Kaynak Kartları Grid (3 Sütun) -->
        ${filtered.length === 0 ? `
          <div class="p-16 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] space-y-4">
            <i data-lucide="library" class="w-12 h-12 text-[var(--color-ink-faint)] mx-auto"></i>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Kayıtlı Kaynak Bulunamadı</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Arama kriterlerinize uyan kaynak bulunmuyor. Yeni bir yayın eklemek için butona tıklayın.</p>
            <button onclick="App.openKaynakModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Yeni Kaynak Ekle</span>
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${filtered.map(k => {
              const kMods = Array.isArray(k.modulId) ? k.modulId : [k.modulId || 'yks'];
              const zorluk = Math.max(1, Math.min(5, Number(k.zorluk) || 3));
              const cozulenSoru = Store.getKaynakCozulenSoruSayisi(k.id);

              return `
                <div class="card-editorial p-4 flex flex-col justify-between space-y-3.5 border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all">
                  <div class="space-y-2.5">
                    <!-- Üst Bilgi: Yayınevi & Tür -->
                    <div class="flex items-center justify-between gap-2">
                      <span class="text-xs font-mono font-bold text-[var(--color-accent)] uppercase tracking-wider">${k.yayinevi || 'Genel Yayın'}</span>
                      <span class="meta-pill text-[10px]">${k.tur || 'Soru Bankası'}</span>
                    </div>

                    <!-- Başlık -->
                    <h3 class="font-display font-bold text-sm text-[var(--color-ink)] leading-snug line-clamp-2">
                      ${k.ad}
                    </h3>

                    <!-- Açıklama -->
                    ${k.aciklama ? `<p class="text-xs text-[var(--color-ink-muted)] line-clamp-2 italic">${k.aciklama}</p>` : ''}

                    <!-- Modül Rozetleri & Zorluk Derecesi -->
                    <div class="flex items-center justify-between pt-1">
                      <div class="flex items-center gap-1 flex-wrap">
                        ${kMods.map(mId => {
                          const mObj = moduller.find(m => m.id === mId);
                          return `<span class="meta-pill text-[9px] px-1.5 py-0.5">${mObj ? mObj.kisaltma : mId}</span>`;
                        }).join('')}
                      </div>

                      <!-- Zorluk 1-5 Yıldız -->
                      <div class="flex items-center gap-0.5 text-amber-500 text-xs" title="Zorluk Derecesi: ${zorluk} / 5">
                        ${[1, 2, 3, 4, 5].map(star => `
                          <i data-lucide="star" class="w-3 h-3 ${star <= zorluk ? 'fill-amber-500 text-amber-500' : 'text-[var(--color-rule-strong)]'}"></i>
                        `).join('')}
                      </div>
                    </div>
                  </div>

                  <!-- Alt Bilgi: Çözülen Soru Sayısı & İşlemler -->
                  <div class="pt-3 border-t border-[var(--color-rule)] flex items-center justify-between text-xs">
                    <span class="font-mono text-[11px] text-[var(--color-ink-muted)]">
                      <strong class="text-[var(--color-ink)]">${cozulenSoru}</strong> soru çözüldü
                    </span>

                    <div class="flex items-center gap-1">
                      <button onclick="App.openKaynakModal('${k.id}')" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors" title="Kaynağı Düzenle">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="App.openConfirmModal('Kaynağı Sil', '${k.ad} kaynağı silinecektir. Bu kaynağa bağlı ödevler silinmeyecektir. Onaylıyor musunuz?', () => { Store.deleteKaynak('${k.id}'); App.renderLibrary(); App.showToast('Kaynak silindi'); });" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Kaynağı Sil">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW 9: ÖĞRENCİ PORTFÖYÜ (renderStudents)
  // ─────────────────────────────────────────────────────────────
  renderStudents() {
    const container = document.getElementById('view-students');
    if (!container) return;

    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const allStudents = Store.getOgrenciler();

    // Filtreleme
    const filtered = allStudents.filter(o => {
      if (this.studentsModulFilter && o.modulId !== this.studentsModulFilter) return false;
      if (this.studentsSearchQuery) {
        const q = this.studentsSearchQuery.toLowerCase();
        const adMatch = `${o.ad || ''} ${o.soyad || ''}`.toLowerCase().includes(q);
        const okulMatch = (o.okul || '').toLowerCase().includes(q);
        if (!adMatch && !okulMatch) return false;
      }
      return true;
    });

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Başlık & Filtreler -->
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <h2 class="font-display font-bold text-lg text-[var(--color-ink)] leading-tight">Öğrenci Portföyü</h2>
              <p class="text-xs text-[var(--color-ink-muted)]">Kayıtlı öğrenciler, müfredat durumları ve Excel entegrasyonu</p>
            </div>

            <div class="h-6 w-px bg-[var(--color-rule)] hidden sm:block"></div>

            <div class="flex items-center gap-2">
              <label for="students-modul-filter" class="text-xs font-medium text-[var(--color-ink-muted)]">Modül:</label>
              <select id="students-modul-filter" onchange="App.studentsModulFilter = this.value; App.renderStudents();" class="select-instrument text-xs py-1.5 px-3 min-w-[140px]">
                <option value="">Tüm Modüller</option>
                ${moduller.map(m => `<option value="${m.id}" ${this.studentsModulFilter === m.id ? 'selected' : ''}>${m.ad}</option>`).join('')}
              </select>
            </div>

            <!-- Metin Arama -->
            <div class="relative">
              <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--color-ink-faint)]"></i>
              <input type="text" id="students-search" value="${this.studentsSearchQuery || ''}" oninput="App.studentsSearchQuery = this.value; App.renderStudents();" placeholder="Öğrenci veya okul ara..." class="input-editorial text-xs pl-8 pr-3 py-1.5 w-48 sm:w-56">
            </div>
          </div>

          <!-- Sağ Kısım: Excel & Yeni Öğrenci Butonları -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="ExcelEngine.sablonIndir()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5" title="Örnek Excel Şablonunu İndir">
              <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
              <span>Şablon</span>
            </button>
            <button onclick="App.openExcelIceAktarModal()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5" title="Excel'den Öğrenci Yükle">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Excel'den Al</span>
            </button>
            <button onclick="ExcelEngine.ogrenciDisaAktar()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5" title="Öğrencileri Excel Olarak Dışa Aktar">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Excel'e Aktar</span>
            </button>
            <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 shadow-sm">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span>+ Yeni Öğrenci</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: Öğrenci Kartları Grid (3 Sütun) -->
        ${filtered.length === 0 ? `
          <div class="p-16 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] space-y-4">
            <i data-lucide="users" class="w-12 h-12 text-[var(--color-ink-faint)] mx-auto"></i>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Henüz Öğrenci Eklenmedi</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Öğrenci portföyünüze manuel olarak öğrenci ekleyebilir veya Excel listesi ile toplu içe aktarabilirsiniz.</p>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button onclick="App.openOgrenciModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>Manuel Ekle</span>
              </button>
              <button onclick="App.openExcelIceAktarModal()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>Excel'den İçe Aktar</span>
              </button>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${filtered.map(ogr => {
              const mod = Store.getModulForOgrenci(ogr);
              const modAd = mod ? mod.ad : (ogr.modulId || 'Müfredat');
              const isAktif = String(ogr.id) === String(Store.data.aktifOgrenciId);

              // İlerleme hesabı
              const ogrDersler = Store.getDerslerForOgrenci(ogr);
              let totalKonular = 0;
              let tamamKonular = 0;
              ogrDersler.forEach(d => {
                const kList = Store.getKonularForDers(d.id);
                totalKonular += kList.length;
                kList.forEach(k => {
                  const kd = Store.getKonuDurumu(ogr.id, k.id);
                  if (kd.durum === 'tamam') tamamKonular++;
                });
              });
              const ilerlemePct = totalKonular > 0 ? Math.round((tamamKonular / totalKonular) * 100) : 0;

              // Görevler
              const aktifGorevCount = Store.getAktifGorevler(ogr.id).length;
              const gecikmisGorevCount = Store.getGecikmisGorevler(ogr.id).length;

              const basHarfler = ((ogr.ad ? ogr.ad[0] : '') + (ogr.soyad ? ogr.soyad[0] : '')).toUpperCase();

              return `
                <div class="card-editorial p-5 flex flex-col justify-between space-y-4 border ${isAktif ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] bg-[var(--color-accent-subtle)]/15' : 'border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'} transition-all">
                  <div class="space-y-3.5">
                    <!-- Üst Başlık: Avatar & İsim & Modül -->
                    <div class="flex items-start gap-3">
                      <div class="w-11 h-11 rounded-[var(--radius-sm)] bg-${ogr.renk || 'teal'}-500/15 border border-${ogr.renk || 'teal'}-500/30 text-${ogr.renk || 'teal'}-600 dark:text-${ogr.renk || 'teal'}-400 font-display font-black text-sm flex items-center justify-center shrink-0">
                        ${basHarfler || 'ÖG'}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center justify-between gap-1">
                          <h3 class="font-display font-bold text-sm text-[var(--color-ink)] truncate">${ogr.ad} ${ogr.soyad}</h3>
                          <span class="meta-pill text-[9px]">${ogr.sinif ? ogr.sinif + '. Sınıf' : ''}</span>
                        </div>
                        <div class="text-[11px] text-[var(--color-ink-muted)] truncate">${ogr.okul || 'Okul belirtilmedi'}</div>
                        <div class="text-[10px] text-[var(--color-accent)] font-semibold mt-0.5">${modAd}</div>
                      </div>
                    </div>

                    <!-- Hedef -->
                    ${ogr.hedef ? `
                      <div class="text-xs text-[var(--color-ink-muted)] italic bg-[var(--color-paper-3)] p-2 rounded-[var(--radius-xs)] border border-[var(--color-rule)] line-clamp-2">
                        🎯 "${ogr.hedef}"
                      </div>
                    ` : ''}

                    <!-- İlerleme Çubuğu -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[11px]">
                        <span class="text-[var(--color-ink-muted)] font-medium">Müfredat İlerlemesi</span>
                        <span class="font-mono font-bold text-[var(--color-ink)]">${tamamKonular}/${totalKonular} Konu (%${ilerlemePct})</span>
                      </div>
                      <div class="w-full h-1.5 bg-[var(--color-paper-3)] rounded-full overflow-hidden border border-[var(--color-rule)]">
                        <div class="h-full bg-[var(--color-accent)] rounded-full transition-all" style="width: ${ilerlemePct}%"></div>
                      </div>
                    </div>

                    <!-- Görev Rozetleri -->
                    <div class="flex items-center gap-2 pt-1 text-[11px]">
                      <span class="meta-pill bg-[var(--color-paper-3)] text-[var(--color-ink)] border-[var(--color-rule)] font-mono">
                        ${aktifGorevCount} Aktif Görev
                      </span>
                      ${gecikmisGorevCount > 0 ? `
                        <span class="meta-pill bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger-border)] font-mono font-bold">
                          ${gecikmisGorevCount} Gecikmiş
                        </span>
                      ` : `
                        <span class="meta-pill bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success-border)] font-mono">
                          0 Gecikme
                        </span>
                      `}
                    </div>
                  </div>

                  <!-- Alt İşlem Butonları -->
                  <div class="pt-3 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
                    <div>
                      ${isAktif ? `
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-xs)] text-[11px] font-semibold bg-[var(--color-success-bg)] text-[var(--color-success)] border border-[var(--color-success-border)]">
                          <i data-lucide="check" class="w-3.5 h-3.5"></i>Aktif Öğrenci
                        </span>
                      ` : `
                        <button onclick="Store.setAktifOgrenci('${ogr.id}'); App.updateGlobalBadges(); App.populateStudentDropdown(); App.renderStudents(); App.showToast('${ogr.ad} ${ogr.soyad} aktif öğrenci olarak seçildi');" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5">
                          <span>Aktif Yap</span>
                        </button>
                      `}
                    </div>

                    <div class="flex items-center gap-1">
                      <button onclick="App.openOgrenciModal('${ogr.id}')" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors" title="Öğrenciyi Düzenle">
                        <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      </button>
                      <button onclick="App.openConfirmModal('Öğrenciyi Sil', '${ogr.ad} ${ogr.soyad} ve ilişkili tüm ödev, takip ve hata verileri kalıcı olarak silinecektir. Onaylıyor musunuz?', () => { Store.deleteOgrenci('${ogr.id}'); App.populateStudentDropdown(); App.updateGlobalBadges(); App.renderStudents(); App.showToast('Öğrenci silindi'); });" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Öğrenciyi Sil">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  openExcelIceAktarModal() {
    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Excel ile Toplu Öğrenci Aktarımı</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Excel dosyanızdaki öğrencileri sisteme otomatik olarak dahil edin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div id="excel-modal-step1" class="space-y-4 text-xs">
          <!-- Bilgilendirme ve Şablon Linki -->
          <div class="p-3.5 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)] flex items-center justify-between">
            <div class="flex items-center gap-2 text-[var(--color-ink)]">
              <i data-lucide="info" class="w-4 h-4 text-[var(--color-accent)] shrink-0"></i>
              <span>Dosyanızın formatı şablonla uyumlu olmalıdır.</span>
            </div>
            <button onclick="ExcelEngine.sablonIndir()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)]">
              <i data-lucide="download" class="w-3 h-3"></i>
              <span>Şablonu İndir</span>
            </button>
          </div>

          <!-- Dosya Seçim Alanı -->
          <div class="border-2 border-dashed border-[var(--color-rule-strong)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-8 text-center space-y-2 transition-colors cursor-pointer bg-[var(--color-paper-1)]" onclick="document.getElementById('excel-file-input').click()">
            <i data-lucide="file-spreadsheet" class="w-10 h-10 text-[var(--color-accent)] mx-auto"></i>
            <div class="font-display font-bold text-sm text-[var(--color-ink)]">Excel dosyasını buraya bırakın veya seçin</div>
            <div class="text-[11px] text-[var(--color-ink-muted)]">.xlsx veya .xls formatları desteklenmektedir</div>
            <input type="file" id="excel-file-input" accept=".xlsx, .xls" class="hidden" onchange="App.onExcelFileChosen(event)">
          </div>
        </div>

        <div id="excel-modal-step2" class="hidden space-y-4 text-xs">
          <!-- Sonuç Alanı Dinamik Dolar -->
        </div>
      </div>
    `;

    this.openModal(html);
  },

  onExcelFileChosen(event) {
    const file = event.target.files[0];
    if (!file) return;

    const step1 = document.getElementById('excel-modal-step1');
    const step2 = document.getElementById('excel-modal-step2');
    if (!step2) return;

    if (step1) step1.classList.add('hidden');
    step2.classList.remove('hidden');

    step2.innerHTML = `
      <div class="p-8 text-center text-xs text-[var(--color-ink-muted)] space-y-2">
        <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-[var(--color-accent)]"></i>
        <p>Excel dosyası doğrulanıyor ve analiz ediliyor...</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    ExcelEngine.ogrenciIceAktar(file, (sonuc) => {
      const basarili = sonuc.basarili || [];
      const hatali = sonuc.hatali || [];

      let contentHtml = `
        <div class="space-y-3.5 text-xs">
          <div class="flex items-center gap-2 p-3 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-[var(--radius-md)] text-[var(--color-success)] font-semibold">
            <i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i>
            <span>${basarili.length} öğrenci aktarıma hazır</span>
          </div>
      `;

      if (hatali.length > 0) {
        contentHtml += `
          <div class="space-y-2 p-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] rounded-[var(--radius-md)] text-[var(--color-danger)]">
            <div class="font-bold flex items-center gap-1.5">
              <i data-lucide="alert-triangle" class="w-4 h-4 shrink-0"></i>
              <span>${hatali.length} satırda geçersiz veri tespit edildi (bu satırlar atlanacaktır):</span>
            </div>
            <div class="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
              ${hatali.map(h => `<div>• Satır ${h.satir}: ${h.sebep}</div>`).join('')}
            </div>
          </div>
        `;
      }

      contentHtml += `
          <div class="flex items-center justify-between pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.openExcelIceAktarModal()" class="btn-tactile btn-tactile-ghost text-xs">Farklı Dosya Seç</button>
            <button type="button" ${basarili.length === 0 ? 'disabled' : ''} onclick="App.saveExcelStudents('${encodeURIComponent(JSON.stringify(basarili))}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4">
              ${basarili.length} Öğrenciyi Sisteme Kaydet
            </button>
          </div>
        </div>
      `;

      step2.innerHTML = contentHtml;
      if (window.lucide) lucide.createIcons();
    });
  },

  saveExcelStudents(encodedData) {
    try {
      const basarili = JSON.parse(decodeURIComponent(encodedData));
      if (!Array.isArray(basarili) || basarili.length === 0) {
        this.showToast('Aktarılacak geçerli öğrenci bulunamadı.');
        return;
      }

      basarili.forEach(item => {
        Store.addOgrenci(item.veri);
      });

      this.closeModal();
      this.populateStudentDropdown();
      this.updateGlobalBadges();
      this.renderStudents();
      this.showToast(`${basarili.length} öğrenci başarıyla sisteme kaydedildi!`);
    } catch (err) {
      console.error('Excel öğrencileri kaydedilirken hata:', err);
      this.showToast('Öğrenciler kaydedilirken bir hata oluştu.');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // MODAL FONKSİYONLARI (ÖĞRENCİ, GÖREV, MODÜL SEÇİCİ)
  // ─────────────────────────────────────────────────────────────
  openOgrenciModal(ogrenciId = null) {
    const isEdit = Boolean(ogrenciId);
    const ogr = isEdit ? Store.getOgrenci(ogrenciId) : null;

    const renkler = ['teal', 'blue', 'indigo', 'rose', 'amber', 'emerald'];
    const seciliRenk = ogr ? ogr.renk || 'teal' : 'teal';

    const sinifOptions = (typeof SINIFLAR !== 'undefined' ? SINIFLAR : []).map(s => {
      const isSelected = ogr ? String(ogr.sinif) === String(s.deger) : s.deger === '8';
      return `<option value="${s.deger}" data-modul="${s.modulId}" ${isSelected ? 'selected' : ''}>${s.label}</option>`;
    }).join('');

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Öğrenciyi Düzenle' : 'Yeni Öğrenci Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Öğrenci profili ve hedef sınıf yapılandırması</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-ogrenci" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Ad <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="ogr-ad" value="${ogr ? ogr.ad : ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Ayşe">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Soyad <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="ogr-soyad" value="${ogr ? ogr.soyad : ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Yılmaz">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Sınıf</label>
              <select id="ogr-sinif" class="select-instrument w-full p-2">
                ${sinifOptions}
              </select>
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Modül Önizleme</label>
              <div id="ogr-modul-preview" class="p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] font-mono text-[var(--color-accent)] font-semibold text-center">
                —
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Okul</label>
              <input type="text" id="ogr-okul" value="${ogr ? ogr.okul || '' : ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Atatürk Ortaokulu">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Hedef</label>
              <input type="text" id="ogr-hedef" value="${ogr ? ogr.hedef || '' : ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Fen Lisesi / Tıp">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Öğrenci Telefon</label>
              <input type="tel" id="ogr-tel" value="${ogr ? ogr.ogrenciTel || '' : ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="05XX XXX XX XX">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Veli Adı</label>
              <input type="text" id="ogr-veli-ad" value="${ogr ? ogr.veliAd || '' : ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Veli Adı Soyadı">
            </div>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Veli Telefon</label>
            <input type="tel" id="ogr-veli-tel" value="${ogr ? ogr.veliTel || '' : ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="05XX XXX XX XX">
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1.5">Avatar Teması</label>
            <div class="flex items-center gap-2">
              ${renkler.map(r => `
                <label class="cursor-pointer">
                  <input type="radio" name="ogr-renk" value="${r}" class="sr-only peer" ${seciliRenk === r ? 'checked' : ''}>
                  <div class="w-7 h-7 rounded-full bg-${r}-500 border-2 border-transparent peer-checked:border-[var(--color-ink)] transition-all"></div>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Ekle'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    // Modül önizlemesini güncelleme
    const sinifSelect = document.getElementById('ogr-sinif');
    const modulPreview = document.getElementById('ogr-modul-preview');

    const updateModulPreview = () => {
      if (!sinifSelect || !modulPreview) return;
      const opt = sinifSelect.selectedOptions[0];
      const modId = opt ? opt.getAttribute('data-modul') : '';
      const mod = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === modId) : null;
      modulPreview.textContent = mod ? mod.ad : '—';
    };

    if (sinifSelect) {
      sinifSelect.addEventListener('change', updateModulPreview);
      updateModulPreview();
    }

    // Form Gönderme
    const form = document.getElementById('form-ogrenci');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const ad = document.getElementById('ogr-ad').value.trim();
        const soyad = document.getElementById('ogr-soyad').value.trim();
        const sinif = document.getElementById('ogr-sinif').value;
        const okul = document.getElementById('ogr-okul').value.trim();
        const hedef = document.getElementById('ogr-hedef').value.trim();
        const ogrenciTel = document.getElementById('ogr-tel').value.trim();
        const veliAd = document.getElementById('ogr-veli-ad').value.trim();
        const veliTel = document.getElementById('ogr-veli-tel').value.trim();
        const secilenRenkEl = document.querySelector('input[name="ogr-renk"]:checked');
        const renk = secilenRenkEl ? secilenRenkEl.value : 'teal';

        if (!ad || !soyad) {
          this.showToast('Lütfen ad ve soyad alanlarını doldurun.');
          return;
        }

        if (isEdit) {
          Store.updateOgrenci(ogrenciId, {
            ad, soyad, sinif, okul, hedef, ogrenciTel, veliAd, veliTel, renk
          });
          this.showToast('Öğrenci güncellendi');
        } else {
          const yeni = Store.addOgrenci({
            ad, soyad, sinif, okul, hedef, ogrenciTel, veliAd, veliTel, renk
          });
          Store.setAktifOgrenci(yeni.id);
          this.showToast('Öğrenci eklendi');
        }

        this.closeModal();
        this.populateStudentDropdown();
        this.renderCurrentView();
      });
    }
  },

  openGorevModal(ogrenciId, gorevId = null, konuId = null, kaynakId = null) {
    const targetOgrId = ogrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(targetOgrId);

    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin veya ekleyin.');
      return;
    }

    const isEdit = Boolean(gorevId);
    const mevcutGorev = isEdit ? Store.getGorevler(ogr.id).find(g => String(g.id) === String(gorevId)) : null;

    const dersler = Store.getDerslerForOgrenci(ogr);

    // Eğer konuId belirtildiyse dersini bul
    let varsayilanDersId = dersler.length > 0 ? dersler[0].id : '';
    if (mevcutGorev) {
      varsayilanDersId = mevcutGorev.dersId;
    } else if (konuId) {
      const targetKonu = Store.getKonu(konuId);
      if (targetKonu && targetKonu.dersId) {
        varsayilanDersId = targetKonu.dersId;
      }
    }

    const seciliDersId = varsayilanDersId;
    const seciliKaynakId = mevcutGorev ? (mevcutGorev.kaynakId || '') : (kaynakId || '');
    const kaynaklar = Store.getKaynaklar();

    const dersOptions = dersler.map(d =>
      `<option value="${d.id}" ${d.id === seciliDersId ? 'selected' : ''}>${d.ad}</option>`
    ).join('');

    const kaynakOptions = kaynaklar.map(k =>
      `<option value="${k.id}" ${k.id === seciliKaynakId ? 'selected' : ''}>${k.yayinevi} - ${k.ad}</option>`
    ).join('');

    const presetChips = [
      'Konu Kavrama Testi',
      'Yeni Nesil Soru Çözümü',
      'Haftalık Tekrar & Deneme',
      'MEB Kazanım Testi',
      'Hata Telafi Soruları'
    ];

    const durumOptions = Object.keys(typeof GOREV_DURUMLARI !== 'undefined' ? GOREV_DURUMLARI : { bekliyor: 'Bekliyor', devam_ediyor: 'Devam Ediyor', tamamlandi: 'Tamamlandı', gecikti: 'Gecikti' }).map(key => {
      const lbl = GOREV_DURUMLARI[key]?.label || key;
      const isSelected = mevcutGorev ? mevcutGorev.durum === key : key === 'bekliyor';
      return `<option value="${key}" ${isSelected ? 'selected' : ''}>${lbl}</option>`;
    }).join('');

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Görevi Düzenle' : 'Yeni Ödev Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Öğrenci: <strong class="text-[var(--color-ink)]">${ogr.adSoyad}</strong> (${ogr.sinif}. Sınıf)</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-gorev" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Ders <span class="text-[var(--color-danger)]">*</span></label>
              <select id="grv-ders" class="select-instrument w-full p-2">
                ${dersOptions}
              </select>
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Konu Kazanımı</label>
              <select id="grv-konu" class="select-instrument w-full p-2">
                <!-- JS ile doldurulur -->
              </select>
            </div>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Görev Başlığı <span class="text-[var(--color-danger)]">*</span></label>
            <input type="text" id="grv-baslik" value="${mevcutGorev ? mevcutGorev.baslik : ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: 50 Yeni Nesil Soru Çözümü">
            <!-- Hızlı Başlık Önerileri -->
            <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
              ${presetChips.map(p => `
                <button type="button" onclick="document.getElementById('grv-baslik').value = '${p}'" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer">
                  ${p}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Kaynak / Yayın</label>
              <select id="grv-kaynak" class="select-instrument w-full p-2">
                <option value="">— Genel / Kaynaksız —</option>
                ${kaynakOptions}
              </select>
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Görev Durumu</label>
              <select id="grv-durum" class="select-instrument w-full p-2">
                ${durumOptions}
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Hedef Soru</label>
              <input type="number" id="grv-hedef" min="0" value="${mevcutGorev ? (mevcutGorev.hedefSoru || 0) : 0}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Süre (Dk)</label>
              <input type="number" id="grv-sure" min="0" value="${mevcutGorev ? (mevcutGorev.sureDk || 0) : 0}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Teslim Tarihi</label>
              <input type="date" id="grv-deadline" value="${mevcutGorev ? (mevcutGorev.deadline || '') : ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Koç / Görev Notu</label>
            <textarea id="grv-not" rows="2" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Yanlış soruları hata defterine not etsin.">${mevcutGorev ? (mevcutGorev.not || '') : ''}</textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Ödevi Ekle'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    // Konu seçeneklerini dinamik doldurma
    const dersSelect = document.getElementById('grv-ders');
    const konuSelect = document.getElementById('grv-konu');

    const updateKonuOptions = (initialKonuId = null) => {
      if (!dersSelect || !konuSelect) return;
      const dId = dersSelect.value;
      const konular = Store.getKonularForDers(dId);

      konuSelect.innerHTML = `<option value="">— Genel Ders / Konu Yok —</option>` +
        konular.map(k => {
          const selected = (initialKonuId && k.id === initialKonuId) || (mevcutGorev && mevcutGorev.konuId === k.id);
          return `<option value="${k.id}" ${selected ? 'selected' : ''}>${k.konuAdi}</option>`;
        }).join('');
    };

    if (dersSelect) {
      dersSelect.addEventListener('change', () => updateKonuOptions());
      updateKonuOptions(konuId || (mevcutGorev ? mevcutGorev.konuId : null));
    }

    // Form Submit
    const form = document.getElementById('form-gorev');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const dersId = document.getElementById('grv-ders').value;
        const konuIdVal = document.getElementById('grv-konu').value;
        const kaynakIdVal = document.getElementById('grv-kaynak')?.value || '';
        const baslik = document.getElementById('grv-baslik').value.trim();
        const hedefSoru = Number(document.getElementById('grv-hedef').value) || 0;
        const sureDk = Number(document.getElementById('grv-sure').value) || 0;
        const deadline = document.getElementById('grv-deadline').value;
        const durum = document.getElementById('grv-durum').value;
        const not = document.getElementById('grv-not').value.trim();

        if (!baslik) {
          this.showToast('Lütfen görev başlığı girin.');
          return;
        }

        if (isEdit) {
          Store.updateGorev(gorevId, {
            dersId, konuId: konuIdVal, kaynakId: kaynakIdVal, baslik, hedefSoru, sureDk, deadline, durum, not
          });
          this.showToast('Görev güncellendi');
        } else {
          Store.addGorev({
            ogrenciId: ogr.id,
            dersId, konuId: konuIdVal, kaynakId: kaynakIdVal, baslik, hedefSoru, sureDk, deadline, durum, not
          });
          this.showToast('Görev eklendi');
        }

        this.closeModal();
        this.renderCurrentView();
      });
    }
  },

  selectModulFilter(modulId) {
    Store.setAktifModul(modulId);
    Store.setAktifOgrenci(''); // Modül değiştiğinde aktif öğrenciyi deaktif et
    this.overviewSinifFilter = '';
    this.closeModal();
    this.updateGlobalBadges();
    this.populateStudentDropdown();
    this.renderCurrentView();
    const modul = this.getAktifModul();
    this.showToast(modul ? `${modul.ad} modülü seçildi` : 'Tüm Modüller listeleniyor');
  },

  openModulSeciciModal() {
    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const aktifId = Store.data.aktifModulId || '';
    const allStudents = Store.getOgrenciler();
    const isAllSelected = !aktifId || aktifId === 'all' || aktifId === 'tumu';

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Modül Filtresi & Seçimi</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Paneli hedef eğitim kademesine göre filtreleyin veya tüm portföyü listeleyin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="grid grid-cols-1 gap-2.5">
          <!-- Tüm Modüller Seçeneği -->
          <div onclick="App.selectModulFilter('');" class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border ${isAllSelected ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'} transition-all cursor-pointer flex items-center justify-between group">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-[var(--radius-sm)] ${isAllSelected ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center font-mono font-bold text-xs">
                TÜM
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-semibold text-xs text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">Tüm Modüller (Portföy)</h4>
                  <span class="meta-pill text-[10px] font-mono">${allStudents.length} Öğrenci</span>
                </div>
                <p class="text-[11px] font-mono text-[var(--color-ink-faint)] mt-0.5">Kayıtlı tüm kademe ve sınıflardaki öğrenciler</p>
              </div>
            </div>
            ${isAllSelected ? `<i data-lucide="check" class="w-4 h-4 text-[var(--color-accent)]"></i>` : ''}
          </div>

          ${moduller.map(m => {
            const isSelected = !isAllSelected && m.id === aktifId;
            const count = allStudents.filter(o => o.modulId === m.id).length;
            return `
              <div onclick="App.selectModulFilter('${m.id}');" class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border ${isSelected ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'} transition-all cursor-pointer flex items-center justify-between group">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-[var(--radius-sm)] ${isSelected ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center font-mono font-bold text-xs">
                    ${m.kisaltma || m.id.toUpperCase()}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-xs text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">${m.ad}</h4>
                      <span class="meta-pill text-[10px] font-mono">${count} Öğrenci</span>
                    </div>
                    <p class="text-[11px] font-mono text-[var(--color-ink-faint)] mt-0.5">Sınıflar: ${m.siniflar.map(s => s + '. Sınıf').join(', ')}</p>
                  </div>
                </div>
                ${isSelected ? `<i data-lucide="check" class="w-4 h-4 text-[var(--color-accent)]"></i>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.openModal(html);
  },

  openTaskModal() {
    const ogrId = Store.data.aktifOgrenciId;
    if (ogrId) {
      this.openGorevModal(ogrId);
    } else {
      const ogrenciler = Store.getOgrenciler();
      if (ogrenciler.length > 0) {
        Store.setAktifOgrenci(ogrenciler[0].id);
        this.openGorevModal(ogrenciler[0].id);
      } else {
        this.openOgrenciModal();
      }
    }
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW: ÇİZELGE ROBOTU (renderCizelgeRobotu)
  // ─────────────────────────────────────────────────────────────
  setCizelgeSablon(sablon) {
    this.cizelgeAktifSablon = sablon;
    this.renderCizelgeRobotu();
  },

  onCizelgeOgrenciChange(ogrId) {
    this.cizelgeOgrenciId = ogrId;
    this.cizelgeDersId = '';
    this.renderCizelgeRobotu();
  },

  setCizelgeAktifOgrenci() {
    const aktifId = Store.data.aktifOgrenciId;
    if (!aktifId) {
      this.showToast('Lütfen önce üst panelden bir aktif öğrenci belirleyin.');
      return;
    }
    this.cizelgeOgrenciId = aktifId;
    this.cizelgeDersId = '';
    const selectEl = document.getElementById('cizelge-ogrenci-select');
    if (selectEl) {
      selectEl.value = aktifId;
    }
    this.renderCizelgeRobotu();
    this.showToast('Aktif öğrenci şablona yerleştirildi.');
  },

  onCizelgeDersChange(dersId) {
    this.cizelgeDersId = dersId;
    this.renderCizelgePreview();
  },

  toggleCizelgeGorevleriYerlestir() {
    this.cizelgeGorevleriYerlestir = !this.cizelgeGorevleriYerlestir;
    this.renderCizelgePreview();
  },

  toggleCizelgeKonuBosMod() {
    this.cizelgeKonuBosMod = !this.cizelgeKonuBosMod;
    this.renderCizelgePreview();
  },

  printCizelge() {
    const selectEl = document.getElementById('cizelge-ogrenci-select');
    const ogrenciId = (selectEl ? selectEl.value : '') || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(ogrenciId);

    const printOgr = ogr || {
      adSoyad: '........................................',
      sinif: '.....',
      modulId: 'lgs',
      hedefSoru: ''
    };

    let html = '';
    let yatay = false;
    switch (this.cizelgeAktifSablon) {
      case 'haftalik-plan':
        html = this.renderCizelgeHaftalikPlanHTML(printOgr);
        yatay = false;
        break;
      case 'odev-takip':
        html = this.renderCizelgeOdevTakipHTML(printOgr);
        yatay = false;
        break;
      case 'konu-takip':
        html = this.renderCizelgeKonuTakipHTML(printOgr);
        yatay = true;
        break;
      default:
        html = this.renderCizelgeHaftalikPlanHTML(printOgr);
        yatay = false;
        break;
    }

    if (typeof PrintEngine !== 'undefined' && PrintEngine.yazdir) {
      PrintEngine.yazdir(html, { yatay });
    } else {
      window.print();
    }
  },

  renderCizelgeRobotu() {
    const container = document.getElementById('view-cizelge-robotu');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    if (!this.cizelgeOgrenciId && allStudents.length > 0) {
      this.cizelgeOgrenciId = Store.data.aktifOgrenciId || allStudents[0].id;
    }

    const ogr = this.cizelgeOgrenciId ? Store.getOgrenci(this.cizelgeOgrenciId) : null;
    const sablon = this.cizelgeAktifSablon || 'haftalik-plan';
    const dersler = (ogr && Store.getDerslerForOgrenci(ogr).length > 0) ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();

    if (!this.cizelgeDersId && dersler.length > 0) {
      this.cizelgeDersId = dersler[0].id;
    }

    const html = `
      <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <!-- BÖLÜM 1: ARAÇ ÇUBUĞU -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold font-display text-[var(--color-ink)]">Çizelge Robotu</h1>
              <span class="meta-pill">A4 Şablon Motoru</span>
            </div>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Öğrenciye özel kişiselleştirilmiş A4 çalışma planları, ödev çizelgeleri ve konu takip çıktıları hazırlayın.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Öğrenci Seçici -->
            <div class="flex items-center gap-2">
              <label for="cizelge-ogrenci-select" class="text-xs font-medium text-[var(--color-ink-muted)]">Öğrenci:</label>
              <select id="cizelge-ogrenci-select" onchange="App.onCizelgeOgrenciChange(this.value)" class="select-instrument text-xs py-1.5 px-3 min-w-[170px]">
                ${allStudents.length === 0 ? '<option value="">Boş Şablon (Öğrenci Yok)</option>' : ''}
                ${allStudents.map(s => `
                  <option value="${s.id}" ${String(s.id) === String(this.cizelgeOgrenciId) ? 'selected' : ''}>
                    ${s.adSoyad} (${s.sinif ? `${s.sinif}. Sınıf` : ''})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Aktif Öğrenciyi Doldur Butonu -->
            <button onclick="App.setCizelgeAktifOgrenci()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5" title="Üst paneldeki aktif öğrenciyi seç">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              <span>Aktif Öğrenciyi Doldur</span>
            </button>

            <!-- Yazdır Butonu -->
            <button onclick="App.printCizelge()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-2 shadow-sm">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Yazdır (A4)</span>
            </button>
          </div>
        </div>

        <!-- BÖLÜM 2: ŞABLON SEÇİCİ KARTLARI -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Şablon 1: Haftalık Plan -->
          <div onclick="App.setCizelgeSablon('haftalik-plan')" class="p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'haftalik-plan' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-[var(--radius-sm)] ${sablon === 'haftalik-plan' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Haftalık Çalışma Planı</h3>
                  <span class="meta-pill text-[10px] mt-0.5">A4 Dikey</span>
                </div>
              </div>
              ${sablon === 'haftalik-plan' ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[11px] text-[var(--color-ink-muted)] mt-2.5 leading-relaxed">Haftanın 7 gününe saat blokları atayın, hedefleri ve aktif ödevleri günlere dağıtın.</p>
          </div>

          <!-- Şablon 2: Ödev Takip -->
          <div onclick="App.setCizelgeSablon('odev-takip')" class="p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'odev-takip' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-[var(--radius-sm)] ${sablon === 'odev-takip' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="check-square" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Ödev Takip Çizelgesi</h3>
                  <span class="meta-pill text-[10px] mt-0.5">A4 Dikey</span>
                </div>
              </div>
              ${sablon === 'odev-takip' ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[11px] text-[var(--color-ink-muted)] mt-2.5 leading-relaxed">Haftalık ödevleri, yayın kaynaklarını ve hedef soruları listeler, el ile işaretleme kutucukları sunar.</p>
          </div>

          <!-- Şablon 3: Konu Takip -->
          <div onclick="App.setCizelgeSablon('konu-takip')" class="p-4 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'konu-takip' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-[var(--radius-sm)] ${sablon === 'konu-takip' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Konu Takip Tablosu</h3>
                  <span class="meta-pill text-[10px] mt-0.5">A4 Yatay</span>
                </div>
              </div>
              ${sablon === 'konu-takip' ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[11px] text-[var(--color-ink-muted)] mt-2.5 leading-relaxed">Derslerin ünite ve konularını işlendi, tekrar, test durumlarına göre matris formatında listeler.</p>
          </div>
        </div>

        <!-- ŞABLON AYARLARI KONTROL BARI -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="font-medium text-[var(--color-ink)]">Şablon Ayarları:</span>
            ${sablon === 'haftalik-plan' ? `
              <label class="flex items-center gap-2 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
                <input type="checkbox" ${this.cizelgeGorevleriYerlestir ? 'checked' : ''} onchange="App.toggleCizelgeGorevleriYerlestir()" class="rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-0">
                <span>Aktif Görevleri Günlere Dağıt</span>
              </label>
            ` : ''}

            ${sablon === 'konu-takip' ? `
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-faint)]">Ders Seçimi:</span>
                <select id="cizelge-ders-select" onchange="App.onCizelgeDersChange(this.value)" class="select-instrument text-xs py-1 px-2.5">
                  ${dersler.map(d => `
                    <option value="${d.id}" ${String(d.id) === String(this.cizelgeDersId) ? 'selected' : ''}>${d.ad}</option>
                  `).join('')}
                </select>
              </div>

              <label class="flex items-center gap-2 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] ml-2">
                <input type="checkbox" ${this.cizelgeKonuBosMod ? 'checked' : ''} onchange="App.toggleCizelgeKonuBosMod()" class="rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-0">
                <span>Boş Şablon Olarak Hazırla</span>
              </label>
            ` : ''}

            ${sablon === 'odev-takip' ? `
              <span class="text-[var(--color-ink-muted)]">Öğrencinin aktif ve gecikmiş tüm görevleri teslim tarihlerine göre otomatik aktarılır.</span>
            ` : ''}
          </div>

          <div class="text-[11px] text-[var(--color-ink-faint)] font-mono">
            ${sablon === 'konu-takip' ? 'Yatay Sayfa Düzeni (A4 Landscape)' : 'Dikey Sayfa Düzeni (A4 Portrait)'}
          </div>
        </div>

        <!-- BÖLÜM 3: ÖNİZLEME ALANI -->
        <div class="overflow-x-auto pb-8 pt-2">
          <div id="cizelge-preview-area">
            <!-- JS ile doldurulur -->
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.renderCizelgePreview();
    if (window.lucide) lucide.createIcons();
  },

  renderCizelgePreview() {
    const previewContainer = document.getElementById('cizelge-preview-area');
    if (!previewContainer) return;

    const selectEl = document.getElementById('cizelge-ogrenci-select');
    const ogrenciId = (selectEl ? selectEl.value : '') || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(ogrenciId);

    const isLandscape = this.cizelgeAktifSablon === 'konu-takip';
    previewContainer.className = isLandscape
      ? 'w-full max-w-[1080px] mx-auto bg-white text-slate-900 border border-[var(--color-rule)] shadow-xl rounded-xl p-6 md:p-8 min-h-[640px] transition-all'
      : 'w-full max-w-[820px] mx-auto bg-white text-slate-900 border border-[var(--color-rule)] shadow-xl rounded-xl p-6 md:p-8 min-h-[960px] transition-all';

    const displayOgr = ogr || {
      adSoyad: '........................................',
      sinif: '.....',
      modulId: 'lgs',
      hedefSoru: ''
    };

    let html = '';
    switch (this.cizelgeAktifSablon) {
      case 'haftalik-plan':
        html = this.renderCizelgeHaftalikPlanHTML(displayOgr);
        break;
      case 'odev-takip':
        html = this.renderCizelgeOdevTakipHTML(displayOgr);
        break;
      case 'konu-takip':
        html = this.renderCizelgeKonuTakipHTML(displayOgr);
        break;
      default:
        html = this.renderCizelgeHaftalikPlanHTML(displayOgr);
        break;
    }

    if (!ogr) {
      const banner = `
        <div class="mb-4 p-3 rounded-[var(--radius-md)] bg-blue-50/90 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div class="flex items-center gap-2">
            <i data-lucide="info" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
            <span>Sistemde henüz kayıtlı öğrenci seçilmedi. Aşağıda <strong>boş el ile doldurulabilir A4 çıktısı</strong> önizlenmektedir. Dilerseniz hemen yazdırabilir veya öğrenci ekleyebilirsiniz.</span>
          </div>
          <button onclick="App.openOgrenciModal()" class="btn-tactile bg-blue-600 text-white hover:bg-blue-700 text-xs py-1 px-3 flex-shrink-0 whitespace-nowrap">
            + Yeni Öğrenci Ekle
          </button>
        </div>
      `;
      previewContainer.innerHTML = banner + html;
    } else {
      previewContainer.innerHTML = html;
    }

    if (window.lucide) lucide.createIcons();
  },

  renderCizelgeHaftalikPlanHTML(ogr) {
    const koc = Store.getKocProfili();
    const haftaAraligi = this.getThisWeekDateRangeStr();
    const modul = ogr ? (typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null) : null;
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const saatler = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

    // Görevleri günlere dağıtma
    const gunlukGorevler = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    if (ogr && this.cizelgeGorevleriYerlestir) {
      const aktifGorevler = Store.getGorevler(ogr.id).filter(g => g.durum !== 'tamamlandi');
      aktifGorevler.forEach(g => {
        if (g.deadline) {
          const d = new Date(g.deadline);
          if (!isNaN(d.getTime())) {
            let dayIdx = d.getDay() - 1; // Pazartesi=0 ... Pazar=6
            if (dayIdx === -1) dayIdx = 6; // Pazar
            if (gunlukGorevler[dayIdx]) {
              const ders = Store.getDers(g.dersId);
              gunlukGorevler[dayIdx].push({
                dersAd: ders ? (ders.kisaltma || ders.ad) : 'Ödev',
                baslik: g.baslik,
                hedef: g.hedefSoru ? `${g.hedefSoru} Soru` : ''
              });
            }
          }
        }
      });
    }

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 12px; box-sizing: border-box;">
        <!-- Üst Başlık Bandı -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="text-align: left;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${koc.ad} ${koc.soyad}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${koc.unvan || 'Eğitim Koçu'} • ${koc.kurum || 'Plantrack Koçluk'}</div>
          </div>

          <div style="text-align: center;">
            <h1 style="font-size: 18px; font-weight: 800; letter-spacing: 2px; margin: 0; color: #0f172a; text-transform: uppercase;">HAFTALIK ÇALIŞMA PLANI</h1>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; font-family: monospace;">${haftaAraligi}</div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${ogr ? ogr.adSoyad : '—'}</div>
            <div style="font-size: 11px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} ${modul ? `• ${modul.ad}` : ''}</div>
          </div>
        </div>

        <!-- 7 Günlük Çizelge Tablosu -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="width: 50px; padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px; color: #475569;">Saat</th>
              ${gunler.map((g, idx) => `
                <th style="padding: 6px 4px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #0f172a;">
                  ${g}
                  ${gunlukGorevler[idx].length > 0 ? `<div style="font-size: 9px; font-weight: normal; color: #2563eb;">${gunlukGorevler[idx].length} Ödev</div>` : ''}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${saatler.map((s, sIdx) => `
              <tr style="height: 30px;">
                <td style="padding: 4px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-size: 10px; background: #f8fafc; color: #475569; font-weight: 600;">
                  ${s}
                </td>
                ${gunler.map((g, gIdx) => {
                  const dayTasks = gunlukGorevler[gIdx];
                  const taskForSlot = (sIdx >= 8 && dayTasks.length > (sIdx - 8)) ? dayTasks[sIdx - 8] : null;
                  return `
                    <td style="padding: 3px 6px; border: 1px solid #e2e8f0; vertical-align: middle; background: ${taskForSlot ? '#eff6ff' : '#ffffff'};">
                      ${taskForSlot ? `
                        <div style="font-size: 10px; font-weight: 600; color: #1d4ed8; line-height: 1.2;">
                          [${taskForSlot.dersAd}] ${taskForSlot.baslik.substring(0, 18)}
                        </div>
                        ${taskForSlot.hedef ? `<div style="font-size: 9px; color: #3b82f6;">${taskForSlot.hedef}</div>` : ''}
                      ` : `
                        <div style="border-bottom: 1px dotted #e2e8f0; height: 16px;"></div>
                      `}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Alt Kısım: Hedefler ve Koç Notu -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; border-top: 1px solid #cbd5e1; padding-top: 14px;">
          <!-- Sol: Hedef Metrikleri -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #f8fafc;">
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 8px;">Haftalık Soru & Çalışma Hedefleri</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
              <span style="color: #64748b;">Hedef Soru:</span>
              <strong style="color: #0f172a;">${ogr && ogr.hedefSoru ? `${ogr.hedefSoru} Soru` : 'Belirlenmedi'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
              <span style="color: #64748b;">Çözülen Soru:</span>
              <span style="font-family: monospace; font-weight: bold; color: #0f172a;">[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] Soru</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #64748b;">Tamamlanan Deneme:</span>
              <span style="font-family: monospace; font-weight: bold; color: #0f172a;">[ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ] Adet</span>
            </div>
          </div>

          <!-- Sağ: Koçun Notu & Değerlendirme -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Koçun Notu & Haftalık Değerlendirmesi</span>
              <span style="font-size: 10px; color: #94a3b8;">İmza / Paraf: [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</span>
            </div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
          </div>
        </div>
      </div>
    `;
  },

  renderCizelgeOdevTakipHTML(ogr) {
    const koc = Store.getKocProfili();
    const haftaAraligi = this.getThisWeekDateRangeStr();
    const modul = ogr ? (typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null) : null;

    let gorevler = [];
    if (ogr) {
      const allTasks = Store.getGorevler(ogr.id);
      gorevler = allTasks.filter(g => g.durum !== 'tamamlandi' || g.durum === 'gecikti');
    }

    const padCount = Math.max(0, 12 - gorevler.length);

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 12px; box-sizing: border-box;">
        <!-- Üst Başlık Bandı -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="text-align: left;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${koc.ad} ${koc.soyad}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${koc.unvan || 'Eğitim Koçu'} • ${koc.kurum || 'Plantrack Koçluk'}</div>
          </div>

          <div style="text-align: center;">
            <h1 style="font-size: 18px; font-weight: 800; letter-spacing: 2px; margin: 0; color: #0f172a; text-transform: uppercase;">ÖDEV TAKİP ÇİZELGESİ</h1>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; font-family: monospace;">${haftaAraligi}</div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${ogr ? ogr.adSoyad : '—'}</div>
            <div style="font-size: 11px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} ${modul ? `• ${modul.ad}` : ''}</div>
          </div>
        </div>

        <!-- Ödev Tablosu -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="width: 32px; padding: 7px 4px; border: 1px solid #cbd5e1; text-align: center;">#</th>
              <th style="width: 110px; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">Ders</th>
              <th style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">Konu / Görev Tanımı</th>
              <th style="width: 130px; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">Kaynak / Yayın</th>
              <th style="width: 75px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">Hedef Soru</th>
              <th style="width: 80px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">Teslim</th>
              <th style="width: 85px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">Tamamlandı</th>
            </tr>
          </thead>
          <tbody>
            ${gorevler.map((g, idx) => {
              const ders = Store.getDers(g.dersId);
              const kaynak = g.kaynakId ? Store.getKaynak(g.kaynakId) : null;
              const teslimStr = g.deadline ? new Date(g.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—';
              return `
                <tr style="height: 32px;">
                  <td style="padding: 5px 4px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; color: #64748b;">${idx + 1}</td>
                  <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${ders ? ders.ad : '—'}</td>
                  <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #334155;">${g.baslik}</td>
                  <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #475569;">${kaynak ? `${kaynak.yayinevi} - ${kaynak.ad}` : '—'}</td>
                  <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center; font-weight: 600; color: #0f172a;">${g.hedefSoru ? `${g.hedefSoru}` : '—'}</td>
                  <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; color: ${g.durum === 'gecikti' ? '#dc2626' : '#475569'};">${teslimStr}</td>
                  <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center;">
                    <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #94a3b8; border-radius: 3px; vertical-align: middle;"></span>
                  </td>
                </tr>
              `;
            }).join('')}

            ${Array.from({ length: padCount }).map((_, i) => `
              <tr style="height: 32px;">
                <td style="padding: 5px 4px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; color: #cbd5e1;">${gorevler.length + i + 1}</td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0;"></td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0;"></td>
                <td style="padding: 5px 8px; border: 1px solid #e2e8f0;"></td>
                <td style="padding: 5px 6px; border: 1px solid #e2e8f0;"></td>
                <td style="padding: 5px 6px; border: 1px solid #e2e8f0;"></td>
                <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center;">
                  <span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Alt Kısım: Notlar ve İmza Bandı -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; border-top: 1px solid #cbd5e1; padding-top: 14px;">
          <!-- Koçun Notu -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #ffffff;">
            <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin-bottom: 6px;">Koç Değerlendirmesi & Haftalık Talimatlar</div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
          </div>

          <!-- İmza Bandı -->
          <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci Parafı</div>
              <div style="border-bottom: 1px solid #94a3b8; height: 22px; margin-bottom: 10px;"></div>
            </div>
            <div>
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Koç Onayı & Kaşe</div>
              <div style="font-size: 11px; font-weight: bold; color: #0f172a;">${koc.ad} ${koc.soyad}</div>
              <div style="border-bottom: 1px solid #94a3b8; height: 16px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderCizelgeKonuTakipHTML(ogr) {
    const koc = Store.getKocProfili();
    const bugunTarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const dersler = (ogr && Store.getDerslerForOgrenci(ogr).length > 0) ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();
    const seciliDersId = this.cizelgeDersId || (dersler[0] ? dersler[0].id : '');
    const ders = Store.getDers(seciliDersId);
    const konular = seciliDersId ? Store.getKonularForDers(seciliDersId) : [];

    let tamamlananSayisi = 0;
    const durumHaritasi = {};
    if (ogr && !this.cizelgeKonuBosMod) {
      konular.forEach(k => {
        const d = Store.getKonuDurumu(ogr.id, k.id);
        durumHaritasi[k.id] = d;
        if (d === 'tamam') tamamlananSayisi++;
      });
    }

    const toplamKonu = konular.length;
    const yuzde = toplamKonu > 0 ? Math.round((tamamlananSayisi / toplamKonu) * 100) : 0;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; padding: 12px; box-sizing: border-box;">
        <!-- Üst Başlık Bandı -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="text-align: left;">
            <h1 style="font-size: 18px; font-weight: 800; letter-spacing: 2px; margin: 0; color: #0f172a; text-transform: uppercase;">KONU TAKİP TABLOSU</h1>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">${koc.ad} ${koc.soyad} • ${koc.kurum || 'Plantrack Koçluk'}</div>
          </div>

          <div style="text-align: center;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Seçili Ders</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${ders ? ders.ad : 'Ders Seçilmedi'}</div>
            <div style="font-size: 10px; color: #475569; font-family: monospace; margin-top: 2px;">
              ${this.cizelgeKonuBosMod ? 'Boş Takip Şablonu' : `İlerleme: ${tamamlananSayisi} / ${toplamKonu} Konu Tamamlandı (%${yuzde})`}
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci & Tarih</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${ogr ? ogr.adSoyad : '—'}</div>
            <div style="font-size: 11px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} • ${bugunTarih}</div>
          </div>
        </div>

        <!-- Konu Tablosu -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
              <th style="width: 160px; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">Ünite</th>
              <th style="padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">Konu Adı</th>
              <th style="width: 80px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">İşlendi</th>
              <th style="width: 80px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">Tekrar</th>
              <th style="width: 80px; padding: 7px 6px; border: 1px solid #cbd5e1; text-align: center;">Test</th>
              <th style="width: 160px; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left;">Koç Notu / Hedef</th>
            </tr>
          </thead>
          <tbody>
            ${konular.length === 0 ? `
              <tr>
                <td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8;">Bu derse ait konu tanımlanmamıştır.</td>
              </tr>
            ` : konular.map(k => {
              const dur = durumHaritasi[k.id];
              const isIslendi = dur === 'tamam';
              const isTekrar = dur === 'tekrar_lazim';
              const isTest = dur === 'calisiliyor';

              return `
                <tr style="height: 30px;">
                  <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 10px;">${k.unite || 'Genel'}</td>
                  <td style="padding: 5px 8px; border: 1px solid #e2e8f0; font-weight: 500; color: #0f172a;">${k.konuAdi}</td>
                  <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center;">
                    ${isIslendi ? `<span style="font-weight: bold; color: #16a34a; font-size: 13px;">☑</span>` : `<span style="display: inline-block; width: 15px; height: 15px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span>`}
                  </td>
                  <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center;">
                    ${isTekrar ? `<span style="font-weight: bold; color: #ea580c; font-size: 13px;">☑</span>` : `<span style="display: inline-block; width: 15px; height: 15px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span>`}
                  </td>
                  <td style="padding: 5px 6px; border: 1px solid #e2e8f0; text-align: center;">
                    ${isTest ? `<span style="font-weight: bold; color: #2563eb; font-size: 13px;">☑</span>` : `<span style="display: inline-block; width: 15px; height: 15px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span>`}
                  </td>
                  <td style="padding: 5px 8px; border: 1px solid #e2e8f0; color: #64748b; font-size: 10px;">
                    <div style="border-bottom: 1px dotted #cbd5e1; height: 16px;"></div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Alt Kısım -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 11px;">
          <div style="color: #475569;">
            Toplam <strong>${toplamKonu}</strong> konu listelenmektedir. ${!this.cizelgeKonuBosMod ? `(Tamamlanan: ${tamamlananSayisi}, Başarı Oranı: %${yuzde})` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 24px;">
            <span style="color: #64748b;">Öğrenci Parafı: [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</span>
            <span style="color: #64748b;">Koç Onayı: [ &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; ]</span>
          </div>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW: SINAV NOTLARI (renderSinavNotlari)
  // ─────────────────────────────────────────────────────────────
  getSinavNotu(notId) {
    if (!notId) return null;
    const notlar = Store.data.sinifNotlari || [];
    return notlar.find(n => String(n.id) === String(notId)) || null;
  },

  deleteSinavNotu(notId) {
    const not = this.getSinavNotu(notId);
    if (!not) return;
    this.openConfirmModal(
      'Sınav Notunu Sil',
      `"${not.sinavAdi}" (${not.not}) sınav notu kalıcı olarak silinecektir. Onaylıyor musunuz?`,
      () => {
        Store.deleteSinifNotu(notId);
        this.showToast('Sınav notu başarıyla silindi.');
        this.renderSinavNotlari();
      }
    );
  },

  getSinavNotuRenkClass(score) {
    if (score === null || score === undefined) {
      return {
        badge: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        text: 'text-slate-500'
      };
    }
    const n = Number(score);
    if (n >= 85) {
      return {
        badge: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
        text: 'text-emerald-600 dark:text-emerald-400'
      };
    }
    if (n >= 70) {
      return {
        badge: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
        text: 'text-blue-600 dark:text-blue-400'
      };
    }
    if (n >= 50) {
      return {
        badge: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
        text: 'text-amber-600 dark:text-amber-400'
      };
    }
    return {
      badge: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900',
      text: 'text-rose-600 dark:text-rose-400'
    };
  },

  renderSinavNotuTrendSVG(ogr, targetDersId) {
    const ders = Store.getDers(targetDersId);
    const notlar = Store.getSinifNotlari(ogr.id, targetDersId);

    // Kural: Veri 3'ten azsa grafik gösterilmez, "En az 3 sınav notu gerekli" mesajı.
    if (notlar.length < 3) {
      return `
        <div class="py-10 px-4 text-center rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
          <div class="w-10 h-10 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto mb-3">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
          <h4 class="font-display font-semibold text-xs text-[var(--color-ink)]">Gelişim Trend Grafiği İçin Yetersiz Veri</h4>
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-1 max-w-sm mx-auto">
            ${ders ? `"${ders.ad}" dersine` : 'Seçili derse'} ait gelişim trendini görüntülemek için en az 3 sınav notu girilmiş olması gerekir. (Şu an: ${notlar.length} not)
          </p>
          <button onclick="App.openSinavNotuModal()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-3 mt-3 inline-flex items-center gap-1.5 text-[var(--color-accent)]">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Bu Derse Sınav Notu Ekle</span>
          </button>
        </div>
      `;
    }

    // Kronolojik sıralama: En eski -> En yeni (soldan sağa çizgi)
    const chartData = notlar.slice(0, 10).reverse();
    const count = chartData.length;

    const padL = 45;
    const padR = 40;
    const padT = 30;
    const padB = 45;
    const totalW = 760;
    const totalH = 220;
    const plotW = totalW - padL - padR;
    const plotH = totalH - padT - padB;

    const getX = (i) => Math.round(padL + (i / (count - 1)) * plotW);
    const getY = (score) => Math.round(padT + (1 - Math.max(0, Math.min(100, score)) / 100) * plotH);

    // Kılavuz çizgileri: 0, 25, 50, 75, 100
    const yLevels = [0, 25, 50, 75, 100];
    const gridLines = yLevels.map(lvl => {
      const y = getY(lvl);
      return `
        <line x1="${padL}" y1="${y}" x2="${totalW - padR}" y2="${y}" stroke="currentColor" stroke-opacity="0.08" stroke-dasharray="3 3" />
        <text x="${padL - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="currentColor" opacity="0.45" font-family="monospace">${lvl}</text>
      `;
    }).join('');

    const pointsStr = chartData.map((d, i) => `${getX(i)},${getY(d.not)}`).join(' ');
    const polygonStr = `${getX(0)},${padT + plotH} ${pointsStr} ${getX(count - 1)},${padT + plotH}`;

    const dotsAndLabels = chartData.map((d, i) => {
      const x = getX(i);
      const y = getY(d.not);
      const kisaTarih = d.tarih ? new Date(d.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';
      return `
        <g class="cursor-pointer group">
          <title>${d.sinavAdi}: ${d.not} (${d.tarih || ''})</title>
          <!-- Halo -->
          <circle cx="${x}" cy="${y}" r="7" fill="var(--color-accent)" fill-opacity="0.2" />
          <!-- Nokta -->
          <circle cx="${x}" cy="${y}" r="4" fill="var(--color-accent)" stroke="#ffffff" stroke-width="2" />
          <!-- Not Değeri -->
          <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">${d.not}</text>
          <!-- Sınav Adı -->
          <text x="${x}" y="${padT + plotH + 18}" text-anchor="middle" font-size="10" font-weight="500" fill="currentColor" opacity="0.85">${d.sinavAdi.substring(0, 12)}</text>
          <!-- Tarih -->
          <text x="${x}" y="${padT + plotH + 30}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.5" font-family="monospace">${kisaTarih}</text>
        </g>
      `;
    }).join('');

    return `
      <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
        <div class="flex items-center justify-between mb-3 px-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)]"></span>
            <h4 class="font-display font-semibold text-xs text-[var(--color-ink)]">${ders ? ders.ad : ''} Sınav Notu Gelişim Trendi (Son ${count} Sınav)</h4>
          </div>
          <span class="text-[10px] text-[var(--color-ink-faint)] font-mono">0 – 100 Başarı Skalası</span>
        </div>

        <div class="w-full overflow-x-auto">
          <svg viewBox="0 0 ${totalW} ${totalH}" class="w-full h-48 min-w-[550px] text-[var(--color-ink)] select-none">
            <defs>
              <linearGradient id="sinavTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.3" />
                <stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0.02" />
              </linearGradient>
            </defs>

            <!-- Kılavuz Çizgileri -->
            ${gridLines}

            <!-- Alan Dolgusu -->
            <polygon points="${polygonStr}" fill="url(#sinavTrendGrad)" />

            <!-- Çizgi -->
            <polyline points="${pointsStr}" fill="none" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

            <!-- Veri Noktaları ve Etiketler -->
            ${dotsAndLabels}
          </svg>
        </div>
      </div>
    `;
  },

  renderSinavNotlari() {
    const container = document.getElementById('view-sinav-notlari');
    if (!container) return;

    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      container.innerHTML = `
        <div class="p-12 text-center max-w-md mx-auto space-y-4">
          <div class="w-12 h-12 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
            <i data-lucide="user-x" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Aktif Öğrenci Seçilmedi</h3>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Sınav notlarını görüntülemek ve yeni not girişi yapmak için lütfen önce aktif bir öğrenci belirleyin.</p>
          </div>
          <button onclick="App.navigateTo('students')" class="btn-tactile btn-tactile-primary text-xs py-2 px-4 inline-flex items-center gap-2">
            <i data-lucide="users" class="w-4 h-4"></i>
            <span>Öğrenci Portföyüne Git</span>
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const dersler = Store.getDerslerForOgrenci(ogr);
    const modul = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null;

    // Aktif ders seçimi (trend grafiği için)
    if (!this.sinavNotlariAktifDersId && dersler.length > 0) {
      this.sinavNotlariAktifDersId = this.sinavNotlariDersFilter || dersler[0].id;
    }

    // Filtreli Notlar
    let notlar = Store.getSinifNotlari(ogr.id, this.sinavNotlariDersFilter);
    if (this.sinavNotlariTurFilter && this.sinavNotlariTurFilter !== 'tum') {
      notlar = notlar.filter(n => n.tur === this.sinavNotlariTurFilter);
    }

    const turEtiketleri = {
      'yazili': 'Yazılı',
      'sozlu': 'Sözlü',
      'proje': 'Proje',
      'kisa-sinav': 'Kısa Sınav'
    };

    const html = `
      <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <!-- BÖLÜM 1: ARAÇ ÇUBUĞU -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold font-display text-[var(--color-ink)]">Sınav Notları</h1>
              <span class="meta-pill font-mono">${ogr.adSoyad} (${ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} ${modul ? `• ${modul.ad}` : ''})</span>
            </div>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Öğrencinin yazılı, sözlü ve proje sınav notlarını takip edin, ders ortalamalarını ve başarı trendini analiz edin.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <!-- Ders Filtresi -->
            <select id="notlar-ders-filter" onchange="App.sinavNotlariDersFilter = this.value; if (this.value && this.value !== 'tum') App.sinavNotlariAktifDersId = this.value; App.renderSinavNotlari();" class="select-instrument text-xs py-1.5 px-3 min-w-[140px]">
              <option value="tum" ${!this.sinavNotlariDersFilter || this.sinavNotlariDersFilter === 'tum' ? 'selected' : ''}>Tüm Dersler</option>
              ${dersler.map(d => `
                <option value="${d.id}" ${this.sinavNotlariDersFilter === d.id ? 'selected' : ''}>${d.ad}</option>
              `).join('')}
            </select>

            <!-- Tür Filtresi -->
            <select id="notlar-tur-filter" onchange="App.sinavNotlariTurFilter = this.value; App.renderSinavNotlari();" class="select-instrument text-xs py-1.5 px-3 min-w-[130px]">
              <option value="tum" ${!this.sinavNotlariTurFilter || this.sinavNotlariTurFilter === 'tum' ? 'selected' : ''}>Tüm Türler</option>
              <option value="yazili" ${this.sinavNotlariTurFilter === 'yazili' ? 'selected' : ''}>Yazılı Sınav</option>
              <option value="sozlu" ${this.sinavNotlariTurFilter === 'sozlu' ? 'selected' : ''}>Sözlü Notu</option>
              <option value="proje" ${this.sinavNotlariTurFilter === 'proje' ? 'selected' : ''}>Proje & Ödev</option>
              <option value="kisa-sinav" ${this.sinavNotlariTurFilter === 'kisa-sinav' ? 'selected' : ''}>Kısa Sınav (Quiz)</option>
            </select>

            <!-- + Not Ekle Butonu -->
            <button onclick="App.openSinavNotuModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 shadow-sm">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Not Ekle</span>
            </button>
          </div>
        </div>

        <!-- BÖLÜM 2: DERS BAZLI ÖZET KARTLARI -->
        <div>
          <div class="flex items-center justify-between mb-2.5">
            <h3 class="font-display font-bold text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">Ders Bazlı Not Ortalamaları & Trend</h3>
            <span class="text-[11px] text-[var(--color-ink-faint)]">Karta tıklayarak trend grafiğini görüntüleyin</span>
          </div>

          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            ${dersler.length === 0 ? `
              <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs text-[var(--color-ink-muted)]">
                Öğrenci kademesine ait ders tanımlanmamıştır.
              </div>
            ` : dersler.map(d => {
              const avg = Store.getNotOrtalamasi(ogr.id, d.id);
              const dersNotlari = Store.getSinifNotlari(ogr.id, d.id);
              const sonNot = dersNotlari.length > 0 ? dersNotlari[0] : null;

              // Trend Oku Hesaplama (Son 3 not)
              let trendIcon = 'minus';
              let trendColor = 'text-[var(--color-ink-faint)]';
              let trendText = 'Tek Not';

              if (dersNotlari.length >= 2) {
                const n0 = Number(dersNotlari[0].not);
                const nPrev = dersNotlari.length >= 3 ? Number(dersNotlari[2].not) : Number(dersNotlari[1].not);
                if (n0 > nPrev) {
                  trendIcon = 'trending-up';
                  trendColor = 'text-emerald-500';
                  trendText = 'Yükselişte';
                } else if (n0 < nPrev) {
                  trendIcon = 'trending-down';
                  trendColor = 'text-rose-500';
                  trendText = 'Düşüşte';
                } else {
                  trendIcon = 'minus';
                  trendColor = 'text-slate-400';
                  trendText = 'Dengeli';
                }
              } else if (dersNotlari.length === 0) {
                trendText = 'Not Yok';
              }

              const renkInfo = this.getSinavNotuRenkClass(avg);
              const isSelected = String(d.id) === String(this.sinavNotlariAktifDersId);

              return `
                <div onclick="App.sinavNotlariAktifDersId = '${d.id}'; App.renderSinavNotlari();" class="flex-shrink-0 w-52 p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${isSelected ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-xs' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-[var(--color-ink)] truncate max-w-[120px]" title="${d.ad}">${d.ad}</span>
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${d.renk || 'var(--color-accent)'};"></span>
                  </div>

                  <div class="flex items-baseline justify-between mt-2.5">
                    <div>
                      <div class="font-display font-extrabold text-2xl ${renkInfo.text}">
                        ${avg !== null ? avg : '—'}
                      </div>
                      <div class="text-[10px] text-[var(--color-ink-muted)]">Ortalama</div>
                    </div>

                    <div class="text-right">
                      <div class="flex items-center justify-end gap-1 text-[11px] font-medium ${trendColor}">
                        <i data-lucide="${trendIcon}" class="w-3.5 h-3.5"></i>
                        <span>${trendText}</span>
                      </div>
                      <div class="text-[10px] text-[var(--color-ink-faint)] mt-0.5">
                        ${sonNot ? `Son: ${sonNot.not} (${new Date(sonNot.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })})` : 'Kayıt Yok'}
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- BÖLÜM 3: TREND GRAFİĞİ -->
        <div>
          ${this.renderSinavNotuTrendSVG(ogr, this.sinavNotlariAktifDersId)}
        </div>

        <!-- BÖLÜM 4: NOT LİSTESİ -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-bold text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
              Sınav Notları Listesi (${notlar.length})
            </h3>
            ${this.sinavNotlariDersFilter && this.sinavNotlariDersFilter !== 'tum' ? `
              <button onclick="App.sinavNotlariDersFilter = 'tum'; App.renderSinavNotlari();" class="text-[11px] text-[var(--color-accent)] hover:underline">
                Filtreyi Temizle (Tüm Dersleri Göster)
              </button>
            ` : ''}
          </div>

          ${notlar.length === 0 ? `
            <div class="py-12 px-4 text-center rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              <div class="w-10 h-10 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto mb-3">
                <i data-lucide="clipboard-list" class="w-5 h-5"></i>
              </div>
              <h4 class="font-display font-semibold text-xs text-[var(--color-ink)]">Henüz Sınav Notu Eklenmedi</h4>
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-1 max-w-sm mx-auto">
                ${this.sinavNotlariDersFilter && this.sinavNotlariDersFilter !== 'tum' ? 'Seçili ders ve filtreye ait sınav notu kaydı bulunamadı.' : 'Öğrencinin okul yazılıları veya deneme sınav notlarını sisteme işleyerek takibe başlayın.'}
              </p>
              <button onclick="App.openSinavNotuModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 mt-3 inline-flex items-center gap-1.5">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>+ İlk Sınav Notunu Ekle</span>
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${notlar.map(n => {
                const ders = Store.getDers(n.dersId);
                const renkInfo = this.getSinavNotuRenkClass(n.not);
                const turAdi = turEtiketleri[n.tur] || n.tur;
                const tarihStr = n.tarih ? new Date(n.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

                return `
                  <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all flex items-center justify-between gap-3 group">
                    <div class="flex items-center gap-3 min-w-0">
                      <!-- Büyük Renkli Not Rozeti -->
                      <div class="w-12 h-12 rounded-[var(--radius-md)] border flex flex-col items-center justify-center flex-shrink-0 ${renkInfo.badge}">
                        <span class="font-display font-black text-lg leading-none">${n.not}</span>
                        <span class="text-[9px] uppercase tracking-wider opacity-75 font-semibold mt-0.5">Puan</span>
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <span class="meta-pill text-[10px] font-semibold" style="border-color: ${ders ? ders.renk : 'transparent'};">
                            ${ders ? ders.ad : 'Ders'}
                          </span>
                          <span class="text-[10px] text-[var(--color-ink-faint)] font-mono">${turAdi}</span>
                        </div>
                        <h4 class="font-display font-bold text-sm text-[var(--color-ink)] truncate mt-1">${n.sinavAdi}</h4>
                        <div class="text-[11px] text-[var(--color-ink-muted)] font-mono mt-0.5">${tarihStr}</div>
                      </div>
                    </div>

                    <!-- Aksiyon İkonları -->
                    <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button onclick="App.openSinavNotuModal('${n.id}')" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-paper-3)] transition-colors" title="Düzenle">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                      </button>
                      <button onclick="App.deleteSinavNotu('${n.id}')" class="p-1.5 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Sil">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  openSinavNotuModal(notId = null) {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }

    const isEdit = Boolean(notId);
    const mevcutNot = isEdit ? this.getSinavNotu(notId) : null;
    const dersler = Store.getDerslerForOgrenci(ogr);

    const bugunTarih = new Date().toISOString().split('T')[0];
    const seciliDersId = mevcutNot ? mevcutNot.dersId : (this.sinavNotlariAktifDersId || (dersler[0] ? dersler[0].id : ''));
    const seciliTur = mevcutNot ? mevcutNot.tur : 'yazili';

    const presetChips = ['1. Yazılı', '2. Yazılı', 'Sözlü', 'Proje', 'Kısa Sınav', 'Deneme'];

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Sınav Notunu Düzenle' : 'Yeni Sınav Notu Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Öğrenci: <strong class="text-[var(--color-ink)]">${ogr.adSoyad}</strong> (${ogr.sinif}. Sınıf)</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-sinav-notu" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Ders <span class="text-[var(--color-danger)]">*</span></label>
            <select id="modal-not-ders" class="select-instrument w-full p-2" required>
              ${dersler.map(d => `
                <option value="${d.id}" ${String(d.id) === String(seciliDersId) ? 'selected' : ''}>${d.ad}</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Sınav Adı <span class="text-[var(--color-danger)]">*</span></label>
            <input type="text" id="modal-not-adi" value="${mevcutNot ? mevcutNot.sinavAdi : '1. Yazılı'}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: 1. Dönem 1. Yazılı">
            <!-- Hızlı Başlık Önerileri -->
            <div class="flex items-center gap-1.5 flex-wrap mt-1.5">
              ${presetChips.map(p => `
                <button type="button" onclick="document.getElementById('modal-not-adi').value = '${p}'" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer">
                  ${p}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Sınav Notu (0 – 100) <span class="text-[var(--color-danger)]">*</span></label>
              <input type="number" id="modal-not-deger" min="0" max="100" value="${mevcutNot ? mevcutNot.not : ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] text-sm font-bold" placeholder="Örn: 85">
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Sınav Türü</label>
              <select id="modal-not-tur" class="select-instrument w-full p-2">
                <option value="yazili" ${seciliTur === 'yazili' ? 'selected' : ''}>Yazılı Sınav</option>
                <option value="sozlu" ${seciliTur === 'sozlu' ? 'selected' : ''}>Sözlü Değerlendirme</option>
                <option value="proje" ${seciliTur === 'proje' ? 'selected' : ''}>Proje & Performans</option>
                <option value="kisa-sinav" ${seciliTur === 'kisa-sinav' ? 'selected' : ''}>Kısa Sınav (Quiz)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Sınav / Değerlendirme Tarihi</label>
            <input type="date" id="modal-not-tarih" value="${mevcutNot ? (mevcutNot.tarih || bugunTarih) : bugunTarih}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Notu Kaydet'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-sinav-notu');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const dersId = document.getElementById('modal-not-ders').value;
        const sinavAdi = document.getElementById('modal-not-adi').value.trim();
        const notVal = Number(document.getElementById('modal-not-deger').value);
        const tur = document.getElementById('modal-not-tur').value;
        const tarih = document.getElementById('modal-not-tarih').value;

        if (!dersId) {
          this.showToast('Lütfen ders seçin.');
          return;
        }
        if (!sinavAdi) {
          this.showToast('Lütfen sınav adı girin.');
          return;
        }
        if (isNaN(notVal) || notVal < 0 || notVal > 100) {
          this.showToast('Lütfen 0 ile 100 arasında geçerli bir not girin.');
          return;
        }

        if (isEdit) {
          Store.updateSinifNotu(notId, { dersId, sinavAdi, not: notVal, tur, tarih });
          this.showToast('Sınav notu güncellendi.');
        } else {
          Store.addSinifNotu({
            ogrenciId: ogr.id,
            dersId,
            sinavAdi,
            not: notVal,
            tur,
            tarih
          });
          this.showToast('Sınav notu eklendi.');
        }

        this.closeModal();
        this.sinavNotlariAktifDersId = dersId;
        this.renderSinavNotlari();
      });
    }
  },

  openCoachSettingsModal() {
    const koc = Store.getKocProfili();
    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Koç Profili Ayarları</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Rapor ve çıktılarda yer alan danışman bilgileri</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-coach-settings" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Ad</label>
              <input type="text" id="koc-ad" value="${koc.ad || ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Soyad</label>
              <input type="text" id="koc-soyad" value="${koc.soyad || ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Unvan</label>
            <input type="text" id="koc-unvan" value="${koc.unvan || ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Kurum / Organizasyon</label>
            <input type="text" id="koc-kurum" value="${koc.kurum || ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Telefon / İletişim</label>
            <input type="tel" id="koc-tel" value="${koc.telefon || ''}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">Kaydet</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-coach-settings');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const ad = document.getElementById('koc-ad').value.trim();
        const soyad = document.getElementById('koc-soyad').value.trim();
        const unvan = document.getElementById('koc-unvan').value.trim();
        const kurum = document.getElementById('koc-kurum').value.trim();
        const telefon = document.getElementById('koc-tel').value.trim();

        Store.saveKocProfili({ ad, soyad, unvan, kurum, telefon });
        this.updateSidebarCoachInfo();
        this.closeModal();
        this.showToast('Koç profili güncellendi');
      });
    }
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

// Global scope bağlantısı
if (typeof window !== 'undefined') {
  window.App = App;
}

// Sayfa yüklendiğinde başlat
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
