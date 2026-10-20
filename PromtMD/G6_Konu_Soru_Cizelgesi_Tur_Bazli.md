# Plantrack — G6: Konu & Soru Çizelgesi — Tur Bazlı Matris

---

## Bağlam

G1, G5 ile Konu & Soru Çizelgesi farklı şekillerde denendi.
Bu sürümde referans görüntüye birebir uygun yapı implement edilecek.
G5 tamamen **geçersiz** sayılır, `renderCizelgeKonuSoruHTML()` sıfırdan yazılır.

---

## Genel Yapı

Görüntüdeki çizelge:

```
Başlık bandı: [LGS KONU & 10'LU SORU TAKİP ÇİZELGESİ] [DERS ROZETİ]
              [Öğrenci: ...] [Alan: ...] [Hedef: ...]

Tablo:
  Satır başlığı: # | KONU ADI | 1.Tur | 2.Tur | ... | 10.Tur
  Alt başlık:                  D  Y  S   D  Y  S  ...

  Her satır: sıra no | konu adı | boş hücreler (10 tur × 4 kolon)

Alt bant: NOTLAR alanı (tıklanabilir, çok satırlı)
Sol kenar: Dikey koç / kurum adı
```

---

## Tablo Detayı

### Sütun Yapısı

```
# | KONU ADI | [1.Tur: D Y B S] | [2.Tur: D Y B S] | ... | [10.Tur: D Y B S]
```

- `#` sütunu: sıra numarası, dar (3%)
- `KONU ADI` sütunu: geniş (25%)
- Her tur: 4 alt sütun — D, Y, B, S (kalan %72 eşit bölünür → her tur %7.2, her hücre %1.8)

### Thead — İki Satırlı Başlık

**1. satır (tur başlıkları):**
```html
<tr>
  <th rowspan="2">#</th>
  <th rowspan="2">KONU ADI</th>
  <th colspan="4">1. Tur</th>
  <th colspan="4">2. Tur</th>
  ...
  <th colspan="4">10. Tur</th>
</tr>
```

**2. satır (D/Y/B/S alt başlıkları):**
```html
<tr>
  <!-- # ve KONU ADI rowspan ile kapalı -->
  <th>D</th><th>Y</th><th>B</th><th>S</th>
  <th>D</th><th>Y</th><th>B</th><th>S</th>
  ... (10 tur × 4)
</tr>
```

### Tbody — Konu Satırları

`Store.getKonularForDers(dersId)` — düz liste, ünite gruplaması yok.

Her satır:
```html
<tr>
  <td>1</td>
  <td>Fiilimsiler (Eylemsiler)</td>
  <!-- 10 tur × 4 boş hücre = 40 hücre -->
  <td></td><td></td><td></td><td></td>  <!-- 1.Tur -->
  <td></td><td></td><td></td><td></td>  <!-- 2.Tur -->
  ...
</tr>
```

Her boş hücre tıklanamaz, elle doldurulacak.

---

## Başlık Bandı

```
[İkon] [DERS ADI] KONU & 10'LU SORU TAKİP ÇİZELGESİ   [DERS ROZETİ]
       Müfredat Konuları İçin Tur Bazlı Doğru – Yanlış – Boş Kontrol Matrisi

                              Öğrenci: [AD SOYAD]   Alan: [SINIF]   Hedef: [HEDEF]
```

- Sol: ders ikonu (Lucide) + büyük başlık
- Sağ: öğrenci bilgileri (öğrenci adı, sınıf, hedef) — `Store.getAktifOgrenci()`'den
- Ders adı: `Store.data.dersler`'den seçili ders

---

## Tur Sayısı Seçici

Varsayılan 10 tur. Araç çubuğunda "Tur Sayısı" select:
- 5 Tur
- 8 Tur
- 10 Tur (varsayılan)
- 12 Tur

`App.konuSoruTurSayisi` state değişkeni.
Değişince tablo yeniden render edilir.

---

## Notlar Alanı

Tablonun hemen altında:

```
✏ NOTLAR   [Öğrenci & Koç Not Alanı]
                                    Eksik konular, çözülecek ek kaynaklar ve soru hedefleri için not alanı

[Buraya tıklayarak not yazabilir veya çizelgeyi yazdırıp el yazınızla doldurabilirsiniz...]
```

