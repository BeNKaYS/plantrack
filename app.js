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
  overviewModulFilter: '',
  overviewSinifFilter: '',

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
    if (typeof DERSLER !== 'undefined' && Array.isArray(DERSLER)) {
      const d = DERSLER.find(item => item.id === dersId);
      if (d) return d;
    }
    return { id: dersId, ad: dersId || 'Genel', renk: 'blue', kisaltma: 'DRS', ikon: 'book' };
  },

  getKonu(konuId) {
    if (typeof KONULAR !== 'undefined' && Array.isArray(KONULAR)) {
      const k = KONULAR.find(item => item.id === konuId);
      if (k) return k;
    }
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

  openGorevModal(ogrenciId, gorevId = null, konuId = null) {
    const targetOgrId = ogrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(targetOgrId);

    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin veya ekleyin.');
      return;
    }

    const isEdit = Boolean(gorevId);
    const mevcutGorev = isEdit ? Store.getGorevler(ogr.id).find(g => String(g.id) === String(gorevId)) : null;

    const dersler = Store.getDerslerForOgrenci(ogr);
    const seciliDersId = mevcutGorev ? mevcutGorev.dersId : (dersler.length > 0 ? dersler[0].id : '');

    const dersOptions = dersler.map(d =>
      `<option value="${d.id}" ${d.id === seciliDersId ? 'selected' : ''}>${d.ad}</option>`
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
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Görev Durumu</label>
            <select id="grv-durum" class="select-instrument w-full p-2">
              ${durumOptions}
            </select>
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
            dersId, konuId: konuIdVal, baslik, hedefSoru, sureDk, deadline, durum, not
          });
          this.showToast('Görev güncellendi');
        } else {
          Store.addGorev({
            ogrenciId: ogr.id,
            dersId, konuId: konuIdVal, baslik, hedefSoru, sureDk, deadline, durum, not
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
