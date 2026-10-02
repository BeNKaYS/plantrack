# Plantrack — Prompt 8: Koç Ayarları & İlk Kurulum Sihirbazı

---

## Bağlam

Prompt 1–7 tamamlandı. Bu promptta iki şey eklenecek:
1. **İlk Kurulum Sihirbazı** — uygulama ilk açıldığında çıkar, bir daha çıkmaz
2. **Koç Ayarları Modalı** — sidebar alt köşedeki ayarlar butonundan açılır

Ayrıca `app.js`'teki `App.init()` fonksiyonu güncellenerek sihirbaz kontrolü eklenecek.

---

## İlk Kurulum Sihirbazı (Setup Wizard)

### Tetiklenme Mantığı

`App.init()` içine şu kontrol eklenir:

```javascript
init() {
  Store.init();
  this.bindEvents();
  this.initSidebarResizer();

  // İlk kurulum kontrolü
  if (!Store.data.kurulumTamamlandi) {
    this.showSetupWizard();
    return;  // Kurulum bitmeden uygulamayı yükleme
  }

  this.populateStudentDropdown();
  this.updateSidebarCoachInfo();
  this.navigateTo('overview');
  if (window.lucide) window.lucide.createIcons();
},
```

`Store.data.kurulumTamamlandi` alanı Prompt 2'deki `getSeedData()`'ya eklenir:
```javascript
kurulumTamamlandi: false
```

Sihirbaz tamamlandığında `Store.data.kurulumTamamlandi = true` yapılır, `Store.save()` çağrılır.

### Sihirbaz HTML Yapısı

`index.html`'e body içine eklenir — modal overlay'den **ayrı**, tam ekran kaplayan div:

```
div#setup-wizard  (fixed, full screen, z-index en yüksek, başlangıçta hidden)
  └── div.wizard-container  (ortalanmış kart)
       ├── div#wizard-progress-bar  (üstte ince ilerleme çubuğu)
       ├── div#wizard-body          (adım içeriği — JS ile render edilir)
       └── div.wizard-footer
            ├── button#wizard-btn-back   (Geri — 1. adımda hidden)
            ├── div#wizard-dots          (adım noktaları)
            └── button#wizard-btn-next   (Devam Et / Başla!)
```

### 4 Adım

**Adım 1 — Hoş Geldiniz & Koç Bilgileri**

Başlık: "Plantrack'e Hoş Geldiniz"
Alt başlık: "Raporlarda ve çıktılarda görünecek bilgilerinizi girin."

Alanlar:
- Ad (zorunlu, `id="wizard-koc-ad"`)
- Soyad (zorunlu, `id="wizard-koc-soyad"`)
- Unvan (select: Veli / Öğretmen / Koç / Danışman, `id="wizard-koc-unvan"`)
- Kurum (opsiyonel, `id="wizard-koc-kurum"`)
- Telefon (opsiyonel, `id="wizard-koc-tel"`)

Validasyon: Ad ve soyad boşsa "Devam Et" tıklanınca toast göster, geçme.

**Adım 2 — İlk Öğrenciyi Ekle**

Başlık: "İlk öğrenciyi ekleyelim"
Alt başlık: "Daha sonra istediğiniz kadar öğrenci ekleyebilirsiniz."

