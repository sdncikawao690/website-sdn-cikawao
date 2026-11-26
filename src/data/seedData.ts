import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  computeNisnNameHash,
  computeNisnNikHash,
  normalizeNik,
} from '../lib/validation';
import {
  GENERATED_IMAGES,
  SCHOOL_INFO,
  type Announcement,
  type EkskulReport,
  type GalleryItem,
  type NewsArticle,
  type PkksItem,
  type StudentRecord,
  type TeacherProfile,
  type UserAccount,
} from '../types/school';

export const DEFAULT_TEACHERS: Omit<TeacherProfile, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'guru_kepala_sekolah',
    name: SCHOOL_INFO.principalName,
    nip: SCHOOL_INFO.principalNip,
    position: 'Kepala Sekolah',
    rank: SCHOOL_INFO.principalRank,
    rombel: 'Manajerial Sekolah',
    status: 'Aktif',
    displayOrder: 1,
    photoUrl: GENERATED_IMAGES.principalPortrait,
  },
  {
    id: 'guru_kelas_1',
    name: 'Ai Siti Aminah, S.Pd.SD.',
    nip: '198405122014082001',
    position: 'Guru Kelas I',
    rank: 'Penata Muda Tk. I, III/b',
    rombel: 'Kelas 1',
    status: 'Aktif',
    displayOrder: 2,
  },
  {
    id: 'guru_kelas_2',
    name: 'Dede Kurniawan, S.Pd.',
    nip: '198811042019031004',
    position: 'Guru Kelas II',
    rank: 'Penata Muda, III/a',
    rombel: 'Kelas 2',
    status: 'Aktif',
    displayOrder: 3,
  },
  {
    id: 'guru_kelas_3',
    name: 'Tati Suryati, S.Pd.',
    nip: '197909212008012009',
    position: 'Guru Kelas III',
    rank: 'Penata, III/c',
    rombel: 'Kelas 3',
    status: 'Aktif',
    displayOrder: 4,
  },
  {
    id: 'guru_kelas_4',
    name: 'Asep Saepudin, S.Pd.',
    nip: '198502172015041002',
    position: 'Guru Kelas IV',
    rank: 'Penata Muda Tk. I, III/b',
    rombel: 'Kelas 4',
    status: 'Aktif',
    displayOrder: 5,
  },
  {
    id: 'guru_kelas_5',
    name: 'Rina Marlina, S.Pd.',
    nip: '199106152020122007',
    position: 'Guru Kelas V',
    rank: 'Ahli Pertama, IX',
    rombel: 'Kelas 5',
    status: 'Aktif',
    displayOrder: 6,
  },
  {
    id: 'guru_kelas_6',
    name: 'Hendra Wijaya, S.Pd.',
    nip: '198208092011011003',
    position: 'Guru Kelas VI',
    rank: 'Penata, III/c',
    rombel: 'Kelas 6',
    status: 'Aktif',
    displayOrder: 7,
  },
  {
    id: 'guru_pai',
    name: 'Ustadz Ridwan Maulana, S.Pd.I.',
    nip: '199004222022211005',
    position: 'Guru PAI & Budi Pekerti',
    rank: 'Ahli Pertama, IX',
    rombel: 'Kelas 1 - Kelas 6',
    status: 'Aktif',
    displayOrder: 8,
  },
  {
    id: 'guru_pjok',
    name: 'Yogi Pratama, S.Pd.',
    nip: '199301182023211002',
    position: 'Guru PJOK & Pembina Ekskul',
    rank: 'Ahli Pertama, IX',
    rombel: 'Kelas 1 - Kelas 6',
    status: 'Aktif',
    displayOrder: 9,
  },
];

