import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

// Fallback high-quality avatar if network image is blocked
const FALLBACK_AVATAR =
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80';

export const EditProfileScreen: React.FC<{
  onBack: () => void;
  user: UserProfile;
  onProfileUpdated: (updated: Partial<UserProfile>) => void;
}> = ({ onBack, user, onProfileUpdated }) => {
  const [formData, setFormData] = useState({
    fullName: user.name,
    classMajor: user.roleTitle, // display only
    academicYear: '2024/2025', // display only
    email: user.identifier, // display only
    phone: user.phone || '',
  });

  const [avatar] = useState(user.avatarUrl || FALLBACK_AVATAR);
  const [avatarError, setAvatarError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Data profil berhasil diperbarui!');

  const showFeedbackToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Tidak ada sesi login aktif.');
      
      const userId = session.user.id;

      // Update profiles table (Hanya nomor telepon yang dapat diperbarui siswa)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      showFeedbackToast('Nomor telepon berhasil diperbarui!');
      
      // Update parent state
      onProfileUpdated({
        phone: formData.phone,
      });
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      showFeedbackToast('Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form reset
  const handleReset = () => {
    setFormData({
      fullName: user.name,
      classMajor: user.roleTitle,
      academicYear: '2024/2025',
      email: user.identifier,
      phone: user.phone || '',
    });
    showFeedbackToast('Perubahan dibatalkan.');
  };

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto min-h-screen bg-slate-50 flex flex-col relative top-0 mt-0 pt-0 pb-20 selection:bg-[#005fa0] selection:text-white shadow-xl sm:border-x sm:border-slate-200">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition-all"
            aria-label="Kembali ke profil"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#005fa0] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">school</span>
            </div>
            <h1 className="font-bold text-[#0b1c30] text-[15px] tracking-tight">Edit Data Profil</h1>
          </div>
        </div>
        <img
          src={avatar}
          alt="Current User"
          className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-100"
        />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Ocean Header with Locked Official Avatar */}
        <div className="bg-[#005fa0] bg-gradient-to-b from-[#005fa0] to-[#0070bb] pt-8 pb-14 relative flex flex-col items-center justify-center overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative flex flex-col items-center z-10">
            <div
              className={`w-28 h-28 rounded-full border-4 ${
                avatarError ? 'border-rose-400' : 'border-white'
              } shadow-xl overflow-hidden bg-white flex items-center justify-center`}
            >
              <img
                src={avatar}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  setAvatarError(true);
                  (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                }}
              />
            </div>
            
          </div>
        </div>

        {/* Form Container */}
        <div className="px-4 sm:px-6 -mt-6 pb-8 relative z-10">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="material-symbols-outlined text-[#005fa0]">badge</span>
              <h2 className="font-bold text-[#0b1c30] text-[15px]">Data Siswa</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Field 1: Nama Lengkap (Read Only - Dapodik) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-[13px] font-semibold text-slate-500 flex items-center gap-1">
                  Nama Lengkap <span className="text-xs text-slate-400 font-normal">(Terkunci Sistem Dapodik)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    id="fullName"
                    disabled
                    readOnly
                    value={formData.fullName}
                    className="w-full h-12 pl-11 pr-4 bg-slate-100 text-slate-500 text-[14px] font-medium rounded-xl border border-slate-200/60 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Field 2: Kelas & Jurusan (Read Only) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="classMajor" className="text-[13px] font-semibold text-slate-500 flex items-center gap-1">
                  Kelas &amp; Jurusan <span className="text-xs text-slate-400 font-normal">(Sistem Dapodik)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                    school
                  </span>
                  <input
                    type="text"
                    id="classMajor"
                    disabled
                    readOnly
                    value={formData.classMajor}
                    className="w-full h-12 pl-11 pr-4 bg-slate-100 text-slate-500 text-[14px] font-medium rounded-xl border border-slate-200/60 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Field 3: Tahun Ajaran (Read Only) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="academicYear" className="text-[13px] font-semibold text-slate-500 flex items-center gap-1">
                  Tahun Ajaran <span className="text-xs text-slate-400 font-normal">(Aktif)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    type="text"
                    id="academicYear"
                    disabled
                    readOnly
                    value={formData.academicYear}
                    className="w-full h-12 pl-11 pr-4 bg-slate-100 text-slate-500 text-[14px] font-medium rounded-xl border border-slate-200/60 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Field 4: Email / NISN (Read Only) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-[13px] font-semibold text-slate-500 flex items-center gap-1">
                  NISN / ID Siswa <span className="text-xs text-slate-400 font-normal">(Akun Resmi)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                    tag
                  </span>
                  <input
                    type="text"
                    id="email"
                    disabled
                    readOnly
                    value={formData.email}
                    className="w-full h-12 pl-11 pr-4 bg-slate-100 text-slate-500 text-[14px] font-medium rounded-xl border border-slate-200/60 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Field 5: Nomor Telepon / WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="phone" className="text-[13px] font-semibold text-[#0b1c30] flex items-center gap-1">
                  Nomor HP / WhatsApp Aktif
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">
                    call
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 0812-4895-7075"
                    className="w-full h-12 pl-11 pr-4 bg-[#eef4fc] text-[#0b1c30] text-[14px] font-medium rounded-xl border border-transparent focus:border-[#005fa0] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#005fa0]/15 transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  Nomor ini digunakan untuk konfirmasi notifikasi dan panggilan presensi.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-1/2 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-1/2 h-12 bg-[#005fa0] hover:bg-[#004e84] text-white rounded-xl text-[14px] font-semibold tracking-wide shadow-md shadow-[#005fa0]/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 pointer-events-none transition-all duration-300 max-w-[90%] ${
          showToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
        <span className="text-[13px] font-medium tracking-tight whitespace-nowrap">{toastMessage}</span>
      </div>
    </div>
  );
};
