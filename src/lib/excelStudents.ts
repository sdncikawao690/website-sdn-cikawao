import * as XLSX from 'xlsx';
import {
  ROMBEL_LIST,
  type CapaianP5,
  type RombelName,
  type StudentRecord,
} from '../types/school';
import { clampNumber, clampString, normalizeNik } from './validation';

export type StudentImportRow = Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>;

export interface ParsedExcelResult {
  rows: StudentImportRow[];
  warnings: string[];
  sheetName: string;
}

const CAPAIAN_LIST: CapaianP5[] = [
  'Mulai Berkembang',
  'Sedang Berkembang',
  'Berkembang Sesuai Harapan',
  'Sangat Berkembang',
];

function normalizeHeader(h: unknown): string {
  return String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function normalizeRombel(val: unknown): RombelName {
  const raw = String(val ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
  if (!raw) return 'Kelas 1';

  const romanMap: Record<string, RombelName> = {
    i: 'Kelas 1',
    ii: 'Kelas 2',
    iii: 'Kelas 3',
    iv: 'Kelas 4',
    v: 'Kelas 5',
    vi: 'Kelas 6',
  };
  const stripped = raw.replace(/^kelas|^rombel|^kls/, '');
  if (romanMap[stripped]) return romanMap[stripped];

  for (const r of ROMBEL_LIST) {
    const num = r.replace('Kelas ', '');
    if (stripped.startsWith(num) || raw.includes(`kelas${num}`)) {
      return r;
    }
  }
  return 'Kelas 1';
}

function normalizeGender(val: unknown): 'L' | 'P' {
  const raw = String(val ?? '')
    .trim()
    .toLowerCase();
  if (raw.startsWith('p') || raw.includes('perempuan') || raw.includes('wanita') || raw === 'f') {
    return 'P';
  }
  return 'L';
}

function normalizeNisn(val: unknown, rowNumber: number): string {
  const cleaned = String(val ?? '')
    .trim()
    .replace(/[^0-9a-zA-Z-]/g, '');
  if (cleaned.length >= 4 && cleaned.length <= 20) {
    return cleaned;
  }
  return `PD${String(rowNumber).padStart(4, '0')}`;
}

function normalizeCapaianP5(val: unknown): CapaianP5 {
  const raw = String(val ?? '')
    .trim()
    .toLowerCase();
  const matched = CAPAIAN_LIST.find((c) => c.toLowerCase() === raw);
  if (matched) return matched;
  if (raw.includes('sangat')) return 'Sangat Berkembang';
  if (raw.includes('sedang')) return 'Sedang Berkembang';
  if (raw.includes('mulai')) return 'Mulai Berkembang';
  return 'Berkembang Sesuai Harapan';
}

function parsePercentOrScore(val: unknown, fallback: number): number {
  if (val === undefined || val === null || String(val).trim() === '') {
    return fallback;
  }
  const num = Number(String(val).replace('%', '').replace(',', '.').trim());
  if (Number.isNaN(num)) return fallback;
  return clampNumber(num, 0, 100);
}

export async function parseStudentsExcelFile(
  file: File,
  defaultTeacherEmail: string,
  defaultUpdatedBy: string
): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new Error('File Excel kosong.');
  }

  // Locate header row within first 8 rows
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(8, matrix.length); i++) {
    const row = matrix[i] || [];
    const normalized = row.map(normalizeHeader);
    const hasName = normalized.some((h) =>
      ['nama', 'namalengkap', 'namasiswa', 'namapd', 'namapesertadidik', 'pesertadidik'].includes(h)
    );
    const hasNisn = normalized.some((h) => ['nisn', 'nipd', 'nis'].includes(h));
    if (hasName || hasNisn) {
      headerRowIdx = i;
      break;
    }
  }

  const headers = (matrix[headerRowIdx] || []).map(normalizeHeader);

  const findCol = (aliases: string[]): number => {
    for (const alias of aliases) {
      const idx = headers.findIndex((h) => h === alias || h.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colNisn = findCol(['nisn', 'nipd', 'nis']);
  const colNik = findCol([
    'nik',
    'niksiswa',
    'nikpd',
    'nomorindukkependudukan',
    'noktp',
  ]);
  const colName = findCol([
    'namalengkap',
    'namasiswa',
    'namapd',
    'namapesertadidik',
    'pesertadidik',
    'nama',
  ]);
  const colRombel = findCol(['rombel', 'kelas', 'tingkat', 'rombonganbelajar']);
  const colGender = findCol(['jeniskelamin', 'jk', 'lp', 'kelamin', 'gender']);
  const colParentName = findCol([
    'namaorangtua',
    'namaortu',
    'orangtua',
    'namawali',
    'wali',
    'namaibu',
    'namaayah',
  ]);
  const colParentEmail = findCol(['emailorangtua', 'emailortu', 'emailwali', 'email']);
  const colTeacherEmail = findCol(['emailwalikelas', 'emailguru', 'walikelas']);
  const colAttendance = findCol(['kehadiran', 'absensi', 'hadir']);
  const colFormatif = findCol(['nilaiformatif', 'formatif']);
  const colSumatif = findCol(['nilaisumatif', 'sumatif']);
  const colP5 = findCol(['capaianp5', 'p5', 'projekp5']);
  const colNote = findCol(['catatanakademik', 'catatan', 'keterangan']);

  if (colName === -1) {
    throw new Error(
      'Kolom nama siswa tidak ditemukan. Pastikan terdapat kolom "Nama Lengkap" atau "Nama Siswa" (gunakan tombol Unduh Template Excel untuk melihat format).'
    );
  }

  const rows: StudentImportRow[] = [];
  const warnings: string[] = [];

  for (let i = headerRowIdx + 1; i < matrix.length; i++) {
    const rawRow = matrix[i] || [];
    const rawName = String(rawRow[colName] ?? '').trim();
    if (!rawName || rawName.length < 2) {
      if (rawRow.some((cell) => String(cell ?? '').trim() !== '')) {
        warnings.push(`Baris ${i + 1}: dilewati karena nama siswa kosong atau kurang dari 2 huruf.`);
      }
      continue;
    }

    const nisn =
      colNisn !== -1
        ? normalizeNisn(rawRow[colNisn], i + 1)
        : normalizeNisn('', i + 1);
    const nik = colNik !== -1 ? normalizeNik(String(rawRow[colNik] ?? '')) : '';
    const rombel =
      colRombel !== -1 ? normalizeRombel(rawRow[colRombel]) : ('Kelas 1' as RombelName);
    const gender = colGender !== -1 ? normalizeGender(rawRow[colGender]) : 'L';
    const rawParentName =
      colParentName !== -1 ? String(rawRow[colParentName] ?? '').trim() : '';
    const parentName = clampString(
      rawParentName.length >= 2 ? rawParentName : 'Orang Tua / Wali',
      100
    );
    const parentEmail =
      colParentEmail !== -1
        ? clampString(String(rawRow[colParentEmail] ?? '').toLowerCase(), 150)
        : '';
    const teacherEmailRaw =
      colTeacherEmail !== -1
        ? clampString(String(rawRow[colTeacherEmail] ?? '').toLowerCase(), 150)
        : '';
    const teacherEmail = teacherEmailRaw || clampString(defaultTeacherEmail.toLowerCase(), 150);

    rows.push({
      nisn,
      nik,
      fullName: clampString(rawName, 100),
      rombel,
      gender,
      parentName,
      parentEmail,
      teacherEmail,
      attendancePercent:
        colAttendance !== -1 ? parsePercentOrScore(rawRow[colAttendance], 98) : 98,
      nilaiFormatif:
        colFormatif !== -1 ? parsePercentOrScore(rawRow[colFormatif], 85) : 85,
      nilaiSumatif:
        colSumatif !== -1 ? parsePercentOrScore(rawRow[colSumatif], 85) : 85,
      capaianP5:
        colP5 !== -1 ? normalizeCapaianP5(rawRow[colP5]) : 'Berkembang Sesuai Harapan',
      academicNote:
        colNote !== -1
          ? clampString(String(rawRow[colNote] ?? ''), 500)
          : '',
      photoUrl: '',
      videoUrl: '',
      documentUrl: '',
      updatedBy: clampString(defaultUpdatedBy || 'Admin SDN Cikawao', 100),
    });
  }

  if (rows.length === 0) {
    throw new Error('Tidak ada baris data peserta didik yang valid ditemukan di file Excel.');
  }

  return { rows, warnings, sheetName };
}

export function downloadStudentsExcelTemplate(): void {
  const sampleData = [
    {
      NISN: '0154829101',
      NIK: '3211090105190001',
      'Nama Lengkap': 'Ananda Rizky Pratama',
      Rombel: 'Kelas 1',
      'Jenis Kelamin': 'L',
      'Nama Orang Tua': 'Budi Pratama',
      'Email Orang Tua': 'budi.ortu@example.com',
      'Email Wali Kelas': 'sdncikawao690@gmail.com',
      'Kehadiran (%)': 98,
      'Nilai Formatif': 88,
      'Nilai Sumatif': 86,
      'Capaian P5': 'Berkembang Sesuai Harapan',
      Catatan: 'Aktif membaca dan berdiskusi di kelas',
    },
    {
      NISN: '0143918202',
      NIK: '3211094506160002',
      'Nama Lengkap': 'Siti Zahra Aulia',
      Rombel: 'Kelas 4',
      'Jenis Kelamin': 'P',
      'Nama Orang Tua': 'Dewi Lestari',
      'Email Orang Tua': 'dewi.ortu@example.com',
      'Email Wali Kelas': 'sdncikawao690@gmail.com',
      'Kehadiran (%)': 100,
      'Nilai Formatif': 92,
      'Nilai Sumatif': 90,
      'Capaian P5': 'Sangat Berkembang',
      Catatan: 'Menonjol pada projek P5 Kearifan Lokal Sunda',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar_PD_SDN_Cikawao');
  XLSX.writeFile(wb, 'Template_Daftar_PD_SDN_Cikawao.xlsx');
}
