# Plantrack — Prompt 2: Store & Veri Modeli

---

## Bağlam

Prompt 1'de proje iskeleti, sidebar ve navigasyon sistemi kuruldu. `js/store.js` ve `js/data.js`
dosyaları boş iskelet olarak bırakıldı. Bu promptta bu iki dosya tam olarak implement edilecek.
`app.js` ve `index.html` bu promptta **değişmeyecek**.

---

## Temel Mimari Hatırlatma

- Her şey `aktifModulId` üzerinden akar — `'ara-sinif'`, `'lgs'`, `'yks'`
- Hiçbir yerde modül adı, ders adı veya sınıf bilgisi hardcode yazılmaz
- Yeni modül eklemek = `MODULLER` dizisine yeni nesne + ilgili `DERSLER`/`KONULAR` satırları
- `Store.data` tek kaynak — tüm uygulama buradan okur

---

## `js/data.js` — Tam İçerik

### MODULLER

```javascript
const MODULLER = [
  { id: 'ara-sinif', ad: 'Ara Sınıflar', kisaltma: 'ARA', siniflar: ['5','6','7'] },
  { id: 'lgs',       ad: 'LGS Hazırlık', kisaltma: 'LGS', siniflar: ['8']         },
  { id: 'yks',       ad: 'TYT-AYT',      kisaltma: 'YKS', siniflar: ['9','10','11','12','mezun'] }
];
```

### SINIFLAR

```javascript
const SINIFLAR = [
  { deger: '5',     label: '5. Sınıf',  modulId: 'ara-sinif' },
  { deger: '6',     label: '6. Sınıf',  modulId: 'ara-sinif' },
  { deger: '7',     label: '7. Sınıf',  modulId: 'ara-sinif' },
  { deger: '8',     label: '8. Sınıf',  modulId: 'lgs'       },
  { deger: '9',     label: '9. Sınıf',  modulId: 'yks'       },
  { deger: '10',    label: '10. Sınıf', modulId: 'yks'       },
  { deger: '11',    label: '11. Sınıf', modulId: 'yks'       },
  { deger: '12',    label: '12. Sınıf', modulId: 'yks'       },
  { deger: 'mezun', label: 'Mezun',     modulId: 'yks'       }
];
```

### DERSLER

Her ders nesnesi şu alanları taşır:
```
{ id, modulId, sinif, ad, kisaltma, renk, ikon, haftalikSaat, sinavdaMi, soruSayisi }
```

- `modulId` — hangi modüle ait
- `sinif` — hangi sınıfa ait (`'5'`, `'6'`, `'ortak'` vb.) — `'ortak'` ise o modüldeki tüm sınıflarda görünür
- `sinavdaMi` — LGS veya TYT-AYT sınavında ölçülüyor mu
- `soruSayisi` — sınavdaki soru sayısı, `sinavdaMi: false` ise `0`
- `renk` — Tailwind renk adı (rose, blue, emerald, amber, purple, teal, orange, indigo, cyan, slate)
- `ikon` — Lucide ikon adı

**Ara Sınıf dersleri** (her sınıf için ayrı — `sinif: '5'`, `sinif: '6'`, `sinif: '7'`):
Türkçe, Matematik, Fen Bilimleri, Sosyal Bilgiler, İngilizce, Din Kültürü, Görsel Sanatlar, Müzik, Beden Eğitimi, Bilişim Teknolojileri

**LGS dersleri** (`sinif: '8'`, `sinavdaMi: true`):
Türkçe (20 soru), Matematik (20 soru), Fen Bilimleri (20 soru), T.C. İnkılap Tarihi (10 soru), Din Kültürü (10 soru), Yabancı Dil/İngilizce (10 soru)

**TYT-AYT dersleri** (`sinif: 'ortak'` veya ilgili sınıf):
TYT: Türkçe, Matematik, Geometri, Fizik, Kimya, Biyoloji, Tarih, Coğrafya, Felsefe, Din
AYT: Alan Matematiği, Fizik, Kimya, Biyoloji, Edebiyat, Tarih-1, Coğrafya-1, Tarih-2, Coğrafya-2, Felsefe Grubu, Din, Yabancı Dil

