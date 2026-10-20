# Plantrack — G11: Tüm Kademeler İçin Müfredat Konularına MEB/ÖSYM Kazanım ve Deneme Eşleştirme Alt Etiketlerinin Eklenmesi (LGS & TYT-AYT)

Merhaba Antigravity,

Plantrack uygulamamızda deneme sınavı sonuç belgelerinden gelen konu/kazanım analizleri ile bizim müfredat havuzumuzdaki konuların birebir örtüşmemesi sorununu çözmek için hem **LGS (8. Sınıf)** hem de **YKS (TYT ve AYT)** kademelerini kapsayan eksiksiz bir kazanım zenginleştirmesi yapmanı istiyorum.

Deneme sınavı yayınları (Özdebir, Töder, Limit, 3D, Bilgi Sarmal, Çap, Hız, Okul Denemeleri vb.) sonuç belgelerinde konu adı yerine doğrudan resmi MEB kazanım cümlelerini, ÖSYM konu başlıklarını veya farklı biçimlerdeki kazanım ifadelerini basmaktadır. Bu nedenle, müfredat havuzumuzdaki her konunun altına o konuya ait resmi MEB/ÖSYM kazanımlarını ve denemelerde sıkça kullanılan alternatif başlıkları içeren bir **kazanım / alt etiket listesi** eklemeni bekliyorum.

Bu geliştirme için gereksinimler, ders ve konu bazlı kazanım dökümü ile veri senkronizasyon kuralları aşağıdadır:

---

## 1. Veri Yapısı ve Model Gereksinimi

- Müfredat havuzundaki (`KONULAR` listesi) her konu nesnesine, o konuyu temsil eden resmi MEB/ÖSYM kazanım cümlelerini ve denemelerden gelebilecek yaygın kalıpları barındıran yeni bir liste alanı eklenmelidir.
- Mevcut `Store` veri yapısında daha önce kayıt edilmiş öğrenci konuları varsa, uygulamanın ilk açılışında bu yeni kazanım alt etiketlerinin mevcut yerel depolama verilerine de güvenle aktarılması (senkronize edilmesi) sağlanmalıdır.

---

## 2. 8. Sınıf (LGS) Konuları ve Resmi MEB Kazanımları

### A. Türkçe Dersi
1. **Fiilimsiler:**
   - Fiilimsilerin cümledeki işlevlerini fark eder.
   - İsim-fiil, sıfat-fiil ve zarf-fiil eklerini ve kullanım özelliklerini belirler.
2. **Sözcük ve Söz Gruplarında Anlam:**
   - Bağlamdan yararlanarak bilmediği kelime ve kelime gruplarının anlamını tahmin eder.
   - Deyim, atasözü ve özdeyişlerin metne katkısını belirler.
   - Söz sanatlarını (benzetme, kişileştirme, tezat, abartma) tespit eder.
   - Kelimede (Sözcükte) Anlam, Deyim ve Atasözü.
3. **Cümlede Anlam & Cümlenin Ögeleri:**
   - Cümlenin ögelerini (özne, yüklem, nesne, yer tamlayıcısı, zarf tamlayıcısı) ayırt eder.
   - Cümle Anlamı, Cümle Yorumu, Örtülü Anlam.
   - Neden-sonuç, amaç-sonuç, koşul-sonuç cümlelerini analiz eder.
4. **Fiilde Çatı:**
   - Fiillerin çatı özelliklerinin anlama olan katkısını değerlendirir.
   - Öznesine ve nesnesine göre fiil çatılarını belirler.
5. **Cümle Türleri:**
   - Cümle türlerini yapısına, anlamına, yüklemin türüne ve yerine göre sınıflandırır.
6. **Paragrafta Anlam & Sözel Mantık:**
   - Metnin ana fikrini / ana duygusunu belirler.
   - Metindeki yardımcı fikirleri ve çıkarımları tespit eder.
   - Okudukları ile ilgili çıkarımlarda bulunur.
   - Tablo, grafik ve görsel yorumlama; sözel mantık ve muhakeme sorularını çözer.
7. **Yazım Kuralları ve Noktalama İşaretleri:**
   - Noktalama işaretlerini işlevlerine uygun olarak kullanır.
   - Yazım kurallarını (büyük harfler, de/da ve ki yazımı vb.) kavrar ve uygular.
8. **Metin Türleri:**
   - Olay, düşünce ve bildirme yazılarını (fıkra, makale, deneme, söyleşi, anı, gezi yazısı) ayırt eder.

### B. Matematik Dersi
1. **Çarpanlar ve Katlar:**
   - Verilen pozitif tam sayıların pozitif tam sayı çarpanlarını bulur, üslü ifadelerle yazar.
   - İki doğal sayının en büyük ortak bölenini (EBOB) ve en küçük ortak katını (EKOK) hesaplar, ilgili problemleri çözer.
   - Verilen iki doğal sayının aralarında asal olup olmadığını belirler.