Alanlar:
- Ad (zorunlu, `id="wizard-ogr-ad"`)
- Soyad (zorunlu, `id="wizard-ogr-soyad"`)
- Sınıf (select — `SINIFLAR`'dan, `id="wizard-ogr-sinif"`)
- Okul (opsiyonel, `id="wizard-ogr-okul"`)
- Avatar rengi (6 renk seçici, `name="wizard-renk"`)

Sınıf değişince modül otomatik belirlenir — `SINIFLAR`'dan `modulId` bulunur,
o modülün adı küçük bir rozet olarak gösterilir.

Validasyon: Ad ve soyad boşsa geçme.

**Adım 3 — Öğretim Yılı**

Başlık: "Öğretim yılını seçin"

Alanlar:
- Öğretim yılı (select, `id="wizard-yil"`)
  - Seçenekler: 2023-2024, 2024-2025, 2025-2026, 2026-2027
  - Varsayılan: mevcut yıla göre otomatik belirle
- Aktif modül (3 kart — Ara Sınıf, LGS, TYT-AYT)
  - `MODULLER` dizisinden oluşturulur
  - Adım 2'de seçilen sınıfa göre otomatik seçili gelir
  - Kullanıcı değiştirebilir
  - Her kart: modül adı + kapsadığı sınıflar

**Adım 4 — Hazır!**

Başlık: "Her şey hazır!"
Alt başlık: "Bu bilgileri daha sonra Ayarlar bölümünden değiştirebilirsiniz."

Girilen bilgilerin özet tablosu:
- Koç adı + unvan
- Öğrenci adı + sınıf + modül
- Öğretim yılı

"Başla!" butonu — büyük, vurgulu.

### Wizard State Yönetimi

```javascript
App.wizardState = {
  adim: 1,
  veri: {
    kocAd: '', kocSoyad: '', kocUnvan: 'Veli', kocKurum: '', kocTel: '',
    ogrAd: '', ogrSoyad: '', ogrSinif: '5', ogrOkul: '', ogrRenk: 'teal',
    modulId: 'ara-sinif',
    ogretimYili: '2025-2026'
  }
}
```

### Wizard Fonksiyonları

```javascript
App.showSetupWizard()     // #setup-wizard gösterir, wizardRenderAdim(1) çağırır
App.wizardRenderAdim(n)   // İlerleme çubuğu günceller, adım içeriğini render eder
App.wizardIleri()         // Validasyon → veriyi state'e yaz → sonraki adıma geç
App.wizardGeri()          // Önceki adıma geç
App.wizardTamamla()       // Store'a kaydet, sihirbazı gizle, uygulamayı başlat
```

`App.wizardTamamla()` içinde:
1. `Store.data.kocProfili` güncelle — `avatarKisa` otomatik üret (ad[0]+soyad[0])
2. `Store.data.ogretimYili` güncelle
3. `Store.data.aktifModulId` güncelle
4. `Store.addOgrenci()` ile ilk öğrenciyi ekle
5. `Store.setAktifOgrenci(yeniOgrenciId)`
6. `Store.data.kurulumTamamlandi = true`
7. `Store.save()`
8. `#setup-wizard` gizle
9. `App.populateStudentDropdown()`
10. `App.updateSidebarCoachInfo()`
11. `App.navigateTo('overview')`
12. `App.showToast('Hoş geldiniz! Plantrack hazır.')`

---

## Koç Ayarları Modalı (`App.openCoachSettingsModal`)

Sidebar altındaki ayarlar butonuna tıklanınca açılır.
Üç sekme içerir.

### Sekme 1 — Profil

Koç profil bilgilerini düzenleme formu:
- Ad, Soyad, Unvan, Kurum, Telefon
- Kaydet → `Store.saveKocProfili()` + `updateSidebarCoachInfo()` + toast

### Sekme 2 — Uygulama Ayarları

Alanlar:
- Öğretim Yılı (select) → `Store.data.ogretimYili` günceller
- Varsayılan Modül (3 kart — Ara Sınıf / LGS / TYT-AYT) → `Store.setAktifModul()`
- Varsayılan Günlük Hedef Soru (number) → `Store.data.kocProfili.gunlukHedefSoru`

### Sekme 3 — Veri Yönetimi

Üç işlem:

**Yedek İndir:**
"Tüm verileri JSON olarak indir" → `App.exportBackup()`
Dosya adı: `plantrack_yedek_YYYY-MM-DD.json`

**Yedek Yükle:**
"JSON yedek dosyasından geri yükle" → dosya seçici tetikler → `App.importBackup()`
Uyarı metni: "Mevcut tüm veriler silinir ve yedekteki verilerle değiştirilir."

**Fabrika Sıfırlama:**
"Tüm verileri sil ve sıfırla" — kırmızı buton
Tıklanınca önce onay modalı:
- Başlık: "Emin misiniz?"
- Mesaj: "Tüm öğrenci, ödev ve konu verileri kalıcı olarak silinecek."
- "Sıfırla" (kırmızı) + "İptal" butonları
Onaylanırsa: `Store.resetToFactory()` + `App.init()` yeniden çağır
  → `kurulumTamamlandi: false` olacağı için sihirbaz tekrar açılır

---

## Onay Modalı Yardımcısı (`App.confirmModal`)

Tüm tehlikeli işlemler (sil, sıfırla) için standart onay modalı.
`confirm()` native dialog kullanılmaz.

```javascript
App.confirmModal({ baslik, mesaj, onayMetni, iptalMetni, tehlikeli }) {
  // openModal() ile modal açar
  // "Onayla" tıklanınca Promise resolve eder
  // "İptal" tıklanınca Promise reject eder
  // await ile kullanılabilir
}
```

Kullanım:
```javascript
const onaylandi = await App.confirmModal({
  baslik: 'Öğrenciyi Sil',
  mesaj: 'Ali Yılmaz ve tüm verileri silinecek.',
  onayMetni: 'Sil',
  tehlikeli: true
});
if (onaylandi) Store.deleteOgrenci(id);
```

Bu fonksiyon Prompt 3'ten itibaren tüm sil işlemlerinde kullanılmalıydı —
bu promptta implemente edilir ve geriye dönük olarak tüm view'larda
`confirm()` çağrıları bu fonksiyonla değiştirilir.

---

## `index.html`'e Eklenecek

```html
<!-- Setup Wizard — body kapanmadan önce -->
<div id="setup-wizard" class="hidden fixed inset-0 z-[100] ...">
  <div class="wizard-container ...">
    <div id="wizard-progress-bar"></div>
    <div id="wizard-body"></div>
    <div class="wizard-footer">
      <button id="wizard-btn-back" class="hidden">Geri</button>
      <div id="wizard-dots"></div>
      <button id="wizard-btn-next">Devam Et</button>
    </div>
  </div>
</div>
```

---

## Kurallar

1. Sihirbaz kapandıktan sonra bir daha açılmaz — `kurulumTamamlandi: true` kontrol eder
2. "Geri" butonu 1. adımda hidden
3. 4. adımda "Devam Et" yerine "Başla!" yazar, daha büyük ve vurgulu
4. Wizard state sadece `App.wizardState`'te tutulur — Store'a sadece son adımda yazılır
5. `App.confirmModal` Promise tabanlı — tüm tehlikeli işlemlerde kullanılır
6. Fabrika sıfırlama sihirbazı yeniden açar — `kurulumTamamlandi: false` olduğu için
7. Koç ayarları modalı kapatılınca sidebar güncellenir