export const DEFAULT_NEWS: Omit<NewsArticle, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'news_kbm_merdeka_01',
    title: 'Implementasi Projek P5 Ekosistem Hijau di Kelas IV SDN Cikawao',
    category: 'Kurikulum Merdeka',
    summary:
      'Peserta didik Kelas IV mempraktikkan pembelajaran berbasis projek dengan membuat model ekosistem dan kebun mini sekolah.',
    content:
      'Dalam rangka penguatan Projek Penguatan Profil Pelajar Pancasila (P5) Kurikulum Merdeka, siswa Kelas IV SDN Cikawao melaksanakan praktik pengamatan ekosistem lingkungan Desa Sukawangi. Kegiatan ini dipandu langsung oleh wali kelas dengan metode kolaboratif kelompok kecil, melatih bernalar kritis, gotong royong, serta kepedulian terhadap kelestarian alam Pamulihan.',
    imageUrl: GENERATED_IMAGES.kbmClassroom,
    authorName: SCHOOL_INFO.principalName,
    authorUid: 'seed_admin',
    publishedDate: '2026-11-18',
  },
  {
    id: 'news_seni_angklung_02',
    title: 'Pelestarian Budaya Sunda Melalui Ekstrakurikuler Angklung & Tari',
    category: 'Kegiatan Sekolah',
    summary:
      'Latihan rutin seni angklung bambu setiap hari Jumat menumbuhkan kecintaan siswa terhadap warisan budaya Jawa Barat.',
    content:
      'SDN Cikawao terus menghidupkan pendidikan karakter berbasis kearifan lokal Sunda. Sebanyak 36 peserta didik dari kelas III hingga kelas VI berlatih harmonisasi nada angklung bersama pembina seni budaya sekolah untuk persiapan pentas kreativitas tingkat Kecamatan Pamulihan.',
    imageUrl: GENERATED_IMAGES.angklungSunda,
    authorName: SCHOOL_INFO.principalName,
    authorUid: 'seed_admin',
    publishedDate: '2026-11-14',
  },
  {
    id: 'news_pramuka_beraksi_03',
    title: 'Jabar Beraksi: Pramuka Siaga dan Penggalang Hijaukan Halaman Sekolah',
    category: 'KBM',
    summary:
      'Gerakan penanaman tanaman obat keluarga dan kebersihan lingkungan sekolah oleh anggota Pramuka SDN Cikawao.',
    content:
      'Sebagai bagian dari program Jabar Beraksi yang aktif dan transparan, gugus depan Pramuka SDN Cikawao mengadakan aksi penanaman bibit sayuran dan tanaman herbal di pekarangan sekolah. Orang tua murid dapat memantau laporan pelaksanaan, jumlah peserta, serta dokumentasi kegiatan langsung melalui portal sekolah.',
    imageUrl: GENERATED_IMAGES.pramukaGarden,
    authorName: SCHOOL_INFO.principalName,
    authorUid: 'seed_admin',
    publishedDate: '2026-11-10',
  },
];

export const DEFAULT_GALLERY: Omit<GalleryItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'gal_01',
    title: 'Suasana Pagi Kampus SDN Cikawao',
    category: 'Lingkungan Sekolah',
    caption: 'Siswa-siswi berjalan tertib menuju ruang kelas di lingkungan asri Desa Sukawangi, Kec. Pamulihan.',
    imageUrl: GENERATED_IMAGES.heroCampus,
    takenDate: '2026-11-18',
    authorUid: 'seed_admin',
  },
  {
    id: 'gal_02',
    title: 'Diskusi Kelompok Kurikulum Merdeka',
    category: 'KBM',
    caption: 'Pembelajaran terdiferensiasi dan praktik sains kontekstual di ruang kelas IV.',
    imageUrl: GENERATED_IMAGES.kbmClassroom,
    takenDate: '2026-11-16',
    authorUid: 'seed_admin',
  },
  {
    id: 'gal_03',
    title: 'Aksi Kebun Sekolah Pramuka',
    category: 'Ekstrakurikuler',
    caption: 'Peserta didik berlatih kepemimpinan dan kepedulian lingkungan melalui kegiatan Jabar Beraksi.',
    imageUrl: GENERATED_IMAGES.pramukaGarden,
    takenDate: '2026-11-12',
    authorUid: 'seed_admin',
  },
  {
    id: 'gal_04',
    title: 'Ansambel Angklung SDN Cikawao',
    category: 'Seni Budaya',
    caption: 'Harmoni musik bambu tradisional Sunda dalam pembinaan ekstrakurikuler seni budaya.',
    imageUrl: GENERATED_IMAGES.angklungSunda,
    takenDate: '2026-11-08',
    authorUid: 'seed_admin',
  },
];

