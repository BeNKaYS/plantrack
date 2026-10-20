# Plantrack — G18: Kapsamlı Sistem Testi, macOS Uygulama Derlemesi ve DMG Kurulum Paketi Oluşturma

Merhaba Antigravity,

Plantrack uygulamamız üzerinde geliştirdiğimiz tüm modüller (Çizelge Robotu, Zaman Bloklama, Çalışma Matrisi, Deneme Sınavı Analizi, Havuz Yönetimi ve A4 Baskı Motoru) artık olgunlaştı ve günlük aktif koçluk kullanımına hazır hale geldi.

Şimdi senden iki aşamalı son adımı gerçekleştirmeni istiyorum:
1. **Kapsamlı Sistem ve Bütünlük Testi:** Tüm uygulamanın, veri akışlarının, hesaplamaların ve yazdırma motorunun uçtan uca test edilmesi.
2. **macOS Derlemesi ve DMG Üretimi:** Uygulamanın terminalden bağımsız, yerel bir macOS masaüstü uygulaması (`Plantrack.app`) olarak derlenmesi, `/Applications` klasörüne kurulabilir resmi bir `.dmg` dosyasına dönüştürülmesi ve gelecekteki güncellemelerde tek komutla yeni DMG üretebilecek otomatik bir derleme betiğinin (`derle_mac.sh`) hazırlanması.

Bu sürecin adımları, teknik mimarisi ve kabul kriterleri aşağıdadır:

---

## 1. Aşama: Kapsamlı Sistem ve Bütünlük Testi (Pre-Build Audit)

Derleme işlemine başlamadan önce aşağıdaki kontroller eksiksiz doğrulanmalıdır:

### A. Kod ve Sözdizimi Doğrulaması
- `app.js`, `js/store.js`, `js/data.js` ve `style.css` dosyalarında hiçbir sözdizimi (syntax) veya referans hatası bulunmamalıdır (`node -c` ile doğrulanmalıdır).
- `index.html` içerisindeki tüm script ve stil dosyalarının yerel yolları eksiksiz yüklenmelidir.

### B. Yerel Depolama (LocalStorage) ve Veri Modeli Testi
- `Store.init()` fonksiyonunun temiz localStorage durumunda ve mevcut verilerle hatasız başlaması doğrulanmalıdır.
- Öğrenci ekleme/düzenleme, ders ve konu yönetimi, görev/ödev atama ve tamamlama aksiyonlarının anlık olarak `Store` üzerinden kalıcı belleğe yazıldığı teyit edilmelidir.
- JSON ve Excel veri yedekleme (`Dışa Aktar`) ile yedekten geri yükleme (`İçe Aktar`) akışları test edilmelidir.

### C. Çizelge Robotu ve A4 Yazdırma Motoru (`PrintEngine`) Testi
- **Yatay/Dikey Otomatik Ayrımı:** Dikey şablonların (Ödev Takip, Konu Takip, Ödev Fişi, Karne) otomatik **Dikey**; yatay şablonların (Zaman Bloklama, Konu-Soru, Alışkanlık, Hata Defteri) otomatik **Yatay** baskı modunda açıldığı test edilmelidir.
- **Zaman Bloklama:** 06:00 – 24:00 arası 30 dakikalık dilimlerin ve dikeyde birleştirilmiş (merged) blokların A4 sayfaya taşmadan tam oturduğu doğrulanmalıdır.
- **Sayfalama:** 1'den fazla sayfaya taşan listelerde sayfa numaralandırmasının ve sayfa sonu kesmelerinin (`page-break`) sorunsuz çalıştığı test edilmelidir.

### D. Deneme Sınavı ve Analiz Modülü Testi
- Excel deneme sonuç belgesinin içe aktarılması, akıllı ders ve konu eşleştirme mekanizması test edilmelidir.
- Konu/Kazanım Başarı tablosunda hem kümülatif toplamların (deneme sayısı, toplam soru, doğru, yanlış) hem de tekil sınav filtrelemesinin doğru çalıştığı teyit edilmelidir.

