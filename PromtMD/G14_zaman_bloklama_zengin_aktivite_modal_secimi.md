# Plantrack — G14: Zaman Bloklama Tablosunda 30 Dakikalık Çözünürlük, 24:00 Bitiş, Birleştirilmiş Blok Etiketleme ve Kapsamlı Faaliyet Seçim Modalı

Merhaba Antigravity,

Haftalık Çalışma Planı ve Zaman Bloklama tablomuzda (`#cizelge-preview-area`) hem zaman çözünürlüğünü hem de öğrenci için görsel okunabilirliği üst seviyeye çıkaracak köklü ve modern bir düzenleme yapmanı istiyorum.

Şu anki 1'er saatlik ve 22:00'de biten yapı, günümüz sınav ve okul temposundaki öğrencilerin gerçek gününü yansıtmada yetersiz kalıyor. Ayrıca dar hücrelere metin yazıldığında oluşan karmaşayı engellemek için takvim araçlarındaki gibi hücreleri birleştirerek etiketleme mantığına geçmemiz gerekiyor.

Bu geliştirme için net gereksinimlerim, mimari kurallar ve faaliyet kütüphanesi aşağıdadır:

---

## 1. Saat Aralığı ve 30 Dakikalık Zaman Çözünürlüğü

1. **Çalışma Aralığı (06:00 – 24:00):**
   - Çizelge tablosunun başlangıç saati sabah **06:00**, bitiş saati ise gece **24:00** olmalıdır.
   - Böylece sabah erken etütleri, okul hazırlığı, okul saatleri, akşam etütleri ve gece dinlenme/uyku rutinleri eksiksiz planlanabilir.
2. **30 Dakikalık Zaman Dilimleri:**
   - Tablodaki her bir saat aralığı 30'ar dakikalık hassas hücrelere bölünmelidir:
     `06:00`, `06:30`, `07:00`, `07:30`, `08:00`, ..., `23:30`, `24:00`.
   - Sol taraftaki saat ekseninde bu yarımşar saatlik dilimler net ve temiz bir tipografiyle listelenmelidir.

---

## 2. Çoklu Hücre Seçiminde Birleştirilmiş Blok ve Tek Etiketleme Mantığı (Merged Block)

Yarım saatlik dilimlere geçildiğinde satır yükseklikleri kaçınılmaz olarak daha dar olacaktır. Her bir 30 dakikalık kutucuğa ayrı ayrı faaliyet adı yazmaya çalışmak çizelgede metin karmaşası yaratır ve okunmayı imkansızlaştırır.

Bu nedenle:
1. **Dikeyde Birleştirilmiş Görsel Blok:**
   - Kullanıcı dikeyde birden fazla hücre seçip bir faaliyet atadığında (örneğin 3 hücre seçildiğinde: `09:00 – 10:30`, toplam 1.5 saat), bu hücreler bölünmüş ayrı kutular olarak değil, **dikeyde tek bir birleşik blok/kart** olarak görünmelidir.
   - Aradaki yatay hücre çizgileri kalkmalı, arka plan rengi kesintisiz bir bütün oluşturmalıdır.
2. **Tek ve Okunaklı Etiketleme:**
   - Seçilen tüm bloğun içerisine faaliyet ismi sadece **bir kez**, dikey ve yatay olarak bloğun merkezine ortalanmış, ferah ve okunaklı bir şekilde yazılmalıdır.
   - Örneğin 3 hücrelik bir blok için her satıra "Soru Çözümü" yazılmamalı; birleştirilmiş 1.5 saatlik bloğun tam ortasında tek bir *"Soru Çözümü"* (ve varsa altında saat aralığı/not) yer almalıdır.
   - Bu sayede çocuk çizelgeyi eline aldığında gününü bloklar halinde son derece net ve yorulmadan okuyabilir.
3. **Ardışık Aynı Faaliyetlerin Birleşimi:**
   - Aynı günde peş peşe gelen ve aynı etkinliğe sahip hücreler otomatik olarak tek bir kesintisiz blok halinde birleştirilmeli ve etiketlenmelidir.

---

## 3. Tıkla-Sürükle Sonrası Otomatik Modal Açılışı

1. **Aralık Seçimi:**
   - Koç, tablodaki herhangi bir 30 dakikalık hücreden başlayıp dikeyde veya yatayda faresini sürükler. Sürükleme esnasında seçilen aralık yarı saydam bir çerçeveyle vurgulanır.
2. **Otomatik Modal Tetikleme:**
   - Fare bırakıldığı an sistem seçilen aralığı hesaplar (Örn: *"Pazartesi 09:00 – 10:30 (1.5 Saat)"* veya *"Salı 14:00 – 16:00 (2 Saat)"*).
   - Doğrudan **"Zaman Bloğu Faaliyet Seçimi"** modalı açılır.
   - Modal başlığında tam gün ve saat aralığı ile toplam süre açıkça gösterilir.

