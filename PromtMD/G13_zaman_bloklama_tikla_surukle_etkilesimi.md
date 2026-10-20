# Plantrack — G13: Haftalık Çalışma Planı Zaman Bloklama Tablosunda Tıkla-Sürükle Seçim ve Boyama Etkileşiminin Düzeltilmesi

Merhaba Antigravity,

Haftalık Çalışma Planı ve Zaman Bloklama tablosunda (`//*[@id="cizelge-preview-area"]/div`) koçluk deneyimini olumsuz etkileyen çok ciddi bir fare kontrolü ve bloklama sorunu yaşıyorum. 

Mevcut sistemde fare tuşunun basılı kalma durumu kilitleniyor ve kullanıcı fareyi sadece tablo üzerinde gezdirdiğinde bile değdiği her hücrenin durumu kontrolsüzce değişiyor, tüm planlama bozuluyor. Bunun yerine modern takvim ve tablo uygulamalarındaki gibi net, kontrollü, yatay ve dikeyde tıkla-sürükle mantığıyla çalışan profesyonel bir blok seçme mekanizması kurmanı istiyorum.

Bu geliştirme için gereksinimlerim ve davranış kuralları aşağıdadır:

---

## 1. Sorunun Tespiti ve Temel Kural

- **Gezinmede Değişiklik Yasağı:** Fare sol tuşuna basılı tutulmadığı sürece, farenin tablo hücreleri üzerinde sadece dolaşması (hover) kesinlikle hiçbir hücrenin verisini, durumunu veya görünümünü değiştirmemelidir.
- **Tuş Bırakma Güvenliği:** Kullanıcı fareyi tablonun dışına çıkarsa, tarayıcı penceresinin dışına taşırsa veya nerede bırakırsa bıraksın sürükleme durumu anında ve güvenle sonlanmalıdır. Farenin basılı kalma durumu asla arka planda kilitli kalmamalıdır.

---

## 2. İstenen Tıkla-Sürükle (Drag-to-Select) Mekanizması

1. **Başlangıç (Tıklama):**
   - Kullanıcı başlangıç hücresine tıkladığında seçim işlemi başlar ve ilk hücre işaretlenir.
2. **Sürükleme (Yatay veya Dikey Aralık Belirleme):**
   - Kullanıcı sol tuşu basılı tutarak fareyi dikeyde (aynı günün farklı saatlerine doğru) veya yatayda (aynı saat diliminin farklı günlerine doğru) hareket ettirdikçe, başlangıç ve bitiş hücreleri arasındaki tüm blok geçici olarak seçili aralık olarak vurgulanmalıdır.
   - Sürükleme esnasında veri henüz kalıcı olarak kaydedilmemeli, kullanıcıya hangi saat bloğunu seçtiğini gösteren net bir görsel seçim çerçevesi sunulmalıdır.
3. **Tamamlama (Bırakma):**
   - Kullanıcı fare tuşunu bıraktığı anda, seçilen bu aralıktaki tüm hücrelere aktif seçili faaliyet (okul, etüt, ders çalışma, dinlenme, serbest zaman veya silgi) topluca tek seferde atanmalıdır.
   - Atama tamamlandığında geçici seçim çerçevesi kalkmalı ve nihai blok görünümü ekrana yansımalıdır.

---

## 3. Tek Tık ve Hızlı Silme Kolaylığı

- Sürükleme yapmaksızın sadece tek bir hücreye tıklandığında, yalnızca o hücrenin durumunun değişmesi veya temizlenmesi korunmalıdır.
- Sağ tık veya silgi modu seçildiğinde, sürüklenen bloktaki tüm etkinliklerin tek hamlede temizlenebilmesi sağlanmalıdır.

---

## 4. Doğrulama ve Kabul Kriterleri

- Fare hiçbir tuşa basılmadan tablonun üzerinde gezdirildiğinde mevcut blokların hiçbiri bozulmamalı ve değişmemelidir.
- Örneğin Pazartesi 09:00'dan 13:00'e kadar fareyle dikey sürüklendiğinde, tuş bırakıldığı an aradaki tüm saatler tek seferde ilgili etkinlikle dolmalıdır.
- Tablo dışına sürükleyip bırakma durumunda fare takılı kalmamalı, sonraki ilk hareket serbest gezinme olarak algılanmalıdır.
- Sayfa A4 olarak yazdırıldığında oluşturulan zaman blokları eksiksiz ve temiz şekilde çıktıya yansımalıdır.
