# Plantrack — Prompt 4: Çalışma Matrisi & Ödev Geçmişi

---

## Bağlam

Prompt 1–3 tamamlandı. Bu promptta iki view eklenecek:
- `renderMatrix()` → `view-matrix`
- `renderTasks()` → `view-tasks`

`renderCurrentView()` switch bloğuna bu iki case eklenecek.
`index.html` ve `style.css` bu promptta değişmeyecek.

---

## VIEW 1 — Çalışma & Ödev Matrisi (`renderMatrix`)

### Genel Mantık

Matris **3 katmanlı** bir yapıdır:
1. **Ders** — üst tab veya dropdown ile seçilir
2. **Konu** — seçili dersin konuları sol panelde listelenir
3. **Kaynak** — seçili konunun kaynakları sağ panelde gösterilir

Aktif öğrenci yoksa "Öğrenci seçin" mesajı göster.

State değişkenleri `App` nesnesinde tutulur:
- `App.matrisAktifDersId` — seçili ders
- `App.matrisAktifKonuId` — seçili konu

### Bölüm 1 — Sayfa Başlığı & Ders Seçici

Başlık: "Çalışma & Ödev Matrisi"
Alt başlık: aktif öğrencinin adı + modül rozeti

Ders sekmeleri: `Store.getDerslerForOgrenci(ogr)` ile aktif öğrencinin derslerini al.
Her ders bir tab butonu. Aktif tab vurgulu. Tıklanınca `App.matrisAktifDersId` güncellenir,
konu listesi yeniden render edilir.

Sağ tarafta:
- "Kaynak Ekle" butonu → `App.openKaynakModal()`
- "Sütunları Düzenle" butonu → `App.openMatrisSutunModal()` — hangi kaynaklar gösterilsin seçimi

### Bölüm 2 — Ana İçerik (İki Kolon)

```
Sol (4/12) — Konu Listesi
Sağ (8/12) — Seçili Konunun Kaynak Detayı
```

**Sol Kolon — Konu Listesi:**

`Store.getKonularForDers(aktifDersId)` ile konuları al.
Ünite gruplarıyla göster:

```
▼ Ünite 1 — Ünite Adı
  ● Konu 1    [tamam rozeti]
  ● Konu 2    [tekrar lazım rozeti]
  ● Konu 3    [işlenmedi]
▼ Ünite 2 — Ünite Adı
  ...
```

Her konu satırı:
- Konu adı
- Durum rozeti — `Store.getKonuDurumu(ogr.id, konu.id)` — renk ve ikon `KONU_DURUMLARI`'ndan
- Tıklanınca `App.matrisAktifKonuId` güncellenir, sağ panel yeniden render edilir
- Aktif konu vurgulu

Konu listesi üstünde küçük istatistik: `X / Y konu tamamlandı`

**Sağ Kolon — Konu Detay Paneli:**

`App.matrisAktifKonuId` yoksa "Sol panelden bir konu seçin" mesajı.

Konu seçiliyse:

**Konu Başlığı Alanı:**
- Konu adı (büyük, bold)
- Ünite adı (muted)
- Durum değiştirici: 4 buton (İşlenmedi / Çalışılıyor / Tamam / Tekrar Lazım)
  - Tıklanınca `Store.setKonuDurumu()` + sağ panel yeniden render
- Not alanı: `Store.getKonuDurumu().not` gösterilir, tıklanınca düzenlenebilir textarea

**Kaynak Kartları:**

`ogr.seciliKaynaklar` listesindeki kaynaklar için kart göster.
Bu konuya ait görevler `Store.getGorevler(ogr.id)` içinden `dersId + konuId` ile filtrelenir.

Her kaynak kartı:
```
[Kaynak Adı & Yayınevi]
Çözülen: 45 / 60 soru  [ilerleme çubuğu]
D: 38  Y: 5  B: 2
[+ Soru Ekle / Güncelle]  [Ödev Oluştur]
```

- **Soru Ekle / Güncelle** butonu → `App.openSoruGirisiModal(ogr.id, konu.id, kaynak.id)`
- **Ödev Oluştur** butonu → `App.openGorevModal(ogr.id, null, konu.id)` — otomatik konu ve kaynak seçili gelir

