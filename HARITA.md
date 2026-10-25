# Plantrack — Uygulama ve Veri Haritası

> Bu dosya kodun kendisinden çıkarılmıştır. Amaç: hangi dosya neyi yapıyor, hangi ekran
> hangi koleksiyonu okuyor, MCP hangi aracı hangi alana yazıyor ve **veri nerede
> eşleştirilmeden bırakılıyor** sorularını tek yerden cevaplamak.
>
> Son inceleme: 2026-10-25 · Sürüm 9.5 · 26.911 satır kod

---

## 1. Katmanlar

```
┌──────────────────────────────────────────────────────────────────────┐
│  ARAYÜZ (tarayıcı / WebKit)                                          │
│  index.html (349)  ·  app.js (15.103)  ·  style.css / tokens.css     │
│  13 görünüm, tüm render + etkileşim                                  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ oku / yaz
┌───────────────────────────▼──────────────────────────────────────────┐
│  DURUM KATMANI                                                       │
│  js/store.js (3.741)  ·  localStorage: plantrack_db_v1               │
│  js/data.js (3.464)   ·  MODULLER / DERSLER / KONULAR / sabitler     │
│  Canlı köprü: fetch → http://127.0.0.1:38888/api/data                │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ HTTP (tam nesne, çift yönlü)
┌───────────────────────────▼──────────────────────────────────────────┐
│  MCP SUNUCUSU (stdio JSON-RPC + HTTP köprü)                          │
│  mcp/server.js (679)   · 59 araç, 8 kaynak, port 38888               │
│  mcp/tools.js (1.844)  · araç şemaları + yönlendirme                 │
│  mcp/resources.js(135) · salt-okunur bağlam kaynakları               │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ oku / yaz (atomik rename)
┌───────────────────────────▼──────────────────────────────────────────┐
│  VERİ TABANI                                                         │
│  mcp/db.js (1.390) · data/plantrack_db.json (tek JSON dosyası)       │
│  Yedek: jYedek/*.json                                                │
└──────────────────────────────────────────────────────────────────────┘
```

Masaüstü (paketlenmiş) sürümde yollar değişir:

| | Geliştirme | Paket (.app) |
|---|---|---|
| Web kökü | proje klasörü | `~/PlantrackMCP/web` |
| MCP kodu | `./mcp` | `~/PlantrackMCP/mcp` |
| Veri tabanı | `./data/plantrack_db.json` | `~/PlantrackMCP/data/plantrack_db.json` |
| Yedek | `./jYedek` | `~/PlantrackMCP/jYedek` |

`mcp/db.js:12-36` bu yolu `__dirname` içinde `.app/Contents/Resources` var mı diye
bakarak seçer.

---

## 2. Dosya sorumlulukları

| Dosya | Sorumluluk | Kritik noktalar |
|---|---|---|
| `index.html` | Kabuk: sidebar, 13 `<section id="view-...">`, script yükleme sırası | `data-nav` değerleri `app.js` switch'i ile birebir eşleşmeli |
| `js/data.js` | Sabitler: `MODULLER`, `SINIFLAR`, `DERSLER`, `KONULAR`, `SINAV_SEED`, `ZAMAN_*`, ikon/renk haritaları | `window.DERSLER/KONULAR` olarak dışa açılır; seed müfredat buradan gelir |
| `js/store.js` | Veri modeli + localStorage + canlı köprü + Excel motoru | `init`, `save`, `syncWithServer`, tüm `get*/add*/update*` metotları |
| `app.js` | `App` nesnesi: render, modal, olay bağlama, yazdırma, PDF | `renderCurrentView` (`:332`) 13 görünüme dağıtır |
| `mcp/server.js` | stdio JSON-RPC + HTTP köprüsü + güncelleme sunucusu | `/api/data` GET/POST, `/api/status`, `/api/version`, `/api/update`, `/api/print/pdf` |
| `mcp/db.js` | `PlantrackDB` sınıfı: dosya okuma/yazma + tüm iş kuralları | `init`, `ensureStructure`, `save`, koleksiyon metotları |
| `mcp/tools.js` | 59 aracın `inputSchema` tanımı + `executeTool` yönlendirmesi | Şema **sunucuda doğrulanmıyor**, sadece LLM'e bilgi |
| `mcp/resources.js` | 8 salt-okunur `plantrack://...` kaynağı | `overview`, `students`, `curriculum`, ... |
| `mcp/test-client.js` | Elle duman testi | Otomatik test/CI yok |
| `assets/Müfredatlar/import_mufredat.js` | Müfredat içe aktarma yardımcısı | Ayrı çalışan script |

