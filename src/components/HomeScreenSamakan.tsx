import { supabase } from '../lib/supabase';
import React, { useState, useEffect } from 'react';
import { SCHEDULES_BY_DAY } from "../data/samakan/scheduleData";
import { UserProfile, StudentAttendance, ClassAttendanceSummary, TeacherCallAlert } from '../types';
import { PanggilGuruModal } from './PanggilGuruModal';

interface HomeScreenProps {
  user: UserProfile;
  classSummary: ClassAttendanceSummary;
  students: StudentAttendance[];
  oldStudents?: any[];
  teacherAlert: TeacherCallAlert;
  onSendTeacherCall: () => void;
  onSubmitMorningDraft: (updatedStudents: StudentAttendance[]) => void;
  onNavigateToTab: (tab: string) => void;
  onShowToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}


export const HomeScreenGuru: React.FC<HomeScreenProps> = ({ user, onNavigateToTab, onShowToast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sisaKelas, setSisaKelas] = useState(0);
  const [isMengajar, setIsMengajar] = useState(false);

  useEffect(() => {
    async function fetchSisaKelas() {
      try {
        const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        let currentDayIndex = currentTime.getDay();
        const hariIni = hariNames[currentDayIndex];
        const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();

        const { data: schedules } = await supabase
          .from('jadwal')
          .select('id, jam_mulai, jam_selesai, mapel:mapel_id(nama), kelas:kelas_id(id, nama), guru_id')
          .eq('hari', hariIni)
          .eq('guru_id', user.id);

        if (!schedules || schedules.length === 0) {
          setSisaKelas(0);
          setIsMengajar(false);
          return;
        }

        const grouped: any[] = [];
        schedules.forEach((item: any) => {
          const lastGroup = grouped[grouped.length - 1];
          const [sh, sm] = (item.jam_mulai || '00:00').split(':').map(Number);
          const [eh, em] = (item.jam_selesai || '00:00').split(':').map(Number);
          const itemDuration = (eh * 60 + em) - (sh * 60 + sm);

          if (
            lastGroup &&
            lastGroup.kelas?.id === item.kelas?.id &&
            lastGroup.mapel?.nama === item.mapel?.nama
          ) {
            lastGroup.endMin = (eh * 60 + em);
            lastGroup.duration += itemDuration;
          } else {
            grouped.push({
              ...item,
              startMin: (sh * 60 + sm),
              endMin: (eh * 60 + em),
              duration: itemDuration
            });
          }
        });

        const futureClasses = grouped.filter(g => g.endMin > nowMin);
        setSisaKelas(futureClasses.length);

        const currentActive = grouped.find(g => nowMin >= g.startMin && nowMin < g.endMin);
        setIsMengajar(!!currentActive);

      } catch (err) { console.error('Failed to fetch schedule:', err); }
    }
    fetchSisaKelas();
  }, [user.id, currentTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const dateString = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto pb-24 font-body bg-slate-50 min-h-screen">
      {/* Blue Header */}
      <div className="bg-primary pt-6 pb-12 px-4 sm:px-6 relative overflow-hidden rounded-b-[32px] shadow-[0_12px_32px_rgba(0,95,160,0.15)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex gap-3 items-center">
            <div className="w-14 h-14 rounded-full bg-white p-1 shadow-md relative">
              <img src="https://ui-avatars.com/api/?name=Haris+T&background=0D8ABC&color=fff&size=128" alt="Profile" className="w-full h-full rounded-full object-cover" />
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <p className="text-sky-100 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Selamat Pagi 👋</p>
              <h1 className="text-white font-headline font-bold text-xl leading-tight">{user.name || 'Pak Haris T.'}</h1>
              <div className="mt-1 inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <span className="material-symbols-outlined notranslate text-[12px] text-white">verified</span>
                <span className="text-white text-[10px] font-bold">Guru Produktif</span>
              </div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white relative backdrop-blur-md">
            <span className="material-symbols-outlined notranslate text-[20px]">notifications</span>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-primary"></span>
          </button>
        </div>

        {/* Status Mengajar Hari Ini (Giant Card like Student) */}
        <div className="relative z-10 mt-6 bg-primary-container/80 border border-white/10 rounded-[20px] p-4 shadow-inner overflow-hidden backdrop-blur-md">
          {/* Card Deco */}
          <svg className="absolute -right-16 -top-16 w-64 h-64 opacity-[0.08]" fill="none" viewBox="0 0 200 200">
            <circle cx="160" cy="160" r="120" stroke="white" strokeDasharray="12 12" strokeWidth="28"></circle>
            <path d="M40 180 C 80 120, 140 140, 200 80" fill="none" stroke="white" strokeWidth="18"></path>
          </svg>

          <div className="flex items-start justify-between relative z-10 mb-3">
            <div>
              <span className="font-label-sm text-[11px] text-primary-fixed flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined notranslate text-[16px]">verified</span> STATUS MENGAJAR HARI INI
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-headline font-bold text-2xl tracking-tight text-white">{timeString} WIT</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-100 font-label-sm text-[11px] font-bold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isMengajar ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`}></span> {isMengajar ? 'SEDANG MENGAJAR' : 'ISTIRAHAT'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-label-sm text-[11px] text-primary-fixed font-semibold">
                Sisa Kelas
              </span>
              <div className="font-headline font-bold text-xl text-white">
                {sisaKelas} Kelas
              </div>
            </div>
          </div>

          <div className="relative z-10 bg-white/15 hover:bg-white/20 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-300 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined notranslate text-emerald-950 text-[20px]">
                  school
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-label-sm text-xs text-white font-bold">
                    Target Hari Ini: 8 JP
                  </span>
                </div>
                <p className="font-body text-[11px] text-primary-fixed leading-tight">
                  Tepat waktu membangun generasi emas.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined notranslate text-primary-fixed text-[20px]">
              chevron_right
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-20 flex flex-col gap-4">
        {/* NEW Combined Main Card: Kelas Berlangsung */}
        {/* NEW Combined Main Card: Kelas Berlangsung */}
        <LiveSessionCard 
          user={user} 
          currentTime={currentTime} 
          onShowToast={onShowToast} 
          onNavigateToTab={onNavigateToTab} 
        />

        {/* Agenda & Tugas Guru */}
        <div className="bg-white rounded-[24px] shadow-sm shadow-slate-200/50 border border-slate-100 p-5 flex justify-between items-center mb-2">
          <div className="flex items-center gap-2 text-slate-800">
            <span className="material-symbols-outlined notranslate text-primary">task_alt</span>
            <span className="font-headline font-bold text-sm">Agenda & Tugas Guru</span>
          </div>
          <span className="text-primary text-[11px] font-bold cursor-pointer hover:underline">Lihat Semua</span>
        </div>
        {/* Quick Actions (Adaptive Grid based on role) */}
        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 mt-1">
          <h3 className="font-headline font-bold text-slate-800 text-sm mb-3">Menu Pintasan Guru</h3>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateToTab('absensi')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-[64px]"
            >
              <div className="w-12 h-12 bg-sky-50 text-[#005fa0] rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform border border-sky-100 shadow-xs">
                <span className="material-symbols-outlined notranslate">assignment_ind</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">Perangkat<br/>Kelas</span>
            </button>

            {/* HANYA MUNCUL JIKA USER ADALAH WALI KELAS */}
            {(user.is_wali_kelas || user.role === 'wali_kelas') && (
              <button
                onClick={() => onNavigateToTab('wali-kelas')}
                className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-[64px]"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform border border-indigo-100 shadow-xs relative">
                  <span className="material-symbols-outlined notranslate">supervisor_account</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                </div>
                <span className="text-[10px] font-bold text-indigo-900 text-center leading-tight">Wali Kelas<br/>{user.wali_kelas?.nama || ''}</span>
              </button>
            )}

            {/* HANYA MUNCUL JIKA GURU SEDANG PIKET HARI INI */}
            {(user.is_guru_piket || user.role === 'guru_piket' || user.role === 'operator') && (
              <button
                onClick={() => onNavigateToTab('guru-piket')}
                className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-[64px]"
              >
                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform border border-amber-100 shadow-xs relative">
                  <span className="material-symbols-outlined notranslate">security</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white"></span>
                </div>
                <span className="text-[10px] font-bold text-amber-900 text-center leading-tight">Guru<br/>Piket</span>
              </button>
            )}

            <button
              onClick={() => onNavigateToTab('jadwal')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer flex-1 min-w-[64px]"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform border border-blue-100 shadow-xs">
                <span className="material-symbols-outlined notranslate">calendar_month</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700 text-center leading-tight">Jadwal<br/>Mengajar</span>
            </button>
          </div>
        </div>

        {/* Feature: Portal Wali Kelas Banner Card (HANYA DITAMPILKAN JIKA GURU ADALAH WALI KELAS) */}
        {(user.is_wali_kelas || user.role === 'wali_kelas') && (
          <div
            onClick={() => onNavigateToTab('wali-kelas')}
            className="bg-gradient-to-r from-indigo-900 to-[#003d73] text-white rounded-[24px] p-4 shadow-sm border border-indigo-800/40 cursor-pointer hover:shadow-md transition active:scale-98"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined notranslate text-white text-[22px]">
                    supervisor_account
                  </span>
                </div>
                <div>
                  <span className="bg-emerald-400/30 text-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Wali Kelas {user.wali_kelas?.nama || ''}
                  </span>
                  <h4 className="font-headline font-bold text-sm text-white mt-0.5">
                    Dashboard Khusus Wali Kelas
                  </h4>
                </div>
              </div>
              <span className="material-symbols-outlined notranslate text-indigo-200 text-lg">
                arrow_forward
              </span>
            </div>
            <p className="text-indigo-100 text-xs mt-2 leading-relaxed">
              Pantau kehadiran kelas perwalian {user.wali_kelas?.nama || ''}, kelola sekretaris &amp; ketua kelas, serta berikan mandat darurat absensi jika sekretaris tidak hadir.
            </p>
          </div>
        )}

        {/* Feature: Portal Guru Piket Banner Card (HANYA DITAMPILKAN JIKA GURU SEDANG PIKET HARI INI) */}
        {(user.is_guru_piket || user.role === 'guru_piket' || user.role === 'operator') && (
          <div
            onClick={() => onNavigateToTab('guru-piket')}
            className="bg-gradient-to-r from-amber-800 to-amber-950 text-white rounded-[24px] p-4 shadow-sm border border-amber-700/40 cursor-pointer hover:shadow-md transition active:scale-98"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined notranslate text-amber-300 text-[22px]">
                    door_sliding
                  </span>
                </div>
                <div>
                  <span className="bg-amber-400/30 text-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Piket Ketertiban
                  </span>
                  <h4 className="font-headline font-bold text-sm text-white mt-0.5">
                    Portal Live Guru Piket
                  </h4>
                </div>
              </div>
              <span className="material-symbols-outlined notranslate text-amber-200 text-lg">
                arrow_forward
              </span>
            </div>
            <p className="text-amber-100 text-xs mt-2 leading-relaxed">
              Catat siswa terlambat di gerbang secara real-time dan pantau radar siswa bolos mapel dari seluruh 54 kelas serentak.
            </p>
          </div>
        )}
        
      </div>
    </div>
  );
};


export const HomeScreen: React.FC<HomeScreenProps> = ( {
  user,
  classSummary,
  students,
    oldStudents = [],
    teacherAlert,
  onSendTeacherCall,
  onSubmitMorningDraft,
  onNavigateToTab,
  onShowToast,
}) => {
  if (user.role === 'guru' || user.role === 'wali_kelas' || user.role === 'guru_piket') {
    return <HomeScreenGuru user={user} onNavigateToTab={onNavigateToTab} onShowToast={onShowToast} classSummary={classSummary} students={students} teacherAlert={teacherAlert} onSendTeacherCall={onSendTeacherCall} onSubmitMorningDraft={onSubmitMorningDraft} />;
  }


  const [showAbsenModal, setShowAbsenModal] = useState(false);
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [showBanner, setShowBanner] = useState(teacherAlert.isActive);
  const [showPanggilGuruModal, setShowPanggilGuruModal] = useState(false);
  const [localStudents, setLocalStudents] = useState<StudentAttendance[]>(students);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [dynamicSummary, setDynamicSummary] = useState(classSummary);

  useEffect(() => {
    async function fetchSummary() {
      const kelasId = user.kelas_id || (user as any).kelas?.id || 'e88128be-8fc3-4973-8d69-00ef17571626';
      const dateObj = currentTime || new Date();
      const todayStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      // 1. Get total students in class
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('kelas_id', kelasId);
      const totalSiswa = totalCount || 37;

      // 2. Check absen_harian for today
      const { data: harianData } = await supabase
        .from('absen_harian')
        .select('status')
        .eq('kelas_id', kelasId)
        .eq('tanggal', todayStr);

      let h = 0, s = 0, i = 0, a = 0;

      if (harianData && harianData.length > 0) {
        harianData.forEach(r => {
          if (r.status === 'Hadir' || r.status === 'Terlambat') h++;
          else if (r.status === 'Sakit') s++;
          else if (r.status === 'Izin') i++;
          else if (r.status === 'Alfa' || r.status === 'Bolos') a++;
        });
      } else {
        // Fallback: check absen_mapel for today
        const { data: classJadwal } = await supabase
          .from('jadwal')
          .select('id')
          .eq('kelas_id', kelasId);
        
        const jadwalIds = (classJadwal || []).map(j => j.id);

        if (jadwalIds.length > 0) {
          const { data: mapelData } = await supabase
            .from('absen_mapel')
            .select('status, siswa_id')
            .in('jadwal_id', jadwalIds)
            .eq('tanggal', todayStr);

          if (mapelData && mapelData.length > 0) {
            const studentStatusMap: Record<string, string> = {};
            mapelData.forEach((r: any) => {
              studentStatusMap[r.siswa_id] = r.status;
            });
            Object.values(studentStatusMap).forEach((status: string) => {
              if (status === 'Hadir' || status === 'Terlambat') h++;
              else if (status === 'Sakit') s++;
              else if (status === 'Izin') i++;
              else if (status === 'Alfa' || status === 'Bolos') a++;
            });
          }
        }
      }

      setDynamicSummary({
        className: (user as any).kelas?.nama || 'XII TKJ 1',
        totalStudents: totalSiswa,
        present: h,
        sick: s,
        permitted: i,
        unexcused: a,
        validationStatus: harianData && harianData.length > 0 ? 'tervalidasi' : 'menunggu_acc'
      });
    }

    fetchSummary();

    // Supabase Realtime subscription
    const channel = supabase
      .channel('realtime_absen_home_' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absen_harian' }, () => {
        fetchSummary();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absen_mapel' }, () => {
        fetchSummary();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.kelas_id, currentTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');


  // Form state for leave submission
  const [izinName, setIzinName] = useState('Kevin Pratama');
  const [izinType, setIzinType] = useState<'sakit' | 'izin'>('sakit');
  const [izinReason, setIzinReason] = useState('Demam dan flu (disertai surat dokter)');

  const handleTriggerTeacherCall = () => {
    onSendTeacherCall();
    onShowToast(
      'Panggilan Guru Dikirim! 🔔',
      'Sinyal telah dikirim ke ponsel Pak Budi Santoso & Display Ruang Guru.',
      'warning'
    );
  };

  const handleMarkAllPresent = () => {
    setLocalStudents((prev) =>
      prev.map((s) => ({
        ...s,
        morningStatus: 'hadir',
      }))
    );
    onShowToast('Semua Ditandai Hadir', 'Status draft diperbarui ke 34 siswa hadir.', 'info');
  };

  const handleSubmitDraft = async () => {
    onSubmitMorningDraft(localStudents);
    setShowAbsenModal(false);
    
    try {
      const kelasId = user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626';
      const dateObj = currentTime || new Date();
      const todayStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

      const { data: dbStudents } = await supabase
        .from('profiles')
        .select('id, nama')
        .eq('kelas_id', kelasId);

      if (dbStudents && dbStudents.length > 0) {
        const insertData = dbStudents.map((s, idx) => {
          const matchedLocal = localStudents.find(ls => ls.name.toLowerCase() === s.nama.toLowerCase()) || localStudents[idx % localStudents.length];
          const statusMap: Record<string, string> = {
            hadir: 'Hadir',
            sakit: 'Sakit',
            izin: 'Izin',
            alfa: 'Alfa'
          };
          return {
            tanggal: todayStr,
            siswa_id: s.id,
            kelas_id: kelasId,
            status: statusMap[matchedLocal?.morningStatus || 'hadir'] || 'Hadir',
            status_validasi: 'draft',
            diinput_oleh: user.id
          };
        });

        await supabase.from('absen_harian').upsert(insertData, { onConflict: 'tanggal,siswa_id' });
      }
    } catch (err) {
      console.error('Error saving absen_harian:', err);
    }

    onShowToast(
      'Draft Presensi Terkirim!',
      'Telah masuk ke database dan antrean validasi guru.',
      'success'
    );
  };

  const handleSaveIzin = (e: React.FormEvent) => {
    e.preventDefault();
    setShowIzinModal(false);
    onShowToast(
      'Pengajuan Disimpan',
      `Surat ${izinType.toUpperCase()} atas nama ${izinName} berhasil diunggah ke arsip kelas.`,
      'success'
    );
  };

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto pb-24 font-body">
      {/* DANA Style Top Surface Background Extension */}
      <div className="bg-primary pt-3 pb-10 px-4 sm:px-6 relative overflow-hidden rounded-b-[28px] shadow-[0_12px_32px_rgba(0,95,160,0.18)]">
        {/* Fluid Curved Accent Elements */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        <div className="absolute -left-16 bottom-0 w-40 h-40 rounded-full bg-secondary-fixed/15 blur-lg pointer-events-none"></div>

        {/* Student Welcome & Role Bar */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] text-primary-fixed uppercase tracking-wider font-bold">
              Selamat Pagi 👋
              </span>
            <h1 className="font-headline font-bold text-xl text-white tracking-tight">
              {user.name}
            </h1>
            
          </div>

          <button
            onClick={() =>
              onShowToast(
                'Notifikasi SMKN 1',
                'Jam Ke-2 telah dimulai di Lab RPL 2. Presensi dibuka.',
                'info'
              )
            }
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all relative"
            type="button"
          >
            <span className="material-symbols-outlined notranslate text-[22px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-primary"></span>
          </button>
        </div>

        {/* Main Card Deck: DANA Balance Style Digital Attendance Wallet */}
        <div className="relative z-10 bg-gradient-to-br from-primary-container to-primary rounded-2xl p-4 text-white shadow-xl overflow-hidden border border-white/15">
          {/* Ambient Curve Vector on Card */}
          <svg
            className="absolute right-0 bottom-0 opacity-20 pointer-events-none w-44 h-44"
            fill="none"
            viewBox="0 0 200 200"
          >
            <circle
              cx="160"
              cy="160"
              r="120"
              stroke="white"
              strokeDasharray="12 12"
              strokeWidth="28"
            ></circle>
            <path
              d="M40 180 C 80 120, 140 140, 200 80"
              fill="none"
              stroke="white"
              strokeWidth="18"
            ></path>
          </svg>

          <div className="flex items-start justify-between relative z-10 mb-3">
            <div>
              <span className="font-label-sm text-[11px] text-primary-fixed flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined notranslate text-[16px]">verified</span> STATUS
                PRESENSI HARI INI
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-headline font-bold text-2xl tracking-tight">{timeString} WIT</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-500/25 text-slate-200 font-label-sm text-[11px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse"></span> MENUNGGU ABSENSI
                  </span>
                </div>
            </div>

            <div className="text-right">
              <span className="font-label-sm text-[11px] text-primary-fixed font-semibold">
                Bulan {currentTime.toLocaleDateString('id-ID', { month: 'long' })}
              </span>
              <div className="font-headline font-bold text-xl text-white">
                {user.attendanceRate}%
              </div>
            </div>
          </div>

          {/* Streak Api Kehadiran Sub-Pill - Hanya muncul ketika siswa hadir >= 3 hari berturut-turut */}
          {user.streakDays >= 3 && (
            <div
              onClick={() =>
                onShowToast(
                  'Lencana Disiplin Sorong 🔥',
                  `Hebat! Anda telah hadir tepat waktu ${user.streakDays} hari berturut-turut tanpa terlambat.`,
                  'success'
                )
              }
              className="relative z-10 bg-white/15 hover:bg-white/20 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-md animate-pulse">
                  <span
                    className="material-symbols-outlined notranslate text-amber-950 text-[20px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    local_fire_department
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-label-sm text-xs text-white font-bold">
                      {user.streakDays} Hari Berturut-turut!
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 font-label-sm text-[10px] font-bold">
                      STREAK 🔥
                    </span>
                  </div>
                  <p className="font-body text-[11px] text-primary-fixed leading-tight">
                    Pertahankan untuk lencana Siswa Disiplin Sorong
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined notranslate text-primary-fixed text-[20px]">
                chevron_right
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Body Container */}
      <div className="px-4 flex flex-col gap-4 -mt-5 relative z-20">
        {/* Quick Action Grid (4-Column DANA Fintech Icon Matrix) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_8px_24px_rgba(11,99,168,0.08)] border border-slate-100">
          <div className="grid grid-cols-4 gap-2">
            {/* Action 1: Sekretaris Input Absen Pagi */}
            <button
              onClick={() => setShowAbsenModal(true)}
              className="flex flex-col items-center group active:scale-95 transition-transform text-center"
              type="button"
            >
              <div className="relative w-12 h-12 p-3 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-white transition-colors shadow-sm">
                <span className="material-symbols-outlined notranslate text-[24px]">edit_calendar</span>
                <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-error text-white font-label-sm text-[9px] font-bold animate-bounce shadow">
                  Draft
                </span>
              </div>
              <span className="font-label-sm text-xs text-on-surface font-semibold mt-1.5 leading-tight line-clamp-2">
                Absen
              </span>
            </button>

            {/* Action 2: Panggil Guru (Integrasi WhatsApp) */}
            <button
              onClick={() => {
                setShowPanggilGuruModal(true);
              }}
              className="flex flex-col items-center group active:scale-95 transition-transform text-center"
              type="button"
            >
              <div className="w-12 h-12 p-3 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:bg-[#075e54] group-hover:text-white transition-colors shadow-sm">
                <span className="material-symbols-outlined notranslate text-[24px]">phone_in_talk</span>
              </div>
              <span className="font-label-sm text-xs text-on-surface font-semibold mt-1.5 leading-tight line-clamp-2">
                Panggil Guru
              </span>
            </button>

            {/* Action 3: Rekap Bulanan */}
            <button
              onClick={() => setShowRekapModal(true)}
              className="flex flex-col items-center group active:scale-95 transition-transform text-center"
              type="button"
            >
              <div className="w-12 h-12 p-3 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-colors shadow-sm">
                <span className="material-symbols-outlined notranslate text-[24px]">query_stats</span>
              </div>
              <span className="font-label-sm text-xs text-on-surface font-semibold mt-1.5 leading-tight line-clamp-2">
                Rekap Bulanan
              </span>
            </button>

            {/* Action 4: Pengajuan Izin */}
            <button
              onClick={() => setShowIzinModal(true)}
              className="flex flex-col items-center group active:scale-95 transition-transform text-center"
              type="button"
            >
              <div className="w-12 h-12 p-3 rounded-2xl bg-surface-variant flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                <span className="material-symbols-outlined notranslate text-[24px]">clinical_notes</span>
              </div>
              <span className="font-label-sm text-xs text-on-surface font-semibold mt-1.5 leading-tight line-clamp-2">
                Pengajuan Izin
              </span>
            </button>
          </div>
        </div>

        {/* Alert / Banner Darurat Interaktif "Panggil Guru" */}
        {showBanner && (
          <div className="bg-gradient-to-r from-tertiary-container to-amber-600 rounded-2xl p-4 text-white shadow-lg flex flex-col gap-2.5 relative overflow-hidden animate-in fade-in duration-200">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-sm pointer-events-none"></div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined notranslate text-[20px] animate-bounce">
                    notifications_active
                  </span>
                </div>
                <div>
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-amber-100 font-bold">
                    Jam ke-2 • 08.45 WIT
                  </span>
                  <h2 className="font-headline font-bold text-base leading-tight">
                    Guru Belum Tiba di Kelas?
                  </h2>
                </div>
              </div>
            </div>

            <p className="font-body text-xs text-amber-50 leading-relaxed">
              Pak Budi Santoso, S.Kom. (Pemrograman Web) belum memindai check-in di Lab RPL 2.
              Sekretaris dapat mengirim sinyal kesiapan kelas.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowPanggilGuruModal(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined notranslate text-[18px]">phone_in_talk</span>
                Panggil Guru via WhatsApp 📲
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors"
                type="button"
                title="Tutup Banner"
              >
                <span className="material-symbols-outlined notranslate text-[18px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* Sekretaris Quick Review Deck (Lapis 1 Presensi Kelas) */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_6px_20px_rgba(11,99,168,0.06)] border border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              <h2 className="font-headline font-bold text-base text-on-surface">
                Absensi Harian {user?.kelas?.nama || "XII TKJ 1"}
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px] font-bold">
              {dynamicSummary.totalStudents} Total Siswa
            </span>
          </div>

          {/* Quick Tally Counter Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-surface-container-low flex flex-col items-center">
              <span className="font-headline font-bold text-xl text-emerald-600">
                {dynamicSummary.present}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">
                Hadir
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 flex flex-col items-center">
              <span className="font-headline font-bold text-xl text-amber-600">
                {dynamicSummary.sick}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">
                Sakit
              </span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container flex flex-col items-center">
              <span className="font-headline font-bold text-xl text-primary">
                {dynamicSummary.permitted}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">
                Izin
              </span>
            </div>
            <div className="p-2 rounded-xl bg-error-container/40 flex flex-col items-center">
              <span className="font-headline font-bold text-xl text-error">
                {dynamicSummary.unexcused}
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">
                Alfa
              </span>
            </div>
          </div>

        </div>

        {/* Section: Jadwal Belajar Hari Ini */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">
                Jadwal Belajar Hari Ini
              </h2>
              <span className="font-body text-xs text-slate-500">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('jadwal')}
              className="font-label-sm text-xs text-primary font-bold flex items-center gap-0.5 hover:underline"
            >
              Lihat Full{' '}
              <span className="material-symbols-outlined notranslate text-[16px]">arrow_forward</span>
            </button>
          </div>

          <LiveSessionCard 
            user={user} 
            currentTime={currentTime} 
            onShowToast={onShowToast} 
            onNavigateToTab={onNavigateToTab} 
          />
        </div>

        {/* Quick Classroom Roster Preview Card */}
        {/* Catatan Sekretaris Hari Ini */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline font-bold text-base text-on-surface">
                Catatan Sekretaris Hari Ini
              </h2>
              <span className="font-label-sm text-xs text-tertiary font-bold">
                {oldStudents.filter(s => s.status !== 'H').length} Catatan
              </span>
            </div>
  
            <div className="space-y-2">
              {oldStudents.filter(s => s.status !== 'H').length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-sm">Tidak ada catatan ketidakhadiran.</span>
                </div>
              ) : (
                oldStudents.filter(s => s.status !== 'H').map(s => {
                  let bgColor = 'bg-slate-50';
                  let borderColor = 'border-slate-100';
                  let iconBg = 'bg-slate-200';
                  let iconText = 'text-slate-900';
                  let statusBg = 'bg-slate-200';
                  let statusText = 'text-slate-800';
                  let label = s.status;
                  let noteColor = 'text-slate-800';

                  if (s.status === 'S') {
                    bgColor = 'bg-amber-50/70';
                    borderColor = 'border-amber-100';
                    iconBg = 'bg-amber-200';
                    iconText = 'text-amber-900';
                    statusBg = 'bg-amber-100';
                    statusText = 'text-amber-800';
                    label = 'SAKIT';
                    noteColor = 'text-amber-800';
                  } else if (s.status === 'I') {
                    bgColor = 'bg-sky-50/70';
                    borderColor = 'border-sky-100';
                    iconBg = 'bg-sky-200';
                    iconText = 'text-sky-900';
                    statusBg = 'bg-sky-100';
                    statusText = 'text-sky-800';
                    label = 'IZIN';
                    noteColor = 'text-sky-800';
                  } else if (s.status === 'A') {
                    bgColor = 'bg-red-50/70';
                    borderColor = 'border-red-100';
                    iconBg = 'bg-red-200';
                    iconText = 'text-red-900';
                    statusBg = 'bg-red-100';
                    statusText = 'text-red-800';
                    label = 'ALFA';
                    noteColor = 'text-red-800';
                  } else if (s.status === 'B') {
                    bgColor = 'bg-orange-50/70';
                    borderColor = 'border-orange-100';
                    iconBg = 'bg-orange-200';
                    iconText = 'text-orange-900';
                    statusBg = 'bg-orange-100';
                    statusText = 'text-orange-800';
                    label = 'BOLOS';
                    noteColor = 'text-orange-800';
                  }

                  const initials = s.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('');

                  return (
                    <div key={s.id} className={`p-2.5 rounded-xl ${bgColor} border ${borderColor} flex items-center justify-between`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full ${iconBg} ${iconText} font-bold flex items-center justify-center text-xs`}>
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-label-sm text-xs text-slate-900 font-bold block truncate max-w-[160px]">
                            {s.name} ({s.studentNo})
                          </span>
                          <span className={`font-body text-[11px] ${noteColor} truncate max-w-[160px]`}>
                            {s.note || 'Tidak ada keterangan'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full ${statusBg} ${statusText} text-[10px] font-bold`}>
                        {label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        
        {/* Slide-Up Modal: Input Absen Pagi (2 Lapis Sekretaris) */}
      {showAbsenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2"></div>
            <div className="flex items-start justify-between">
              <div>
                <span className="font-label-sm text-xs text-primary font-bold uppercase tracking-wider">
                  REKAP KELAS HARI INI
                </span>
                <h2 className="font-headline font-bold text-lg text-slate-900">
                  Informasi Absensi Kelas
                </h2>
                <p className="font-body text-xs text-slate-500">
                  XII TKJ 1 • 34 Siswa Terdaftar
                </p>
              </div>
              <button
                onClick={() => setShowAbsenModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                type="button"
              >
                <span className="material-symbols-outlined notranslate text-[20px]">close</span>
              </button>
            </div>

            {/* Student Checklist Excerpt */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Siswa Tidak Hadir Hari Ini
              </span>

              {localStudents
                .filter((s) => s.morningStatus !== 'hadir')
                .map((std) => (
                  <div
                    key={std.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-slate-900">
                        {std.studentNo} - {std.name}
                      </span>
                      <span className="text-[11px] text-slate-500">{std.note || '-'}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                        std.morningStatus === 'sakit'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {std.morningStatus}
                    </span>
                  </div>
                ))}
            </div>


          </div>
        </div>
      )}

      {/* Modal: Pengajuan Izin / Sakit */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-200">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2"></div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Formulir Pengajuan Sakit / Izin
                </h3>
                <p className="text-xs text-slate-500">
                  Siswa XII TKJ 1 • Unggah surat & verifikasi wali kelas
                </p>
              </div>
              <button
                onClick={() => setShowIzinModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined notranslate text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveIzin} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Siswa
                </label>
                <input
                  type="text"
                  value={izinName}
                  onChange={(e) => setIzinName(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kategori
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIzinType('sakit')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      izinType === 'sakit'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Sakit (Dengan Surat)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIzinType('izin')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      izinType === 'izin'
                        ? 'bg-primary text-white border-primary'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Izin / Dispensasi
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Keterangan &amp; Alasan
                </label>
                <textarea
                  rows={2}
                  value={izinReason}
                  onChange={(e) => setIzinReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Upload photo attachment simulation */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50">
                <span className="material-symbols-outlined notranslate text-primary text-[28px]">
                  photo_camera
                </span>
                <span className="text-xs font-bold text-slate-700 mt-1">
                  Foto Surat Dokter / Surat Tugas
                </span>
                <span className="text-[11px] text-slate-400">
                  Format JPG/PNG (Otomatis tervalidasi AI Kesiswaan)
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs shadow hover:bg-primary-container"
              >
                Kirim Pengajuan Izin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rekap Bulanan */}
      {showRekapModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0">
          <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-2"></div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Rekap Kehadiran Bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </h3>
                <p className="text-xs text-slate-500">
                  Kelas XII TKJ 1 • Semester Genap T.A 2024/2025
                </p>
              </div>
              <button
                onClick={() => setShowRekapModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined notranslate text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-2xl font-bold text-emerald-700">{user.attendanceRate || 0}%</span>
                <span className="block text-xs text-slate-600 mt-0.5 font-semibold">
                  Tingkat Kehadiran
                </span>
              </div>
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                <span className="text-2xl font-bold text-sky-700">0 Hari</span>
                <span className="block text-xs text-slate-600 mt-0.5 font-semibold">
                  Hari Efektif KBM
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Riwayat Ketidakhadiran Kelas
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-500 italic">
                  Belum ada riwayat kehadiran yang diekspor.
                </div>
            </div>

            <button
              onClick={() => {
                setShowRekapModal(false);
                onShowToast(
                  'Rekap Terunduh',
                  `File Rekap_${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(' ', '_')}_XII_TKJ_1.pdf berhasil diunduh.`,
                  'info'
                );
              }}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs shadow hover:bg-primary-container flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined notranslate text-[18px]">download</span>
              Unduh Rekap Bulanan PDF
            </button>
          </div>
        </div>
      )}

      {/* Modal Panggil Guru Terintegrasi WhatsApp */}
      <PanggilGuruModal
        isOpen={showPanggilGuruModal}
        onClose={() => setShowPanggilGuruModal(false)}
        initialTeacherName="Budi Santoso, S.Kom"
        initialClassName={(user as any).kelas?.nama || 'XII TKJ 1'}
        initialRoomName="Lab Komputer 2"
        studentName={user.name || 'Cindy Laura'}
        onSuccess={(msg) => {
          onSendTeacherCall();
          onShowToast('Panggilan Guru Terkirim! 📲', msg, 'success');
        }}
      />
    </div>
  );
};

export { HomeScreen as HomeScreenSamakan } from './HomeScreenSamakan';






import { AbsensiModal } from './JadwalScreen';

export const LiveSessionCard: React.FC<{ user: any, currentTime: Date, onShowToast: any, onNavigateToTab: any }> = ({ user, currentTime, onShowToast, onNavigateToTab }) => {
  const [liveSession, setLiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0, alfa: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveSession() {
      try {
        const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        let currentDayIndex = currentTime.getDay();
        const hariIni = hariNames[currentDayIndex];
        const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();

        // fetch today's schedules for guru OR siswa
        let query = supabase
          .from('jadwal')
          .select('id, jam_mulai, jam_selesai, mapel:mapel_id(nama), kelas:kelas_id(id, nama), guru_id')
          .eq('hari', hariIni);
          
        if (user.role === 'guru') {
          query = query.eq('guru_id', user.id);
        } else {
          // fallback to XII TKJ 1 if mocked
          query = query.eq('kelas_id', user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626');
        }

        const { data: schedules } = await query;

        if (!schedules || schedules.length === 0) {
          if (isMounted) { setLiveSession(null); setLoading(false); }
          return;
        }

        // Group consecutive
        const grouped: any[] = [];
        schedules.forEach((item: any) => {
          const lastGroup = grouped[grouped.length - 1];
          const [sh, sm] = (item.jam_mulai || '00:00').split(':').map(Number);
          const [eh, em] = (item.jam_selesai || '00:00').split(':').map(Number);
          const itemDuration = (eh * 60 + em) - (sh * 60 + sm);

          if (
            lastGroup &&
            lastGroup.kelas?.id === item.kelas?.id &&
            lastGroup.mapel?.nama === item.mapel?.nama
          ) {
            lastGroup.jam_selesai = item.jam_selesai;
            lastGroup.actualDuration = (lastGroup.actualDuration || 0) + itemDuration;
          } else {
            grouped.push({ ...item, actualDuration: itemDuration });
          }
        });

        // Find live
        let active = null;
        for (const g of grouped) {
          const [sh, sm] = g.jam_mulai.split(':').map(Number);
          const startMin = sh * 60 + sm;
          const [eh, em] = g.jam_selesai.split(':').map(Number);
          const endMin = eh * 60 + em;
          if (nowMin >= startMin && nowMin < endMin) {
            active = { ...g, startMin, endMin };
            break;
          }
        }

        if (active) {
          if (isMounted) setLiveSession(active);
          
          // fetch stats
          const { data: absenData } = await supabase
            .from('absen_mapel')
            .select('status')
            .eq('jadwal_id', active.id)
            .eq('tanggal', currentTime.toISOString().split('T')[0]);
            
          if (absenData && isMounted) {
            let h = 0, s = 0, i = 0, a = 0;
            absenData.forEach(r => {
              if (r.status === 'Hadir') h++;
              else if (r.status === 'Sakit') s++;
              else if (r.status === 'Izin') i++;
              else if (r.status === 'Alfa') a++;
            });
            setStats({ hadir: h, sakit: s, izin: i, alfa: a });
          } else if (isMounted) {
            setStats({ hadir: 0, sakit: 0, izin: 0, alfa: 0 });
          }
        } else {
          if (isMounted) setLiveSession(null);
        }
      } catch (err) {
        console.error(err);
      }
      if (isMounted) setLoading(false);
    }
    fetchLiveSession();
    return () => { isMounted = false; };
  }, [user.id, currentTime]);

  if (loading) {
    return <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 text-center"><div className="animate-pulse flex flex-col items-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-2"></div><div className="text-xs text-slate-400">Memuat Sesi...</div></div></div>;
  }

  if (!liveSession) {
    return (
      <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 text-center flex flex-col items-center">
        <span className="material-symbols-outlined notranslate text-[40px] text-slate-300 mb-2">coffee</span>
        <h3 className="text-slate-700 font-bold text-sm">Tidak Sedang Mengajar</h3>
        <p className="text-slate-500 text-[11px]">Waktu untuk istirahat atau mempersiapkan materi.</p>
        <button onClick={() => onNavigateToTab('jadwal')} className="mt-4 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50">Lihat Jadwal Lengkap</button>
      </div>
    );
  }

  const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
  const elapsed = Math.max(0, nowMin - liveSession.startMin);
  const total = liveSession.endMin - liveSession.startMin;
  const progressPercent = Math.min(100, Math.round((elapsed / total) * 100));

  const mapelNama = liveSession.mapel?.nama || 'Mata Pelajaran';
  const kelasNama = liveSession.kelas?.nama || 'Kelas';

  return (
    <div className="bg-white rounded-[24px] shadow-lg shadow-slate-200/50 overflow-hidden flex relative animate-in fade-in zoom-in-95">
      <div className="w-1.5 bg-emerald-500 absolute top-4 bottom-4 left-0 rounded-r-lg"></div>
      
      <div className="p-5 flex-1 flex flex-col pl-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-emerald-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Sesi Sedang Berlangsung</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="bg-sky-100 text-primary-dark font-bold text-[10px] px-2 py-0.5 rounded-md">{kelasNama}</span>
          <span className="text-slate-500 text-[11px] font-medium">{liveSession.jam_mulai.substring(0,5)} - {liveSession.jam_selesai.substring(0,5)} WIT ({liveSession.actualDuration || total} Mnt)</span>
        </div>

        <h2 
          className="text-[20px] font-headline font-bold text-slate-800 leading-tight mb-4 cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          {mapelNama}
          <span className="material-symbols-outlined notranslate text-primary text-[18px] opacity-70">open_in_new</span>
        </h2>

        <div className="flex flex-col gap-1.5 mb-5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-700 font-bold">Progres Waktu Mengajar</span>
            <span className="text-primary font-bold">{elapsed} / {total} Menit ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: progressPercent + '%' }}></div>
          </div>
        </div>

        <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 mb-4 flex divide-x divide-slate-200">
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-emerald-500 font-bold text-lg leading-none mb-1">{stats.hadir}</span>
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Hadir</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-amber-500 font-bold text-lg leading-none mb-1">{stats.sakit}</span>
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Sakit</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-primary font-bold text-lg leading-none mb-1">{stats.izin}</span>
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Izin</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-slate-700 font-bold text-lg leading-none mb-1">{stats.alfa}</span>
            <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Alfa</span>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-[14px] shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
        >
          <span className="material-symbols-outlined notranslate text-[18px]">how_to_reg</span>
          {user.role === 'guru' ? 'Kelola Absen Kelas Ini' : 'Isi Presensi Kelas Sekarang'}
        </button>
      </div>

      <AbsensiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        jadwalItem={liveSession}
        guruId={liveSession.guru_id}
        onShowToast={onShowToast}
      />
    </div>
  );
};
