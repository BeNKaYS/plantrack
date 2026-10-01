# Plantrack — Prompt 3: Ana Panel & Öğrenci Kokpiti

---

## Bağlam

Prompt 1'de iskelet, Prompt 2'de Store ve veri modeli tamamlandı.
Bu promptta `app.js` içine iki view'ın render fonksiyonları eklenecek:
- `renderOverview()` → `view-overview` section'ını doldurur
- `renderCockpit()` → `view-cockpit` section'ını doldurur

`renderCurrentView()` switch bloğuna bu iki case eklenecek.
`index.html` ve `style.css` bu promptta değişmeyecek.

---

## Genel Render Mantığı

Her view fonksiyonu şu şekilde çalışır:
1. İlgili section elementini al: `document.getElementById('view-overview')`
2. `innerHTML` ile içini doldur
3. Event listener'ları bağla
4. `lucide.createIcons()` çağır

Hiçbir view içinde hardcode modül adı, ders adı veya sınıf bilgisi yazılmaz.
Tüm etiketler `Store.getAktifModul()`, `MODULLER`, `SINIFLAR` üzerinden okunur.

---

## `renderCurrentView()` Güncellemesi

```javascript
renderCurrentView() {
  Store.refreshDeadlines();
  this.updateGlobalBadges();

  switch (this.currentView) {
    case 'overview': this.renderOverview(); break;
    case 'cockpit':  this.renderCockpit();  break;
    // diğerleri sonraki promptlarda eklenecek
  }
}
```

---

## VIEW 1 — Ana Panel (`renderOverview`)

Ana panel tüm öğrencilerin genel bakışıdır. Topbar bu view'da gizlidir — öğrenci seçici yoktur, herkesi listeler.

### Bölüm 1 — Sayfa Başlığı

Sol taraf:
- Başlık: "Kurum Geneli Yönetim Paneli"
- Alt başlık: "Tüm öğrencilerin akademik durumu ve ödev takibi"

Sağ taraf:
- "+ Yeni Öğrenci" butonu → `App.openOgrenciModal()`
- Aktif modül rozeti — `Store.getAktifModul().ad` gösterilir, tıklanınca `App.openModulSeciciModal()`

### Bölüm 2 — KPI Kartları (4 kart, yatay sıra)

Her kart: büyük sayı + açıklama etiketi + ikon

| Kart | Değer | Kaynak |
|---|---|---|
| Toplam Öğrenci | `Store.getOgrenciler().length` | — |
| Aktif Ödev | Tüm öğrencilerin aktif görev toplamı | `Store.getAktifGorevler()` |
| Gecikmiş Ödev | Tüm öğrencilerin gecikmiş görev toplamı | `Store.getGecikmisGorevler()` |
| Bu Hafta Tamamlanan | Son 7 günde `durum === 'tamamlandi'` olan görevler | `tamamlanmaTarihi` kontrol |

Gecikmiş Ödev kartı 0'dan büyükse kırmızı vurgu alır, 0 ise yeşil.

### Bölüm 3 — Öğrenci Listesi Tablosu

Üst araç çubuğu:
- Metin arama: `id="overview-search"` — ad, soyad, okul alanlarında arama
- Modül filtresi: `id="overview-modul-filter"` — `MODULLER` dizisinden dolar, "Tümü" seçeneği dahil
- Sınıf filtresi: `id="overview-sinif-filter"` — `SINIFLAR` dizisinden dolar, "Tümü" seçeneği dahil

Tablo sütunları:
```
Öğrenci (ad soyad + okul)  |  Sınıf & Modül  |  Hedef  |  Ödev Durumu  |  Geciken  |  Kritik Eksik  |  Hızlı Aksiyonlar
```

Her satır için:
- **Öğrenci:** ad soyad (bold) + okul (küçük, muted)
- **Sınıf & Modül:** sınıf etiketi + modül rozeti — `SINIFLAR` ve `MODULLER`'den okunur
- **Hedef:** `ogr.hedef` — uzunsa kısalt
- **Ödev Durumu:** ilerleme çubuğu — `tamamlandi / toplam` oranı, yüzde
- **Geciken:** sayı — 0 ise yeşil onay ikonu, 0'dan büyükse kırmızı sayı
- **Kritik Eksik:** `durum === 'tekrar_lazim'` olan konu sayısı
- **Hızlı Aksiyonlar:**
  - "Kokpite Git" butonu → `Store.setAktifOgrenci(ogr.id)` + `App.navigateTo('cockpit')`
  - "Ödev Ekle" butonu → `App.openGorevModal(ogr.id)`

