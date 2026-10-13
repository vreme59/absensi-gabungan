import React, { useState, useEffect } from 'react';
import { SCHOOL_LOGO } from '../../data/samakan/mockData';
import { MuridHeaderProps } from '../types';

export const MuridHeader: React.FC<MuridHeaderProps> = ({
  user,
  title,
  isDarkMode,
  onToggleDarkMode,
  onNotificationClick,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIT'
      );

      const hours = now.getHours();
      if (hours >= 4 && hours < 11) setGreeting('Selamat Pagi');
      else if (hours >= 11 && hours < 15) setGreeting('Selamat Siang');
      else if (hours >= 15 && hours < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const className = user.kelas?.nama || user.classRoom || 'XII TKJ 1';

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-[0_1px_12px_rgba(0,95,160,0.05)] pt-safe transition-colors duration-200">
      <div className="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto h-16 px-4 flex items-center justify-between">
        {/* Mobile View Brand / Desktop Greeting */}
        <div className="flex items-center gap-3">
          <div className="lg:hidden w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 p-1.5 flex items-center justify-center shrink-0 border border-primary/20">
            <img src={SCHOOL_LOGO} alt="SMKN 1 Sorong" className="w-full h-full object-contain" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-headline font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                {title || `${greeting}, ${user.name.split(' ')[0]}`}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold tracking-wide uppercase">
                {className}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate">
              SMK Negeri 1 Sorong • Presensi Digital
            </span>
          </div>
        </div>

        {/* Right Actions: Time, Dark mode toggle, Notification, Avatar */}
        <div className="flex items-center gap-2">
          {timeStr && (
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-primary dark:text-sky-300 bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-full border border-primary/15 dark:border-primary/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {timeStr}
            </span>
          )}

          {/* Dark Mode Button (min 44x44px touch target) */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition active:scale-95"
            aria-label={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            title={isDarkMode ? 'Mode Terang' : 'Mode Gelap'}
          >
            <span className="material-symbols-outlined notranslate text-[20px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Notification Button (min 44x44px touch target) */}
          <button
            type="button"
            onClick={onNotificationClick}
            className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition active:scale-95 relative"
            aria-label="Notifikasi Siswa"
          >
            <span className="material-symbols-outlined notranslate text-[20px]">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User Photo Avatar */}
          <div className="w-10 h-10 rounded-full ring-2 ring-primary/20 overflow-hidden shrink-0 ml-1">
            <img
              src={user.avatarUrl || 'https://ui-avatars.com/api/?name=Siswa&background=005fa0&color=fff'}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
