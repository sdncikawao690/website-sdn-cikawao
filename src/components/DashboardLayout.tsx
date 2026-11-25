import React from 'react';
import { LogOut } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_INFO } from '../types/school';
import { Icon3D, type Icon3DName } from './Icon3D';
import { AnnouncementsTab } from './dashboard/AnnouncementsTab';
import { JabarBeraksiTab } from './dashboard/JabarBeraksiTab';
import { NewsGalleryTab } from './dashboard/NewsGalleryTab';
import { OverviewTab } from './dashboard/OverviewTab';
import { PkksTab } from './dashboard/PkksTab';
import { SilokaTab } from './dashboard/SilokaTab';
import { StudentsAcademicTab } from './dashboard/StudentsAcademicTab';
import { TeachersCrudTab } from './dashboard/TeachersCrudTab';
import { UsersCrudTab } from './dashboard/UsersCrudTab';

interface DashboardLayoutProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNotifications: () => void;
  onBackToPortal: () => void;
}

interface NavDef {
  id: string;
  label: string;
  icon3d: Icon3DName;
  activeBg: string;
  roles: Array<'admin' | 'guru' | 'orangtua'>;
}

const DASHBOARD_NAV: NavDef[] = [
  {
    id: 'overview',
    label: 'Ringkasan Sekolah',
    icon3d: 'dashboard',
    activeBg: 'bg-teal-50 text-teal-900 border-teal-300',
    roles: ['admin', 'guru', 'orangtua'],
  },
  {
    id: 'students',
    label: 'Siswa & Akademik',
    icon3d: 'students',
    activeBg: 'bg-amber-50 text-amber-950 border-amber-300',
    roles: ['admin', 'guru', 'orangtua'],
  },
  {
    id: 'users',
    label: 'Manajemen Pengguna',
    icon3d: 'users',
    activeBg: 'bg-purple-50 text-purple-950 border-purple-300',
    roles: ['admin'],
  },
  {
    id: 'teachers',
    label: 'Direktori 8 Guru',
    icon3d: 'teacher',
    activeBg: 'bg-emerald-50 text-emerald-950 border-emerald-300',
    roles: ['admin'],
  },
  {
    id: 'news-gallery',
    label: 'Berita KBM & Galeri',
    icon3d: 'news',
    activeBg: 'bg-sky-50 text-sky-950 border-sky-300',
    roles: ['admin', 'guru'],
  },
  {
    id: 'pkks',
    label: 'Instrumen PKKS',
    icon3d: 'pkks',
    activeBg: 'bg-yellow-50 text-yellow-950 border-yellow-300',
    roles: ['admin'],
  },
  {
    id: 'jabar-beraksi',
    label: 'Jabar Beraksi',
    icon3d: 'ekskul',
    activeBg: 'bg-lime-50 text-emerald-950 border-emerald-300',
    roles: ['admin', 'guru'],
  },
  {
    id: 'announcements',
    label: 'Notifikasi Orang Tua',
    icon3d: 'bell',
    activeBg: 'bg-orange-50 text-orange-950 border-orange-300',
    roles: ['admin', 'guru'],
  },
  {
    id: 'siloka',
    label: 'Layanan SILOKA',
    icon3d: 'siloka',
    activeBg: 'bg-violet-50 text-violet-950 border-violet-300',
    roles: ['admin', 'guru', 'orangtua'],
  },
];