Tüm ders listesini MEB müfredatına uygun olarak eksiksiz yaz.

### KONULAR

Her konu nesnesi:
```
{ id, dersId, modulId, sinif, uniteNo, uniteAdi, konuAdi, aciklama }
```

- `dersId` — hangi derse ait
- `uniteNo` — kaçıncı ünite (sayı)
- `uniteAdi` — ünitenin adı
- `konuAdi` — konunun adı
- `aciklama` — kısa açıklama (opsiyonel)

**Kapsam:**
- Ara sınıf: 5, 6, 7. sınıf için Türkçe, Matematik, Fen Bilimleri, Sosyal Bilgiler, İngilizce derslerinin MEB müfredatına uygun ünite ve konularını yaz. Diğer dersler (Din, GSA, Müzik, Beden, BİT) için konu listesi boş bırak — koç ihtiyaç duyarsa ekler.
- LGS: 8. sınıf tüm 6 dersin MEB müfredatına uygun konu listesi
- TYT-AYT: tüm derslerin ÖSYM müfredatına uygun konu listesi

Her konuya benzersiz `id` ver: `kon-{modulId}-{dersKisaltma}-{sira}` formatında. Örn: `kon-lgs-mat-01`

### KONU_DURUMLARI ve GOREV_DURUMLARI sabitleri

```javascript
const KONU_DURUMLARI = {
  islenmedi:    { label: 'İşlenmedi',    ikon: 'circle'          },
  calisiliyor:  { label: 'Çalışılıyor',  ikon: 'clock'           },
  tamam:        { label: 'Tamam',        ikon: 'check-circle-2'  },
  tekrar_lazim: { label: 'Tekrar Lazım', ikon: 'alert-circle'    }
};

const GOREV_DURUMLARI = {
  bekliyor:     { label: 'Bekliyor'     },
  devam_ediyor: { label: 'Devam Ediyor' },
  tamamlandi:   { label: 'Tamamlandı'   },
  gecikti:      { label: 'Gecikti'      }
};
```

### Excel Şablon Tanımı

Bu sabiti de `data.js`'e ekle — Excel içe/dışa aktarım sistemi bu tanımı kullanacak:

```javascript
const EXCEL_OGRENCI_SABLONU = {
  sutunlar: [
    { key: 'ad',          label: 'Ad',               zorunlu: true,  aciklama: 'Öğrencinin adı' },
    { key: 'soyad',       label: 'Soyad',             zorunlu: true,  aciklama: 'Öğrencinin soyadı' },
    { key: 'sinif',       label: 'Sınıf',             zorunlu: true,  aciklama: '5 / 6 / 7 / 8 / 9 / 10 / 11 / 12 / Mezun' },
    { key: 'okul',        label: 'Okul',              zorunlu: false, aciklama: 'Öğrencinin okulu' },
    { key: 'ogrenciTel',  label: 'Öğrenci Telefon',   zorunlu: false, aciklama: 'WhatsApp numarası' },
    { key: 'veliAd',      label: 'Veli Adı',          zorunlu: false, aciklama: 'Velinin adı soyadı' },
    { key: 'veliTel',     label: 'Veli Telefon',      zorunlu: false, aciklama: 'WhatsApp numarası' },
    { key: 'hedef',       label: 'Hedef',             zorunlu: false, aciklama: 'Örn: Fen Lisesi, Boğaziçi Tıp' }
  ],
  ornekSatir: {
    ad: 'Ad', soyad: 'Soyad', sinif: '8', okul: 'Örnek Ortaokul',
    ogrenciTel: '05XX XXX XX XX', veliAd: 'Veli Adı Soyadı',
    veliTel: '05XX XXX XX XX', hedef: 'Hedef okul veya bölüm'
  }
};
```

