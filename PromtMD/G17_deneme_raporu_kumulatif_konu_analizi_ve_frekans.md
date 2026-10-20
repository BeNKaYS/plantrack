# Plantrack — G17: Deneme Raporu Kapsam Seçici (Kümülatif / Tekil Sınav), Konu Frekans Sütunu ve Öğrenci Kokpiti Aşırı Uzunluk Düzeltmesi

Merhaba Antigravity,

Bu geliştirmede iki kritik ekranda kullanıcı deneyimini ve koçluk analiz gücünü doğrudan iyileştirecek düzenlemeler yapmanı istiyorum:

1. **Deneme Sınavı Raporu (`#view-deneme-raporu`):** Konu/Kazanım analiz tablosuna (`//*[@id="view-deneme-raporu"]/div/div[6]/div[2]`) bir "Deneme Kapsamı" açılır listesi eklenmesi; "Tüm Denemeler" seçildiğinde kümülatif toplamlar ve "Deneme Sayısı" sütununun gelmesi, tekil bir deneme (Deneme 1, Deneme 2 vb.) seçildiğinde ise sadece o denemenin analizine filtrelenmesi.
2. **Öğrenci Kokpiti (`#view-cockpit`):** Sayfayı gereksiz yere aşağıya doğru sonsuz uzatan Acil Müdahale Paneli (`//*[@id="view-cockpit"]/div/div[3]/div[1]`) ve Kritik Eksik Konu Radarı (`//*[@id="view-cockpit"]/div/div[3]/div[2]`) alanlarının kompakt satır yapısına ve dahili kaydırmalı (scrollable) derli toplu bir forma kavuşturulması.

İlgili geliştirmelerin detayları, davranış kuralları ve kabul kriterleri aşağıdadır:

---

## 1. Deneme Raporu: Kapsam Seçici Açılır Liste ve Kümülatif / Tekil Analiz

### A. Konum ve Açılır Liste (Dropdown) Entegrasyonu
- **Konum:** Konu / Kazanım Başarı Analizi tablosunun hemen üstündeki filtreleme çubuğunda (`//*[@id="view-deneme-raporu"]/div/div[6]/div[2]`), "Ders Filtresi"nin hemen yanına yeni bir açılır liste eklenmelidir.
- **Liste Başlığı:** **"Sınav Kapsamı:"** (veya **"Deneme:"**).
- **Liste Seçenekleri:**
  1. **"Tüm Denemeler (Kümülatif Özet)"** *(Varsayılan Seçim)*
  2. Öğrencinin sistemde kayıtlı olan denemeleri kronolojik olarak:
     - *"1. Deneme (Örn: 18.09.2026)"*
     - *"2. Deneme (Örn: 25.09.2026)"*
     - *(Sistemdeki diğer tüm denemeler...)*

### B. "Tüm Denemeler" Seçildiğinde Tablo Davranışı (Kümülatif Mod)
Açılır listeden "Tüm Denemeler" seçildiğinde tablo şu kümülatif kurallarla doldurulmalıdır:
1. **Konu Birleştirme:** Öğrencinin tüm denemelerinde yer alan aynı konular (normalize edilmiş ad ve ders bazında) tek bir satırda toplanmalıdır.
2. **Deneme Sayısı Sütunu (Frekans):**
   - Tabloya açık bir **"Deneme Sayısı"** sütunu eklenmelidir.
   - Bu sütunda o konunun kaç farklı denemede sorulduğu net olarak yazmalıdır (Örn: `3 Deneme`, `2 Deneme`, `1 Deneme`).
   - Böylece koç ve öğrenci, konunun sınavlarda ne kadar sık çıktığını ilk bakışta görebilmelidir.
3. **Toplam Değerler:**
   - **Toplam Soru:** O konudan tüm denemelerde sorulan toplam soru sayısı (Örn: `12`).
   - **D (Doğru):** Tüm sınavlardaki toplam doğru sayısı (Örn: `8`).
   - **Y (Yanlış):** Tüm sınavlardaki toplam yanlış sayısı (Örn: `4`).
   - **Başarı (%):** Tüm sorular üzerinden hesaplanan kümülatif başarı yüzdesi (Örn: `%67`).
4. **Hızlı Ödev Butonu:**
   - Kümülatif satırdan "Ödev Ata" butonuna basıldığında açılan görev modalına ilgili konunun toplam performansı (Örn: *"Son 3 denemede 12 soruda 4 yanlış - %67 başarı"*) otomatik koç notu olarak doldurulmalıdır.