Öğrenci yoksa: ortada büyük boş durum mesajı — "Henüz öğrenci eklenmedi" + "+ Yeni Öğrenci Ekle" butonu.

Arama ve filtre: her değişimde tabloyu yeniden render et — `id="overview-tbody"` elementinin innerHTML'ini güncelle.

### Bölüm 4 — Kurum Geneli Gecikmiş Ödevler Paneli

Tüm öğrencilerin gecikmiş ödevleri liste halinde.
Her satır: öğrenci adı + ders adı + görev başlığı + kaç gün gecikti + "Tamamla" butonu

Gecikmiş ödev yoksa: "Tüm ödevler zamanında, harika!" mesajı.

---

## VIEW 2 — Öğrenci Kokpiti (`renderCockpit`)

Kokpit tek bir öğrenciye odaklanır. `Store.getAktifOgrenci()` ile aktif öğrenci alınır.
Aktif öğrenci yoksa: "Üstten bir öğrenci seçin" mesajı göster.

### Bölüm 1 — Öğrenci Profil Başlığı

Sol taraf:
- Avatar (renk + ismin baş harfleri)
- Ad soyad (büyük, bold)
- Sınıf rozeti + modül rozeti — `SINIFLAR` ve `MODULLER`'den
- Okul ve hedef (küçük, muted)

Sağ taraf:
- "Ödev Ekle" butonu → `App.openGorevModal(ogr.id)`
- "Düzenle" butonu → `App.openOgrenciModal(ogr.id)`

### Bölüm 2 — KPI Kartları (4 kart)

| Kart | Değer |
|---|---|
| Aktif Ödev | `Store.getAktifGorevler(ogr.id).length` |
| Gecikmiş Ödev | `Store.getGecikmisGorevler(ogr.id).length` |
| Tamamlama Oranı | tamamlanan / toplam görev, % |
| Kritik Eksik Konu | `durum === 'tekrar_lazim'` olan konu sayısı |

### Bölüm 3 — İki Kolon Layout

**Sol kolon (7/12 genişlik) — Acil Müdahale Paneli:**

Gecikmiş ödevler listesi. Her kart:
- Ders adı (ders rengiyle chip)
- Görev başlığı (bold)
- Kaç gün gecikti (kırmızı badge)
- Kaynak/yayın adı (varsa)
- "Tamamlandı" butonu → `Store.gorevTamamla(gorev.id)` + `renderCockpit()`
- "Düzenle" butonu → `App.openGorevModal(ogr.id, gorev.id)`
- "Sil" butonu → onay al → `Store.deleteGorev(gorev.id)` + `renderCockpit()`

Gecikmiş ödev yoksa: yeşil "Gecikmiş ödev yok" mesajı.

**Sağ kolon (5/12 genişlik) — Kritik Eksik Konu Radarı:**

`durum === 'tekrar_lazim'` olan konuları listeler.
Her satır:
- Ders adı (chip)
- Konu adı
- "Telafi Ödevi Oluştur" butonu → `App.openGorevModal(ogr.id, null, konum.konuId)`

Kritik eksik yoksa: yeşil "Kritik eksik konu yok" mesajı.

### Bölüm 4 — Aktif Ödevler Tablosu

`durum !== 'tamamlandi'` ve `durum !== 'gecikti'` olan görevler.

Tablo sütunları:
```
Ders  |  Görev Başlığı  |  Hedef Soru  |  Teslim Tarihi  |  Durum  |  Aksiyonlar
```

Her satır:
- **Ders:** ders adı chip
- **Görev Başlığı:** bold
- **Hedef Soru:** `hedefSoru` — 0 ise "—"
- **Teslim Tarihi:** `deadline` — bugün ise amber vurgu, yarın ise muted, geçmişse rose
- **Durum:** dropdown select — `GOREV_DURUMLARI` key'lerinden, değişince `Store.updateGorev()`
- **Aksiyonlar:** Tamamla + Düzenle + Sil butonları

