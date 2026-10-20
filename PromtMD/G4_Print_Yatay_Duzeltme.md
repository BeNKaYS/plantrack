# Plantrack — G4: Print Yatay/Dikey Düzeltmesi & Ölçek Optimizasyonu

---

## Bağlam

Çizelge Robotu'nda yatay olması gereken şablonlar (Konu & Soru Çizelgesi,
Zaman Bloklama, Alışkanlık Zinciri) önizlemede ve baskıda dikey çıkıyor.
Ayrıca %100 zoom'da tablo taşıyor, kullanıcı %90'a düşürmek zorunda kalıyor.

Bu güncellemeyle:
1. Her şablonun yatay/dikey bilgisi `PrintEngine`'e doğru iletilecek
2. `@page` CSS kuralı dinamik ve güvenilir şekilde uygulanacak
3. Yatay şablonlar A4 genişliğine tam sığacak şekilde otomatik ölçeklenecek
4. Önizleme ekranda da doğru oran gösterilecek

---

## Sorunun Kökü

Şu anki `PrintEngine.yazdir(html, { yatay })` fonksiyonu büyük ihtimalle
`<style id="print-page-style">` tag'ine `@page` kuralını yazıyor ama
tarayıcı bu kuralı her zaman doğru okumayabiliyor. Özellikle:

- `@page { size: A4 landscape }` kuralı bazı tarayıcılarda (Safari, Chrome)
  geç parse edildiğinde dikey basıyor
- Şablon HTML'i 297mm genişliği varsayarak yazılmış ama tarayıcı
  210mm'lik dikey kağıda sıkıştırıyor → taşma

---

## `PrintEngine` Tam Yeniden Yazımı

`store.js` içindeki `PrintEngine` nesnesini aşağıdaki şekilde güncelle:

```javascript
const PrintEngine = {

  yazdir(icerik, ayarlar = {}) {
    const yatay = ayarlar.yatay === true;
    const olcek = ayarlar.olcek || (yatay ? 0.95 : 1.0);

    // 1. Print area'ya içeriği yaz
    const printArea = document.getElementById('print-area');
    if (!printArea) return;
    printArea.innerHTML = icerik;

    // 2. @page kuralını dinamik style tag'ine yaz
    const pageStyle = document.getElementById('print-page-style');
    if (pageStyle) {
      pageStyle.textContent = `
        @page {
          size: ${yatay ? 'A4 landscape' : 'A4 portrait'};
          margin: ${yatay ? '6mm 8mm' : '8mm 10mm'};
        }
        @media print {
          body > *:not(#print-area) { display: none !important; }
          #print-area {
            display: block !important;
            position: fixed;
            inset: 0;
            background: white;
            z-index: 9999;
            transform-origin: top left;
          }
        }
      `;
    }

    // 3. data-print-mode attribute'u body'ye ekle
    document.body.setAttribute('data-print-mode', yatay ? 'landscape' : 'portrait');

    // 4. Kısa gecikme — tarayıcının @page kuralını parse etmesi için
    setTimeout(() => {
      window.print();
    }, 120);

    // 5. afterprint — her şeyi temizle
    const temizle = () => {
      printArea.innerHTML = '';
      if (pageStyle) pageStyle.textContent = '';
      document.body.removeAttribute('data-print-mode');
      window.removeEventListener('afterprint', temizle);
    };
    window.addEventListener('afterprint', temizle);
  }
};
```

**Kritik fark:** `setTimeout(() => window.print(), 120)` — tarayıcıya
`@page` kuralını DOM'a yazıp parse etmesi için 120ms süre tanınıyor.
Bu olmadan Chrome ve Safari yatay kuralı görmeden baskıya geçiyor.

---

## Şablon HTML'lerinde Ölçek Düzeltmesi

Yatay A4 boyutu: **297mm × 210mm**, margin'ler düşünce içerik alanı
yaklaşık **281mm × 198mm**.

Mevcut şablonlarda muhtemelen `width: 297mm` veya sabit piksel genişlikleri
var. Bunları şöyle düzelt:

### Her yatay şablon HTML wrapper'ı:

```html
<div class="print-page-yatay">
  <!-- şablon içeriği -->
</div>
```

### style.css'e eklenecek print kuralları:

```css
/* Ekran önizleme — yatay A4 oranı */
.print-page-yatay {
  width: 297mm;
  min-height: 210mm;
  max-height: 210mm;
  background: white;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
  padding: 6mm 8mm;
}

/* Ekran önizleme — dikey A4 oranı */
.print-page-dikey {
  width: 210mm;
  min-height: 297mm;
  max-height: 297mm;
  background: white;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
  padding: 8mm 10mm;
}

/* Print modunda ölçekleme */
@media print {
  .print-page-yatay,
  .print-page-dikey {
    margin: 0;
    padding: 0;
    width: 100%;
    max-height: none;
    box-shadow: none;
  }
}
```

