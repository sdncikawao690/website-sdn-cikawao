import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Edit2,
  ExternalLink,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  downloadStudentsExcelTemplate,
  parseStudentsExcelFile,
  type ParsedExcelResult,
} from '../../lib/excelStudents';
import { normalizeNik } from '../../lib/validation';
import {
  ROMBEL_LIST,
  type CapaianP5,
  type RombelName,
  type StudentRecord,
} from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

const EMPTY_STUDENT: Omit<StudentRecord, 'createdAt' | 'updatedAt'> = {
  id: '',
  nisn: '',
  nik: '',
  fullName: '',
  rombel: 'Kelas 1',
  gender: 'L',
  parentName: '',
  parentEmail: '',
  teacherEmail: '',
  attendancePercent: 98,
  nilaiFormatif: 85,
  nilaiSumatif: 85,
  capaianP5: 'Berkembang Sesuai Harapan',
  academicNote: '',
  photoUrl: '',
  videoUrl: '',
  documentUrl: '',
  updatedBy: '',
};

export function StudentsAcademicTab() {
  const {
    user,
    userRole,
    students,
    saveStudent,
    importStudentsBatch,
    removeStudent,
    syncNisnLookupIndex,
  } = useSchool();
  const [search, setSearch] = useState('');
  const [rombelFilter, setRombelFilter] = useState<'all' | RombelName>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_STUDENT);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{
    fileName: string;
    parsed: ParsedExcelResult;
  } | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [excelSuccess, setExcelSuccess] = useState<string | null>(null);
  const [importingExcel, setImportingExcel] = useState(false);
  const [syncingLookup, setSyncingLookup] = useState(false);

  const canManage = userRole === 'admin';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (rombelFilter !== 'all' && s.rombel !== rombelFilter) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.nik || '').toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      );
    });
  }, [students, search, rombelFilter]);

  const averages = useMemo(() => {
    if (filtered.length === 0) return { formatif: 0, sumatif: 0, attendance: 0 };
    const f = filtered.reduce((a, b) => a + b.nilaiFormatif, 0) / filtered.length;
    const s = filtered.reduce((a, b) => a + b.nilaiSumatif, 0) / filtered.length;
    const att = filtered.reduce((a, b) => a + b.attendancePercent, 0) / filtered.length;
    return {
      formatif: Math.round(f * 10) / 10,
      sumatif: Math.round(s * 10) / 10,
      attendance: Math.round(att * 10) / 10,
    };
  }, [filtered]);

  const openCreate = () => {
    setIsEdit(false);
    setForm({
      ...EMPTY_STUDENT,
      teacherEmail: user?.email || '',
      updatedBy: user?.displayName || 'Guru SDN Cikawao',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (s: StudentRecord) => {
    setIsEdit(true);
    setForm({
      id: s.id,
      nisn: s.nisn,
      nik: s.nik || '',
      fullName: s.fullName,
      rombel: s.rombel,
      gender: s.gender,
      parentName: s.parentName,
      parentEmail: s.parentEmail,
      teacherEmail: s.teacherEmail,
      attendancePercent: s.attendancePercent,
      nilaiFormatif: s.nilaiFormatif,
      nilaiSumatif: s.nilaiSumatif,
      capaianP5: s.capaianP5,
      academicNote: s.academicNote,
      photoUrl: s.photoUrl || '',
      videoUrl: s.videoUrl || '',
      documentUrl: s.documentUrl || '',
      updatedBy: user?.displayName || s.updatedBy,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveStudent(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data siswa.');
    } finally {
      setBusy(false);
    }
  };

  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setExcelError(null);
    setExcelSuccess(null);
    try {
      const parsed = await parseStudentsExcelFile(
        file,
        user?.email || 'sdncikawao690@gmail.com',
        user?.displayName || 'Admin SDN Cikawao'
      );
      setExcelPreview({ fileName: file.name, parsed });
    } catch (err) {
      setExcelError(
        err instanceof Error
          ? err.message
          : 'Gagal membaca file Excel daftar peserta didik.'
      );
    }
  };

  const handleConfirmExcelImport = async () => {
    if (!excelPreview) return;
    setImportingExcel(true);
    setExcelError(null);
    try {
      const result = await importStudentsBatch(excelPreview.parsed.rows);
      setExcelPreview(null);
      setExcelSuccess(
        `Berhasil mengimpor daftar PD dari Excel: ${result.createdCount} siswa baru ditambahkan dan ${result.updatedCount} siswa diperbarui.`
      );
    } catch (err) {
      setExcelError(
        err instanceof Error ? err.message : 'Gagal mengimpor data siswa ke database.'
      );
    } finally {
      setImportingExcel(false);
    }
  };

  const handleSyncLookup = async () => {
    setSyncingLookup(true);
    setExcelError(null);
    setExcelSuccess(null);
    try {
      const count = await syncNisnLookupIndex();
      setExcelSuccess(
        count > 0
          ? `Berhasil menyinkronkan ${count} data siswa ke indeks Cek NISN (Nama & NIK).`
          : 'Belum ada data siswa yang dapat disinkronkan ke indeks Cek NISN.'
      );
    } catch (err) {
      setExcelError(
        err instanceof Error ? err.message : 'Gagal menyinkronkan indeks Cek NISN.'
      );
    } finally {
      setSyncingLookup(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="students" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              {canManage
                ? 'Manajemen Data Siswa & Perkembangan Akademik Real-Time'
                : 'Pemantauan Akademik Putra/Putri Anda (Real-Time)'}
            </h2>
            <p className="text-xs text-slate-600">
              {canManage
                ? 'Kelola foto siswa, NISN, NIK, nilai formatif/sumatif, impor daftar PD Excel, serta video & dokumen belajar'
                : 'Menampilkan perkembangan akademik dan dokumentasi portofolio yang tertaut dengan email Anda'}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <input
              ref={excelInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => void handleExcelFileChange(e)}
              className="hidden"
            />
            <button
              type="button"
              disabled={syncingLookup}
              onClick={() => void handleSyncLookup()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border-2 border-cyan-200 rounded-xl whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncingLookup ? 'animate-spin' : ''}`} />
              {syncingLookup ? 'Menyinkronkan...' : 'Sinkronkan Cek NISN'}
            </button>
            <button
              type="button"
              onClick={downloadStudentsExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-xl whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Template Excel
            </button>
            <button
              type="button"
              onClick={() => excelInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl btn-3d-emerald whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Daftar PD (Excel)
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl btn-3d-amber whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </button>
          </div>
        )}
      </div>

      {canManage && (
        <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-start sm:items-center gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Impor Daftar PD (Excel .xlsx / .xls / .csv):</strong> Unggah file Excel
              berisi kolom <span className="font-mono">NISN</span>,{' '}
              <span className="font-mono">NIK</span>,{' '}
              <span className="font-mono">Nama Lengkap</span>,{' '}
              <span className="font-mono">Rombel</span>,{' '}
              <span className="font-mono">Jenis Kelamin (L/P)</span>, dan nilai untuk memperbarui
              atau menambahkan banyak siswa sekaligus (otomatis terindeks untuk pencarian NISN publik
              berdasarkan Nama Lengkap atau NIK).
            </span>
          </div>
        </div>
      )}

      {excelError && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3">
          <span>{excelError}</span>
          <button
            type="button"
            onClick={() => setExcelError(null)}
            className="text-rose-700 hover:text-rose-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {excelSuccess && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-900 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            {excelSuccess}
          </span>
          <button
            type="button"
            onClick={() => setExcelSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real-time Academic Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-800">Rata-rata Kehadiran</p>
          <p className="text-2xl font-extrabold font-mono tabular-nums text-emerald-700 mt-0.5">
            {averages.attendance}%
          </p>
        </div>
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-sky-800">Rata-rata Asesmen Formatif</p>
          <p className="text-2xl font-extrabold font-mono tabular-nums text-sky-700 mt-0.5">
            {averages.formatif}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-800">Rata-rata Asesmen Sumatif</p>
          <p className="text-2xl font-extrabold font-mono tabular-nums text-orange-700 mt-0.5">
            {averages.sumatif}
          </p>
        </div>
      </div>

      {/* Search & Rombel Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border-2 border-amber-200 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa, NISN, atau nama orang tua..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-amber-50 rounded-xl border border-amber-200">
          <button
            type="button"
            onClick={() => setRombelFilter('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
              rombelFilter === 'all'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-700 hover:text-amber-800'
            }`}
          >
            Semua
          </button>
          {ROMBEL_LIST.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRombelFilter(r)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                rombelFilter === r
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-700 hover:text-amber-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            {canManage
              ? 'Belum ada data siswa pada filter ini.'
              : 'Belum ada data siswa yang tertaut dengan email akun Anda. Hubungi Wali Kelas atau Admin sekolah.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/80 text-xs font-bold text-slate-700">
                  <th className="py-3 px-5">Siswa & NISN</th>
                  <th className="py-3 px-4">Rombel</th>
                  <th className="py-3 px-4">Orang Tua</th>
                  <th className="py-3 px-4 text-right">Hadir</th>
                  <th className="py-3 px-4 text-right">Formatif</th>
                  <th className="py-3 px-4 text-right">Sumatif</th>
                  <th className="py-3 px-4">Capaian P5 & Dokumentasi</th>
                  {canManage && <th className="py-3 px-5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-amber-50/35">
                    <td className="py-3 px-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-200 bg-amber-50 shrink-0 flex items-center justify-center">
                          {s.photoUrl ? (
                            <SafeImage
                              src={s.photoUrl}
                              alt={s.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-amber-800">
                              {s.fullName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {s.fullName}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              ({s.gender})
                            </span>
                          </p>
                          <p className="font-mono text-xs tabular-nums text-slate-500">
                            NISN: {s.nisn}
                          </p>
                          <p className="font-mono text-[11px] tabular-nums text-slate-400">
                            NIK: {s.nik || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap text-sky-800 font-bold">
                      {s.rombel}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <p className="text-slate-800 font-medium">{s.parentName}</p>
                      <p className="text-xs text-slate-500">{s.parentEmail}</p>
                    </td>
                    <td className="py-3 px-4 align-top text-right font-mono tabular-nums text-slate-800">
                      {s.attendancePercent}%
                    </td>
                    <td className="py-3 px-4 align-top text-right font-mono tabular-nums font-bold text-sky-700">
                      {s.nilaiFormatif}
                    </td>
                    <td className="py-3 px-4 align-top text-right font-mono tabular-nums font-bold text-emerald-700">
                      {s.nilaiSumatif}
                    </td>
                    <td className="py-3 px-4 align-top max-w-xs">
                      <p className="text-xs font-bold text-violet-700">{s.capaianP5}</p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                        {s.academicNote}
                      </p>
                      {(s.videoUrl || s.documentUrl) && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                          {s.videoUrl && (
                            <a
                              href={s.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
                            >
                              <Video className="w-3 h-3" />
                              Video Karya
                            </a>
                          )}
                          {s.documentUrl && (
                            <a
                              href={s.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Rapor/Portofolio
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    {canManage && (
                      <td className="py-3 px-5 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg mr-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeStudent(s.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Perbarui Data, Nilai & Dokumentasi Siswa' : 'Tambah Data Siswa Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <MediaPicker
                photoLabel="Foto Siswa / Karya Belajar (Opsional)"
                photoUrl={form.photoUrl || ''}
                onPhotoChange={(val) => setForm({ ...form, photoUrl: val })}
                showPresets={false}
                maxPhotoDimension={520}
                videoLabel="Video Praktik / Projek P5 Siswa (Opsional)"
                videoUrl={form.videoUrl || ''}
                onVideoChange={(val) => setForm({ ...form, videoUrl: val })}
                docLabel="Tautan Dokumen Rapor / Portofolio Siswa (Opsional)"
                documentUrl={form.documentUrl || ''}
                onDocumentChange={(val) => setForm({ ...form, documentUrl: val })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={20}
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK (Untuk Pencarian NISN)
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="16 digit angka NIK"
                    value={form.nik || ''}
                    onChange={(e) => setForm({ ...form, nik: normalizeNik(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rombel
                  </label>
                  <select
                    value={form.rombel}
                    onChange={(e) =>
                      setForm({ ...form, rombel: e.target.value as RombelName })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    {ROMBEL_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      setForm({ ...form, gender: e.target.value as 'L' | 'P' })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Wali Kelas
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={150}
                    value={form.teacherEmail}
                    onChange={(e) => setForm({ ...form, teacherEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.parentName}
                    onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Orang Tua (untuk Akses Real-Time)
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={150}
                    value={form.parentEmail}
                    onChange={(e) => setForm({ ...form, parentEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kehadiran (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.attendancePercent}
                    onChange={(e) =>
                      setForm({ ...form, attendancePercent: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai Formatif
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.nilaiFormatif}
                    onChange={(e) =>
                      setForm({ ...form, nilaiFormatif: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai Sumatif
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.nilaiSumatif}
                    onChange={(e) =>
                      setForm({ ...form, nilaiSumatif: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capaian P5
                  </label>
                  <select
                    value={form.capaianP5}
                    onChange={(e) =>
                      setForm({ ...form, capaianP5: e.target.value as CapaianP5 })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Mulai Berkembang">Mulai Berkembang</option>
                    <option value="Sedang Berkembang">Sedang Berkembang</option>
                    <option value="Berkembang Sesuai Harapan">
                      Berkembang Sesuai Harapan
                    </option>
                    <option value="Sangat Berkembang">Sangat Berkembang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Perkembangan Akademik Wali Kelas
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.academicNote}
                  onChange={(e) => setForm({ ...form, academicNote: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl btn-3d-amber cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Excel Import Preview Modal */}
      {excelPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-200 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold font-display truncate">
                    Pratinjau Impor Excel Daftar Peserta Didik
                  </h3>
                  <p className="text-xs text-emerald-100 truncate">
                    File: {excelPreview.fileName} · Sheet: {excelPreview.parsed.sheetName} ·{' '}
                    {excelPreview.parsed.rows.length} siswa siap diimpor
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExcelPreview(null)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {excelPreview.parsed.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Catatan Pembacaan File:</p>
                  {excelPreview.parsed.warnings.slice(0, 5).map((w, idx) => (
                    <p key={idx}>· {w}</p>
                  ))}
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3">NIK</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">Rombel</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">Orang Tua</th>
                      <th className="py-2.5 px-3 text-right">Hadir</th>
                      <th className="py-2.5 px-3 text-right">Formatif</th>
                      <th className="py-2.5 px-3 text-right">Sumatif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelPreview.parsed.rows.slice(0, 50).map((r, i) => (
                      <tr key={`${r.nisn}_${i}`} className="hover:bg-emerald-50/40">
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-500">
                          {i + 1}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-700">
                          {r.nisn}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-500">
                          {r.nik || '-'}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {r.fullName}
                        </td>
                        <td className="py-2 px-3 text-sky-800 font-semibold">{r.rombel}</td>
                        <td className="py-2 px-3">{r.gender}</td>
                        <td className="py-2 px-3 text-slate-700">{r.parentName}</td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {r.attendancePercent}%
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-sky-700">
                          {r.nilaiFormatif}
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-emerald-700">
                          {r.nilaiSumatif}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {excelPreview.parsed.rows.length > 50 && (
                <p className="text-xs text-slate-500">
                  Menampilkan 50 dari {excelPreview.parsed.rows.length} baris yang akan diimpor.
                </p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setExcelPreview(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={importingExcel}
                onClick={() => void handleConfirmExcelImport()}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl btn-3d-emerald cursor-pointer disabled:opacity-60"
              >
                <Upload className="w-4 h-4" />
                {importingExcel
                  ? 'Mengimpor ke Database...'
                  : `Impor ${excelPreview.parsed.rows.length} Siswa ke Database`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
