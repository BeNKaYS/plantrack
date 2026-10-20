# Plantrack — G1: Çizelge Robotu Güncelleme
# Konu & Soru Çizelgesi + Zaman Bloklama + Alışkanlık Zinciri

---

## Bağlam

Mevcut `renderCizelgeRobotu()` fonksiyonu ve çizelge şablon sistemi çalışıyor.
Bu güncellemeyle üç yeni şablon eklenecek:

1. **Konu & Soru Çizelgesi** — D/Y/B/S bazlı aylık konu takip tablosu
2. **Zaman Bloklama** — Sürükle-bırak haftalık program tablosu
3. **Alışkanlık Zinciri** — Kişiselleştirilebilir, kademeli varsayılan, öğrenciye özel

Mevcut şablonlar (Haftalık Çalışma Planı, Ödev Takip Çizelgesi, Konu Takip Tablosu)
**değiştirilmeyecek** — sadece yeni şablonlar ekleniyor.

---

## Store Değişiklikleri

### Yeni Alan: `aliskanlikZincirleri`

`Store.data` yapısına ekle:
```javascript
aliskanlikZincirleri: {}
// { [ogrenciId]: [ { id, baslik, renk, aktif }, ... ] }
```

### Yeni Alan: `zamanPlanlari`

```javascript
zamanPlanlari: {}
// { [ogrenciId]: { [gun_saat_key]: { kategori, baslik, renk } } }
// gun_saat_key formatı: "pzt_08" (gün_saat)
```

### Varsayılan Alışkanlık Şablonları (Store'a ekle)

`getDefaultAliskanliklar(modulId)` metodu:

**`ara-sinif` modülü için:**
```javascript
[
  { id: 'al-1', baslik: 'Günlük 20 dk okuma / kitap',      renk: 'blue'    },
  { id: 'al-2', baslik: 'Matematik alıştırması (10 soru)', renk: 'indigo'  },
  { id: 'al-3', baslik: 'İngilizce kelime kartı (5 kart)', renk: 'purple'  },
  { id: 'al-4', baslik: 'Ders özetini gözden geçir',       renk: 'teal'    },
  { id: 'al-5', baslik: 'Günlük ödev tamamlama',           renk: 'emerald' },
  { id: 'al-6', baslik: 'Okumadan önce su iç / mola',      renk: 'sky'     }
]
```

**`lgs` modülü için:**
```javascript
[
  { id: 'al-1', baslik: 'Paragraf sorusu (5 paragraf)',       renk: 'rose'    },
  { id: 'al-2', baslik: 'Matematik yeni nesil soru (10 S)',   renk: 'blue'    },
  { id: 'al-3', baslik: 'Fen / sözel deneme sorusu (20 S)',   renk: 'emerald' },
  { id: 'al-4', baslik: 'Hata defterini gözden geçir',        renk: 'amber'   },
  { id: 'al-5', baslik: 'Haftalık deneme analizi',            renk: 'indigo'  },
  { id: 'al-6', baslik: 'Gece ders tekrarı (15 dk)',          renk: 'purple'  }
]
```

**`yks` modülü için:**
```javascript
[
  { id: 'al-1', baslik: 'TYT sorusu (40 soru)',              renk: 'rose'    },
  { id: 'al-2', baslik: 'AYT konu çalışması (1 konu)',       renk: 'blue'    },
  { id: 'al-3', baslik: 'Net takibi & hata analizi',         renk: 'amber'   },
  { id: 'al-4', baslik: 'Deneme sonucu konu haritası',       renk: 'emerald' },
  { id: 'al-5', baslik: 'Yanlış soru tekrarı',               renk: 'purple'  },
  { id: 'al-6', baslik: 'Motivasyon & günlük hedef yazma',   renk: 'teal'    }
]
```

### Store Metodları (Eklenecek)