---

## 4. Kapsamlı Faaliyet Kütüphanesi (Örnek Rutin Seçenekleri Dahil)

Açılan modalda, Örnek Rutin menüsündeki (`//*[@id="zaman-rutin-dropdown-wrap"]/button`) tüm zengin başlıkları da içeren faaliyet kütüphanesi kategorize butonlar halinde yer almalıdır:

### A. Akademik, Soru Çözümü ve Sınav Hazırlığı
- **Okul / Ders:** Örgün eğitim saatleri.
- **Konu Çalışması & Özet Çıkarma:** Yeni konu kavrama ve özet çıkarma.
- **Eksik Konu Çalışması:** Eksik kapatma ve telafi konu çalışması.
- **Soru Çözümü:** Bireysel test ve kazanım soruları.
- **Branş Soruları:** Derse özel odaklı soru bankası çözümü.
- **Akşam Soru Bankası / Akşam Seansı:** Gün sonu soru bankası taraması.
- **Karma Soru Çözümü / Pekiştirme:** Çoklu derslerden karma pekiştirme soruları.
- **Deneme Sınavı:** Genel veya branş deneme sınavı.
- **Deneme Analizi & Hata Defteri:** Yanlış soru incelemesi ve hata defteri tutma.
- **Haftalık Genel Tekrar:** Hafta sonu haftalık ders tekrarı.
- **Paragraf & Problem Rutini:** Günlük disiplin odaklı soru bloğu.
- **Özel Ders / Kurs / Etüt:** Destekleyici ders ve etüt saatleri.

### B. Kişisel Gelişim ve Rutinler
- **Kitap Okuma:** Günlük kitap okuma saati.
- **Yabancı Dil / Kelime Pratiği:** Düzenli dil çalışması.
- **Proje, Ödev ve Sunum:** Okul ödevleri ve proje hazırlığı.

### C. Yaşam, Dinlenme ve Denge
- **Dinlenme / Mola:** Bloklar arası zihinsel dinlenme.
- **Serbest Zaman & Hobi:** Bireysel dinlendirici aktiviteler ve hobiler.
- **Spor / Egzersiz:** Fiziksel aktivite ve yürüyüş.
- **Yemek & Aile Zamanı:** Günlük yaşam rutinleri.
- **Uyku / Gece Dinlenmesi:** Düzenli uyku saatleri.

### D. Düzenleme ve Temizleme
- **Bloğu Temizle (Silgi):** Seçilen aralıktaki mevcut tüm etkinlikleri silip boş saat çizgisi haline getirme.

---

## 5. İsteğe Bağlı Detay Notu Ekleme

- Modal içinde faaliyet butonuna basıldığında, koç dilerse altına tek satırlık isteğe bağlı kısa bir açıklama veya ders adı ekleyebilmelidir (Örn: Faaliyet: *"Branş Soruları"*, Not: *"Matematik - 3 Test"*).
- Birleştirilmiş blok içinde bu not, ana faaliyet başlığının hemen altında daha ince bir fontla şıkça gösterilmelidir.

---

## 6. Baskı (A4) ve Çıktı Uyumu

- Tablo 06:00 – 24:00 aralığında toplam 36 adet yarım saatlik satıra sahip olacağı için, A4 tek sayfa baskıda satır yükseklikleri ve font boyutları sayfaya tam sığacak şekilde optimize edilmelidir.
- Birleştirilmiş dikey bloklar ve ortalanmış etiketler A4 çıktıda çizgileri taşmadan, son derece temiz, ferah ve profesyonel bir ajanda görünümünde basılmalıdır.

---

## 7. Doğrulama ve Kabul Kriterleri

- Çizelge tablosu 06:00'dan başlayıp 24:00'e kadar 30 dakikalık aralıklarla listelenmelidir.
- Dikeyde art arda seçilen 2, 3 veya daha fazla yarım saatlik hücreye faaliyet atandığında bu hücreler tek bir blok olarak birleşmeli ve etiketleme bu bloğun ortasında tek bir kez yazılmalıdır.
- Sürükle-bırak yapıldığında faaliyet seçim modalı doğru saat aralığıyla açılmalı, seçilen faaliyet onaylandığında tüm blok anında güncellenmelidir.
- "Bloğu Temizle" seçildiğinde ilgili saat dilimleri eski boş haline dönmelidir.
- A4 yazdırma önizlemesinde tablo tek sayfaya sığmalı, birleştirilmiş etiketler net ve okunaklı görünmelidir.