---

## 3. Ekranlar ve okudukları veri

`app.js:332-370` switch'i:

| Görünüm | Ana veri kaynağı | Not |
|---|---|---|
| `overview` | tüm koleksiyonların özeti | `Store.getOzet*` |
| `cockpit` | öğrenci + görev + hata + deneme | seçili öğrenci odaklı |
| `matrix` | `gorevler`, `dersler`, `konular`, `ogrenciKonuDurumlari` | kart görünümü |
| `grid-matrix` | aynı + `kaynaklar`, `seciliKaynaklar` | grid tablo |
| `tasks` | `gorevler` | durum/deadline |
| `report` | tüm koleksiyonlar | A4/PDF rapor |
| `deneme-raporu` | `denemeSinavlari` + `konular` + `dersler` | konu analizi, kazanım eşleştirme |
| `hata-defteri` | `hataKayitlari` | telafi durumu |
| `cizelge-robotu` | `zamanPlanlari`, `zamanAyarlari`, `konuSoruKayitlari`, `aliskanlikZincirleri`, `aliskanlikAySonu`, `aliskanlikNotlari`, `cizelgeNotlari` | en fazla anahtar formatı burada |
| `curriculum-pool` | `dersler`, `konular`, `sinavlar` | ders/konu/sınav havuzu |
| `library` | `kaynaklar` | ders ve modül filtresi |
| `students` | `ogrenciler` | modül/sınıf filtresi |
| `sinav-notlari` | `sinifNotlari` | okul yazılıları |

---

## 4. Veri sözlüğü (koleksiyon → anahtar → yazan → okuyan)

Tek dosya, 22 üst düzey anahtar. `aktifModulId` ve `aktifOgrenciId` uygulama
durumudur, iş verisi değildir.

| Koleksiyon | Tip | Anahtar / kimlik | Yazan | Okuyan |
|---|---|---|---|---|
| `kocProfili` | nesne | tek nesne | MCP `update_coach_profile`, Ayarlar | tüm görünümler |
| `ogrenciler` | dizi | `ogr-<timestamp>` | MCP `add_student`, `students` | her yer |
| `gorevler` | dizi | `grv-<timestamp>` | MCP `add_task`, matris hücresi | matrix, tasks, rapor |
| `ogrenciKonuDurumlari` | dizi | `okd-<timestamp>`, `(ogrenciId, konuId)` tekil | MCP `update_topic_status`, matris | matrix, grid-matrix |
| `hataKayitlari` | dizi | `hta-<timestamp>-<rand>` | MCP `add_mistake`, hata defteri | hata-defteri, rapor |
| `sinifNotlari` | dizi | `not-<timestamp>-<rand>` | MCP `add_school_grade` | sinav-notlari |
| `calismaKayitlari` | dizi | `cal-<timestamp>-<rand>`; `tur:'aliskanlik'` | MCP `log_habit_activity`, çizelge | alışkanlık tablosu |
| `denemeSinavlari` | dizi | `dnm-<timestamp>` / `deneme-<timestamp>` | MCP `add_mock_exam`, Excel import | deneme-raporu |
| `dersler` | dizi | `drs-...` | MCP `add_course`, havuz, seed | müfredat, filtreler |
| `konular` | dizi | `knu-...` / `kon-...` | MCP `add_topic`, havuz, Excel | matrix, çizelge |
| `kaynaklar` | dizi | `kyn-...` | MCP `add_resource`, kütüphane, Excel | library, grid-matrix |
| `sinavlar` | dizi | `lgs`, `tyt`, `ayt-say`... | sadece uygulama (havuz) | curriculum-pool, deneme |
| `aliskanlikZincirleri` | nesne | `[ogrenciId] = [{id,baslik,renk,aktif}]` | MCP `update_student_habits` | çizelge |
| `aliskanlikAySonu` | nesne | **`ogrenciId_aliskanlikId_yilAy`** | uygulama | çizelge |
| `aliskanlikNotlari` | nesne | **`ogrenciId_yilAy`** → metin | uygulama | çizelge |
| `zamanPlanlari` | nesne | `[ogrenciId][gun_HH:mm] = {kategori,label,renk,bg,not}` | MCP `update/batch_schedule`, çizelge | çizelge |
| `zamanAyarlari` | nesne | `[ogrenciId] = {baslangicSaat,bitisSaat}` | MCP `batch_schedule` | çizelge |
| `genelZamanAyarlari` | nesne | tek nesne | uygulama | çizelge |
| `konuSoruKayitlari` | nesne | **`ogrenciId_konuId_yilAy_hf<tur>`** → `{d,y,b,s}` | uygulama + MCP (farklı format) | çizelge |
| `cizelgeNotlari` | nesne | `ogrenciId_dersId` → metin | MCP `update_chart_note` | çizelge |
| `aktifModulId`, `aktifOgrenciId`, `ogretimYili`, `version`, `kurulumTamamlandi` | skaler | — | uygulama | kabuk |

