# Plantrack — Prompt 1: Proje İskeleti, Ana Sayfa & Sol Panel

---

## Proje Tanımı

**Plantrack**, 4–12. sınıf arası öğrencilerin ödev, konu ve çalışma takibini yapan bir masaüstü web uygulamasıdır. Ebeveyn veya koç tarafından yönetilir, öğrenciye çıktı verilir.

Uygulamanın temel tasarım ilkesi **modülerlik**tir: Ara Sınıf (4–7), LGS (8. Sınıf), YKS (9–12) gibi farklı modüller ileride bağımsız olarak eklenebilir. Hiçbir yerde modül adı, ders adı veya etiket hardcode yazılmaz — her şey aktif modülün veri nesnesinden okunur.

---

## Teknik Kısıtlar

- **Vanilla JS** — framework yok, global `App` ve `Store` nesneleri
- **Derleme yok** — `index.html` çift tıklamayla veya local server üzerinden açılır
- **Tailwind CSS CDN**, **Lucide Icons CDN**, **SheetJS CDN**
- **Google Fonts** — Plus Jakarta Sans (body), Space Grotesk (başlık), JetBrains Mono (veri)
- Script yükleme sırası body kapanmadan önce: `js/data.js` → `js/store.js` → `app.js`
- Veri: `localStorage`, key: `plantrack_db_v1`
- Sidebar genişliği localStorage'dan erken yüklenir, key: `plantrack_sidebar_width`

---

## Modül Sistemi — Temel Mimari Karar

Bu uygulama ileride birden fazla modülü destekleyecek şekilde tasarlanmalıdır. Her modül bağımsız bir veri nesnesidir:

```
MODULLER = [
  { id: 'ara-sinif', ad: 'Ara Sınıflar', siniflar: ['4','5','6','7'] },
  { id: 'lgs',       ad: 'LGS Hazırlık', siniflar: ['8']             },
  { id: 'yks',       ad: 'YKS Hazırlık', siniflar: ['9','10','11','12','mezun'] }
]
```

- `Store.data.aktifModulId` → aktif modülü tutar
- `App.getAktifModul()` → aktif modül nesnesini döndürür
- UI'da hiçbir yerde `if (kademe === 'LGS')` gibi hardcode kontrol olmaz
- Etiketler, renkler, müfredat hepsi modül nesnesinden okunur
- Yeni modül eklemek = yeni bir nesne eklemek, UI değişmez

---

## Dosya Yapısı

```
Plantrack/
├── index.html
├── style.css
├── app.js
├── js/
│   ├── data.js          (modül tanımları + yardımcı sabitler — bu promptta iskelet)
│   └── store.js         (veri yöneticisi — bu promptta iskelet)
├── assets/
│   └── logo.svg
├── Baslat_Mac.command   (local server başlatır, tarayıcı açar)
└── Baslat_Windows.bat   (local server başlatır, tarayıcı açar)
```

---

## `index.html` — Yapı ve ID'ler

### Head

- Title: `Plantrack — Öğrenci Takip & Koçluk Platformu`
- Google Fonts import
- Tailwind CDN + config (font genişlemesi)
- Lucide CDN
- SheetJS CDN
- `style.css` linki
- Flicker önleyici inline script: `plantrack_sidebar_width` key'ini localStorage'dan okur, `#sidebar-dynamic-width` style tag'ine yazar

### Body Yapısı

Body tam ekran, yatay flex, overflow hidden:

```
body
 ├── aside#sidebar
 ├── div#sidebar-resizer
 └── div.flex-1
      ├── header#topbar
      └── main#main-content
```

### Sidebar `<aside id="sidebar">`

Sabit, dikey flex, koyu arka planlı. 3 bölüm:

