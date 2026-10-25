/**
 * Plantrack MCP Server — Araç Tanımları & Çalıştırıcı (Tools Definition & Executor)
 * 
 * Toplam 59 resmi Plantrack yönetim ve koçluk aracı.
 */

const toolsList = [
  {
    "name": "plantrack_add_course",
    "description": "Müfredat havuzuna yeni bir ders ekler.",
    "inputSchema": {
      "properties": {
        "ad": {
          "description": "Ders adı",
          "type": "string"
        },
        "haftalikSaat": {
          "description": "Haftalık ders saati",
          "type": "number"
        },
        "ikon": {
          "description": "Lucide ikon adı (örn: calculator, book-open, atom)",
          "type": "string"
        },
        "kisaltma": {
          "description": "Ders kısaltması (en fazla 5 karakter)",
          "type": "string"
        },
        "modulId": {
          "description": "Kademe / Modül ID",
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        },
        "renk": {
          "description": "Renk kodu (blue, rose, emerald, amber, purple, indigo)",
          "type": "string"
        },
        "sinavdaMi": {
          "description": "Merkezi sınavda çıkıyor mu?",
          "type": "boolean"
        },
        "sinif": {
          "description": "Sınıf düzeyi (örn: 5, 6, 7, 8, 9, 10, 11, 12, ortak)",
          "type": "string"
        },
        "soruSayisi": {
          "description": "Sınavdaki soru sayısı",
          "type": "number"
        }
      },
      "required": [
        "modulId",
        "ad"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_mistake",
    "description": "Hata defterine yeni bir soru/konu hatası ekler.",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "description": "Hatanın sebebi ve detayı",
          "type": "string"
        },
        "dersId": {
          "description": "Ders ID",
          "type": "string"
        },
        "hataTuru": {
          "enum": [
            "Bilgi Eksikliği",
            "Dikkat Hatası",
            "Soru Kökü/Anlama",
            "Süre/Yetişmedi"
          ],
          "type": "string"
        },
        "konuId": {
          "description": "Konu ID",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "tekrarTarihi": {
          "description": "Tekrar tarihi (YYYY-MM-DD)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "dersId",
        "hataTuru"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_mock_exam",
    "description": "Sisteme yeni bir deneme sınavı sonucu kaydeder.",
    "inputSchema": {
      "properties": {
        "ad": {
          "description": "Deneme adı (örn: Özdebir LGS Deneme 1)",
          "type": "string"
        },
        "dersler": {
          "description": "Ders netleri dizisi ([{ ders: \"Matematik\", soruSayisi: 20, dogru: 15, yanlis: 3, bos: 2, net: 14 }])",
          "type": "array"
        },
        "konular": {
          "description": "Konu bazlı başarı/hata dökümü (opsiyonel)",
          "type": "array"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "tarih": {
          "description": "Sınav tarihi (YYYY-MM-DD)",
          "type": "string"
        },
        "toplam": {
          "description": "Toplam sınav özeti ({ soruSayisi: 90, dogru: 75, yanlis: 10, bos: 5, net: 71.67 })",
          "type": "object"
        },
        "tur": {
          "description": "LGS, TYT veya AYT",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "ad",
        "tarih"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_resource",
    "description": "Kütüphaneye yeni bir kaynak kitap ekler.",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "type": "string"
        },
        "ad": {
          "description": "Kitap adı",
          "type": "string"
        },
        "modulId": {
          "description": "Geçerli modüller (lgs, yks, ara-sinif)",
          "items": {
            "type": "string"
          },
          "type": "array"
        },
        "tur": {
          "description": "Tür (Soru Bankası, Fasikül, Deneme)",
          "type": "string"
        },
        "yayinevi": {
          "description": "Yayınevi",
          "type": "string"
        },
        "zorluk": {
          "description": "Zorluk seviyesi (1-5)",
          "type": "number"
        }
      },
      "required": [
        "ad",
        "yayinevi"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_school_grade",
    "description": "Öğrenciye yeni bir okul yazılı/sınav notu ekler.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID",
          "type": "string"
        },
        "not": {
          "description": "Alınan puan (0-100)",
          "type": "number"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "sinavAdi": {
          "description": "Sınav adı (örn: 1. Dönem 1. Yazılı)",
          "type": "string"
        },
        "tarih": {
          "description": "Sınav tarihi (YYYY-MM-DD)",
          "type": "string"
        },
        "tur": {
          "description": "Not türü (yazili, performans, proje)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "dersId",
        "not"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_student",
    "description": "Sisteme yeni bir öğrenci ekler.",
    "inputSchema": {
      "properties": {
        "ad": {
          "description": "Öğrenci adı",
          "type": "string"
        },
        "hedef": {
          "description": "Hedef okul veya bölüm (örn: Fen Lisesi, Tıp Fakültesi)",
          "type": "string"
        },
        "ogrenciTel": {
          "description": "Öğrenci telefon numarası",
          "type": "string"
        },
        "okul": {
          "description": "Okul adı",
          "type": "string"
        },
        "renk": {
          "description": "Avatar rengi (rose, blue, emerald, amber, purple, teal)",
          "type": "string"
        },
        "sinif": {
          "description": "Sınıfı (5, 6, 7, 8, 9, 10, 11, 12, mezun)",
          "type": "string"
        },
        "soyad": {
          "description": "Öğrenci soyadı",
          "type": "string"
        },
        "veliAd": {
          "description": "Veli adı ve soyadı",
          "type": "string"
        },
        "veliTel": {
          "description": "Veli telefon numarası",
          "type": "string"
        }
      },
      "required": [
        "ad",
        "soyad",
        "sinif"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_task",
    "description": "Öğrenciye yeni bir ödev veya çalışma görevi atar.",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "description": "Görev açıklaması veya yönergeler",
          "type": "string"
        },
        "baslik": {
          "description": "Görev başlığı",
          "type": "string"
        },
        "deadline": {
          "description": "Son teslim tarihi (YYYY-MM-DD)",
          "type": "string"
        },
        "dersId": {
          "description": "Ders ID (örn: drs-lgs-matematik)",
          "type": "string"
        },
        "hedefSoru": {
          "description": "Hedeflenen soru sayısı",
          "type": "number"
        },
        "kaynakId": {
          "description": "Kaynak kitap ID (opsiyonel)",
          "type": "string"
        },
        "konuId": {
          "description": "Konu ID (opsiyonel)",
          "type": "string"
        },
        "not": {
          "description": "Koç notu",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "baslik"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_add_topic",
    "description": "Bir derse yeni konu/kazanım ekler.",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "description": "Kazanım / açıklama metni",
          "type": "string"
        },
        "dersId": {
          "description": "Ders ID",
          "type": "string"
        },
        "konuAdi": {
          "description": "Konu adı",
          "type": "string"
        },
        "modulId": {
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        },
        "sinif": {
          "type": "string"
        },
        "siraNo": {
          "description": "Sıra numarası",
          "type": "number"
        },
        "uniteAdi": {
          "description": "Ünite adı",
          "type": "string"
        },
        "uniteNo": {
          "description": "Ünite numarası",
          "type": "number"
        }
      },
      "required": [
        "dersId",
        "konuAdi"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_batch_update_schedule",
    "description": "Zaman Bloklama Çizelgesinde seçili gün ve saat aralığını topluca doldurur/temizler, saat penceresini (baslangicSaat/bitisSaat) ayarlar veya örnek rutin (lgs, yks, ara-sinif) uygular.",
    "inputSchema": {
      "properties": {
        "baslangicSaat": {
          "description": "Başlangıç saati (örn: 16:30)",
          "type": "string"
        },
        "bitisSaat": {
          "description": "Bitiş saati (örn: 18:30)",
          "type": "string"
        },
        "data": {
          "description": "Atanacak blok verisi ({ kategori: \"etut\"|\"okul\"|\"mola\"|\"rutin\"|\"uyku\", baslik: \"TYT Matematik\" }) veya silmek için null",
          "type": "object"
        },
        "gunler": {
          "description": "Gün kısaltmaları dizisi ([\"Pzt\", \"Sal\", \"Çar\", \"Per\", \"Cum\", \"Cmt\", \"Paz\"])",
          "items": {
            "type": "string"
          },
          "type": "array"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "ornekRutin": {
          "description": "Kademeye uygun hazır örnek haftalık rutini otomatik uygular",
          "enum": [
            "lgs",
            "yks",
            "ara-sinif"
          ],
          "type": "string"
        },
        "temizle": {
          "description": "True verilirse öğrencinin tüm zaman bloklama tablosunu sıfırlar",
          "type": "boolean"
        },
        "zamanPenceresi": {
          "description": "Çizelge başlangıç/bitiş saat ayarı ({ baslangicSaat: \"07:00\", bitisSaat: \"23:30\" })",
          "type": "object"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_complete_task",
    "description": "Görevi tamamlandı olarak işaretler ve varsa çözülen soru istatistiklerini kaydeder.",
    "inputSchema": {
      "properties": {
        "cozulenSoru": {
          "description": "Çözülen soru sayısı",
          "type": "number"
        },
        "dogruSoru": {
          "description": "Doğru sayısı",
          "type": "number"
        },
        "not": {
          "description": "Tamamlama veya koç değerlendirme notu",
          "type": "string"
        },
        "sureDk": {
          "description": "Harcanan süre (dakika)",
          "type": "number"
        },
        "taskId": {
          "description": "Görev ID",
          "type": "string"
        },
        "yanlisSoru": {
          "description": "Yanlış sayısı",
          "type": "number"
        }
      },
      "required": [
        "taskId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_custom_query",
    "description": "Belirtilen bir koleksiyon üzerinde esnek anahtar-değer filtrelemesi yapar.",
    "inputSchema": {
      "properties": {
        "collection": {
          "description": "Koleksiyon adı (ogrenciler, gorevler, dersler, konular, kaynaklar, denemeSinavlari, sinifNotlari, hataKayitlari)",
          "type": "string"
        },
        "filter": {
          "description": "Filtre koşulları nesnesi (örn: { \"modulId\": \"lgs\" })",
          "type": "object"
        },
        "limit": {
          "description": "Maksimum sonuç sayısı",
          "type": "number"
        }
      },
      "required": [
        "collection"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_course",
    "description": "Dersi ve derse ait alt konuları/kayıtları siler.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID",
          "type": "string"
        }
      },
      "required": [
        "dersId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_mistake",
    "description": "Hata defteri kaydını siler.",
    "inputSchema": {
      "properties": {
        "mistakeId": {
          "description": "Hata kaydı ID",
          "type": "string"
        }
      },
      "required": [
        "mistakeId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_mock_exam",
    "description": "Kayıtlı bir deneme sınavı sonucunu siler.",
    "inputSchema": {
      "properties": {
        "examId": {
          "description": "Deneme sınavı ID",
          "type": "string"
        }
      },
      "required": [
        "examId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_resource",
    "description": "Kütüphaneden bir kaynak kitabı siler.",
    "inputSchema": {
      "properties": {
        "resourceId": {
          "description": "Kaynak ID",
          "type": "string"
        }
      },
      "required": [
        "resourceId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_school_grade",
    "description": "Bir okul yazılı/sınav notunu siler.",
    "inputSchema": {
      "properties": {
        "gradeId": {
          "description": "Sınav notu ID",
          "type": "string"
        }
      },
      "required": [
        "gradeId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_student",
    "description": "Öğrenciyi ve öğrenciye bağlı tüm görevleri, denemeleri, konu ilerlemelerini ve alışkanlık kayıtlarını güvenle siler.",
    "inputSchema": {
      "properties": {
        "ogrenciId": {
          "description": "Silinecek öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_task",
    "description": "Görevi siler.",
    "inputSchema": {
      "properties": {
        "taskId": {
          "description": "Görev ID",
          "type": "string"
        }
      },
      "required": [
        "taskId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_delete_topic",
    "description": "Müfredattan bir konuyu siler.",
    "inputSchema": {
      "properties": {
        "konuId": {
          "description": "Konu ID",
          "type": "string"
        }
      },
      "required": [
        "konuId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_export_backup",
    "description": "Veritabanının tam bir JSON yedeğini jYedek/ klasörüne kaydeder (Plantrack arayüzündeki \"Yedek Yükle\" ile %100 uyumludur).",
    "inputSchema": {
      "properties": {
        "dosyaAdi": {
          "description": "Yedek dosya adı (opsiyonel)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_chart_summary",
    "description": "Çizelge Robotundaki 5 şablondan (zaman-blok, odev-takip, konu-takip, konu-soru, aliskanlik) herhangi birinin tüm verilerini tek seferde getirir.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID (konu-takip, konu-soru ve odev-takip için opsiyonel)",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "sablon": {
          "description": "Çizelge şablon türü",
          "enum": [
            "zaman-blok",
            "odev-takip",
            "konu-takip",
            "konu-soru",
            "aliskanlik"
          ],
          "type": "string"
        },
        "yilAy": {
          "description": "Yıl-Ay (aliskanlik çizelgesi için, örn: 2026-10)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "sablon"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_coach_profile",
    "description": "Eğitim koçunun profil bilgilerini (ad, soyad, unvan, kurum, telefon) getirir.",
    "inputSchema": {
      "properties": {},
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_course",
    "description": "Belirli bir dersin detaylarını (haftalık saat, sınav soru sayısı, renk, ikon vb.) getirir.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID (örn: drs-1790977048331-lpqp)",
          "type": "string"
        }
      },
      "required": [
        "dersId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_mock_exam_detail",
    "description": "Deneme sınavının derinlemesine analizini getirir: ders bazlı netler, kurum ortalamaları ve kazanım/konu bazlı yanlış dökümü.",
    "inputSchema": {
      "properties": {
        "examId": {
          "description": "Deneme sınavı ID",
          "type": "string"
        }
      },
      "required": [
        "examId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_question_tracking",
    "description": "Öğrencinin Konu & Soru Çizelgesi kayıtlarını (ders/konu bazında doğru, yanlış, boş, toplam soru ve koç çizelge notları) getirir.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID filtresi (opsiyonel)",
          "type": "string"
        },
        "donem": {
          "description": "Dönem filtresi (örn: genel veya 2026-10)",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_raw_data",
    "description": "Veritabanının ham JSON içeriğini veya belirtilen koleksiyonu (ogrenciler, gorevler, sinavlar, kocProfili vb.) getirir.",
    "inputSchema": {
      "properties": {
        "collectionKey": {
          "description": "Koleksiyon anahtarı (boş bırakılırsa tüm veritabanı döner)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_resource",
    "description": "Belirli bir kaynağın detaylarını getirir.",
    "inputSchema": {
      "properties": {
        "resourceId": {
          "description": "Kaynak ID (örn: kyn-1)",
          "type": "string"
        }
      },
      "required": [
        "resourceId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_student",
    "description": "Belirli bir öğrencinin detaylı profilini ve özet istatistiklerini (görev, deneme, konu ilerleme ve alışkanlık sayıları) getirir.",
    "inputSchema": {
      "properties": {
        "ogrenciId": {
          "description": "Öğrenci ID veya öğrenci ad/soyadı (örn: ogr-1790888129552 veya \"Ayşe\")",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_student_habits",
    "description": "Öğrencinin alışkanlık zincirlerini (6 alışkanlık), günlük tamamlama kayıtlarını, ay sonu özetini ve koç notlarını getirir.",
    "inputSchema": {
      "properties": {
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "yilAy": {
          "description": "Yıl-Ay filtresi (örn: 2026-10, opsiyonel)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_student_schedule",
    "description": "Öğrencinin haftalık zaman bloklama programını (okul, etüt, soru çözümü, mola, uyku saatleri), zaman penceresi ayarlarını ve kategori özetini getirir.",
    "inputSchema": {
      "properties": {
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_task",
    "description": "Belirli bir görevin detaylarını (soru hedefleri, süre, koç notu vb.) getirir.",
    "inputSchema": {
      "properties": {
        "taskId": {
          "description": "Görev ID (örn: grv-1790888129552)",
          "type": "string"
        }
      },
      "required": [
        "taskId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_topic",
    "description": "Belirli bir konunun ve kazanım açıklamasının detaylarını getirir.",
    "inputSchema": {
      "properties": {
        "konuId": {
          "description": "Konu ID (örn: kon-lgs-mat-1)",
          "type": "string"
        }
      },
      "required": [
        "konuId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_get_topic_progress",
    "description": "Öğrencinin müfredat konularındaki ilerleme matrisini ve başarı yüzdesini getirir (tamamlanan, çalışılan, işlenmeyen konular).",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID (opsiyonel, boş bırakılırsa tüm dersler)",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_courses",
    "description": "Tüm dersleri listeler. Modüle, sınıfa veya arama kelimesine göre filtrelenebilir.",
    "inputSchema": {
      "properties": {
        "modulId": {
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        },
        "search": {
          "description": "Ders adı veya kısaltması arama",
          "type": "string"
        },
        "sinif": {
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_exams",
    "description": "Sınav havuzundaki merkezi sınav şablonlarını (LGS, TYT, AYT vb.) listeler.",
    "inputSchema": {
      "properties": {
        "modulId": {
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_mistakes",
    "description": "Öğrencilerin hata defteri kayıtlarını listeler. Hata türüne (Bilgi Eksikliği, Dikkat Hatası vb.) ve telafi durumuna göre filtrelenebilir.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "type": "string"
        },
        "hataTuru": {
          "enum": [
            "Bilgi Eksikliği",
            "Dikkat Hatası",
            "Soru Kökü/Anlama",
            "Süre/Yetişmedi"
          ],
          "type": "string"
        },
        "ogrenciId": {
          "type": "string"
        },
        "telafiDurumu": {
          "description": "Telafi edildi mi? (true/false)",
          "type": "boolean"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_mock_exams",
    "description": "Öğrencinin girmiş olduğu deneme sınavlarını ve net sonuçlarını listeler.",
    "inputSchema": {
      "properties": {
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "tur": {
          "description": "Sınav türü (LGS, TYT, AYT)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_modules_and_classes",
    "description": "Sistemdeki eğitim modüllerini (Ara Sınıflar, LGS, YKS) ve sınıfları getirir.",
    "inputSchema": {
      "properties": {},
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_resources",
    "description": "Kütüphanedeki yayın ve kaynak kitapları listeler. Yayınevi, tür veya arama metnine göre filtrelenebilir.",
    "inputSchema": {
      "properties": {
        "modulId": {
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        },
        "search": {
          "description": "Kitap veya yayınevi adı arama",
          "type": "string"
        },
        "tur": {
          "description": "Tür filtresi (Soru Bankası, Fasikül, Deneme)",
          "type": "string"
        },
        "yayinEvi": {
          "description": "Yayınevi filtresi (örn: Bilgi Sarmal, MEB, Hız)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_school_grades",
    "description": "Öğrencinin okul yazılı ve sınav notlarını (sinifNotlari) ve genel ortalamasını listeler.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID (opsiyonel)",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID (opsiyonel)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_students",
    "description": "Kayıtlı öğrencileri listeler. Modüle, sınıfa veya arama kelimesine göre filtrelenebilir.",
    "inputSchema": {
      "properties": {
        "modulId": {
          "description": "Eğitim modülü filtresi",
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        },
        "search": {
          "description": "Öğrenci adı, okul veya hedef arama metni",
          "type": "string"
        },
        "sinif": {
          "description": "Sınıf filtresi (5, 6, 7, 8, 9, 10, 11, 12, mezun)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_tasks",
    "description": "Ödev ve çalışma görevlerini listeler. Öğrenciye, duruma, derse göre filtrelenebilir.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID filtresi",
          "type": "string"
        },
        "durum": {
          "description": "Görev durumu",
          "enum": [
            "bekliyor",
            "devam_ediyor",
            "tamamlandi",
            "gecikti"
          ],
          "type": "string"
        },
        "konuId": {
          "description": "Konu ID filtresi",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID filtresi",
          "type": "string"
        },
        "search": {
          "description": "Görev başlığı veya açıklamasında arama",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_list_topics",
    "description": "MEB ve ÖSYM müfredatındaki konuları listeler veya arar (çarpanlar, üslü ifadeler, trigonometri vb.).",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Belirli bir derse ait konuları filtreleme",
          "type": "string"
        },
        "limit": {
          "description": "Maksimum sonuç sayısı (varsayılan 100)",
          "type": "number"
        },
        "modulId": {
          "enum": [
            "ara-sinif",
            "lgs",
            "yks"
          ],
          "type": "string"
        },
        "search": {
          "description": "Konu adı, ünite adı veya açıklama arama metni",
          "type": "string"
        },
        "sinif": {
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_log_habit_activity",
    "description": "Öğrencinin belirli bir gündeki alışkanlık aktivitesini kaydeder veya günceller.",
    "inputSchema": {
      "properties": {
        "aliskanlikId": {
          "description": "Alışkanlık ID (örn: al-1 .. al-6)",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "tamamlandi": {
          "description": "Tamamlandı mı? (true/false)",
          "type": "boolean"
        },
        "tarih": {
          "description": "Tarih (YYYY-MM-DD)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "aliskanlikId",
        "tarih"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_overview",
    "description": "Plantrack sisteminin genel durumunu, koç profilini, toplam öğrenci, görev, ders, konu, deneme ve kaynak istatistiklerini getirir.",
    "inputSchema": {
      "properties": {},
      "type": "object"
    }
  },
  {
    "name": "plantrack_record_question_count",
    "description": "Konu & Soru Çizelgesine bir konu ve tur (1., 2., 3. Tur) için çözülen soru sayılarını kaydeder.",
    "inputSchema": {
      "properties": {
        "bos": {
          "description": "Boş sayısı",
          "type": "number"
        },
        "dogru": {
          "description": "Doğru sayısı",
          "type": "number"
        },
        "donem": {
          "description": "Dönem kodu (varsayılan: \"genel\")",
          "type": "string"
        },
        "hafta": {
          "description": "Tur numarası veya hafta kodu (örn: \"1\", \"2\", \"3\")",
          "type": "string"
        },
        "konuId": {
          "description": "Konu ID",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "toplam": {
          "description": "Toplam soru sayısı (opsiyonel)",
          "type": "number"
        },
        "yanlis": {
          "description": "Yanlış sayısı",
          "type": "number"
        }
      },
      "required": [
        "ogrenciId",
        "konuId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_chart_note",
    "description": "Konu & Soru veya Konu Takip Çizelgesinin altındaki ders bazlı koç değerlendirme notunu (cizelgeNotlari) günceller.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "description": "Ders ID",
          "type": "string"
        },
        "not": {
          "description": "Çizelge altındaki koç değerlendirme notu",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "dersId",
        "not"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_coach_profile",
    "description": "Eğitim koçunun profil bilgilerini günceller.",
    "inputSchema": {
      "properties": {
        "ad": {
          "description": "Koç adı",
          "type": "string"
        },
        "kurum": {
          "description": "Kurum adı",
          "type": "string"
        },
        "soyad": {
          "description": "Koç soyadı",
          "type": "string"
        },
        "telefon": {
          "description": "İletişim numarası",
          "type": "string"
        },
        "unvan": {
          "description": "Unvan (örn: Eğitim Koçu & Danışman)",
          "type": "string"
        }
      },
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_course",
    "description": "Mevcut bir dersin bilgilerini günceller.",
    "inputSchema": {
      "properties": {
        "ad": {
          "type": "string"
        },
        "dersId": {
          "description": "Ders ID",
          "type": "string"
        },
        "haftalikSaat": {
          "type": "number"
        },
        "ikon": {
          "type": "string"
        },
        "kisaltma": {
          "type": "string"
        },
        "renk": {
          "type": "string"
        },
        "sinavdaMi": {
          "type": "boolean"
        },
        "sinif": {
          "type": "string"
        },
        "soruSayisi": {
          "type": "number"
        }
      },
      "required": [
        "dersId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_habit_month_end",
    "description": "Alışkanlık Çizelgesi altındaki Ay Sonu Değerlendirme tablosunu (gün sayısı, alışkanlık notu) ve genel koç ay notunu günceller.",
    "inputSchema": {
      "properties": {
        "aliskanlikNo": {
          "description": "Alışkanlık sıra numarası (1-6, opsiyonel)",
          "type": "number"
        },
        "genelAyNotu": {
          "description": "Genel aylık koç değerlendirme notu (opsiyonel)",
          "type": "string"
        },
        "gunSayisi": {
          "description": "Ay sonu tamamlanan gün sayısı (opsiyonel)",
          "type": "string"
        },
        "not": {
          "description": "İlgili alışkanlık için koç değerlendirme notu (opsiyonel)",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "yilAy": {
          "description": "Yıl ve Ay (örn: 2026-10)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "yilAy"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_mistake",
    "description": "Hata defteri kaydını günceller (telafi edildi olarak işaretleme vb.).",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "type": "string"
        },
        "asama": {
          "description": "Tekrar aşaması (1, 2, 3)",
          "type": "number"
        },
        "mistakeId": {
          "description": "Hata kaydı ID",
          "type": "string"
        },
        "telafiDurumu": {
          "description": "Telafi tamamlandı mı?",
          "type": "boolean"
        }
      },
      "required": [
        "mistakeId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_resource",
    "description": "Kütüphanedeki bir kaynak kitabın bilgilerini günceller.",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "type": "string"
        },
        "ad": {
          "type": "string"
        },
        "resourceId": {
          "description": "Kaynak ID",
          "type": "string"
        },
        "tur": {
          "type": "string"
        },
        "yayinevi": {
          "type": "string"
        },
        "zorluk": {
          "type": "number"
        }
      },
      "required": [
        "resourceId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_school_grade",
    "description": "Mevcut bir okul yazılı/sınav notunu günceller.",
    "inputSchema": {
      "properties": {
        "dersId": {
          "type": "string"
        },
        "gradeId": {
          "description": "Sınav notu ID (not-...)",
          "type": "string"
        },
        "not": {
          "type": "number"
        },
        "sinavAdi": {
          "type": "string"
        },
        "tarih": {
          "type": "string"
        }
      },
      "required": [
        "gradeId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_student",
    "description": "Mevcut bir öğrencinin bilgilerini günceller.",
    "inputSchema": {
      "properties": {
        "ad": {
          "type": "string"
        },
        "hedef": {
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "ogrenciTel": {
          "type": "string"
        },
        "okul": {
          "type": "string"
        },
        "renk": {
          "type": "string"
        },
        "sinif": {
          "type": "string"
        },
        "soyad": {
          "type": "string"
        },
        "veliAd": {
          "type": "string"
        },
        "veliTel": {
          "type": "string"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_student_habits",
    "description": "Öğrencinin 6 alışkanlık zinciri maddesini özelleştirir veya kademe varsayılanlarına sıfırlar.",
    "inputSchema": {
      "properties": {
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "sifirla": {
          "description": "True verilirse kademeye özel 6 varsayılan alışkanlığa sıfırlar",
          "type": "boolean"
        },
        "zincirler": {
          "description": "Alışkanlık listesi ([{ baslik: \"Günde 30 Paragraf\", renk: \"rose\" }, ...])",
          "type": "array"
        }
      },
      "required": [
        "ogrenciId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_student_schedule",
    "description": "Öğrencinin programında tek bir 30 dakikalık zaman bloğunu günceller veya temizler.",
    "inputSchema": {
      "properties": {
        "data": {
          "description": "Faaliyet bilgisi ({ kategori: \"etut\"|\"okul\"|\"mola\"|\"rutin\"|\"uyku\", baslik: \"Matematik Etüdü\" }) veya temizlemek için null",
          "type": "object"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        },
        "slotKey": {
          "description": "Saat dilimi anahtarı (örn: Pzt_08:00, Sal_17:30)",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "slotKey"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_task",
    "description": "Görevi günceller (soru sayıları, süre, durum, not vb.).",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "type": "string"
        },
        "baslik": {
          "type": "string"
        },
        "cozulenSoru": {
          "type": "number"
        },
        "deadline": {
          "type": "string"
        },
        "dogruSoru": {
          "type": "number"
        },
        "durum": {
          "enum": [
            "bekliyor",
            "devam_ediyor",
            "tamamlandi",
            "gecikti"
          ],
          "type": "string"
        },
        "hedefSoru": {
          "type": "number"
        },
        "not": {
          "type": "string"
        },
        "sureDk": {
          "description": "Çalışma süresi (dakika)",
          "type": "number"
        },
        "taskId": {
          "description": "Görev ID",
          "type": "string"
        },
        "yanlisSoru": {
          "type": "number"
        }
      },
      "required": [
        "taskId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_topic",
    "description": "Mevcut bir konunun bilgilerini günceller.",
    "inputSchema": {
      "properties": {
        "aciklama": {
          "type": "string"
        },
        "konuAdi": {
          "type": "string"
        },
        "konuId": {
          "description": "Konu ID",
          "type": "string"
        },
        "siraNo": {
          "type": "number"
        },
        "uniteAdi": {
          "type": "string"
        },
        "uniteNo": {
          "type": "number"
        }
      },
      "required": [
        "konuId"
      ],
      "type": "object"
    }
  },
  {
    "name": "plantrack_update_topic_status",
    "description": "Öğrencinin bir konudaki durumunu günceller (tamam, calisiliyor, islenmedi, tekrar_lazim) ve koç notu ekler.",
    "inputSchema": {
      "properties": {
        "durum": {
          "description": "Yeni konu durumu",
          "enum": [
            "islenmedi",
            "calisiliyor",
            "tamam",
            "tekrar_lazim"
          ],
          "type": "string"
        },
        "konuId": {
          "description": "Konu ID",
          "type": "string"
        },
        "not": {
          "description": "Koç değerlendirme notu",
          "type": "string"
        },
        "ogrenciId": {
          "description": "Öğrenci ID",
          "type": "string"
        }
      },
      "required": [
        "ogrenciId",
        "konuId",
        "durum"
      ],
      "type": "object"
    }
  }
];

// ─────────────────────────────────────────────────────────────
// ŞEMA TAMAMLAYICILARI
// validate.js'in kabul ettiği alanlar LLM'e de görünsün; aksi hâlde model
// doğru alanı bilmediği için veriyi yanlış anahtarla gönderiyor.
// ─────────────────────────────────────────────────────────────
(function semalariTamamla() {
  const bul = (name) => toolsList.find(t => t.name === name);
  const ekle = (name, props) => {
    const tool = bul(name);
    if (!tool) return;
    tool.inputSchema.properties = Object.assign(tool.inputSchema.properties || {}, props);
  };
  const metin = (description) => ({ type: 'string', description });
  const sayi = (description) => ({ type: 'number', description });

  ekle('plantrack_add_student', {
    adSoyad: metin('Ad ve soyad birlikte (ad/soyad yerine kullanılabilir)'),
    modulId: { type: 'string', enum: ['ara-sinif', 'lgs', 'yks'], description: 'Kademe; verilmezse sınıftan türetilir' }
  });
  ekle('plantrack_update_student', {
    modulId: { type: 'string', enum: ['ara-sinif', 'lgs', 'yks'], description: 'Kademe' }
  });
  ekle('plantrack_add_task', {
    durum: { type: 'string', enum: ['bekliyor', 'devam_ediyor', 'tamamlandi', 'gecikti'], description: 'Görev durumu (varsayılan: bekliyor)' }
  });
  ekle('plantrack_add_topic', {
    kazanimlar: { type: 'array', items: { type: 'string' }, description: 'MEB/ÖSYM kazanım cümleleri' }
  });
  ekle('plantrack_update_topic', {
    kazanimlar: { type: 'array', items: { type: 'string' }, description: 'MEB/ÖSYM kazanım cümleleri' }
  });
  ekle('plantrack_add_resource', {
    dersId: metin('Kaynağın bağlı olduğu ders ID/adı (kütüphane ders filtresi için)')
  });
  ekle('plantrack_update_resource', {
    dersId: metin('Kaynağın bağlı olduğu ders ID/adı'),
    modulId: { type: 'array', items: { type: 'string' }, description: 'Geçerli modüller (lgs, yks, ara-sinif)' }
  });
  ekle('plantrack_add_mock_exam', {
    sinavAdi: metin('Deneme adı ("ad" ile aynı)'),
    toplam: {
      type: 'object',
      description: 'Toplam satırı; verilmezse derslerden hesaplanır',
      properties: {
        soruSayisi: { type: 'number' }, dogru: { type: 'number' }, yanlis: { type: 'number' },
        bos: { type: 'number' }, net: { type: 'number' }, basariYuzde: { type: 'number' },
        kurumNetOrt: { type: 'number' }, sinavNetOrt: { type: 'number' }
      }
    }
  });
  ekle('plantrack_record_question_count', {
    yilAy: metin('Dönem (YYYY-MM). "donem" yerine kullanılabilir'),
    tur: metin('Tur numarası: 1, 2, 3 ("hafta" yerine kullanılabilir)')
  });
  ekle('plantrack_get_question_tracking', {
    yilAy: metin('Dönem filtresi (YYYY-MM)')
  });
  ekle('plantrack_update_habit_month_end', {
    aliskanlikId: metin('Alışkanlık ID (örn: al-1). "aliskanlikNo" yerine kullanılabilir')
  });

  // Şema tipi düzeltmeleri (eski şemada sayı alanı string tanımlıydı)
  const tipDuzelt = (name, key, type) => {
    const tool = bul(name);
    if (tool && tool.inputSchema.properties && tool.inputSchema.properties[key]) {
      tool.inputSchema.properties[key].type = type;
    }
  };
  tipDuzelt('plantrack_update_habit_month_end', 'gunSayisi', 'number');
  tipDuzelt('plantrack_record_question_count', 'hafta', 'string');
  ekle('plantrack_update_topic_status', {
    dersId: metin('Konunun dersi (aynı adlı konuları ayırmak için)')
  });
  ekle('plantrack_update_coach_profile', {
    avatarKisa: metin('Avatar kısaltması (en fazla 4 karakter)')
  });

  // hata türü enum'u uygulamada kullanılan "Deneme Yanlışı" değerini de kapsasın
  ['plantrack_add_mistake', 'plantrack_update_mistake'].forEach(name => {
    const tool = bul(name);
    const prop = tool && tool.inputSchema.properties && tool.inputSchema.properties.hataTuru;
    if (prop && Array.isArray(prop.enum) && !prop.enum.includes('Deneme Yanlışı')) {
      prop.enum.push('Deneme Yanlışı');
    }
  });
})();

async function executeTool(db, name, args = {}) {
  try {
    switch (name) {
      // 1. Genel & Koç Profili
      case 'plantrack_overview':
        return db.getOverview();
      case 'plantrack_get_coach_profile':
        return db.getCoachProfile();
      case 'plantrack_update_coach_profile':
        return db.updateCoachProfile(args);

      // 2. Öğrenciler
      case 'plantrack_list_students':
        return db.getStudents(args);
      case 'plantrack_get_student': {
        const student = db.getStudent(args.ogrenciId);
        if (!student) throw new Error(`Öğrenci bulunamadı: ${args.ogrenciId}`);
        return student;
      }
      case 'plantrack_add_student':
        return db.addStudent(args);
      case 'plantrack_update_student': {
        const updated = db.updateStudent(args.ogrenciId, args);
        if (!updated) throw new Error(`Öğrenci bulunamadı: ${args.ogrenciId}`);
        return updated;
      }
      case 'plantrack_delete_student': {
        const deleted = db.deleteStudent(args.ogrenciId);
        if (!deleted) throw new Error(`Öğrenci bulunamadı: ${args.ogrenciId}`);
        return { basarili: true, mesaj: `Öğrenci ve ilişkili tüm kayıtlar silindi: ${args.ogrenciId}` };
      }

      // 3. Görevler
      case 'plantrack_list_tasks':
        return db.getTasks(args);
      case 'plantrack_get_task': {
        const task = db.getTask(args.taskId);
        if (!task) throw new Error(`Görev bulunamadı: ${args.taskId}`);
        return task;
      }
      case 'plantrack_add_task':
        return db.addTask(args);
      case 'plantrack_update_task': {
        const updated = db.updateTask(args.taskId, args);
        if (!updated) throw new Error(`Görev bulunamadı: ${args.taskId}`);
        return updated;
      }
      case 'plantrack_complete_task': {
        const completed = db.completeTask(args.taskId, args);
        if (!completed) throw new Error(`Görev bulunamadı: ${args.taskId}`);
        return completed;
      }
      case 'plantrack_delete_task': {
        const deleted = db.deleteTask(args.taskId);
        if (!deleted) throw new Error(`Görev bulunamadı: ${args.taskId}`);
        return { basarili: true, mesaj: `Görev silindi: ${args.taskId}` };
      }

      // 4. Müfredat Dersler & Konular
      case 'plantrack_list_modules_and_classes':
        return db.getModulesAndClasses();
      case 'plantrack_list_courses':
        return db.getCourses(args);
      case 'plantrack_get_course': {
        const course = db.getCourse(args.dersId);
        if (!course) throw new Error(`Ders bulunamadı: ${args.dersId}`);
        return course;
      }
      case 'plantrack_add_course':
        return db.addCourse(args);
      case 'plantrack_update_course': {
        const updated = db.updateCourse(args.dersId, args);
        if (!updated) throw new Error(`Ders bulunamadı: ${args.dersId}`);
        return updated;
      }
      case 'plantrack_delete_course': {
        const deleted = db.deleteCourse(args.dersId);
        if (!deleted) throw new Error(`Ders bulunamadı: ${args.dersId}`);
        return { basarili: true, mesaj: `Ders ve ilişkili müfredat/kayıtlar silindi: ${args.dersId}` };
      }
      case 'plantrack_list_topics':
        return db.getTopics(args);
      case 'plantrack_get_topic': {
        const topic = db.getTopic(args.konuId);
        if (!topic) throw new Error(`Konu bulunamadı: ${args.konuId}`);
        return topic;
      }
      case 'plantrack_add_topic':
        return db.addTopic(args);
      case 'plantrack_update_topic': {
        const updated = db.updateTopic(args.konuId, args);
        if (!updated) throw new Error(`Konu bulunamadı: ${args.konuId}`);
        return updated;
      }
      case 'plantrack_delete_topic': {
        const deleted = db.deleteTopic(args.konuId);
        if (!deleted) throw new Error(`Konu bulunamadı: ${args.konuId}`);
        return { basarili: true, mesaj: `Konu silindi: ${args.konuId}` };
      }

      // 5. Konu Takip & Matris
      case 'plantrack_get_topic_progress': {
        const progress = db.getStudentTopicProgress(args);
        if (!progress) throw new Error(`Öğrenci ID belirtilmedi: ${args.ogrenciId}`);
        return progress;
      }
      case 'plantrack_update_topic_status': {
        const res = db.updateStudentTopicStatus(args);
        if (!res) throw new Error(`Konu durumu güncellenemedi: ${args.ogrenciId} - ${args.konuId}`);
        return res;
      }

      // 6. Hata Defteri
      case 'plantrack_list_mistakes':
        return db.getMistakes(args);
      case 'plantrack_add_mistake':
        return db.addMistake(args);
      case 'plantrack_update_mistake': {
        const updated = db.updateMistake(args.mistakeId, args);
        if (!updated) throw new Error(`Hata kaydı bulunamadı: ${args.mistakeId}`);
        return updated;
      }
      case 'plantrack_delete_mistake': {
        const deleted = db.deleteMistake(args.mistakeId);
        if (!deleted) throw new Error(`Hata kaydı bulunamadı: ${args.mistakeId}`);
        return { basarili: true, mesaj: `Hata kaydı silindi: ${args.mistakeId}` };
      }

      // 7. Deneme Sınavları & Merkezi Sınav Şablonları
      case 'plantrack_list_mock_exams':
        return db.getMockExams(args);
      case 'plantrack_get_mock_exam_detail': {
        const exam = db.getMockExam(args.examId);
        if (!exam) throw new Error(`Deneme sınavı bulunamadı: ${args.examId}`);
        return exam;
      }
      case 'plantrack_add_mock_exam':
        return db.addMockExam(args);
      case 'plantrack_delete_mock_exam': {
        const deleted = db.deleteMockExam(args.examId);
        if (!deleted) throw new Error(`Deneme sınavı bulunamadı: ${args.examId}`);
        return { basarili: true, mesaj: `Deneme sınavı silindi: ${args.examId}` };
      }
      case 'plantrack_list_exams':
        return db.getExams(args.modulId);

      // 8. Kaynak & Kütüphane
      case 'plantrack_list_resources':
        return db.getResources(args);
      case 'plantrack_get_resource': {
        const res = db.getResource(args.resourceId);
        if (!res) throw new Error(`Kaynak bulunamadı: ${args.resourceId}`);
        return res;
      }
      case 'plantrack_add_resource':
        return db.addResource(args);
      case 'plantrack_update_resource': {
        const updated = db.updateResource(args.resourceId, args);
        if (!updated) throw new Error(`Kaynak bulunamadı: ${args.resourceId}`);
        return updated;
      }
      case 'plantrack_delete_resource': {
        const deleted = db.deleteResource(args.resourceId);
        if (!deleted) throw new Error(`Kaynak bulunamadı: ${args.resourceId}`);
        return { basarili: true, mesaj: `Kaynak silindi: ${args.resourceId}` };
      }

      // 9. Okul Yazılı & Sınav Notları (Grades)
      case 'plantrack_list_school_grades':
        return db.getSchoolGrades(args);
      case 'plantrack_add_school_grade':
        return db.addSchoolGrade(args);
      case 'plantrack_update_school_grade': {
        const updated = db.updateSchoolGrade(args.gradeId, args);
        if (!updated) throw new Error(`Sınav notu bulunamadı: ${args.gradeId}`);
        return updated;
      }
      case 'plantrack_delete_school_grade': {
        const deleted = db.deleteSchoolGrade(args.gradeId);
        if (!deleted) throw new Error(`Sınav notu bulunamadı: ${args.gradeId}`);
        return { basarili: true, mesaj: `Sınav notu silindi: ${args.gradeId}` };
      }

      // 10. Alışkanlıklar & Ay Sonu Değerlendirme
      case 'plantrack_get_student_habits': {
        const habits = db.getStudentHabits(args.ogrenciId);
        if (!habits) throw new Error(`Öğrenci bulunamadı: ${args.ogrenciId}`);
        return habits;
      }
      case 'plantrack_update_student_habits':
        return db.updateStudentHabits(args);
      case 'plantrack_log_habit_activity':
        return db.logHabitActivity(args);
      case 'plantrack_update_habit_month_end':
        return db.updateHabitMonthEnd(args);

      // 11. Zaman Bloklama & Çizelgeler
      case 'plantrack_get_student_schedule': {
        const schedule = db.getStudentSchedule(args.ogrenciId);
        if (!schedule) throw new Error(`Öğrenci bulunamadı: ${args.ogrenciId}`);
        return schedule;
      }
      case 'plantrack_update_student_schedule':
        return db.updateStudentSchedule(args);
      case 'plantrack_batch_update_schedule':
        return db.batchUpdateSchedule(args);
      case 'plantrack_get_chart_summary':
        return db.getChartSummary(args);
      case 'plantrack_update_chart_note':
        return db.updateChartNote(args);

      // 12. Soru Takibi
      case 'plantrack_get_question_tracking': {
        const records = db.getQuestionTracking(args);
        if (!records) throw new Error(`Öğrenci bulunamadı: ${args.ogrenciId}`);
        return records;
      }
      case 'plantrack_record_question_count':
        return db.recordQuestionCount(args);

      // 13. Yedekleme & Genel Sorgu
      case 'plantrack_export_backup':
        return db.exportBackup(args.dosyaAdi);
      case 'plantrack_get_raw_data':
        return db.getRawData(args.collectionKey);
      case 'plantrack_custom_query':
        return db.customQuery(args);

      default:
        throw new Error(`Bilinmeyen araç: ${name}`);
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  toolsList,
  executeTool
};
