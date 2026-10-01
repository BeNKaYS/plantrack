@echo off
cd /d "%~dp0"
set PORT=8080
set URL=http://localhost:%PORT%

echo ==========================================
echo Plantrack baslatiliyor...
echo ==========================================

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Python HTTP sunucusu baslatiliyor (%URL%)...
    start "" "%URL%"
    python -m http.server %PORT%
    exit /b
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Node.js npx serve baslatiliyor (%URL%)...
    start "" "%URL%"
    npx serve -l %PORT% .
    exit /b
)

echo Python veya Node bulunamadi, index.html aciliyor...
start "" "index.html"