2. **Üslü İfadeler:**
   - Tam sayıların, tam sayı kuvvetlerini hesaplar.
   - Üslü ifadelerle ilgili temel kuralları anlar, aynı veya farklı tabandaki ifadelerle çarpma ve bölme yapar.
   - Çok büyük ve çok küçük sayıları bilimsel gösterimle ifade eder ve karşılaştırır.
3. **Kareköklü İfadeler:**
   - Tam kare pozitif tam sayılarla bu sayıların karekökleri arasındaki ilişkiyi belirler.
   - Tam kare olmayan sayıların karekök değerlerinin hangi iki doğal sayı arasında olduğunu belirler.
   - Kareköklü bir ifadeyi a√b şeklinde yazar ve kareköklü ifadelerde dört işlem yapar.
4. **Veri Analizi:**
   - En fazla üç veri grubuna ait çizgi ve sütun grafiklerini yorumlar.
   - Verileri sütun, daire veya çizgi grafiği ile gösterir ve bu gösterimler arasında uygun dönüşümleri yapar.
5. **Basit Olayların Olasılığı:**
   - Bir olaya ait olası durumları belirler; "daha fazla", "eşit", "daha az" olasılıklı durumları ayırt eder.
   - Basit bir olayın olma olasılığını hesaplar.
6. **Cebirsel İfadeler ve Özdeşlikler:**
   - Basit cebirsel ifadeleri anlar, çarpar ve modeller.
   - Özdeşlikleri (iki kare farkı, tam kare) modellerle açıklar.
   - Cebirsel ifadeleri çarpanlarına ayırır.
7. **Doğrusal Denklemler:**
   - Birinci dereceden bir bilinmeyenli denklemleri çözer.
   - Koordinat sistemini özellikleriyle tanır ve sıralı ikilileri gösterir.
   - Doğrusal denklemlerin grafiğini çizer; doğrunun eğimini modellerle açıklar.
8. **Eşitsizlikler:**
   - Birinci dereceden bir bilinmeyenli eşitsizlik içeren durumları ifade eder ve sayı doğrusunda gösterir.
9. **Üçgenler & Pisagor:**
   - Üçgende kenarortay, açıortay ve yüksekliği inşa eder.
   - Üçgen eşitsizliğini ve açı-kenar bağıntılarını belirler.
   - Pisagor bağıntısını oluşturur ve problemlerde uygular.
10. **Eşlik ve Benzerlik:**
    - Eş ve benzer çokgenlerin kenar ve açı ilişkilerini belirler; benzerlik oranını hesaplar.
11. **Dönüşüm Geometrisi ve Geometrik Cisimler:**
    - Nokta ve şekillerin öteleme ve yansıma altındaki görüntülerini çizer.
    - Dik dairesel silindir, piramit ve koninin temel elemanlarını, açınımını ve yüzey alan/hacim bağıntılarını inceler.

### C. Fen Bilimleri Dersi
1. **Mevsimler ve İklim:**
   - Mevsimlerin oluşumuna yönelik tahminlerde bulunur.
   - İklim ve hava olayları arasındaki farkı açıklar.
   - İklim biliminin (klimatoloji) bir bilim dalı olduğunu ve bu alanda çalışan uzmanları tanır.
   - Küresel iklim değişikliklerinin nedenlerini ve olası sonuçlarını tartışır.
2. **DNA ve Genetik Kod:**
   - Nükleotid, gen, DNA ve kromozom kavramlarını açıklayarak bu kavramlar arasında ilişki kurar.
   - DNA'nın yapısını model üzerinde gösterir ve DNA'nın kendini nasıl eşlediğini açıklar.
3. **Kalıtım ve Biyoteknoloji:**
   - Kalıtım ile ilgili kavramları (genotip, fenotip, saf döl, melez döl) tanımlar ve tek karakter çaprazlamaları yapar.
   - Mutasyon, modifikasyon ve adaptasyon kavramlarını örneklerle açıklar ve farklarını ayırt eder.
   - Genetik mühendisliği ve biyoteknolojinin uygulama alanlarını ve olası etkilerini tartışır.
4. **Basınç:**
   - Katı, sıvı ve gaz basıncını etkileyen değişkenleri deneyerek keşfeder ve günlük yaşamdaki uygulamalarını (Pascal Prensibi vb.) açıklar.
5. **Madde ve Endüstri:**
   - Periyodik sistemde elementlerin sınıflandırılmasını (metal, ametal, yarı metal, soygaz) açıklar.
   - Fiziksel ve kimyasal değişim arasındaki farkları açıklar; kimyasal tepkime denklemlerini yorumlar ve kütlenin korunumunu kavrar.
6. **Asitler, Bazlar ve Isı:**
   - Asit ve bazların genel özelliklerini, pH cetvelini ve ayıraçları tanır.
   - Asit yağmurlarının çevreye etkilerini değerlendirir.
   - Maddenin ısı ile etkileşimini, öz ısı kavramını ve hâl değişim ısılarını hesaplar/yorumlar.