export const DEFAULT_PKKS: Omit<PkksItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'pkks_01',
    component: 'Kepribadian & Sosial',
    indicatorCode: 'PKKS-01',
    indicatorTitle: 'Keteladanan, integritas kepemimpinan, dan komunikasi partisipatif dengan komite sekolah',
    targetScore: 100,
    achievedScore: 96,
    status: 'Terpenuhi',
    evidenceSummary: 'Notulensi rapat komite, daftar hadir pembinaan pagi, serta catatan refleksi triwulan.',
    evidenceUrl: '',
    updatedBy: SCHOOL_INFO.principalName,
  },
  {
    id: 'pkks_02',
    component: 'Kepemimpinan Pembelajaran',
    indicatorCode: 'PKKS-02',
    indicatorTitle: 'Pelaksanaan Kurikulum Merdeka, KOSP, dan fasilitasi modul ajar terdiferensiasi',
    targetScore: 100,
    achievedScore: 94,
    status: 'Terpenuhi',
    evidenceSummary: 'Dokumen KOSP tahun berjalan, 6 set modul ajar Kurikulum Merdeka, dan portofolio P5.',
    evidenceUrl: '',
    updatedBy: SCHOOL_INFO.principalName,
  },
  {
    id: 'pkks_03',
    component: 'Pengembangan Sekolah',
    indicatorCode: 'PKKS-03',
    indicatorTitle: 'Perencanaan berbasis data (Rapor Pendidikan) dan digitalisasi layanan sekolah',
    targetScore: 100,
    achievedScore: 92,
    status: 'Terpenuhi',
    evidenceSummary: 'Dokumen RKJM/RKT selaras Rapor Pendidikan serta aktivasi portal informasi & SILOKA.',
    evidenceUrl: '',
    updatedBy: SCHOOL_INFO.principalName,
  },
  {
    id: 'pkks_04',
    component: 'Manajemen Sumber Daya',
    indicatorCode: 'PKKS-04',
    indicatorTitle: 'Pengelolaan 8 pendidik, 6 rombel (184 siswa), serta pemeliharaan sarana prasarana',
    targetScore: 100,
    achievedScore: 95,
    status: 'Terpenuhi',
    evidenceSummary: 'SK pembagian tugas mengajar 8 guru, buku inventaris barang, dan laporan BOS transparan.',
    evidenceUrl: '',
    updatedBy: SCHOOL_INFO.principalName,
  },
  {
    id: 'pkks_05',
    component: 'Kewirausahaan',
    indicatorCode: 'PKKS-05',
    indicatorTitle: 'Inovasi program unggulan budaya Sunda dan kemitraan lingkungan Desa Sukawangi',
    targetScore: 100,
    achievedScore: 88,
    status: 'Proses Verifikasi',
    evidenceSummary: 'Program kebun edukasi siswa dan kerja sama sanggar seni lokal Kecamatan Pamulihan.',
    evidenceUrl: '',
    updatedBy: SCHOOL_INFO.principalName,
  },
  {
    id: 'pkks_06',
    component: 'Supervisi Guru & Tendik',
    indicatorCode: 'PKKS-06',
    indicatorTitle: 'Pelaksanaan observasi kelas, umpan balik konstruktif, dan tindak lanjut kinerja guru',
    targetScore: 100,
    achievedScore: 93,
    status: 'Terpenuhi',
    evidenceSummary: 'Jadwal supervisi akademik semester ganjil dan instrumen evaluasi 8 guru kelas/mapel.',
    evidenceUrl: '',
    updatedBy: SCHOOL_INFO.principalName,
  },
];

