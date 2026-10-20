# Plantrack — G2: Ders Havuzu & Sınav Havuzu Güncellemesi

---

## Bağlam

Mevcut `renderCurriculumPool()` fonksiyonu ders ve konu yönetimini içeriyor.
Bu güncellemeyle `view-curriculum-pool` ekranı iki sekmeye bölünecek:

1. **Ders Havuzu** — kademeli, silinebilir, eklenebilir, Excel içe/dışa aktarımlı
2. **Sınav Havuzu** — sadece LGS ve TYT-AYT kademeleri için

Mevcut konu yönetimi (Prompt 6'daki) **değiştirilmeyecek** — sadece yeni sekmeler ekleniyor.

**Kritik kural:** Ders havuzundan silinen bir ders `Store.data.dersler`'den kaldırılır.
Tüm ekranlar (`renderMatrix`, `openGorevModal`, ders dropdown'ları) `Store.data.dersler`'den
okuduğu için otomatik olarak o ders kaybolur — ayrıca bir güncelleme gerekmez.

---

## `view-curriculum-pool` Ekranı Yeniden Yapılandırma

Mevcut ekranın üstüne 3 ana sekme ekle:

```
[Ders Havuzu]  [Konu Yönetimi]  [Sınav Havuzu]
```

- **Ders Havuzu** — bu güncellemenin konusu
- **Konu Yönetimi** — mevcut içerik, değişmez
- **Sınav Havuzu** — bu güncellemenin konusu

State: `App.curriculumAktifSekme` — `'dersler'` | `'konular'` | `'sinavlar'`

---

## SEKME 1 — Ders Havuzu

### Araç Çubuğu

Sol:
- Kademe seçici: 3 tab butonu — "Ara Sınıf" | "LGS" | "TYT-AYT"
- Ara Sınıf seçilince: ek sınıf filtresi — "5. Sınıf" | "6. Sınıf" | "7. Sınıf" | "Tümü"

Sağ:
- "+ Ders Ekle" butonu → `App.openDersModal()`
- "Excel'e Aktar" butonu → `ExcelEngine.derslerDisaAktar(modulId)`
- "Excel'den Yükle" butonu → `App.openDersExcelModal(modulId)`
- "Müfredatı Sıfırla" butonu → onay al → `Store.resetCurriculum()`

### Ders Listesi

`Store.data.dersler` — seçili kademe ve sınıfa göre filtrelenir.

Her ders kartı (liste görünümü, tablo satırı formatında):

```
[Renk çizgisi] [İkon] Ders Adı   Kısaltma   Sınıf    Haftalık Saat   Sınavda mı?   [Düzenle] [Sil]
```

- **Renk çizgisi:** dersin `renk` değeriyle 4px sol kenar
- **İkon:** Lucide `ikon` alanından
- **Ders Adı:** bold
- **Kısaltma:** font-mono, muted
- **Sınıf:** sınıf etiketi chip
- **Haftalık Saat:** sayı
- **Sınavda mı?:** LGS/YKS için yeşil "Sınavda ✓" veya slate "—"; Ara Sınıf için her zaman "—"
- **Düzenle:** `App.openDersModal(ders.id)`
- **Sil:** onay modalı → `Store.deleteDers(ders.id)`

Ders silinirken uyarı göster:
```
Bu derse ait X konu ve Y görev de silinecek. Devam etmek istiyor musunuz?
```
`Store.deleteDers(id)` — cascade: dersle ilgili `konular`, `gorevler`'deki `dersId` eşleşmeleri de silinir.

Ders listesi boşsa: "Bu kademe için henüz ders tanımlanmamış" + "+ Ders Ekle" butonu.

### Ders Ekleme/Düzenleme Modalı (`App.openDersModal`)

Prompt 6'da tanımlandı. Değişiklik yok.

---

## Excel İçe/Dışa Aktarım — Ders Havuzu

### Ders Şablonu Sabiti (data.js'e ekle)

```javascript
const EXCEL_DERS_SABLONU = {
  sutunlar: [
    { key: 'ad',          label: 'Ders Adı',        zorunlu: true,  aciklama: 'Örn: Matematik' },
    { key: 'kisaltma',    label: 'Kısaltma',         zorunlu: true,  aciklama: 'Örn: MAT (max 5 karakter)' },
    { key: 'modulId',     label: 'Modül',            zorunlu: true,  aciklama: 'ara-sinif / lgs / yks' },
    { key: 'sinif',       label: 'Sınıf',            zorunlu: true,  aciklama: '5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / ortak' },
    { key: 'haftalikSaat',label: 'Haftalık Saat',    zorunlu: false, aciklama: 'Sayı, örn: 5' },
    { key: 'sinavdaMi',   label: 'Sınavda mı?',      zorunlu: false, aciklama: 'evet / hayır' },
    { key: 'soruSayisi',  label: 'Soru Sayısı',      zorunlu: false, aciklama: 'Sınavdaysa kaç soru, örn: 20' }
  ],
  ornekSatir: {
    ad: 'Matematik', kisaltma: 'MAT', modulId: 'lgs', sinif: '8',
    haftalikSaat: '5', sinavdaMi: 'evet', soruSayisi: '20'
  }
};
```

`window.EXCEL_DERS_SABLONU` olarak export edilir.

### `ExcelEngine.derslerDisaAktar(modulId)`

- `Store.data.dersler`'den `modulId` ile filtrele (null ise tümü)
- `EXCEL_DERS_SABLONU.sutunlar`'daki key'lere göre sütunları oluştur
- `sinavdaMi` boolean'ı "evet"/"hayır" string'e çevir
- Dosya adı: `plantrack_dersler_[modulId]_YYYY-MM-DD.xlsx`

### `ExcelEngine.derslerIceAktar(file, onSonuc)`

SheetJS ile dosyayı oku.
1. satır başlık, 2. satır açıklama — atla, 3. satırdan veri.

Validasyon:
- `ad` boşsa → hata
- `kisaltma` boşsa veya 5 karakterden uzunsa → hata
- `modulId` `MODULLER` dizisinde yoksa → hata
- `sinif` `SINIFLAR` dizisinde yoksa ve `'ortak'` değilse → hata
- `sinavdaMi` "evet"/"hayır" dışındaysa → "hayır" olarak varsay

Aynı `ad` + `modulId` + `sinif` kombinasyonu Store'da varsa:
- Güncelleme modunda: mevcut kaydı günceller
- Ekleme modunda: atlar, "X zaten mevcut" olarak raporlar

Sonuç: `{ eklenen, guncellenen, atlanan, hatali }` — UI önizleme + onay modalı gösterir.

### Ders Excel Yükleme Modalı (`App.openDersExcelModal`)

3 adım:
1. "Şablon İndir" linki + dosya seçici
2. Önizleme: kaç ders eklenecek, kaç güncellenecek, hatalar
3. Tamamlandı

---

## SEKME 3 — Sınav Havuzu

**Sadece LGS ve TYT-AYT kademeleri için.**
Ara Sınıf bu sekmede görünmez.

### Araç Çubuğu

- Kademe seçici: "LGS" | "TYT-AYT"
- "+ Sınav Ekle" butonu → `App.openSinavModal()`

### LGS Sınav Listesi

LGS için varsayılan sınavlar (seed data'da tanımlı):

```javascript
const SINAV_SEED = [
  {
    id: 'sinav-lgs-sozel',
    modulId: 'lgs',
    ad: 'LGS Sözel Bölüm',
    kisaltma: 'LGS-SÖZ',
    oturum: '1. Oturum (09:30)',
    soruSayisi: 50,
    sureDk: 75,
    aciklama: 'Türkçe (20), İnkılap (10), Din (10), İngilizce (10)'
  },
  {
    id: 'sinav-lgs-sayisal',
    modulId: 'lgs',
    ad: 'LGS Sayısal Bölüm',
    kisaltma: 'LGS-SAY',
    oturum: '2. Oturum (11:30)',
    soruSayisi: 40,
    sureDk: 80,
    aciklama: 'Matematik (20), Fen Bilimleri (20)'
  }
];
```

### TYT-AYT Sınav Listesi

```javascript
[
  {
    id: 'sinav-tyt',
    modulId: 'yks',
    ad: 'Temel Yeterlilik Testi (TYT)',
    kisaltma: 'TYT',
    oturum: '1. Oturum',
    soruSayisi: 120,
    sureDk: 165,
    aciklama: 'Türkçe (40), Sosyal Bilimler (20), Matematik (40), Fen Bilimleri (20)'
  },
  {
    id: 'sinav-ayt',
    modulId: 'yks',
    ad: 'Alan Yeterlilik Testi (AYT)',
    kisaltma: 'AYT',
    oturum: '2. Oturum',
    soruSayisi: 80,
    sureDk: 180,
    aciklama: 'Matematik (40), Fen (40) veya Edebiyat-Sosyal (40+40)'
  },
  {
    id: 'sinav-ydt',
    modulId: 'yks',
    ad: 'Yabancı Dil Testi (YDT)',
    kisaltma: 'YDT',
    oturum: '3. Oturum',
    soruSayisi: 80,
    sureDk: 120,
    aciklama: 'Yabancı Dil (İngilizce/Almanca/Fransızca)'
  }
]
```

### Sınav Kartları

Her sınav bir kart:
```
[Sınav Adı]         [Kısaltma rozeti]
Oturum: ...
Soru: X  |  Süre: Y dk
Açıklama: ...
[Düzenle]  [Sil]
```

Sil: onay modalı → `Store.deleteSinav(id)`
Düzenle: `App.openSinavModal(sinav.id)`

### Sınav Modalı (`App.openSinavModal(sinavId = null)`)

Alanlar:
- Kademe (select: LGS / TYT-AYT) — disabled düzenlemede
- Sınav Adı (zorunlu)
- Kısaltma (zorunlu, max 8 karakter)
- Oturum (text, opsiyonel)
- Soru Sayısı (number)
- Süre (dakika, number)
- Açıklama (textarea, opsiyonel)

### Store Değişiklikleri

`Store.data` yapısına ekle:
```javascript
sinavlar: []  // SINAV_SEED'den kopyalanır
```

`Store.init()` içine:
```javascript
if (!Array.isArray(this.data.sinavlar) || this.data.sinavlar.length === 0) {
  this.data.sinavlar = JSON.parse(JSON.stringify(SINAV_SEED));
  this.save();
}
```

`SINAV_SEED` sabiti `data.js`'e eklenir, `window.SINAV_SEED` olarak export edilir.

Store metodları:
- `Store.getSinavlar(modulId)` — modulId ile filtreli, null ise tümü
- `Store.addSinav(veri)` — id üretir, `save()`
- `Store.updateSinav(id, updates)` — günceller, `save()`
- `Store.deleteSinav(id)` — siler, `save()`

---

## Kurallar

1. Ders silinince cascade: `Store.data.konular`'dan o derse ait konular, `Store.data.gorevler`'den o derse ait görevler de silinir — önce uyarı modalı gösterilir
2. Silinen ders tüm ekranlarda otomatik kaybolur — `Store.data.dersler`'den okuyan her dropdown güncellenmiş veri görür
3. Sınav havuzu sadece LGS ve YKS — Ara Sınıf sekmede görünmez, kademe filtresinde gösterilmez
4. Excel import sonrası her zaman önizleme + onay — doğrudan kaydetme yok
5. `EXCEL_DERS_SABLONU` ve `SINAV_SEED` sabitleri `data.js`'e eklenir, `window.*` ile export edilir
6. Mevcut konu yönetimi (Konu Yönetimi sekmesi) değiştirilmez