7. **Basit Makineler:**
   - Makaralar, kaldıraçlar, eğik düzlem, çıkrık gibi basit makinelerin kuvvet kazancı ve iş prensibini inceler.
8. **Enerji Dönüşümleri ve Çevre Bilimi:**
   - Besin zincirinde üretici, tüketici ve ayrıştırıcı ilişkilerini kurar.
   - Fotosentez ve solunum süreçlerini açıklar; madde döngüleri ve sürdürülebilir kalkınmayı analiz eder.
9. **Elektrik Yükleri ve Elektrik Enerjisi:**
   - Cisimlerin elektriklenmesini (sürtünme, dokunma, etki) ve elektroskop mantığını kavrar; elektrik enerjisinin ısı ve ışığa dönüşümünü inceler.

### D. T.C. İnkılap Tarihi ve Atatürkçülük Dersi
1. **Bir Kahraman Doğuyor:**
   - 20. yüzyıl başlarında Osmanlı Devleti'nin durumunu ve Mustafa Kemal'in çocukluk/öğrenim hayatını kişilik özellikleriyle ilişkilendirir.
   - Mustafa Kemal'in askerlik hayatı ile ilgili olayları ve fikir hayatını etkileyen unsurları analiz eder.
2. **Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar:**
   - 1. Dünya Savaşı'nın nedenlerini ve Osmanlı'nın savaştığı cepheleri değerlendirir.
   - Mondros Ateşkes Antlaşması ve Kuva-yı Milliye hareketini yorumlar; genelgeler ve kongreler sürecini açıklar.
3. **Milli Bir Destan: Ya İstiklal Ya Ölüm!:**
   - Kurtuluş Savaşı cephelerindeki (Doğu, Güney, Batı) askeri ve siyasi gelişmeleri, Mudanya ve Lozan Barış Antlaşması'nı değerlendirir.
4. **Atatürkçülük ve Çağdaşlaşan Türkiye:**
   - Atatürk ilkelerini ve siyasi, hukuki, eğitim, toplumsal ve ekonomik alanda yapılan inkılapları açıklar.
5. **Demokratikleşme Çabaları:**
   - Çok partili hayata geçiş denemelerini ve cumhuriyete yönelik tehditleri değerlendirir.
6. **Atatürk Dönemi Türk Dış Politikası:**
   - Türk dış politikasının temel ilkelerini ve Hatay sorunu, Boğazlar meselesi gibi gelişmeleri analiz eder.
7. **Atatürk'ün Ölümü ve Sonrası:**
   - Atatürk'ün eserlerini, vefatını ve 2. Dünya Savaşı sürecinde Türkiye'nin tutumunu değerlendirir.

### E. Din Kültürü ve Ahlak Bilgisi Dersi
1. **Kader İnancı:**
   - Kader ve kaza inancını ayet ve hadislerle açıklar.
   - İnsanın ilmi, iradesi, sorumluluğu ile kader arasında ilişki kurar.
   - Toplumda kader ve kaza ile ilgili yaygın olan yanlış anlayışları (kader mahkumu, rızık, ecel vb.) sorgular.
   - Hz. Musa'nın hayatını ve Ayet el-Kürsi'nin anlamını açıklar.
2. **Zekât ve Sadaka:**
   - İslam'ın paylaşma ve yardımlaşmaya verdiği önemi, zekât ve sadaka ibadetinin toplumsal faydalarını açıklar.
3. **Din ve Hayat:**
   - İslam dininin can, akıl, nesil, mal ve din emniyetini sağlama gayesini analiz eder.
4. **Hz. Muhammed’in Doğruluğu ve Güvenilirliği:**
   - Hz. Muhammed’in istişareye verdiği önemi, merhametini, adaletini ve örnek şahsiyetini kavrar.
5. **Kur’an-ı Kerim ve Özellikleri:**
   - İslam dininin ana kaynaklarını tanır ve Kur'an'ın temel eğitsel niteliklerini değerlendirir.

### F. Yabancı Dil (İngilizce) Dersi
1. **Unit 1: Friendship:**
   - Accepting and refusing, apologizing, giving explanations and reasons.
   - Personal traits, vocabulary related to true friendship.
2. **Unit 2: Teen Life:**
   - Expressing preferences, talking about daily routines and leisure habits.
   - Students will be able to ask questions related to the frequency of events.
   - Students will be able to talk about arrangements and sequences.
3. **Unit 3: In the Kitchen:**
   - Describing a process, expressing steps of cooking, kitchen utensils and ingredients.
4. **Unit 4: On the Phone:**
   - Following phone conversations, making simple phone calls, taking phone messages.
5. **Unit 5: The Internet:**
   - Accepting and refusing requests on the internet, talking about internet safety and habits.
