# Plantrack — G9: Deneme Sınavı Raporu Karşılaştırma Modülü

Merhaba Antigravity,

Plantrack uygulamamızdaki Deneme Sınavı Raporu ekranında (`#view-deneme-raporu`), üst alanın sağ tarafına (`//*[@id="view-deneme-raporu"]/div/div[1]`) mevcut denemeyi önceki sınavlarla kıyaslayan fonksiyonel ve kompakt bir **Deneme Karşılaştırma Modülü** eklemeni istiyorum.

Bu modül için gereksinimlerim, tasarım hiyerarşisi ve işleyiş kuralları aşağıdadır:

---

## 1. Amacı ve Konumu

- **Konum:** Deneme raporu ekranının üst başlık ve özet bölümünün sağ tarafında, mevcut içerik akışını bozmayacak ve alt kısımdaki ayrıntılı ders tablosunu gölgelemeyecek kompakt bir kart yapısında yer almalıdır.
- **Amaç:** Öğrencinin o an incelenen deneme sınavındaki performansını tekil bir sonuç olarak bırakmayıp, önceki sınav performansı ile anında kıyaslamak; koç ve velinin gelişim veya gerileme yaşanan noktaları ilk bakışta görmesini sağlamaktır.

---

## 2. Karşılaştırma Seçimi ve Kontroller

- **Referans Sınav Seçici:**
  - Modül içerisinde küçük ve pratik bir açılır seçim kutusu yer almalıdır.
  - Varsayılan olarak öğrencinin bu sınavdan bir önceki denemesi otomatik seçili gelmelidir.
  - Kullanıcı isterse bu açılır listeden öğrencinin sisteme kayıtlı ilk denemesini veya listedeki herhangi bir önceki denemesini seçebilmelidir.
  - Eğer öğrencinin sistemde kayıtlı tek bir denemesi varsa, modül boş görünmek yerine "Karşılaştırma için en az iki deneme sınavı kaydı gereklidir" şeklinde bilgilendirici ve sade bir uyarı metni göstermelidir.

---

## 3. Gösterilecek Karşılaştırma Verileri

Seçilen referans deneme ile mevcut deneme arasında şu göstergeler yer almalıdır:

1. **Toplam Puan ve Net Değişimi:**
   - İki sınav arasındaki toplam net farkı (artış veya azalış yönünü belirten işaretle birlikte).
   - İki sınav arasındaki toplam puan farkı (artış veya azalış yönünü belirten işaretle birlikte).
2. **Ders Bazlı Değişim Özeti:**
   - Her ana ders için (Türkçe, Matematik, Fen Bilimleri vb.) referans sınava kıyasla net farkı gösterilmelidir.
   - Alanın dar ve kompakt kalması adına bu özet; sade satırlar halinde, ders adı ve yanındaki net değişim değeri şeklinde gösterilmelidir.
3. **Gelişim ve Destek İpuçları:**
   - Karşılaştırma sonucuna göre en belirgin artış yaşanan ders "En Çok Yükselen" olarak, en çok net kaybı yaşanan ders ise "Desteğe İhtiyaç Duyulan" olarak tek satırda özetlenmelidir.

---

## 4. Kullanıcı Deneyimi ve Arayüz Kuralları

- Kart yapısı sade, ferah ve okunabilir olmalıdır.
- Sayfa düzeni bozulmamalı, mobil ve masaüstü görünümlerde yatayda taşma yapmadan esnek bir şekilde uyum sağlamalıdır.
- Açılır kutudan farklı bir referans sınav seçildiğinde sayfa yenilenmeden, kartın içeriğindeki fark değerleri anında ve yumuşak bir geçişle güncellenmelidir.
- Rapor sayfası yazdırma moduna alındığında bu karşılaştırma kartı da resmi sınav sonuç belgesi düzenini aksatmayacak şekilde derli toplu bir formatta baskıya yansımalıdır.

---

## 5. Doğrulama ve Kabul Kriterleri

- Öğrencinin birden fazla denemesi olduğunda karşılaştırma kartı otomatik olarak bir önceki sınavla farkları doğru hesaplayıp göstermelidir.
- Açılır listeden başka bir sınav seçildiğinde net ve puan farkları hatasız yeniden hesaplanmalıdır.
- Tek denemesi olan öğrencilerde ekran hata vermemeli, şık bir bilgilendirme mesajı ile durumu açıklamalıdır.
