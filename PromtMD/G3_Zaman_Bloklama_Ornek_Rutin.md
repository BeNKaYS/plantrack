# Plantrack — G3: Zaman Bloklama Düzeltmeleri & Örnek Rutin

---

## Bağlam

G1'de Zaman Bloklama şablonu implement edildi. Bu güncellemeyle:

1. **Saat satırları tam saat aralıklarına geçiyor** — 07:00–08:00, 08:00–09:00 şeklinde
2. **"Örnek Rutin" butonu** ekleniyor — kademeye göre otomatik program doldurur
3. **"Haftalık Çalışma Planı" şablonu kaldırılıyor** — Zaman Bloklama zaten bu işi yapıyor, ikisi gereksiz

Sadece `renderCizelgeRobotu()` içindeki Zaman Bloklama bölümü değişiyor.

---

## Değişiklik 1 — Saat Satırları

### Önceki (G1): 30 dakikalık aralıklar
```
07:00 | 07:30 | 08:00 | 08:30 | ...  (32 satır)
```

### Yeni: Tam saatlik aralıklar
```
07:00–08:00
08:00–09:00
09:00–10:00
...
22:00–23:00
```
Toplam 16 satır. Her satır başlığı `"07:00 – 08:00"` formatında gösterilir.

### Saat Key Formatı
G1'de `gun_saat` key formatı vardı. Güncelleme:
- Eski: `"pzt_08:00"` (30 dk'lık slot)
- Yeni: `"pzt_07"` (saatin başı — 07 = 07:00–08:00 aralığı)

`Store.saveZamanHucresi(ogrenciId, gun, saat, veri)` metodunda `saat` parametresi
artık `"07"`, `"08"` ... `"22"` formatında tam saat sayısı.

### Rutin şablonlarındaki saat değerleri de güncellenir:
Tüm `saat` değerleri `'07'`, `'08'` ... `'22'` formatına geçer.

---

## Değişiklik 2 — "Haftalık Çalışma Planı" Şablonu Kaldırılıyor

Çizelge Robotu şablon listesinden `haftalik-plan` şablonu çıkarılır:
- Şablon kartı DOM'dan kaldırılır
- `App.cizelgeAktifSablon` için `'haftalik-plan'` case'i `switch` bloğundan çıkarılır
- `renderCizelgeHaftalikPlanHTML()` fonksiyonu silinir (veya yorum satırına alınır)
- Varsayılan aktif şablon `'haftalik-plan'` yerine `'odev-takip'` olarak güncellenir

Kalan şablonlar: Ödev Takip Çizelgesi, Konu Takip Tablosu, Konu & Soru Çizelgesi,
Zaman Bloklama, Alışkanlık Zinciri — toplam 5 şablon.

---

## Değişiklik 3 — Araç Çubuğuna "Örnek Rutin" Butonu

Zaman Bloklama araç çubuğu güncellenmiş sıra:
```
[Öğrenci Seçici] [Hafta Gezinme] [Örnek Rutin ▾] [Tüm Haftayı Temizle] [Yazdır]
```

"Örnek Rutin" butonu tıklanınca dropdown açılır.
Dropdown `ogr.modulId`'ye göre filtrelenmiş rutin listesini gösterir.
`App.zamanRutinDropdownAcik` boolean state ile yönetilir.
Dropdown dışına tıklanınca kapanır.

---

## `App.zamanBlokaOrnekRutinUygula(ogrenciId, rutinId)`

1. `Store.getOgrenci(ogrenciId)` → öğrenciyi al
2. `ZAMAN_RUTINLER`'den `rutinId` eşleşmesini bul
3. Mevcut zaman planı doluysa onay modalı göster:
   `"Mevcut haftalık program silinecek ve örnek rutin yüklenecek."`
4. Onaylanırsa `Store.resetZamanPlani(ogrenciId)`
5. Rutin şablonundaki her hücreyi `Store.saveZamanHucresi()` ile kaydet
6. Dropdown'ı kapat
7. Tabloyu yeniden render et
8. Toast: `"[Rutin Adı] yüklendi."`

---

## `ZAMAN_RUTINLER` Sabiti (data.js'e ekle)

Her rutin şablonu yapısı:
```javascript
{
  id: 'rutin-id',
  modulId: 'ara-sinif',   // veya 'lgs', 'yks'
  ad: 'Rutin Adı',
  aciklama: 'Kısa açıklama',
  hücreler: [
    { gun: 'pzt', saat: '08', kategori: 'okul', baslik: 'Okul' },
    // saat: '07'–'22' (tam saat, string)
    // gun: 'pzt'|'sal'|'car'|'per'|'cum'|'cmt'|'paz'
    // kategori: 'okul'|'soru'|'konu'|'deneme'|'mola'
  ]
}
```

---

## Rutin Listesi

### Ara Sınıf — 2 Rutin

**Rutin 1: "Okul Dönemi Standart" (`ara-okul-standart`)**

Pazartesi–Cuma:
- `08` → okul "Okul"
- `09` → okul "Okul"
- `10` → okul "Okul"
- `11` → okul "Okul"
- `12` → okul "Okul"
- `13` → okul "Okul"
- `14` → mola "Dinlenme"
- `15` → konu "Konu Çalışması"
- `16` → soru "Soru Çözümü"
- `19` → soru "Akşam Tekrar"

Cumartesi:
- `09` → soru "Matematik"
- `10` → konu "Fen / Türkçe"
- `11` → soru "Karma Sorular"
- `14` → mola "Serbest"

Pazar:
- `10` → konu "Haftalık Tekrar"
- `11` → mola "Serbest"

---

**Rutin 2: "Yoğunlaştırılmış" (`ara-yogun`)**

Pazartesi–Cuma:
- `08`–`13` → okul "Okul"
- `14` → mola "Dinlenme"
- `15` → konu "Konu Çalışması"
- `16` → soru "Soru Çözümü"
- `17` → soru "Ek Soru"
- `19` → soru "Akşam Seansı 1"
- `20` → soru "Akşam Seansı 2"

Cumartesi:
- `09` → soru "Uzun Seans 1"
- `10` → soru "Uzun Seans 2"
- `11` → soru "Uzun Seans 3"
- `13` → konu "Haftalık Konu"
- `14` → konu "Konu Devam"

Pazar:
- `10` → konu "Haftalık Tekrar 1"
- `11` → konu "Haftalık Tekrar 2"
- `14` → soru "Pekiştirme"

---

### LGS — 2 Rutin

**Rutin 1: "LGS Standart" (`lgs-standart`)**

Pazartesi–Cuma:
- `08`–`13` → okul "Okul"
- `14` → mola "Dinlenme"
- `15` → soru "Branş Soruları 1"
- `16` → soru "Branş Soruları 2"
- `17` → konu "Eksik Konu"
- `19` → soru "Akşam Soru Bankası 1"
- `20` → soru "Akşam Soru Bankası 2"

Cumartesi:
- `09` → deneme "Deneme Sınavı 1"
- `10` → deneme "Deneme Sınavı 2"
- `11` → konu "Deneme Analizi"
- `12` → konu "Telafi"
- `14` → soru "Hata Soruları 1"
- `15` → soru "Hata Soruları 2"

Pazar:
- `10` → konu "Zayıf Konu 1"
- `11` → konu "Zayıf Konu 2"
- `13` → soru "Pekiştirme"
- `14` → mola "Serbest"

---

**Rutin 2: "LGS Son 3 Ay Yoğun" (`lgs-yogun`)**

Pazartesi–Cuma:
- `08`–`13` → okul "Okul"
- `14` → mola "Kısa Mola"
- `15` → soru "Rotasyon 1"
- `16` → soru "Rotasyon 2"
- `17` → soru "Rotasyon 3"
- `19` → konu "Akşam Konu"
- `20` → soru "Akşam Soru"
- `21` → konu "Gece Tekrar"

Cumartesi:
- `09` → deneme "LGS Tam Denemesi 1"
- `10` → deneme "LGS Tam Denemesi 2"
- `11` → deneme "LGS Tam Denemesi 3"
- `13` → konu "Deneme Analizi 1"
- `14` → konu "Deneme Analizi 2"
- `15` → soru "Hata Soruları 1"
- `16` → soru "Hata Soruları 2"

Pazar:
- `09` → soru "Karma Soru 1"
- `10` → soru "Karma Soru 2"
- `11` → soru "Karma Soru 3"
- `13` → konu "Kritik Eksikler 1"
- `14` → konu "Kritik Eksikler 2"

---

### TYT-AYT — 3 Rutin

**Rutin 1: "9-10. Sınıf Temel" (`yks-temel`)**

Pazartesi–Cuma:
- `08`–`14` → okul "Okul"
- `15` → konu "Günlük Konu 1"
- `16` → konu "Günlük Konu 2"
- `17` → soru "Konu Soruları"
- `19` → soru "TYT Soruları 1"
- `20` → soru "TYT Soruları 2"

Cumartesi:
- `09` → konu "Haftalık Tekrar 1"
- `10` → konu "Haftalık Tekrar 2"
- `11` → soru "Soru Bankası 1"
- `12` → soru "Soru Bankası 2"

Pazar:
- `10` → soru "TYT Pratik 1"
- `11` → soru "TYT Pratik 2"
- `14` → mola "Serbest"

---

**Rutin 2: "11. Sınıf Hazırlık" (`yks-hazirlik`)**

Pazartesi–Cuma:
- `08`–`14` → okul "Okul"
- `15` → soru "TYT + AYT 1"
- `16` → soru "TYT + AYT 2"
- `17` → soru "TYT + AYT 3"
- `19` → konu "AYT Konusu 1"
- `20` → konu "AYT Konusu 2"
- `21` → soru "Gece Pekiştirme"

Cumartesi:
- `09` → deneme "TYT Denemesi 1"
- `10` → deneme "TYT Denemesi 2"
- `11` → deneme "TYT Denemesi 3"
- `13` → deneme "AYT Bölümü 1"
- `14` → deneme "AYT Bölümü 2"
- `15` → konu "Deneme Analizi 1"
- `16` → konu "Deneme Analizi 2"

Pazar:
- `09` → konu "Zayıf Konular 1"
- `10` → konu "Zayıf Konular 2"
- `11` → konu "Zayıf Konular 3"
- `13` → soru "Hata Defteri 1"
- `14` → soru "Hata Defteri 2"

---

**Rutin 3: "12. Sınıf / Mezun Sprint" (`yks-sprint`)**

Pazartesi–Cuma:
- `08`–`14` → okul "Okul (varsa)"
- `15` → soru "TYT + AYT 1"
- `16` → soru "TYT + AYT 2"
- `17` → soru "TYT + AYT 3"
- `19` → konu "Akşam Blok 1"
- `20` → soru "Akşam Blok 2"
- `21` → konu "Akşam Blok 3"
- `22` → konu "Gece Özet"

Cumartesi:
- `08` → deneme "Tam TYT 1"
- `09` → deneme "Tam TYT 2"
- `10` → deneme "Tam TYT 3"
- `12` → deneme "Tam AYT 1"
- `13` → deneme "Tam AYT 2"
- `14` → deneme "Tam AYT 3"
- `15` → konu "Analiz & Telafi 1"
- `16` → konu "Analiz & Telafi 2"

Pazar:
- `09` → soru "Soru Maratonu 1"
- `10` → soru "Soru Maratonu 2"
- `11` → soru "Soru Maratonu 3"
- `12` → soru "Soru Maratonu 4"
- `14` → konu "Kritik Konular 1"
- `15` → konu "Kritik Konular 2"
- `16` → konu "Hata Tekrarı"

---

## Dropdown Menü Yapısı

```
▾ Örnek Rutin
───────────────────────────────
[kademeye göre rutin 1 adı]  — kısa açıklama
[kademeye göre rutin 2 adı]  — kısa açıklama
[kademeye göre rutin 3 adı]  — kısa açıklama (sadece YKS'de)
───────────────────────────────
Özelleştir...   (disabled, "Yakında" badge)
```

---

## Kurallar

1. Saat satırları 07:00–08:00, 08:00–09:00 ... 22:00–23:00 — 16 satır, tam saatlik
2. Saat key'i `"07"` ... `"22"` string formatında — G1'deki 30 dk formatıyla uyumsuz,
   `Store.data.zamanPlanlari` içindeki eski veriler temizlenir (`resetZamanPlani`)
3. "Haftalık Çalışma Planı" şablon kartı ve `renderCizelgeHaftalikPlanHTML()` kaldırılır
4. Varsayılan aktif şablon `'odev-takip'` olur
5. Rutin uygulamadan önce dolu tablo varsa onay modalı — boşsa doğrudan uygular
6. Dropdown dışına tıklanınca kapanır
7. `ZAMAN_RUTINLER` sabiti `data.js`'e eklenir, `window.ZAMAN_RUTINLER` export edilir
8. "Özelleştir" seçeneği disabled + "Yakında" badge — implement edilmez