---

## `js/store.js` — Tam İçerik

Storage key: `plantrack_db_v1`

### Store.data Yapısı

```javascript
{
  version: '1.0.0',
  aktifModulId: 'ara-sinif',
  kocProfili: {
    ad: '', soyad: '', unvan: '', kurum: '',
    telefon: '', avatarKisa: ''
  },
  aktifOgrenciId: '',
  ogrenciler: [],
  gorevler: [],
  ogrenciKonuDurumlari: [],
  hataKayitlari: [],
  sinifNotlari: [],
  calismaKayitlari: []
}
```

### Öğrenci Nesnesi

```javascript
{
  id: 'ogr-{timestamp}',
  ad: '',
  soyad: '',
  adSoyad: '',           // ad + ' ' + soyad — otomatik üretilir
  sinif: '',             // '5' | '6' | ... | 'mezun'
  modulId: '',           // SINIFLAR'dan otomatik belirlenir
  okul: '',
  ogrenciTel: '',
  veliAd: '',
  veliTel: '',
  hedef: '',
  kayitTarihi: '',       // ISO tarih
  renk: 'teal',          // avatar rengi
  seciliKaynaklar: []    // matris sütunları için
}
```

### Görev Nesnesi

```javascript
{
  id: 'grv-{timestamp}',
  ogrenciId: '',
  dersId: '',
  konuId: '',            // opsiyonel
  kaynakId: '',          // opsiyonel
  baslik: '',
  aciklama: '',
  hedefSoru: 0,
  cozulenSoru: 0,
  dogruSoru: 0,
  yanlisSoru: 0,
  sureDk: 0,
  durum: 'bekliyor',     // GOREV_DURUMLARI key'leri
  deadline: '',          // 'YYYY-MM-DD'
  olusturmaTarihi: '',
  tamamlanmaTarihi: '',
  not: ''
}
```

### Öğrenci Konu Durumu Nesnesi

```javascript
{
  id: 'okd-{timestamp}',
  ogrenciId: '',
  konuId: '',
  durum: 'islenmedi',    // KONU_DURUMLARI key'leri
  not: '',
  guncellenmeTarihi: ''
}
```

### Hata Kaydı Nesnesi

```javascript
{
  id: 'hta-{timestamp}',
  ogrenciId: '',
  dersId: '',
  konuId: '',
  hataTuru: '',          // 'Bilgi Eksikliği' | 'Dikkat Hatası' | 'Soru Kökü/Anlama' | 'Süre/Yetişmedi'
  aciklama: '',
  telafiDurumu: false,
  olusturmaTarihi: '',
  tekrarTarihi: ''       // 1-3-7 gün döngüsü
}
```

### Sınıf Notu Nesnesi

```javascript
{
  id: 'not-{timestamp}',
  ogrenciId: '',
  dersId: '',
  sinavAdi: '',          // '1. Yazılı' | '2. Yazılı' | 'Sözlü' | 'Proje' | 'Kısa Sınav'
  not: 0,                // 0-100
  tur: 'yazili',
  tarih: ''
}
```

---

### Store Metodları

**Temel:**
- `Store.init()` — localStorage'dan okur. Yoksa `getSeedData()` ile başlatır. Versiyon kontrolü yapar. `refreshDeadlines()` çağırır.
- `Store.save()` — `localStorage.setItem` ile yazar
- `Store.getSeedData()` — boş başlangıç verisi döndürür. `ogrenciler: []` — kişisel veri yok.
- `Store.resetToFactory()` — `getSeedData()` ile sıfırlar, `save()` çağırır

**Modül:**
- `Store.getAktifModul()` — `MODULLER`'den `aktifModulId` ile bulur
- `Store.setAktifModul(modulId)` — `aktifModulId` günceller, `save()`

**Koç Profili:**
- `Store.getKocProfili()` — `data.kocProfili` döndürür
- `Store.saveKocProfili(profil)` — günceller, `avatarKisa` otomatik üretir (ad[0]+soyad[0]), `save()`

