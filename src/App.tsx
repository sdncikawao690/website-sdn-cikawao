import { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { DashboardLayout } from './components/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Icon3D } from './components/Icon3D';
import { Navbar } from './components/Navbar';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PublicPortal } from './components/PublicPortal';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { SCHOOL_INFO, type PublicTabId } from './types/school';

function AppShell() {
  const {
    user,
    authReady,
    isAuthorizedAdmin,
    liveNotificationToast,
    dismissToast,
    markAnnouncementRead,
    logout,
  } = useSchool();
  const [viewMode, setViewMode] = useState<'public' | 'dashboard'>('public');
  const [publicTab, setPublicTab] = useState<PublicTabId>('beranda');
  const [dashboardTab, setDashboardTab] = useState<string>('overview');
  const [notifOpen, setNotifOpen] = useState(false);
  const [visitorNoticeDismissed, setVisitorNoticeDismissed] = useState(false);

  const handleSelectPublicTab = (tab: PublicTabId) => {
    setPublicTab(tab);
    setViewMode('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDashboard = (tab?: string) => {
    if (!isAuthorizedAdmin) return;
    if (tab) setDashboardTab(tab);
    setViewMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const effectiveViewMode = isAuthorizedAdmin ? viewMode : 'public';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-50 via-amber-50/35 to-rose-50/40 text-slate-900">
      <Navbar
        viewMode={effectiveViewMode}
        activePublicTab={publicTab}
        onSwitchView={(mode) => {
          if (mode === 'dashboard' && !isAuthorizedAdmin) return;
          setViewMode(mode);
        }}
        onSelectPublicTab={handleSelectPublicTab}
      />

      {authReady && user && !isAuthorizedAdmin && !visitorNoticeDismissed && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Mode Pengunjung (Hanya Lihat):</strong> Anda masuk dengan{' '}
                <span className="font-mono">{user.email}</span>. Akses tambah/ubah dashboard
                khusus untuk email admin resmi{' '}
                <span className="font-mono font-bold">{SCHOOL_INFO.email}</span>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void logout()}
                className="px-2.5 py-1 font-bold bg-white border border-amber-300 rounded-lg hover:bg-amber-100 cursor-pointer"
              >
                Keluar Akun
              </button>
              <button
                type="button"
                onClick={() => setVisitorNoticeDismissed(true)}
                aria-label="Tutup pesan"
                className="p-1 text-amber-700 hover:text-amber-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isAuthorizedAdmin && effectiveViewMode === 'dashboard' ? (
        <DashboardLayout
          activeTab={dashboardTab}
          onSelectTab={setDashboardTab}
          onOpenNotifications={() => setNotifOpen(true)}
          onBackToPortal={() => setViewMode('public')}
        />
      ) : (
        <PublicPortal
          activeTab={publicTab}
          onSelectTab={handleSelectPublicTab}
          onOpenNotifications={() => setNotifOpen(true)}
          onOpenDashboard={handleOpenDashboard}
        />
      )}

      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      {/* Automated Real-Time Parent Notification Toast */}
      {liveNotificationToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white border-2 border-amber-400 rounded-2xl shadow-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Icon3D name="bell" size="sm" />
              <div>
                <p className="text-xs font-bold text-amber-700">
                  Pengumuman Baru · {liveNotificationToast.targetRombel}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {liveNotificationToast.title}
                </p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {liveNotificationToast.message}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    markAnnouncementRead(liveNotificationToast.id);
                    dismissToast();
                    setNotifOpen(true);
                  }}
                  className="text-xs font-bold text-sky-700 hover:underline mt-2 cursor-pointer"
                >
                  Baca Selengkapnya
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Tutup notifikasi"
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SchoolProvider>
        <AppShell />
      </SchoolProvider>
    </ErrorBoundary>
  );
}