**Bölüm 1 — Logo & Başlık:**
- Sol: `assets/logo.svg` — tıklanınca `App.navigateTo('overview')`
- Sağ üst: Uygulama adı "Plantrack", versiyon rozeti "v1.0"
- Sağ alt: Aktif öğrencinin modül + sınıf rozeti
  - `id="sidebar-modul-badge"` — wrapper, başlangıçta hidden
  - `id="sidebar-modul-text"` — JS ile dolar, örn: "LGS · 8. Sınıf"

**Bölüm 2 — Navigasyon `<nav>`:**

Her buton `data-nav` attribute'u taşır, uygun Lucide ikonu seç.
Aktif buton `.nav-item.active` class'ı alır, sol kenarında ince dikey çizgi belirir.

```
── Yönetim Paneli ────────────────────────────────────────────
data-nav="overview"         "Ana Panel"
  → sağda: id="nav-badge-overview" (toplam öğrenci sayısı, her zaman görünür)

data-nav="cockpit"          "Öğrenci Kokpiti"
  → sağda: id="nav-badge-cockpit" (geciken ödev sayısı, 0 ise hidden)

── Takip & Planlama ──────────────────────────────────────────
data-nav="matrix"           "Çalışma & Ödev Matrisi"

data-nav="tasks"            "Ödev Geçmişi"
  → sağda: id="nav-badge-tasks" (aktif ödev sayısı, 0 ise hidden)

── Raporlar & Çıktılar ───────────────────────────────────────
data-nav="report"           "Raporlar"            → sağda sabit etiket: "A4 Karne"
data-nav="hata-defteri"     "Hata Defteri"        → sağda sabit etiket: "A4 & Analiz"
data-nav="cizelge-robotu"   "Çizelge Robotu"      → sağda sabit etiket: "A4 Şablon"

── Havuz & Portföy ───────────────────────────────────────────
data-nav="curriculum-pool"  "Müfredat & Dersler"
data-nav="library"          "Kaynaklar"
data-nav="students"         "Öğrenci Portföyü"

── Araçlar & Analiz ──────────────────────────────────────────
data-nav="sinav-notlari"    "Sınav Notları"
```

**Bölüm 3 — Alt Kısım:**

```
Yedekleme satırı:
  - "Yerel Depolama" etiketi
  - id="btn-sidebar-import-json"  → JSON yedek yükle
  - id="btn-export-backup"        → JSON yedek indir

Koç kartı:
  - id="sidebar-coach-avatar"     → ismin baş harfleri, JS ile dolar
  - id="sidebar-coach-name"       → koç adı, JS ile dolar
  - id="sidebar-coach-title"      → koç unvanı, JS ile dolar
  - id="btn-open-coach-settings"  → onclick="App.openCoachSettingsModal()"
```

### Sidebar Resizer `<div id="sidebar-resizer">`

Sidebar ile içerik arasında ince dikey çizgi. Sürüklemeyle genişlik değişir, çift tıklamada sıfırlanır.

### Topbar `<header id="topbar">`

Başlangıçta `hidden`. `overview` view'ında gizli, diğer tüm view'larda görünür.

Sol:
- `id="select-active-student"` — öğrenci seçici, JS ile dolar
- `id="active-student-badge"` — aktif öğrenci rozeti, JS ile dolar

Sağ:
- `id="topbar-overdue-alert"` + `id="topbar-overdue-count"` — tıklayınca `App.navigateTo('cockpit')`
- `id="btn-quick-new-task"` — `onclick="App.openTaskModal()"`

### View Section'ları `<main id="main-content">`

Hepsi `class="view-section hidden"`. Sadece `view-overview` başlangıçta görünür.
İçleri bu promptta **tamamen boş**.

```
id="view-overview"
id="view-cockpit"
id="view-matrix"
id="view-tasks"
id="view-report"
id="view-hata-defteri"
id="view-cizelge-robotu"
id="view-curriculum-pool"
id="view-library"
id="view-students"
id="view-sinav-notlari"
```

### Modal ve Yardımcılar

```
div#modal-overlay → div#modal-container → div#modal-content
input#input-import-json (hidden, accept=".json")
```

