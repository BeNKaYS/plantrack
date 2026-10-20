# Plantrack — G10: Deneme Analiz Tablosundan Otomatik Konu Başlıklı Ödev Oluşturma

Merhaba Antigravity,

Plantrack uygulamamızdaki Deneme Sınavı Raporu ekranında (`#view-deneme-raporu`), ders ve konu/kazanım analiz tablosu (`//*[@id="view-deneme-raporu"]/div/div[6]`) üzerinden ödev atama sürecini hızlandıracak bir otomatik doldurma davranışı eklemeni istiyorum.

Bu geliştirme için gereksinimlerim ve işleyiş adımları aşağıdadır:

---

## 1. Amacı ve Akışı

- **Başlangıç Noktası:** Deneme sınavı sonuç raporundaki ders ve konu analiz tablosunda (`//*[@id="view-deneme-raporu"]/div/div[6]`), öğrencinin yanlış yaptığı veya telafi edilmesi gereken konunun satırındaki "Ödev Ekle" butonuna basıldığında.
- **Hedef:** Açılan ödev ekleme modalında (`//*[@id="modal-content"]`), kullanıcının tekrar başlık yazmakla vakit kaybetmemesi için ilgili satırdaki **Konu / Kazanım Adı** bilgisinin doğrudan "Görev Başlığı *" alanına otomatik olarak yerleştirilmesidir.

---

## 2. Fonksiyonel Gereksinimler

1. **Otomatik Başlık Atama:**
   - Analiz tablosundaki ilgili satırdan "Ödev Ekle" butonuna tıklandığında, o satırda yer alan konu veya kazanım adı eksiksiz olarak okunmalıdır.
   - Ödev modalı açıldığında, "Görev Başlığı *" metin alanında bu konu/kazanım adı hazır olarak gelmelidir.
2. **Ders Eşleşmesi ve Bütünlük:**
   - Satırdaki konu hangi derse aitse, modal içindeki ders seçim alanı da ilgili dersi otomatik olarak seçili getirmelidir.
3. **Kullanıcı Esnekliği:**
   - Otomatik olarak gelen görev başlığı kilitli (disabled) olmamalı, koçun dilerse bu metni değiştirebilmesine, sonuna test sayısı veya özel yönerge ekleyebilmesine imkan tanıyacak şekilde tamamen düzenlenebilir olmalıdır.
4. **Bağımsız Açılışlarda Varsayılan Durum:**
   - Eğer ödev modalı bu analiz tablosundaki bir satır üzerinden değil de üst menüdeki genel "Ödev Ekle" butonu üzerinden açılırsa, başlık alanı her zamanki gibi boş gelmeye devam etmelidir.

---

## 3. Doğrulama ve Kabul Kriterleri

- Analiz tablosunda herhangi bir konunun yanındaki "Ödev Ekle" butonuna tıklandığında modal doğru bilgilerle açılmalıdır.
- "Görev Başlığı *" alanında tam olarak tablodaki ilgili konunun adı görüntülenmelidir.
- Modal kaydedildiğinde görev, otomatik aktarılan başlıkla birlikte öğrencinin ödev listesine sorunsuz eklenmelidir.
