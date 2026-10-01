# Plantrack — Prompt 6: Havuz & Portföy

---

## Bağlam

Prompt 1–5 tamamlandı. Bu promptta üç view eklenecek:
- `renderCurriculumPool()` → `view-curriculum-pool`
- `renderLibrary()` → `view-library`
- `renderStudents()` → `view-students`

**Temel kural:** Tüm okuma ve yazma `Store.data` üzerinden yapılır.
`DERSLER`, `KONULAR`, `KAYNAKLAR` sabitlerinde doğrudan erişilmez.
Kullanıcı bu ekranlarda veri eklediğinde `Store.data` güncellenir — tüm diğer
ekranların açılır listeleri otomatik olarak yeni veriyi gösterir.

---

## VIEW 1 — Müfredat & Dersler (`renderCurriculumPool`)

Ders ve konu havuzunun yönetildiği ekran. Hem modüle ait standart MEB/ÖSYM
müfredatı hem de kullanıcının eklediği özel dersler ve konular burada yönetilir.

### Bölüm 1 — Araç Çubuğu

Sol:
- Başlık: "Müfredat & Ders Havuzu"
- Modül filtresi: `id="pool-modul-filter"` — `MODULLER` dizisinden + "Tümü"
- Sınıf filtresi: `id="pool-sinif-filter"` — `SINIFLAR` dizisinden + "Tümü"

Sağ:
- "+ Ders Ekle" butonu → `App.openDersModal()`
- "Müfredatı Sıfırla" butonu → onay al → seed data'dan yeniden yükle

### Bölüm 2 — Ders & Konu Listesi

Sol panel (4/12): Ders listesi
Sağ panel (8/12): Seçili dersin konu listesi

**Sol Panel — Ders Listesi:**

`Store.data.dersler` — modül ve sınıf filtresine göre gösterilir.

Her ders satırı:
- Ders rengi çizgisi (sol kenar)
- Ders adı (bold)
- Modül rozeti + sınıf etiketi
- Konu sayısı: "X konu"
- Düzenle ikonu → `App.openDersModal(ders.id)`
- Sil ikonu → onay → `Store.deleteDers(ders.id)` — o derse ait konuları da siler

Seçili ders vurgulu. Tıklanınca sağ panel güncellenir.

State: `App.poolAktifDersId`

**Sağ Panel — Konu Listesi:**

`Store.getKonularForDers(aktifDersId)` — ünite gruplarıyla gösterilir.

Üst kısım:
- Seçili dersin adı + modül rozeti
- "+ Konu Ekle" butonu → `App.openKonuModal(aktifDersId)`
- "+ Ünite Ekle" butonu → `App.openUniteModal(aktifDersId)`

Her ünite grubu:
- Ünite başlığı (bold) + ünite sıra no
- Düzenle + Sil butonları (ünite için)

Her konu satırı (ünite altında):
- Sıra no
- Konu adı
- Açıklama (muted, kısa)
- Düzenle ikonu → `App.openKonuModal(aktifDersId, konu.id)`
- Sil ikonu → onay → `Store.deleteKonu(konu.id)`

Konu listesi boşsa: "+ Konu Ekle" çağrısına yönlendiren mesaj.

### Ders Modal (`App.openDersModal(dersId = null)`)

Alanlar:
- Ders Adı (zorunlu)
- Modül (select — `MODULLER`)
- Sınıf (select — seçili modüle göre filtreli `SINIFLAR`)
- Kısaltma (zorunlu, max 5 karakter — örn: "MAT", "TUR")
- Renk (renk seçici)
- Haftalık Saat (number, opsiyonel)
- Sınavda mı? (checkbox)
- Soru Sayısı (number — sınavda ise aktif)

Kaydet → `Store.addDers()` veya `Store.updateDers()` + yeniden render

### Konu Modal (`App.openKonuModal(dersId, konuId = null)`)

Alanlar:
- Ders: disabled (otomatik)
- Ünite No (number)
- Ünite Adı (text)
- Konu Adı (zorunlu)
- Açıklama (textarea, opsiyonel)
- Sıra No (number — ünite içindeki sırası)

Kaydet → `Store.addKonu()` veya `Store.updateKonu()` + yeniden render

### Store'a Eklenecek Metodlar

- `Store.addDers(veri)` — id üretir, `Store.data.dersler`'e ekler, `save()`
- `Store.updateDers(id, updates)` — günceller, `save()`
- `Store.deleteDers(id)` — dersi ve o derse ait tüm konuları siler, `save()`
- `Store.addKonu(veri)` — id üretir, `Store.data.konular`'a ekler, `save()`
- `Store.updateKonu(id, updates)` — günceller, `save()`
- `Store.deleteKonu(id)` — siler, `save()`

---

## VIEW 2 — Kaynaklar (`renderLibrary`)

Yayınevi ve kaynak (kitap/fasikül/deneme) havuzunun yönetildiği ekran.

### Bölüm 1 — Araç Çubuğu

Sol:
- Başlık: "Kaynak & Yayın Kütüphanesi"
- Modül filtresi: `id="library-modul-filter"`
- Metin arama: `id="library-search"` — kaynak adı veya yayınevinde ara

Sağ:
- "+ Kaynak Ekle" butonu → `App.openKaynakModal()`

### Bölüm 2 — Kaynak Kartları

`Store.data.kaynaklar` — modül filtresi ve aramaya göre gösterilir.
Grid layout (3 sütun).

