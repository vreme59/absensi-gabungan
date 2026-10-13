import React from 'react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: string;
  pendingValidationCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  userRole,
  pendingValidationCount = 0,
}) => {
  const isTeacherTier = userRole === 'guru' || userRole === 'wali_kelas' || userRole === 'guru_piket';
  const isAdminTier = userRole === 'operator' || userRole === 'admin' || userRole === 'superadmin';
  const tabs = [
    {
      id: 'beranda',
      label: isAdminTier ? (userRole === 'superadmin' ? 'Super Admin' : 'Admin TU') : 'Beranda',
      icon: isAdminTier ? 'admin_panel_settings' : 'home',
    },
    {
      id: 'jadwal',
      label: 'Jadwal',
      icon: 'calendar_today',
    },
    {
      id: 'absensi',
      label: isAdminTier ? 'Wali & Piket' : isTeacherTier ? 'Validasi' : 'Absensi',
      icon: isAdminTier ? 'supervisor_account' : isTeacherTier ? 'fact_check' : 'checklist',
      badge: isTeacherTier && pendingValidationCount > 0 ? pendingValidationCount : undefined,
    },
    {
      id: 'profil',
      label: 'Profil',
      icon: 'account_circle',
    },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,95,160,0.08)]">
      <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto flex justify-around items-center h-16 px-2 sm:px-4">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-all relative ${
                isActive ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <div className="relative">
                <span
                  className="material-symbols-outlined notranslate text-[24px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-error text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="font-label-sm text-[11px] mt-0.5 tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