export function DashboardLayout({
  activeTab,
  onSelectTab,
  onOpenNotifications,
  onBackToPortal,
}: DashboardLayoutProps) {
  const { user, userRole, isAuthorizedAdmin, unreadAnnouncementsCount, logout } =
    useSchool();

  const handleLogout = async () => {
    await logout();
    onBackToPortal();
  };

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-[calc(100vh-4.375rem)] flex items-center justify-center p-6 bg-gradient-to-br from-sky-50 via-amber-50/40 to-rose-50/50">
        <div className="max-w-md w-full bg-white border-2 border-rose-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <Icon3D name="dashboard" size="lg" className="mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900 font-display">
            Akses Dashboard Terbatas
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hanya email admin resmi{' '}
            <span className="font-mono font-bold text-slate-900">
              {SCHOOL_INFO.email}
            </span>{' '}
            yang diizinkan untuk menambah dan mengubah data dashboard SDN Cikawao.
          </p>
          <button
            type="button"
            onClick={onBackToPortal}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl btn-3d-sky cursor-pointer"
          >
            Kembali ke Portal Publik
          </button>
        </div>
      </div>
    );
  }

  const effectiveRole = userRole || 'admin';
  const visibleNav = DASHBOARD_NAV.filter((item) =>
    item.roles.includes(effectiveRole)
  );
  const currentNav =
    visibleNav.find((n) => n.id === activeTab) || visibleNav[0];

  return (
    <div className="min-h-[calc(100vh-4.375rem)] bg-gradient-to-br from-sky-50/80 via-amber-50/40 to-rose-50/50 flex flex-col lg:flex-row">
      {/* Sidebar 260px */}
      <aside className="w-full lg:w-[270px] bg-white border-b lg:border-b-0 lg:border-r border-sky-200 shrink-0 flex flex-col">
        <div className="p-4 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white p-1 shrink-0 shadow-sm flex items-center justify-center">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SDN Cikawao"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold font-display tracking-tight truncate">
                {SCHOOL_INFO.name}
              </p>
              <p className="text-[11px] font-semibold text-amber-200 truncate">
                {effectiveRole === 'admin'
                  ? 'Administrator / Kepsek'
                  : effectiveRole === 'guru'
                    ? 'Pendidik / Wali Kelas'
                    : 'Portal Orang Tua Murid'}
              </p>
            </div>
          </div>
          <p className="text-sm font-extrabold truncate mt-0.5 font-display">
            {user?.displayName || 'Pengguna Portal'}
          </p>
          <p className="text-xs text-sky-100 truncate">{user?.email}</p>
        </div>

        <nav
          aria-label="Menu Dashboard"
          className="p-2.5 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible flex-1"
        >
          {visibleNav.map((item) => {
            const active = currentNav.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? item.activeBg
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon3D name={item.icon3d} size="sm" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:block p-3 border-t border-sky-100">
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Breadcrumb Bar */}
        <div className="bg-white/95 border-b border-sky-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2.5 truncate">
            <Icon3D name={currentNav.icon3d} size="sm" />
            <span>Dashboard</span>
            <span aria-hidden="true">/</span>
            <span className="font-extrabold text-slate-900 truncate font-display">
              {currentNav.label}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Notifikasi</span>
              {unreadAnnouncementsCount > 0 && (
                <span className="font-mono tabular-nums text-rose-700">
                  ({unreadAnnouncementsCount})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>

        {/* Active View */}
        <div className="p-4 sm:p-8 max-w-6xl w-full">
          {currentNav.id === 'overview' && <OverviewTab onSelectTab={onSelectTab} />}
          {currentNav.id === 'students' && <StudentsAcademicTab />}
          {currentNav.id === 'users' && effectiveRole === 'admin' && <UsersCrudTab />}
          {currentNav.id === 'teachers' && effectiveRole === 'admin' && (
            <TeachersCrudTab />
          )}
          {currentNav.id === 'news-gallery' &&
            (effectiveRole === 'admin' || effectiveRole === 'guru') && (
              <NewsGalleryTab />
            )}
          {currentNav.id === 'pkks' && effectiveRole === 'admin' && <PkksTab />}
          {currentNav.id === 'jabar-beraksi' &&
            (effectiveRole === 'admin' || effectiveRole === 'guru') && (
              <JabarBeraksiTab />
            )}
          {currentNav.id === 'announcements' &&
            (effectiveRole === 'admin' || effectiveRole === 'guru') && (
              <AnnouncementsTab />
            )}
          {currentNav.id === 'siloka' && <SilokaTab />}
        </div>
      </div>
    </div>
  );
}