### C. Tekil Bir Deneme Seçildiğinde Tablo Davranışı (Tekil Sınav Modu)
Açılır listeden belirli bir deneme (örn: "Deneme 1" veya "Deneme 2") seçildiğinde:
- Tablo yalnızca o seçilen denemede çıkan konuları, o denemedeki soru sayısını, doğru, yanlış ve o sınavdaki başarı yüzdesini göstermelidir.
- "Deneme Sayısı" sütunu bu modda ya gizlenmeli ya da `1 Deneme` olarak gösterilmelidir.
- Kullanıcı dilediği an açılır listeden tekrar "Tüm Denemeler"i seçerek kümülatif görünüme anında dönebilmelidir.

---

## 2. Öğrenci Kokpiti: Aşırı Uzun Alanların Kompaktlaştırılması

Öğrenci Kokpiti ekranında (`#view-cockpit`) yer alan ve çok sayıda ödev ya da eksik konu olduğunda sayfayı aşağı doğru metrelerce uzatarak altındaki alışkanlık zincirini görünmez kılan Bölüm 3 (`div[3]`) derli toplu hale getirilmelidir:

### A. Sol Kolon: Acil Müdahale Paneli — Geciken Ödevler (`div[3]/div[1]`)
- **Sorun:** Her bir gecikmiş ödev için büyük kartlar, açıklamalar, geniş butonlar render edilmekte; 5-10 ödev geciktiğinde sol taraf aşırı uzamaktadır.
- **Çözüm:**
  1. **Sabit Yükseklik ve Dahili Kaydırma:** Kutuya maksimum yükseklik sınırı konulmalı (`max-h-[340px]`), içerik taştığında panelin kendi içinde ince ve akıcı bir dikey kaydırma çubuğu (`overflow-y-auto`) ile kayması sağlanmalıdır.
  2. **Kompakt Satır Tasarımı:** Hacimli kartlar yerine ince liste satırlarına geçilmelidir:
     - `[Ders Etiketi] Görev Başlığı — X gün gecikti` sol tarafta kompakt tek satırda yer almalı.
     - Sağ tarafta ise küçük ve zarif hızlı işlem ikonları yer almalıdır (Yeşil Tamamla ikonu, Düzenle ikonu, Sil ikonu).

### B. Sağ Kolon: Kritik Eksik Konu Radarı (`div[3]/div[2]`)
- **Sorun:** Denemelerden gelen ve öğrencinin yanlış yaptığı her konu koca bir kart olarak listelenmekte; 15-20 konu olduğunda sağ taraf kontrolsüzce uzamaktadır.
- **Çözüm:**
  1. **Sabit Yükseklik ve Dahili Kaydırma:** Bu panel de sol kolon ile simetrik olacak şekilde `max-h-[340px]` ve `overflow-y-auto` sınırına kavuşturulmalıdır.
  2. **Kompakt Konu Satırları:**
     - Sol tarafta `[Ders Adı]` rozeti ve yanında `Konu Adı`.
     - Varsa altında tek satırlık küçük bir hata notu.
     - Sağ tarafta tek tıkla çalışan kompakt bir `[+ Telafi]` butonu veya ikonu.

### C. Sayfa Dengesinin Sağlanması
- Her iki kolon da aynı maksimum yükseklikte dengelendiğinde, öğrenci kokpitinin altındaki **Aylık Alışkanlık Zinciri & Disiplin Karnesi** ekranı yukarı gelmeli; koç tüm kritik bilgileri tek bir ekranda derli toplu, ferah ve profesyonel bir kokpit düzeninde görebilmelidir.

---

## 3. Doğrulama ve Kabul Kriterleri

1. Deneme Raporu Konu tablosunun üstündeki açılır kutudan "Tüm Denemeler" seçildiğinde öğrencinin tüm sınavlarındaki toplam soru, doğru, yanlış ve o konunun çıktığı "Deneme Sayısı" tek satırda doğru hesaplanmalıdır.
2. Açılır kutudan "1. Deneme" seçildiğinde tablo yalnızca o denemenin kazanımlarına ve netlerine göre filtrelenmelidir.
3. Öğrenci Kokpitinde 10'dan fazla gecikmiş ödev veya 20'den fazla eksik konu olsa dahi Acil Müdahale ve Kritik Konu panelleri sayfayı uzatmamalı; 340px sınırında kendi içinde kaydırılabilmelidir.
4. Kokpitteki kompakt satır yapısında görev tamamlama, silme ve telafi ödevi oluşturma aksiyonları eksiksiz çalışmalıdır.
