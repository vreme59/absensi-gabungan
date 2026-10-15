import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface ProfileScreenProps {
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  user: UserProfile;
  onLogout: () => void;
  onShowToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
  onShowToast,
  onEditProfile,
  onChangePassword
}) => {
  const [geofenceDistance, setGeofenceDistance] = useState<number>(35); // in meters (radius 100m)
  const isInsideGeofence = geofenceDistance <= 100;

  

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto pb-24 font-body">
      {/* Ocean Top Header Area */}
      <div className="bg-primary pt-3 pb-8 px-4 sm:px-6 text-white relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary-fixed uppercase tracking-wider">
            Akun &amp; Privasi Dapodik
          </span>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
            SMKN 1 SORONG
          </span>
        </div>

        <div className="flex items-center gap-3.5 mt-2">
          <img
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/60 shadow-lg"
            src={user.avatarUrl}
          />
          <div className="flex flex-col min-w-0">
            <h1 className="font-headline font-bold text-lg text-white truncate">{user.name}</h1>
            <span className="text-xs text-sky-100 font-semibold">{user.roleTitle}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-md text-white">
                {user.nipOrNisnLabel}: {user.identifier}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Body Content */}
      <div className="px-4 -mt-4 relative z-20 flex flex-col gap-4">
        

        

        {/* Pengaturan & Informasi */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col mb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3.5 bg-primary rounded-full"></div>
                <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                  Pengaturan &amp; Informasi
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Akun Dapodik</span>
            </div>
            
            <div className="flex flex-col gap-5">
              <button 
                onClick={onEditProfile}
                className="flex items-center justify-between w-full group active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-sky-50 text-sky-600 flex items-center justify-center">
                    <span className="material-symbols-outlined notranslate text-[22px]">manage_accounts</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-slate-800">Edit Data Profil</span>
                    <span className="text-[11px] text-slate-400 font-medium">Perbarui kontak &amp; data diri</span>
                  </div>
                </div>
                <span className="material-symbols-outlined notranslate text-slate-300 text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>

              <button 
                onClick={onChangePassword}
                className="flex items-center justify-between w-full group active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined notranslate text-[22px]">key</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-slate-800">Ubah Kata Sandi</span>
                    <span className="text-[11px] text-slate-400 font-medium">Perbarui keamanan akun &amp; PIN</span>
                  </div>
                </div>
                <span className="material-symbols-outlined notranslate text-slate-300 text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
              
              <button 
                className="flex items-center justify-between w-full group active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <span className="material-symbols-outlined notranslate text-[22px]">calendar_today</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-slate-800">Tahun Ajaran</span>
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded font-bold">Aktif</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">2024/2025 - Semester Ganjil</span>
                  </div>
                </div>
                <span className="material-symbols-outlined notranslate text-slate-300 text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>

              <button 
                onClick={() => onShowToast('Notifikasi', 'Pengaturan notifikasi berhasil dibuka.', 'info')}
                className="flex items-center justify-between w-full group active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
                    <span className="material-symbols-outlined notranslate text-[22px]">notifications_active</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-slate-800">Notifikasi &amp; Pengingat</span>
                    <span className="text-[11px] text-slate-400 font-medium">Alarm kelas &amp; pengumuman mapel</span>
                  </div>
                </div>
                <span className="material-symbols-outlined notranslate text-slate-300 text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>

              <button 
                onClick={() => onShowToast('Privasi', 'Melihat izin privasi Dapodik.', 'info')}
                className="flex items-center justify-between w-full group active:scale-[0.98] transition-transform text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[14px] bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <span className="material-symbols-outlined notranslate text-[22px]">shield_person</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-bold text-slate-800">Privasi &amp; Keamanan Data</span>
                    <span className="text-[11px] text-slate-400 font-medium">Izin akses &amp; enkripsi data Dapodik</span>
                  </div>
                </div>
                <span className="material-symbols-outlined notranslate text-slate-300 text-[20px] group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl bg-white border border-rose-200 text-error hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
        >
          <span className="material-symbols-outlined notranslate text-[18px]">logout</span>
          <span>Keluar dari Akun</span>
        </button>

        <p className="text-[11px] text-center text-slate-400 pb-4">
          SMK Negeri 1 Sorong • Versi Aplikasi 2.4.0
        </p>
      </div>
    </div>
  );
};
