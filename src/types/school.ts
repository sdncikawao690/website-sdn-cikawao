import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'guru' | 'orangtua';
export type UserStatus = 'aktif' | 'nonaktif';

export type PublicTabId =
  | 'beranda'
  | 'profil'
  | 'peserta-didik'
  | 'kbm-galeri'
  | 'pkks'
  | 'jabar-beraksi'
  | 'siloka';

export type RombelName =
  | 'Kelas 1'
  | 'Kelas 2'
  | 'Kelas 3'
  | 'Kelas 4'
  | 'Kelas 5'
  | 'Kelas 6';

export type CapaianP5 =
  | 'Mulai Berkembang'
  | 'Sedang Berkembang'
  | 'Berkembang Sesuai Harapan'
  | 'Sangat Berkembang';

export type NewsCategory =
  | 'KBM'
  | 'Prestasi'
  | 'Kurikulum Merdeka'
  | 'Kegiatan Sekolah';

export type GalleryCategory =
  | 'KBM'
  | 'Ekstrakurikuler'
  | 'Seni Budaya'
  | 'Lingkungan Sekolah';

export type GalleryMediaType = 'foto' | 'video';

export type PkksComponent =
  | 'Kepribadian & Sosial'
  | 'Kepemimpinan Pembelajaran'
  | 'Pengembangan Sekolah'
  | 'Manajemen Sumber Daya'
  | 'Kewirausahaan'
  | 'Supervisi Guru & Tendik';

export type PkksStatus = 'Terpenuhi' | 'Proses Verifikasi' | 'Perlu Lengkapi';

export type EkskulName =
  | 'Pendidikan Karakter'
  | 'Digitalisasi Pembelajaran'
  | 'Kualitas Dapodik'
  | 'SPMI'
  | 'Analisis Daya Tampung'
  | 'Pramuka'
  | 'Seni Angklung & Tari Sunda'
  | 'Paskibra'
  | 'Pencak Silat'
  | 'Olahraga & Atletik'
  | 'BTQ & Keagamaan'
  | 'Literasi & PMR';

export const JABAR_BERAKSI_PILLARS: Array<{
  id: EkskulName;
  code: string;
  description: string;
}> = [
  {
    id: 'Pendidikan Karakter',
    code: '01.',
    description:
      'Pembiasaan akhlak mulia, gotong royong, Pramuka, seni Sunda, dan penguatan Profil Pelajar Pancasila.',
  },
  {
    id: 'Digitalisasi Pembelajaran',
    code: '02.',
    description:
      'Pemanfaatan media ajar digital, asesmen interaktif Kurikulum Merdeka, dan portal sekolah real-time.',
  },
  {
    id: 'Kualitas Dapodik',
    code: '03.',
    description:
      'Pemutakhiran data peserta didik (184 siswa), 6 rombel, 8 PTK, dan sarpras secara akurat dan berkala.',
  },
  {
    id: 'SPMI',
    code: '04.',
    description:
      'Sistem Penjaminan Mutu Internal berbasis Rapor Pendidikan untuk peningkatan literasi, numerasi, dan tata kelola.',
  },
  {
    id: 'Analisis Daya Tampung',
    code: '05.',
    description:
      'Pemetaan kapasitas 6 rombongan belajar dan proyeksi penerimaan peserta didik baru SDN Cikawao.',
  },
];

export type AnnouncementPriority = 'Penting' | 'Mendesak' | 'Informasi';
export type AnnouncementTarget = 'Semua Kelas' | RombelName;

export type SilokaCategory =
  | 'Perencanaan'
  | 'Pengorganisasian'
  | 'Pelaksana'
  | 'Program Unggulan'
  | 'Evaluasi'
  | 'Layanan Akademik'
  | 'Sarana Prasarana'
  | 'Kesiswaan'
  | 'Ekstrakurikuler'
  | 'Saran & Aspirasi';