6. **Unit 6 - Unit 10 (Adventures, Tourism, Chores, Science, Natural Forces):**
   - İlgili ünitelerin iletişimsel kazanımları ve kelime grupları.

---

## 3. YKS (TYT) Konuları ve ÖSYM / MEB Kazanım Dökümü

### A. TYT Türkçe
1. **Sözcük ve Cümle Anlamı:**
   - Sözcükte Anlam, Söz Öbeklerinde Anlam, Gerçek, Mecaz, Terim ve Yan Anlam.
   - Deyimler ve Atasözleri, İkilemeler.
   - Cümlede Anlam, Cümle Yorumu, Kesin Yargı, Cümle Tamamlama ve Oluşturma.
2. **Paragraf Bilgisi:**
   - Paragrafta Ana Düşünce ve Konu, Paragrafta Yardımcı Düşünceler.
   - Paragrafın Yapısı (Giriş, Gelişme, Sonuç, Akışı Bozan Cümle, Paragraf Bölme, Cümle Yerleştirme).
   - Anlatım Teknikleri ve Düşünceyi Geliştirme Yolları.
3. **Ses Bilgisi:**
   - Ünlü Düşmesi, Ünlü Daralması, Ünlü Türemesi.
   - Ünsüz Benzeşmesi (Sertleşme), Ünsüz Yumuşaması, Ünsüz Düşmesi, Ünsüz Türemesi, Ulama.
4. **Yazım Kuralları & Noktalama:**
   - Büyük Harflerin Yazımı, "de/da", "ki", "mi" Yazımı, Sayıların ve Kısaltmaların Yazımı.
   - Nokta, Virgül, Noktalı Virgül, İki Nokta, Üç Nokta, Kesme İşareti ve Tırnak İşareti Kullanımı.
5. **Sözcükte Yapı & Ekler:**
   - Kökler (İsim ve Fiil Kökü), Yapım Ekleri, Çekim Ekleri, Basit, Türemiş ve Birleşik Sözcükler.
6. **Sözcük Türleri:**
   - İsim (Ad), Sıfat (Ön Ad), Zamir (Adıl), Zarf (Belirteç), Edat (İlgeç), Bağlaç, Ünlem, Eylemler (Fiiller), Ek Fiil.
7. **Cümle Bilgisi & Anlatım Bozukluğu:**
   - Cümlenin Ögeleri, Fiilde Çatı, Cümle Türleri (Basit, Birleşik, Sıralı, Bağlı), Anlatım Bozuklukları.

### B. TYT Matematik
1. **Temel Kavramlar:**
   - Sayı Kümeleri (Doğal, Tam, Rasyonel, İrrasyonel, Gerçek Sayılar).
   - Tek ve Çift Sayılar, Pozitif ve Negatif Sayılar, Ardışık Sayılar, Asal Sayılar ve Faktöriyel.
2. **Basamak Kavramı & Bölünebilme:**
   - Sayı Basamakları ve Çözümleme.
   - Bölme ve Bölünebilme Kuralları (2, 3, 4, 5, 8, 9, 10, 11).
   - Asal Çarpanlara Ayırma, EBOB ve EKOK Problemleri.
3. **Rasyonel Sayılar & Basit Eşitsizlikler:**
   - Rasyonel Sayılarda Dört İşlem, Ondalık Sayılar, Devirli Ondalık Açılımlar.
   - Gerçek Sayı Aralıkları, Eşitsizlik Özellikleri ve Çözüm Kümeleri.
4. **Mutlak Değer:**
   - Mutlak Değerin Tanımı ve Geometrik Yorumu, Mutlak Değerli Denklem ve Eşitsizlikler.
5. **Üslü ve Köklü Sayılar:**
   - Üslü İfadelerin Özellikleri ve Dört İşlem, Üslü Denklemler.
   - Köklü İfadelerin Tanımı ve Özellikleri, Kök Dışına Çıkarma, Eşlenik ile Çarpma ve Köklü Denklemler.
6. **Çarpanlara Ayırma:**
   - Ortak Çarpan Parantezine Alma, Gruplandırma, Tam Kare ve İki Kare Farkı Özdeşlikleri, Küp Açılımları.
7. **Problemler:**
   - Sayı ve Kesir Problemleri, Yaş Problemleri, İşçi Problemleri.
   - Yüzde, Kâr-Zarar ve İskonto Problemleri, Karışım Problemleri.
   - Hareket (Hız) Problemleri, Tablo ve Grafik Problemleri.
8. **Kümeler, Kartezyen Çarpım & Fonksiyonlar:**
   - Kümelerde İşlemler (Kesişim, Birleşim, Fark, Tümleme), Küme Problemleri.
   - Fonksiyon Kavramı, Tanım, Değer ve Görüntü Kümesi, Fonksiyon Türleri ve Grafik Okuma.
