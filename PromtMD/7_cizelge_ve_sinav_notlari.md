# Plantrack — Prompt 7: Çizelge Robotu & Sınav Notları

---

## Bağlam

Prompt 1–6 tamamlandı. Bu promptta iki view eklenecek:
- `renderCizelgeRobotu()` → `view-cizelge-robotu`
- `renderSinavNotlari()` → `view-sinav-notlari`

Print motoru Prompt 2'de tanımlandı: `PrintEngine.yazdir(icerik, ayarlar)`
Tüm yazdırma işlemleri bu motor üzerinden yapılır.

---

## VIEW 1 — Çizelge Robotu (`renderCizelgeRobotu`)

### Genel Mantık

Öğrenci için A4 çıktı şablonları üreten modül. Kullanıcı şablon seçer,
önizler, yazdırır. Store verisini okuyarak otomatik doldurur ama elle
de düzenlenebilir.

State değişkeni: `App.cizelgeAktifSablon` — aktif şablon tipi

### Bölüm 1 — Araç Çubuğu

Sol:
- Başlık: "Çizelge Robotu"
- Öğrenci seçici: `id="cizelge-ogrenci-select"` — tüm öğrenciler, aktif öğrenci varsayılan
- "Aktif Öğrenciyi Doldur" butonu

Sağ:
- "Yazdır" butonu → `App.printCizelge()`

### Bölüm 2 — Şablon Seçici

3 şablon kartı yan yana:

```
[Haftalık Çalışma Planı]   [Ödev Takip Çizelgesi]   [Konu Takip Tablosu]
  A4 Dikey                   A4 Dikey                  A4 Yatay
  Haftanın günlerine         Bu haftaki ödevleri        Derslerin konularını
  ders bloğu atama           takip et, işaretle         işaretle, durumları gör
```

Her kart tıklanınca `App.cizelgeAktifSablon` güncellenir, önizleme yenilenir.
Aktif kart vurgulu.

### Bölüm 3 — Önizleme Alanı

`id="cizelge-preview-area"` — A4 oranında beyaz kart, gölgeli.
Seçili şablona göre içi dolar. Ekranda görünen aynı HTML print'te kullanılır.

---

### Şablon 1 — Haftalık Çalışma Planı (`renderCizelgeHaftalikPlan`)

A4 dikey.

**Üst başlık bandı:**
- Koç adı + kurum (sol)
- "HAFTALIK ÇALIŞMA PLANI" (orta, büyük)
- Hafta tarih aralığı + öğrenci adı (sağ)

**Haftanın 7 Günü — Zaman Blokları:**

Her gün için dikey blok (7 sütun):
```
PAZARTESİ
──────────
08:00 │ ......
09:00 │ ......
10:00 │ ......
...
22:00 │ ......
```