Aktif ödev yoksa: "Aktif ödev bulunmuyor" mesajı + "Yeni Ödev Ekle" butonu.

### Bölüm 5 — Koçun Haftalık Notu

Tek satır, düzenlenebilir alan:
- `ogr.kocNotu` değerini gösterir
- Çift tıklayınca `<textarea>` açılır
- Blur veya Enter'da `Store.updateOgrenci(ogr.id, { kocNotu: yeniNot })` + toast göster

---

## Modal Fonksiyonları (Bu Promptta Eklenecek)

### `App.openOgrenciModal(ogrenciId = null)`

Yeni öğrenci ekle veya mevcut öğrenciyi düzenle.

Form alanları:
- Ad (zorunlu)
- Soyad (zorunlu)
- Sınıf (select — `SINIFLAR` dizisinden, sınıf seçince modül otomatik belirlenir)
- Okul (opsiyonel)
- Öğrenci Telefon (opsiyonel)
- Veli Adı (opsiyonel)
- Veli Telefon (opsiyonel)
- Hedef (opsiyonel)
- Avatar rengi (renk seçici — 6 seçenek)

Sınıf değişince modül rozeti otomatik güncellenir — `SINIFLAR`'dan `modulId` bulunur, `MODULLER`'den modül adı alınır.

Kaydet:
- `ogrenciId` varsa → `Store.updateOgrenci()` + "Öğrenci güncellendi" toast
- `ogrenciId` yoksa → `Store.addOgrenci()` + `Store.setAktifOgrenci(yeniId)` + "Öğrenci eklendi" toast
- `closeModal()` + `populateStudentDropdown()` + `renderCurrentView()`

### `App.openGorevModal(ogrenciId, gorevId = null, konuId = null)`

Yeni görev ekle veya mevcut görevi düzenle.

Form alanları:
- Öğrenci: disabled, aktif öğrenci gösterilir
- Ders (select — `Store.getDerslerForOgrenci(ogr)` ile dolar)
- Konu (select — ders seçince `Store.getKonularForDers(dersId)` ile dolar, opsiyonel)
- Görev Başlığı (zorunlu) — son 5 görev başlığı hızlı seçim chip'leri olarak gösterilir
- Hedef Soru Sayısı (number, opsiyonel)
- Süre (dakika, opsiyonel)
- Teslim Tarihi (date, opsiyonel)
- Durum (select — `GOREV_DURUMLARI`)
- Not (textarea, opsiyonel)

`konuId` parametre olarak geldiyse konu alanı otomatik seçili gelir.

Kaydet:
- `gorevId` varsa → `Store.updateGorev()` + "Görev güncellendi" toast
- `gorevId` yoksa → `Store.addGorev()` + "Görev eklendi" toast
- `closeModal()` + `renderCurrentView()`

### `App.openModulSeciciModal()`

Aktif modülü değiştir.

3 kart (Ara Sınıf, LGS, TYT-AYT) — `MODULLER` dizisinden oluşturulur.
Seçince: `Store.setAktifModul(modulId)` + `closeModal()` + `renderCurrentView()` + `updateGlobalBadges()`

---

## Kurallar

1. Her view fonksiyonu `Store.getAktifOgrenci()` kontrolü yapar — `null` ise uygun mesaj gösterir
2. Öğrenci veya görev sil işlemlerinde `confirm()` değil, özel onay modalı kullan
3. Tüm tarihler `tr-TR` locale ile gösterilir: `new Date(tarih).toLocaleDateString('tr-TR')`
4. Ders adları, modül adları, sınıf etiketleri — hepsi `DERSLER`, `MODULLER`, `SINIFLAR` sabitlerinden okunur, hardcode yazılmaz
5. Arama ve filtre state'leri `App` nesnesinde tutulur (`App.overviewSearchQuery`, `App.overviewModulFilter`, `App.overviewSinifFilter`) — view'lar arası geçişte sıfırlanmaz