- Başlık: "NOTLAR" + amber rozet "Öğrenci & Koç Not Alanı"
- Sağda: açıklama metni (muted, küçük, italic)
- Alt kısım: çok satırlı textarea veya contenteditable div
  - `Store.getKonuTakipNot(ogr.id, dersId)` ile mevcut notu yükle
  - Değişince `Store.saveKonuTakipNot(ogr.id, dersId, metin)` ile kaydet
  - Baskıda: yazılan metin gösterilir, textarea border'ı gizlenir

---

## Sol Kenar — Dikey Koç/Kurum Adı

Tablonun sol dışında dikey yazı:
```
KOÇ: [KOÇ ADI] | [KURUM]
```

CSS:
```css
.cizelge-sol-kenar {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 0.5rem;
  color: #9ca3af;
  font-weight: 600;
  letter-spacing: 0.08em;
  white-space: nowrap;
  padding: 4px 2px;
  border-right: 1px solid #e5e7eb;
}
```

`Store.getKocProfili()` → `ad soyad | kurum`

---

## A4 Yatay Sığdırma

10 tur × 4 sütun = 40 veri sütunu + 2 sabit sütun = toplam 42 sütun.

A4 yatay içerik alanı: ~281mm

```
# sütunu:        8mm  (sabit)
Konu adı:       55mm  (sabit)
Kalan:         218mm  → 10 tur × 4 hücre = 40 hücre → her hücre ~5.45mm
```

Tablo CSS:
```html
<table style="
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.48rem;
  line-height: 1.2;
">
  <col style="width: 2.8%;">    <!-- # -->
  <col style="width: 19.5%;">   <!-- Konu Adı -->
  <!-- 40 veri sütunu: kalan %77.7 eşit -->
```

Konu adı hücresi:
```html
<td style="
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
  font-weight: 600;
  text-align: center;
  padding: 2px 3px;
  border: 0.5px solid #d1d5db;
">
```

Veri hücreleri:
```html
<td style="
  height: 14px;
  border: 0.5px solid #d1d5db;
  padding: 0;
">
```

---

## Tur Başlık Renklendirmesi

Her tur başlığı farklı hafif arka plan — tekrarlayan 5 renk:

```javascript
const TUR_RENKLERI = [
  '#eff6ff',  // mavi
  '#f0fdf4',  // yeşil
  '#fefce8',  // sarı
  '#fff7ed',  // turuncu
  '#fdf4ff',  // mor
];
// 1.Tur → index 0, 2.Tur → index 1, ... 6.Tur → index 0 (döngüsel)
const renk = TUR_RENKLERI[(turNo - 1) % TUR_RENKLERI.length];
```

D/Y/B/S alt başlık satırı tur rengiyle uyumlu, hafif koyu ton.

---

## Araç Çubuğu

Konu & Soru şablonu seçiliyken:

```
[Öğrenci Seçici]  [Ders Seçici]  [Tur Sayısı: 10▾]  [Yazdır]
```

- Öğrenci değişince öğrenci bilgileri başlık bandında güncellenir
- Ders değişince konu listesi yeniden yüklenir
- Tur sayısı değişince tablo yeniden render edilir

---

## Store — Yeni Metot

```javascript
Store.getKonuTakipNot(ogrenciId, dersId)
// Store.data.cizelgeNotlari[`${ogrenciId}_${dersId}`] döndürür

Store.saveKonuTakipNot(ogrenciId, dersId, metin)
// Store.data.cizelgeNotlari[`${ogrenciId}_${dersId}`] = metin; save()
```

`Store.data.cizelgeNotlari` objesi yoksa `{}` olarak başlatılır.

---

## Ekran Önizleme

`#cizelge-preview-area` içinde:
- Tablo ekrana sığmayabilir — `overflow-x: auto` ile yatay scroll
- Ekranda font daha büyük tutulabilir — `0.65rem`
- "Bu çizelge baskı için tasarlanmıştır" bilgi satırı gösterilmez
- Notlar alanı ekranda düzenlenebilir

---

## Kurallar

1. G5 geçersiz — `renderCizelgeKonuSoruHTML()` tamamen yeniden yazılır
2. `table-layout: fixed` — sütun taşması olmaz
3. Tur sayısı değişkeni `App.konuSoruTurSayisi` — varsayılan 10
4. Notlar `Store.data.cizelgeNotlari` içinde öğrenci + ders bazlı saklanır
5. Sol kenar dikey yazısı print HTML içinde `position: absolute; left: 0` olarak konumlanır
6. Print: `PrintEngine.yazdir(html, { yatay: true })` — G4'teki motor
7. Tur renkleri döngüsel — 5 renk tekrar eder
8. Konu adı hücresi `text-overflow: ellipsis` — uzun isimler kesilir
