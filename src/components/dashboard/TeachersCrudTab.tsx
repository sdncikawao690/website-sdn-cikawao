import React, { useState } from 'react';
import { Edit2, ExternalLink, Plus, Trash2, Video, X } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import type { TeacherProfile } from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

const EMPTY_TEACHER: Omit<TeacherProfile, 'createdAt' | 'updatedAt'> = {
  id: '',
  name: '',
  nip: '',
  position: 'Guru Kelas',
  rank: '',
  rombel: 'Kelas 1',
  status: 'Aktif',
  displayOrder: 10,
  photoUrl: '',
  videoUrl: '',
  documentUrl: '',
};

export function TeachersCrudTab() {
  const { teachers, saveTeacher, removeTeacher } = useSchool();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_TEACHER);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setIsEdit(false);
    setForm({ ...EMPTY_TEACHER, displayOrder: teachers.length + 1 });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (t: TeacherProfile) => {
    setIsEdit(true);
    setForm({
      id: t.id,
      name: t.name,
      nip: t.nip || '',
      position: t.position,
      rank: t.rank || '',
      rombel: t.rombel,
      status: t.status,
      displayOrder: t.displayOrder,
      photoUrl: t.photoUrl || '',
      videoUrl: t.videoUrl || '',
      documentUrl: t.documentUrl || '',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveTeacher(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan data guru.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="teacher" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              Direktori Pimpinan & 8 Guru SDN Cikawao
            </h2>
            <p className="text-xs text-slate-600">
              Kelola foto pendidik, video pengajaran/perkenalan, dan tautan dokumen portofolio
              guru
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl btn-3d-emerald whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pendidik
        </button>
      </div>

      <div className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-emerald-200 bg-emerald-50/80 text-xs font-bold text-slate-700">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Foto, Nama & NIP</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Pangkat/Gol</th>
                <th className="py-3 px-4">Rombel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-emerald-50/40">
                  <td className="py-3 px-4 font-mono tabular-nums text-xs font-bold text-emerald-700">
                    {t.displayOrder}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-200 bg-emerald-50 shrink-0 flex items-center justify-center">
                        {t.photoUrl ? (
                          <SafeImage
                            src={t.photoUrl}
                            alt={t.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-extrabold text-emerald-700">
                            {t.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{t.name}</p>
                        <p className="font-mono text-xs tabular-nums text-slate-500">
                          {t.nip || '-'}
                        </p>
                        {(t.videoUrl || t.documentUrl) && (
                          <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                            {t.videoUrl && (
                              <a
                                href={t.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 font-bold text-rose-700 hover:underline"
                              >
                                <Video className="w-3 h-3" />
                                Video
                              </a>
                            )}
                            {t.documentUrl && (
                              <a
                                href={t.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 font-bold text-sky-700 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Dokumen
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{t.position}</td>
                  <td className="py-3 px-4 text-xs text-slate-600">{t.rank || '-'}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{t.rombel}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs font-bold ${
                        t.status === 'Aktif' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg mr-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeTeacher(t.id)}
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
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Ubah Data & Foto Pendidik' : 'Tambah Data Pendidik'}
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
                photoLabel="Foto Pendidik"
                photoUrl={form.photoUrl || ''}
                onPhotoChange={(val) => setForm({ ...form, photoUrl: val })}
                maxPhotoDimension={520}
                videoLabel="Video Profil / Praktik Mengajar Guru (Opsional)"
                videoUrl={form.videoUrl || ''}
                onVideoChange={(val) => setForm({ ...form, videoUrl: val })}
                docLabel="Tautan Dokumen SK / Sertifikat Pendidik (Opsional)"
                documentUrl={form.documentUrl || ''}
                onDocumentChange={(val) => setForm({ ...form, documentUrl: val })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={form.nip || ''}
                    onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={80}
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    value={form.rank || ''}
                    onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tugas Rombel
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={form.rombel}
                    onChange={(e) => setForm({ ...form, rombel: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'Aktif' | 'Cuti' })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Cuti">Cuti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.displayOrder}
                    onChange={(e) =>
                      setForm({ ...form, displayOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
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
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl btn-3d-emerald cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
