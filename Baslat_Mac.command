#!/usr/bin/env bash

# Terminalin bulunduğu dizine geç
cd "$(dirname "$0")"

PORT=8080
URL="http://localhost:$PORT"

echo "=========================================="
echo "Plantrack başlatılıyor..."
echo "=========================================="

# Port meşgulse alternatif veya bilgilendirme
if command -v python3 >/dev/null 2>&1; then
    echo "Python3 HTTP sunucusu başlatılıyor ($URL)..."
    (sleep 1 && open "$URL") &
    python3 -m http.server $PORT
elif command -v node >/dev/null 2>&1; then
    echo "Node.js npx serve başlatılıyor ($URL)..."
    (sleep 1 && open "$URL") &
    npx serve -l $PORT .
else
    echo "Python3 veya Node bulunamadı. index.html doğrudan açılıyor..."
    open index.html
fi
