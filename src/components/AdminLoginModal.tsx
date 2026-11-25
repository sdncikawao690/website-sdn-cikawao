import React, { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import {
  FIREBASE_AUTH_PROVIDERS_URL,
  FIREBASE_AUTH_SETTINGS_URL,
  FIREBASE_AUTH_USERS_URL,
  FirebaseAuthUiError,
} from '../lib/firebase';
import { SCHOOL_INFO, TIM_IT_ACCOUNT } from '../types/school';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccessDashboard: () => void;
}

export function AdminLoginModal({
  open,
  onClose,
  onSuccessDashboard,
}: AdminLoginModalProps) {
  const { loginWithCredentials, loginWithGoogle } = useSchool();
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'google'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pendingActivationUid, setPendingActivationUid] = useState<string | null>(null);

  if (!open) return null;

  const resetFeedback = () => {
    setErrorMsg(null);
    setErrorCode(null);
    setPendingActivationUid(null);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setBusy(true);
    try {
      const result = await loginWithCredentials(username, password);
      if (result.authorized) {
        setPassword('');
        onClose();
        onSuccessDashboard();
      } else {
        setPendingActivationUid(result.uid);
        setErrorMsg(
          `Akun berhasil masuk, namun UID (${result.uid}) belum ditautkan sebagai Admin Tim IT. Masuk sekali menggunakan Google (${SCHOOL_INFO.email}) lalu aktifkan akun Tim IT di menu Manajemen Pengguna.`
        );
      }
    } catch (err) {
      if (err instanceof FirebaseAuthUiError) {
        setErrorCode(err.code);
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Gagal masuk ke dashboard admin.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetFeedback();
    setBusy(true);
    try {
      await loginWithGoogle();
      onClose();
      onSuccessDashboard();
    } catch (err) {
      if (err instanceof FirebaseAuthUiError) {
        setErrorCode(err.code);
        setErrorMsg(err.message);
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Login Google dibatalkan atau gagal.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-login-title"
        className="bg-white border-2 border-sky-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl logo-light-badge bg-white/95 p-1 flex items-center justify-center shrink-0">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SDN Cikawao"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 id="admin-login-title" className="text-base font-extrabold font-display">
                Masuk Dashboard Admin
              </h2>
              <p className="text-xs text-sky-100">{SCHOOL_INFO.name}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup jendela login"
            onClick={onClose}
            className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Login Method Switcher */}
          <div
            role="tablist"
            aria-label="Metode login admin"
            className="grid grid-cols-2 gap-2 p-1.5 bg-sky-50 border-2 border-sky-200 rounded-2xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'credentials'}
              onClick={() => {
                setLoginMethod('credentials');
                resetFeedback();
              }}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                loginMethod === 'credentials'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                  : 'text-sky-900 hover:bg-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Tim IT (User)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginMethod === 'google'}
              onClick={() => {
                setLoginMethod('google');
                resetFeedback();
              }}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                loginMethod === 'google'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email Google
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-2xl space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>

              {errorCode === 'auth/unauthorized-domain' && (
                <div className="pt-2 border-t border-rose-200/80 text-[11px] text-rose-950 space-y-1.5">
                  <p className="font-bold">Cara Mengatasi Domain Netlify Belum Diizinkan:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>
                      Salin domain aktif Anda saat ini:{' '}
                      <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-rose-200">
                        {typeof window !== 'undefined' ? window.location.hostname : '*.netlify.app'}
                      </span>
                    </li>
                    <li>
                      Buka{' '}
                      <a
                        href={FIREBASE_AUTH_SETTINGS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline inline-flex items-center gap-1 text-sky-700"
                      >
                        Firebase Auth Settings — Authorized domains
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      Pilih tab <strong>Authorized domains</strong> → klik{' '}
                      <strong>Add domain</strong> → tempel domain Netlify tersebut → klik{' '}
                      <strong>Add</strong>.
                    </li>
                  </ol>
                </div>
              )}

              {(errorCode === 'auth/operation-not-allowed' ||
                errorCode === 'auth/invalid-credential' ||
                errorCode === 'auth/user-not-found') && (
                <div className="pt-2 border-t border-rose-200/80 text-[11px] text-rose-950 space-y-1.5">
                  <p className="font-bold">Langkah Aktivasi Login Tim IT:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>
                      Buka{' '}
                      <a
                        href={FIREBASE_AUTH_PROVIDERS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline inline-flex items-center gap-1 text-sky-700"
                      >
                        Firebase Auth Providers
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      dan aktifkan <strong>Email/Password</strong>.
                    </li>
                    <li>
                      Masuk dengan <strong>Email Google</strong> ({SCHOOL_INFO.email}), buka menu{' '}
                      <strong>Manajemen Pengguna</strong>, lalu klik{' '}
                      <strong>Aktifkan Akun Tim IT</strong> (atau tambahkan{' '}
                      <span className="font-mono font-bold">{TIM_IT_ACCOUNT.internalEmail}</span>{' '}
                      di{' '}
                      <a
                        href={FIREBASE_AUTH_USERS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-sky-700"
                      >
                        Firebase Users
                      </a>
                      ).
                    </li>
                  </ol>
                </div>
              )}

              {pendingActivationUid && (
                <p className="text-[11px] font-mono bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-200">
                  UID Akun: {pendingActivationUid}
                </p>
              )}
            </div>
          )}

          {loginMethod === 'credentials' ? (
            <form onSubmit={(e) => void handleCredentialsSubmit(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="timit-login-username"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Username Tim IT
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="timit-login-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={TIM_IT_ACCOUNT.username}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="timit-login-password"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-sky-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="timit-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password Tim IT"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 rounded-xl btn-3d-sky cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Memverifikasi...' : 'Masuk ke Dashboard Admin'}
              </button>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Gunakan username <span className="font-mono font-bold">{TIM_IT_ACCOUNT.username}</span>{' '}
                beserta password yang telah diaktifkan oleh admin utama sekolah.
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 leading-relaxed">
                Masuk menggunakan akun Google resmi sekolah{' '}
                <span className="font-mono font-bold">{SCHOOL_INFO.email}</span> untuk akses penuh
                pengelolaan dashboard maupun aktivasi akses Tim IT.
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGoogleLogin()}
                className="w-full py-2.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl btn-3d-amber cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Menghubungkan Google...' : `Masuk dengan Google (${SCHOOL_INFO.email})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
