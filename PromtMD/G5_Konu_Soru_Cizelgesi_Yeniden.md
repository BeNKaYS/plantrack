# Plantrack — G5: Konu & Soru Çizelgesi Yeniden Tasarımı

---

## Bağlam

G1'de Konu & Soru Çizelgesi D/Y/B/S sayı girişli ve hafta sütunlu olarak
implement edildi. Bu güncellemeyle tamamen yeniden tasarlanıyor:

- Ünite sütunu kaldırılıyor
- Hafta sütunları → günlük sütunlar (ayın her günü ayrı sütun)
- D/Y/B/S sayı girişi → elle işaretlenebilir kutucuklar
- Yatay A4'e otomatik sığdırma

Sadece `renderCizelgeKonuSoruHTML()` ve ekran önizleme render'ı değişiyor.
Diğer şablonlar değişmez.

---

## Tablo Yapısı

### Sütunlar

```
Konu Adı  |  1  |  2  |  3  |  4  |  5  | ... |  28/29/30/31
```

- **Konu Adı sütunu:** sabit genişlik, solda — konu adı yazılır, ünite bilgisi yok
- **Gün sütunları:** seçili ayın kaç günü varsa o kadar sütun (28–31 arası)
- Her gün sütunu başlığında: gün numarası (1, 2, 3...) + altında gün adı kısaltması (Pt, Sa, Ça, Pe, Cu, Ct, Pz)
- Bugünün günü vurgulu başlık (ekran görünümünde)

### Satırlar

`Store.getKonularForDers(dersId)` — **ünite gruplandırması olmadan** düz liste.
Her konu bir satır.

### Hücreler

Her konu × gün hücresi **4 küçük kutucuk** içerir:

```
┌─┐ ┌─┐ ┌─┐ ┌─┐
│D│ │Y│ │B│ │S│
└─┘ └─┘ └─┘ └─┘
```

- **D** = Doğru
- **Y** = Yanlış
- **B** = Boş
- **S** = Soru (toplam — isteğe bağlı dördüncü kutu)

Kutucuklar **sadece baskıda** — ekranda doldurulabilir alan yok, print çıktısı elle işaretlenir.

Kutucuk HTML (print-safe):
```html
<div style="display:flex; gap:1px; justify-content:center; align-items:center;">
  <div style="width:7px; height:7px; border:0.8px solid #374151; border-radius:1px;"></div>
  <div style="width:7px; height:7px; border:0.8px solid #374151; border-radius:1px;"></div>
  <div style="width:7px; height:7px; border:0.8px solid #374151; border-radius:1px;"></div>
  <div style="width:7px; height:7px; border:0.8px solid #374151; border-radius:1px;"></div>
</div>
<div style="display:flex; gap:1px; justify-content:center; font-size:5px; color:#6b7280; margin-top:1px;">
  <span style="width:7px; text-align:center;">D</span>
  <span style="width:7px; text-align:center;">Y</span>
  <span style="width:7px; text-align:center;">B</span>
  <span style="width:7px; text-align:center;">S</span>
</div>
```

---

## Yatay A4'e Otomatik Sığdırma

A4 yatay içerik alanı: yaklaşık **281mm** (297mm - 16mm margin).

Formül:
- Konu adı sütunu: sabit **42mm**
- Gün sütunları: kalan alan / gün sayısı
  - 31 günlük ay: `(281 - 42) / 31 = ~7.7mm` her gün sütunu
  - 28 günlük ay: `(281 - 42) / 28 = ~8.5mm` her gün sütunu

Tablo CSS:
```html
<table style="
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.52rem;
  line-height: 1.2;
">
```

Konu adı sütunu:
```html
<col style="width: 15%;">   <!-- ~42mm / 281mm ≈ %15 -->
```

Gün sütunları: kalan %85 eşit bölünür — `table-layout: fixed` ile otomatik.

Konu adı hücresi:
```html
<td style="
  padding: 2px 3px;
  font-size: 0.55rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
  border: 0.5px solid #d1d5db;
">
```

`white-space: nowrap` + `text-overflow: ellipsis` + `max-width: 0` kombinasyonu
konu adının sütun dışına taşmasını engeller.

Gün hücresi:
```html
<td style="
  padding: 2px 1px;
  text-align: center;
  vertical-align: middle;
  border: 0.5px solid #d1d5db;
  height: 18px;
">
```

---

## Başlık Bandı

```
[Koç Adı / Kurum]    KONU & ÇALIŞMA TAKİP ÇİZELGESİ    [Öğrenci Adı | Ders | Ay-Yıl]
```

Orta başlık: `font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px`

---

## Gün Başlıkları

```html
<th style="font-size: 0.5rem; font-weight: 700; text-align: center; border: 0.5px solid #d1d5db; padding: 2px 1px;">
  <div>15</div>
  <div style="font-weight: 400; color: #6b7280;">Cu</div>
</th>
```

Hafta sonu günleri (Ct, Pz) başlığı hafif farklı arka plan rengi — `background: #f3f4f6`

---

## Ekran Önizleme

Ekranda kutucuklar gösterilmez — sadece ızgara yapısı görünür.
Her hücre boş, tıklanamaz. Amaç baskı önizlemesi.

Ekran önizlemede:
- Konu adları gösterilir
- Gün sütunları gösterilir (dar, sayı başlıklı)
- Hücreler boş gri zemin
- "Bu çizelge baskı için tasarlanmıştır — elle doldurulur" bilgi banner'ı

---

## `renderCizelgeKonuSoruHTML(ogr)` Fonksiyonu

Parametre olarak seçili ders ID'sini de alır:
`renderCizelgeKonuSoruHTML(ogr, dersId, ayIndex)`

- `dersId`: seçili ders
- `ayIndex`: 0–11 arası ay (0 = Ocak) — ay seçici dropdown'dan gelir
- Ayın kaç günü olduğunu hesapla: `new Date(yil, ayIndex + 1, 0).getDate()`
- Her günün hangi gün adına denk geldiğini hesapla: `new Date(yil, ayIndex, gun).getDay()`
- Konu listesini `Store.getKonularForDers(dersId)` ile al — ünite gruplaması yok, düz liste

---

## Araç Çubuğu Güncellemesi

Mevcut araç çubuğuna (Konu & Soru şablonu seçiliyken):
- Ders seçici — `Store.getDerslerForOgrenci(ogr)`
- Ay seçici — Ocak–Aralık dropdown
- "Yazdır" butonu

Ünite filtresi varsa kaldırılır.
"Mevcut Durumu Doldur / Boş Şablon" toggle kaldırılır — artık sadece boş şablon var.

---

## Kurallar

1. Tablo `table-layout: fixed` — sütun genişlikleri sabit, taşma olmaz
2. Konu adı `text-overflow: ellipsis` — uzun isimler kesilir, satır bozmaz
3. Kutucuklar sadece print HTML'inde — ekran render'ında kutucuk yok
4. Hafta sonu sütun başlıkları farklı arka plan — takvim okunurluğu artar
5. `renderCizelgeKonuSoruHTML` fonksiyonu HTML string döndürür — DOM'a dokunmaz
6. Print: `PrintEngine.yazdir(html, { yatay: true })` — G4'teki güncel PrintEngine kullanılır
7. Ünite gruplandırması tamamen kaldırılır — konular düz liste olarak sıralanır
