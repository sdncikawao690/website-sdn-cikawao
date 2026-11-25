import React, { useState } from 'react';
import { BellRing, Edit2, ExternalLink, Plus, Trash2, Video, X } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  ROMBEL_LIST,
  type Announcement,
  type AnnouncementPriority,
  type AnnouncementTarget,
} from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

export function AnnouncementsTab() {
  const { user, announcements, saveAnnouncement, removeAnnouncement } = useSchool();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<Omit<Announcement, 'createdAt' | 'updatedAt'>>({
    id: '',
    title: '',
    message: '',
    priority: 'Penting',
    targetRombel: 'Semua Kelas',
    autoNotifyParents: true,
    isActive: true,
    photoUrl: '',
    videoUrl: '',
    documentUrl: '',
    authorName: user?.displayName || 'Neng Linlin Irmawati, S.Pd.',
    authorUid: user?.uid || '',
  });
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreate = () => {
    setIsEdit(false);
    setForm({
      id: '',
      title: '',
      message: '',
      priority: 'Penting',
      targetRombel: 'Semua Kelas',
      autoNotifyParents: true,
      isActive: true,
      photoUrl: '',
      videoUrl: '',
      documentUrl: '',
      authorName: user?.displayName || 'Neng Linlin Irmawati, S.Pd.',
      authorUid: user?.uid || '',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setIsEdit(true);
    setForm({
      id: a.id,
      title: a.title,
      message: a.message,
      priority: a.priority,
      targetRombel: a.targetRombel,
      autoNotifyParents: a.autoNotifyParents,
      isActive: a.isActive,
      photoUrl: a.photoUrl || '',
      videoUrl: a.videoUrl || '',
      documentUrl: a.documentUrl || '',
      authorName: a.authorName,
      authorUid: a.authorUid,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveAnnouncement(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengumuman.');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    await saveAnnouncement(
      {
        ...a,
        isActive: !a.isActive,
      },
      true
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="bell" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              Pengumuman & Sistem Notifikasi Otomatis Orang Tua
            </h2>
            <p className="text-xs text-slate-600">
              Lampirkan poster foto, video arahan, atau tautan surat edaran resmi untuk orang
              tua siswa
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl btn-3d-amber cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Pengumuman
        </button>
      </div>

      <div className="bg-white border-2 border-orange-200 rounded-2xl divide-y divide-orange-100 overflow-hidden">
        {announcements.map((a) => (
          <div
            key={a.id}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-amber-50/40"
          >
            <div className="flex items-start gap-4 flex-1">
              {a.photoUrl && (
                <div className="w-20 h-16 rounded-xl overflow-hidden border border-orange-200 bg-amber-50 shrink-0">
                  <SafeImage
                    src={a.photoUrl}
                    alt={a.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`font-bold ${
                      a.priority === 'Mendesak'
                        ? 'text-rose-700'
                        : a.priority === 'Penting'
                          ? 'text-amber-700'
                          : 'text-sky-700'
                    }`}
                  >
                    {a.priority}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">Target: {a.targetRombel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <BellRing className="w-3.5 h-3.5" />
                    {a.autoNotifyParents ? 'Notifikasi Otomatis Aktif' : 'Manual'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>
                {(a.videoUrl || a.documentUrl) && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                    {a.videoUrl && (
                      <a
                        href={a.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-rose-700 hover:underline"
                      >
                        <Video className="w-3 h-3" />
                        Video Pengumuman
                      </a>
                    )}
                    {a.documentUrl && (
                      <a
                        href={a.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-sky-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Surat Edaran / Lampiran
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => void toggleActive(a)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border-2 cursor-pointer transition-colors ${
                  a.isActive
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {a.isActive ? 'Tayang' : 'Diarsipkan'}
              </button>
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Ubah
              </button>
              <button
                type="button"
                onClick={() => void removeAnnouncement(a.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-orange-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Ubah Pengumuman & Lampiran' : 'Kirim Pengumuman Penting'}
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengumuman
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={150}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value as AnnouncementPriority })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Penting">Penting</option>
                    <option value="Mendesak">Mendesak</option>
                    <option value="Informasi">Informasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Rombel Orang Tua
                  </label>
                  <select
                    value={form.targetRombel}
                    onChange={(e) =>
                      setForm({ ...form, targetRombel: e.target.value as AnnouncementTarget })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Semua Kelas">Semua Kelas (184 Siswa)</option>
                    {ROMBEL_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pesan Pengumuman
                </label>
                <textarea
                  required
                  rows={4}
                  minLength={8}
                  maxLength={1000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <MediaPicker
                photoLabel="Foto / Poster Pengumuman (Opsional)"
                photoUrl={form.photoUrl || ''}
                onPhotoChange={(val) => setForm({ ...form, photoUrl: val })}
                videoLabel="Video Arahan Kepala Sekolah (Opsional)"
                videoUrl={form.videoUrl || ''}
                onVideoChange={(val) => setForm({ ...form, videoUrl: val })}
                docLabel="Tautan Surat Edaran / Undangan PDF (Opsional)"
                documentUrl={form.documentUrl || ''}
                onDocumentChange={(val) => setForm({ ...form, documentUrl: val })}
              />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoNotifyParents}
                    onChange={(e) =>
                      setForm({ ...form, autoNotifyParents: e.target.checked })
                    }
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Kirim Notifikasi Otomatis ke Orang Tua
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Aktifkan Tayang Sekarang
                </label>
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
                  {busy ? 'Mengirim...' : 'Simpan & Kirim Notifikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
