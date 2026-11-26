import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Info,
  Mail,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { isSafeMediaHref, parseVideoUrl } from '../lib/media';
import { normalizeNik } from '../lib/validation';
import {
  GENERATED_IMAGES,
  JABAR_BERAKSI_PILLARS,
  SCHOOL_INFO,
  SILOKA_PILLARS,
  type GalleryCategory,
  type GalleryItem,
  type NewsArticle,
  type NewsCategory,
  type PublicTabId,
  type SilokaDocument,
} from '../types/school';
import { Icon3D, type Icon3DName } from './Icon3D';
import { VideoPlayer } from './MediaViewer';
import { SafeImage } from './SafeImage';
import { SilokaFilePreviewModal } from './SilokaFilePreviewModal';
import { SocialContactIcons } from './SocialContactIcons';

interface PublicPortalProps {
  activeTab: PublicTabId;
  onSelectTab: (tab: PublicTabId) => void;
  onOpenNotifications: () => void;
  onOpenDashboard: (tab?: string) => void;
}

const ROMBEL_PALETTES = [
  'bg-sky-50 border-sky-200 text-sky-900',
  'bg-emerald-50 border-emerald-200 text-emerald-900',
  'bg-amber-50 border-amber-200 text-amber-900',
  'bg-rose-50 border-rose-200 text-rose-900',
  'bg-violet-50 border-violet-200 text-violet-900',
  'bg-teal-50 border-teal-200 text-teal-900',
];

const MISSION_COLORS = [
  'bg-sky-50 border-sky-200 text-sky-800',
  'bg-emerald-50 border-emerald-200 text-emerald-800',
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-rose-50 border-rose-200 text-rose-800',
];

const PORTAL_SHORTCUTS: Array<{
  tab: PublicTabId;
  title: string;
  desc: string;
  icon: Icon3DName;
  cardClass: string;
}> = [
  {
    tab: 'profil',
    title: 'Profil & Direktori Guru',
    desc: 'Sambutan Kepala Sekolah, Visi Misi, 6 rombel, dan profil 8 tenaga pendidik.',
    icon: 'teacher',
    cardClass: 'bg-sky-50/70 border-sky-200 hover:border-sky-400',
  },
  {
    tab: 'kbm-galeri',
    title: 'KBM & Galeri Sekolah',
    desc: 'Berita Kurikulum Merdeka, foto kegiatan siswa, serta video dokumentasi belajar.',
    icon: 'gallery',
    cardClass: 'bg-amber-50/70 border-amber-200 hover:border-amber-400',
  },
  {
    tab: 'pkks',
    title: 'Transparansi PKKS',
    desc: 'Capaian indikator Penilaian Kinerja Kepala Sekolah beserta bukti fisik dan foto.',
    icon: 'pkks',
    cardClass: 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-400',
  },
  {
    tab: 'peserta-didik',
    title: 'Peserta Didik (Cek NISN)',
    desc: 'Cari nomor NISN peserta didik menggunakan Nama Lengkap saja atau NIK saja.',
    icon: 'students',
    cardClass: 'bg-cyan-50/70 border-cyan-200 hover:border-cyan-400',
  },
  {
    tab: 'jabar-beraksi',
    title: 'Jabar Beraksi',
    desc: 'Laporan kegiatan ekstrakurikuler aktif, jumlah peserta, jadwal, dan dokumentasi.',
    icon: 'ekskul',
    cardClass: 'bg-rose-50/70 border-rose-200 hover:border-rose-400',
  },
  {
    tab: 'siloka',
    title: 'Layanan SILOKA',
    desc: 'Informasi 5 unsur tata kelola sekolah dan dokumen resmi layanan masyarakat.',
    icon: 'siloka',
    cardClass: 'bg-violet-50/70 border-violet-200 hover:border-violet-400',
  },
];

