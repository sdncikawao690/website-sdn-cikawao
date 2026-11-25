import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { FIREBASE_AUTH_PROVIDERS_URL, FirebaseAuthUiError } from '../../lib/firebase';
import {
  TIM_IT_ACCOUNT,
  type UserAccount,
  type UserRole,
  type UserStatus,
} from '../../types/school';
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
  const {
    users,
    students,
    isPrimaryAdmin,
    adminMarkers,
    activateTimItAdmin,
    revokeTimItAdmin,
    saveUser,
    removeUser,
  } = useSchool();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState<Omit<UserAccount, 'createdAt' | 'updatedAt'>>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [timItPassword, setTimItPassword] = useState('');
  const [showTimItPassword, setShowTimItPassword] = useState(false);
  const [timItBusy, setTimItBusy] = useState(false);
  const [timItError, setTimItError] = useState<string | null>(null);
  const [timItErrorCode, setTimItErrorCode] = useState<string | null>(null);
  const [timItSuccess, setTimItSuccess] = useState<string | null>(null);

  const timItMarker = useMemo(
    () =>
      adminMarkers.find(
        (m) => m.email.toLowerCase() === TIM_IT_ACCOUNT.internalEmail
      ) || null,
    [adminMarkers]
  );

  const handleActivateTimIt = async (e: React.FormEvent) => {
    e.preventDefault();
    setTimItError(null);
    setTimItErrorCode(null);
    setTimItSuccess(null);
    setTimItBusy(true);
    try {
      await activateTimItAdmin(timItPassword);
      setTimItPassword('');
      setTimItSuccess(
        `Akses login Tim IT aktif! Sekarang dapat masuk ke Dashboard Admin menggunakan username "${TIM_IT_ACCOUNT.username}" dan password yang baru saja Anda tetapkan.`
      );
    } catch (err) {
      if (err instanceof FirebaseAuthUiError) {
        setTimItErrorCode(err.code);
        setTimItError(err.message);
      } else {
        setTimItError(
          err instanceof Error ? err.message : 'Gagal mengaktifkan akses login Tim IT.'
        );
      }
    } finally {
      setTimItBusy(false);
    }
  };

  const handleRevokeTimIt = async () => {
    if (!timItMarker) return;
    setTimItError(null);
    setTimItErrorCode(null);
    setTimItSuccess(null);
    setTimItBusy(true);
    try {
      await revokeTimItAdmin(timItMarker.uid);
      setTimItSuccess('Akses admin Tim IT berhasil dinonaktifkan.');
    } catch (err) {
      setTimItError(
        err instanceof Error ? err.message : 'Gagal menonaktifkan akses Tim IT.'
      );
    } finally {
      setTimItBusy(false);
    }
  };

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

      {/* Tim IT Username & Password Admin Access Card (Primary Admin Only) */}
      {isPrimaryAdmin && (
        <div className="bg-gradient-to-br from-sky-50 via-white to-indigo-50/70 border-2 border-sky-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 font-display">
                    Akses Login Tim IT SDN Cikawao (User &amp; Password)
                  </h3>
                  {timItMarker ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-lg border border-amber-200">
                      Belum Diaktifkan
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Username login:{' '}
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-sky-200">
                    {TIM_IT_ACCOUNT.username}
                  </span>{' '}
                  · Email internal Auth:{' '}
                  <span className="font-mono text-slate-700">{TIM_IT_ACCOUNT.internalEmail}</span>
                </p>
              </div>
            </div>

            {timItMarker && (
              <button
                type="button"
                disabled={timItBusy}
                onClick={() => void handleRevokeTimIt()}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer self-start sm:self-center disabled:opacity-60"
              >
                Nonaktifkan Akses Tim IT
              </button>
            )}
          </div>

          {timItError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl space-y-2">
              <p className="font-semibold">{timItError}</p>
              {timItErrorCode === 'auth/operation-not-allowed' && (
                <p className="text-[11px] text-rose-950 leading-relaxed">
                  Buka{' '}
                  <a
                    href={FIREBASE_AUTH_PROVIDERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline inline-flex items-center gap-1 text-sky-700"
                  >
                    Firebase Console — Sign-in Providers
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  , aktifkan penyedia <strong>Email/Password</strong> lalu simpan, kemudian klik
                  tombol aktivasi di bawah sekali lagi.
                </p>
              )}
            </div>
          )}

          {timItSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{timItSuccess}</span>
            </div>
          )}

          <form
            onSubmit={(e) => void handleActivateTimIt(e)}
            className="flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1">
              <label
                htmlFor="timit-setup-password"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                {timItMarker
                  ? 'Tautkan / Verifikasi Ulang Password Tim IT'
                  : 'Tetapkan Password Akun Tim IT'}
              </label>
              <div className="relative">
                <input
                  id="timit-setup-password"
                  type={showTimItPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={64}
                  value={timItPassword}
                  onChange={(e) => setTimItPassword(e.target.value)}
                  placeholder="Masukkan password untuk login Tim IT (minimal 6 karakter)"
                  className="w-full pl-3.5 pr-10 py-2 text-sm border-2 border-sky-200 bg-white rounded-xl focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  aria-label={showTimItPassword ? 'Sembunyikan password' : 'Lihat password'}
                  onClick={() => setShowTimItPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showTimItPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={timItBusy}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl btn-3d-emerald whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {timItBusy
                ? 'Mengaktifkan...'
                : timItMarker
                  ? 'Tautkan Ulang Akun Tim IT'
                  : 'Aktifkan Akun Tim IT'}
            </button>
          </form>

          {timItMarker && (
            <p className="text-[11px] text-slate-500 font-mono">
              UID Admin Tim IT Terdaftar: {timItMarker.uid}
            </p>
          )}
        </div>
      )}

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
