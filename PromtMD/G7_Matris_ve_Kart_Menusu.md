# Plantrack — G7: Çalışma & Ödev Kartları + Klasik Matris Menüsü

---

## Bağlam

Mevcut `data-nav="matrix"` menü öğesi "Çalışma & Ödev Matrisi" adını taşıyor
ve konu × kaynak grid görünümü sunuyor. Bu güncellemeyle:

1. Mevcut `matrix` menü öğesinin adı **"Çalışma & Ödev Kartları"** olarak değişiyor
2. Altına yeni bir menü öğesi **"Çalışma & Ödev Matrisi"** ekleniyor — Planör'deki
   klasik grid yapısı bu yeni view'da implement ediliyor

---

## Sidebar Değişikliği (`index.html`)

Mevcut "Takip & Planlama" grubu:

```
── Takip & Planlama ──────────────────────────────────
[calendar-days]  Çalışma & Ödev Matrisi   data-nav="matrix"
[check-square]   Ödev Geçmişi             data-nav="tasks"
```

Güncellenmiş hali:

```
── Takip & Planlama ──────────────────────────────────
[layout-list]    Çalışma & Ödev Kartları  data-nav="matrix"
[grid-3x3]       Çalışma & Ödev Matrisi  data-nav="grid-matrix"
[check-square]   Ödev Geçmişi            data-nav="tasks"
```

- `data-nav="matrix"` → buton adı "Çalışma & Ödev Kartları", ikon `layout-list`
- Yeni buton: `data-nav="grid-matrix"`, ad "Çalışma & Ödev Matrisi", ikon `grid-3x3`
- `data-nav="tasks"` değişmez

`index.html`'e yeni view section eklenir:
```html
<section id="view-grid-matrix" class="view-section hidden w-full h-full overflow-y-auto"></section>
```

---

## VIEW — Çalışma & Ödev Kartları (`renderMatrix` — mevcut, sadece isim değişir)

`renderMatrix()` fonksiyonu ve `view-matrix` section'ı içeriği **değişmez**.
Sadece sidebar menü adı ve ikonu güncellenir.

---

## VIEW — Çalışma & Ödev Matrisi (`renderGridMatrix`)

Yeni fonksiyon: `App.renderGridMatrix()`
Yeni section: `view-grid-matrix`

`renderCurrentView()` switch bloğuna eklenir:
```javascript
case 'grid-matrix': this.renderGridMatrix(); break;
```

### Genel Yapı

Klasik konu × kaynak grid matris.
Satırlar konular, sütunlar seçili kaynaklar (yayınlar).
Her hücre: o konu için o kaynaktan çözülen D/Y/B soru bilgisi.

Aktif öğrenci yoksa "Öğrenci seçin" mesajı göster.

---

### Bölüm 1 — Başlık & Araç Çubuğu

Sol:
- Başlık: "Çalışma & Ödev Matrisi"
- Aktif öğrenci adı + modül rozeti

Ders sekmeleri: `Store.getDerslerForOgrenci(ogr)` ile aktif öğrencinin dersleri.
Her ders bir tab butonu. Tıklanınca `App.gridMatrisAktifDersId` güncellenir.
İlk açılışta ilk ders otomatik seçili.

Sağ:
- "Sütunları Düzenle" butonu → `App.openMatrisSutunModal()`
- "Yeni Ödev" butonu → `App.openGorevModal(ogr.id)`

---

### Bölüm 2 — Grid Tablo

```
               | [Kaynak 1]      | [Kaynak 2]      | [Kaynak 3]      | ...
               | Yayınevi        | Yayınevi        | Yayınevi        |
───────────────|─────────────────|─────────────────|─────────────────|
Ünite 1 ───────────────────────────────────────────────────────────────
  Konu 1       | 45/60  D:38 Y:5 |      —          | 20/30  D:18 Y:2 |
  Konu 2       |      —          | 10/20  D:8 Y:2  |      —          |
Ünite 2 ───────────────────────────────────────────────────────────────
  Konu 3       | 30/40  D:27 Y:3 |      —          |      —          |
```

**Tablo başlığı (thead):**
- Birinci sütun: "Konu" (sabit, geniş)
- Sonraki sütunlar: `ogr.seciliKaynaklar` listesinden her kaynak için
  - Üst satır: kaynak adı (bold)
  - Alt satır: yayınevi adı (muted, küçük)

**Tablo gövdesi (tbody):**

Konular ünite gruplarıyla gösterilir:
- Ünite başlık satırı: tüm sütunları kaplayan tek hücre, ünite adı bold
- O üniteye ait konu satırları

Her konu × kaynak hücresi:
- `Store.getGorevler(ogr.id)` içinden `dersId + konuId + kaynakId` filtrele
- Eşleşme varsa:
  - `cozulenSoru / hedefSoru` (örn: "45 / 60")
  - `D: X  Y: X  B: X` küçük font
  - Doluluk oranına göre hücre arka plan rengi:
    - Boş: açık gri
    - Başlandı (0 < oran < %70): amber tonu
    - İyi (%70–%89): açık yeşil
    - Tamamlandı (%90+): koyu yeşil
- Eşleşme yoksa: "—" gri
- Hücreye tıklanınca `App.openHucreDuzenleModal(ogr.id, konu.id, kaynak.id)` açılır

**Son sütun — Konu Durumu:**
`Store.getKonuDurumu(ogr.id, konu.id)` → ikon + kısa etiket
Tıklanınca 4 seçenekli dropdown: İşlenmedi / Çalışılıyor / Tamam / Tekrar Lazım

---

### Bölüm 3 — Matris Alt Özet

Tablonun altında tek satır:
- Toplam çözülen soru (seçili ders, tüm kaynaklar)
- Ortalama doğruluk: `D / (D+Y+B) × 100`
- Tamamlanan konu %: `tamam sayısı / toplam konu × 100` — ince ilerleme çubuğu

---

### Hücre Düzenleme Modalı (`App.openHucreDuzenleModal`)

Başlık: "[Konu Adı] — [Kaynak Adı]"

Alanlar:
- Hedef Soru (number)
- Doğru (number)
- Yanlış (number)
- Boş (number — otomatik: hedef - doğru - yanlış, elle de girilebilir)
- Süre (dakika, opsiyonel)
- Not (textarea, opsiyonel)

Kaydet:
- Eşleşen görev varsa → `Store.updateGorev()`
- Yoksa → `Store.addGorev()` — `dersId`, `konuId`, `kaynakId` otomatik

---

### Matris Sütun Seçici Modalı (`App.openMatrisSutunModal`)

`Store.getKaynaklar(ogr.modulId)` ile modüle ait kaynakları listeler.
Checkbox listesi — işaretlenenler `ogr.seciliKaynaklar`'a kaydedilir.
Min 1, max 8 sütun.

---

## Kurallar

1. `renderMatrix()` ve `view-matrix` içeriği değişmez — sadece sidebar adı/ikonu güncellenir
2. Yeni `view-grid-matrix` section `index.html`'e eklenir
3. `renderGridMatrix()` yeni fonksiyon — `renderMatrix()`'ten bağımsız
4. `App.gridMatrisAktifDersId` yeni state değişkeni
5. `openHucreDuzenleModal` ve `openMatrisSutunModal` her iki view da kullanabilir — ayrı yazmak gerekmez
6. Ders, konu, kaynak adları `Store.data`'dan okunur — hardcode yok
7. Hücre renklendirmesi doluluk oranına göre — eşik değerleri: %70 ve %90
8. Ünite başlık satırı tıklanamaz — sadece görsel gruplama