---

## `app.js` — Fonksiyon Mantıkları

### `App.init()`
Sırayla: `Store.init()` → `bindEvents()` → `initSidebarResizer()` → `populateStudentDropdown()` → `updateSidebarCoachInfo()` → `navigateTo('overview')` → `lucide.createIcons()`

### `App.getAktifModul()`
`Store.data.aktifModulId` değerini okur, `MODULLER` dizisinden eşleşen modül nesnesini döndürür.
Bulamazsa `null`. UI bu fonksiyonu kullanarak modüle özel etiket, renk veya müfredat alır.

### `App.navigateTo(view)`
1. `this.currentView = view`
2. Tüm `[data-nav]` butonlarından `active` kaldır, `data-nav === view` olana ekle
3. Tüm `.view-section` elementlerine `hidden` ekle, `#view-${view}` elementinden kaldır
4. Topbar: `overview` ise gizle, değilse göster
5. `renderCurrentView()` → `lucide.createIcons()`

### `App.renderCurrentView()`
Her çağrıda: `Store.refreshDeadlines()` → `updateGlobalBadges()`
Switch bloğu bu promptta boş — sonraki promptlarda case'ler eklenir.

### `App.updateGlobalBadges()`
`Store.data` üzerinden okur:

| Element ID | Ne gösterir | Koşul |
|---|---|---|
| `nav-badge-overview` | toplam öğrenci sayısı | her zaman görünür |
| `nav-badge-cockpit` | gecikmiş görev sayısı | 0 ise hidden |
| `nav-badge-tasks` | aktif görev sayısı | 0 ise hidden |
| `topbar-overdue-alert/count` | gecikmiş sayısı | 0 ise hidden |
| `sidebar-modul-badge/text` | aktif öğrencinin modül + sınıf | öğrenci yoksa hidden |

Modül etiketi için `App.getAktifModul()` kullanılır — hardcode string yazmaz.

### `App.populateStudentDropdown()`
`Store.data.ogrenciler` → `select-active-student` doldurulur.
`aktifOgrenciId` eşleşeni `selected`. Öğrenci yoksa placeholder option.

### `App.updateSidebarCoachInfo()`
`Store.data.kocProfili` → avatar (baş harfler), ad soyad, unvan güncellenir.

### `App.initSidebarResizer()`
- `mousedown` → sürükleme başlar
- `mousemove` → genişlik hesaplanır (min 180px, max 520px), `#sidebar-dynamic-width` güncellenir, localStorage'a yazılır
- `mouseup` → sürükleme biter
- `dblclick` → sıfırlanır, localStorage temizlenir

### `App.openModal(html)` / `App.closeModal()`
openModal: `modal-content` doldurulur, `modal-overlay` gösterilir, `lucide.createIcons()`
closeModal: `modal-overlay` gizlenir

### `App.showToast(msg)`
`id="plantrack-toast"` elementi yoksa oluşturulur, varsa güncellenir. 3 saniye sonra gizlenir.

### `App.exportBackup()` / `App.importBackup(e)`
Dosya adı: `plantrack_yedek_YYYY-MM-DD.json`
Import: `ogrenciler` alanı yoksa hata toast'ı. Başarılıysa `Store.save()` → `populateStudentDropdown()` → `navigateTo('overview')`

### `App.bindEvents()`
- `[data-nav]` click → `navigateTo()`
- `select-active-student` change → `Store.setAktifOgrenci()` + `updateGlobalBadges()` + `renderCurrentView()`
- `modal-overlay` click (backdrop) → `closeModal()`
- `btn-export-backup` → `exportBackup()`
- `btn-sidebar-import-json` → `input-import-json.click()`
- `input-import-json` change → `importBackup(e)`

### Placeholder fonksiyonlar (sonraki promptlarda doldurulacak):
- `App.openTaskModal()` → `showToast('Yakında')`
- `App.openCoachSettingsModal()` → `showToast('Yakında')`