Her saat satırı: boş çizgi — elle doldurulacak.
Öğrencinin aktif görevleri varsa ilgili güne otomatik yerleştirilebilir
(deadline'a göre — bu opsiyonel özellik, toggle ile açılır/kapanır).

**Alt kısım:**
- Haftalık hedef soru sayısı (varsa `ogr.hedefSoru`)
- Koçun notu: `ogr.kocNotu` — boş çizgili alan

---

### Şablon 2 — Ödev Takip Çizelgesi (`renderCizelgeOdevTakip`)

A4 dikey.

**Üst başlık bandı:**
- "ÖDEV TAKİP ÇİZELGESİ"
- Öğrenci adı | Sınıf | Tarih aralığı

**Ödev Tablosu:**

`Store.getAktifGorevler(ogrenciId)` + gecikmiş görevler — toplam liste.

Tablo sütunları:
```
#  |  Ders  |  Konu / Görev  |  Kaynak  |  Hedef Soru  |  Teslim  |  Tamamlandı □
```

"Tamamlandı □" sütunu — boş kare kutu, elle işaretlenir.

Görev yoksa: boş satırlar (10 satır) — elle doldurulacak şablon.

**Alt kısım:**
- Koçun notu
- İmza bandı: Koç adı + unvan

---

### Şablon 3 — Konu Takip Tablosu (`renderCizelgeKonuTakip`)

A4 yatay.

**Üst başlık bandı:**
- "KONU TAKİP TABLOSU"
- Öğrenci adı | Ders adı | Tarih

Ders seçici: `id="cizelge-ders-select"` — öğrencinin dersleri, seçince tablo yenilenir.

**Konu Tablosu:**

`Store.getKonularForDers(dersId)` — ünite gruplarıyla.

Tablo sütunları:
```
Ünite  |  Konu  |  İşlendi □  |  Tekrar □  |  Test □  |  Not
```

Mevcut konu durumları (`Store.getKonuDurumu()`) otomatik işaretlenir:
- `tamam` → "İşlendi" kutusu işaretli
- `tekrar_lazim` → "Tekrar" kutusu işaretli
- Boş mod seçilirse tüm kutular boş — elle doldurulacak şablon

Üst kısımda toggle: "Mevcut Durumları Doldur" / "Boş Şablon"

**Alt kısım:**
- Toplam konu sayısı + tamamlanan

---

### Print Fonksiyonu

```javascript
App.printCizelge() {
  const ogrenciId = document.getElementById('cizelge-ogrenci-select').value;
  const ogr = Store.getOgrenci(ogrenciId);
  if (!ogr) { this.showToast('Öğrenci seçin'); return; }

  let html, yatay;
  switch (this.cizelgeAktifSablon) {
    case 'haftalik-plan':
      html = this.renderCizelgeHaftalikPlanHTML(ogr);
      yatay = false;
      break;
    case 'odev-takip':
      html = this.renderCizelgeOdevTakipHTML(ogr);
      yatay = false;
      break;
    case 'konu-takip':
      html = this.renderCizelgeKonuTakipHTML(ogr);
      yatay = true;
      break;
  }

  PrintEngine.yazdir(html, { yatay });
}
```

Her `render*HTML(ogr)` fonksiyonu HTML string döndürür, DOM'a dokunmaz.

---

## VIEW 2 — Sınav Notları (`renderSinavNotlari`)

### Genel Mantık

Öğrencinin sınav notlarını giren, takip eden ve trend gösteren ekran.

### Bölüm 1 — Araç Çubuğu

Sol:
- Başlık: "Sınav Notları"
- Ders filtresi: `id="notlar-ders-filter"` — aktif öğrencinin dersleri + "Tümü"
- Tür filtresi: `id="notlar-tur-filter"` — Yazılı / Sözlü / Proje / Kısa Sınav / "Tümü"

Sağ:
- "+ Not Ekle" butonu → `App.openSinavNotuModal()`

### Bölüm 2 — Ders Bazlı Özet Kartları

`Store.getDerslerForOgrenci(ogr)` — her ders için bir özet kartı.
Yatay kaydırmalı satır.

Her kart:
- Ders adı + ders rengi
- Ortalama not (büyük sayı) — `Store.getNotOrtalamasi(ogr.id, ders.id)`
  - Veri yoksa "—"
  - 0–49: kırmızı, 50–69: amber, 70–84: mavi, 85+: yeşil
- Son not + tarihi (küçük, muted)
- Trend oku: son 3 not karşılaştırması — yukarı (yeşil) / aşağı (kırmızı) / yatay (slate)

### Bölüm 3 — Trend Grafiği

Seçili ders için son 10 not — basit çizgi grafik.
Custom inline SVG ile çizilir — dış kütüphane kullanılmaz.

X ekseni: tarihler
Y ekseni: not değerleri (0–100)
Her veri noktası: dolu daire, üzerine gelinince not ve tarih gösterilir.
Notlar `Store.getSinifNotlari(ogr.id, aktifDersId)` — tarihe göre sıralı.

Veri 3'ten azsa grafik gösterilmez, "En az 3 sınav notu gerekli" mesajı.

### Bölüm 4 — Not Listesi

`Store.getSinifNotlari(ogr.id)` — filtre ve türe göre gösterilir.
En yeni üstte.

Her not kartı:
- Ders adı chip
- Sınav adı (bold)
- Not (büyük, renkli — aynı renk mantığı)
- Tür badge + tarih
- Düzenle ikonu → `App.openSinavNotuModal(not.id)`
- Sil ikonu → onay → `Store.deleteSinifNotu(id)` + yeniden render

Not yoksa: "Henüz sınav notu eklenmedi" mesajı.

### Sınav Notu Modal (`App.openSinavNotuModal(notId = null)`)

Alanlar:
- Ders (select — `Store.getDerslerForOgrenci(ogr)`)
- Sınav Adı (text + hızlı seçim chip'leri: "1. Yazılı", "2. Yazılı", "Sözlü", "Proje", "Kısa Sınav")
- Not (number, 0–100)
- Tür (select: yazili / sozlu / proje / kisa-sinav)
- Tarih (date, varsayılan bugün)

Kaydet → `Store.addSinifNotu()` veya `Store.updateSinifNotu()` + yeniden render

---

## `renderCurrentView()` Güncellemesi

```javascript
case 'cizelge-robotu':  this.renderCizelgeRobotu();  break;
case 'sinav-notlari':   this.renderSinavNotlari();   break;
```

---

## Kurallar

1. Çizelge şablonları HTML string döndürür — `render*HTML()` fonksiyonları DOM'a dokunmaz
2. Print'te sadece `#print-area` içi basılır — Prompt 2'deki PrintEngine mantığı
3. Trend grafiği custom SVG — dış kütüphane kullanılmaz
4. `getNotOrtalamasi()` veri yoksa `null` döner — UI "—" gösterir, 0 göstermez
5. Öğrenci seçici `render*` her çağrıldığında `Store.getOgrenciler()` ile dolar
6. Sınav notları tarihe göre sıralı — en yeni üstte
7. Çizelge robotu başlangıçta ilk şablon ("haftalik-plan") aktif
