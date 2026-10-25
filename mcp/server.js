#!/usr/bin/env node
/**
 * Plantrack — Model Context Protocol (MCP) Server & Live Sync Bridge
 * 
 * Plantrack koçluk platformunun tüm verilerine (öğrenciler, görevler, müfredat,
 * denemeler, hata defteri, çizelgeler, zaman bloklama) erişim sağlayan
 * resmi MCP sunucusu ve masaüstü uygulaması (Plantrack.app) ile
 * çift yönlü canlı senkronizasyon köprüsü.
 * 
 * Standart: Model Context Protocol (2024-11-05) via stdio
 * Canlı Senkronizasyon: HTTP API via 127.0.0.1:38888
 */

const readline = require('readline');
const http = require('http');
const https = require('https');
const path = require('path');
const os = require('os');
const PlantrackDB = require('./db');
const { toolsList, executeTool } = require('./tools');
const { resourcesList, readResource } = require('./resources');
const V = require('./validate');

// STDOUT yalnızca saf JSON-RPC mesajlarına ayrılmıştır.
// Yanlışlıkla console.log çağrıldığında stdout'un bozulmasını önlemek için stderr'e yönlendiriyoruz:
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
console.log = (...args) => {
  process.stderr.write(`[PLANTRACK MCP LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`);
};
console.info = console.log;
console.warn = (...args) => {
  process.stderr.write(`[PLANTRACK MCP WARN] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`);
};

// Veritabanını başlat
const db = new PlantrackDB();

// ─────────────────────────────────────────────────────────────
// CANLI SENKRONİZASYON HTTP API (Plantrack.app Canlı Köprüsü)
// ─────────────────────────────────────────────────────────────
const SYNC_PORT = parseInt(process.env.PLANTRACK_SYNC_PORT || '38888', 10);
let lastModifiedTime = Date.now();

const fs = require('fs');
function checkDiskReload() {
  try {
    if (fs.existsSync(db.dbPath)) {
      const stat = fs.statSync(db.dbPath);
      // mtime ondalıklı, lastModifiedTime tam sayı → taban değerle karşılaştır
      const mtime = Math.floor(stat.mtimeMs);
      if (mtime > lastModifiedTime) {
        db.init();
        lastModifiedTime = mtime;
      }
    }
  } catch (_) {}
}


// db.save çağrıldığında lastModifiedTime güncellensin
const originalDbSave = db.save.bind(db);
db.save = function() {
  const ok = originalDbSave();
  if (ok) lastModifiedTime = Date.now();
  return ok;
};

// ─────────────────────────────────────────────────────────────
// CANLI WEB ARAYÜZÜ & UYGULAMA GÜNCELLEME (Ayarlar > Programı Güncelle)
// Masaüstü uygulaması arayüzü gömülü dosya yerine bu kökten sunulur; böylece
// "Programı Güncelle" butonu yeni sürümü buraya kopyalayıp sayfayı yeniler.
// ─────────────────────────────────────────────────────────────
const HOME_DIR = process.env.HOME || os.homedir();
const MCP_HOME = process.env.PLANTRACK_HOME || path.join(HOME_DIR, 'PlantrackMCP');
const WEB_ROOT = process.env.PLANTRACK_WEB_DIR || path.join(MCP_HOME, 'web');
const MCP_CODE_DIR = path.join(MCP_HOME, 'mcp');
const JYEDEK_DIR = path.join(MCP_HOME, 'jYedek');
const UPDATE_CFG = path.join(MCP_HOME, 'guncelleme.json');

// Güncellenecek web varlıkları (küçük ve hızlı tutulur)
const WEB_FILES = ['index.html', 'tokens.css', 'style.css', 'app.js', 'version.json'];
const WEB_DIRS = ['js', 'assets/vendor'];
const EXTRA_ASSETS = ['assets/logo.svg'];
// Sunucu tarafı kod — değişirse uygulamanın yeniden başlatılması gerekir
const MCP_FILES = ['server.js', 'db.js', 'tools.js', 'resources.js', 'validate.js', 'test-client.js'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

function readJsonSafe(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
}

function writeJsonSafe(file, obj) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(obj, null, 2));
  } catch (_) {}
}