export const DEFAULT_EKSKUL: Omit<EkskulReport, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ekskul_01',
    ekskulName: 'Pendidikan Karakter',
    activityTitle: 'Pembiasaan Karakter Pancasila, Pramuka & Seni Budaya Sunda',
    coachName: 'Yogi Pratama, S.Pd.',
    schedule: 'Setiap Hari & Jumat–Sabtu',
    participantCount: 184,
    activityDate: '2026-11-16',
    reportSummary:
      'Penguatan karakter religius, disiplin, gotong royong, seni angklung Sunda, serta kepedulian lingkungan kebun sekolah bagi seluruh peserta didik Kelas I–VI.',
    transparencyNote:
      'Terlaksana terintegrasi dalam pembiasaan pagi dan kegiatan ekstrakurikuler aktif SDN Cikawao.',
    imageUrl: GENERATED_IMAGES.pramukaGarden,
    authorUid: 'seed_admin',
  },
  {
    id: 'ekskul_02',
    ekskulName: 'Digitalisasi Pembelajaran',
    activityTitle: 'Integrasi Media Ajar Digital & Portal Akademik Real-Time',
    coachName: 'Rina Marlina, S.Pd.',
    schedule: 'Berjalan Sepanjang Semester',
    participantCount: 184,
    activityDate: '2026-11-15',
    reportSummary:
      'Pemanfaatan media pembelajaran visual/audio interaktif di kelas serta pemantauan nilai formatif, sumatif, dan projek P5 siswa secara digital untuk orang tua.',
    transparencyNote:
      'Seluruh 8 guru aktif memanfaatkan perangkat presentasi kelas dan pelaporan daring.',
    imageUrl: GENERATED_IMAGES.kbmClassroom,
    authorUid: 'seed_admin',
  },
  {
    id: 'ekskul_03',
    ekskulName: 'Kualitas Dapodik',
    activityTitle: 'Validasi & Pemutakhiran Data Dapodik 184 Siswa, 6 Rombel & 8 PTK',
    coachName: 'Neng Linlin Irmawati, S.Pd.',
    schedule: 'Sinkronisasi Mingguan / Bulanan',
    participantCount: 184,
    activityDate: '2026-11-14',
    reportSummary:
      'Verifikasi kelengkapan NISN peserta didik, riwayat PTK, rombongan belajar Kelas I–VI, serta kondisi sarana prasarana sekolah pada aplikasi Dapodik.',
    transparencyNote:
      'Tingkat validitas dan residu data Dapodik terpantau 100% sinkron tanpa invalid.',
    imageUrl: GENERATED_IMAGES.heroCampus,
    authorUid: 'seed_admin',
  },
  {
    id: 'ekskul_04',
    ekskulName: 'SPMI',
    activityTitle: 'Siklus Penjaminan Mutu Internal & Tindak Lanjut Rapor Pendidikan',
    coachName: 'Neng Linlin Irmawati, S.Pd.',
    schedule: 'Evaluasi Triwulan',
    participantCount: 8,
    activityDate: '2026-11-12',
    reportSummary:
      'Pelaksanaan pemetaan mutu berbasis Rapor Pendidikan, penyusunan RKJM/RKT, supervisi pembelajaran 8 guru, serta evaluasi peningkatan literasi dan numerasi.',
    transparencyNote:
      'Dokumen hasil evaluasi diri sekolah dan rencana perbaikan terdokumentasi di tim pengembang mutu.',
    imageUrl: GENERATED_IMAGES.angklungSunda,
    authorUid: 'seed_admin',
  },
  {
    id: 'ekskul_05',
    ekskulName: 'Analisis Daya Tampung',
    activityTitle: 'Pemetaan Kapasitas 6 Rombongan Belajar & Proyeksi PPDB SDN Cikawao',
    coachName: 'Hendra Wijaya, S.Pd.',
    schedule: 'Evaluasi Semester & Pra-PPDB',
    participantCount: 184,
    activityDate: '2026-11-10',
    reportSummary:
      'Analisis daya tampung ruang kelas terhadap jumlah 184 peserta didik aktif (Kelas 1: 23, Kelas 2: 36, Kelas 3: 25, Kelas 4: 36, Kelas 5: 33, Kelas 6: 31) untuk kesiapan tahun ajaran berikutnya.',
    transparencyNote:
      'Rasio rombel dan ketersediaan meja-kursi terpenuhi sesuai standar pelayanan minimal.',
    imageUrl: GENERATED_IMAGES.heroCampus,
    authorUid: 'seed_admin',
  },
];

