# Plantrack — Prompt 5: Raporlar & Hata Defteri

---

## Bağlam

Prompt 1–4 tamamlandı. Bu promptta iki view eklenecek:
- `renderReport()` → `view-report`
- `renderHataDefteri()` → `view-hata-defteri`

Print motoru Prompt 2'de `PrintEngine.yazdir(icerik, ayarlar)` olarak tanımlandı.
Bu promptta o motor kullanılacak — `window.print()` doğrudan çağrılmayacak.

`renderCurrentView()` switch bloğuna iki case daha eklenecek.

---

## VIEW 1 — Raporlar (`renderReport`)

### Genel Mantık

İki rapor şablonu var:
1. **Haftalık Ödev Fişi** — öğrenciye verilen, o haftaki görevleri listeler, A4 dikey
2. **Akademik Karne** — veliye/koça verilen, genel akademik durum özeti, A4 dikey

Sayfa iki modda çalışır:
- **Önizleme modu** — rapor ekranda görünür, düzenlenebilir
- **Baskı modu** — `PrintEngine.yazdir()` çağrılır, sadece rapor basılır

State değişkeni: `App.reportAktifSablon` — `'slip'` (ödev fişi) veya `'full'` (karne)

### Bölüm 1 — Araç Çubuğu

Sol:
- Şablon seçici: iki tab butonu — "Haftalık Ödev Fişi" ve "Akademik Karne"
- Öğrenci seçici: `id="report-ogrenci-select"` — tüm öğrenciler listelenir, aktif öğrenci varsayılan

Sağ:
- "Yazdır" butonu → `App.printAktifRapor()`
- "Aktif Öğrenciyi Doldur" butonu → `App.fillReportAktifOgrenci()`

### Bölüm 2 — Rapor Önizleme Alanı

`id="report-preview-area"` — A4 oranlarında beyaz kart, gölgeli.
Seçili şablona göre içi dolar.

---

### Şablon 1 — Haftalık Ödev Fişi (`renderReportSlip`)

A4 dikey, tek sayfa.

