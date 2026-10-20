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
  gridMatrisAktifDersId: '',

  // Görevler (Tasks) State
  tasksSearchQuery: '',
  tasksDurumFilter: '',
  tasksDersFilter: '',
  tasksHideCompleted: false,

  // Raporlar State
  reportAktifSablon: 'slip', // 'slip' | 'full'
  reportSelectedOgrenciId: '',

  // Deneme Raporu State
  denemeSelectedOgrenciId: '',
  denemeSelectedSinavId: '',
  denemeKarsilastirmaRefId: null,
  denemeDersFilter: '',
  denemeDurumFilter: 'tumu', // 'tumu' | 'eksik' | 'basarili'
  denemeSearchQuery: '',
  denemeKonuKapsami: 'tumu', // 'tumu' | sinavId (G17)

  // Hata Defteri State
  hataAktifSekme: 'a4', // 'a4' | 'dijital'
  hataSelectedOgrenciId: '',
  hataFormModu: 'dolu', // 'dolu' | 'bos'
  hataSatirSayisi: 15, // 10 | 15 | 20
  hataA4Rapor: false, // false: etkileşimli düzenleme, true: A4 rapor önizleme
  hataDersFilter: '',
  hataTurFilter: '',

  // Havuz & Portföy State
  curriculumAktifSekme: 'dersler', // 'dersler' | 'konular' | 'sinavlar'
  poolDersModulFilter: 'ara-sinif', // 'ara-sinif' | 'lgs' | 'yks'
  poolDersSinifFilter: '', // '' (Tümü) | '5' | '6' | '7' | '9' | '10' | '11'
  poolSinavModulFilter: 'lgs', // 'lgs' | 'yks'
  poolModulFilter: '',
  poolSinifFilter: '',
  poolAktifDersId: '',

  libraryModulFilter: '',
  librarySearchQuery: '',

  studentsModulFilter: '',
  studentsSearchQuery: '',

  // Sınav Notları State
  sinavNotlariDersFilter: '', // '' (Tümü) veya dersId
  sinavNotlariTurFilter: '', // '' (Tümü) veya 'yazili' | 'sozlu' | 'proje' | 'kisa-sinav'
  sinavNotlariAktifDersId: '', // Trend grafiği için aktif ders

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  init() {
    Store.init();
    this.applyTheme(this.currentTheme);
    this.bindEvents();
    this.initSidebarResizer();
    this.initMcpStatusMonitor();

    if (!Store.data.kurulumTamamlandi) {
      this.showSetupWizard();
      return;
    }

    this.populateStudentDropdown();
    this.updateSidebarCoachInfo();
    this.navigateTo('overview');
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // MCP SUNUCU DURUM İZLEME & CANLI SENKRONİZASYON KÖPRÜSÜ
  // ─────────────────────────────────────────────────────────────
  mcpStatus: { online: false, port: 38888, checking: true, aracSayisi: 59, kaynakSayisi: 8 },

  initMcpStatusMonitor() {
    this.checkMcpStatus(false);
    // Her 10 saniyede bir durumu sorgula
    setInterval(() => {
      this.checkMcpStatus(false);
    }, 10000);
    // Pencereye her odaklanıldığında sorgula
    window.addEventListener('focus', () => {
      this.checkMcpStatus(false);
    });
  },

  async checkMcpStatus(manual = false) {
    const port = 38888;
    try {
      const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 1200) : null;
      const res = await fetch(`http://127.0.0.1:${port}/api/status`, controller ? { signal: controller.signal } : {});
      if (timer) clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        this.mcpServerYolu = json.serverYolu || this.mcpServerYolu || '';
        this.mcpStatus = { online: true, port, aracSayisi: 59, kaynakSayisi: 8, ...json, checking: false };
        if (manual) {
          await Store.forceSyncNow();
          this.showToast(`MCP Canlı Senkronizasyon Tamamlandı (${this.mcpStatus.aracSayisi || 59} Araç Aktif)`);
        }
      } else {
        this.mcpStatus = { online: false, port, checking: false };
        if (manual) this.showToast(`MCP Sunucusuna ulaşılamadı (Port: ${port})`);
      }
    } catch (_) {
      this.mcpStatus = { online: false, port, checking: false };
      if (manual) this.showToast(`MCP Sunucusu Çevrimdışı (Port: ${port})`);
    }
    this.renderMcpStatusBadges();
  },

  renderMcpStatusBadges() {
    const aracSayisi = this.mcpStatus.aracSayisi || 59;

    // 1. Ana Panel (Overview) Rozeti
    const badgeEl = document.getElementById('overview-mcp-status-badge');
    if (badgeEl) {
      if (this.mcpStatus.online) {
        badgeEl.innerHTML = `
          <div onclick="App.checkMcpStatus(true)" class="flex items-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs cursor-pointer hover:bg-emerald-500/20 transition-all shadow-sm group select-none" title="Canlı MCP Köprüsü Bağlı (${aracSayisi} Araç) — Şimdi senkronize etmek için tıklayın">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span class="font-semibold">MCP Canlı: Açık</span>
            <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold tracking-tight">${aracSayisi} Araç</span>
            <i data-lucide="refresh-cw" class="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all ml-0.5"></i>
          </div>
        `;
      } else {
        badgeEl.innerHTML = `
          <div onclick="App.checkMcpStatus(true)" class="flex items-center gap-2 py-2 px-3 rounded-[var(--radius-sm)] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-mono text-xs cursor-pointer hover:bg-rose-500/20 transition-all shadow-sm group select-none" title="MCP Sunucusu Kapalı (Port: ${this.mcpStatus.port}) — Yeniden denemek için tıklayın">
            <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            <span class="font-semibold">MCP Sunucusu: Kapalı</span>
            <span class="px-1.5 py-0.5 rounded bg-rose-500/20 text-[10px] font-bold tracking-tight">Port ${this.mcpStatus.port}</span>
            <i data-lucide="refresh-cw" class="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all ml-0.5"></i>
          </div>
        `;
      }
    }

    // 2. Topbar (Tüm Modüller ve Çizelgelerde Görünür) Rozeti
    const topbarEl = document.getElementById('topbar-mcp-badge-container');
    if (topbarEl) {
      if (this.mcpStatus.online) {
        topbarEl.innerHTML = `
          <div class="flex items-center gap-1">
            <button type="button" onclick="App.checkMcpStatus(true)" class="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] cursor-pointer hover:bg-emerald-500/20 transition-all group" title="MCP Canlı Köprü Aktif (${aracSayisi} Araç) — Anlık senkronize etmek için tıklayın">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="font-semibold">MCP Canlı</span>
              <i data-lucide="refresh-cw" class="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all"></i>
            </button>
            <button type="button" onclick="App.openCoachSettingsModal('mcp')" class="p-1 rounded-[var(--radius-sm)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-3)] transition-colors" title="MCP Yapay Zeka Ayarları">
              <i data-lucide="cpu" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        `;
      } else {
        topbarEl.innerHTML = `
          <button type="button" onclick="App.openCoachSettingsModal('mcp')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] font-mono text-[11px] cursor-pointer transition-all" title="MCP Bağlantı Ayarlarını Aç">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>MCP Kapalı</span>
          </button>
        `;
      }
    }

    // 3. Sidebar Alt Rozeti
    const sidebarEl = document.getElementById('sidebar-mcp-status');
    if (sidebarEl) {
      if (this.mcpStatus.online) {
        sidebarEl.innerHTML = `
          <div onclick="App.checkMcpStatus(true)" class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] cursor-pointer hover:bg-emerald-500/20 transition-all" title="MCP Canlı (Port: ${this.mcpStatus.port})">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MCP :${this.mcpStatus.port}</span>
          </div>
        `;
      } else {
        sidebarEl.innerHTML = `
          <div onclick="App.checkMcpStatus(true)" class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-4)] border border-[var(--color-rule)] text-[var(--color-ink-faint)] font-mono text-[10px] cursor-pointer hover:text-[var(--color-ink)] transition-all" title="MCP Kapalı (Port: ${this.mcpStatus.port})">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>MCP :${this.mcpStatus.port}</span>
          </div>
        `;
      }
    }

    if (window.lucide) lucide.createIcons();
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

  syncActiveStudentState() {
    const aktifId = Store.data.aktifOgrenciId || ((Store.data.ogrenciler && Store.data.ogrenciler[0]) ? Store.data.ogrenciler[0].id : '');
    if (aktifId) {
      this.reportSelectedOgrenciId = aktifId;
      this.denemeSelectedOgrenciId = aktifId;
      this.hataSelectedOgrenciId = aktifId;
      this.cizelgeOgrenciId = aktifId;
    }
  },

  navigateTo(view) {
    this.currentView = view;
    this.syncActiveStudentState();

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
    this.renderMcpStatusBadges();

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  renderCurrentView() {
    Store.refreshDeadlines();
    this.syncActiveStudentState();
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
      case 'grid-matrix':
        this.renderGridMatrix();
        break;
      case 'tasks':
        this.renderTasks();
        break;
      case 'report':
        this.renderReport();
        break;
      case 'deneme-raporu':
        this.renderDenemeRaporu();
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
    const container = document.getElementById('modal-container');
    if (container) {
      container.className = 'bg-[var(--color-paper-2)] border border-[var(--color-rule-strong)] rounded-[var(--radius-lg)] max-w-lg w-full overflow-hidden shadow-2xl';
    }
  },

  copyToClipboard(text, successMessage = 'Panoya kopyalandı!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMessage);
      }).catch(() => {
        this._fallbackCopyText(text, successMessage);
      });
    } else {
      this._fallbackCopyText(text, successMessage);
    }
  },

  _fallbackCopyText(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.showToast(successMessage);
    } catch (err) {
      this.showToast('Kopyalama başarısız oldu.');
    }
    document.body.removeChild(textArea);
  },

  confirmModal({ baslik = 'Emin misiniz?', mesaj = 'Bu işlem geri alınamaz.', onayMetni = 'Onayla', iptalMetni = 'Vazgeç', tehlikeli = true } = {}) {
    return new Promise((resolve) => {
      const html = `
        <div class="space-y-4">
          <div class="flex items-center gap-3 pb-3 border-b border-[var(--color-rule)]">
            <div class="w-8 h-8 rounded-full ${tehlikeli ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : 'bg-[var(--color-paper-3)] text-[var(--color-accent)]'} flex items-center justify-center shrink-0">
              <i data-lucide="${tehlikeli ? 'alert-triangle' : 'help-circle'}" class="w-4 h-4"></i>
            </div>
            <div>
              <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${baslik}</h3>
              <p class="text-xs text-[var(--color-ink-muted)]">İşlem onayı gereklidir.</p>
            </div>
          </div>
          <p class="text-sm text-[var(--color-ink)] leading-relaxed">${mesaj}</p>
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button id="btn-modal-cancel" type="button" class="btn-tactile btn-tactile-ghost">${iptalMetni}</button>
            <button id="btn-modal-confirm" type="button" class="btn-tactile ${tehlikeli ? 'bg-[var(--color-danger)] text-white hover:opacity-90' : 'btn-tactile-primary'}">${onayMetni}</button>
          </div>
        </div>
      `;
      this.openModal(html);

      const btnConfirm = document.getElementById('btn-modal-confirm');
      const btnCancel = document.getElementById('btn-modal-cancel');

      let handled = false;
      const onConfirm = () => {
        if (handled) return;
        handled = true;
        this.closeModal();
        resolve(true);
      };
      const onCancel = () => {
        if (handled) return;
        handled = true;
        this.closeModal();
        resolve(false);
      };

      if (btnConfirm) btnConfirm.addEventListener('click', onConfirm);
      if (btnCancel) btnCancel.addEventListener('click', onCancel);
    });
  },

  openConfirmModal(title, message, onConfirm) {
    this.confirmModal({ baslik: title, mesaj: message, onayMetni: 'Onayla ve Sil', tehlikeli: true }).then(ok => {
      if (ok && typeof onConfirm === 'function') onConfirm();
    });
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
            <div id="overview-mcp-status-badge"></div>
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
    this.renderMcpStatusBadges();

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

    // Aylık Alışkanlık Zinciri & Disiplin Hesaplaması
    const nowC = new Date();
    const cYil = nowC.getFullYear();
    const cAyIdx = nowC.getMonth();
    const cYilAyStr = `${cYil}-${String(cAyIdx + 1).padStart(2, '0')}`;
    const cAyAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const cAyAdi = cAyAdlari[cAyIdx];
    const cDaysCount = new Date(cYil, cAyIdx + 1, 0).getDate();

    const studentAliskanliklar = Store.getAliskanliklar(ogr.id);
    let toplamAliskanlikYuzde = 0;
    const aliskanlikCockpitItems = studentAliskanliklar.map(al => {
      const cHex = this.getAliskanlikColorHex(al.renk);
      const aySonu = Store.getAliskanlikAySonu(ogr.id, al.id, cYilAyStr);
      let doneCount = 0;
      if (aySonu && aySonu.gun !== undefined && aySonu.gun !== null && aySonu.gun !== '') {
        doneCount = Number(aySonu.gun);
      } else {
        for (let d = 1; d <= cDaysCount; d++) {
          const tStr = `${cYilAyStr}-${String(d).padStart(2, '0')}`;
          if (Store.getAliskanlikDurum(ogr.id, al.id, tStr)) doneCount++;
        }
      }
      const yuzde = Math.round((doneCount / cDaysCount) * 100);
      toplamAliskanlikYuzde += yuzde;
      return {
        al,
        cHex,
        doneCount,
        daysCount: cDaysCount,
        yuzde,
        not: aySonu && aySonu.not ? aySonu.not : ''
      };
    });
    const genelDisiplinYuzde = studentAliskanliklar.length > 0 
      ? Math.round(toplamAliskanlikYuzde / studentAliskanliklar.length) 
      : 0;

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

        <!-- Bölüm 3: İki Kolon Layout (G17: Kompakt & Scrollable) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Sol Kolon (7/12 genişlik) — Acil Müdahale Paneli -->
          <div class="lg:col-span-7 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between pb-2.5 border-b border-[var(--color-rule)]">
              <div class="flex items-center gap-2">
                <i data-lucide="flame" class="w-4 h-4 ${gecikmisGorevler.length > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}"></i>
                <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Acil Müdahale Paneli (Gecikenler)</h2>
              </div>
              <span class="badge-count ${gecikmisGorevler.length > 0 ? 'badge-danger' : ''}">${gecikmisGorevler.length}</span>
            </div>

            <div class="max-h-[340px] overflow-y-auto pr-1 space-y-1.5 custom-scroll">
              ${
                gecikmisGorevler.length === 0
                  ? `<div class="py-12 text-center text-xs text-[var(--color-success)] flex items-center justify-center gap-2">
                      <i data-lucide="check-circle" class="w-4 h-4"></i>
                      <span>Gecikmiş ödev yok, çalışma süreci planlandığı gibi gidiyor.</span>
                    </div>`
                  : gecikmisGorevler.map(gorev => {
                      const ders = this.getDers(gorev.dersId);
                      const overdueDays = this.calculateOverdueDays(gorev.deadline);
                      return `
                        <div class="flex items-center justify-between gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all">
                          <div class="flex items-center gap-2 min-w-0 flex-1">
                            <span class="meta-pill text-[10px] text-[var(--color-accent)] font-semibold shrink-0">${ders.ad}</span>
                            <span class="font-medium text-xs text-[var(--color-ink)] truncate" title="${gorev.baslik}">${gorev.baslik}</span>
                            <span class="badge-count badge-danger text-[10px] shrink-0 font-mono">${overdueDays > 0 ? `${overdueDays} gün gecikti` : 'Gecikti'}</span>
                          </div>
                          <div class="flex items-center gap-1 shrink-0">
                            <button onclick="Store.gorevTamamla('${gorev.id}'); App.renderCockpit(); App.showToast('Görev tamamlandı');" class="p-1 rounded text-emerald-600 hover:bg-emerald-500/10 transition-colors" title="Görevi Tamamla">
                              <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="App.openGorevModal('${ogr.id}', '${gorev.id}')" class="p-1 rounded text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-2)] transition-colors" title="Düzenle">
                              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                            </button>
                            <button onclick="App.openConfirmModal('Görevi Sil', 'Bu görevi silmek istediğinize emin misiniz?', () => { Store.deleteGorev('${gorev.id}'); App.renderCockpit(); });" class="p-1 rounded text-rose-500 hover:bg-rose-500/10 transition-colors" title="Sil">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')
              }
            </div>
          </div>

          <!-- Sağ Kolon (5/12 genişlik) — Kritik Eksik Konu Radarı -->
          <div class="lg:col-span-5 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-4 flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between pb-2.5 border-b border-[var(--color-rule)]">
              <div class="flex items-center gap-2">
                <i data-lucide="radar" class="w-4 h-4 text-[var(--color-warning)]"></i>
                <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Kritik Eksik Konu Radarı</h2>
              </div>
              <span class="meta-pill text-[var(--color-warning)] font-mono font-bold">${kritikEksikKonular.length}</span>
            </div>

            <div class="max-h-[340px] overflow-y-auto pr-1 space-y-1.5 custom-scroll">
              ${
                kritikEksikKonular.length === 0
                  ? `<div class="py-12 text-center text-xs text-[var(--color-success)] flex items-center justify-center gap-2">
                      <i data-lucide="smile" class="w-4 h-4"></i>
                      <span>Kritik eksik konu yok. Tüm işlenen kazanımlar sağlam!</span>
                    </div>`
                  : kritikEksikKonular.map(item => {
                      const konu = this.getKonu(item.konuId);
                      const ders = this.getDers(konu.dersId);
                      return `
                        <div class="flex items-center justify-between gap-2 p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] transition-all">
                          <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                              <span class="meta-pill text-[10px] font-semibold shrink-0">${ders.ad}</span>
                              <span class="font-medium text-xs text-[var(--color-ink)] truncate" title="${konu.konuAdi}">${konu.konuAdi}</span>
                              <span class="text-[10px] font-mono text-[var(--color-warning)] shrink-0 font-semibold">Tekrar Lazım</span>
                            </div>
                            ${item.not ? `<div class="text-[10px] text-[var(--color-ink-muted)] truncate pl-0.5 mt-0.5 italic" title="${item.not}">${item.not}</div>` : ''}
                          </div>
                          <div class="shrink-0">
                            <button onclick="App.openGorevModal('${ogr.id}', null, '${item.konuId}', null, '${konu.konuAdi.replace(/'/g, "\\'")}', '${ders.ad.replace(/'/g, "\\'")}', '${(item.not || 'Kritik Eksik Konu Telafi Çalışması').replace(/'/g, "\\'")}')" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2 text-[var(--color-accent)] hover:border-[var(--color-accent-border)] flex items-center gap-1 font-semibold" title="Telafi ödevi oluştur">
                              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                              <span>+ Telafi</span>
                            </button>
                          </div>
                        </div>
                      `;
                    }).join('')
              }
            </div>
          </div>
        </div>

        <!-- Bölüm 3.5: Aylık Alışkanlık Zinciri & Disiplin Karnesi -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)] flex-wrap gap-2">
            <div class="flex items-center gap-2.5">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
              </span>
              <div>
                <h2 class="font-display font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
                  <span>Aylık Alışkanlık Zinciri & Disiplin Karnesi</span>
                  <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink-muted)]">${cAyAdi} ${cYil}</span>
                </h2>
                <p class="text-[11px] text-[var(--color-ink-muted)]">Çizelge Robotu'ndan gelen günlük rutin devamlılığı ve ay sonu değerleri</p>
              </div>
            </div>

            <div class="flex items-center gap-2.5">
              <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-md ${genelDisiplinYuzde >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                Ortalama: %${genelDisiplinYuzde} Devamlılık
              </span>
              <button onclick="App.navigateTo('cizelge-robotu'); App.setCizelgeSablon('aliskanlik');" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)] flex items-center gap-1">
                <span>Çizelge Robotu'nda Yönet</span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${aliskanlikCockpitItems.map((item, idx) => `
              <div class="p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] space-y-2 flex flex-col justify-between" style="border-left: 3px solid ${item.cHex.renk};">
                <div class="flex items-center justify-between gap-2">
                  <div class="font-bold text-xs text-[var(--color-ink)] truncate" title="${item.al.baslik}">
                    #${idx + 1} ${item.al.baslik}
                  </div>
                  <span class="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${item.yuzde >= 70 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}">
                    %${item.yuzde}
                  </span>
                </div>

                <div class="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)] font-mono">
                  <span>${item.doneCount} / ${item.daysCount} Gün</span>
                  ${item.not ? `<span class="text-[10px] text-[var(--color-ink)] font-sans italic truncate max-w-[120px]" title="${item.not}">📌 ${item.not}</span>` : ''}
                </div>

                <div class="w-full h-1.5 bg-[var(--color-paper-4)] rounded-full overflow-hidden">
                  <div class="h-full ${item.yuzde >= 70 ? 'bg-emerald-500' : 'bg-amber-500'} transition-all" style="width: ${item.yuzde}%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Bölüm 4: Aktif Ödevler Tablosu -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
            <div class="flex items-center gap-2">
              <i data-lucide="list-todo" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <h2 class="font-display font-bold text-sm text-[var(--color-ink)]">Aktif Çalışma & Ödev Listesi</h2>
            </div>
            <span class="meta-pill font-mono text-[11px]">${devamEdenGorevler.length} Aktif Ödev</span>
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
              <span class="meta-pill">AKADEMİK KARTLAR</span>
              <span class="text-xs font-mono text-[var(--color-ink-faint)]">${ogr.adSoyad} (${ogr.sinif}. Sınıf · ${modul.ad})</span>
            </div>
            <h1 class="text-2xl font-bold font-display tracking-tight text-[var(--color-ink)]">Çalışma & Ödev Kartları</h1>
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
                            <button onclick="App.openHucreDuzenleModal('${ogr.id}', '${seciliKonu.id}', '${kyn.id}')" class="btn-tactile btn-tactile-ghost py-1 px-2 text-[11px] flex-1 flex items-center justify-center gap-1">
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
    this.renderCurrentView();
  },

  saveKonuNotu(konuId) {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) return;
    const textarea = document.getElementById('matris-konu-not');
    const val = textarea ? textarea.value.trim() : '';
    const kd = Store.getKonuDurumu(ogr.id, konuId);
    Store.setKonuDurumu(ogr.id, konuId, kd.durum || 'islenmedi', val);
    this.showToast('Konu notu kaydedildi');
    this.renderCurrentView();
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW: ÇALIŞMA & ÖDEV MATRİSİ (KLASİK GRID MATRIX - G7)
  // ─────────────────────────────────────────────────────────────
  renderGridMatrix() {
    const view = document.getElementById('view-grid-matrix');
    if (!view) return;

    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      view.innerHTML = `
        <div class="max-w-7xl mx-auto p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div class="max-w-md w-full text-center space-y-4 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-8">
            <div class="w-12 h-12 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule-strong)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
              <i data-lucide="grid-3x3" class="w-6 h-6"></i>
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

    let dersler = Store.getDerslerForOgrenci(ogr);
    if (dersler.length === 0) {
      dersler = Store.getDersler().filter(d => d.modulId === ogr.modulId);
    }
    if (dersler.length === 0) {
      dersler = Store.getDersler();
    }
    const modul = Store.getModulForOgrenci(ogr) || { ad: 'Modül', id: ogr.modulId };

    // Aktif ders seçimi (ilk açılışta öğrencinin ilk dersi)
    if (!this.gridMatrisAktifDersId || !dersler.some(d => d.id === this.gridMatrisAktifDersId)) {
      this.gridMatrisAktifDersId = dersler.length > 0 ? dersler[0].id : '';
    }

    const seciliDers = dersler.find(d => d.id === this.gridMatrisAktifDersId) || dersler[0];
    const tumKonular = seciliDers ? Store.getKonularForDers(seciliDers.id) : [];

    // Seçili kaynak sütunları
    const tumKaynaklar = Store.getKaynaklar(ogr.modulId);
    const kaynakHavuzu = tumKaynaklar.length > 0 ? tumKaynaklar : Store.getKaynaklar();

    let seciliKaynakIds = Array.isArray(ogr.seciliKaynaklar) && ogr.seciliKaynaklar.length > 0
      ? ogr.seciliKaynaklar
      : kaynakHavuzu.slice(0, 4).map(k => k.id);

    // Eğer öğrencinin seçili kaynakları hiç ayarlanmamışsa ilk açılışta ata
    if (!ogr.seciliKaynaklar || ogr.seciliKaynaklar.length === 0) {
      if (seciliKaynakIds.length > 0) {
        Store.updateOgrenci(ogr.id, { seciliKaynaklar: seciliKaynakIds });
      }
    }

    const seciliKaynaklar = seciliKaynakIds
      .map(id => Store.getKaynak(id))
      .filter(Boolean);

    // Öğrencinin bu derse ait görevleri
    const tumGorevler = Store.getGorevler(ogr.id);
    const dersGorevleri = tumGorevler.filter(g => seciliDers && String(g.dersId) === String(seciliDers.id));
    const gorevMap = new Map();
    dersGorevleri.forEach(g => {
      gorevMap.set(`${g.konuId}_${g.kaynakId}`, g);
    });

    // Konuları ünite numarasına göre grupla
    const uniteMap = new Map();
    tumKonular.forEach(k => {
      const uNo = Number(k.uniteNo) || 1;
      const uAdi = k.uniteAdi || `Ünite ${uNo}`;
      if (!uniteMap.has(uNo)) {
        uniteMap.set(uNo, { no: uNo, ad: uAdi, konular: [] });
      }
      uniteMap.get(uNo).konular.push(k);
    });

    const uniteler = Array.from(uniteMap.values()).sort((a, b) => a.no - b.no);
    uniteler.forEach(u => {
      u.konular.sort((a, b) => (Number(a.siraNo) || 1) - (Number(b.siraNo) || 1));
    });

    // İstatistikler: Alt Özet Barı
    let toplamCozulen = 0;
    let toplamD = 0;
    let toplamY = 0;
    let toplamB = 0;

    dersGorevleri.forEach(g => {
      const d = Number(g.dogruSoru) || 0;
      const y = Number(g.yanlisSoru) || 0;
      const c = Number(g.cozulenSoru) || (d + y);
      const b = Math.max(0, c - d - y);
      toplamCozulen += c;
      toplamD += d;
      toplamY += y;
      toplamB += b;
    });

    const toplamSoruGiris = toplamD + toplamY + toplamB;
    const dogrulukOrani = toplamSoruGiris > 0 ? Math.round((toplamD / toplamSoruGiris) * 100) : 0;

    const tamamlananKonular = tumKonular.filter(k => {
      const kd = Store.getKonuDurumu(ogr.id, k.id);
      return kd && kd.durum === 'tamam';
    });
    const tamamYuzde = tumKonular.length > 0 ? Math.round((tamamlananKonular.length / tumKonular.length) * 100) : 0;

    const colCount = 2 + seciliKaynaklar.length; // Konu + Kaynaklar + Durum

    let html = `
      <div class="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <!-- Bölüm 1: Başlık & Araç Çubuğu -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="font-display font-bold text-xl md:text-2xl text-[var(--color-ink)] flex items-center gap-2">
                <i data-lucide="grid-3x3" class="w-6 h-6 text-[var(--color-accent)]"></i>
                <span>Çalışma & Ödev Matrisi</span>
              </h2>
              <span class="meta-pill text-xs bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border-[var(--color-accent-border)] font-semibold">
                ${ogr.ad} ${ogr.soyad}
              </span>
              <span class="meta-pill text-[11px] font-mono">
                ${modul.ad} · ${ogr.sinif}. Sınıf
              </span>
            </div>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">
              Klasik konu × kaynak matris görünümü. Her hücreye tıklayarak soru, doğruluk ve süre verilerini işleyebilirsiniz.
            </p>
          </div>

          <!-- Sağ Araçlar -->
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="App.openMatrisSutunModal()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Görüntülenecek kaynak sütunlarını seç">
              <i data-lucide="columns" class="w-3.5 h-3.5"></i>
              <span>Sütunları Düzenle</span>
            </button>
            <button onclick="App.openGorevModal('${ogr.id}', null, null, null, null, '${seciliDers ? seciliDers.ad.replace(/'/g, "\\'") : ''}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm font-semibold" title="Aktif derse yeni ödev ata — hücreye tıklayarak da ödev atayabilirsiniz">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Yeni Ödev</span>
            </button>
          </div>
        </div>

        <!-- Ders Sekmeleri (Tab Bar) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--color-rule)] scrollbar-thin">
          ${dersler.map(d => {
            const isAktif = seciliDers && d.id === seciliDers.id;
            const dKonuSayisi = Store.getKonularForDers(d.id).length;
            return `
              <button onclick="App.selectGridMatrisDers('${d.id}')"
                class="btn-tactile ${isAktif ? 'btn-tactile-primary shadow-sm font-semibold' : 'btn-tactile-secondary text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'} text-xs py-1.5 px-3.5 flex items-center gap-2 shrink-0 transition-all">
                <i data-lucide="${d.ikon || 'book-open'}" class="w-3.5 h-3.5"></i>
                <span>${d.ad}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded-full ${isAktif ? 'bg-white/20 text-white' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)]'} font-mono">${dKonuSayisi}</span>
              </button>
            `;
          }).join('')}
        </div>
    `;

    if (!seciliDers || tumKonular.length === 0) {
      html += `
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] p-12 text-center space-y-4">
          <div class="w-12 h-12 rounded-full bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink-faint)] flex items-center justify-center mx-auto">
            <i data-lucide="book-open" class="w-6 h-6"></i>
          </div>
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Bu Derste Henüz Konu Bulunmuyor</h3>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">
              ${seciliDers ? seciliDers.ad : 'Ders'} için müfredat havuzundan konu ekleyebilir veya Excel ile toplu yükleme yapabilirsiniz.
            </p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2">
            ${seciliDers ? `
              <button onclick="App.openKonuModal('${seciliDers.id}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>İlk Konuyu Ekle</span>
              </button>
              <button onclick="App.openKonuExcelModal('${seciliDers.id}')" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>Excel'den Konu Yükle</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      // Tablo
      html += `
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr class="bg-[var(--color-paper-3)]/90 border-b border-[var(--color-rule-strong)] text-xs text-[var(--color-ink)]">
                  <th class="p-3.5 font-bold uppercase tracking-wider text-[11px] text-[var(--color-ink-muted)] w-80 min-w-[260px]">
                    Konu / Kazanım
                  </th>
                  ${seciliKaynaklar.map(k => `
                    <th class="p-3 text-center border-l border-[var(--color-rule)] min-w-[140px]">
                      <div class="font-bold text-[var(--color-ink)] text-xs truncate" title="${k.ad}">${k.ad}</div>
                      <div class="text-[10px] text-[var(--color-ink-muted)] font-normal truncate" title="${k.yayinevi}">${k.yayinevi}</div>
                    </th>
                  `).join('')}
                  ${seciliKaynaklar.length === 0 ? `
                    <th class="p-3 text-center border-l border-[var(--color-rule)] text-[11px] text-[var(--color-ink-muted)]">
                      <button onclick="App.openMatrisSutunModal()" class="btn-tactile btn-tactile-ghost text-xs text-[var(--color-accent)]">
                        + Kaynak Sütunu Ekle
                      </button>
                    </th>
                  ` : ''}
                  <th class="p-3.5 text-center border-l border-[var(--color-rule)] font-bold uppercase tracking-wider text-[11px] text-[var(--color-ink-muted)] w-40 min-w-[150px]">
                    Konu Durumu
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-rule)] text-xs">
      `;

      uniteler.forEach(u => {
        // Ünite Başlığı
        html += `
          <tr class="bg-[var(--color-paper-3)]/60 border-y border-[var(--color-rule)] select-none">
            <td colspan="${colCount}" class="py-2.5 px-4 font-display font-bold text-xs text-[var(--color-ink)]">
              <div class="flex items-center gap-2">
                <i data-lucide="folder" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                <span>Ünite ${u.no}: ${u.ad}</span>
                <span class="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-[var(--color-ink-muted)] ml-1">
                  ${u.konular.length} Konu
                </span>
              </div>
            </td>
          </tr>
        `;

        // Konu Satırları
        u.konular.forEach(k => {
          const kd = Store.getKonuDurumu(ogr.id, k.id);

          html += `
            <tr class="hover:bg-[var(--color-paper-3)]/30 transition-colors">
              <!-- 1. Konu Adı -->
              <td class="p-3 align-middle font-medium text-[var(--color-ink)]">
                <div class="space-y-0.5">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[10px] text-[var(--color-ink-faint)] w-4">${k.siraNo || ''}</span>
                    <span class="text-xs text-[var(--color-ink)] font-semibold">${k.konuAdi}</span>
                  </div>
                  ${k.aciklama ? `<p class="text-[11px] text-[var(--color-ink-muted)] pl-6 truncate max-w-sm" title="${k.aciklama}">${k.aciklama}</p>` : ''}
                </div>
              </td>
          `;

          // 2. Kaynak Sütunları
          seciliKaynaklar.forEach(kaynak => {
            const gorevKey = `${k.id}_${kaynak.id}`;
            const g = gorevMap.get(gorevKey);

            if (g) {
              const hedef = Number(g.hedefSoru) || 0;
              const d = Number(g.dogruSoru) || 0;
              const y = Number(g.yanlisSoru) || 0;
              const cozulen = Number(g.cozulenSoru) || (d + y);
              const b = Math.max(0, cozulen - d - y);
              const oran = hedef > 0 ? Math.round((cozulen / hedef) * 100) : (cozulen > 0 ? 100 : 0);

              let badgeStyle = 'bg-slate-500/10 border-slate-500/20 text-[var(--color-ink-muted)]';
              if (oran >= 90) {
                badgeStyle = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold';
              } else if (oran >= 70) {
                badgeStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
              } else if (oran > 0) {
                badgeStyle = 'bg-amber-500/10 border-amber-500/25 text-amber-400';
              }

              html += `
                <td class="p-2 text-center align-middle border-l border-[var(--color-rule)]">
                  <button type="button" onclick="App.openHucreDuzenleModal('${ogr.id}', '${k.id}', '${kaynak.id}')"
                    class="w-full p-1.5 rounded-[var(--radius-sm)] border ${badgeStyle} hover:scale-[1.02] hover:shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    title="${kaynak.yayinevi} - ${k.konuAdi}: Düzenlemek için tıklayın">
                    <span class="font-mono text-xs font-bold leading-tight">${cozulen} / ${hedef}</span>
                    <span class="text-[10px] font-mono space-x-1 opacity-90 leading-tight">
                      <span class="text-emerald-500 font-semibold">D:${d}</span>
                      <span class="text-rose-500 font-semibold">Y:${y}</span>
                      <span class="text-[var(--color-ink-faint)]">B:${b}</span>
                    </span>
                    ${g.durum !== 'tamamlandi' ? `
                      <span class="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none ${g.durum === 'gecikti' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}">
                        ${(typeof GOREV_DURUMLARI !== 'undefined' && GOREV_DURUMLARI[g.durum]) ? GOREV_DURUMLARI[g.durum].label : g.durum}${g.deadline ? ' · ' + g.deadline : ''}
                      </span>
                    ` : ''}
                  </button>
                </td>
              `;
            } else {
              html += `
                <td class="p-2 text-center align-middle border-l border-[var(--color-rule)]">
                  <button type="button" onclick="App.openHucreDuzenleModal('${ogr.id}', '${k.id}', '${kaynak.id}')"
                    class="w-full py-2.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] transition-colors font-mono text-xs cursor-pointer"
                    title="${kaynak.yayinevi} - Soru girişi yapmak için tıklayın">
                    —
                  </button>
                </td>
              `;
            }
          });

          if (seciliKaynaklar.length === 0) {
            html += `<td class="p-2 text-center align-middle border-l border-[var(--color-rule)] text-[var(--color-ink-faint)]">—</td>`;
          }

          // 3. Konu Durumu Sütunu
          html += `
              <td class="p-2 text-center align-middle border-l border-[var(--color-rule)]">
                <select onchange="App.setKonuDurumu('${k.id}', this.value)"
                  class="select-instrument text-[11px] py-1 px-2 font-medium w-full text-center">
                  <option value="islenmedi" ${kd.durum === 'islenmedi' ? 'selected' : ''}>○ İşlenmedi</option>
                  <option value="calisiliyor" ${kd.durum === 'calisiliyor' ? 'selected' : ''}>◔ Çalışılıyor</option>
                  <option value="tamam" ${kd.durum === 'tamam' ? 'selected' : ''}>● Tamam</option>
                  <option value="tekrar_lazim" ${kd.durum === 'tekrar_lazim' ? 'selected' : ''}>▲ Tekrar Lazım</option>
                </select>
              </td>
            </tr>
          `;
        });
      });

      html += `
              </tbody>
            </table>
          </div>

          <!-- Bölüm 3: Matris Alt Özet -->
          <div class="p-4 bg-[var(--color-paper-3)]/60 border-t border-[var(--color-rule)] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div class="flex items-center gap-6 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-muted)]">Toplam Çözülen Soru:</span>
                <span class="font-mono font-bold text-sm text-[var(--color-ink)]">${toplamCozulen}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-muted)]">Doğruluk Oranı:</span>
                <span class="font-mono font-bold text-sm ${dogrulukOrani >= 70 ? 'text-emerald-500' : (dogrulukOrani >= 50 ? 'text-amber-500' : 'text-rose-500')}">
                  %${dogrulukOrani}
                </span>
                <span class="text-[10px] font-mono text-[var(--color-ink-faint)]">(D:${toplamD} Y:${toplamY} B:${toplamB})</span>
              </div>
            </div>

            <!-- Konu Tamamlanma İlerlemesi -->
            <div class="flex items-center gap-3 min-w-[260px]">
              <span class="text-[var(--color-ink-muted)] shrink-0">Tamamlanan Konu:</span>
              <div class="flex-1 bg-[var(--color-paper-1)] border border-[var(--color-rule)] rounded-full h-2.5 overflow-hidden">
                <div class="bg-[var(--color-success)] h-full rounded-full transition-all duration-300" style="width: ${tamamYuzde}%;"></div>
              </div>
              <span class="font-mono font-bold text-[var(--color-ink)] shrink-0">%${tamamYuzde}</span>
              <span class="text-[10px] font-mono text-[var(--color-ink-muted)] shrink-0">(${tamamlananKonular.length}/${tumKonular.length})</span>
            </div>
          </div>
        </div>
      `;
    }

    html += `</div>`;
    view.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  selectGridMatrisDers(dersId) {
    this.gridMatrisAktifDersId = dersId;
    this.renderGridMatrix();
  },

  // ─────────────────────────────────────────────────────────────
  // HÜCRE DÜZENLEME MODALI (G7: openHucreDuzenleModal)
  // ─────────────────────────────────────────────────────────────
  openHucreDuzenleModal(ogrenciId, konuId, kaynakId) {
    const ogr = Store.getOgrenci(ogrenciId);
    const konu = Store.getKonu(konuId);
    const kaynak = Store.getKaynak(kaynakId);
    if (!ogr || !konu || !kaynak) return;

    // Mevcut bir görev var mı bak
    const existing = Store.getGorevler(ogr.id).find(g => String(g.konuId) === String(konuId) && String(g.kaynakId) === String(kaynakId));
    const defHedef = existing ? (existing.hedefSoru || 0) : 40;
    const defDogru = existing ? (existing.dogruSoru || 0) : 0;
    const defYanlis = existing ? (existing.yanlisSoru || 0) : 0;
    const defCozulen = existing ? (existing.cozulenSoru || 0) : (defDogru + defYanlis);
    const defBos = existing ? Math.max(0, defCozulen - defDogru - defYanlis) : 0;
    const defSure = existing ? (existing.sureDk || '') : '';
    const defNot = existing ? (existing.not || '') : '';
    const defDeadline = existing ? (existing.deadline || '') : '';

    // Yeni kayıtta durum türetilir: soru girilmediyse bu bir "ödev atamasıdır"
    let defDurum = 'bekliyor';
    if (existing && existing.durum) {
      defDurum = existing.durum;
    } else if ((defDogru + defYanlis + defBos) > 0) {
      defDurum = (defHedef > 0 && (defDogru + defYanlis + defBos) < defHedef) ? 'devam_ediyor' : 'tamamlandi';
    }
    const durumSecenekleri = Object.keys(typeof GOREV_DURUMLARI !== 'undefined' ? GOREV_DURUMLARI : {}).map(key => `
                <option value="${key}" ${defDurum === key ? 'selected' : ''}>${GOREV_DURUMLARI[key].label}</option>
    `).join('');

    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${konu.konuAdi} — ${kaynak.yayinevi}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">${kaynak.ad} · Hedef ve Soru Çözüm Verisi</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-hucre-duzenle" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Hedef Soru</label>
              <input type="number" id="hd-hedef" min="0" value="${defHedef}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Çalışma Süresi (dk)</label>
              <input type="number" id="hd-sure" min="0" value="${defSure}" placeholder="Örn: 40" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Teslim Tarihi (Opsiyonel)</label>
              <input type="date" id="hd-deadline" value="${defDeadline}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono">
              <div class="flex items-center gap-1.5 mt-1.5">
                <button type="button" onclick="App.setGorevQuickDeadline(3, 'hd-deadline')" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer text-[11px] py-0.5 px-2 font-medium" title="3 gün sonra">3G</button>
                <button type="button" onclick="App.setGorevQuickDeadline(5, 'hd-deadline')" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer text-[11px] py-0.5 px-2 font-medium" title="5 gün sonra">5G</button>
                <button type="button" onclick="App.setGorevQuickDeadline(7, 'hd-deadline')" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer text-[11px] py-0.5 px-2 font-medium" title="1 hafta sonra">1H</button>
              </div>
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Ödev Durumu</label>
              <select id="hd-durum" class="select-instrument w-full p-2">
                ${durumSecenekleri}
              </select>
              <p class="text-[10px] text-[var(--color-ink-faint)] mt-1.5 leading-snug">Soru sonucu girilmezse satıra <strong>bekleyen ödev</strong> atanır; sonuç girilince durum otomatik güncellenir.</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block font-medium text-[var(--color-success)] mb-1">Doğru (D)</label>
              <input type="number" id="hd-dogru" min="0" value="${defDogru}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-success)] font-mono font-bold">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-danger)] mb-1">Yanlış (Y)</label>
              <input type="number" id="hd-yanlis" min="0" value="${defYanlis}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-danger)] font-mono font-bold">
            </div>
            <div>
              <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Boş (B)</label>
              <input type="number" id="hd-bos" min="0" value="${defBos}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono font-bold">
            </div>
          </div>

          <div class="p-3 bg-[var(--color-paper-3)] rounded-[var(--radius-sm)] border border-[var(--color-rule)] flex items-center justify-between text-xs">
            <span class="text-[var(--color-ink-muted)]">Toplam Çözülen / Doğruluk:</span>
            <span id="hd-onizleme" class="font-mono font-bold text-[var(--color-ink)]">
              ${defDogru + defYanlis + defBos} Soru
            </span>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-muted)] mb-1">Öğrenci / Koç Notu (Opsiyonel)</label>
            <textarea id="hd-not" rows="2" placeholder="Örn: 2 soru boş bırakıldı, formül tekrarı yapılacak..." class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] resize-none">${defNot}</textarea>
          </div>

          <div class="flex items-center justify-between gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.openGorevModal('${ogr.id}', '${existing ? existing.id : ''}', '${konuId}', '${kaynakId}')" class="btn-tactile btn-tactile-ghost text-xs" title="Başlık, durum ve tüm ödev alanları için tam formu aç">
              <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
              <span>Detaylı Ödev Formu</span>
            </button>
            <div class="flex items-center gap-2">
              <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
              <button type="submit" class="btn-tactile btn-tactile-primary">Kaydet</button>
            </div>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const inputHedef = document.getElementById('hd-hedef');
    const inputDogru = document.getElementById('hd-dogru');
    const inputYanlis = document.getElementById('hd-yanlis');
    const inputBos = document.getElementById('hd-bos');
    const inputSure = document.getElementById('hd-sure');
    const inputNot = document.getElementById('hd-not');
    const inputDeadline = document.getElementById('hd-deadline');
    const preview = document.getElementById('hd-onizleme');

    const inputDurum = document.getElementById('hd-durum');
    let manualDurum = false;

    const updatePreview = () => {
      const h = Math.max(0, parseInt(inputHedef?.value) || 0);
      const d = Math.max(0, parseInt(inputDogru?.value) || 0);
      const y = Math.max(0, parseInt(inputYanlis?.value) || 0);
      const b = Math.max(0, parseInt(inputBos?.value) || 0);
      const coz = d + y + b;
      const pct = coz > 0 ? Math.round((d / coz) * 100) : 0;
      const kalan = Math.max(0, h - coz);
      if (preview) preview.textContent = `${coz} Soru (%${pct} Doğruluk) · Kalan hedef: ${kalan}`;

      // Durum önerisi — elle değiştirilmediyse soru girişine göre güncellenir.
      // Durum asla geriye alınmaz: 'tamamlandi' ve 'gecikti' elle değiştirilmedikçe korunur.
      if (inputDurum && !manualDurum && (inputDurum.value === 'bekliyor' || inputDurum.value === 'devam_ediyor')) {
        let oneri = 'bekliyor';
        if (coz > 0) {
          oneri = (h > 0 && coz < h) ? 'devam_ediyor' : 'tamamlandi';
        }
        inputDurum.value = oneri;
      }
    };

    [inputHedef, inputDogru, inputYanlis, inputBos].forEach(el => {
      if (el) el.addEventListener('input', updatePreview);
    });
    if (inputDurum) {
      inputDurum.addEventListener('change', () => { manualDurum = true; });
    }
    updatePreview();

    const form = document.getElementById('form-hucre-duzenle');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = parseInt(inputDogru?.value) || 0;
        const y = parseInt(inputYanlis?.value) || 0;
        const b = parseInt(inputBos?.value) || 0;
        const hedef = parseInt(inputHedef?.value) || (d + y + b);
        const sureDk = parseInt(inputSure?.value) || 0;
        const notVal = (inputNot?.value || '').trim();

        if (d < 0 || y < 0 || b < 0 || hedef < 0) {
          this.showToast('Soru sayıları negatif olamaz!');
          return;
        }

        const toplamCozulen = d + y + b;
        const hedefFinal = hedef > 0 ? hedef : toplamCozulen;
        const deadlineVal = (inputDeadline?.value || '').trim();

        // Durum formdaki seçimden alınır; soru girilmediyse bu bir "ödev atamasıdır"
        // ve bekleyen görev olarak kaydedilir (kartlardaki "Ödev Oluştur" ile aynı davranış).
        const durum = (inputDurum && inputDurum.value)
          ? inputDurum.value
          : (toplamCozulen > 0 ? 'tamamlandi' : 'bekliyor');

        if (existing) {
          Store.updateGorev(existing.id, {
            dogruSoru: d,
            yanlisSoru: y,
            cozulenSoru: toplamCozulen,
            hedefSoru: hedefFinal,
            sureDk,
            deadline: deadlineVal || existing.deadline || '',
            not: notVal,
            durum
          });
        } else {
          Store.addGorev({
            ogrenciId: ogr.id,
            konuId,
            kaynakId,
            dersId: konu.dersId,
            baslik: `${kaynak.yayinevi} - ${konu.konuAdi}`,
            hedefSoru: hedefFinal,
            cozulenSoru: toplamCozulen,
            dogruSoru: d,
            yanlisSoru: y,
            sureDk,
            deadline: deadlineVal,
            not: notVal,
            durum
          });
        }

        const kd = Store.getKonuDurumu(ogr.id, konuId);
        if (kd.durum === 'islenmedi') {
          Store.setKonuDurumu(ogr.id, konuId, 'calisiliyor', kd.not);
        }

        this.closeModal();
        this.showToast(durum === 'bekliyor'
          ? `Ödev atandı: ${konu.konuAdi} — ${kaynak.yayinevi}`
          : 'Hücre verisi başarıyla kaydedildi');
        this.renderCurrentView();
      });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────
  // MATRİS SÜTUN SEÇİCİ MODALI (G7: openMatrisSutunModal)
  // ─────────────────────────────────────────────────────────────
  openMatrisSutunModal() {
    const ogr = Store.getAktifOgrenci();
    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }

    const modKaynaklar = Store.getKaynaklar(ogr.modulId);
    const tumKaynaklar = modKaynaklar.length > 0 ? modKaynaklar : Store.getKaynaklar();
    const seciliSet = new Set(Array.isArray(ogr.seciliKaynaklar) ? ogr.seciliKaynaklar : []);

    // Benzersiz yayınevleri ve türler
    const yayinevleri = Array.from(new Set(tumKaynaklar.map(k => k.yayinevi).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr'));
    const turler = Array.from(new Set(tumKaynaklar.map(k => k.tur).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr'));

    const html = `
      <div class="space-y-4">
        <!-- Başlık -->
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)] flex items-center gap-2">
              <i data-lucide="columns" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <span>Matris Kaynak Sütunları</span>
            </h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Çalışma matrisinde görüntülenecek kaynak sütunlarını seçin (En az 1, en fazla 8 sütun).</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-matris-sutunlar" class="space-y-3 text-xs">
          <!-- Arama & Filtreleme Kontrolleri -->
          <div class="space-y-2 bg-[var(--color-paper-2)] p-2.5 rounded-[var(--radius-md)] border border-[var(--color-rule)]">
            <!-- Arama Kutusu -->
            <div class="relative">
              <i data-lucide="search" class="w-3.5 h-3.5 text-[var(--color-ink-faint)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input type="text" id="matris-kaynak-search" placeholder="Kaynak adı veya yayınevi ara..."
                class="w-full pl-8 pr-7 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] text-xs focus:outline-none focus:border-[var(--color-accent)]">
              <button type="button" id="matris-kaynak-search-clear" class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Filtreler: Yayınevi, Tür, ve Sadece Seçilenler -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <select id="matris-kaynak-filter-yayinevi" class="select-instrument text-[11px] py-1 px-2 w-full">
                  <option value="">Tüm Yayınevleri (${yayinevleri.length})</option>
                  ${yayinevleri.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>
              <div>
                <select id="matris-kaynak-filter-tur" class="select-instrument text-[11px] py-1 px-2 w-full">
                  <option value="">Tüm Türler (${turler.length})</option>
                  ${turler.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] cursor-pointer text-[11px] select-none hover:border-[var(--color-rule-strong)] transition-colors h-[28px]">
                  <span class="text-[var(--color-ink)] font-medium text-[11px]">Sadece Seçilenler</span>
                  <input type="checkbox" id="matris-kaynak-filter-secili" class="rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]">
                </label>
              </div>
            </div>
          </div>

          <!-- Seçim Sayacı ve Bilgilendirme -->
          <div class="flex items-center justify-between px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)]/60 border border-[var(--color-rule)] text-[11px]">
            <div class="flex items-center gap-1.5">
              <span class="text-[var(--color-ink-muted)]">Seçilen Sütun:</span>
              <span id="matris-secili-sayac" class="font-mono font-bold text-[var(--color-accent)]">${seciliSet.size}</span>
              <span class="text-[var(--color-ink-faint)]">/ 8</span>
              <span id="matris-sutun-uyari" class="ml-2 text-rose-500 font-semibold hidden"></span>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" id="matris-secim-temizle" class="text-[11px] text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] underline cursor-pointer">
                Seçimleri Kaldır
              </button>
            </div>
          </div>

          <!-- Kaynak Listesi -->
          <div id="matris-kaynak-listesi" class="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            ${tumKaynaklar.map(k => {
              const isChecked = seciliSet.has(k.id);
              return `
                <label class="matris-kaynak-item p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] flex items-center justify-between cursor-pointer transition-colors"
                  data-id="${k.id}"
                  data-ad="${k.ad}"
                  data-yayinevi="${k.yayinevi}"
                  data-tur="${k.tur || ''}">
                  <div class="flex items-center gap-3 min-w-0">
                    <input type="checkbox" name="matris-kaynak" value="${k.id}" ${isChecked ? 'checked' : ''} class="w-4 h-4 rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] shrink-0">
                    <div class="min-w-0">
                      <div class="font-semibold text-xs text-[var(--color-ink)] truncate flex items-center gap-2">
                        <span>${k.yayinevi}</span>
                        ${k.tur ? `<span class="meta-pill text-[9px] px-1.5 py-0 font-normal">${k.tur}</span>` : ''}
                      </div>
                      <div class="text-[11px] text-[var(--color-ink-muted)] truncate">${k.ad}</div>
                    </div>
                  </div>
                  <span class="meta-pill text-[10px] font-mono shrink-0 ml-2">Kaynak</span>
                </label>
              `;
            }).join('')}
            <div id="matris-kaynak-bos" class="hidden p-6 text-center text-xs text-[var(--color-ink-muted)] space-y-1">
              <i data-lucide="search-x" class="w-6 h-6 mx-auto text-[var(--color-ink-faint)]"></i>
              <p>Arama veya filtre kriterine uygun kaynak bulunamadı.</p>
            </div>
          </div>

          <!-- Alt Butonlar -->
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

    // Event Dinleyicileri
    const searchInput = document.getElementById('matris-kaynak-search');
    const searchClear = document.getElementById('matris-kaynak-search-clear');
    const filterYayinevi = document.getElementById('matris-kaynak-filter-yayinevi');
    const filterTur = document.getElementById('matris-kaynak-filter-tur');
    const filterSecili = document.getElementById('matris-kaynak-filter-secili');
    const sayacEl = document.getElementById('matris-secili-sayac');
    const uyariEl = document.getElementById('matris-sutun-uyari');
    const btnTemizle = document.getElementById('matris-secim-temizle');
    const bosEl = document.getElementById('matris-kaynak-bos');
    const form = document.getElementById('form-matris-sutunlar');

    const updateCounter = () => {
      const checkedBoxes = Array.from(form.querySelectorAll('input[name="matris-kaynak"]:checked'));
      const count = checkedBoxes.length;
      if (sayacEl) {
        sayacEl.textContent = count;
        if (count > 8) {
          sayacEl.className = 'font-mono font-bold text-rose-500';
          if (uyariEl) {
            uyariEl.textContent = '(Maksimum 8 sütun!)';
            uyariEl.classList.remove('hidden');
          }
        } else if (count === 0) {
          sayacEl.className = 'font-mono font-bold text-amber-500';
          if (uyariEl) {
            uyariEl.textContent = '(En az 1 sütun seçin)';
            uyariEl.classList.remove('hidden');
          }
        } else {
          sayacEl.className = 'font-mono font-bold text-[var(--color-accent)]';
          if (uyariEl) uyariEl.classList.add('hidden');
        }
      }
    };

    const applyFilter = () => {
      const q = (searchInput?.value || '').toLocaleLowerCase('tr-TR').trim();
      const seciliYay = (filterYayinevi?.value || '').toLocaleLowerCase('tr-TR').trim();
      const seciliTur = (filterTur?.value || '').toLocaleLowerCase('tr-TR').trim();
      const sadeceSecili = filterSecili?.checked || false;

      if (searchClear) {
        if (q.length > 0) searchClear.classList.remove('hidden');
        else searchClear.classList.add('hidden');
      }

      const items = Array.from(document.querySelectorAll('.matris-kaynak-item'));
      let gorunenSayisi = 0;

      items.forEach(item => {
        const ad = (item.getAttribute('data-ad') || '').toLocaleLowerCase('tr-TR');
        const yay = (item.getAttribute('data-yayinevi') || '').toLocaleLowerCase('tr-TR');
        const tur = (item.getAttribute('data-tur') || '').toLocaleLowerCase('tr-TR');
        const cb = item.querySelector('input[name="matris-kaynak"]');
        const isChecked = cb ? cb.checked : false;

        const matchesQ = !q || ad.includes(q) || yay.includes(q);
        const matchesYay = !seciliYay || yay === seciliYay;
        const matchesTur = !seciliTur || tur === seciliTur;
        const matchesSecili = !sadeceSecili || isChecked;

        if (matchesQ && matchesYay && matchesTur && matchesSecili) {
          item.classList.remove('hidden');
          gorunenSayisi++;
        } else {
          item.classList.add('hidden');
        }
      });

      if (bosEl) {
        if (gorunenSayisi === 0) bosEl.classList.remove('hidden');
        else bosEl.classList.add('hidden');
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
    }
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        applyFilter();
        if (searchInput) searchInput.focus();
      });
    }
    if (filterYayinevi) {
      filterYayinevi.addEventListener('change', applyFilter);
    }
    if (filterTur) {
      filterTur.addEventListener('change', applyFilter);
    }
    if (filterSecili) {
      filterSecili.addEventListener('change', applyFilter);
    }

    if (btnTemizle) {
      btnTemizle.addEventListener('click', () => {
        const checkedBoxes = form.querySelectorAll('input[name="matris-kaynak"]:checked');
        checkedBoxes.forEach(cb => { cb.checked = false; });
        updateCounter();
        if (filterSecili?.checked) applyFilter();
      });
    }

    form.querySelectorAll('input[name="matris-kaynak"]').forEach(cb => {
      cb.addEventListener('change', () => {
        updateCounter();
        if (filterSecili?.checked) applyFilter();
      });
    });

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkedBoxes = Array.from(form.querySelectorAll('input[name="matris-kaynak"]:checked'));
        const selectedIds = checkedBoxes.map(cb => cb.value);

        if (selectedIds.length === 0) {
          this.showToast('En az 1 kaynak sütunu seçmelisiniz.');
          return;
        }
        if (selectedIds.length > 8) {
          this.showToast('En fazla 8 kaynak sütunu seçebilirsiniz.');
          return;
        }

        Store.updateOgrenci(ogr.id, { seciliKaynaklar: selectedIds });
        this.closeModal();
        this.showToast('Kaynak sütunları güncellendi');
        this.renderCurrentView();
      });
    }

    if (window.lucide) lucide.createIcons();
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
    if (ogrId) {
      Store.setAktifOgrenci(ogrId);
      this.populateStudentDropdown();
      this.updateGlobalBadges();
    }
    this.renderReport();
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

  setReportPreviewMode(mode) {
    this.reportPreviewMode = mode;
    this.renderReport();
  },

  renderReport() {
    const container = document.getElementById('view-report');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    if (Store.data.aktifOgrenciId && allStudents.some(o => o.id === Store.data.aktifOgrenciId)) {
      this.reportSelectedOgrenciId = Store.data.aktifOgrenciId;
    } else if (!this.reportSelectedOgrenciId && allStudents.length > 0) {
      this.reportSelectedOgrenciId = allStudents[0].id;
    }

    const ogr = Store.getOgrenci(this.reportSelectedOgrenciId);
    const isSlip = this.reportAktifSablon === 'slip';
    const isA4Preview = this.reportPreviewMode === 'a4';

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Şablon Seçici & Görünüm Modu -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center p-1 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <button onclick="App.setReportSablon('slip')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${isSlip ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="clipboard-list" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Haftalık Ödev Fişi
              </button>
              <button onclick="App.setReportSablon('full')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${!isSlip ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="graduation-cap" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Akademik Karne
              </button>
            </div>

            <div class="flex items-center p-1 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <button onclick="App.setReportPreviewMode('ui')" class="px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${!isA4Preview ? 'bg-[var(--color-accent)] text-white shadow-xs' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="layout-dashboard" class="w-3.5 h-3.5 inline-block mr-1"></i>Ekran Görünümü
              </button>
              <button onclick="App.setReportPreviewMode('a4')" class="px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${isA4Preview ? 'bg-[var(--color-accent)] text-white shadow-xs' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="file-check-2" class="w-3.5 h-3.5 inline-block mr-1"></i>A4 Baskı Önizleme
              </button>
            </div>
          </div>

          <!-- Sağ Kısım: Yazdır -->
          <div class="flex items-center gap-2.5">
            ${!isSlip ? `
              <label class="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] cursor-pointer select-none bg-[var(--color-paper-3)] px-2.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-rule)] hover:text-[var(--color-ink)]" title="Yazdırırken konuların detay dökümünü de 2. sayfadan itibaren rapora ekler">
                <input type="checkbox" id="chk-report-print-konular" ${this.reportPrintKonuDetay ? 'checked' : ''} onchange="App.reportPrintKonuDetay = this.checked; if (App.reportPreviewMode === 'a4') App.renderReport();" class="rounded border-[var(--color-rule)]">
                <span>Konu Detaylarını Yazdır</span>
              </label>
            ` : ''}
            <button onclick="App.printAktifRapor()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 shadow-sm">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Yazdır (A4)</span>
            </button>
          </div>
        </div>

        <!-- Bölüm 2: Canlı Uygulama Görünümü veya A4 Baskı Önizleme -->
    `;

    if (!ogr) {
      html += `
        <div class="w-full p-12 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] space-y-4">
          <i data-lucide="file-question" class="w-12 h-12 text-[var(--color-ink-faint)] mx-auto"></i>
          <h3 class="font-display font-bold text-lg text-[var(--color-ink)]">Önizlenecek Öğrenci Bulunamadı</h3>
          <p class="text-sm text-[var(--color-ink-muted)]">Rapor oluşturmak için lütfen yukarıdan bir öğrenci seçin veya yeni öğrenci kaydı ekleyin.</p>
        </div>
      </div>`;
    } else if (isA4Preview) {
      const a4Html = isSlip
        ? this.renderReportSlipHTML(ogr)
        : this.renderReportFullHTML(ogr, Boolean(this.reportPrintKonuDetay));
      html += `
        <div id="cizelge-preview-area" class="w-full max-w-[900px] mx-auto space-y-6">
          ${a4Html}
        </div>
      </div>`;
    } else {
      const appUIHtml = isSlip ? this.renderReportSlipAppUI(ogr) : this.renderReportFullAppUI(ogr);
      html += `
        <div id="report-app-content" class="space-y-6 pb-12">
          ${appUIHtml}
        </div>
      </div>`;
    }

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // RAPOR UYGULAMA ARAYÜZÜ: HAFTALIK ÖDEV FİŞİ (EKRAN GÖRÜNÜMÜ)
  // ─────────────────────────────────────────────────────────────
  renderReportSlipAppUI(ogr) {
    const koc = Store.getKocProfili() || {};
    const kocAd = (koc.ad || 'Eğitim') + ' ' + (koc.soyad || 'Koçu');
    const kocUnvan = koc.unvan || 'Eğitim Koçu';
    const kocKurum = koc.kurum ? ` · ${koc.kurum}` : '';

    const modul = Store.getModulForOgrenci(ogr);
    const modulAd = modul ? modul.ad : (ogr.modulId || 'Müfredat');
    const tarihAraligi = this.getThisWeekDateRangeStr();

    const tumGorevler = Store.getGorevler(ogr.id);
    const aktifGorevler = Store.getAktifGorevler(ogr.id);
    const gorevler = aktifGorevler.length > 0 ? tumGorevler : tumGorevler;
    const toplamGorev = gorevler.length;
    const toplamHedefSoru = gorevler.reduce((acc, g) => acc + (Number(g.hedefSoru) || 0), 0);
    const toplamSureDk = gorevler.reduce((acc, g) => acc + (Number(g.sureDk) || 0), 0);
    const tamamlananSayisi = gorevler.filter(g => g.durum === 'tamamlandi').length;
    const tamamlanmaPct = toplamGorev > 0 ? Math.round((tamamlananSayisi / toplamGorev) * 100) : 0;

    const sureSaat = Math.floor(toplamSureDk / 60);
    const sureDkKalan = toplamSureDk % 60;
    const sureMetin = sureSaat > 0 
      ? (sureDkKalan > 0 ? `${sureSaat} sa ${sureDkKalan} dk` : `${sureSaat} saat`) 
      : (toplamSureDk > 0 ? `${toplamSureDk} dk` : '—');

    return `
      <!-- Öğrenci & Dönem Bilgi Kartı -->
      <div class="p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule)]">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-display font-black text-lg flex items-center justify-center border border-[var(--color-accent)]/20 shadow-xs">
              ${(ogr.ad || 'Ö')[0]}${(ogr.soyad || '')[0] || ''}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold font-display tracking-tight text-[var(--color-ink)]">${ogr.ad} ${ogr.soyad}</h2>
                <span class="meta-pill">${ogr.sinif ? ogr.sinif + '. Sınıf' : 'Öğrenci'}</span>
              </div>
              <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">${ogr.okul || 'Okul Belirtilmedi'} · <span class="font-medium text-[var(--color-ink)]">${modulAd}</span></p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 md:text-right">
            <div class="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
              <span class="block text-[10px] uppercase font-bold text-[var(--color-ink-faint)]">Çalışma Haftası</span>
              <span class="text-xs font-semibold text-[var(--color-ink)]">${tarihAraligi}</span>
            </div>
            <div class="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
              <span class="block text-[10px] uppercase font-bold text-[var(--color-ink-faint)]">Koç</span>
              <span class="text-xs font-semibold text-[var(--color-ink)]">${kocAd}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Hedef / Alan</span>
            <span class="text-xs font-semibold text-[var(--color-ink)] truncate block" title="${ogr.hedef || '—'}">${ogr.hedef || 'Belirtilmedi'}</span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Sorumlu Koç</span>
            <span class="text-xs font-semibold text-[var(--color-ink)] truncate block">${kocUnvan}${kocKurum}</span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Fiş Durumu</span>
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ${aktifGorevler.length} Aktif / ${toplamGorev} Toplam Görev
            </span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Haftalık Tamamlama</span>
            <span class="text-xs font-mono font-bold text-[var(--color-ink)]">%${tamamlanmaPct} (${tamamlananSayisi}/${toplamGorev})</span>
          </div>
        </div>
      </div>

      <!-- 4 KPI İstatistik Kartı -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Toplam Görev</span>
            <i data-lucide="check-square" class="w-4 h-4 text-[var(--color-accent)]"></i>
          </div>
          <div class="text-2xl font-black font-mono text-[var(--color-ink)] mt-2">${toplamGorev}</div>
          <div class="text-[11px] text-[var(--color-ink-faint)] mt-1">Kayıtlı çalışma & ödevler</div>
        </div>

        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Hedef Soru</span>
            <i data-lucide="target" class="w-4 h-4 text-emerald-500"></i>
          </div>
          <div class="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">${toplamHedefSoru}</div>
          <div class="text-[11px] text-[var(--color-ink-faint)] mt-1">Toplam çözülecek soru adedi</div>
        </div>

        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Tahmini Süre</span>
            <i data-lucide="clock" class="w-4 h-4 text-blue-500"></i>
          </div>
          <div class="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-2">${sureMetin}</div>
          <div class="text-[11px] text-[var(--color-ink-faint)] mt-1">Planlanan çalışma süresi</div>
        </div>

        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Tamamlanma Oranı</span>
            <i data-lucide="percent" class="w-4 h-4 text-purple-500"></i>
          </div>
          <div class="text-2xl font-black font-mono text-[var(--color-ink)] mt-2">%${tamamlanmaPct}</div>
          <div class="w-full bg-[var(--color-paper-4)] h-1.5 rounded-full overflow-hidden mt-2">
            <div class="bg-[var(--color-accent)] h-full" style="width: ${tamamlanmaPct}%"></div>
          </div>
        </div>
      </div>

      <!-- Görevler Tablosu (Uygulama Arayüzü) -->
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div class="p-4 border-b border-[var(--color-rule)] flex items-center justify-between">
          <div>
            <h3 class="font-display font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <i data-lucide="list-checks" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <span>Görev & Soru Hedefleri Listesi</span>
            </h3>
            <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">Öğrenciye atanan ödev ve kaynak takibi</p>
          </div>
          <span class="meta-pill">${gorevler.length} Görev</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[var(--color-paper-3)] border-b border-[var(--color-rule)] font-semibold text-[var(--color-ink-muted)] text-[11px] uppercase tracking-wider">
                <th class="p-3 pl-4">Ders</th>
                <th class="p-3">Konu</th>
                <th class="p-3">Görev / Kaynak</th>
                <th class="p-3 text-center">Hedef Soru</th>
                <th class="p-3 text-center">Süre</th>
                <th class="p-3 text-center">Teslim</th>
                <th class="p-3 pr-4 text-center">Durum</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-rule)]/50">
              ${gorevler.length === 0 ? `
                <tr>
                  <td colspan="7" class="p-10 text-center text-[var(--color-ink-muted)] italic">
                    <i data-lucide="calendar-check-2" class="w-8 h-8 mx-auto text-[var(--color-ink-faint)] mb-2"></i>
                    Bu öğrenci için tanımlanmış ödev veya çalışma görevi bulunmuyor.
                  </td>
                </tr>
              ` : gorevler.map((g) => {
                const ders = Store.getDers(g.dersId);
                const konu = Store.getKonu(g.konuId);
                const kaynak = (Store.data.kaynaklar || []).find(k => k.id === g.kaynakId);
                const dersAd = ders ? ders.ad : 'Genel';
                const konuAd = konu ? konu.konuAdi : (g.baslik || '—');
                const kaynakAd = kaynak ? kaynak.ad : (g.kaynakId ? g.kaynakId : 'Bireysel Çalışma');
                
                let durumBadge = '';
                if (g.durum === 'tamamlandi') {
                  durumBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><i data-lucide="check" class="w-3 h-3"></i>Tamamlandı</span>';
                } else if (g.durum === 'devam_ediyor') {
                  durumBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"><i data-lucide="clock" class="w-3 h-3"></i>Devam Ediyor</span>';
                } else if (g.deadline && new Date(g.deadline) < new Date()) {
                  durumBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"><i data-lucide="alert-triangle" class="w-3 h-3"></i>Gecikti</span>';
                } else {
                  durumBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-semibold bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-rule)]"><i data-lucide="circle" class="w-3 h-3"></i>Beklemede</span>';
                }

                return `
                  <tr class="hover:bg-[var(--color-paper-3)]/40 transition-colors">
                    <td class="p-3 pl-4 font-bold text-[var(--color-ink)]">${dersAd}</td>
                    <td class="p-3 font-medium text-[var(--color-ink)]">${konuAd}</td>
                    <td class="p-3 text-[var(--color-ink-muted)]">${kaynakAd}</td>
                    <td class="p-3 text-center font-mono font-bold text-[var(--color-ink)]">${g.hedefSoru ? g.hedefSoru + ' Soru' : '—'}</td>
                    <td class="p-3 text-center font-mono text-[var(--color-ink-muted)]">${g.sureDk ? g.sureDk + ' dk' : '—'}</td>
                    <td class="p-3 text-center font-mono text-[var(--color-ink-muted)]">${App.formatDate(g.deadline)}</td>
                    <td class="p-3 pr-4 text-center">${durumBadge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Koçun Notu & Haftalık Hedef Kartı -->
      <div class="p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm space-y-3">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div class="flex items-center gap-2">
            <i data-lucide="message-square-quote" class="w-4 h-4 text-[var(--color-accent)]"></i>
            <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Koçun Notu & Haftalık Hedef</h3>
          </div>
          <span class="text-xs text-[var(--color-ink-faint)]">Öğrenciye Özel Tavsiye & Strateji</span>
        </div>
        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-3)]/60 border border-[var(--color-rule)] text-xs text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap ${ogr.kocNotu ? 'font-medium' : 'text-[var(--color-ink-muted)] italic'}">
          ${ogr.kocNotu || 'Bu hafta konu tekrarları ve günlük soru hedeflerine titizlikle uyulması hedeflenmektedir. Çözülemeyen sorular Hata Defterine işlenecektir.'}
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // RAPOR UYGULAMA ARAYÜZÜ: AKADEMİK KARNE (EKRAN GÖRÜNÜMÜ)
  // ─────────────────────────────────────────────────────────────
  renderReportFullAppUI(ogr) {
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

      const konuDetaylari = konular.map(k => {
        const kd = Store.getKonuDurumu(ogr.id, k.id);
        const dDurum = kd.durum || 'baslanmadi';
        if (dDurum === 'tamam') tamamCount++;
        else if (dDurum === 'tekrar_lazim') tekrarCount++;

        return {
          konu: k,
          durum: dDurum,
          not: kd.not || ''
        };
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
        sonNot,
        konuDetaylari
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

    // Aylık Alışkanlık & Rutin Disiplini
    const nowR = new Date();
    const rYil = nowR.getFullYear();
    const rAyIdx = nowR.getMonth();
    const rYilAyStr = `${rYil}-${String(rAyIdx + 1).padStart(2, '0')}`;
    const rAyAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const rAyAdi = rAyAdlari[rAyIdx];
    const rDaysCount = new Date(rYil, rAyIdx + 1, 0).getDate();

    const reportAliskanliklar = Store.getAliskanliklar(ogr.id);
    let totalAliskanlikYuzde = 0;
    const aliskanlikRaporItems = reportAliskanliklar.map(al => {
      const aySonu = Store.getAliskanlikAySonu(ogr.id, al.id, rYilAyStr);
      let doneCount = 0;
      if (aySonu && aySonu.gun !== undefined && aySonu.gun !== null && aySonu.gun !== '') {
        doneCount = Number(aySonu.gun);
      } else {
        for (let d = 1; d <= rDaysCount; d++) {
          const tStr = `${rYilAyStr}-${String(d).padStart(2, '0')}`;
          if (Store.getAliskanlikDurum(ogr.id, al.id, tStr)) doneCount++;
        }
      }
      const yuzde = Math.round((doneCount / rDaysCount) * 100);
      totalAliskanlikYuzde += yuzde;
      return {
        al,
        doneCount,
        yuzde,
        not: aySonu && aySonu.not ? aySonu.not : ''
      };
    });
    const ortalamaAliskanlikYuzde = reportAliskanliklar.length > 0 
      ? Math.round(totalAliskanlikYuzde / reportAliskanliklar.length) 
      : 0;
    const kocAliskanlikNotu = Store.getAliskanlikNot(ogr.id, rYilAyStr);

    return `
      <!-- Akademik Profil Başlık Kartı -->
      <div class="p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule)]">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-display font-black text-lg flex items-center justify-center border border-[var(--color-accent)]/20 shadow-xs">
              ${(ogr.ad || 'Ö')[0]}${(ogr.soyad || '')[0] || ''}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-bold font-display tracking-tight text-[var(--color-ink)]">${ogr.ad} ${ogr.soyad}</h2>
                <span class="meta-pill">${ogr.sinif ? ogr.sinif + '. Sınıf' : 'Öğrenci'}</span>
              </div>
              <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">${ogr.okul || 'Okul Belirtilmedi'} · <span class="font-medium text-[var(--color-ink)]">${modulAd}</span></p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2.5 md:text-right">
            <div class="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
              <span class="block text-[10px] uppercase font-bold text-[var(--color-ink-faint)]">Rapor Tarihi</span>
              <span class="text-xs font-semibold text-[var(--color-ink)]">${bugunTarih}</span>
            </div>
            <div class="px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
              <span class="block text-[10px] uppercase font-bold text-[var(--color-ink-faint)]">Danışman Koç</span>
              <span class="text-xs font-semibold text-[var(--color-ink)]">${kocAd}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Akademik Hedef</span>
            <span class="text-xs font-semibold text-[var(--color-ink)] truncate block" title="${ogr.hedef || '—'}">${ogr.hedef || 'Belirtilmedi'}</span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Koçluk Kurumu</span>
            <span class="text-xs font-semibold text-[var(--color-ink)] truncate block">${kocUnvan}${kocKurum}</span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Toplam Kayıtlı Ders</span>
            <span class="text-xs font-semibold text-[var(--color-ink)]">${dersler.length} Branş Dersi</span>
          </div>
          <div>
            <span class="text-[10px] uppercase font-bold text-[var(--color-ink-faint)] block">Rutin Disiplini</span>
            <span class="text-xs font-mono font-bold ${ortalamaAliskanlikYuzde >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">%${ortalamaAliskanlikYuzde} Devamlılık</span>
          </div>
        </div>
      </div>

      <!-- 4 KPI İstatistik Kartı -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Toplam Görev</span>
            <i data-lucide="layers" class="w-4 h-4 text-[var(--color-accent)]"></i>
          </div>
          <div class="text-2xl font-black font-mono text-[var(--color-ink)] mt-2">${allGorevler.length}</div>
          <div class="text-[11px] text-[var(--color-ink-faint)] mt-1">Dönem içi kayıtlı tüm ödevler</div>
        </div>

        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Tamamlanan</span>
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i>
          </div>
          <div class="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-2">${tamamlananGorevler.length}</div>
          <div class="text-[11px] text-[var(--color-ink-faint)] mt-1">Başarıyla teslim edilenler</div>
        </div>

        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Tamamlama Oranı</span>
            <i data-lucide="trending-up" class="w-4 h-4 text-blue-500"></i>
          </div>
          <div class="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-2">%${tamamlamaYuzde}</div>
          <div class="w-full bg-[var(--color-paper-4)] h-1.5 rounded-full overflow-hidden mt-2">
            <div class="bg-blue-600 h-full" style="width: ${tamamlamaYuzde}%"></div>
          </div>
        </div>

        <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex items-center justify-between text-[var(--color-ink-muted)]">
            <span class="text-[11px] font-semibold uppercase tracking-wider">Geciken Görev</span>
            <i data-lucide="alert-circle" class="w-4 h-4 ${gecikmisGorevler.length > 0 ? 'text-rose-500' : 'text-slate-400'}"></i>
          </div>
          <div class="text-2xl font-black font-mono ${gecikmisGorevler.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-ink-muted)]'} mt-2">${gecikmisGorevler.length}</div>
          <div class="text-[11px] text-[var(--color-ink-faint)] mt-1">${gecikmisGorevler.length > 0 ? 'Teslim süresi aşılmış ödev' : 'Tüm ödevler zamanında'}</div>
        </div>
      </div>

      <!-- Müfredat İzah Kartı -->
      <div class="p-4 rounded-[var(--radius-md)] bg-blue-500/10 border border-blue-500/20 text-xs text-[var(--color-ink)] space-y-1.5">
        <div class="flex flex-wrap items-center justify-between gap-2 font-bold">
          <span class="flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
            <i data-lucide="info" class="w-4 h-4 text-blue-600 dark:text-blue-400"></i>
            <span class="uppercase tracking-wide text-[11px]">Müfredat İlerleme Oranı & Deneme Sınavları Mantığı</span>
          </span>
          <span class="font-mono text-[11px] text-blue-800 dark:text-blue-200 bg-blue-500/15 px-2.5 py-0.5 rounded border border-blue-500/20">
            İlerleme (%) = (Tamamlanan Konu / Toplam Konu) × 100
          </span>
        </div>
        <p class="text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
          İlerleme oranı bir puan veya net ortalaması <strong>değildir</strong>; öğrencinin ilgili dersteki yıllık müfredat konularının ne kadarını başarıyla kavradığının göstergesidir. Bir deneme sınavında o konudan çıkan soruların tamamı doğru yapıldığında konu durumu otomatik olarak <strong>"Tamamlandı"</strong> olur ve ilerleme yüzdesi artar. Konudan 1 bile yanlış yapıldığında konu <strong>"Tekrar Lazım"</strong> (Kritik Eksik) haline gelir.
        </p>
      </div>

      <!-- Ders Bazlı Müfredat İlerleme Tablosu -->
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] shadow-sm overflow-hidden">
        <div class="p-4 border-b border-[var(--color-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="font-display font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
              <i data-lucide="book-open" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <span>Ders Bazlı Müfredat İlerleme Durumu</span>
            </h3>
            <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">Konu ayrıntılarını görmek için ders satırına tıklayın veya tümünü açın</p>
          </div>
          <div class="flex items-center gap-2.5">
            <button type="button" onclick="App.toggleAllReportKonular()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 flex items-center gap-1.5">
              <i data-lucide="chevrons-up-down" class="w-3.5 h-3.5"></i>
              <span>Tüm Detayları Aç / Kapat</span>
            </button>
            <span class="meta-pill">${dersler.length} Ders</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-[var(--color-paper-3)] border-b border-[var(--color-rule)] font-semibold text-[var(--color-ink-muted)] text-[11px] uppercase tracking-wider">
                <th class="p-3 pl-4">Ders</th>
                <th class="p-3 text-center w-24">Toplam Konu</th>
                <th class="p-3 text-center w-24">Tamamlanan</th>
                <th class="p-3 text-center w-24">Tekrar Lazım</th>
                <th class="p-3 w-44">İlerleme</th>
                <th class="p-3 pr-4 text-center w-24">Son Not</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-rule)]/50">
              ${dersRaporlari.length === 0 ? `
                <tr><td colspan="6" class="p-10 text-center text-[var(--color-ink-muted)] italic">Öğrencinin kayıtlı dersi bulunmuyor.</td></tr>
              ` : dersRaporlari.map((r) => {
                return `
                  <tr class="hover:bg-[var(--color-paper-3)]/60 transition-colors cursor-pointer" onclick="App.toggleReportDersKonular('${r.ders.id}')">
                    <td class="p-3 pl-4 font-bold text-[var(--color-ink)] flex items-center justify-between">
                      <span>${r.ders.ad}</span>
                      <span class="text-[10px] text-[var(--color-accent)] font-medium ml-2 flex items-center gap-1">
                        <span id="report-konu-icon-${r.ders.id}" class="report-konu-icon">▼</span>
                        <span>Detay (${r.totalKonu})</span>
                      </span>
                    </td>
                    <td class="p-3 text-center font-mono text-[var(--color-ink)]">${r.totalKonu}</td>
                    <td class="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">${r.tamamCount}</td>
                    <td class="p-3 text-center font-mono font-bold ${r.tekrarCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--color-ink-faint)]'}">${r.tekrarCount}</td>
                    <td class="p-3">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-[var(--color-paper-4)] rounded-full overflow-hidden">
                          <div class="h-full bg-[var(--color-accent)]" style="width: ${r.yuzde}%"></div>
                        </div>
                        <span class="font-mono font-bold text-[11px] text-[var(--color-ink)] w-8 text-right">%${r.yuzde}</span>
                      </div>
                    </td>
                    <td class="p-3 pr-4 text-center font-mono font-bold text-[var(--color-ink)]">${r.sonNot}</td>
                  </tr>

                  <!-- Akordeon Konu Detay Satırı -->
                  <tr id="report-konu-row-${r.ders.id}" class="report-konu-accordion hidden bg-[var(--color-paper-3)]/40 border-b border-[var(--color-rule)]">
                    <td colspan="6" class="p-3 sm:p-4">
                      <div class="border border-[var(--color-rule)] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-paper-2)] shadow-xs">
                        <div class="p-2.5 bg-[var(--color-paper-3)] border-b border-[var(--color-rule)] flex items-center justify-between text-xs">
                          <span class="font-bold text-[var(--color-ink)] flex items-center gap-1.5">
                            <i data-lucide="clipboard-check" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                            ${r.ders.ad} — Konu Kazanım Dökümü
                          </span>
                          <span class="text-[11px] text-[var(--color-ink-muted)] font-mono">${r.totalKonu} Konu (${r.tamamCount} Tamamlandı, ${r.tekrarCount} Tekrar Lazım)</span>
                        </div>
                        <table class="w-full text-left text-xs">
                          <thead>
                            <tr class="bg-[var(--color-paper-3)]/50 text-[var(--color-ink-muted)] border-b border-[var(--color-rule)] font-semibold text-[10px] uppercase tracking-wider">
                              <th class="p-2 pl-3 w-8 text-center border-r border-[var(--color-rule)]/50">#</th>
                              <th class="p-2 border-r border-[var(--color-rule)]/50">Konu Adı</th>
                              <th class="p-2 w-32 text-center border-r border-[var(--color-rule)]/50">Durum</th>
                              <th class="p-2">Son Deneme Başarısı / Koç Notu</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-[var(--color-rule)]/30">
                            ${r.konuDetaylari.length === 0 ? `
                              <tr><td colspan="4" class="p-4 text-center text-[var(--color-ink-faint)] italic">Bu derse ait konu tanımlanmamış.</td></tr>
                            ` : r.konuDetaylari.map((kdItem, kIdx) => {
                              let durumBadge = '';
                              if (kdItem.durum === 'tamam') {
                                durumBadge = '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">☑ Tamamlandı</span>';
                              } else if (kdItem.durum === 'tekrar_lazim') {
                                durumBadge = '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">⚠ Tekrar Lazım</span>';
                              } else if (kdItem.durum === 'calisiliyor') {
                                durumBadge = '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">⏳ Çalışılıyor</span>';
                              } else {
                                durumBadge = '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-paper-3)] text-[var(--color-ink-faint)] border border-[var(--color-rule)]">— Başlanmadı</span>';
                              }

                              return `
                                <tr class="hover:bg-[var(--color-paper-3)]/30 transition-colors">
                                  <td class="p-2 pl-3 text-center font-mono text-[var(--color-ink-faint)] text-[10px] border-r border-[var(--color-rule)]/50">${kIdx + 1}</td>
                                  <td class="p-2 font-medium text-[var(--color-ink)] border-r border-[var(--color-rule)]/50">${kdItem.konu.konuAdi}</td>
                                  <td class="p-2 text-center border-r border-[var(--color-rule)]/50">${durumBadge}</td>
                                  <td class="p-2 text-[11px] text-[var(--color-ink-muted)]">
                                    ${kdItem.not ? `<span class="font-medium text-[var(--color-ink)]">${kdItem.not}</span>` : '<span class="text-[var(--color-ink-faint)] italic">Henüz deneme kaydı veya not yok</span>'}
                                  </td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Aylık Alışkanlık & Rutin Disiplini Karnesi -->
      <div class="p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-rule)]">
          <div class="flex items-center gap-2">
            <i data-lucide="calendar-range" class="w-4 h-4 text-[var(--color-accent)]"></i>
            <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Aylık Alışkanlık Zinciri & Rutin Disiplini</h3>
            <span class="text-xs font-mono text-[var(--color-ink-faint)]">(${rAyAdi} ${rYil} • ${rDaysCount} Günlük Takip)</span>
          </div>
          <span class="inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded-[var(--radius-sm)] ${ortalamaAliskanlikYuzde >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}">
            Ortalama Devamlılık: %${ortalamaAliskanlikYuzde}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          ${aliskanlikRaporItems.length === 0 ? `
            <div class="col-span-full p-6 text-center text-xs text-[var(--color-ink-faint)] italic">Öğrenciye tanımlanmış aktif alışkanlık veya rutin zinciri bulunmuyor.</div>
          ` : aliskanlikRaporItems.map(item => `
            <div class="p-3 rounded-[var(--radius-md)] bg-[var(--color-paper-3)]/60 border border-[var(--color-rule)] flex flex-col justify-between">
              <div class="flex items-center justify-between gap-1 mb-1.5">
                <span class="font-bold text-[var(--color-ink)] truncate text-xs" title="${item.al.baslik}">${item.al.baslik}</span>
                <span class="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${item.yuzde >= 70 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'}">%${item.yuzde}</span>
              </div>
              <div class="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)] font-mono">
                <span>${item.doneCount} / ${rDaysCount} Gün</span>
                ${item.not ? `<span class="text-[var(--color-ink)] font-sans italic truncate max-w-[110px]" title="${item.not}">📌 ${item.not}</span>` : ''}
              </div>
              <div class="w-full h-1.5 bg-[var(--color-paper-4)] rounded-full overflow-hidden mt-2">
                <div class="h-full ${item.yuzde >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}" style="width: ${item.yuzde}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        ${kocAliskanlikNotu ? `
          <div class="p-3 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-xs text-[var(--color-ink)] flex items-start gap-2">
            <span class="font-bold text-[var(--color-ink)] shrink-0">Koç Değerlendirmesi:</span>
            <span class="italic text-[var(--color-ink-muted)]">${kocAliskanlikNotu}</span>
          </div>
        ` : ''}
      </div>

      <!-- 2 Sütunlu Alt Panel: Kritik Eksikler & Koç Değerlendirmesi -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Sol Kolon: Kritik Eksikler & Gecikmişler -->
        <div class="space-y-4">
          <!-- Kritik Eksik Konular -->
          <div class="p-4 rounded-[var(--radius-lg)] bg-rose-500/5 border border-rose-500/20 text-xs">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-rose-500/15">
              <span class="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i>
                Kritik Eksik Konular (Tekrar Lazım)
              </span>
              <span class="font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold">${kritikKonular.length} Konu</span>
            </div>
            ${kritikKonular.length === 0 ? `
              <div class="text-[var(--color-ink-muted)] italic">Harika! Tekrar gerektiren kritik eksik konu bulunmuyor.</div>
            ` : `
              <ul class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                ${kritikKonular.map(k => `
                  <li class="flex items-start gap-2 text-[var(--color-ink)]">
                    <span class="text-rose-500 font-bold shrink-0">•</span>
                    <span><strong>${k.dersAd}:</strong> ${k.konuAd} ${k.not ? `<span class="text-[10px] text-[var(--color-ink-muted)] font-mono">(${k.not})</span>` : ''}</span>
                  </li>
                `).join('')}
              </ul>
            `}
          </div>

          <!-- Gecikmiş Ödevler -->
          <div class="p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs">
            <div class="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-rule)]">
              <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-1.5">
                <i data-lucide="clock-alert" class="w-3.5 h-3.5 text-amber-500"></i>
                Gecikmiş Ödevler & Takip
              </span>
              <span class="font-mono text-[10px] ${gecikmisGorevler.length > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-[var(--color-ink-faint)]'}">${gecikmisGorevler.length} Ödev</span>
            </div>
            ${gecikmisGorevler.length === 0 ? `
              <div class="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                Harika! Gecikmiş ödev bulunmamaktadır.
              </div>
            ` : `
              <ul class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                ${gecikmisGorevler.slice(0, 6).map(g => {
                  const d = Store.getDers(g.dersId);
                  return `
                    <li class="flex items-center justify-between text-[var(--color-ink)] text-xs p-1.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)]/50">
                      <span><strong class="text-[var(--color-ink)]">${d ? d.ad : 'Ödev'}:</strong> ${g.baslik}</span>
                      <span class="text-rose-600 dark:text-rose-400 font-mono font-bold text-[10px]">Gecikti (${App.formatDate(g.deadline)})</span>
                    </li>
                  `;
                }).join('')}
              </ul>
            `}
          </div>
        </div>

        <!-- Sağ Kolon: Koçun Genel Değerlendirmesi -->
        <div class="p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex flex-col justify-between text-xs space-y-4">
          <div class="space-y-3">
            <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
              <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-1.5">
                <i data-lucide="user-check" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                Koçun Genel Değerlendirmesi
              </span>
              <span class="text-[11px] text-[var(--color-ink-faint)]">${kocAd}</span>
            </div>
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)]/60 border border-[var(--color-rule)] text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap ${ogr.kocNotu ? 'font-medium' : 'text-[var(--color-ink-muted)] italic'}">
              ${ogr.kocNotu || 'Öğrencinin haftalık çalışma performansı ve konu anlama düzeyleri düzenli takip edilmektedir. Soru çözümlerinde hız ve dikkat unsurlarına odaklanılacaktır.'}
            </div>
          </div>
          <div class="pt-3 border-t border-[var(--color-rule)] text-[11px] text-[var(--color-ink-faint)]">
            <span>* Bu rapor öğrencinin bireysel gelişim takibi amacıyla eğitim koçu tarafından hazırlanmıştır.</span>
          </div>
        </div>
      </div>
    `;
  },

  renderReportSlipHTML(ogr) {
    const koc = Store.getKocProfili() || {};
    const kocAd = (koc.ad || 'Eğitim') + ' ' + (koc.soyad || 'Koçu');
    const kocUnvan = koc.unvan || 'Eğitim Koçu';
    const kocKurum = koc.kurum ? ` · ${koc.kurum}` : '';

    const modul = Store.getModulForOgrenci(ogr);
    const modulAd = modul ? modul.ad : (ogr.modulId || 'Müfredat');
    const tarihAraligi = this.getThisWeekDateRangeStr();

    const tumGorevler = Store.getGorevler(ogr.id);
    const aktifGorevler = Store.getAktifGorevler(ogr.id);
    const gorevler = (aktifGorevler.length > 0 ? aktifGorevler : tumGorevler).slice(0, 15);
    const minRows = 14;
    const padCount = Math.max(0, minRows - gorevler.length);
    const totalRows = gorevler.length + padCount;
    const rowHeight = Math.max(32, Math.min(42, Math.floor(540 / Math.max(1, totalRows))));

    return `
      <div class="print-page-dikey print-single-page text-slate-900 leading-normal" style="display: flex; flex-direction: column; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box;">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- Üst Başlık Bandı -->
          <div class="flex items-start justify-between border-b-2 border-slate-900 pb-2.5">
            <div class="space-y-0.5">
              <div class="font-bold text-sm text-slate-900 tracking-tight uppercase">${kocAd}</div>
              <div class="text-[11px] text-slate-600">${kocUnvan}${kocKurum}</div>
            </div>
            <div class="text-center">
              <h1 class="font-black text-lg tracking-tight uppercase text-slate-900">HAFTALIK ÇALIŞMA & ÖDEV FİŞİ</h1>
              <span class="inline-block px-2.5 py-0.5 mt-0.5 text-[10px] font-semibold bg-slate-100 text-slate-800 rounded border border-slate-300">Haftalık Görev ve Soru Takip Formu</span>
            </div>
            <div class="text-right space-y-0.5">
              <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dönem / Hafta</div>
              <div class="text-xs font-bold text-slate-900 font-mono">${tarihAraligi}</div>
            </div>
          </div>

          <!-- Öğrenci Bilgi Bandı -->
          <div class="grid grid-cols-5 gap-3 p-2.5 bg-slate-50 rounded border border-slate-300 text-xs">
            <div>
              <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Öğrenci Adı Soyadı</span>
              <span class="font-bold text-slate-900 text-xs">${ogr.ad} ${ogr.soyad}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Sınıf / Kademe</span>
              <span class="font-semibold text-slate-900">${ogr.sinif ? ogr.sinif + '. Sınıf' : '—'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Okul</span>
              <span class="font-semibold text-slate-900 truncate block">${ogr.okul || '—'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Modül</span>
              <span class="font-bold text-slate-900">${modulAd}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Hedef</span>
              <span class="font-semibold text-slate-900 truncate block">${ogr.hedef || '—'}</span>
            </div>
          </div>

          <!-- Görevler Tablosu -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-800">Bu Haftanın Görev & Soru Hedefleri (${gorevler.length} Kayıtlı Görev)</h2>
              <span class="text-[10px] text-slate-500 italic">Tamamlanan görevlerin kutucuğunu işaretleyiniz</span>
            </div>
            <table class="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr class="bg-slate-100 text-slate-800 border-b-2 border-slate-300 font-bold text-[11px]">
                  <th class="py-1.5 px-2 border-r border-slate-300 text-center w-8">#</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 w-28">Ders</th>
                  <th class="py-1.5 px-2 border-r border-slate-300">Konu / Kazanım</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 w-36">Görev / Kaynak</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 text-center w-20">Hedef Soru</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 text-center w-20">Teslim</th>
                  <th class="py-1.5 px-2 text-center w-16">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${gorevler.map((g, idx) => {
                  const ders = Store.getDers(g.dersId);
                  const konu = Store.getKonu(g.konuId);
                  const kaynak = (Store.data.kaynaklar || []).find(k => k.id === g.kaynakId);
                  const dersAd = ders ? ders.ad : 'Genel';
                  const konuAd = konu ? konu.konuAdi : (g.baslik || '—');
                  const kaynakAd = kaynak ? `${kaynak.yayinevi ? kaynak.yayinevi + ' ' : ''}${kaynak.ad}` : (g.kaynakId ? g.kaynakId : 'Bireysel Çalışma');
                  const bgClass = idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white';
                  const isDone = g.durum === 'tamamlandi';

                  return `
                    <tr class="border-b border-slate-200 ${bgClass}" style="height: ${rowHeight}px;">
                      <td class="px-1.5 border-r border-slate-300 text-center font-mono text-[10.5px] text-slate-500">${idx + 1}</td>
                      <td class="px-2 border-r border-slate-300 font-bold text-slate-900 text-[11px]">${dersAd}</td>
                      <td class="px-2 border-r border-slate-300 text-slate-800 font-medium text-[11px] leading-tight">${konuAd}</td>
                      <td class="px-2 border-r border-slate-300 text-slate-700 text-[10.5px] leading-tight">${kaynakAd}</td>
                      <td class="px-2 border-r border-slate-300 text-center font-mono font-bold text-slate-900 text-[11px]">${g.hedefSoru ? g.hedefSoru + ' Soru' : '—'}</td>
                      <td class="px-2 border-r border-slate-300 text-center font-mono text-slate-700 text-[10.5px]">${App.formatDate(g.deadline)}</td>
                      <td class="px-2 text-center">
                        <div style="width:17px; height:17px; border:1.8px solid ${isDone ? '#15803d' : '#475569'}; border-radius:3px; margin:0 auto; background:${isDone ? '#dcfce7' : '#ffffff'}; color:#15803d; font-weight:800; font-size:12px; line-height:14px;">${isDone ? '✓' : ''}</div>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${Array.from({ length: padCount }).map((_, i) => {
                  const rowNo = gorevler.length + i + 1;
                  const bgClass = (rowNo - 1) % 2 === 1 ? 'bg-slate-50/50' : 'bg-white';
                  return `
                    <tr class="border-b border-slate-200 ${bgClass}" style="height: ${rowHeight}px;">
                      <td class="px-1.5 border-r border-slate-300 text-center font-mono text-[10.5px] text-slate-300">${rowNo}</td>
                      <td class="px-2 border-r border-slate-300"></td>
                      <td class="px-2 border-r border-slate-300"></td>
                      <td class="px-2 border-r border-slate-300"></td>
                      <td class="px-2 border-r border-slate-300"></td>
                      <td class="px-2 border-r border-slate-300"></td>
                      <td class="px-2 text-center">
                        <div style="width:17px; height:17px; border:1.5px solid #cbd5e1; border-radius:3px; margin:0 auto; background:#ffffff;"></div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alt Bölüm: Koçun Notu & İmza Bandı -->
        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
          <div class="p-3 bg-slate-50 rounded border border-slate-300">
            <div class="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between mb-1.5">
              <span>Koçun Notu & Haftalık Hedef</span>
              <span class="text-[9.5px] text-slate-500 font-normal italic">Öğrenciye özel çalışma tavsiyeleri ve ek notlar</span>
            </div>
            <div class="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap ${ogr.kocNotu ? 'font-medium' : 'text-slate-500 italic'}">
              ${ogr.kocNotu || 'Bu hafta konu tekrarları ve günlük soru hedeflerine titizlikle uyulması hedeflenmektedir. Çözülemeyen sorular Hata Defterine işlenecektir.'}
            </div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px; margin-top: 4px;"></div>
            <div style="border-bottom: 1px dashed #cbd5e1; height: 18px;"></div>
          </div>

          <div class="pt-3 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
            <div class="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-800 text-[11px]">Öğrenci / Veli Onayı</div>
                <div class="text-[9.5px] text-slate-500">Haftalık ödev planı incelenmiştir.</div>
              </div>
              <div class="border-b border-dashed border-slate-400 w-36 h-6"></div>
            </div>
            <div class="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
              <div>
                <div class="font-bold text-slate-800 text-[11px]">Eğitim Koçu: <span class="text-slate-900">${kocAd}</span></div>
                <div class="text-[9.5px] text-slate-500">${kocUnvan}</div>
              </div>
              <div class="border-b border-dashed border-slate-400 w-36 h-6"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderReportFullHTML(ogr, printWithKonular = false) {
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

      const konuDetaylari = konular.map(k => {
        const kd = Store.getKonuDurumu(ogr.id, k.id);
        const dDurum = kd.durum || 'baslanmadi';
        if (dDurum === 'tamam') tamamCount++;
        else if (dDurum === 'tekrar_lazim') tekrarCount++;

        return {
          konu: k,
          durum: dDurum,
          not: kd.not || ''
        };
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
        sonNot,
        konuDetaylari
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

    // Aylık Alışkanlık & Rutin Disiplini Hesaplaması
    const nowR = new Date();
    const rYil = nowR.getFullYear();
    const rAyIdx = nowR.getMonth();
    const rYilAyStr = `${rYil}-${String(rAyIdx + 1).padStart(2, '0')}`;
    const rAyAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const rAyAdi = rAyAdlari[rAyIdx];
    const rDaysCount = new Date(rYil, rAyIdx + 1, 0).getDate();

    const reportAliskanliklar = Store.getAliskanliklar(ogr.id);
    let totalAliskanlikYuzde = 0;
    const aliskanlikRaporItems = reportAliskanliklar.map(al => {
      const aySonu = Store.getAliskanlikAySonu(ogr.id, al.id, rYilAyStr);
      let doneCount = 0;
      if (aySonu && aySonu.gun !== undefined && aySonu.gun !== null && aySonu.gun !== '') {
        doneCount = Number(aySonu.gun);
      } else {
        for (let d = 1; d <= rDaysCount; d++) {
          const tStr = `${rYilAyStr}-${String(d).padStart(2, '0')}`;
          if (Store.getAliskanlikDurum(ogr.id, al.id, tStr)) doneCount++;
        }
      }
      const yuzde = Math.round((doneCount / rDaysCount) * 100);
      totalAliskanlikYuzde += yuzde;
      return {
        al,
        doneCount,
        yuzde,
        not: aySonu && aySonu.not ? aySonu.not : ''
      };
    });
    const ortalamaAliskanlikYuzde = reportAliskanliklar.length > 0 
      ? Math.round(totalAliskanlikYuzde / reportAliskanliklar.length) 
      : 0;
    const kocAliskanlikNotu = Store.getAliskanlikNot(ogr.id, rYilAyStr);

    const dersRowHeight = dersRaporlari.length <= 8 ? 30 : 24;

    const mainPageHtml = `
      <div class="print-page-dikey print-single-page ${printWithKonular ? 'print-page-break' : ''} text-slate-900 leading-normal" style="display: flex; flex-direction: column; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box;">
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <!-- Üst Kısım — Başlık & Koç Bilgisi -->
          <div class="flex items-start justify-between border-b-2 border-slate-900 pb-2.5">
            <div>
              <h1 class="font-black text-lg tracking-tight uppercase text-slate-900">AKADEMİK TAKİP & PERFORMANS RAPORU</h1>
              <div class="text-[11px] font-semibold text-slate-600">Rapor Tarihi: <span class="text-slate-900">${bugunTarih}</span> · Dönem: <span class="text-slate-900">${rAyAdi} ${rYil}</span></div>
            </div>
            <div class="text-right">
              <div class="font-bold text-xs text-slate-900 uppercase">${kocAd}</div>
              <div class="text-[10.5px] text-slate-600">${kocUnvan}${kocKurum}</div>
            </div>
          </div>

          <!-- Öğrenci Profil Bandı -->
          <div class="grid grid-cols-5 gap-2.5 p-2.5 bg-slate-50 rounded border border-slate-300 text-xs">
            <div>
              <span class="text-slate-500 block text-[9px] uppercase font-bold">Öğrenci Adı Soyadı</span>
              <span class="font-bold text-slate-900 text-xs">${ogr.ad} ${ogr.soyad}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9px] uppercase font-bold">Sınıf / Şube</span>
              <span class="font-semibold text-slate-900">${ogr.sinif ? ogr.sinif + '. Sınıf' : '—'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9px] uppercase font-bold">Okul</span>
              <span class="font-semibold text-slate-900 truncate block">${ogr.okul || '—'}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9px] uppercase font-bold">Modül</span>
              <span class="font-bold text-slate-900">${modulAd}</span>
            </div>
            <div>
              <span class="text-slate-500 block text-[9px] uppercase font-bold">Akademik Hedef</span>
              <span class="font-semibold text-slate-900 truncate block">${ogr.hedef || '—'}</span>
            </div>
          </div>

          <!-- 4 KPI Kutusu -->
          <div class="grid grid-cols-4 gap-2.5 text-center">
            <div class="p-2 bg-slate-50 rounded border border-slate-200">
              <span class="block text-[9.5px] font-bold uppercase text-slate-500">Toplam Görev</span>
              <span class="font-mono font-black text-base text-slate-900">${allGorevler.length}</span>
            </div>
            <div class="p-2 bg-slate-50 rounded border border-slate-200">
              <span class="block text-[9.5px] font-bold uppercase text-slate-500">Tamamlanan</span>
              <span class="font-mono font-black text-base text-emerald-700">${tamamlananGorevler.length}</span>
            </div>
            <div class="p-2 bg-slate-50 rounded border border-slate-200">
              <span class="block text-[9.5px] font-bold uppercase text-slate-500">Tamamlama Oranı</span>
              <span class="font-mono font-black text-base text-blue-700">%${tamamlamaYuzde}</span>
            </div>
            <div class="p-2 bg-slate-50 rounded border border-slate-200">
              <span class="block text-[9.5px] font-bold uppercase text-slate-500">Geciken Görev</span>
              <span class="font-mono font-black text-base ${gecikmisGorevler.length > 0 ? 'text-rose-700' : 'text-slate-700'}">${gecikmisGorevler.length}</span>
            </div>
          </div>

          <!-- Ders Bazlı İlerleme Tablosu -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-800">Ders Bazlı Müfredat İlerleme Durumu</h2>
              <span class="text-[10px] text-slate-500 font-semibold">Toplam ${dersler.length} Ders • İlerleme (%) = (Tamamlanan Konu / Toplam Konu) × 100</span>
            </div>
            <table class="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr class="bg-slate-100 text-slate-800 border-b-2 border-slate-300 font-bold text-[10.5px]">
                  <th class="py-1.5 px-2.5 border-r border-slate-300">Ders Adı</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 text-center w-24">Toplam Konu</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 text-center w-24">Tamamlanan</th>
                  <th class="py-1.5 px-2 border-r border-slate-300 text-center w-24">Tekrar Lazım</th>
                  <th class="py-1.5 px-2.5 border-r border-slate-300 w-40">İlerleme Oranı</th>
                  <th class="py-1.5 px-2 text-center w-20">Son Not</th>
                </tr>
              </thead>
              <tbody>
                ${dersRaporlari.length === 0 ? `
                  <tr><td colspan="6" class="p-4 text-center text-slate-500 italic bg-white">Öğrencinin kayıtlı dersi bulunmuyor.</td></tr>
                ` : dersRaporlari.map((r, idx) => {
                  const bg = idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white';
                  return `
                    <tr class="border-b border-slate-200 ${bg}" style="height: ${dersRowHeight}px;">
                      <td class="px-2.5 border-r border-slate-300 font-bold text-slate-900 text-[11px]">${r.ders.ad}</td>
                      <td class="px-2 border-r border-slate-300 text-center font-mono text-[11px]">${r.totalKonu}</td>
                      <td class="px-2 border-r border-slate-300 text-center font-mono font-bold text-emerald-700 text-[11px]">${r.tamamCount}</td>
                      <td class="px-2 border-r border-slate-300 text-center font-mono font-bold ${r.tekrarCount > 0 ? 'text-rose-600' : 'text-slate-400'} text-[11px]">${r.tekrarCount}</td>
                      <td class="px-2.5 border-r border-slate-300">
                        <div class="flex items-center gap-2">
                          <div class="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
                            <div class="h-full bg-blue-600" style="width: ${r.yuzde}%"></div>
                          </div>
                          <span class="font-mono font-bold text-[10.5px] text-slate-800 w-8 text-right">%${r.yuzde}</span>
                        </div>
                      </td>
                      <td class="px-2 text-center font-mono font-bold text-slate-900 text-[11px]">${r.sonNot}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Aylık Alışkanlık & Rutin Disiplini Karnesi -->
          <div class="p-2.5 bg-slate-50 border border-slate-300 rounded text-xs space-y-2">
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 uppercase tracking-wide text-[10.5px]">🎯 Aylık Alışkanlık Zinciri & Rutin Disiplini</span>
                <span class="font-mono text-[10px] text-slate-500 font-semibold">(${rAyAdi} ${rYil} • ${rDaysCount} Günlük Takip)</span>
              </div>
              <span class="font-mono font-bold text-[10.5px] px-2 py-0.5 rounded ${ortalamaAliskanlikYuzde >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                Ortalama Devamlılık: %${ortalamaAliskanlikYuzde}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-2">
              ${aliskanlikRaporItems.map(item => `
                <div class="p-2 bg-white rounded border border-slate-200 flex flex-col justify-between">
                  <div class="flex items-center justify-between gap-1 mb-0.5">
                    <span class="font-bold text-slate-800 truncate text-[10.5px]">${item.al.baslik}</span>
                    <span class="font-mono font-bold text-[10px] px-1 py-0.2 rounded ${item.yuzde >= 70 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}">%${item.yuzde}</span>
                  </div>
                  <div class="flex items-center justify-between text-[9.5px] text-slate-500 font-mono">
                    <span>${item.doneCount} / ${rDaysCount} Gün</span>
                    ${item.not ? `<span class="text-slate-600 font-sans italic truncate max-w-[85px]">📌 ${item.not}</span>` : ''}
                  </div>
                  <div class="w-full h-1.5 bg-slate-100 rounded overflow-hidden mt-1">
                    <div class="h-full ${item.yuzde >= 70 ? 'bg-emerald-600' : 'bg-amber-500'}" style="width: ${item.yuzde}%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>

            ${kocAliskanlikNotu ? `
              <div class="pt-1.5 border-t border-slate-200 text-[10.5px] text-slate-700 flex items-start gap-1.5">
                <span class="font-bold text-slate-900 shrink-0">Koç Notu:</span>
                <span class="italic text-slate-600">${kocAliskanlikNotu}</span>
              </div>
            ` : ''}
          </div>

          <!-- 2 Sütunlu Alt Panel: Kritik Eksikler + Koç Değerlendirmesi -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-2.5">
              <!-- Kritik Eksik Konular -->
              <div class="p-2.5 bg-rose-50/60 border border-rose-200 rounded text-xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10.5px] font-bold uppercase tracking-wider text-rose-800">Kritik Eksik Konular (Tekrar Lazım)</span>
                  <span class="font-mono text-[9.5px] font-bold text-rose-700">${kritikKonular.length} Konu</span>
                </div>
                ${kritikKonular.length === 0 ? `
                  <div class="text-slate-500 italic text-[10.5px]">Tekrar gerektiren kritik eksik konu bulunmuyor.</div>
                ` : `
                  <ul class="space-y-0.5 text-[10.5px]">
                    ${kritikKonular.slice(0, 6).map(k => `
                      <li class="flex items-start gap-1.5 text-slate-800">
                        <span class="text-rose-600 font-bold">•</span>
                        <span class="truncate"><strong>${k.dersAd}:</strong> ${k.konuAd}</span>
                      </li>
                    `).join('')}
                    ${kritikKonular.length > 6 ? `<li class="text-[9.5px] text-rose-700 font-semibold italic">+${kritikKonular.length - 6} konu daha takip listesindedir.</li>` : ''}
                  </ul>
                `}
              </div>

              <!-- Gecikmiş Ödevler -->
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                <span class="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 block mb-1">Gecikmiş Ödevler & Takip</span>
                ${gecikmisGorevler.length === 0 ? `
                  <div class="text-emerald-700 font-medium text-[10.5px]">✓ Gecikmiş ödev bulunmamaktadır.</div>
                ` : `
                  <ul class="space-y-0.5">
                    ${gecikmisGorevler.slice(0, 3).map(g => {
                      const d = Store.getDers(g.dersId);
                      return `
                        <li class="flex items-center justify-between text-slate-800 text-[10.5px]">
                          <span class="truncate"><strong class="text-slate-900">${d ? d.ad : 'Ödev'}:</strong> ${g.baslik}</span>
                          <span class="text-rose-600 font-mono font-bold text-[9.5px] shrink-0 ml-1">(${App.formatDate(g.deadline)})</span>
                        </li>
                      `;
                    }).join('')}
                  </ul>
                `}
              </div>
            </div>

            <!-- Sağ Kısım: Koçun Genel Değerlendirmesi -->
            <div class="p-3 bg-slate-50 rounded border border-slate-300 flex flex-col justify-between text-xs">
              <div class="space-y-1.5">
                <span class="text-[10.5px] font-bold uppercase tracking-wider text-slate-800 block">Koçun Genel Değerlendirmesi</span>
                <div class="text-[11px] text-slate-800 leading-relaxed whitespace-pre-wrap ${ogr.kocNotu ? 'font-medium' : 'text-slate-500 italic'}">
                  ${ogr.kocNotu || 'Öğrencinin haftalık çalışma performansı ve konu anlama düzeyleri düzenli takip edilmektedir. Soru çözümlerinde hız ve dikkat unsurlarına odaklanılacaktır.'}
                </div>
                <div style="border-bottom: 1px dashed #cbd5e1; height: 16px;"></div>
                <div style="border-bottom: 1px dashed #cbd5e1; height: 16px;"></div>
              </div>
              <div class="pt-2 border-t border-slate-200 text-[9.5px] text-slate-500 italic">
                * Bu rapor öğrencinin bireysel gelişim takibi amacıyla eğitim koçu tarafından hazırlanmıştır.
              </div>
            </div>
          </div>
        </div>

        <!-- En Alt — İmza Bandı -->
        <div class="pt-3 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div class="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
            <div>
              <div class="font-bold text-slate-800 text-[11px]">Veli Bilgilendirme ve Onay</div>
              <div class="text-[9.5px] text-slate-500">Rapor incelenmiş ve çalışma planı onaylanmıştır.</div>
            </div>
            <div class="border-b border-dashed border-slate-400 w-36 h-6"></div>
          </div>
          <div class="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
            <div>
              <div class="font-bold text-slate-800 text-[11px]">Koç Onayı: <span class="text-slate-900">${kocAd}</span></div>
              <div class="text-[9.5px] text-slate-500">${kocUnvan}</div>
            </div>
            <div class="border-b border-dashed border-slate-400 w-36 h-6"></div>
          </div>
        </div>
      </div>
    `;

    if (!printWithKonular) {
      return mainPageHtml;
    }

    // Ek Sayfalar: Konu Kazanım Detay Dökümü (printWithKonular === true ise)
    const detailPagesHtml = `
      <div class="print-page-dikey print-multi-page text-slate-900 leading-normal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box;">
        <div class="flex items-center justify-between border-b-2 border-slate-900 pb-2 mb-4">
          <div>
            <h2 class="font-black text-base uppercase text-slate-900">EK: DERS & KONU KAZANIM DETAY DÖKÜMÜ</h2>
            <p class="text-[10.5px] text-slate-600">Öğrenci: <strong>${ogr.ad} ${ogr.soyad}</strong> (${ogr.sinif ? ogr.sinif + '. Sınıf' : ''}) · Tarih: ${bugunTarih}</p>
          </div>
          <div class="text-right text-[10.5px] text-slate-600 font-semibold">${kocAd}</div>
        </div>

        <div class="space-y-4">
          ${dersRaporlari.map(r => `
            <div class="print-avoid-break border border-slate-300 rounded overflow-hidden bg-white">
              <div class="py-1.5 px-3 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-[11px]">
                <span class="font-bold text-slate-900">📋 ${r.ders.ad} — Konu Kazanım Dökümü</span>
                <span class="text-[10px] text-slate-600 font-mono font-semibold">${r.totalKonu} Konu (${r.tamamCount} Tamamlandı, ${r.tekrarCount} Tekrar Lazım, %${r.yuzde})</span>
              </div>
              <table class="w-full text-left text-[10.5px] border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[9.5px] uppercase">
                    <th class="py-1 px-2 w-8 text-center border-r border-slate-200">#</th>
                    <th class="py-1 px-2 border-r border-slate-200">Konu Adı</th>
                    <th class="py-1 px-2 w-28 text-center border-r border-slate-200">Durum</th>
                    <th class="py-1 px-2 w-64">Son Deneme Başarısı / Koç Notu</th>
                  </tr>
                </thead>
                <tbody>
                  ${r.konuDetaylari.map((kdItem, kIdx) => {
                    const kBg = kIdx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white';
                    let durumBadge = '— Başlanmadı';
                    let durumColor = 'color: #64748b;';
                    if (kdItem.durum === 'tamam') {
                      durumBadge = '☑ Tamamlandı';
                      durumColor = 'color: #15803d; font-weight: 700;';
                    } else if (kdItem.durum === 'tekrar_lazim') {
                      durumBadge = '⚠ Tekrar Lazım';
                      durumColor = 'color: #b91c1c; font-weight: 700;';
                    } else if (kdItem.durum === 'calisiliyor') {
                      durumBadge = '⏳ Çalışılıyor';
                      durumColor = 'color: #1d4ed8; font-weight: 700;';
                    }
                    return `
                      <tr class="border-b border-slate-100 ${kBg}">
                        <td class="py-1 px-2 text-center font-mono text-slate-400 text-[9.5px] border-r border-slate-200">${kIdx + 1}</td>
                        <td class="py-1 px-2 font-medium text-slate-900 border-r border-slate-200">${kdItem.konu.konuAdi}</td>
                        <td class="py-1 px-2 text-center border-r border-slate-200" style="${durumColor}">${durumBadge}</td>
                        <td class="py-1 px-2 text-[10px] text-slate-700">${kdItem.not || '<span class="text-slate-400 italic">—</span>'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return mainPageHtml + detailPagesHtml;
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
    const printWithKonular = this.reportPrintKonuDetay || false;
    const icerik = isSlip ? this.renderReportSlipHTML(ogr) : this.renderReportFullHTML(ogr, printWithKonular);

    const bugunStr = new Date().toISOString().split('T')[0];
    const safeName = `${ogr.ad}_${ogr.soyad}`.replace(/\s+/g, '_');
    const dosyaAdi = isSlip ? `HaftalikFis_${safeName}_${bugunStr}` : `AkademikKarne_${safeName}_${bugunStr}`;

    this.showToast(`Yazdırma başlatılıyor: ${dosyaAdi}`);
    PrintEngine.yazdir(icerik, { yatay: false, baslik: dosyaAdi });
  },

  // G16: Akademik raporda konu akordeonunu aç/kapat
  toggleReportDersKonular(dersId) {
    const row = document.getElementById(`report-konu-row-${dersId}`);
    const icon = document.getElementById(`report-konu-icon-${dersId}`);
    if (row) {
      row.classList.toggle('hidden');
      if (icon) {
        icon.textContent = row.classList.contains('hidden') ? '▼' : '▲';
      }
    }
  },

  toggleAllReportKonular(forceOpen = null) {
    const rows = document.querySelectorAll('.report-konu-accordion');
    const icons = document.querySelectorAll('.report-konu-icon');
    const shouldOpen = forceOpen !== null ? forceOpen : Array.from(rows).some(r => r.classList.contains('hidden'));
    rows.forEach(r => {
      if (shouldOpen) r.classList.remove('hidden');
      else r.classList.add('hidden');
    });
    icons.forEach(ic => {
      ic.textContent = shouldOpen ? '▲' : '▼';
    });
  },

  // ─────────────────────────────────────────────────────────────
  // VIEW: DENEME SINAVI RAPORU & ANALİZ (renderDenemeRaporu)
  // ─────────────────────────────────────────────────────────────
  onDenemeOgrenciChange(ogrId) {
    this.denemeSelectedOgrenciId = ogrId;
    const denemeler = Store.getDenemeSinavlari(ogrId);
    this.denemeSelectedSinavId = denemeler.length > 0 ? denemeler[0].id : '';
    this.denemeKarsilastirmaRefId = null;
    this.renderDenemeRaporu();
  },

  onDenemeSinavChange(sinavId) {
    this.denemeSelectedSinavId = sinavId;
    this.denemeKarsilastirmaRefId = null;
    this.renderDenemeRaporu();
  },

  onDenemeKarsilastirmaRefChange(refId) {
    this.denemeKarsilastirmaRefId = refId;
    this.renderDenemeRaporu();
  },

  triggerDenemeUpload() {
    const input = document.getElementById('input-import-deneme');
    if (input) input.click();
  },

  handleDenemeFile(file) {
    if (!file) return;

    ExcelEngine.denemeIceAktar(file, (res) => {
      if (!res || !res.basarili) {
        this.showToast('Dosya işlenirken hata oluştu: ' + (res?.hata || 'Bilinmeyen hata'));
        return;
      }

      const parsed = res.parsed;
      const aktifOgr = Store.getAktifOgrenci() || (Store.getOgrenciler().length > 0 ? Store.getOgrenciler()[0] : null);
      if (!aktifOgr) {
        this.showToast('Lütfen önce sisteme bir öğrenci ekleyin.');
        return;
      }

      this.openDenemeOnayModal(parsed, aktifOgr, file.name);
    });
  },

  openDenemeOnayModal(parsed, aktifOgr, dosyaAdi) {
    const isMulti = Array.isArray(parsed.exams) && parsed.exams.length > 1;
    const examsList = isMulti ? parsed.exams : [parsed];
    const firstExam = examsList[0] || parsed;

    const rawAdSoyad = String(firstExam.bilgi['Adı Soyadı'] || firstExam.bilgi['Soyadı - Adı'] || '').trim();
    const allStudents = Store.getOgrenciler();

    // Akıllı isim eşleştirme (örn. "ÖZDEMİR ŞEVİN ELFİN" -> "ŞEVİN ELFİN ÖZDEMİR")
    const cleanName = s => (s || '').toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    const matchedStudent = allStudents.find(o => {
      const oClean = cleanName(o.ad + ' ' + o.soyad);
      const oCleanRev = cleanName(o.soyad + ' ' + o.ad);
      const rawClean = cleanName(rawAdSoyad);
      return oClean === rawClean || oCleanRev === rawClean || 
             (rawClean.length > 5 && (rawClean.includes(oClean) || oClean.includes(rawClean)));
    });

    const targetOgr = matchedStudent || aktifOgr || Store.getAktifOgrenci() || (allStudents.length > 0 ? allStudents[0] : null);

    // G16: Sınavdaki derslerin öğrenci dersleriyle eşleşme kontrolü
    const examDersNames = Array.from(new Set([
      ...(firstExam.dersler || []).map(d => d.ders),
      ...(firstExam.konular || []).map(k => k.ders)
    ])).filter(Boolean);

    const dersEslestirmeleri = examDersNames.map(dName => {
      const matched = Store.findMatchingDers(dName, targetOgr, targetOgr?.sinif);
      return {
        denemeDers: dName,
        matchedDers: matched,
        matchedAd: matched ? matched.ad : null
      };
    });

    const html = `
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">
              ${isMulti ? `Deneme Sınavlarını İçe Aktar (${examsList.length} Adet)` : 'Deneme Sınavını İçe Aktar'}
            </h3>
            <p class="text-xs text-[var(--color-ink-muted)]">${dosyaAdi}</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Sınav Özet Kartı (Tekli veya Çoklu) -->
        <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-xs space-y-2.5">
          ${isMulti ? `
            <div class="flex items-center justify-between pb-1.5 border-b border-[var(--color-rule)]">
              <span class="font-bold text-xs text-[var(--color-ink)]">Tespit Edilen Sınavlar (${examsList.length} Adet):</span>
              <span class="meta-pill text-[10px] text-[var(--color-accent)] font-semibold">Çoklu Aktarım</span>
            </div>
            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              ${examsList.map((ex, i) => {
                const sAdi = ex.bilgi['Sınav Adı'] || `Deneme ${i + 1}`;
                const sTarih = ex.bilgi['Sınav Tarihi'] || '—';
                const sPuan = parseFloat(ex.bilgi['Puanı']) || 0;
                const dCount = ex.dersler ? ex.dersler.length : 0;
                const kCount = ex.konular ? ex.konular.length : 0;
                const tNet = ex.toplam ? ex.toplam.net : null;
                return `
                  <div class="p-2 rounded bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-between gap-2">
                    <div class="min-w-0">
                      <div class="font-bold text-[var(--color-ink)] truncate">${i + 1}. ${sAdi}</div>
                      <div class="text-[10px] text-[var(--color-ink-muted)] flex items-center gap-2 mt-0.5">
                        <span>📅 ${sTarih}</span>
                        <span>📝 ${dCount} Ders, ${kCount} Konu</span>
                        ${tNet !== null ? `<span class="font-mono text-emerald-600 font-bold">${tNet} Net</span>` : ''}
                      </div>
                    </div>
                    <div class="text-right shrink-0">
                      <span class="font-mono text-xs font-bold text-[var(--color-accent)]">${sPuan ? sPuan + ' Puan' : ''}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="flex items-center justify-between">
              <span class="font-bold text-[var(--color-ink)] text-sm">${firstExam.bilgi['Sınav Adı'] || 'Deneme Sınavı'}</span>
              <span class="font-mono text-[var(--color-accent)] font-bold text-sm">${parseFloat(firstExam.bilgi['Puanı']) ? parseFloat(firstExam.bilgi['Puanı']) + ' Puan' : ''}</span>
            </div>
            <div class="flex items-center gap-3 text-[11px] text-[var(--color-ink-muted)] flex-wrap">
              <span>📅 ${firstExam.bilgi['Sınav Tarihi'] || '—'}</span>
              <span>🏫 Şube / Grup: ${firstExam.bilgi['Grubu'] || firstExam.bilgi['Sınıf / Şube'] || '—'}</span>
              <span>📝 ${firstExam.dersler ? firstExam.dersler.length : 0} Ders, ${firstExam.konular ? firstExam.konular.length : 0} Konu</span>
              ${firstExam.toplam ? `<span class="font-mono text-emerald-600 font-bold">${firstExam.toplam.net} Net</span>` : ''}
            </div>
          `}
        </div>

        <!-- G16: Akıllı Ders Eşleştirme Önizleme Kartı -->
        <div class="p-3 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-xs space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-[var(--color-ink)] flex items-center gap-1.5">
              <i data-lucide="merge" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
              <span>Ders Eşleştirmeleri (${dersEslestirmeleri.length} Ders)</span>
            </span>
            <span class="meta-pill text-[10px] text-emerald-600 font-semibold bg-emerald-500/10">Mükerrer Ders Açılmaz ✓</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
            ${dersEslestirmeleri.map(de => `
              <div class="p-1.5 rounded bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-between text-[11px] gap-2">
                <span class="font-medium text-[var(--color-ink-muted)] truncate" title="${de.denemeDers}">📄 ${de.denemeDers}</span>
                <span class="font-bold ${de.matchedDers ? 'text-emerald-700' : 'text-amber-700'} shrink-0 text-[10px]">
                  → ${de.matchedAd || 'Genel Ders'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Aktif Öğrenciye Kayıt Kartı -->
        <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)]/40 border border-[var(--color-accent)]/30 space-y-2.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i data-lucide="user-check" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <span class="font-bold text-xs text-[var(--color-ink)]">Kaydedilecek Öğrenci</span>
            </div>
            ${matchedStudent ? `
              <span class="meta-pill text-[10px] font-semibold text-emerald-600 bg-emerald-500/10">Otomatik Eşleşti ✓</span>
            ` : `
              <span class="meta-pill text-[10px] font-semibold text-emerald-600 bg-emerald-500/10">Aktif Profil</span>
            `}
          </div>

          <div class="space-y-2">
            <select id="deneme-modal-select-ogr" class="select-instrument w-full text-xs p-2 font-medium">
              ${allStudents.map(o => `
                <option value="${o.id}" ${targetOgr && String(o.id) === String(targetOgr.id) ? 'selected' : ''}>
                  ${o.adSoyad} (${o.sinif}. Sınıf ${o.okul ? '· ' + o.okul : ''})
                </option>
              `).join('')}
            </select>
            ${rawAdSoyad ? `
              <div class="text-[11px] text-[var(--color-ink-muted)] flex items-center justify-between pt-1">
                <span>Exceldeki İsim:</span>
                <span class="font-mono font-medium text-[var(--color-ink)]">${rawAdSoyad}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Bilgilendirme Notu -->
        <div class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-1)] border border-[var(--color-rule)] text-[11px] text-[var(--color-ink-muted)] flex items-start gap-2">
          <i data-lucide="info" class="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5"></i>
          <div>
            Exceldeki konu ve kazanım verileri aktarılacaktır. Hata Defterine doğrudan kayıt yapılmaz; sonuçları inceledikten sonra istediğiniz konuları seçerek deftere ekleyebilirsiniz.
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
          <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost text-xs">İptal</button>
          <button type="button" id="btn-save-parsed-deneme" class="btn-tactile btn-tactile-primary text-xs font-semibold">
            ${isMulti ? `Tüm Sınavları (${examsList.length} Adet) Kaydet →` : 'Denemeyi ve Konuları Kaydet →'}
          </button>
        </div>
      </div>
    `;

    this.openModal(html);

    const btnSave = document.getElementById('btn-save-parsed-deneme');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const ogrenciId = document.getElementById('deneme-modal-select-ogr')?.value || (targetOgr ? targetOgr.id : '');
        if (!ogrenciId) {
          this.showToast('Lütfen bir öğrenci seçin.');
          return;
        }

        if (isMulti) {
          examsList.forEach(ex => this.saveParsedDeneme(ex, ogrenciId, dosyaAdi));
          this.showToast(`${examsList.length} adet deneme sınavı başarıyla sisteme aktarıldı!`);
        } else {
          this.saveParsedDeneme(parsed, ogrenciId, dosyaAdi);
          this.showToast('Deneme sınavı başarıyla kaydedildi.');
        }

        this.closeModal();
      });
    }
  },

  saveParsedDeneme(parsed, ogrenciId, dosyaAdi) {
    const ogr = Store.getOgrenci(ogrenciId);
    const modulId = ogr ? (ogr.modulId || 'lgs') : 'lgs';
    const sinif = ogr ? String(ogr.sinif || '8') : '8';

    const denemeKayit = {
      id: `deneme-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ogrenciId,
      ogrenciAdi: ogr ? ogr.adSoyad : (parsed.bilgi['Adı Soyadı'] || parsed.bilgi['Soyadı - Adı'] || ''),
      ogrenciNo: ogr ? (ogr.ogrenciNo || parsed.bilgi['Öğrenci No'] || '') : (parsed.bilgi['Öğrenci No'] || ''),
      grup: parsed.bilgi['Grubu'] || parsed.bilgi['Sınıf / Şube'] || (ogr ? ogr.okul : ''),
      sinavAdi: parsed.bilgi['Sınav Adı'] || 'Deneme Sınavı',
      sinavTarihi: parsed.bilgi['Sınav Tarihi'] || new Date().toISOString().slice(0, 10),
      puan: parseFloat(parsed.bilgi['Puanı']) || 0,
      dereceler: {
        genel: parseInt(parsed.bilgi['Genel Derecesi']) || 0,
        genelKatilim: parseInt(parsed.bilgi['Genel Katılım']) || 0,
        kurum: parseInt(parsed.bilgi['Kurum Derecesi']) || 0,
        kurumKatilim: parseInt(parsed.bilgi['Kurum Katılım']) || 0,
        sube: parseInt(parsed.bilgi['Şube Derecesi']) || 0,
        subeKatilim: parseInt(parsed.bilgi['Şube Katılım']) || 0
      },
      dersler: (parsed.dersler || []).map(d => {
        const m = Store.findMatchingDers(d.ders, ogr, sinif);
        return {
          ...d,
          dersId: m ? m.id : null,
          eslesenDersAdi: m ? m.ad : d.ders
        };
      }),
      toplam: parsed.toplam,
      konular: parsed.konular,
      dosyaAdi: dosyaAdi || 'deneme.xlsx',
      olusturmaTarihi: new Date().toISOString()
    };

    // 1. Denemeyi kaydet
    Store.addDenemeSinavi(denemeKayit);

    // 2. Konuları veri olarak sisteme (Store.data.konular, Store.data.dersler, Store.data.ogrenciKonuDurumlari) kaydet
    const normalizeStr = s => (s || '').toString().trim().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    let eklenenKonuSayisi = 0;
    let hataliKonuSayisi = 0;

    if (Array.isArray(parsed.konular) && parsed.konular.length > 0) {
      parsed.konular.forEach(k => {
        const dersAdiClean = normalizeStr(k.ders);

        // G16: Akıllı Ders Eşleştirme Motoru — Kesinlikle otomatik yeni ders oluşturulmaz!
        let matchedDers = Store.findMatchingDers(k.ders, ogr, sinif);

        if (!matchedDers) {
          const ogrDersler = Store.getDerslerForOgrenci(ogr);
          matchedDers = ogrDersler.find(d => {
            const dNorm = normalizeStr(d.ad);
            return dNorm.includes(dersAdiClean) || dersAdiClean.includes(dNorm);
          }) || (ogrDersler.length > 0 ? ogrDersler[0] : null);
        }

        if (!matchedDers) return; // Tanımlı ders yoksa atla, sahte ders açma!

        // G11: Konu ve MEB/ÖSYM kazanım eşleştirme (akıllı kazanım arama motoru)
        let matchedKonu = Store.findMatchingKonu(matchedDers.id, k.konuAdi);

        if (!matchedKonu) {
          const mevcutKonular = Store.getKonularForDers(matchedDers.id);
          matchedKonu = Store.addKonu({
            dersId: matchedDers.id,
            modulId: modulId,
            sinif: sinif,
            uniteNo: 1,
            uniteAdi: 'Genel',
            konuAdi: k.konuAdi.trim(),
            kazanimlar: [k.konuAdi.trim()],
            aciklama: `Deneme sınavından aktarıldı (${denemeKayit.sinavAdi})`,
            siraNo: mevcutKonular.length + 1
          });
          eklenenKonuSayisi++;
        }

        // Öğrenci konu durumunu güncelle
        let durum = 'tamam';
        let not = `[${denemeKayit.sinavAdi}] ${k.soruSayisi} Soru: ${k.dogru} Doğru, ${k.yanlis} Yanlış, ${k.bos} Boş (%${k.basariYuzdesi} Başarı)`;

        if (k.yanlis > 0) {
          durum = 'tekrar_lazim';
          hataliKonuSayisi++;
        } else if (k.bos > 0 && k.dogru === 0) {
          durum = 'calisiliyor';
        }
        Store.setKonuDurumu(ogrenciId, matchedKonu.id, durum, not);
        // NOT: Hata Defterine otomatik atılmaz, kullanıcı analiz ekranında istediği konuları seçerek ekler.
      });
    }

    // Aktif öğrenciyi ayarla ve rapora yönlendir
    Store.setAktifOgrenci(ogrenciId);
    this.denemeSelectedOgrenciId = ogrenciId;
    this.denemeSelectedSinavId = denemeKayit.id;
    this.navigateTo('deneme-raporu');
    this.showToast(`${denemeKayit.sinavAdi} ${ogr ? ogr.adSoyad : ''} profiline kaydedildi!`);
  },

  importSampleDeneme() {
    if (typeof SAMPLE_DENEME_CSV === 'undefined') {
      this.showToast('Örnek deneme verisi bulunamadı.');
      return;
    }

    const rows = ExcelEngine.parseCSVToRows(SAMPLE_DENEME_CSV);
    const parsed = ExcelEngine.parseDenemeRows(rows);

    const aktifOgr = Store.getAktifOgrenci() || (Store.getOgrenciler().length > 0 ? Store.getOgrenciler()[0] : null);
    if (!aktifOgr) {
      this.showToast('Sistemde kayıtlı öğrenci bulunamadı. Lütfen önce bir öğrenci ekleyin.');
      return;
    }

    this.saveParsedDeneme(parsed, aktifOgr.id, '8_sinif_okul_deneme_2.csv');
  },

  deleteDeneme(denemeId) {
    const deneme = Store.getDenemeSinavi(denemeId);
    if (!deneme) return;

    this.openConfirmModal('Denemeyi Sil', `"${deneme.sinavAdi}" silinecektir. Onaylıyor musunuz?`, () => {
      Store.deleteDenemeSinavi(denemeId);
      const kalanlar = Store.getDenemeSinavlari(this.denemeSelectedOgrenciId);
      this.denemeSelectedSinavId = kalanlar.length > 0 ? kalanlar[0].id : '';
      this.denemeKarsilastirmaRefId = null;
      this.renderDenemeRaporu();
      this.showToast('Deneme sınavı silindi');
    });
  },

  openGorevModalFromDeneme(ogrenciId, dersAdi, konuAdi, varsayilanNot = null) {
    const ogr = Store.getOgrenci(ogrenciId);
    const dersler = ogr ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
    const targetDersNorm = norm(dersAdi);

    // İlgili dersi eşleştir
    const matchedDers = dersler.find(d => {
      const dNorm = norm(d.ad);
      return dNorm === targetDersNorm || dNorm.includes(targetDersNorm) || targetDersNorm.includes(dNorm);
    });
    const dersId = matchedDers ? matchedDers.id : null;

    // G11: Konuyu müfredat havuzunda akıllı eşleştir (MEB/ÖSYM kazanımları dahil)
    const matchedKonu = Store.findMatchingKonu(dersId || dersAdi, konuAdi);

    // G10 & G17: Görev başlığı tam olarak konu/kazanım adı olsun ve ilgili ders seçili gelsin, koç notu aktarılsın
    this.openGorevModal(
      ogrenciId,
      null,
      matchedKonu ? matchedKonu.id : null,
      null,
      konuAdi,
      dersAdi,
      varsayilanNot
    );
  },

  toggleHataFromDeneme(ogrenciId, dersAdi, konuAdi, yanlisSayisi, sinavAdi) {
    const existing = (Store.data.hataKayitlari || []).find(h =>
      String(h.ogrenciId) === String(ogrenciId) &&
      h.aciklama && h.aciklama.includes(konuAdi) &&
      (sinavAdi ? h.aciklama.includes(sinavAdi) : true)
    );

    if (existing) {
      Store.deleteHata(existing.id);
      this.showToast(`"${konuAdi}" Hata Defterinden çıkarıldı.`);
    } else {
      const normalizeStr = s => (s || '').toString().trim().toLowerCase()
        .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

      const allDersler = Store.data.dersler || [];
      const dersClean = normalizeStr(dersAdi);
      const matchedDers = allDersler.find(d => {
        const dClean = normalizeStr(d.ad);
        return dClean === dersClean || dClean.includes(dersClean) || dersClean.includes(dClean);
      });

      const allKonular = Store.data.konular || [];
      const konuClean = normalizeStr(konuAdi);
      const matchedKonu = allKonular.find(k => {
        if (matchedDers && String(k.dersId) !== String(matchedDers.id)) return false;
        const kClean = normalizeStr(k.konuAdi);
        return kClean === konuClean || kClean.includes(konuClean) || konuClean.includes(kClean);
      });

      Store.addHata({
        ogrenciId,
        dersId: matchedDers ? matchedDers.id : '',
        konuId: matchedKonu ? matchedKonu.id : '',
        hataTuru: 'Deneme Yanlışı',
        aciklama: `[${sinavAdi || 'Deneme Sınavı'}] "${konuAdi}" konusunda ${yanlisSayisi || 1} yanlış yapıldı. Kazanım telafi çalışması.`,
        asama: 1,
        telafiDurumu: false
      });

      this.showToast(`"${konuAdi}" Hata Defterine eklendi (1. Tekrar planlandı)`);
    }

    this.renderDenemeRaporu();
  },

  addTumHataliKonularHataDefterine(ogrenciId, denemeId) {
    const deneme = Store.getDenemeSinavi(denemeId);
    if (!deneme || !Array.isArray(deneme.konular)) return;

    const hataliKonular = deneme.konular.filter(k => k.yanlis > 0);
    if (hataliKonular.length === 0) {
      this.showToast('Bu denemede hatalı konu bulunmuyor.');
      return;
    }

    let eklenenSayisi = 0;
    const normalizeStr = s => (s || '').toString().trim().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '');

    hataliKonular.forEach(k => {
      const existing = (Store.data.hataKayitlari || []).find(h =>
        String(h.ogrenciId) === String(ogrenciId) &&
        h.aciklama && h.aciklama.includes(k.konuAdi) &&
        h.aciklama.includes(deneme.sinavAdi)
      );

      if (!existing) {
        const allDersler = Store.data.dersler || [];
        const dersClean = normalizeStr(k.ders);
        const matchedDers = allDersler.find(d => {
          const dClean = normalizeStr(d.ad);
          return dClean === dersClean || dClean.includes(dersClean) || dersClean.includes(dClean);
        });

        const allKonular = Store.data.konular || [];
        const konuClean = normalizeStr(k.konuAdi);
        const matchedKonu = allKonular.find(item => {
          if (matchedDers && String(item.dersId) !== String(matchedDers.id)) return false;
          const kClean = normalizeStr(item.konuAdi);
          return kClean === konuClean || kClean.includes(konuClean) || konuClean.includes(kClean);
        });

        Store.addHata({
          ogrenciId,
          dersId: matchedDers ? matchedDers.id : '',
          konuId: matchedKonu ? matchedKonu.id : '',
          hataTuru: 'Deneme Yanlışı',
          aciklama: `[${deneme.sinavAdi}] "${k.konuAdi}" konusunda ${k.yanlis} yanlış yapıldı. (${k.dogru} D / ${k.yanlis} Y / ${k.bos} B)`,
          asama: 1,
          telafiDurumu: false
        });
        eklenenSayisi++;
      }
    });

    if (eklenenSayisi > 0) {
      this.showToast(`${eklenenSayisi} konu Hata Defterine eklendi!`);
    } else {
      this.showToast('Hatalı konuların tamamı zaten Hata Defterinde kayıtlı.');
    }
    this.renderDenemeRaporu();
  },

  printDenemeKarne(denemeId = null) {
    const id = denemeId || this.denemeSelectedSinavId;
    const deneme = Store.getDenemeSinavi(id);
    if (!deneme) {
      this.showToast('Yazdırılacak deneme bulunamadı.');
      return;
    }

    const ogr = Store.getOgrenci(deneme.ogrenciId);
    const ogrenciDenemeleri = Store.getDenemeSinavlari(deneme.ogrenciId);
    const digerDenemeler = ogrenciDenemeleri.filter(snv => snv.id !== deneme.id);
    let refDeneme = null;
    if (this.denemeKarsilastirmaRefId && digerDenemeler.some(d => d.id === this.denemeKarsilastirmaRefId)) {
      refDeneme = digerDenemeler.find(d => d.id === this.denemeKarsilastirmaRefId);
    } else if (digerDenemeler.length > 0) {
      const currIdx = ogrenciDenemeleri.findIndex(d => d.id === deneme.id);
      refDeneme = (currIdx >= 0 && currIdx + 1 < ogrenciDenemeleri.length) ? ogrenciDenemeleri[currIdx + 1] : digerDenemeler[0];
    }

    let diffNetNum = 0;
    let diffNetStr = '0.0';
    let diffPuanNum = 0;
    let diffPuanStr = '0.0';
    let dersFarklari = [];

    if (refDeneme) {
      const currNet = parseFloat(deneme.toplam?.net || 0);
      const refNet = parseFloat(refDeneme.toplam?.net || 0);
      diffNetNum = parseFloat((currNet - refNet).toFixed(2));
      diffNetStr = diffNetNum > 0 ? `+${diffNetNum.toFixed(1)}` : `${diffNetNum.toFixed(1)}`;

      const currPuan = parseFloat(deneme.puan || 0);
      const refPuan = parseFloat(refDeneme.puan || 0);
      diffPuanNum = parseFloat((currPuan - refPuan).toFixed(1));
      diffPuanStr = diffPuanNum > 0 ? `+${diffPuanNum.toFixed(1)}` : `${diffPuanNum.toFixed(1)}`;

      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
      const refDersler = refDeneme.dersler || [];

      dersFarklari = (deneme.dersler || []).map(cd => {
        const rd = refDersler.find(item => norm(item.ders) === norm(cd.ders));
        const cNet = parseFloat(cd.net || 0);
        const rNet = rd ? parseFloat(rd.net || 0) : 0;
        const diff = parseFloat((cNet - rNet).toFixed(2));
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        return {
          ders: cd.ders,
          diff,
          diffStr
        };
      });
    }

    const konular = deneme.konular || [];
    const eksikKonular = konular.filter(k => k.yanlis > 0 || k.basari < 50);
    const isSinglePage = konular.length <= 28;
    const konuRowHeight = konular.length > 0
      ? Math.max(19, Math.min(32, Math.floor((refDeneme ? 360 : 430) / Math.max(1, konular.length))))
      : 26;

    const html = `
      <div class="print-page-dikey ${isSinglePage ? 'print-single-page' : 'print-multi-page'} bg-white text-slate-900 font-sans" style="box-sizing: border-box; width: 100%; padding: 6mm 8mm; display: flex; flex-direction: column; justify-content: space-between;">
        <!-- Üst İçerik Grubu -->
        <div>
          <div class="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
            <div>
              <div class="text-[10px] font-bold tracking-widest uppercase text-slate-500">PLANTRACK AKADEMİK DENEME KARNESİ</div>
              <h1 class="text-xl font-black text-slate-900 leading-tight mt-0.5">${deneme.sinavAdi}</h1>
              <p class="text-[11px] text-slate-600 mt-0.5">Sınav Tarihi: <strong>${deneme.sinavTarihi}</strong> · Grup / Şube: <strong>${deneme.grup || '—'}</strong></p>
            </div>
            <div class="text-right bg-slate-50 border border-slate-200 rounded px-3.5 py-2">
              <div class="text-sm font-black text-slate-900">${ogr ? (ogr.adSoyad || `${ogr.ad} ${ogr.soyad}`) : deneme.ogrenciAdi}</div>
              <div class="text-[11px] text-slate-600">Öğrenci No: <strong>${deneme.ogrenciNo || (ogr ? ogr.ogrenciNo : '—')}</strong> · Sınıf: <strong>${ogr ? ogr.sinif + '. Sınıf' : '8. Sınıf'}</strong></div>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-2.5 mb-3.5 p-3 bg-slate-50 border border-slate-300 rounded">
            <div class="text-center">
              <div class="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Sınav Puanı</div>
              <div class="text-lg font-black text-blue-700 font-mono mt-0.5">${deneme.puan || '—'}</div>
            </div>
            <div class="text-center border-l border-slate-300">
              <div class="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Toplam Net</div>
              <div class="text-lg font-black text-slate-900 font-mono mt-0.5">${deneme.toplam ? deneme.toplam.net : '—'} <span class="text-[11px] font-normal text-slate-500">/ ${deneme.toplam ? deneme.toplam.soruSayisi : 90}</span></div>
            </div>
            <div class="text-center border-l border-slate-300">
              <div class="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Kurum Sırası</div>
              <div class="text-lg font-black text-slate-900 font-mono mt-0.5">${deneme.dereceler?.kurum || '—'} <span class="text-[11px] font-normal text-slate-500">/ ${deneme.dereceler?.kurumKatilim || '—'}</span></div>
            </div>
            <div class="text-center border-l border-slate-300">
              <div class="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Genel Sıra</div>
              <div class="text-lg font-black text-slate-900 font-mono mt-0.5">${deneme.dereceler?.genel || '—'} <span class="text-[11px] font-normal text-slate-500">/ ${deneme.dereceler?.genelKatilim || '—'}</span></div>
            </div>
          </div>

          ${refDeneme ? `
            <!-- Sınav Karşılaştırma Özeti (G9) -->
            <div class="mb-3.5 p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px]">
              <div class="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                <div class="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span>Deneme Karşılaştırması</span>
                  <span class="text-slate-500 font-normal lowercase">(referans: <strong>${refDeneme.sinavAdi}</strong> · ${refDeneme.sinavTarihi || 'Tarihsiz'})</span>
                </div>
                <div class="font-mono text-[11px] flex items-center gap-4">
                  <span>Puan Değişimi: <strong class="${diffPuanNum >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${diffPuanStr}</strong></span>
                  <span>Toplam Net: <strong class="${diffNetNum >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${diffNetStr} Net</strong></span>
                </div>
              </div>
              <div class="grid grid-cols-6 gap-1.5 text-center text-[10px]">
                ${dersFarklari.map(df => `
                  <div class="p-1 bg-white border border-slate-200 rounded">
                    <div class="font-semibold text-slate-700 truncate">${df.ders}</div>
                    <div class="font-mono font-bold ${df.diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}">${df.diffStr} Net</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="mb-3.5">
            <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1.5">1. Ders Bazlı Sonuç Tablosu</h2>
            <table class="w-full text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr class="bg-slate-800 text-white text-left">
                  <th class="py-1.5 px-2 border border-slate-700">Ders Adı</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center">Soru</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center">Doğru</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center">Yanlış</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center font-bold">Net</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center">Başarı (%)</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center">Kurum Ort.</th>
                  <th class="py-1.5 px-2 border border-slate-700 text-center">Sınav Ort.</th>
                </tr>
              </thead>
              <tbody>
                ${(deneme.dersler || []).map((d, idx) => `
                  <tr class="border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}">
                    <td class="py-1.5 px-2 border border-slate-200 font-semibold">${d.ders}</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center">${d.soruSayisi}</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center text-emerald-700 font-bold">${d.dogru}</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center text-rose-700 font-bold">${d.yanlis}</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center font-black text-slate-900 bg-slate-100/80">${d.net}</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center font-semibold">${d.basariYuzde}%</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center text-slate-600">${d.kurumNetOrt}</td>
                    <td class="py-1.5 px-2 border border-slate-200 text-center text-slate-600">${d.sinavNetOrt}</td>
                  </tr>
                `).join('')}
                ${deneme.toplam ? `
                  <tr class="bg-slate-100 font-black">
                    <td class="py-1.5 px-2 border border-slate-300">TOPLAM</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center">${deneme.toplam.soruSayisi}</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center text-emerald-700">${deneme.toplam.dogru}</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center text-rose-700">${deneme.toplam.yanlis}</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center text-blue-700 text-xs">${deneme.toplam.net}</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center">${deneme.toplam.basariYuzde}%</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center">${deneme.toplam.kurumNetOrt}</td>
                    <td class="py-1.5 px-2 border border-slate-300 text-center">${deneme.toplam.sinavNetOrt}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>

          <div class="mb-2">
            <div class="flex items-center justify-between mb-1.5">
              <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-800">2. Konu / Kazanım Başarı Dağılımı</h2>
              <span class="text-[10px] text-slate-500 font-semibold">Toplam ${konular.length} Kazanım · ${eksikKonular.length} Telafi Öncelikli Konu</span>
            </div>
            <table class="w-full text-[10.5px] border-collapse border border-slate-300">
              <thead>
                <tr class="bg-slate-100 text-slate-800 text-left">
                  <th class="py-1 px-2 border border-slate-300 w-28">Ders</th>
                  <th class="py-1 px-2 border border-slate-300">Konu / Kazanım Adı</th>
                  <th class="py-1 px-2 border border-slate-300 text-center w-12">Soru</th>
                  <th class="py-1 px-2 border border-slate-300 text-center w-12">D</th>
                  <th class="py-1 px-2 border border-slate-300 text-center w-12">Y</th>
                  <th class="py-1 px-2 border border-slate-300 text-center w-20">Başarı (%)</th>
                </tr>
              </thead>
              <tbody>
                ${konular.map(k => {
                  const isEksik = k.yanlis > 0 || k.basari < 50;
                  return `
                    <tr class="border-b border-slate-200 ${isEksik ? 'bg-amber-50/70' : ''}" style="height: ${konuRowHeight}px;">
                      <td class="py-0.5 px-2 border border-slate-200 font-semibold text-slate-800">${k.ders}</td>
                      <td class="py-0.5 px-2 border border-slate-200 text-slate-800">${k.konuAdi}</td>
                      <td class="py-0.5 px-2 border border-slate-200 text-center font-mono">${k.soruSayisi}</td>
                      <td class="py-0.5 px-2 border border-slate-200 text-center text-emerald-700 font-bold font-mono">${k.dogru}</td>
                      <td class="py-0.5 px-2 border border-slate-200 text-center text-rose-700 font-bold font-mono">${k.yanlis}</td>
                      <td class="py-0.5 px-2 border border-slate-200 text-center font-bold font-mono ${k.basari >= 80 ? 'text-emerald-700' : k.basari >= 50 ? 'text-blue-700' : 'text-rose-700'}">${k.basari}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alt Kısım: Öncelikli Telafi Özeti, Koç Değerlendirmesi ve İmzalar -->
        <div class="pt-2">
          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="p-2.5 bg-slate-50 border border-slate-300 rounded">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">Öncelikli Telafi Edilecek Kazanımlar</div>
              ${eksikKonular.length > 0 ? `
                <div class="text-[10px] text-slate-700 leading-relaxed">
                  ${eksikKonular.slice(0, 5).map(ek => `• <strong>${ek.ders}:</strong> ${ek.konuAdi} (${ek.yanlis} Y, %${ek.basari})`).join('<br>')}
                </div>
              ` : `
                <div class="text-[10px] text-emerald-700 font-semibold">Tüm kazanımlarda hedef başarı eşiği yakalanmıştır. Tebrikler!</div>
              `}
            </div>
            <div class="p-2.5 bg-slate-50 border border-slate-300 rounded flex flex-col justify-between">
              <div class="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">Koç Değerlendirmesi & Eylem Planı</div>
              <div class="space-y-3 my-1">
                <div class="border-b border-dashed border-slate-300 h-3.5"></div>
                <div class="border-b border-dashed border-slate-300 h-3.5"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] text-slate-600 pt-1">
                <span>Veli İmzası: _______________</span>
                <span>Koç İmzası: _______________</span>
              </div>
            </div>
          </div>

          <div class="pt-2 border-t-2 border-slate-900 flex items-center justify-between text-[9.5px] text-slate-500 font-semibold">
            <span>Plantrack Eğitim Takip & Koçluk Platformu — Akademik Deneme Karnesi</span>
            <span>Rapor Çıktı Tarihi: ${new Date().toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
      </div>
    `;

    PrintEngine.yazdir(html, { yatay: false });
  },

  // ─────────────────────────────────────────────────────────────
  // A4 KOÇ RAPORU (kümülatif deneme analizi + grafikler)
  // ─────────────────────────────────────────────────────────────
  printDenemeKocRaporu() {
    const ogrId = this.denemeSelectedOgrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(ogrId);
    const denemeler = ogr ? Store.getDenemeSinavlari(ogr.id) : [];
    if (!ogr || denemeler.length === 0) {
      this.showToast('A4 koç raporu için kayıtlı deneme bulunamadı.');
      return;
    }

    const koc = Store.getKocProfili() || {};
    const modul = Store.getModulForOgrenci(ogr);
    const esc = (s) => this.escapeHtml(s);
    const trTarih = (s) => {
      if (!s) return '—';
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? String(s) : dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const netOf = (x) => Number((x && x.toplam && x.toplam.net) || 0);
    const puanOf = (x) => Number((x && x.puan) || 0);

    const kronolojik = [...denemeler].sort((a, b) =>
      new Date(a.sinavTarihi || a.olusturmaTarihi || 0) - new Date(b.sinavTarihi || b.olusturmaTarihi || 0));
    const n = kronolojik.length;
    const ortNet = n ? kronolojik.reduce((s, x) => s + netOf(x), 0) / n : 0;
    const sonNet = netOf(kronolojik[n - 1]);
    const oncekiNet = n > 1 ? netOf(kronolojik[n - 2]) : null;
    const netFark = oncekiNet === null ? 0 : sonNet - oncekiNet;
    const ortPuan = n ? kronolojik.reduce((s, x) => s + puanOf(x), 0) / n : 0;
    const ilkNet = netOf(kronolojik[0]);
    const toplamGelisim = sonNet - ilkNet;

    // Ders adı eşleştirme (Fen ve Teknoloji → Fen Bilimleri, Sosyal Bilgiler → T.C. İnkılap ...)
    const kanonikDers = (ad) => {
      const ham = String(ad || '').trim();
      try {
        const m = Store.findMatchingDers(ham, ogr);
        if (m && m.ad) return m.ad;
      } catch (_) {}
      return ham;
    };

    // Ders bazlı kümülatif özet
    const dMap = new Map();
    kronolojik.forEach(snv => (snv.dersler || []).forEach(d => {
      const key = kanonikDers(d.ders);
      if (!key) return;
      if (!dMap.has(key)) dMap.set(key, { ders: key, soru: 0, dogru: 0, yanlis: 0, bos: 0, net: 0, adet: 0, kurum: 0, sinav: 0 });
      const it = dMap.get(key);
      it.soru += Number(d.soruSayisi || 0);
      it.dogru += Number(d.dogru || 0);
      it.yanlis += Number(d.yanlis || 0);
      it.bos += Number(d.bos || 0);
      it.net += Number(d.net || 0);
      it.kurum += Number(d.kurumNetOrt || 0);
      it.sinav += Number(d.sinavNetOrt || 0);
      it.adet++;
    }));
    const dersOzet = Array.from(dMap.values()).map(d => Object.assign({}, d, {
      ortNet: d.adet ? d.net / d.adet : 0,
      ortKurum: d.adet ? d.kurum / d.adet : 0,
      ortSinav: d.adet ? d.sinav / d.adet : 0,
      basari: (d.dogru + d.yanlis) > 0 ? Math.round((d.dogru / (d.dogru + d.yanlis)) * 100) : 0
    })).sort((a, b) => b.ortNet - a.ortNet);

    // Konu bazlı kümülatif özet
    const normStr = s => (s || '').toString().trim().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, '');
    const kMap = new Map();
    kronolojik.forEach(snv => (snv.konular || []).forEach(k => {
      const dersAd = kanonikDers(k.ders);
      const key = `${normStr(dersAd)}__${normStr(k.konuAdi)}`;
      if (!kMap.has(key)) kMap.set(key, { ders: dersAd, konuAdi: k.konuAdi, soru: 0, d: 0, y: 0, denemeSet: new Set() });
      const it = kMap.get(key);
      it.soru += Number(k.soruSayisi || 0);
      it.d += Number(k.dogru || 0);
      it.y += Number(k.yanlis || 0);
      it.denemeSet.add(snv.id);
    }));
    const konular = Array.from(kMap.values()).map(k => Object.assign({}, k, {
      basari: k.soru > 0 ? Math.round((k.d / k.soru) * 100) : 0,
      denemeSayisi: k.denemeSet.size
    }));
    const zayifKonular = [...konular].filter(k => k.y > 0).sort((a, b) => b.y - a.y || a.basari - b.basari);
    const gucluKonular = [...konular].filter(k => k.soru >= 3 && k.basari >= 80).sort((a, b) => b.basari - a.basari);
    const tekrarHatalar = [...konular].filter(k => k.denemeSayisi >= 2 && k.y >= 2).sort((a, b) => b.y - a.y);

    // ── SVG Grafikler ──
    const svgTrend = () => {
      const W = 760, H = 215, padL = 38, padR = 16, padT = 16, padB = 38;
      const vals = kronolojik.map(netOf);
      const enBuyuk = Math.max(...vals, 1);
      const adim = enBuyuk <= 20 ? 5 : enBuyuk <= 50 ? 10 : enBuyuk <= 120 ? 20 : 50;
      const maxV = Math.max(adim * 4, Math.ceil(enBuyuk / (adim * 4)) * (adim * 4));
      const dx = vals.length > 1 ? (W - padL - padR) / (vals.length - 1) : 0;
      const X = i => vals.length > 1 ? padL + i * dx : (W + padL - padR) / 2;
      const Y = v => H - padB - (v / maxV) * (H - padT - padB);
      const grid = [0, 0.25, 0.5, 0.75, 1].map(f => {
        const v = maxV * f, yy = Y(v);
        return `<line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" stroke="#e2e8f0" stroke-width="1"/>
          <text x="${padL - 6}" y="${yy + 3}" text-anchor="end" font-size="8.5" fill="#94a3b8" font-family="monospace">${Math.round(v)}</text>`;
      }).join('');
      const pts = vals.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
      const dots = vals.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="#2563eb"/>
        <text x="${X(i)}" y="${Y(v) - 7}" text-anchor="middle" font-size="8.5" fill="#0f172a" font-weight="700" font-family="monospace">${v.toFixed(1)}</text>`).join('');
      const step = Math.max(1, Math.ceil(vals.length / 12));
      const xlabels = kronolojik.map((snv, i) =>
        (i % step === 0 || i === vals.length - 1)
          ? `<text x="${X(i)}" y="${H - 16}" text-anchor="middle" font-size="8" fill="#64748b" font-family="monospace">${trTarih(snv.sinavTarihi).slice(0, 5)}</text>`
          : '').join('');
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="xMidYMid meet" style="display:block;">${grid}
        <polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}${xlabels}</svg>`;
    };

    const svgDers = () => {
      const rows = dersOzet;
      if (!rows.length) return '';
      const W = 760, rowH = 22, padT = 6, labelW = 190, valW = 46;
      const H = rows.length * rowH + padT * 2;
      const maxV = Math.max(1, ...rows.map(r => r.ortNet));
      const bw = W - labelW - valW;
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;">${rows.map((r, i) => {
        const y = padT + i * rowH;
        const w = Math.max(1, (r.ortNet / maxV) * bw);
        const color = r.ortNet >= maxV * 0.66 ? '#059669' : r.ortNet >= maxV * 0.33 ? '#2563eb' : '#e11d48';
        return `<text x="0" y="${y + 15}" font-size="9.5" fill="#334155" font-weight="600">${esc(String(r.ders).slice(0, 26))}</text>
          <rect x="${labelW}" y="${y + 5}" width="${bw}" height="12" rx="3" fill="#f1f5f9"/>
          <rect x="${labelW}" y="${y + 5}" width="${w}" height="12" rx="3" fill="${color}"/>
          <text x="${W}" y="${y + 15}" text-anchor="end" font-size="9.5" fill="#0f172a" font-weight="700" font-family="monospace">${r.ortNet.toFixed(1)}</text>`;
      }).join('')}</svg>`;
    };

    const svgKonu = () => {
      const rows = zayifKonular.slice(0, 10);
      if (!rows.length) return '';
      const W = 760, rowH = 22, padT = 6, labelW = 330, valW = 44;
      const H = rows.length * rowH + padT * 2;
      const bw = W - labelW - valW;
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;">${rows.map((r, i) => {
        const y = padT + i * rowH;
        const w = Math.max(1, (r.basari / 100) * bw);
        const color = r.basari >= 70 ? '#059669' : r.basari >= 40 ? '#d97706' : '#e11d48';
        return `<text x="0" y="${y + 15}" font-size="9" fill="#334155">${esc(`${r.ders} · ${r.konuAdi}`.slice(0, 50))}</text>
          <rect x="${labelW}" y="${y + 5}" width="${bw}" height="12" rx="3" fill="#f1f5f9"/>
          <rect x="${labelW}" y="${y + 5}" width="${w}" height="12" rx="3" fill="${color}"/>
          <text x="${W}" y="${y + 15}" text-anchor="end" font-size="9" fill="#0f172a" font-weight="700" font-family="monospace">%${r.basari}</text>`;
      }).join('')}</svg>`;
    };

    // ── Ortak parçalar ──
    const ustBilgi = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #0f172a; padding-bottom:5px; margin-bottom:8px;">
        <div>
          <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#0f172a;">${esc(`${koc.ad || ''} ${koc.soyad || ''}`.trim() || 'Eğitim Koçu')}</div>
          <div style="font-size:9px; color:#475569;">${esc(koc.unvan || 'Eğitim Koçu')} • ${esc(koc.kurum || 'Plantrack Koçluk')}</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:15px; font-weight:900; letter-spacing:1px; color:#0f172a;">DENEME SINAVI KOÇ RAPORU</div>
          <div style="font-size:9px; color:#475569; font-family:monospace;">${trTarih(kronolojik[0].sinavTarihi)} – ${trTarih(kronolojik[n - 1].sinavTarihi)} • ${n} Deneme</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px; color:#64748b; text-transform:uppercase; font-weight:700;">Öğrenci</div>
          <div style="font-size:12px; font-weight:800; color:#0f172a;">${esc(ogr.adSoyad || '')}</div>
          <div style="font-size:9px; color:#475569;">${esc(ogr.sinif ? ogr.sinif + '. Sınıf' : '')} ${modul ? '• ' + esc(modul.ad) : ''}</div>
        </div>
      </div>`;

    const altBilgi = `
      <div style="border-top:1px solid #cbd5e1; padding-top:4px; display:flex; justify-content:space-between; font-size:8px; color:#64748b; font-weight:600;">
        <span>Plantrack Eğitim Takip &amp; Koçluk Platformu — Deneme Analiz Raporu</span>
        <span>Çıktı: ${new Date().toLocaleDateString('tr-TR')}</span>
      </div>`;

    const statBox = (baslik, deger, alt, renk) => `
      <div style="flex:1; border:1px solid #cbd5e1; border-radius:5px; padding:6px 8px; background:#f8fafc;">
        <div style="font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.3px; color:#64748b;">${baslik}</div>
        <div style="font-size:17px; font-weight:900; color:${renk || '#0f172a'}; font-family:monospace; line-height:1.2;">${deger}</div>
        <div style="font-size:8px; color:#64748b;">${alt || ''}</div>
      </div>`;

    const sayfa1 = `
      <div class="koc-rapor-sayfa bg-white text-slate-900">
        ${ustBilgi}
        <div style="display:flex; gap:7px; margin-bottom:10px;">
          ${statBox('Deneme', String(n), 'girilen sınav', '#0f172a')}
          ${statBox('Ort. Net', ortNet.toFixed(1), 'tüm denemeler', '#2563eb')}
          ${statBox('Son Net', sonNet.toFixed(1), `${netFark >= 0 ? '+' : ''}${netFark.toFixed(1)} önceki denemeye göre`, netFark >= 0 ? '#059669' : '#e11d48')}
          ${statBox('Ort. Puan', ortPuan.toFixed(1), 'tüm denemeler', '#7c3aed')}
        </div>

        <div style="font-size:10px; font-weight:800; color:#0f172a; margin-bottom:2px;">1) NET GELİŞİM TRENDİ</div>
        <div style="border:1px solid #e2e8f0; border-radius:5px; padding:4px 6px; background:#ffffff;">${svgTrend()}</div>
        <div style="font-size:8px; color:#64748b; margin-top:2px;">İlk deneme ${ilkNet.toFixed(1)} net → son deneme ${sonNet.toFixed(1)} net (${toplamGelisim >= 0 ? '+' : ''}${toplamGelisim.toFixed(1)} net).</div>

        <div style="font-size:10px; font-weight:800; color:#0f172a; margin:10px 0 2px;">2) DERS BAZLI ORTALAMA NET</div>
        <div style="border:1px solid #e2e8f0; border-radius:5px; padding:4px 6px; background:#ffffff;">${svgDers()}</div>
        <div class="koc-alt">${altBilgi}</div>
      </div>`;

    const denemeSatirlari = [...kronolojik].reverse().map((snv, i) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:2px 4px; font-family:monospace; font-size:8.5px; color:#334155;">${trTarih(snv.sinavTarihi)}</td>
        <td style="padding:2px 4px; font-size:8.5px; color:#0f172a;">${esc(snv.sinavAdi || 'Deneme')}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px; font-weight:700;">${netOf(snv).toFixed(1)}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px;">${puanOf(snv) ? puanOf(snv).toFixed(1) : '—'}</td>
        <td style="padding:2px 4px; text-align:center; font-size:8.5px; color:#475569;">${snv.dereceler && snv.dereceler.genel ? snv.dereceler.genel + '.' : '—'}</td>
      </tr>`).join('');

    const dersSatirlari = dersOzet.map(d => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:2px 4px; font-size:8.5px; font-weight:600; color:#0f172a;">${esc(d.ders)}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px;">${d.soru}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px; color:#047857; font-weight:700;">${d.dogru}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px; color:#be123c; font-weight:700;">${d.yanlis}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px;">${d.bos}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px; font-weight:700;">${d.net.toFixed(1)}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px;">${d.ortNet.toFixed(1)}</td>
        <td style="padding:2px 4px; text-align:center; font-family:monospace; font-size:8.5px; font-weight:700; color:${d.basari >= 70 ? '#047857' : d.basari >= 40 ? '#b45309' : '#be123c'};">%${d.basari}</td>
      </tr>`).join('');

    const sayfa2 = `
      <div class="koc-rapor-sayfa bg-white text-slate-900">
        ${ustBilgi}
        <div style="font-size:10px; font-weight:800; color:#0f172a; margin-bottom:3px;">3) DENEME GEÇMİŞİ (${n})</div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
          <thead><tr style="background:#f1f5f9; border-bottom:1.5px solid #94a3b8;">
            <th style="padding:3px 4px; text-align:left; font-size:8px; color:#475569;">Tarih</th>
            <th style="padding:3px 4px; text-align:left; font-size:8px; color:#475569;">Deneme</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Net</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Puan</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Derece</th>
          </tr></thead>
          <tbody>${denemeSatirlari}</tbody>
        </table>

        <div style="font-size:10px; font-weight:800; color:#0f172a; margin-bottom:3px;">4) DERS BAZLI SONUÇLAR (KÜMÜLATİF)</div>
        <table style="width:100%; border-collapse:collapse;">
          <thead><tr style="background:#f1f5f9; border-bottom:1.5px solid #94a3b8;">
            <th style="padding:3px 4px; text-align:left; font-size:8px; color:#475569;">Ders</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Soru</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#047857;">D</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#be123c;">Y</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">B</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Top. Net</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Ort. Net</th>
            <th style="padding:3px 4px; text-align:center; font-size:8px; color:#475569;">Başarı</th>
          </tr></thead>
          <tbody>${dersSatirlari}</tbody>
        </table>
        <div class="koc-alt">${altBilgi}</div>
      </div>`;

    const konuSatirlari = konular.slice(0, 45).map(k => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:1.5px 4px; font-size:8px; color:#334155;">${esc(k.ders)}</td>
        <td style="padding:1.5px 4px; font-size:8px; color:#0f172a;">${esc(k.konuAdi)}</td>
        <td style="padding:1.5px 4px; text-align:center; font-family:monospace; font-size:8px;">${k.denemeSayisi}</td>
        <td style="padding:1.5px 4px; text-align:center; font-family:monospace; font-size:8px;">${k.soru}</td>
        <td style="padding:1.5px 4px; text-align:center; font-family:monospace; font-size:8px; color:#047857; font-weight:700;">${k.d}</td>
        <td style="padding:1.5px 4px; text-align:center; font-family:monospace; font-size:8px; color:#be123c; font-weight:700;">${k.y}</td>
        <td style="padding:1.5px 4px; text-align:center; font-family:monospace; font-size:8px; font-weight:700; color:${k.basari >= 70 ? '#047857' : k.basari >= 40 ? '#b45309' : '#be123c'};">%${k.basari}</td>
      </tr>`).join('');

    const madde = (baslik, icerik) => `
      <div style="display:flex; gap:5px; font-size:8.5px; line-height:1.45; color:#0f172a;">
        <span style="font-weight:800;">•</span>
        <span><strong>${baslik}</strong> ${icerik}</span>
      </div>`;

    const sayfa3 = `
      <div class="koc-rapor-sayfa son-sayfa bg-white text-slate-900">
        ${ustBilgi}

        <div style="font-size:10px; font-weight:800; color:#0f172a; margin-bottom:2px;">5) EN ÇOK ZORLANILAN KONULAR — BAŞARI %</div>
        <div style="border:1px solid #e2e8f0; border-radius:5px; padding:4px 6px; background:#ffffff; margin-bottom:8px;">${svgKonu() || '<div style="font-size:8.5px; color:#64748b; padding:6px;">Konu bazlı veri yok.</div>'}</div>

        <div style="font-size:10px; font-weight:800; color:#0f172a; margin-bottom:3px;">6) KONU / KAZANIM TABLOSU (${konular.length} konu${konular.length > 45 ? ' — ilk 45' : ''})</div>
        <table style="width:100%; border-collapse:collapse; margin-bottom:8px;">
          <thead><tr style="background:#f1f5f9; border-bottom:1.5px solid #94a3b8;">
            <th style="padding:2.5px 4px; text-align:left; font-size:7.5px; color:#475569;">Ders</th>
            <th style="padding:2.5px 4px; text-align:left; font-size:7.5px; color:#475569;">Konu</th>
            <th style="padding:2.5px 4px; text-align:center; font-size:7.5px; color:#475569;">Deneme</th>
            <th style="padding:2.5px 4px; text-align:center; font-size:7.5px; color:#475569;">Soru</th>
            <th style="padding:2.5px 4px; text-align:center; font-size:7.5px; color:#047857;">D</th>
            <th style="padding:2.5px 4px; text-align:center; font-size:7.5px; color:#be123c;">Y</th>
            <th style="padding:2.5px 4px; text-align:center; font-size:7.5px; color:#475569;">Başarı</th>
          </tr></thead>
          <tbody>${konuSatirlari || '<tr><td colspan="7" style="padding:6px; text-align:center; font-size:8px; color:#64748b;">Konu bazlı D/Y verisi bulunamadı.</td></tr>'}</tbody>
        </table>

        <div style="font-size:10px; font-weight:800; color:#0f172a; margin-bottom:3px;">7) KOÇ DEĞERLENDİRMESİ</div>
        <div style="border:1px solid #cbd5e1; border-radius:5px; padding:6px 8px; background:#f8fafc; display:flex; flex-direction:column; gap:2.5px;">
          ${madde('Deneme sayısı:', `${n} deneme (${trTarih(kronolojik[0].sinavTarihi)} – ${trTarih(kronolojik[n - 1].sinavTarihi)}).`)}
          ${madde('Net gelişimi:', `Ortalama ${ortNet.toFixed(1)}; son denemede ${sonNet.toFixed(1)}${oncekiNet === null ? '.' : ` (${netFark >= 0 ? '+' : ''}${netFark.toFixed(1)} net, ${netFark >= 0 ? 'yükseliş' : 'düşüş'}).`}`)}
          ${zayifKonular.length ? madde('Zorlanılan konular:', zayifKonular.slice(0, 5).map(k => `${esc(k.konuAdi)} (${k.d}D/${k.y}Y)`).join(' · ') + '.') : ''}
          ${gucluKonular.length ? madde('Güçlü konular:', gucluKonular.slice(0, 5).map(k => `${esc(k.konuAdi)} (%${k.basari})`).join(' · ') + '.') : ''}
          ${tekrarHatalar.length ? madde('Tekrar eden hatalar:', tekrarHatalar.slice(0, 5).map(k => `${esc(k.konuAdi)} (${k.denemeSayisi} deneme, ${k.y}Y)`).join(' · ') + '.') : ''}
          ${madde('Öneri:', zayifKonular.length
            ? `Öncelikle ${esc(zayifKonular[0].konuAdi)} için telafi çalışması; ardından ${zayifKonular.slice(1, 3).map(k => esc(k.konuAdi)).join(' ve ') || 'genel tekrar'} için ödev planlanmalı.`
            : 'Konu bazlı yeterli veri oluşunca öneriler otomatik üretilecek.')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:14px; font-size:9px; color:#475569; font-weight:600;">
          <span>Veli İmzası: ______________________</span>
          <span>Koç İmzası: ______________________</span>
        </div>
        <div class="koc-alt">${altBilgi}</div>
      </div>`;

    this.yazdirPdf(sayfa1 + sayfa2 + sayfa3, `Deneme Koc Raporu - ${ogr.adSoyad || ''}`, false);
  },

  renderDenemeRaporu() {
    const container = document.getElementById('view-deneme-raporu');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    const allDenemeler = Store.getDenemeSinavlari();

    // Aktif veya ilk öğrenciyi seç
    if (!this.denemeSelectedOgrenciId) {
      if (Store.data.aktifOgrenciId) {
        this.denemeSelectedOgrenciId = Store.data.aktifOgrenciId;
      } else if (allDenemeler.length > 0) {
        this.denemeSelectedOgrenciId = allDenemeler[0].ogrenciId;
      } else if (allStudents.length > 0) {
        this.denemeSelectedOgrenciId = allStudents[0].id;
      }
    }

    const ogr = Store.getOgrenci(this.denemeSelectedOgrenciId);
    const ogrenciDenemeleri = Store.getDenemeSinavlari(this.denemeSelectedOgrenciId);

    if (!this.denemeSelectedSinavId || !ogrenciDenemeleri.some(d => d.id === this.denemeSelectedSinavId)) {
      this.denemeSelectedSinavId = ogrenciDenemeleri.length > 0 ? ogrenciDenemeleri[0].id : '';
    }

    const aktifDeneme = Store.getDenemeSinavi(this.denemeSelectedSinavId);

    // Eğer hiç deneme yoksa Empty State
    if (allDenemeler.length === 0 || !aktifDeneme) {
      const html = `
        <div class="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
          <!-- Üst Başlık -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule)]">
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-bold font-display text-[var(--color-ink)]">Deneme Sınavı Raporu & Analiz</h1>
                <span class="meta-pill">Excel & Optik Analiz</span>
              </div>
              <p class="text-xs text-[var(--color-ink-muted)] mt-1">Optik ve Excel deneme sınavı sonuç belgelerini yükleyin; netleri, sıralamaları ve konu bazlı eksikleri anında analiz edin.</p>
            </div>
          </div>

          <!-- Empty State Kutusu -->
          <div class="p-12 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] text-xs text-[var(--color-ink-muted)] space-y-4 max-w-xl mx-auto mt-8 shadow-xs">
            <div class="w-14 h-14 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center mx-auto text-[var(--color-accent)]">
              <i data-lucide="file-spreadsheet" class="w-7 h-7"></i>
            </div>
            <div class="space-y-1">
              <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Henüz Deneme Sınavı Yüklenmemiş</h3>
              <p class="text-xs leading-relaxed max-w-md mx-auto">
                Kurum veya okul deneme sınavlarının Excel (.xlsx) veya CSV sonuç belgelerini sisteme yükleyerek öğrencinin net grafiğini ve konu eksiklerini görebilir, doğrudan eksik kazanımlara yönelik ödev ve telafi planı oluşturabilirsiniz.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button onclick="App.triggerDenemeUpload()" class="btn-tactile btn-tactile-primary text-xs py-2 px-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center font-semibold">
                <i data-lucide="upload" class="w-4 h-4"></i>
                <span>Excel veya CSV Dosyası Yükle</span>
              </button>
              <button onclick="App.importSampleDeneme()" class="btn-tactile btn-tactile-ghost text-xs py-2 px-4 inline-flex items-center gap-2 w-full sm:w-auto justify-center border border-[var(--color-rule)]">
                <i data-lucide="sparkles" class="w-4 h-4 text-[var(--color-accent)]"></i>
                <span>8. Sınıf Örnek Deneme Yükle</span>
              </button>
            </div>
          </div>
        </div>
      `;
      container.innerHTML = html;
      if (window.lucide) lucide.createIcons();
      return;
    }

    // Deneme Mevcut: Hesaplamalar
    const d = aktifDeneme;
    const dersler = d.dersler || [];
    const konular = d.konular || [];
    const toplam = d.toplam || { soruSayisi: 0, dogru: 0, yanlis: 0, net: 0, basariYuzde: 0, kurumNetOrt: 0, sinavNetOrt: 0 };
    const dereceler = d.dereceler || { sube: 0, subeKatilim: 0, kurum: 0, kurumKatilim: 0, genel: 0, genelKatilim: 0 };

    const eksikKonular = konular.filter(k => k.yanlis > 0 || k.basari < 60);
    const tamBasariKonular = konular.filter(k => k.basari === 100);

    // Hatalı Konular Analizi (Ders bazında gruplanmış)
    const hataliKonular = konular.filter(k => k.yanlis > 0);
    const toplamYanlisSayisi = hataliKonular.reduce((acc, cur) => acc + (cur.yanlis || 0), 0);

    const hataliDersMap = {};
    hataliKonular.forEach(k => {
      if (!hataliDersMap[k.ders]) {
        hataliDersMap[k.ders] = {
          ders: k.ders,
          toplamYanlis: 0,
          konular: []
        };
      }
      hataliDersMap[k.ders].toplamYanlis += k.yanlis;
      hataliDersMap[k.ders].konular.push(k);
    });
    const hataliDersGruplari = Object.values(hataliDersMap);

    // G17: Sınav Kapsamına Göre Konu Listesi (Kümülatif vs Tekil Sınav)
    const kronolojikDenemeler = [...ogrenciDenemeleri].sort((a, b) => {
      const tA = new Date(a.sinavTarihi || a.tarih || a.olusturmaTarihi || 0).getTime();
      const tB = new Date(b.sinavTarihi || b.tarih || b.olusturmaTarihi || 0).getTime();
      return tA - tB;
    });

    if (this.denemeKonuKapsami && this.denemeKonuKapsami !== 'tumu' && !ogrenciDenemeleri.some(snv => snv.id === this.denemeKonuKapsami)) {
      this.denemeKonuKapsami = 'tumu';
    }

    const isKumulatifMod = (!this.denemeKonuKapsami || this.denemeKonuKapsami === 'tumu');
    let tabloKonulari = [];
    let seciliTekilDeneme = null;

    if (isKumulatifMod) {
      const konuMap = new Map();
      const normalizeStr = s => (s || '').toString().trim().toLowerCase()
        .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
        .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

      ogrenciDenemeleri.forEach(snv => {
        (snv.konular || []).forEach(k => {
          const key = `${normalizeStr(k.ders)}__${normalizeStr(k.konuAdi)}`;
          if (!konuMap.has(key)) {
            konuMap.set(key, {
              ders: k.ders,
              konuAdi: k.konuAdi,
              soruSayisi: 0,
              dogru: 0,
              yanlis: 0,
              bos: 0,
              denemeSet: new Set(),
              denemeSayisi: 0,
              isKumulatif: true
            });
          }
          const item = konuMap.get(key);
          item.soruSayisi += Number(k.soruSayisi || 0);
          item.dogru += Number(k.dogru || 0);
          item.yanlis += Number(k.yanlis || 0);
          item.bos += Number(k.bos || 0);
          if (!item.denemeSet.has(snv.id)) {
            item.denemeSet.add(snv.id);
            item.denemeSayisi++;
          }
        });
      });

      tabloKonulari = Array.from(konuMap.values()).map(k => {
        const total = k.soruSayisi;
        k.basari = total > 0 ? Math.round((k.dogru / total) * 100) : 0;
        return k;
      });
    } else {
      seciliTekilDeneme = ogrenciDenemeleri.find(snv => snv.id === this.denemeKonuKapsami) || d;
      tabloKonulari = (seciliTekilDeneme.konular || []).map(k => ({
        ders: k.ders,
        konuAdi: k.konuAdi,
        soruSayisi: Number(k.soruSayisi || 0),
        dogru: Number(k.dogru || 0),
        yanlis: Number(k.yanlis || 0),
        bos: Number(k.bos || 0),
        basari: k.basari !== undefined ? k.basari : (k.soruSayisi > 0 ? Math.round((Number(k.dogru || 0) / Number(k.soruSayisi)) * 100) : 0),
        denemeSayisi: 1,
        isKumulatif: false,
        sinavAdi: seciliTekilDeneme.sinavAdi
      }));
    }

    const tabloEksikKonular = tabloKonulari.filter(k => k.yanlis > 0 || k.basari < 60);
    const tabloTamBasariKonular = tabloKonulari.filter(k => k.basari >= 80);
    const benzersizDersler = Array.from(new Set(tabloKonulari.map(k => k.ders)));

    // Filtrelenmiş Konu Listesi
    const dersFilter = (this.denemeDersFilter || '').toUpperCase().trim();
    const durumFilter = this.denemeDurumFilter || 'tumu';
    const searchQuery = (this.denemeSearchQuery || '').toLowerCase().trim();

    const filteredKonular = tabloKonulari.filter(k => {
      if (dersFilter && k.ders.toUpperCase() !== dersFilter) return false;
      if (durumFilter === 'eksik' && (k.yanlis === 0 && k.basari >= 60)) return false;
      if (durumFilter === 'basarili' && k.basari < 80) return false;
      if (searchQuery) {
        const text = `${k.ders} ${k.konuAdi}`.toLowerCase();
        if (!text.includes(searchQuery)) return false;
      }
      return true;
    });

    // ── KOÇ RAPORU: deneme geçmişi + otomatik değerlendirme ──
    const kocKronolojik = [...ogrenciDenemeleri].sort((a, b) => {
      const tA = new Date(a.sinavTarihi || a.olusturmaTarihi || 0).getTime();
      const tB = new Date(b.sinavTarihi || b.olusturmaTarihi || 0).getTime();
      return tA - tB;
    });
    const kocTrTarih = (s) => {
      if (!s) return '—';
      const dt = new Date(s);
      return isNaN(dt.getTime()) ? String(s) : dt.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    const kocNet = (x) => Number((x && x.toplam && x.toplam.net) || 0);
    const kocOrtNet = kocKronolojik.length ? kocKronolojik.reduce((a, x) => a + kocNet(x), 0) / kocKronolojik.length : 0;
    const kocSon = kocKronolojik.length ? kocKronolojik[kocKronolojik.length - 1] : null;
    const kocOnceki = kocKronolojik.length > 1 ? kocKronolojik[kocKronolojik.length - 2] : null;
    const kocNetFark = (kocSon && kocOnceki) ? (kocNet(kocSon) - kocNet(kocOnceki)) : 0;

    const kocNorm = s => (s || '').toString().trim().toLowerCase()
      .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
      .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, '');
    const kocKonuMap = new Map();
    ogrenciDenemeleri.forEach(snv => (snv.konular || []).forEach(k => {
      const key = `${kocNorm(k.ders)}__${kocNorm(k.konuAdi)}`;
      if (!kocKonuMap.has(key)) {
        kocKonuMap.set(key, { ders: k.ders, konuAdi: k.konuAdi, soru: 0, d: 0, y: 0, denemeSet: new Set() });
      }
      const it = kocKonuMap.get(key);
      it.soru += Number(k.soruSayisi || 0);
      it.d += Number(k.dogru || 0);
      it.y += Number(k.yanlis || 0);
      it.denemeSet.add(snv.id);
    }));
    const kocKonular = Array.from(kocKonuMap.values()).map(k => Object.assign({}, k, {
      basari: k.soru > 0 ? Math.round((k.d / k.soru) * 100) : 0,
      denemeSayisi: k.denemeSet.size
    }));
    const kocZayiflar = [...kocKonular].filter(k => k.y > 0)
      .sort((a, b) => b.y - a.y || a.basari - b.basari).slice(0, 4);
    const kocGucluler = [...kocKonular].filter(k => k.soru >= 3 && k.basari >= 80)
      .sort((a, b) => b.basari - a.basari).slice(0, 3);
    const kocTekrar = [...kocKonular].filter(k => k.denemeSayisi >= 2 && k.y >= 2)
      .sort((a, b) => b.y - a.y).slice(0, 3);

    // Karşılaştırma Modülü Hesaplamaları (G9)
    const digerDenemeler = ogrenciDenemeleri.filter(snv => snv.id !== d.id);
    let refDeneme = null;
    if (digerDenemeler.length > 0) {
      if (this.denemeKarsilastirmaRefId && digerDenemeler.some(snv => snv.id === this.denemeKarsilastirmaRefId)) {
        refDeneme = digerDenemeler.find(snv => snv.id === this.denemeKarsilastirmaRefId);
      } else {
        const currIdx = ogrenciDenemeleri.findIndex(snv => snv.id === d.id);
        if (currIdx >= 0 && currIdx + 1 < ogrenciDenemeleri.length) {
          refDeneme = ogrenciDenemeleri[currIdx + 1];
        } else {
          refDeneme = digerDenemeler[0];
        }
        this.denemeKarsilastirmaRefId = refDeneme ? refDeneme.id : null;
      }
    } else {
      this.denemeKarsilastirmaRefId = null;
    }

    let diffNetNum = 0;
    let diffNetStr = '0.0';
    let diffPuanNum = 0;
    let diffPuanStr = '0.0';
    let dersFarklari = [];
    let enCokYukselen = null;
    let destekIhtiyac = null;

    if (refDeneme) {
      const currNet = parseFloat(toplam.net || 0);
      const refNet = parseFloat(refDeneme.toplam?.net || 0);
      diffNetNum = parseFloat((currNet - refNet).toFixed(2));
      diffNetStr = diffNetNum > 0 ? `+${diffNetNum.toFixed(1)}` : `${diffNetNum.toFixed(1)}`;

      const currPuan = parseFloat(d.puan || 0);
      const refPuan = parseFloat(refDeneme.puan || 0);
      diffPuanNum = parseFloat((currPuan - refPuan).toFixed(1));
      diffPuanStr = diffPuanNum > 0 ? `+${diffPuanNum.toFixed(1)}` : `${diffPuanNum.toFixed(1)}`;

      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
      const refDersler = refDeneme.dersler || [];

      dersFarklari = dersler.map(cd => {
        const rd = refDersler.find(item => norm(item.ders) === norm(cd.ders));
        const cNet = parseFloat(cd.net || 0);
        const rNet = rd ? parseFloat(rd.net || 0) : 0;
        const diff = parseFloat((cNet - rNet).toFixed(2));
        const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`;
        return {
          ders: cd.ders,
          currNet: cNet,
          refNet: rNet,
          diff,
          diffStr
        };
      });

      const pozitifler = dersFarklari.filter(x => x.diff > 0).sort((a, b) => b.diff - a.diff);
      if (pozitifler.length > 0) {
        enCokYukselen = pozitifler[0];
      }

      const negatifler = dersFarklari.filter(x => x.diff < 0).sort((a, b) => a.diff - b.diff);
      if (negatifler.length > 0) {
        destekIhtiyac = negatifler[0];
      }
    }

    const html = `
      <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <!-- 1. ÜST BAŞLIK & AKSİYONLAR -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold font-display text-[var(--color-ink)]">Deneme Sınavı Raporu & Analiz</h1>
              <span class="meta-pill">Excel & Optik Sonuç</span>
            </div>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">
              <strong>${ogr ? ogr.adSoyad : d.ogrenciAdi}</strong> · ${d.sinavAdi} (${d.sinavTarihi})
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="App.triggerDenemeUpload()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-[var(--color-rule)]" title="Yeni bir deneme sonuç Excel/CSV dosyası yükleyin">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>+ Yeni Deneme Yükle</span>
            </button>
            <button onclick="App.printDenemeKarne('${d.id}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm" title="A4 formatında yazdır / PDF kaydet">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i>
              <span>A4 Karne Yazdır</span>
            </button>
            <button onclick="App.printDenemeKocRaporu()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3.5 flex items-center gap-1.5" title="Tüm denemelerin kümülatif analizi + grafikler (A4)">
              <i data-lucide="bar-chart-3" class="w-3.5 h-3.5"></i>
              <span>Koç Raporu (A4)</span>
            </button>
            <button onclick="App.deleteDeneme('${d.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" title="Bu deneme kaydını sil">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <!-- 2. DENEME SEÇİCİ TOOLBAR -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-xs">
          <div class="flex flex-wrap items-center gap-3">
            <!-- Deneme Dropdown -->
            <div class="flex items-center gap-2">
              <label class="text-xs font-semibold text-[var(--color-ink)] shrink-0">Deneme Sınavı:</label>
              <select onchange="App.onDenemeSinavChange(this.value)" class="select-instrument text-xs py-1.5 px-3 min-w-[240px]">
                ${ogrenciDenemeleri.map(snv => `
                  <option value="${snv.id}" ${snv.id === this.denemeSelectedSinavId ? 'selected' : ''}>
                    ${snv.sinavAdi} (${snv.sinavTarihi})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs text-[var(--color-ink-muted)] self-end sm:self-auto">
            <span class="meta-pill font-mono">Şube: <strong>${d.grup || '—'}</strong></span>
            <span class="meta-pill font-mono">Öğr No: <strong>${d.ogrenciNo || (ogr ? ogr.ogrenciNo : '—')}</strong></span>
          </div>
        </div>

        <!-- 2.5 KOÇ RAPORU ÖZETİ -->
        <div class="rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm overflow-hidden">
          <div class="p-4 border-b border-[var(--color-rule)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 class="font-display font-bold text-sm text-[var(--color-ink)] flex items-center gap-2">
                <i data-lucide="clipboard-list" class="w-4 h-4 text-[var(--color-accent)]"></i>
                Koç Raporu — Genel Değerlendirme
              </h3>
              <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                ${kocKronolojik.length} deneme${kocKronolojik.length ? ` · ${kocTrTarih(kocKronolojik[0].sinavTarihi)} – ${kocTrTarih(kocSon.sinavTarihi)}` : ''}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="meta-pill font-mono text-[11px]">Ort. Net: <strong>${kocOrtNet.toFixed(1)}</strong></span>
              <span class="meta-pill font-mono text-[11px] ${kocNetFark >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}">
                Son Net: <strong>${kocNet(kocSon).toFixed(1)}</strong> (${kocNetFark >= 0 ? '+' : ''}${kocNetFark.toFixed(1)})
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12">
            <div class="lg:col-span-5 p-4 lg:border-r border-b lg:border-b-0 border-[var(--color-rule)]">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Deneme Geçmişi (${kocKronolojik.length})</div>
              <div class="space-y-1 max-h-[210px] overflow-y-auto pr-1">
                ${[...kocKronolojik].reverse().map(snv => `
                  <div class="flex items-center justify-between gap-2 text-[11px] py-1 border-b border-[var(--color-rule)]/50 last:border-0">
                    <span class="font-mono text-[var(--color-ink-muted)] shrink-0">${kocTrTarih(snv.sinavTarihi)}</span>
                    <span class="truncate text-[var(--color-ink)] flex-1" title="${this.escapeHtml(snv.sinavAdi || '')}">${this.escapeHtml(snv.sinavAdi || 'Deneme')}</span>
                    <span class="font-mono font-bold shrink-0">${kocNet(snv).toFixed(1)}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="lg:col-span-7 p-4 space-y-3">
              <div class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)]">Koç Değerlendirmesi</div>
              <ul class="text-xs text-[var(--color-ink)] space-y-1.5 leading-relaxed">
                <li>• <strong>${kocKronolojik.length} deneme</strong> girilmiş${kocKronolojik.length ? `; ilk ${kocTrTarih(kocKronolojik[0].sinavTarihi)}, son ${kocTrTarih(kocSon.sinavTarihi)}.` : '.'}</li>
                <li>• Ortalama net <strong>${kocOrtNet.toFixed(1)}</strong>${kocOnceki ? `; son denemede <strong>${kocNet(kocSon).toFixed(1)}</strong> (${kocNetFark >= 0 ? '+' : ''}${kocNetFark.toFixed(1)} net, ${kocNetFark >= 0 ? 'yükseliş' : 'düşüş'}).` : '.'}</li>
                ${kocZayiflar.length ? `<li>• <strong>En çok zorlandığı konular:</strong> ${kocZayiflar.map(k => `${this.escapeHtml(k.konuAdi)} (${k.d}D/${k.y}Y)`).join(' · ')}</li>` : ''}
                ${kocGucluler.length ? `<li>• <strong>Güçlü olduğu konular:</strong> ${kocGucluler.map(k => `${this.escapeHtml(k.konuAdi)} (%${k.basari})`).join(' · ')}</li>` : ''}
                ${kocTekrar.length ? `<li>• <strong>Tekrar eden hatalar (birden çok denemede):</strong> ${kocTekrar.map(k => `${this.escapeHtml(k.konuAdi)} (${k.denemeSayisi} deneme, ${k.y}Y)`).join(' · ')}</li>` : ''}
                ${kocKonular.length === 0 ? '<li>• Konu bazlı D/Y verisi yok (Excel içe aktarımında kazanım sütunu boş olabilir).</li>' : ''}
                <li class="text-[var(--color-ink-muted)]">• <strong>Öneri:</strong> ${kocZayiflar.length
                  ? `Öncelikle ${this.escapeHtml(kocZayiflar[0].konuAdi)} için telafi çalışması planlayın${kocZayiflar.length > 1 ? `; ardından ${kocZayiflar.slice(1, 3).map(k => this.escapeHtml(k.konuAdi)).join(' ve ')} için ödev verin` : ''}.`
                  : 'Konu bazlı yeterli veri oluşunca öneriler otomatik üretilecek.'}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 3. KPI KARTLARI & DENEME KARŞILAŞTIRMA MODÜLÜ (G9) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Sol Taraf (7 Kolon): 4 Temel KPI Kartı (2x2 Grid) -->
          <div class="lg:col-span-7 grid grid-cols-2 gap-3.5">
            <!-- Kart 1: Puan & Net -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-1 shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[11px] font-semibold text-[var(--color-ink-muted)] flex items-center justify-between">
                  <span>Sınav Puanı</span>
                  <i data-lucide="award" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                </div>
                <div class="text-xl font-bold font-mono text-[var(--color-ink)] mt-0.5">${d.puan || '—'}</div>
              </div>
              <div class="text-[11px] text-[var(--color-ink-muted)] pt-1.5 flex items-center justify-between border-t border-[var(--color-rule)]">
                <span>Toplam Net:</span>
                <strong class="font-mono text-[var(--color-accent)] text-xs">${toplam.net} / ${toplam.soruSayisi}</strong>
              </div>
            </div>

            <!-- Kart 2: Sıralama & Dereceler -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-1 shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[11px] font-semibold text-[var(--color-ink-muted)] flex items-center justify-between">
                  <span>Sıralama (Kurum / Genel)</span>
                  <i data-lucide="trophy" class="w-3.5 h-3.5 text-amber-500"></i>
                </div>
                <div class="text-xl font-bold font-mono text-[var(--color-ink)] mt-0.5">
                  ${dereceler.kurum || '—'} <span class="text-xs text-[var(--color-ink-muted)] font-normal">/ ${dereceler.kurumKatilim || '—'}</span>
                </div>
              </div>
              <div class="text-[11px] text-[var(--color-ink-muted)] pt-1.5 flex items-center justify-between border-t border-[var(--color-rule)]">
                <span>Genel Derece:</span>
                <strong class="font-mono text-xs">${dereceler.genel || '—'} / ${dereceler.genelKatilim || '—'}</strong>
              </div>
            </div>

            <!-- Kart 3: Net Ortalaması Kıyaslama -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-1 shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[11px] font-semibold text-[var(--color-ink-muted)] flex items-center justify-between">
                  <span>Ortalamalar Kıyası</span>
                  <i data-lucide="bar-chart-2" class="w-3.5 h-3.5 text-emerald-500"></i>
                </div>
                <div class="flex items-baseline gap-1.5 mt-0.5">
                  <span class="text-xl font-bold font-mono text-[var(--color-ink)]">${toplam.net}</span>
                  <span class="text-[11px] text-[var(--color-ink-muted)] font-mono">Net</span>
                </div>
              </div>
              <div class="text-[10px] text-[var(--color-ink-muted)] pt-1.5 flex items-center justify-between border-t border-[var(--color-rule)]">
                <span>Kurum: <strong>${toplam.kurumNetOrt}</strong></span>
                <span>Sınav: <strong>${toplam.sinavNetOrt}</strong></span>
              </div>
            </div>

            <!-- Kart 4: Eksik & Telafi Durumu -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-1 shadow-xs flex flex-col justify-between">
              <div>
                <div class="text-[11px] font-semibold text-[var(--color-ink-muted)] flex items-center justify-between">
                  <span>Kazanım Eksik Analizi</span>
                  <i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-rose-500"></i>
                </div>
                <div class="text-xl font-bold font-mono ${eksikKonular.length > 0 ? 'text-rose-500' : 'text-emerald-500'} mt-0.5">
                  ${eksikKonular.length} <span class="text-xs font-normal text-[var(--color-ink-muted)]">Kritik Konu</span>
                </div>
              </div>
              <div class="text-[11px] text-[var(--color-ink-muted)] pt-1.5 flex items-center justify-between border-t border-[var(--color-rule)]">
                <span>Tam Başarılı:</span>
                <strong class="font-mono text-emerald-500 text-xs">${tamBasariKonular.length} / ${konular.length}</strong>
              </div>
            </div>
          </div>

          <!-- Sağ Taraf (5 Kolon): Deneme Karşılaştırma Modülü Kartı -->
          <div class="lg:col-span-5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] p-4 shadow-xs flex flex-col justify-between">
            ${refDeneme ? `
              <div class="space-y-3">
                <!-- Başlık ve Referans Sınav Seçici -->
                <div class="flex items-center justify-between gap-2 border-b border-[var(--color-rule)] pb-2.5">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="w-6 h-6 rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center shrink-0 text-[var(--color-accent)]">
                      <i data-lucide="scale" class="w-3.5 h-3.5"></i>
                    </div>
                    <div>
                      <h3 class="font-display font-bold text-xs text-[var(--color-ink)] truncate">Deneme Karşılaştırma</h3>
                      <p class="text-[10px] text-[var(--color-ink-muted)] truncate">Önceki sınavla net ve puan değişimi</p>
                    </div>
                  </div>

                  <!-- Referans Sınav Açılır Kutusu -->
                  <div class="shrink-0 flex items-center gap-1.5">
                    <span class="text-[10px] text-[var(--color-ink-muted)] hidden sm:inline">Kıyas:</span>
                    <select onchange="App.onDenemeKarsilastirmaRefChange(this.value)" class="select-instrument text-[11px] py-1 px-2 max-w-[170px] truncate" title="Karşılaştırılacak referans sınavı seçin">
                      ${digerDenemeler.map(snv => `
                        <option value="${snv.id}" ${snv.id === refDeneme.id ? 'selected' : ''}>
                          ${snv.sinavAdi} (${snv.sinavTarihi || 'Tarihsiz'})
                        </option>
                      `).join('')}
                    </select>
                  </div>
                </div>

                <!-- 1. Toplam Puan ve Net Değişimi (2'li Kutu) -->
                <div class="grid grid-cols-2 gap-2.5">
                  <!-- Net Farkı -->
                  <div class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-between">
                    <div>
                      <span class="text-[10px] font-semibold text-[var(--color-ink-muted)] block">Toplam Net Farkı</span>
                      <div class="flex items-center gap-1 mt-0.5">
                        <span class="font-mono font-bold text-sm ${diffNetNum > 0 ? 'text-emerald-600' : diffNetNum < 0 ? 'text-rose-600' : 'text-[var(--color-ink)]'}">
                          ${diffNetStr}
                        </span>
                        <span class="text-[10px] text-[var(--color-ink-muted)] font-mono">Net</span>
                      </div>
                    </div>
                    <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${diffNetNum > 0 ? 'bg-emerald-500/15 text-emerald-600' : diffNetNum < 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)]'}">
                      <i data-lucide="${diffNetNum > 0 ? 'arrow-up-right' : diffNetNum < 0 ? 'arrow-down-right' : 'minus'}" class="w-4 h-4"></i>
                    </div>
                  </div>

                  <!-- Puan Farkı -->
                  <div class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-between">
                    <div>
                      <span class="text-[10px] font-semibold text-[var(--color-ink-muted)] block">Puan Değişimi</span>
                      <div class="flex items-center gap-1 mt-0.5">
                        <span class="font-mono font-bold text-sm ${diffPuanNum > 0 ? 'text-emerald-600' : diffPuanNum < 0 ? 'text-rose-600' : 'text-[var(--color-ink)]'}">
                          ${diffPuanStr}
                        </span>
                        <span class="text-[10px] text-[var(--color-ink-muted)] font-mono">Puan</span>
                      </div>
                    </div>
                    <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${diffPuanNum > 0 ? 'bg-emerald-500/15 text-emerald-600' : diffPuanNum < 0 ? 'bg-rose-500/15 text-rose-600' : 'bg-[var(--color-paper-2)] text-[var(--color-ink-muted)]'}">
                      <i data-lucide="${diffPuanNum > 0 ? 'trending-up' : diffPuanNum < 0 ? 'trending-down' : 'minus'}" class="w-4 h-4"></i>
                    </div>
                  </div>
                </div>

                <!-- 2. Ders Bazlı Değişim Özeti -->
                <div class="space-y-1 pt-0.5">
                  <div class="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)] font-semibold px-0.5">
                    <span>Ders Bazlı Net Değişimi</span>
                    <span class="font-normal truncate max-w-[150px]">(Ref: ${refDeneme.sinavAdi})</span>
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[110px] overflow-y-auto pr-0.5">
                    ${dersFarklari.map(df => `
                      <div class="p-1.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)]/70 border border-[var(--color-rule)] flex items-center justify-between text-[11px]">
                        <span class="font-medium text-[var(--color-ink)] truncate mr-1" title="${df.ders}">${df.ders}</span>
                        <span class="font-mono font-bold shrink-0 text-[10px] px-1 py-0.2 rounded ${df.diff > 0 ? 'bg-emerald-500/10 text-emerald-600' : df.diff < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-transparent text-[var(--color-ink-muted)]'}">
                          ${df.diffStr}
                        </span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- 3. Gelişim ve Destek İpuçları -->
              <div class="mt-3 pt-2.5 border-t border-[var(--color-rule)] space-y-1 text-[11px]">
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 min-w-0 text-emerald-600">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 shrink-0"></i>
                    <span class="font-semibold text-[10px] uppercase tracking-wide">En Çok Yükselen:</span>
                  </div>
                  <span class="font-bold truncate text-[var(--color-ink)] ${enCokYukselen ? 'text-emerald-600' : 'text-[var(--color-ink-muted)]'}">
                    ${enCokYukselen ? `${enCokYukselen.ders} (${enCokYukselen.diffStr} Net)` : 'Belirgin artış yok'}
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5 min-w-0 text-rose-500">
                    <i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i>
                    <span class="font-semibold text-[10px] uppercase tracking-wide">Desteğe İhtiyaç:</span>
                  </div>
                  <span class="font-bold truncate text-[var(--color-ink)] ${destekIhtiyac ? 'text-rose-600' : 'text-[var(--color-ink-muted)]'}">
                    ${destekIhtiyac ? `${destekIhtiyac.ders} (${destekIhtiyac.diffStr} Net)` : 'Belirgin düşüş yok'}
                  </span>
                </div>
              </div>
            ` : `
              <!-- Bilgilendirme Durumu (Tek Deneme Sınavı Varsa) -->
              <div class="space-y-3 my-auto">
                <div class="flex items-center gap-2 border-b border-[var(--color-rule)] pb-2.5">
                  <div class="w-6 h-6 rounded-md bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center shrink-0 text-[var(--color-accent)]">
                    <i data-lucide="scale" class="w-3.5 h-3.5"></i>
                  </div>
                  <div>
                    <h3 class="font-display font-bold text-xs text-[var(--color-ink)]">Deneme Karşılaştırma</h3>
                    <p class="text-[10px] text-[var(--color-ink-muted)]">Performans ve gelişim trendi</p>
                  </div>
                </div>

                <div class="p-4 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-center space-y-2">
                  <div class="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-accent-border)] flex items-center justify-center mx-auto text-[var(--color-accent)]">
                    <i data-lucide="info" class="w-4 h-4"></i>
                  </div>
                  <p class="text-xs font-semibold text-[var(--color-ink)]">Karşılaştırma için en az iki deneme sınavı kaydı gereklidir.</p>
                  <p class="text-[11px] text-[var(--color-ink-muted)] leading-relaxed">
                    Öğrencinin ikinci bir deneme sonucu yüklendiğinde; net/puan farkları, ders bazlı değişimler ve gelişim ipuçları burada otomatik görüntülenecektir.
                  </p>
                </div>
              </div>

              <div class="pt-2 text-right">
                <button onclick="App.triggerDenemeUpload()" class="btn-tactile btn-tactile-ghost text-[11px] py-1 px-2.5 inline-flex items-center gap-1.5 border border-[var(--color-rule)]">
                  <i data-lucide="upload" class="w-3 h-3 text-[var(--color-accent)]"></i>
                  <span>Yeni Deneme Yükle</span>
                </button>
              </div>
            `}
          </div>
        </div>

        <!-- 4. DERS BAZLI NET VE BAŞARI TABLOSU -->
        <div class="p-4 md:p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-3 shadow-xs">
          <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
            <div class="flex items-center gap-2">
              <i data-lucide="book-open" class="w-4 h-4 text-[var(--color-accent)]"></i>
              <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Ders Bazlı Sonuç ve Net Dağılımı</h3>
            </div>
            <span class="text-xs text-[var(--color-ink-muted)]">Doğru, yanlış ve sınav ortalamaları karşılaştırması</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-left text-[var(--color-ink-muted)] border-b border-[var(--color-rule)]">
                  <th class="py-2 px-3 font-semibold">Ders</th>
                  <th class="py-2 px-2 text-center font-semibold">Soru</th>
                  <th class="py-2 px-2 text-center font-semibold text-emerald-600">Doğru</th>
                  <th class="py-2 px-2 text-center font-semibold text-rose-500">Yanlış</th>
                  <th class="py-2 px-3 text-center font-bold text-[var(--color-ink)]">Net</th>
                  <th class="py-2 px-2 text-center font-semibold">Başarı</th>
                  <th class="py-2 px-2 text-center font-semibold text-[var(--color-ink-muted)]">Kurum Ort.</th>
                  <th class="py-2 px-2 text-center font-semibold text-[var(--color-ink-muted)]">Sınav Ort.</th>
                  <th class="py-2 px-3 text-left font-semibold">Kıyaslama</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--color-rule)]">
                ${dersler.map(ds => {
                  const fark = (ds.net - ds.sinavNetOrt).toFixed(1);
                  const isPozitif = parseFloat(fark) >= 0;
                  return `
                    <tr class="hover:bg-[var(--color-paper-3)] transition-colors">
                      <td class="py-2 px-3 font-bold text-[var(--color-ink)]">${ds.ders}</td>
                      <td class="py-2 px-2 text-center font-mono">${ds.soruSayisi}</td>
                      <td class="py-2 px-2 text-center font-mono font-bold text-emerald-600">${ds.dogru}</td>
                      <td class="py-2 px-2 text-center font-mono font-bold text-rose-500">${ds.yanlis}</td>
                      <td class="py-2 px-3 text-center font-mono font-bold text-[var(--color-ink)] bg-[var(--color-paper-3)]/60 rounded">${ds.net}</td>
                      <td class="py-2 px-2 text-center font-mono">${ds.basariYuzde}%</td>
                      <td class="py-2 px-2 text-center font-mono text-[var(--color-ink-muted)]">${ds.kurumNetOrt}</td>
                      <td class="py-2 px-2 text-center font-mono text-[var(--color-ink-muted)]">${ds.sinavNetOrt}</td>
                      <td class="py-2 px-3">
                        <span class="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded ${isPozitif ? 'bg-emerald-500/10 text-emerald-600 font-semibold' : 'bg-rose-500/10 text-rose-600 font-semibold'}">
                          ${isPozitif ? '+' + fark : fark} Net
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                <!-- Toplam Satırı -->
                <tr class="bg-[var(--color-paper-3)] font-bold text-[var(--color-ink)] border-t-2 border-[var(--color-rule)]">
                  <td class="py-2.5 px-3">GENEL TOPLAM</td>
                  <td class="py-2.5 px-2 text-center font-mono">${toplam.soruSayisi}</td>
                  <td class="py-2.5 px-2 text-center font-mono text-emerald-600">${toplam.dogru}</td>
                  <td class="py-2.5 px-2 text-center font-mono text-rose-500">${toplam.yanlis}</td>
                  <td class="py-2.5 px-3 text-center font-mono text-sm text-[var(--color-accent)]">${toplam.net}</td>
                  <td class="py-2.5 px-2 text-center font-mono">${toplam.basariYuzde}%</td>
                  <td class="py-2.5 px-2 text-center font-mono text-[var(--color-ink-muted)]">${toplam.kurumNetOrt}</td>
                  <td class="py-2.5 px-2 text-center font-mono text-[var(--color-ink-muted)]">${toplam.sinavNetOrt}</td>
                  <td class="py-2.5 px-3">
                    <span class="text-[11px] font-mono font-semibold text-[var(--color-accent)]">
                      ${(toplam.net - toplam.sinavNetOrt).toFixed(1)} Net Fark
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. KONU & KAZANIM ANALİZİ VE AKSİYON MERKEZİ -->
        <div class="p-4 md:p-5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-4 shadow-xs">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-rule)]">
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <i data-lucide="target" class="w-4 h-4 text-[var(--color-accent)]"></i>
                <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Konu / Kazanım Başarı Analizi & Aksiyon Merkezi</h3>
                ${hataliKonular.length > 0 ? `
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    ${hataliKonular.length} Konuda ${toplamYanlisSayisi} Yanlış
                  </span>
                ` : `
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Sıfır Hata
                  </span>
                `}
              </div>
              <p class="text-xs text-[var(--color-ink-muted)] mt-0.5">
                Yanlış yapılan eksik konulara tek tıkla <strong>ödev ata</strong> veya telafi için <strong>Hata Defterine ekle</strong>.
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              ${hataliKonular.length > 0 ? `
                <button onclick="App.addTumHataliKonularHataDefterine('${ogr ? ogr.id : d.ogrenciId}', '${d.id}')" class="btn-tactile text-xs py-1 px-3 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-semibold border border-rose-500/20 flex items-center gap-1.5" title="Tüm hatalı konuları tek seferde deftere ekle">
                  <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                  <span>Tüm Hataları Deftere Ekle</span>
                </button>
              ` : ''}
              <!-- Filtre Sekmeleri -->
              <div class="flex items-center gap-1 p-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs">
                <button onclick="App.denemeDurumFilter = 'tumu'; App.renderDenemeRaporu();" class="btn-tactile text-xs py-1 px-2.5 ${durumFilter === 'tumu' ? 'btn-tactile-primary font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
                  Tümü (${tabloKonulari.length})
                </button>
                <button onclick="App.denemeDurumFilter = 'eksik'; App.renderDenemeRaporu();" class="btn-tactile text-xs py-1 px-2.5 ${durumFilter === 'eksik' ? 'btn-tactile-primary font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
                  ⚠️ Kritik Eksikler (${tabloEksikKonular.length})
                </button>
                <button onclick="App.denemeDurumFilter = 'basarili'; App.renderDenemeRaporu();" class="btn-tactile text-xs py-1 px-2.5 ${durumFilter === 'basarili' ? 'btn-tactile-primary font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
                  ✅ Başarılı (${tabloTamBasariKonular.length})
                </button>
              </div>
            </div>
          </div>

          <!-- Filtreleme Çubuğu (Sınav Kapsamı, Ders Seçici & Arama) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- G17: Sınav Kapsamı Seçici (Kümülatif vs Tekil) -->
              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-[var(--color-ink-muted)] shrink-0">Sınav Kapsamı:</label>
                <select onchange="App.denemeKonuKapsami = this.value; App.renderDenemeRaporu();" class="select-instrument text-xs py-1.5 px-3 min-w-[210px] font-medium">
                  <option value="tumu" ${isKumulatifMod ? 'selected' : ''}>Tüm Denemeler (Kümülatif Özet)</option>
                  ${kronolojikDenemeler.map((snv, idx) => {
                    const snvTarih = snv.tarih ? App.formatDate(snv.tarih) : (snv.olusturmaTarihi ? App.formatDate(snv.olusturmaTarihi) : '');
                    const label = `${idx + 1}. Deneme${snvTarih ? ` (${snvTarih})` : ''} — ${snv.sinavAdi}`;
                    return `<option value="${snv.id}" ${this.denemeKonuKapsami === snv.id ? 'selected' : ''}>${label}</option>`;
                  }).join('')}
                </select>
              </div>

              <!-- Ders Filtresi -->
              <div class="flex items-center gap-2">
                <label class="text-xs font-semibold text-[var(--color-ink-muted)] shrink-0">Ders Filtresi:</label>
                <select onchange="App.denemeDersFilter = this.value; App.renderDenemeRaporu();" class="select-instrument text-xs py-1.5 px-3 min-w-[140px]">
                  <option value="" ${!this.denemeDersFilter ? 'selected' : ''}>Tüm Dersler (${tabloKonulari.length})</option>
                  ${benzersizDersler.map(dAd => `
                    <option value="${dAd}" ${this.denemeDersFilter.toUpperCase() === dAd.toUpperCase() ? 'selected' : ''}>${dAd}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <!-- Arama Kutusu -->
            <div class="relative flex-1 sm:max-w-xs">
              <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"></i>
              <input
                type="text"
                placeholder="Konu veya kazanım ara..."
                value="${this.denemeSearchQuery || ''}"
                oninput="App.denemeSearchQuery = this.value; App.renderDenemeRaporu();"
                class="w-full pl-8 pr-7 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              ${this.denemeSearchQuery ? `
                <button onclick="App.denemeSearchQuery = ''; App.renderDenemeRaporu();" class="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Konu Tablosu -->
          ${filteredKonular.length === 0 ? `
            <div class="p-8 text-center bg-[var(--color-paper-3)] rounded-[var(--radius-md)] text-xs text-[var(--color-ink-muted)] space-y-1">
              <i data-lucide="check-circle" class="w-8 h-8 text-[var(--color-ink-faint)] mx-auto mb-2"></i>
              <p class="font-semibold text-[var(--color-ink)]">Filtre kriterlerine uygun konu bulunamadı.</p>
              <p>Filtreleri temizleyebilir veya tüm konular sekmesine dönebilirsiniz.</p>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-left text-[var(--color-ink-muted)] border-b border-[var(--color-rule)]">
                    <th class="py-2 px-3 font-semibold">Ders</th>
                    <th class="py-2 px-3 font-semibold">Konu / Kazanım Adı</th>
                    <th class="py-2 px-2 text-center font-semibold">Deneme Sayısı</th>
                    <th class="py-2 px-2 text-center font-semibold">Soru</th>
                    <th class="py-2 px-2 text-center font-semibold text-emerald-600">D</th>
                    <th class="py-2 px-2 text-center font-semibold text-rose-500">Y</th>
                    <th class="py-2 px-3 text-center font-semibold">Başarı</th>
                    <th class="py-2 px-3 text-right font-semibold">Aksiyonlar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--color-rule)]">
                  ${filteredKonular.map(k => {
                    const isEksik = k.yanlis > 0 || k.basari < 60;
                    const coachNote = isKumulatifMod
                      ? `Son ${k.denemeSayisi} denemede ${k.soruSayisi} soruda ${k.yanlis} yanlış - %${k.basari} başarı`
                      : `[${(seciliTekilDeneme && seciliTekilDeneme.sinavAdi) || d.sinavAdi || 'Deneme Sınavı'}] ${k.soruSayisi} soruda ${k.yanlis} yanlış - %${k.basari} başarı`;
                    return `
                      <tr class="hover:bg-[var(--color-paper-3)] transition-colors ${isEksik ? 'bg-amber-500/[0.03]' : ''}">
                        <td class="py-2.5 px-3">
                          <span class="meta-pill text-[10px] font-bold">${k.ders}</span>
                        </td>
                        <td class="py-2.5 px-3 font-medium text-[var(--color-ink)] max-w-md">
                          <div class="leading-relaxed">${k.konuAdi}</div>
                        </td>
                        <td class="py-2.5 px-2 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                            k.denemeSayisi > 1 ? 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 font-bold' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] border border-[var(--color-rule)]'
                          }">
                            ${k.denemeSayisi} Deneme
                          </span>
                        </td>
                        <td class="py-2.5 px-2 text-center font-mono font-semibold">${k.soruSayisi}</td>
                        <td class="py-2.5 px-2 text-center font-mono text-emerald-600 font-bold">${k.dogru}</td>
                        <td class="py-2.5 px-2 text-center font-mono text-rose-500 font-bold">${k.yanlis}</td>
                        <td class="py-2.5 px-3 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            k.basari >= 80 ? 'bg-emerald-500/10 text-emerald-600' :
                            k.basari >= 50 ? 'bg-blue-500/10 text-blue-600' :
                            k.basari >= 0 ? 'bg-amber-500/10 text-amber-600' :
                            'bg-rose-500/10 text-rose-600'
                          }">
                            ${k.basari}%
                          </span>
                        </td>
                        <td class="py-2.5 px-3 text-right">
                          <div class="inline-flex items-center justify-end gap-1.5">
                            <!-- Hızlı Ödev Butonu (G17: Koç notu doldurulmuş) -->
                            <button
                              onclick="App.openGorevModalFromDeneme('${ogr ? ogr.id : d.ogrenciId}', '${k.ders.replace(/'/g, "\\'")}', '${k.konuAdi.replace(/'/g, "\\'")}', '${coachNote.replace(/'/g, "\\'")}')"
                              class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] inline-flex items-center gap-1 font-medium"
                              title="Bu konu için öğrenciye ödev ekle"
                            >
                              <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i>
                              <span>Ödev Ekle</span>
                            </button>

                            <!-- Hata Defterine Ekle Butonu -->
                            ${(() => {
                              if (k.yanlis === 0) return '';
                              const isHataVar = (Store.data.hataKayitlari || []).some(h =>
                                String(h.ogrenciId) === String(ogr ? ogr.id : d.ogrenciId) &&
                                h.aciklama && h.aciklama.includes(k.konuAdi)
                              );
                              const sinavEtiket = isKumulatifMod ? `Kümülatif (${k.denemeSayisi} Deneme)` : ((seciliTekilDeneme && seciliTekilDeneme.sinavAdi) || d.sinavAdi || 'Deneme');
                              return `
                                <button
                                  onclick="App.toggleHataFromDeneme('${ogr ? ogr.id : d.ogrenciId}', '${k.ders.replace(/'/g, "\\'")}', '${k.konuAdi.replace(/'/g, "\\'")}', ${k.yanlis}, '${sinavEtiket.replace(/'/g, "\\'")}')"
                                  class="btn-tactile text-xs py-1 px-2.5 ${isHataVar ? 'text-emerald-700 bg-emerald-500/10 hover:bg-rose-500/10 hover:text-rose-600 border border-emerald-500/20' : 'btn-tactile-ghost text-rose-600 hover:bg-rose-500/10 border border-rose-500/20'} inline-flex items-center gap-1 font-medium"
                                  title="${isHataVar ? 'Hata Defterinde kayıtlı. Çıkarmak için tıklayın.' : 'Hata Defterine ekle'}"
                                >
                                  <i data-lucide="${isHataVar ? 'check-circle-2' : 'plus-circle'}" class="w-3.5 h-3.5 ${isHataVar ? 'text-emerald-600' : ''}"></i>
                                  <span>${isHataVar ? '✓ Defterde' : 'Hata Defterine Ekle'}</span>
                                </button>
                              `;
                            })()}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
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
    if (ogrId) {
      Store.setAktifOgrenci(ogrId);
      this.populateStudentDropdown();
      this.updateGlobalBadges();
    }
    this.renderHataDefteri();
  },

  renderHataDefteri() {
    const container = document.getElementById('view-hata-defteri');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    if (Store.data.aktifOgrenciId && allStudents.some(o => o.id === Store.data.aktifOgrenciId)) {
      this.hataSelectedOgrenciId = Store.data.aktifOgrenciId;
    } else if (!this.hataSelectedOgrenciId && allStudents.length > 0) {
      this.hataSelectedOgrenciId = allStudents[0].id;
    }

    const ogr = Store.getOgrenci(this.hataSelectedOgrenciId);
    const isA4 = this.hataAktifSekme === 'a4';

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Sekme Seçici -->
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center p-1 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)]">
              <button onclick="App.setHataSekme('a4')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${isA4 ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="edit-3" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Hata Defteri
              </button>
              <button onclick="App.setHataSekme('dijital')" class="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all ${!isA4 ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] shadow-xs border border-[var(--color-rule-strong)]' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <i data-lucide="layers" class="w-3.5 h-3.5 inline-block mr-1.5"></i>Dijital Havuz
              </button>
            </div>
          </div>

          <!-- Sağ Kısım: Butonlar -->
          <div class="flex items-center gap-2.5">
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
    const hatalar = Store.getHatalar(ogr.id);

    const araclar = `
      <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs">
        <div class="flex items-center gap-2">
          <span class="text-[var(--color-ink-muted)] font-medium">Görünüm:</span>
          <div class="flex items-center bg-[var(--color-paper-2)] p-0.5 rounded-[var(--radius-xs)] border border-[var(--color-rule)]">
            <button onclick="App.setHataA4Rapor(false)" class="px-2.5 py-1 rounded-[var(--radius-xs)] font-semibold transition-all ${!this.hataA4Rapor ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
              Düzenle
            </button>
            <button onclick="App.setHataA4Rapor(true)" class="px-2.5 py-1 rounded-[var(--radius-xs)] font-semibold transition-all ${this.hataA4Rapor ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
              A4 Önizleme
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5">
            <span class="text-[var(--color-ink-muted)] font-medium">Boş satır:</span>
            <div class="flex items-center gap-1">
              ${[10, 15, 20].map(cnt => `
                <button onclick="App.setHataSatirSayisi(${cnt})" class="px-2.5 py-1 rounded-[var(--radius-xs)] font-mono font-semibold transition-all ${this.hataSatirSayisi === cnt ? 'bg-[var(--color-paper-1)] text-[var(--color-ink)] border border-[var(--color-rule-strong)] shadow-xs' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]'}">
                  ${cnt}
                </button>
              `).join('')}
            </div>
          </div>
          <span class="font-mono text-[var(--color-ink-muted)]">Toplam: <strong class="text-[var(--color-ink)]">${hatalar.length}</strong></span>
        </div>
      </div>
    `;

    if (this.hataA4Rapor) {
      return `
        <div class="space-y-4">
          ${araclar}
          <div class="overflow-x-auto flex justify-center pb-8">
            <div id="cizelge-preview-area" class="w-full flex justify-center">
              ${this.renderHataA4HTML(ogr)}
            </div>
          </div>
        </div>
      `;
    }

    return `<div class="space-y-4">${araclar}${this.renderHataDuzenleGrid(ogr)}</div>`;
  },

  // ─── HATA DEFTERİ: ETKİLEŞİMLİ UYGULAMA SAYFASI (satır içi düzenleme) ───
  renderHataDuzenleGrid(ogr) {
    const dersler = Store.getDerslerForOgrenci(ogr);
    const hatalar = Store.getHatalar(ogr.id);
    const bosSatir = this.hataSatirSayisi || 15;
    const bugunStr = new Date().toISOString().split('T')[0];

    const dersOpt = (sec) => '<option value="">— Ders —</option>' + dersler
      .map(d => `<option value="${d.id}" ${String(sec) === String(d.id) ? 'selected' : ''}>${d.ad}</option>`).join('');
    const konuOpt = (dersId, sec) => {
      const konular = dersId ? Store.getKonularForDers(dersId) : [];
      return '<option value="">— Konu —</option>' + konular
        .map(k => `<option value="${k.id}" ${String(sec) === String(k.id) ? 'selected' : ''}>${k.konuAdi}</option>`).join('');
    };
    const turOpt = (sec) => HATA_TURLERI
      .map(t => `<option value="${t.id}" ${sec === t.id ? 'selected' : ''}>${t.label}</option>`).join('');

    const satir = (h) => {
      const id = h ? h.id : '';
      const asama = h ? (Number(h.asama) || 1) : 1;
      const isDone = h ? Boolean(h.telafiDurumu) : false;
      const isOverdue = h && !isDone && h.tekrarTarihi && h.tekrarTarihi < bugunStr;
      const telafiEtiket = isDone ? '✔ Tamam' : (asama === 1 ? '1g' : asama === 2 ? '3g' : asama === 3 ? '7g' : '—');

      return `
        <tr class="${isDone ? 'bg-[var(--color-success-bg)]/15' : isOverdue ? 'bg-[var(--color-danger-bg)]/15' : ''}">
          <td class="p-1.5 border border-[var(--color-rule)]">
            <select data-hata-id="${id}" data-alan="dersId" onchange="App.hataInlineKaydet(this)"
              class="w-full min-w-[130px] text-xs py-1 px-1.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              ${dersOpt(h && h.dersId)}
            </select>
          </td>
          <td class="p-1.5 border border-[var(--color-rule)]">
            <select data-hata-id="${id}" data-alan="konuId" onchange="App.hataInlineKaydet(this)"
              class="w-full min-w-[160px] text-xs py-1 px-1.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              ${konuOpt(h && h.dersId, h && h.konuId)}
            </select>
          </td>
          <td class="p-1.5 border border-[var(--color-rule)]">
            <select data-hata-id="${id}" data-alan="hataTuru" onchange="App.hataInlineKaydet(this)"
              class="w-full min-w-[130px] text-xs py-1 px-1.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
              ${turOpt(h && h.hataTuru)}
            </select>
          </td>
          <td class="p-1.5 border border-[var(--color-rule)]">
            <input type="text" data-hata-id="${id}" data-alan="aciklama" onchange="App.hataInlineKaydet(this)"
              value="${h && h.aciklama ? String(h.aciklama).replace(/"/g, '&quot;') : ''}"
              placeholder="Hata / doğrusu / not..."
              class="w-full min-w-[220px] text-xs py-1 px-1.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-2)] border border-[var(--color-rule)]">
          </td>
          <td class="p-1.5 border border-[var(--color-rule)]">
            <input type="date" data-hata-id="${id}" data-alan="tekrarTarihi" onchange="App.hataInlineKaydet(this)"
              value="${h && h.tekrarTarihi ? h.tekrarTarihi : ''}"
              class="text-xs py-1 px-1.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] font-mono">
          </td>
          <td class="p-1.5 border border-[var(--color-rule)] text-center whitespace-nowrap">
            ${h ? (isDone
              ? `<span class="meta-pill text-[10px] text-[var(--color-success)]">✔ Tamam</span>`
              : `<button onclick="App.hataInlineTelafi('${id}')" class="meta-pill text-[10px] cursor-pointer hover:border-[var(--color-accent)]" title="Telafi adımını ilerlet (1g → 3g → 7g → tamam)">${telafiEtiket} ›</button>`) : ''}
          </td>
          <td class="p-1.5 border border-[var(--color-rule)] text-center">
            ${h ? `<button onclick="App.hataInlineSil('${id}')" class="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-[var(--radius-xs)] p-1" title="Sil"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>` : ''}
          </td>
        </tr>
      `;
    };

    return `
      <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
        <div class="p-3 border-b border-[var(--color-rule)]">
          <h3 class="font-display font-bold text-sm text-[var(--color-ink)]">Hata Defteri — Düzenle</h3>
          <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Satırları aşağıdan doldurun; değişiklikler anında kaydedilir. Alt satırlar yeni kayıt içindir. A4 çıktısı için üstteki <strong>Yazdır (A4 Yatay)</strong> butonunu kullanın.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs border-collapse">
            <thead>
              <tr class="bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] text-[10px] uppercase tracking-wide">
                <th class="p-2 text-left border border-[var(--color-rule)]">Ders</th>
                <th class="p-2 text-left border border-[var(--color-rule)]">Konu</th>
                <th class="p-2 text-left border border-[var(--color-rule)]">Hata Türü</th>
                <th class="p-2 text-left border border-[var(--color-rule)]">Açıklama / Doğrusu</th>
                <th class="p-2 text-left border border-[var(--color-rule)]">Tekrar Tarihi</th>
                <th class="p-2 text-center border border-[var(--color-rule)]">Telafi</th>
                <th class="p-2 border border-[var(--color-rule)]"></th>
              </tr>
            </thead>
            <tbody>
              ${hatalar.map(satir).join('')}
              ${Array.from({ length: bosSatir }).map(() => satir(null)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setHataA4Rapor(flag) {
    this.hataA4Rapor = Boolean(flag);
    this.renderHataDefteri();
  },

  // Satır içi alan değişikliği: mevcut kaydı günceller, boş satırda yeni kayıt açar
  hataInlineKaydet(el) {
    const id = el.getAttribute('data-hata-id') || '';
    const alan = el.getAttribute('data-alan');
    const deger = (el.value || '').trim();

    if (id) {
      const upd = {};
      upd[alan] = deger;
      if (alan === 'dersId') upd.konuId = ''; // ders değişince konu sıfırlanır
      Store.updateHata(id, upd);
    } else {
      if (!deger || alan === 'konuId') return; // konu, ders seçilmeden anlamsız
      const veri = { ogrenciId: this.hataSelectedOgrenciId };
      if (alan === 'dersId') veri.dersId = deger;
      if (alan === 'hataTuru') veri.hataTuru = deger;
      if (alan === 'aciklama') veri.aciklama = deger;
      if (alan === 'tekrarTarihi') veri.tekrarTarihi = deger;
      Store.addHata(veri);
    }
    this.renderHataDefteri();
  },

  hataInlineSil(id) {
    Store.deleteHata(id);
    this.renderHataDefteri();
    this.showToast('Hata kaydı silindi');
  },

  hataInlineTelafi(id) {
    Store.telafiIlerletHata(id);
    this.renderHataDefteri();
  },

  renderHataA4HTML(ogr) {
    const bugunTarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const modul = Store.getModulForOgrenci(ogr);
    const modulAd = modul ? modul.ad : (ogr.modulId || '');

    const hatalar = this.hataFormModu === 'dolu' ? Store.getHatalar(ogr.id) : [];
    const satirSayisi = this.hataSatirSayisi || 15;
    const rowHeight = Math.max(25, Math.min(44, Math.floor(495 / satirSayisi)));

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
      <div class="print-page-yatay text-slate-900 leading-normal" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; width: 100%; padding: 5mm 7mm; display: flex; flex-direction: column; justify-content: space-between;">
        <!-- Üst Başlık Bandı + Hata Tablosu -->
        <div>
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-2.5 mb-3">
            <div>
              <div class="text-[9.5px] font-bold uppercase tracking-widest text-slate-500">PLANTRACK AKADEMİK TELAFİ TAKİP SİSTEMİ</div>
              <h1 class="font-black text-lg tracking-tight uppercase text-slate-900 leading-tight">HATA DEFTERİ & TELAFİ FORMU (1-3-7 GÜN DÖNGÜSÜ)</h1>
            </div>
            <div class="flex items-center gap-5 text-xs bg-slate-50 border border-slate-300 rounded px-3.5 py-1.5">
              <div>
                <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Öğrenci:</span>
                <span class="font-bold text-slate-900 text-xs">${ogr.ad} ${ogr.soyad}</span>
              </div>
              <div class="border-l border-slate-300 pl-4">
                <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Sınıf & Modül:</span>
                <span class="font-semibold text-slate-900 text-xs">${ogr.sinif ? ogr.sinif + '. Sınıf' : ''} (${modulAd})</span>
              </div>
              <div class="border-l border-slate-300 pl-4">
                <span class="text-slate-500 block text-[9.5px] uppercase font-bold">Tarih:</span>
                <span class="font-semibold text-slate-900 text-xs">${bugunTarih}</span>
              </div>
            </div>
          </div>

          <!-- Hata Tablosu -->
          <table class="w-full text-left border-collapse text-xs border border-slate-400">
            <thead>
              <tr class="bg-slate-800 text-white border-b border-slate-700 font-bold text-[10.5px]">
                <th class="py-1.5 px-2 border-r border-slate-600 text-center w-9">#</th>
                <th class="py-1.5 px-2 border-r border-slate-600 w-32">Ders</th>
                <th class="py-1.5 px-2 border-r border-slate-600 w-44">Konu / Kazanım</th>
                <th class="py-1.5 px-2 border-r border-slate-600 w-36">Hata Türü</th>
                <th class="py-1.5 px-2 border-r border-slate-600">Hatanın Nedeni / Çözüm & Telafi Notu</th>
                <th class="py-1.5 px-2 border-r border-slate-600 text-center w-28">Telafi Tarihi</th>
                <th class="py-1.5 px-2 text-center w-36">Tekrar Döngüsü (1-3-7G)</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, idx) => `
                <tr class="border-b border-slate-300 ${idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}" style="height: ${rowHeight}px;">
                  <td class="px-1.5 py-0.5 border-r border-slate-300 text-center font-mono text-[11px] font-bold text-slate-600">${r.no}</td>
                  <td class="px-2 py-0.5 border-r border-slate-300 font-semibold text-slate-900 text-[11px]">${r.ders}</td>
                  <td class="px-2 py-0.5 border-r border-slate-300 text-slate-800 text-[11px]">${r.konu}</td>
                  <td class="px-2 py-0.5 border-r border-slate-300">
                    ${r.tur ? `<span class="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-slate-100 border border-slate-300 text-slate-800">${r.tur}</span>` : ''}
                  </td>
                  <td class="px-2 py-0.5 border-r border-slate-300 text-slate-700">
                    ${r.aciklama ? `<span class="text-[10.5px] text-slate-800 leading-tight block">${r.aciklama}</span>` : `<div style="border-bottom: 1px dotted #94a3b8; height: 14px;"></div>`}
                  </td>
                  <td class="px-2 py-0.5 border-r border-slate-300 text-center font-mono text-[10.5px] text-slate-700">${r.telafiTarihi}</td>
                  <td class="px-1.5 py-0.5 text-center">
                    <div style="display: flex; gap: 4px; justify-content: center; align-items: center; font-size: 9.5px; font-weight: 700; color: #334155;">
                      <span>1G</span>
                      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #475569; border-radius: 2px; vertical-align: middle; ${r.telafiEdildi ? 'background:#16a34a; color:#fff; text-align:center; line-height:12px;' : ''}">${r.telafiEdildi ? '✓' : ''}</span>
                      <span>3G</span>
                      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #475569; border-radius: 2px; vertical-align: middle;"></span>
                      <span>7G</span>
                      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #475569; border-radius: 2px; vertical-align: middle;"></span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Alt Kısım: Açıklama ve İmza -->
        <div class="flex items-center justify-between text-[10.5px] text-slate-700 pt-2 border-t-2 border-slate-900">
          <div>
            <strong>1-3-7 Gün Telafi Döngüsü:</strong> Hata ilk tespit: <strong>+1 gün</strong> sonra tekrar çöz · Doğru ise: <strong>+3 gün</strong> sonra tekrar çöz · Doğru ise: <strong>+7 gün</strong> sonra kalıcı telafi onayı.
          </div>
          <div class="flex items-center gap-6 font-semibold">
            <span>Öğrenci İmzası: ___________________</span>
            <span>Koç Kontrolü: ___________________</span>
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
  // VIEW 7: MÜFREDAT & HAVUZ YÖNETİMİ (G2)
  // ─────────────────────────────────────────────────────────────
  setCurriculumSekme(sekme) {
    this.curriculumAktifSekme = sekme;
    this.renderCurriculumPool();
  },

  renderCurriculumPool() {
    const container = document.getElementById('view-curriculum-pool');
    if (!container) return;

    if (!this.curriculumAktifSekme) {
      this.curriculumAktifSekme = 'dersler';
    }

    const sekme = this.curriculumAktifSekme;
    let contentHtml = '';

    if (sekme === 'dersler') {
      contentHtml = this.renderDersHavuzuHTML();
    } else if (sekme === 'sinavlar') {
      contentHtml = this.renderSinavHavuzuHTML();
    } else {
      contentHtml = this.renderKonuYonetimiHTML();
    }

    const html = `
      <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <!-- ÜST BAŞLIK VE 3 ANA SEKME -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold font-display text-[var(--color-ink)]">Müfredat & Havuz Yönetimi</h1>
              <span class="meta-pill">Akademik Havuz</span>
            </div>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Ders tanımları, MEB/ÖSYM kazanım müfredatı ve merkezi sınav formatlarını yönetin.</p>
          </div>

          <!-- 3 ANA SEKME BUTONU -->
          <div class="flex items-center gap-1.5 p-1 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] self-start md:self-auto">
            <button onclick="App.setCurriculumSekme('dersler')" class="btn-tactile text-xs py-1.5 px-3 flex items-center gap-2 transition-all ${sekme === 'dersler' ? 'btn-tactile-primary shadow-xs font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
              <i data-lucide="book-marked" class="w-3.5 h-3.5"></i>
              <span>Ders Havuzu</span>
            </button>
            <button onclick="App.setCurriculumSekme('konular')" class="btn-tactile text-xs py-1.5 px-3 flex items-center gap-2 transition-all ${sekme === 'konular' ? 'btn-tactile-primary shadow-xs font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
              <i data-lucide="list-tree" class="w-3.5 h-3.5"></i>
              <span>Konu Yönetimi</span>
            </button>
            <button onclick="App.setCurriculumSekme('sinavlar')" class="btn-tactile text-xs py-1.5 px-3 flex items-center gap-2 transition-all ${sekme === 'sinavlar' ? 'btn-tactile-primary shadow-xs font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
              <i data-lucide="award" class="w-3.5 h-3.5"></i>
              <span>Sınav Havuzu</span>
            </button>
          </div>
        </div>

        <!-- AKTİF SEKME İÇERİĞİ -->
        ${contentHtml}
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // ─────────────────────────────────────────────────────────────
  // G2: SEKME 1 — DERS HAVUZU
  // ─────────────────────────────────────────────────────────────
  renderDersHavuzuHTML() {
    const modulId = this.poolDersModulFilter || 'ara-sinif';
    const sinifFilter = this.poolDersSinifFilter || '';

    const allDersler = Store.getDersler();
    const dersler = allDersler.filter(d => {
      if (d.modulId !== modulId) return false;
      if (sinifFilter) {
        if (d.sinif !== sinifFilter && d.sinif !== 'ortak') return false;
      }
      return true;
    });

    const araSiniflar = [
      { id: '', label: 'Tümü' },
      { id: '5', label: '5. Sınıf' },
      { id: '6', label: '6. Sınıf' },
      { id: '7', label: '7. Sınıf' },
      { id: '9', label: '9. Sınıf' },
      { id: '10', label: '10. Sınıf' },
      { id: '11', label: '11. Sınıf' }
    ];

    return `
      <div class="space-y-4">
        <!-- ARAÇ ÇUBUĞU -->
        <div class="flex flex-col gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Üst Satır: Kademe Seçici & Aksiyon Butonları -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${modulId === 'ara-sinif' ? 'pb-3 border-b border-[var(--color-rule)]' : ''}">
            <!-- Sol: Kademe Tabs -->
            <div class="flex items-center gap-1 p-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs w-fit">
              <button onclick="App.poolDersModulFilter = 'ara-sinif'; App.poolDersSinifFilter = ''; App.renderCurriculumPool();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${modulId === 'ara-sinif' ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                Ara Sınıf
              </button>
              <button onclick="App.poolDersModulFilter = 'lgs'; App.poolDersSinifFilter = ''; App.renderCurriculumPool();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${modulId === 'lgs' ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                LGS (8. Sınıf)
              </button>
              <button onclick="App.poolDersModulFilter = 'yks'; App.poolDersSinifFilter = ''; App.renderCurriculumPool();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${modulId === 'yks' ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                TYT-AYT (YKS)
              </button>
            </div>

            <!-- Sağ: Aksiyon Butonları -->
            <div class="flex flex-wrap items-center gap-2">
              <button onclick="App.birlestirMukerrerDerslerAction()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 font-medium" title="Deneme sınavlarından oluşan mükerrer/sahte dersleri tespit edip ana derslerle birleştirir ve temizler">
                <i data-lucide="merge" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>Mükerrer Dersleri Birleştir</span>
              </button>
              <button onclick="App.otoDersIkonlariniGuncelle()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" title="Ders adlarına göre tüm sembol ve renkleri otomatik güncelle">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
                <span class="hidden md:inline">İkonları Otomatik Eşle</span>
              </button>
              <button onclick="App.openConfirmModal('Müfredat Havuzunu Temizle', 'Müfredat havuzundaki tüm dersler ve konular tamamen silinecektir. Çekirdek veriler geri gelmez, havuz tamamen boşaltılır. Onaylıyor musunuz?', () => { Store.resetCurriculum(); App.renderCurriculumPool(); App.showToast('Müfredat havuzu tamamen temizlendi'); });" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5 text-[var(--color-ink-faint)] hover:text-[var(--color-danger)]" title="Tüm ders ve konuları temizle">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span class="hidden md:inline">Müfredatı Temizle</span>
              </button>
              <button onclick="ExcelEngine.derslerDisaAktar('${modulId}')" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Dersleri Excel formatında indir">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Excel'e Aktar</span>
              </button>
              <button onclick="App.openDersExcelModal('${modulId}')" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Excel'den toplu ders yükle">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>Excel'den Yükle</span>
              </button>
              <button onclick="App.openDersModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-xs font-semibold">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>+ Ders Ekle</span>
              </button>
            </div>
          </div>

          <!-- Alt Satır: Ara Sınıf Sınıf Filtresi -->
          ${modulId === 'ara-sinif' ? `
            <div class="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <span class="text-[var(--color-ink-muted)] text-[11px] font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
                  <i data-lucide="layers" class="w-3.5 h-3.5 text-[var(--color-ink-faint)]"></i>
                  Sınıf:
                </span>
                ${araSiniflar.map(s => `
                  <button onclick="App.poolDersSinifFilter = '${s.id}'; App.renderCurriculumPool();" class="btn-tactile text-xs py-1 px-2.5 rounded-[var(--radius-md)] transition-all ${sinifFilter === s.id ? 'bg-[var(--color-accent)] text-white font-bold shadow-xs' : 'bg-[var(--color-paper-3)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-paper-1)] border border-[var(--color-rule)]'}">
                    ${s.label}
                  </button>
                `).join('')}
              </div>
              <div class="text-[11px] text-[var(--color-ink-faint)] font-mono">
                ${dersler.length} ders gösteriliyor
              </div>
            </div>
          ` : ''}
        </div>

        <!-- DERS LİSTESİ TABLOSU -->
        <div class="bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
          ${dersler.length === 0 ? `
            <div class="p-12 text-center text-xs text-[var(--color-ink-muted)] space-y-3">
              <i data-lucide="book-x" class="w-10 h-10 text-[var(--color-ink-faint)] mx-auto"></i>
              <h4 class="font-display font-bold text-sm text-[var(--color-ink)]">Bu kademe için henüz ders tanımlanmamış</h4>
              <p>Müfredata yeni bir ders eklemek için aşağıdaki butonu kullanabilirsiniz.</p>
              <button onclick="App.openDersModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 mt-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                <span>+ Ders Ekle</span>
              </button>
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-[var(--color-paper-3)] border-b border-[var(--color-rule)] text-[var(--color-ink-muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <th class="py-3 px-4">Ders Adı</th>
                    <th class="py-3 px-3">Kısaltma</th>
                    <th class="py-3 px-3">Sınıf</th>
                    <th class="py-3 px-3">Haftalık Saat</th>
                    <th class="py-3 px-3">Sınavda mı?</th>
                    <th class="py-3 px-3">Kazanım/Konu</th>
                    <th class="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--color-rule)]">
                  ${dersler.map(d => {
                    const sinifStr = d.sinif === 'ortak' ? 'Ortak' : (d.sinif ? `${d.sinif}. Sınıf` : '—');
                    const konuSayisi = Store.getKonularForDers(d.id).length;
                    const sinavBadge = modulId === 'ara-sinif'
                      ? '<span class="text-[var(--color-ink-faint)] font-mono">—</span>'
                      : (d.sinavdaMi
                          ? `<span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]"><i data-lucide="check" class="w-3.5 h-3.5"></i> Sınavda ${d.soruSayisi ? `(${d.soruSayisi} S)` : '✓'}</span>`
                          : '<span class="text-[var(--color-ink-faint)] font-mono">—</span>');

                    return `
                      <tr class="hover:bg-[var(--color-paper-3)] transition-colors group">
                        <!-- Ders Adı & İkon & Renk Çizgisi -->
                        <td class="py-3 px-4 relative">
                          <div class="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-${d.renk || 'blue'}-500"></div>
                          <div class="flex items-center gap-2.5 pl-1.5">
                            <div class="w-7 h-7 rounded-[var(--radius-sm)] bg-${d.renk || 'blue'}-100 dark:bg-${d.renk || 'blue'}-950/40 text-${d.renk || 'blue'}-600 dark:text-${d.renk || 'blue'}-400 flex items-center justify-center shrink-0">
                              <i data-lucide="${d.ikon || 'book'}" class="w-3.5 h-3.5"></i>
                            </div>
                            <span class="font-display font-bold text-xs text-[var(--color-ink)]">${d.ad}</span>
                          </div>
                        </td>

                        <!-- Kısaltma -->
                        <td class="py-3 px-3">
                          <span class="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-paper-4)] text-[var(--color-ink-muted)] border border-[var(--color-rule)] font-semibold">
                            ${d.kisaltma || 'DRS'}
                          </span>
                        </td>

                        <!-- Sınıf -->
                        <td class="py-3 px-3">
                          <span class="meta-pill text-[10px]">${sinifStr}</span>
                        </td>

                        <!-- Haftalık Saat -->
                        <td class="py-3 px-3 font-mono text-xs text-[var(--color-ink)]">
                          ${d.haftalikSaat ? `${d.haftalikSaat} Saat` : '—'}
                        </td>

                        <!-- Sınavda mı? -->
                        <td class="py-3 px-3">
                          ${sinavBadge}
                        </td>

                        <!-- Konu Sayısı -->
                        <td class="py-3 px-3 text-[11px] text-[var(--color-ink-muted)]">
                          <button onclick="App.curriculumAktifSekme = 'konular'; App.poolModulFilter = '${d.modulId}'; App.poolSinifFilter = '${d.sinif || ''}'; App.poolAktifDersId = '${d.id}'; App.renderCurriculumPool();" class="hover:text-[var(--color-accent)] hover:underline inline-flex items-center gap-1 font-medium" title="Bu dersin konularına git">
                            <span>${konuSayisi} konu</span>
                            <i data-lucide="chevron-right" class="w-3 h-3"></i>
                          </button>
                        </td>

                        <!-- İşlemler -->
                        <td class="py-3 px-4 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button onclick="App.openDersModal('${d.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" title="Dersi Düzenle">
                              <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                              <span class="hidden sm:inline">Düzenle</span>
                            </button>
                            <button onclick="App.confirmDeleteDers('${d.id}', '${d.ad.replace(/'/g, "\\'")}')" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" title="Dersi Sil">
                              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                              <span class="hidden sm:inline">Sil</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  },

  confirmDeleteDers(dersId, dersAdi) {
    const kCount = Store.getKonularForDers(dersId).length;
    const gCount = (Store.data.gorevler || []).filter(g => String(g.dersId) === String(dersId)).length;
    const msg = `Bu derse ait ${kCount} konu ve ${gCount} görev de silinecektir. Devam etmek istiyor musunuz?`;

    this.openConfirmModal('Dersi Sil', msg, () => {
      Store.deleteDers(dersId);
      this.renderCurriculumPool();
      this.showToast(`${dersAdi} dersi ve ilişkili kayıtlar silindi`);
    });
  },

  // ─────────────────────────────────────────────────────────────
  // G2: SEKME 2 — KONU YÖNETİMİ
  // ─────────────────────────────────────────────────────────────
  renderKonuYonetimiHTML() {
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

    return `
      <div class="space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Başlık & Filtreler -->
          <div class="flex flex-wrap items-center gap-3">
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
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="App.openConfirmModal('Tüm Konuları Temizle', 'Müfredat havuzundaki tüm konular ve kazanımlar tamamen silinecektir. Kendi Excel listenizi yüklemek için liste boşaltılacaktır. Onaylıyor musunuz?', () => { Store.clearAllKonular(); App.renderCurriculumPool(); App.showToast('Tüm konular temizlendi.'); });" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5 text-[var(--color-ink-faint)] hover:text-[var(--color-danger)]" title="Tüm derslerin konularını temizle">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span class="hidden md:inline">Konuları Temizle</span>
            </button>
            <button onclick="ExcelEngine.konularDisaAktar(null, App.poolModulFilter)" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Konuları Excel formatında indir">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Excel'e Aktar</span>
            </button>
            <button onclick="App.openKonuExcelModal(null)" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Excel'den toplu konu yükle">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Excel'den Yükle</span>
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
                      <button onclick="App.confirmDeleteDers('${d.id}', '${d.ad.replace(/'/g, "\\'")}')" class="p-1 rounded-[var(--radius-xs)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors" title="Dersi Sil">
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

                <div class="flex items-center gap-1.5 flex-wrap">
                  <button onclick="ExcelEngine.konularDisaAktar('${seciliDers.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" title="Sadece bu dersin konularını Excel'e aktar">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">Dersi Aktar</span>
                  </button>
                  <button onclick="App.openKonuExcelModal('${seciliDers.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" title="Bu derse Excel ile konu yükle">
                    <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">Excel'den Yükle</span>
                  </button>
                  <button onclick="App.openUniteModal('${seciliDers.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-2.5">
                    <i data-lucide="folder-plus" class="w-3.5 h-3.5"></i>
                    <span>+ Ünite</span>
                  </button>
                  <button onclick="App.openKonuModal('${seciliDers.id}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3 shadow-sm font-semibold">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>+ Konu</span>
                  </button>
                </div>
              </div>

              <!-- Konular Listesi (Ünite Gruplu) -->
              <div class="space-y-5 max-h-[640px] overflow-y-auto pr-1">
                ${uniteler.length === 0 ? `
                  <div class="p-10 text-center bg-[var(--color-paper-1)] border border-[var(--color-rule)] rounded-[var(--radius-md)] space-y-3">
                    <i data-lucide="list-plus" class="w-8 h-8 text-[var(--color-ink-faint)] mx-auto"></i>
                    <h4 class="font-display font-bold text-sm text-[var(--color-ink)]">Henüz Konu Eklenmedi</h4>
                    <p class="text-xs text-[var(--color-ink-muted)]">Bu derse ait kazanım ve konuları manuel ekleyebilir veya Excel'den topluca yükleyebilirsiniz.</p>
                    <div class="flex items-center justify-center gap-2 pt-1 flex-wrap">
                      <button onclick="App.openKonuModal('${seciliDers.id}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>İlk Konuyu Ekle</span>
                      </button>
                      <button onclick="App.openKonuExcelModal('${seciliDers.id}')" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                        <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                        <span>Excel'den Konu Yükle</span>
                      </button>
                    </div>
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
                              ${Array.isArray(k.kazanimlar) && k.kazanimlar.length > 0 ? `
                                <div class="mt-1 flex items-center gap-1.5 flex-wrap">
                                  <span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium cursor-help" title="${k.kazanimlar.map((kaz, i) => (i + 1) + '. ' + kaz).join('\n')}">
                                    <i data-lucide="tag" class="w-2.5 h-2.5"></i>
                                    <span>${k.kazanimlar.length} MEB/ÖSYM Kazanımı</span>
                                  </span>
                                </div>
                              ` : ''}
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
  },

  // ─────────────────────────────────────────────────────────────
  // G2: SEKME 3 — SINAV HAVUZU
  // ─────────────────────────────────────────────────────────────
  renderSinavHavuzuHTML() {
    let modulId = this.poolSinavModulFilter || 'lgs';
    if (modulId !== 'lgs' && modulId !== 'yks') {
      modulId = 'lgs';
      this.poolSinavModulFilter = 'lgs';
    }

    const allLgs = Store.getSinavlar('lgs');
    const allYks = Store.getSinavlar('yks');
    const sinavlarRaw = modulId === 'lgs' ? allLgs : allYks;

    const query = (this.poolSinavSearchQuery || '').toLowerCase().trim();
    const sinavlar = query
      ? sinavlarRaw.filter(s =>
          (s.ad || '').toLowerCase().includes(query) ||
          (s.kisaltma || '').toLowerCase().includes(query) ||
          (s.oturum || '').toLowerCase().includes(query) ||
          (s.hedefSinif || '').toLowerCase().includes(query) ||
          (s.aciklama || '').toLowerCase().includes(query)
        )
      : sinavlarRaw;

    return `
      <div class="space-y-4">
        <!-- ARAÇ ÇUBUĞU -->
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Kademe Seçici: LGS (8. Sınıf) & TYT-AYT / MSÜ (12 & Mezun) -->
          <div class="flex items-center gap-1.5 p-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs shrink-0">
            <button onclick="App.poolSinavModulFilter = 'lgs'; App.renderCurriculumPool();" class="btn-tactile text-xs py-1.5 px-3 flex items-center gap-1.5 ${modulId === 'lgs' ? 'btn-tactile-primary font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
              <span>LGS (8. Sınıf)</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full ${modulId === 'lgs' ? 'bg-white/20 text-white font-bold' : 'bg-[var(--color-paper-1)] text-[var(--color-ink-muted)]'}">${allLgs.length}</span>
            </button>
            <button onclick="App.poolSinavModulFilter = 'yks'; App.renderCurriculumPool();" class="btn-tactile text-xs py-1.5 px-3 flex items-center gap-1.5 ${modulId === 'yks' ? 'btn-tactile-primary font-bold' : 'btn-tactile-ghost text-[var(--color-ink-muted)]'}">
              <span>TYT-AYT & MSÜ (12 & Mezun)</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-full ${modulId === 'yks' ? 'bg-white/20 text-white font-bold' : 'bg-[var(--color-paper-1)] text-[var(--color-ink-muted)]'}">${allYks.length}</span>
            </button>
          </div>

          <!-- Arama Kutusu & Aksiyonlar -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Arama Input -->
            <div class="relative flex-1 sm:w-64 min-w-[200px]">
              <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"></i>
              <input
                type="text"
                placeholder="Sınav veya oturum ara..."
                value="${(this.poolSinavSearchQuery || '').replace(/"/g, '&quot;')}"
                oninput="App.poolSinavSearchQuery = this.value; App.renderCurriculumPool();"
                class="w-full pl-8 pr-7 py-1.5 text-xs rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              ${this.poolSinavSearchQuery ? `
                <button onclick="App.poolSinavSearchQuery = ''; App.renderCurriculumPool();" class="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]" title="Temizle">
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <!-- Standart Sınavları Sıfırla / Yükle -->
            <button
              onclick="App.openConfirmModal('Standart Sınavları Yükle', 'Sınav havuzuna MEB ve ÖSYM standart sınav formatları (8. Sınıf LGS, 12. Sınıf ve Mezun TYT-AYT-MSÜ) baştan yüklenecektir. Onaylıyor musunuz?', () => { Store.resetSinavlarToSeed(); App.renderCurriculumPool(); App.showToast('Standart sınavlar başarıyla yüklendi'); });"
              class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border border-[var(--color-rule)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              title="Varsayılan MEB ve ÖSYM sınavlarını yükle / yenile"
            >
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span class="hidden sm:inline">Standart Sınavları Yükle</span>
            </button>

            <!-- + Sınav Ekle -->
            <button onclick="App.openSinavModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-xs">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>+ Sınav Ekle</span>
            </button>
          </div>
        </div>

        <!-- BİLGİLENDİRME ŞERİDİ -->
        <div class="flex items-center justify-between text-xs text-[var(--color-ink-muted)] px-1">
          <div class="flex items-center gap-2">
            <span class="font-medium text-[var(--color-ink)]">${modulId === 'lgs' ? '8. Sınıf LGS Havuzu' : '12. Sınıf & Mezun YKS / MSÜ Havuzu'}</span>
            <span>•</span>
            <span>Toplam <strong>${sinavlar.length}</strong> sınav listeleniyor</span>
            ${query ? `<span class="text-[var(--color-accent)] font-medium">("${query}" için arama sonuçları)</span>` : ''}
          </div>
          <div class="text-[11px] text-[var(--color-ink-faint)] italic hidden sm:block">
            ${modulId === 'lgs' ? 'Ara sınıflar hariç, yalnızca 8. sınıf LGS sınavlarını içerir' : 'Ara sınıflar hariç, 12. sınıf ve mezun sınavlarını içerir'}
          </div>
        </div>

        <!-- SINAV KARTLARI -->
        ${sinavlar.length === 0 ? `
          <div class="p-12 text-center bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-lg)] text-xs text-[var(--color-ink-muted)] space-y-3">
            <i data-lucide="award" class="w-10 h-10 text-[var(--color-ink-faint)] mx-auto"></i>
            <h4 class="font-display font-bold text-sm text-[var(--color-ink)]">
              ${query ? 'Arama kriterlerine uygun sınav bulunamadı' : 'Bu kademe için henüz sınav tanımlanmamış'}
            </h4>
            <p>
              ${query
                ? 'Farklı bir arama terimi deneyebilir veya filtreyi temizleyebilirsiniz.'
                : 'Standart MEB ve ÖSYM sınavlarını yüklemek için "Standart Sınavları Yükle" butonunu kullanabilirsiniz.'}
            </p>
            <div class="flex items-center justify-center gap-2 pt-1">
              ${query ? `
                <button onclick="App.poolSinavSearchQuery = ''; App.renderCurriculumPool();" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-4 border border-[var(--color-rule)]">
                  Aramayı Temizle
                </button>
              ` : `
                <button onclick="Store.resetSinavlarToSeed(); App.renderCurriculumPool(); App.showToast('Standart sınavlar yüklendi');" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-4 border border-[var(--color-rule)]">
                  Standart Sınavları Yükle
                </button>
                <button onclick="App.openSinavModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5">
                  <i data-lucide="plus" class="w-4 h-4"></i>
                  <span>+ Sınav Ekle</span>
                </button>
              `}
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            ${sinavlar.map(s => {
              const hedefSinif = s.hedefSinif || (s.modulId === 'lgs' ? '8. Sınıf' : '12. Sınıf & Mezun');
              const soruSayisi = Number(s.soruSayisi) || 0;
              const sureDk = Number(s.sureDk) || 0;
              const ortDakika = (soruSayisi > 0 && sureDk > 0) ? (sureDk / soruSayisi).toFixed(1) : null;

              return `
                <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] hover:border-[var(--color-rule-strong)] shadow-xs transition-all flex flex-col justify-between space-y-3">
                  <div class="space-y-2.5">
                    <div class="flex items-start justify-between gap-2">
                      <div class="space-y-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                            ${hedefSinif}
                          </span>
                        </div>
                        <h3 class="font-display font-bold text-sm text-[var(--color-ink)] leading-snug">${s.ad}</h3>
                      </div>
                      <span class="meta-pill text-[10px] font-mono font-bold shrink-0">${s.kisaltma || 'SNV'}</span>
                    </div>

                    ${s.oturum ? `
                      <div class="text-[11px] text-[var(--color-ink-muted)] flex items-center gap-1.5">
                        <i data-lucide="calendar" class="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0"></i>
                        <span>${s.oturum}</span>
                      </div>
                    ` : ''}

                    <div class="flex items-center gap-2 pt-1 flex-wrap">
                      <span class="px-2 py-0.5 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[11px] font-mono text-[var(--color-ink)]" title="Toplam Soru Sayısı">
                        Soru: <strong>${soruSayisi || '—'}</strong>
                      </span>
                      <span class="px-2 py-0.5 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[11px] font-mono text-[var(--color-ink)]" title="Toplam Sınav Süresi">
                        Süre: <strong>${sureDk ? `${sureDk} dk` : '—'}</strong>
                      </span>
                      ${ortDakika ? `
                        <span class="px-2 py-0.5 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[11px] font-mono text-[var(--color-ink-muted)]" title="Soru Başına Ortalama Süre">
                          ~<strong>${ortDakika}</strong> dk/soru
                        </span>
                      ` : ''}
                    </div>

                    ${s.aciklama ? `
                      <p class="text-[11px] text-[var(--color-ink-muted)] leading-relaxed pt-2 border-t border-[var(--color-rule)] mt-2">
                        ${s.aciklama}
                      </p>
                    ` : ''}
                  </div>

                  <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-[var(--color-rule)]">
                    <button onclick="App.openSinavModal('${s.id}')" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]" title="Sınavı Düzenle">
                      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
                      <span>Düzenle</span>
                    </button>
                    <button onclick="App.openConfirmModal('Sınavı Sil', '${s.ad.replace(/'/g, "\\'")} sınavı silinecektir. Onaylıyor musunuz?', () => { Store.deleteSinav('${s.id}'); App.renderCurriculumPool(); App.showToast('Sınav silindi'); });" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]" title="Sınavı Sil">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      <span>Sil</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // G2: SINAV MODALI
  // ─────────────────────────────────────────────────────────────
  openSinavModal(sinavId = null) {
    const isEdit = Boolean(sinavId);
    const s = isEdit ? Store.getSinav(sinavId) : null;
    const seciliModulId = s ? s.modulId : (this.poolSinavModulFilter || 'lgs');

    const html = `
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${isEdit ? 'Sınavı Düzenle' : 'Yeni Sınav Ekle'}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Merkezi sınav formatı ve oturum parametrelerini kaydedin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-sinav" class="space-y-3.5 text-xs">
          <!-- Kademe Seçimi (Düzenlemede disabled) -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">Eğitim Kademesi <span class="text-[var(--color-danger)]">*</span></label>
            <select id="sinav-input-modul" ${isEdit ? 'disabled' : ''} class="select-instrument w-full p-2">
              <option value="lgs" ${seciliModulId === 'lgs' ? 'selected' : ''}>LGS (Liselere Geçiş Sistemi - 8. Sınıf)</option>
              <option value="yks" ${seciliModulId === 'yks' ? 'selected' : ''}>TYT-AYT & MSÜ (Yükseköğretim Kurumları - 12. Sınıf & Mezun)</option>
            </select>
          </div>

          <!-- Sınav Adı & Kısaltma -->
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Sınav Adı <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="sinav-input-ad" value="${s ? s.ad : ''}" required placeholder="Örn: LGS Sayısal Bölüm" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Kısaltma <span class="text-[var(--color-danger)]">*</span></label>
              <input type="text" id="sinav-input-kisaltma" maxlength="8" value="${s ? s.kisaltma : ''}" required placeholder="LGS-SAY" class="w-full p-2 uppercase font-mono rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <!-- Hedef Sınıf & Oturum -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Hedef Sınıf / Kitle</label>
              <input type="text" id="sinav-input-hedef" value="${s ? (s.hedefSinif || '') : (seciliModulId === 'lgs' ? '8. Sınıf' : '12. Sınıf & Mezun')}" placeholder="Örn: 8. Sınıf veya 12. Sınıf & Mezun" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Oturum Bilgisi</label>
              <input type="text" id="sinav-input-oturum" value="${s ? s.oturum || '' : ''}" placeholder="Örn: 2. Oturum (11:30)" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <!-- Soru Sayısı & Süre (dk) -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Toplam Soru Sayısı</label>
              <input type="number" id="sinav-input-soru" min="0" max="300" value="${s ? s.soruSayisi || 0 : (seciliModulId === 'lgs' ? 40 : 120)}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-semibold text-[var(--color-ink)] mb-1">Sınav Süresi (Dakika)</label>
              <input type="number" id="sinav-input-sure" min="0" max="360" value="${s ? s.sureDk || 0 : (seciliModulId === 'lgs' ? 80 : 165)}" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <!-- Açıklama -->
          <div>
            <label class="block font-semibold text-[var(--color-ink)] mb-1">Açıklama / Test Dağılımı</label>
            <textarea id="sinav-input-aciklama" rows="2" placeholder="Örn: Matematik (20), Fen Bilimleri (20)" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">${s ? s.aciklama || '' : ''}</textarea>
          </div>

          <!-- Butonlar -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">İptal</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">${isEdit ? 'Değişiklikleri Kaydet' : 'Sınavı Ekle'}</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-sinav');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const modulEl = document.getElementById('sinav-input-modul');
        const mId = modulEl ? modulEl.value : seciliModulId;
        const ad = document.getElementById('sinav-input-ad').value.trim();
        const kisaltma = document.getElementById('sinav-input-kisaltma').value.trim();
        const hedefSinif = document.getElementById('sinav-input-hedef').value.trim() || (mId === 'lgs' ? '8. Sınıf' : '12. Sınıf & Mezun');
        const oturum = document.getElementById('sinav-input-oturum').value.trim();
        const soruSayisi = parseInt(document.getElementById('sinav-input-soru').value) || 0;
        const sureDk = parseInt(document.getElementById('sinav-input-sure').value) || 0;
        const aciklama = document.getElementById('sinav-input-aciklama').value.trim();

        if (!ad || !kisaltma) {
          this.showToast('Lütfen sınav adı ve kısaltmasını girin.');
          return;
        }

        if (isEdit) {
          Store.updateSinav(sinavId, { ad, kisaltma, hedefSinif, oturum, soruSayisi, sureDk, aciklama });
          this.showToast('Sınav tanımı güncellendi');
        } else {
          Store.addSinav({ modulId: mId, ad, kisaltma, hedefSinif, oturum, soruSayisi, sureDk, aciklama });
          this.showToast('Yeni sınav havuza eklendi');
        }

        this.closeModal();
        this.renderCurriculumPool();
      });
    }
  },

  // ─────────────────────────────────────────────────────────────
  // G2: DERSLER EXCEL İÇE AKTARIM MODALI
  // ─────────────────────────────────────────────────────────────
  openDersExcelModal(modulId = null) {
    const html = `
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Excel ile Toplu Ders Aktarımı</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Excel dosyasındaki dersleri müfredat havuzuna ekleyin veya güncelleyin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div id="ders-excel-modal-step1" class="space-y-4 text-xs">
          <!-- Bilgilendirme ve Şablon Linki -->
          <div class="p-3.5 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)] flex items-center justify-between">
            <div class="flex items-center gap-2 text-[var(--color-ink)]">
              <i data-lucide="info" class="w-4 h-4 text-[var(--color-accent)] shrink-0"></i>
              <span>Dosyanızın formatı şablonla uyumlu olmalıdır.</span>
            </div>
            <button onclick="ExcelEngine.derslerSablonIndir()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)]">
              <i data-lucide="download" class="w-3 h-3"></i>
              <span>Şablonu İndir</span>
            </button>
          </div>

          <!-- Dosya Seçim Alanı -->
          <div class="border-2 border-dashed border-[var(--color-rule-strong)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-8 text-center space-y-2 transition-colors cursor-pointer bg-[var(--color-paper-1)]" onclick="document.getElementById('ders-excel-file-input').click()">
            <i data-lucide="file-spreadsheet" class="w-10 h-10 text-[var(--color-accent)] mx-auto"></i>
            <div class="font-display font-bold text-sm text-[var(--color-ink)]">Excel dosyasını buraya bırakın veya seçin</div>
            <div class="text-[11px] text-[var(--color-ink-muted)]">.xlsx veya .xls formatları desteklenmektedir</div>
            <input type="file" id="ders-excel-file-input" accept=".xlsx, .xls" class="hidden" onchange="App.onDersExcelFileChosen(event)">
          </div>
        </div>

        <div id="ders-excel-modal-step2" class="hidden space-y-4 text-xs">
          <!-- Dinamik Sonuç Alanı -->
        </div>
      </div>
    `;

    this.openModal(html);
  },

  onDersExcelFileChosen(event) {
    const file = event.target.files[0];
    if (!file) return;

    const step1 = document.getElementById('ders-excel-modal-step1');
    const step2 = document.getElementById('ders-excel-modal-step2');
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

    ExcelEngine.derslerIceAktar(file, (sonuc) => {
      const eklenen = sonuc.eklenen || 0;
      const guncellenen = sonuc.guncellenen || 0;
      const hatali = sonuc.hatali || [];
      const toplamGecerli = (sonuc.satirlar || []).length;

      let contentHtml = `
        <div class="space-y-3.5 text-xs">
          <div class="flex items-center gap-2 p-3 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-[var(--radius-md)] text-[var(--color-success)] font-semibold">
            <i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i>
            <span>${toplamGecerli} ders aktarıma hazır (${eklenen} yeni eklenecek, ${guncellenen} güncellenecek)</span>
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
            <button type="button" onclick="App.openDersExcelModal()" class="btn-tactile btn-tactile-ghost text-xs">Farklı Dosya Seç</button>
            <button type="button" ${toplamGecerli === 0 ? 'disabled' : ''} onclick="App.saveExcelDersler('${encodeURIComponent(JSON.stringify(sonuc.satirlar || []))}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4">
              ${toplamGecerli} Dersi Sisteme Kaydet
            </button>
          </div>
        </div>
      `;

      step2.innerHTML = contentHtml;
      if (window.lucide) lucide.createIcons();
    });
  },

  saveExcelDersler(encodedData) {
    try {
      const satirlar = JSON.parse(decodeURIComponent(encodedData));
      if (!Array.isArray(satirlar) || satirlar.length === 0) {
        this.showToast('Aktarılacak geçerli ders bulunamadı.');
        return;
      }

      let eklenenSayisi = 0;
      let guncellenenSayisi = 0;

      satirlar.forEach(s => {
        const detected = Store.detectDersIkonVeRenk(s.veri.ad, s.veri.kisaltma);
        const dersVerisi = {
          ...s.veri,
          renk: (s.veri.renk && s.veri.renk !== 'blue') ? s.veri.renk : (detected.renk || 'blue'),
          ikon: (s.veri.ikon && s.veri.ikon !== 'book') ? s.veri.ikon : (detected.ikon || 'book')
        };
        if (s.durum === 'guncellenecek' && s.mevcutId) {
          Store.updateDers(s.mevcutId, dersVerisi);
          guncellenenSayisi++;
        } else {
          Store.addDers(dersVerisi);
          eklenenSayisi++;
        }
      });

      this.closeModal();
      this.renderCurriculumPool();
      this.showToast(`${eklenenSayisi} ders eklendi, ${guncellenenSayisi} ders güncellendi.`);
    } catch (err) {
      console.error('Dersler kaydedilirken hata:', err);
      this.showToast('Dersler kaydedilirken bir hata oluştu.');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // KAYNAKLAR EXCEL İÇE AKTARIM MODALI
  // ─────────────────────────────────────────────────────────────
  openKaynakExcelModal() {
    const html = `
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Excel ile Toplu Kaynak Aktarımı</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Excel dosyasındaki soru bankası, fasikül ve denemeleri kütüphaneye ekleyin.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div id="kaynak-excel-modal-step1" class="space-y-4 text-xs">
          <!-- Bilgilendirme ve Şablon Linki -->
          <div class="p-3.5 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)] flex items-center justify-between">
            <div class="flex items-center gap-2 text-[var(--color-ink)]">
              <i data-lucide="info" class="w-4 h-4 text-[var(--color-accent)] shrink-0"></i>
              <span>Dosyanızın formatı şablonla uyumlu olmalıdır.</span>
            </div>
            <button onclick="ExcelEngine.kaynaklarSablonIndir()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)]">
              <i data-lucide="download" class="w-3 h-3"></i>
              <span>Şablonu İndir</span>
            </button>
          </div>

          <!-- Dosya Seçim Alanı -->
          <div class="border-2 border-dashed border-[var(--color-rule-strong)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-8 text-center space-y-2 transition-colors cursor-pointer bg-[var(--color-paper-1)]" onclick="document.getElementById('kaynak-excel-file-input').click()">
            <i data-lucide="file-spreadsheet" class="w-10 h-10 text-[var(--color-accent)] mx-auto"></i>
            <div class="font-display font-bold text-sm text-[var(--color-ink)]">Excel dosyasını buraya bırakın veya seçin</div>
            <div class="text-[11px] text-[var(--color-ink-muted)]">.xlsx veya .xls formatları desteklenmektedir</div>
            <input type="file" id="kaynak-excel-file-input" accept=".xlsx, .xls" class="hidden" onchange="App.onKaynakExcelFileChosen(event)">
          </div>
        </div>

        <div id="kaynak-excel-modal-step2" class="hidden space-y-4 text-xs">
          <!-- Dinamik Sonuç Alanı -->
        </div>
      </div>
    `;

    this.openModal(html);
  },

  onKaynakExcelFileChosen(event) {
    const file = event.target.files[0];
    if (!file) return;

    const step1 = document.getElementById('kaynak-excel-modal-step1');
    const step2 = document.getElementById('kaynak-excel-modal-step2');
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

    ExcelEngine.kaynaklarIceAktar(file, (sonuc) => {
      const eklenen = sonuc.eklenen || 0;
      const guncellenen = sonuc.guncellenen || 0;
      const hatali = sonuc.hatali || [];
      const toplamGecerli = (sonuc.satirlar || []).length;

      let contentHtml = `
        <div class="space-y-3.5 text-xs">
          <div class="flex items-center gap-2 p-3 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-[var(--radius-md)] text-[var(--color-success)] font-semibold">
            <i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i>
            <span>${toplamGecerli} kaynak aktarıma hazır (${eklenen} yeni eklenecek, ${guncellenen} güncellenecek)</span>
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
            <button type="button" onclick="App.openKaynakExcelModal()" class="btn-tactile btn-tactile-ghost text-xs">Farklı Dosya Seç</button>
            <button type="button" ${toplamGecerli === 0 ? 'disabled' : ''} onclick="App.saveExcelKaynaklar('${encodeURIComponent(JSON.stringify(sonuc.satirlar || []))}')" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4">
              ${toplamGecerli} Kaynağı Kütüphaneye Kaydet
            </button>
          </div>
        </div>
      `;

      step2.innerHTML = contentHtml;
      if (window.lucide) lucide.createIcons();
    });
  },

  saveExcelKaynaklar(encodedData) {
    try {
      const satirlar = JSON.parse(decodeURIComponent(encodedData));
      if (!Array.isArray(satirlar) || satirlar.length === 0) {
        this.showToast('Aktarılacak geçerli kaynak bulunamadı.');
        return;
      }

      let eklenenSayisi = 0;
      let guncellenenSayisi = 0;

      satirlar.forEach(s => {
        if (s.durum === 'guncellenecek' && s.mevcutId) {
          Store.updateKaynak(s.mevcutId, s.veri);
          guncellenenSayisi++;
        } else {
          Store.addKaynak(s.veri);
          eklenenSayisi++;
        }
      });

      this.closeModal();
      this.renderLibrary();
      this.showToast(`${eklenenSayisi} kaynak eklendi, ${guncellenenSayisi} kaynak güncellendi.`);
    } catch (err) {
      console.error('Kaynaklar kaydedilirken hata:', err);
      this.showToast('Kaynaklar kaydedilirken bir hata oluştu.');
    }
  },

  // ─────────────────────────────────────────────────────────────
  // KONULAR EXCEL İÇE AKTARIM MODALI
  // ─────────────────────────────────────────────────────────────
  openKonuExcelModal(seciliDersId = null) {
    const seciliDers = seciliDersId ? Store.getDers(seciliDersId) : null;
    const dersAciklama = seciliDers ? `(Seçili Ders: <strong class="text-[var(--color-ink)]">${seciliDers.ad}</strong>)` : '(Tüm dersler veya dosyada belirtilen dersler için)';

    const html = `
      <div class="space-y-4 max-w-lg">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Excel ile Toplu Konu Aktarımı</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Excel dosyasındaki ünite ve konuları müfredat havuzuna ekleyin ${dersAciklama}.</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div id="konu-excel-modal-step1" class="space-y-4 text-xs">
          <!-- Bilgilendirme ve Şablon Linki -->
          <div class="p-3.5 bg-[var(--color-paper-3)] rounded-[var(--radius-md)] border border-[var(--color-rule)] flex items-center justify-between">
            <div class="flex items-center gap-2 text-[var(--color-ink)]">
              <i data-lucide="info" class="w-4 h-4 text-[var(--color-accent)] shrink-0"></i>
              <span>Dosyanız konu şablonu formatıyla uyumlu olmalıdır.</span>
            </div>
            <button onclick="ExcelEngine.konularSablonIndir(${seciliDersId ? `'${seciliDersId}'` : 'null'})" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-[var(--color-accent)]">
              <i data-lucide="download" class="w-3 h-3"></i>
              <span>Şablonu İndir</span>
            </button>
          </div>

          <!-- Dosya Seçim Alanı -->
          <div class="border-2 border-dashed border-[var(--color-rule-strong)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-8 text-center space-y-2 transition-colors cursor-pointer bg-[var(--color-paper-1)]" onclick="document.getElementById('konu-excel-file-input').click()">
            <i data-lucide="file-spreadsheet" class="w-10 h-10 text-[var(--color-accent)] mx-auto"></i>
            <div class="font-display font-bold text-sm text-[var(--color-ink)]">Excel dosyasını buraya bırakın veya seçin</div>
            <div class="text-[11px] text-[var(--color-ink-muted)]">.xlsx veya .xls formatları desteklenmektedir</div>
            <input type="file" id="konu-excel-file-input" accept=".xlsx, .xls" class="hidden" onchange="App.onKonuExcelFileChosen(event, ${seciliDersId ? `'${seciliDersId}'` : 'null'})">
          </div>
        </div>

        <div id="konu-excel-modal-step2" class="hidden space-y-4 text-xs">
          <!-- Dinamik Sonuç Alanı -->
        </div>
      </div>
    `;

    this.openModal(html);
  },

  onKonuExcelFileChosen(event, seciliDersId = null) {
    const file = event.target.files[0];
    if (!file) return;

    const step1 = document.getElementById('konu-excel-modal-step1');
    const step2 = document.getElementById('konu-excel-modal-step2');
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

    ExcelEngine.konularIceAktar(file, (sonuc) => {
      const eklenen = sonuc.eklenen || 0;
      const guncellenen = sonuc.guncellenen || 0;
      const hatali = sonuc.hatali || [];
      const toplamGecerli = (sonuc.satirlar || []).length;
      const dersOzet = sonuc.dersOzet || {};
      const dersOzetList = Object.entries(dersOzet);

      // Geçici belleğe kaydet (HTML inline attribute taşmasını önler)
      App._pendingExcelKonular = sonuc.satirlar || [];

      let contentHtml = `
        <div class="space-y-3.5 text-xs">
          <div class="flex items-center gap-2 p-3 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-[var(--radius-md)] text-[var(--color-success)] font-semibold">
            <i data-lucide="check-circle" class="w-4 h-4 shrink-0"></i>
            <span>${toplamGecerli} konu aktarıma hazır (${eklenen} yeni eklenecek, ${guncellenen} güncellenecek)</span>
          </div>
      `;

      if (dersOzetList.length > 0) {
        contentHtml += `
          <div class="space-y-2 p-3 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)]">
            <div class="font-bold text-[11px] text-[var(--color-ink)] flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <i data-lucide="layers" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                <span>Tespit Edilen Ders Dağılımı (${dersOzetList.length} Farklı Ders):</span>
              </span>
            </div>
            <div class="max-h-36 overflow-y-auto pr-1 flex flex-wrap gap-1.5 text-[11px]">
              ${dersOzetList.map(([dAd, sayi]) => `
                <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--color-paper-1)] border border-[var(--color-rule)] text-[var(--color-ink)] font-medium">
                  <span>${dAd}</span>
                  <span class="text-[var(--color-accent)] font-bold">(${sayi} konu)</span>
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }

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
            <button type="button" onclick="App.openKonuExcelModal(${seciliDersId ? `'${seciliDersId}'` : 'null'})" class="btn-tactile btn-tactile-ghost text-xs">Farklı Dosya Seç</button>
            <button type="button" ${toplamGecerli === 0 ? 'disabled' : ''} onclick="App.savePendingExcelKonular()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4">
              ${toplamGecerli} Konuyu Müfredata Kaydet
            </button>
          </div>
        </div>
      `;

      step2.innerHTML = contentHtml;
      if (window.lucide) lucide.createIcons();
    }, seciliDersId);
  },

  savePendingExcelKonular() {
    try {
      const satirlar = this._pendingExcelKonular;
      if (!Array.isArray(satirlar) || satirlar.length === 0) {
        this.showToast('Aktarılacak geçerli konu bulunamadı.');
        return;
      }

      const res = Store.addOrUpdateKonularBatch(satirlar);
      this._pendingExcelKonular = null;
      this.closeModal();
      this.renderCurriculumPool();
      this.showToast(`${res.eklenen} konu eklendi, ${res.guncellenen} konu güncellendi.`);
    } catch (err) {
      console.error('Konular kaydedilirken hata:', err);
      this.showToast('Konular kaydedilirken bir hata oluştu.');
    }
  },

  saveExcelKonular(encodedData) {
    try {
      const satirlar = JSON.parse(decodeURIComponent(encodedData));
      if (!Array.isArray(satirlar) || satirlar.length === 0) {
        this.showToast('Aktarılacak geçerli konu bulunamadı.');
        return;
      }

      const res = Store.addOrUpdateKonularBatch(satirlar);
      this.closeModal();
      this.renderCurriculumPool();
      this.showToast(`${res.eklenen} konu eklendi, ${res.guncellenen} konu güncellendi.`);
    } catch (err) {
      console.error('Konular kaydedilirken hata:', err);
      this.showToast('Konular kaydedilirken bir hata oluştu.');
    }
  },

  otoDersIkonlariniGuncelle() {
    const count = Store.autoSyncAllDersIkonlari();
    this.renderCurriculumPool();
    this.showToast(`${count > 0 ? count + ' dersin' : 'Tüm derslerin'} sembol ve rengi ders adlarına göre güncellendi.`);
  },

  // G16: Mükerrer dersleri birleştir ve temizle arayüz aksiyonu
  birlestirMukerrerDerslerAction() {
    this.openConfirmModal(
      'Mükerrer Dersleri Birleştir & Temizle',
      'Deneme sınavı içe aktarmalarından veya farklı yazımlardan kaynaklanan mükerrer/sahte dersler (örn. FEN VE TEKN., Sosyal Bilgiler vb.) ana derslerinizle (örn. 8 Fen Bilimleri, 8 İnkılap Tarihi vb.) otomatik olarak birleştirilecektir. Konular ve öğrenci kazanım kayıtları ana derslere güvenle aktarılacaktır. Devam etmek istiyor musunuz?',
      () => {
        const res = Store.birlestirMukerrerDersler();
        if (res.birlestirilenDersSayisi === 0) {
          this.showToast('Mükerrer veya sahte ders bulunamadı. Tüm dersleriniz düzenli!');
        } else {
          this.showToast(`${res.birlestirilenDersSayisi} mükerrer ders birleştirildi, ${res.tasinanKonuSayisi} konu ana derslere aktarıldı.`);
          this.renderCurrentView();
        }
      }
    );
  },

  openDersModal(dersId = null) {
    const isEdit = Boolean(dersId);
    const d = isEdit ? Store.getDers(dersId) : null;

    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const siniflar = typeof SINIFLAR !== 'undefined' ? SINIFLAR : [];
    const renkler = ['rose', 'blue', 'emerald', 'amber', 'purple', 'teal', 'orange', 'cyan', 'indigo', 'slate'];
    const populerIkonlar = [
      'book', 'scroll', 'calculator', 'shapes', 'flask-conical', 'atom', 'test-tube', 'dna',
      'landmark', 'globe', 'brain', 'compass', 'languages', 'heart-handshake', 'music', 'palette',
      'activity', 'laptop', 'cpu', 'scale', 'trending-up', 'telescope', 'shield-alert', 'microscope'
    ];

    const seciliModulId = d ? d.modulId : (this.poolModulFilter || 'yks');
    const seciliSinif = d ? String(d.sinif || 'ortak') : 'ortak';
    const varsayilanDetect = Store.detectDersIkonVeRenk(d ? d.ad : '', d ? d.kisaltma : '');
    const seciliRenk = d ? (d.renk || varsayilanDetect.renk) : varsayilanDetect.renk;
    const seciliIkon = d ? (d.ikon || varsayilanDetect.ikon) : varsayilanDetect.ikon;

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
          <!-- Ders Adı & Kısaltma & Önizleme Rozeti -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-[var(--color-ink)]">Ders Bilgileri</span>
              <div id="ders-modal-preview-badge" class="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-${seciliRenk}-100 dark:bg-${seciliRenk}-950/40 text-${seciliRenk}-600 dark:text-${seciliRenk}-400 border border-${seciliRenk}-200 dark:border-${seciliRenk}-800/50">
                <i id="ders-modal-preview-icon" data-lucide="${seciliIkon}" class="w-4 h-4"></i>
                <span id="ders-modal-preview-text" class="font-bold text-[11px]">${d ? d.ad : 'Önizleme'}</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="block font-semibold text-[var(--color-ink)] mb-1">Ders Adı <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="ders-input-ad" value="${d ? d.ad : ''}" required placeholder="Örn: Geometri, Biyoloji, Türkçe" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
              </div>
              <div>
                <label class="block font-semibold text-[var(--color-ink)] mb-1">Kısaltma <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="ders-input-kisaltma" maxlength="5" value="${d ? d.kisaltma : ''}" required placeholder="GEO" class="w-full p-2 uppercase font-mono rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
              </div>
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

          <!-- Sembol / İkon Seçimi -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block font-semibold text-[var(--color-ink)]">Ders Sembolü (İkon)</label>
              <span class="text-[10px] text-[var(--color-ink-faint)]">Ad girildiğinde otomatik eşlenir</span>
            </div>
            <div class="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-2 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] max-h-24 overflow-y-auto">
              ${populerIkonlar.map(ik => `
                <label class="cursor-pointer flex items-center justify-center p-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--color-paper-4)] transition-colors border ${seciliIkon === ik ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold' : 'border-transparent text-[var(--color-ink-muted)]'}" title="${ik}">
                  <input type="radio" name="ders-ikon" value="${ik}" class="sr-only" ${seciliIkon === ik ? 'checked' : ''}>
                  <i data-lucide="${ik}" class="w-4 h-4"></i>
                </label>
              `).join('')}
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

    let userManuallyPickedIkon = Boolean(isEdit);
    let userManuallyPickedRenk = Boolean(isEdit);

    const adInput = document.getElementById('ders-input-ad');
    const kisaltmaInput = document.getElementById('ders-input-kisaltma');

    const updatePreviewAndSelection = () => {
      const adVal = adInput ? adInput.value.trim() : '';
      const kisVal = kisaltmaInput ? kisaltmaInput.value.trim() : '';
      const detected = Store.detectDersIkonVeRenk(adVal, kisVal);

      if (!userManuallyPickedIkon && adVal) {
        const radioIkon = document.querySelector(`input[name="ders-ikon"][value="${detected.ikon}"]`);
        if (radioIkon) {
          radioIkon.checked = true;
          document.querySelectorAll('input[name="ders-ikon"]').forEach(r => {
            const lbl = r.parentElement;
            if (lbl) {
              lbl.classList.toggle('border-[var(--color-accent)]', r.checked);
              lbl.classList.toggle('bg-[var(--color-accent-subtle)]', r.checked);
              lbl.classList.toggle('text-[var(--color-accent)]', r.checked);
              lbl.classList.toggle('border-transparent', !r.checked);
            }
          });
        }
      }

      if (!userManuallyPickedRenk && adVal) {
        const radioRenk = document.querySelector(`input[name="ders-renk"][value="${detected.renk}"]`);
        if (radioRenk) radioRenk.checked = true;
      }

      const activeIkon = document.querySelector('input[name="ders-ikon"]:checked')?.value || detected.ikon;
      const activeRenk = document.querySelector('input[name="ders-renk"]:checked')?.value || detected.renk;

      const badge = document.getElementById('ders-modal-preview-badge');
      const textEl = document.getElementById('ders-modal-preview-text');
      const iconEl = document.getElementById('ders-modal-preview-icon');

      if (textEl) textEl.textContent = adVal || 'Önizleme';
      if (badge) {
        badge.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] bg-${activeRenk}-100 dark:bg-${activeRenk}-950/40 text-${activeRenk}-600 dark:text-${activeRenk}-400 border border-${activeRenk}-200 dark:border-${activeRenk}-800/50`;
      }
      if (iconEl) {
        iconEl.setAttribute('data-lucide', activeIkon);
        if (window.lucide) lucide.createIcons();
      }
    };

    if (adInput) {
      adInput.addEventListener('input', () => {
        updatePreviewAndSelection();
      });
    }

    if (kisaltmaInput) {
      kisaltmaInput.addEventListener('input', () => {
        updatePreviewAndSelection();
      });
    }

    document.querySelectorAll('input[name="ders-ikon"]').forEach(radio => {
      radio.addEventListener('change', () => {
        userManuallyPickedIkon = true;
        document.querySelectorAll('input[name="ders-ikon"]').forEach(r => {
          const lbl = r.parentElement;
          if (lbl) {
            lbl.classList.toggle('border-[var(--color-accent)]', r.checked);
            lbl.classList.toggle('bg-[var(--color-accent-subtle)]', r.checked);
            lbl.classList.toggle('text-[var(--color-accent)]', r.checked);
            lbl.classList.toggle('border-transparent', !r.checked);
          }
        });
        updatePreviewAndSelection();
      });
    });

    document.querySelectorAll('input[name="ders-renk"]').forEach(radio => {
      radio.addEventListener('change', () => {
        userManuallyPickedRenk = true;
        updatePreviewAndSelection();
      });
    });

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
        const secilenIkonEl = document.querySelector('input[name="ders-ikon"]:checked');

        const detected = Store.detectDersIkonVeRenk(ad, kisaltma);
        const renk = secilenRenkEl ? secilenRenkEl.value : detected.renk;
        const ikon = secilenIkonEl ? secilenIkonEl.value : detected.ikon;

        if (!ad || !kisaltma) {
          this.showToast('Lütfen ders adı ve kısaltmasını girin.');
          return;
        }

        if (isEdit) {
          Store.updateDers(dersId, { ad, kisaltma, modulId, sinif, haftalikSaat, soruSayisi, sinavdaMi, renk, ikon, manualIkon: userManuallyPickedIkon });
          this.showToast('Ders güncellendi');
        } else {
          const yeni = Store.addDers({ ad, kisaltma, modulId, sinif, haftalikSaat, soruSayisi, sinavdaMi, renk, ikon });
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

          <!-- MEB / ÖSYM Kazanımları -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block font-semibold text-[var(--color-ink)]">MEB / ÖSYM Kazanımları & Deneme Eşleştirme Etiketleri</label>
              <span class="text-[10px] text-[var(--color-ink-muted)]">Her satıra bir kazanım/ifade</span>
            </div>
            <textarea id="konu-input-kazanimlar" class="input-editorial w-full text-xs p-2.5 h-20 font-mono text-[11px]" placeholder="Örn:&#10;İki doğal sayının en büyük ortak bölenini (EBOB) hesaplar.&#10;Verilen iki doğal sayının aralarında asal olduğunu belirler.">${konu && Array.isArray(konu.kazanimlar) ? konu.kazanimlar.join('\n') : ''}</textarea>
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
        const kazanimlarRaw = document.getElementById('konu-input-kazanimlar')?.value || '';
        const kazanimlar = kazanimlarRaw.split('\n').map(s => s.trim()).filter(Boolean);

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
            aciklama,
            kazanimlar
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
            aciklama,
            kazanimlar
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
      return true;
    });

    let html = `
      <div class="p-6 max-w-7xl mx-auto space-y-6">
        <!-- Bölüm 1: Araç Çubuğu -->
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-[var(--radius-lg)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] shadow-sm">
          <!-- Sol Kısım: Başlık & Modül Segment Butonları -->
          <div class="flex flex-wrap items-center gap-4">
            <div>
              <h2 class="font-display font-bold text-lg text-[var(--color-ink)] leading-tight">Kaynak & Yayın Kütüphanesi</h2>
              <p class="text-xs text-[var(--color-ink-muted)]">Soru bankası, fasikül ve deneme setleri envanteri</p>
            </div>

            <div class="h-6 w-px bg-[var(--color-rule)] hidden sm:block"></div>

            <!-- Modül Segment Butonları -->
            <div class="flex items-center gap-1 p-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-md)] text-xs">
              <button onclick="App.libraryModulFilter = ''; App.renderLibrary();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${!this.libraryModulFilter ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                Tüm Modüller
              </button>
              <button onclick="App.libraryModulFilter = 'ara-sinif'; App.renderLibrary();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${this.libraryModulFilter === 'ara-sinif' ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                Ara Sınıf
              </button>
              <button onclick="App.libraryModulFilter = 'lgs'; App.renderLibrary();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${this.libraryModulFilter === 'lgs' ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                LGS
              </button>
              <button onclick="App.libraryModulFilter = 'yks'; App.renderLibrary();" class="btn-tactile text-xs py-1.5 px-3 rounded-[var(--radius-sm)] ${this.libraryModulFilter === 'yks' ? 'btn-tactile-primary font-bold shadow-xs' : 'btn-tactile-ghost text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                TYT-AYT
              </button>
            </div>
          </div>

          <!-- Sağ Kısım: Excel İşlemleri ve Kaynak Ekleme -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="ExcelEngine.kaynaklarDisaAktar('${this.libraryModulFilter || ''}')" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Kaynakları Excel formatında indir">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Excel'e Aktar</span>
            </button>
            <button onclick="App.openKaynakExcelModal()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5" title="Excel'den toplu kaynak yükle">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Excel'den Yükle</span>
            </button>
            <button onclick="App.openKaynakModal()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 shadow-xs flex items-center gap-1.5 font-semibold">
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

  openGorevModal(ogrenciId, gorevId = null, konuId = null, kaynakId = null, varsayilanBaslik = null, varsayilanDersAdi = null, varsayilanNot = null) {
    const targetOgrId = ogrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(targetOgrId);

    if (!ogr) {
      this.showToast('Lütfen önce bir öğrenci seçin veya ekleyin.');
      return;
    }

    const isEdit = Boolean(gorevId);
    const mevcutGorev = isEdit ? Store.getGorevler(ogr.id).find(g => String(g.id) === String(gorevId)) : null;

    let dersler = Store.getDerslerForOgrenci(ogr);

    // Eğer konuId veya varsayilanDersAdi belirtildiyse dersini bul
    let varsayilanDersId = dersler.length > 0 ? dersler[0].id : '';
    if (mevcutGorev) {
      varsayilanDersId = mevcutGorev.dersId;
    } else if (konuId) {
      const targetKonu = Store.getKonu(konuId);
      if (targetKonu && targetKonu.dersId) {
        varsayilanDersId = targetKonu.dersId;
      }
    }
    
    // Eğer konu üzerinden ders belirlenememişse veya ders adı doğrudan verildiyse
    if (!mevcutGorev && varsayilanDersAdi && (!konuId || !varsayilanDersId)) {
      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '');
      const targetDersNorm = norm(varsayilanDersAdi);
      const matchedDers = Store.getDersler().find(d => {
        const dNorm = norm(d.ad);
        return dNorm === targetDersNorm || dNorm.includes(targetDersNorm) || targetDersNorm.includes(dNorm);
      });
      if (matchedDers) {
        varsayilanDersId = matchedDers.id;
      }
    }

    if (varsayilanDersId && !dersler.some(d => String(d.id) === String(varsayilanDersId))) {
      const extraDers = Store.getDers(varsayilanDersId);
      if (extraDers) {
        dersler = [extraDers, ...dersler];
      }
    }

    const seciliDersId = varsayilanDersId;
    const seciliKaynakId = mevcutGorev ? (mevcutGorev.kaynakId || '') : (kaynakId || '');
    const kaynaklar = Store.getKaynaklar();

    let baslikDegeri = mevcutGorev ? (mevcutGorev.baslik || '') : (varsayilanBaslik || '');
    if (!baslikDegeri && konuId) {
      const targetKonu = Store.getKonu(konuId);
      if (targetKonu && targetKonu.konuAdi) {
        baslikDegeri = targetKonu.konuAdi;
      }
    }

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
            <input type="text" id="grv-baslik" value="${(baslikDegeri || '').replace(/"/g, '&quot;')}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: 50 Yeni Nesil Soru Çözümü">
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
              <div class="flex items-center gap-1.5 mt-1.5">
                <button type="button" onclick="App.setGorevQuickDeadline(3)" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer text-[11px] py-0.5 px-2 font-medium" title="3 gün sonra">3G</button>
                <button type="button" onclick="App.setGorevQuickDeadline(5)" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer text-[11px] py-0.5 px-2 font-medium" title="5 gün sonra">5G</button>
                <button type="button" onclick="App.setGorevQuickDeadline(7)" class="meta-pill hover:border-[var(--color-accent)] cursor-pointer text-[11px] py-0.5 px-2 font-medium" title="1 hafta sonra">1H</button>
              </div>
            </div>
          </div>

          <div>
            <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Koç / Görev Notu</label>
            <textarea id="grv-not" rows="2" class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Yanlış soruları hata defterine not etsin.">${mevcutGorev ? (mevcutGorev.not || '') : ((varsayilanNot || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'))}</textarea>
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

    // Otomatik Süre Hesaplama (Hedef Soru -> Süre Dk)
    const hedefInput = document.getElementById('grv-hedef');
    const sureInput = document.getElementById('grv-sure');
    const calcAutoSure = () => {
      if (!hedefInput || !sureInput) return;
      const soru = Number(hedefInput.value) || 0;
      if (soru <= 0) {
        sureInput.value = 0;
        return;
      }
      const dersAd = dersSelect ? (dersSelect.options[dersSelect.selectedIndex]?.text || '') : '';
      const isSayisal = /mat|fen|fiz|kim|biyo|geo/i.test(dersAd);
      const katsayi = isSayisal ? 2 : 1.5;
      const raw = soru * katsayi;
      sureInput.value = raw <= 15 ? Math.round(raw) : Math.round(raw / 5) * 5;
    };

    if (hedefInput && sureInput) {
      hedefInput.addEventListener('input', calcAutoSure);
      hedefInput.addEventListener('change', calcAutoSure);
      if (dersSelect) {
        dersSelect.addEventListener('change', () => {
          if (Number(hedefInput.value) > 0) calcAutoSure();
        });
      }
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

  setGorevQuickDeadline(days, inputId = 'grv-deadline') {
    const d = new Date();
    d.setDate(d.getDate() + Number(days));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const input = document.getElementById(inputId);
    if (input) {
      input.value = `${yyyy}-${mm}-${dd}`;
      input.dispatchEvent(new Event('change'));
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
  cizelgeAktifSablon: 'zaman-blok',
  cizelgeOgrenciId: '',
  cizelgeDersId: '',
  cizelgeGorevleriYerlestir: true,
  cizelgeKonuBosMod: false,
  cizelgeAktifSayfa: 1,
  cizelgeToplamSayfa: 1,
  cizelgeOdevModu: 'dolu', // 'dolu' | 'bos'
  cizelgeZamanKapsami: 'hafta', // 'hafta' | 'tum'
  cizelgeZamanHaftaSonuRapor: true, // raporda Cmt/Paz planını ayrı bölüm olarak göster

  // G1 & G3 & G6: State Değişkenleri
  cizelgeKonuSoruAyOffset: 0,
  cizelgeKonuSoruBosMod: false,
  cizelgeKonuSoruDersId: '',
  konuSoruTurSayisi: 5,
  zamanHaftaOffset: 0,
  zamanAktifKategori: 'okul',
  zamanDragging: false,
  zamanRutinDropdownAcik: false,
  aliskanlikAyOffset: 0,

  // G1: Tarih & Zaman Hesaplayıcıları
  getKonuSoruMonthInfo(offset = 0) {
    const ayAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const gunKisalari = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const yil = target.getFullYear();
    const ayIdx = target.getMonth();
    const ayAdi = ayAdlari[ayIdx];
    const yilAyStr = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`;
    const daysCount = new Date(yil, ayIdx + 1, 0).getDate();

    const isCurrentMonth = (now.getFullYear() === yil && now.getMonth() === ayIdx);
    const todayDate = now.getDate();

    const gunler = [];
    for (let day = 1; day <= daysCount; day++) {
      const d = new Date(yil, ayIdx, day);
      const dayOfWeek = d.getDay(); // 0 = Pz, 6 = Ct
      const isHaftasonu = (dayOfWeek === 0 || dayOfWeek === 6);
      const isToday = isCurrentMonth && (day === todayDate);
      gunler.push({
        gun: day,
        gunKisa: gunKisalari[dayOfWeek],
        isHaftasonu,
        isToday,
        tarihStr: `${yil}-${String(ayIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      });
    }

    const haftalar = [
      { no: 1, label: 'Hf 1 (1-7)', range: '1-7' },
      { no: 2, label: 'Hf 2 (8-14)', range: '8-14' },
      { no: 3, label: 'Hf 3 (15-21)', range: '15-21' },
      { no: 4, label: 'Hf 4 (22-28)', range: '22-28' },
      { no: 5, label: `Hf 5 (29-${daysCount})`, range: `29-${daysCount}` }
    ];
    return { yil, ayIdx, ayAdi, yilAyStr, daysCount, gunler, haftalar };
  },

  getZamanWeekInfo(offset = 0) {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Pzt = 0 .. Paz = 6
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + (offset * 7));
    
    const gunler = ['pzt', 'sal', 'car', 'per', 'cum', 'cmt', 'paz'];
    const gunAdlari = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const ayAdlariKisa = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    const gunDetaylari = gunler.map((gKey, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      return {
        key: gKey,
        ad: gunAdlari[idx],
        tarihStr: `${d.getDate()} ${ayAdlariKisa[d.getMonth()]}`,
        fullDate: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      };
    });

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const rangeStr = `${monday.getDate()} ${ayAdlariKisa[monday.getMonth()]} - ${sunday.getDate()} ${ayAdlariKisa[sunday.getMonth()]} ${sunday.getFullYear()}`;

    return { monday, sunday, rangeStr, gunDetaylari };
  },

  getAliskanlikMonthInfo(offset = 0) {
    const ayAdlari = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const gunKisa = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const yil = target.getFullYear();
    const ayIdx = target.getMonth();
    const ayAdi = ayAdlari[ayIdx];
    const yilAyStr = `${yil}-${String(ayIdx + 1).padStart(2, '0')}`;
    const daysCount = new Date(yil, ayIdx + 1, 0).getDate();

    const gunler = [];
    for (let i = 1; i <= daysCount; i++) {
      const d = new Date(yil, ayIdx, i);
      gunler.push({
        gun: i,
        gunKisa: gunKisa[d.getDay()],
        isHaftasonu: d.getDay() === 0 || d.getDay() === 6,
        tarihStr: `${yil}-${String(ayIdx + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    return { yil, ayIdx, ayAdi, yilAyStr, daysCount, gunler };
  },

  getAliskanlikColorHex(renkAdi) {
    const map = {
      blue:    { renk: '#2563eb', bg: '#dbeafe', border: '#93c5fd' },
      indigo:  { renk: '#4f46e5', bg: '#e0e7ff', border: '#a5b4fc' },
      purple:  { renk: '#9333ea', bg: '#f3e8ff', border: '#d8b4fe' },
      teal:    { renk: '#0d9488', bg: '#ccfbf1', border: '#5eead4' },
      emerald: { renk: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
      rose:    { renk: '#e11d48', bg: '#ffe4e6', border: '#fda4af' },
      amber:   { renk: '#d97706', bg: '#fef3c7', border: '#fcd34d' },
      sky:     { renk: '#0284c7', bg: '#e0f2fe', border: '#7dd3fc' }
    };
    return map[renkAdi] || map.blue;
  },

  setCizelgeSablon(sablon) {
    this.cizelgeAktifSablon = sablon;
    this.cizelgeAktifSayfa = 1;
    this.renderCizelgeRobotu();
  },

  onCizelgeOgrenciChange(ogrId) {
    this.cizelgeOgrenciId = ogrId;
    this.cizelgeDersId = '';
    this.cizelgeAktifSayfa = 1;
    if (ogrId) {
      Store.setAktifOgrenci(ogrId);
      this.populateStudentDropdown();
      this.updateGlobalBadges();
    }
    this.renderCizelgeRobotu();
  },

  copyCizelgeMcpPrompt() {
    const ogrenciId = this.cizelgeOgrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(ogrenciId);
    const sablon = this.cizelgeAktifSablon || 'zaman-blok';
    const ogrAd = ogr ? `${ogr.adSoyad} (ID: ${ogr.id})` : 'aktif öğrenci';

    const sablonPromptMap = {
      'zaman-blok': `Plantrack MCP kullanarak ${ogrAd} için "plantrack_get_chart_summary" (sablon: "zaman-blok") ve "plantrack_get_student_schedule" araçlarıyla haftalık zaman bloklama planını incele, eksik çalışma bloklarını analiz et ve "plantrack_batch_update_schedule" ile optimize et.`,
      'odev-takip': `Plantrack MCP kullanarak ${ogrAd} için "plantrack_get_chart_summary" (sablon: "odev-takip") aracıyla haftalık ödev takip çizelgesini incele ve eksik konulara göre "plantrack_add_task" ile yeni ödevler planla.`,
      'konu-takip': `Plantrack MCP kullanarak ${ogrAd} için "plantrack_get_chart_summary" (sablon: "konu-takip") aracıyla ders bazlı konu ilerlemesini ve koç notlarını incele, güncellemek için "plantrack_update_topic_status" ve "plantrack_update_chart_note" araçlarını kullan.`,
      'konu-soru': `Plantrack MCP kullanarak ${ogrAd} için "plantrack_get_chart_summary" (sablon: "konu-soru") ve "plantrack_get_question_tracking" araçlarıyla tur bazlı D/Y/B/S soru takip matrisini analiz et; yeni verileri "plantrack_record_question_count" ile kaydet.`,
      'aliskanlik': `Plantrack MCP kullanarak ${ogrAd} için "plantrack_get_chart_summary" (sablon: "aliskanlik") ve "plantrack_get_student_habits" araçlarıyla 31 günlük alışkanlık zincirini incele; güncellemeler için "plantrack_log_habit_activity" veya "plantrack_update_habit_month_end" araçlarını kullan.`
    };

    const promptText = sablonPromptMap[sablon] || sablonPromptMap['zaman-blok'];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promptText).then(() => {
        this.showToast('Aktif çizelge için AI MCP komutu panoya kopyalandı!');
      }).catch(() => {
        this.showToast('MCP Komutu: ' + promptText);
      });
    } else {
      this.showToast('MCP Komutu: ' + promptText);
    }
  },

  cizelgeSayfaDegistir(delta) {
    const yeni = this.cizelgeAktifSayfa + delta;
    if (yeni >= 1 && yeni <= this.cizelgeToplamSayfa) {
      this.cizelgeAktifSayfa = yeni;
      this.renderCizelgePreview();
    }
  },

  cizelgeSayfayaGit(sayfa) {
    const s = parseInt(sayfa, 10) || 1;
    if (s >= 1 && s <= this.cizelgeToplamSayfa) {
      this.cizelgeAktifSayfa = s;
      this.renderCizelgePreview();
    }
  },

  setCizelgeOdevModu(mod) {
    this.cizelgeOdevModu = mod;
    this.cizelgeAktifSayfa = 1;
    this.renderCizelgeRobotu();
  },

  setCizelgeZamanKapsami(kapsam) {
    this.cizelgeZamanKapsami = kapsam;
    this.cizelgeAktifSayfa = 1;
    this.renderCizelgeRobotu();
  },

  renderCizelgePaginationBar(isLandscape = false) {
    const bar = document.getElementById('cizelge-pagination-bar');
    if (!bar) return;

    if (this.cizelgeToplamSayfa <= 1) {
      bar.className = 'hidden';
      bar.innerHTML = '';
      return;
    }

    bar.className = isLandscape
      ? 'w-full max-w-[1240px] mx-auto mb-3 transition-all'
      : 'w-full max-w-[900px] mx-auto mb-3 transition-all';

    bar.innerHTML = `
      <div class="flex items-center justify-between bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] px-4 py-2 text-xs shadow-xs">
        <button type="button" onclick="App.cizelgeSayfaDegistir(-1)" 
          class="btn-tactile btn-tactile-secondary text-xs py-1 px-3 flex items-center gap-1.5 transition-all ${this.cizelgeAktifSayfa <= 1 ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}">
          <i data-lucide="chevron-left" class="w-3.5 h-3.5"></i>
          <span>Önceki Sayfa</span>
        </button>

        <div class="flex items-center gap-2 font-mono font-bold text-xs text-[var(--color-ink)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] px-3 py-1 rounded-[var(--radius-sm)]">
          <i data-lucide="file-text" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
          <span>Sayfa ${this.cizelgeAktifSayfa} / ${this.cizelgeToplamSayfa}</span>
        </div>

        <button type="button" onclick="App.cizelgeSayfaDegistir(1)" 
          class="btn-tactile btn-tactile-secondary text-xs py-1 px-3 flex items-center gap-1.5 transition-all ${this.cizelgeAktifSayfa >= this.cizelgeToplamSayfa ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}">
          <span>Sonraki Sayfa</span>
          <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
  },

  onCizelgeDersChange(dersId) {
    this.cizelgeDersId = dersId;
    this.renderCizelgePreview();
  },

  toggleCizelgeKonuBosMod() {
    this.cizelgeKonuBosMod = !this.cizelgeKonuBosMod;
    this.renderCizelgePreview();
  },

  // G1: Navigasyon ve Buton Handler'ları
  changeKonuSoruAy(delta) {
    this.cizelgeKonuSoruAyOffset += delta;
    this.renderCizelgeRobotu();
  },

  toggleKonuSoruBosMod() {
    this.cizelgeKonuSoruBosMod = !this.cizelgeKonuSoruBosMod;
    this.renderCizelgePreview();
  },

  onKonuSoruDersChange(dersId) {
    this.cizelgeKonuSoruDersId = dersId;
    this.renderCizelgePreview();
  },

  onKonuSoruTurChange(val) {
    this.konuSoruTurSayisi = parseInt(val, 10) || 10;
    this.renderCizelgePreview();
  },

  onKonuTakipNotChange(ogrenciId, dersId, metin) {
    if (!ogrenciId || !dersId) return;
    Store.saveKonuTakipNot(ogrenciId, dersId, metin);
  },

  changeZamanHafta(delta) {
    this.zamanHaftaOffset += delta;
    this.renderCizelgeRobotu();
  },

  setZamanHaftaSonuRapor(dahil) {
    this.cizelgeZamanHaftaSonuRapor = Boolean(dahil);
    this.renderCizelgeRobotu();
  },

  setZamanKategori(catId) {
    this.zamanAktifKategori = catId;
    this.renderCizelgeRobotu();
  },

  changeAliskanlikAy(delta) {
    this.aliskanlikAyOffset += delta;
    this.renderCizelgeRobotu();
  },

  toggleAliskanlikCell(ogrenciId, aliskanlikId, tarihStr) {
    if (!ogrenciId) return;
    Store.toggleAliskanlikGun(ogrenciId, aliskanlikId, tarihStr);
    const mInfo = this.getAliskanlikMonthInfo(this.aliskanlikAyOffset);
    const doneCount = mInfo.gunler.filter(g => Store.getAliskanlikDurum(ogrenciId, aliskanlikId, g.tarihStr)).length;
    Store.saveAliskanlikAySonu(ogrenciId, aliskanlikId, mInfo.yilAyStr, { gun: doneCount }, false);
    this.renderCizelgePreview();
  },

  onAliskanlikAySonuGunChange(ogrenciId, aliskanlikId, yilAyStr, val, daysCount) {
    if (!ogrenciId) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }
    const gunSayisi = val === '' ? 0 : Math.max(0, Math.min(daysCount || 31, parseInt(val, 10) || 0));
    Store.saveAliskanlikAySonu(ogrenciId, aliskanlikId, yilAyStr, { gun: gunSayisi }, true);
    this.renderCizelgePreview();
    this.showToast(`Ay sonu değeri (${gunSayisi} gün) kaydedildi.`);
  },

  onAliskanlikAySonuNotChange(ogrenciId, aliskanlikId, yilAyStr, val) {
    if (!ogrenciId) return;
    Store.saveAliskanlikAySonu(ogrenciId, aliskanlikId, yilAyStr, { not: (val || '').trim() }, false);
    this.showToast('Ay sonu notu kaydedildi.');
  },

  onAliskanlikNotChange(ogrenciId, yilAyStr, val) {
    if (!ogrenciId) return;
    Store.saveAliskanlikNot(ogrenciId, yilAyStr, val);
  },

  async clearAliskanlikAySonu(ogrenciId, yilAyStr) {
    if (!ogrenciId) return;
    const onay = await this.confirmModal({
      baslik: 'Ay Sonu Verilerini Temizle',
      mesaj: 'Bu ay için girilmiş tüm ay sonu alışkanlık kayıtları ve işaretlenen günler temizlenecektir. Emin misiniz?',
      onayMetni: 'Temizle',
      tehlikeli: true
    });
    if (onay) {
      Store.clearAliskanlikAySonu(ogrenciId, yilAyStr);
      this.renderCizelgePreview();
      this.showToast('Ay sonu alışkanlık verileri temizlendi.');
    }
  },

  onKonuSoruHucreChange(ogrenciId, konuId, turNo, yilAyStr, alan, val) {
    if (!ogrenciId) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }
    Store.saveKonuSoruHucre(ogrenciId, konuId, turNo, yilAyStr, alan, val);
    if (alan === 'd' || alan === 'y' || alan === 'b') {
      const v = Store.getKonuSoruVeri(ogrenciId, konuId, turNo, yilAyStr);
      const sInput = document.getElementById(`ks-input-${konuId}-${turNo}-s`);
      if (sInput && !v.sManual) {
        sInput.value = v.s > 0 ? v.s : '';
      }
    }
  },

  async clearZamanPlani() {
    const selectEl = document.getElementById('cizelge-ogrenci-select');
    const ogrenciId = (selectEl ? selectEl.value : '') || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;
    if (!ogrenciId) return;

    const onay = await this.confirmModal({
      baslik: 'Tüm Haftayı Temizle',
      mesaj: 'Öğrencinin haftalık zaman bloklama tablosundaki tüm hücreler temizlenecektir. Onaylıyor musunuz?',
      onayMetni: 'Temizle',
      tehlikeli: true
    });

    if (onay) {
      Store.resetZamanPlani(ogrenciId);
      this.renderCizelgePreview();
      this.showToast('Zaman planı temizlendi.');
    }
  },

  // G3: Örnek Rutin Metotları
  toggleZamanRutinDropdown(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    this.zamanRutinDropdownAcik = !this.zamanRutinDropdownAcik;
    this.renderCizelgeRobotu();
  },

  async zamanBlokaOrnekRutinUygula(ogrenciId, rutinId) {
    if (!ogrenciId) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }

    const tumRutinler = typeof ZAMAN_RUTINLER !== 'undefined' ? ZAMAN_RUTINLER : [];
    const rutin = tumRutinler.find(r => r.id === rutinId);
    if (!rutin) {
      this.showToast('Rutin şablonu bulunamadı.');
      return;
    }

    const mevcutPlan = Store.getZamanPlani(ogrenciId);
    const hasData = Object.keys(mevcutPlan || {}).length > 0;

    if (hasData) {
      const onay = await this.confirmModal({
        baslik: 'Örnek Rutin Yükle',
        mesaj: 'Mevcut haftalık program silinecek ve örnek rutin yüklenecektir. Onaylıyor musunuz?',
        onayMetni: 'Rutin Yükle',
        tehlikeli: false
      });
      if (!onay) return;
    }

    Store.resetZamanPlani(ogrenciId);

    const hucreler = rutin.hucreler || rutin.hücreler || [];
    const kategoriler = typeof ZAMAN_KATEGORILER !== 'undefined' ? ZAMAN_KATEGORILER : [];

    hucreler.forEach(h => {
      const allActivities = typeof ZAMAN_FAALIYETLER_FLAT !== 'undefined' ? ZAMAN_FAALIYETLER_FLAT : [];
      const cat = allActivities.find(f => f.id === h.kategori) || kategoriler.find(c => c.id === h.kategori) || {
        id: h.kategori,
        label: h.baslik,
        renk: '#2563eb',
        bg: '#eff6ff'
      };

      const veri = {
        kategori: h.kategori,
        label: h.baslik,
        renk: cat.renk,
        bg: cat.bg,
        not: ''
      };

      const sStr = String(h.saat);
      if (!sStr.includes(':')) {
        const hh = sStr.padStart(2, '0');
        Store.saveZamanHucresi(ogrenciId, h.gun, `${hh}:00`, veri);
        Store.saveZamanHucresi(ogrenciId, h.gun, `${hh}:30`, veri);
      } else {
        Store.saveZamanHucresi(ogrenciId, h.gun, sStr, veri);
      }
    });

    this.zamanRutinDropdownAcik = false;
    this.renderCizelgeRobotu();
    this.showToast(`"${rutin.ad}" yüklendi.`);
  },

  async resetAliskanliklarToDefault(ogrenciId) {
    if (!ogrenciId) return;
    const ogr = Store.getOgrenci(ogrenciId);
    const modulId = ogr ? (ogr.modulId || 'lgs') : 'lgs';
    const onay = await this.confirmModal({
      baslik: 'Varsayılana Döndür',
      mesaj: 'Öğrencinin 6 alışkanlığı ilgili eğitim modülünün standart önerilen listesine döndürülecektir. Onaylıyor musunuz?',
      onayMetni: 'Varsayılana Döndür',
      tehlikeli: false
    });
    if (onay) {
      const varsayilan = Store.getDefaultAliskanliklar(modulId);
      Store.saveAliskanliklar(ogrenciId, JSON.parse(JSON.stringify(varsayilan)));
      this.renderCizelgePreview();
      this.showToast('Varsayılan alışkanlıklar yüklendi.');
    }
  },

  openKonuSoruModal(ogrenciId, konuId, haftaIndex, yilAyStr, konuAdi) {
    if (!ogrenciId) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }
    const current = Store.getKonuSoruVeri(ogrenciId, konuId, haftaIndex, yilAyStr);
    const html = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">${konuAdi}</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Hafta ${haftaIndex} • D/Y/B/S Girişi</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-konu-soru" class="space-y-3 text-xs">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-emerald-700 dark:text-emerald-400 mb-1">Doğru (D)</label>
              <input type="number" id="ks-d" min="0" value="${current.d || 0}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] font-bold text-center text-sm focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-medium text-rose-700 dark:text-rose-400 mb-1">Yanlış (Y)</label>
              <input type="number" id="ks-y" min="0" value="${current.y || 0}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] font-bold text-center text-sm focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-amber-700 dark:text-amber-400 mb-1">Boş (B)</label>
              <input type="number" id="ks-b" min="0" value="${current.b || 0}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] font-bold text-center text-sm focus:outline-none focus:border-[var(--color-accent)]">
            </div>
            <div>
              <label class="block font-medium text-blue-700 dark:text-blue-400 mb-1">Toplam Soru (S)</label>
              <input type="number" id="ks-s" min="0" value="${current.s || 0}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] font-bold text-center text-sm focus:outline-none focus:border-[var(--color-accent)]">
            </div>
          </div>

          <div class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-between text-[11px]">
            <span class="text-[var(--color-ink-muted)]">Tahmini Doğruluk Oranı:</span>
            <span id="ks-oran-preview" class="font-mono font-bold text-[var(--color-accent)]">
              ${current.s > 0 ? `%${Math.round((current.d / current.s) * 100)}` : '—'}
            </span>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">Kaydet</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const dIn = document.getElementById('ks-d');
    const yIn = document.getElementById('ks-y');
    const bIn = document.getElementById('ks-b');
    const sIn = document.getElementById('ks-s');
    const oranEl = document.getElementById('ks-oran-preview');

    const updateCalc = (autoS = false) => {
      const d = Number(dIn?.value) || 0;
      const y = Number(yIn?.value) || 0;
      const b = Number(bIn?.value) || 0;
      if (autoS && sIn) {
        sIn.value = d + y + b;
      }
      const s = Number(sIn?.value) || 0;
      if (oranEl) {
        oranEl.textContent = s > 0 ? `%${Math.round((d / s) * 100)}` : '—';
      }
    };

    if (dIn && yIn && bIn && sIn) {
      dIn.addEventListener('input', () => updateCalc(true));
      yIn.addEventListener('input', () => updateCalc(true));
      bIn.addEventListener('input', () => updateCalc(true));
      sIn.addEventListener('input', () => updateCalc(false));
    }

    const form = document.getElementById('form-konu-soru');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Number(dIn?.value) || 0;
        const y = Number(yIn?.value) || 0;
        const b = Number(bIn?.value) || 0;
        const s = Number(sIn?.value) || (d + y + b);
        Store.saveKonuSoruVeri(ogrenciId, konuId, haftaIndex, yilAyStr, { d, y, b, s });
        this.closeModal();
        this.renderCizelgePreview();
        this.showToast('Konu soru verisi kaydedildi.');
      });
    }
  },

  openAliskanlikDuzenleModal(ogrenciId) {
    if (!ogrenciId) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }
    const aliskanliklar = Store.getAliskanliklar(ogrenciId);
    const renkSecenekleri = ['blue', 'indigo', 'purple', 'teal', 'emerald', 'rose', 'amber', 'sky'];

    const html = `
      <div class="space-y-4 max-w-xl">
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Alışkanlıkları Düzenle</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Öğrencinin aylık takip edilecek 6 alışkanlığı ve renk teması</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form id="form-aliskanliklar" class="space-y-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
          ${aliskanliklar.map((al, idx) => `
            <div class="p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-[11px] text-[var(--color-ink-muted)] font-mono">Alışkanlık #${idx + 1}</span>
                <div class="flex items-center gap-1.5">
                  ${renkSecenekleri.map(r => `
                    <label class="cursor-pointer">
                      <input type="radio" name="al-renk-${idx}" value="${r}" class="sr-only peer" ${al.renk === r ? 'checked' : ''}>
                      <div class="w-5 h-5 rounded-full border-2 border-transparent peer-checked:border-[var(--color-ink)] peer-checked:scale-110 transition-all" style="background: ${this.getAliskanlikColorHex(r).renk};"></div>
                    </label>
                  `).join('')}
                </div>
              </div>
              <input type="text" id="al-baslik-${idx}" value="${al.baslik || ''}" required class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-1)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Günlük 20 dk kitap okuma">
            </div>
          `).join('')}

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
            <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
            <button type="submit" class="btn-tactile btn-tactile-primary">Kaydet</button>
          </div>
        </form>
      </div>
    `;

    this.openModal(html);

    const form = document.getElementById('form-aliskanliklar');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const yeniListe = aliskanliklar.map((al, idx) => {
          const baslik = document.getElementById(`al-baslik-${idx}`)?.value.trim() || al.baslik;
          const seciliRenkEl = document.querySelector(`input[name="al-renk-${idx}"]:checked`);
          const renk = seciliRenkEl ? seciliRenkEl.value : al.renk;
          return { id: al.id || `al-${idx + 1}`, baslik, renk };
        });

        Store.saveAliskanliklar(ogrenciId, yeniListe);
        this.closeModal();
        this.renderCizelgePreview();
        this.showToast('Alışkanlıklar kaydedildi.');
      });
    }
  },

  getZamanSlotlari(ogrenciId) {
    const oid = ogrenciId || this.cizelgeOgrenciId || (Store.data && Store.data.aktifOgrenciId);
    const ayarlar = Store.getZamanAyarlari ? Store.getZamanAyarlari(oid) : { baslangicSaat: '06:00', bitisSaat: '24:00' };
    const bas = ayarlar.baslangicSaat || '06:00';
    const bit = ayarlar.bitisSaat || '24:00';

    let allSlots = typeof ZAMAN_SLOTLARI !== 'undefined' ? ZAMAN_SLOTLARI : (window.ZAMAN_SLOTLARI || []);
    if (!allSlots || allSlots.length === 0) {
      allSlots = [];
      for (let h = 6; h <= 23; h++) {
        const hh = String(h).padStart(2, '0');
        const nextH = String(h + 1).padStart(2, '0');
        allSlots.push({ slotIdx: allSlots.length, slotKey: `${hh}:00`, startStr: `${hh}:00`, endStr: `${hh}:30`, label: `${hh}:00 – ${hh}:30`, isHourStart: true, hourLabel: `${hh}:00` });
        allSlots.push({ slotIdx: allSlots.length, slotKey: `${hh}:30`, startStr: `${hh}:30`, endStr: `${nextH}:00`, label: `${hh}:30 – ${nextH}:00`, isHourStart: false, hourLabel: `${hh}:30` });
      }
    }

    const filtered = allSlots.filter(s => s.startStr >= bas && s.endStr <= bit);
    const result = filtered.length > 0 ? filtered : allSlots;

    return result.map((s, idx) => ({
      ...s,
      slotIdx: idx
    }));
  },

  onZamanAralikChange(ogrenciId, baslangic, bitis) {
    if (baslangic >= bitis) {
      this.showToast('Başlangıç saati bitiş saatinden önce olmalıdır.', 'warning');
      this.renderCizelgeRobotu();
      return;
    }
    Store.saveZamanAyarlari(ogrenciId, { baslangicSaat: baslangic, bitisSaat: bitis });
    this.showToast(`Çizelge saat aralığı ${baslangic} – ${bitis} olarak güncellendi.`);
    this.renderCizelgeRobotu();
  },

  formatZamanRangeText(range, ogrenciId) {
    if (!range) return 'Zaman Aralığı Seçilmedi';
    const GUN_ADLARI = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const slots = this.getZamanSlotlari(ogrenciId || this.currentZamanModalOgrenciId);

    const minSlot = (range.minSlot !== undefined) ? range.minSlot : (range.minSaat !== undefined ? range.minSaat : 0);
    const maxSlot = (range.maxSlot !== undefined) ? range.maxSlot : (range.maxSaat !== undefined ? range.maxSaat : 0);

    const startSlotObj = slots[minSlot] || { startStr: '06:00' };
    const endSlotObj = slots[maxSlot] || { endStr: '24:00' };

    const startStr = startSlotObj.startStr;
    const endStr = endSlotObj.endStr;

    const slotSayisi = maxSlot - minSlot + 1;
    const saatSayisi = slotSayisi * 0.5;
    const saatSayisiStr = Number.isInteger(saatSayisi) ? String(saatSayisi) : saatSayisi.toFixed(1);

    const gunSayisi = range.maxGun - range.minGun + 1;
    const toplamSaat = gunSayisi * saatSayisi;
    const toplamSaatStr = Number.isInteger(toplamSaat) ? String(toplamSaat) : toplamSaat.toFixed(1);

    if (gunSayisi === 1) {
      const gunText = GUN_ADLARI[range.minGun] || 'Gün';
      return `${gunText} ${startStr} – ${endStr} (${saatSayisiStr} Saat)`;
    } else {
      let gunText = '';
      if (range.minGun === 0 && range.maxGun === 4) {
        gunText = 'Hafta İçi (Pzt – Cum)';
      } else if (range.minGun === 0 && range.maxGun === 6) {
        gunText = 'Tüm Hafta (Pzt – Paz)';
      } else if (range.minGun === 5 && range.maxGun === 6) {
        gunText = 'Hafta Sonu (Cmt – Paz)';
      } else {
        gunText = `${GUN_ADLARI[range.minGun]} – ${GUN_ADLARI[range.maxGun]}`;
      }
      return `${gunText} ${startStr} – ${endStr} (${gunSayisi} Gün, Günde ${saatSayisiStr} Saat • Toplam ${toplamSaatStr} Saat)`;
    }
  },

  openZamanFaaliyetModal(range, ogrenciId) {
    if (!ogrenciId) {
      const selectEl = document.getElementById('cizelge-ogrenci-select');
      ogrenciId = (selectEl ? selectEl.value : '') || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;
    }
    if (!ogrenciId) {
      this.showToast('Lütfen önce bir öğrenci seçin.');
      return;
    }

    if (!range) {
      range = { minGun: 0, maxGun: 0, minSlot: 6, maxSlot: 7 }; // 09:00 - 10:00
    }
    if (range.minSlot === undefined && range.minSaat !== undefined) {
      range.minSlot = range.minSaat;
    }
    if (range.maxSlot === undefined && range.maxSaat !== undefined) {
      range.maxSlot = range.maxSaat;
    }

    this.currentZamanModalRange = range;
    this.currentZamanModalOgrenciId = ogrenciId;

    const rangeText = this.formatZamanRangeText(range);
    const faaliyetGruplari = typeof ZAMAN_FAALIYETLER !== 'undefined' ? ZAMAN_FAALIYETLER : [];

    const gruplarHtml = faaliyetGruplari.map(grup => `
      <div class="space-y-2 zaman-faaliyet-grup">
        <div class="flex items-center gap-2 text-xs font-bold text-[var(--color-ink)] border-b border-[var(--color-rule)] pb-1 pt-1">
          <i data-lucide="${grup.ikon}" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
          <span>${grup.grupBaslik}</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          ${grup.items.map(item => `
            <div onclick="App.applyZamanFaaliyet('${item.id}')"
              class="zaman-faaliyet-card group p-2.5 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper-1)] hover:bg-[var(--color-paper-2)] hover:border-[var(--color-accent)] hover:shadow-xs cursor-pointer transition-all flex items-start gap-2.5 text-left"
              data-faal-id="${item.id}"
              data-faal-label="${(item.label || '').toLowerCase()}"
              data-faal-aciklama="${(item.aciklama || '').toLowerCase()}"
              style="border-left: 4px solid ${item.renk};"
              title="${item.label} (${item.aciklama})">
              <div class="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5" style="background: ${item.bg}; color: ${item.renk};">
                <i data-lucide="${item.ikon}" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                  ${item.label}
                </div>
                <div class="text-[10px] text-[var(--color-ink-muted)] line-clamp-1 mt-0.5">
                  ${item.aciklama}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const html = `
      <div class="space-y-4">
        <!-- Üst Başlık & Aralık Rozeti -->
        <div class="flex items-start justify-between pb-3 border-b border-[var(--color-rule)] gap-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
                <i data-lucide="calendar" class="w-4 h-4"></i>
              </span>
              <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Zaman Bloğu Faaliyet Seçimi</h3>
            </div>
            <div class="mt-2 flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-accent)] text-white shadow-xs font-mono">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                <span>${rangeText}</span>
              </span>
              <span class="text-[11px] text-[var(--color-ink-muted)]">
                Faaliyete tıklayarak bloğu anında doldurabilirsiniz.
              </span>
            </div>
          </div>
          <button onclick="App.closeZamanFaaliyetModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] p-1.5 rounded-md transition-colors" title="Kapat">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Arama ve Özel Not / Ders Girişi -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
          <!-- Özel Not / Ders Adı -->
          <div class="space-y-1">
            <label class="text-[11px] font-semibold text-[var(--color-ink)] flex items-center gap-1">
              <i data-lucide="file-edit" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
              <span>Özel Not / Ders Adı (İsteğe Bağlı)</span>
            </label>
            <input type="text" id="zaman-faaliyet-not-input" 
              placeholder="Örn: Matematik - Yeni Nesil Soru Bankası, LGS Deneme"
              class="input-instrument w-full text-xs p-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper-1)] text-[var(--color-ink)]" />
          </div>

          <!-- Hızlı Filtreleme -->
          <div class="space-y-1">
            <label class="text-[11px] font-semibold text-[var(--color-ink)] flex items-center gap-1">
              <i data-lucide="search" class="w-3.5 h-3.5 text-[var(--color-ink-muted)]"></i>
              <span>Faaliyetlerde Ara</span>
            </label>
            <input type="text" id="zaman-faaliyet-search-input"
              placeholder="Örn: Deneme, Branş, Paragraf, Tekrar, Mola..."
              oninput="App.filterZamanFaaliyetleri(this.value)"
              class="input-instrument w-full text-xs p-2 rounded-[var(--radius-sm)] border border-[var(--color-rule)] bg-[var(--color-paper-1)] text-[var(--color-ink)]" />
          </div>
        </div>

        <!-- Faaliyet Grupları ve Kartları -->
        <div id="zaman-faaliyet-listesi" class="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          ${gruplarHtml}
        </div>

        <!-- Alt İşlem Çubuğu -->
        <div class="flex items-center justify-between pt-3 border-t border-[var(--color-rule)] gap-2">
          <!-- Bloğu Temizle (Silgi) -->
          <button type="button" onclick="App.applyZamanFaaliyet('silgi')" 
            class="btn-tactile text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors">
            <i data-lucide="eraser" class="w-3.5 h-3.5"></i>
            <span>Bloğu Temizle (Silgi)</span>
          </button>

          <div class="flex items-center gap-2">
            <button type="button" onclick="App.closeZamanFaaliyetModal()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-4">
              Vazgeç
            </button>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('modal-container');
    if (container) {
      container.className = 'bg-[var(--color-paper-2)] border border-[var(--color-rule-strong)] rounded-[var(--radius-lg)] max-w-3xl w-full overflow-hidden shadow-2xl';
    }

    this.openModal(html);

    setTimeout(() => {
      const notInput = document.getElementById('zaman-faaliyet-not-input');
      if (notInput) notInput.focus();
    }, 50);
  },

  closeZamanFaaliyetModal() {
    if (typeof this.clearZamanVisualSelection === 'function') {
      this.clearZamanVisualSelection();
    }
    this.currentZamanModalRange = null;
    this.currentZamanModalOgrenciId = null;

    const container = document.getElementById('modal-container');
    if (container) {
      container.className = 'bg-[var(--color-paper-2)] border border-[var(--color-rule-strong)] rounded-[var(--radius-lg)] max-w-lg w-full overflow-hidden shadow-2xl';
    }
    this.closeModal();
  },

  filterZamanFaaliyetleri(query) {
    const q = (query || '').toLowerCase().trim();
    const cards = document.querySelectorAll('.zaman-faaliyet-card');
    cards.forEach(card => {
      const lbl = card.getAttribute('data-faal-label') || '';
      const ack = card.getAttribute('data-faal-aciklama') || '';
      if (!q || lbl.includes(q) || ack.includes(q)) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });

    document.querySelectorAll('.zaman-faaliyet-grup').forEach(grup => {
      const visibleCard = grup.querySelector('.zaman-faaliyet-card:not([style*="display: none"])');
      grup.style.display = visibleCard ? 'block' : 'none';
    });
  },

  applyZamanFaaliyet(faalId) {
    const range = this.currentZamanModalRange;
    const ogrenciId = this.currentZamanModalOgrenciId || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;

    if (!range || !ogrenciId) {
      this.closeZamanFaaliyetModal();
      return;
    }

    const GUN_KEYS = ['pzt', 'sal', 'car', 'per', 'cum', 'cmt', 'paz'];
    const slots = this.getZamanSlotlari(ogrenciId);

    const minSlot = (range.minSlot !== undefined) ? range.minSlot : (range.minSaat !== undefined ? range.minSaat : 0);
    const maxSlot = (range.maxSlot !== undefined) ? range.maxSlot : (range.maxSaat !== undefined ? range.maxSaat : 0);

    const notInput = document.getElementById('zaman-faaliyet-not-input');
    const notMetni = notInput ? notInput.value.trim() : '';

    const toSave = [];
    const toDelete = [];

    if (faalId === 'silgi') {
      for (let g = range.minGun; g <= range.maxGun; g++) {
        const gunKey = GUN_KEYS[g];
        for (let s = minSlot; s <= maxSlot; s++) {
          const slotKey = slots[s] ? slots[s].slotKey : `${String(s).padStart(2, '0')}:00`;
          toDelete.push({ gun: gunKey, saat: slotKey });
        }
      }
    } else {
      const allActivities = typeof ZAMAN_FAALIYETLER_FLAT !== 'undefined' ? ZAMAN_FAALIYETLER_FLAT : [];
      const catList = typeof ZAMAN_KATEGORILER !== 'undefined' ? ZAMAN_KATEGORILER : [];
      const faal = allActivities.find(f => f.id === faalId) || catList.find(c => c.id === faalId) || {
        id: faalId,
        label: 'Faaliyet',
        renk: '#2563eb',
        bg: '#eff6ff'
      };

      for (let g = range.minGun; g <= range.maxGun; g++) {
        const gunKey = GUN_KEYS[g];
        for (let s = minSlot; s <= maxSlot; s++) {
          const slotKey = slots[s] ? slots[s].slotKey : `${String(s).padStart(2, '0')}:00`;
          toSave.push({
            gun: gunKey,
            saat: slotKey,
            veri: {
              kategori: faal.id,
              label: faal.label,
              renk: faal.renk,
              bg: faal.bg,
              not: notMetni
            }
          });
        }
      }
    }

    if (Store.saveZamanHucresiBatch) {
      Store.saveZamanHucresiBatch(ogrenciId, toSave, toDelete);
    } else {
      toDelete.forEach(({ gun, saat }) => Store.deleteZamanHucresi(ogrenciId, gun, saat));
      toSave.forEach(({ gun, saat, veri }) => Store.saveZamanHucresi(ogrenciId, gun, saat, veri));
    }

    const rangeText = this.formatZamanRangeText(range, ogrenciId);
    this.closeZamanFaaliyetModal();
    this.renderCizelgePreview();

    if (faalId === 'silgi') {
      this.showToast(`${rangeText} aralığı temizlendi.`);
    } else {
      const allActivities = typeof ZAMAN_FAALIYETLER_FLAT !== 'undefined' ? ZAMAN_FAALIYETLER_FLAT : [];
      const faal = allActivities.find(f => f.id === faalId);
      const label = faal ? faal.label : 'Faaliyet';
      this.showToast(`"${label}" ${rangeText} bloğuna uygulandı.`);
    }
  },

  initZamanBlokListeners() {
    const table = document.getElementById('zaman-grid-table');
    if (!table) return;

    const selectEl = document.getElementById('cizelge-ogrenci-select');
    const ogrenciId = (selectEl ? selectEl.value : '') || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;

    const GUN_KEYS = ['pzt', 'sal', 'car', 'per', 'cum', 'cmt', 'paz'];
    const slots = this.getZamanSlotlari(ogrenciId);

    let isSelecting = false;
    let isDeleting = false;
    let startGunIdx = -1;
    let startSlotIdx = -1;
    let currentGunIdx = -1;
    let currentSlotIdx = -1;

    const getSelectedRange = () => {
      if (startGunIdx === -1 || startSlotIdx === -1 || currentGunIdx === -1 || currentSlotIdx === -1) {
        return null;
      }
      return {
        minGun: Math.min(startGunIdx, currentGunIdx),
        maxGun: Math.max(startGunIdx, currentGunIdx),
        minSlot: Math.min(startSlotIdx, currentSlotIdx),
        maxSlot: Math.max(startSlotIdx, currentSlotIdx)
      };
    };

    const clearVisualSelection = () => {
      table.querySelectorAll('.zaman-cell-selecting, .zaman-cell-selecting-delete, .zaman-cell-selected-active').forEach(el => {
        el.classList.remove('zaman-cell-selecting', 'zaman-cell-selecting-delete', 'zaman-cell-selected-active');
        el.style.removeProperty('--zaman-sel-color');
        el.style.removeProperty('--zaman-sel-bg');
      });
    };

    this.clearZamanVisualSelection = clearVisualSelection;

    const highlightActiveRange = (range) => {
      clearVisualSelection();
      if (!range) return;
      table.querySelectorAll('[data-zaman-cell="true"]').forEach(cell => {
        const gun = cell.getAttribute('data-gun');
        const gIdx = GUN_KEYS.indexOf(gun);
        if (gIdx >= range.minGun && gIdx <= range.maxGun) {
          const sStart = parseInt(cell.getAttribute('data-slot-idx'), 10);
          const sEnd = cell.hasAttribute('data-slot-end-idx') ? parseInt(cell.getAttribute('data-slot-end-idx'), 10) : sStart;
          if (sStart <= range.maxSlot && sEnd >= range.minSlot) {
            cell.classList.add('zaman-cell-selected-active');
          }
        }
      });
    };

    const updateVisualSelection = () => {
      clearVisualSelection();
      const range = getSelectedRange();
      if (!range) return;

      table.querySelectorAll('[data-zaman-cell="true"]').forEach(cell => {
        const gun = cell.getAttribute('data-gun');
        const gIdx = GUN_KEYS.indexOf(gun);
        if (gIdx >= range.minGun && gIdx <= range.maxGun) {
          const sStart = parseInt(cell.getAttribute('data-slot-idx'), 10);
          const sEnd = cell.hasAttribute('data-slot-end-idx') ? parseInt(cell.getAttribute('data-slot-end-idx'), 10) : sStart;
          if (sStart <= range.maxSlot && sEnd >= range.minSlot) {
            if (isDeleting) {
              cell.classList.add('zaman-cell-selecting-delete');
            } else {
              cell.classList.add('zaman-cell-selecting');
              cell.style.setProperty('--zaman-sel-color', '#2563eb');
              cell.style.setProperty('--zaman-sel-bg', 'rgba(37, 99, 235, 0.22)');
            }
          }
        }
      });
    };

    const commitDeleteRange = (range) => {
      if (!range || !ogrenciId) return;
      const toDelete = [];
      for (let g = range.minGun; g <= range.maxGun; g++) {
        const gunKey = GUN_KEYS[g];
        for (let s = range.minSlot; s <= range.maxSlot; s++) {
          const slotKey = slots[s] ? slots[s].slotKey : `${String(s).padStart(2, '0')}:00`;
          toDelete.push({ gun: gunKey, saat: slotKey });
        }
      }
      if (Store.saveZamanHucresiBatch) {
        Store.saveZamanHucresiBatch(ogrenciId, [], toDelete);
      } else {
        toDelete.forEach(({ gun, saat }) => Store.deleteZamanHucresi(ogrenciId, gun, saat));
      }
      this.renderCizelgePreview();
      const count = toDelete.length;
      const saatCount = count * 0.5;
      const saatStr = Number.isInteger(saatCount) ? String(saatCount) : saatCount.toFixed(1);
      this.showToast(count > 1 ? `${saatStr} saatlik blok temizlendi.` : 'Zaman hücresi temizlendi.');
    };

    // Sağ Tık Menüsünü Engelle & Hızlı Silme Kolaylığı
    table.oncontextmenu = (e) => {
      e.preventDefault();
      const cell = e.target.closest('[data-zaman-cell="true"]');
      if (cell && ogrenciId) {
        const gun = cell.getAttribute('data-gun');
        const sStart = parseInt(cell.getAttribute('data-slot-idx'), 10);
        const sEnd = cell.hasAttribute('data-slot-end-idx') ? parseInt(cell.getAttribute('data-slot-end-idx'), 10) : sStart;
        if (gun && !isNaN(sStart)) {
          const toDelete = [];
          for (let s = sStart; s <= sEnd; s++) {
            const slotKey = slots[s] ? slots[s].slotKey : `${String(s).padStart(2, '0')}:00`;
            toDelete.push({ gun, saat: slotKey });
          }
          if (Store.saveZamanHucresiBatch) {
            Store.saveZamanHucresiBatch(ogrenciId, [], toDelete);
          } else {
            toDelete.forEach(({ gun: g, saat }) => Store.deleteZamanHucresi(ogrenciId, g, saat));
          }
          this.renderCizelgePreview();
          this.showToast('Zaman hücresi temizlendi.');
        }
      }
    };

    const handleCellHover = (cell) => {
      if (!isSelecting || !cell) return;
      const gun = cell.getAttribute('data-gun');
      const gIdx = GUN_KEYS.indexOf(gun);
      let sIdx = parseInt(cell.getAttribute('data-slot-idx'), 10);
      if (cell.hasAttribute('data-slot-end-idx')) {
        const sEnd = parseInt(cell.getAttribute('data-slot-end-idx'), 10);
        if (sIdx >= startSlotIdx) {
          sIdx = sEnd;
        }
      }
      if (gIdx !== -1 && !isNaN(sIdx)) {
        if (gIdx !== currentGunIdx || sIdx !== currentSlotIdx) {
          currentGunIdx = gIdx;
          currentSlotIdx = sIdx;
          updateVisualSelection();
        }
      }
    };

    const finishSelection = () => {
      if (!isSelecting) return;
      const range = getSelectedRange();
      removeWindowListeners();
      isSelecting = false;

      if (!range || !ogrenciId) {
        clearVisualSelection();
        return;
      }

      if (isDeleting) {
        commitDeleteRange(range);
        clearVisualSelection();
      } else {
        // Sol tık ile seçim tamamlandı -> Seçili alanı vurgula ve Modal aç!
        highlightActiveRange(range);
        this.openZamanFaaliyetModal(range, ogrenciId);
      }
    };

    table.onpointerover = (e) => {
      if (!isSelecting) return;
      if ((e.buttons & 1) !== 1 && (e.buttons & 2) !== 2) {
        finishSelection();
        return;
      }
      const cell = e.target.closest('[data-zaman-cell="true"]');
      if (cell) {
        handleCellHover(cell);
      }
    };

    const onPointerMove = (e) => {
      if (!isSelecting) return;
      if ((e.buttons & 1) !== 1 && (e.buttons & 2) !== 2) {
        finishSelection();
        return;
      }
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const cell = target ? target.closest('[data-zaman-cell="true"]') : null;
      if (cell) {
        handleCellHover(cell);
      }
    };

    const onPointerUp = () => {
      finishSelection();
    };

    const onPointerCancel = () => {
      if (!isSelecting) return;
      clearVisualSelection();
      isSelecting = false;
      removeWindowListeners();
    };

    const addWindowListeners = () => {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      window.addEventListener('pointercancel', onPointerCancel, { passive: true });
      window.addEventListener('blur', onPointerCancel, { passive: true });
    };

    const removeWindowListeners = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('blur', onPointerCancel);
    };

    // Başlangıç: Tıklama ile Seçim Başlatma
    table.onpointerdown = (e) => {
      if (e.button !== 0 && e.button !== 2) return;

      const cell = e.target.closest('[data-zaman-cell="true"]');
      if (!cell || !ogrenciId) return;

      e.preventDefault();

      isSelecting = true;
      isDeleting = (e.button === 2);

      const gun = cell.getAttribute('data-gun');
      startGunIdx = GUN_KEYS.indexOf(gun);
      startSlotIdx = parseInt(cell.getAttribute('data-slot-idx'), 10);
      currentGunIdx = startGunIdx;
      currentSlotIdx = startSlotIdx;

      updateVisualSelection();
      addWindowListeners();
    };
  },

  // Raporu Chrome (headless) ile PDF olarak üretir; olmazsa yazdırma penceresine düşer
  async yazdirPdf(html, baslik, yatay = false) {
    const fallback = () => {
      if (typeof PrintEngine !== 'undefined' && PrintEngine.yazdir) PrintEngine.yazdir(html, { yatay, baslik });
      else window.print();
    };
    try {
      const stiller = Array.from(document.querySelectorAll('style')).map(el => el.textContent || '').join('\n');
      const baglantilar = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(el => el.href).filter(Boolean).map(h => `<link rel="stylesheet" href="${h}">`).join('');
      const tamBelge = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${baslik}</title>
${baglantilar}
<style>${stiller}
@page { size: A4 ${yatay ? 'landscape' : 'portrait'}; margin: ${yatay ? '6mm 8mm' : '7mm 9mm'}; }
html, body { margin: 0; padding: 0; background: #ffffff; }
.text-slate-900 { color: #0f172a; }
.bg-white { background: #ffffff; }
.font-sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.leading-normal { line-height: 1.5; }
</style></head><body><div id="print-area">${html}</div></body></html>`;

      const res = await fetch('http://127.0.0.1:38888/api/print/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: tamBelge, baslik, yatay })
      });
      const j = await res.json();
      if (j && j.success) {
        this.showToast('PDF hazırlandı: ' + String(j.path || '').split('/').pop());
        return true;
      }
      this.showToast('PDF üretilemedi — yazdırma penceresi açılıyor.');
      fallback();
      return false;
    } catch (_) {
      this.showToast('PDF üretilemedi — yazdırma penceresi açılıyor.');
      fallback();
      return false;
    }
  },

  printCizelge() {
    if (this._isPrintingCizelge) return;
    this._isPrintingCizelge = true;
    setTimeout(() => { this._isPrintingCizelge = false; }, 2000);

    const selectEl = document.getElementById('cizelge-ogrenci-select');
    const ogrenciId = (selectEl ? selectEl.value : '') || this.cizelgeOgrenciId || Store.data.aktifOgrenciId;
    const ogr = Store.getOgrenci(ogrenciId);

    const printOgr = ogr || {
      id: '',
      ad: 'Öğrenci',
      soyad: 'Adı',
      adSoyad: '........................................',
      sinif: '.....',
      modulId: 'lgs',
      hedefSoru: ''
    };

    let html = '';
    let yatay = true;
    switch (this.cizelgeAktifSablon) {
      case 'odev-takip': {
        const pages = this.renderCizelgeOdevTakipPages(printOgr, { isPrint: true });
        html = pages.join('');
        yatay = false;
        break;
      }
      case 'konu-takip': {
        const pages = this.renderCizelgeKonuTakipPages(printOgr, { isPrint: true });
        html = pages.join('');
        yatay = false;
        break;
      }
      case 'konu-soru':
        html = this.renderCizelgeKonuSoruHTML(printOgr, { isPrint: true });
        yatay = true;
        break;
      case 'zaman-blok':
        html = this.renderCizelgeZamanBlokHTML(printOgr, { isPrint: true });
        yatay = true;
        break;
      case 'aliskanlik':
        html = this.renderCizelgeAliskanlikHTML(printOgr, { isPrint: true });
        yatay = true;
        break;
      default: {
        html = this.renderCizelgeZamanBlokHTML(printOgr, { isPrint: true });
        yatay = true;
        break;
      }
    }

    const safeName = ogr ? `${ogr.ad}_${ogr.soyad}`.replace(/\s+/g, '_') : 'Sablon';
    const baslik = `Cizelge_${this.cizelgeAktifSablon}_${safeName}`;

    this.showToast('Rapor hazırlanıyor...');
    this.yazdirPdf(html, baslik, yatay);
  },

  renderCizelgeRobotu() {
    const container = document.getElementById('view-cizelge-robotu');
    if (!container) return;

    const allStudents = Store.getOgrenciler();
    if (Store.data.aktifOgrenciId && (!this.cizelgeOgrenciId || !allStudents.some(s => s.id === this.cizelgeOgrenciId))) {
      this.cizelgeOgrenciId = Store.data.aktifOgrenciId;
    } else if (!this.cizelgeOgrenciId && allStudents.length > 0) {
      this.cizelgeOgrenciId = allStudents[0].id;
    }

    const ogr = this.cizelgeOgrenciId ? Store.getOgrenci(this.cizelgeOgrenciId) : null;
    const sablon = this.cizelgeAktifSablon || 'zaman-blok';
    const dersler = ogr ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();

    if (!this.cizelgeDersId && dersler.length > 0) {
      this.cizelgeDersId = dersler[0].id;
    }

    const ksMonthInfo = this.getKonuSoruMonthInfo(this.cizelgeKonuSoruAyOffset);
    const zamanWeekInfo = this.getZamanWeekInfo(this.zamanHaftaOffset);
    const aliskanlikMonthInfo = this.getAliskanlikMonthInfo(this.aliskanlikAyOffset);
    const tumRutinler = typeof ZAMAN_RUTINLER !== 'undefined' ? ZAMAN_RUTINLER : [];
    const filtreliRutinler = tumRutinler.filter(r => !ogr || !ogr.modulId || (r.modulId || r.modul) === ogr.modulId);

    const zamanAyarlari = Store.getZamanAyarlari ? Store.getZamanAyarlari(ogr ? ogr.id : '') : { baslangicSaat: '06:00', bitisSaat: '24:00' };
    const zamanSlotAdaylari = this.getZamanSlotlari(ogr ? ogr.id : '');
    const aktifSaatSayisi = (zamanSlotAdaylari.length * 0.5);
    const aktifSaatSayisiStr = Number.isInteger(aktifSaatSayisi) ? String(aktifSaatSayisi) : aktifSaatSayisi.toFixed(1);

    const baslangicSaatListesi = [
      '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '15:00', '16:00'
    ];
    const bitisSaatListesi = [
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '18:30',
      '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '24:00'
    ];

    const html = `
      <div class="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        <!-- BÖLÜM 1: ARAÇ ÇUBUĞU -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--color-rule)]">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-bold font-display text-[var(--color-ink)]">Çizelge Robotu</h1>
              <span class="meta-pill">A4 Şablon Motoru • MCP Bağlı</span>
            </div>
            <p class="text-xs text-[var(--color-ink-muted)] mt-1">Öğrenciye özel kişiselleştirilmiş A4 çalışma planları, zaman bloklama ve konu takip çıktıları hazırlayın.</p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            ${ogr ? `
              <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs font-medium text-[var(--color-ink)]">
                <i data-lucide="user-check" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                <span>${this.escapeHtml(ogr.adSoyad)}</span>
                ${ogr.sinif ? `<span class="text-[var(--color-ink-muted)]">(${ogr.sinif}. Sınıf)</span>` : ''}
              </span>
            ` : ''}

            <!-- AI MCP Çizelge Komutu -->
            <button type="button" onclick="App.copyCizelgeMcpPrompt()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5" title="Bu çizelgeyi yapay zeka asistanına (MCP) analiz ettirmek veya doldurtmak için hazır komutu kopyalar">
              <i data-lucide="sparkles" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>AI Çizelge Komutu</span>
            </button>

            <!-- Yazdır Butonu -->
            <button onclick="App.printCizelge()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-4 inline-flex items-center gap-2 shadow-sm">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Yazdır (A4)</span>
            </button>
          </div>
        </div>

        <!-- BÖLÜM 2: ŞABLON SEÇİCİ KARTLARI (5 ŞABLON) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          <!-- Şablon 1: Zaman Bloklama -->
          <div onclick="App.setCizelgeSablon('zaman-blok')" class="p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'zaman-blok' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] ${sablon === 'zaman-blok' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="clock" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-xs text-[var(--color-ink)]">Zaman Bloklama</h3>
                  <span class="meta-pill text-[var(--color-accent)] text-[9px] mt-0.5 font-medium">A4 Yatay ↔</span>
                </div>
              </div>
              ${sablon === 'zaman-blok' ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[10.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">Haftalık ders, soru ve mola saatlerini boyayın.</p>
          </div>

          <!-- Şablon 2: Ödev Takip Çizelgesi -->
          <div onclick="App.setCizelgeSablon('odev-takip')" class="p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'odev-takip' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] ${sablon === 'odev-takip' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="clipboard-list" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-xs text-[var(--color-ink)]">Ödev Takip</h3>
                  <span class="meta-pill text-emerald-600 text-[9px] mt-0.5 font-medium">A4 Dikey ↕</span>
                </div>
              </div>
              ${sablon === 'odev-takip' ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[10.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">Ödevler, kaynaklar ve hedef soru kontrol listesi.</p>
          </div>

          <!-- Şablon 3: Konu Takip Tablosu -->
          <div onclick="App.setCizelgeSablon('konu-takip')" class="p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'konu-takip' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] ${sablon === 'konu-takip' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="table" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-xs text-[var(--color-ink)]">Konu Takip</h3>
                  <span class="meta-pill text-emerald-600 text-[9px] mt-0.5 font-medium">A4 Dikey ↕</span>
                </div>
              </div>
              ${sablon === 'konu-takip' ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[10.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">İşlendi, tekrar, test ve koç notu takip tablosu.</p>
          </div>

          <!-- Şablon 4: Konu & Soru Çizelgesi -->
          <div onclick="App.setCizelgeSablon('konu-soru')" class="p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'konu-soru' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] ${sablon === 'konu-soru' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-xs text-[var(--color-ink)]">Konu & Soru</h3>
                  <span class="meta-pill text-[var(--color-accent)] text-[9px] mt-0.5 font-medium">A4 Yatay ↔</span>
                </div>
              </div>
              ${sablon === 'konu-soru' ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[10.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">D/Y/B/S aylık tur bazlı soru kontrol matrisi.</p>
          </div>

          <!-- Şablon 5: Alışkanlık Zinciri -->
          <div onclick="App.setCizelgeSablon('aliskanlik')" class="p-3.5 rounded-[var(--radius-md)] border transition-all cursor-pointer ${sablon === 'aliskanlik' ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-sm' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-[var(--radius-sm)] ${sablon === 'aliskanlik' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center">
                  <i data-lucide="check-circle" class="w-4 h-4"></i>
                </div>
                <div>
                  <h3 class="font-display font-bold text-xs text-[var(--color-ink)]">Alışkanlık Zinciri</h3>
                  <span class="meta-pill text-[var(--color-accent)] text-[9px] mt-0.5 font-medium">A4 Yatay ↔</span>
                </div>
              </div>
              ${sablon === 'aliskanlik' ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>' : ''}
            </div>
            <p class="text-[10.5px] text-[var(--color-ink-muted)] mt-2 leading-relaxed">31 günlük zinciri kırma ve hedef takip tablosu.</p>
          </div>
        </div>

        <!-- ŞABLON AYARLARI KONTROL BARI -->
        <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="font-medium text-[var(--color-ink)]">Şablon Ayarları:</span>

            ${sablon === 'odev-takip' ? `
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-faint)]">Şablon Modu:</span>
                <select onchange="App.setCizelgeOdevModu(this.value)" class="select-instrument text-xs py-1 px-2.5 font-medium">
                  <option value="dolu" ${this.cizelgeOdevModu !== 'bos' ? 'selected' : ''}>Dolu Şablon (Ödevlerle)</option>
                  <option value="bos" ${this.cizelgeOdevModu === 'bos' ? 'selected' : ''}>Boş Şablon (Elle Doldurulabilir)</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-faint)]">Zaman Kapsamı:</span>
                <select onchange="App.setCizelgeZamanKapsami(this.value)" class="select-instrument text-xs py-1 px-2.5 font-medium">
                  <option value="hafta" ${this.cizelgeZamanKapsami !== 'tum' ? 'selected' : ''}>Bu Hafta</option>
                  <option value="tum" ${this.cizelgeZamanKapsami === 'tum' ? 'selected' : ''}>Tüm Aktif Ödevler</option>
                </select>
              </div>
            ` : ''}

            ${sablon === 'konu-takip' ? `
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-faint)]">Ders Seçimi:</span>
                <select id="cizelge-ders-select" onchange="App.onCizelgeDersChange(this.value)" class="select-instrument text-xs py-1 px-2.5">
                  ${dersler.length === 0
                    ? '<option value="" disabled selected>Bu öğrenci için ders yok — Müfredat\'tan ekleyin</option>'
                    : dersler.map(d => `
                    <option value="${d.id}" ${String(d.id) === String(this.cizelgeDersId) ? 'selected' : ''}>${d.ad}</option>
                  `).join('')}
                </select>
              </div>

              <label class="flex items-center gap-2 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] ml-2">
                <input type="checkbox" ${this.cizelgeKonuBosMod ? 'checked' : ''} onchange="App.toggleCizelgeKonuBosMod()" class="rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-0">
                <span>Boş Şablon Olarak Hazırla</span>
              </label>
            ` : ''}

            ${sablon === 'konu-soru' ? `
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-faint)]">Ders:</span>
                <select id="cizelge-konu-soru-ders-select" onchange="App.onKonuSoruDersChange(this.value)" class="select-instrument text-xs py-1 px-2.5">
                  ${dersler.length === 0
                    ? '<option value="" disabled selected>Bu öğrenci için ders yok — Müfredat\'tan ekleyin</option>'
                    : dersler.map(d => `
                    <option value="${d.id}" ${String(d.id) === String(this.cizelgeKonuSoruDersId || this.cizelgeDersId) ? 'selected' : ''}>${d.ad}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Tur Sayısı Seçici (Varsayılan: 5 Tur) -->
              <div class="flex items-center gap-2">
                <span class="text-[var(--color-ink-faint)]">Tur:</span>
                <select id="cizelge-konu-soru-tur-select" onchange="App.onKonuSoruTurChange(this.value)" class="select-instrument text-xs py-1 px-2.5 font-medium">
                  ${Array.from({ length: 10 }, (_, i) => i + 1).map(n => `
                    <option value="${n}" ${(this.konuSoruTurSayisi || 5) === n ? 'selected' : ''}>${n} Tur</option>
                  `).join('')}
                </select>
              </div>

              <!-- Ay Seçici -->
              <div class="flex items-center gap-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-xs)] px-2 py-0.5">
                <button onclick="App.changeKonuSoruAy(-1)" class="p-1 hover:text-[var(--color-accent)] transition-colors"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>
                <span class="font-semibold font-mono text-[var(--color-ink)] text-xs px-1">${ksMonthInfo.ayAdi} ${ksMonthInfo.yil}</span>
                <button onclick="App.changeKonuSoruAy(1)" class="p-1 hover:text-[var(--color-accent)] transition-colors"><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>
              </div>

              <!-- Boş Form / Şablon Onay Kutusu -->
              <label class="flex items-center gap-1.5 cursor-pointer text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] text-xs ml-1">
                <input type="checkbox" ${this.cizelgeKonuSoruBosMod ? 'checked' : ''} onchange="App.toggleKonuSoruBosMod()" class="rounded border-[var(--color-rule)] text-[var(--color-accent)] focus:ring-0">
                <span>Boş Şablon Olarak Hazırla</span>
              </label>
            ` : ''}

            ${sablon === 'zaman-blok' ? `
              <!-- Hafta Seçici -->
              <div class="flex items-center gap-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-xs)] px-2 py-0.5">
                <button onclick="App.changeZamanHafta(-1)" class="p-1 hover:text-[var(--color-accent)] transition-colors"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>
                <span class="font-semibold font-mono text-[var(--color-ink)] text-xs px-1">${zamanWeekInfo.rangeStr}</span>
                <button onclick="App.changeZamanHafta(1)" class="p-1 hover:text-[var(--color-accent)] transition-colors"><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>
              </div>

              <!-- Başlangıç - Bitiş Saat Aralığı Seçici -->
              <div class="flex items-center gap-1.5 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-xs)] px-2.5 py-1" title="Tabloda görüntülenecek günlük saat penceresi">
                <i data-lucide="clock" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                <span class="text-[var(--color-ink-muted)] text-[11px] font-medium">Saat:</span>
                <select id="zaman-baslangic-saat" onchange="App.onZamanAralikChange('${ogr ? ogr.id : ''}', this.value, document.getElementById('zaman-bitis-saat').value)" class="select-instrument text-[11px] py-0.5 px-1 font-mono font-semibold" title="Günün Başlangıç Saati">
                  ${baslangicSaatListesi.map(t => `<option value="${t}" ${t === zamanAyarlari.baslangicSaat ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
                <span class="text-[var(--color-ink-faint)] text-[11px] font-bold">–</span>
                <select id="zaman-bitis-saat" onchange="App.onZamanAralikChange('${ogr ? ogr.id : ''}', document.getElementById('zaman-baslangic-saat').value, this.value)" class="select-instrument text-[11px] py-0.5 px-1 font-mono font-semibold" title="Günün Bitiş Saati">
                  ${bitisSaatListesi.map(t => `<option value="${t}" ${t === zamanAyarlari.bitisSaat ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
                <span class="text-[10px] text-[var(--color-ink-faint)] font-mono ml-0.5">(${aktifSaatSayisiStr} Sa)</span>
              </div>

              <!-- Örnek Rutin Dropdown Butonu -->
              <div class="relative" id="zaman-rutin-dropdown-wrap">
                <button type="button" onclick="App.toggleZamanRutinDropdown(event)" class="btn-tactile btn-tactile-secondary text-xs py-1 px-2.5 flex items-center gap-1.5 font-medium">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
                  <span>Örnek Rutin</span>
                  <i data-lucide="chevron-down" class="w-3 h-3 text-[var(--color-ink-muted)]"></i>
                </button>
                ${this.zamanRutinDropdownAcik ? `
                  <div class="absolute left-0 mt-1 w-64 bg-[var(--color-paper-2)] border border-[var(--color-rule)] rounded-[var(--radius-md)] shadow-lg z-50 py-1 text-xs">
                    <div class="px-3 py-1 font-semibold text-[10px] tracking-wider uppercase text-[var(--color-ink-faint)] border-b border-[var(--color-rule)] mb-1">
                      ${ogr && ogr.modulId ? (ogr.modulId === 'lgs' ? 'LGS Hazırlık Rutinleri' : ogr.modulId === 'yks' ? 'YKS Hazırlık Rutinleri' : 'Ara Sınıf Rutinleri') : 'Hazır Örnek Rutinler'}
                    </div>
                    ${filtreliRutinler.length === 0 ? `
                      <div class="px-3 py-2 text-[var(--color-ink-muted)] italic">Kayıtlı rutin bulunamadı</div>
                    ` : filtreliRutinler.map(r => `
                      <button type="button" onclick="App.zamanBlokaOrnekRutinUygula('${ogr ? ogr.id : ''}', '${r.id}')" class="w-full text-left px-3 py-2 hover:bg-[var(--color-paper-3)] flex flex-col transition-colors">
                        <span class="font-medium text-[var(--color-ink)]">${r.ad}</span>
                        <span class="text-[10px] text-[var(--color-ink-muted)] leading-tight mt-0.5">${r.aciklama}</span>
                      </button>
                    `).join('')}
                    <div class="border-t border-[var(--color-rule)] mt-1 pt-1">
                      <div class="px-3 py-1.5 flex items-center justify-between text-[var(--color-ink-faint)] opacity-60 cursor-not-allowed">
                        <span>Özelleştir...</span>
                        <span class="text-[9px] uppercase tracking-wider bg-[var(--color-paper-4)] px-1.5 py-0.5 rounded font-mono">Yakında</span>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>

              <button onclick="App.clearZamanPlani()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 text-rose-600 hover:bg-rose-50 flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Tüm Haftayı Temizle</span>
              </button>
            ` : ''}

            ${sablon === 'aliskanlik' ? `
              <!-- Ay Seçici -->
              <div class="flex items-center gap-1 bg-[var(--color-paper-3)] border border-[var(--color-rule)] rounded-[var(--radius-xs)] px-2 py-0.5">
                <button onclick="App.changeAliskanlikAy(-1)" class="p-1 hover:text-[var(--color-accent)] transition-colors"><i data-lucide="chevron-left" class="w-3.5 h-3.5"></i></button>
                <span class="font-semibold font-mono text-[var(--color-ink)] text-xs px-1">${aliskanlikMonthInfo.ayAdi} ${aliskanlikMonthInfo.yil}</span>
                <button onclick="App.changeAliskanlikAy(1)" class="p-1 hover:text-[var(--color-accent)] transition-colors"><i data-lucide="chevron-right" class="w-3.5 h-3.5"></i></button>
              </div>

              <button onclick="App.openAliskanlikDuzenleModal('${ogr ? ogr.id : ''}')" class="btn-tactile btn-tactile-secondary text-xs py-1 px-2.5 flex items-center gap-1">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                <span>Alışkanlıkları Düzenle</span>
              </button>

              <button onclick="App.resetAliskanliklarToDefault('${ogr ? ogr.id : ''}')" class="btn-tactile btn-tactile-ghost text-xs py-1 px-2.5 flex items-center gap-1">
                <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
                <span>Varsayılana Döndür</span>
              </button>
            ` : ''}
          </div>

          <div class="text-[11px] text-[var(--color-ink-faint)] font-mono">
            ${['konu-soru', 'zaman-blok', 'aliskanlik'].includes(sablon) ? 'Yatay Sayfa Düzeni (A4 Landscape)' : 'Dikey Sayfa Düzeni (A4 Portrait)'}
          </div>
        </div>

        <!-- ZAMAN BLOKLAMA İÇİN MODERN FAALİYET KÜTÜPHANESİ & KULLANIM ÇUBUĞU -->
        ${sablon === 'zaman-blok' ? `
          <div class="flex items-center justify-between gap-3 flex-wrap p-3 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] text-xs">
            <div class="flex items-center gap-2.5">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)] shrink-0">
                <i data-lucide="sparkles" class="w-4 h-4"></i>
              </span>
              <div>
                <span class="font-bold text-[var(--color-ink)] block">Zaman Bloklama Etkileşimi:</span>
                <span class="text-[11px] text-[var(--color-ink-muted)]">
                  Tabloda istediğiniz gün ve saat aralığını <strong>fareyle basılı tutup sürükleyin</strong>; açılan kütüphaneden faaliyeti tek tıkla atayın.
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)] ml-auto">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] font-medium">
                <i data-lucide="mouse-pointer" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i> Sol Tık & Sürükle: Faaliyet Seç
              </span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] font-medium">
                <i data-lucide="eraser" class="w-3.5 h-3.5 text-rose-500"></i> Sağ Tık: Hızlı Sil
              </span>
              <button onclick="App.openZamanFaaliyetModal(null, '${ogr ? ogr.id : ''}')" class="btn-tactile btn-tactile-secondary text-xs py-1 px-3 flex items-center gap-1.5">
                <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
                <span>Faaliyet Kütüphanesi</span>
              </button>
              <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--color-paper-3)] border border-[var(--color-rule)] font-medium cursor-pointer" title="A4 raporunda Cumartesi/Pazar planını ayrı bölüm olarak ekle">
                <input type="checkbox" ${this.cizelgeZamanHaftaSonuRapor ? 'checked' : ''} onchange="App.setZamanHaftaSonuRapor(this.checked)" class="rounded border-[var(--color-rule)]">
                <span>Rapora hafta sonunu ekle</span>
              </label>
            </div>
          </div>
        ` : ''}

        <!-- BÖLÜM 3: ÖNİZLEME ALANI -->
        <div class="overflow-x-auto pb-8 pt-2">
          <!-- Çok Sayfalı Belge Gezinme Çubuğu -->
          <div id="cizelge-pagination-bar" class="hidden"></div>
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

    const isLandscape = ['konu-soru', 'zaman-blok', 'aliskanlik'].includes(this.cizelgeAktifSablon);
    previewContainer.className = isLandscape
      ? 'w-full max-w-[1240px] mx-auto transition-all'
      : 'w-full max-w-[850px] mx-auto transition-all';

    const displayOgr = ogr || {
      id: '',
      ad: 'Öğrenci',
      soyad: 'Adı',
      adSoyad: '........................................',
      sinif: '.....',
      modulId: 'lgs',
      hedefSoru: ''
    };

    let pages = [];
    switch (this.cizelgeAktifSablon) {
      case 'odev-takip':
        pages = this.renderCizelgeOdevTakipPages(displayOgr, { isPrint: false });
        break;
      case 'konu-takip':
        pages = this.renderCizelgeKonuTakipPages(displayOgr, { isPrint: false });
        break;
      case 'konu-soru':
        pages = [this.renderCizelgeKonuSoruHTML(displayOgr, { isPrint: false })];
        break;
      case 'zaman-blok':
        pages = [this.renderCizelgeZamanBlokHTML(displayOgr, { isPrint: false })];
        break;
      case 'aliskanlik':
        pages = [this.renderCizelgeAliskanlikHTML(displayOgr, { isPrint: false })];
        break;
      default:
        pages = [this.renderCizelgeZamanBlokHTML(displayOgr, { isPrint: false })];
        break;
    }

    this.cizelgeToplamSayfa = Math.max(1, pages.length);
    if (this.cizelgeAktifSayfa > this.cizelgeToplamSayfa) {
      this.cizelgeAktifSayfa = 1;
    }
    if (this.cizelgeAktifSayfa < 1) {
      this.cizelgeAktifSayfa = 1;
    }

    this.renderCizelgePaginationBar(isLandscape);

    const html = pages[this.cizelgeAktifSayfa - 1] || pages[0] || '';

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

    if (this.cizelgeAktifSablon === 'zaman-blok') {
      this.initZamanBlokListeners();
    }

    if (window.lucide) lucide.createIcons();
  },

  renderCizelgeOdevTakipPages(ogr, { isPrint = false } = {}) {
    const koc = Store.getKocProfili() || {};
    const modul = ogr ? (typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null) : null;
    const isBos = this.cizelgeOdevModu === 'bos';
    const isHafta = this.cizelgeZamanKapsami === 'hafta';

    let tarihLabel = '';
    if (isBos) {
      tarihLabel = 'SERBEST ÇALIŞMA / BOŞ ŞABLON';
    } else if (isHafta) {
      tarihLabel = this.getThisWeekDateRangeStr();
    } else {
      tarihLabel = 'TÜM ÖDEV & GÖREV LİSTESİ';
    }

    let gorevler = [];
    if (!isBos && ogr) {
      const allTasks = Store.getGorevler(ogr.id);
      if (isHafta) {
        const weekInfo = this.getZamanWeekInfo(0);
        const mon = new Date(weekInfo.monday.getFullYear(), weekInfo.monday.getMonth(), weekInfo.monday.getDate(), 0, 0, 0);
        const sun = new Date(weekInfo.sunday.getFullYear(), weekInfo.sunday.getMonth(), weekInfo.sunday.getDate(), 23, 59, 59);

        gorevler = allTasks.filter(g => {
          if (!g.deadline) return g.durum !== 'tamamlandi';
          const d = new Date(g.deadline);
          return (d >= mon && d <= sun) || g.durum === 'gecikti' || g.durum === 'bekliyor';
        });
        if (gorevler.length === 0 && allTasks.length > 0) {
          gorevler = allTasks.slice(0, 15);
        }
      } else {
        const aktif = allTasks.filter(g => g.durum !== 'tamamlandi' || g.durum === 'gecikti');
        gorevler = aktif.length > 0 ? aktif : allTasks;
      }
    }

    // Sayfalara bölme mantığı
    let chunks = [];
    if (isBos) {
      chunks = [[]]; // Boş şablon: 1 sayfa
    } else if (gorevler.length <= 15) {
      chunks = [gorevler];
    } else {
      const list = [...gorevler];
      // Sayfa 1: 16 ödev (tam başlık, kapanış bloğu yok)
      chunks.push(list.splice(0, 16));
      while (list.length > 0) {
        if (list.length <= 14) {
          chunks.push(list.splice(0, list.length));
          break;
        } else {
          chunks.push(list.splice(0, 16));
        }
      }
    }

    const toplamSayfa = chunks.length;

    return chunks.map((chunk, pageIdx) => {
      const sayfaNo = pageIdx + 1;
      const isFirstPage = (sayfaNo === 1);
      const isLastPage = (sayfaNo === toplamSayfa);

      const targetRows = toplamSayfa === 1 ? 15 : (isLastPage ? 13 : 16);
      const padCount = isBos ? 15 : Math.max(0, targetRows - chunk.length);
      const totalRowsOnPage = chunk.length + padCount;
      const rowHeight = Math.max(32, Math.min(42, Math.floor((isLastPage ? 560 : 660) / Math.max(1, totalRowsOnPage))));

      let startIndex = 0;
      for (let p = 0; p < pageIdx; p++) {
        startIndex += chunks[p].length;
      }

      const rowsHtml = chunk.map((g, idx) => {
        const rowNo = startIndex + idx + 1;
        const ders = Store.getDers(g.dersId);
        const kaynak = g.kaynakId ? Store.getKaynak(g.kaynakId) : null;
        const teslimStr = g.deadline ? new Date(g.deadline).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—';
        const isDone = g.durum === 'tamamlandi';
        return `
          <tr style="height: ${rowHeight}px; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #475569; font-weight: 700; font-size: 11px;">${rowNo}</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a; font-size: 11.5px;">${ders ? ders.ad : 'Genel'}</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1; color: #1e293b; font-size: 11.5px; font-weight: 500;">${g.baslik}</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1; color: #475569; font-size: 11px;">${kaynak ? `${kaynak.yayinevi || ''} ${kaynak.ad || ''}`.trim() : '—'}</td>
            <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #0f172a; font-size: 11.5px; font-family: monospace;">${g.hedefSoru ? `${g.hedefSoru}` : '—'}</td>
            <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-size: 11px; color: ${g.durum === 'gecikti' ? '#dc2626' : '#475569'};">${teslimStr}</td>
            <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid ${isDone ? '#16a34a' : '#94a3b8'}; background: ${isDone ? '#dcfce7' : 'transparent'}; color: #15803d; font-weight: 800; font-size: 12px; line-height: 15px; border-radius: 3px; vertical-align: middle;">${isDone ? '✓' : ''}</span>
            </td>
          </tr>
        `;
      }).join('');

      const emptyRowsHtml = Array.from({ length: padCount }).map((_, i) => {
        const rowNo = isBos ? (i + 1) : (startIndex + chunk.length + i + 1);
        const idx = chunk.length + i;
        return `
          <tr style="height: ${rowHeight}px; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #94a3b8; font-size: 11px;">${rowNo}</td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;"></td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;"></td>
            <td style="padding: 4px 8px; border: 1px solid #cbd5e1;"></td>
            <td style="padding: 4px 6px; border: 1px solid #cbd5e1;"></td>
            <td style="padding: 4px 6px; border: 1px solid #cbd5e1;"></td>
            <td style="padding: 4px 6px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="display: inline-block; width: 18px; height: 18px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span>
            </td>
          </tr>
        `;
      }).join('');

      return `
        <div class="print-page-dikey print-single-page ${isPrint && !isLastPage ? 'print-page-break' : ''}" style="display: flex; flex-direction: column; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; box-sizing: border-box; width: 100%; padding: ${isPrint ? '5mm 7mm' : '8mm 10mm'};">
          <div>
            ${isFirstPage ? `
              <!-- Üst Başlık Bandı (Sayfa 1 - Tam Başlık) -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px;">
                <div style="text-align: left;">
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${koc.ad || 'Eğitim'} ${koc.soyad || 'Koçu'}</div>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">${koc.unvan || 'Eğitim Koçu'} • ${koc.kurum || 'Plantrack Koçluk'}</div>
                </div>

                <div style="text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <h1 style="font-size: 17px; font-weight: 800; letter-spacing: 1.5px; margin: 0; color: #0f172a; text-transform: uppercase;">ÖDEV TAKİP ÇİZELGESİ</h1>
                    ${isBos ? `
                      <span style="font-size: 9px; font-weight: 700; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 1px 5px; border-radius: 3px;">BOŞ ŞABLON</span>
                    ` : ''}
                  </div>
                  <div style="font-size: 11px; color: #475569; margin-top: 3px; font-family: monospace;">${tarihLabel}</div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci</div>
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${ogr ? (ogr.adSoyad || `${ogr.ad || ''} ${ogr.soyad || ''}`) : '—'}</div>
                  <div style="font-size: 10px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} ${modul ? `• ${modul.ad}` : ''}</div>
                </div>
              </div>
            ` : `
              <!-- Devam Başlığı Bandı (Sayfa 2+ - Kompakt Başlık) -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
                  ${koc.ad || 'Eğitim'} ${koc.soyad || 'Koçu'} <span style="font-weight: 400; color: #64748b;">• ${koc.kurum || 'Plantrack'}</span>
                </div>

                <div style="font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #0f172a; text-transform: uppercase;">
                  ÖDEV TAKİP ÇİZELGESİ <span style="font-size: 10px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 3px; vertical-align: middle;">DEVAM</span>
                </div>

                <div style="font-size: 11px; font-weight: 700; color: #0f172a;">
                  ${ogr ? (ogr.adSoyad || `${ogr.ad || ''} ${ogr.soyad || ''}`) : '—'} <span style="font-weight: 400; color: #64748b;">(${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''})</span>
                </div>
              </div>
            `}

            <!-- Ödev Tablosu -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px;">
              <thead>
                <tr style="background: #1e293b; color: #ffffff; border-bottom: 2px solid #0f172a;">
                  <th style="width: 32px; padding: 7px 4px; border: 1px solid #334155; text-align: center; font-weight: 700;">#</th>
                  <th style="width: 105px; padding: 7px 8px; border: 1px solid #334155; text-align: left; font-weight: 700;">Ders</th>
                  <th style="padding: 7px 8px; border: 1px solid #334155; text-align: left; font-weight: 700;">Konu / Görev Tanımı</th>
                  <th style="width: 130px; padding: 7px 8px; border: 1px solid #334155; text-align: left; font-weight: 700;">Kaynak / Yayın</th>
                  <th style="width: 75px; padding: 7px 6px; border: 1px solid #334155; text-align: center; font-weight: 700;">Hedef Soru</th>
                  <th style="width: 80px; padding: 7px 6px; border: 1px solid #334155; text-align: center; font-weight: 700;">Teslim</th>
                  <th style="width: 80px; padding: 7px 6px; border: 1px solid #334155; text-align: center; font-weight: 700;">Durum</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                ${emptyRowsHtml}
              </tbody>
            </table>
          </div>

          <div>
            ${isLastPage ? `
              <!-- Kapanış Bölümleri & İmzalar (YALNIZCA SON SAYFADA) -->
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 14px; border-top: 1.5px solid #cbd5e1; padding-top: 10px; margin-bottom: 8px;">
                <!-- Koç Değerlendirme Notu -->
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #f8fafc;">
                  <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Koç Değerlendirmesi & Haftalık Talimatlar</div>
                  <div style="border-bottom: 1px dashed #94a3b8; height: 20px;"></div>
                  <div style="border-bottom: 1px dashed #94a3b8; height: 20px;"></div>
                  <div style="border-bottom: 1px dashed #94a3b8; height: 20px;"></div>
                </div>

                <!-- Onay & İmza Bandı -->
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between;">
                  <div>
                    <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Öğrenci / Veli Onayı</div>
                    <div style="border-bottom: 1px solid #94a3b8; height: 22px; margin-bottom: 8px;"></div>
                  </div>
                  <div>
                    <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Koç Onayı & Kaşe</div>
                    <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">${koc.ad || 'Eğitim'} ${koc.soyad || 'Koçu'}</div>
                    <div style="border-bottom: 1px solid #94a3b8; height: 16px;"></div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Sayfa Numaralandırması ve Alt Bilgi -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #0f172a; padding-top: 6px; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>Plantrack Öğrenci Koçluk Sistemi • ${tarihLabel}</span>
              <span style="font-weight: 700; color: #0f172a; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                Sayfa ${sayfaNo} / ${toplamSayfa}
              </span>
            </div>
          </div>
        </div>
      `;
    });
  },

  renderCizelgeOdevTakipHTML(ogr, options = {}) {
    const pages = this.renderCizelgeOdevTakipPages(ogr, options);
    return pages[0] || '';
  },

  renderCizelgeKonuTakipPages(ogr, { isPrint = false } = {}) {
    const koc = Store.getKocProfili() || {};
    const bugunTarih = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const dersler = ogr ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();
    const seciliDersId = this.cizelgeDersId || (dersler[0] ? dersler[0].id : '');
    const ders = Store.getDers(seciliDersId);
    const konular = seciliDersId ? Store.getKonularForDers(seciliDersId) : [];

    let tamamlananSayisi = 0;
    let tekrarSayisi = 0;
    let calisiliyorSayisi = 0;
    const durumHaritasi = {};
    if (ogr && !this.cizelgeKonuBosMod) {
      konular.forEach(k => {
        const kd = Store.getKonuDurumu(ogr.id, k.id);
        const dStr = kd && typeof kd === 'object' ? kd.durum : kd;
        durumHaritasi[k.id] = kd;
        if (dStr === 'tamam') tamamlananSayisi++;
        else if (dStr === 'tekrar_lazim') tekrarSayisi++;
        else if (dStr === 'calisiliyor') calisiliyorSayisi++;
      });
    }

    const toplamKonu = konular.length;
    const yuzde = toplamKonu > 0 ? Math.round((tamamlananSayisi / toplamKonu) * 100) : 0;

    let chunks = [];
    if (konular.length <= 22) {
      chunks = [konular];
    } else {
      const list = [...konular];
      const sayfaSayisi = Math.ceil(list.length / 20);
      const sayfaBasi = Math.ceil(list.length / sayfaSayisi);
      while (list.length > 0) {
        chunks.push(list.splice(0, sayfaBasi));
      }
    }

    const toplamSayfa = chunks.length;

    return chunks.map((chunk, pageIdx) => {
      const sayfaNo = pageIdx + 1;
      const isFirstPage = (sayfaNo === 1);
      const isLastPage = (sayfaNo === toplamSayfa);

      let startIndex = 0;
      for (let p = 0; p < pageIdx; p++) {
        startIndex += chunks[p].length;
      }

      const minRowsOnPage = toplamSayfa === 1 ? 15 : (isLastPage ? 12 : 16);
      const padCount = Math.max(0, minRowsOnPage - chunk.length);
      const totalRowsOnPage = Math.max(1, chunk.length + padCount);
      const availablePx = isLastPage ? 550 : 650;
      const rowHeight = Math.max(25, Math.min(40, Math.floor(availablePx / totalRowsOnPage)));

      const rowsHtml = chunk.map((k, idx) => {
        const rowNo = startIndex + idx + 1;
        const kd = durumHaritasi[k.id];
        const dur = kd && typeof kd === 'object' ? kd.durum : kd;
        const notStr = kd && typeof kd === 'object' ? (kd.not || '') : '';
        const isIslendi = dur === 'tamam';
        const isTekrar = dur === 'tekrar_lazim';
        const isTest = dur === 'calisiliyor';

        return `
          <tr style="height: ${rowHeight}px; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: 700; color: #475569; font-size: ${rowHeight < 26 ? '10px' : '11px'};">${rowNo}</td>
            <td style="padding: 3px 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a; font-size: ${rowHeight < 26 ? '10.5px' : '11.5px'}; line-height: 1.2;">${k.konuAdi}</td>
            <td style="padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center;">
              ${isIslendi ? `<span style="display: inline-block; width: 17px; height: 17px; border: 2px solid #16a34a; background: #dcfce7; color: #15803d; font-weight: 800; font-size: 12px; line-height: 14px; border-radius: 3px; vertical-align: middle;">✓</span>` : `<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #94a3b8; border-radius: 3px; vertical-align: middle;"></span>`}
            </td>
            <td style="padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center;">
              ${isTekrar ? `<span style="display: inline-block; width: 17px; height: 17px; border: 2px solid #ea580c; background: #ffedd5; color: #c2410c; font-weight: 800; font-size: 12px; line-height: 14px; border-radius: 3px; vertical-align: middle;">✓</span>` : `<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #94a3b8; border-radius: 3px; vertical-align: middle;"></span>`}
            </td>
            <td style="padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center;">
              ${isTest ? `<span style="display: inline-block; width: 17px; height: 17px; border: 2px solid #2563eb; background: #dbeafe; color: #1d4ed8; font-weight: 800; font-size: 12px; line-height: 14px; border-radius: 3px; vertical-align: middle;">✓</span>` : `<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #94a3b8; border-radius: 3px; vertical-align: middle;"></span>`}
            </td>
            <td style="padding: 2px 6px; border: 1px solid #cbd5e1; vertical-align: middle;">
              ${notStr ? `<span style="font-size: 10.5px; color: #334155; font-weight: 500;">${this.escapeHtml(notStr)}</span>` : `<div style="border-bottom: 1px dotted #94a3b8; height: 14px; width: 100%;"></div>`}
            </td>
          </tr>
        `;
      }).join('');

      const emptyRowsHtml = Array.from({ length: padCount }).map((_, i) => {
        const rowNo = startIndex + chunk.length + i + 1;
        const idx = chunk.length + i;
        return `
          <tr style="height: ${rowHeight}px; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
            <td style="padding: 3px 4px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #94a3b8; font-size: 10.5px;">${rowNo}</td>
            <td style="padding: 3px 8px; border: 1px solid #cbd5e1; color: #94a3b8; font-size: 10.5px; font-style: italic;">${i === 0 && chunk.length > 0 ? 'Ek Konu / Genel Tekrar / Deneme Analizi' : ''}</td>
            <td style="padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center;"><span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span></td>
            <td style="padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center;"><span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span></td>
            <td style="padding: 2px 4px; border: 1px solid #cbd5e1; text-align: center;"><span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #cbd5e1; border-radius: 3px; vertical-align: middle;"></span></td>
            <td style="padding: 2px 6px; border: 1px solid #cbd5e1; vertical-align: middle;"><div style="border-bottom: 1px dotted #cbd5e1; height: 14px; width: 100%;"></div></td>
          </tr>
        `;
      }).join('');

      return `
        <div class="print-page-dikey print-single-page ${isPrint && !isLastPage ? 'print-page-break' : ''}" style="display: flex; flex-direction: column; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; font-size: 0.75rem; line-height: 1.35; box-sizing: border-box; width: 100%; padding: ${isPrint ? '5mm 7mm' : '8mm 10mm'};">
          <div>
            ${isFirstPage ? `
              <!-- Üst Başlık Bandı (Tam Başlık) -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px;">
                <div style="text-align: left;">
                  <h1 style="font-size: 17px; font-weight: 800; letter-spacing: 1.5px; margin: 0; color: #0f172a; text-transform: uppercase;">KONU TAKİP TABLOSU</h1>
                  <div style="font-size: 11px; color: #475569; margin-top: 2px;">${koc.ad || 'Eğitim'} ${koc.soyad || 'Koçu'} • ${koc.kurum || 'Plantrack Koçluk'}</div>
                </div>

                <div style="text-align: center;">
                  <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Seçili Ders</div>
                  <div style="font-size: 15px; font-weight: 800; color: #0f172a;">${ders ? ders.ad : 'Ders Seçilmedi'}</div>
                  <div style="font-size: 10px; color: #475569; font-family: monospace; margin-top: 2px;">
                    ${this.cizelgeKonuBosMod ? 'Boş Takip Şablonu' : `İlerleme: ${tamamlananSayisi} / ${toplamKonu} Konu Tamamlandı (%${yuzde})`}
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700;">Öğrenci & Tarih</div>
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${ogr ? (ogr.adSoyad || `${ogr.ad || ''} ${ogr.soyad || ''}`) : '—'}</div>
                  <div style="font-size: 10px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} • ${bugunTarih}</div>
                </div>
              </div>
            ` : `
              <!-- Devam Başlığı (Kompakt) -->
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
                  ${koc.ad || 'Eğitim'} ${koc.soyad || 'Koçu'} • ${koc.kurum || 'Plantrack'}
                </div>

                <div style="font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #0f172a; text-transform: uppercase;">
                  ${ders ? ders.ad.toUpperCase() : ''} KONU TAKİP TABLOSU <span style="font-size: 10px; font-weight: 700; color: #0284c7; background: #e0f2fe; padding: 1px 6px; border-radius: 3px; vertical-align: middle;">DEVAM</span>
                </div>

                <div style="font-size: 11px; font-weight: 700; color: #0f172a;">
                  ${ogr ? (ogr.adSoyad || `${ogr.ad || ''} ${ogr.soyad || ''}`) : '—'} <span style="font-weight: 400; color: #64748b;">(${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''})</span>
                </div>
              </div>
            `}

            <!-- Konu Tablosu -->
            <table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 8px; font-size: inherit;">
              <thead>
                <tr style="background: #1e293b; color: #ffffff; border-bottom: 2px solid #0f172a;">
                  <th style="width: 32px; padding: 6px 4px; border: 1px solid #334155; text-align: center; font-weight: 700; font-size: 11px;">#</th>
                  <th style="padding: 6px 10px; border: 1px solid #334155; text-align: left; font-weight: 700; font-size: 11.5px;">Konu Adı</th>
                  <th style="width: 65px; padding: 6px 4px; border: 1px solid #334155; text-align: center; font-weight: 700; font-size: 11px;">İşlendi</th>
                  <th style="width: 65px; padding: 6px 4px; border: 1px solid #334155; text-align: center; font-weight: 700; font-size: 11px;">Tekrar</th>
                  <th style="width: 65px; padding: 6px 4px; border: 1px solid #334155; text-align: center; font-weight: 700; font-size: 11px;">Çalışılıyor</th>
                  <th style="width: 165px; padding: 6px 8px; border: 1px solid #334155; text-align: left; font-weight: 700; font-size: 11px;">Tarih & Koç Notu</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                ${emptyRowsHtml}
              </tbody>
            </table>
          </div>

          <div>
            ${isLastPage ? `
              <!-- Alt Kısım: Özet, Değerlendirme & İmzalar (Son Sayfa) -->
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; border-top: 1.5px solid #cbd5e1; padding-top: 8px; margin-bottom: 6px;">
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc;">
                  <div style="font-size: 10px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 4px;">
                    Ders İlerleme Özeti & Koç Değerlendirmesi
                  </div>
                  <div style="font-size: 10.5px; color: #334155; margin-bottom: 4px;">
                    Toplam <strong>${toplamKonu}</strong> müfredat konusu · <strong>${tamamlananSayisi}</strong> Tamamlandı (%${yuzde}) · <strong>${calisiliyorSayisi}</strong> Çalışılıyor · <strong>${tekrarSayisi}</strong> Tekrar Gerekli
                  </div>
                  <div style="border-bottom: 1px dashed #94a3b8; height: 18px;"></div>
                  <div style="border-bottom: 1px dashed #94a3b8; height: 18px;"></div>
                </div>
                <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; display: flex; flex-direction: column; justify-content: space-between; font-size: 10px;">
                  <div>
                    <span style="color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 9px;">Öğrenci / Veli Parafı</span>
                    <div style="border-bottom: 1px solid #94a3b8; height: 18px; margin-top: 2px;"></div>
                  </div>
                  <div>
                    <span style="color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 9px;">Koç Onayı</span>
                    <div style="border-bottom: 1px solid #94a3b8; height: 18px; margin-top: 2px;"></div>
                  </div>
                </div>
              </div>
            ` : ''}

            <!-- Sayfa Numarası -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #0f172a; padding-top: 5px; font-size: 10px; color: #64748b; font-family: monospace;">
              <span>Plantrack • ${ders ? ders.ad : ''} Konu Takip Çizelgesi</span>
              <span style="font-weight: 700; color: #0f172a; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">
                Sayfa ${sayfaNo} / ${toplamSayfa}
              </span>
            </div>
          </div>
        </div>
      `;
    });
  },

  renderCizelgeKonuTakipHTML(ogr, options = {}) {
    const pages = this.renderCizelgeKonuTakipPages(ogr, options);
    return pages[0] || '';
  },

  // ─────────────────────────────────────────────────────────────
  // ŞABLON 4: KONU & SORU ÇİZELGESİ (HTML - G6 TUR BAZLI MATRİS)
  // ─────────────────────────────────────────────────────────────
  renderCizelgeKonuSoruHTML(ogr, { isPrint = false, dersId = null } = {}) {
    // Ekran: uygulama arayüzü (yazdırma yolu aşağıda aynen korunur)
    if (!isPrint) return this.renderKonuSoruAppUI(ogr, dersId);

    const koc = Store.getKocProfili();
    const kocAdi = `${koc.ad || ''} ${koc.soyad || ''}`.trim() || 'Eğitim Koçu';
    const kurumAdi = koc.kurum || 'Plantrack Koçluk';
    const dikeyYazi = `KOÇ: ${kocAdi.toUpperCase()} | ${kurumAdi.toUpperCase()}`;

    const modul = ogr ? (typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null) : null;
    const dersler = ogr ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();
    const seciliDersId = dersId || this.cizelgeKonuSoruDersId || this.cizelgeDersId || (dersler[0] ? dersler[0].id : '');
    const seciliDers = dersler.find(d => String(d.id) === String(seciliDersId)) || dersler[0];
    const dersAdi = seciliDers ? seciliDers.ad : 'Ders';
    const konular = seciliDers ? Store.getKonularForDers(seciliDers.id) : [];

    // Varsayılan 5 Tur
    const turSayisi = this.konuSoruTurSayisi || 5;
    // Türkçe sayı okunuşuna göre iyelik eki (1'li, 3'lü, 6'lı, 9'lu, 10'lu)
    const turEkleri = { 1: 'Lİ', 2: 'Lİ', 3: 'LÜ', 4: 'LÜ', 5: 'Lİ', 6: 'LI', 7: 'Lİ', 8: 'Lİ', 9: 'LU', 10: 'LU', 11: 'Lİ', 12: 'Lİ' };
    const turEki = turEkleri[turSayisi] || 'Lİ';

    // İlgili Ay Bilgisi
    const mInfo = this.getKonuSoruMonthInfo(this.cizelgeKonuSoruAyOffset);

    // Boş Form / Şablon Durumu
    const isBosForm = Boolean(this.cizelgeKonuSoruBosMod);

    const notMetni = isBosForm ? '' : (ogr && seciliDersId ? Store.getKonuTakipNot(ogr.id, seciliDersId) : '');
    const ogrAdSoyad = isBosForm ? '...................................................' : (ogr ? (ogr.adSoyad || `${ogr.ad || ''} ${ogr.soyad || ''}`.trim() || '—') : '—');
    const ogrAlan = isBosForm ? '........................' : (ogr ? (ogr.sinif ? `${ogr.sinif}. Sınıf` : (ogr.alan || (modul ? modul.ad : '—'))) : '—');
    const ogrHedef = isBosForm ? '........................................' : (ogr && ogr.hedef ? ogr.hedef : '—');

    // Konu Listesi: Satır sayısı, dersin GERÇEK konu sayısıyla birebir aynı olmalı
    // (7 konu -> 7 satır, 10 konu -> 10 satır). Yalnızca "Boş Şablon" modunda
    // elle doldurulacak satırlar üretilir.
    let gosterilecekKonular = [...konular];
    if (isBosForm) {
      gosterilecekKonular = Array.from({ length: 15 }, () => ({
        konuAdi: isPrint ? '................................................................' : '(Konu / Soru Hedefi Yazınız...)',
        isPad: true
      }));
    } else if (gosterilecekKonular.length === 0) {
      gosterilecekKonular = [{
        konuAdi: isPrint ? '................................................................' : '(Bu ders için tanımlı konu bulunamadı...)',
        isPad: true
      }];
    }

    const availableTablePx = isPrint ? 430 : 460;
    const rowHNum = Math.min(32, Math.max(19, Math.floor(availableTablePx / Math.max(1, gosterilecekKonular.length))));
    const rowH = `${rowHNum}px`;
    const fontSz = isPrint ? (gosterilecekKonular.length > 20 ? '9.5px' : '10.5px') : '11px';

    // Konu adı hücreye sığsın: uzun isme ve satır yüksekliğine göre punto ayarı
    const enUzunKonu = gosterilecekKonular.reduce((m, k) => Math.max(m, String(k.konuAdi || k.ad || '').length), 0);
    let konuFontPx = isPrint ? 9.6 : 10.6;
    if (enUzunKonu > 58) konuFontPx = isPrint ? 7.4 : 8.4;
    else if (enUzunKonu > 44) konuFontPx = isPrint ? 8.2 : 9.2;
    else if (enUzunKonu > 32) konuFontPx = isPrint ? 9.0 : 10.0;
    if (rowHNum <= 20) konuFontPx = Math.min(konuFontPx, isPrint ? 7.4 : 8.2);
    else if (rowHNum <= 22) konuFontPx = Math.min(konuFontPx, isPrint ? 8.2 : 9.0);
    const konuFontSz = `${konuFontPx}px`;

    const TUR_RENKLERI = [
      '#eff6ff',  // mavi
      '#f0fdf4',  // yeşil
      '#fefce8',  // sarı
      '#fff7ed',  // turuncu
      '#fdf4ff',  // mor
    ];
    const TUR_SUB_RENKLERI = [
      '#dbeafe',  // mavi alt
      '#dcfce7',  // yeşil alt
      '#fef9c3',  // sarı alt
      '#ffedd5',  // turuncu alt
      '#fae8ff',  // mor alt
    ];

    const konuGenislikYuzde = turSayisi >= 8 ? 25 : (turSayisi <= 4 ? 26 : 23);
    const siraGenislikYuzde = 2.8;
    const veriToplamYuzde = 100 - (siraGenislikYuzde + konuGenislikYuzde);
    const colVeriYuzdesi = (veriToplamYuzde / (turSayisi * 4)).toFixed(3) + '%';

    const escapeHtml = (str) => this.escapeHtml(str);

    return `
      <div class="print-page-yatay" style="position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; font-size: ${isPrint ? '0.64rem' : '0.72rem'}; line-height: 1.3; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; justify-content: space-between; padding-left: 20px;">
        
        <!-- Sol Kenar — Dikey Koç/Kurum Adı -->
        <div class="cizelge-sol-kenar" style="position: absolute; left: 1px; top: 0; bottom: 0; display: flex; align-items: center; justify-content: center; z-index: 5;">
          ${escapeHtml(dikeyYazi)}
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; width: 100%; height: 100%;">
          <div>
            <!-- Başlık Bandı (İlgili Ay ve Ders Rozeti Dahil) -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: ${isPrint ? '0.92rem' : '1.05rem'}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
                    ${escapeHtml(dersAdi.toUpperCase())} KONU & ${turSayisi}'${turEki} SORU TAKİP ÇİZELGESİ
                  </span>
                  <span style="display: inline-block; padding: 2px 8px; background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd; border-radius: 4px; font-size: ${isPrint ? '0.60rem' : '0.68rem'}; font-weight: 700; text-transform: uppercase;">
                    ${escapeHtml(dersAdi)}
                  </span>
                  <span style="display: inline-block; padding: 2px 8px; background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; border-radius: 4px; font-size: ${isPrint ? '0.60rem' : '0.68rem'}; font-weight: 700; font-family: monospace;">
                    ${mInfo.ayAdi} ${mInfo.yil}
                  </span>
                  ${isBosForm ? `
                    <span style="display: inline-block; padding: 2px 6px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; border-radius: 4px; font-size: ${isPrint ? '0.54rem' : '0.62rem'}; font-weight: 700;">
                      BOŞ FORM
                    </span>
                  ` : ''}
                </div>
                <div style="font-size: ${isPrint ? '0.60rem' : '0.68rem'}; color: #64748b; margin-top: 2px;">
                  Müfredat Konuları İçin Tur Bazlı Doğru – Yanlış – Boş Kontrol Matrisi &nbsp;•&nbsp; <strong>${mInfo.ayAdi} ${mInfo.yil}</strong>
                </div>
              </div>

              <div style="text-align: right; font-size: ${isPrint ? '0.65rem' : '0.72rem'}; color: #334155; line-height: 1.4;">
                <div>
                  <strong>Öğrenci:</strong> <span style="color: #0f172a; font-weight: 700;">${escapeHtml(ogrAdSoyad)}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                  <strong>Alan:</strong> <span style="color: #0f172a; font-weight: 600;">${escapeHtml(ogrAlan)}</span> &nbsp;&nbsp;|&nbsp;&nbsp;
                  <strong>Hedef:</strong> <span style="color: #0f172a; font-weight: 600;">${escapeHtml(ogrHedef)}</span>
                </div>
              </div>
            </div>

            <!-- Tablo (A4 Yatay & Fixed) -->
            <div style="overflow-x: auto; width: 100%;">
              <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: ${isPrint ? '0.62rem' : '0.72rem'}; line-height: 1.25;">
                <colgroup>
                  <col style="width: ${siraGenislikYuzde}%;">
                  <col style="width: ${konuGenislikYuzde}%;">
                  ${Array.from({ length: turSayisi * 4 }).map(() => `<col style="width: ${colVeriYuzdesi};">`).join('')}
                </colgroup>
                <thead>
                  <tr>
                    <th rowspan="2" style="padding: 4px 1px; border: 1px solid #94a3b8; text-align: center; font-weight: 700; background: #f1f5f9; color: #0f172a; font-size: ${isPrint ? '10px' : '11px'};">#</th>
                    <th rowspan="2" style="padding: 4px 6px; border: 1px solid #94a3b8; text-align: left; font-weight: 700; background: #f1f5f9; color: #0f172a; font-size: ${isPrint ? '10.5px' : '11.5px'};">KONU / ÇALIŞMA ADI</th>
                    ${Array.from({ length: turSayisi }, (_, i) => i + 1).map(turNo => {
                      const bg = TUR_RENKLERI[(turNo - 1) % TUR_RENKLERI.length];
                      return `
                        <th colspan="4" style="padding: 3px 1px; border: 1px solid #94a3b8; text-align: center; font-weight: 800; background-color: ${bg}; color: #0f172a; font-size: ${isPrint ? '10.5px' : '11.5px'};">
                          ${turNo}. Tur
                        </th>
                      `;
                    }).join('')}
                  </tr>
                  <tr>
                    ${Array.from({ length: turSayisi }, (_, i) => i + 1).map(turNo => {
                      const subBg = TUR_SUB_RENKLERI[(turNo - 1) % TUR_SUB_RENKLERI.length];
                      return `
                        <th style="padding: 2px 0; border: 1px solid #94a3b8; text-align: center; font-weight: 700; background-color: ${subBg}; color: #1e293b; font-size: ${isPrint ? '9.5px' : '10.5px'};">D</th>
                        <th style="padding: 2px 0; border: 1px solid #94a3b8; text-align: center; font-weight: 700; background-color: ${subBg}; color: #1e293b; font-size: ${isPrint ? '9.5px' : '10.5px'};">Y</th>
                        <th style="padding: 2px 0; border: 1px solid #94a3b8; text-align: center; font-weight: 700; background-color: ${subBg}; color: #1e293b; font-size: ${isPrint ? '9.5px' : '10.5px'};">B</th>
                        <th style="padding: 2px 0; border: 1px solid #94a3b8; text-align: center; font-weight: 700; background-color: ${subBg}; color: #1e293b; font-size: ${isPrint ? '9.5px' : '10.5px'};">S</th>
                      `;
                    }).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${gosterilecekKonular.map((k, idx) => {
                    const isPadRow = Boolean(k.isPad);
                    return `
                      <tr style="height: ${rowH}; background: ${idx % 2 === 1 ? '#f8fafc' : '#ffffff'};">
                        <td style="text-align: center; font-weight: 700; border: 1px solid #cbd5e1; padding: 1px 0; color: ${isPadRow ? '#94a3b8' : '#475569'}; font-size: ${fontSz}; font-family: monospace;">
                          ${idx + 1}
                        </td>
                        <td style="padding: 1px 4px; border: 1px solid #cbd5e1; vertical-align: middle;" title="${escapeHtml(k.konuAdi || k.ad || '')}">
                          <div style="font-weight: ${isPadRow ? '500' : '600'}; font-style: ${isPadRow ? 'italic' : 'normal'}; text-align: left; color: ${isPadRow ? '#475569' : '#0f172a'}; font-size: ${konuFontSz}; line-height: 1.06; word-break: break-word; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;">${escapeHtml(k.konuAdi || k.ad || '')}</div>
                        </td>
                        ${Array.from({ length: turSayisi }, (_, tIdx) => {
                          const turNo = tIdx + 1;
                          const konuId = k.id || `konu_${idx + 1}`;
                          const v = (ogr && ogr.id) ? Store.getKonuSoruVeri(ogr.id, konuId, turNo, mInfo.yilAyStr) : { d: 0, y: 0, b: 0, s: 0 };
                          const dVal = v.d > 0 ? v.d : '';
                          const yVal = v.y > 0 ? v.y : '';
                          const bVal = v.b > 0 ? v.b : '';
                          const sVal = v.s > 0 ? v.s : '';

                          if (isPrint) {
                            return `
                              <td style="height: ${rowH}; border: 1px solid #cbd5e1; text-align: center; font-weight: 600; font-size: ${fontSz}; padding: 0;">${dVal}</td>
                              <td style="height: ${rowH}; border: 1px solid #cbd5e1; text-align: center; font-weight: 600; font-size: ${fontSz}; padding: 0;">${yVal}</td>
                              <td style="height: ${rowH}; border: 1px solid #cbd5e1; text-align: center; font-weight: 600; font-size: ${fontSz}; padding: 0;">${bVal}</td>
                              <td style="height: ${rowH}; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; font-size: ${fontSz}; padding: 0; background-color: #f1f5f9;">${sVal}</td>
                            `;
                          }

                          return `
                            <td style="height: ${rowH}; border: 1px solid #cbd5e1; padding: 0;">
                              <input type="text" inputmode="numeric" value="${dVal}" placeholder="–"
                                onchange="App.onKonuSoruHucreChange('${ogr ? ogr.id : ''}', '${konuId}', ${turNo}, '${mInfo.yilAyStr}', 'd', this.value)"
                                style="width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: 10px; font-weight: 600; color: #15803d; padding: 0; outline: none;" />
                            </td>
                            <td style="height: ${rowH}; border: 1px solid #cbd5e1; padding: 0;">
                              <input type="text" inputmode="numeric" value="${yVal}" placeholder="–"
                                onchange="App.onKonuSoruHucreChange('${ogr ? ogr.id : ''}', '${konuId}', ${turNo}, '${mInfo.yilAyStr}', 'y', this.value)"
                                style="width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: 10px; font-weight: 600; color: #b91c1c; padding: 0; outline: none;" />
                            </td>
                            <td style="height: ${rowH}; border: 1px solid #cbd5e1; padding: 0;">
                              <input type="text" inputmode="numeric" value="${bVal}" placeholder="–"
                                onchange="App.onKonuSoruHucreChange('${ogr ? ogr.id : ''}', '${konuId}', ${turNo}, '${mInfo.yilAyStr}', 'b', this.value)"
                                style="width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: 10px; font-weight: 600; color: #b45309; padding: 0; outline: none;" />
                            </td>
                            <td style="height: ${rowH}; border: 1px solid #cbd5e1; padding: 0; background-color: #f8fafc;">
                              <input type="text" inputmode="numeric" value="${sVal}" placeholder="–" id="ks-input-${konuId}-${turNo}-s"
                                onchange="App.onKonuSoruHucreChange('${ogr ? ogr.id : ''}', '${konuId}', ${turNo}, '${mInfo.yilAyStr}', 's', this.value)"
                                style="width: 100%; height: 100%; border: none; background: transparent; text-align: center; font-size: 10px; font-weight: 700; color: #1e3a8a; padding: 0; outline: none;" />
                            </td>
                          `;
                        }).join('')}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Alt Kısım: Notlar Alanı ve İmzalar -->
          <div>
            <!-- Notlar Alanı -->
            <div style="margin-top: 8px; border: 1px solid #cbd5e1; border-radius: 5px; padding: 8px 12px; background: #f8fafc;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-weight: 800; font-size: ${isPrint ? '0.68rem' : '0.75rem'}; color: #0f172a;">
                    ✏ NOTLAR & SORU HEDEFLERİ
                  </span>
                  <span style="background: #fef3c7; color: #92400e; font-size: ${isPrint ? '0.54rem' : '0.62rem'}; font-weight: 700; padding: 1px 6px; border-radius: 9999px;">
                    Öğrenci & Koç Not Alanı
                  </span>
                </div>
                <div style="font-size: ${isPrint ? '0.58rem' : '0.65rem'}; color: #64748b; font-style: italic;">
                  Eksik konular, çözülecek ek kaynaklar ve soru hedefleri için değerlendirme alanı
                </div>
              </div>
              ${!isPrint ? `
                <textarea 
                  oninput="App.onKonuTakipNotChange('${ogr ? ogr.id : ''}', '${seciliDersId}', this.value)"
                  placeholder="Buraya tıklayarak not yazabilir veya çizelgeyi yazdırıp el yazınızla doldurabilirsiniz..."
                  style="width: 100%; min-height: 48px; max-height: 75px; font-size: 0.72rem; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; resize: vertical; box-sizing: border-box; background: #ffffff; font-family: inherit; line-height: 1.35;"
                >${escapeHtml(notMetni)}</textarea>
              ` : `
                <div style="width: 100%; font-size: 0.65rem; color: #1e293b; padding: 2px 4px; line-height: 1.4;">
                  ${notMetni ? `<div style="white-space: pre-wrap; min-height: 44px;">${escapeHtml(notMetni)}</div>` : `
                    <div style="border-bottom: 1px dashed #94a3b8; height: 18px; margin-bottom: 4px;"></div>
                    <div style="border-bottom: 1px dashed #94a3b8; height: 18px; margin-bottom: 4px;"></div>
                    <div style="border-bottom: 1px dashed #94a3b8; height: 18px;"></div>
                  `}
                </div>
              `}
            </div>

            <!-- Footer / Onaylar -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #0f172a; padding-top: 6px; font-size: ${isPrint ? '0.60rem' : '0.66rem'}; color: #475569; margin-top: 6px; font-weight: 600;">
              <div>
                D: Doğru | Y: Yanlış | B: Boş | S: Toplam Soru Sayısı &nbsp;•&nbsp; Her turda ilgili konudan çözülen sorular matrise işlenir.
              </div>
              <div style="display: flex; align-items: center; gap: 24px;">
                <span>Öğrenci Parafı: ____________________</span>
                <span>Koç İmzası: ____________________</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // ŞABLON 5: ZAMAN BLOKLAMA (HTML) — 30 DK HASSASİYET & BİRLEŞTİRİLMİŞ BLOKLAR
  // ─────────────────────────────────────────────────────────────
  renderCizelgeZamanBlokHTML(ogr, { isPrint = false } = {}) {
    // Ekran: tamamen yeni uygulama arayüzü (A4 rapor yolu aşağıda aynen korunur)
    if (!isPrint) return this.renderZamanBlokAppUI(ogr);

    const koc = Store.getKocProfili();
    const modul = ogr ? (typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null) : null;
    const weekInfo = this.getZamanWeekInfo(this.zamanHaftaOffset);
    const plan = ogr ? Store.getZamanPlani(ogr.id) : {};
    const kategoriler = typeof ZAMAN_KATEGORILER !== 'undefined' ? ZAMAN_KATEGORILER : [];

    const escapeHtml = (str) => this.escapeHtml(str);

    // Ekran: uygulama teması renkleri | Yazdırma: sabit açık A4 renkleri
    const C = isPrint ? {
      panelBg: '#ffffff', panelBorder: '#cbd5e1', panelText: '#0f172a',
      headerBg: '#1e293b', headerText: '#ffffff', headerSub: '#cbd5e1', headerBorder: '#334155', headerLine: '#0f172a',
      hourBg: '#f1f5f9', cellBg: '#ffffff', cellAlt: '#fafafa',
      border: '#cbd5e1', borderSoft: '#e2e8f0',
      text: '#0f172a', muted: '#475569', faint: '#64748b', legendBg: '#f8fafc'
    } : {
      panelBg: 'var(--color-paper-2)', panelBorder: 'var(--color-rule)', panelText: 'var(--color-ink)',
      headerBg: 'var(--color-paper-4)', headerText: 'var(--color-ink)', headerSub: 'var(--color-ink-muted)', headerBorder: 'var(--color-rule-strong)', headerLine: 'var(--color-rule-strong)',
      hourBg: 'var(--color-paper-3)', cellBg: 'var(--color-paper-2)', cellAlt: 'var(--color-paper-3)',
      border: 'var(--color-rule-strong)', borderSoft: 'var(--color-rule)',
      text: 'var(--color-ink)', muted: 'var(--color-ink-muted)', faint: 'var(--color-ink-faint)', legendBg: 'var(--color-paper-3)'
    };

    // Rapor 5 günlük (Pzt–Cum) hazırlanır; Cmt/Paz ayrı bölüm olarak eklenir
    const raporGunleri = isPrint ? weekInfo.gunDetaylari.slice(0, 5) : weekInfo.gunDetaylari;

    // Öğrenciye özel seçilen saat aralığına ait slotlar ve dinamik satır yüksekliği
    const zamanSlotlari = this.getZamanSlotlari ? this.getZamanSlotlari(ogr ? ogr.id : null) : (typeof ZAMAN_SLOTLARI !== 'undefined' ? ZAMAN_SLOTLARI : []);
    const maxTableHeight = isPrint ? 520 : 640;
    const rowHeight = isPrint 
      ? Math.min(30, Math.max(15, Math.floor(maxTableHeight / Math.max(1, zamanSlotlari.length))))
      : Math.min(32, Math.max(18, Math.floor(maxTableHeight / Math.max(1, zamanSlotlari.length))));

    // Her gün için ardışık aynı faaliyet ve not içeren hücreleri birleştir (Merged Blocks / Rowspan)
    const dayBlocks = {};
    weekInfo.gunDetaylari.forEach(g => {
      const gKey = g.key;
      const blocksByStart = {};
      const coveredIndices = new Set();

      let i = 0;
      while (i < zamanSlotlari.length) {
        const sItem = zamanSlotlari[i];
        const hh = sItem.slotKey.split(':')[0];
        const cellData = plan[`${gKey}_${sItem.slotKey}`] || plan[`${gKey}_${hh}`] || null;

        if (!cellData) {
          i++;
          continue;
        }

        let j = i + 1;
        while (j < zamanSlotlari.length) {
          const nextItem = zamanSlotlari[j];
          const nextHh = nextItem.slotKey.split(':')[0];
          const nextData = plan[`${gKey}_${nextItem.slotKey}`] || plan[`${gKey}_${nextHh}`] || null;

          if (!nextData) break;
          const sameActivity = (nextData.label === cellData.label) &&
                               ((nextData.not || '') === (cellData.not || '')) &&
                               (nextData.bg === cellData.bg) &&
                               (nextData.renk === cellData.renk);
          if (!sameActivity) break;
          j++;
        }

        const len = j - i;
        const startIdx = i;
        const endIdx = j - 1;
        const startTimeStr = zamanSlotlari[startIdx].startStr;
        const endTimeStr = zamanSlotlari[endIdx].endStr;
        const durationHours = len * 0.5;
        const durationStr = Number.isInteger(durationHours) ? `${durationHours} Sa` : `${durationHours.toFixed(1)} Sa`;
        const timeBadgeText = `${startTimeStr} – ${endTimeStr} (${durationStr})`;

        blocksByStart[startIdx] = {
          len,
          startIdx,
          endIdx,
          cellData,
          timeBadgeText,
          startTimeStr,
          endTimeStr
        };

        for (let k = startIdx + 1; k <= endIdx; k++) {
          coveredIndices.add(k);
        }

        i = j;
      }

      dayBlocks[gKey] = { blocksByStart, coveredIndices };
    });

    // Hafta sonu blokları (raporda alt bölüm olarak gösterilir)
    const haftaSonuBloklari = (gKey) => {
      const info = dayBlocks[gKey];
      if (!info) return [];
      return Object.keys(info.blocksByStart)
        .map(k => info.blocksByStart[k])
        .map(b => ({
          saat: `${b.startTimeStr}–${b.endTimeStr}`,
          label: b.cellData.label || '',
          not: b.cellData.not || '',
          renk: b.cellData.renk || '#2563eb'
        }));
    };
    const cmtBloklar = haftaSonuBloklari('cmt');
    const pazBloklar = haftaSonuBloklari('paz');

    return `
      <div class="${isPrint ? 'print-page-yatay' : ''}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${C.panelText}; background: ${C.panelBg}; font-size: ${isPrint ? '0.64rem' : '0.72rem'}; line-height: 1.2; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; justify-content: space-between; ${isPrint ? '' : `border: 1px solid ${C.panelBorder}; border-radius: 12px; padding: 14px 16px; max-width: 1240px; margin: 0 auto;`}">
        <div>
          ${isPrint ? `
          <!-- A4 Rapor Başlığı (yalnızca yazdırmada) -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 3px; margin-bottom: 4px;">
            <div style="text-align: left;">
              <div style="font-size: 11.5px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${koc.ad} ${koc.soyad}</div>
              <div style="font-size: 9.5px; color: #475569; margin-top: 1px;">${koc.unvan || 'Eğitim Koçu'} • ${koc.kurum || 'Plantrack Koçluk'}</div>
            </div>
            <div style="text-align: center;">
              <h1 style="font-size: 14px; font-weight: 800; letter-spacing: 1px; margin: 0; color: #0f172a; text-transform: uppercase;">ZAMAN BLOKLAMA PROGRAMI</h1>
              <div style="font-size: 9.5px; color: #475569; margin-top: 1px; font-family: monospace; font-weight: 600;">${weekInfo.rangeStr}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 8.5px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci</div>
              <div style="font-size: 11.5px; font-weight: 700; color: #0f172a;">${ogr ? (ogr.adSoyad || `${ogr.ad} ${ogr.soyad}`) : '—'}</div>
              <div style="font-size: 9.5px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} ${modul ? `• ${modul.ad}` : ''}</div>
            </div>
          </div>
          ` : `
          <!-- Uygulama Başlığı (ekran) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
            <div>
              <div style="font-size: 14px; font-weight: 800; color: ${C.text};">Haftalık Zaman Programı</div>
              <div style="font-size: 11.5px; color: ${C.faint}; margin-top: 1px;">${ogr ? escapeHtml(ogr.adSoyad || '') : 'Öğrenci seçilmedi'} &nbsp;•&nbsp; ${weekInfo.rangeStr}</div>
            </div>
            <span style="font-size: 10.5px; font-family: monospace; font-weight: 700; color: ${C.muted}; background: ${C.hourBg}; border: 1px solid ${C.border}; border-radius: 6px; padding: 3px 8px;">${zamanSlotlari.length} saat dilimi</span>
          </div>
          `}

          <!-- Lejant (Kategori Renk Çizelgesi - Kompakt) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap; margin-bottom: ${isPrint ? '4px' : '10px'}; padding: ${isPrint ? '2.5px 6px' : '7px 10px'}; background: ${C.legendBg}; border: 1px solid ${C.panelBorder}; border-radius: ${isPrint ? '4px' : '8px'}; font-size: ${isPrint ? '8.5px' : '11px'};">
            <span style="font-weight: 700; color: ${C.muted};">Kategori Lejantı:</span>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              ${kategoriler.filter(c => c.id !== 'silgi').map(c => `
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="display: inline-block; width: ${isPrint ? '8px' : '10px'}; height: ${isPrint ? '8px' : '10px'}; border-radius: 2px; background: ${c.bg}; border: 1.5px solid ${c.renk};"></span>
                  <span style="color: ${C.text}; font-weight: 600;">${c.label}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Zaman Bloklama Tablosu (${zamanSlotlari.length} Satır, ${rowHeight}px Yükseklik) -->
          <table id="${!isPrint ? 'zaman-grid-table' : ''}" style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 4px; font-size: inherit; user-select: none;">
            <thead>
              <tr style="background: ${C.headerBg}; color: ${C.headerText}; border-bottom: 2px solid ${C.headerLine}; height: ${isPrint ? '20px' : '30px'};">
                <th style="width: ${isPrint ? '78px' : '90px'}; padding: ${isPrint ? '2px' : '4px 2px'}; border: 1px solid ${C.headerBorder}; text-align: center; font-size: ${isPrint ? '9px' : '11px'}; color: ${C.headerSub}; font-weight: 700;">Saat</th>
                ${raporGunleri.map(g => `
                  <th style="padding: ${isPrint ? '2px' : '4px 2px'}; border: 1px solid ${C.headerBorder}; text-align: center;">
                    <div style="font-weight: 700; color: ${C.headerText}; font-size: ${isPrint ? '9px' : '11px'};">${g.ad}</div>
                    <div style="font-size: ${isPrint ? '7.5px' : '9.5px'}; font-weight: normal; color: ${C.headerSub}; font-family: monospace;">${g.tarihStr}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${zamanSlotlari.map((sItem, slotIdx) => {
                return `
                  <tr style="height: ${rowHeight}px; max-height: ${rowHeight}px;">
                    <td style="padding: ${isPrint ? '0 2px' : '0 3px'}; border: 1px solid ${C.border}; text-align: center; font-family: monospace; font-size: ${isPrint ? '8.5px' : '10.5px'}; background: ${sItem.isHourStart ? C.hourBg : C.cellAlt}; color: ${C.muted}; font-weight: 700; white-space: nowrap; height: ${rowHeight}px; box-sizing: border-box; line-height: ${rowHeight - 1}px;">
                      ${sItem.label}
                    </td>
                    ${raporGunleri.map(g => {
                      const gInfo = dayBlocks[g.key];

                      // EKRAN: Excel benzeri hücre hücre görünüm (birleştirme yok, taşan etiket yok)
                      if (!isPrint) {
                        const hh = sItem.slotKey.split(':')[0];
                        const c = plan[`${g.key}_${sItem.slotKey}`] || plan[`${g.key}_${hh}`] || null;
                        const oncekiSlot = slotIdx > 0 ? zamanSlotlari[slotIdx - 1] : null;
                        const prevData = oncekiSlot
                          ? (plan[`${g.key}_${oncekiSlot.slotKey}`] || plan[`${g.key}_${oncekiSlot.slotKey.split(':')[0]}`] || null)
                          : null;
                        const devam = Boolean(c && prevData &&
                          prevData.label === c.label &&
                          (prevData.not || '') === (c.not || '') &&
                          prevData.bg === c.bg &&
                          prevData.renk === c.renk);

                        if (!c) {
                          return `<td data-zaman-cell="true" data-gun="${g.key}" data-slot-idx="${slotIdx}" data-slot-end-idx="${slotIdx}"
                            style="padding: 0; border: 1px solid ${sItem.isHourStart ? C.border : C.borderSoft}; background: ${sItem.isHourStart ? C.cellBg : C.cellAlt}; vertical-align: middle; cursor: pointer; height: ${rowHeight}px; box-sizing: border-box;"></td>`;
                        }

                        const bg = c.bg || '#eff6ff';
                        const color = c.renk || '#2563eb';
                        const label = c.label || '';
                        const not = c.not || '';

                        return `<td data-zaman-cell="true" data-gun="${g.key}" data-slot-idx="${slotIdx}" data-slot-end-idx="${slotIdx}"
                          style="padding: 1px 3px; border: 1px solid ${C.border}; border-left: ${devam ? `1px solid ${C.border}` : `3px solid ${color}`}; background: ${bg}; vertical-align: middle; text-align: center; cursor: pointer; box-sizing: border-box; overflow: hidden; height: ${rowHeight}px;"
                          title="${escapeHtml(label)}${not ? ` - ${escapeHtml(not)}` : ''}">
                          ${devam ? '' : `
                            <div style="font-size: 10px; font-weight: 800; color: ${color}; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(label)}</div>
                            ${not ? `<div style="font-size: 8.5px; font-weight: 500; color: ${C.muted}; font-style: italic; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(not)}</div>` : ''}
                          `}
                        </td>`;
                      }

                      if (gInfo.coveredIndices.has(slotIdx)) {
                        return '';
                      }

                      const block = gInfo.blocksByStart[slotIdx];
                      if (block) {
                        const { len, startIdx, endIdx, cellData, timeBadgeText } = block;
                        const bg = cellData.bg || '#eff6ff';
                        const color = cellData.renk || '#2563eb';
                        const label = cellData.label || '';
                        const not = cellData.not || '';

                        return `
                          <td rowspan="${len}" data-zaman-cell="true" data-gun="${g.key}" data-slot-idx="${startIdx}" data-slot-end-idx="${endIdx}"
                            style="padding: 1px 2px; border: 1px solid #cbd5e1; border-left: 3px solid ${color}; background: ${bg}; vertical-align: middle; text-align: center; cursor: ${!isPrint ? 'pointer' : 'default'}; box-sizing: border-box; overflow: hidden; height: ${len * rowHeight}px;"
                            title="${escapeHtml(label)} ${escapeHtml(timeBadgeText)}${not ? ` - ${escapeHtml(not)}` : ''}">
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: ${len * rowHeight - 2}px; line-height: 1.1; text-align: center; overflow: hidden; pointer-events: none;">
                              <span style="font-size: ${isPrint ? (len === 1 ? '8.5px' : (len >= 3 ? '11px' : '10px')) : (len === 1 ? '10px' : (len >= 3 ? '12.5px' : '11.5px'))}; font-weight: 800; color: ${color}; display: block; overflow: hidden; text-overflow: ellipsis; white-space: ${len === 1 ? 'nowrap' : 'normal'}; word-break: break-word; max-width: 100%;">
                                ${escapeHtml(label)}
                              </span>
                              ${len > 1 ? `
                                <span style="display: inline-block; font-size: ${isPrint ? '7.5px' : '9px'}; font-weight: 700; color: ${color}; background: rgba(255,255,255,0.85); border: 0.5px solid ${color}50; border-radius: 2px; padding: 0.5px 2px; margin-top: 0.5px; font-family: monospace; white-space: nowrap;">
                                  ${escapeHtml(timeBadgeText)}
                                </span>
                              ` : ''}
                              ${not ? `
                                <span style="font-size: ${isPrint ? '7.5px' : '9px'}; font-weight: 500; color: #475569; display: block; overflow: hidden; text-overflow: ellipsis; white-space: ${len === 1 ? 'nowrap' : 'normal'}; word-break: break-word; max-width: 100%; margin-top: 0.5px; font-style: italic;">
                                  ${escapeHtml(not)}
                                </span>
                              ` : ''}
                            </div>
                          </td>
                        `;
                      } else {
                        return `
                          <td data-zaman-cell="true" data-gun="${g.key}" data-slot-idx="${slotIdx}" data-slot-end-idx="${slotIdx}"
                            style="padding: 0; border: 1px solid ${sItem.isHourStart ? '#cbd5e1' : '#e2e8f0'}; background: ${sItem.isHourStart ? '#ffffff' : '#fafafa'}; vertical-align: middle; cursor: ${!isPrint ? 'pointer' : 'default'}; height: ${rowHeight}px; box-sizing: border-box;">
                          </td>
                        `;
                      }
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${isPrint && this.cizelgeZamanHaftaSonuRapor ? `
          <div style="margin-top: 4px; padding: 3px 6px; border: 1px solid #cbd5e1; border-left: 3px solid #0284c7; background: #f8fafc; border-radius: 3px; font-size: 7.6px; line-height: 1.3; color: #0f172a;">
            <span style="font-weight: 800; text-transform: uppercase; letter-spacing: .2px; margin-right: 6px;">Hafta Sonu (Cmt–Paz):</span>
            ${[['Cmt', cmtBloklar], ['Paz', pazBloklar]].map(([ad, bloklar]) => `
              <span style="margin-right: 10px;">
                <strong>${ad}:</strong>
                ${bloklar.length === 0
                  ? 'plan girilmemiş'
                  : bloklar.map(b => `${b.saat} ${escapeHtml(b.label)}${b.not ? ' (' + escapeHtml(b.not) + ')' : ''}`).join(' · ')}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <!-- Alt Kısım -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid ${C.headerLine}; padding-top: 4px; font-size: ${isPrint ? '9px' : '9.5px'}; color: ${C.muted}; font-weight: 600;">
          <div>
            Haftalık toplam çalışma ve hedef blokları koç rehberliğinde düzenlenmiştir.
          </div>
          <div style="display: flex; align-items: center; gap: 24px;">
            ${isPrint ? `
              <span>Öğrenci İmzası: ____________________</span>
              <span>Koç Parafı: ____________________</span>
            ` : `<span style="color: ${C.faint};">Hafta sonu planı raporda ayrı bölüm olarak eklenir.</span>`}
          </div>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // ZAMAN BLOKLAMA — YENİ UYGULAMA ARAYÜZÜ (haftalık ızgara)
  // ─────────────────────────────────────────────────────────────
  renderZamanBlokAppUI(ogr) {
    const weekInfo = this.getZamanWeekInfo(this.zamanHaftaOffset);
    const plan = ogr ? Store.getZamanPlani(ogr.id) : {};
    const kategoriler = typeof ZAMAN_KATEGORILER !== 'undefined' ? ZAMAN_KATEGORILER : [];
    const slotlar = this.getZamanSlotlari ? this.getZamanSlotlari(ogr ? ogr.id : null) : [];
    const esc = (s) => this.escapeHtml(s);

    const now = new Date();
    const bugunStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const bugunKey = (() => {
      const d = weekInfo.gunDetaylari.find(g => g.fullDate === bugunStr);
      return d ? d.key : '';
    })();

    let doluHucre = 0;
    slotlar.forEach(s => {
      const hh = s.slotKey.split(':')[0];
      weekInfo.gunDetaylari.forEach(g => {
        if (plan[`${g.key}_${s.slotKey}`] || plan[`${g.key}_${hh}`]) doluHucre++;
      });
    });

    const hucre = (g, sItem, slotIdx) => {
      const hh = sItem.slotKey.split(':')[0];
      const c = plan[`${g.key}_${sItem.slotKey}`] || plan[`${g.key}_${hh}`] || null;
      const siniflar = [
        'zaman-cell',
        g.key === bugunKey ? 'is-today' : '',
        (g.key === 'cmt' || g.key === 'paz') ? 'is-weekend' : ''
      ].filter(Boolean).join(' ');
      const attr = `data-zaman-cell="true" data-gun="${g.key}" data-slot-idx="${slotIdx}" data-slot-end-idx="${slotIdx}"`;

      if (!c) {
        return `<td class="${siniflar} zaman-cell-empty" ${attr}><span class="zaman-plus">+</span></td>`;
      }
      const bg = c.bg || '#eff6ff';
      const renk = c.renk || '#2563eb';
      const label = c.label || '';
      const not = c.not || '';
      return `<td class="${siniflar} zaman-cell-full" ${attr}
        style="background:${bg}; border-left:3px solid ${renk};"
        title="${esc(label)}${not ? ' — ' + esc(not) : ''}">
        <div class="zaman-cell-inner">
          <span class="zaman-cell-label" style="color:${renk};">${esc(label)}</span>
          ${not ? `<span class="zaman-cell-note">${esc(not)}</span>` : ''}
        </div>
      </td>`;
    };

    return `
      <div class="zaman-app">
        <div class="zaman-app-head">
          <div>
            <div class="zaman-app-title">Haftalık Zaman Programı</div>
            <div class="zaman-app-sub">${ogr ? esc(ogr.adSoyad || '') : 'Öğrenci seçilmedi'} · ${weekInfo.rangeStr}</div>
          </div>
          <div class="zaman-app-stats">
            <span class="zaman-stat"><b>${doluHucre}</b> dolu hücre</span>
            <span class="zaman-stat"><b>${slotlar.length}</b> saat dilimi</span>
          </div>
        </div>

        <div class="zaman-legend">
          <span class="zaman-legend-title">Kategoriler</span>
          ${kategoriler.filter(c => c.id !== 'silgi').map(c => `
            <span class="zaman-chip"><i style="background:${c.bg}; border:1.5px solid ${c.renk};"></i>${c.label}</span>
          `).join('')}
        </div>

        <div class="zaman-grid-wrap">
          <table id="zaman-grid-table" class="zaman-grid">
            <thead>
              <tr>
                <th class="zaman-corner">Saat</th>
                ${weekInfo.gunDetaylari.map(g => `
                  <th class="${g.key === bugunKey ? 'is-today' : ''} ${(g.key === 'cmt' || g.key === 'paz') ? 'is-weekend' : ''}">
                    <div class="zaman-day">${g.ad}</div>
                    <div class="zaman-date">${g.tarihStr}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${slotlar.map((sItem, slotIdx) => `
                <tr class="${sItem.isHourStart ? 'is-hour' : ''}">
                  <td class="zaman-time-col ${sItem.isHourStart ? 'is-hour' : ''}">${sItem.startStr || sItem.label}</td>
                  ${weekInfo.gunDetaylari.map(g => hucre(g, sItem, slotIdx)).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="zaman-app-foot">
          <span>Hücrelere tıklayıp sürükleyerek faaliyet atayın · Sağ tık: sil</span>
          <span>${weekInfo.rangeStr}</span>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // KONU & SORU — YENİ UYGULAMA ARAYÜZÜ (tur bazlı D/Y/B/S ızgarası)
  // ─────────────────────────────────────────────────────────────
  renderKonuSoruAppUI(ogr, dersId = null) {
    const dersler = ogr ? Store.getDerslerForOgrenci(ogr) : Store.getDersler();
    const seciliDersId = dersId || this.cizelgeKonuSoruDersId || this.cizelgeDersId || (dersler[0] ? dersler[0].id : '');
    const seciliDers = dersler.find(d => String(d.id) === String(seciliDersId)) || dersler[0];
    const konular = seciliDers ? Store.getKonularForDers(seciliDers.id) : [];
    const turSayisi = this.konuSoruTurSayisi || 5;
    const mInfo = this.getKonuSoruMonthInfo(this.cizelgeKonuSoruAyOffset);
    const esc = (s) => this.escapeHtml(s);

    const TUR_RENKLERI = ['#eff6ff', '#f0fdf4', '#fefce8', '#fff7ed', '#fdf4ff'];
    const TUR_SUB_RENKLERI = ['#dbeafe', '#dcfce7', '#fef9c3', '#ffedd5', '#fae8ff'];

    let toplamD = 0, toplamY = 0, toplamB = 0, toplamS = 0;
    konular.forEach(k => {
      for (let t = 1; t <= turSayisi; t++) {
        const v = ogr ? Store.getKonuSoruVeri(ogr.id, k.id, t, mInfo.yilAyStr) : { d: 0, y: 0, b: 0, s: 0 };
        toplamD += Number(v.d) || 0;
        toplamY += Number(v.y) || 0;
        toplamB += Number(v.b) || 0;
        toplamS += Number(v.s) || 0;
      }
    });
    const cozulen = toplamD + toplamY + toplamB;
    const dogruluk = cozulen > 0 ? Math.round((toplamD / cozulen) * 100) : 0;

    const girdi = (konuId, turNo, alan, deger, sinif) => `<input type="text" inputmode="numeric"
      class="ks-input ${sinif}" value="${deger > 0 ? deger : ''}" placeholder="–"
      onchange="App.onKonuSoruHucreChange('${ogr ? ogr.id : ''}', '${konuId}', ${turNo}, '${mInfo.yilAyStr}', '${alan}', this.value)">`;

    return `
      <div class="ks-app">
        <div class="ks-head">
          <div>
            <div class="ks-title">Konu &amp; Soru Takibi</div>
            <div class="ks-sub">${ogr ? esc(ogr.adSoyad || '') : 'Öğrenci seçilmedi'} · ${esc(seciliDers ? seciliDers.ad : 'Ders')} · ${mInfo.ayAdi} ${mInfo.yil}</div>
          </div>
          <div class="ks-stats">
            <span class="ks-stat"><b>${cozulen}</b> soru</span>
            <span class="ks-stat"><b>%${dogruluk}</b> doğruluk</span>
            <span class="ks-stat"><b>${turSayisi}</b> tur</span>
          </div>
        </div>

        ${konular.length === 0 ? `
          <div class="ks-empty">Bu ders için tanımlı konu yok. <strong>Müfredat &amp; Dersler</strong> ekranından konu ekleyin.</div>
        ` : `
          <div class="ks-grid-wrap">
            <table id="konu-soru-grid-table" class="ks-grid">
              <colgroup>
                <col style="width: 40px;">
                <col style="width: 260px;">
                ${Array.from({ length: turSayisi * 4 }).map(() => '<col style="width: 38px;">').join('')}
              </colgroup>
              <thead>
                <tr>
                  <th rowspan="2" class="ks-corner">#</th>
                  <th rowspan="2" class="ks-konu-head">Konu / Kazanım</th>
                  ${Array.from({ length: turSayisi }, (_, i) => i + 1).map(t => `
                    <th colspan="4" class="ks-tur-head" style="background: ${TUR_RENKLERI[(t - 1) % TUR_RENKLERI.length]}; color: #0f172a;">${t}. Tur</th>
                  `).join('')}
                </tr>
                <tr>
                  ${Array.from({ length: turSayisi }, (_, i) => i + 1).map(t => {
                    const bg = TUR_SUB_RENKLERI[(t - 1) % TUR_SUB_RENKLERI.length];
                    return `<th class="ks-alt-head" style="background: ${bg};">D</th>
                            <th class="ks-alt-head" style="background: ${bg};">Y</th>
                            <th class="ks-alt-head" style="background: ${bg};">B</th>
                            <th class="ks-alt-head" style="background: ${bg};">S</th>`;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${konular.map((k, idx) => `
                  <tr>
                    <td class="ks-sira">${idx + 1}</td>
                    <td class="ks-konu" title="${esc(k.konuAdi)}">${esc(k.konuAdi)}</td>
                    ${Array.from({ length: turSayisi }, (_, i) => {
                      const t = i + 1;
                      const v = ogr ? Store.getKonuSoruVeri(ogr.id, k.id, t, mInfo.yilAyStr) : { d: 0, y: 0, b: 0, s: 0 };
                      return `<td class="ks-cell">${girdi(k.id, t, 'd', Number(v.d) || 0, 'is-d')}</td>
                              <td class="ks-cell">${girdi(k.id, t, 'y', Number(v.y) || 0, 'is-y')}</td>
                              <td class="ks-cell">${girdi(k.id, t, 'b', Number(v.b) || 0, 'is-b')}</td>
                              <td class="ks-cell">${girdi(k.id, t, 's', Number(v.s) || 0, 'is-s')}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}

        <div class="ks-foot">
          <span>D: Doğru · Y: Yanlış · B: Boş · S: Süre — alandan çıkınca otomatik kaydedilir</span>
          <span>${mInfo.ayAdi} ${mInfo.yil}</span>
        </div>
      </div>
    `;
  },

  // ─────────────────────────────────────────────────────────────
  // ŞABLON 6: ALIŞKANLIK ZİNCİRİ (HTML)
  // ─────────────────────────────────────────────────────────────
  renderCizelgeAliskanlikHTML(ogr, { isPrint = false } = {}) {
    const koc = Store.getKocProfili();
    const modul = ogr ? (typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === ogr.modulId) : null) : null;
    const mInfo = this.getAliskanlikMonthInfo(this.aliskanlikAyOffset);
    const aliskanliklar = ogr ? Store.getAliskanliklar(ogr.id) : Store.getDefaultAliskanliklar('lgs');

    const kocNotu = (ogr && ogr.id) ? Store.getAliskanlikNot(ogr.id, mInfo.yilAyStr) : '';
    const escapeHtml = (str) => this.escapeHtml(str);

    const habitScores = [];
    const habitRowHeight = isPrint ? 42 : 38;

    return `
      <div class="print-page-yatay" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #ffffff; font-size: 0.75rem; line-height: 1.3; box-sizing: border-box; width: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <!-- Üst Başlık + Tablo -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="text-align: left;">
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase;">${koc.ad} ${koc.soyad}</div>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">${koc.unvan || 'Eğitim Koçu'} • ${koc.kurum || 'Plantrack Koçluk'}</div>
            </div>

            <div style="text-align: center;">
              <h1 style="font-size: 17px; font-weight: 800; letter-spacing: 1.5px; margin: 0; color: #0f172a; text-transform: uppercase;">ALIŞKANLIK ZİNCİRİ</h1>
              <div style="font-size: 11px; color: #475569; margin-top: 2px; font-family: monospace; font-weight: 600;">
                ${mInfo.ayAdi} ${mInfo.yil} • Zinciri Kırma Takip Tablosu
              </div>
            </div>

            <div style="text-align: right;">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600;">Öğrenci</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a;">${ogr ? (ogr.adSoyad || `${ogr.ad} ${ogr.soyad}`) : '—'}</div>
              <div style="font-size: 11px; color: #475569;">${ogr && ogr.sinif ? `${ogr.sinif}. Sınıf` : ''} ${modul ? `• ${modul.ad}` : ''}</div>
            </div>
          </div>

          <!-- Alışkanlık Tablosu -->
          <table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 12px; font-size: inherit;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff; border-bottom: 2px solid #0f172a;">
                <th style="width: 195px; padding: 7px 8px; border: 1px solid #334155; text-align: left; font-size: 11.5px; font-weight: 700; color: #ffffff;">
                  Alışkanlık Hedefi
                </th>
                ${mInfo.gunler.map(g => `
                  <th style="width: 23px; padding: 4px 1px; border: 1px solid #334155; text-align: center; background: ${g.isHaftasonu ? '#334155' : '#1e293b'};">
                    <div style="font-weight: 700; color: #ffffff; font-size: 10px;">${g.gun}</div>
                    <div style="font-size: 8px; color: #cbd5e1; font-family: monospace;">${g.gunKisa}</div>
                  </th>
                `).join('')}
                <th style="width: 60px; padding: 4px; border: 1px solid #334155; text-align: center; font-size: 10.5px; font-weight: 700; color: #ffffff;">
                  Başarı
                </th>
              </tr>
            </thead>
            <tbody>
              ${aliskanliklar.map((al, alIdx) => {
                const cHex = this.getAliskanlikColorHex(al.renk);
                let doneCount = 0;

                const cellsHtml = mInfo.gunler.map(g => {
                  const isDone = (ogr && ogr.id) ? Store.getAliskanlikDurum(ogr.id, al.id, g.tarihStr) : false;
                  if (isDone) doneCount++;

                  return `
                    <td onclick="${!isPrint && ogr && ogr.id ? `App.toggleAliskanlikCell('${ogr.id}', '${al.id}', '${g.tarihStr}')` : ''}"
                      style="padding: 0; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; height: ${habitRowHeight}px; background: ${isDone ? cHex.bg : (g.isHaftasonu ? '#f8fafc' : '#ffffff')}; cursor: ${!isPrint ? 'pointer' : 'default'};"
                      title="${g.gun} ${mInfo.ayAdi} • Tıklayarak tamamlandı işaretleyin">
                      ${isDone ? `
                        <span style="font-weight: 800; color: ${cHex.renk}; font-size: 14px; line-height: 1;">✓</span>
                      ` : ''}
                    </td>
                  `;
                }).join('');

                const aySonuKaydi = (ogr && ogr.id) ? Store.getAliskanlikAySonu(ogr.id, al.id, mInfo.yilAyStr) : null;
                const effectiveDone = (aySonuKaydi && aySonuKaydi.gun !== undefined && aySonuKaydi.gun !== null && aySonuKaydi.gun !== '') 
                  ? Number(aySonuKaydi.gun) 
                  : doneCount;

                const yuzde = Math.round((effectiveDone / mInfo.daysCount) * 100);
                habitScores.push({ 
                  aliskanlikId: al.id, 
                  baslik: al.baslik, 
                  doneCount: effectiveDone, 
                  daysCount: mInfo.daysCount, 
                  yuzde, 
                  cHex, 
                  aySonuKaydi 
                });

                return `
                  <tr style="height: ${habitRowHeight}px;">
                    <td style="padding: 3px 6px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a; vertical-align: middle;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${cHex.renk}; flex-shrink: 0;"></span>
                        <span style="flex: 1 1 auto; min-width: 0; font-size: ${al.baslik && al.baslik.length > 34 ? '9px' : (al.baslik && al.baslik.length > 26 ? '10px' : '11px')}; line-height: 1.1; white-space: normal; word-break: break-word; overflow-wrap: anywhere; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;" title="${escapeHtml(al.baslik)}">${escapeHtml(al.baslik)}</span>
                      </div>
                    </td>
                    ${cellsHtml}
                    <td style="padding: 4px; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; font-family: monospace; font-weight: 800; font-size: 11.5px; color: ${yuzde >= 70 ? '#15803d' : '#b45309'}; background: #f8fafc;">
                      %${yuzde}
                    </td>
                  </tr>
                `;
              }).join('')}

              <!-- 7. Satır: Koç Notları / Gözlemler -->
              <tr style="height: 62px; background: #f8fafc;">
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 800; color: #334155; font-size: 10.5px; vertical-align: middle;">
                  Koç Notları & Aylık Değerlendirme
                </td>
                <td colspan="${mInfo.daysCount + 1}" style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: middle; color: #475569; font-size: 10px;">
                  ${!isPrint ? `
                    <textarea 
                      oninput="App.onAliskanlikNotChange('${ogr ? ogr.id : ''}', '${mInfo.yilAyStr}', this.value)"
                      placeholder="Ay sonu genel değerlendirmesi ve koç notu..."
                      style="width: 100%; min-height: 42px; max-height: 58px; font-size: 10px; color: #1e293b; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; resize: vertical; box-sizing: border-box; background: #ffffff; font-family: inherit; line-height: 1.3;"
                    >${escapeHtml(kocNotu)}</textarea>
                  ` : `
                    ${kocNotu ? `<div style="font-size: 10px; color: #1e293b; white-space: pre-wrap;">${escapeHtml(kocNotu)}</div>` : `
                      <div style="border-bottom: 1px dashed #94a3b8; height: 18px; margin-bottom: 6px;"></div>
                      <div style="border-bottom: 1px dashed #94a3b8; height: 18px;"></div>
                    `}
                  `}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Alt Bölüm: Ay Sonu Skor Kartları (6 Alışkanlık İçin) + Alt Onaylar -->
        <div>
          <div style="margin-bottom: 10px;">
            ${!isPrint ? `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 5px 10px; background: #f8fafc; border-radius: 5px; border: 1px solid #cbd5e1;">
                <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">
                  <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 3px; background: #2563eb; color: #ffffff; font-size: 9.5px; font-weight: 800;">✓</span>
                  <span>AY SONU ÖĞRENCİ VERİ GİRİŞİ (${mInfo.ayAdi} ${mInfo.yil})</span>
                  <span style="font-size: 9.5px; font-weight: 400; color: #64748b;">— Öğrencinin getirdiği tamamlanan gün sayısını giriniz; otomatik saklanır ve tabloya işlenir.</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button type="button" onclick="App.clearAliskanlikAySonu('${ogr ? ogr.id : ''}', '${mInfo.yilAyStr}')" class="text-[10px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors" title="Bu ayın verilerini sıfırla">
                    Değerleri Sıfırla
                  </button>
                </div>
              </div>
            ` : `
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; margin-bottom: 6px;">
                AY SONU ALIŞKANLIK PERFORMANS ÖZETİ (${mInfo.ayAdi} ${mInfo.yil})
              </div>
            `}

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
              ${habitScores.map((h, i) => `
                <div style="padding: 8px 10px; border: 1px solid #cbd5e1; border-left: 4px solid ${h.cHex.renk}; border-radius: 5px; background: #f8fafc; font-size: 10px; display: flex; flex-direction: column; justify-content: space-between; min-height: 68px;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <div style="font-weight: 700; color: #0f172a; font-size: 9.5px; line-height: 1.12; flex: 1 1 auto; min-width: 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden;" title="${escapeHtml(h.baslik)}">
                      #${i + 1} ${escapeHtml(h.baslik)}
                    </div>
                    <span style="font-weight: 800; font-family: monospace; font-size: 11px; color: ${h.yuzde >= 70 ? '#15803d' : '#b45309'}; background: ${h.yuzde >= 70 ? '#dcfce7' : '#fef3c7'}; padding: 1px 6px; border-radius: 3px;">
                      %${h.yuzde}
                    </span>
                  </div>

                  <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-bottom: 5px;">
                    <div style="width: ${Math.min(100, h.yuzde)}%; height: 100%; background: ${h.cHex.renk};"></div>
                  </div>

                  ${!isPrint ? `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <input 
                          type="number" 
                          min="0" 
                          max="${h.daysCount}" 
                          value="${h.doneCount > 0 ? h.doneCount : ''}" 
                          placeholder="0"
                          onchange="App.onAliskanlikAySonuGunChange('${ogr ? ogr.id : ''}', '${h.aliskanlikId}', '${mInfo.yilAyStr}', this.value, ${h.daysCount})"
                          style="width: 44px; height: 24px; padding: 1px 4px; font-size: 11.5px; font-weight: 700; text-align: center; border: 1.5px solid #cbd5e1; border-radius: 4px; background: #ffffff; color: #0f172a; font-family: monospace; outline: none;"
                          onfocus="this.style.borderColor='#2563eb'"
                          onblur="this.style.borderColor='#cbd5e1'"
                          title="Öğrencinin getirdiği tamamlanan gün sayısı"
                        />
                        <span style="color: #64748b; font-weight: 600; font-size: 9.5px; font-family: monospace;">/ ${h.daysCount} Gün</span>
                      </div>

                      <input 
                        type="text" 
                        placeholder="Not / Soru..." 
                        value="${escapeHtml(h.aySonuKaydi && h.aySonuKaydi.not ? h.aySonuKaydi.not : '')}"
                        onchange="App.onAliskanlikAySonuNotChange('${ogr ? ogr.id : ''}', '${h.aliskanlikId}', '${mInfo.yilAyStr}', this.value)"
                        style="flex: 1; height: 24px; font-size: 9.5px; padding: 1px 5px; border: 1px dashed #cbd5e1; border-radius: 3px; background: #ffffff; color: #334155; outline: none;"
                        title="İsteğe bağlı ek not veya çözülen soru sayısı"
                      />
                    </div>
                  ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; font-family: monospace;">
                      <span style="color: #334155; font-weight: 700;">
                        ${h.doneCount > 0 ? `${h.doneCount} / ${h.daysCount} gün tamamlandı` : `[ &nbsp; &nbsp; ] / ${h.daysCount} gün tamamlandı`}
                      </span>
                      ${h.aySonuKaydi && h.aySonuKaydi.not ? `<span style="color: #64748b; font-size: 9px; font-weight: 500;">(${escapeHtml(h.aySonuKaydi.not)})</span>` : ''}
                    </div>
                  `}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Alt Onaylar -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #0f172a; padding-top: 6px; font-size: 10px; color: #475569; font-weight: 600;">
            <div>
              Zinciri kırma yöntemiyle günlük süreklilik esastır. Her gün bir halkadır.
            </div>
            <div style="display: flex; align-items: center; gap: 24px;">
              <span>Öğrenci İmzası: ____________________</span>
              <span>Koç İmzası: ____________________</span>
            </div>
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
          ${notlar.length > 0 ? `
            <button onclick="App.openSinavNotuModal()" class="btn-tactile btn-tactile-ghost text-xs py-1 px-3 mt-3 inline-flex items-center gap-1.5 text-[var(--color-accent)]">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Bu Derse Sınav Notu Ekle</span>
            </button>
          ` : ''}
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

  // ─────────────────────────────────────────────────────────────
  // PROMPT 8: İLK KURULUM SİHİRBAZI & KOÇ AYARLARI
  // ─────────────────────────────────────────────────────────────
  wizardState: {
    adim: 1,
    veri: {
      kocAd: '',
      kocSoyad: '',
      kocUnvan: 'Koç',
      kocKurum: '',
      kocTel: '',
      ogrAd: '',
      ogrSoyad: '',
      ogrSinif: '8',
      ogrOkul: '',
      ogrRenk: 'teal',
      modulId: 'lgs',
      ogretimYili: '2025-2026'
    }
  },

  showSetupWizard() {
    const wizardEl = document.getElementById('setup-wizard');
    if (!wizardEl) return;

    const koc = Store.getKocProfili();
    this.wizardState.adim = 1;
    this.wizardState.veri.kocAd = koc.ad || '';
    this.wizardState.veri.kocSoyad = koc.soyad || '';
    this.wizardState.veri.kocUnvan = koc.unvan || 'Koç';
    this.wizardState.veri.kocKurum = koc.kurum || '';
    this.wizardState.veri.kocTel = koc.telefon || '';
    this.wizardState.veri.ogretimYili = Store.data.ogretimYili || '2025-2026';

    wizardEl.classList.remove('hidden');
    wizardEl.classList.add('flex');
    this.wizardRenderAdim(1);
  },

  wizardRenderAdim(adim) {
    this.wizardState.adim = adim;
    const body = document.getElementById('wizard-body');
    const progressBar = document.getElementById('wizard-progress-bar');
    const btnBack = document.getElementById('wizard-btn-back');
    const btnNext = document.getElementById('wizard-btn-next');
    const dotsContainer = document.getElementById('wizard-dots');

    if (!body || !progressBar || !btnBack || !btnNext || !dotsContainer) return;

    // İlerleme çubuğu
    progressBar.style.width = `${adim * 25}%`;

    // Geri butonu
    if (adim === 1) {
      btnBack.classList.add('hidden');
    } else {
      btnBack.classList.remove('hidden');
    }

    // Devam / Başla butonu
    if (adim === 4) {
      btnNext.innerHTML = '<span>Başla!</span> <i data-lucide="sparkles" class="w-4 h-4 inline ml-1"></i>';
      btnNext.className = 'btn-tactile btn-tactile-primary text-xs py-2 px-6 font-bold shadow-md bg-[var(--color-accent)] text-white hover:opacity-90';
    } else {
      btnNext.innerHTML = '<span>Devam Et</span> <i data-lucide="arrow-right" class="w-4 h-4 inline ml-1"></i>';
      btnNext.className = 'btn-tactile btn-tactile-primary text-xs py-2 px-5 font-semibold';
    }

    // Adım noktaları
    dotsContainer.innerHTML = [1, 2, 3, 4].map(i => {
      const isActive = i === adim;
      return `<div class="transition-all duration-200 ${isActive ? 'w-6 h-1.5 bg-[var(--color-accent)] rounded-full' : 'w-1.5 h-1.5 rounded-full bg-[var(--color-paper-4)]'}"></div>`;
    }).join('');

    const v = this.wizardState.veri;

    // ADIM 1: KOÇ BİLGİLERİ
    if (adim === 1) {
      body.innerHTML = `
        <div class="space-y-5">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
              <span>Adım 1 / 4</span>
            </div>
            <h2 class="text-xl font-display font-bold text-[var(--color-ink)]">Plantrack'e Hoş Geldiniz</h2>
            <p class="text-xs text-[var(--color-ink-muted)]">Raporlarda, haftalık çalışma planlarında ve A4 çıktılarda yer alacak bilgilerinizi girin.</p>
          </div>

          <div class="space-y-3.5 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Adınız <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="wizard-koc-ad" value="${v.kocAd || ''}" required class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Eren">
              </div>
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Soyadınız <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="wizard-koc-soyad" value="${v.kocSoyad || ''}" required class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Kaya">
              </div>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Unvan</label>
              <select id="wizard-koc-unvan" class="select-instrument w-full p-2.5">
                <option value="Koç" ${v.kocUnvan === 'Koç' ? 'selected' : ''}>Koç</option>
                <option value="Eğitim Danışmanı" ${v.kocUnvan === 'Eğitim Danışmanı' ? 'selected' : ''}>Eğitim Danışmanı</option>
                <option value="Öğretmen" ${v.kocUnvan === 'Öğretmen' ? 'selected' : ''}>Öğretmen</option>
                <option value="Veli" ${v.kocUnvan === 'Veli' ? 'selected' : ''}>Veli</option>
              </select>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Kurum / Okul (Opsiyonel)</label>
              <input type="text" id="wizard-koc-kurum" value="${v.kocKurum || ''}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Plantrack Akademi">
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">İletişim / Telefon (Opsiyonel)</label>
              <input type="tel" id="wizard-koc-tel" value="${v.kocTel || ''}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="05XX XXX XX XX">
            </div>
          </div>
        </div>
      `;
    }

    // ADIM 2: İLK ÖĞRENCİYİ EKLE
    else if (adim === 2) {
      const siniflar = typeof SINIFLAR !== 'undefined' ? SINIFLAR : [];
      const renkler = ['teal', 'blue', 'indigo', 'rose', 'amber', 'emerald'];
      const seciliSinifObj = siniflar.find(s => String(s.deger) === String(v.ogrSinif)) || siniflar[0];
      const seciliModul = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === (seciliSinifObj ? seciliSinifObj.modulId : 'lgs')) : null;

      body.innerHTML = `
        <div class="space-y-5">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
              <span>Adım 2 / 4</span>
            </div>
            <h2 class="text-xl font-display font-bold text-[var(--color-ink)]">İlk Öğrenciyi Ekleyelim</h2>
            <p class="text-xs text-[var(--color-ink-muted)]">Takibini yapacağınız ilk öğrenciyi tanımlayın. Daha sonra dilediğiniz kadar öğrenci ekleyebilirsiniz.</p>
          </div>

          <div class="space-y-3.5 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Öğrenci Adı <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="wizard-ogr-ad" value="${v.ogrAd || ''}" required class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Caner">
              </div>
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Öğrenci Soyadı <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="wizard-ogr-soyad" value="${v.ogrSoyad || ''}" required class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Yılmaz">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Sınıf / Kademe</label>
                <select id="wizard-ogr-sinif" onchange="App.onWizardSinifChange(this.value)" class="select-instrument w-full p-2.5">
                  ${siniflar.map(s => `
                    <option value="${s.deger}" ${String(s.deger) === String(v.ogrSinif) ? 'selected' : ''}>
                      ${s.label}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Okul (Opsiyonel)</label>
                <input type="text" id="wizard-ogr-okul" value="${v.ogrOkul || ''}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Atatürk Ortaokulu">
              </div>
            </div>

            <!-- Modül Rozeti Önizleme -->
            <div class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center justify-between">
              <span class="text-[11px] text-[var(--color-ink-muted)]">Otomatik Atanan Eğitim Modülü:</span>
              <span id="wizard-modul-badge" class="meta-pill font-mono font-semibold text-[var(--color-accent)]">
                ${seciliModul ? seciliModul.ad : 'LGS'}
              </span>
            </div>

            <!-- Avatar Renk Seçici -->
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1.5">Avatar Teması</label>
              <div class="flex items-center gap-2">
                ${renkler.map(r => `
                  <label class="cursor-pointer">
                    <input type="radio" name="wizard-renk" value="${r}" class="sr-only peer" ${v.ogrRenk === r ? 'checked' : ''} onchange="App.wizardState.veri.ogrRenk = '${r}'">
                    <div class="w-7 h-7 rounded-full bg-${r}-500 border-2 border-transparent peer-checked:border-[var(--color-ink)] transition-all"></div>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ADIM 3: ÖĞRETİM YILI & MODÜL
    else if (adim === 3) {
      const yillar = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];
      const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];

      body.innerHTML = `
        <div class="space-y-5">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
              <span>Adım 3 / 4</span>
            </div>
            <h2 class="text-xl font-display font-bold text-[var(--color-ink)]">Öğretim Yılını ve Modülü Seçin</h2>
            <p class="text-xs text-[var(--color-ink-muted)]">Platformun varsayılan çalışma dönemini ve başlangıç modülünü belirleyin.</p>
          </div>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Öğretim Yılı</label>
              <select id="wizard-yil" onchange="App.wizardState.veri.ogretimYili = this.value" class="select-instrument w-full p-2.5">
                ${yillar.map(y => `
                  <option value="${y}" ${v.ogretimYili === y ? 'selected' : ''}>${y} Eğitim-Öğretim Yılı</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-2">Başlangıç Aktif Modülü</label>
              <div class="grid grid-cols-1 gap-2.5">
                ${moduller.map(m => {
                  const isSelected = v.modulId === m.id;
                  return `
                    <div onclick="App.wizardState.veri.modulId = '${m.id}'; App.wizardRenderAdim(3);" class="p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)] hover:border-[var(--color-rule-strong)]'}">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-[var(--radius-sm)] ${isSelected ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-paper-4)] text-[var(--color-ink-muted)]'} flex items-center justify-center font-bold text-xs font-mono">
                          ${m.kod || m.id.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div class="font-display font-bold text-xs text-[var(--color-ink)]">${m.ad}</div>
                          <div class="text-[10px] text-[var(--color-ink-faint)]">${m.aciklama || ''}</div>
                        </div>
                      </div>
                      ${isSelected ? '<i data-lucide="check-circle-2" class="w-4 h-4 text-[var(--color-accent)]"></i>' : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // ADIM 4: HAZIR & ÖZET
    else if (adim === 4) {
      const modul = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === v.modulId) : null;
      const sinifObj = typeof SINIFLAR !== 'undefined' ? SINIFLAR.find(s => String(s.deger) === String(v.ogrSinif)) : null;

      body.innerHTML = `
        <div class="space-y-5">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] uppercase tracking-wider font-mono">
              <span>Adım 4 / 4 • Tamamlandı</span>
            </div>
            <h2 class="text-xl font-display font-bold text-[var(--color-ink)]">Her Şey Hazır!</h2>
            <p class="text-xs text-[var(--color-ink-muted)]">Girdiğiniz bilgiler başarıyla hazırlandı. Bu ayarları dilediğiniz zaman sol alttaki profil panelinden güncelleyebilirsiniz.</p>
          </div>

          <div class="p-4 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-3 text-xs">
            <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
              <span class="text-[var(--color-ink-muted)]">Danışman / Koç:</span>
              <strong class="text-[var(--color-ink)] font-semibold">${v.kocAd} ${v.kocSoyad} (${v.kocUnvan || 'Koç'})</strong>
            </div>

            <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
              <span class="text-[var(--color-ink-muted)]">Kurum / Organizasyon:</span>
              <span class="text-[var(--color-ink)]">${v.kocKurum || 'Bireysel Koçluk'}</span>
            </div>

            <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
              <span class="text-[var(--color-ink-muted)]">İlk Kayıtlı Öğrenci:</span>
              <strong class="text-[var(--color-ink)] font-semibold">${v.ogrAd} ${v.ogrSoyad} (${sinifObj ? sinifObj.label : `${v.ogrSinif}. Sınıf`})</strong>
            </div>

            <div class="flex items-center justify-between pb-2 border-b border-[var(--color-rule)]">
              <span class="text-[var(--color-ink-muted)]">Eğitim Kademesi / Modül:</span>
              <span class="meta-pill text-[10px] font-mono text-[var(--color-accent)] font-semibold">${modul ? modul.ad : v.modulId}</span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-[var(--color-ink-muted)]">Öğretim Yılı:</span>
              <span class="font-mono text-[var(--color-ink)]">${v.ogretimYili}</span>
            </div>
          </div>

          <div class="p-3 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shrink-0">
              <i data-lucide="check" class="w-4 h-4"></i>
            </div>
            <div class="text-[11px] text-[var(--color-ink-muted)]">
              MEB ve ÖSYM müfredat ders havuzu, A4 çalışma çizelgeleri ve öğrenci takip kokpiti hazır hale getirildi.
            </div>
          </div>
        </div>
      `;
    }

    if (window.lucide) lucide.createIcons();
  },

  onWizardSinifChange(sinifId) {
    this.wizardState.veri.ogrSinif = sinifId;
    const siniflar = typeof SINIFLAR !== 'undefined' ? SINIFLAR : [];
    const sObj = siniflar.find(s => String(s.deger) === String(sinifId));
    if (sObj && sObj.modulId) {
      this.wizardState.veri.modulId = sObj.modulId;
      const mod = typeof MODULLER !== 'undefined' ? MODULLER.find(m => m.id === sObj.modulId) : null;
      const badge = document.getElementById('wizard-modul-badge');
      if (badge && mod) {
        badge.textContent = mod.ad;
      }
    }
  },

  wizardIleri() {
    const adim = this.wizardState.adim;

    if (adim === 1) {
      const ad = document.getElementById('wizard-koc-ad')?.value.trim() || '';
      const soyad = document.getElementById('wizard-koc-soyad')?.value.trim() || '';
      const unvan = document.getElementById('wizard-koc-unvan')?.value || 'Koç';
      const kurum = document.getElementById('wizard-koc-kurum')?.value.trim() || '';
      const tel = document.getElementById('wizard-koc-tel')?.value.trim() || '';

      if (!ad || !soyad) {
        this.showToast('Lütfen ad ve soyadınızı girin.');
        return;
      }

      this.wizardState.veri.kocAd = ad;
      this.wizardState.veri.kocSoyad = soyad;
      this.wizardState.veri.kocUnvan = unvan;
      this.wizardState.veri.kocKurum = kurum;
      this.wizardState.veri.kocTel = tel;
      this.wizardRenderAdim(2);
    } else if (adim === 2) {
      const ad = document.getElementById('wizard-ogr-ad')?.value.trim() || '';
      const soyad = document.getElementById('wizard-ogr-soyad')?.value.trim() || '';
      const sinif = document.getElementById('wizard-ogr-sinif')?.value || '8';
      const okul = document.getElementById('wizard-ogr-okul')?.value.trim() || '';

      if (!ad || !soyad) {
        this.showToast('Lütfen öğrenci ad ve soyadını girin.');
        return;
      }

      this.wizardState.veri.ogrAd = ad;
      this.wizardState.veri.ogrSoyad = soyad;
      this.wizardState.veri.ogrSinif = sinif;
      this.wizardState.veri.ogrOkul = okul;
      this.wizardRenderAdim(3);
    } else if (adim === 3) {
      const yil = document.getElementById('wizard-yil')?.value || '2025-2026';
      this.wizardState.veri.ogretimYili = yil;
      this.wizardRenderAdim(4);
    } else if (adim === 4) {
      this.wizardTamamla();
    }
  },

  wizardGeri() {
    if (this.wizardState.adim > 1) {
      this.wizardRenderAdim(this.wizardState.adim - 1);
    }
  },

  wizardTamamla() {
    const v = this.wizardState.veri;

    // 1. Koç Profilini Güncelle
    const ad = (v.kocAd || '').trim();
    const soyad = (v.kocSoyad || '').trim();
    Store.data.kocProfili = {
      ad,
      soyad,
      unvan: v.kocUnvan || 'Eğitim Koçu',
      kurum: (v.kocKurum || '').trim(),
      telefon: (v.kocTel || '').trim(),
      gunlukHedefSoru: 100,
      avatarKisa: ((ad[0] || '') + (soyad[0] || '')).toUpperCase() || 'KD'
    };

    // 2. Öğretim Yılı ve Modülü Güncelle
    Store.data.ogretimYili = v.ogretimYili || '2025-2026';
    Store.data.aktifModulId = v.modulId || 'lgs';

    // 3. İlk Öğrenciyi Ekle
    const yeniOgr = Store.addOgrenci({
      ad: v.ogrAd,
      soyad: v.ogrSoyad,
      sinif: v.ogrSinif,
      okul: v.ogrOkul,
      renk: v.ogrRenk || 'teal',
      modulId: v.modulId || 'lgs'
    });

    // 4. Öğrenciyi Aktif Yap
    Store.setAktifOgrenci(yeniOgr.id);

    // 5. Kurulumu Tamamla ve Kaydet
    Store.data.kurulumTamamlandi = true;
    Store.save();

    // 6. Sihirbazı Gizle
    const wizardEl = document.getElementById('setup-wizard');
    if (wizardEl) {
      wizardEl.classList.add('hidden');
      wizardEl.classList.remove('flex');
    }

    // 7. Arayüzü Başlat
    this.populateStudentDropdown();
    this.updateSidebarCoachInfo();
    this.navigateTo('overview');
    this.showToast('Hoş geldiniz! Plantrack hazır.');
  },

  // ─────────────────────────────────────────────────────────────
  // KOÇ AYARLARI MODALI (3 Sekmeli)
  // ─────────────────────────────────────────────────────────────
  coachSettingsTab: 'profil', // 'profil' | 'app' | 'data' | 'mcp'
  mcpSettingsPlatform: 'mac', // 'mac' | 'win'
  updateKaynakTipi: 'local', // 'local' | 'github'

  setMcpPlatform(platform) {
    this.mcpSettingsPlatform = platform;
    this.openCoachSettingsModal('mcp');
  },

  openCoachSettingsModal(initialTab = 'profil') {
    this.coachSettingsTab = initialTab;
    const koc = Store.getKocProfili();
    const ogretimYili = Store.data.ogretimYili || '2025-2026';
    const aktifModulId = Store.data.aktifModulId || 'ara-sinif';
    const moduller = typeof MODULLER !== 'undefined' ? MODULLER : [];
    const yillar = ['2023-2024', '2024-2025', '2025-2026', '2026-2027'];

    const container = document.getElementById('modal-container');
    if (container) {
      container.className = 'bg-[var(--color-paper-2)] border border-[var(--color-rule-strong)] rounded-[var(--radius-lg)] max-w-2xl w-full overflow-hidden shadow-2xl';
    }

    const renderTabContent = (tab) => {
      if (tab === 'profil') {
        return `
          <form id="form-coach-profile" class="space-y-3.5 text-xs pt-2">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Ad <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="settings-koc-ad" value="${koc.ad || ''}" required class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
              </div>
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Soyad <span class="text-[var(--color-danger)]">*</span></label>
                <input type="text" id="settings-koc-soyad" value="${koc.soyad || ''}" required class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]">
              </div>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Unvan</label>
              <input type="text" id="settings-koc-unvan" value="${koc.unvan || ''}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Eğitim Koçu & Danışman">
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Kurum / Organizasyon</label>
              <input type="text" id="settings-koc-kurum" value="${koc.kurum || ''}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="Örn: Plantrack Koçluk">
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Telefon / İletişim</label>
              <input type="tel" id="settings-koc-tel" value="${koc.telefon || ''}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)]" placeholder="05XX XXX XX XX">
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
              <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
              <button type="submit" class="btn-tactile btn-tactile-primary">Profili Kaydet</button>
            </div>
          </form>
        `;
      } else if (tab === 'app') {
        return `
          <form id="form-coach-app" class="space-y-4 text-xs pt-2">
            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Aktif Öğretim Yılı</label>
              <select id="settings-ogretim-yili" class="select-instrument w-full p-2.5">
                ${yillar.map(y => `
                  <option value="${y}" ${ogretimYili === y ? 'selected' : ''}>${y} Eğitim-Öğretim Yılı</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-2">Varsayılan Eğitim Modülü</label>
              <div class="grid grid-cols-1 gap-2">
                ${moduller.map(m => {
                  const isSelected = aktifModulId === m.id;
                  return `
                    <label class="p-3 rounded-[var(--radius-md)] border cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'bg-[var(--color-paper-3)] border-[var(--color-accent)]' : 'bg-[var(--color-paper-2)] border-[var(--color-rule)]'}">
                      <div class="flex items-center gap-2.5">
                        <input type="radio" name="settings-modul" value="${m.id}" ${isSelected ? 'checked' : ''} class="text-[var(--color-accent)] focus:ring-0">
                        <div>
                          <div class="font-display font-bold text-xs text-[var(--color-ink)]">${m.ad}</div>
                          <div class="text-[10px] text-[var(--color-ink-muted)]">${m.aciklama || ''}</div>
                        </div>
                      </div>
                      <span class="meta-pill text-[10px] font-mono">${m.kod || m.id}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Varsayılan Günlük Hedef Soru (Genel)</label>
              <input type="number" id="settings-hedef-soru" min="0" value="${koc.gunlukHedefSoru || 100}" class="w-full p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-bold">
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-rule)]">
              <button type="button" onclick="App.closeModal()" class="btn-tactile btn-tactile-ghost">Vazgeç</button>
              <button type="submit" class="btn-tactile btn-tactile-primary">Ayarları Kaydet</button>
            </div>
          </form>

          <!-- Uygulama Güncelleme -->
          <div class="mt-5 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h4 class="font-display font-bold text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-[var(--color-accent)]"></i>
                  <span>Programı Güncelle</span>
                </h4>
                <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5 leading-snug">
                  Yeni sürümü yerel proje klasöründen çeker ve arayüzü anında yeniler. Yeniden derleme (dmg/pkg) gerekmez.
                </p>
              </div>
              <span id="guncelleme-surum" class="meta-pill text-[10px] font-mono shrink-0">v—</span>
            </div>

            <div>
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Güncelleme Kaynağı</label>
              <div class="flex items-center w-fit p-0.5 rounded-[var(--radius-xs)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
                <button type="button" onclick="App.setUpdateKaynakTipi('local')" class="px-2.5 py-1 rounded-[var(--radius-xs)] text-[11px] font-semibold transition-all ${this.updateKaynakTipi !== 'github' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                  Yerel Klasör
                </button>
                <button type="button" onclick="App.setUpdateKaynakTipi('github')" class="px-2.5 py-1 rounded-[var(--radius-xs)] text-[11px] font-semibold transition-all ${this.updateKaynakTipi === 'github' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                  GitHub
                </button>
              </div>
            </div>

            <div id="guncelleme-yerel-alan" class="${this.updateKaynakTipi === 'github' ? 'hidden' : ''}">
              <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Kaynak Klasör (Plantrack proje kökü)</label>
              <input type="text" id="guncelleme-kaynak" placeholder="/Users/.../Plantrack"
                class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]">
              <p class="text-[10px] text-[var(--color-ink-faint)] mt-1">index.html ve app.js barındıran klasör. Bir kez girin, hatırlanır.</p>
            </div>

            <div id="guncelleme-github-alan" class="${this.updateKaynakTipi === 'github' ? '' : 'hidden'} space-y-2">
              <div>
                <label class="block font-medium text-[var(--color-ink-faint)] mb-1">GitHub Deposu</label>
                <input type="text" id="guncelleme-repo" placeholder="kullanici/plantrack"
                  class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]">
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Dal (branch)</label>
                  <input type="text" id="guncelleme-branch" value="main"
                    class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]">
                </div>
                <div>
                  <label class="block font-medium text-[var(--color-ink-faint)] mb-1">Token (private ise)</label>
                  <input type="password" id="guncelleme-token" placeholder="opsiyonel"
                    class="w-full p-2 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] font-mono text-[11px]">
                </div>
              </div>
              <p class="text-[10px] text-[var(--color-ink-faint)]">Depo public ise token gerekmez. GitHub zip'i indirilir, yeni sürüm uygulanır.</p>
            </div>

            <div class="flex items-center justify-between gap-2">
              <button type="button" onclick="App.updateCheck()" class="btn-tactile btn-tactile-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                <i data-lucide="search" class="w-3.5 h-3.5"></i>
                <span>Değişiklikleri Kontrol Et</span>
              </button>
              <button type="button" id="guncelleme-buton" onclick="App.updateApply()" class="btn-tactile btn-tactile-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Programı Güncelle</span>
              </button>
            </div>

            <p id="guncelleme-durum" class="text-[11px] text-[var(--color-ink-muted)] min-h-[14px]"></p>
          </div>
        `;
      } else if (tab === 'data') {
        return `
          <div class="space-y-4 text-xs pt-2">
            <!-- 1. Yedek İndir -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-between gap-3">
              <div>
                <h4 class="font-display font-bold text-xs text-[var(--color-ink)]">Tüm Verileri JSON Olarak İndir</h4>
                <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Tüm öğrencileri, ödev geçmişini, sınav notlarını ve konu durumlarını dosya olarak kaydedin.</p>
              </div>
              <button onclick="App.exportBackup()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
                <span>Yedek İndir</span>
              </button>
            </div>

            <!-- 2. Yedek Yükle -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] flex items-center justify-between gap-3">
              <div>
                <h4 class="font-display font-bold text-xs text-[var(--color-ink)]">JSON Yedek Dosyasından Geri Yükle</h4>
                <p class="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Mevcut tüm veriler silinir ve yedekteki verilerle değiştirilir.</p>
              </div>
              <button onclick="document.getElementById('input-import-json').click()" class="btn-tactile btn-tactile-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                <span>Yedek Yükle</span>
              </button>
            </div>

            <!-- 3. Fabrika Sıfırlama -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-3">
              <div>
                <h4 class="font-display font-bold text-xs text-rose-700 dark:text-rose-400">Tüm Verileri Sil ve Sıfırla (Fabrika Ayarları)</h4>
                <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Öğrenci, ödev ve not kayıtları kalıcı olarak temizlenir ve kurulum sihirbazı yeniden açılır.</p>
              </div>
              <button onclick="App.handleFactoryReset()" class="btn-tactile bg-rose-600 hover:bg-rose-700 text-white text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                <span>Sıfırla</span>
              </button>
            </div>
          </div>
        `;
      } else if (tab === 'mcp') {
        const isMac = this.mcpSettingsPlatform !== 'win';

        // macOS yapılandırması — MCP kodu güncellenebilir konumdan (~/PlantrackMCP/mcp) okunur
        const macServerPath = this.mcpServerYolu || '/Applications/Plantrack.app/Contents/Resources/mcp/server.js';
        const macConfigJson = JSON.stringify({
          mcpServers: {
            plantrack: {
              command: "node",
              args: [macServerPath]
            }
          }
        }, null, 2);

        const macAiPrompt = `Ben Plantrack koçluk platformunu macOS üzerinde kullanıyorum.
Plantrack MCP sunucusunu AI asistanıma bağlamak istiyorum.
Lütfen aşağıdaki bilgilere göre ortamımdaki MCP ayar dosyasını (Gemini için ~/.gemini/config/mcp_config.json, Claude Desktop için ~/Library/Application Support/Claude/claude_desktop_config.json veya Cursor için .cursor/mcp.json) güncelle:

{
  "mcpServers": {
    "plantrack": {
      "command": "node",
      "args": ["${macServerPath}"]
    }
  }
}

Bağlantıyı sağladıktan sonra "plantrack_overview" aracını çağırarak çalıştığını test et.`;

        // Windows yapılandırması
        const winConfigJson = `{
  "mcpServers": {
    "plantrack": {
      "command": "node",
      "args": ["C:\\\\Plantrack\\\\mcp\\\\server.js"]
    }
  }
}`;

        const winAiPrompt = `Ben Plantrack koçluk platformunu Windows üzerinde kullanıyorum.
Plantrack MCP sunucusunu AI asistanıma bağlamak istiyorum.
Aşağıdaki bilgilere göre ortamımdaki MCP ayar dosyasını (Claude Desktop için %APPDATA%\\Claude\\claude_desktop_config.json, Cursor için %USERPROFILE%\\.cursor\\mcp.json veya Gemini için %USERPROFILE%\\.gemini\\config\\mcp_config.json) güncelle:

- Önkoşul: Node.js kurulu olmalıdır (kurulu değilse 'winget install OpenJS.NodeJS' komutunu çalıştır).
- Sunucu Yolu: C:\\Plantrack\\mcp\\server.js
- Veritabanı Yolu: %USERPROFILE%\\PlantrackMCP\\data\\plantrack_db.json
- Yapılandırma Bloğu:
{
  "mcpServers": {
    "plantrack": {
      "command": "node",
      "args": ["C:\\\\Plantrack\\\\mcp\\\\server.js"]
    }
  }
}

Lütfen ayarı tamamlayıp "plantrack_overview" aracını çağırarak test et.`;

        return `
          <div class="space-y-4 text-xs pt-1 max-h-[62vh] overflow-y-auto pr-1">
            <!-- Üst Bilgi Kartı: Sunucu Durumu ve Yetenekler -->
            <div class="p-3 rounded-[var(--radius-md)] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <i data-lucide="cpu" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="font-display font-bold text-xs text-[var(--color-ink)] flex items-center gap-2">
                    Plantrack Model Context Protocol (MCP)
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white">59 Araç • 8 Kaynak</span>
                  </h4>
                  <p class="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Yapay zeka asistanlarının (Gemini, Claude, Cursor) koçluk verilerinizi okuyup güncellemesini sağlar.</p>
                </div>
              </div>
              <div class="text-right shrink-0">
                <span class="text-[10px] text-[var(--color-ink-faint)] block">Canlı HTTP Köprüsü</span>
                <span class="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">127.0.0.1:38888</span>
              </div>
            </div>

            <!-- İşletim Sistemi Seçici Butonlar -->
            <div class="flex items-center gap-2 p-1 rounded-[var(--radius-md)] bg-[var(--color-paper-3)] border border-[var(--color-rule)]">
              <button type="button" onclick="App.setMcpPlatform('mac')" class="flex-1 py-1.5 px-3 rounded-[var(--radius-sm)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${isMac ? 'bg-[var(--color-paper-1)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <span>🍏 macOS (MacBook / iMac)</span>
              </button>
              <button type="button" onclick="App.setMcpPlatform('win')" class="flex-1 py-1.5 px-3 rounded-[var(--radius-sm)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${!isMac ? 'bg-[var(--color-paper-1)] text-[var(--color-accent)] shadow-sm' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
                <span>🪟 Windows (PC / Laptop)</span>
              </button>
            </div>

            <!-- 1. YOL: YAPAY ZEKAYA DOĞRUDAN VERİLECEK TALİMAT (EN KOLAY YOL) -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border-2 border-[var(--color-accent)]/50 relative">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                  <h4 class="font-display font-bold text-xs text-[var(--color-ink)]">
                    En Kolay Yol: Yapay Zekaya Doğrudan Bu Talimatı Verin
                  </h4>
                </div>
                <button type="button" id="btn-copy-ai-prompt" class="btn-tactile btn-tactile-primary text-[11px] py-1 px-2.5 flex items-center gap-1.5 shadow-sm">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                  <span>Talimatı Kopyala</span>
                </button>
              </div>
              <p class="text-[11px] text-[var(--color-ink-muted)] mb-2">
                Aşağıdaki kutudaki metni kopyalayıp <strong>Gemini, Claude Desktop, Cursor veya ChatGPT</strong> sohbet kutusuna yapıştırmanız yeterlidir. Yapay zeka sisteminizi otomatik tanıyıp MCP yapılandırmasını kendisi tamamlayacaktır:
              </p>
              <div class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] font-mono text-[10.5px] text-[var(--color-ink)] leading-relaxed select-all whitespace-pre-wrap max-h-36 overflow-y-auto">${isMac ? macAiPrompt : winAiPrompt}</div>
            </div>

            <!-- 2. YOL: MANUEL YAPILANDIRMA VE JSON KODU -->
            <div class="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-paper-2)] border border-[var(--color-rule)] space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="w-5 h-5 rounded-full bg-[var(--color-rule-strong)] text-[var(--color-ink)] flex items-center justify-center text-[10px] font-bold">2</span>
                  <h4 class="font-display font-bold text-xs text-[var(--color-ink)]">
                    Manuel Kurulum Adımları ve JSON Yapılandırması
                  </h4>
                </div>
                <button type="button" id="btn-copy-mcp-json" class="btn-tactile btn-tactile-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5">
                  <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                  <span>JSON Kopyala</span>
                </button>
              </div>

              ${isMac ? `
                <div class="space-y-1.5 text-[11px] text-[var(--color-ink-muted)]">
                  <div><strong>Ayar Dosyası Konumları:</strong></div>
                  <ul class="list-disc list-inside space-y-0.5 font-mono text-[10px] text-[var(--color-ink)]">
                    <li>Gemini CLI / Antigravity: <span class="text-indigo-600 dark:text-indigo-400">~/.gemini/config/mcp_config.json</span></li>
                    <li>Claude Desktop: <span class="text-indigo-600 dark:text-indigo-400">~/Library/Application Support/Claude/claude_desktop_config.json</span></li>
                    <li>Cursor IDE: <span class="text-indigo-600 dark:text-indigo-400">~/.cursor/mcp.json</span></li>
                  </ul>
                  <div class="pt-1">Ayar dosyanızın içine <code class="font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1 py-0.5 rounded">"mcpServers"</code> anahtarının altına şu bloğu ekleyin:</div>
                </div>
              ` : `
                <div class="space-y-1.5 text-[11px] text-[var(--color-ink-muted)]">
                  <div><strong>Önkoşul:</strong> Windows'ta <a href="https://nodejs.org" target="_blank" class="text-blue-600 underline font-semibold">Node.js</a> kurulu olmalıdır. Terminalde <code class="font-mono text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">node -v</code> ile doğrulayabilirsiniz.</div>
                  <div class="pt-1"><strong>Ayar Dosyası Konumları (Not Defteri ile açın):</strong></div>
                  <ul class="list-disc list-inside space-y-0.5 font-mono text-[10px] text-[var(--color-ink)]">
                    <li>Claude Desktop: <span class="text-indigo-600 dark:text-indigo-400">%APPDATA%\\Claude\\claude_desktop_config.json</span></li>
                    <li>Cursor IDE: <span class="text-indigo-600 dark:text-indigo-400">%USERPROFILE%\\.cursor\\mcp.json</span></li>
                    <li>Gemini: <span class="text-indigo-600 dark:text-indigo-400">%USERPROFILE%\\.gemini\\config\\mcp_config.json</span></li>
                  </ul>
                  <div class="pt-1">Plantrack klasörünüzün yolunu (Örn: <code class="font-mono text-xs">C:\\Plantrack\\mcp\\server.js</code>) belirterek şu bloğu ekleyin:</div>
                </div>
              `}

              <pre class="p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-paper-3)] border border-[var(--color-rule)] font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 overflow-x-auto select-all"><code>${isMac ? macConfigJson : winConfigJson}</code></pre>

              <!-- Test Komutu -->
              <div class="pt-1 border-t border-[var(--color-rule)] flex items-center justify-between gap-2">
                <span class="text-[11px] text-[var(--color-ink-muted)]">Terminalde Hızlı Test:</span>
                <code class="font-mono text-[10px] bg-[var(--color-paper-3)] px-2 py-1 rounded border border-[var(--color-rule)] text-[var(--color-ink)] select-all">${isMac ? 'node /Applications/Plantrack.app/Contents/Resources/mcp/test-client.js' : 'node C:\\Plantrack\\mcp\\test-client.js'}</code>
              </div>
            </div>

            <!-- Canlı Senkronizasyon İpucu -->
            <div class="p-3 rounded-[var(--radius-md)] bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5">
              <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5"></i>
              <div class="text-[11px] text-blue-900 dark:text-blue-300 leading-normal">
                <strong>Canlı Otomatik Senkronizasyon (Live Sync):</strong> Plantrack masaüstü uygulaması açıkken, arka planda çalışan MCP sunucusu HTTP köprüsü (port 38888) üzerinden uygulamayla anlık konuşur. Yapay zekaya bir ödev eklettiğinizde veya sınav notu girdirdiğinizde masaüstü ekranınızda anında görünür.
              </div>
            </div>
          </div>
        `;
      }
    };

    const html = `
      <div class="space-y-4">
        <!-- Başlık -->
        <div class="flex items-center justify-between pb-3 border-b border-[var(--color-rule)]">
          <div>
            <h3 class="font-display font-bold text-base text-[var(--color-ink)]">Koç & Platform Ayarları</h3>
            <p class="text-xs text-[var(--color-ink-muted)]">Profil, uygulama tercihleri, MCP yapay zeka ve veri yönetimi</p>
          </div>
          <button onclick="App.closeModal()" class="text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Sekmeler -->
        <div class="flex border-b border-[var(--color-rule)] gap-2 overflow-x-auto">
          <button onclick="App.openCoachSettingsModal('profil')" class="pb-2 text-xs font-semibold transition-all border-b-2 whitespace-nowrap ${this.coachSettingsTab === 'profil' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
            Profil Bilgileri
          </button>
          <button onclick="App.openCoachSettingsModal('app')" class="pb-2 text-xs font-semibold transition-all border-b-2 whitespace-nowrap ${this.coachSettingsTab === 'app' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
            Uygulama Ayarları
          </button>
          <button onclick="App.openCoachSettingsModal('mcp')" class="pb-2 text-xs font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${this.coachSettingsTab === 'mcp' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
            <i data-lucide="cpu" class="w-3.5 h-3.5"></i>
            <span>Win & Mac MCP Ayarları</span>
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
          <button onclick="App.openCoachSettingsModal('data')" class="pb-2 text-xs font-semibold transition-all border-b-2 whitespace-nowrap ${this.coachSettingsTab === 'data' ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}">
            Veri Yönetimi
          </button>
        </div>

        <!-- Sekme İçeriği -->
        <div id="coach-settings-tab-content">
          ${renderTabContent(this.coachSettingsTab)}
        </div>
      </div>
    `;

    this.openModal(html);

    // Uygulama Güncelleme kartı: mevcut sürümü ve kaynak klasörü doldur
    if (this.coachSettingsTab === 'app') {
      this.updateLoadVersion();
    }

    // MCP Sekmesi Kopyalama Event Dinleyicileri
    if (this.coachSettingsTab === 'mcp') {
      const isMac = this.mcpSettingsPlatform !== 'win';
      const macServerPath = this.mcpServerYolu || '/Applications/Plantrack.app/Contents/Resources/mcp/server.js';
      const macAiPrompt = `Ben Plantrack koçluk platformunu macOS üzerinde kullanıyorum.
Plantrack MCP sunucusunu AI asistanıma bağlamak istiyorum.
Lütfen aşağıdaki bilgilere göre ortamımdaki MCP ayar dosyasını (Gemini için ~/.gemini/config/mcp_config.json, Claude Desktop için ~/Library/Application Support/Claude/claude_desktop_config.json veya Cursor için .cursor/mcp.json) güncelle:

{
  "mcpServers": {
    "plantrack": {
      "command": "node",
      "args": ["${macServerPath}"]
    }
  }
}

Bağlantıyı sağladıktan sonra "plantrack_overview" aracını çağırarak çalıştığını test et.`;

      const winAiPrompt = `Ben Plantrack koçluk platformunu Windows üzerinde kullanıyorum.
Plantrack MCP sunucusunu AI asistanıma bağlamak istiyorum.
Aşağıdaki bilgilere göre ortamımdaki MCP ayar dosyasını (Claude Desktop için %APPDATA%\\Claude\\claude_desktop_config.json, Cursor için %USERPROFILE%\\.cursor\\mcp.json veya Gemini için %USERPROFILE%\\.gemini\\config\\mcp_config.json) güncelle:

- Önkoşul: Node.js kurulu olmalıdır (kurulu değilse 'winget install OpenJS.NodeJS' komutunu çalıştır).
- Sunucu Yolu: C:\\Plantrack\\mcp\\server.js
- Veritabanı Yolu: %USERPROFILE%\\PlantrackMCP\\data\\plantrack_db.json
- Yapılandırma Bloğu:
{
  "mcpServers": {
    "plantrack": {
      "command": "node",
      "args": ["C:\\\\Plantrack\\\\mcp\\\\server.js"]
    }
  }
}

Lütfen ayarı tamamlayıp "plantrack_overview" aracını çağırarak test et.`;

      const macConfigJson = JSON.stringify({
        mcpServers: {
          plantrack: {
            command: "node",
            args: [macServerPath]
          }
        }
      }, null, 2);

      const winConfigJson = `{
  "mcpServers": {
    "plantrack": {
      "command": "node",
      "args": ["C:\\\\Plantrack\\\\mcp\\\\server.js"]
    }
  }
}`;

      const btnCopyAi = document.getElementById('btn-copy-ai-prompt');
      if (btnCopyAi) {
        btnCopyAi.onclick = () => {
          this.copyToClipboard(isMac ? macAiPrompt : winAiPrompt, 'Yapay zeka kurulum talimatı panoya kopyalandı!');
        };
      }

      const btnCopyJson = document.getElementById('btn-copy-mcp-json');
      if (btnCopyJson) {
        btnCopyJson.onclick = () => {
          this.copyToClipboard(isMac ? macConfigJson : winConfigJson, 'JSON yapılandırması panoya kopyalandı!');
        };
      }
    }

    // Form Event Listeners
    if (this.coachSettingsTab === 'profil') {
      const form = document.getElementById('form-coach-profile');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const ad = document.getElementById('settings-koc-ad')?.value.trim() || '';
          const soyad = document.getElementById('settings-koc-soyad')?.value.trim() || '';
          const unvan = document.getElementById('settings-koc-unvan')?.value.trim() || '';
          const kurum = document.getElementById('settings-koc-kurum')?.value.trim() || '';
          const telefon = document.getElementById('settings-koc-tel')?.value.trim() || '';

          if (!ad || !soyad) {
            this.showToast('Lütfen ad ve soyad alanlarını doldurun.');
            return;
          }

          Store.saveKocProfili({ ad, soyad, unvan, kurum, telefon });
          this.updateSidebarCoachInfo();
          this.closeModal();
          this.showToast('Koç profili güncellendi.');
        });
      }
    } else if (this.coachSettingsTab === 'app') {
      const form = document.getElementById('form-coach-app');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const yili = document.getElementById('settings-ogretim-yili')?.value || '2025-2026';
          const seciliModulEl = document.querySelector('input[name="settings-modul"]:checked');
          const modId = seciliModulEl ? seciliModulEl.value : 'ara-sinif';
          const hedefSoru = Number(document.getElementById('settings-hedef-soru')?.value) || 100;

          Store.data.ogretimYili = yili;
          Store.setAktifModul(modId);
          Store.data.kocProfili.gunlukHedefSoru = hedefSoru;
          Store.save();

          this.closeModal();
          this.renderCurrentView();
          this.showToast('Uygulama ayarları kaydedildi.');
        });
      }
    }

    if (window.lucide) lucide.createIcons();
  },

  // ─────────────────────────────────────────────────────────────
  // UYGULAMA GÜNCELLEME (Ayarlar > Programı Güncelle)
  // Arayüz, MCP sunucusunun sunduğu ~/PlantrackMCP/web kökünden yüklenir;
  // burada yeni sürüm yerel proje klasöründen kopyalanır ve sayfa yenilenir.
  // ─────────────────────────────────────────────────────────────
  async updateLoadVersion() {
    const elSurum = document.getElementById('guncelleme-surum');
    try {
      const res = await fetch('http://127.0.0.1:38888/api/version');
      const j = await res.json();
      if (elSurum) elSurum.textContent = 'v' + (j.surum || '—');

      const kaynak = (j.kaynak || j.tahminKaynak || '').trim();
      const elKaynak = document.getElementById('guncelleme-kaynak');
      if (elKaynak && kaynak) {
        elKaynak.value = kaynak;
        elKaynak.setAttribute('value', kaynak);
      }

      this.updateKaynakTipi = j.kaynakTipi === 'github' ? 'github' : 'local';
      const elRepo = document.getElementById('guncelleme-repo');
      if (elRepo) elRepo.value = j.repo || '';
      const elBranch = document.getElementById('guncelleme-branch');
      if (elBranch) elBranch.value = j.branch || 'main';
      this.setUpdateKaynakTipi(this.updateKaynakTipi);

      if (!j.ok) {
        this.updateSetStatus('Arayüz kökü henüz hazır değil: ' + (j.kok || ''), true);
      } else if (this.updateKaynakTipi === 'github') {
        this.updateSetStatus('Etkin kaynak: GitHub → ' + (j.repo || '(depo girin)') + ' · ' + (j.branch || 'main'));
      } else if (kaynak) {
        this.updateSetStatus('Etkin kaynak (' + (j.kaynak ? 'kayıtlı' : 'otomatik algılandı') + '): ' + kaynak);
      } else {
        this.updateSetStatus('Kaynak klasörü bir kez girin; sonrasında hatırlanır.');
      }
    } catch (_) {
      if (elSurum) elSurum.textContent = 'MCP kapalı';
      this.updateSetStatus('MCP sunucusuna ulaşılamadı. Güncelleme için sunucu açık olmalı.', true);
    }
  },

  setUpdateKaynakTipi(tip) {
    this.updateKaynakTipi = tip === 'github' ? 'github' : 'local';
    const yerel = document.getElementById('guncelleme-yerel-alan');
    const gh = document.getElementById('guncelleme-github-alan');
    if (yerel) yerel.classList.toggle('hidden', this.updateKaynakTipi === 'github');
    if (gh) gh.classList.toggle('hidden', this.updateKaynakTipi !== 'github');

    document.querySelectorAll('#coach-settings-tab-content button').forEach(btn => {
      const oc = btn.getAttribute('onclick') || '';
      if (!oc.includes('setUpdateKaynakTipi')) return;
      const isGh = oc.includes("'github'");
      const aktif = isGh === (this.updateKaynakTipi === 'github');
      btn.className = `px-2.5 py-1 rounded-[var(--radius-xs)] text-[11px] font-semibold transition-all ${aktif ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'}`;
    });
  },

  updateSetStatus(msg, hata = false) {
    const el = document.getElementById('guncelleme-durum');
    if (el) {
      el.textContent = msg || '';
      el.className = `text-[11px] min-h-[14px] ${hata ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink-muted)]'}`;
    }
  },

  updateKaynakDegeri() {
    return (document.getElementById('guncelleme-kaynak')?.value || '').trim();
  },

  updateGitHubDegeri() {
    return {
      repo: (document.getElementById('guncelleme-repo')?.value || '').trim(),
      branch: (document.getElementById('guncelleme-branch')?.value || 'main').trim() || 'main',
      token: (document.getElementById('guncelleme-token')?.value || '').trim()
    };
  },

  updateIstekGovdesi(dryRun) {
    const tip = this.updateKaynakTipi === 'github' ? 'github' : 'local';
    const gh = this.updateGitHubDegeri();
    return {
      sourceType: tip,
      source: tip === 'local' ? this.updateKaynakDegeri() : '',
      repo: gh.repo,
      branch: gh.branch,
      token: gh.token,
      dryRun: !!dryRun
    };
  },

  async updateCheck() {
    const govde = this.updateIstekGovdesi(true);
    if (govde.sourceType === 'github' && !govde.repo) {
      this.updateSetStatus('GitHub deposunu girin (örn: kullanici/plantrack).', true);
      return;
    }
    this.updateSetStatus(govde.sourceType === 'github' ? 'GitHub kontrol ediliyor...' : 'Kontrol ediliyor...');
    try {
      const res = await fetch('http://127.0.0.1:38888/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(govde)
      });
      const j = await res.json();
      if (!j.success) { this.updateSetStatus(j.error || 'Kontrol başarısız oldu.', true); return; }
      if (j.guncel) { this.updateSetStatus('Zaten güncel (v' + (j.surum && j.surum.surum) + '). Değişiklik yok.'); return; }
      const liste = [...(j.degisecek || []), ...(j.mcpDegisecek || [])];
      const ozet = liste.slice(0, 6).join(', ') + (liste.length > 6 ? ' …' : '');
      this.updateSetStatus(`${liste.length} dosya değişmiş: ${ozet}`);
    } catch (_) {
      this.updateSetStatus('MCP sunucusuna ulaşılamadı.', true);
    }
  },

  async updateApply() {
    const govde = this.updateIstekGovdesi(false);
    if (govde.sourceType === 'local' && !govde.source) {
      this.updateSetStatus('Lütfen proje klasörünü girin.', true);
      return;
    }
    if (govde.sourceType === 'github' && !govde.repo) {
      this.updateSetStatus('GitHub deposunu girin (örn: kullanici/plantrack).', true);
      return;
    }

    const btn = document.getElementById('guncelleme-buton');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    this.updateSetStatus(govde.sourceType === 'github' ? 'GitHub\'dan indiriliyor ve uygulanıyor...' : 'Güncelleniyor...');
    try {
      const res = await fetch('http://127.0.0.1:38888/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(govde)
      });
      const j = await res.json();

      if (!j.success) {
        this.updateSetStatus(j.error || 'Güncelleme başarısız oldu.', true);
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        return;
      }
      if (j.guncel) {
        this.updateSetStatus('Zaten güncel (v' + (j.surum && j.surum.surum) + ').');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
        return;
      }

      const n = (j.updated || []).length;
      this.updateSetStatus(`${n} dosya güncellendi → v${j.surum && j.surum.surum}. Sayfa yenileniyor...`);
      if (j.mcpChanged) {
        this.showToast('Arayüz güncellendi. Sunucu dosyaları da değişti: uygulamayı kapatıp yeniden açın.');
      } else {
        this.showToast('Program güncellendi (v' + (j.surum && j.surum.surum) + ')');
      }
      setTimeout(() => { try { location.reload(); } catch (_) {} }, 900);
    } catch (_) {
      this.updateSetStatus('MCP sunucusuna ulaşılamadı.', true);
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    }
  },

  async handleFactoryReset() {
    const onay = await this.confirmModal({
      baslik: 'Emin misiniz?',
      mesaj: 'Tüm öğrenci kayıtları, ödevler, sınav notları ve konu ilerlemeleri kalıcı olarak silinecektir. Sistem başlangıç fabrika ayarlarına döndürülecektir.',
      onayMetni: 'Fabrika Ayarlarına Sıfırla',
      iptalMetni: 'İptal',
      tehlikeli: true
    });

    if (onay) {
      Store.resetToFactory();
      this.closeModal();
      this.showToast('Sistem sıfırlandı. Kurulum sihirbazı başlatılıyor...');
      this.init();
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
        const newId = e.target.value;
        Store.setAktifOgrenci(newId);
        this.reportSelectedOgrenciId = newId;
        this.hataSelectedOgrenciId = newId;
        this.cizelgeOgrenciId = newId;
        this.denemeSelectedOgrenciId = newId;
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

    // Deneme Excel/CSV Yükleme Inputu
    const inputImportDeneme = document.getElementById('input-import-deneme');
    if (inputImportDeneme) {
      inputImportDeneme.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleDenemeFile(e.target.files[0]);
          e.target.value = '';
        }
      });
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

    // Zaman Bloklama Örnek Rutin dropdown dışına tıklanınca kapat
    document.addEventListener('click', (e) => {
      if (this.zamanRutinDropdownAcik) {
        const wrap = document.getElementById('zaman-rutin-dropdown-wrap');
        if (wrap && !wrap.contains(e.target)) {
          this.zamanRutinDropdownAcik = false;
          this.renderCizelgeRobotu();
        }
      }
    });
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