function webVersion() {
  const v = readJsonSafe(path.join(WEB_ROOT, 'version.json')) || {};
  let zaman = 0;
  try { zaman = Math.floor(fs.statSync(path.join(WEB_ROOT, 'app.js')).mtimeMs); } catch (_) {}
  return { surum: v.surum || 'bilinmiyor', tarih: v.tarih || '', not: v.not || '', zaman, kok: WEB_ROOT };
}

/** Sürüm metnini parçalara ayırır: "9.1.2" → [9,1,2] */
function surumParcala(surum) {
  return String(surum || '')
    .replace(/^v/i, '')
    .split(/[.\-+]/)
    .map(p => parseInt(p, 10))
    .filter(n => !isNaN(n));
}

/**
 * İki sürümü karşılaştırır: a<b → -1, a=b → 0, a>b → 1.
 * "8.61" gibi iki parçalı sürümler de desteklenir.
 */
function surumKarsilastir(a, b) {
  const pa = surumParcala(a);
  const pb = surumParcala(b);
  if (!pa.length || !pb.length) return 0;
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/** Sürüm farkının türü: buyuk (major), kucuk (minor), yama (patch) */
function surumFarkTuru(eski, yeni) {
  const pe = surumParcala(eski);
  const py = surumParcala(yeni);
  if (!pe.length || !py.length) return '';
  if ((py[0] || 0) !== (pe[0] || 0)) return 'buyuk';
  if ((py[1] || 0) !== (pe[1] || 0)) return 'kucuk';
  return 'yama';
}

/** Bir yedek klasörünü hedef klasöre geri yükler (güncelleme başarısız olursa). */
function restoreDir(backupPath, targetDir) {
  if (!backupPath || !fs.existsSync(backupPath)) return false;
  try {
    for (const rel of listFilesRecursive(backupPath)) {
      const dst = path.join(targetDir, rel);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(path.join(backupPath, rel), dst);
    }
    return true;
  } catch (err) {
    process.stderr.write(`[PLANTRACK UPDATE ROLLBACK ERROR] ${err.message}\n`);
    return false;
  }
}

function listFilesRecursive(dir, base = dir, acc = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return acc; }
  for (const e of entries) {
    if (e.name === '.DS_Store' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listFilesRecursive(full, base, acc);
    else acc.push(path.relative(base, full));
  }
  return acc;
}

// Bir kaynak klasördeki web varlıklarının listesini çıkarır
function collectWebFiles(source) {
  const list = [];
  for (const rel of WEB_FILES) {
    if (fs.existsSync(path.join(source, rel))) list.push(rel);
  }
  for (const rel of EXTRA_ASSETS) {
    if (fs.existsSync(path.join(source, rel))) list.push(rel);
  }
  const atla = /seed_backup|\.bak$|\.orig$|\.tmp$/i;
  for (const d of WEB_DIRS) {
    for (const rel of listFilesRecursive(path.join(source, d))) {
      if (atla.test(rel)) continue;
      list.push(path.join(d, rel));
    }
  }
  return list;
}

// Kaynak klasör geçerli bir Plantrack kökü mü?
function isPlantrackSource(source) {
  try {
    return fs.existsSync(path.join(source, 'index.html')) && fs.existsSync(path.join(source, 'app.js'));
  } catch (_) { return false; }
}

// ── GitHub güncelleme kaynağı ──
function parseGitHubRepo(repo) {
  const s = String(repo || '').trim();
  if (!s) return null;
  const m = s.match(/github\.com[/:]([^/]+)\/([^/.]+)/i) || s.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  return m ? { owner: m[1], name: m[2].replace(/\.git$/i, '') } : null;
}

function downloadFile(url, dest, token) {
  return new Promise((resolve, reject) => {
    const go = (u, kalan) => {
      const headers = { 'User-Agent': 'Plantrack-Updater' };
      if (token) headers.Authorization = `token ${token}`;
      https.get(u, { headers }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && kalan > 0) {
          res.resume();
          return go(res.headers.location, kalan - 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`İndirme başarısız (HTTP ${res.statusCode})`));
        }
        const f = fs.createWriteStream(dest);
        res.pipe(f);
        f.on('finish', () => f.close(() => resolve(dest)));
        f.on('error', reject);
      }).on('error', reject);
    };
    go(url, 5);
  });
}

