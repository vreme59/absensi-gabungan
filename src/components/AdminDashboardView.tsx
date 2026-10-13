import React, { useState, useRef } from 'react';
import {
  exportScheduleToExcel,
  exportAttendanceRecapToExcel,
  parseExcelToSchedules,
  exportStudentsToExcel,
  parseExcelToStudents,
  exportMonthlyAttendanceExcel,
  exportQuarterlyAttendanceExcel,
  exportSemesterAttendanceExcel,
  exportClassFullAttendanceExcel,
  exportDailyCheckAttendanceExcel,
  exportByTeacherAttendanceExcel,
} from '../utils/excelHelper';
import { ScheduleSlot, Student, Teacher, ExportPeriod, ExportBasis, NotificationItem } from '../types';
import { INITIAL_TEACHERS, INITIAL_SCHEDULES, NOTIFICATIONS } from '../data/adminMockData';
import { ExportKehadiranModal } from './ExportKehadiranModal';
import { ScheduleModal } from './ScheduleModal';
import { PrintModal } from './PrintModal';
import { NotificationsModal } from './NotificationsModal';

interface AdminDashboardViewProps {
  onOpenScheduleManager?: () => void;
  onOpenPrintModal?: () => void;
  onOpenNotifications?: () => void;
  roleTitle?: string;
  initialRoleMode?: 'admin' | 'superadmin';
  schedules?: ScheduleSlot[];
  students?: Student[];
  teachers?: Teacher[];
  onImportSchedules?: (newSchedules: ScheduleSlot[]) => void;
  onImportStudents?: (newStudents: Student[]) => void;
  onAddTeacher?: (newTeacher: Teacher) => void;
  onAddStudent?: (newStudent: Student) => void;
  onResetUserPassword?: (username: string, newPass: string) => void;
  onLogout?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenScheduleManager,
  onOpenPrintModal,
  onOpenNotifications,
  roleTitle = 'Tata Usaha / Operator',
  initialRoleMode,
  schedules = INITIAL_SCHEDULES,
  students = [],
  teachers = INITIAL_TEACHERS,
  onImportSchedules,
  onImportStudents,
  onAddTeacher,
  onAddStudent,
  onResetUserPassword,
  onLogout: _onLogout,
}) => {
  const isSuperDefault =
    initialRoleMode === 'superadmin' ||
    roleTitle.toLowerCase().includes('super') ||
    roleTitle.toLowerCase().includes('kepala');

  // Interactive toggle: user can switch between 'admin' (Admin TU) and 'superadmin' (Super Admin)
  const [activeRoleMode, setActiveRoleMode] = useState<'admin' | 'superadmin'>(
    isSuperDefault ? 'superadmin' : 'admin'
  );

  const isSuperadmin = activeRoleMode === 'superadmin';
  const displayRoleTitle = isSuperadmin ? 'Kepala Sekolah / IT Admin' : 'Tata Usaha / Operator';

  // Internal schedules & notifications
  const [internalSchedules, setInternalSchedules] = useState<ScheduleSlot[]>(
    schedules && schedules.length > 0 ? schedules : INITIAL_SCHEDULES
  );
  const [internalNotifications, setInternalNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);

  // Modal open states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // ─── TAB NAVIGATION ───
  // Admin: dashboard, export, data, jadwal
  // Superadmin: dashboard, export, data, kebijakan, keamanan
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<'hari_ini' | 'bulan_ini'>('hari_ini');
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  // ─── EXPORT MODAL STATE ───
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [modalDefaultPeriod, setModalDefaultPeriod] = useState<ExportPeriod>('bulanan');
  const [modalDefaultBasis, setModalDefaultBasis] = useState<ExportBasis>('harian');

  // ─── ADMIN CRUD MODALS ───
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [teacherNip, setTeacherNip] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [teacherRoom, setTeacherRoom] = useState('Lab Komputer 2');

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentNis, setStudentNis] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('XII DKV 1');
  const [studentNo, setStudentNo] = useState('06');

  const [isChangePwOpen, setIsChangePwOpen] = useState(false);
  const [pwTargetUser, setPwTargetUser] = useState('s0068192041 (Cindy Laura)');
  const [pwNewValue, setPwNewValue] = useState('');

  const scheduleFileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  const handleOpenExportWizard = (p: ExportPeriod = 'bulanan', b: ExportBasis = 'harian') => {
    setModalDefaultPeriod(p);
    setModalDefaultBasis(b);
    setIsExportModalOpen(true);
  };

  const stats = {
    totalStudents: 1240,
    totalClasses: 36,
    attendanceRate: 96.8,
    presentToday: 1200,
    sickToday: 18,
    permitToday: 12,
    unexcusedToday: 10,
    totalTeachers: 78,
  };

  const classSummaries = [
    { id: '1', name: 'XII TKJ 1', hadir: 32, sakit: 1, izin: 1, alfa: 0, status: 'Tervalidasi' },
    { id: '2', name: 'XII RPL 1', hadir: 34, sakit: 2, izin: 0, alfa: 0, status: 'Tervalidasi' },
    { id: '3', name: 'XII DKV 1', hadir: 31, sakit: 1, izin: 2, alfa: 1, status: 'Menunggu Validasi' },
    { id: '4', name: 'XI TKJ 1', hadir: 35, sakit: 0, izin: 1, alfa: 0, status: 'Tervalidasi' },
    { id: '5', name: 'X PPLG', hadir: 36, sakit: 0, izin: 0, alfa: 0, status: 'Tervalidasi' },
  ];

  const auditLogs = [
    { id: 'log-1', time: '08:50 WIT', user: 'Budi Santoso, S.Kom', action: 'Kunci Presensi JP 1-3 (XII TKJ 1 - 32 Hadir)' },
    { id: 'log-2', time: '08:15 WIT', user: 'Tata Usaha SMKN 1', action: 'Update Jadwal Rombel XII RPL 2' },
    { id: 'log-3', time: '07:15 WIT', user: 'Sistem SIAP Server', action: 'Sinkronisasi Otomatis PostgreSQL Supabase (1.000 Jadwal Aktif)' },
    { id: 'log-4', time: 'Kemarin', user: 'Superadmin IT', action: 'Backup Rutin Database & Snapshot Rombel' },
  ];

  // ─── QUICK EXCEL ACTIONS ───
  const handleExportScheduleExcel = () => {
    exportScheduleToExcel(schedules, 'XII_TKJ_1');
    showFeedback('Jadwal rombel berhasil diekspor ke format Excel (.xlsx)!');
  };

  const handleExportStudentExcel = () => {
    exportStudentsToExcel(students, 'XII_TKJ_1');
    showFeedback('Data roster siswa berhasil diekspor ke Excel (.xlsx)!');
  };

  const handleExportRecapExcel = () => {
    exportAttendanceRecapToExcel(students, 'XII_TKJ_1', 'Oktober 2026');
    showFeedback('Rekap presensi sekolah berhasil diekspor ke Excel (.xlsx)!');
  };

  // Quick 1-Click Exports
  const handleQuickDailyExport = (periodName: 'mingguan' | 'bulanan' | '3bulan' | 'semester' | 'kelas') => {
    const defaultClass = 'XII TKJ 1';
    if (periodName === 'mingguan') {
      exportDailyCheckAttendanceExcel(students, defaultClass, 'Minggu 2 - Oktober 2026');
    } else if (periodName === 'bulanan') {
      exportMonthlyAttendanceExcel(students, defaultClass, 'Oktober', '2026');
    } else if (periodName === '3bulan') {
      exportQuarterlyAttendanceExcel(students, defaultClass, ['Oktober', 'November', 'Desember'], '2026');
    } else if (periodName === 'semester') {
      exportSemesterAttendanceExcel(students, defaultClass, 'Ganjil', '2026/2027');
    } else if (periodName === 'kelas') {
      exportClassFullAttendanceExcel(students, defaultClass, '2026/2027');
    }
    showFeedback(`Export Kehadiran Harian (${periodName.toUpperCase()}) berhasil diunduh!`);
  };

  const handleQuickTeacherExport = (teacherIdx: number) => {
    const t = teachers[teacherIdx] || teachers[0];
    exportByTeacherAttendanceExcel(
      students,
      'XII TKJ 1',
      t.name,
      t.subject,
      'Semester Ganjil 2026/2027'
    );
    showFeedback(`Export Kehadiran Guru ${t.name} (${t.subject}) berhasil diunduh!`);
  };

  const handleImportScheduleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelToSchedules(file);
      if (onImportSchedules && parsed.length > 0) {
        onImportSchedules(parsed);
        showFeedback(`${parsed.length} slot jadwal berhasil diimpor dari Excel!`);
      }
    } catch (err: any) {
      alert(`Gagal impor file jadwal: ${err?.message || 'Format tidak valid'}`);
    }
  };

  const handleImportStudentFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelToStudents(file);
      if (onImportStudents && parsed.length > 0) {
        onImportStudents(parsed);
        showFeedback(`${parsed.length} data siswa berhasil diimpor dari Excel!`);
      }
    } catch (err: any) {
      alert(`Gagal impor file siswa: ${err?.message || 'Format tidak valid'}`);
    }
  };

  const handleResetPasswordBulk = () => {
    if (window.confirm('Reset semua kata sandi guru dan siswa yang bermasalah ke standar default "Demo@2026"?')) {
      showFeedback('Kredensial berhasil disetel ulang ke default: Demo@2026!');
    }
  };

  const handleSaveNewTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherNip || !teacherName || !teacherSubject) {
      alert('Harap lengkapi data NIP, Nama, dan Mata Pelajaran guru.');
      return;
    }
    const newT: Teacher = {
      id: `t-${Date.now()}`,
      nip: teacherNip.trim(),
      name: teacherName.trim(),
      subject: teacherSubject.trim(),
      room: teacherRoom.trim(),
    };
    if (onAddTeacher) onAddTeacher(newT);
    setIsAddTeacherOpen(false);
    setTeacherNip('');
    setTeacherName('');
    setTeacherSubject('');
    showFeedback(`Guru ${newT.name} berhasil ditambahkan ke sistem!`);
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentNis || !studentName) {
      alert('Harap lengkapi NIS dan Nama siswa.');
      return;
    }
    const newS: Student = {
      id: `s-${Date.now()}`,
      no: studentNo,
      nis: studentNis.trim(),
      name: studentName.trim(),
      kelas: studentClass,
      status: 'Hadir',
    };
    if (onAddStudent) onAddStudent(newS);
    setIsAddStudentOpen(false);
    setStudentNis('');
    setStudentName('');
    showFeedback(`Siswa ${newS.name} (${newS.kelas}) berhasil ditambahkan!`);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwNewValue || pwNewValue.length < 6) {
      alert('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (onResetUserPassword) {
      onResetUserPassword(pwTargetUser, pwNewValue);
    }
    setIsChangePwOpen(false);
    setPwNewValue('');
    showFeedback(`Kata sandi akun ${pwTargetUser} berhasil diperbarui!`);
  };

  return (
    <div className="flex flex-col w-full relative pb-28">
      {/* Hidden file inputs for Excel imports */}
      <input
        type="file"
        ref={scheduleFileInputRef}
        onChange={handleImportScheduleFile}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />
      <input
        type="file"
        ref={studentFileInputRef}
        onChange={handleImportStudentFile}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Header Banner */}
      <div
        className={`pb-12 pt-4 px-4 rounded-b-[32px] relative overflow-hidden shadow-sm text-white ${
          isSuperadmin
            ? 'bg-gradient-to-b from-[#3b0764] via-[#581c87] to-[#00609b]'
            : 'bg-gradient-to-b from-[#00609b] via-[#0079c2] to-[#0761a2]'
        }`}
      >
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-36 h-36 rounded-full bg-[#6ffbbe]/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-white text-[#00609b] flex items-center justify-center font-extrabold text-[20px] shadow-sm ring-2 ring-white/30 shrink-0">
              {isSuperadmin ? '👑' : '🛠️'}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] text-white font-bold truncate">
                  {isSuperadmin ? 'Superadmin SIAP' : 'Administrator SIAP'}
                </span>
                <span className="text-base select-none">{isSuperadmin ? '✨' : '⚡'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#cfe4ff] font-semibold uppercase tracking-wider truncate">
                  {displayRoleTitle}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#cfe4ff]/60" />
                <span className="text-[11px] text-white/80 shrink-0">SMKN 1 Sorong</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              aria-label="Export Wizard Cepat"
              type="button"
              onClick={() => handleOpenExportWizard('bulanan', 'harian')}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              aria-label="Notifikasi"
              type="button"
              onClick={onOpenNotifications || (() => setIsNotificationsOpen(true))}
              className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ffdad6]" />
            </button>
          </div>
        </div>

        {/* ─── ROLE MODE SWITCHER PILL (ADMIN TU vs SUPER ADMIN) ─── */}
        <div className="relative z-10 mt-3.5 flex items-center justify-between bg-black/25 backdrop-blur-md rounded-2xl p-1 border border-white/20 shadow-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveRoleMode('admin');
                if (activeTab === 'kebijakan' || activeTab === 'keamanan') {
                  setActiveTab('dashboard');
                }
                showFeedback('Beralih ke Tampilan: Admin TU (Tata Usaha)');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRoleMode === 'admin'
                  ? 'bg-white text-[#00609b] shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>🛠️</span>
              <span>Admin TU</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRoleMode('superadmin');
                if (activeTab === 'jadwal') {
                  setActiveTab('dashboard');
                }
                showFeedback('Beralih ke Tampilan: Super Admin (Kepala Sekolah / IT)');
              }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRoleMode === 'superadmin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>👑</span>
              <span>Super Admin</span>
            </button>
          </div>
          <div className="flex items-center gap-2 pr-2 text-white">
            <span className="text-[10px] text-white/90 font-semibold hidden sm:inline">
              Mode Aktif: {activeRoleMode === 'superadmin' ? 'Root Level 0' : 'Operator TU'}
            </span>
            <span className="w-2 h-2 rounded-full bg-[#6ffbbe] animate-pulse" />
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="relative z-10 mt-2.5 flex items-center justify-between bg-black/20 backdrop-blur-md rounded-xl py-1.5 px-3">
          <div className="flex items-center gap-1.5 text-white">
            <span className="material-symbols-outlined text-[16px] text-[#6ffbbe]">
              dns
            </span>
            <span className="text-[11px] font-bold tracking-wide">
              {isSuperadmin
                ? 'Root Control Panel • Supabase DB Connected'
                : 'Operator Portal • Realtime Sync'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold hidden sm:inline">
              TLS 256-Bit
            </span>
            <span className="text-[10px] bg-[#6ffbbe] text-[#003823] px-2.5 py-0.5 rounded-full font-extrabold">
              {isSuperadmin ? 'ROOT OK' : 'ONLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── STRUCTURED NAVIGATION TABS (ADMIN vs SUPERADMIN) ─── */}
      <div className="px-4 -mt-6 flex flex-col gap-4 relative z-20">
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-[#eceef0] flex gap-1 overflow-x-auto no-scrollbar">
          {/* Shared Tab: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'dashboard'
                ? isSuperadmin
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-[#00609b] text-white shadow-xs'
                : 'text-[#404751] hover:bg-[#f2f4f6]'
            }`}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          {/* Shared Tab: Pusat Export Kehadiran (.xlsx) */}
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'export'
                ? isSuperadmin
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-[#00609b] text-white shadow-xs'
                : 'text-[#404751] hover:bg-[#f2f4f6]'
            }`}
          >
            <span>📥</span>
            <span>Export Kehadiran</span>
          </button>

          {/* Shared Tab: Master Data & Rombel */}
          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
              activeTab === 'data'
                ? isSuperadmin
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-[#00609b] text-white shadow-xs'
                : 'text-[#404751] hover:bg-[#f2f4f6]'
            }`}
          >
            <span>📁</span>
            <span>Data Siswa &amp; Guru</span>
          </button>

          {/* Admin Exclusive Tab: Jadwal & Siaran */}
          {!isSuperadmin && (
            <button
              type="button"
              onClick={() => setActiveTab('jadwal')}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'jadwal'
                  ? 'bg-[#00609b] text-white shadow-xs'
                  : 'text-[#404751] hover:bg-[#f2f4f6]'
              }`}
            >
              <span>📢</span>
              <span>Jadwal &amp; Pengumuman</span>
            </button>
          )}

          {/* Superadmin Exclusive Tabs: Kebijakan Root */}
          {isSuperadmin && (
            <button
              type="button"
              onClick={() => setActiveTab('kebijakan')}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'kebijakan'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-[#404751] hover:bg-[#f2f4f6]'
              }`}
            >
              <span>⚙️</span>
              <span>Kebijakan Root</span>
            </button>
          )}

          {/* Superadmin Exclusive Tabs: Keamanan & Akun */}
          {isSuperadmin && (
            <button
              type="button"
              onClick={() => setActiveTab('keamanan')}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                activeTab === 'keamanan'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-[#404751] hover:bg-[#f2f4f6]'
              }`}
            >
              <span>🛡️</span>
              <span>Keamanan &amp; Akun</span>
            </button>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: DASHBOARD & REKAPITULASI PRESENSI                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* KPI Summary Card */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_10px_25px_-5px_rgba(0,95,160,0.1)] border border-[#eceef0] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#006947] animate-pulse" />
                  <span className="text-[12px] uppercase tracking-wider text-[#404751] font-bold">
                    REKAPITULASI PRESENSI HARI INI
                  </span>
                </div>
                <div className="flex bg-[#f2f4f6] p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('hari_ini')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      selectedPeriod === 'hari_ini'
                        ? 'bg-[#00609b] text-white shadow-xs'
                        : 'text-[#404751]'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('bulan_ini')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      selectedPeriod === 'bulan_ini'
                        ? 'bg-[#00609b] text-white shadow-xs'
                        : 'text-[#404751]'
                    }`}
                  >
                    Bulan Ini
                  </button>
                </div>
              </div>

              {/* KPI Numbers Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#00855b]/10 p-2.5 rounded-2xl flex flex-col items-center">
                  <span className="text-[18px] font-extrabold text-[#006947]">
                    {stats.presentToday}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[#006947]">
                    Hadir
                  </span>
                </div>

                <div className="bg-purple-50 p-2.5 rounded-2xl flex flex-col items-center">
                  <span className="text-[18px] font-extrabold text-purple-700">
                    {stats.sickToday}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-purple-700">
                    Sakit
                  </span>
                </div>

                <div className="bg-sky-50 p-2.5 rounded-2xl flex flex-col items-center">
                  <span className="text-[18px] font-extrabold text-sky-700">
                    {stats.permitToday}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-sky-700">
                    Izin
                  </span>
                </div>

                <div className="bg-rose-50 p-2.5 rounded-2xl flex flex-col items-center">
                  <span className="text-[18px] font-extrabold text-rose-700">
                    {stats.unexcusedToday}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-rose-700">
                    Alfa
                  </span>
                </div>
              </div>

              {/* Percentage Bar */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-[#eceef0]">
                <div className="flex items-center justify-between text-[12px] font-bold">
                  <span className="text-[#191c1e]">Tingkat Kehadiran Sekolah</span>
                  <span className="text-[#00609b]">{stats.attendanceRate}%</span>
                </div>
                <div className="w-full bg-[#f2f4f6] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#00609b] to-[#00855b] h-full rounded-full"
                    style={{ width: `${stats.attendanceRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Bar to Export Wizard */}
            <div className="bg-gradient-to-r from-[#00609b] to-[#0761a2] text-white p-4 rounded-3xl shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-[20px] shrink-0">
                  📊
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold truncate">Export Laporan Presensi Excel</p>
                  <p className="text-[10px] text-[#cfe4ff] truncate">
                    Mulai dari mingguan, bulanan, 3 bulan, 1 semester, 1 kelas (2 basis)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenExportWizard('bulanan', 'harian')}
                className="px-3.5 py-2 rounded-xl bg-white text-[#00609b] text-[11px] font-bold hover:bg-[#cfe4ff] active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Buka Export Wizard
              </button>
            </div>

            {/* Rombel Summary Table */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#eceef0] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#191c1e]">
                  Status Validasi Rombel Hari Ini
                </h3>
                <span className="text-[11px] text-[#00609b] font-bold">36 Rombel</span>
              </div>

              <div className="divide-y divide-[#eceef0]">
                {classSummaries.map((cls) => (
                  <div key={cls.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#191c1e]">{cls.name}</span>
                      <span className="text-[11px] text-[#404751]">
                        {cls.hadir} Hadir • {cls.sakit} Sakit • {cls.izin} Izin • {cls.alfa} Alfa
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        cls.status === 'Tervalidasi'
                          ? 'bg-[#00855b]/10 text-[#006947]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cls.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: PUSAT EXPORT KEHADIRAN EXCEL (FITUR INTI PERMINTAAN USER)    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'export' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Header Wizard Banner */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#eceef0] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[18px]">
                    📥
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191c1e]">
                      Pusat Export Kehadiran Excel (.xlsx)
                    </h3>
                    <p className="text-[11px] text-[#707882]">
                      Laporan multi-periode dengan 2 basis perhitungan resmi
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenExportWizard('bulanan', 'harian')}
                  className="px-3 py-1.5 rounded-xl bg-[#00609b] text-white text-[11px] font-bold flex items-center gap-1 hover:bg-[#0079c2] transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  <span>Kustomisasi Export</span>
                </button>
              </div>

              {/* Basis A Card: Kehadiran Harian (Min 1x Hadir) */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#006947] text-white flex items-center justify-center text-[12px] font-bold">
                      A
                    </span>
                    <div>
                      <h4 className="text-[12px] font-extrabold text-emerald-950">
                        Basis 1: Kehadiran Harian (Minimal 1x Hadir per Hari)
                      </h4>
                      <p className="text-[10px] text-emerald-800">
                        Siswa dihitung hadir (✓) jika tercatat setidaknya absen 1x dalam jadwal pelajaran hari tersebut.
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-[#6ffbbe]/40 text-[#006947] font-bold px-2 py-0.5 rounded-md hidden sm:inline">
                    Standar Absensi Sekolah
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickDailyExport('mingguan')}
                    className="p-2.5 bg-white rounded-xl border border-emerald-200 hover:border-[#006947] hover:shadow-xs flex flex-col items-center text-center transition-all cursor-pointer"
                  >
                    <span className="text-[14px]">📅</span>
                    <span className="text-[11px] font-bold text-emerald-950 mt-0.5">Mingguan</span>
                    <span className="text-[9px] text-[#707882]">6 Hari Efektif</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDailyExport('bulanan')}
                    className="p-2.5 bg-white rounded-xl border border-emerald-200 hover:border-[#006947] hover:shadow-xs flex flex-col items-center text-center transition-all cursor-pointer"
                  >
                    <span className="text-[14px]">🗓️</span>
                    <span className="text-[11px] font-bold text-emerald-950 mt-0.5">Bulanan</span>
                    <span className="text-[9px] text-[#707882]">26 Hari Kerja</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDailyExport('3bulan')}
                    className="p-2.5 bg-white rounded-xl border border-emerald-200 hover:border-[#006947] hover:shadow-xs flex flex-col items-center text-center transition-all cursor-pointer"
                  >
                    <span className="text-[14px]">📊</span>
                    <span className="text-[11px] font-bold text-emerald-950 mt-0.5">3 Bulan</span>
                    <span className="text-[9px] text-[#707882]">Triwulan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDailyExport('semester')}
                    className="p-2.5 bg-white rounded-xl border border-emerald-200 hover:border-[#006947] hover:shadow-xs flex flex-col items-center text-center transition-all cursor-pointer"
                  >
                    <span className="text-[14px]">🎓</span>
                    <span className="text-[11px] font-bold text-emerald-950 mt-0.5">1 Semester</span>
                    <span className="text-[9px] text-[#707882]">6 Bulan Penuh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickDailyExport('kelas')}
                    className="p-2.5 bg-white rounded-xl border border-emerald-200 hover:border-[#006947] hover:shadow-xs flex flex-col items-center text-center col-span-2 sm:col-span-1 transition-all cursor-pointer"
                  >
                    <span className="text-[14px]">🏫</span>
                    <span className="text-[11px] font-bold text-emerald-950 mt-0.5">1 Kelas</span>
                    <span className="text-[9px] text-[#707882]">Rombel Setahun</span>
                  </button>
                </div>
              </div>

              {/* Basis B Card: Berdasarkan Guru & Mapel */}
              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#00609b] text-white flex items-center justify-center text-[12px] font-bold">
                      B
                    </span>
                    <div>
                      <h4 className="text-[12px] font-extrabold text-[#001d34]">
                        Basis 2: Berdasarkan Guru &amp; Mata Pelajaran
                      </h4>
                      <p className="text-[10px] text-[#004a79]">
                        Rekap kehadiran siswa spesifik per jam pertemuan yang diampu guru mata pelajaran tertentu (16 Pertemuan).
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] bg-sky-100 text-[#00609b] font-bold px-2 py-0.5 rounded-md hidden sm:inline">
                    Evaluasi Guru Mapel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {teachers.slice(0, 3).map((t: Teacher, idx: number) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleQuickTeacherExport(idx)}
                      className="p-2.5 bg-white rounded-xl border border-sky-200 hover:border-[#00609b] hover:shadow-xs flex items-center gap-2 text-left transition-all cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#00609b]/10 text-[#00609b] flex items-center justify-center text-[12px] font-bold shrink-0">
                        👨‍🏫
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#191c1e] truncate">{t.name}</p>
                        <p className="text-[9px] text-[#707882] truncate">{t.subject}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenExportWizard('semester', 'guru')}
                    className="text-[11px] text-[#00609b] hover:text-[#00487a] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Pilih guru lainnya di Export Wizard</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: DATA SISWA & GURU (MASTER DATA & EXCEL IMPORT/EXPORT)       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'data' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Action Tools Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#eceef0] flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[18px]">
                    👥
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191c1e]">
                      Manajemen Data Siswa &amp; Dewan Guru
                    </h3>
                    <p className="text-[11px] text-[#707882]">
                      Sinkronisasi dan mutasi data rombel SMKN 1 Sorong
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(true)}
                  className="p-3 bg-[#f7f9fb] hover:bg-purple-50 rounded-2xl border border-[#eceef0] hover:border-purple-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#191c1e] text-center">
                    + Tambah Guru
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(true)}
                  className="p-3 bg-[#f7f9fb] hover:bg-sky-50 rounded-2xl border border-[#eceef0] hover:border-sky-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#00609b] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">group_add</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#191c1e] text-center">
                    + Tambah Siswa
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportStudentExcel}
                  className="p-3 bg-[#f7f9fb] hover:bg-emerald-50 rounded-2xl border border-[#eceef0] hover:border-emerald-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006947] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#191c1e] text-center">
                    Ekspor Roster Siswa
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => studentFileInputRef.current?.click()}
                  className="p-3 bg-[#f7f9fb] hover:bg-amber-50 rounded-2xl border border-[#eceef0] hover:border-amber-300 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">upload</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#191c1e] text-center">
                    Impor Excel Siswa
                  </span>
                </button>
              </div>

              {/* Current Teacher Directory Table */}
              <div className="pt-2 border-t border-[#eceef0]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[12px] font-bold text-[#191c1e]">
                    Daftar Guru Terdaftar ({teachers.length})
                  </h4>
                  <span className="text-[10px] text-[#707882]">Tahun Ajaran 2026/2027</span>
                </div>
                <div className="divide-y divide-[#eceef0] max-h-56 overflow-y-auto border border-[#eceef0] rounded-2xl">
                  {teachers.map((t: Teacher) => (
                    <div key={t.id} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div className="min-w-0">
                        <p className="font-bold text-[#191c1e] truncate">{t.name}</p>
                        <p className="text-[10px] text-[#707882]">NIP: {t.nip} • {t.subject}</p>
                      </div>
                      <span className="text-[10px] bg-[#f2f4f6] text-[#404751] px-2 py-0.5 rounded-md font-semibold shrink-0">
                        {t.room || 'Ruang Guru'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4 (ADMIN ONLY): JADWAL & PENGUMUMAN                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {!isSuperadmin && activeTab === 'jadwal' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#eceef0] flex flex-col gap-3">
              <h3 className="text-[14px] font-bold text-[#191c1e] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00609b]">event_note</span>
                <span>Manajemen Jadwal Pelajaran &amp; Pengumuman</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onOpenScheduleManager || (() => setIsScheduleModalOpen(true))}
                  className="p-3 bg-[#f7f9fb] hover:bg-sky-50 rounded-2xl border border-[#eceef0] flex items-center gap-3 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-[#00609b] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#191c1e]">Editor Jadwal</p>
                    <p className="text-[10px] text-[#707882]">Atur slot JP &amp; guru</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onOpenPrintModal || (() => setIsPrintModalOpen(true))}
                  className="p-3 bg-[#f7f9fb] hover:bg-sky-50 rounded-2xl border border-[#eceef0] flex items-center gap-3 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#d1e4ff] text-[#0761a2] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">print</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#191c1e]">Cetak Format Resmi</p>
                    <p className="text-[10px] text-[#707882]">Pratinjau lembar A4</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onOpenNotifications || (() => setIsNotificationsOpen(true))}
                  className="p-3 bg-[#f7f9fb] hover:bg-emerald-50 rounded-2xl border border-[#eceef0] flex items-center gap-3 transition-all cursor-pointer text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#6ffbbe]/30 text-[#006947] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">campaign</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#191c1e]">Siarkan Pengumuman</p>
                    <p className="text-[10px] text-[#707882]">Broadcast ke siswa &amp; guru</p>
                  </div>
                </button>
              </div>

              {/* Import/Export Jadwal Bar */}
              <div className="p-3 bg-[#f7f9fb] rounded-2xl border border-[#eceef0] flex items-center justify-between gap-2 mt-2">
                <div>
                  <p className="text-[12px] font-bold text-[#191c1e]">Sinkronisasi Jadwal Excel</p>
                  <p className="text-[10px] text-[#707882]">Impor slot rombel massal dari format Excel</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleExportScheduleExcel}
                    className="px-3 py-1.5 bg-white border border-[#eceef0] text-[#00609b] text-[11px] font-bold rounded-xl hover:bg-[#cfe4ff]/40 transition-all cursor-pointer"
                  >
                    Ekspor
                  </button>
                  <button
                    type="button"
                    onClick={() => scheduleFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-[#00609b] text-white text-[11px] font-bold rounded-xl hover:bg-[#0079c2] transition-all cursor-pointer"
                  >
                    Impor
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4 (SUPERADMIN ONLY): KEBIJAKAN SEKOLAH (ROOT)                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isSuperadmin && activeTab === 'kebijakan' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-purple-200 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#eceef0]">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    ⚙️
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191c1e]">
                      Konfigurasi Kebijakan Sekolah (Root Level 0)
                    </h3>
                    <p className="text-[11px] text-[#707882]">Parameter JP dan toleransi presensi</p>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full">
                  Level 0 Only
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[12px]">
                <div className="p-3 bg-[#f7f9fb] rounded-2xl border border-[#eceef0]">
                  <p className="text-[10px] text-[#707882] uppercase font-bold">Durasi 1 JP</p>
                  <p className="text-[15px] font-extrabold text-[#191c1e] mt-0.5">45 Menit</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Standar Kurikulum Merdeka</p>
                </div>

                <div className="p-3 bg-[#f7f9fb] rounded-2xl border border-[#eceef0]">
                  <p className="text-[10px] text-[#707882] uppercase font-bold">Jam Masuk Resmi</p>
                  <p className="text-[15px] font-extrabold text-[#191c1e] mt-0.5">07:15 WIT</p>
                  <p className="text-[10px] text-[#00609b] font-semibold">Toleransi 15 Menit</p>
                </div>

                <div className="p-3 bg-[#f7f9fb] rounded-2xl border border-[#eceef0]">
                  <p className="text-[10px] text-[#707882] uppercase font-bold">Total JP / Hari</p>
                  <p className="text-[15px] font-extrabold text-[#191c1e] mt-0.5">9 JP (Selesai 15:00)</p>
                  <p className="text-[10px] text-[#707882]">2 Sesi Istirahat</p>
                </div>

                <div className="p-3 bg-[#f7f9fb] rounded-2xl border border-[#eceef0]">
                  <p className="text-[10px] text-[#707882] uppercase font-bold">Aturan Hadir Harian</p>
                  <p className="text-[15px] font-extrabold text-[#006947] mt-0.5">Min. 1x Sesi JP</p>
                  <p className="text-[10px] text-[#707882]">Basis Kehadiran Harian</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5 (SUPERADMIN ONLY): KEAMANAN, AKUN & AUDIT LOG ROOT           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {isSuperadmin && activeTab === 'keamanan' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Mass Account & Credentials Manager */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#eceef0] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    👥
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191c1e]">
                      Manajemen Akun &amp; Kredensial Pengguna
                    </h3>
                    <p className="text-[11px] text-[#707882]">Otoritas reset kredensial root</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-purple-950">Ganti Kata Sandi Pengguna (Root)</p>
                    <p className="text-[11px] text-purple-800">
                      Ubah kata sandi akun siswa, guru mapel, atau operator secara langsung
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChangePwOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold shrink-0 shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">password</span>
                    <span>Ganti Sandi</span>
                  </button>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-amber-950">Reset Sandi Massal Default</p>
                    <p className="text-[11px] text-amber-800">
                      Setel ulang sandi semua user yang lupa ke default <code className="font-bold">Demo@2026</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetPasswordBulk}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Reset Default
                  </button>
                </div>
              </div>
            </div>

            {/* Live Security & Audit Logs */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#eceef0] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                    🛡️
                  </span>
                  <div>
                    <h3 className="text-[14px] font-bold text-[#191c1e]">
                      Audit Log Keamanan &amp; Aktivitas Sistem
                    </h3>
                    <p className="text-[11px] text-[#707882]">Pencatatan real-time perubahan data dan percobaan autentikasi</p>
                  </div>
                </div>
                <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                  Live Feed
                </span>
              </div>

              <div className="divide-y divide-[#f2f4f6]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <p className="text-[12px] font-bold text-[#191c1e]">{log.action}</p>
                      <p className="text-[10px] text-[#707882]">Oleh: {log.user}</p>
                    </div>
                    <span className="text-[10px] bg-[#f2f4f6] text-[#404751] font-semibold px-2 py-0.5 rounded-md shrink-0">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: TAMBAH GURU BARU ─── */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#eceef0] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                <h3 className="text-[16px] font-bold">Tambah Guru Mapel Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTeacherOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewTeacher} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">NIP (18 Digit)</label>
                <input
                  type="text"
                  required
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  placeholder="Contoh: 198008242006042012"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-purple-600 outline-hidden border border-transparent focus:border-purple-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">Nama Lengkap &amp; Gelar</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Contoh: Joana Josephine Sahuburua, S.T"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-purple-600 outline-hidden border border-transparent focus:border-purple-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">Mata Pelajaran Diampu</label>
                <input
                  type="text"
                  required
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  placeholder="Contoh: Desain Komunikasi Visual (DKV)"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-purple-600 outline-hidden border border-transparent focus:border-purple-600"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">Ruang / Lab Default</label>
                <input
                  type="text"
                  value={teacherRoom}
                  onChange={(e) => setTeacherRoom(e.target.value)}
                  placeholder="Contoh: Studio DKV 1 / Lab Komputer 2"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-purple-600 outline-hidden border border-transparent focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#eceef0] mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#c3c7cf] text-[#404751] text-[12px] font-bold hover:bg-[#f2f4f6] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[12px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Guru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: TAMBAH SISWA BARU ─── */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#eceef0] overflow-hidden">
            <div className="bg-gradient-to-r from-[#00609b] to-[#0a75c2] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">group_add</span>
                <h3 className="text-[16px] font-bold">Tambah Siswa Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="p-5 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">NISN / NIS</label>
                <input
                  type="text"
                  required
                  value={studentNis}
                  onChange={(e) => setStudentNis(e.target.value)}
                  placeholder="Contoh: 0068192056"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-[#00609b] outline-hidden border border-transparent focus:border-[#00609b]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Contoh: Nathan Ivander"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-[#00609b] outline-hidden border border-transparent focus:border-[#00609b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase text-[#404751]">Kelas / Rombel</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-[#00609b] outline-hidden"
                  >
                    <option value="XII DKV 1">XII DKV 1</option>
                    <option value="XII TKJ 1">XII TKJ 1</option>
                    <option value="XII RPL 1">XII RPL 1</option>
                    <option value="XI TKJ 2">XI TKJ 2</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase text-[#404751]">Nomor Absen</label>
                  <input
                    type="text"
                    value={studentNo}
                    onChange={(e) => setStudentNo(e.target.value)}
                    placeholder="Contoh: 06"
                    className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-[#00609b] outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#eceef0] mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#c3c7cf] text-[#404751] text-[12px] font-bold hover:bg-[#f2f4f6] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00609b] hover:bg-[#0079c2] text-white text-[12px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: GANTI PASSWORD PENGGUNA (SUPERADMIN ROOT) ─── */}
      {isChangePwOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-purple-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-purple-300">lock_reset</span>
                <h3 className="text-[16px] font-bold">Ganti Kata Sandi Pengguna</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePwOpen(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="p-5 flex flex-col gap-3">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-[11px] text-purple-900">
                Otoritas Root Level 0: Ubah langsung kredensial akun siswa, guru, atau admin tanpa perlu verifikasi email.
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">Pilih Akun / Username</label>
                <select
                  value={pwTargetUser}
                  onChange={(e) => setPwTargetUser(e.target.value)}
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-purple-700 outline-hidden"
                >
                  <optgroup label="Siswa">
                    <option value="s0068192041 (Cindy Laura)">s0068192041 - Cindy Laura (XII TKJ 1)</option>
                    <option value="s0068192042 (Andhika Pratama)">s0068192042 - Andhika Pratama (XII TKJ 1)</option>
                    <option value="s0068192051 (Nathan Ivander)">s0068192051 - Nathan Ivander (XII DKV 1)</option>
                    <option value="s0068192052 (Putri Natasya)">s0068192052 - Putri Natasya (XII DKV 1)</option>
                  </optgroup>
                  <optgroup label="Dewan Guru">
                    <option value="196812291993031011 (Budi Santoso, S.Kom)">196812291993031011 - Budi Santoso, S.Kom</option>
                    <option value="198008242006042012 (Joana Josephine Sahuburua, S.T)">198008242006042012 - Joana Sahuburua, S.T</option>
                    <option value="196504121989032005 (Dra. Yayuk Puji Hastuti)">196504121989032005 - Dra. Yayuk Puji Hastuti</option>
                  </optgroup>
                  <optgroup label="Administrator & Operator">
                    <option value="admin_demo (Tata Usaha SMKN 1)">admin_demo - Tata Usaha SMKN 1</option>
                    <option value="superadmin_sorong (Kepala Sekolah)">superadmin_sorong - Kepala Sekolah</option>
                  </optgroup>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase text-[#404751]">Kata Sandi Baru</label>
                <input
                  type="text"
                  required
                  value={pwNewValue}
                  onChange={(e) => setPwNewValue(e.target.value)}
                  placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                  className="w-full h-10 px-3 bg-[#f2f4f6] rounded-xl text-[12px] font-semibold text-[#191c1e] focus:bg-white focus:ring-2 focus:ring-purple-700 outline-hidden border border-transparent focus:border-purple-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#eceef0] mt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePwOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#c3c7cf] text-[#404751] text-[12px] font-bold hover:bg-[#f2f4f6] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[12px] font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EXPORT KEHADIRAN MODAL WIZARD ─── */}
      <ExportKehadiranModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={students && students.length > 0 ? students : []}
        teachers={teachers}
        defaultPeriod={modalDefaultPeriod}
        defaultBasis={modalDefaultBasis}
        onSuccess={(msg) => showFeedback(msg)}
      />

      {/* ─── SCHEDULE SLOT MODAL ─── */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        editingSlot={editingSlot}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={(slotData) => {
          if (editingSlot) {
            setInternalSchedules((prev) =>
              prev.map((s) => (s.id === editingSlot.id ? { ...s, ...slotData } : s))
            );
            showFeedback(`Jadwal "${slotData.subject}" berhasil diperbarui!`);
          } else {
            const newSlot: ScheduleSlot = {
              id: `sch-${Date.now()}`,
              day: slotData.day || 'Selasa',
              jpStart: slotData.jpStart || 1,
              jpEnd: slotData.jpEnd || 2,
              jpLabel: slotData.jpLabel || 'JP 1 - 2',
              timeRange: slotData.timeRange || '07:15 - 08:45 WIT',
              subject: slotData.subject || 'Mapel Baru',
              teacher: slotData.teacher || 'Guru Pengampu',
              room: slotData.room || 'Lab Komputer 2',
              badgeType: 'normal',
            };
            setInternalSchedules((prev) => [...prev, newSlot]);
            if (onImportSchedules) onImportSchedules([newSlot]);
            showFeedback('Jadwal baru berhasil ditambahkan!');
          }
          setIsScheduleModalOpen(false);
          setEditingSlot(null);
        }}
      />

      {/* ─── OFFICIAL PRINTABLE TIMETABLE MODAL ─── */}
      <PrintModal
        isOpen={isPrintModalOpen}
        schedules={internalSchedules}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* ─── ANNOUNCEMENTS & NOTIFICATIONS MODAL ─── */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        notifications={internalNotifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllAsRead={() => {
          setInternalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          showFeedback('Semua pengumuman & notifikasi ditandai telah dibaca.');
        }}
        userRole={isSuperadmin ? 'superadmin' : 'admin'}
        onAddNotification={(newNotif) => {
          setInternalNotifications((prev) => [newNotif, ...prev]);
          showFeedback('Pengumuman baru berhasil disiarkan ke seluruh dewan sekolah!');
        }}
      />

      {/* Floating feedback toast */}
      {toastFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1e293b] text-white px-4 py-2 rounded-full shadow-2xl text-[12px] font-semibold flex items-center gap-2 border border-white/20 animate-fadeIn">
          <span className="material-symbols-outlined text-[16px] text-[#6ffbbe]">check_circle</span>
          <span>{toastFeedback}</span>
        </div>
      )}
    </div>
  );
};