### Kimlik (ID) kuralları

- Öğrenci `ogr-`, görev `grv-`, ders `drs-`, konu `knu-`/`kon-`, hata `hta-`,
  deneme `dnm-`, kaynak `kyn-`, not `not-`, çalışma kaydı `cal-`.
- ID'ler **anlam taşımaz**, sadece bağ kurar. Bu yüzden bir kaydın `ogrenciId`,
  `dersId`, `konuId` alanı var olan bir kaydı göstermek zorundadır.
- Uygulama tarafında `modulId` üç değerden biri olmalı: `ara-sinif`, `lgs`, `yks`.
  Sınıf → modül eşlemesi: 5/6/7/9/10/11 → `ara-sinif`, 8 → `lgs`, 12/mezun → `yks`.
- Görünüm durumları: görev `bekliyor|devam_ediyor|tamamlandi|gecikti`, konu
  `islenmedi|calisiliyor|tamam|tekrar_lazim`.

---

## 5. MCP aracı → koleksiyon eşlemesi (59 araç)

| Grup | Araçlar | Hedef |
|---|---|---|
| Genel | `overview`, `get/update_coach_profile` | `kocProfili` + özet |
| Öğrenci | `list/get/add/update/delete_student` | `ogrenciler` (+ cascade) |
| Görev | `list/get/add/update/complete/delete_task` | `gorevler` |
| Müfredat | `list_modules_and_classes`, `list/get/add/update/delete_course` | `dersler` |
| Müfredat | `list/get/add/update/delete_topic` | `konular` |
| Konu takip | `get_topic_progress`, `update_topic_status` | `ogrenciKonuDurumlari` |
| Hata | `list/add/update/delete_mistake` | `hataKayitlari` |
| Deneme | `list/get/add/delete_mock_exam` | `denemeSinavlari` |
| Sınav havuzu | `list_exams` | `sinavlar` (salt okunur) |
| Kaynak | `list/get/add/update/delete_resource` | `kaynaklar` |
| Not | `list/add/update/delete_school_grade` | `sinifNotlari` |
| Alışkanlık | `get_student_habits`, `update_student_habits`, `log_habit_activity`, `update_habit_month_end` | `aliskanlikZincirleri`, `calismaKayitlari`, `aliskanlikAySonu`, `aliskanlikNotlari` |
| Zaman | `get_student_schedule`, `update_student_schedule`, `batch_update_schedule` | `zamanPlanlari`, `zamanAyarlari` |
| Çizelge | `get_chart_summary`, `update_chart_note` | `cizelgeNotlari` + ilgili koleksiyon |
| Soru takip | `get_question_tracking`, `record_question_count` | `konuSoruKayitlari` |
| Yedek/sorgu | `export_backup`, `get_raw_data`, `custom_query` | tümü (okuma) / `jYedek` |

**Kapsam boşlukları (araç yok):** `sinavlar` havuzu yazılamıyor; `genelZamanAyarlari`
güncellenemiyor; toplu içe aktarma (transaction) aracı yok; silme geri alma (undo) yok;
sağlık/doğrulama aracı yok.

---

## 6. Veri akışı

### Açılış

