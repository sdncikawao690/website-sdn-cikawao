import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_INFO, type PublicTabId } from '../types/school';
import { ThemeModeSwitcher } from './ThemeModeSwitcher';

interface NavbarProps {
  viewMode: 'public' | 'dashboard';
  activePublicTab: PublicTabId;
  onSwitchView: (mode: 'public' | 'dashboard') => void;
  onSelectPublicTab: (tab: PublicTabId) => void;
  onOpenLogin: () => void;
}

const NAV_ITEMS: Array<{
  id: PublicTabId;
  label: string;
  activeClass: string;
  hoverClass: string;
}> = [
  {
    id: 'beranda',
    label: 'Beranda',
    activeClass: 'text-sky-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-sky-600',
  },
  {
    id: 'profil',
    label: 'Profil',
    activeClass: 'text-teal-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-teal-600',
  },
  {
    id: 'kbm-galeri',
    label: 'KBM & Galeri',
    activeClass: 'text-amber-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-amber-600',
  },
  {
    id: 'pkks',
    label: 'PKKS',
    activeClass: 'text-emerald-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-emerald-600',
  },
  {
    id: 'peserta-didik',
    label: 'Peserta Didik',
    activeClass: 'text-cyan-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-cyan-600',
  },
  {
    id: 'jabar-beraksi',
    label: 'Jabar Beraksi',
    activeClass: 'text-rose-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-rose-600',
  },
  {
    id: 'siloka',
    label: 'SILOKA',
    activeClass: 'text-violet-700 underline decoration-2 underline-offset-8',
    hoverClass: 'hover:text-violet-600',
  },
];

export function Navbar({
  viewMode,
  activePublicTab,
  onSwitchView,
  onSelectPublicTab,
  onOpenLogin,
}: NavbarProps) {
  const { user, isAuthorizedAdmin, logout } = useSchool();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const handlePrimaryAction = async () => {
    if (!user) {
      onOpenLogin();
      return;
    }
    if (!isAuthorizedAdmin) {
      setAuthBusy(true);
      try {
        await logout();
      } finally {
        setAuthBusy(false);
      }
      return;
    }
    onSwitchView(viewMode === 'public' ? 'dashboard' : 'public');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-sky-200">
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-amber-400 via-emerald-500 to-rose-500" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 xl:gap-8">
        {/* Zone 1: School Logo & Single-Line Wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            onSelectPublicTab('beranda');
          }}
          className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0"
        >
          <span className="w-9 h-9 rounded-xl logo-light-badge p-0.5 inline-flex items-center justify-center shrink-0">
            <img
              src={SCHOOL_INFO.logoUrl}
              alt="Logo SDN Cikawao"
              className="w-full h-full object-contain"
            />
          </span>
          <span className="text-lg xl:text-xl font-extrabold tracking-tight font-display bg-gradient-to-r from-sky-600 via-emerald-600 to-amber-600 bg-clip-text text-transparent">
            {SCHOOL_INFO.name}
          </span>
        </a>

        {/* Zone 2: Dedicated Single-Line Tab Links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs xl:text-sm font-semibold text-slate-700"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = viewMode === 'public' && activePublicTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPublicTab(item.id)}
                className={`${
                  isActive
                    ? `${item.activeClass} font-extrabold`
                    : `${item.hoverClass} hover:underline underline-offset-4`
                } transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme switcher + primary action */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="hidden sm:block">
            <ThemeModeSwitcher variant="compact" />
          </div>
          <button
            type="button"
            disabled={authBusy}
            onClick={() => void handlePrimaryAction()}
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl btn-3d-amber whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {authBusy
              ? 'Memproses...'
              : !user
                ? 'Login Admin'
                : !isAuthorizedAdmin
                  ? 'Keluar'
                  : viewMode === 'public'
                    ? 'Buka Dashboard'
                    : 'Lihat Portal'}
          </button>

          <button
            type="button"
            aria-label="Menu Navigasi"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 text-slate-700 hover:bg-sky-50 rounded-xl transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-sky-100 bg-white px-4 py-3 space-y-2">
          <div className="sm:hidden pb-2">
            <ThemeModeSwitcher variant="full" />
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive = viewMode === 'public' && activePublicTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onSelectPublicTab(item.id);
                }}
                className={`block w-full text-left px-3 py-2 text-sm rounded-xl transition-colors ${
                  isActive
                    ? 'bg-sky-50 font-extrabold text-sky-800'
                    : 'font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
