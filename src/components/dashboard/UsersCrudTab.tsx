import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import type { UserAccount, UserRole, UserStatus } from '../../types/school';
import { Icon3D } from '../Icon3D';
import { MediaPicker } from '../MediaPicker';
import { SafeImage } from '../SafeImage';

const EMPTY_FORM: Omit<UserAccount, 'createdAt' | 'updatedAt'> = {
  id: '',
  uid: '',
  displayName: '',
  email: '',
  role: 'guru',
  nipOrNik: '',
  rombel: 'Umum',
  phone: '',
  photoUrl: '',
  linkedStudentId: '',
  status: 'aktif',
};

export function UsersCrudTab() {
  const { users, students, saveUser, removeUser } = useSchool();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<Omit<UserAccount, 'createdAt' | 'updatedAt'>>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.nipOrNik || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  const openCreate = () => {
    setIsEdit(false);
    setForm(EMPTY_FORM);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEdit = (u: UserAccount) => {
    setIsEdit(true);
    setForm({
      id: u.id,
      uid: u.uid || '',
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      nipOrNik: u.nipOrNik || '',
      rombel: u.rombel || '',
      phone: u.phone || '',
      photoUrl: u.photoUrl || '',
      linkedStudentId: u.linkedStudentId || '',
      status: u.status,
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      await saveUser(form, isEdit);
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan pengguna.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (u: UserAccount) => {
    setErrorMsg(null);
    try {
      await removeUser(u.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghapus pengguna.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Icon3D name="users" size="md" />
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-display">
              Manajemen Data Pengguna Portal
            </h2>
            <p className="text-xs text-slate-600">
              Tambah, ubah peran, unggah foto profil, dan hapus akun Admin, Guru, serta Orang
              Tua Murid secara real-time
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 rounded-xl btn-3d-sky whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-2 border-purple-200 rounded-2xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau NIP/NIK..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-purple-50 rounded-xl border border-purple-200">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'admin', label: 'Admin' },
              { id: 'guru', label: 'Guru' },
              { id: 'orangtua', label: 'Orang Tua' },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                roleFilter === r.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-purple-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && !modalOpen && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border-2 border-purple-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada data pengguna yang cocok. Klik &ldquo;Tambah Pengguna&rdquo; untuk
            menambahkan akun.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-200 bg-purple-50/80 text-xs font-bold text-slate-700">
                  <th className="py-3 px-5">Foto & Nama</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">NIP / NIK</th>
                  <th className="py-3 px-4">Rombel / Unit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-200 bg-purple-50 shrink-0 flex items-center justify-center">
                          {u.photoUrl ? (
                            <SafeImage
                              src={u.photoUrl}
                              alt={u.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-extrabold text-purple-700">
                              {u.displayName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.displayName}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-purple-800 font-bold">
                      {u.role === 'orangtua' ? 'Orang Tua' : u.role}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs tabular-nums text-slate-600">
                      {u.nipOrNik || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{u.rombel || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs font-bold capitalize ${
                          u.status === 'aktif' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        title="Ubah pengguna"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-lg mr-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(u)}
                        title="Hapus pengguna"
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
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-purple-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 px-6 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-display">
                {isEdit ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
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
                photoLabel="Foto Profil Pengguna (Opsional)"
                photoUrl={form.photoUrl || ''}
                onPhotoChange={(val) => setForm({ ...form, photoUrl: val })}
                showPresets={false}
                maxPhotoDimension={480}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Google
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={150}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran Akses
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="admin">Admin / Kepala Sekolah</option>
                    <option value="guru">Guru / Wali Kelas</option>
                    <option value="orangtua">Orang Tua Murid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as UserStatus })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / NIK
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={form.nipOrNik || ''}
                    onChange={(e) => setForm({ ...form, nipOrNik: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rombel / Unit Tugas
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={form.rombel || ''}
                    onChange={(e) => setForm({ ...form, rombel: e.target.value })}
                    placeholder="Contoh: Kelas 4"
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    maxLength={25}
                    value={form.phone || ''}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tautkan Siswa (Opsional)
                  </label>
                  <select
                    value={form.linkedStudentId || ''}
                    onChange={(e) =>
                      setForm({ ...form, linkedStudentId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Tidak ditautkan</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.rombel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl btn-3d-emerald disabled:opacity-60 cursor-pointer"
                >
                  {busy ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
