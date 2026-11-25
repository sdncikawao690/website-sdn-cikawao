import React, { useState } from 'react';
import { Edit2, ExternalLink, Plus, Trash2, Video, X } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import type { PkksComponent, PkksItem, PkksStatus } from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

const PKKS_COMPONENTS: PkksComponent[] = [
  'Kepribadian & Sosial',
  'Kepemimpinan Pembelajaran',
  'Pengembangan Sekolah',
  'Manajemen Sumber Daya',
  'Kewirausahaan',
  'Supervisi Guru & Tendik',
];

export function PkksTab() {
  const { user, pkksItems, savePkks, removePkks } = useSchool();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<Omit<PkksItem, 'createdAt' | 'updatedAt'>>({
    id: '',
    component: 'Kepemimpinan Pembelajaran',
    indicatorCode: 'PKKS-07',
    indicatorTitle: '',
    targetScore: 100,
    achievedScore: 90,
    status: 'Terpenuhi',
    evidenceSummary: '',
    evidenceUrl: '',
    evidencePhotoUrl: '',
    evidenceVideoUrl: '',
    updatedBy: user?.displayName || 'Neng Linlin Irmawati, S.Pd.',
  });
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setIsEdit(false);
    setForm({
      id: '',
      component: 'Kepemimpinan Pembelajaran',
      indicatorCode: `PKKS-0${pkksItems.length + 1}`,
      indicatorTitle: '',
      targetScore: 100,
      achievedScore: 90,
      status: 'Terpenuhi',
      evidenceSummary: '',
      evidenceUrl: '',
      evidencePhotoUrl: '',
      evidenceVideoUrl: '',
      updatedBy: user?.displayName || 'Neng Linlin Irmawati, S.Pd.',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (p: PkksItem) => {
    setIsEdit(true);
    setForm({
      id: p.id,
      component: p.component,
      indicatorCode: p.indicatorCode,
      indicatorTitle: p.indicatorTitle,
      targetScore: p.targetScore,
      achievedScore: p.achievedScore,
      status: p.status,
      evidenceSummary: p.evidenceSummary,
      evidenceUrl: p.evidenceUrl || '',
      evidencePhotoUrl: p.evidencePhotoUrl || '',
      evidenceVideoUrl: p.evidenceVideoUrl || '',
      updatedBy: user?.displayName || p.updatedBy,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await savePkks(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan instrumen PKKS.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="pkks" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              Pengelolaan Penilaian Kinerja Kepala Sekolah (PKKS)
            </h2>
            <p className="text-xs text-slate-600">
              Kelola instrumen kompetensi, skor capaian, foto bukti fisik, video dokumentasi, dan
              tautan berkas PKKS
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl btn-3d-amber cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Indikator PKKS
        </button>
      </div>

      <div className="bg-white border-2 border-amber-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-amber-200 bg-amber-50/80 text-xs font-bold text-slate-700">
                <th className="py-3 px-5">Kode & Komponen</th>
                <th className="py-3 px-4">Indikator & Bukti Fisik</th>
                <th className="py-3 px-4 text-right">Skor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 text-sm">
              {pkksItems.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/40">
                  <td className="py-3.5 px-5 align-top whitespace-nowrap">
                    <span className="font-mono text-xs font-bold text-amber-700 block">
                      {p.indicatorCode}
                    </span>
                    <span className="font-bold text-slate-900">{p.component}</span>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="flex items-start gap-3">
                      {p.evidencePhotoUrl && (
                        <div className="w-16 h-12 rounded-lg overflow-hidden border border-amber-200 bg-amber-50 shrink-0">
                          <SafeImage
                            src={p.evidencePhotoUrl}
                            alt={`Bukti ${p.indicatorCode}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{p.indicatorTitle}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{p.evidenceSummary}</p>
                        {(p.evidenceUrl || p.evidenceVideoUrl) && (
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                            {p.evidenceVideoUrl && (
                              <a
                                href={p.evidenceVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
                              >
                                <Video className="w-3 h-3" />
                                Video Dokumentasi
                              </a>
                            )}
                            {p.evidenceUrl && (
                              <a
                                href={p.evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Berkas Dokumen
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top text-right font-mono tabular-nums whitespace-nowrap">
                    <span className="font-bold text-amber-700">{p.achievedScore}</span> /{' '}
                    <span className="text-slate-500">{p.targetScore}</span>
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span
                      className={`text-xs font-bold ${
                        p.status === 'Terpenuhi'
                          ? 'text-emerald-700'
                          : p.status === 'Proses Verifikasi'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg mr-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => void removePkks(p.id)}
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
          <div className="bg-white border-2 border-amber-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Ubah Indikator & Bukti PKKS' : 'Tambah Indikator PKKS'}
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
                    Komponen PKKS
                  </label>
                  <select
                    value={form.component}
                    onChange={(e) =>
                      setForm({ ...form, component: e.target.value as PkksComponent })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    {PKKS_COMPONENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Indikator
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={20}
                    value={form.indicatorCode}
                    onChange={(e) => setForm({ ...form, indicatorCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Uraian Indikator Kinerja
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={180}
                  value={form.indicatorTitle}
                  onChange={(e) => setForm({ ...form, indicatorTitle: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Skor
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.targetScore}
                    onChange={(e) =>
                      setForm({ ...form, targetScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Capaian Skor
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.achievedScore}
                    onChange={(e) =>
                      setForm({ ...form, achievedScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as PkksStatus })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Terpenuhi">Terpenuhi</option>
                    <option value="Proses Verifikasi">Proses Verifikasi</option>
                    <option value="Perlu Lengkapi">Perlu Lengkapi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ringkasan Bukti Fisik
                </label>
                <textarea
                  required
                  rows={2}
                  minLength={4}
                  maxLength={400}
                  value={form.evidenceSummary}
                  onChange={(e) => setForm({ ...form, evidenceSummary: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <MediaPicker
                photoLabel="Foto Bukti Fisik PKKS (Opsional)"
                photoUrl={form.evidencePhotoUrl || ''}
                onPhotoChange={(val) => setForm({ ...form, evidencePhotoUrl: val })}
                videoLabel="Video Dokumentasi Supervisi / Rapat (Opsional)"
                videoUrl={form.evidenceVideoUrl || ''}
                onVideoChange={(val) => setForm({ ...form, evidenceVideoUrl: val })}
                docLabel="Tautan Dokumen Bukti (Drive/PDF - Opsional)"
                documentUrl={form.evidenceUrl || ''}
                onDocumentChange={(val) => setForm({ ...form, evidenceUrl: val })}
              />

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
                  {busy ? 'Menyimpan...' : 'Simpan Indikator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
