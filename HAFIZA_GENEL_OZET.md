# Plantrack — Genel Hafıza ve Güncelleme Raporu (03.10.2026)

Bu doküman, bugün Plantrack üzerinde gerçekleştirilen tüm mimari düzenlemeleri, hata çözümlerini, arayüz iyileştirmelerini ve uygulanan promptları içeren kapsamlı proje hafızasıdır.

---

## 1. Müfredat & Havuz Yönetimi Düzenlemeleri
- **Arayüz Kaymaları:** `view-curriculum-pool` görünümündeki modül filtreleri, sınıf butonları ve arama çubuğundaki taşmalar ile hizalama sorunları giderildi.
- **Ders Sembol & Renk Otomasyonu:**
  - `Store.detectDersIkonVeRenk(ad, kisaltma)` algoritması geliştirildi. 25+ ders dalı (Matematik, Fizik, Kimya, Biyoloji, Türkçe, Edebiyat, Tarih, Coğrafya, Felsefe Grubu, Yabancı Dil, Din Kültürü vb.) için anahtar kelime ve Türkçe karakter analizine dayalı otomatik sembol (Lucide) ve renk ataması sağlandı.
  - "Sembolleri Güncelle" fonksiyonu ile tüm derslerin sembol ve renkleri tek tıkla otomatik senkronize edilebilir hale getirildi.
- **Sıfırlama Butonu Davranışı:**
  - Kullanıcının kendi özel verilerini yükleyebilmesi için çekirdek (seed) ders ve konu verileri temizlendi.
  - Sıfırlama butonunun eski çekirdek verileri tekrar geri yüklemesi engellendi; kullanıcıya temiz bir çalışma alanı sunuldu.

---

## 2. Çizelge Robotu & Tipografi Uyumlaştırması
- **Soru Takip Çizelgesi Punto Eşitlemesi:**
  - Soru Takip tablosundaki font büyüklükleri ve hücre padding değerleri Konu Takip Tablosu (`text-[10px]` / `text-[11px]`, kompakt ve okunaklı) standartlarına getirildi.
  - Baskı ve A4 çıktılarında satırların kayması engellendi.

---

## 3. Kaynak & Yayın Kütüphanesi
- **İçe / Dışa Aktarma (Excel):**
  - Kütüphaneye Excel ile toplu kaynak yükleme ve mevcut kaynakları Excel formatında dışa aktarma yeteneği kazandırıldı (`ExcelEngine.kaynaklarDisaAktar`, `ExcelEngine.kaynaklarIceAktar`).
  - Gereksiz/çift arama kutuları temizlendi, araç çubuğu modernize edildi.

---

## 4. Konu Yönetimi & Excel Aktarım Hatasının Çözümü (Kritik Düzeltme)
- **Sorun:** Kullanıcı 640 konuluk tam müfredat Excel dosyasını yüklediğinde, `5 Türkçe`, `5 Fen Bilimleri` vb. tüm derslerin konularının yanlışlıkla `5 Matematik` altına toplandığı (126 konu) tespit edilmişti.
- **Kök Neden:**
  1. Üst araç çubuğundaki yükleme butonu `App.poolAktifDersId` (o an ekranda açık olan ders) bilgisini varsayılan ders olarak geçiriyordu.
  2. Eski kodda eşleşmeyen satırlar için `if (!hedefDers && varsayilanDers) { hedefDers = varsayilanDers; }` kontrolü yer alıyordu. Bu mantık, satırda açıkça "5 Türkçe" yazmasına rağmen sistemde henüz "5 Türkçe" dersi yoksa tüm satırları açık olan derse (5 Matematik) aktarıyordu.
- **Çözüm & Yeni Motor:**
  - **İzole & Akıllı Eşleştirme:** `toLocaleLowerCase('tr-TR')` ve Unicode NFC normalizasyonu eklendi.
  - **Derslerin Otomatik Açılması:** Sistemde bulunmayan dersler satırdaki ada göre sınıfı ("5", "8", "12"), modülü (`ara-sinif`, `lgs`, `yks`), doğru ikonu ve rengiyle otomatik olarak oluşturulur.
  - **Alakasız Dersi Asla Yutmama Kuralı:** Satırda ders adı belirtilmişse, varsayılan ders **asla** atanmaz. Konular kesinlikle kendi derslerine dağıtılır.
  - **Önizleme Dağılım Özeti:** Yükleme penceresinde hangi derse kaç konu ekleneceği (örn: *5 Türkçe: 13, 5 Matematik: 28, 5 Fen: 17...*) kutucuklar halinde listelenir.
  - **Toplu Hızlı Kayıt (`Store.addOrUpdateKonularBatch`):** 640 konu tek seferlik bellek işleminde birkaç milisaniye içinde güvenle kaydedilir.

---

## 5. G7 Promptu — Kartlar ve Klasik Matris Ayrımı
- **Sidebar Navigasyonu (`index.html`):**
  - Mevcut `matrix` görünümünün adı **"Çalışma & Ödev Kartları"** olarak güncellendi (ikon: `layout-list`). Mevcut kartlı yapı korundu.
  - Altına yeni bir menü öğesi eklendi: **"Çalışma & Ödev Matrisi"** (`data-nav="grid-matrix"`, ikon: `grid-3x3`).
  - Yeni `<section id="view-grid-matrix">` alanı eklendi.