export const SILOKA_PILLARS: Array<{
  id: SilokaCategory;
  code: string;
  description: string;
}> = [
  {
    id: 'Perencanaan',
    code: '01.',
    description:
      'Perencanaan program layanan publik, pemetaan kebutuhan siswa, dan rencana tindak lanjut aspirasi warga.',
  },
  {
    id: 'Pengorganisasian',
    code: '02.',
    description:
      'Pembagian tugas Kepala Sekolah, 8 pendidik, dan komite sekolah agar koordinasi layanan berjalan jelas.',
  },
  {
    id: 'Pelaksana',
    code: '03.',
    description:
      'Pelaksanaan tindak lanjut lapangan secara cepat oleh guru dan tim sekolah dengan kode tiket SLK-XXXX.',
  },
  {
    id: 'Program Unggulan',
    code: '04.',
    description:
      'Pengembangan inovasi layanan sekolah berbasis budaya Sunda, lingkungan sehat, dan komunikasi digital orang tua.',
  },
  {
    id: 'Evaluasi',
    code: '05.',
    description:
      'Evaluasi berkala capaian penyelesaian aduan, dokumentasi bukti foto/dokumen, dan umpan balik orang tua.',
  },
];

export type SilokaStatus = 'Menunggu' | 'Diproses' | 'Selesai';

