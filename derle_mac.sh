#!/usr/bin/env bash
# ==============================================================================
# derle_mac.sh — Plantrack macOS Bağımsız Uygulama (.app), .PKG ve .DMG Paketleyici
# ==============================================================================
set -e

# Renkli çıktı tanımları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   Plantrack macOS Derleme (.app, .pkg & .dmg) Motoru  ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Ortam ve Araç Denetimi
echo -e "\n${YELLOW}[1/7] Ortam ve Araçlar Denetleniyor...${NC}"

if ! command -v node >/dev/null 2>&1; then
  echo -e "${RED}[HATA] Node.js bulunamadı! Lütfen Node.js kurun.${NC}"
  exit 1
fi
echo -e "  ✔ Node.js: $(node -v)"

PAKE_BIN="$(command -v pake || echo "/opt/homebrew/bin/pake")"
if [ ! -x "$PAKE_BIN" ]; then
  echo -e "${RED}[HATA] Pake aracı bulunamadı! 'npm i -g pake-cli' veya 'brew install pake' gereklidir.${NC}"
  exit 1
fi
echo -e "  ✔ Pake: $PAKE_BIN"

if ! command -v productbuild >/dev/null 2>&1; then
  echo -e "${RED}[HATA] macOS productbuild aracı bulunamadı!${NC}"
  exit 1
fi
echo -e "  ✔ productbuild (.pkg motoru): Mevcut"

if ! command -v hdiutil >/dev/null 2>&1; then
  echo -e "${RED}[HATA] macOS hdiutil aracı bulunamadı!${NC}"
  exit 1
fi
echo -e "  ✔ hdiutil (.dmg motoru): Mevcut"

# 2. Pre-Build Kod ve Sözdizimi Denetimi
echo -e "\n${YELLOW}[2/7] Kod ve Sözdizimi (Syntax Audit) Denetleniyor...${NC}"

FILES_TO_CHECK=("app.js" "js/store.js" "js/data.js" "mcp/server.js" "mcp/db.js" "mcp/tools.js" "mcp/resources.js")
for f in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$f" ]; then
    node -c "$f"
    echo -e "  ✔ $f sözdizimi geçerli."
  else
    echo -e "${RED}[HATA] $f bulunamadı!${NC}"
    exit 1
  fi
done

# Vendor Çevrimdışı Kütüphane Kontrolü
if [ ! -f "assets/vendor/tailwindcss.js" ] || [ ! -f "assets/vendor/lucide.min.js" ] || [ ! -f "assets/vendor/xlsx.full.min.js" ]; then
  echo -e "${YELLOW}  ⚠ Yerel vendor dosyaları eksik, indiriliyor...${NC}"
  mkdir -p assets/vendor
  curl -sSL -o assets/vendor/tailwindcss.js "https://cdn.tailwindcss.com" || true
  curl -sSL -o assets/vendor/lucide.min.js "https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" || true
  curl -sSL -o assets/vendor/xlsx.full.min.js "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js" || true
fi
echo -e "  ✔ Çevrimdışı (Offline) vendor kütüphaneleri hazır."

