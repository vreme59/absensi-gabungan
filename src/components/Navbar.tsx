import React, { useState } from 'react';
import { SCHOOL_LOGO } from '../data/samakan/mockData';
import { UserProfile, UserRole } from '../types';

interface NavbarProps {
  currentTab: string;
  user: UserProfile;
  onSelectRole: (role: UserRole) => void;
  onOpenHtmlModal: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  user,
  onNavigateToTab,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const isTeacherTier = user.role === 'guru' || user.role === 'wali_kelas' || user.is_wali_kelas || user.role === 'guru_piket';

  const tabLabels: Record<string, string> = {
    beranda: (user.role === 'operator' || (user.role as any) === 'admin' || user.role === 'superadmin')
      ? (user.role === 'superadmin' ? 'Super Admin SIAP' : 'Admin TU')
      : 'Beranda',
    jadwal: 'Jadwal',
    absensi: isTeacherTier ? 'Perangkat Kelas' : (user.role === 'operator' || (user.role as any) === 'admin' || user.role === 'superadmin') ? 'Wali & Piket' : 'Absensi',
    profil: 'Profil Pengguna',
    'wali-kelas': 'Wali Kelas',
    'guru-piket': 'Guru Piket',
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-primary pt-safe shadow-[0_4px_16px_rgba(0,95,160,0.18)]">
      <div className="max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto h-16 px-3.5 sm:px-4 md:px-6 flex items-center justify-between">
        {/* Left: School Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            alt="Logo SMKN 1 Sorong"
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-sm"
            src={SCHOOL_LOGO}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline font-bold text-[15px] sm:text-[17px] text-white tracking-wide leading-tight">
                SMKN 1 SORONG
              </span>
              <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
            </div>
            <span className="font-body text-[10px] sm:text-[11px] font-semibold text-primary-fixed leading-tight">
              {tabLabels[currentTab] || 'SIAKAD'}
            </span>
          </div>
        </div>

        {/* Right: Teacher Role Context Switcher */}
        {isTeacherTier && onNavigateToTab && (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="bg-white/15 hover:bg-white/25 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/20 transition active:scale-95 shadow-xs"
            >
              <span className="material-symbols-outlined notranslate text-[16px]">
                {currentTab === 'wali-kelas' ? 'supervisor_account' : currentTab === 'guru-piket' ? 'security' : 'school'}
              </span>
              <span className="text-[11px] sm:text-xs">
                {currentTab === 'wali-kelas'
                  ? (user?.wali_kelas ? `Wali ${user.wali_kelas.nama}` : 'Wali Kelas')
                  : currentTab === 'guru-piket'
                  ? 'Guru Piket'
                  : 'Guru Mapel'}
              </span>
              <span className="material-symbols-outlined notranslate text-[14px]">
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <p className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Beralih Workspace:
                </p>
                <button
                  onClick={() => {
                    onNavigateToTab('absensi');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-2.5 py-2 text-left rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    currentTab === 'absensi' ? 'bg-primary text-white' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined notranslate text-[16px]">verified</span>
                  <span>Guru Mata Pelajaran</span>
                </button>

                {/* HANYA MUNCUL JIKA GURU MEMILIKI KELAS PERWALIAN */}
                {(user?.is_wali_kelas || user?.role === 'wali_kelas') && (
                  <button
                    onClick={() => {
                      onNavigateToTab('wali-kelas');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      currentTab === 'wali-kelas' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined notranslate text-[16px]">supervisor_account</span>
                    <span>Wali Kelas {user?.wali_kelas?.nama ? `(${user.wali_kelas.nama})` : ''}</span>
                  </button>
                )}

                {/* HANYA MUNCUL JIKA GURU SEDANG PIKET HARI INI ATAU MEMILIKI ROLE PIKET */}
                {(user?.is_guru_piket || user?.role === 'guru_piket' || user?.role === 'operator') && (
                  <button
                    onClick={() => {
                      onNavigateToTab('guru-piket');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                      currentTab === 'guru-piket' ? 'bg-amber-600 text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined notranslate text-[16px]">security</span>
                    <span>Portal Live Guru Piket</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
