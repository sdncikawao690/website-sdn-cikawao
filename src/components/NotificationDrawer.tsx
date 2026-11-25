import { CheckCheck, X } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Icon3D } from './Icon3D';
import { AttachmentStrip } from './MediaViewer';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ open, onClose }: NotificationDrawerProps) {
  const {
    announcements,
    readAnnouncementIds,
    markAnnouncementRead,
    markAllAnnouncementsRead,
    unreadAnnouncementsCount,
  } = useSchool();

  if (!open) return null;

  const activeList = announcements.filter((a) => a.isActive);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]">
      <div className="w-full max-w-md bg-white h-full border-l-2 border-amber-200 flex flex-col">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon3D name="bell" size="sm" />
            <div>
              <h2 className="text-base font-bold font-display">
                Notifikasi Pengumuman Orang Tua
              </h2>
              <p className="text-xs text-amber-50">
                Pembaruan otomatis real-time ({unreadAnnouncementsCount} belum dibaca)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel notifikasi"
            className="p-2 text-white/90 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-amber-100 bg-amber-50/70 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">
            Menampilkan {activeList.length} pengumuman aktif
          </span>
          <button
            type="button"
            onClick={markAllAnnouncementsRead}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai semua dibaca
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {activeList.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Belum ada pengumuman aktif saat ini.
            </div>
          ) : (
            activeList.map((item) => {
              const isRead = readAnnouncementIds.includes(item.id);
              const priorityStyle =
                item.priority === 'Mendesak'
                  ? 'text-rose-700'
                  : item.priority === 'Penting'
                    ? 'text-amber-700'
                    : 'text-sky-700';

              return (
                <div
                  key={item.id}
                  onClick={() => markAnnouncementRead(item.id)}
                  className={`p-5 transition-colors cursor-pointer ${
                    isRead ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/50 hover:bg-amber-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${priorityStyle}`}>
                        {item.priority}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.targetRombel}</span>
                    </div>
                    {!isRead && (
                      <span className="text-xs font-bold text-orange-600">Baru</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">
                    {item.message}
                  </p>
                  <AttachmentStrip
                    photoUrl={item.photoUrl}
                    videoUrl={item.videoUrl}
                    documentUrl={item.documentUrl}
                    title={item.title}
                    compact
                  />
                  <p className="text-xs text-slate-400 mt-2">Oleh {item.authorName}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
