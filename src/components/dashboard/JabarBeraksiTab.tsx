import React, { useState } from 'react';
import { Edit2, ExternalLink, Plus, Trash2, Video, X } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  GENERATED_IMAGES,
  JABAR_BERAKSI_PILLARS,
  type EkskulName,
  type EkskulReport,
} from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

const EKSKUL_OPTIONS: EkskulName[] = [
  'Pendidikan Karakter',
  'Digitalisasi Pembelajaran',
  'Kualitas Dapodik',
  'SPMI',
  'Analisis Daya Tampung',
  'Pramuka',
  'Seni Angklung & Tari Sunda',
  'Paskibra',
  'Pencak Silat',
  'Olahraga & Atletik',
  'BTQ & Keagamaan',
  'Literasi & PMR',
];

export function JabarBeraksiTab() {
  const { user, ekskulReports, saveEkskul, removeEkskul } = useSchool();
  const [pillarFilter, setPillarFilter] = useState<'Semua' | EkskulName>('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<Omit<EkskulReport, 'createdAt' | 'updatedAt'>>({
    id: '',
    ekskulName: 'Pendidikan Karakter',
    activityTitle: '',
    coachName: user?.displayName || '',
    schedule: 'Berjalan Semester Aktif',
    participantCount: 184,
    activityDate: new Date().toISOString().slice(0, 10),
    reportSummary: '',
    transparencyNote: '',
    imageUrl: GENERATED_IMAGES.pramukaGarden,
    videoUrl: '',
    documentUrl: '',
    authorUid: user?.uid || '',
  });
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setIsEdit(false);
    setForm({
      id: '',
      ekskulName: pillarFilter === 'Semua' ? 'Pendidikan Karakter' : pillarFilter,
      activityTitle: '',
      coachName: user?.displayName || 'Koordinator Program',
      schedule: 'Berjalan Semester Aktif',
      participantCount: 184,
      activityDate: new Date().toISOString().slice(0, 10),
      reportSummary: '',
      transparencyNote: '',
      imageUrl: GENERATED_IMAGES.pramukaGarden,
      videoUrl: '',
      documentUrl: '',
      authorUid: user?.uid || '',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (rep: EkskulReport) => {
    setIsEdit(true);
    setForm({
      id: rep.id,
      ekskulName: rep.ekskulName,
      activityTitle: rep.activityTitle,
      coachName: rep.coachName,
      schedule: rep.schedule,
      participantCount: rep.participantCount,
      activityDate: rep.activityDate,
      reportSummary: rep.reportSummary,
      transparencyNote: rep.transparencyNote || '',
      imageUrl: rep.imageUrl || GENERATED_IMAGES.pramukaGarden,
      videoUrl: rep.videoUrl || '',
      documentUrl: rep.documentUrl || '',
      authorUid: rep.authorUid,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveEkskul(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan laporan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="ekskul" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              Jabar Beraksi — Pelaporan Program & Mutu Sekolah Transparan
            </h2>
            <p className="text-xs text-slate-600">
              Pendidikan Karakter, Digitalisasi Pembelajaran, Kualitas Dapodik, SPMI, dan Analisis
              Daya Tampung beserta foto, video, dan dokumen
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-600 hover:to-emerald-700 rounded-xl btn-3d-emerald cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Catat Laporan Kegiatan
        </button>
      </div>

      {/* Filter 5 Aspek Jabar Beraksi */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl">
        <button
          type="button"
          onClick={() => setPillarFilter('Semua')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
            pillarFilter === 'Semua'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-emerald-800'
          }`}
        >
          Semua Aspek
        </button>
        {JABAR_BERAKSI_PILLARS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPillarFilter(p.id)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
              pillarFilter === p.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-emerald-800'
            }`}
          >
            {p.id}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPillarFilter('Pencak Silat')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
            pillarFilter === 'Pencak Silat'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-emerald-800'
          }`}
        >
          Pencak Silat
        </button>
      </div>

      <div className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-200 bg-emerald-50/80 text-xs font-bold text-slate-700">
                <th className="py-3 px-5">Dokumentasi & Bidang</th>
                <th className="py-3 px-4">Kegiatan & Transparansi</th>
                <th className="py-3 px-4">Penanggung Jawab & Jadwal</th>
                <th className="py-3 px-4 text-right">Sasaran/Peserta</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-100 text-sm">
              {(pillarFilter === 'Semua'
                ? ekskulReports
                : ekskulReports.filter((r) => r.ekskulName === pillarFilter)
              ).map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40">
                  <td className="py-3.5 px-5 align-top whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-emerald-200 bg-emerald-50 shrink-0 relative">
                        <SafeImage
                          src={r.imageUrl || GENERATED_IMAGES.pramukaGarden}
                          alt={r.activityTitle}
                          className="w-full h-full object-cover"
                        />
                        {r.videoUrl && (
                          <span className="absolute bottom-0.5 right-0.5 bg-rose-600 text-white p-0.5 rounded">
                            <Video className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-emerald-700">{r.ekskulName}</p>
                        <p className="font-mono text-xs tabular-nums text-slate-500">
                          {r.activityDate}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top max-w-md">
                    <p className="font-bold text-slate-900">{r.activityTitle}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {r.reportSummary}
                    </p>
                    {r.transparencyNote && (
                      <p className="text-[11px] font-medium text-emerald-700 mt-1">
                        Transparansi: {r.transparencyNote}
                      </p>
                    )}
                    {(r.videoUrl || r.documentUrl) && (
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                        {r.videoUrl && (
                          <a
                            href={r.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
                          >
                            <Video className="w-3 h-3" />
                            Video Kegiatan
                          </a>
                        )}
                        {r.documentUrl && (
                          <a
                            href={r.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Dokumen / Daftar Hadir
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <p className="font-medium text-slate-800">{r.coachName}</p>
                    <p className="text-xs text-slate-500">{r.schedule}</p>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums font-bold text-emerald-700">
                    {r.participantCount}
                  </td>
                  <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg mr-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeEkskul(r.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-emerald-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 px-6 py-4 bg-gradient-to-r from-lime-500 to-emerald-600 text-white flex items-center justify-between z-10">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Ubah Laporan & Dokumentasi Jabar Beraksi' : 'Laporan Kegiatan Baru'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bidang Ekstrakurikuler
                  </label>
                  <select
                    value={form.ekskulName}
                    onChange={(e) =>
                      setForm({ ...form, ekskulName: e.target.value as EkskulName })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    {EKSKUL_OPTIONS.map((ek) => (
                      <option key={ek} value={ek}>
                        {ek}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    required
                    value={form.activityDate}
                    onChange={(e) => setForm({ ...form, activityDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Kegiatan
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={150}
                  value={form.activityTitle}
                  onChange={(e) => setForm({ ...form, activityTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pembina
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.coachName}
                    onChange={(e) => setForm({ ...form, coachName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jadwal Rutin
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={80}
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Peserta
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={form.participantCount}
                    onChange={(e) =>
                      setForm({ ...form, participantCount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <MediaPicker
                photoLabel="Foto Dokumentasi Kegiatan Ekskul"
                photoUrl={form.imageUrl || ''}
                onPhotoChange={(val) => setForm({ ...form, imageUrl: val })}
                videoLabel="Video Penampilan / Latihan Ekskul (Opsional)"
                videoUrl={form.videoUrl || ''}
                onVideoChange={(val) => setForm({ ...form, videoUrl: val })}
                docLabel="Tautan Dokumen LPJ / Daftar Hadir (Opsional)"
                documentUrl={form.documentUrl || ''}
                onDocumentChange={(val) => setForm({ ...form, documentUrl: val })}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Laporan Kegiatan
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  maxLength={600}
                  value={form.reportSummary}
                  onChange={(e) => setForm({ ...form, reportSummary: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Transparansi (Dana/Inventaris)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={form.transparencyNote || ''}
                  onChange={(e) => setForm({ ...form, transparencyNote: e.target.value })}
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
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-lime-500 to-emerald-600 rounded-xl btn-3d-emerald cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