### Önizleme container'ı (`cizelge-preview-area`) için:

```css
#cizelge-preview-area {
  overflow-x: auto;   /* yatay scroll — ekranda taşmayı önler */
  overflow-y: auto;
  padding: 16px;
  background: var(--color-paper-3);
}
```

Bu sayede ekranda yatay scroll çıkar, kullanıcı tüm tabloyu görebilir.

---

## Şablon Sınıf Atamaları

Tüm render fonksiyonları gözden geçirilecek, wrapper div'lere doğru sınıf atanacak:

| Şablon | Fonksiyon | Wrapper Sınıfı |
|---|---|---|
| Ödev Takip Çizelgesi | `renderCizelgeOdevTakipHTML` | `print-page-dikey` |
| Konu Takip Tablosu | `renderCizelgeKonuTakipHTML` | `print-page-yatay` |
| Konu & Soru Çizelgesi | `renderCizelgeKonuSoruHTML` | `print-page-yatay` |
| Zaman Bloklama | `renderCizelgeZamanBlokHTML` | `print-page-yatay` |
| Alışkanlık Zinciri | `renderCizelgeAliskanlikHTML` | `print-page-yatay` |

---

## Otomatik Ölçek — Taşma Sorunu

%100'de taşma sebebi: tablo hücreleri fazla geniş, A4'e sığmıyor.

Her yatay şablon HTML'inin açılış div'ine şu inline stil eklenir:

```html
<div class="print-page-yatay" style="font-size: 0.72rem; line-height: 1.3;">
```

Bu font küçültmesi tablonun A4'e tam sığmasını sağlar.
%90 zoom ile sığıyorsa demek ki 0.72rem ≈ 0.9 × varsayılan font büyüklüğü doğru değer.

Ek olarak tablo için:
```html
<table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: inherit;">
```

`table-layout: fixed` ile sütun genişlikleri eşit dağılır, taşma olmaz.

---

## Şablon Seçici Kartlarında Yön Göstergesi

`div[2]` — şablon kartları alanına her kartın altına yön badge'i ekle:

```
[Ödev Takip Çizelgesi]        [Konu Takip Tablosu]
 A4 Dikey                      A4 Yatay ↔

[Konu & Soru Çizelgesi]       [Zaman Bloklama]
 A4 Yatay ↔                    A4 Yatay ↔

[Alışkanlık Zinciri]
 A4 Yatay ↔
```

Badge HTML: `<span class="meta-pill">A4 Dikey</span>` veya
`<span class="meta-pill text-[var(--color-accent)]">A4 Yatay ↔</span>`

---

## `App.printCizelge()` Güncellemesi

Her case için `yatay` parametresi doğru iletildiğinden emin ol:

```javascript
App.printCizelge() {
  // ...
  switch (this.cizelgeAktifSablon) {
    case 'odev-takip':
      html = this.renderCizelgeOdevTakipHTML(ogr);
      yatay = false;   // DİKEY
      break;
    case 'konu-takip':
      html = this.renderCizelgeKonuTakipHTML(ogr);
      yatay = true;    // YATAY
      break;
    case 'konu-soru':
      html = this.renderCizelgeKonuSoruHTML(ogr);
      yatay = true;    // YATAY
      break;
    case 'zaman-blok':
      html = this.renderCizelgeZamanBlokHTML(ogr);
      yatay = true;    // YATAY
      break;
    case 'aliskanlik':
      html = this.renderCizelgeAliskanlikHTML(ogr);
      yatay = true;    // YATAY
      break;
  }
  PrintEngine.yazdir(html, { yatay });
}
```

---

## Kurallar

1. `setTimeout(() => window.print(), 120)` — kaldırılmaz, tarayıcı uyumluluğu için şart
2. `afterprint` event listener her baskıdan sonra temizlenir — memory leak önlenir
3. `print-page-yatay` ve `print-page-dikey` CSS sınıfları `style.css`'e eklenir
4. Tüm render HTML fonksiyonlarındaki wrapper div sınıfları tablodaki gibi güncellenir
5. Şablon kartlarına A4 yön badge'leri eklenir
6. `font-size: 0.72rem` — tüm yatay şablonlarda uygulanır, dikey şablonlara dokunulmaz
7. `#cizelge-preview-area`'ya `overflow-x: auto` eklenir — ekranda yatay scroll olur
