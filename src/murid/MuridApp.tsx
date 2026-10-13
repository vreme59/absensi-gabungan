import React, { useState, useEffect } from 'react';
import { LazyMotion, MotionConfig, domAnimation, AnimatePresence, m } from 'motion/react';
import { UserProfile } from '../types';
import { USER_PROFILES } from '../data/samakan/mockData';
import { MuridTabKey, MuridAppProps } from './types';
import { pageVariants } from '../lib/motion';
import { MuridHeader } from './components/MuridHeader';
import { MuridBottomNav } from './components/MuridBottomNav';
import { MuridSidebar } from './components/MuridSidebar';
import { MuridHomeScreen } from './screens/MuridHomeScreen';
import { MuridJadwalScreen } from './screens/MuridJadwalScreen';
import { MuridAbsensiScreen } from './screens/MuridAbsensiScreen';
import { MuridProfileScreen } from './screens/MuridProfileScreen';

export const MuridApp: React.FC<MuridAppProps> = ({
  user = USER_PROFILES.siswa,
  initialTab = 'beranda',
  onLogout,
  onShowToast,
  onNavigateTab,
  containerClassName = '',
}) => {
  const [currentTab, setCurrentTab] = useState<MuridTabKey>(initialTab);
  const [localToast, setLocalToast] = useState<{ title: string; desc: string; type: string } | null>(null);

  // Dark Mode State with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smkn1_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('smkn1_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleToast = (title: string, desc: string, type: 'success' | 'warning' | 'info' | 'error' = 'info') => {
    if (onShowToast) {
      onShowToast(title, desc, type);
    } else {
      setLocalToast({ title, desc, type });
      setTimeout(() => setLocalToast(null), 3500);
    }
  };

  const handleTabChange = (tab: MuridTabKey) => {
    setCurrentTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-body transition-colors duration-200 ${isDarkMode ? 'dark' : ''} ${containerClassName}`}>
          {/* Desktop Left Sidebar (>= 1024px) */}
          <MuridSidebar
            user={user}
            currentTab={currentTab}
            onTabChange={handleTabChange}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onLogout={onLogout}
          />

          {/* Top Header (Visible on mobile and desktop content header) */}
          <MuridHeader
            user={user}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onNotificationClick={() => handleToast('Notifikasi', 'Tidak ada pengumuman baru hari ini.', 'info')}
          />

          {/* Main Content Area with Desktop offset (lg:pl-64) */}
          <div className="flex-1 lg:pl-64 flex flex-col pt-16">
            <main className="flex-1 w-full pb-20 lg:pb-8">
              {/* Animated Page Transitions using AnimatePresence + pageVariants */}
              <AnimatePresence mode="wait">
                <m.div
                  key={currentTab}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {currentTab === 'beranda' && (
                    <MuridHomeScreen
                      user={user}
                      isDarkMode={isDarkMode}
                      onNavigateTab={handleTabChange}
                      onShowToast={handleToast}
                    />
                  )}

                  {currentTab === 'jadwal' && (
                    <MuridJadwalScreen
                      user={user}
                      isDarkMode={isDarkMode}
                      onNavigateTab={handleTabChange}
                      onShowToast={handleToast}
                    />
                  )}

                  {currentTab === 'absensi' && (
                    <MuridAbsensiScreen
                      user={user}
                      isDarkMode={isDarkMode}
                      onNavigateTab={handleTabChange}
                      onShowToast={handleToast}
                    />
                  )}

                  {currentTab === 'profil' && (
                    <MuridProfileScreen
                      user={user}
                      isDarkMode={isDarkMode}
                      onToggleDarkMode={toggleDarkMode}
                      onLogout={onLogout}
                      onNavigateTab={handleTabChange}
                      onShowToast={handleToast}
                    />
                  )}
                </m.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Floating Local Toast Feedback */}
          {localToast && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 animate-fade-in pointer-events-none">
              <span className="material-symbols-outlined notranslate text-[18px] text-primary">info</span>
              <span>{localToast.title}: {localToast.desc}</span>
            </div>
          )}

          {/* Mobile Bottom Navigation (< 1024px) */}
          <MuridBottomNav
            currentTab={currentTab}
            onTabChange={handleTabChange}
          />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
};
