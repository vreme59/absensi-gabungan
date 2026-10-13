import React, { useState, useRef } from 'react';
import { ScheduleSlot } from '../../types';
import { exportScheduleToExcel, parseExcelToSchedules } from '../../utils/excelHelper';
import { TEACHER_SCHEDULES } from './mockData';

interface JadwalViewProps {
  schedules: ScheduleSlot[];
  teacherSchedules?: ScheduleSlot[];
  onOpenAddModal: () => void;
  onOpenEditModal: (slot: ScheduleSlot) => void;
  onDeleteSlot: (id: string, subject: string) => void;
  onPrint: () => void;
  onOpenAbsensiKelas: (slot: ScheduleSlot) => void;
  userRole?: 'siswa' | 'guru' | 'admin' | 'superadmin';
  session?: any;
  studentClass?: string;
  onImportSchedules?: (newSchedules: ScheduleSlot[]) => void;
}

export const JadwalView: React.FC<JadwalViewProps> = ({
  schedules,
  teacherSchedules = TEACHER_SCHEDULES,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteSlot,
  onPrint,
  onOpenAbsensiKelas,
  userRole = 'siswa',
  session,
  studentClass,
  onImportSchedules,
}) => {
  const isSiswa = userRole === 'siswa';
  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';
  const isGuru = userRole === 'guru';

  // For students, lock strictly to their registered class (cannot change class)
  const defaultClass = isSiswa ? (studentClass || 'XII TKJ 1') : 'XII TKJ 1';
  const [selectedClass, setSelectedClass] = useState(defaultClass);
  const [selectedDay, setSelectedDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Selasa');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const days: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  // Schedule filtering:
  // - GURU: Shows teacher's own teaching schedule
  // - SISWA/ADMIN: Shows class timetable filtered to selectedClass and selectedDay
  const activePool = isGuru ? teacherSchedules : schedules;
  const currentDaySchedules = activePool.filter((s) => {
    if (s.day !== selectedDay) return false;
    if (isGuru) return true;
    if (s.isBreak) return true;
    if (!s.classTarget) return true;
    return s.classTarget === selectedClass;
  });

  const handleExportExcel = () => {
    exportScheduleToExcel(activePool, isGuru ? 'Agenda_Guru' : selectedClass);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseExcelToSchedules(file);
      if (onImportSchedules && imported.length > 0) {
        onImportSchedules(imported);
      }
    } catch (err: any) {
      alert(`Gagal membaca file Excel: ${err?.message || 'Format tidak valid'}`);
    }
  };

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Hidden file input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Atmospheric Curved Header */}
      <div className="relative bg-gradient-to-b from-[#00609b] to-[#0761a2] pt-4 pb-14 px-4 rounded-b-[28px] shadow-sm text-white">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#6ffbbe]">
              event_available
            </span>
            <span className="text-[12px] tracking-wider uppercase opacity-90 font-bold">
              {isGuru ? 'Agenda Mengajar Guru' : 'Jadwal Pelajaran Rombel'}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold shadow-xs">
            Semester Ganjil 2026/2027
          </span>
        </div>

        {/* Quick Classroom / Teacher Meta Bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#cfe4ff] uppercase tracking-wider font-semibold">
              {isGuru ? 'Guru Pengampu' : 'Kompetensi Keahlian'}
            </p>
            <p className="text-[17px] font-extrabold leading-tight">
              {isGuru
                ? 'Budi Santoso, S.Kom'
                : selectedClass.includes('DKV')
                ? 'Desain Komunikasi Visual (DKV)'
                : 'Teknik Komputer & Jaringan (TKJ)'}
            </p>
            {isGuru && (
              <p className="text-[11px] text-white/80">NIP: 196812291993031011 • SMKN 1 Sorong</p>
            )}
            {isSiswa && (
              <p className="text-[11px] text-white/80">Rombel Siswa: {selectedClass} • Terkunci Resmi</p>
            )}
          </div>

          {!isGuru && isAdminOrSuper && (
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              aria-label="Filter rombel"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 active:scale-95 transition-all text-white"
            >
              <span className="material-symbols-outlined text-white text-[22px]">tune</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Floating Island Content Area */}
      <div className="px-4 -mt-9 flex flex-col gap-3 pb-8 relative z-10">
        {/* Filter Selector Card */}
        <div className="bg-white rounded-2xl p-3.5 shadow-md border border-[#eceef0]/70 flex flex-col gap-3">
          {/* Selector 1: Kelas (HANYA UNTUK ADMIN / SUPERADMIN - SISWA TIDAK BISA GANTI KELAS) */}
          {isAdminOrSuper && (
            <div className="flex flex-col gap-1 relative">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-[#404751] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#00609b]">school</span>
                  <span>Pilih Rombel / Kelas (Admin)</span>
                </label>
                <span className="text-[10px] text-[#00609b] font-bold bg-[#cfe4ff]/60 px-2.5 py-0.5 rounded-full">
                  Rombel: {selectedClass}
                </span>
              </div>
              <div
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className="relative flex items-center bg-[#f2f4f6] rounded-xl px-3.5 py-2.5 cursor-pointer hover:bg-[#eceef0] transition-colors"
              >
                <span className="text-[14px] text-[#191c1e] font-extrabold flex-1 truncate">
                  {selectedClass}
                </span>
                <span
                  className="material-symbols-outlined text-[20px] text-[#707882] transition-transform duration-200"
                  style={{ transform: isClassDropdownOpen ? 'rotate(180deg)' : 'none' }}
                >
                  expand_more
                </span>
              </div>

              {isClassDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-2xl shadow-xl border border-[#eceef0] z-30 py-1.5 overflow-hidden animate-fadeIn">
                  {['XII TKJ 1', 'XII DKV 1', 'XII RPL 1', 'XI TKJ 1', 'X DKV 1'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setSelectedClass(c);
                        setIsClassDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-[12px] hover:bg-[#cfe4ff]/30 flex items-center justify-between transition-colors ${
                        selectedClass === c ? 'font-bold text-[#00609b] bg-[#cfe4ff]/20' : 'text-[#191c1e]'
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
          )}

          {/* Locked Class Indicator untuk Siswa (HANYA BISA LIHAT JADWAL SENDIRI) */}
          {isSiswa && (
            <div className="flex items-center justify-between bg-[#f2f4f6] rounded-xl px-3.5 py-2.5 border border-[#e2e6eb]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#00609b] text-[18px]">school</span>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#707882] uppercase font-bold tracking-wider">Jadwal Kelas Terdaftar</p>
                  <p className="text-[13px] font-extrabold text-[#191c1e] truncate">{selectedClass}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full shadow-2xs">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                <span>Rombel Resmi (Terkunci)</span>
              </span>
            </div>
          )}

          {/* Fluid Animated Slidebar: Hari Pembelajaran (Tanpa Dropdown) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-[11px] text-[#404751] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#00609b]">calendar_today</span>
                <span>Hari Pembelajaran</span>
              </label>
              <div className="flex items-center gap-1 text-[10px] text-[#707882]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00609b] animate-ping" />
                <span className="font-semibold text-[#00609b]">Geser fluid</span>
                <span className="material-symbols-outlined text-[13px] animate-pulse">swipe</span>
              </div>
            </div>

            {/* Slidebar Horizontal dengan Smooth Scrolling & Active Glowing Animation */}
            <div className="relative flex items-center w-full">
              <div
                className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar py-1.5 px-0.5 w-full touch-pan-x"
                style={{ scrollSnapType: 'x proximity' }}
              >
                {days.map((day) => {
                  const isSelected = selectedDay === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={(e) => {
                        setSelectedDay(day);
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                      }}
                      className={`relative px-4 py-2 rounded-2xl text-[12px] font-bold transition-all duration-300 ease-out shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 select-none ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#00609b] to-[#0761a2] text-white shadow-[0_4px_14px_rgba(0,96,155,0.35)] scale-[1.03] ring-2 ring-[#00609b]/25'
                          : 'bg-[#f2f4f6] text-[#404751] hover:bg-[#e4e7ea] hover:text-[#191c1e]'
                      }`}
                      style={{ scrollSnapAlign: 'center' }}
                    >
                      <span>{day}</span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-[#6ffbbe] shadow-[0_0_8px_#6ffbbe] animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Timetable Overview Header Strip */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-[#191c1e] font-bold">
              {isGuru ? `Agenda Mengajar ${selectedDay}` : `Jadwal ${selectedDay}`}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#cfe4ff] text-[#001d34] text-[11px] font-bold">
              {currentDaySchedules.filter((s) => !s.isBreak).length} Sesi
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Operator/Admin Excel Export & Import */}
            {isAdminOrSuper && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Import Jadwal dari File Excel"
                  className="text-[#00609b] bg-[#cfe4ff]/50 hover:bg-[#cfe4ff] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">upload_file</span>
                  <span>Import</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  title="Export Jadwal ke Excel (.xlsx)"
                  className="text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">file_download</span>
                  <span>Excel</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onPrint}
              className="text-[#00609b] hover:text-[#0761a2] text-[12px] font-bold flex items-center gap-0.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* Timetable List Container */}
        <div className="bg-white rounded-2xl shadow-md border border-[#eceef0]/70 p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {currentDaySchedules.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[#707882] text-[13px]">
              Tidak ada agenda pembelajaran pada hari {selectedDay}.
            </div>
          ) : (
            currentDaySchedules.map((slot) => {
              // Render Break Divider Card
              if (slot.isBreak) {
                const isAmber = slot.breakColor === 'amber';
                return (
                  <div
                    key={slot.id}
                    className={`col-span-full rounded-xl px-3 py-2 flex items-center justify-between shadow-xs ${
                      isAmber
                        ? 'bg-amber-50 text-amber-950 border border-amber-200/50'
                        : 'bg-emerald-50 text-emerald-950 border border-emerald-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isAmber
                            ? 'bg-amber-200/80 text-amber-900'
                            : 'bg-emerald-200/80 text-emerald-900'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {slot.breakIcon || (isAmber ? 'coffee' : 'mosque')}
                        </span>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold tracking-tight">
                          {slot.breakTitle}
                        </p>
                        <p
                          className={`text-[11px] ${
                            isAmber ? 'text-amber-800/80' : 'text-emerald-800/80'
                          }`}
                        >
                          {slot.breakSubtitle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isAmber
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {slot.breakDuration}
                    </span>
                  </div>
                );
              }

              // Normal Schedule Slot
              return (
                <div
                  key={slot.id}
                  className="relative bg-[#f7f9fb] rounded-2xl p-3.5 flex flex-col gap-2 transition-all hover:bg-[#f2f4f6] border border-[#eceef0]/60 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-white text-[11px] font-bold shadow-xs ${
                          slot.badgeType === 'live'
                            ? 'bg-emerald-600 animate-pulse'
                            : slot.jpStart === 1
                            ? 'bg-[#00609b]'
                            : 'bg-[#0761a2]'
                        }`}
                      >
                        {slot.jpLabel || `JP ${slot.jpStart} - ${slot.jpEnd}`}
                      </span>
                      <span className="text-[12px] text-[#404751] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#707882]">
                          schedule
                        </span>
                        {slot.timeRange}
                      </span>
                    </div>

                    {/* Class Target Badge (Khusus Agenda Guru) */}
                    {isGuru && slot.classTarget && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#00609b]/15 text-[#00609b] text-[11px] font-extrabold">
                        {slot.classTarget}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <h4 className="text-[14px] font-bold text-[#191c1e] leading-snug">
                      {slot.subject}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-[#404751]">
                      <span>{isGuru ? `Rombel: ${slot.classTarget || 'XII TKJ 1'}` : `Pengampu: ${slot.teacher}`}</span>
                      <span className="font-medium text-[#707882]">📍 {slot.room}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-[#eceef0] flex items-center justify-between">
                    {isGuru ? (
                      <button
                        type="button"
                        onClick={() => onOpenAbsensiKelas(slot)}
                        className="w-full py-1.5 rounded-xl bg-[#00609b] hover:bg-[#0079c2] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                        <span>Isi Absen Kelas Ini</span>
                      </button>
                    ) : isAdminOrSuper ? (
                      <div className="w-full flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenEditModal(slot)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#c3c7cf] text-[#404751] hover:text-[#00609b] text-[11px] font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSlot(slot.id, slot.subject || 'Mapel')}
                          className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#707882] italic">
                        Presensi dicatat guru pengampu
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