function execFileAsync(cmd, args, extraEnv) {
  return new Promise((resolve, reject) => {
    const opts = { timeout: 60000, maxBuffer: 4 * 1024 * 1024 };
    if (extraEnv) opts.env = Object.assign({}, process.env, extraEnv);
    require('child_process').execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) return reject(new Error(String(stderr || err.message || '').slice(0, 300)));
      resolve(stdout);
    });
  });
}

function resolveUpdateSource(given) {
  const cfg = readJsonSafe(UPDATE_CFG) || {};
  const raw = (given || cfg.kaynak || '').trim();
  if (!raw) {
    // Akıllı tahmin: sunucu depodan çalışıyorsa proje kökü, kopyalanmışsa yok
    const guess = path.resolve(__dirname, '..');
    return isPlantrackSource(guess) ? guess : '';
  }
  return path.resolve(raw.replace(/^~(?=$|\/)/, HOME_DIR));
}

function copyFileIfChanged(srcFile, dstFile) {
  try {
    const srcBuf = fs.readFileSync(srcFile);
    let same = false;
    try { same = fs.readFileSync(dstFile).equals(srcBuf); } catch (_) {}
    if (same) return false;
    fs.mkdirSync(path.dirname(dstFile), { recursive: true });
    fs.writeFileSync(dstFile, srcBuf);
    return true;
  } catch (_) { return false; }
}

function backupDir(srcDir, etiket) {
  try {
    if (!fs.existsSync(srcDir)) return '';
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const dst = path.join(JYEDEK_DIR, `${etiket}_${ts}`);
    fs.mkdirSync(dst, { recursive: true });
    for (const rel of listFilesRecursive(srcDir)) {
      const target = path.join(dst, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(srcDir, rel), target);
    }
    return dst;
  } catch (_) { return ''; }
}

