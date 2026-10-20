# Plantrack — G15: Tüm Rapor ve Çizelgelerde A4 Baskı Motoru (PrintEngine), Otomatik Yönlendirme (Yatay/Dikey), Tipografi ve Doldurulabilir Alan İyileştirmesi

Merhaba Antigravity,

Plantrack uygulamamızın en hayati çıktılarından biri olan **Rapor ve Çizelge Yazdırma Motorunda (`PrintEngine`)** koçluk deneyimini ve öğrencinin kullanımını doğrudan baltalayan çok kritik baskı, ölçekleme ve yerleşim sorunları yaşıyorum.

Çıktılar kağıda basıldığında yazılar mikroskobik boyutlara iniyor, tablolar okunamaz hale geliyor, öğrencinin ve koçun bu sayfalara tükenmez veya kurşun kalemle ödev/not yazması imkansızlaşıyor. Ayrıca rapor yatay tasarlanmış olmasına rağmen yazıcı penceresinde dikey açılıyor ve her seferinde tarayıcının ayarlarından elle "Yatay" seçmek zorunda kalıyorum. Üstelik önizleme ekranında tek sayfaya sığmayan içerik, baskıda kontrolsüzce küçültülerek sığdırılmaya çalışılıyor.

Senden ricam; sistemdeki tüm raporları (Çizelge Robotu'nun 5 şablonu, Haftalık Ödev Fişi, Akademik Karne, Deneme Sınavı Karnesi ve Hata Defteri Formu) tek tek ele alarak baskı motorunu ve şablon tipografilerini aşağıdaki kurallara göre kökten düzeltmendir.

---

## 1. Temel Altyapı Sorunları ve Çözüm Mimarisi

### A. Otomatik Yönlendirme Hatasının Giderilmesi (Yatay / Dikey Kilidi)
- **Sorun:** Yazdır butonuna basıldığında tarayıcı yönlendirmeyi otomatik algılamıyor; yatay belgelerde dahi kullanıcı elle "Yatay" seçmek zorunda kalıyor. Ayrıca `printCizelge` fonksiyonunda `odev-takip` şablonu `switch` bloğunda unutulduğu için varsayılan olarak yatay zaman bloklama basılmaya çalışıyor.
- **Çözüm:**
  1. `PrintEngine.yazdir(icerik, { yatay: true/false })` mekanizması, doğrudan ana pencereden değil, gizli ve izole bir `iframe` üzerinden yazdırılmalıdır.
  2. İframe'in kendi HTML `<head>` alanına statik olarak `@page { size: ${yatay ? 'A4 landscape' : 'A4 portrait'}; margin: 8mm 10mm; }` kuralı yazılmalıdır.
  3. Böylece Chrome, Safari veya Edge yazdırma diyaloğu açıldığında kullanıcının hiçbir ayara dokunmasına gerek kalmadan sayfa %100 doğrulukla otomatik olarak Yatay veya Dikey açılmalıdır.
  4. `printCizelge()` fonksiyonundaki `switch(this.cizelgeAktifSablon)` bloğuna `case 'odev-takip'` eksiksiz eklenmeli; dikey olarak (`yatay: false`) yönlendirilmelidir.

### B. "Sığdırma" (Scale-Down) ve Mikroskobik Font Sorununun Çözümü
- **Sorun:** Sayfa kapsayıcılarına inline olarak yazılmış `min-height: 297mm; max-height: 297mm;` veya `min-height: 210mm; max-height: 210mm;` gibi katı yükseklikler, yazıcının 8-10mm'lik kenar boşluklarıyla birleştiğinde sayfa sınırını aşmakta (`313mm > 297mm`) ve tarayıcı tüm sayfayı küçülterek basmaktadır. Sonuçta 8-9px olan yazılar kağıtta 5-6px'e inmekte, okunamaz hale gelmektedir.
- **Çözüm:**
  1. Baskı kapsayıcılarında (`print-page-dikey`, `print-page-yatay`) `max-height: 297mm` / `210mm` gibi katı milimetre sınırları kaldırılmalı; `box-sizing: border-box`, `min-height: 100%` ve dinamik flex yapısına geçilmelidir.
  2. Sayfada taşmaya sebep olan suni padding ve marjinler sadeleştirilmeli, yazıcının kenar boşluğu ile uyumlu hale getirilmelidir.
  3. Kağıtta hiçbir font 10px altına (özellikle saat, gün ve ders adları 11-13px, not alanları 11-12px) düşmemelidir.

### C. Önizleme (WYSWYG) ile Çıktı Birebir Eşitliği
- Ekranda önizlenen A4 sayfası ne ise, yazıcıdan çıkan kağıt pikseli pikseline aynı olmalıdır.
- Önizleme alanı gerçek A4 oranlarında (`aspect-[210/297]` dikey veya `aspect-[297/210]` yatay), beyaz sayfa zemininde, hafif bir gölgeyle (`shadow-lg`) ve tam sayfa simülasyonu olarak gösterilmelidir. Ekranda tek sayfaya sığan, çıktıda da tek sayfaya tam ve ferah şekilde sığmalıdır.

---

## 2. Raporların Tek Tek İncelenmesi ve Şablon Düzenlemeleri

### 1) Haftalık Ödev Takip Çizelgesi (Dikey A4 - Çok Sayfalı)
- **Yönlendirme:** Kesinlikle **Dikey (A4 Portrait)**.
- **Doldurulabilirlik:**
  - Satır yükseklikleri en az **32px – 34px** olmalıdır. Öğrenci veya koç bu satırlara el yazısıyla ödev konusu, test ve soru sayısı yazabilmelidir.
  - Sıra no, Ders, Görev Başlığı, Kaynak, Hedef Soru, Teslim Tarihi ve Kontrol (Onay Kutusu) sütunları geniş ve dengeli paylaştırılmalıdır.
  - Boş şablon modunda (veya az ödev olduğunda) sayfa altına doldurulabilir boş çizgili satırlar eklenmeli, satır yüksekliği daraltılmamalıdır.
- **Tipografi:** Tablo metinleri `11.5px – 12px`, başlıklar `13px – 15px` net ve koyu kontrastlı olmalıdır.

### 2) Konu Takip Çizelgesi (Dikey A4 - Çok Sayfalı)
- **Yönlendirme:** **Dikey (A4 Portrait)** olarak standartlaştırılmalıdır (Şu anki yatay tanımlama kaldırılmalıdır).
- **Yerleşim:**
  - Her sayfada 14–16 konu yer almalı, sayfa başına satır yüksekliği en az **30px** olmalıdır.
  - "İşlendi", "Tekrar", "Test" onay kutucukları öğrencinin kurşun kalemle kolayca işaretleyebileceği büyüklükte (`16px × 16px` kare) olmalıdır.
  - "Tarih & Not" sütununda el yazısıyla tarih ve not düşülebilmesi için ferah noktalı çizgili yazım alanı bulunmalıdır.
- **Tipografi:** Konu isimleri `11.5px` okunaklı fontla gösterilmelidir.

### 3) Konu & Soru Takip Çizelgesi (G6 Tür Bazlı / Yatay A4)
- **Yönlendirme:** Kesinlikle **Yatay (A4 Landscape)**.
- **Yerleşim:**
  - Hafta içi ve hafta sonu günleri için ayrılan Soru Bankası, Fasikül, Deneme ve Toplam Soru kutucukları kalemle sayı yazılabilecek büyüklükte olmalıdır.
  - Sütun genişlikleri orantılı olmalı, metinler birbirine girmemelidir.
- **Tipografi:** Gün başlıkları `11px`, hücre içi rakam alanları ferah ve okunaklı olmalıdır.

### 4) Zaman Bloklama Programı (Yatay A4 - 06:00 – 24:00)
- **Yönlendirme:** Kesinlikle **Yatay (A4 Landscape)**.
- **En Kritik Düzenleme (36 Satırlık Yarım Saatlerin Sığdırılması):**
  - 06:00 – 24:00 arasındaki 36 yarım saatlik satırın yatay A4 sayfada okunabilir kalması için üst başlık ve kategori lejantı daha kompakt hale getirilmelidir.
  - **Dikeyde Birleştirilmiş Bloklar (Merged Blocks):** Dikeyde 2 veya daha fazla hücre birleştiğinde (örn: 1.5 - 2 saatlik bloklar), faaliyet başlığı bloğun tam ortasında `11px – 12px` fontla net ve koyu olarak yer almalıdır.
  - **Boş Saatler:** Boş kalan 30 dakikalık satırlara öğrencinin elle not yazabilmesi için satır yüksekliği minimum **16px – 18px** altına düşürülmemeli, aradaki saat çizgileri açık gri (`#cbd5e1`) ile belirgin olmalıdır.
  - Saat sütununda saatler (`06:00`, `06:30`...) net, tek satırda ve sıkışmadan okunmalıdır.

### 5) Alışkanlık Takip Çizelgesi (Yatay A4)
- **Yönlendirme:** Kesinlikle **Yatay (A4 Landscape)**.
- **Yerleşim:**
  - 1'den 31'e kadar olan gün kutucukları, öğrencinin kalemle artı (+), tik veya çarpı koyabileceği kare kutular halinde olmalıdır.
  - 6 temel alışkanlığın satır yükseklikleri eşit ve ferah olmalı, sol taraftaki alışkanlık adı ve hedefi `11px – 12px` rahatça okunmalıdır.

### 6) Haftalık Ödev Fişi & Akademik Karne (Raporlar Menüsü / Dikey A4)
- **Yönlendirme:** Kesinlikle **Dikey (A4 Portrait)**.
- **Haftalık Ödev Fişi:**
  - Üstte öğrenci ve koç bilgisi, ortada haftalık ödev listesi, altta ise **"Koçun Notu & Haftalık Hedef"** ile **"Veli İmzası"** için el yazısına uygun geniş, noktalı çizgili açık alanlar bulunmalıdır.
- **Akademik Karne:**
  - Sayfa 1 veya 2 sayfaya taşma yapmadan, başarı grafikleri, ders bazlı soru sayıları ve doğruluk yüzdeleri `11px – 13px` tipografiyle net bir resmi karne görünümünde basılmalıdır.

### 7) Deneme Sınavı Karnesi (Dikey A4)
- **Yönlendirme:** Kesinlikle **Dikey (A4 Portrait)**.
- **Yerleşim:**
  - Puan kartları, ders analiz tablosu (Doğru, Yanlış, Boş, Net, Başarı %), Karşılaştırma Modülü ve Konu/Kazanım analizi tek bir A4 sayfaya (veya gerekirse net 2 sayfaya) orantılı dağıtılmalıdır.
  - Konu analiz tablosundaki yazı boyutu `10.5px – 11px` olmalı, asla okunamaz seviyeye küçülmemelidir.

### 8) Hata Defteri & 1-3-7 Telafi Formu (Yatay A4)
- **Yönlendirme:** Kesinlikle **Yatay (A4 Landscape)**.
- **Yerleşim:**
  - Soru metni, doğru cevap ve öğrencinin hatasını analiz edip yazacağı "Hatanın Nedeni / Çözüm Notu" alanı kalemle yazı yazılabilecek genişlikte çizgili kutu olmalıdır.
  - 1. Gün, 3. Gün ve 7. Gün tekrar kontrol kutuları belirgin olmalıdır.

---

## 3. Doğrulama ve Kabul Kriterleri

1. **Sıfır Ayar Gereksinimi:** Kullanıcı herhangi bir raporun "Yazdır" butonuna bastığında, tarayıcının yazdırma önizleme ekranı rapor yatay ise otomatik **Yatay**, dikey ise otomatik **Dikey** olarak açılmalıdır; kullanıcı yön ayarı yapmak zorunda kalmamalıdır.
2. **`odev-takip` Yazdırma Düzeltmesi:** Çizelge robotunda Ödev Takip seçiliyken Yazdır butonuna basıldığında doğru şablon (`renderCizelgeOdevTakipPages`) dikey olarak basılmalıdır.
3. **Okunabilirlik ve Doldurulabilirlik:** Çıktıdaki hiçbir metin kağıt üzerinde mikroskobik boyuta küçülmemeli; boş bırakılan tüm alanlar elle kalemle rahatça doldurulabilecek yükseklikte basılmalıdır.
4. **Taşmasız ve Çift Sayfasız Baskı:** Tek sayfa olarak tasarlanan şablonlar (Zaman Bloklama, Alışkanlık Takip, Ödev Fişi vb.) yazıcıda kesinlikle ikinci boş veya yarım sayfaya taşmamalı, tek A4 sayfasına tam oturmalıdır.