function VisiMisiRunningBanner() {
  return (
    <div
      aria-label="Teks berjalan Visi Misi SDN Cikawao"
      className="bg-gradient-to-r from-sky-700 via-teal-600 to-emerald-600 text-white border-b border-sky-800 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 py-2.5">
        <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 shadow-sm">
          <span className="w-4 h-4 rounded logo-light-badge inline-flex items-center justify-center p-0.5">
            <img
              src={SCHOOL_INFO.logoUrl}
              alt="Logo SDN Cikawao"
              className="w-full h-full object-contain"
            />
          </span>
          <span>VISI MISI</span>
        </div>

        <div className="flex-1 overflow-hidden visi-marquee-wrapper">
          <div className="visi-marquee-track text-xs sm:text-sm font-bold tracking-wide text-amber-50">
            <span className="pr-14 whitespace-nowrap">
              &ldquo;{SCHOOL_INFO.vision}&rdquo; — SDN Cikawao, Kec. Pamulihan, Kab. Sumedang ·
              Kurikulum Merdeka · NPSN {SCHOOL_INFO.npsn}
            </span>
            <span aria-hidden="true" className="pr-14 whitespace-nowrap">
              &ldquo;{SCHOOL_INFO.vision}&rdquo; — SDN Cikawao, Kec. Pamulihan, Kab. Sumedang ·
              Kurikulum Merdeka · NPSN {SCHOOL_INFO.npsn}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicPortal({
  activeTab,
  onSelectTab,
  onOpenNotifications,
  onOpenDashboard,
}: PublicPortalProps) {
  const {
    isAuthorizedAdmin,
    siteMedia,
    teachers,
    news,
    gallery,
    pkksItems,
    ekskulReports,
    announcements,
    silokaDocuments,
    unreadAnnouncementsCount,
    lookupStudentNisn,
  } = useSchool();

  const [newsFilter, setNewsFilter] = useState<'Semua' | NewsCategory>('Semua');
  const [galleryFilter, setGalleryFilter] = useState<'Semua' | GalleryCategory>('Semua');
  const [ekskulFilter, setEkskulFilter] = useState<string>('Semua');

  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [previewSilokaDoc, setPreviewSilokaDoc] = useState<SilokaDocument | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [previewVideoModal, setPreviewVideoModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const [pdSearchMode, setPdSearchMode] = useState<'nama' | 'nik'>('nama');
  const [pdQuery, setPdQuery] = useState('');
  const [pdLookupBusy, setPdLookupBusy] = useState(false);
  const [pdLookupError, setPdLookupError] = useState<string | null>(null);
  const [pdLookupResult, setPdLookupResult] = useState<{
    found: boolean;
    nisn?: string;
  } | null>(null);
  const [pdCopied, setPdCopied] = useState(false);

  const activeAnnouncements = useMemo(
    () => announcements.filter((a) => a.isActive),
    [announcements]
  );

  const latestAnnouncement = activeAnnouncements[0] || null;

  const filteredNews = useMemo(() => {
    if (newsFilter === 'Semua') return news;
    return news.filter((n) => n.category === newsFilter);
  }, [news, newsFilter]);

  const filteredGallery = useMemo(() => {
    if (galleryFilter === 'Semua') return gallery;
    return gallery.filter((g) => g.category === galleryFilter);
  }, [gallery, galleryFilter]);

  const filteredEkskul = useMemo(() => {
    if (ekskulFilter === 'Semua') return ekskulReports;
    return ekskulReports.filter((e) => e.ekskulName === ekskulFilter);
  }, [ekskulReports, ekskulFilter]);

  const pkksAverage = useMemo(() => {
    if (pkksItems.length === 0) return 0;
    const sum = pkksItems.reduce((acc, item) => acc + item.achievedScore, 0);
    return Math.round((sum / pkksItems.length) * 10) / 10;
  }, [pkksItems]);

  const pkksFulfilledCount = useMemo(
    () => pkksItems.filter((item) => item.status === 'Terpenuhi').length,
    [pkksItems]
  );

  const handleSwitchPdMode = (mode: 'nama' | 'nik') => {
    if (mode === pdSearchMode) return;
    setPdSearchMode(mode);
    setPdQuery('');
    setPdLookupError(null);
    setPdLookupResult(null);
    setPdCopied(false);
  };

  const handlePdLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPdLookupError(null);
    setPdLookupResult(null);
    setPdCopied(false);
    setPdLookupBusy(true);
    try {
      const nisn = await lookupStudentNisn(pdSearchMode, pdQuery);
      if (nisn) {
        setPdLookupResult({ found: true, nisn });
      } else {
        setPdLookupResult({ found: false });
      }
    } catch (err) {
      setPdLookupError(
        err instanceof Error ? err.message : 'Gagal mencari NISN peserta didik.'
      );
    } finally {
      setPdLookupBusy(false);
    }
  };

  const handleCopyNisn = async () => {
    if (!pdLookupResult?.nisn) return;
    try {
      await navigator.clipboard.writeText(pdLookupResult.nisn);
      setPdCopied(true);
      setTimeout(() => setPdCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable
    }
  };

  return (
    <main id="top" className="text-slate-900 flex-1 flex flex-col">
      {/* ===================================================================== */}
      {/* TAB 1: BERANDA                                                        */}
      {/* ===================================================================== */}
      {activeTab === 'beranda' && (
        <div className="flex-1">
          <VisiMisiRunningBanner />

          {/* HERO SPLIT */}
          <section className="bg-gradient-to-br from-sky-100/80 via-white to-amber-100/70 border-b border-sky-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                <div className="lg:col-span-7 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-14 h-14 rounded-2xl logo-light-badge bg-white border-2 border-sky-200 p-1.5 shadow-sm shrink-0 flex items-center justify-center">
                      <img
                        src={SCHOOL_INFO.logoUrl}
                        alt="Logo Resmi SDN Cikawao"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                      <span className="text-sky-700 font-bold">
                        NPSN {SCHOOL_INFO.npsn}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-bold">
                        {SCHOOL_INFO.curriculum}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-rose-700 font-semibold">
                        Kab. Sumedang, Jawa Barat
                      </span>
                    </div>
                  </div>

                  <h1
                    aria-label="Sekolah Dasar Negeri Cikawao, Ceria, Cerdas, dan Berkarakter"
                    className="w-full mb-5 rounded-2xl border-2 border-sky-200 bg-white/90 shadow-md px-3 py-4 sm:py-5 overflow-hidden hero-marquee-wrapper"
                  >
                    <div className="hero-marquee-track font-display font-extrabold tracking-tight text-[clamp(1.75rem,3.2vw,2.75rem)] leading-tight">
                      {[0, 1].map((dupIndex) => (
                        <div
                          key={dupIndex}
                          aria-hidden={dupIndex === 1 ? 'true' : undefined}
                          className="flex items-center gap-3 sm:gap-4 pr-10 sm:pr-14 whitespace-nowrap shrink-0"
                        >
                          <span className="hero-sparkle-pulse text-amber-500">
                            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                          </span>
                          <span className="bg-gradient-to-r from-slate-900 via-sky-700 to-indigo-700 dark:from-white dark:via-sky-300 dark:to-amber-200 bg-clip-text text-transparent hero-text-gradient-animated">
                            Sekolah Dasar Negeri Cikawao,
                          </span>
                          <span className="hero-word-wave bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 bg-clip-text text-transparent hero-text-gradient-animated">
                            Ceria,
                          </span>
                          <span className="hero-word-wave hero-delay-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 bg-clip-text text-transparent hero-text-gradient-animated">
                            Cerdas,
                          </span>
                          <span className="text-slate-700 dark:text-slate-200">dan</span>
                          <span className="hero-word-wave hero-delay-2 bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 bg-clip-text text-transparent hero-text-gradient-animated">
                            Berkarakter
                          </span>
                          <span className="hero-sparkle-pulse hero-delay-sparkle text-emerald-500">
                            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </h1>

                  <p className="text-base text-slate-700 leading-relaxed max-w-2xl mb-7">
                    Portal informasi resmi dan sistem manajemen sekolah terpadu SDN Cikawao di{' '}
                    {SCHOOL_INFO.address}. Menghubungkan kegiatan belajar mengajar yang
                    menyenangkan, pemantauan akademik siswa secara real-time, transparansi PKKS,
                    pelaporan Jabar Beraksi, dan layanan pengaduan masyarakat SILOKA.
                  </p>

                  <div className="flex flex-wrap items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => onSelectTab('profil')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-xl btn-3d-sky whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Profil & Visi Misi
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={onOpenNotifications}
                      className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Icon3D name="bell" size="sm" />
                      <span>Notifikasi Orang Tua</span>
                      {unreadAnnouncementsCount > 0 && (
                        <span className="font-mono tabular-nums text-xs font-extrabold text-rose-700">
                          ({unreadAnnouncementsCount})
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectTab('siloka')}
                      className="text-sm font-bold text-violet-700 hover:text-violet-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Layanan SILOKA
                    </button>

                    {siteMedia.heroVideoUrl && parseVideoUrl(siteMedia.heroVideoUrl) && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewVideoModal({
                            url: siteMedia.heroVideoUrl || '',
                            title: 'Video Profil SDN Cikawao',
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Tonton Video Profil
                      </button>
                    )}

                    {siteMedia.schoolProfileDocUrl &&
                      isSafeMediaHref(siteMedia.schoolProfileDocUrl) && (
                        <a
                          href={siteMedia.schoolProfileDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Dokumen Profil
                        </a>
                      )}
                  </div>
                </div>

                <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[340px] rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                  <SafeImage
                    src={siteMedia.heroImageUrl || GENERATED_IMAGES.heroCampus}
                    alt="Kampus SDN Cikawao Desa Sukawangi Kecamatan Pamulihan Sumedang"
                    className="w-full h-full lg:h-full object-cover"
                    fallbackTitle="Kampus SDN Cikawao, Kec. Pamulihan"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-5 text-white">
                    <p className="text-xs font-bold text-amber-300 mb-0.5">
                      Kepala Sekolah SDN Cikawao
                    </p>
                    <p className="text-base font-extrabold font-display">
                      {SCHOOL_INFO.principalName}
                    </p>
                    <p className="text-xs text-sky-100 font-mono tabular-nums">
                      NIP. {SCHOOL_INFO.principalNip} · {SCHOOL_INFO.principalRank}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4-Column Colorful 3D School Stats Strip */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4">
                  <Icon3D name="students" size="md" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Peserta Didik</p>
                    <p className="text-2xl font-extrabold font-display text-slate-900 tabular-nums">
                      {SCHOOL_INFO.totalStudentsTarget}
                    </p>
                    <p className="text-xs text-slate-600">Siswa Kelas I s.d. VI</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-2xl p-4 flex items-center gap-4">
                  <Icon3D name="rombel" size="md" />
                  <div>
                    <p className="text-xs font-bold text-rose-800">Rombel Aktif</p>
                    <p className="text-2xl font-extrabold font-display text-slate-900 tabular-nums">
                      {SCHOOL_INFO.totalRombel}
                    </p>
                    <p className="text-xs text-slate-600">Rombongan belajar</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
                  <Icon3D name="teacher" size="md" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Pendidik Aktif</p>
                    <p className="text-2xl font-extrabold font-display text-slate-900 tabular-nums">
                      {SCHOOL_INFO.totalTeachers}
                    </p>
                    <p className="text-xs text-slate-600">Guru profesional</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-4 flex items-center gap-4">
                  <Icon3D name="curriculum" size="md" />
                  <div>
                    <p className="text-xs font-bold text-violet-800">Kurikulum</p>
                    <p className="text-lg font-extrabold font-display text-slate-900 leading-tight">
                      {SCHOOL_INFO.curriculum}
                    </p>
                    <p className="text-xs text-slate-600">Projek P5 & Aktif</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Automated Announcement Banner */}
          {latestAnnouncement && (
            <section className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-500 text-white border-b border-sky-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <Icon3D name="bell" size="sm" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-amber-200 mb-0.5 font-semibold">
                      <span className="text-white font-bold">
                        Pengumuman Otomatis Orang Tua
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{latestAnnouncement.priority}</span>
                      <span aria-hidden="true">·</span>
                      <span>{latestAnnouncement.targetRombel}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {latestAnnouncement.title} —{' '}
                      <span className="text-sky-50 font-normal">
                        {latestAnnouncement.message}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="self-start md:self-center inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl shadow-[0_3px_0_#b45309] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Semua Pengumuman ({activeAnnouncements.length})
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* Visi Misi Highlight + Shortcut Menu ke Masing-masing Tab */}
          <section className="py-14 bg-gradient-to-b from-white via-sky-50/40 to-amber-50/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              {/* Visi Misi Box */}
              <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 border-2 border-sky-200 p-2 shrink-0 flex items-center justify-center">
                    <img
                      src={SCHOOL_INFO.logoUrl}
                      alt="Logo SDN Cikawao"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sky-700 mb-1">
                      Visi & Misi SDN Cikawao
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-slate-900 font-display leading-relaxed">
                      &ldquo;{SCHOOL_INFO.vision}&rdquo;
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTab('profil')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 rounded-xl whitespace-nowrap shrink-0 cursor-pointer self-start md:self-center"
                >
                  Lihat Profil & Misi Lengkap
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcut Cards ke Setiap Tab */}
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-bold text-emerald-700 mb-1">
                      Jelajahi Menu Portal Sekolah
                    </p>
                    <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                      Akses Cepat Layanan SDN Cikawao
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {PORTAL_SHORTCUTS.map((sc) => (
                    <button
                      key={sc.tab}
                      type="button"
                      onClick={() => onSelectTab(sc.tab)}
                      className={`text-left border-2 rounded-2xl p-5 transition-colors cursor-pointer flex items-start gap-4 ${sc.cardClass}`}
                    >
                      <Icon3D name={sc.icon} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-extrabold text-slate-900 font-display">
                          {sc.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {sc.desc}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 mt-3">
                          Buka Halaman
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kabar Terbaru Highlight */}
              {news.length > 0 && (
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs font-bold text-amber-700 mb-1">
                        Sorotan KBM Terkini
                      </p>
                      <h2 className="text-2xl font-extrabold text-slate-900 font-display">
                        Kabar Terbaru SDN Cikawao
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectTab('kbm-galeri')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 underline underline-offset-4 cursor-pointer"
                    >
                      Lihat Semua Berita & Galeri
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {news.slice(0, 3).map((item) => (
                      <article
                        key={item.id}
                        className="border-2 border-sky-200 rounded-2xl overflow-hidden bg-white flex flex-col hover:border-sky-400 transition-colors"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-sky-50">
                          <SafeImage
                            src={item.imageUrl || parseVideoUrl(item.videoUrl)?.youtubeThumb}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            fallbackTitle={item.title}
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-bold text-sky-700">{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.publishedDate}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 font-display mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 flex-1">
                            {item.summary}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedNews(item)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 self-start cursor-pointer"
                          >
                            Baca Selengkapnya
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PROFIL SEKOLAH, VISI MISI & DIREKTORI 8 GURU                   */}
      {/* ===================================================================== */}
      {activeTab === 'profil' && (
        <div className="flex-1">
          <VisiMisiRunningBanner />
          <section className="py-12 bg-gradient-to-b from-sky-50/70 via-white to-amber-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Sambutan Kepala Sekolah */}
                <div className="lg:col-span-5 bg-gradient-to-br from-amber-50 to-orange-50/80 border-2 border-amber-200 rounded-2xl p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0">
                      <SafeImage
                        src={siteMedia.principalPhotoUrl || GENERATED_IMAGES.principalPortrait}
                        alt={SCHOOL_INFO.principalName}
                        className="w-full h-full object-cover"
                        fallbackTitle="Kepala Sekolah"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-700 mb-1">
                        Sambutan Kepala Sekolah
                      </p>
                      <h2 className="text-lg font-extrabold text-slate-900 font-display">
                        {SCHOOL_INFO.principalName}
                      </h2>
                      <p className="text-xs text-slate-600 font-mono tabular-nums mt-0.5">
                        NIP. {SCHOOL_INFO.principalNip}
                      </p>
                      <p className="text-xs font-medium text-amber-900 mt-0.5">
                        {SCHOOL_INFO.principalRank}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed mb-4">
                    Assalamu&apos;alaikum Warahmatullahi Wabarakatuh. Sampurasun. Selamat datang
                    di portal digital resmi SDN Cikawao. Kehadiran platform ini merupakan wujud
                    komitmen kami dalam menghadirkan layanan pendidikan dasar yang transparan,
                    ceria, dan mudah diakses oleh seluruh orang tua dari 184 peserta didik kami.
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Melalui penerapan Kurikulum Merdeka bersama 8 pendidik di 6 rombongan belajar,
                    kami mengajak orang tua ikut memantau perkembangan akademik anak, mengakses
                    galeri KBM, meninjau capaian PKKS serta program Jabar Beraksi, dan
                    menyampaikan aspirasi melalui layanan SILOKA.
                  </p>

                  <div className="mt-6 pt-5 border-t border-amber-200 space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{SCHOOL_INFO.address}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-mono tabular-nums font-semibold">
                        NPSN: {SCHOOL_INFO.npsn} · Kurikulum Merdeka
                      </span>
                    </div>
                    {siteMedia.schoolProfileDocUrl &&
                      isSafeMediaHref(siteMedia.schoolProfileDocUrl) && (
                        <a
                          href={siteMedia.schoolProfileDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline pt-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Unduh / Lihat Dokumen Profil Sekolah
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                  </div>
                </div>

                {/* Visi, Misi & Distribusi Rombel */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 p-1.5 shrink-0 flex items-center justify-center">
                        <img
                          src={SCHOOL_INFO.logoUrl}
                          alt="Logo SDN Cikawao"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-sky-700">
                          Visi & Misi Satuan Pendidikan
                        </p>
                        <h2 className="text-2xl font-extrabold text-slate-900 font-display text-balance">
                          Arah Pendidikan SDN Cikawao
                        </h2>
                      </div>
                    </div>
                    <p className="text-base font-semibold text-slate-800 leading-relaxed pb-6 border-b border-sky-100">
                      &ldquo;{SCHOOL_INFO.vision}&rdquo;
                    </p>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {SCHOOL_INFO.missions.map((mission, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border ${MISSION_COLORS[idx % MISSION_COLORS.length]} space-y-1`}
                        >
                          <span className="text-xs font-mono font-extrabold tabular-nums">
                            0{idx + 1}.
                          </span>
                          <p className="text-sm text-slate-800 leading-relaxed">{mission}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distribusi 184 Siswa per 6 Rombel */}
                  <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 font-display">
                          Sebaran 184 Peserta Didik pada 6 Rombel
                        </h3>
                        <p className="text-xs text-slate-600">
                          Data rombongan belajar aktif tahun ajaran berjalan
                        </p>
                      </div>
                      {isAuthorizedAdmin && (
                        <button
                          type="button"
                          onClick={() => onOpenDashboard('students')}
                          className="text-xs font-bold text-sky-700 hover:text-sky-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Kelola Data Siswa Real-Time
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {SCHOOL_INFO.rombelDistribution.map((item, idx) => (
                        <div
                          key={item.rombel}
                          className={`border-2 rounded-xl p-3 text-center ${ROMBEL_PALETTES[idx % ROMBEL_PALETTES.length]}`}
                        >
                          <p className="text-xs font-bold">{item.rombel}</p>
                          <p className="text-xl font-extrabold font-mono tabular-nums mt-0.5">
                            {item.count}
                          </p>
                          <p className="text-[11px] opacity-80">siswa</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Direktori Pendidik & Kepala Sekolah */}
              <div className="bg-white border-2 border-sky-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Icon3D name="teacher" size="sm" />
                    <div>
                      <h3 className="text-lg font-extrabold font-display">
                        Pimpinan & Tenaga Pendidik SDN Cikawao
                      </h3>
                      <p className="text-xs text-sky-100 mt-0.5">
                        Kepala Sekolah dan 8 Guru pengajar aktif Kurikulum Merdeka
                      </p>
                    </div>
                  </div>
                  {isAuthorizedAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenDashboard('teachers')}
                      className="px-3.5 py-1.5 text-xs font-bold bg-white text-sky-800 hover:bg-sky-50 rounded-lg cursor-pointer"
                    >
                      Kelola Data Guru
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-sky-100 bg-sky-50/80 text-xs font-bold text-slate-700">
                        <th className="py-3 px-6">Nama Lengkap</th>
                        <th className="py-3 px-4">NIP / NUPTK</th>
                        <th className="py-3 px-4">Jabatan</th>
                        <th className="py-3 px-4">Pangkat / Golongan</th>
                        <th className="py-3 px-4">Tugas Mengajar</th>
                        <th className="py-3 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {teachers.map((t) => (
                        <tr key={t.id} className="hover:bg-sky-50/40 transition-colors">
                          <td className="py-3 px-6 font-semibold text-slate-900">
                            <div className="flex items-center gap-3">
                              {t.photoUrl && isSafeMediaHref(t.photoUrl) ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewPhotoModal({
                                      url: t.photoUrl || '',
                                      title: t.name,
                                    })
                                  }
                                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-sky-200 shrink-0 cursor-pointer hover:border-sky-400"
                                >
                                  <SafeImage
                                    src={t.photoUrl}
                                    alt={t.name}
                                    className="w-full h-full object-cover"
                                    fallbackTitle={t.name}
                                  />
                                </button>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 border-2 border-sky-200 flex items-center justify-center text-xs font-extrabold text-sky-800 shrink-0">
                                  {t.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900">{t.name}</p>
                                {(t.videoUrl || t.documentUrl) && (
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {t.videoUrl && parseVideoUrl(t.videoUrl) && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPreviewVideoModal({
                                            url: t.videoUrl || '',
                                            title: `Video Profil / Mengajar - ${t.name}`,
                                          })
                                        }
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                                      >
                                        <Video className="w-3 h-3" />
                                        Video
                                      </button>
                                    )}
                                    {t.documentUrl && isSafeMediaHref(t.documentUrl) && (
                                      <a
                                        href={t.documentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:underline"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Dokumen
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600">
                            {t.nip || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{t.position}</td>
                          <td className="py-3 px-4 text-slate-600 text-xs">
                            {t.rank || '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{t.rombel}</td>
                          <td className="py-3 px-6 text-right">
                            <span
                              className={`text-xs font-bold ${
                                t.status === 'Aktif' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: KBM & GALERI FOTO & VIDEO SEKOLAH                              */}
      {/* ===================================================================== */}
      {activeTab === 'kbm-galeri' && (
        <section className="flex-1 py-12 bg-gradient-to-b from-amber-50/60 via-white to-pink-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Berita & KBM */}
            <div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <Icon3D name="news" size="lg" />
                  <div>
                    <p className="text-xs font-bold text-sky-700 mb-1">
                      Berita & Kegiatan Belajar Mengajar
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display text-balance">
                      Kabar Terbaru SDN Cikawao
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-sky-100/80 rounded-xl border border-sky-200">
                  {(
                    ['Semua', 'KBM', 'Kurikulum Merdeka', 'Kegiatan Sekolah', 'Prestasi'] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewsFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        newsFilter === cat
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-700 hover:text-sky-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredNews.length === 0 ? (
                <div className="border-2 border-sky-200 bg-white rounded-2xl p-10 text-center text-sm text-slate-500">
                  Belum ada berita pada kategori ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filteredNews.map((item) => {
                    const hasVideo = Boolean(item.videoUrl && parseVideoUrl(item.videoUrl));
                    const hasDoc = Boolean(
                      item.documentUrl && isSafeMediaHref(item.documentUrl)
                    );
                    return (
                      <article
                        key={item.id}
                        className="border-2 border-sky-200 rounded-2xl overflow-hidden bg-white flex flex-col hover:border-sky-400 transition-colors"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-sky-50">
                          <SafeImage
                            src={item.imageUrl || parseVideoUrl(item.videoUrl)?.youtubeThumb}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            fallbackTitle={item.title}
                          />
                          {hasVideo && (
                            <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-600/95 text-white rounded-lg shadow">
                              <Play className="w-3 h-3 fill-current" />
                              Video
                            </span>
                          )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <span className="font-bold text-sky-700">{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{item.publishedDate}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 font-display mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">
                            {item.summary}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedNews(item)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                            >
                              Baca Selengkapnya
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            {hasDoc && (
                              <a
                                href={item.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Lampiran
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Galeri Foto & Video Sekolah */}
            <div className="pt-12 border-t border-rose-200">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <Icon3D name="gallery" size="lg" />
                  <div>
                    <p className="text-xs font-bold text-rose-700 mb-1">
                      Dokumentasi Kegiatan
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display text-balance">
                      Galeri Foto & Video Sekolah untuk Orang Tua
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 bg-rose-100/80 rounded-xl border border-rose-200">
                  {(
                    [
                      'Semua',
                      'KBM',
                      'Ekstrakurikuler',
                      'Seni Budaya',
                      'Lingkungan Sekolah',
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGalleryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        galleryFilter === cat
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-slate-700 hover:text-rose-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {filteredGallery.length === 0 ? (
                <div className="border-2 border-rose-200 bg-white rounded-2xl p-10 text-center text-sm text-slate-500">
                  Belum ada dokumentasi foto atau video pada kategori ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {filteredGallery.map((photo) => {
                    const isVideo =
                      photo.mediaType === 'video' || Boolean(parseVideoUrl(photo.videoUrl));
                    const thumbSrc =
                      photo.imageUrl ||
                      parseVideoUrl(photo.videoUrl)?.youtubeThumb ||
                      GENERATED_IMAGES.kbmClassroom;
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="group text-left border-2 border-rose-200 rounded-2xl overflow-hidden bg-white hover:border-rose-500 transition-colors cursor-pointer"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-rose-50">
                          <SafeImage
                            src={thumbSrc}
                            alt={photo.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                            fallbackTitle={photo.title}
                          />
                          {isVideo && (
                            <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                              <span className="w-11 h-11 rounded-full bg-rose-600/95 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                            <span className="font-bold text-rose-700">{photo.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{photo.takenDate}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {photo.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                            {photo.caption}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: TRANSPARANSI PKKS                                              */}
      {/* ===================================================================== */}
      {activeTab === 'pkks' && (
        <section className="flex-1 py-12 bg-gradient-to-b from-emerald-50/70 via-white to-amber-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div className="flex items-start gap-4">
                <Icon3D name="pkks" size="lg" />
                <div>
                  <p className="text-xs font-bold text-amber-700 mb-1">
                    Akuntabilitas Manajemen Sekolah
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display text-balance">
                    Penilaian Kinerja Kepala Sekolah (PKKS)
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                    Rekapitulasi indikator manajerial, supervisi guru, dan pengembangan mutu SDN
                    Cikawao yang dipimpin oleh {SCHOOL_INFO.principalName}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 bg-gradient-to-r from-amber-100 to-yellow-50 border-2 border-amber-300 rounded-2xl px-6 py-4 shrink-0">
                <div>
                  <p className="text-xs font-bold text-amber-900">Rata-rata Capaian</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-emerald-800">
                    {pkksAverage}%
                  </p>
                </div>
                <div className="h-8 w-px bg-amber-300" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Indikator Terpenuhi</p>
                  <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                    {pkksFulfilledCount}/{pkksItems.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-amber-200 bg-amber-50/90 text-xs font-bold text-slate-700">
                      <th className="py-3.5 px-6">Kode & Komponen</th>
                      <th className="py-3.5 px-4">Uraian Indikator & Bukti Fisik</th>
                      <th className="py-3.5 px-4 text-right">Capaian</th>
                      <th className="py-3.5 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {pkksItems.map((item) => {
                      const statusColor =
                        item.status === 'Terpenuhi'
                          ? 'text-emerald-700'
                          : item.status === 'Proses Verifikasi'
                            ? 'text-amber-700'
                            : 'text-rose-700';
                      return (
                        <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-4 px-6 align-top whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-amber-700 block">
                              {item.indicatorCode}
                            </span>
                            <span className="font-bold text-slate-900">{item.component}</span>
                          </td>
                          <td className="py-4 px-4 align-top">
                            <p className="font-semibold text-slate-900 mb-1">
                              {item.indicatorTitle}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              Bukti: {item.evidenceSummary}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              {item.evidencePhotoUrl &&
                                isSafeMediaHref(item.evidencePhotoUrl) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewPhotoModal({
                                        url: item.evidencePhotoUrl || '',
                                        title: `Foto Bukti ${item.indicatorCode} — ${item.indicatorTitle}`,
                                      })
                                    }
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                                  >
                                    <span className="w-8 h-6 rounded overflow-hidden border border-amber-300 inline-block shrink-0">
                                      <SafeImage
                                        src={item.evidencePhotoUrl}
                                        alt={item.indicatorCode}
                                        className="w-full h-full object-cover"
                                      />
                                    </span>
                                    Foto Bukti
                                  </button>
                                )}
                              {item.evidenceVideoUrl &&
                                parseVideoUrl(item.evidenceVideoUrl) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewVideoModal({
                                        url: item.evidenceVideoUrl || '',
                                        title: `Video Bukti ${item.indicatorCode} — ${item.indicatorTitle}`,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Video Bukti
                                  </button>
                                )}
                              {item.evidenceUrl && isSafeMediaHref(item.evidenceUrl) && (
                                <a
                                  href={item.evidenceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                                >
                                  Lihat Dokumen Pendukung
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 align-top text-right font-mono tabular-nums whitespace-nowrap">
                            <span className="font-extrabold text-emerald-700">
                              {item.achievedScore}
                            </span>
                            <span className="text-xs text-slate-400">
                              {' '}
                              / {item.targetScore}
                            </span>
                          </td>
                          <td className="py-4 px-6 align-top text-right whitespace-nowrap">
                            <span className={`text-xs font-bold ${statusColor}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB: PESERTA DIDIK — PENCARIAN NISN SAJA (NAMA SAJA ATAU NIK SAJA)    */}
      {/* ===================================================================== */}
      {activeTab === 'peserta-didik' && (
        <section className="flex-1 py-12 bg-gradient-to-b from-cyan-50/70 via-white to-sky-50/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-start gap-4">
              <Icon3D name="students" size="lg" />
              <div>
                <p className="text-xs font-bold text-cyan-700 mb-1">
                  Layanan Informasi Peserta Didik
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display text-balance">
                  Pencarian NISN Peserta Didik
                </h2>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  Pilih pencarian berdasarkan <strong>Nama Lengkap saja</strong> atau{' '}
                  <strong>NIK saja</strong> untuk menampilkan nomor <strong>NISN</strong> peserta
                  didik.
                </p>
              </div>
            </div>

            <div className="bg-white border-2 border-cyan-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div
                role="tablist"
                aria-label="Metode pencarian NISN"
                className="grid grid-cols-2 gap-2 p-1.5 bg-cyan-50/80 border-2 border-cyan-200 rounded-xl"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={pdSearchMode === 'nama'}
                  onClick={() => handleSwitchPdMode('nama')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                    pdSearchMode === 'nama'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm'
                      : 'text-cyan-900 hover:bg-white/80'
                  }`}
                >
                  Cari dengan Nama
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={pdSearchMode === 'nik'}
                  onClick={() => handleSwitchPdMode('nik')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                    pdSearchMode === 'nik'
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-sm'
                      : 'text-cyan-900 hover:bg-white/80'
                  }`}
                >
                  Cari dengan NIK
                </button>
              </div>

              <form onSubmit={(e) => void handlePdLookupSubmit(e)} className="space-y-4">
                {pdSearchMode === 'nama' ? (
                  <div>
                    <label
                      htmlFor="pd-search-name"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Nama Lengkap Peserta Didik
                    </label>
                    <input
                      id="pd-search-name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={pdQuery}
                      onChange={(e) => setPdQuery(e.target.value)}
                      placeholder="Contoh: Alifah Zahra Putri"
                      className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="pd-search-nik"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      NIK Peserta Didik (Angka)
                    </label>
                    <input
                      id="pd-search-nik"
                      type="text"
                      inputMode="numeric"
                      required
                      minLength={6}
                      maxLength={20}
                      value={pdQuery}
                      onChange={(e) => setPdQuery(normalizeNik(e.target.value))}
                      placeholder="16 digit angka NIK"
                      className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-200 rounded-xl font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
                    Hasil pencarian hanya menampilkan nomor NISN demi privasi siswa.
                  </p>
                  <button
                    type="submit"
                    disabled={pdLookupBusy}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 rounded-xl btn-3d-sky cursor-pointer disabled:opacity-60"
                  >
                    <Search className="w-4 h-4" />
                    {pdLookupBusy ? 'Mencari NISN...' : 'Cari NISN'}
                  </button>
                </div>
              </form>

              {pdLookupError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold rounded-xl">
                  {pdLookupError}
                </div>
              )}

              {pdLookupResult && pdLookupResult.found && pdLookupResult.nisn && (
                <div className="p-5 bg-gradient-to-r from-cyan-50 to-emerald-50 border-2 border-cyan-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-cyan-800 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      NISN Peserta Didik Ditemukan
                    </p>
                    <p className="text-3xl font-extrabold font-mono tabular-nums tracking-wider text-slate-900 mt-1">
                      {pdLookupResult.nisn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopyNisn()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-cyan-900 bg-white hover:bg-cyan-100 border-2 border-cyan-300 rounded-xl cursor-pointer self-start sm:self-center"
                  >
                    {pdCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        NISN Disalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Salin NISN
                      </>
                    )}
                  </button>
                </div>
              )}

              {pdLookupResult && !pdLookupResult.found && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed rounded-xl flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    NISN belum ditemukan untuk{' '}
                    {pdSearchMode === 'nama' ? 'Nama Lengkap' : 'NIK'} tersebut. Pastikan penulisan{' '}
                    {pdSearchMode === 'nama' ? 'nama lengkap' : 'angka NIK'} sesuai dengan data
                    Dapodik sekolah, coba metode pencarian lainnya, atau hubungi pihak sekolah
                    melalui email <span className="font-mono font-bold">{SCHOOL_INFO.email}</span>.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: JABAR BERAKSI — 5 PILAR PROGRAM & MUTU SEKOLAH                 */}
      {/* ===================================================================== */}
      {activeTab === 'jabar-beraksi' && (
        <section className="flex-1 py-12 bg-gradient-to-b from-emerald-50/60 via-white to-sky-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex items-start gap-4">
                <Icon3D name="ekskul" size="lg" />
                <div>
                  <p className="text-xs font-bold text-emerald-700 mb-1">
                    Jabar Beraksi — Program Mutu & Karakter SDN Cikawao
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display text-balance">
                    5 Pilar Utama Jabar Beraksi SDN Cikawao
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                    Pelaporan transparan pelaksanaan Pendidikan Karakter, Digitalisasi
                    Pembelajaran, Kualitas Dapodik, SPMI, serta Analisis Daya Tampung sekolah.
                  </p>
                </div>
              </div>
            </div>

            {/* 5 Pilar Cards Jabar Beraksi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {JABAR_BERAKSI_PILLARS.map((pillar) => {
                const isSelected = ekskulFilter === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() =>
                      setEkskulFilter(isSelected ? 'Semua' : pillar.id)
                    }
                    className={`text-left p-4 rounded-2xl border-2 transition-colors cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-white border-emerald-200 hover:border-emerald-400 text-slate-900'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-xs font-mono font-extrabold tabular-nums ${
                          isSelected ? 'text-amber-200' : 'text-emerald-700'
                        }`}
                      >
                        {pillar.code}
                      </span>
                      <h3 className="text-base font-extrabold font-display mt-1">
                        {pillar.id}
                      </h3>
                      <p
                        className={`text-xs leading-relaxed mt-2 ${
                          isSelected ? 'text-emerald-50' : 'text-slate-600'
                        }`}
                      >
                        {pillar.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-emerald-100/80 rounded-xl border border-emerald-200 w-fit">
              {[
                'Semua',
                'Pendidikan Karakter',
                'Digitalisasi Pembelajaran',
                'Kualitas Dapodik',
                'SPMI',
                'Analisis Daya Tampung',
                ...(ekskulReports.some((r) => r.ekskulName === 'Pencak Silat')
                  ? ['Pencak Silat']
                  : []),
              ].map((ek) => (
                <button
                  key={ek}
                  type="button"
                  onClick={() => setEkskulFilter(ek)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ekskulFilter === ek
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 hover:text-emerald-800'
                  }`}
                >
                  {ek}
                </button>
              ))}
            </div>

            {filteredEkskul.length === 0 ? (
              <div className="border-2 border-emerald-200 bg-white rounded-2xl p-10 text-center text-sm text-slate-500">
                Belum ada laporan kegiatan untuk bidang ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredEkskul.map((rep) => {
                const hasVideo = Boolean(rep.videoUrl && parseVideoUrl(rep.videoUrl));
                const hasDoc = Boolean(
                  rep.documentUrl && isSafeMediaHref(rep.documentUrl)
                );
                const thumbSrc =
                  rep.imageUrl ||
                  parseVideoUrl(rep.videoUrl)?.youtubeThumb ||
                  GENERATED_IMAGES.pramukaGarden;
                return (
                  <div
                    key={rep.id}
                    className="border-2 border-emerald-200 rounded-2xl overflow-hidden bg-white flex flex-col hover:border-emerald-400 transition-colors"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
                      <SafeImage
                        src={thumbSrc}
                        alt={rep.activityTitle}
                        className="w-full h-full object-cover"
                        fallbackTitle={rep.ekskulName}
                      />
                      {hasVideo && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewVideoModal({
                              url: rep.videoUrl || '',
                              title: `${rep.ekskulName} — ${rep.activityTitle}`,
                            })
                          }
                          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-rose-600/95 hover:bg-rose-700 text-white rounded-lg shadow cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Tonton Video
                        </button>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col bg-white">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                        <span className="font-bold text-emerald-700">{rep.ekskulName}</span>
                        <span className="font-mono tabular-nums">{rep.activityDate}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 font-display mb-2">
                        {rep.activityTitle}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                        {rep.reportSummary}
                      </p>

                      <div className="pt-4 border-t border-emerald-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            Peserta Aktif
                          </span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {rep.participantCount} siswa
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            Jadwal
                          </span>
                          <span className="text-slate-800">{rep.schedule}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Pembina</span>
                          <span className="font-semibold text-slate-800">{rep.coachName}</span>
                        </div>
                        {rep.transparencyNote && (
                          <p className="pt-2 text-[11px] text-emerald-900 bg-emerald-50 rounded-lg p-2.5 mt-2">
                            Transparansi: {rep.transparencyNote}
                          </p>
                        )}
                        {(hasVideo || hasDoc) && (
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            {hasVideo && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewVideoModal({
                                    url: rep.videoUrl || '',
                                    title: `${rep.ekskulName} — ${rep.activityTitle}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:underline cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Putar Video
                              </button>
                            )}
                            {hasDoc && (
                              <a
                                href={rep.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Laporan / Dokumen
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: SILOKA — PERENCANAAN, PENGORGANISASIAN, PELAKSANA, UNGGULAN, EVALUASI */}
      {/* ===================================================================== */}
      {activeTab === 'siloka' && (
        <section className="flex-1 py-12 bg-gradient-to-br from-violet-50/80 via-white to-rose-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Info & 5 Pilar Tata Kelola SILOKA */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-start gap-4">
                  <Icon3D name="siloka" size="lg" />
                  <div>
                    <p className="text-xs font-bold text-violet-700 mb-1">
                      SILOKA — Sistem Layanan Pengaduan Masyarakat
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display text-balance mb-3">
                      Tata Kelola & Layanan Pengaduan Cepat dan Responsif
                    </h2>
                  </div>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  SILOKA menghubungkan orang tua murid dan warga Desa Sukawangi langsung dengan
                  Kepala Sekolah dan tim layanan SDN Cikawao melalui alur manajemen sekolah yang
                  terukur.
                </p>

                <div className="bg-white border-2 border-violet-200 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900 font-display">
                    5 Unsur Layanan SILOKA SDN Cikawao
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-700">
                    {SILOKA_PILLARS.map((p, idx) => {
                      const bgColors = [
                        'bg-violet-50/80 text-violet-800',
                        'bg-sky-50/80 text-sky-800',
                        'bg-emerald-50/80 text-emerald-800',
                        'bg-amber-50/80 text-amber-800',
                        'bg-rose-50/80 text-rose-800',
                      ];
                      const pillarFiles = silokaDocuments.filter((d) => d.pillar === p.id);
                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl ${bgColors[idx % bgColors.length]}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-extrabold font-display">
                              <span className="font-mono mr-1.5">{p.code}</span>
                              {p.id}
                            </p>
                            {pillarFiles.length > 0 && (
                              <span className="text-[11px] font-mono font-bold tabular-nums text-slate-600">
                                {pillarFiles.length} file
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                            {p.description}
                          </p>
                          {pillarFiles.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/70 space-y-1.5">
                              {pillarFiles.map((f) => {
                                const isData = f.fileUrl.startsWith('data:');
                                return (
                                  <div
                                    key={f.id}
                                    className="flex items-center justify-between gap-2 bg-white/90 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                                  >
                                    <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                                      <FileText className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                                      <span className="truncate">{f.title}</span>
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setPreviewSilokaDoc(f)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:underline cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Lihat
                                      </button>
                                      {isData ? (
                                        <a
                                          href={f.fileUrl}
                                          download={f.fileName || f.title}
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                                        >
                                          <Download className="w-3 h-3" />
                                          Unduh
                                        </a>
                                      ) : (
                                        <a
                                          href={f.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          Buka
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Informasi Layanan Read-Only & Kontak Resmi SILOKA */}
              <div className="lg:col-span-7 bg-white border-2 border-violet-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3.5">
                  <Icon3D name="siloka" size="md" />
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 font-display">
                      Informasi Resmi & Kontak Layanan SILOKA
                    </h3>
                    <p className="text-xs text-slate-500">
                      Portal publik bersifat baca-saja; pengelolaan dokumen dikelola oleh admin
                      resmi sekolah
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-50/70 border border-violet-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-violet-700 shrink-0 mt-0.5" />
                  <span>
                    Seluruh dokumen <strong>Perencanaan, Pengorganisasian, Pelaksana, Program
                    Unggulan,</strong> dan <strong>Evaluasi</strong> pada panel di samping dapat
                    dilihat serta diunduh secara terbuka oleh orang tua murid dan masyarakat.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                    <p className="text-xs font-bold text-violet-800 inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Email Resmi & Pengaduan
                    </p>
                    <p className="text-sm font-mono font-bold text-slate-900">
                      {SCHOOL_INFO.email}
                    </p>
                    <p className="text-xs text-slate-600">
                      Saluran resmi korespondensi, saran, dan pengaduan masyarakat SDN Cikawao.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Layanan Tatap Muka Sekolah
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {SCHOOL_INFO.principalName}
                    </p>
                    <p className="text-xs text-slate-600">{SCHOOL_INFO.address}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800">
                    Kanal Resmi &amp; Media Sosial Kami
                  </p>
                  <SocialContactIcons variant="card" />
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Total dokumen tata kelola tersedia:{' '}
                    <span className="font-mono font-bold text-slate-800">
                      {silokaDocuments.length} file
                    </span>
                  </p>
                  {isAuthorizedAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenDashboard('siloka')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl cursor-pointer"
                    >
                      Kelola SILOKA di Dashboard
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* QUIET INSTITUTIONAL FOOTER — WITH OFFICIAL SCHOOL LOGO              */}
      {/* ------------------------------------------------------------------- */}
      <footer className="bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 text-slate-200 mt-auto">
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-amber-400 via-emerald-400 to-rose-400" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SDN Cikawao"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-lg font-extrabold text-white font-display mb-1">
                {SCHOOL_INFO.name}
              </p>
              <p className="text-xs text-amber-300 font-semibold leading-relaxed">
                NPSN {SCHOOL_INFO.npsn} · {SCHOOL_INFO.curriculum}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mt-2">
                {SCHOOL_INFO.address}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-white mb-3">Tautan Portal</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('beranda')}
                  className="hover:text-sky-300 transition-colors cursor-pointer"
                >
                  Beranda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('profil')}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Profil & Visi Misi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('kbm-galeri')}
                  className="hover:text-sky-300 transition-colors cursor-pointer"
                >
                  Berita KBM & Galeri Foto
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('pkks')}
                  className="hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Transparansi PKKS
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('peserta-didik')}
                  className="hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Peserta Didik (Cek NISN)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('jabar-beraksi')}
                  className="hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Jabar Beraksi
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTab('siloka')}
                  className="hover:text-violet-300 transition-colors cursor-pointer"
                >
                  Layanan SILOKA
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold text-white mb-3">Kontak Resmi</p>
            <p className="text-xs text-slate-200">
              Kepala Sekolah: {SCHOOL_INFO.principalName}
            </p>
            <p className="text-xs text-sky-200 font-mono mt-1">
              NIP. {SCHOOL_INFO.principalNip}
            </p>
            <p className="text-xs text-slate-300 mt-2">Email: {SCHOOL_INFO.email}</p>
            <div className="mt-4">
              <p className="text-[11px] font-bold text-slate-300 mb-2">
                Media Sosial &amp; Kontak Kami
              </p>
              <SocialContactIcons variant="footer" />
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} SDN Cikawao, Kec. Pamulihan, Kab. Sumedang.</p>
          <p className="text-[11px] font-semibold text-sky-300">
            Powered by Tim IT SDN Cikawao
          </p>
        </div>
      </footer>

      {/* ------------------------------------------------------------------- */}
      {/* NEWS READER MODAL                                                   */}
      {/* ------------------------------------------------------------------- */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-sky-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-sky-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs">
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span className="font-bold">{selectedNews.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{selectedNews.publishedDate}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                aria-label="Tutup berita"
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedNews.imageUrl && (
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
                  <SafeImage
                    src={selectedNews.imageUrl}
                    alt={selectedNews.title}
                    className="w-full h-full object-cover"
                    fallbackTitle={selectedNews.title}
                  />
                </div>
              )}
              {selectedNews.videoUrl && parseVideoUrl(selectedNews.videoUrl) && (
                <VideoPlayer
                  url={selectedNews.videoUrl}
                  title={`Video ${selectedNews.title}`}
                />
              )}
              <h3 className="text-xl font-extrabold text-slate-900 font-display">
                {selectedNews.title}
              </h3>
              <p className="text-xs font-medium text-sky-700">
                Ditulis oleh {selectedNews.authorName}
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {selectedNews.content}
              </p>
              {selectedNews.documentUrl && isSafeMediaHref(selectedNews.documentUrl) && (
                <div className="pt-2">
                  <a
                    href={selectedNews.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 rounded-xl"
                  >
                    <FileText className="w-4 h-4" />
                    Buka Dokumen Pendukung Berita
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* GALLERY LIGHTBOX MODAL (FOTO & VIDEO)                               */}
      {/* ------------------------------------------------------------------- */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-200 rounded-2xl max-w-3xl w-full overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold font-display">{selectedPhoto.title}</h3>
                <p className="text-xs text-rose-100">
                  {selectedPhoto.category} · {selectedPhoto.takenDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                aria-label="Tutup galeri"
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 max-h-[65vh] flex items-center justify-center overflow-hidden">
              {selectedPhoto.videoUrl && parseVideoUrl(selectedPhoto.videoUrl) ? (
                <VideoPlayer
                  url={selectedPhoto.videoUrl}
                  title={selectedPhoto.title}
                  className="w-full aspect-video max-h-[65vh] bg-slate-950"
                />
              ) : (
                <SafeImage
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  className="max-h-[65vh] w-auto object-contain"
                  fallbackTitle={selectedPhoto.title}
                />
              )}
            </div>
            <div className="px-6 py-4 text-sm text-slate-700">{selectedPhoto.caption}</div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* GENERIC PHOTO LIGHTBOX MODAL                                        */}
      {/* ------------------------------------------------------------------- */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-sky-200 rounded-2xl max-w-2xl w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold font-display truncate">
                {previewPhotoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                aria-label="Tutup pratinjau foto"
                className="p-1 text-white/90 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 max-h-[70vh] flex items-center justify-center overflow-hidden">
              <SafeImage
                src={previewPhotoModal.url}
                alt={previewPhotoModal.title}
                className="max-h-[70vh] w-auto object-contain"
                fallbackTitle={previewPhotoModal.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* GENERIC VIDEO PLAYER MODAL                                          */}
      {/* ------------------------------------------------------------------- */}
      {previewVideoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-200 rounded-2xl max-w-3xl w-full overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white flex items-center justify-between gap-4">
              <h3 className="text-sm font-bold font-display truncate">
                {previewVideoModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewVideoModal(null)}
                aria-label="Tutup pemutar video"
                className="p-1 text-white/90 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 p-2 sm:p-4">
              <VideoPlayer
                url={previewVideoModal.url}
                title={previewVideoModal.title}
                className="w-full aspect-video rounded-xl overflow-hidden bg-slate-950"
              />
            </div>
          </div>
        </div>
      )}
      <SilokaFilePreviewModal
        docItem={previewSilokaDoc}
        onClose={() => setPreviewSilokaDoc(null)}
      />
    </main>
  );
}