```javascript
// Öğrencinin alışkanlıklarını getir — yoksa modüle göre varsayılanı döndür
Store.getAliskanliklar(ogrenciId)

// Öğrencinin alışkanlıklarını kaydet
Store.saveAliskanliklar(ogrenciId, liste)

// Öğrencinin zaman planını getir
Store.getZamanPlani(ogrenciId)

// Zaman planındaki tek hücreyi kaydet
Store.saveZamanHucresi(ogrenciId, gun, saat, veri)

// Zaman planındaki tek hücreyi temizle
Store.deleteZamanHucresi(ogrenciId, gun, saat)

// Tüm zaman planını temizle
Store.resetZamanPlani(ogrenciId)
```

---

## Şablon 1 — Konu & Soru Çizelgesi

### Ekran Önizlemesi (Dijital)

Araç çubuğu:
- Ders seçici — `Store.getDerslerForOgrenci(ogr)` — aktif öğrencinin dersleri
- Ay seçici — mevcut ay varsayılan, ±1 ay gezinme butonları
- "Mevcut Durumu Doldur" / "Boş Şablon" toggle
- "Yazdır" butonu

**Tablo yapısı:**

Satırlar: Seçili dersin konuları (`Store.getKonularForDers(dersId)`) — ünite gruplarıyla

Sütunlar: Seçili aya ait haftalar
```
Konu Adı  |  Hf 1 (1-7)  |  Hf 2 (8-14)  |  Hf 3 (15-21)  |  Hf 4 (22-28)  |  Hf 5+ (29-)
```