export interface SiteMediaConfig {
  id: string;
  heroImageUrl: string;
  heroVideoUrl?: string;
  principalPhotoUrl: string;
  schoolProfileDocUrl?: string;
  updatedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminMarker {
  uid: string;
  email: string;
  assignedBy: string;
  createdAt?: Timestamp;
}

export interface UserAccount {
  id: string;
  uid?: string;
  displayName: string;
  email: string;
  role: UserRole;
  nipOrNik?: string;
  rombel?: string;
  phone?: string;
  photoUrl?: string;
  linkedStudentId?: string;
  status: UserStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TeacherProfile {
  id: string;
  name: string;
  nip?: string;
  position: string;
  rank?: string;
  rombel: string;
  status: 'Aktif' | 'Cuti';
  displayOrder: number;
  photoUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StudentRecord {
  id: string;
  nisn: string;
  nik?: string;
  fullName: string;
  rombel: RombelName;
  gender: 'L' | 'P';
  parentName: string;
  parentEmail: string;
  teacherEmail: string;
  attendancePercent: number;
  nilaiFormatif: number;
  nilaiSumatif: number;
  capaianP5: CapaianP5;
  academicNote: string;
  photoUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  updatedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  summary: string;
  content: string;
  imageUrl: string;
  videoUrl?: string;
  documentUrl?: string;
  authorName: string;
  authorUid: string;
  publishedDate: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  mediaType?: GalleryMediaType;
  caption: string;
  imageUrl: string;
  videoUrl?: string;
  takenDate: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface PkksItem {
  id: string;
  component: PkksComponent;
  indicatorCode: string;
  indicatorTitle: string;
  targetScore: number;
  achievedScore: number;
  status: PkksStatus;
  evidenceSummary: string;
  evidenceUrl?: string;
  evidencePhotoUrl?: string;
  evidenceVideoUrl?: string;
  updatedBy: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EkskulReport {
  id: string;
  ekskulName: EkskulName;
  activityTitle: string;
  coachName: string;
  schedule: string;
  participantCount: number;
  activityDate: string;
  reportSummary: string;
  transparencyNote?: string;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  targetRombel: AnnouncementTarget;
  autoNotifyParents: boolean;
  isActive: boolean;
  photoUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  authorName: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SilokaTicket {
  id: string;
  ticketCode: string;
  reporterUid: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  category: SilokaCategory;
  subject: string;
  description: string;
  photoUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  documentName?: string;
  status: SilokaStatus;
  officialResponse?: string;
  responsePhotoUrl?: string;
  responseDocUrl?: string;
  responseDocName?: string;
  respondedBy?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type SilokaPillar =
  | 'Perencanaan'
  | 'Pengorganisasian'
  | 'Pelaksana'
  | 'Program Unggulan'
  | 'Evaluasi';

export interface SilokaDocument {
  id: string;
  pillar: SilokaPillar;
  title: string;
  description?: string;
  fileUrl: string;
  fileName?: string;
  fileSizeLabel?: string;
  uploadedBy: string;
  authorUid: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const SCHOOL_INFO = {
  name: 'SDN Cikawao',
  npsn: '20208591',
  curriculum: 'Kurikulum Merdeka',
  logoUrl:
    '/assets/aistudio/WhatsApp_Image_2025-05-18_at_23.07.01-removebg-preview_73f850fc.png',
  address: 'Jln. Nyampay RT 01 RW 09, Desa Sukawangi, Kec. Pamulihan, Kab. Sumedang, Jawa Barat',
  shortAddress: 'Desa Sukawangi, Kec. Pamulihan, Kab. Sumedang',
  principalName: 'Neng Linlin Irmawati, S.Pd.',
  principalNip: '198603272010012011',
  principalRank: 'Penata Tingkat I, III/d',
  email: 'sdncikawao690@gmail.com',
  totalStudentsTarget: 184,
  totalRombel: 6,
  totalTeachers: 8,
  rombelDistribution: [
    { rombel: 'Kelas 1' as RombelName, count: 31 },
    { rombel: 'Kelas 2' as RombelName, count: 30 },
    { rombel: 'Kelas 3' as RombelName, count: 31 },
    { rombel: 'Kelas 4' as RombelName, count: 32 },
    { rombel: 'Kelas 5' as RombelName, count: 30 },
    { rombel: 'Kelas 6' as RombelName, count: 30 },
  ],
  vision:
    'Terwujudnya murid yang beriman dan bertakwa kepada Tuhan Yang Maha Esa, bernalar kritis, kreatif, kolaboratif, mandiri, sehat dan peduli terhadap lingkungan, serta komunikatif',
  missions: [
    'Menyelenggarakan pembelajaran aktif, kontekstual, dan terdiferensiasi berbasis Kurikulum Merdeka yang berpihak pada murid.',
    'Menumbuhkan pembiasaan karakter religius, disiplin, gotong royong, dan pelestarian kearifan lokal Sunda di lingkungan sekolah.',
    'Mengoptimalkan kompetensi pendidik melalui supervisi akademik berkelanjutan dan penguatan tata kelola sekolah yang transparan.',
    'Membangun kemitraan harmonis antara sekolah, orang tua murid, dan masyarakat melalui komunikasi digital dan layanan publik yang responsif.',
  ],
} as const;

export const TIM_IT_ACCOUNT = {
  username: 'tim it sdn cikawao',
  aliases: ['tim it sdn cikawao', 'timit', 'tim it', 'timit@sdncikawao.sch.id'],
  internalEmail: 'timit@sdncikawao.sch.id',
  displayName: 'Tim IT SDN Cikawao',
} as const;

export const GENERATED_IMAGES = {
  heroCampus: '/src/assets/images/hero_sdn_cikawao_1795487179183.jpg',
  kbmClassroom: '/src/assets/images/kbm_kurikulum_merdeka_1795487178718.jpg',
  pramukaGarden: '/src/assets/images/jabar_beraksi_pramuka_1795487179378.jpg',
  angklungSunda: '/src/assets/images/galeri_seni_sunda_1795487179881.jpg',
  principalPortrait: '/src/assets/images/kepala_sekolah_portrait_1795487179568.jpg',
} as const;

export const MEDIA_PRESETS = [
  { label: 'Foto Kampus SDN Cikawao', url: GENERATED_IMAGES.heroCampus },
  { label: 'Foto Kepala Sekolah', url: GENERATED_IMAGES.principalPortrait },
  { label: 'Foto KBM Kurikulum Merdeka', url: GENERATED_IMAGES.kbmClassroom },
  { label: 'Foto Pramuka & Kebun Sekolah', url: GENERATED_IMAGES.pramukaGarden },
  { label: 'Foto Seni Angklung Sunda', url: GENERATED_IMAGES.angklungSunda },
];

export const ROMBEL_LIST: RombelName[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];