Her kart:
- Yayın adı (bold, büyük)
- Yayınevi (muted)
- Modül rozeti
- Türü (Soru Bankası / Deneme / Fasikül / Kaynak Kitap / Diğer)
- Zorluk seviyesi (1–5 yıldız gösterimi)
- Bu kaynaktan toplam çözülen soru (Store'dan hesaplanır)
- Düzenle butonu → `App.openKaynakModal(kaynak.id)`
- Sil butonu → onay → `Store.deleteKaynak(id)`

Kaynak yoksa: "Henüz kaynak eklenmedi" mesajı + "+ Kaynak Ekle" butonu.

### Kaynak Modal (`App.openKaynakModal(kaynakId = null)`)

Alanlar:
- Yayın Adı (zorunlu) — örn: "Nitelik Süper LGS Soru Bankası"
- Yayınevi (zorunlu) — örn: "Nitelik"
- Modül (select — `MODULLER`, çoklu seçim mümkün)
- Tür (select: Soru Bankası / Deneme / Fasikül / Kaynak Kitap / Diğer)
- Zorluk (1–5 slider veya yıldız seçici)
- Açıklama (textarea, opsiyonel)

Kaydet → `Store.addKaynak()` veya `Store.updateKaynak()` + yeniden render

### Store'a Eklenecek Metodlar

- `Store.addKaynak(veri)` — id: `'kyn-' + Date.now()`, `Store.data.kaynaklar`'a ekler, `save()`
- `Store.updateKaynak(id, updates)` — günceller, `save()`
- `Store.deleteKaynak(id)` — kaynağı siler, o kaynağa bağlı görevlerdeki `kaynakId` alanını temizler, `save()`

---

## VIEW 3 — Öğrenci Portföyü (`renderStudents`)

Tüm öğrencilerin yönetildiği ekran. Excel içe/dışa aktarım buraya bağlıdır.

### Bölüm 1 — Araç Çubuğu

Sol:
- Başlık: "Öğrenci Portföyü"
- Modül filtresi: `id="students-modul-filter"`
- Metin arama: `id="students-search"`

Sağ:
- "+ Yeni Öğrenci" butonu → `App.openOgrenciModal()`
- "Şablon İndir" butonu → `ExcelEngine.sablonIndir()`
- "Excel'den İçe Aktar" butonu → `App.openExcelIceAktarModal()`
- "Excel'e Dışa Aktar" butonu → `ExcelEngine.ogrenciDisaAktar()`

### Bölüm 2 — Öğrenci Kartları

`Store.getOgrenciler()` — filtre ve aramaya göre gösterilir.
Grid layout (3 sütun, responsive).

Her kart:
- Büyük avatar (renk + ismin baş harfleri)
- Ad Soyad (bold)
- Sınıf etiketi + Modül rozeti
- Okul (muted)
- Hedef (muted, italik)
- İlerleme: "X / Y konu tamamlandı" — ince ilerleme çubuğu
- Aktif ödev sayısı + gecikmiş sayısı (badge'ler)
- "Aktif Yap" butonu — zaten aktifse disabled, farklı stil
- Düzenle butonu → `App.openOgrenciModal(ogr.id)`
- Sil butonu → onay → `Store.deleteOgrenci(ogr.id)` + yeniden render

Öğrenci yoksa: "Henüz öğrenci eklenmedi" mesajı + iki buton: "Manuel Ekle" ve "Excel'den İçe Aktar"

### Excel İçe Aktarım Modalı (`App.openExcelIceAktarModal`)

Adım 1 — Dosya Seç:
- "Şablon İndir" linki (henüz şablon yoksa önce indir)
- Dosya seçici: `.xlsx` veya `.xls` kabul eder

Adım 2 — Önizleme & Doğrulama:
`ExcelEngine.ogrenciIceAktar(file, onSonuc)` çağrılır.

Sonuç gösterimi:
```
✅ 12 öğrenci hazır
❌ 3 satırda hata:
   - Satır 4: Sınıf değeri geçersiz ("13")
   - Satır 7: Ad alanı boş
   - Satır 11: Sınıf değeri geçersiz ("Lise")
```

Hatalı satırlar düzeltilemez, atlanır.
"X öğrenciyi Kaydet" butonu — sadece geçerli satırlar için `Store.addOgrenci()` çağrılır.

Adım 3 — Tamamlandı:
"12 öğrenci başarıyla eklendi" mesajı + `closeModal()` + `renderStudents()`

---

## `renderCurrentView()` Güncellemesi

```javascript
case 'curriculum-pool': this.renderCurriculumPool(); break;
case 'library':         this.renderLibrary();         break;
case 'students':        this.renderStudents();        break;
```

---

## Kurallar

1. Kullanıcı ders/konu/kaynak eklediğinde `Store.data` güncellenir — diğer ekranların açılır listeleri otomatik güncellenir çünkü hepsi `Store.data`'dan okur
2. `deleteDers()` cascade çalışır — o derse ait konuları da siler
3. `deleteKaynak()` cascade çalışır — o kaynağa bağlı görevlerdeki `kaynakId` null yapılır (görevler silinmez)
4. `deleteOgrenci()` cascade çalışır — Prompt 2'de tanımlandığı gibi
5. Excel içe aktarımda hatalı satırlar atlanır, işlem durdurulamaz
6. Şablon indirme `ExcelEngine.sablonIndir()` — `EXCEL_OGRENCI_SABLONU` sabitinden, Prompt 2'de tanımlandı
7. Modül filtresi tüm listelerde `Store.data.aktifModulId` varsayılan — kullanıcı değiştirebilir
