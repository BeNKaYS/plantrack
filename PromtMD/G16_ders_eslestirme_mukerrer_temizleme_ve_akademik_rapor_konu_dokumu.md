# Plantrack — G16: Deneme Sınavı Ders Eşleştirme Motoru, Mükerrer Dersleri Birleştirme & Temizleme ve Akademik Raporda Konu Bazlı Ayrıntı Dökümü

Merhaba Antigravity,

Plantrack uygulamamızda Deneme Sınavı yükleme sürecinde ders eşleştirme yetersizliğinden kaynaklanan çok ciddi bir veri kirliliği ve mükerrer ders sorunu yaşamaktayız. Ayrıca **Akademik Takip & Performans Raporu'nda** derslerin sadece genel özetini değil, konu bazlı ayrıntılı dökümünü görmek ve denemelerle ilerleme oranı arasındaki bağı koç ve veliye şeffaf biçimde sunmak istiyoruz.

Bu geliştirme için tespit edilen sorunlar, çözüm mimarisi ve senden beklenen adımlar aşağıdadır:

---

## 1. Tespit Edilen Temel Sorunlar (Ekran Görüntüsü Analizi)

1. **Mükerrer ve Sahte Derslerin Oluşması:**
   - Koç sisteme `8 Türkçe`, `8 Matematik`, `8 Fen Bilimleri`, `8 İnkılap Tarihi`, `8 Din Kültürü`, `8 İngilizce` derslerini ve konularını tanımlamıştır.
   - Ancak Excel deneme sınavı yüklendiğinde; dosyadaki `Fen ve Teknoloji`, `FEN VE TEKN.`, `Sosyal Bilgiler`, `T.C. İnkılap Tarihi ve Atatürkçülük`, `Din Kültürü ve Ahlak Bilgisi`, `Yabancı Dil (İngilizce)` gibi farklı yazılmış ders isimleri mevcut derslerle eşleşmemiştir.
   - Sistem eşleşmeyen bu dersler için otomatik olarak yeni dersler ve alt konular açmış; Akademik Rapor'da **6 ders yerine 13 ders** listelenmiştir. Konular ve ilerleme yüzdeleri sahte derslerle gerçek dersler arasında ikiye bölünmüştür.
2. **Akademik Raporda Konu Ayrıntısının Olmaması:**
   - Raporda sadece dersin toplam konu sayısı ve ilerleme yüzdesi yer almakta; hangi konuların bittiği, hangilerinin denemede yanlış yapıldığı tek tek görülememektedir.

---

## 2. Akıllı Ders Eşleştirme Motoru (`Store.findMatchingDers`)

Deneme sınavı içe aktarılırken (`saveParsedDeneme`), gelen ders adını öğrencinin mevcut dersleriyle eşleştiren akıllı bir kanonik eşleştirme motoru kurulmalıdır:

### A. Sınıf Ön Eki Temizleme ve Normalizasyon:
- Ders adının başındaki `8 `, `8. Sınıf `, `8.`, `08/A ` gibi sınıf numaraları ve noktalama işaretleri temizlenmelidir.
- Türkçe karakterler (`ı->i`, `ğ->g`, `ü->u`, `ş->s`, `ö->o`, `ç->c`) normalize edilmeli ve boşluklar temizlenmelidir.

### B. Kanonik Ders Eşleştirme Sözlüğü (Alias Map):
Öncelik sırasıyla şu anahtar kelime eşleşmeleri yapılmalıdır:
- **Din Kültürü:** `din`, `ahlak`, `dkab`, `din kültürü ve ahlak bilgisi` -> `Din Kültürü` (Örn: `8 Din Kültürü`)
- **İnkılap Tarihi:** `inkilap`, `inkılap`, `sosyal`, `sosyal bilgiler`, `ataturk`, `tarih` -> `İnkılap Tarihi` (Örn: `8 İnkılap Tarihi`)
- **Fen Bilimleri:** `fen`, `fenvetekn`, `fenveteknoloji`, `teknoloji`, `fen bilimleri` -> `Fen Bilimleri` (Örn: `8 Fen Bilimleri`)
- **İngilizce:** `ingilizce`, `yabanci`, `yabancı dil`, `english` -> `İngilizce` (Örn: `8 İngilizce`)
- **Matematik:** `matematik`, `geometri` veya tam `mat` -> `Matematik` (Örn: `8 Matematik`)
- **Türkçe:** `turkce`, `türkçe`, `edebiyat` veya tam `tur` -> `Türkçe` (Örn: `8 Türkçe`)

### C. Asla Otomatik Ders Açmama Kuralı:
- Deneme içe aktarılırken sistem **kesinlikle kafasına göre yeni bir ders oluşturmamalıdır** (`Store.addDers` çağrılmamalıdır).
- Eğer gelen ders adı sistemdeki hiçbir dersle eşleşmezse, içe aktarma onay modalında koça bir açılır kutu (dropdown) sunulmalı: *"Denemedeki '[Ders Adı]' dersi sisteminizdeki hangi dersle eşleştirilsin?"* sorusu sorularak koçun seçimi alınmalıdır.