---

## `js/store.js` — İskelet

**`Store.data` yapısı:**
```
{
  version: '1.0.0',
  aktifModulId: 'ara-sinif',        ← varsayılan modül
  kocProfili: { ad, soyad, unvan, avatarKisa },
  aktifOgrenciId: '',
  ogrenciler: [],                   ← boş başlar, kişisel veri yok
  gorevler: [],
  konuDurumlari: []
}
```

**Çalışır metodlar:**
- `Store.init()` — localStorage'dan okur, yoksa boş yapı oluşturur
- `Store.save()` — `localStorage.setItem('plantrack_db_v1', JSON.stringify(this.data))`
- `Store.getAktifOgrenci()` — `aktifOgrenciId` ile `ogrenciler`'dan bulur, bulamazsa `null`
- `Store.setAktifOgrenci(id)` — `aktifOgrenciId` günceller, `save()`
- `Store.setAktifModul(modulId)` — `aktifModulId` günceller, `save()`
- `Store.refreshDeadlines()` — şimdilik boş

**Seed data kuralı:** `ogrenciler: []` — gerçek veya gerçekmiş gibi görünen kişisel veri kesinlikle yok.

---

## `js/data.js` — İskelet

Modül tanımlarını içerir. Bu promptta sadece yapı kurulur, müfredat verisi sonraki promptta gelir:

```javascript
const MODULLER = [
  { id: 'ara-sinif', ad: 'Ara Sınıflar', siniflar: ['5','6','7'] },
  { id: 'lgs',       ad: 'LGS Hazırlık', siniflar: ['8']         },
  { id: 'yks',       ad: 'TYT-AYT',      siniflar: ['9','10','11','12','mezun'] }
];

const SINIFLAR = [
  { deger: '5',     label: '5. Sınıf',  modulId: 'ara-sinif' },
  { deger: '6',     label: '6. Sınıf',  modulId: 'ara-sinif' },
  { deger: '7',     label: '7. Sınıf',  modulId: 'ara-sinif' },
  { deger: '8',     label: '8. Sınıf',  modulId: 'lgs'       },
  { deger: '9',     label: '9. Sınıf',  modulId: 'yks'       },
  { deger: '10',    label: '10. Sınıf', modulId: 'yks'       },
  { deger: '11',    label: '11. Sınıf', modulId: 'yks'       },
  { deger: '12',    label: '12. Sınıf', modulId: 'yks'       },
  { deger: 'mezun', label: 'Mezun',     modulId: 'yks'       }
];
```

`DERSLER` ve `KONULAR` dizileri boş — sonraki promptta doldurulacak.

---

## Başlatıcı Dosyalar

### `Baslat_Mac.command`
Python3 veya Node.js ile local HTTP server başlatır (port 8080), ardından tarayıcıda `http://localhost:8080` açar. Her ikisi de yoksa doğrudan `open index.html` ile açar. `chmod +x` yapılacak.

### `Baslat_Windows.bat`
Önce `http://localhost:8080` tarayıcıda açar, sonra Python veya Node ile server başlatır. Her ikisi de yoksa `start index.html` ile açar.

---

## `assets/logo.svg`

"PT" harflerinden oluşan monogram SVG. Daire form. Tamamen inline — dışarıdan URL yok.

---

## Doğrulama

1. `Baslat_Mac.command` veya `Baslat_Windows.bat` ile açılıyor
2. Sidebar görünür, nav butonları tıklanabilir
3. Aktif nav item sol kenar vurgusuyla beliriyor
4. Topbar "Ana Panel"de gizli, diğer view'larda görünür
5. Sidebar sürüklenebilir, çift tıklama sıfırlıyor
6. `App.showToast('test')` çağrılınca toast görünüp kayboluyor
7. `App.getAktifModul()` çağrılınca `{ id: 'ara-sinif', ... }` döndürüyor
8. Console'da hata yok
