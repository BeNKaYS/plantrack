#!/usr/bin/env node
/**
 * Plantrack MCP Test Client
 * 
 * MCP sunucusunu bir alt süreç (child process) olarak başlatır,
 * stdio üzerinden JSON-RPC 2.0 istekleri gönderir ve yanıtları denetler.
 */

const { spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

const serverPath = path.resolve(__dirname, 'server.js');
const child = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let msgId = 1;
const pendingRequests = new Map();

child.stderr.on('data', (d) => {
  // Sunucunun log çıktılarını ekrana yaz
  process.stdout.write(`\x1b[90m${d.toString()}\x1b[0m`);
});

const rl = readline.createInterface({
  input: child.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const res = JSON.parse(trimmed);
    if (res.id && pendingRequests.has(res.id)) {
      const { resolve, reject } = pendingRequests.get(res.id);
      pendingRequests.delete(res.id);
      if (res.error) {
        reject(new Error(`JSON-RPC Error [${res.error.code}]: ${res.error.message}`));
      } else {
        resolve(res.result);
      }
    }
  } catch (err) {
    console.error('Yanıt parse hatası:', err, line);
  }
});

function call(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params
    });
    child.stdin.write(payload + '\n');
  });
}

function notify(method, params = {}) {
  const payload = JSON.stringify({
    jsonrpc: '2.0',
    method,
    params
  });
  child.stdin.write(payload + '\n');
}