# İkon Kontrolü / Üretimi
if [ ! -f "assets/icon.icns" ] && [ -f "assets/icon.png" ]; then
  echo -e "${YELLOW}  ⚠ assets/icon.icns üretiliyor...${NC}"
  ICONSET_TMP="/tmp/plantrack_iconset_$$"
  mkdir -p "$ICONSET_TMP"
  sips -z 16 16 assets/icon.png --out "$ICONSET_TMP/icon_16x16.png" >/dev/null 2>&1 || true
  sips -z 32 32 assets/icon.png --out "$ICONSET_TMP/icon_16x16@2x.png" >/dev/null 2>&1 || true
  sips -z 32 32 assets/icon.png --out "$ICONSET_TMP/icon_32x32.png" >/dev/null 2>&1 || true
  sips -z 64 64 assets/icon.png --out "$ICONSET_TMP/icon_32x32@2x.png" >/dev/null 2>&1 || true
  sips -z 128 128 assets/icon.png --out "$ICONSET_TMP/icon_128x128.png" >/dev/null 2>&1 || true
  sips -z 256 256 assets/icon.png --out "$ICONSET_TMP/icon_128x128@2x.png" >/dev/null 2>&1 || true
  sips -z 256 256 assets/icon.png --out "$ICONSET_TMP/icon_256x256.png" >/dev/null 2>&1 || true
  sips -z 512 512 assets/icon.png --out "$ICONSET_TMP/icon_256x256@2x.png" >/dev/null 2>&1 || true
  sips -z 512 512 assets/icon.png --out "$ICONSET_TMP/icon_512x512.png" >/dev/null 2>&1 || true
  sips -z 1024 1024 assets/icon.png --out "$ICONSET_TMP/icon_512x512@2x.png" >/dev/null 2>&1 || true
  iconutil -c icns "$ICONSET_TMP" -o assets/icon.icns >/dev/null 2>&1 || true
  rm -rf "$ICONSET_TMP"
fi
echo -e "  ✔ Uygulama ikonu hazır."

# 3. Web Arayüzü Sahnesi (sunucunun sunacağı + pakete gömülecek arayüz)
echo -e "\n${YELLOW}[3/7] Güncellenebilir Web Arayüzü Sahneleniyor...${NC}"
STAGE_DIR="/tmp/plantrack_stage_$$"
WEB_DIR="$STAGE_DIR/web"
mkdir -p "$WEB_DIR/js" "$WEB_DIR/assets/vendor"
trap 'rm -rf "$STAGE_DIR"' EXIT