Seçili kaynaklar yoksa: "Henüz kaynak eklenmemiş" + "Kaynak Seç" butonu → `App.openMatrisSutunModal()`

**İlerleme Özeti (konu bazlı toplam):**
Tüm kaynakların toplamı: `X soru çözüldü, %Y doğruluk`

### Soru Girişi Modalı (`App.openSoruGirisiModal`)

3 alan:
- Doğru sayısı (number)
- Yanlış sayısı (number)
- Boş sayısı (number — opsiyonel, otomatik `hedefSoru - doğru - yanlış`)

Kaydedince `Store.updateGorev()` veya yeni görev oluşturur.

### Matris Sütun Seçici Modalı (`App.openMatrisSutunModal`)

`Store.data.kaynaklar` listesindeki tüm kaynakları checkbox listesi olarak gösterir.
İşaretlenenler `ogr.seciliKaynaklar` dizisine kaydedilir → `Store.updateOgrenci()`

---

## VIEW 2 — Ödev Geçmişi (`renderTasks`)

Aktif öğrencinin tüm görevlerinin tam listesi. Filtrelenebilir, aranabilir.

### Bölüm 1 — Araç Çubuğu

Sol:
- Metin arama: `id="tasks-search"` — görev başlığı, ders adı, konu adı alanlarında
- Durum filtresi: `id="tasks-durum-filter"` — `GOREV_DURUMLARI`'ndan + "Tümü"
- Ders filtresi: `id="tasks-ders-filter"` — aktif öğrencinin dersleri + "Tümü"

Sağ:
- "+ Yeni Ödev" butonu → `App.openGorevModal(ogr.id)`
- Tamamlananları gizle toggle: `id="tasks-hide-completed"` — varsayılan: tamamlananlar gösterilir

State değişkenleri `App`'te:
- `App.tasksSearchQuery`
- `App.tasksDurumFilter`
- `App.tasksDersFilter`
- `App.tasksHideCompleted`

### Bölüm 2 — Özet Satırı

Küçük, muted metin: "X aktif, Y gecikmiş, Z bu hafta tamamlandı"

### Bölüm 3 — Görev Listesi

Görevler şu gruplara ayrılır ve her grup kendi başlığıyla gösterilir:

```
Gecikmiş (X)       — kırmızı başlık
Bugün Teslim (X)   — amber başlık
Yaklaşan (X)       — slate başlık
Tamamlananlar (X)  — gizlenebilir bölüm
```

Boş gruplar gösterilmez.

Her görev kartı:
- Sol kenar: ders rengi (4px dikey çizgi)
- Ders adı chip
- Görev başlığı (bold)
- Konu adı (varsa, muted)
- Alt satır: Hedef soru + Süre + Teslim tarihi + Kaynak adı
- Koç notu (varsa, italik)
- Sağ: Durum badge + Tamamla butonu + Düzenle butonu + Sil butonu

Tamamla butonu:
- `Store.gorevTamamla(gorev.id)` çağırır
- Kart animasyonla griye döner, "Tamamlananlar" grubuna taşınır

Düzenle butonu → `App.openGorevModal(ogr.id, gorev.id)`

Sil butonu → onay modalı → `Store.deleteGorev(gorev.id)` + yeniden render

### Bölüm 4 — Haftalık Direktif Banner

Sayfa üstünde, araç çubuğunun hemen altında:
- `ogr.kocNotu` varsa göster, yoksa gizle
- Çift tıklanınca düzenlenebilir textarea açılır
- Kaydedince `Store.updateOgrenci(ogr.id, { kocNotu: yeniNot })`

---

## `renderCurrentView()` Güncellemesi

```javascript
case 'matrix': this.renderMatrix(); break;
case 'tasks':  this.renderTasks();  break;
```

---

## Kurallar

1. `App.matrisAktifDersId` ilk açılışta öğrencinin ilk dersi olarak set edilir
2. `App.matrisAktifKonuId` ilk açılışta null — kullanıcı seçene kadar "konu seçin" mesajı
3. Ders, konu, kaynak adları hepsi Store'dan okunur — hardcode yok
4. Filtre state'leri view'lar arası geçişte korunur
5. Boş gruplar gösterilmez
6. Soru girişinde negatif sayı kabul edilmez