```
Store.init()
  → localStorage oku (yoksa seed)
  → temiz yapı migrasyonu (tek seferlik bayrak)
  → syncCurriculumKazanimlar()   seed dersleri ekler, konu eklemez
  → autoSyncAllDersIkonlari()
  → refreshDeadlines()
  → initLiveSync()  → 50ms sonra GET /api/data
```

### Uygulamada değişiklik

```
kullanıcı işlem → Store.add/update/... → Store.save()
  → localStorage yaz
  → POST /api/data { data: TÜM NESNE }
  → server db.data = gelen nesne; db.save()
```

### Yapay zekâdan değişiklik

```
LLM → tools/call → executeTool → db.<metot>() → db.save() (atomik rename)
  → uygulama 8 sn'lik yoklamada veya pencere odağında GET /api/data
  → serverMod > lastServerModified ise localStorage'a tam kopya
  → App.renderCurrentView()
```

Yani **iki yazar da tüm dosyayı tek parça gönderir**; kısmi birleştirme yoktur.

---

## 7. Tespit edilen eksikler ve riskler

Ağırlık: **P0** veri kaybı/bozulma, **P1** yanlış davranış, **P2** bakım.

### P0 — Veri tabanı bozulmasına açık noktalar

1. **Tam dosya değiştirme (`mcp/server.js:293-317`).** POST `/api/data` yalnızca
   `ogrenciler` alanının dizi olmasına bakıp `db.data = incomingData` yapıyor.
   `ensureStructure()` çağrılmıyor, şema sürümü karşılaştırılmıyor, birleştirme yok.
   Uygulamanın elindeki eski kopya, MCP'nin az önce yazdığı veriyi ezebilir; tersi de
   olur. İki yazar arasında **kilit/sürüm (ETag, rev) yok**.
2. **Bozuk JSON'da sessiz sıfırlama (`mcp/db.js:41-70`).** `JSON.parse` hata verirse
   yakalanıyor ve `getDefaultTemplate()` atanıyor. Bozuk dosya `.corrupt` olarak
   saklanmıyor, yedekten dönülmüyor; ardından gelen ilk `save()` boş şablonu yazıp
   veriyi geri dönüşsüz siliyor.
3. **`ensureStructure` yalnızca üst düzey tip kontrolü (`mcp/db.js:72-100`).** Yanlış
   tipte bir koleksiyon `[]` yapılıp **sessizce siliniyor**; iç kayıtlar hiç
   doğrulanmıyor. AI'ın doğrudan dosyaya yazdığı bir alan (örn. `ogrenciler` nesne
   olduysa) tüm öğrenci listesini yok eder.
4. **Referans bütünlüğü yok.** `addTask` (`db.js:417`), `addMistake` (`:659`),
   `updateStudentTopicStatus` (`:611`), `addSchoolGrade` (`:1143`) gelen
   `ogrenciId/dersId/konuId` değerini doğrulamadan yazıyor. Var olmayan ID'li kayıt
   ekranda ya görünmez ya ham ID olarak çıkar; silme/ekleme sırasında "hayalet" veri
   kalır. Öğrenci silme cascade'i var (`:337`), fakat **ders/konu silme** yalnızca
   bazı koleksiyonları temizliyor; `sinifNotlari`/`denemeSinavlari` içindeki `dersId`
   ve `konular` içindeki `kazanimlar` bağları kopuk kalabiliyor.
5. **ID çakışması.** Öğrenci, görev, deneme ve konu durumu ID'leri yalnızca
   `Date.now()` ile üretiliyor (`db.js:264, 418, 753, 611`). AI tek milisaniyede
   birden çok kayıt eklerse **aynı ID** üretilir; `findIndex` ilk kaydı bulur,
   güncelleme/silme diğerlerini atlar. (`drs`/`knu`/`hta` gibi bazıları rastgele
   sonek kullandığı için bu riski taşımıyor.)
6. **Argüman doğrulaması yok.** `tools/call` (`server.js:587-592`) `inputSchema`'yı
   uygulamıyor. `required` alanlar boş gelebilir; örneğin `addTask` `ogrenciId`
   olmadan görev yazar, `recordQuestionCount` sessizce `null` döner.

### P1 — Uygulama ile MCP arasında anahtar/şekil uyuşmazlıkları

