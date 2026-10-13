import React from 'react';

export type TabType = 'beranda' | 'jadwal' | 'rekap' | 'profil';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userRole?: 'siswa' | 'guru' | 'admin' | 'superadmin';
  onQuickAbsenClick?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  userRole = 'siswa',
  onQuickAbsenClick,
}) => {
  const isGuru = userRole === 'guru';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const rekapLabel = isGuru ? 'Rekap Kelas' : isAdmin ? 'Rekap Sekolah' : 'Rekap';

  const leftTabs = [
    { id: 'beranda' as TabType, label: 'Beranda', icon: 'home' },
    { id: 'jadwal' as TabType, label: 'Jadwal', icon: 'calendar_month' },
  ];

  const rightTabs = [
    { id: 'rekap' as TabType, label: rekapLabel, icon: 'bar_chart' },
    { id: 'profil' as TabType, label: 'Profil', icon: 'account_circle' },
  ];

  const renderTab = (tab: { id: TabType; label: string; icon: string }) => {
    const isActive = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => onTabChange(tab.id)}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 transition-all rounded-xl ${
          isActive ? 'text-[#00609b] font-bold' : 'text-[#404751] hover:text-[#00609b]'
        }`}
      >
        <span
          className="material-symbols-outlined text-[24px] mb-0.5"
          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {tab.icon}
        </span>
        <span className="text-[11px] font-bold leading-tight truncate">
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl z-40 pb-safe pointer-events-none px-4 pb-3">
      <div className="pointer-events-auto h-16 w-full bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-[0_10px_25px_-5px_rgba(0,95,160,0.14),0_8px_10px_-6px_rgba(15,23,42,0.06)] border border-[#eceef0] flex items-center justify-around px-2 relative">
        {leftTabs.map(renderTab)}

        {/* Pemisah Tombol "Bulet" Biru Khusus Guru untuk Aksi Cepat Absen */}
        {isGuru && (
          <div className="flex flex-col items-center justify-center -mt-6">
            <button
              type="button"
              onClick={onQuickAbsenClick}
              aria-label="Isi Presensi Kelas Sekarang"
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00609b] via-[#0070b8] to-[#0a80d4] text-white shadow-[0_8px_20px_rgba(0,96,155,0.45)] flex items-center justify-center ring-4 ring-white active:scale-95 hover:scale-105 transition-all"
            >
              <span
                className="material-symbols-outlined text-[28px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                how_to_reg
              </span>
            </button>
            <span className="text-[10px] font-extrabold text-[#00609b] mt-0.5 tracking-tight">
              Isi Absen
            </span>
          </div>
        )}

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
};