- **Klasik Grid Matris Görünümü (`App.renderGridMatrix`):**
  - **Üst Sekmeler:** Öğrencinin dersleri tab bar halinde listelenir; ilk açılışta ilk ders seçilidir.
  - **Grid Tablosu:**
    - Sabit "Konu / Kazanım" sütunu
    - Ünite başlık satırları (`Ünite 1: Doğal Sayılar (X Konu)`)
    - Seçili kaynak sütunları (`ogr.seciliKaynaklar`)
    - Konu Durumu sütunu (tek tıkla açılır durum seçici)
  - **Hücre Tasarımı:**
    - Görev varsa: `Çözülen / Hedef` ve `D:X  Y:X  B:X`
    - Doluluk oranına göre renk kodlaması: Boş (gri), <%70 (amber), %70-%89 (açık yeşil), %90+ (koyu yeşil vurgulu)
    - Görev yoksa: `—`
  - **Alt Özet Barı:** Toplam çözülen soru, genel doğruluk yüzdesi (%D), tamamlanan konu yüzdesi ve ilerleme çubuğu.

---

## 6. Hücre & Matris Sütun Modalları İyileştirmeleri
- **Hücre Düzenleme Modalı (`App.openHucreDuzenleModal`):**
  - Hedef soru, Doğru, Yanlış, otomatik/manuel Boş soru hesabı, Çalışma Süresi (dakika) ve Koç Notu alanları eklendi.
  - Hücre kaydedildiğinde görev güncellenir/eklenir, konu durumu otomatik olarak "Çalışılıyor" yapılır ve görünüm anında yenilenir.
- **Matris Kaynak Sütunları Modalı (`App.openMatrisSutunModal`):**
  - **Canlı Arama Çubuğu:** Kitap veya yayınevi adına göre anında filtreleme.
  - **Yayınevi Filtresi:** Dropdown ile tek bir yayınevinin kaynaklarına odaklanma.
  - **Tür Filtresi:** Soru Bankası, Fasikül, Deneme filtrelemesi.
  - **Sadece Seçilenler:** O an matriste aktif olan sütunları tek tıkla izole etme.
  - **Sütun Sayacı:** `X / 8` kuralı ve anlık doğrulama.

---

## 7. Teknik Durum & Sürüm
- **Mevcut Script Sürümü:** `v=8.61`
- **Sözdizimi Doğrulaması:** `node -c app.js` ve `node -c js/store.js` başarıyla geçti (0 hata).
- **Canlı Tarayıcı Testleri:** Chrome DevTools üzerinden tüm akışlar test edildi ve doğrulandı.
- **Graft İndeksi:** `graft build` çalıştırılarak context grafı güncellendi (262 node, 280 edge).

---

## 8. Canlı Güncelleme — "Programı Güncelle" (v8.61)
- **Sorun:** Masaüstü uygulamasının arayüzü Pake ile binary'ye gömülüydü; her kod değişikliğinde `derle_mac.sh` (Rust derleme + .pkg + .dmg) gerekiyordu.
- **Yeni mimari:** Arayüz artık gömülü dosyadan değil, yerel sunucudan (`http://127.0.0.1:38888/`) yüklenir. Sunucu arayüzü `~/PlantrackMCP/web` klasöründen sunar.
  - `mcp/server.js`: statik dosya sunumu + `GET /api/version` + `POST /api/update` uçları eklendi (kaynak klasörden kopyalama, içerik farkı tespiti, `~/PlantrackMCP/jYedek` yedeği).
  - `derle_mac.sh`: Pake artık `--use-local-file` yerine URL ile derler; arayüz `Resources/web`'e gömülür (ilk kurulum tohumu). Başlatıcı `~/PlantrackMCP/web` ve `~/PlantrackMCP/mcp` klasörlerini tohumlar ve sunucuyu oradan başlatır.
  - Ayarlar → Uygulama Ayarları sekmesine **Programı Güncelle** kartı eklendi (`App.updateLoadVersion`, `App.updateCheck`, `App.updateApply`): kaynak klasördeki yeni sürümü kopyalar, yedek alır ve sayfayı yeniler.
  - `version.json` sürüm takibi için eklendi; arayüz sürümü (ör. `v8.61`) ayarlar kartında gösterilir.
- **Etki:** Kod değişikliğinden sonra derleme gerekmez; Ayarlar'dan "Programı Güncelle" yeterlidir.
- **Sunucu kodu (`mcp/*.js`) değişirse:** `~/PlantrackMCP/mcp` güncellenir; etkili olması için uygulamayı kapatıp yeniden açın.
- **Veri güvenliği:** Arayüz origin'i `file://` yerine `http://127.0.0.1:38888` oldu; uygulama açılışta veriyi MCP veritabanından (`~/PlantrackMCP/data/plantrack_db.json`) çektiği için veri kaybı olmaz.