// statik dosya sunumu
function serveStatic(reqPath, res) {
  let rel = decodeURIComponent(reqPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const safe = path.normalize(rel).replace(/^(\.\.[/\\])+/, '').replace(/^\//, '');
  const full = path.join(WEB_ROOT, safe);
  if (!full.startsWith(WEB_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }
  fs.readFile(full, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Bulunamadı: ' + rel);
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}

const syncServer = http.createServer((req, res) => {
  // CORS başlıkları (WebKit ve tarayıcı erişimi için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Durum kontrolü
  if (req.url === '/api/status' && req.method === 'GET') { checkDiskReload();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      version: db.data ? db.data.version : '1.0.0',
      lastModified: lastModifiedTime,
      serverYolu: __filename,
      ogrenciSayisi: db.data && db.data.ogrenciler ? db.data.ogrenciler.length : 0,
      aracSayisi: toolsList.length,
      kaynakSayisi: resourcesList.length
    }));
  }

  // Veriyi oku (GET) — Plantrack.app açıldığında güncel verileri çeker
  if (req.url === '/api/data' && req.method === 'GET') { checkDiskReload();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      data: db.data,
      lastModified: lastModifiedTime
    }));
  }

  // Veriyi kaydet (POST) — Plantrack.app'te bir şey değiştiğinde MCP'ye yazar
  if (req.url === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const incomingData = payload.data || payload;
        if (!incomingData || typeof incomingData !== 'object' || Array.isArray(incomingData) || !Array.isArray(incomingData.ogrenciler)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Geçersiz veri formatı: kök nesne ve "ogrenciler" dizisi gerekli.' }));
        }

        // İyimser kilit: uygulama hangi sürümü gördüğünü söylerse, arada MCP yazdıysa ezme
        const base = payload.baseModified !== undefined && payload.baseModified !== null
          ? Number(payload.baseModified) : null;
        if (base !== null && base > 0 && lastModifiedTime && base !== lastModifiedTime) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            error: 'Çakışma: veri tabanı sizin gördüğünüzden sonra değişti. Yeniden okuyup tekrar deneyin.',
            conflict: true,
            lastModified: lastModifiedTime
          }));
        }

        // YIKICI YAZMA KORUMASI: hiç öğrencisi olmayan bir istemci (taze tarayıcı
        // profili, yeni cihaz, seed veri) dolu veri tabanını silemesin.
        // Bilinçli sıfırlama için payload.allowEmpty === true gerekir.
        const mevcutOgrenci = (db.data && Array.isArray(db.data.ogrenciler)) ? db.data.ogrenciler.length : 0;
        const gelenOgrenci = incomingData.ogrenciler.length;
        if (gelenOgrenci === 0 && mevcutOgrenci > 0 && payload.allowEmpty !== true) {
          process.stderr.write(`[DB GUARD] Boş veri gönderimi reddedildi (mevcut ${mevcutOgrenci} öğrenci korundu).\n`);
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: false,
            bosVeri: true,
            error: `Gönderilen veride hiç öğrenci yok; veri tabanında ${mevcutOgrenci} öğrenci var. ` +
              'Kaza ile silmeyi önlemek için yazma reddedildi. Önce veriyi sunucudan çekin ' +
              '(GET /api/data). Bilinçli sıfırlama için "allowEmpty": true gönderin.',
            mevcutOgrenci,
            lastModified: lastModifiedTime
          }));
        }

        const previous = db.data;
        db.autoBackup();
        db.structureWarnings = [];
        db.data = incomingData;
        db.ensureStructure();
        db.migrateLegacyKeys();
        const report = db.validateDatabase();

        const strict = payload.strict === true;
        if (strict && !report.ok) {
          db.data = previous;
          res.writeHead(422, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: false,
            error: 'Veri bütünlük kontrolünden geçmedi (strict mod).',
            rapor: report
          }));
        }

        if (!db.save()) {
          db.data = previous;
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, error: 'Veri tabanına yazılamadı (salt okunur veya disk hatası).', readOnly: db.readOnly }));
        }

        lastModifiedTime = Date.now();
        if (report.hataSayisi || db.structureWarnings.length) {
          process.stderr.write(`[DB INTEGRITY] POST /api/data · ${report.hataSayisi} hata, ${report.uyariSayisi} uyarı\n`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          lastModified: lastModifiedTime,
          saglik: { ok: report.ok, hataSayisi: report.hataSayisi, uyariSayisi: report.uyariSayisi },
          uyarilar: db.structureWarnings.concat(report.uyarilar.slice(0, 20)),
          hatalar: report.hatalar.slice(0, 20)
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Veri tabanı sağlık raporu (salt okunur)
  if (req.url === '/api/health' && req.method === 'GET') {
    checkDiskReload();
    let report;
    try {
      report = db.validateDatabase();
    } catch (err) {
      report = { ok: false, hataSayisi: 1, hatalar: [err.message], uyarilar: [], sayilar: {} };
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      status: report.ok ? 'ok' : 'degraded',
      readOnly: db.readOnly,
      dbPath: db.dbPath,
      recoveredFrom: db.recoveredFrom,
      structureWarnings: db.structureWarnings,
      lastModified: lastModifiedTime,
      rapor: report,
      aracSayisi: toolsList.length,
      kaynakSayisi: resourcesList.length
    }));
  }

  // Sürüm bilgisi (Ayarlar > Programı Güncelle kartı için)
  if (req.url === '/api/version' && req.method === 'GET') {
    const cfg = readJsonSafe(UPDATE_CFG) || {};
    const tahmin = (() => { const g = path.resolve(__dirname, '..'); return isPlantrackSource(g) ? g : ''; })();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(Object.assign({}, webVersion(), {
      kaynak: cfg.kaynak || '',
      kaynakTipi: cfg.kaynakTipi || 'local',
      repo: cfg.repo || '',
      branch: cfg.branch || 'main',
      tahminKaynak: tahmin,
      serverYolu: __filename,
      ok: fs.existsSync(path.join(WEB_ROOT, 'index.html'))
    })));
  }

  // Uygulama güncelleme — yerel proje klasöründen yeni sürümü kopyalar
  if (req.url === '/api/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const kaynakTipi = payload.sourceType === 'github' ? 'github' : 'local';
        let source = resolveUpdateSource(payload.source);

        if (kaynakTipi === 'github') {
          const repoInfo = parseGitHubRepo(payload.repo);
          if (!repoInfo) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: 'GitHub deposu geçersiz. Örnek: kullanici/plantrack' }));
          }
          const branch = String(payload.branch || 'main').trim() || 'main';
          const ghTmp = path.join(MCP_HOME, '.update-tmp');
          try { fs.rmSync(ghTmp, { recursive: true, force: true }); } catch (_) {}
          fs.mkdirSync(ghTmp, { recursive: true });

          const maskele = (metin) => payload.token ? String(metin).split(String(payload.token)).join('***') : String(metin);

          // 1. yol: git clone — codeload zip'i CDN'de eski sürümü tutabildiği için
          // önce git denenir. Böylece "güncelleme var" diyip eski kodu yazmayız.
          let klonlandi = false;
          try {
            const cloneDir = path.join(ghTmp, 'clone');
            const auth = payload.token
              ? `https://x-access-token:${encodeURIComponent(payload.token)}@github.com/`
              : 'https://github.com/';
            const cloneUrl = `${auth}${repoInfo.owner}/${repoInfo.name}.git`;
            await execFileAsync('git', [
              'clone', '--depth', '1', '--single-branch', '--branch', branch, cloneUrl, cloneDir
            ], { GIT_TERMINAL_PROMPT: '0' });
            if (isPlantrackSource(cloneDir)) {
              source = cloneDir;
              klonlandi = true;
            }
          } catch (cloneErr) {
            process.stderr.write(`[PLANTRACK UPDATE] git clone başarısız, zip'e geçiliyor: ${maskele(cloneErr.message).slice(0, 200)}\n`);
          }

          // 2. yol: GitHub zip (git yoksa veya clone başarısızsa)
          if (!klonlandi) {
            const zipPath = path.join(ghTmp, 'repo.zip');
            await downloadFile(
              `https://codeload.github.com/${repoInfo.owner}/${repoInfo.name}/zip/refs/heads/${encodeURIComponent(branch)}`,
              zipPath,
              payload.token
            );
            const extractDir = path.join(ghTmp, 'x');
            fs.mkdirSync(extractDir, { recursive: true });
            // Yalnızca güncelleme için gereken dosyaları çıkar. Tüm arşivi açmak
            // hem gereksiz hem de Türkçe karakterli dosya adlarında (assets/Müfredatlar)
            // unzip'in takılmasına yol açıyordu. GitHub zip'i tek bir üst klasör
            // içerdiği için desenler "*/" ile başlar.
            const desenler = [
              '*/index.html', '*/tokens.css', '*/style.css', '*/app.js', '*/version.json',
              '*/js/*', '*/assets/vendor/*', '*/assets/logo.svg', '*/mcp/*.js'
            ];
            let unzipErr = null;
            try {
              await execFileAsync('unzip', ['-o', '-q', zipPath, ...desenler, '-d', extractDir]);
            } catch (err) {
              // unzip, desenlerden biri eşleşmezse 11 döner; bunu hata sayma
              const m = String(err.message || '');
              if (!/exit status 11|no matching files/i.test(m)) unzipErr = err;
            }
            // Çıkarma gerçekten işe yaradı mı? Üst klasörün altındaki kritik dosyalara bak.
            const dizinler = fs.readdirSync(extractDir, { withFileTypes: true }).filter(e => e.isDirectory());
            if (!dizinler.length) throw new Error('GitHub arşivi açılamadı');
            source = path.join(extractDir, dizinler[0].name);
            if (unzipErr || !isPlantrackSource(source)) {
              throw new Error('GitHub arşivi açılamadı: ' + (unzipErr ? maskele(unzipErr.message) : 'index.html/app.js bulunamadı'));
            }
          }
        }

        if (!source || !isPlantrackSource(source)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: false,
            error: `Geçerli bir Plantrack klasörü bulunamadı: ${source || '(boş)'}`
          }));
        }

        const webList = collectWebFiles(source);
        const mcpList = MCP_FILES.filter(f => fs.existsSync(path.join(source, 'mcp', f)));

        const degisecek = [];
        for (const rel of webList) {
          let same = false;
          try { same = fs.readFileSync(path.join(source, rel)).equals(fs.readFileSync(path.join(WEB_ROOT, rel))); } catch (_) {}
          if (!same) degisecek.push(rel);
        }
        const mcpDegisecek = [];
        for (const rel of mcpList) {
          let same = false;
          try { same = fs.readFileSync(path.join(source, 'mcp', rel)).equals(fs.readFileSync(path.join(MCP_CODE_DIR, rel))); } catch (_) {}
          if (!same) mcpDegisecek.push(rel);
        }

        const mevcutCfg = readJsonSafe(UPDATE_CFG) || {};
        const cfgKaynak = kaynakTipi === 'local' ? source : (mevcutCfg.kaynak || '');
        const cfgRepo = payload.repo ? String(payload.repo).trim() : (mevcutCfg.repo || '');
        const cfgBranch = payload.branch ? String(payload.branch).trim() : (mevcutCfg.branch || 'main');

        // Sürüm karşılaştırması: kurulu sürüm vs kaynaktaki sürüm
        const mevcutSurum = webVersion();
        const kaynakVersionJson = readJsonSafe(path.join(source, 'version.json')) || {};
        const kaynakSurum = kaynakVersionJson.surum || '';
        const karsilastirma = kaynakSurum ? surumKarsilastir(mevcutSurum.surum, kaynakSurum) : 0;
        // karsilastirma > 0 → kaynak daha ESKİ. Eski sürümü yazmak geri gidiştir;
        // yalnızca kullanıcı açıkça isterse (payload.allowDowngrade) yapılır.
        const gerileme = karsilastirma > 0;
        const surumOzet = {
          mevcut: mevcutSurum.surum,
          kaynak: kaynakSurum || mevcutSurum.surum,
          tarih: kaynakVersionJson.tarih || '',
          not: kaynakVersionJson.not || '',
          yeniSurumVar: karsilastirma < 0,
          gerileme,
          farkTuru: kaynakSurum ? surumFarkTuru(mevcutSurum.surum, kaynakSurum) : ''
        };

        // Sadece kontrol et (değişiklik listesi)
        if (payload.dryRun) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: true, dryRun: true, source,
            kaynakTipi, repo: cfgRepo, branch: cfgBranch,
            degisecek, mcpDegisecek,
            guncel: !gerileme && (degisecek.length === 0 && mcpDegisecek.length === 0),
            uyari: gerileme
              ? `Kaynaktaki sürüm (v${surumOzet.kaynak}) kurulu sürümden (v${surumOzet.mevcut}) daha eski. Güncelleme yapılmaz.`
              : '',
            surumOzet,
            surum: mevcutSurum
          }));
        }

        // Geri gidiş koruması: bayat ayna/CDN eski sürüm döndürürse yazma.
        if (gerileme && payload.allowDowngrade !== true) {
          res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: false,
            gerileme: true,
            error: `Kaynaktaki sürüm v${surumOzet.kaynak}, kurulu sürüm v${surumOzet.mevcut} — daha eski. ` +
              'Geri gidiş engellendi. Kaynağı güncelleyin (yerel klasörde version.json veya GitHub dalı).',
            surumOzet
          }));
        }

        if (degisecek.length === 0 && mcpDegisecek.length === 0) {
          writeJsonSafe(UPDATE_CFG, { kaynak: cfgKaynak, kaynakTipi, repo: cfgRepo, branch: cfgBranch, sonKontrol: new Date().toISOString() });
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: true, guncel: true, source, kaynakTipi, repo: cfgRepo, branch: cfgBranch, surum: mevcutSurum, surumOzet, mcpChanged: false }));
        }

        // Yedek: arayüz + sunucu kodu (geri alma için ikisi de gerekli)
        const webYedek = degisecek.length ? backupDir(WEB_ROOT, 'web') : '';
        const mcpYedek = mcpDegisecek.length ? backupDir(MCP_CODE_DIR, 'mcp') : '';

        const kopyalanan = [];
        for (const rel of degisecek) {
          if (copyFileIfChanged(path.join(source, rel), path.join(WEB_ROOT, rel))) kopyalanan.push(rel);
        }
        const mcpKopyalanan = [];
        for (const rel of mcpDegisecek) {
          if (copyFileIfChanged(path.join(source, 'mcp', rel), path.join(MCP_CODE_DIR, rel))) mcpKopyalanan.push(rel);
        }

        // Doğrulama: kopyalanan her dosya kaynakla birebir aynı mı?
        const bozuk = [];
        for (const rel of kopyalanan) {
          try {
            if (!fs.readFileSync(path.join(source, rel)).equals(fs.readFileSync(path.join(WEB_ROOT, rel)))) bozuk.push(rel);
          } catch (_) { bozuk.push(rel); }
        }
        for (const rel of mcpKopyalanan) {
          try {
            if (!fs.readFileSync(path.join(source, 'mcp', rel)).equals(fs.readFileSync(path.join(MCP_CODE_DIR, rel)))) bozuk.push('mcp/' + rel);
          } catch (_) { bozuk.push('mcp/' + rel); }
        }

        if (bozuk.length) {
          // Yazma yarıda kaldıysa önceki sürüme dön
          const webOk = webYedek ? restoreDir(webYedek, WEB_ROOT) : true;
          const mcpOk = mcpYedek ? restoreDir(mcpYedek, MCP_CODE_DIR) : true;
          process.stderr.write(`[PLANTRACK UPDATE] Doğrulama başarısız (${bozuk.length} dosya); geri alma web=${webOk} mcp=${mcpOk}\n`);
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({
            success: false,
            error: 'Güncelleme doğrulanamadı, önceki sürüme dönüldü.',
            bozuk,
            geriAlindi: webOk && mcpOk,
            yedek: { web: webYedek, mcp: mcpYedek }
          }));
        }

        const yeniSurum = (readJsonSafe(path.join(WEB_ROOT, 'version.json')) || {}).surum || '';
        writeJsonSafe(UPDATE_CFG, { kaynak: cfgKaynak, kaynakTipi, repo: cfgRepo, branch: cfgBranch, sonGuncelleme: new Date().toISOString(), sonSurum: yeniSurum });

        process.stderr.write(`[PLANTRACK UPDATE] ${source} → ${WEB_ROOT} (${kopyalanan.length} web, ${mcpKopyalanan.length} sunucu dosyası, v${mevcutSurum.surum} → v${yeniSurum})\n`);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          success: true, source,
          kaynakTipi, repo: cfgRepo, branch: cfgBranch,
          updated: kopyalanan,
          mcpChanged: mcpKopyalanan.length > 0,
          mcpUpdated: mcpKopyalanan,
          yedek: { web: webYedek, mcp: mcpYedek },
          surumOzet,
          surum: webVersion()
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // PDF üretimi (Chrome headless) — yazdırma yönü (A4 yatay/dikey) garanti edilir
  if (req.url === '/api/print/pdf' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const html = String(payload.html || '');
        const baslik = String(payload.baslik || 'rapor').replace(/[\/\\:*?"<>|]+/g, '_').slice(0, 80);
        if (!html) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, error: 'html boş' }));
        }

        const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        if (!fs.existsSync(chromePath)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ success: false, error: 'Google Chrome bulunamadı' }));
        }

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plantrack-pdf-'));
        const htmlPath = path.join(tmpDir, 'rapor.html');
        const downloads = path.join(os.homedir(), 'Downloads');
        fs.mkdirSync(downloads, { recursive: true });
        const pdfPath = path.join(downloads, `${baslik}.pdf`);
        fs.writeFileSync(htmlPath, html, 'utf8');

        const args = [
          '--headless=new',
          '--disable-gpu',
          '--no-pdf-header-footer',
          '--no-sandbox',
          `--user-data-dir=${path.join(tmpDir, 'chrome')}`,
          `--print-to-pdf=${pdfPath}`,
          `file://${htmlPath}`
        ];

        require('child_process').execFile(chromePath, args, { timeout: 45000 }, (err) => {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
          if (err || !fs.existsSync(pdfPath)) {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ success: false, error: err ? String(err.message).slice(0, 300) : 'PDF üretilemedi' }));
          }
          try { require('child_process').execFile('open', [pdfPath]); } catch (_) {}
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, path: pdfPath }));
        });
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Kök ve diğer dosyalar → güncellenebilir web arayüzü (GET)
  if (req.method === 'GET' && req.url.indexOf('/api/') !== 0) {
    return serveStatic(req.url, res);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

syncServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    process.stderr.write(`[PLANTRACK SYNC INFO] Port ${SYNC_PORT} zaten kullanımda, mevcut senkronizasyon sunucusu çalışıyor.\n`);
  } else {
    process.stderr.write(`[PLANTRACK SYNC WARN] Canlı senkronizasyon portu açılamadı: ${err.message}\n`);
  }
});

