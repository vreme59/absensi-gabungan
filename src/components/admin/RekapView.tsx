import React, { useState } from 'react';
import { Student } from '../../types';
import { exportAttendanceRecapToExcel, exportWeeklyAttendanceRecapToExcel } from '../../utils/excelHelper';
import { INITIAL_STUDENTS, INITIAL_TEACHERS, STUDENT_DAILY_ATTENDANCE } from './mockData';
import { ExportKehadiranModal } from './ExportKehadiranModal';

interface UserSession {
  username: string;
  role: 'siswa' | 'guru' | 'admin' | 'superadmin';
  nama: string;
}

interface RekapViewProps {
  onBackToBeranda: () => void;
  onDownloadReport: () => void;
  userRole?: 'siswa' | 'guru' | 'admin' | 'superadmin';
  session?: UserSession | null;
  students?: Student[];
}

export const RekapView: React.FC<RekapViewProps> = ({
  onBackToBeranda,
  onDownloadReport,
  userRole = 'siswa',
  session,
  students = INITIAL_STUDENTS,
}) => {
  const isTeacherOrAdmin = userRole === 'guru' || userRole === 'admin' || userRole === 'superadmin';
  const [rekapTab, setRekapTab] = useState<'pribadi' | 'kelas'>(isTeacherOrAdmin ? 'kelas' : 'pribadi');
  const [selectedClass, setSelectedClass] = useState('XII TKJ 1');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('Minggu 2 (8 - 14 Okt)');
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2026');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const classList = ['XII TKJ 1', 'XII DKV 1', 'Semua Siswa'];
  const weekList = [
    'Minggu 1 (1 - 7 Okt)',
    'Minggu 2 (8 - 14 Okt)',
    'Minggu 3 (15 - 21 Okt)',
    'Minggu 4 (22 - 28 Okt)',
  ];
  const monthList = ['September 2026', 'Oktober 2026', 'November 2026', 'Desember 2026'];

  const studentName = session?.nama || 'Cindy Laura';
  const rawId = session?.username || '0068192041';
  const studentNis = rawId.startsWith('s') ? rawId.slice(1) : rawId;

  // Filter students by selectedClass dynamically (5 TKJ vs 5 DKV vs 10 Semua Siswa)
  const classStudents = selectedClass === 'Semua Siswa'
    ? students
    : students.filter((s) => (s.kelas || 'XII TKJ 1') === selectedClass);

  // Student specific history
  const historyItems = [
    { date: 'Selasa, 13 Okt 2026', subject: 'Pemodelan Perangkat Lunak (BA)', time: '07:18 WIT', status: 'Hadir' },
    { date: 'Senin, 12 Okt 2026', subject: 'Pendidikan Pancasila & PPKn', time: '11:32 WIT', status: 'Hadir' },
    { date: 'Sabtu, 10 Okt 2026', subject: 'Pelatihan LKS & Portofolio', time: '07:35 WIT', status: 'Hadir' },
    { date: 'Jumat, 09 Okt 2026', subject: 'Cloud Computing & Linux', time: '08:05 WIT', status: 'Hadir' },
    { date: 'Kamis, 08 Okt 2026', subject: 'Keamanan Jaringan & Cyber Security', time: '07:16 WIT', status: 'Hadir' },
    { date: 'Rabu, 07 Okt 2026', subject: 'Pemrograman Web & Bergerak', time: '07:14 WIT', status: 'Hadir' },
  ];

  // Class stats for teacher / admin - STRICTLY SYNCED WITH STUDENTS ROSTER
  const totalStudentsCount = classStudents.length;
  const hadirCount = classStudents.filter((s) => s.status === 'Hadir').length;
  const sakitCount = classStudents.filter((s) => s.status === 'Sakit').length;
  const izinCount = classStudents.filter((s) => s.status === 'Izin').length;
  const alfaCount = classStudents.filter((s) => s.status === 'Alfa').length;
  const classAttendancePct = totalStudentsCount > 0 
    ? ((hadirCount / totalStudentsCount) * 100).toFixed(1)
    : '100.0';

  const handleExportClassExcel = () => {
    exportWeeklyAttendanceRecapToExcel(classStudents, selectedClass, selectedWeek, selectedMonth);
  };

  // ─── GURU / ADMIN / SISWA MATRIKS VIEW: REKAP KELAS ───
  if (isTeacherOrAdmin || rekapTab === 'kelas') {
    return (
      <div className="flex flex-col w-full pb-28">
        {/* Curved Blue Header */}
        <div className="bg-gradient-to-b from-[#00609b] to-[#0761a2] pt-4 pb-14 px-4 rounded-b-[28px] shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-[#6ffbbe]">
                table_chart
              </span>
              <span className="text-[12px] uppercase font-bold tracking-wider">
                Rekap Presensi Rombel
              </span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>📅 {selectedMonth}</span>
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
              {isMonthDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-[#eceef0] py-1 z-30 animate-fadeIn text-[#191c1e]">
                  {monthList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m);
                        setIsMonthDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12px] flex items-center justify-between hover:bg-[#cfe4ff]/30 ${
                        selectedMonth === m ? 'font-bold text-[#00609b] bg-[#cfe4ff]/20' : ''
                      }`}
                    >
                      <span>{m}</span>
                      {selectedMonth === m && (
                        <span className="material-symbols-outlined text-[14px] text-[#00609b]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-bold">Rekap Kehadiran Mingguan</h2>
              <p className="text-[12px] text-[#cfe4ff]">
                {isTeacherOrAdmin
                  ? `Laporan presensi mengajar ${session?.nama || 'Guru Mapel'}`
                  : `Matriks Kehadiran Rombel ${selectedClass}`}
              </p>
            </div>

            {/* Class Dropdown Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[12px] font-bold active:scale-95 transition-all cursor-pointer ring-1 ring-white/30 shadow-xs"
                title="Pilih Kelas / Rombel"
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>{selectedClass}</span>
                <span
                  className="material-symbols-outlined text-[16px] transition-transform duration-200"
                  style={{ transform: isClassDropdownOpen ? 'rotate(180deg)' : 'none' }}
                >
                  expand_more
                </span>
              </button>

              {isClassDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-2xl border border-[#eceef0] py-1.5 z-30 animate-fadeIn text-[#191c1e]">
                  {classList.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedClass(c);
                        setIsClassDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12px] flex items-center justify-between hover:bg-[#cfe4ff]/30 transition-colors ${
                        selectedClass === c ? 'font-bold text-[#00609b] bg-[#cfe4ff]/20' : ''
                      }`}
                    >
                      <span>{c}</span>
                      {selectedClass === c && (
                        <span className="material-symbols-outlined text-[16px] text-[#00609b]">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tab Switcher (Khusus Tampilan Siswa) */}
          {!isTeacherOrAdmin && (
            <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-xl gap-1 mt-3">
              <button
                type="button"
                onClick={() => setRekapTab('pribadi')}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 text-white/80 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">person</span>
                <span>Presensi Saya</span>
              </button>
              <button
                type="button"
                onClick={() => setRekapTab('kelas')}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 bg-white text-[#00609b] shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">group</span>
                <span>Matriks Rombel (TKJ/DKV)</span>
              </button>
            </div>
          )}
        </div>

        {/* Floating Content Island */}
        <div className="px-4 -mt-9 flex flex-col gap-4 relative z-10">
          {/* Week Selection Chips Bar */}
          <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-[#eceef0] flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#707882]">
                Pilih Periode Minggu ({selectedMonth})
              </span>
              <span className="text-[10px] font-extrabold text-[#00609b] bg-[#cfe4ff]/50 px-2 py-0.5 rounded-full">
                {selectedWeek}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {weekList.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWeek(w)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedWeek === w
                      ? 'bg-[#00609b] text-white shadow-xs'
                      : 'bg-[#f2f4f6] text-[#404751] hover:bg-[#e6e8ea]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Class KPI Card */}
          <div className="bg-white rounded-3xl p-5 shadow-md border border-[#eceef0]/70 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#404751] font-bold">
                  Kehadiran {selectedClass} • {selectedWeek.split(' ')[0]}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-[32px] font-extrabold text-[#00609b] leading-tight">
                    {classAttendancePct}%
                  </p>
                  <span className="text-[12px] font-bold text-[#006947]">
                    ({hadirCount}/{totalStudentsCount} Siswa Hadir)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportClassExcel}
                  className="px-3 py-1.5 rounded-xl bg-[#00609b] hover:bg-[#0079c2] text-white text-[11px] font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  title="Unduh format spreadsheet mingguan"
                >
                  <span className="material-symbols-outlined text-[15px]">file_download</span>
                  <span>Mingguan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#00609b] text-[#00609b] hover:bg-[#cfe4ff]/30 text-[11px] font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                  title="Pusat Export Excel (Semua Periode: Bulanan, 3 Bulan, Semester, Guru)"
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  <span>Semua Periode</span>
                </button>
              </div>
            </div>

            {/* 4 Metric Pills - Strictly Synced */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#00855b]/10 p-2.5 rounded-2xl">
                <p className="text-[18px] font-bold text-[#006947]">{hadirCount}</p>
                <p className="text-[10px] text-[#404751] font-medium">Hadir</p>
              </div>
              <div className="bg-[#d1e4ff]/50 p-2.5 rounded-2xl">
                <p className="text-[18px] font-bold text-[#0761a2]">{sakitCount}</p>
                <p className="text-[10px] text-[#404751] font-medium">Sakit</p>
              </div>
              <div className="bg-[#fef3c7] p-2.5 rounded-2xl">
                <p className="text-[18px] font-bold text-[#b45309]">{izinCount}</p>
                <p className="text-[10px] text-[#404751] font-medium">Izin</p>
              </div>
              <div className="bg-[#ffdad6]/60 p-2.5 rounded-2xl">
                <p className="text-[18px] font-bold text-[#ba1a1a]">{alfaCount}</p>
                <p className="text-[10px] text-[#404751] font-medium">Alfa</p>
              </div>
            </div>
          </div>

          {/* Student Roster Table Card - Strictly Synced with Daily Matrix */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#eceef0] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#191c1e]">
                  Daftar Kehadiran Siswa ({selectedClass})
                </h3>
                <p className="text-[10px] text-[#707882]">Matriks 6 Hari Sekolah (Sen - Sab)</p>
              </div>
              <span className="text-[11px] text-[#00609b] font-bold bg-[#cfe4ff]/60 px-2.5 py-0.5 rounded-full">
                {totalStudentsCount} Siswa Terdaftar
              </span>
            </div>

            <div className="divide-y divide-[#f2f4f6]">
              {classStudents.map((s, idx) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-2 hover:bg-[#f7f9fb] px-1 rounded-lg transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#f2f4f6] text-[#404751] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#191c1e] truncate">{s.name}</p>
                      <p className="text-[10px] text-[#707882]">NISN: {s.nis}</p>
                    </div>
                  </div>

                  {/* 6 Days Mini Status Dots (Sen, Sel, Rab, Kam, Jum, Sab) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="hidden sm:flex items-center gap-1 text-[9px] font-bold text-center">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">H</span>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        s.status === 'Hadir' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'Sakit' ? 'bg-sky-100 text-sky-800' :
                        s.status === 'Izin' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.status === 'Hadir' ? 'H' : s.status === 'Sakit' ? 'S' : s.status === 'Izin' ? 'I' : 'A'}
                      </span>
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">H</span>
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">H</span>
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">H</span>
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">H</span>
                    </div>

                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        s.status === 'Hadir'
                          ? 'bg-[#00855b]/15 text-[#006947]'
                          : s.status === 'Sakit'
                          ? 'bg-blue-100 text-blue-700'
                          : s.status === 'Izin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download PDF / Rekap Button */}
          <button
            type="button"
            onClick={onDownloadReport}
            className="w-full py-3 bg-white rounded-2xl border border-[#00609b]/30 text-[#00609b] font-bold text-[13px] shadow-xs flex items-center justify-center gap-2 hover:bg-[#cfe4ff]/20 active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            <span>Cetak Rekap Presensi Rombel (PDF)</span>
          </button>

          {/* Export Kehadiran Modal Wizard */}
          <ExportKehadiranModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            students={students}
            teachers={INITIAL_TEACHERS}
          />
        </div>
      </div>
    );
  }

  // ─── SISWA VIEW: REKAP KEHADIRAN PRIBADI ───
  return (
    <div className="flex flex-col w-full pb-28">
      {/* Curved Blue Header */}
      <div className="bg-gradient-to-b from-[#00609b] to-[#0761a2] pt-4 pb-14 px-4 rounded-b-[28px] shadow-sm text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#6ffbbe]">
              analytics
            </span>
            <span className="text-[12px] uppercase font-bold tracking-wider">
              Rekapitulasi Kehadiran
            </span>
          </div>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            Semester Ganjil 2026/2027
          </span>
        </div>

        <div>
          <h2 className="text-[20px] font-bold">Laporan Disiplin {studentName}</h2>
          <p className="text-[12px] text-[#cfe4ff]">NISN: {studentNis} • Kelas XII TKJ 1</p>
        </div>

        {/* Tab Switcher (Khusus Tampilan Siswa) */}
        {!isTeacherOrAdmin && (
          <div className="flex bg-black/20 backdrop-blur-md p-1 rounded-xl gap-1 mt-3">
            <button
              type="button"
              onClick={() => setRekapTab('pribadi')}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 bg-white text-[#00609b] shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">person</span>
              <span>Presensi Saya</span>
            </button>
            <button
              type="button"
              onClick={() => setRekapTab('kelas')}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 text-white/80 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">group</span>
              <span>Matriks Rombel (TKJ/DKV)</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Metrics Island */}
      <div className="px-4 -mt-9 flex flex-col gap-4 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-md border border-[#eceef0]/70 flex flex-col gap-4">
          {/* Main Big Percentage Banner */}
          <div className="flex items-center justify-between pb-3 border-b border-[#eceef0]">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#404751] font-bold">
                Persentase Kehadiran Mandiri
              </p>
              <p className="text-[36px] font-extrabold text-[#00609b] leading-tight">
                98.5%
              </p>
              <p className="text-[11px] text-[#006947] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Target Kelulusan &gt; 90% Terpenuhi
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-[#cfe4ff]/50 flex items-center justify-center text-[#00609b]">
              <span
                className="material-symbols-outlined text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
          </div>

          {/* 4 Metric Pills */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#00855b]/10 p-2.5 rounded-2xl">
              <p className="text-[18px] font-bold text-[#006947]">68</p>
              <p className="text-[10px] text-[#404751] font-medium">Hadir (Hari)</p>
            </div>
            <div className="bg-[#d1e4ff]/50 p-2.5 rounded-2xl">
              <p className="text-[18px] font-bold text-[#0761a2]">1</p>
              <p className="text-[10px] text-[#404751] font-medium">Sakit</p>
            </div>
            <div className="bg-[#fef3c7] p-2.5 rounded-2xl">
              <p className="text-[18px] font-bold text-[#b45309]">1</p>
              <p className="text-[10px] text-[#404751] font-medium">Izin</p>
            </div>
            <div className="bg-[#ffdad6]/60 p-2.5 rounded-2xl">
              <p className="text-[18px] font-bold text-[#ba1a1a]">0</p>
              <p className="text-[10px] text-[#404751] font-medium">Alfa</p>
            </div>
          </div>
        </div>

        {/* ─── TABEL KEHADIRAN HARIAN DENGAN TANGGAL (POSISI DI ATAS RIWAYAT SESI) ─── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#eceef0] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#00609b]">calendar_month</span>
              <h3 className="text-[14px] font-bold text-[#191c1e]">Tabel Catatan Presensi Harian</h3>
            </div>
            <span className="text-[10px] font-extrabold text-[#006947] bg-[#00855b]/10 px-2 py-0.5 rounded-full">
              Bulan Berjalan
            </span>
          </div>

          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-[#f7f9fb] text-[#404751] border-b border-[#eceef0]">
                  <th className="py-2.5 px-3 font-bold rounded-l-xl">Tanggal</th>
                  <th className="py-2.5 px-2 font-bold">Hari / JP</th>
                  <th className="py-2.5 px-3 font-bold">Mata Pelajaran</th>
                  <th className="py-2.5 px-2 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold rounded-r-xl">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]/60">
                {STUDENT_DAILY_ATTENDANCE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f2f4f6]/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#191c1e] whitespace-nowrap">
                      {row.tanggal}
                    </td>
                    <td className="py-2.5 px-2 text-[#404751] whitespace-nowrap">
                      <span className="font-semibold text-[#191c1e]">{row.hari}</span>
                      <br />
                      <span className="text-[10px] text-[#707882]">{row.jp}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#00609b] line-clamp-1">{row.mapel}</span>
                      <span className="text-[10px] text-[#707882]">{row.guru}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                          row.status === 'Hadir'
                            ? 'bg-[#00855b]/15 text-[#006947]'
                            : row.status === 'Sakit'
                            ? 'bg-blue-100 text-blue-700'
                            : row.status === 'Izin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#404751] text-[10px]">
                      {row.keterangan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── RIWAYAT KEHADIRAN SESI (POSISI DI BAWAH TABEL) ─── */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#eceef0] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#191c1e]">Riwayat Kehadiran Sesi</h3>
            <span className="text-[11px] text-[#707882]">{historyItems.length} Sesi Terakhir</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {historyItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#f7f9fb] rounded-2xl flex items-center justify-between gap-2 border border-[#eceef0]/60 hover:bg-[#f2f4f6] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#00855b]/15 text-[#006947] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#191c1e] truncate">
                      {item.subject}
                    </p>
                    <p className="text-[11px] text-[#404751]">
                      {item.date} • {item.time}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] bg-[#00855b]/15 text-[#006947] px-2.5 py-0.5 rounded-full font-extrabold shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
