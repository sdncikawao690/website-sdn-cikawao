import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Edit2,
  GraduationCap,
  MapPin,
  Plus,
  Sparkles,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  ACADEMIC_EVENT_CATEGORIES,
  ROMBEL_LIST,
  SCHOOL_INFO,
  type AcademicEvent,
  type AcademicEventCategory,
  type AnnouncementTarget,
} from '../../types/school';
import { Icon3D } from '../Icon3D';

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AcademicCalendarTab() {
  const { user, academicEvents, saveAcademicEvent, removeAcademicEvent } = useSchool();
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | AcademicEventCategory>(
    'Semua'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const defaultAuthor = user?.displayName || SCHOOL_INFO.principalName;

  const [form, setForm] = useState<Omit<AcademicEvent, 'createdAt' | 'updatedAt'>>({
    id: '',
    title: '',
    category: 'Kegiatan Sekolah',
    startDate: getTodayIso(),
    endDate: getTodayIso(),
    targetRombel: 'Semua Kelas',
    location: 'Lingkungan SDN Cikawao',
    description: '',
    isHoliday: false,
    authorName: defaultAuthor,
    authorUid: user?.uid || '',
  });

  const sortedEvents = useMemo(() => {
    const filtered =
      categoryFilter === 'Semua'
        ? academicEvents
        : academicEvents.filter((ev) => ev.category === categoryFilter);
    return [...filtered].sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [academicEvents, categoryFilter]);

  const openCreate = () => {
    const today = getTodayIso();
    setIsEdit(false);
    setForm({
      id: '',
      title: '',
      category: 'Kegiatan Sekolah',
      startDate: today,
      endDate: today,
      targetRombel: 'Semua Kelas',
      location: 'Lingkungan SDN Cikawao',
      description: '',
      isHoliday: false,
      authorName: defaultAuthor,
      authorUid: user?.uid || '',
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (ev: AcademicEvent) => {
    setIsEdit(true);
    setForm({
      id: ev.id,
      title: ev.title,
      category: ev.category,
      startDate: ev.startDate,
      endDate: ev.endDate || ev.startDate,
      targetRombel: ev.targetRombel,
      location: ev.location || '',
      description: ev.description,
      isHoliday: Boolean(ev.isHoliday),
      authorName: ev.authorName || defaultAuthor,
      authorUid: ev.authorUid,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleCategoryChange = (cat: AcademicEventCategory) => {
    setForm((prev) => ({
      ...prev,
      category: cat,
      isHoliday: cat === 'Hari Libur' ? true : prev.isHoliday && cat === prev.category,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveAcademicEvent(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan agenda kalender.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusy(true);
    try {
      await removeAcademicEvent(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus agenda kalender.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="calendar" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              Kalender Akademik &amp; Agenda Sekolah
            </h2>
            <p className="text-xs text-slate-600">
              Kelola jadwal kegiatan sekolah, asesmen/ujian, dan hari libur resmi yang tampil
              interaktif di portal publik
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 rounded-xl cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Agenda Kalender
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-indigo-50 rounded-xl border border-indigo-200 w-fit">
          {(['Semua', ...ACADEMIC_EVENT_CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-indigo-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-500 font-mono tabular-nums">
          Total tampil: {sortedEvents.length} agenda
        </p>
      </div>

      {/* Event List */}
      <div className="bg-white border-2 border-indigo-200 rounded-2xl divide-y divide-indigo-100 overflow-hidden">
        {sortedEvents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Belum ada agenda kalender akademik untuk kategori ini.
          </div>
        ) : (
          sortedEvents.map((ev) => {
            const catColor =
              ev.category === 'Ujian'
                ? 'text-amber-700'
                : ev.category === 'Hari Libur'
                  ? 'text-rose-700'
                  : 'text-sky-700';

            return (
              <div
                key={ev.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-indigo-50/35"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className={`inline-flex items-center gap-1 font-extrabold ${catColor}`}>
                      {ev.category === 'Ujian' ? (
                        <GraduationCap className="w-3.5 h-3.5" />
                      ) : ev.category === 'Hari Libur' ? (
                        <Sun className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {ev.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      {ev.startDate}
                      {ev.endDate && ev.endDate !== ev.startDate ? ` s.d. ${ev.endDate}` : ''}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700">{ev.targetRombel}</span>
                    {ev.location && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          {ev.location}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{ev.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(ev)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Ubah
                  </button>
                  {confirmDeleteId === ev.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleDelete(ev.id)}
                        className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(ev.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-indigo-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-indigo-600 to-sky-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Ubah Agenda Kalender Akademik' : 'Tambah Agenda Kalender Akademik'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-white/90 hover:text-white rounded-lg hover:bg-white/20 cursor-pointer"
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
                  Judul Agenda / Kegiatan
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Sumatif Akhir Semester (SAS) Ganjil"
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Agenda
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      handleCategoryChange(e.target.value as AcademicEventCategory)
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    {ACADEMIC_EVENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sasaran Peserta Didik
                  </label>
                  <select
                    value={form.targetRombel}
                    onChange={(e) =>
                      setForm({ ...form, targetRombel: e.target.value as AnnouncementTarget })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Semua Kelas">Semua Kelas (Kelas 1–6)</option>
                    {ROMBEL_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        startDate: nextStart,
                        endDate: prev.endDate < nextStart ? nextStart : prev.endDate,
                      }));
                    }}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    min={form.startDate}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi Pelaksanaan (Opsional)
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={form.location || ''}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Contoh: Ruang Kelas I–VI SDN Cikawao"
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Catatan Agenda
                </label>
                <textarea
                  required
                  rows={3}
                  minLength={4}
                  maxLength={600}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Tuliskan deskripsi kegiatan, jadwal pelaksanaan, atau informasi untuk orang tua..."
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHoliday || form.category === 'Hari Libur'}
                  onChange={(e) => setForm({ ...form, isHoliday: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                Tandai sebagai hari libur sekolah (tanggal merah di kalender)
              </label>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-sky-600 rounded-xl cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