cp index.html tokens.css style.css app.js version.json "$WEB_DIR/"
cp js/data.js js/store.js "$WEB_DIR/js/"
cp assets/logo.svg "$WEB_DIR/assets/"
cp assets/vendor/*.js "$WEB_DIR/assets/vendor/"
echo -e "  ✔ Web arayüzü sahnelendi: $WEB_DIR"

# 4. Pake ile macOS .app Derlemesi — arayüz artık yerel sunucudan (127.0.0.1:38888) yüklenir
echo -e "\n${YELLOW}[4/7] Pake ile Yerel Masaüstü Paketi (.app) Derleniyor...${NC}"
rm -rf "Plantrack.app" dist/Plantrack.app
mkdir -p dist

# Pake, sayfa başlığı/ikon metadata'sı için URL'yi çekmeye çalışabilir;
# port boşsa kısa süreli geçici bir statik sunucu açıp sonra kapatıyoruz.
TEMP_SRV_PID=""
if ! lsof -ti:38888 >/dev/null 2>&1; then
  ( cd "$WEB_DIR" && python3 -m http.server 38888 >/dev/null 2>&1 ) &
  TEMP_SRV_PID=$!
  sleep 1
fi

"$PAKE_BIN" "http://127.0.0.1:38888/" \
  --name "Plantrack" \
  --identifier "com.plantrack.app" \
  --app-version "1.0.0" \
  --width 1440 \
  --height 900 \
  --min-width 1024 \
  --min-height 700 \
  --icon "assets/icon.icns" \
  --targets app

if [ -n "$TEMP_SRV_PID" ]; then kill "$TEMP_SRV_PID" 2>/dev/null || true; fi

if [ ! -d "Plantrack.app" ]; then
  echo -e "${RED}[HATA] Plantrack.app üretilemedi!${NC}"
  exit 1
fi

# 5. MCP Köprüsü, Otomatik Başlatıcı ve Kod İmzası Entegrasyonu
echo -e "\n${YELLOW}[5/7] MCP Canlı Köprüsü ve Otomatik Başlatıcı Pakete Entegre Ediliyor...${NC}"

# A. Yüksek çözünürlüklü Retina ikonları
cp assets/icon.icns Plantrack.app/Contents/Resources/plantrack.icns 2>/dev/null || true
cp assets/icon.icns Plantrack.app/Contents/Resources/Plantrack.icns 2>/dev/null || true

# B. MCP Sunucu dosyalarını ve çekirdek şablonunu pakete göm
mkdir -p Plantrack.app/Contents/Resources/mcp
cp mcp/server.js mcp/db.js mcp/tools.js mcp/resources.js mcp/test-client.js Plantrack.app/Contents/Resources/mcp/
if [ -f "data/plantrack_db.json" ]; then
  cp data/plantrack_db.json Plantrack.app/Contents/Resources/mcp/plantrack_db.json
fi
for f in Plantrack.app/Contents/Resources/mcp/*.js; do node -c "$f"; done
echo -e "  ✔ MCP dosyaları Resources/mcp/ altına gömüldü."

# B2. Web arayüzünü pakete göm (ilk kurulumda ~/PlantrackMCP/web'e tohumlanır)
mkdir -p Plantrack.app/Contents/Resources/web
cp -R "$WEB_DIR/." Plantrack.app/Contents/Resources/web/
echo -e "  ✔ Web arayüzü Resources/web/ altına gömüldü (ilk kurulum tohumu)."

# C. Otomatik Başlatıcı Wrapper (Plantrack.app açıldığında MCP otomatik olarak başlar)
if [ -f "Plantrack.app/Contents/MacOS/pake-plantrack" ] && [ ! -f "Plantrack.app/Contents/MacOS/pake-plantrack-bin" ]; then
  mv "Plantrack.app/Contents/MacOS/pake-plantrack" "Plantrack.app/Contents/MacOS/pake-plantrack-bin"
fi

cat << 'EOF' > "Plantrack.app/Contents/MacOS/Plantrack"
#!/usr/bin/env bash
BUNDLE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# 1. Kullanıcı veri klasörünü hazırla (~/PlantrackMCP)
USER_HOME="${HOME:-$(eval echo ~$USER)}"
MCP_DIR="$USER_HOME/PlantrackMCP"
mkdir -p "$MCP_DIR/data" "$MCP_DIR/jYedek" "$MCP_DIR/web" "$MCP_DIR/mcp"

# 1a. İlk kez açılıyorsa şablon veritabanını kopyala
if [ ! -f "$MCP_DIR/data/plantrack_db.json" ] && [ -f "$BUNDLE_DIR/Resources/mcp/plantrack_db.json" ]; then
  cp "$BUNDLE_DIR/Resources/mcp/plantrack_db.json" "$MCP_DIR/data/plantrack_db.json"
fi

# 1b. Güncellenebilir web arayüzü — ilk kurulumda paketten tohumla
if [ ! -f "$MCP_DIR/web/index.html" ] && [ -d "$BUNDLE_DIR/Resources/web" ]; then
  cp -R "$BUNDLE_DIR/Resources/web/." "$MCP_DIR/web/"
fi

# 1c. Güncellenebilir sunucu kodu — ilk kurulumda paketten tohumla
if [ ! -f "$MCP_DIR/mcp/server.js" ] && [ -d "$BUNDLE_DIR/Resources/mcp" ]; then
  cp "$BUNDLE_DIR/Resources/mcp/"*.js "$MCP_DIR/mcp/" 2>/dev/null || true
fi

# 2. Canlı MCP + Arayüz Sunucusunu Başlat (127.0.0.1:38888)
if ! curl -s -m 1 http://127.0.0.1:38888/api/status >/dev/null 2>&1; then
  NODE_EXEC=""
  for n in "/opt/homebrew/bin/node" "/usr/local/bin/node" "$(/usr/bin/which node 2>/dev/null)"; do
    if [ -n "$n" ] && [ -x "$n" ]; then
      NODE_EXEC="$n"
      break
    fi
  done

  SERVER_JS="$MCP_DIR/mcp/server.js"
  [ -f "$SERVER_JS" ] || SERVER_JS="$BUNDLE_DIR/Resources/mcp/server.js"

  if [ -n "$NODE_EXEC" ] && [ -f "$SERVER_JS" ]; then
    "$NODE_EXEC" "$SERVER_JS" >> "$MCP_DIR/mcp_server.log" 2>&1 &
    # Arayüz açılmadan önce sunucunun ayağa kalkmasını bekle (en fazla ~6 sn)
    for _ in $(seq 1 30); do
      if curl -s -m 1 http://127.0.0.1:38888/api/status >/dev/null 2>&1; then break; fi
      sleep 0.2
    done
  fi
fi

# 3. Native Plantrack Webview Arayüzünü Başlat (canlı sunucudan yükler)
exec "$BUNDLE_DIR/MacOS/pake-plantrack-bin" "$@"
EOF

chmod +x "Plantrack.app/Contents/MacOS/Plantrack"
chmod +x "Plantrack.app/Contents/MacOS/pake-plantrack-bin" 2>/dev/null || true

# D. Info.plist Güncellemesi (Ana Çalıştırılabilir: Plantrack & ATS Local Networking)
PLIST="Plantrack.app/Contents/Info.plist"
if [ -f "$PLIST" ]; then
  plutil -replace CFBundleExecutable -string "Plantrack" "$PLIST" 2>/dev/null || true
  plutil -replace NSAppTransportSecurity.NSAllowsArbitraryLoads -bool YES "$PLIST" 2>/dev/null || true
  plutil -insert NSAppTransportSecurity.NSAllowsLocalNetworking -bool YES "$PLIST" 2>/dev/null || plutil -replace NSAppTransportSecurity.NSAllowsLocalNetworking -bool YES "$PLIST" 2>/dev/null || true
fi

# E. Kod İmzası
xattr -cr Plantrack.app 2>/dev/null || true
codesign --force --deep --sign - Plantrack.app >/dev/null 2>&1 || true

cp -R Plantrack.app dist/Plantrack.app
echo -e "  ✔ Plantrack.app bağımsız masaüstü paketi hazırlandı."

# 6. macOS Kurulum Paketi (.pkg) ve DMG Üretimi
echo -e "\n${YELLOW}[6/7] macOS Kurulum Paketleri (.pkg ve .dmg) Üretiliyor...${NC}"

# A. .PKG Üretimi (productbuild)
rm -f dist/Plantrack-1.0.0.pkg dist/Plantrack.pkg Plantrack.pkg
productbuild --component "dist/Plantrack.app" /Applications "dist/Plantrack-1.0.0.pkg"
cp "dist/Plantrack-1.0.0.pkg" "dist/Plantrack.pkg"
cp "dist/Plantrack-1.0.0.pkg" "Plantrack.pkg"
echo -e "  ✔ macOS Installer Paketi (.pkg) üretildi: dist/Plantrack-1.0.0.pkg"

# B. .DMG Üretimi (hdiutil)
DMG_STAGE="/tmp/plantrack_dmg_$$"
mkdir -p "$DMG_STAGE"
cp -R "dist/Plantrack.app" "$DMG_STAGE/"
ln -s /Applications "$DMG_STAGE/Applications"

rm -f dist/Plantrack-1.0.0.dmg dist/Plantrack.dmg Plantrack.dmg
hdiutil create \
  -volname "Plantrack" \
  -srcfolder "$DMG_STAGE" \
  -ov \
  -format UDZO \
  "dist/Plantrack-1.0.0.dmg" >/dev/null

cp "dist/Plantrack-1.0.0.dmg" "dist/Plantrack.dmg"
cp "dist/Plantrack-1.0.0.dmg" "Plantrack.dmg"
rm -rf "$DMG_STAGE"
echo -e "  ✔ macOS Sürükle-Bırak İmajı (.dmg) üretildi: dist/Plantrack-1.0.0.dmg"

# 7. /Applications Klasörüne Yerel Kurulum & Doğrulama
echo -e "\n${YELLOW}[7/7] Kurulum ve Doğrulama...${NC}"

# 7a. Güncellenebilir arayüzü ve sunucu kodunu kullanıcı klasörüyle senkronla (her zaman çalışır)
mkdir -p "$HOME/PlantrackMCP/web" "$HOME/PlantrackMCP/mcp"
cp -R "dist/Plantrack.app/Contents/Resources/web/." "$HOME/PlantrackMCP/web/" 2>/dev/null || true
cp dist/Plantrack.app/Contents/Resources/mcp/*.js "$HOME/PlantrackMCP/mcp/" 2>/dev/null || true
echo -e "  ✔ Arayüz (~/PlantrackMCP/web) ve sunucu kodu (~/PlantrackMCP/mcp) senkronlandı."

mkdir -p "$HOME/PlantrackMCP/data" "$HOME/PlantrackMCP/jYedek"
if [ ! -f "$HOME/PlantrackMCP/data/plantrack_db.json" ] && [ -f "data/plantrack_db.json" ]; then
  cp data/plantrack_db.json "$HOME/PlantrackMCP/data/plantrack_db.json"
fi

# 7b. /Applications kurulumu — eski sürüm root sahipliyse yönetici izni gerekir
KURULDU=0
if rm -rf /Applications/Plantrack.app 2>/dev/null && ditto dist/Plantrack.app /Applications/Plantrack.app 2>/dev/null; then
  KURULDU=1
fi

if [ "$KURULDU" = "1" ] && [ -f /Applications/Plantrack.app/Contents/Resources/mcp/server.js ] && [ -x /Applications/Plantrack.app/Contents/MacOS/Plantrack ]; then
  echo -e "  ✔ /Applications/Plantrack.app başarıyla kuruldu."
  echo -e "  ✔ Otomatik başlatıcı: /Applications/Plantrack.app/Contents/MacOS/Plantrack"
  echo -e "  ✔ MCP sunucusu: /Applications/Plantrack.app/Contents/Resources/mcp/server.js"
  echo -e "  ✔ Veritabanı: $HOME/PlantrackMCP/data/plantrack_db.json"
else
  echo -e "${YELLOW}  ⚠ /Applications/Plantrack.app güncellenemedi (root sahipli eski sürüm olabilir).${NC}"
  echo -e "${YELLOW}    Kurmak için ya 'Plantrack.pkg' dosyasına çift tıklayın, ya da şunu çalıştırın:${NC}"
  echo -e "${YELLOW}      sudo rm -rf /Applications/Plantrack.app && sudo ditto \"$ROOT_DIR/dist/Plantrack.app\" /Applications/Plantrack.app${NC}"
fi

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}        TEBRİKLER! DERLEME BAŞARIYLA TAMAMLANDI       ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Üretilen Paketler:"
echo -e "  1. macOS Yükleyici (.pkg): ${BLUE}$ROOT_DIR/Plantrack.pkg${NC} ($(du -sh "$ROOT_DIR/Plantrack.pkg" | cut -f1))"
echo -e "  2. macOS Disk İmajı (.dmg): ${BLUE}$ROOT_DIR/Plantrack.dmg${NC} ($(du -sh "$ROOT_DIR/Plantrack.dmg" | cut -f1))"
echo -e "  3. macOS Uygulama Paketi : ${BLUE}$ROOT_DIR/dist/Plantrack.app${NC} ($(du -sh "$ROOT_DIR/dist/Plantrack.app" | cut -f1))"
echo -e "\nKullanım:"
echo -e "  - İster 'Plantrack.pkg' çift tıklanarak standart macOS kurulum sihirbazıyla kurulabilir,"
echo -e "  - İster 'Plantrack.dmg' açılarak 'Applications' klasörüne sürüklenebilir."
echo -e "  - Uygulama açıldığı anda Canlı MCP Sunucusu (Port 38888) arka planda otomatik çalışır."
