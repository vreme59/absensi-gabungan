import React from 'react';
import { m } from 'motion/react';
import { MuridTabKey, MuridBottomNavProps } from '../types';
import { navPillTransition } from '../../lib/motion';

export const MuridBottomNav: React.FC<MuridBottomNavProps> = ({
  currentTab,
  onTabChange,
  unreadCount = 0,
}) => {
  const tabs: { id: MuridTabKey; label: string; icon: string; badge?: number }[] = [
    { id: 'beranda', label: 'Beranda', icon: 'home' },
    { id: 'jadwal', label: 'Jadwal', icon: 'calendar_today' },
    { id: 'absensi', label: 'Absensi', icon: 'checklist', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'profil', label: 'Profil', icon: 'account_circle' },
  ];

  return (
    <nav
      aria-label="Navigasi Menu Siswa"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,95,160,0.08)] transition-colors duration-200"
    >
      <div className="max-w-md sm:max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          return (
            <m.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.94 }}
              type="button"
              className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[44px] px-2.5 py-1 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
            >
              {/* Sliding Pill Indicator for Active Nav Item */}
              {isActive && (
                <m.div
                  layoutId="activeMobileNavPill"
                  transition={navPillTransition}
                  className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl"
                />
              )}

              {/* Icon with subtle scale-up on active */}
              <m.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 flex items-center justify-center"
              >
                <span
                  className={`material-symbols-outlined notranslate text-[24px] transition-colors ${
                    isActive
                      ? 'text-primary dark:text-sky-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>

                {/* Badge if any */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-rose-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                    {tab.badge}
                  </span>
                )}
              </m.div>

              {/* Label */}
              <span
                className={`relative z-10 text-[11px] font-semibold mt-0.5 tracking-tight leading-none transition-colors ${
                  isActive
                    ? 'text-primary dark:text-sky-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </m.button>
          );
        })}
      </div>
    </nav>
  );
};