**Üst kısım — Başlık:**
- Sol: koç adı + kurum (`Store.getKocProfili()`)
- Orta: "HAFTALIK ÇALIŞMA & ÖDEV FİŞİ" başlığı
- Sağ: tarih aralığı (bu haftanın Pazartesi–Pazar'ı)

**Öğrenci Bilgi Bandı:**
- Ad Soyad | Sınıf | Okul | Hedef
- Modül rozeti

**Aktif Ödevler Tablosu:**
`Store.getAktifGorevler(ogrenciId)` — tamamlanmamış görevler.

Tablo sütunları:
```
Ders  |  Konu  |  Görev / Kaynak  |  Hedef Soru  |  Süre  |  Teslim  |  Durum Kutusu
```

"Durum Kutusu" sütunu — boş kare kutu (print'te elle işaretlenir).

**Alt kısım — Koçun Notu:**
`ogr.kocNotu` — boş çizgili alan, varsa dolu gelir.

**En Alt — İmza Bandı:**
Koç adı + unvan + kurum

---

### Şablon 2 — Akademik Karne (`renderReportFull`)

A4 dikey, tek sayfa.

**Üst kısım — Başlık:**
- "AKADEMİK TAKİP & PERFORMANS RAPORU"
- Tarih: bugün
- Koç bilgisi (sağda)

**Öğrenci Profil Bandı:**
Ad Soyad | Sınıf | Okul | Modül | Hedef

**4 KPI Kutusu (yatay sıra):**
- Toplam Görev | Tamamlanan | Tamamlama % | Gecikmiş

**Ders Bazlı İlerleme Tablosu:**
`Store.getDerslerForOgrenci(ogr)` — her ders için bir satır.

Sütunlar:
```
Ders  |  Toplam Konu  |  Tamamlanan  |  Tekrar Lazım  |  İlerleme %  |  Son Not
```

"Son Not" — `Store.getSinifNotlari(ogr.id, ders.id)` en son notu gösterir.

**Kritik Eksik Konular:**
`durum === 'tekrar_lazim'` — ders + konu adı listesi, kırmızı vurgu.

**Gecikmiş Ödevler:**
Kısa liste — görev başlığı + ders + kaç gün gecikti.

**Koçun Değerlendirmesi:**
`ogr.kocNotu` — boş çizgili alan.

**Alt — İmza Bandı:**
Koç adı + unvan + "Veli Onay" kutusu

---

### Print Fonksiyonu

```javascript
App.printAktifRapor() {
  const ogrenciId = document.getElementById('report-ogrenci-select').value;
  const ogr = Store.getOgrenci(ogrenciId);
  if (!ogr) { this.showToast('Öğrenci seçin'); return; }

  const icerik = App.reportAktifSablon === 'slip'
    ? this.renderReportSlipHTML(ogr)
    : this.renderReportFullHTML(ogr);

  PrintEngine.yazdir(icerik, { yatay: false });
}
```

`renderReportSlipHTML(ogr)` ve `renderReportFullHTML(ogr)` — HTML string döndürür.
Print area'ya yazılır, basılır, temizlenir.

Dosya adı convention (toast ile gösterilir):
`HaftalikFis_[OgrAdi]_[Tarih]` veya `AkademikKarne_[OgrAdi]_[Tarih]`

---

## VIEW 2 — Hata Defteri & Telafi (`renderHataDefteri`)

### Genel Mantık

İki sekme:
- **A4 Form** — yazdırılabilir hata defteri formu
- **Dijital Havuz** — kayıtlı hataların dijital yönetimi

State: `App.hataAktifSekme` — `'a4'` veya `'dijital'`

### Bölüm 1 — Araç Çubuğu

- Sekme butonları: "A4 Form" | "Dijital Havuz"
- Öğrenci seçici: `id="hata-ogrenci-select"` — aktif öğrenci varsayılan
- "Aktif Öğrenciyi Doldur" butonu
- A4 sekmesinde: "Yazdır" butonu

### Sekme 1 — A4 Form (`renderHataA4`)

Yazdırılabilir hata defteri formu. A4 yatay.

**Üst başlık bandı:**
- "HATA DEFTERİ & TELAFİ FORMU"
- Öğrenci adı | Sınıf | Tarih

**Hata Tablosu:**

Tablo sütunları:
```
#  |  Ders  |  Konu  |  Hata Türü  |  Açıklama  |  Telafi Tarihi  |  Telafi Edildi □
```

Hata türleri: `'Bilgi Eksikliği'` | `'Dikkat Hatası'` | `'Soru Kökü/Anlama'` | `'Süre/Yetişmedi'`

Veri modu (`formModu`):
- **"Dolu"** — `Store.getHatalar(ogrenciId)` kayıtlı hatalar + boş satırlar tamamlar
- **"Boş Şablon"** — tamamen boş satırlar, elle doldurulacak

Satır sayısı seçici: 10 / 15 / 20 satır — A4'e sığacak şekilde

Print: `PrintEngine.yazdir(html, { yatay: true })`

### Sekme 2 — Dijital Havuz (`renderHataDijital`)

Kayıtlı hata kartları, filtrelenebilir.

**Araç çubuğu:**
- Ders filtresi
- Hata türü filtresi
- "+ Hata Ekle" butonu → `App.openHataModal()`

**Hata Kartları:**

Her kart:
- Ders chip + hata türü badge
- Konu adı (bold)
- Açıklama (muted)
- Telafi durumu: telafi edilmedi / 1 gün / 3 gün / 7 gün sonra
- Telafi tarihi badge — geçmişse kırmızı
- "Telafi Edildi" butonu → `Store.updateHata(id, { telafiDurumu: true })` + yeniden render
- Düzenle + Sil butonları

**1-3-7 Gün Telafi Döngüsü:**
Hata eklendiğinde `tekrarTarihi` otomatik olarak `bugün + 1 gün` set edilir.
"Telafi Edildi" işaretlenince bir sonraki `tekrarTarihi` = `bugün + 3 gün`.
3 gün sonra tekrar "Telafi Edildi" → `tekrarTarihi` = `bugün + 7 gün`.
7 gün sonra "Telafi Edildi" → hata kapatılmış sayılır.

Bu döngü `Store.addHata()` ve `Store.updateHata()` içinde yönetilir.

### Hata Modal (`App.openHataModal(hataId = null)`)

Form alanları:
- Ders (select — aktif öğrencinin dersleri)
- Konu (select — ders seçince dolar, opsiyonel)
- Hata Türü (select — 4 seçenek)
- Açıklama (textarea)

Kaydet → `Store.addHata()` veya `Store.updateHata()` + yeniden render

---

## `renderCurrentView()` Güncellemesi

```javascript
case 'report':       this.renderReport();       break;
case 'hata-defteri': this.renderHataDefteri();  break;
```

---

## Kurallar

1. Rapor önizlemesi ekranda A4 oranında görünür — aynı HTML print'te de kullanılır
2. Print'te sidebar, topbar, araç çubukları görünmez — sadece `#print-area` içi basılır
3. Hata türleri sabit liste — kullanıcı ekleyemez (KONU_DURUMLARI gibi sabit)
4. 1-3-7 döngüsü Store içinde yönetilir, UI sadece mevcut durumu gösterir
5. `renderReportSlipHTML` ve `renderReportFullHTML` — string döndürür, DOM'a dokunmaz
6. Öğrenci seçiciler (`report-ogrenci-select`, `hata-ogrenci-select`) her render'da `Store.getOgrenciler()` ile dolar