9. **Mantık, Sayma & Olasılık:**
   - Önermeler ve Doğruluk Değerleri, Koşullu Önerme.
   - Toplama ve Çarpma Yoluyla Sayma, Permütasyon, Kombinasyon, Binom Açılımı ve Olasılık.
10. **Veri ve İstatistik:**
    - Merkezi Eğilim Ölçüleri (Aritmetik Ortalama, Tepe Değer/Mod, Ortanca/Medyan) ve Dağılım Ölçüleri (Açıklık, Standart Sapma).

### C. TYT Geometri
1. **Doğruda ve Üçgende Açılar:**
   - Paralel Doğrularda Açılar, Üçgenin İç ve Dış Açıları, Açı Bağıntıları.
2. **Özel Üçgenler & Alan:**
   - Dik Üçgen, Pisagor ve Öklid Teoremleri, İkizkenar ve Eşkenar Üçgen.
   - Üçgende Kenarortay, Açıortay, Kenar Orta Dikme, Yükseklik.
   - Üçgenin Alan Formülleri ve Benzerlik Teoremleri.
3. **Çokgenler ve Dörtgenler:**
   - Dışbükey Çokgenler, Düzgün Çokgenler.
   - Dörtgenler, Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Yamuk ve Deltoid.
4. **Çember ve Daire:**
   - Çemberde Açılar (Merkez, Çevre, Teğet-Kiriş Açı), Çemberde Uzunluk, Dairenin Çevresi ve Alanı.
5. **Katı Cisimler:**
   - Prizmalar, Piramitler, Silindir, Koni ve Küre (Yüzey Alanları ve Hacimleri).