export const DEFAULT_ANNOUNCEMENTS: Omit<Announcement, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ann_01',
    title: 'Pelaksanaan Asesmen Sumatif Akhir Semester Ganjil 2026/2027',
    message:
      'Kepada seluruh orang tua/wali murid Kelas 1 s.d. Kelas 6 SDN Cikawao, Asesmen Sumatif Akhir Semester akan dilaksanakan pada tanggal 1–6 Desember 2026. Mohon pendampingan belajar di rumah dan memastikan kehadiran putra-putri tepat waktu pukul 07.15 WIB.',
    priority: 'Penting',
    targetRombel: 'Semua Kelas',
    autoNotifyParents: true,
    isActive: true,
    authorName: SCHOOL_INFO.principalName,
    authorUid: 'seed_admin',
  },
  {
    id: 'ann_02',
    title: 'Pembagian Rapor & Konsultasi Perkembangan P5 Orang Tua',
    message:
      'Orang tua murid diundang hadir pada hari Sabtu, 19 Desember 2026 pukul 08.30 WIB untuk menerima laporan hasil belajar Kurikulum Merdeka sekaligus berdiskusi bersama wali kelas masing-masing.',
    priority: 'Informasi',
    targetRombel: 'Semua Kelas',
    autoNotifyParents: true,
    isActive: true,
    authorName: SCHOOL_INFO.principalName,
    authorUid: 'seed_admin',
  },
];

