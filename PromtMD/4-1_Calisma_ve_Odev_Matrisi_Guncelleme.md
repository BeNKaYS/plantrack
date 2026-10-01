# Plantrack — Prompt 4: Çalışma Matrisi & Ödev Geçmişi

---

## Bağlam

Prompt 1–3 tamamlandı. Bu promptta iki view eklenecek:
- `renderMatrix()` → `view-matrix`
- `renderTasks()` → `view-tasks`

**Önemli mimari güncelleme:** `data.js`'teki `DERSLER`, `KONULAR`, `KAYNAKLAR` sabitleri
artık sadece ilk kurulum seed verisi olarak kullanılır. `Store.init()` bu sabitleri
`Store.data.dersler`, `Store.data.konular`, `Store.data.kaynaklar` dizilerine kopyalar.
Bundan sonra tüm okuma ve yazma işlemleri `Store.data` üzerinden yapılır — `DERSLER`
sabitine doğrudan erişilmez. Bu sayede kullanıcı Havuz ekranından ders/konu/kaynak
eklediğinde tüm açılır listeler otomatik güncellenir.

`Store.data` yapısına şu diziler eklenir (Prompt 2'deki yapıya ek):
```
Store.data.dersler    = []   // DERSLER seed'den kopyalanır, sonra kullanıcı yönetir
Store.data.konular    = []   // KONULAR seed'den kopyalanır
Store.data.kaynaklar  = []   // KAYNAKLAR seed'den kopyalanır
```

`Store.init()` içine şu kontrol eklenir:
```javascript
// Seed veriden kopyala — sadece ilk kurulumda
if (!this.data.dersler || this.data.dersler.length === 0) {
  this.data.dersler = JSON.parse(JSON.stringify(DERSLER));
}
if (!this.data.konular || this.data.konular.length === 0) {
  this.data.konular = JSON.parse(JSON.stringify(KONULAR));
}
if (!this.data.kaynaklar || this.data.kaynaklar.length === 0) {
  this.data.kaynaklar = JSON.parse(JSON.stringify(KAYNAKLAR));
}
```

Store'a şu yardımcı metodlar eklenir veya güncellenir:
- `Store.getDerslerForOgrenci(ogr)` — `Store.data.dersler`'den `modulId` + `sinif` ile filtreler
- `Store.getKonularForDers(dersId)` — `Store.data.konular`'dan `dersId` ile filtreler
- `Store.getKaynaklar()` — `Store.data.kaynaklar` döndürür
- `Store.getKaynaklar(modulId)` — `modulId` ile filtreli

---

## VIEW 1 — Çalışma & Ödev Matrisi (`renderMatrix`)

### Genel Yapı

Planör V2 tarzı klasik grid matris. Satırlar konular, sütunlar kaynaklar.
Her hücrede o konu × kaynak çifti için D/Y/B soru takibi yapılır.

Aktif öğrenci yoksa "Öğrenci seçin" mesajı göster.

State değişkenleri `App` nesnesinde:
- `App.matrisAktifDersId` — seçili ders
- `App.matrisSeciliKaynaklar` — gösterilecek sütun kaynak ID'leri

### Bölüm 1 — Sayfa Başlığı & Araç Çubuğu

Sol:
- Başlık: "Çalışma & Ödev Matrisi"
- Aktif öğrenci adı + modül rozeti

Ders seçici:
- `Store.getDerslerForOgrenci(ogr)` ile aktif öğrencinin derslerini al
- Her ders bir tab butonu — tıklanınca `App.matrisAktifDersId` güncellenir, matris yeniden render edilir
- İlk açılışta ilk ders otomatik seçili

Sağ:
- "Sütunları Düzenle" butonu → `App.openMatrisSutunModal()` — hangi kaynaklar gösterilsin
- "Kaynak Ekle" butonu → `App.navigateTo('library')` — Kaynaklar ekranına yönlendir

### Bölüm 2 — Matris Grid Tablosu

```
          | [Kaynak 1] | [Kaynak 2] | [Kaynak 3] | ...
──────────|────────────|────────────|────────────|
Konu 1    |  45/60 D   |    —       |  20/30 D   |
Konu 2    |    —       |  10/20 D   |    —       |
...
```

**Tablo başlığı (thead):**
- İlk sütun: "Konu" başlığı (geniş, sabit)
- Sonraki sütunlar: her seçili kaynak için kaynak adı + yayınevi (2 satırlı başlık)
- Son sütun: "Konu Durumu"

Sütunlar `App.matrisSeciliKaynaklar` listesinden oluşturulur.
Öğrencinin `ogr.seciliKaynaklar` değeri varsa oradan, yoksa ilk 5 kaynak varsayılan.

**Tablo gövdesi (tbody):**

Konular ünite gruplarıyla gösterilir:

```html
<!-- Ünite grup başlık satırı — tüm sütunları kaplayan tek hücre -->
<tr class="unite-baslik">
  <td colspan="...">Ünite 1 — Ünite Adı</td>
</tr>
<!-- O üniteye ait konu satırları -->
<tr>
  <td>Konu Adı</td>
  <td><!-- Kaynak 1 hücresi --></td>
  <td><!-- Kaynak 2 hücresi --></td>
  ...
  <td><!-- Durum hücresi --></td>
</tr>
```

**Hücre İçeriği:**

Her konu × kaynak hücresi için:
- `Store.getGorevler(ogr.id)` içinden `dersId + konuId + kaynakId` eşleşmesi ara
- Eşleşme varsa: `cozulenSoru/hedefSoru` + doğruluk oranı göster
- Eşleşme yoksa: "—" göster

Hücreye tıklanınca `App.openHucreDuzenleModal(ogr.id, konu.id, kaynak.id)` açılır.

Hücre görsel durumları:
- Boş (hiç çalışılmamış): açık gri arka plan
- Başlandı (0 < çözülen < hedef): amber tonu
- Tamamlandı (çözülen >= hedef): yeşil tonu
- Hücreye hover: cursor pointer, hafif vurgu

**Konu Durumu Sütunu:**
`Store.getKonuDurumu(ogr.id, konu.id)` — ikon + kısa etiket.
Tıklanınca 4 seçenekli dropdown açılır: İşlenmedi / Çalışılıyor / Tamam / Tekrar Lazım

### Hücre Düzenleme Modalı (`App.openHucreDuzenleModal`)

Başlık: "Konu Adı — Kaynak Adı"

Alanlar:
- Hedef Soru (number)
- Doğru (number)
- Yanlış (number)
- Boş (number — otomatik: hedef - doğru - yanlış)
- Süre (dakika, opsiyonel)
- Not (textarea, opsiyonel)

Kaydet:
- Mevcut görev varsa `Store.updateGorev()`
- Yoksa `Store.addGorev()` — `dersId`, `konuId`, `kaynakId` otomatik set edilir

### Matris Sütun Seçici Modalı (`App.openMatrisSutunModal`)

`Store.getKaynaklar(ogr.modulId)` ile modüle ait kaynakları listeler.
Checkbox listesi — işaretlenenler `ogr.seciliKaynaklar`'a kaydedilir → `Store.updateOgrenci()`
Min 1, max 8 sütun seçilebilir.

### Bölüm 3 — Matris Alt Özet

Tablonun altında:
- Toplam çözülen soru (bu ders + seçili kaynaklar)
- Ortalama doğruluk oranı
- Konu tamamlanma yüzdesi (ilerleme çubuğu)

---

## VIEW 2 — Ödev Geçmişi (`renderTasks`)

Aktif öğrencinin tüm görevlerinin tam listesi.

### Bölüm 1 — Araç Çubuğu

Sol:
- Metin arama: `id="tasks-search"` — görev başlığı, ders adı, konu adı
- Durum filtresi: `id="tasks-durum-filter"` — `Store.data.gorevler`'deki olası durumlar + "Tümü"
- Ders filtresi: `id="tasks-ders-filter"` — `Store.getDerslerForOgrenci(ogr)` + "Tümü"

Sağ:
- "+ Yeni Ödev" butonu → `App.openGorevModal(ogr.id)`
- Tamamlananları gizle toggle

State değişkenleri `App`'te:
- `App.tasksSearchQuery`
- `App.tasksDurumFilter`
- `App.tasksDersFilter`
- `App.tasksHideCompleted`

### Bölüm 2 — Özet Satırı

"X aktif, Y gecikmiş, Z bu hafta tamamlandı" — küçük, muted

### Bölüm 3 — Görev Listesi

Gruplara ayrılır, her grup kendi başlığıyla:

```
Gecikmiş (X)      — kırmızı başlık
Bugün Teslim (X)  — amber başlık
Yaklaşan (X)      — slate başlık
Tamamlananlar (X) — gizlenebilir bölüm
```

Boş gruplar gösterilmez.

Her görev kartı:
- Sol kenar: ders rengi çizgisi (4px)
- Ders adı chip (`Store.data.dersler`'den bulunur)
- Görev başlığı (bold)
- Konu adı (varsa, `Store.data.konular`'dan bulunur, muted)
- Kaynak adı (varsa, `Store.data.kaynaklar`'dan bulunur)
- Alt satır: hedef soru + süre + teslim tarihi
- Koç notu (varsa, italik)
- Sağ: durum badge + Tamamla + Düzenle + Sil

Tamamla → `Store.gorevTamamla(id)` + kart griye döner
Düzenle → `App.openGorevModal(ogr.id, gorev.id)`
Sil → onay modalı → `Store.deleteGorev(id)` + yeniden render

### Bölüm 4 — Koçun Haftalık Direktifi

Araç çubuğunun hemen altında banner:
- `ogr.kocNotu` varsa göster
- Çift tıklanınca textarea açılır
- Kaydedince `Store.updateOgrenci(ogr.id, { kocNotu: yeniNot })`

---

## Görev Modal Güncellemesi (`App.openGorevModal`)

Prompt 3'te tanımlandı, şu değişiklik yapılacak:

- Ders listesi: `Store.getDerslerForOgrenci(ogr)` — artık `Store.data.dersler`'den
- Konu listesi: ders seçince `Store.getKonularForDers(dersId)` — artık `Store.data.konular`'dan
- Kaynak listesi: `Store.getKaynaklar(ogr.modulId)` — artık `Store.data.kaynaklar`'dan
  - Kaynak alanı opsiyonel — "Kaynak Seç (opsiyonel)" placeholder
  - Kaynak yoksa "Kaynaklar henüz eklenmedi — Havuz ekranından ekleyebilirsiniz" uyarısı

---

## `renderCurrentView()` Güncellemesi

```javascript
case 'matrix': this.renderMatrix(); break;
case 'tasks':  this.renderTasks();  break;
```

---

## Kurallar

1. Ders, konu, kaynak adları hepsi `Store.data.dersler`, `Store.data.konular`, `Store.data.kaynaklar`'dan okunur — `DERSLER`/`KONULAR`/`KAYNAKLAR` sabitine doğrudan erişilmez
2. `App.matrisAktifDersId` ilk açılışta öğrencinin ilk dersi olarak set edilir
3. Hücrede negatif sayı kabul edilmez
4. Doğru + Yanlış toplamı Hedef Soru'yu aşamaz
5. Filtre state'leri view'lar arası geçişte korunur
6. Boş gruplar gösterilmez
7. Sütun sayısı min 1, max 8