**Öğrenci:**
- `Store.getOgrenciler()` — tüm öğrenciler
- `Store.getOgrenci(id)` — tek öğrenci, bulamazsa `null`
- `Store.getAktifOgrenci()` — `aktifOgrenciId` ile bulur
- `Store.setAktifOgrenci(id)` — günceller, `save()`
- `Store.addOgrenci(veri)` — `id` üretir, `adSoyad` üretir, `modulId`'yi `SINIFLAR`'dan belirler, `kayitTarihi` ekler, `save()`
- `Store.updateOgrenci(id, updates)` — ilgili alanları günceller, `adSoyad` yeniden üretir, `save()`
- `Store.deleteOgrenci(id)` — öğrenciyi ve ona ait tüm görev, konu durumu, hata kaydı, not verilerini siler, `save()`

**Görev:**
- `Store.getGorevler(ogrenciId)` — öğrencinin tüm görevleri
- `Store.getAktifGorevler(ogrenciId)` — `durum !== 'tamamlandi'`
- `Store.getGecikmisGorevler(ogrenciId)` — `durum === 'gecikti'`
- `Store.addGorev(veri)` — `id` üretir, `olusturmaTarihi` ekler, `save()`
- `Store.updateGorev(id, updates)` — günceller, `save()`
- `Store.deleteGorev(id)` — siler, `save()`
- `Store.gorevTamamla(id)` — `durum: 'tamamlandi'`, `tamamlanmaTarihi: now`, `save()`
- `Store.refreshDeadlines()` — deadline geçmiş ve `durum !== 'tamamlandi'` olan görevlerin durumunu `'gecikti'` yapar, değişiklik varsa `save()`

**Konu Durumu:**
- `Store.getKonuDurumu(ogrenciId, konuId)` — bulursa döndürür, bulamazsa `{ durum: 'islenmedi', not: '' }` — asla `undefined` dönmez
- `Store.setKonuDurumu(ogrenciId, konuId, durum, not)` — varsa günceller, yoksa ekler, `save()`
- `Store.getKonuIstatistik(ogrenciId, dersId)` — `{ toplam, islenmedi, calisiliyor, tamam, tekrar_lazim, yuzde }` döndürür

**Hata Defteri:**
- `Store.getHatalar(ogrenciId)` — öğrencinin hata kayıtları
- `Store.addHata(veri)` — `id` üretir, `olusturmaTarihi` ekler, `save()`
- `Store.updateHata(id, updates)` — günceller, `save()`
- `Store.deleteHata(id)` — siler, `save()`

**Sınıf Notları:**
- `Store.getSinifNotlari(ogrenciId, dersId)` — `dersId` opsiyonel, null ise tümü
- `Store.addSinifNotu(veri)` — `id` üretir, `save()`
- `Store.updateSinifNotu(id, updates)` — günceller, `save()`
- `Store.deleteSinifNotu(id)` — siler, `save()`
- `Store.getNotOrtalamasi(ogrenciId, dersId)` — ortalama döndürür, veri yoksa `null` (0 değil)

**Yardımcılar:**
- `Store.getDerslerForOgrenci(ogrenci)` — `DERSLER`'den `modulId` ve `sinif` ile filtreler
- `Store.getKonularForDers(dersId)` — `KONULAR`'dan `dersId` ile filtreler
- `Store.getModulForOgrenci(ogrenci)` — `MODULLER`'den `ogrenci.modulId` ile bulur

---

## Excel İçe/Dışa Aktarım Motoru

Bu mantığı `js/store.js` içine ya da ayrı `js/excel.js` dosyasına yaz.

### Şablon İndirme

```
ExcelEngine.sablonIndir()
```