export const DEFAULT_STUDENTS_SAMPLE: Omit<StudentRecord, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'stu_01',
    nisn: '0198234101',
    nik: '3211095201180001',
    fullName: 'Alifah Zahra Putri',
    rombel: 'Kelas 1',
    gender: 'P',
    parentName: 'Ibu Nani Suryani',
    parentEmail: 'orangtua.alifah@example.com',
    teacherEmail: 'aisiti.guru1@sdncikawao.sch.id',
    attendancePercent: 98,
    nilaiFormatif: 88,
    nilaiSumatif: 86,
    capaianP5: 'Berkembang Sesuai Harapan',
    academicNote: 'Membaca lancar dan aktif bekerja sama dalam kelompok.',
    updatedBy: 'Ai Siti Aminah, S.Pd.SD.',
  },
  {
    id: 'stu_02',
    nisn: '0187234102',
    nik: '3211091403170002',
    fullName: 'Muhammad Rizky Pratama',
    rombel: 'Kelas 2',
    gender: 'L',
    parentName: 'Bapak Dadan Ramdani',
    parentEmail: 'orangtua.rizky@example.com',
    teacherEmail: 'dede.guru2@sdncikawao.sch.id',
    attendancePercent: 96,
    nilaiFormatif: 85,
    nilaiSumatif: 84,
    capaianP5: 'Berkembang Sesuai Harapan',
    academicNote: 'Antusias dalam numerasi dasar dan kegiatan Pramuka Siaga.',
    updatedBy: 'Dede Kurniawan, S.Pd.',
  },
  {
    id: 'stu_03',
    nisn: '0176234103',
    nik: '3211096107160003',
    fullName: 'Siti Nurhaliza',
    rombel: 'Kelas 3',
    gender: 'P',
    parentName: 'Ibu Imas Masitoh',
    parentEmail: 'orangtua.siti@example.com',
    teacherEmail: 'tati.guru3@sdncikawao.sch.id',
    attendancePercent: 99,
    nilaiFormatif: 92,
    nilaiSumatif: 90,
    capaianP5: 'Sangat Berkembang',
    academicNote: 'Unggul dalam literasi cerita daerah Sunda dan seni angklung.',
    updatedBy: 'Tati Suryati, S.Pd.',
  },
  {
    id: 'stu_04',
    nisn: '0165234104',
    nik: '3211090509150004',
    fullName: 'Raka Aditya Nugraha',
    rombel: 'Kelas 4',
    gender: 'L',
    parentName: 'Bapak Ujang Kosasih',
    parentEmail: 'orangtua.raka@example.com',
    teacherEmail: 'asep.guru4@sdncikawao.sch.id',
    attendancePercent: 95,
    nilaiFormatif: 89,
    nilaiSumatif: 87,
    capaianP5: 'Sangat Berkembang',
    academicNote: 'Menunjukkan kepemimpinan sangat baik pada projek P5 ekosistem hijau.',
    updatedBy: 'Asep Saepudin, S.Pd.',
  },
  {
    id: 'stu_05',
    nisn: '0154234105',
    nik: '3211094811140005',
    fullName: 'Nadia Kayla Rahmawati',
    rombel: 'Kelas 5',
    gender: 'P',
    parentName: 'Ibu Euis Komalasari',
    parentEmail: 'orangtua.nadia@example.com',
    teacherEmail: 'rina.guru5@sdncikawao.sch.id',
    attendancePercent: 97,
    nilaiFormatif: 91,
    nilaiSumatif: 93,
    capaianP5: 'Sangat Berkembang',
    academicNote: 'Kreatif menyusun laporan pengamatan IPAS dan presentasi kelas.',
    updatedBy: 'Rina Marlina, S.Pd.',
  },
  {
    id: 'stu_06',
    nisn: '0143234106',
    nik: '3211092302130006',
    fullName: 'Fajar Maulana Hakim',
    rombel: 'Kelas 6',
    gender: 'L',
    parentName: 'Bapak Cecep Supriatna',
    parentEmail: 'orangtua.fajar@example.com',
    teacherEmail: 'hendra.guru6@sdncikawao.sch.id',
    attendancePercent: 97,
    nilaiFormatif: 90,
    nilaiSumatif: 91,
    capaianP5: 'Berkembang Sesuai Harapan',
    academicNote: 'Siap menghadapi asesmen akhir jenjang, disiplin dan santun.',
    updatedBy: 'Hendra Wijaya, S.Pd.',
  },
];

export const DEFAULT_USERS_SEED: Omit<UserAccount, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'usr_kepala_sekolah',
    displayName: SCHOOL_INFO.principalName,
    email: SCHOOL_INFO.email,
    role: 'admin',
    nipOrNik: SCHOOL_INFO.principalNip,
    rombel: 'Manajerial Sekolah',
    phone: '0812-2020-8591',
    status: 'aktif',
  },
  {
    id: 'usr_guru_1',
    displayName: 'Ai Siti Aminah, S.Pd.SD.',
    email: 'aisiti.guru1@sdncikawao.sch.id',
    role: 'guru',
    nipOrNik: '198405122014082001',
    rombel: 'Kelas 1',
    phone: '0813-2201-1001',
    status: 'aktif',
  },
  {
    id: 'usr_guru_4',
    displayName: 'Asep Saepudin, S.Pd.',
    email: 'asep.guru4@sdncikawao.sch.id',
    role: 'guru',
    nipOrNik: '198502172015041002',
    rombel: 'Kelas 4',
    phone: '0813-2201-1004',
    status: 'aktif',
  },
  {
    id: 'usr_ortu_sample',
    displayName: 'Bapak Ujang Kosasih',
    email: 'orangtua.raka@example.com',
    role: 'orangtua',
    nipOrNik: '3211090101800002',
    rombel: 'Kelas 4',
    phone: '0852-9400-1122',
    linkedStudentId: 'stu_04',
    status: 'aktif',
  },
];