### E. Çevrimdışı (Offline) Bağımsızlık Kontrolü
- Uygulamanın internet bağlantısı kesildiğinde de çalışabilmesi için harici CDN'den çekilen temel kütüphanelerin (`tailwindcss`, `lucide`, `xlsx`) yerel kopyalarının `assets/vendor/` dizininde yedekli olması ve yerel referanslarla güvenle çalışması sağlanmalıdır.

---

## 2. Aşama: macOS Masaüstü Uygulaması Derlemesi ve DMG Paketleme

Mevcut sistemde Homebrew üzerinden kurulu olan `/opt/homebrew/bin/pake` aracı veya yerel macOS WebKit/Tauri altyapısı kullanılarak bağımsız masaüstü paketi üretilmelidir:

### A. Uygulama Yapılandırması
- **Uygulama Adı:** `Plantrack`
- **Paket Tanımlayıcısı (Bundle Identifier):** `com.plantrack.app`
- **Sürüm:** `1.0.0`
- **Pencere Boyutları:**
  - Varsayılan Boyut: `1440 × 900` piksel (merkezlenmiş)
  - Minimum Boyut: `1024 × 700` piksel
  - Tam Ekran / Pencere Büyütme: Etkin
  - Başlık Çubuğu: Standart macOS minimalist başlık çubuğu (`hide-title-bar` veya şık yerel pencere kontrolleri)
- **İkon:** Varsa mevcut `assets/` altındaki logo/ikon veya şık bir Plantrack uygulama ikonu (`.icns` / `.png`).

### B. DMG Dosyası Üretimi (Disk Image)
- macOS kullanıcılarının alışık olduğu standart sürükle-bırak kurulumlu `.dmg` dosyası üretilmelidir (`Plantrack-1.0.0.dmg`):
  - Sol tarafta `Plantrack.app`
  - Sağ tarafta `/Applications` (Uygulamalar) kısayolu
  - Çift tıklandığında doğrudan monte edilip kurulabilir formatta (`UDZO` sıkıştırılmış dmg).

---

## 3. Aşama: Tek Komutla Otomatik Derleme Betiği (`derle_mac.sh`)

Kullanıcının gelecekte yapacağı değişiklikleri tek bir tıkla veya komutla tekrar derleyebilmesi için proje kök dizinine çalıştırılabilir bir `derle_mac.sh` betiği eklenmelidir:

```bash
#!/usr/bin/env bash
# derle_mac.sh — Plantrack macOS Derleme ve DMG Üretim Betiği
```

Bu betik:
1. Gerekli derleme ortamını (Node, Pake/Tauri, Rust/Cargo veya hdiutil) denetlemeli.
2. `node -c` ile sözdizimi testlerini otomatik çalıştırmalı; hata varsa derlemeyi durdurup kullanıcıyı uyarmalıdır.
3. Testler başarılıysa macOS `.app` ve `.dmg` dosyalarını derleyip `dist/` klasörüne çıkarmalıdır.
4. İşlem bittiğinde terminalde oluşan `.dmg` dosyasının tam yolunu ve dosya boyutunu kullanıcıya net biçimde raporlamalıdır.

---

## 4. Doğrulama ve Kabul Kriterleri

1. Uygulama kök dizininde veya `dist/` klasöründe hatasız derlenmiş `Plantrack.dmg` ve `Plantrack.app` dosyaları üretilmiş olmalıdır.
2. `Plantrack.dmg` dosyası açıldığında `Plantrack.app` uygulaması `/Applications` klasörüne sürüklenerek kurulabilmelidir.
3. Uygulama açıldığında hiçbir terminal penceresine veya `localhost:8080` sunucusuna ihtiyaç duymadan doğrudan bağımsız bir masaüstü penceresi olarak açılmalı, localStorage verilerini güvenle saklamalıdır.
4. Yazdırma butonuna basıldığında macOS yerel yazdırma penceresi sorunsuz tetiklenmeli, PDF olarak kaydetme veya yazıcıya gönderme işlemi kusursuz çalışmalıdır.
5. `derle_mac.sh` betiği gelecekteki güncellemelerde tek komutla yeni DMG üretebilecek şekilde hazır ve çalıştırılabilir (`chmod +x`) olmalıdır.
