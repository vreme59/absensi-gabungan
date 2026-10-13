import React, { useState } from 'react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
  userRole?: 'siswa' | 'guru' | 'admin' | 'superadmin';
  onAddNotification?: (newNotif: NotificationItem) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllAsRead,
  userRole = 'siswa',
  onAddNotification,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newAudience, setNewAudience] = useState<'semua' | 'guru' | 'siswa'>('semua');

  if (!isOpen) return null;

  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';

  // Filter based on role
  const visibleNotifications = notifications.filter((item) => {
    if (isAdminOrSuper) return true;
    if (!item.targetAudience || item.targetAudience === 'semua') return true;
    return item.targetAudience === userRole;
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    if (onAddNotification) {
      onAddNotification({
        id: `notif-${Date.now()}`,
        title: newTitle.trim(),
        message: newMessage.trim(),
        time: 'Baru saja',
        read: false,
        type: 'broadcast',
        targetAudience: newAudience,
      });
    }

    setNewTitle('');
    setNewMessage('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#eceef0] animate-slideDown max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-[#00609b] to-[#0761a2] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <div>
              <h3 className="text-[14px] font-bold">Pemberitahuan Sekolah</h3>
              <p className="text-[11px] text-[#cfe4ff]">
                {isAdminOrSuper ? 'Pusat Broadcast Pengumuman' : 'Informasi & Update Presensi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Admin Broadcast Creator Form */}
        {isAdminOrSuper && (
          <div className="bg-[#f0f4f8] px-3.5 py-2.5 border-b border-[#eceef0] flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#404751]">
              Target: {isCreating ? 'Tulis Pengumuman' : 'Pemberitahuan Terkirim'}
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="px-2.5 py-1 rounded-lg bg-[#00609b] text-white text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isCreating ? 'close' : 'campaign'}
              </span>
              <span>{isCreating ? 'Batal' : '+ Buat Pengumuman'}</span>
            </button>
          </div>
        )}

        {isCreating && isAdminOrSuper && (
          <form onSubmit={handleCreateAnnouncement} className="p-3 bg-[#e6f0fa] border-b border-[#cfe4ff] flex flex-col gap-2 animate-fadeIn text-[11px]">
            <div>
              <label className="font-bold text-[#001d34]">Judul Pemberitahuan</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Pengumuman PTS / Libur Khusus"
                required
                className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#c3c7cf] text-[11px] outline-hidden focus:border-[#00609b]"
              />
            </div>
            <div>
              <label className="font-bold text-[#001d34]">Isi Pesan</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                placeholder="Ketik rincian pengumuman untuk warga sekolah..."
                required
                className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#c3c7cf] text-[11px] outline-hidden focus:border-[#00609b]"
              />
            </div>
            <div>
              <label className="font-bold text-[#001d34]">Target Penerima</label>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {(['semua', 'guru', 'siswa'] as const).map((aud) => (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => setNewAudience(aud)}
                    className={`py-1 rounded-lg font-bold text-[10px] border transition-all capitalize ${
                      newAudience === aud
                        ? 'bg-[#00609b] text-white border-[#00609b]'
                        : 'bg-white text-[#404751] border-[#c3c7cf]'
                    }`}
                  >
                    {aud === 'semua' ? 'Semua' : aud === 'guru' ? 'Guru Saja' : 'Siswa Saja'}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="mt-1 py-1.5 rounded-xl bg-gradient-to-r from-[#00609b] to-[#00855b] text-white font-bold text-[11px] shadow-xs active:scale-95 transition-all"
            >
              Kirim Pengumuman Sekarang
            </button>
          </form>
        )}

        {/* List */}
        <div className="p-3 space-y-2 overflow-y-auto bg-[#f7f9fb] flex-1">
          {visibleNotifications.length === 0 ? (
            <div className="p-6 text-center text-[#707882] text-[12px]">
              Tidak ada pemberitahuan baru saat ini.
            </div>
          ) : (
            visibleNotifications.map((item) => {
              const aud = item.targetAudience || 'semua';
              const audBadge = aud === 'semua'
                ? { label: 'Semua Warga', bg: 'bg-slate-100 text-slate-700' }
                : aud === 'guru'
                ? { label: 'Khusus Guru', bg: 'bg-blue-100 text-blue-800' }
                : { label: 'Khusus Siswa', bg: 'bg-emerald-100 text-emerald-800' };

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                    item.read
                      ? 'bg-white border-[#eceef0]'
                      : 'bg-[#cfe4ff]/25 border-[#00609b]/30 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] font-bold text-[#191c1e] flex items-center gap-1.5">
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#00609b] shrink-0" />
                      )}
                      <span className="line-clamp-1">{item.title}</span>
                    </span>
                    <span className="text-[10px] text-[#707882] shrink-0">{item.time}</span>
                  </div>

                  <p className="text-[11px] text-[#404751] leading-relaxed">
                    {item.message}
                  </p>

                  {isAdminOrSuper && (
                    <div className="pt-1 flex items-center gap-1">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${audBadge.bg}`}>
                        {audBadge.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#eceef0] flex items-center justify-between">
          <button
            type="button"
            onClick={onMarkAllAsRead}
            className="text-[11px] text-[#00609b] font-bold hover:underline"
          >
            Tandai Semua Dibaca
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-[#00609b] text-white text-[11px] font-bold hover:bg-[#0079c2]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
