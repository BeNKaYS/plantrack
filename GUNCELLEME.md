# Plantrack — Sürüm ve Güncelleme Rehberi

> Bir kez derle (pkg/dmg), sonrasında güncellemeleri **yerel klasör** veya **GitHub**
> üzerinden dağıt. Her güncelleme `version.json` ile bildirilir.

---

## 1. Sürüm numarası politikası

`version.json` tek doğruluk kaynağıdır:

```json
{
  "surum": "9.0",
  "tarih": "2026-10-25",
  "not": "Kısa, kullanıcıya görünen açıklama"
}
```

Format: `buyuk.kucuk` (örn. `8.61`, `9.0`, `9.1`).

| Değişikliğin türü | Ne yapılır | Örnek |
|---|---|---|
| Veri yapısı, MCP sözleşmesi, güvenlik, bozulma riski | **Büyük sürüm** — ilk sayıyı artır, küçüğü sıfırla | `8.61 → 9.0` |
| Yeni özellik / ekran / araç, geriye uyumlu | **Küçük sürüm** — ikinci sayıyı artır | `9.0 → 9.1` |
| Hata düzeltme, metin, stil | **Yama** — ikinci sayıyı artır, gerekirse üçüncü | `9.1 → 9.2` |

Uygulama farkı kendisi hesaplar:

- `farkTuru: "buyuk"` → güncelleme öncesi **onay penceresi** çıkar
- `farkTuru: "kucuk"` → doğrudan uygulanır
- Açılışta 6 saatte bir kontrol; yeni sürüm varsa bildirim gösterilir

**Sürümü artırmadan yapılan bir değişiklik, kullanıcıya "güncelleme var" demez.**
Bu yüzden her yayında `version.json` güncellenmelidir.

`index.html` içindeki `?v=` önbellek parametreleri de aynı sürüme çekilir
(aksi hâlde tarayıcı eski `app.js`'i kullanabilir).

---

## 2. İlk kurulum (bir kez)

```bash
./derle_mac.sh
```

Üretir:

- `dist/Plantrack.app`, `Plantrack.pkg`, `Plantrack.dmg`
- `~/PlantrackMCP/web` ve `~/PlantrackMCP/mcp` kopyaları
- `/Applications/Plantrack.app` (root sahipli ise atlanır)

Paketlenmiş uygulama arayüzü **her zaman** `~/PlantrackMCP/web` üzerinden yükler.
Bu yüzden sonraki güncellemeler için yeniden derleme gerekmez.

---

## 3. Güncelleme yolları

### A) Yerel klasörden (kendin için)

1. Projede değişikliği yap, `version.json` sürümünü artır.
2. Uygulamada **Ayarlar → Programı Güncelle → Yerel Klasör**.
3. Kaynak klasör: proje kökü (örn. `/Users/.../Plantrack`).
4. **Değişiklikleri Kontrol Et** → sürüm farkı ve dosya listesi görünür.
5. **Programı Güncelle** → yedek alınır, dosyalar kopyalanır, doğrulanır.

Sunucu kodu (`mcp/*.js`) değiştiyse uygulamayı kapatıp açmak gerekir.

### B) GitHub'dan (başkaları için)

1. Değişikliği `main` dalına gönder, `version.json` artırılmış olsun.
2. Uygulamada **Ayarlar → Programı Güncelle → GitHub**.
3. Depo: `kullanici/plantrack` · Dal: `main` · Token: yalnızca private depo için.
4. Kontrol Et → Güncelle.

Sunucu GitHub zip'ini indirir (`codeload.github.com`), açar, doğrular ve uygular.
Public depo için token gerekmez.

---

## 4. Güncelleme güvenlik zinciri

```
kontrol (dryRun)
  → sürüm karşılaştırma (mevcut vs kaynak)
  → GERİ GİDİŞ KORUMASI: kaynak sürüm daha eskiyse durdur (409)
  → değişecek dosya listesi
  → [onay: büyük sürümse]
  → yedek (web + mcp, jYedek/<etiket>_<zaman>/)
  → kopyala (yalnızca değişenler)
  → doğrula (kaynak ile bayt bayt karşılaştırma)
  → başarısızsa: yedeği geri yaz, hata döndür
  → başarılıysa: sürüm bilgisini güncelle, arayüzü yenile
```

### Geri gidiş koruması

Kaynaktaki `version.json` kurulu sürümden **küçükse** güncelleme yapılmaz:

- Kontrol ekranı: "Kaynaktaki sürüm v8.61, kurulu sürümden (v9.1) daha eski" uyarısı
- Uygulama isteği: `HTTP 409` + `gerileme: true`, hiçbir dosya yazılmaz

Bu koruma, bayat CDN/ayna veya yanlış klasör seçimi yüzünden eski kodun
kurulmasını engeller. Bilinçli geri dönüş gerekirse istek gövdesine
`"allowDowngrade": true` eklenmelidir (arayüzde düğmesi yok, elle yapılır).

Veri tabanı (`~/PlantrackMCP/data/plantrack_db.json`) güncelleme kapsamına
**girmez**; kullanıcı verisi korunur.

---

## 5. Yayın öncesi kontrol listesi

- [ ] `version.json` artırıldı (büyük/küçük kuralına göre)
- [ ] `index.html` `?v=` parametreleri aynı sürümde
- [ ] `node -c` ile değişen JS dosyaları kontrol edildi
- [ ] Yerel klasörden güncelleme denendi (kontrol → uygula)
- [ ] GitHub'a gönderildi (başkalarına dağıtılacaksa)
- [ ] `GET http://127.0.0.1:38888/api/health` → `status: ok`

---

## 6. Geri alma

Otomatik yedekler: `~/PlantrackMCP/jYedek/`

- `web_<zaman>/` — arayüz dosyaları
- `mcp_<zaman>/` — sunucu dosyaları
- `auto_<zaman>.json` — veri tabanı (en fazla 20 adet)

Geri almak için ilgili klasörün içeriğini hedefe kopyala ve uygulamayı yenile.
Veri tabanı için `auto_*.json` dosyasını `~/PlantrackMCP/data/plantrack_db.json`
üzerine yaz.