Her hücre içinde 4 alan:
```
D: [__]  Y: [__]  B: [__]  S: [__]
```
- **D** = Doğru
- **Y** = Yanlış
- **B** = Boş
- **S** = Soru (toplam çözülen — D+Y+B'den otomatik hesaplanır veya elle girilebilir)

Hücre tıklandığında mini input popup açılır: 4 sayı alanı + "Kaydet" butonu.
Veriler `Store.data.gorevler`'deki ilgili görevlerden okunur; elle giriş yapılırsa kayıt güncellenir.

**Renklendirme mantığı:**
- Boş (hiç veri yok): nötr gri
- Başlandı (S > 0 ama düşük doğruluk): amber
- İyi (%70+ doğruluk): yeşil
- Çok iyi (%90+): koyu yeşil

### A4 Çıktı (Print HTML)

A4 yatay.

**Başlık bandı:**
- Koç adı | Öğrenci adı | Ders adı | Ay/Yıl

**Tablo:**
- Her konu satırı: konu adı + 4 hafta × (D/Y/B/S) hücreleri
- Toplam satırı: her hafta için D/Y/B/S toplamları
- Doğruluk oranı satırı: `D/S × 100`

Veri mevcut ise dolu, "Boş Şablon" seçilmişse tamamen boş — elle doldurulacak.

**Print:** `PrintEngine.yazdir(html, { yatay: true })`

---

## Şablon 2 — Zaman Bloklama

### Tasarım Kararları

- Sürükle-bırak ile hücre boyama
- Boyama modu: seçili kategori rengiyle hücre dolar
- Silgi modu: tıklanan hücre temizlenir
- **Bir kez tıkla-boya:** Fare tuşuna basılı tutarak sürükleyince ardışık hücreler boyanır
- Tablo A4 yatay — baskıda tam okunaklı

### Kategoriler ve Renkleri

```javascript
const ZAMAN_KATEGORILER = [
  { id: 'okul',    label: 'Okul / Ders',        renk: '#3b82f6', bg: '#eff6ff' },
  { id: 'soru',    label: 'Soru Çözümü',         renk: '#10b981', bg: '#ecfdf5' },
  { id: 'konu',    label: 'Konu Çalışması',       renk: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'deneme',  label: 'Deneme Sınavı',        renk: '#f59e0b', bg: '#fffbeb' },
  { id: 'mola',    label: 'Mola / Serbest Zaman', renk: '#6b7280', bg: '#f9fafb' },
  { id: 'silgi',   label: 'Silgi (Temizle)',       renk: null,      bg: null      }
];
```

`ZAMAN_KATEGORILER` sabiti `data.js`'e eklenir, `window.ZAMAN_KATEGORILER` olarak export edilir.

### Ekran Yapısı

**Araç çubuğu:**
- Öğrenci seçici (aktif öğrenci varsayılan)
- Hafta seçici — bu haftanın Pzt–Paz tarihleri, ±1 hafta gezinme butonları
- "Örnek Rutin" butonu → `App.zamanBlokaOrnekRutinUygula(ogrenciId)`
- "Tüm Haftayı Temizle" butonu — onay al → `Store.resetZamanPlani(ogrenciId)`
- "Yazdır" butonu

**Kategori Paleti:**
Araç çubuğunun altında yatay sıra — her kategori bir buton.
Aktif kategori vurgulu. `App.zamanAktifKategori` state değişkeni.
Silgi kategorisi seçiliyse fare imleci değişir.

**Tablo:**

Sütunlar: 7 gün (Pazartesi → Pazar) + gün tarihleri

Satırlar: Saat dilimleri — 07:00'dan 23:00'a kadar 30 dakikalık aralıklarla (32 satır)

Her hücre:
- `data-gun="pzt"` ve `data-saat="08:00"` attribute'ları
- Boşsa: açık gri, ince border
- Doluysa: kategorinin `bg` rengi, sol kenarında `renk` renkli 3px çizgi, küçük kategori etiketi

**Sürükle-Bırak Mantığı (Vanilla JS, kütüphanesiz):**

```javascript
// App nesnesinde state
App.zamanDragging = false
App.zamanAktifKategori = 'okul'

// mousedown → dragging başlar, ilk hücreyi boya
// mousemove → dragging aktifse, üstündeki hücreyi boya
// mouseup → dragging biter
// mouseleave (tablo dışına çıkınca) → dragging biter

// Her boyama işlemi: Store.saveZamanHucresi() çağırır
// Silgi seçiliyse: Store.deleteZamanHucresi() çağırır
```

Touch desteği: `touchstart`, `touchmove`, `touchend` ile aynı mantık.

### A4 Çıktı (Print HTML)

A4 yatay, geniş font.

**Başlık bandı:**
Öğrenci adı | Hafta tarihleri | Koç adı

**Tablo:**
- Sütunlar: 7 gün
- Satırlar: 07:00–23:00, 1 saatlik aralıklar (okunabilirlik için 30dk yerine 1 saat)
- Her dolu hücre: kategorinin arka plan rengi + etiket
- Renk efsanesi (legend) tablonun sağ üst köşesinde

**Print:** `PrintEngine.yazdir(html, { yatay: true })`

---

## Şablon 3 — Alışkanlık Zinciri

### Mantık

- Her öğrencinin kendi alışkanlık listesi var (`Store.getAliskanliklar(ogrenciId)`)
- Öğrenciye ilk atandığında: modülüne göre `getDefaultAliskanliklar(modulId)` kopyalanır
- Koç alışkanlıkları düzenleyebilir — değişiklik sadece o öğrenciye ait, global etkilemez
- 6 alışkanlık satırı — eksiltilip artırılamaz (6 sabit satır, içerikleri değişir)

### Ekran Yapısı

**Araç çubuğu:**
- Öğrenci seçici
- Ay seçici — mevcut ay varsayılan
- "Alışkanlıkları Düzenle" butonu → `App.openAliskanlikDuzenleModal(ogrenciId)`
- "Varsayılana Döndür" butonu — onay al → modüle göre varsayılanı yükle
- "Yazdır" butonu

**Tablo:**

Sütunlar: Seçili ayın günleri (1–28/29/30/31) + gün adları (Pt, Sa, Ça...)

Satırlar: 6 alışkanlık + 1 "Notlar" satırı

Her hücre:
- Boş: tıklanabilir, tıklanınca ✓ işareti + alışkanlığın rengi
- Tekrar tıklanınca temizlenir (toggle)
- Veri `Store.data.calismaKayitlari` içinde tutulur:
  `{ ogrenciId, tur: 'aliskanlik', aliskanlikId, tarih, tamamlandi: true }`

Satır başında (alışkanlık adı):
- Alışkanlık adı + renk noktası
- Tıklanınca düzenlenebilir — inline `<input>` açılır, blur'da kaydedilir

Ayın sonunda: her alışkanlık için tamamlanma yüzdesi (kaç günde yapıldı / toplam gün)

### Alışkanlık Düzenleme Modalı (`App.openAliskanlikDuzenleModal`)

6 satır — her satırda:
- Alışkanlık başlığı (text input)
- Renk seçici (6 renk chip)

"Kaydet" → `Store.saveAliskanliklar(ogrenciId, liste)` + modal kapat + yeniden render

### A4 Çıktı (Print HTML)

A4 yatay.

**Başlık bandı:**
Öğrenci adı | Ay / Yıl | Koç adı

**Tablo:**
- 6 alışkanlık satırı + notlar satırı
- Tüm ay günleri sütun olarak (dar sütunlar, okunaklı font)
- Dolu hücreler: alışkanlığın renk tonunda arka plan + ✓
- Boş hücreler: beyaz

Tablo altında her alışkanlık için tamamlanma skoru:
`Alışkanlık Adı: X/Y gün (%Z)`

**Print:** `PrintEngine.yazdir(html, { yatay: true })`

---

## Çizelge Robotu Şablon Seçici Güncellemesi

Mevcut 3 şablon kartına bu 3 yeni kart eklenecek. Toplam 6 şablon olacak.
Şablon kartları 2×3 grid'e geçiş yapar.

Yeni kart tanımları:

```javascript
{ id: 'konu-soru',    label: 'Konu & Soru Çizelgesi',  aciklama: 'D/Y/B/S bazlı aylık konu takibi', yatay: true  }
{ id: 'zaman-blok',  label: 'Zaman Bloklama',           aciklama: 'Sürükle-bırak haftalık program',  yatay: true  }
{ id: 'aliskanlik',  label: 'Alışkanlık Zinciri',        aciklama: 'Kişiselleştirilebilir günlük takip', yatay: true }
```

`App.cizelgeAktifSablon` state değişkenine bu 3 yeni case eklenir.

`App.printCizelge()` switch bloğuna:
```javascript
case 'konu-soru':   html = this.renderCizelgeKonuSoruHTML(ogr);  yatay = true; break;
case 'zaman-blok':  html = this.renderCizelgeZamanBlokHTML(ogr); yatay = true; break;
case 'aliskanlik':  html = this.renderCizelgeAliskanlikHTML(ogr); yatay = true; break;
```

---

## Kurallar

1. Zaman bloklama sürükle-bırak tamamen Vanilla JS — dış kütüphane (Sortable.js, interact.js vb.) kullanılmaz
2. Alışkanlık değişikliği sadece o öğrenciye ait — `Store.saveAliskanliklar()` sadece o öğrencinin verisini günceller
3. Konu & Soru çizelgesindeki S değeri D+Y+B toplamından otomatik hesaplanır, ama elle de girilebilir
4. Zaman planı verisi `Store.data.zamanPlanlari[ogrenciId]` altında — başka öğrencileri etkilemez
5. Alışkanlık tamamlanma verisi `Store.data.calismaKayitlari` içinde `tur: 'aliskanlik'` ile ayrışır
6. Tüm render fonksiyonları HTML string döndürür — `render*HTML(ogr)` formatında, DOM'a dokunmaz
7. `ZAMAN_KATEGORILER` sabiti `data.js`'e eklenir ve `window.ZAMAN_KATEGORILER` olarak export edilir
8. Her üç şablonun print çıktısı A4 yatay — `PrintEngine.yazdir(html, { yatay: true })`
