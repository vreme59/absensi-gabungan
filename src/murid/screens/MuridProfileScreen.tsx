import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { MuridProfileScreenProps } from '../types';

export const MuridProfileScreen: React.FC<MuridProfileScreenProps> = ({
  user,
  onLogout,
  onShowToast,
}) => {
  const [geofenceDistance] = useState<number>(35); // in meters (radius 100m)
  const isInsideGeofence = geofenceDistance <= 100;
  const currentKelasNama = user.kelas?.nama || user.classRoom || 'XII TKJ 1';

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto pb-28 font-body bg-slate-50 min-h-screen">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-b from-primary to-primary-container pt-6 pb-12 px-4 text-white relative rounded-b-[28px] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-sky-100 uppercase tracking-wider">
            Profil Siswa Dapodik
          </span>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
            SMKN 1 SORONG
          </span>
        </div>

        <div className="flex items-center gap-3.5 mt-2">
          <img
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/60 shadow-md shrink-0"
            src={user.avatarUrl || 'https://ui-avatars.com/api/?name=Siswa&background=005fa0&color=fff'}
          />
          <div className="flex flex-col min-w-0">
            <h1 className="font-headline font-bold text-lg text-white truncate">{user.name}</h1>
            <span className="text-xs text-sky-100 font-semibold">{user.roleTitle || `Siswa • ${currentKelasNama}`}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded-md text-white">
                NISN: {user.identifier || '0058291042'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="px-4 -mt-6 relative z-20 space-y-3.5">
        {/* Geofence Status Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isInsideGeofence ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <span className="material-symbols-outlined notranslate text-[22px]">
                {isInsideGeofence ? 'near_me' : 'location_off'}
              </span>
            </div>
            <div>
              <span className="font-headline font-bold text-xs text-slate-800 block">
                Radius Lokasi Presensi (GPS)
              </span>
              <span className="text-[11px] text-slate-500">
                {isInsideGeofence
                  ? `Di area SMKN 1 Sorong (${geofenceDistance}m dari pusat)`
                  : 'Di luar radius presensi resmi sekolah'}
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
            isInsideGeofence ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {isInsideGeofence ? 'VALID' : 'OUT'}
          </span>
        </div>

        {/* Academic Details Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-3">
          <h3 className="font-headline font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Informasi Akademik Siswa
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Nama Lengkap</span>
              <span className="font-bold text-slate-800">{user.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Nomor Induk Siswa Nasional</span>
              <span className="font-mono font-bold text-slate-800">{user.identifier || '0058291042'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Kelas &amp; Rombel</span>
              <span className="font-bold text-primary">{currentKelasNama}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Wali Kelas</span>
              <span className="font-bold text-slate-800">{user.homeroomTeacher || 'Ibu Dina Purba, S.Pd.'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Sekolah</span>
              <span className="font-bold text-slate-800">SMK Negeri 1 Sorong</span>
            </div>
          </div>
        </div>

        {/* Security & Action Card */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
          <h3 className="font-headline font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">
            Pengaturan Akun
          </h3>

          <button
            type="button"
            onClick={() => onShowToast?.('Info Akun', 'Untuk ubah data NISN/identitas silakan hubungi bagian Tata Usaha.', 'info')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition text-left"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined notranslate text-slate-400 text-[20px]">manage_accounts</span>
              <span className="text-xs font-semibold text-slate-700">Pusat Data Dapodik</span>
            </div>
            <span className="material-symbols-outlined notranslate text-slate-300 text-[18px]">chevron_right</span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-rose-50 transition text-left text-rose-600"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined notranslate text-[20px]">logout</span>
                <span className="text-xs font-bold">Keluar dari Akun</span>
              </div>
              <span className="material-symbols-outlined notranslate text-[18px]">chevron_right</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
