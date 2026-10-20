/**
 * Plantrack MCP Server — Kaynak Tanımları & Okuyucu (Resources Definition & Handler)
 * 
 * LLM'lerin doğrudan context olarak okuyabileceği 8 hazır Plantrack kaynağı.
 */

const resourcesList = [
  {
    uri: 'plantrack://overview',
    name: 'Plantrack Sistem Özeti',
    mimeType: 'application/json',
    description: 'Koç profili, öğrenci dağılımı, görev istatistikleri ve genel sistem durumu.'
  },
  {
    uri: 'plantrack://students',
    name: 'Öğrenci Listesi & Profiller',
    mimeType: 'application/json',
    description: 'Tüm kayıtlı öğrencilerin temel bilgileri ve özet verileri.'
  },
  {
    uri: 'plantrack://curriculum',
    name: 'Müfredat Yapısı',
    mimeType: 'application/json',
    description: 'Eğitim modülleri (Ara Sınıf, LGS, YKS), sınıflar ve derslerin listesi.'
  },
  {
    uri: 'plantrack://resources',
    name: 'Kaynak Kitap Kütüphanesi',
    mimeType: 'application/json',
    description: 'Sistemde tanımlı tüm yayın, soru bankası ve deneme kitapları.'
  },
  {
    uri: 'plantrack://pending-tasks',
    name: 'Bekleyen & Geciken Görevler',
    mimeType: 'application/json',
    description: 'Tüm öğrencilerin henüz tamamlanmamış veya süresi geçmiş görevleri.'
  },
  {
    uri: 'plantrack://mock-exams',
    name: 'Deneme Sınavları Listesi',
    mimeType: 'application/json',
    description: 'Öğrencilerin girmiş olduğu deneme sınavları ve genel netleri.'
  },
  {
    uri: 'plantrack://mistakes',
    name: 'Hata Defteri & Telafi Havuzu',
    mimeType: 'application/json',
    description: 'Öğrencilerin yanlış ve boş bıraktığı soruların listesi ve telafi durumları.'
  },
  {
    uri: 'plantrack://school-grades',
    name: 'Okul Sınav & Yazılı Notları',
    mimeType: 'application/json',
    description: 'Öğrencilerin okul yazılı, proje ve performans sınavı notları ve ortalamaları.'
  }
];

async function readResource(db, uri) {
  switch (uri) {
    case 'plantrack://overview':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.getOverview(), null, 2)
      };

    case 'plantrack://students':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.getStudents().map(s => db.getStudent(s.id)), null, 2)
      };

    case 'plantrack://curriculum':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          modullerVeSiniflar: db.getModulesAndClasses(),
          dersler: db.getCourses()
        }, null, 2)
      };

    case 'plantrack://resources':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.getResources(), null, 2)
      };

    case 'plantrack://pending-tasks': {
      const pending = db.getTasks({ durum: 'bekliyor' });
      const overdue = db.getTasks({ durum: 'gecikti' });
      const inProgress = db.getTasks({ durum: 'devam_ediyor' });
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          gecikmis: overdue,
          devamEden: inProgress,
          bekleyen: pending
        }, null, 2)
      };
    }

    case 'plantrack://mock-exams':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.getMockExams(), null, 2)
      };

    case 'plantrack://mistakes':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.getMistakes(), null, 2)
      };

    case 'plantrack://school-grades':
      return {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(db.getSchoolGrades(), null, 2)
      };

    default:
      throw new Error(`Kaynak bulunamadı: ${uri}`);
  }
}

module.exports = {
  resourcesList,
  readResource
};
