import React, { useState } from 'react';
import { Camera, Database, Edit2, ExternalLink, Video, X } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { GENERATED_IMAGES, SCHOOL_INFO } from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

interface OverviewTabProps {
  onSelectTab: (tab: string) => void;
}

export function OverviewTab({ onSelectTab }: OverviewTabProps) {
  const {
    user,
    userRole,
    isFirestoreSeeded,
    siteMedia,
    teachers,
    students,
    news,
    gallery,
    pkksItems,
    ekskulReports,
    announcements,
    academicEvents,
    silokaTickets,
    users,
    runInitialSeed,
    saveSiteMedia,
  } = useSchool();

  const [seedBusy, setSeedBusy] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const [mediaModal, setMediaModal] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState(siteMedia.heroImageUrl);
  const [heroVideoUrl, setHeroVideoUrl] = useState(siteMedia.heroVideoUrl || '');
  const [principalPhotoUrl, setPrincipalPhotoUrl] = useState(siteMedia.principalPhotoUrl);
  const [schoolProfileDocUrl, setSchoolProfileDocUrl] = useState(
    siteMedia.schoolProfileDocUrl || ''
  );

  const openMediaEditor = () => {
    setHeroImageUrl(siteMedia.heroImageUrl || GENERATED_IMAGES.heroCampus);
    setHeroVideoUrl(siteMedia.heroVideoUrl || '');
    setPrincipalPhotoUrl(
      siteMedia.principalPhotoUrl || GENERATED_IMAGES.principalPortrait
    );
    setSchoolProfileDocUrl(siteMedia.schoolProfileDocUrl || '');
    setMediaError(null);
    setMediaModal(true);
  };

  const handleSaveSiteMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMediaBusy(true);
    setMediaError(null);
    try {
      await saveSiteMedia({
        heroImageUrl: heroImageUrl || GENERATED_IMAGES.heroCampus,
        heroVideoUrl,
        principalPhotoUrl: principalPhotoUrl || GENERATED_IMAGES.principalPortrait,
        schoolProfileDocUrl,
        updatedBy: user?.displayName || SCHOOL_INFO.principalName,
      });
      setMediaModal(false);
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : 'Gagal menyimpan media profil sekolah.'
      );
    } finally {
      setMediaBusy(false);
    }
  };

  const handleSeed = async () => {
    setSeedBusy(true);
    setSeedMessage(null);
    try {
      await runInitialSeed();
      setSeedMessage(
        'Data awal SDN Cikawao (8 Guru, Berita KBM, Galeri, PKKS, Jabar Beraksi, Pengumuman, dan Siswa contoh) berhasil disimpan ke database real-time.'
      );
    } catch (err) {
      setSeedMessage(
        err instanceof Error ? err.message : 'Gagal mengisi data awal sekolah.'
      );
    } finally {
      setSeedBusy(false);
    }
  };

  const pendingSiloka = silokaTickets.filter((t) => t.status !== 'Selesai').length;
  const pkksFulfilled = pkksItems.filter((p) => p.status === 'Terpenuhi').length;

  return (
    <div className="space-y-6">
      {userRole === 'admin' && (
        <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50 border-2 border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Icon3D name="school" size="md" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 font-display flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-600" />
                {isFirestoreSeeded
                  ? 'Basis Data Real-Time SDN Cikawao Aktif'
                  : 'Inisialisasi Basis Data Sekolah'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {isFirestoreSeeded
                  ? 'Seluruh modul terhubung langsung ke Firestore. Anda dapat menyegarkan data awal kapan saja jika diperlukan.'
                  : 'Isi basis data Firestore dengan data profil 8 guru, contoh siswa 6 rombel, berita KBM, galeri, PKKS, dan Jabar Beraksi.'}
              </p>
              {seedMessage && (
                <p className="text-xs font-bold text-emerald-700 mt-2">{seedMessage}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled={seedBusy}
            onClick={() => void handleSeed()}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl btn-3d-emerald whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {seedBusy ? 'Menyimpan...' : 'Isi / Sinkronkan Data Awal'}
          </button>
        </div>
      )}

      {/* Admin Visual Branding, Hero Photo, Principal Portrait, Profile Video & Doc Editor */}
      {userRole === 'admin' && (
        <div className="bg-white border-2 border-rose-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Icon3D name="gallery" size="md" />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  Foto Kampus, Kepala Sekolah, Video & Dokumen Profil
                </h3>
                <p className="text-xs text-slate-600">
                  Ganti foto sampul sekolah, potret Kepala Sekolah, atau tambahkan video profil &
                  dokumen KOSP untuk halaman depan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openMediaEditor}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 rounded-xl shadow-[0_4px_0_#be123c] cursor-pointer whitespace-nowrap shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Ubah Foto / Tambah Video Profil
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border-2 border-sky-100 rounded-xl p-3 bg-sky-50/40 flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg overflow-hidden border border-sky-200 shrink-0 bg-white">
                <SafeImage
                  src={siteMedia.heroImageUrl}
                  alt="Foto Kampus SDN Cikawao"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  Foto Utama Kampus
                </p>
                <p className="text-[11px] text-slate-600 truncate">
                  Tampil di beranda atas portal
                </p>
              </div>
            </div>

            <div className="border-2 border-amber-100 rounded-xl p-3 bg-amber-50/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-amber-200 shrink-0 bg-white">
                <SafeImage
                  src={siteMedia.principalPhotoUrl}
                  alt={SCHOOL_INFO.principalName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  Foto Kepala Sekolah
                </p>
                <p className="text-[11px] text-slate-600 truncate">
                  {SCHOOL_INFO.principalName}
                </p>
              </div>
            </div>

            <div className="border-2 border-rose-100 rounded-xl p-3 bg-rose-50/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Video & Dokumen Profil
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                  <span
                    className={`font-semibold ${
                      siteMedia.heroVideoUrl ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {siteMedia.heroVideoUrl ? 'Video terpasang' : 'Belum ada video'}
                  </span>
                  {siteMedia.schoolProfileDocUrl && (
                    <a
                      href={siteMedia.schoolProfileDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-sky-700 font-bold hover:underline"
                    >
                      Dokumen
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid with 3D Icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onSelectTab('students')}
          className="text-left bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-5 transition-colors cursor-pointer flex items-start gap-3.5"
        >
          <Icon3D name="students" size="md" />
          <div>
            <span className="text-xs font-bold text-amber-800">Data Siswa Tercatat</span>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
              {students.length}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Target {SCHOOL_INFO.totalStudentsTarget} siswa ({SCHOOL_INFO.totalRombel}{' '}
              rombel)
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab(userRole === 'admin' ? 'users' : 'announcements')}
          className="text-left bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-200 hover:border-purple-400 rounded-2xl p-5 transition-colors cursor-pointer flex items-start gap-3.5"
        >
          <Icon3D name={userRole === 'admin' ? 'users' : 'bell'} size="md" />
          <div>
            <span className="text-xs font-bold text-purple-800">
              {userRole === 'admin' ? 'Akun Pengguna' : 'Pengumuman Aktif'}
            </span>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
              {userRole === 'admin'
                ? users.length
                : announcements.filter((a) => a.isActive).length}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {userRole === 'admin'
                ? `${teachers.length} pendidik di direktori`
                : 'Notifikasi otomatis'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab(userRole === 'admin' ? 'pkks' : 'jabar-beraksi')}
          className="text-left bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl p-5 transition-colors cursor-pointer flex items-start gap-3.5"
        >
          <Icon3D name={userRole === 'admin' ? 'pkks' : 'ekskul'} size="md" />
          <div>
            <span className="text-xs font-bold text-emerald-800">
              {userRole === 'admin' ? 'PKKS Terpenuhi' : 'Jabar Beraksi'}
            </span>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
              {userRole === 'admin'
                ? `${pkksFulfilled}/${pkksItems.length}`
                : ekskulReports.length}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {userRole === 'admin' ? 'Indikator kinerja' : 'Laporan ekstrakurikuler'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('siloka')}
          className="text-left bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 hover:border-violet-400 rounded-2xl p-5 transition-colors cursor-pointer flex items-start gap-3.5"
        >
          <Icon3D name="siloka" size="md" />
          <div>
            <span className="text-xs font-bold text-violet-800">Tiket SILOKA Aktif</span>
            <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 mt-0.5">
              {pendingSiloka}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Total {silokaTickets.length} laporan masuk
            </p>
          </div>
        </button>
      </div>

      {/* Institutional Reference & Content Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-sky-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon3D name="school" size="sm" />
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              Identitas Satuan Pendidikan
            </h3>
          </div>
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500">Nama Sekolah</dt>
              <dd className="font-bold text-slate-900 text-right">{SCHOOL_INFO.name}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500">NPSN</dt>
              <dd className="font-mono font-bold tabular-nums text-sky-700">
                {SCHOOL_INFO.npsn}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500">Kepala Sekolah</dt>
              <dd className="font-semibold text-slate-900 text-right">
                {SCHOOL_INFO.principalName}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500">NIP / Golongan</dt>
              <dd className="font-mono text-xs tabular-nums text-slate-700 text-right">
                {SCHOOL_INFO.principalNip} ({SCHOOL_INFO.principalRank})
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500">Kurikulum</dt>
              <dd className="font-bold text-emerald-700">{SCHOOL_INFO.curriculum}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-slate-500">Alamat</dt>
              <dd className="text-slate-700 text-right max-w-xs">{SCHOOL_INFO.address}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border-2 border-rose-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Icon3D name="news" size="sm" />
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              Ringkasan Konten Portal Publik
            </h3>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">Berita & Kegiatan KBM</span>
              <span className="font-mono font-bold tabular-nums text-sky-700">
                {news.length} artikel
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">Galeri Foto & Video Sekolah</span>
              <span className="font-mono font-bold tabular-nums text-rose-700">
                {gallery.length} dokumentasi
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">Laporan Jabar Beraksi</span>
              <span className="font-mono font-bold tabular-nums text-emerald-700">
                {ekskulReports.length} laporan
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600">Pengumuman Otomatis Aktif</span>
              <span className="font-mono font-bold tabular-nums text-amber-700">
                {announcements.filter((a) => a.isActive).length} pengumuman
              </span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-slate-600 hover:text-indigo-700 font-medium hover:underline cursor-pointer"
              >
                Agenda Kalender Akademik
              </button>
              <span className="font-mono font-bold tabular-nums text-indigo-700">
                {academicEvents.length} agenda
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Site Media Modal */}
      {mediaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-rose-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                Kelola Foto Kampus, Kepala Sekolah, Video & Dokumen Profil
              </h3>
              <button
                type="button"
                onClick={() => setMediaModal(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSaveSiteMedia(e)} className="p-6 space-y-5">
              {mediaError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {mediaError}
                </div>
              )}

              <MediaPicker
                photoLabel="Foto Utama Kampus SDN Cikawao (Beranda)"
                photoUrl={heroImageUrl}
                onPhotoChange={setHeroImageUrl}
                videoLabel="Video Profil Sekolah (YouTube / Google Drive / MP4 - Opsional)"
                videoUrl={heroVideoUrl}
                onVideoChange={setHeroVideoUrl}
                docLabel="Tautan Dokumen Profil / KOSP Sekolah (Opsional)"
                documentUrl={schoolProfileDocUrl}
                onDocumentChange={setSchoolProfileDocUrl}
              />

              <MediaPicker
                photoLabel={`Foto Kepala Sekolah (${SCHOOL_INFO.principalName})`}
                photoUrl={principalPhotoUrl}
                onPhotoChange={setPrincipalPhotoUrl}
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMediaModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mediaBusy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-[0_4px_0_#be123c] rounded-xl cursor-pointer disabled:opacity-60"
                >
                  {mediaBusy ? 'Menyimpan...' : 'Simpan Media Sekolah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