7. **`konuSoruKayitlari` anahtarı farklı.**
   - Uygulama: `ogrenciId_konuId_yilAy_hf<tur>` (`js/store.js:2034`)
   - MCP: `ogrenciId_konuId_<donem>_<hafta>` (`mcp/db.js:930-946`) — `hf` öneki yok.
   - Sonuç: AI'ın yazdığı soru sayıları çizelgede **hiç görünmez**; aynı hücre için
     iki ayrı kayıt oluşur. "Veri yükledim, modül bozuldu" tablosunun en net örneği.
8. **`aliskanlikAySonu` ve `aliskanlikNotlari` şekli farklı.**
   - Uygulama düz anahtar kullanır: `ogrenciId_aliskanlikId_yilAy` ve
     `ogrenciId_yilAy` (`store.js:1863-1933`).
   - MCP iç içe yazar: `[ogrenciId][yilAy][aliskanlikNo]` (`db.js:1232-1260`) ve
     `[ogrenciId][yilAy]`.
   - Sonuç: ay sonu değerlendirmesi ve genel ay notu kaybolur; `clearAliskanlikAySonu`
     (`store.js:1939`) MCP'nin yazdığını temizleyemez. Ayrıca MCP `aliskanlikNo`
     (sayı) bekliyor, uygulama `al-1`/`h1` (string) kullanıyor.
9. **`add_resource` `dersId` taşımıyor (`db.js:794-808`).** Uygulama kaynağı derse göre
   filtreliyor (`store.js:503-524`), MCP ile eklenen kaynak hiçbir derse bağlanmıyor.
   `modulId` varsayılanı da üç modülün tamamı; yanlış modülde görünür.
10. **`add_mock_exam` şeması eksik (`tools.js`, `db.js:752`).** Uygulama denemeyi
    `toplam` (soruSayisi/dogru/yanlis/net/basariYuzde/kurumNetOrt/sinavNetOrt) ve
    `dersler[].dersId` ile okuyor. Araç yalnızca serbest `dersler` dizisi alıyor,
    `toplam` üretmiyor, `dersId` eşlemiyor. İçe aktarılan deneme grafiklerde 0 net
    veya boş satır olarak görünür; konu analizi eşleşmez.
11. **`update_topic_status` durum sözlüğü doğrulanmıyor.** AI `tamamlandi`/`bitti`
    yazarsa matris bu konuyu hiçbir kategoride saymaz (`store.js` yalnızca
    `tamam|calisiliyor|tekrar_lazim|islenmedi` biliyor).
12. **`modulId` ve `sinif` serbest metin.** `addStudent` (`db.js:263`) verilen
    `modulId`'yi olduğu gibi kabul ediyor. `lgs ` (boşluklu), `ortaokul`, `LGS` gibi
    değerler öğrenciyi tüm modül filtrelerinden düşürür; "öğrenci kayboldu" görüntüsü.
13. **`update_student_schedule` hücre şekli serbest.** Uygulama
    `{kategori,label,renk,bg,not}` bekliyor; MCP `data`'yı olduğu gibi yazıyor
    (`db.js:894-907`). AI farklı alan adları gönderirse hücre boş etiketle açılır.
13b. **Silinen seed ders geri geliyor.** `syncCurriculumKazanimlar`
    (`store.js:1266-1277`) uygulama her açılışta `js/data.js` içindeki 28 standart
    dersi, veritabanında yoksa tekrar ekliyor. MCP ile silinen bir standart ders,
    uygulama bir sonraki açılışında geri gelir; "sildim ama duruyor" davranışının
    kaynağı budur. (Konular için aynı davranış bilinçli kapatılmış; `store.js:1289`
    yorumu bunu doğruluyor.)

### P2 — Genel bakım

14. **Global hata yakalayıcı yok.** `index.html`/`app.js`'de `window.onerror` yok.
    Bir render sırasında atılan tek hata, o görünümü boş bırakır (kullanıcının
    "modül bozuldu" tarifiyle uyumlu). Hata konsola düşer, kullanıcıya raporlanmaz.
15. **Otomatik yedek yok.** Yedek yalnızca `export_backup` veya güncelleme akışında
    alınıyor. Her MCP yazımından önce otomatik yedek yok; geri alma manuel.
16. **Şema sürümü sabit.** `version: '1.0.0'` hiç artmıyor; migrasyon mekanizması yok.
17. **Test yok.** `mcp/test-client.js` elle çalışan bir duman testi; `package.json`,
    CI veya otomatik doğrulama bulunmuyor.