- `EXCEL_OGRENCI_SABLONU.sutunlar`'dan sütun başlıklarını al
- 1. satır: sütun başlıkları (kalın)
- 2. satır: açıklama satırı (italic, gri) — her sütunun `aciklama` alanından
- 3. satır: örnek satır (italic) — `EXCEL_OGRENCI_SABLONU.ornekSatir`'dan
- Dosya adı: `plantrack_ogrenci_sablonu.xlsx`
- SheetJS ile oluştur, indir

### İçe Aktarım

```
ExcelEngine.ogrenciIceAktar(file, onSonuc)
```

- Dosyayı oku (SheetJS)
- 1. satır başlık, 2. satır açıklama — bunları atla, 3. satırdan itibaren veri
- Her satır için validate et:
  - `ad` boş mu? → hata
  - `soyad` boş mu? → hata
  - `sinif` geçerli mi? (`SINIFLAR` dizisinde var mı?) → hata
- Sonuç nesnesi döndür:
  ```
  {
    basarili: [ { satir: 3, veri: {...} }, ... ],
    hatali:   [ { satir: 4, sebep: 'Sınıf değeri geçersiz: "13"' }, ... ]
  }
  ```
- `onSonuc(sonuc)` callback'i çağır — UI bu sonucu gösterir, kullanıcı onaylarsa `Store.addOgrenci()` çağırır

### Dışa Aktarım

```
ExcelEngine.ogrenciDisaAktar()
```

- `Store.getOgrenciler()` verilerini al
- `EXCEL_OGRENCI_SABLONU.sutunlar`'daki key'lere göre sütunları oluştur
- Dosya adı: `plantrack_ogrenciler_YYYY-MM-DD.xlsx`
- SheetJS ile oluştur, indir

---

## Yazdırma Motoru

Tüm yazdırma işlemleri bu mantıkla çalışacak — modüle özel rapor HTML'leri sonraki promptlarda yazılacak ama altyapı şimdi kurulacak.

### Mantık

```
PrintEngine.yazdir(icerik, ayarlar)
```

1. `document.body`'ye `data-print-mode` attribute'u ekle
2. `#print-area` elementine `icerik` HTML'ini yaz
3. `@page` kuralını dinamik olarak `<style id="print-page-style">` tag'ine yaz:
   - `ayarlar.yatay === true` ise `size: A4 landscape`
   - değilse `size: A4 portrait`
   - `margin: 8mm`
4. `window.print()` çağır
5. `afterprint` event'inde her şeyi temizle:
   - `#print-area` içini boşalt
   - `data-print-mode` attribute'unu kaldır
   - `#print-page-style` içini temizle

### `index.html`'e Eklenecek

Body kapanmadan önce:
```html
<div id="print-area" class="hidden"></div>
<style id="print-page-style"></style>
```

### `style.css`'e Eklenecek

```css
@media print {
  body > *:not(#print-area) { display: none !important; }
  #print-area {
    display: block !important;
    position: fixed;
    inset: 0;
    background: white;
    z-index: 9999;
  }
}
```

Bu sayede `window.print()` çağrıldığında sadece `#print-area` içi basılır, sidebar/topbar/navigation hiçbir şey görünmez.

---

## Kurallar

1. `getSeedData()` içinde `ogrenciler: []` — gerçek veya gerçekmiş gibi görünen kişisel veri yok
2. Tüm `id` üretimi: `'ogr-' + Date.now()` formatında, prefix'li
3. `getKonuDurumu` hiçbir zaman `undefined` dönmez
4. `getNotOrtalamasi` veri yoksa `null` döner, `0` değil
5. `deleteOgrenci` cascade siler — o öğrenciye ait tüm alt veriler de silinir
6. `MODULLER`, `SINIFLAR`, `DERSLER`, `KONULAR`, `KONU_DURUMLARI`, `GOREV_DURUMLARI`, `EXCEL_OGRENCI_SABLONU` sabitleri `window.*` ile global scope'a bağlanır
7. `Store` nesnesi `window.Store` olarak bağlanır
8. `ExcelEngine` ve `PrintEngine` nesneleri `window.*` olarak bağlanır