export async function seedInitialSchoolData(
  adminUid: string,
  adminName: string
): Promise<void> {
  const safeAdminName =
    adminName && adminName.trim().length >= 2
      ? adminName.trim().slice(0, 100)
      : SCHOOL_INFO.principalName;

  const [
    tSnap,
    nSnap,
    gSnap,
    pSnap,
    eSnap,
    aSnap,
    sSnap,
    uSnap,
  ] = await Promise.all([
    getDocs(collection(db, 'teachers')),
    getDocs(collection(db, 'news')),
    getDocs(collection(db, 'gallery')),
    getDocs(collection(db, 'pkks_items')),
    getDocs(collection(db, 'ekskul_reports')),
    getDocs(collection(db, 'announcements')),
    getDocs(collection(db, 'students')),
    getDocs(collection(db, 'users')),
  ]);

  const existingTeachers = new Set(tSnap.docs.map((d) => d.id));
  const existingNews = new Set(nSnap.docs.map((d) => d.id));
  const existingGallery = new Set(gSnap.docs.map((d) => d.id));
  const existingPkks = new Set(pSnap.docs.map((d) => d.id));
  const existingEkskul = new Set(eSnap.docs.map((d) => d.id));
  const existingAnnouncements = new Set(aSnap.docs.map((d) => d.id));
  const existingStudents = new Set(sSnap.docs.map((d) => d.id));
  const existingUsers = new Set(uSnap.docs.map((d) => d.id));

  const batch = writeBatch(db);
  const ts = serverTimestamp();
  let ops = 0;

  for (const { id, ...teacherData } of DEFAULT_TEACHERS) {
    if (!existingTeachers.has(id)) {
      batch.set(doc(db, 'teachers', id), {
        ...teacherData,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  for (const { id, ...articleData } of DEFAULT_NEWS) {
    if (!existingNews.has(id)) {
      batch.set(doc(db, 'news', id), {
        ...articleData,
        authorUid: adminUid,
        authorName: safeAdminName,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  for (const { id, ...galData } of DEFAULT_GALLERY) {
    if (!existingGallery.has(id)) {
      batch.set(doc(db, 'gallery', id), {
        ...galData,
        authorUid: adminUid,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  for (const { id, ...pkksData } of DEFAULT_PKKS) {
    if (!existingPkks.has(id)) {
      batch.set(doc(db, 'pkks_items', id), {
        ...pkksData,
        updatedBy: safeAdminName,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  for (const { id, ...repData } of DEFAULT_EKSKUL) {
    if (!existingEkskul.has(id)) {
      batch.set(doc(db, 'ekskul_reports', id), {
        ...repData,
        authorUid: adminUid,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  for (const { id, ...annData } of DEFAULT_ANNOUNCEMENTS) {
    if (!existingAnnouncements.has(id)) {
      batch.set(doc(db, 'announcements', id), {
        ...annData,
        authorUid: adminUid,
        authorName: safeAdminName,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  for (const { id, ...stuData } of DEFAULT_STUDENTS_SAMPLE) {
    if (!existingStudents.has(id)) {
      batch.set(doc(db, 'students', id), {
        ...stuData,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
    const nameHash = await computeNisnNameHash(stuData.fullName);
    if (nameHash) {
      batch.set(doc(db, 'nisn_lookup', nameHash), {
        nisn: stuData.nisn,
        updatedAt: ts,
      });
      ops++;
    }
    const cleanNik = normalizeNik(stuData.nik);
    if (cleanNik.length >= 6) {
      const nikHash = await computeNisnNikHash(cleanNik);
      if (nikHash) {
        batch.set(doc(db, 'nisn_lookup', nikHash), {
          nisn: stuData.nisn,
          updatedAt: ts,
        });
        ops++;
      }
    }
  }

  for (const { id, ...usrData } of DEFAULT_USERS_SEED) {
    if (!existingUsers.has(id)) {
      batch.set(doc(db, 'users', id), {
        ...usrData,
        createdAt: ts,
        updatedAt: ts,
      });
      ops++;
    }
  }

  if (ops === 0) return;

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch_seed_school_data');
  }
}
