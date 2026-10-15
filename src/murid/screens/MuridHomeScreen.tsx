import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { MuridHomeScreenProps } from '../types';
import { SCHEDULES_BY_DAY } from '../../data/samakan/scheduleData';
import { getPerangkatKelas } from '../../utils/perangkatKelasManager';
import { PanggilGuruModal } from '../../components/PanggilGuruModal';

export const MuridHomeScreen: React.FC<MuridHomeScreenProps> = ({
  user,
  onNavigateTab,
  onShowToast,
}) => {
  const [showPanggilModal, setShowPanggilModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSession, setActiveSession] = useState<any>(null);
  const [todayAttendanceStatus, setTodayAttendanceStatus] = useState<'Hadir' | 'Sakit' | 'Izin' | 'Alfa' | 'Belum Presensi'>('Hadir');
  const [checkInTime, setCheckInTime] = useState<string>('07.15 WIT');
  const [isValidated, setIsValidated] = useState(true);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = dayNames[currentTime.getDay()];
  const currentKelasId = user.kelas?.id || user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626';
  const currentKelasNama = user.kelas?.nama || user.classRoom || 'XII TKJ 1';

  // Perangkat Kelas config
  const perangkatKelas = useMemo(() => {
    return getPerangkatKelas(currentKelasId, []);
  }, [currentKelasId]);

  // 1. Fetch Today's Attendance Status for this student
  useEffect(() => {
    async function fetchMyAttendance() {
      if (!user.id) return;
      try {
        const { data: harian } = await supabase
          .from('absen_harian')
          .select('status, keterangan, created_at, status_validasi')
          .eq('siswa_id', user.id)
          .eq('tanggal', todayStr)
          .maybeSingle();

        if (harian) {
          const st = harian.status === 'Hadir' ? 'Hadir'
            : harian.status === 'Sakit' ? 'Sakit'
            : harian.status === 'Izin' ? 'Izin'
            : harian.status === 'Alfa' ? 'Alfa'
            : 'Hadir';
          setTodayAttendanceStatus(st);
          setIsValidated(harian.status_validasi === 'tervalidasi');
          if (harian.created_at) {
            const d = new Date(harian.created_at);
            setCheckInTime(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIT');
          }
        }
      } catch (err) {
        console.error('Error fetching student attendance:', err);
      }
    }
    fetchMyAttendance();
  }, [user.id, todayStr]);

  // 2. Fetch Active Schedule for today
  useEffect(() => {
    async function fetchTodaySchedule() {
      try {
        const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
        
        // Supabase Query
        const { data: dbJadwal } = await supabase
          .from('jadwal')
          .select('id, jam_mulai, jam_selesai, ruang, mapel:mapel_id(nama), guru:guru_id(nama)')
          .eq('kelas_id', currentKelasId)
          .eq('hari', todayDayName === 'Minggu' ? 'Senin' : todayDayName)
          .order('jam_mulai', { ascending: true });

        if (dbJadwal && dbJadwal.length > 0) {
          const matched = dbJadwal.find((j: any) => {
            const [sh, sm] = (j.jam_mulai || '00:00').split(':').map(Number);
            const [eh, em] = (j.jam_selesai || '00:00').split(':').map(Number);
            const start = sh * 60 + sm;
            const end = eh * 60 + em;
            return nowMin >= start && nowMin < end;
          });

          if (matched) {
            setActiveSession({
              mapel: matched.mapel?.nama || 'Mata Pelajaran',
              guru: matched.guru?.nama || 'Guru Pengampu',
              ruang: matched.ruang || 'Lab / Ruang Kelas',
              jam: `${matched.jam_mulai.substring(0, 5)} - ${matched.jam_selesai.substring(0, 5)} WIT`,
              isLive: true,
            });
            return;
          }

          // If no currently active, find next upcoming today
          const upcoming = dbJadwal.find((j: any) => {
            const [sh, sm] = (j.jam_mulai || '00:00').split(':').map(Number);
            return (sh * 60 + sm) > nowMin;
          });

          if (upcoming) {
            setActiveSession({
              mapel: upcoming.mapel?.nama || 'Mata Pelajaran',
              guru: upcoming.guru?.nama || 'Guru Pengampu',
              ruang: upcoming.ruang || 'Lab / Ruang Kelas',
              jam: `${upcoming.jam_mulai.substring(0, 5)} - ${upcoming.jam_selesai.substring(0, 5)} WIT`,
              isLive: false,
            });
            return;
          }
        }

        // Fallback to local schedule data
        const localDayList = SCHEDULES_BY_DAY[todayDayName] || SCHEDULES_BY_DAY['Senin'] || [];
        if (localDayList.length > 0) {
          const first = localDayList[0];
          setActiveSession({
            mapel: first.subject,
            guru: first.teacher,
            ruang: first.room,
            jam: `${first.startTime} - ${first.endTime} WIT`,
            isLive: false,
          });
        }
      } catch (err) {
        console.error('Error fetching today schedule:', err);
      }
    }
    fetchTodaySchedule();
  }, [currentKelasId, todayDayName, currentTime]);

  const streakDays = user.streakDays || 0;
  const showStreak = streakDays >= 3; // Rule: only show fire streak if >= 3 days consecutive attendance

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-28 font-body bg-surface-container-lowest min-h-screen">
      {/* Curved Blue Hero Banner */}
      <div className="relative bg-gradient-to-b from-primary via-primary-container to-secondary pt-6 pb-14 px-4 sm:px-6 overflow-hidden rounded-b-[32px] shadow-sm text-white">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-8 w-44 h-44 rounded-full bg-sky-400/20 blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-white p-0.5 shadow-md relative shrink-0">
              <img
                src={user.avatarUrl || 'https://ui-avatars.com/api/?name=Siswa&background=005fa0&color=fff'}
                alt={user.name}
                className="w-full h-full rounded-[14px] object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="min-w-0">
              <p className="text-sky-100 text-xs font-semibold uppercase tracking-wider mb-0.5">
                Selamat Datang 👋
              </p>
              <h1 className="font-headline font-bold text-lg text-white truncate max-w-[220px] sm:max-w-md">
                {user.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-sm">
                  {user.role === 'sekretaris' ? 'Sekretaris Kelas' : 'Siswa'}
                </span>
                <span className="text-[11px] text-sky-100 font-medium">
                  {currentKelasNama}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200 block">
              Tahun Ajaran
            </span>
            <span className="text-xs font-bold text-white">
              2026/2027 Ganjil
            </span>
          </div>
        </div>

        {/* Status Streak Api (Muncul hanya jika >= 3 hari berturut-turut) */}
        {showStreak && (
          <div className="relative z-10 mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/30 to-orange-500/30 border border-amber-300/40 backdrop-blur-md flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">🔥</span>
              <div>
                <span className="font-bold text-xs text-white block">Streak Kehadiran Aktif!</span>
                <span className="text-[11px] text-amber-100">
                  Kamu sudah hadir {streakDays} hari berturut-turut tanpa terlambat.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-xs shrink-0">
              {streakDays} HARI
            </span>
          </div>
        )}
      </div>

      <div className="px-4 -mt-8 relative z-20 space-y-4">
        {/* Digital Student Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-primary text-[20px]">badge</span>
              <span className="font-headline font-bold text-xs text-slate-800 uppercase tracking-wider">
                Kartu Pelajar Elektronik
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Siswa Terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">NISN</span>
              <span className="font-mono text-sm font-bold text-slate-800">
                {user.identifier || '0058291042'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kelas</span>
              <span className="font-headline text-sm font-bold text-primary">
                {currentKelasNama}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Wali Kelas</span>
              <span className="text-xs font-bold text-slate-700 truncate">
                {user.homeroomTeacher || perangkatKelas.waliKelasNama || 'Ibu Dina Purba, S.Pd.'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Presensi Hari Ini</span>
              <span className={`text-xs font-bold ${todayAttendanceStatus === 'Hadir' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {todayAttendanceStatus} ({checkInTime})
              </span>
            </div>
          </div>
        </div>

        {/* Live / Upcoming Schedule Banner */}
        {activeSession && (
          <div className="bg-gradient-to-br from-sky-50 to-blue-50/50 rounded-2xl p-4 border border-sky-100 shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {activeSession.isLive ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    LIVE SEDANG BERLANGSUNG
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide bg-sky-100 px-2 py-0.5 rounded-full">
                    Sesi Hari Ini
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-600">{activeSession.jam}</span>
            </div>

            <div>
              <h3 className="font-headline font-bold text-sm text-slate-900 leading-snug">
                {activeSession.mapel}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined notranslate text-[14px] text-slate-400">person</span>
                {activeSession.guru}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined notranslate text-[14px] text-slate-400">meeting_room</span>
                {activeSession.ruang}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('jadwal')}
              className="mt-1 w-full py-2 rounded-xl bg-white text-primary font-bold text-xs border border-sky-200 hover:bg-sky-50 transition active:scale-95 flex items-center justify-center gap-1 shadow-xs"
            >
              <span>Lihat Seluruh Roster Jadwal</span>
              <span className="material-symbols-outlined notranslate text-[16px]">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('absensi')}
            className="p-3 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-primary/30 transition-all flex flex-col items-center gap-1.5 text-center active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined notranslate text-[22px]">checklist</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs text-slate-800">Absensi</h4>
              <p className="text-[10px] text-slate-400">Kelas</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('jadwal')}
            className="p-3 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-primary/30 transition-all flex flex-col items-center gap-1.5 text-center active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined notranslate text-[22px]">calendar_month</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs text-slate-800">Jadwal</h4>
              <p className="text-[10px] text-slate-400">Mapel</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowPanggilModal(true)}
            className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs hover:border-emerald-400 transition-all flex flex-col items-center gap-1.5 text-center active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center group-hover:bg-emerald-700 transition-colors shadow-xs">
              <span className="material-symbols-outlined notranslate text-[22px]">phone_in_talk</span>
            </div>
            <div>
              <h4 className="font-headline font-bold text-xs text-emerald-950">Panggil Guru</h4>
              <p className="text-[10px] text-emerald-700 font-semibold">WhatsApp</p>
            </div>
          </button>
        </div>

        {/* Monthly Attendance Recap Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-xs text-slate-800 uppercase tracking-wider">
              Rekapitulasi Kehadiran Bulan Ini
            </h3>
            <span className="text-[11px] font-bold text-slate-400">Oktober 2026</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-700 block">HADIR</span>
              <span className="font-headline font-black text-lg text-emerald-800 mt-0.5 block">0</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-700 block">SAKIT</span>
              <span className="font-headline font-black text-lg text-amber-800 mt-0.5 block">0</span>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
              <span className="text-[10px] font-bold text-sky-700 block">IZIN</span>
              <span className="font-headline font-black text-lg text-sky-800 mt-0.5 block">0</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-700 block">ALFA</span>
              <span className="font-headline font-black text-lg text-slate-800 mt-0.5 block">0</span>
            </div>
          </div>
        </div>

        {/* Perangkat Kelas Info Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined notranslate text-[18px] text-slate-500">groups</span>
            <span className="font-headline font-bold text-xs text-slate-700 uppercase tracking-wide">
              Perangkat Kelas {currentKelasNama}
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Wali Kelas:</span>
              <span className="font-bold text-slate-800">{perangkatKelas.waliKelasNama || 'Ibu Dina Purba, S.Pd.'}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Sekretaris 1:</span>
              <span className="font-bold text-slate-800">{perangkatKelas.sekretarisNama || 'Farhan Ramadhan'}</span>
            </p>
            {perangkatKelas.sekretaris2Nama && (
              <p className="flex justify-between">
                <span className="text-slate-400 font-medium">Sekretaris 2:</span>
                <span className="font-bold text-slate-800">{perangkatKelas.sekretaris2Nama}</span>
              </p>
            )}
            <p className="flex justify-between">
              <span className="text-slate-400 font-medium">Ketua Kelas:</span>
              <span className="font-bold text-slate-800">{perangkatKelas.ketuaKelasNama || 'Ketua Kelas'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Modal Panggil Guru WhatsApp */}
      <PanggilGuruModal
        isOpen={showPanggilModal}
        onClose={() => setShowPanggilModal(false)}
        initialTeacherName={activeSession?.guru || 'Budi Santoso, S.Kom'}
        initialClassName={currentKelasNama || 'XII TKJ 1'}
        initialRoomName={activeSession?.ruang || 'Lab Komputer 2'}
        studentName={user.name || 'Cindy Laura'}
        onSuccess={(msg) => {
          onShowToast('Panggilan Terkirim! 📲', msg, 'success');
        }}
      />
    </div>
  );
};