18. **`tools.js` ile `db.js` şeması elle senkron.** Biri değişince diğeri sessizce
    eskiyor (7-13. maddeler bunun kanıtı).
19. **`resources.js` bazı yerlerde farklı şekil döndürüyor.** `getSchoolGrades` nesne
    (`{toplamKayit, ortalama, notlar}`) döndürürken kaynak `JSON.stringify` ile
    olduğu gibi veriliyor; LLM'e "liste" diye tanıtılıyor. Aynı araç ile kaynak
    arasında tutarsızlık.
20. **`checkDiskReload` mtime karşılaştırması.** `lastModifiedTime` tam sayı,
    dosya mtime ondalıklı; her yoklamada gereksiz yeniden okuma olabilir
    (`server.js:44-54`, `:57-62`).

---

## 8. Önerilen düzeltme mimarisi (MCP veri bekçisi)

Amaç: **hiçbir yazma, veri tabanındaki mevcut kayıtlarla eşleşmeden diske inmesin.**

```
tools/call
   ↓
1) validateArgs(schema, args)         → tip + required + enum
   ↓
2) resolveRefs(args)                  → isim/ID çözümleme
   ogrenciId: ID → adSoyad (tek eşleşme) → hata
   dersId:    ID → ad → kisaltma (modül/sınıf bağlamında)
   konuId:    ID → konuAdi (ders bağlamında)
   ↓
3) normalize(record)                  → tarih, sayı, enum, modulId, anahtar formatı
   ↓
4) preflight db snapshot yedeği       → jYedek/auto_<zaman>.json (son N adet)
   ↓
5) yaz (mevcut db metodu)
   ↓
6) integrityCheck()                   → yetim referans / çift ID / geçersiz enum
   ↓
7) sonuç: { ok, uyarilar[], duzeltmeler[] }   (sessiz düzeltme yok)
```

Somut olarak eklenmesi gerekenler:

- `mcp/validate.js` (yeni): şema doğrulama, enum listeleri (`MODULLER`,
  `GOREV_DURUMLARI`, `KONU_DURUMLARI`, `HATA_TURLERI`), referans çözücü.
- `db.js` içinde **tek anahtar üretici**: `makeId(prefix)` → `prefix-<ts>-<rand>`;
  tüm `Date.now()` ID'leri buraya bağlanmalı.
- `db.js` içinde **tek gösterim eşleyici**: `konuSoruKey()`, `aliskanlikAySonuKey()`,
  `aliskanlikNotKey()`; hem uygulama hem MCP aynı fonksiyonu kullanmalı (ortak modül
  `shared/keys.js` veya `js/keys.js` + `mcp/keys.js` kopyası).
- `db.js` içinde `validateDatabase()`: açılışta ve her yazmadan sonra çalışır;
  sonucu `GET /api/health` ile raporlar (yeni uç).
- `/api/data` POST: `expectedVersion` ile iyimser kilitleme; uyuşmazsa `409` ve
  birleştirme önerisi. En azından `ensureStructure()` + şema sürümü kontrolü.
- Bozuk JSON'da: dosyayı `.corrupt-<ts>` olarak sakla → en yeni yedeği dene → hepsi
  başarısızsa **yazma**, salt-okunur başla ve hatayı bildir.
- Her yazma öncesi otomatik yedek (döngüsel 20 dosya), `export_backup` opsiyonel kalır.
- `update_habit_month_end` parametrelerini uygulamayla hizala
  (`aliskanlikId`, düz anahtar). Eski iç içe kayıtlar için tek seferlik migrasyon.
- `record_question_count` `donem` + `hafta` yerine `yilAy` + `tur` almalı ve
  `_hf<tur>` anahtarı üretmeli; geriye dönük `donem` kabul edilip normalize edilmeli.
- `add_resource` şemasına `dersId`, `add_mock_exam` şemasına `toplam` ve ders eşleme
  eklenmeli.
- `app.js` başına `window.onerror` + `renderCurrentView` etrafına `try/catch`:
  hata olursa boş ekran yerine "bu görünüm yüklenemedi + hata kodu" ve diğer
  görünümler çalışmaya devam etsin.

---