### D. TYT Fen Bilimleri (Fizik, Kimya, Biyoloji)
1. **TYT Fizik:**
   - Fizik Bilimine Giriş ve Temel Büyüklükler.
   - Madde ve Özellikleri (Özkütle, Dayanıklılık, Adezyon, Kohezyon, Yüzey Gerilimi).
   - Hareket ve Kuvvet (Konum, Hız, İvme, Newton'ın Hareket Yasaları, Sürtünme).
   - İş, Güç, Enerji ve Mekanik Enerjinin Korunumu.
   - Isı, Sıcaklık, Termometreler, Isı İletim Yolları ve Genleşme.
   - Elektrostatik (Yükler, Elektriklenme Çeşitleri, Coulomb Kuvveti).
   - Elektrik Akımı, Direnç, Ohm Kanunu, Seri/Paralel Bağlama, Elektriksel Güç ve Enerji, Mıknatıslar.
   - Optik (Gölge, Yansıma, Düzlem ve Küresel Aynalar, Kırılma, Mercekler, Renkler).
   - Dalgalar (Yay, Su, Ses ve Deprem Dalgaları).
2. **TYT Kimya:**
   - Kimya Disiplinleri, Güvenlik Uyarı İşaretleri, Simyadan Kimyaya.
   - Atomun Yapısı, Atom Modelleri ve Periyodik Sistem.
   - Kimyasal Türler Arası Etkileşimler (Güçlü ve Zayıf Etkileşimler, Hidrojen Bağı).
   - Maddenin Halleri (Katı, Sıvı, Gaz, Plazma; Buhar Basıncı, Viskozite).
   - Doğa ve Kimya (Su ve Hayat, Çevre Kimyası).
   - Kimyanın Temel Kanunları ve Kimyasal Hesaplamalar (Mol Kavramı, Tepkime Türleri, Artanlı Tepkimeler).
   - Karışımlar ve Çözeltiler (Homojen/Heterojen, Kütlece Yüzde Derişim, Ayırma Yöntemleri).
   - Asitler, Bazlar ve Tuzlar (pH, Nötralleşme, İndikatörler, Yaygın Tuzlar).
   - Kimya Her Yerde (Temizlik Maddeleri, Polimerler, Kozmetikler, İlaçlar).
3. **TYT Biyoloji:**
   - Canlıların Ortak Özellikleri.
   - Canlıların Temel Bileşenleri (İnorganik ve Organik Bileşikler, Enzimler, Nükleik Asitler, ATP).
   - Hücre Yapısı, Hücre Zarı ve Organeller, Hücre Zarından Madde Geçişleri.
   - Canlıların Çeşitliliği ve Sınıflandırılması (Virüsler, Bakteriler, Arkeler, Protistalar, Mantarlar, Bitkiler, Hayvanlar).
   - Hücre Bölünmeleri (Mitoz, Mayoz, Eşeysiz ve Eşeyli Üreme).
   - Kalıtımın Genel Esasları (Mendel Genetiği, Eş Baskınlık, Kan Grupları, Cinsiyete Bağlı Kalıtım).
   - Ekosistem Ekolojisi, Besin Zinciri ve Ağları, Madde Döngüleri, Biyolojik Çeşitlilik ve Çevre Sorunları.

### E. TYT Sosyal Bilimler (Tarih, Coğrafya, Felsefe, Din)
1. **TYT Tarih:**
   - Tarih Bilimine Giriş, İlk Çağ Medeniyetleri.
   - İlk ve Orta Çağlarda Türk Dünyası, İslam Medeniyetinin Doğuşu ve Yayılışı.
   - Türklerin İslamiyet'i Kabulü ve İlk Türk İslam Devletleri.
   - Orta Çağ'da Dünya, Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiye'si.
   - Beylikten Devlete Osmanlı, Dünya Gücü Osmanlı, Değişen Dünya Dengeleri.
   - 20. Yüzyıl Başlarında Osmanlı, Milli Mücadele Hazırlık ve Cepheler Dönemi.
   - Atatürkçülük, Türk İnkılabı ve Atatürk İlkeleri.
2. **TYT Coğrafya:**
   - Doğa ve İnsan, Coğrafi Koordinat Sistemi, Harita Bilgisi ve Projeksiyonlar.
   - Dünyanın Şekli ve Hareketleri.
   - İklim Bilgisi (Atmosfer, Sıcaklık, Basınç, Rüzgarlar, Nem, Yağış, Büyük İklim Tipleri).
   - Yerin Şekillenmesi: İç Kuvvetler (Tektonizma, Volkanizma, Deprem, Orojenez) ve Dış Kuvvetler (Akarsular, Rüzgarlar, Buzullar, Dalgalar).
   - Nüfus ve Yerleşme, Türkiye'de Nüfus ve Yerleşme.
   - Ekonomik Faaliyet Türleri, Bölge Kavramı ve Türleri.
   - Doğal Afetler ve Çevre Sorunları.
3. **TYT Felsefe:**
   - Felsefenin Anlamı ve Alanı.
   - Bilgi Felsefesi (Epistemoloji).
   - Varlık Felsefesi (Ontoloji).
   - Ahlak Felsefesi (Etik).
   - Sanat Felsefesi (Estetik).
   - Din Felsefesi, Siyaset Felsefesi, Bilim Felsefesi.
4. **TYT Din Kültürü:**
   - İslam ve İnanç Esasları.
   - İslam ve İbadetler.
   - Ahlak ve Değerler.
   - Din, Kültür ve Medeniyet.
   - Hz. Muhammed'in Örnekliği.
   - Yaşayan Dinler ve Vahiy Geleneği.

---

## 4. YKS (AYT) Konuları ve ÖSYM / MEB Kazanım Dökümü

### A. AYT Matematik
1. **Polinomlar & İkinci Dereceden Denklemler:**
   - Polinom Kavramı, Polinomlarda Dört İşlem, Kalan Bulma Teoremi.
   - İkinci Dereceden Bir Bilinmeyenli Denklemler, Kök-Katsayı Bağıntıları, Karmaşık Sayılar.
2. **Parabol & Eşitsizlikler:**
   - İkinci Dereceden Fonksiyonlar (Parabol), Tepe Noktası, Simetri Ekseni, Grafik Çizimi.
   - İkinci Dereceden Eşitsizlikler ve Eşitsizlik Sistemleri, İşaret Tablosu.
3. **Trigonometri:**
   - Yönlü Açılar, Birim Çember, Trigonometrik Fonksiyonlar ve Özdeşlikler.
   - Sinüs ve Kosinüs Teoremleri.
   - Toplam-Fark ve Yarım Açı (İki Kat Açı) Formülleri.
   - Trigonometrik Denklemler ve Ters Trigonometrik Fonksiyonlar.
4. **Logaritma:**
   - Üstel Fonksiyon ve Logaritma Fonksiyonu, Logaritmanın Özellikleri, Taban Değiştirme.
   - Logaritmik Denklem ve Eşitsizlikler.
5. **Diziler:**
   - Dizi Kavramı, Genel Terim, Aritmetik Dizi ve Geometrik Dizi, Fibonacci Dizisi.
6. **Limit ve Süreklilik:**
   - Bir Noktada Limit, Sağdan ve Soldan Limit, Belirsizlik Durumları (0/0), Fonksiyonun Sürekliliği.
7. **Türev ve Uygulamaları:**
   - Türev Tanımı ve Anlık Değişim Oranı, Türev Alma Kuralları, Bileşke Fonksiyonun Türevi (Zincir Kuralı).
   - Teğet ve Normal Denklemleri, Artan ve Azalan Fonksiyonlar.
   - Yerel Ekstremum Noktaları, Maksimum-Minimum Problemleri.
8. **İntegral ve Uygulamaları:**
   - Belirsiz İntegral ve İntegral Alma Kuralları, Değişken Değiştirme Yöntemi.
   - Belirli İntegral, Riemann Toplamı, Eğri Altında Kalan Alan Hesabı.

### B. AYT Fen Bilimleri (Fizik, Kimya, Biyoloji)
1. **AYT Fizik:**
   - Vektörler, İki Boyutta Vektör İşlemleri.
   - Bağıl Hareket ve Nehir Problemleri.
   - Newton'ın Hareket Yasaları (Sürtünmeli ve Eğik Düzlemde Hareket, Bağlı Cisimler).
   - Bir ve İki Boyutta Sabit İvmeli Hareket (Serbest Düşme, Düşey Atış, Yatay ve Eğik Atış).
   - İtme ve Çizgisel Momentum, Momentumun Korunumu ve Çarpışmalar.
   - Tork, Denge Şartları, Kütle ve Ağırlık Merkezi.
   - Basit Makineler (Kaldıraç, Makara, Palanga, Eğik Düzlem, Vida, Çıkrık, Dişli Çarklar).
   - Elektriksel Kuvvet (Coulomb), Elektriksel Alan, Potansiyel Enerji ve Potansiyel Fark.
   - Düzgün Elektrik Alan, Yüklü Paralel Levhalar ve Sığa (Kapasitörler).
   - Manyetik Alan, Manyetik Kuvvet, Manyetik Akı ve Faraday/Lenz İndüksiyon Kanunları, Özindüksiyon.
   - Alternatif Akım (R-L-C Devreleri, Rezonans), Transformatörler.
   - Düzgün Çembersel Hareket (Çizgisel/Açısal Hız, Merkezcil İvme/Kuvvet, Dönerek Öteleme, Eylemsizlik Momenti, Açısal Momentum).
   - Kütle Çekim Kuvveti ve Kepler Yasaları.
   - Basit Harmonik Hareket (Yaylı ve Basit Sarkaç, Konum, Hız, İvme Bağıntıları).
   - Dalga Mekaniği (Su Dalgalarında Kırınım ve Girişim, Işıkta Kırınım ve Çift Yarıkta Girişim/Young Deneyi, Doppler Olayı, Elektromanyetik Dalgalar).
   - Atom Fiziğine Giriş (Atom Modelleri, Fotoelektrik Olay, Compton Saçılması, De Broglie Dalga Boyu, Kararsız Çekirdekler ve Radyoaktivite).
   - Modern Fizik (Özel Görelilik, Kuantum Fiziği) ve Modern Fiziğin Teknolojideki Uygulamaları (Görüntüleme Cihazları, Yarı İletkenler, Süper İletkenler, Nanoteknoloji, Lazer).
2. **AYT Kimya:**
   - Modern Atom Teorisi (Kuantum Sayıları, Elektron Dizilimleri, Yükseltgenme Basamakları).
   - Gazlar (Gaz Yasaları, İdeal Gaz Denklemi, Kinetik Teori, Gerçek Gazlar, Gaz Karışımları).
   - Sıvı Çözeltiler ve Koligatif Özellikler (Molarite, Molalite, Buhar Basıncı Düşmesi, Kaynama Noktası Yükselmesi, Donma Noktası Alçalması, Ozmotik Basınç).
   - Kimyasal Tepkimelerde Enerji (Entalpi Değişimi, Standart Oluşum Entalpisi, Bağ Enerjileri, Hess Yasası).
   - Kimyasal Tepkimelerde Hız (Tepkime Hızını Etkileyen Faktörler, Hız İfadesi, Mekanizmalı Tepkimeler).
   - Kimyasal Denge (Dengeyi Etkileyen Faktörler, Le Chatelier İlkesi, Denge Sabitleri Kc ve Kp).
   - Sulu Çözelti Dengeleri (Asit-Baz Dengeleri, Suyun Otoiyonizasyonu, pH/pOH, Tampon Çözeltiler, Tuzların Hidrolizi, Titrasyon).
   - Çözünürlük Dengesi (Çözünürlük Çarpımı KÇÇ, Ortak İyon Etkisi, Çökelti Oluşumu).
   - Kimya ve Elektrik (İndirgenme-Yükseltgenme Tepkimeleri, Standart Elektrot Potansiyelleri, Galvanik Piller, Nernst Denklemi, Elektroliz ve Faraday Kanunları, Korozyon).
   - Karbon Kimyasına Giriş (Doğada Karbon, Lewis Formülleri, Hibritleşme ve Molekül Geometrisi/VSEPR).
   - Organik Bileşikler:
     - Alkanlar, Alkenler, Alkinler, Aromatik Bileşikler (Benzen).
     - Alkoller ve Eterler.
     - Karbonil Bileşikleri (Aldehitler ve Ketonlar).
     - Karboksilik Asitler ve Esterler.
3. **AYT Biyoloji:**
   - İnsan Fizyolojisi:
     - Sinir Sistemi (Nöron, İmpuls İletimi, Merkezi ve Çevresel Sinir Sistemi).
     - Endokrin Sistem (Hormonlar, Hipofiz, Tiroid, Pankreas, Böbrek Üstü Bezleri).
     - Duyu Organları (Göz, Kulak, Burun, Dil, Deri ve Görme/İşitme Mekanizması).
     - Destek ve Hareket Sistemi (Kemik, Kıkırdak, Eklem, Çizgili/Düz/Kalp Kası Kasılma Mekanizması).
     - Sindirim Sistemi (Sindirim Kanalı, Enzimler, Emilim, Karaciğer ve Pankreasın Görevleri).
     - Dolaşım ve Bağışıklık Sistemi (Kalp, Damarlar, Kan Dokusu, Lenf Dolaşımı, Özgül ve Özgül Olmayan Bağışıklık).
     - Solunum Sistemi (Solunum Organları, Gazların Kanda Taşınması/Hemoglobin).
     - Üriner (Boşaltım) Sistemi (Böbrek Yapısı, Nefron, İdrar Oluşumu ve Homeostazi).
     - Üreme Sistemi ve Embriyonik Gelişim (Erkek ve Dişi Üreme Organları, Gametogenez, Menstrüal Döngü).
   - Komünite ve Popülasyon Ekolojisi (Simbiotik İlişkiler, Süksesyon, Popülasyon Dinamiği).
   - Genden Proteine:
     - DNA'nın Yapısı ve Replikasyonu, RNA Çeşitleri.
     - Genetik Kod ve Protein Sentezi (Transkripsiyon ve Translasyon).
     - Biyoteknoloji ve Gen Mühendisliği (Klonlama, Rekombinant DNA).
   - Canlılarda Enerji Dönüşümleri:
     - Hücresel Solunum (Glikoliz, Krebs Döngüsü, ETS, Fermantasyon).
     - Fotosentez (Işığa Bağımlı ve Bağımsız Reaksiyonlar) ve Kemosentez.
   - Bitki Biyolojisi:
     - Bitkisel Dokular (Meristem, Temel, İletim, Örtü Doku).
     - Bitkisel Organlar (Kök, Gövde, Yaprak).
     - Bitkilerde Madde Taşınması (Ksilem ve Floem, Terleme, Kohezyon-Gerilim).
     - Bitkilerde Büyüme ve Hareket (Tropizma, Nasti, Bitkisel Hormonlar).
     - Çiçekli Bitkilerde Üreme, Tozlaşma, Döllenme ve Tohum/Meyve Oluşumu.
   - Canlılar ve Çevre (Adaptasyon, Doğal Seçilim, Çevre Şartları ve Genetik Değişimler).

### C. AYT Türk Dili ve Edebiyatı
1. **Şiir Bilgisi & Edebi Sanatlar:**
   - Nazım Birimi, Nazım Şekli, Nazım Türü, Ölçü (Hece, Aruz, Serbest), Uyak ve Redif.
   - Teşbih, İstiare, Mecazımürsel, Teşhis, İntak, Tezat, Tenasüp, Hüsnütalil, Tecahülüarif, Kinaye, Tevriye, Tariz.
2. **Dönemlere Göre Türk Edebiyatı:**
   - İslamiyet Öncesi Türk Edebiyatı (Koşuk, Sagu, Sav, Destanlar) ve Geçiş Dönemi Eserleri (Kutadgu Bilig, Divanü Lugati't-Türk vb.).
   - Halk Edebiyatı (Anonim, Âşık ve Tekke/Tasavvuf Edebiyatı nazım şekilleri ve temsilcileri).
   - Divan Edebiyatı (Gazel, Kasaide, Mesnevi, Şarkı, Tuyuğ vb., Divan şairleri ve nesir türleri).
   - Tanzimat Edebiyatı (1. ve 2. Dönem şair/yazarları, roman ve tiyatro gelişimi).
   - Servet-i Fünun Edebiyatı, Fecr-i Âti Topluluğu.
   - Millî Edebiyat Dönemi (Genç Kalemler, Yeni Lisan, millî kaynaklara yöneliş ve temsilcileri).
   - Cumhuriyet Dönemi Türk Edebiyatı (Saf Şiir, Toplumcu Gerçekçiler, Millî Edebiyat Zevk ve Anlayışını Sürdürenler, Garip Akımı, İkinci Yeni, 1980 Sonrası Şiir; Cumhuriyet roman ve hikâyesi, tiyatro).
3. **Edebi Akımlar:**
   - Klasisizm, Romantizm, Realizm, Natüralizm, Parnasizm, Sembolizm, Sürrealizm, Varoluşçuluk.

---

## 5. Doğrulama ve Kabul Kriterleri

1. Müfredat havuzundaki tüm **LGS (8. sınıf)** ve **YKS (TYT & AYT)** konularına yukarıdaki resmi MEB/ÖSYM kazanımları ve sınav kalıpları eksiksiz atanmalıdır.
2. Kullanıcının yerel depolamasında kayıtlı önceki veriler korunmalı; var olan konulara bu yeni kazanım listesi güvenle eklenmelidir.
3. Sonraki aşamada yapılacak deneme eşleştirme motoru hem LGS hem TYT-AYT denemelerinden gelen kazanım metinlerini doğrudan tanıyabilir hale gelmelidir.