async function runTests() {
  console.log('\n\x1b[36m==================================================\x1b[0m');
  console.log('\x1b[36m    Plantrack MCP Sunucusu Doğrulama Testleri    \x1b[0m');
  console.log('\x1b[36m==================================================\x1b[0m\n');

  try {
    // 1. Initialize
    console.log('1. [initialize] İstek gönderiliyor...');
    const initRes = await call('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    });
    console.log(`   ✔ Sunucu adı: ${initRes.serverInfo.name}, sürüm: ${initRes.serverInfo.version}`);
    notify('notifications/initialized');

    // 2. Ping
    console.log('\n2. [ping] İstek gönderiliyor...');
    await call('ping');
    console.log('   ✔ Ping başarılı.');

    // 3. Tools list
    console.log('\n3. [tools/list] Tanımlı araçlar çekiliyor...');
    const toolsRes = await call('tools/list');
    console.log(`   ✔ Kayıtlı Araç Sayısı: ${toolsRes.tools.length}`);

    // 4. Test plantrack_overview
    console.log('\n4. [tools/call] plantrack_overview çağrılıyor...');
    const ovwRes = await call('tools/call', { name: 'plantrack_overview', arguments: {} });
    const ovwData = JSON.parse(ovwRes.content[0].text);
    console.log(`   ✔ Koç: ${ovwData.kocProfili.ad} ${ovwData.kocProfili.soyad}`);
    console.log(`   ✔ Toplam Öğrenci: ${ovwData.istatistikler.toplamOgrenci}`);
    console.log(`   ✔ Toplam Ders: ${ovwData.istatistikler.toplamDers}, Konu: ${ovwData.istatistikler.toplamKonu}`);
    console.log(`   ✔ Toplam Görev: ${ovwData.istatistikler.toplamGorev}`);

    // 5. Test plantrack_list_students
    console.log('\n5. [tools/call] plantrack_list_students çağrılıyor...');
    const stuRes = await call('tools/call', { name: 'plantrack_list_students', arguments: {} });
    const students = JSON.parse(stuRes.content[0].text);
    console.log(`   ✔ Listelenen öğrenci sayısı: ${students.length}`);
    students.forEach(s => console.log(`      - [${s.sinif}. Sınıf] ${s.adSoyad} (Hedef: ${s.hedef || 'Belirtilmedi'})`));

    // 6. Test plantrack_get_student & 7. Görevler (yalnızca kayıtlı öğrenci varsa)
    if (students.length === 0) {
      console.log('\n6. [tools/call] plantrack_get_student — atlandı (kayıtlı öğrenci yok).');
      console.log('7. [tools/call] plantrack_list_tasks — atlandı (kayıtlı öğrenci yok).');
    } else {
      console.log('\n6. [tools/call] plantrack_get_student çağrılıyor...');
      const oneStuRes = await call('tools/call', { name: 'plantrack_get_student', arguments: { ogrenciId: students[0].id } });
      const oneStu = JSON.parse(oneStuRes.content[0].text);
      console.log(`   ✔ Öğrenci: ${oneStu.adSoyad}, Görevler: ${oneStu.ozet.gorevSayisi}, Denemeler: ${oneStu.ozet.denemeSinaviSayisi}`);

      console.log('\n7. [tools/call] plantrack_list_tasks çağrılıyor...');
      const taskRes = await call('tools/call', { name: 'plantrack_list_tasks', arguments: { ogrenciId: students[0].id } });
      const tasks = JSON.parse(taskRes.content[0].text);
      console.log(`   ✔ Öğrenciye ait görev sayısı: ${tasks.length}`);
      if (tasks.length > 0) {
        console.log(`      - İlk görev: "${tasks[0].baslik}" [Durum: ${tasks[0].durum}, Hedef: ${tasks[0].hedefSoru} soru]`);
      }
    }

    // 8. Test plantrack_list_topics with search
    console.log('\n8. [tools/call] plantrack_list_topics (arama: "çarpanlar") çağrılıyor...');
    const topicRes = await call('tools/call', { name: 'plantrack_list_topics', arguments: { search: 'çarpanlar' } });
    const topics = JSON.parse(topicRes.content[0].text);
    console.log(`   ✔ Eşleşen konu sayısı: ${topics.length}`);
    if (topics.length > 0) {
      console.log(`      - Konu: "${topics[0].konuAdi}" (Ders: ${topics[0].dersAdi})`);
    }

    // 9. Test plantrack_get_topic_progress (yalnızca kayıtlı öğrenci varsa)
    if (students.length === 0) {
      console.log('\n9. [tools/call] plantrack_get_topic_progress — atlandı (kayıtlı öğrenci yok).');
    } else {
      console.log('\n9. [tools/call] plantrack_get_topic_progress çağrılıyor...');
      const progRes = await call('tools/call', { name: 'plantrack_get_topic_progress', arguments: { ogrenciId: students[0].id } });
      const progress = JSON.parse(progRes.content[0].text);
      console.log(`   ✔ Tamamlanma Yüzdesi: %${progress.istatistik.tamamlanmaYuzdesi}`);
      console.log(`   ✔ Tamamlanan Konu: ${progress.istatistik.tamamlanan}, Çalışılan: ${progress.istatistik.calisilan}`);
    }

    // 10. Test plantrack_list_mock_exams & detail
    console.log('\n10. [tools/call] plantrack_list_mock_exams çağrılıyor...');
    const examRes = await call('tools/call', { name: 'plantrack_list_mock_exams', arguments: {} });
    const exams = JSON.parse(examRes.content[0].text);
    console.log(`   ✔ Toplam Deneme Sayısı: ${exams.length}`);
    if (exams.length > 0) {
      console.log(`      - Deneme: "${exams[0].ad}" -> Net: ${exams[0].net}, Başarı: %${exams[0].basariYuzde}`);
      
      console.log('   -> Deneme detay analizi çağrılıyor (plantrack_get_mock_exam_detail)...');
      const detRes = await call('tools/call', { name: 'plantrack_get_mock_exam_detail', arguments: { examId: exams[0].id } });
      const examDet = JSON.parse(detRes.content[0].text);
      console.log(`      - İncelenen ders sayısı: ${examDet.dersler ? examDet.dersler.length : 0}`);
      console.log(`      - İncelenen kazanım sayısı: ${examDet.konular ? examDet.konular.length : 0}`);
    }

    // 11. Test plantrack_list_resources
    console.log('\n11. [tools/call] plantrack_list_resources çağrılıyor...');
    const recRes = await call('tools/call', { name: 'plantrack_list_resources', arguments: {} });
    const resources = JSON.parse(recRes.content[0].text);
    console.log(`   ✔ Kütüphanedeki kaynak sayısı: ${resources.length}`);

    // 12. Test plantrack_get_student_habits (yalnızca kayıtlı öğrenci varsa)
    if (students.length === 0) {
      console.log('\n12. [tools/call] plantrack_get_student_habits — atlandı (kayıtlı öğrenci yok).');
    } else {
      console.log('\n12. [tools/call] plantrack_get_student_habits çağrılıyor...');
      const habRes = await call('tools/call', { name: 'plantrack_get_student_habits', arguments: { ogrenciId: students[0].id } });
      const habits = JSON.parse(habRes.content[0].text);
      console.log(`   ✔ Tanımlı alışkanlık zinciri sayısı: ${habits.zincirler.length}`);
      habits.zincirler.slice(0, 3).forEach(z => console.log(`      - "${z.baslik}"`));
    }

    // 13. Test resources/list & resources/read
    console.log('\n13. [resources/list] & [resources/read] çağrılıyor...');
    const resList = await call('resources/list');
    console.log(`   ✔ Kayıtlı MCP kaynak sayısı: ${resList.resources.length}`);
    
    const readOvw = await call('resources/read', { uri: 'plantrack://overview' });
    console.log(`   ✔ 'plantrack://overview' okundu: ${readOvw.contents[0].text.length} karakter.`);

    console.log('\n\x1b[32m==================================================\x1b[0m');
    console.log('\x1b[32m       TÜM MCP TESTLERİ BAŞARIYLA GEÇTİ!          \x1b[0m');
    console.log('\x1b[32m==================================================\x1b[0m\n');
  } catch (err) {
    console.error('\n\x1b[31mTEST BAŞARISIZ OLDU:\x1b[0m', err);
    process.exit(1);
  } finally {
    child.kill();
    process.exit(0);
  }
}

runTests();