syncServer.listen(SYNC_PORT, '127.0.0.1', () => {
  process.stderr.write(`[PLANTRACK LIVE SYNC] Aktif! Plantrack.app canlı bağlantı adresi: http://127.0.0.1:${SYNC_PORT}\n`);
});

// ─────────────────────────────────────────────────────────────
// MCP PROTOKOLÜ (STDIO JSON-RPC 2.0)
// ─────────────────────────────────────────────────────────────
function sendResponse(id, result) {
  const payload = {
    jsonrpc: '2.0',
    id: id,
    result: result
  };
  originalStdoutWrite(JSON.stringify(payload) + '\n');
}

function sendError(id, code, message, data = undefined) {
  const payload = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code,
      message,
      ...(data !== undefined ? { data } : {})
    }
  };
  originalStdoutWrite(JSON.stringify(payload) + '\n');
}

async function handleRequest(message) {
  const { id, method, params } = message;

  switch (method) {
    case 'initialize': {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: 'plantrack',
          version: '1.0.0'
        }
      });
      break;
    }

    case 'notifications/initialized': {
      // Bildirim — yanıt dönülmez
      break;
    }

    case 'ping': {
      sendResponse(id, {});
      break;
    }

    // ── TOOLS ──
    case 'tools/list': {
      sendResponse(id, {
        tools: toolsList
      });
      break;
    }

    case 'tools/call': {
      if (!params || !params.name) {
        sendError(id, -32602, 'Invalid params: "name" is required');
        return;
      }
      try {
        checkDiskReload();
        const tool = toolsList.find(t => t.name === params.name);
        if (!tool) throw new V.ValidationError(`Bilinmeyen araç: ${params.name}`);
        if (db.readOnly && /_(add|update|delete|complete|log|record|batch)_/.test(params.name)) {
          throw new V.ValidationError(
            'Veri tabanı salt okunur modda (bozuk dosya ve geçerli yedek yok). Yazma yapılmadı. ' +
            'Teşhis: GET /api/health · bozuk kopya: ' + (db.recoveredFrom || '-')
          );
        }
        const args = params.arguments || {};
        // 1) şema (tip / zorunlu / enum) 2) veri tabanı referansları 3) normalizasyon
        V.validateSchema(tool.inputSchema, args);
        const prepared = V.normalizeToolArgs(db, params.name, args);
        const toolResult = await executeTool(db, params.name, prepared.args);
        let text = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult, null, 2);
        if (toolResult === undefined || toolResult === null) text = 'null';
        if (prepared.warnings.length) {
          text += `\n\n⚠️ Uyarılar (${prepared.warnings.length}):\n- ` + prepared.warnings.join('\n- ');
        }
        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: text
            }
          ],
          isError: false
        });
      } catch (err) {
        let message = err.message;
        if (err.name === 'ValidationError' && err.details && err.details.adaylar) {
          message += '\nAdaylar: ' + err.details.adaylar.map(a => JSON.stringify(a)).join(', ');
        }
        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: `Hata: ${message}`
            }
          ],
          isError: true
        });
      }
      break;
    }

    // ── RESOURCES ──
    case 'resources/list': {
      sendResponse(id, {
        resources: resourcesList
      });
      break;
    }

    case 'resources/read': {
      if (!params || !params.uri) {
        sendError(id, -32602, 'Invalid params: "uri" is required');
        return;
      }
      try {
        const resourceResult = await readResource(db, params.uri);
        sendResponse(id, {
          contents: [resourceResult]
        });
      } catch (err) {
        sendError(id, -32603, err.message);
      }
      break;
    }

    default: {
      if (id !== undefined && id !== null) {
        sendError(id, -32601, `Method not found: ${method}`);
      }
      break;
    }
  }
}

// Stdio Readline arayüzü
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const msg = JSON.parse(trimmed);
    handleRequest(msg).catch((err) => {
      process.stderr.write(`[REQUEST HANDLER UNCAUGHT ERROR] ${err.stack || err.message}\n`);
    });
  } catch (err) {
    sendError(null, -32700, `Parse error: ${err.message}`);
  }
});

process.on('SIGINT', () => {
  try { syncServer.close(); } catch (_) {}
  process.exit(0);
});
process.on('SIGTERM', () => {
  try { syncServer.close(); } catch (_) {}
  process.exit(0);
});

process.stderr.write(`[PLANTRACK MCP SERVER READY] Listening on stdio (PID: ${process.pid})\n`);
