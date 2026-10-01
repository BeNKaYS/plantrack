/**
 * Plantrack — Veri ve Modül Sabitleri
 * Modüler yapı: Ara Sınıf, LGS, YKS
 */

const MODULLER = [
  { id: 'ara-sinif', ad: 'Ara Sınıflar', siniflar: ['5', '6', '7'] },
  { id: 'lgs',       ad: 'LGS Hazırlık', siniflar: ['8'] },
  { id: 'yks',       ad: 'TYT-AYT',      siniflar: ['9', '10', '11', '12', 'mezun'] }
];

const SINIFLAR = [
  { deger: '5',     label: '5. Sınıf',  modulId: 'ara-sinif' },
  { deger: '6',     label: '6. Sınıf',  modulId: 'ara-sinif' },
  { deger: '7',     label: '7. Sınıf',  modulId: 'ara-sinif' },
  { deger: '8',     label: '8. Sınıf',  modulId: 'lgs'       },
  { deger: '9',     label: '9. Sınıf',  modulId: 'yks'       },
  { deger: '10',    label: '10. Sınıf', modulId: 'yks'       },
  { deger: '11',    label: '11. Sınıf', modulId: 'yks'       },
  { deger: '12',    label: '12. Sınıf', modulId: 'yks'       },
  { deger: 'mezun', label: 'Mezun',     modulId: 'yks'       }
];

const DERSLER = [];
const KONULAR = [];
