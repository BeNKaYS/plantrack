# Plantrack — G12: Raporlar ve Çizelgelerde Çok Sayfalı Akış, Sayfalar Arası Önizleme ve Baskı Yönetimi

Merhaba Antigravity,

Plantrack uygulamamızdaki Çizelge Robotu (`#view-cizelge-robotu`), Raporlar (`#view-report`) ve Hata Defteri gibi A4 çıktı üreten tüm modüllerde, veri yoğunluğu tek bir sayfayı aştığında yaşanan taşma ve düzen bozulmalarını gidermek için kapsamlı bir **Çok Sayfalı Belge ve Önizleme Sistemi** kurmanı istiyorum.

Özellikle Ödev Takip Çizelgesi, Konu Takip Tablosu ve Akademik Raporlarda veri sayısı arttığında satırların kontrolsüzce tek sayfaya sıkışması veya rastgele bölünmesi yerine, içeriğin mantıklı sayfalara ayrılması, önizlemede sayfalar arasında kolayca gezilebilmesi ve baskıya tam uyumlu çıkması gerekmektedir.

Bu geliştirme için gereksinimler, kullanıcı deneyimi kuralları ve çalışma mantığı aşağıdadır:

---

## 1. Otomatik Sayfalama ve Veri Bölme Mantığı

1. **Sayfa Kapasitesi Denetimi:**
   - Bir tablodaki veya listedeki satır sayısı A4 sayfasının görsel sınırını aştığında, içerik otomatik olarak Sayfa 1, Sayfa 2, Sayfa 3 şeklinde mantıksal parçalara bölünmelidir.
   - Her tablo türü için (örneğin Ödev Takip Çizelgesi veya Konu Takip Tablosu) tek bir A4 sayfasına dikey taşma yapmadan sığabilecek maksimum satır adedi temel alınmalıdır.
2. **Başlık ve Sayfa Numaralandırması:**
   - 2. ve sonraki sayfalarda belgenin üst kısmı kopuk görünmemeli; öğrenci adı, sınıfı ve belge adını içeren kompakt bir devam başlığı yer almalıdır.
   - Her sayfanın en alt sağ veya orta kısmında resmi evrak standardına uygun olarak "Sayfa 1 / 2", "Sayfa 2 / 2" şeklinde net bir sayfa numaralandırması bulunmalıdır.
3. **Kapanış Bölümleri ve İmzalar:**
   - Koçun haftalık değerlendirme notu, veli onay kutusu ve imza alanları tablonun ortasına sıkışmamalı; belgenin en son sayfasının alt kısmına düzenli bir şekilde yerleştirilmelidir.

---

## 2. Önizleme Alanında Sayfalar Arası Gezinme

1. **Sayfa Gezinme Çubuğu:**
   - Oluşturulan çizelge veya rapor birden fazla sayfadan oluşuyorsa, A4 önizleme alanının hemen üstünde sade bir gezinme çubuğu görünmelidir.
   - Bu çubukta "Önceki Sayfa" ve "Sonraki Sayfa" butonları ile ortada o an görüntülenen sayfayı belirten "Sayfa X / Y" göstergesi yer almalıdır.
   - İlk sayfadayken "Önceki Sayfa", son sayfadayken "Sonraki Sayfa" butonları pasif (tıklanamaz) hale gelmelidir.
2. **Görsel Geçiş:**
   - Sayfa değiştirildiğinde önizleme alanı sadece seçilen sayfanın içeriğini göstermeli; sayfa kenar boşlukları ve A4 kağıt hissi bozulmadan korunmalıdır.
   - Tek sayfaya sığan belgelerde bu sayfa gezinme çubuğu otomatik olarak gizlenmeli, arayüzde gereksiz kalabalık yaratmamalıdır.

---

## 3. Yazdırma Motoru (Baskı) Uyumluluğu

- Kullanıcı önizlemede sadece 1. veya 2. sayfayı görüntülüyor olsa dahi, üst taraftaki "Yazdır (A4)" butonuna bastığında sistem belgenin **tüm sayfalarını eksiksiz olarak** baskı kuyruğuna göndermelidir.
- Her sayfa yazıcıya tam bir A4 sayfası olarak aktarılmalı; sayfalar arasına kesin sayfa sonu kuralları konularak tarayıcının satırları ortadan ikiye bölmesi veya boş yarım sayfalar çıkarması engellenmelidir.

---

## 4. Ödev Takip Çizelgesi İçin Özel Esneklikler

Önceki adımda tespit ettiğimiz Ödev Takip Çizelgesi kontrol eksikliklerini de bu güncellemeyle tamamlamanı istiyorum:
1. **Şablon Modu Seçimi:**
   - Şablon ayarları kontrol barına "Dolu Çizelge" ve "Boş Şablon" seçenekleri eklenmelidir.
   - "Boş Şablon" seçildiğinde öğrencinin dijital ödevleri tabloya doldurulmamalı; koçun masada öğrenciye el yazısıyla ödev verebilmesi için temiz, çizgili ve boş kare kutucuklu satırlar üretilmelidir.
2. **Zaman Aralığı Kapsamı:**
   - Çizelgeye aktarılacak ödevler için "Yalnızca Bu Haftanın Ödevleri" ve "Tüm Aktif Ödevler" ayrımı yapılmalıdır.
   - Çizelgenin başlığındaki hafta aralığı ile tablodaki teslim tarihleri birbiriyle uyumlu olmalıdır.

---

## 5. Doğrulama ve Kabul Kriterleri

- Ödev sayısı veya konu sayısı tek sayfayı aştığında çizelge otomatik olarak 2. sayfayı oluşturmalıdır.
- Önizleme ekranında sayfalar arasında ileri/geri geçiş sorunsuz çalışmalı, her sayfanın içeriği kendi A4 sınırında doğru görünmelidir.
- Yazdır butonuna basıldığında yazıcı önizlemesinde belgenin tüm sayfaları sırasıyla ve taşma olmadan tam sayfalar halinde çıkmalıdır.
- Boş şablon modu seçildiğinde öğrenci verisinden bağımsız, standart boş satırlar yazdırılabilir olarak ekrana gelmelidir.
