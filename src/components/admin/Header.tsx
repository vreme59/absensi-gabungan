import React from 'react';
import { ASSETS } from './mockData';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  unreadCount?: number;
  avatarUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Beranda',
  showBack = false,
  onBack,
  onNotificationClick,
  onProfileClick,
  unreadCount = 1,
  avatarUrl,
}) => {
  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl z-40 bg-[#00609b]/95 text-white backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.06)] pt-safe transition-all">
      <div className="h-16 px-4 flex items-center justify-between gap-2 w-full">
        {/* Left: Back button or school branding */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali"
              className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 active:bg-white/20 transition-colors shrink-0 -ml-2"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : null}

          <img
            src={ASSETS.logo}
            alt="SMKN 1 Sorong Logo"
            className="h-8 w-auto object-contain shrink-0"
          />

          <div className="flex flex-col min-w-0">
            {!showBack && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#cfe4ff] opacity-90 truncate leading-tight">
                SMKN 1 Sorong
              </span>
            )}
            <h1 className="text-[16px] text-white truncate font-bold leading-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-1 shrink-0">
          {!showBack && (
            <button
              type="button"
              onClick={onNotificationClick}
              aria-label="Notifikasi Presensi"
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 active:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ffdad6] ring-2 ring-[#00609b]" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onProfileClick}
            aria-label="Profil Guru / Siswa"
            className="w-8 h-8 rounded-full overflow-hidden shrink-0 ml-1 ring-2 ring-white/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <img
              src={avatarUrl || ASSETS.teacherAvatar}
              alt="Profil"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
