import React from 'react';
import { m } from 'motion/react';
import { SCHOOL_LOGO } from '../../data/samakan/mockData';
import { MuridTabKey, MuridSidebarProps } from '../types';
import { navPillTransition } from '../../lib/motion';

export const MuridSidebar: React.FC<MuridSidebarProps> = ({
  user,
  currentTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  const tabs: { id: MuridTabKey; label: string; icon: string; description: string }[] = [
    { id: 'beranda', label: 'Beranda', icon: 'home', description: 'Ringkasan & Pelajaran' },
    { id: 'jadwal', label: 'Jadwal', icon: 'calendar_today', description: 'Roster Pelajaran Kelas' },
    { id: 'absensi', label: 'Absensi', icon: 'checklist', description: 'Presensi & Status Siswa' },
    { id: 'profil', label: 'Profil', icon: 'account_circle', description: 'Data Akun & Pengaturan' },
  ];

  const className = user.kelas?.nama || user.classRoom || 'XII TKJ 1';

  return (
    <aside
      aria-label="Sidebar Menu Siswa"
      className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-30 flex-col justify-between p-4 shadow-[4px_0_24px_rgba(0,95,160,0.04)] transition-colors duration-200"
    >
      <div className="flex flex-col gap-6">
        {/* Brand & School Logo */}
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-primary/20 p-2 flex items-center justify-center shrink-0 border border-primary/20">
            <img src={SCHOOL_LOGO} alt="Logo SMKN 1 Sorong" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
              SMKN 1 SORONG
            </span>
            <span className="text-[11px] font-semibold text-primary dark:text-sky-400">
              Presensi Siswa Digital
            </span>
          </div>
        </div>

        {/* Student Mini Card */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <img
            src={user.avatarUrl || 'https://ui-avatars.com/api/?name=Siswa&background=005fa0&color=fff'}
            alt={user.name}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-headline font-bold text-xs text-slate-900 dark:text-white truncate">
              {user.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-primary text-white text-[9px] font-bold">
                {className}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {user.identifier || '0058291042'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-1">
            Menu Utama
          </span>

          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;

            return (
              <m.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                whileTap={{ scale: 0.98 }}
                type="button"
                className={`relative flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl min-h-[46px] text-left transition-colors ${
                  isActive
                    ? 'text-primary dark:text-sky-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Sliding Pill for Desktop Sidebar */}
                {isActive && (
                  <m.div
                    layoutId="activeDesktopSidebarPill"
                    transition={navPillTransition}
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/25 rounded-2xl border-l-4 border-primary dark:border-sky-400"
                  />
                )}

                <span
                  className={`material-symbols-outlined notranslate text-[22px] relative z-10 ${
                    isActive ? 'text-primary dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>

                <div className="flex flex-col min-w-0 relative z-10">
                  <span className="text-xs font-bold leading-tight">
                    {tab.label}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500 truncate">
                    {tab.description}
                  </span>
                </div>
              </m.button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls: Dark Mode Toggle + Logout */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Dark Mode Switcher */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined notranslate text-[18px]">
              {isDarkMode ? 'dark_mode' : 'light_mode'}
            </span>
            <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </button>

        {/* Logout Button if available */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <span className="material-symbols-outlined notranslate text-[18px]">logout</span>
            <span>Keluar Akun</span>
          </button>
        )}
      </div>
    </aside>
  );
};