## 9. Hızlı kontrol listesi (yeni bir AI verisi geldiğinde)

- [ ] `ogrenciId` gerçekten var mı? (`plantrack_list_students`)
- [ ] `dersId` / `konuId` gerçekten var mı ve aynı modülde mi?
- [ ] `modulId` üç değerden biri mi?
- [ ] `sinif` 5-12 veya `mezun` mu?
- [ ] Görev durumu / konu durumu sözlükte mi?
- [ ] Tarih `YYYY-MM-DD` mi?
- [ ] Denemede `toplam` ve `dersler[].dersId` dolu mu?
- [ ] Çizelge anahtarları `_hf` ve düz `_` formatında mı?
- [ ] Yazma öncesi yedek alındı mı? (`plantrack_export_backup`)
- [ ] Sonrası: `plantrack_custom_query` ile yetim kayıt taraması
- [ ] Sağlık: `GET /api/health` → `status: ok`, `hataSayisi: 0`

---

## 10. Uygulanan P0 düzeltmeleri (2026-10-25)

Bu harita çıkarıldıktan sonra 7. bölümdeki P0 maddeleri ve 7–13. maddelerin
tamamı koda döküldü. Değişen dosyalar:

| Dosya | Değişiklik |
|---|---|
| `mcp/validate.js` (yeni) | Şema doğrulama, isim→ID referans çözümleme, tarih/sayı/enum normalizasyonu, `validateDatabase()` bütünlük raporu, ortak anahtar üreticileri |
| `mcp/db.js` | Bozuk JSON'da `.corrupt` kanıtı + yedekten kurtarma + salt-okunur mod; `ensureStructure` sessiz silme yerine uyarı; dakikada bir otomatik yedek (20 dosya); tek `makeId()`; `konuSoru` ve `aliskanlik` anahtarları uygulamayla hizalandı + eski anahtar migrasyonu; `kaynak.dersId`; ders silmede kaynak/deneme temizliği |
| `mcp/server.js` | `/api/data` POST: iyimser kilit (409), yapı onarımı, bütünlük raporu, `strict` modu; yeni `GET /api/health`; `checkDiskReload` mtime düzeltmesi; `tools/call` artık şema + referans + normalizasyon çalıştırıyor ve uyarıları döndürüyor |
| `mcp/tools.js` | Eksik alanların şemaya eklenmesi (`dersId`, `toplam`, `yilAy`, `tur`, `aliskanlikId`, `modulId`, `kazanimlar`, `durum`), `Deneme Yanlışı` enum'u |
| `js/store.js` | POST'a `baseModified` eklendi; 409'da yerel kopya gönderilmez, sunucudaki güncel veri çekilir (AI verisi ezilmez) |
| `app.js` | `renderCurrentView` hata yakalar; boş ekran yerine hata kartı + "Yeniden Dene" / "MCP'den Yenile"; global `error` ve `unhandledrejection` dinleyicileri |

Davranış özeti:

- Bilinmeyen öğrenci/ders/konu referansı artık **yazılmaz**; isim verilmişse tek
  eşleşme varsa ID'ye çevrilir, birden fazlaysa aday listesiyle hata döner.
- AI "tamam", "bitti", "8. Sınıf", "25.10.2026" gibi günlük değerler gönderebilir;
  sunucu bunları geçerli formata çevirir.
- Aynı milisaniyede eklenen kayıtlar artık ID çakıştırmaz.
- Veri dosyası bozulursa boş şablon yazıp veri kaybetmek yerine son yedekten döner;
  yedek yoksa yazmayı tamamen durdurur.
- Uygulama ile MCP aynı anda yazarsa eski kopya yeni veriyi ezmez; çakışma bildirilir.

Kurulum notu: paketlenmiş uygulama `~/PlantrackMCP/web` ve `~/PlantrackMCP/mcp`
altından çalışır. Bu değişikliklerin canlıya yansıması için `mcp/*.js`,
`app.js` ve `js/store.js` dosyalarının o dizinlere kopyalanması (veya uygulamanın
Ayarlar > Programı Güncelle akışının çalıştırılması) gerekir.

Sürüm: **9.0** (büyük sürüm — veri yapısı ve MCP sözleşmesi değişti).
Sürüm artırma ve güncelleme dağıtımı için `GUNCELLEME.md`.


