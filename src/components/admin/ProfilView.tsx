import React from 'react';
import { ASSETS } from './mockData';

interface UserSession {
  username: string;
  role: 'siswa' | 'guru' | 'admin' | 'superadmin';
  nama: string;
}

interface ProfilViewProps {
  session?: UserSession | null;
  onLogout?: () => void;
  onOpenLencanaModal: () => void;
  onNavigateToAbsensi: () => void;
}

export function getUserAvatar(session?: UserSession | null): string {
  const role = session?.role || 'siswa';
  if (role === 'guru') return ASSETS.teacherAvatar;
  if (role === 'admin' || role === 'superadmin') return ASSETS.adminAvatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80';
  return ASSETS.cindyPortrait;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  session,
  onLogout,
  onOpenLencanaModal,
  onNavigateToAbsensi,
}) => {
  const role = session?.role || 'siswa';
  const isGuru = role === 'guru';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isSuper = role === 'superadmin';

  const roleBadge = isSuper
    ? 'Superadmin (IT / Kepala Sekolah)'
    : role === 'admin'
    ? 'Admin TU / Operator Sekolah'
    : isGuru
    ? 'Guru Mata Pelajaran'
    : 'Siswa Aktif (XII TKJ 1)';

  const avatar = getUserAvatar(session);

  const displayName = session?.nama || (isGuru ? 'Budi Santoso, S.Kom' : isAdmin ? 'Administrator SIAP' : 'Cindy Laura');
  const identifierLabel = isGuru ? 'NIP' : isAdmin ? 'ID Petugas' : 'NISN';
  const identifierValue = isGuru ? '196812291993031011' : isAdmin ? 'ADM-SMKN1-001' : '0068192041';

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Curved Blue Header */}
      <div className="bg-gradient-to-b from-[#00609b] to-[#0761a2] pt-4 pb-16 px-4 rounded-b-[28px] shadow-sm text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12px] uppercase font-bold tracking-wider text-[#cfe4ff]">
            Profil Pengguna
          </span>
          <span className="bg-[#6ffbbe]/20 text-[#6ffbbe] border border-[#6ffbbe]/40 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            {roleBadge}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatar}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#6ffbbe] rounded-full ring-2 ring-[#00609b]" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold leading-tight">{displayName}</h2>
            <p className="text-[12px] text-[#cfe4ff]">
              {identifierLabel}: {identifierValue}
            </p>
            <p className="text-[11px] text-white/80">SMKN 1 Sorong, Papua Barat Daya</p>
          </div>
        </div>
      </div>

      {/* Floating Info Cards */}
      <div className="px-4 -mt-9 flex flex-col gap-3 relative z-10">
        {/* Academic / Staff Details Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eceef0] flex flex-col gap-3">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#404751]">
            {isGuru || isAdmin ? 'Detail Penugasan & Hak Akses' : 'Informasi Akademik'}
          </h3>
          <div className="space-y-2 text-[12px]">
            {isGuru ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Mata Pelajaran</span>
                  <span className="font-bold text-[#191c1e]">Pemodelan Perangkat Lunak & Cloud</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Beban Mengajar</span>
                  <span className="font-bold text-[#00609b]">24 Jam Pelajaran (JP) / Minggu</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Penugasan Ruang</span>
                  <span className="font-bold text-[#191c1e]">Lab Komputer 2 &amp; Bengkel Jaringan</span>
                </div>
              </>
            ) : isAdmin ? (
              <>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Unit Kerja</span>
                  <span className="font-bold text-[#191c1e]">Tata Usaha &amp; Kurikulum SMKN 1</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Tingkat Otoritas</span>
                  <span className="font-bold text-[#00609b]">
                    {isSuper ? 'Level 0 — Full Root Access' : 'Level 1 — Operator Jadwal & Rekap'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Database Connection</span>
                  <span className="font-bold text-emerald-600">PostgreSQL Supabase Connected</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Kompetensi Keahlian</span>
                  <span className="font-bold text-[#191c1e]">Teknik Komputer &amp; Jaringan (TKJ)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Rombongan Belajar</span>
                  <span className="font-bold text-[#191c1e]">Kelas XII TKJ 1</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#eceef0]">
                  <span className="text-[#404751]">Status Akademik</span>
                  <span className="font-bold text-emerald-600">Siswa Aktif Terdaftar</span>
                </div>
              </>
            )}

            <div className="flex justify-between py-1 border-b border-[#eceef0]">
              <span className="text-[#404751]">Tahun Ajaran</span>
              <span className="font-bold text-[#191c1e]">2026 / 2027 (Semester Ganjil)</span>
            </div>
          </div>
        </div>

        {/* Gamification & Lencana Banner (for Siswa or All) */}
        {!isAdmin && (
          <div
            onClick={onOpenLencanaModal}
            className="bg-gradient-to-r from-[#cfe4ff] to-[#d1e4ff] rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#00609b] shadow-xs">
                <span
                  className="material-symbols-outlined text-[26px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  military_tech
                </span>
              </div>
              <div>
                <p className="text-[13px] font-extrabold text-[#001d34]">
                  {isGuru ? 'Penilaian Kedisiplinan Kelas' : '14 Hari Disiplin Streak'}
                </p>
                <p className="text-[11px] text-[#004a79]">
                  {isGuru ? 'Pantau ranking kehadiran 36 rombel' : 'Peringkat 3 se-SMKN 1 Sorong • Buka Papan Peringkat'}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#00609b]">chevron_right</span>
          </div>
        )}

        {/* Data Keamanan & Status Integrasi */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eceef0] flex flex-col gap-2">
          <h3 className="text-[13px] font-bold uppercase tracking-wider text-[#404751]">
            Status Sistem
          </h3>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between py-1 border-b border-[#eceef0]">
              <span className="text-[#404751]">Email Akun</span>
              <span className="font-mono text-[#00609b]">
                {session?.username ? `${session.username}@smkn1sorong.sch.id` : 'user@smkn1sorong.sch.id'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#404751]">Integrasi SIAP</span>
              <span className="text-[#006947] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Tersinkronisasi Otomatis
              </span>
            </div>
          </div>
        </div>

        {/* Quick Shortcut to Roll-Call if Guru/Admin */}
        {(isGuru || isAdmin) && (
          <div className="bg-[#f2f4f6] rounded-2xl p-4 border border-[#eceef0] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#191c1e]">Lembar Presensi Kelas</p>
              <p className="text-[11px] text-[#404751]">Buka roll-call presensi XII TKJ 1</p>
            </div>
            <button
              type="button"
              onClick={onNavigateToAbsensi}
              className="px-3.5 py-2 rounded-full bg-[#00609b] text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Buka Roll-Call
            </button>
          </div>
        )}

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-[13px] flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Keluar dari Akun ({displayName})</span>
          </button>
        )}
      </div>
    </div>
  );
};