---

## 3. Mevcut Mükerrer Dersleri Birleştirme & Temizleme Aracı (`Store.birlestirMukerrerDersler`)

Şu an kullanıcının sisteminde oluşmuş olan mükerrer dersleri (örn: `FEN VE TEKN.`, `Türkçe`, `Matematik`, `Fen Bilimleri`, `T.C. İnkılap Tarihi ve Atatürkçülük` vb.) tek tıkla temizlemek için bir birleştirme fonksiyonu ve arayüz butonu eklenmelidir:

1. **Aktarım Mantığı:**
   - Mükerrer/sahte dersin altındaki tüm konular (`Store.data.konular`) ve öğrencinin bu konulara ait durum kayıtları (`Store.data.ogrenciKonuDurumlari`), yukarıdaki akıllı eşleştirme algoritmasıyla tespit edilen ana derse (örn: `8 Fen Bilimleri`) taşınmalıdır.
   - Eğer ana derste aynı isimde konu zaten varsa, denemeden gelen doğru/yanlış ve not bilgileri ana konunun durumuna aktarılmalı; kopya konu silinmelidir.
2. **Sahte Dersin Silinmesi:**
   - Konuları ve verileri aktarılan sahte ders `Store.data.dersler` listesinden kalıcı olarak silinmelidir.
3. **Kullanıcı Arayüzü:**
   - **Müfredat & Dersler** ekranına veya ayarlar menüsüne *"Mükerrer Dersleri Otomatik Birleştir & Temizle"* butonu konulmalı; tıklandığında yapılan birleştirme koça bildirilmelidir.

---

## 4. Akademik Raporda Konu Bazlı Ayrıntı Dökümü

Akademik Takip & Performans Raporu (`renderReportFullHTML`) şu şekilde zenginleştirilmelidir:

1. **Ders Satırlarının Genişletilebilir (Akordeon) Yapısı:**
   - Ekranda incelenirken, koç veya veli tablodaki herhangi bir ders satırına (veya yanındaki "Konu Detayı" butonuna) tıkladığında, o dersin altındaki konular liste halinde açılmalıdır.
2. **A4 Baskı / Karne Görünümünde Konu Detayları:**
   - Sayfa yazdırıldığında veya raporda derslerin hemen altında konular şu sütunlarla derli toplu listelenmelidir:
     - **Konu Adı**
     - **Durum:** `Tamamlandı` (Yeşil rozet / ☑), `Tekrar Lazım` (Turuncu/Kırmızı rozet / ⚠), `Çalışılıyor` (Mavi rozet), `Başlanmadı` (Gri)
     - **Son Deneme Başarısı / Koç Notu:** İlgili konunun son denemedeki soru, doğru, yanlış ve başarı yüzdesi (Örn: *"1. Deneme: 4/4 D (%100)"* veya *"2. Deneme: 1 D, 6 Y (Tekrar)"*).

---

## 5. Denemeler ile İlerleme Oranı Arasındaki Mantıksal İlişkinin İzahı

Raporda ve kullanıcı arayüzünde ilerleme oranının ne anlama geldiği net bir bilgi kutusu (tooltip veya dipnot) ile açıklanmalıdır:

- **İlerleme Oranı Formülü:**  
  $$\text{İlerleme (\%)} = \left( \frac{\text{Tamamlanan Konu Sayısı}}{\text{Toplam Müfredat Konu Sayısı}} \right) \times 100$$
- **Deneme Sınavlarının Etkisi:**
  - İlerleme oranı bir puan veya net ortalaması **değildir**; öğrencinin o dersteki yıllık müfredat konularının ne kadarını başarıyla kavradığının göstergesidir.
  - Öğrenci bir deneme sınavında o konudan çıkan soruların tamamını doğru yaptığında konu durumu otomatik olarak **"Tamamlandı"** olur ve dersin ilerleme yüzdesi artar.
  - Öğrenci o konudan 1 bile yanlış yaptığında konu durumu **"Tekrar Lazım"** haline gelir; konu tamamlanan sayılmaz ve ilerleme yüzdesi artmaz. Bu konular alt kısımdaki **"Kritik Eksik Konular"** tablosuna düşer.
  - Koç ödev matrisinde konuyu çalıştığında veya öğrenci telafi denemesinde hatasını düzelttiğinde durum tekrar "Tamamlandı"ya geçer.

---

## 6. Doğrulama ve Kabul Kriterleri

- Deneme sınavı Excel'i yüklendiğinde `Fen ve Teknoloji` veya `FEN VE TEKN.` doğrudan `8 Fen Bilimleri`ne; `Sosyal Bilgiler` veya `T.C. İnkılap Tarihi` doğrudan `8 İnkılap Tarihi`ne atanmalı, sisteme fazladan ders eklenmemelidir.
- "Mükerrer Dersleri Birleştir" çalıştırıldığında listedeki 13 ders fazlalığı temizlenmeli, yalnızca öğrencinin 6 ana dersi kalmalıdır.
- Akademik raporda her dersin konuları, durumları ve son sınav sonuçları detaylı olarak incelenebilir olmalıdır.
