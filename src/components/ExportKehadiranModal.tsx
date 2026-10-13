import React, { useState } from 'react';
import {
  Student,
  Teacher,
  ExportPeriod,
  ExportBasis,
} from '../types';
import {
  exportMonthlyAttendanceExcel,
  exportQuarterlyAttendanceExcel,
  exportSemesterAttendanceExcel,
  exportClassFullAttendanceExcel,
  exportDailyCheckAttendanceExcel,
  exportByTeacherAttendanceExcel,
} from '../utils/excelHelper';

interface ExportKehadiranModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  defaultPeriod?: ExportPeriod;
  defaultBasis?: ExportBasis;
  onSuccess?: (msg: string) => void;
}

export const ExportKehadiranModal: React.FC<ExportKehadiranModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  defaultPeriod = 'bulanan',
  defaultBasis = 'harian',
  onSuccess,
}) => {
  const [period, setPeriod] = useState<ExportPeriod>(defaultPeriod);
  const [basis, setBasis] = useState<ExportBasis>(defaultBasis);
  const [selectedClass, setSelectedClass] = useState<string>('XII TKJ 1');
  const [selectedMonth, setSelectedMonth] = useState<string>('Oktober');
  const [selectedWeek, setSelectedWeek] = useState<string>('Minggu 2 (8 - 14 Okt)');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Triwulan 2 (Okt - Des)');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || 't-01'
  );
  const [academicYear, setAcademicYear] = useState<string>('2026/2027');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter students by selected class if students have class attribute
  const classStudents = students.filter(
    (s) => !s.kelas || s.kelas === selectedClass
  );
  const targetStudents = classStudents.length > 0 ? classStudents : students;

  const currentTeacher =
    teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const handleDownload = () => {
    setIsExporting(true);

    try {
      if (basis === 'guru') {
        const periodLabel =
          period === 'mingguan'
            ? `${selectedWeek}`
            : period === 'bulanan'
            ? `${selectedMonth} 2026`
            : period === '3bulan'
            ? `${selectedQuarter}`
            : period === 'semester'
            ? `Semester ${selectedSemester} ${academicYear}`
            : `Setahun ${academicYear}`;

        exportByTeacherAttendanceExcel(
          targetStudents,
          selectedClass,
          currentTeacher?.name || 'Guru Pengampu',
          currentTeacher?.subject || 'Mata Pelajaran',
          periodLabel
        );
      } else {
        // Basis: Kehadiran Harian (dicek apakah siswa setidaknya absen 1x per hari)
        if (period === 'mingguan') {
          exportDailyCheckAttendanceExcel(
            targetStudents,
            selectedClass,
            `${selectedWeek} - ${selectedMonth} 2026`
          );
        } else if (period === 'bulanan') {
          exportMonthlyAttendanceExcel(
            targetStudents,
            selectedClass,
            selectedMonth,
            '2026'
          );
        } else if (period === '3bulan') {
          const quarterMonths =
            selectedQuarter.includes('Okt')
              ? ['Oktober', 'November', 'Desember']
              : ['Juli', 'Agustus', 'September'];
          exportQuarterlyAttendanceExcel(
            targetStudents,
            selectedClass,
            quarterMonths,
            '2026'
          );
        } else if (period === 'semester') {
          exportSemesterAttendanceExcel(
            targetStudents,
            selectedClass,
            selectedSemester,
            academicYear
          );
        } else if (period === 'kelas') {
          exportClassFullAttendanceExcel(
            targetStudents,
            selectedClass,
            academicYear
          );
        }
      }

      const msg = `Berhasil mengekspor Rekap Kehadiran (${period.toUpperCase()} - Basis: ${
        basis === 'harian' ? 'Kehadiran Harian (Min 1x Hadir)' : `Guru: ${currentTeacher?.name}`
      }) format .xlsx`;
      onSuccess?.(msg);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengekspor file: ' + (err?.message || 'Terjadi kesalahan sistem'));
      setIsExporting(false);
    }
  };

  // Generate preview filename
  const getPreviewFilename = () => {
    const cleanClass = selectedClass.replace(/\s+/g, '_');
    if (basis === 'guru') {
      const cleanTeacher = (currentTeacher?.name || 'Guru').replace(/[\s,.]+/g, '_');
      const cleanSubject = (currentTeacher?.subject || 'Mapel').replace(/[\s,.]+/g, '_');
      return `REKAP_GURU_${cleanTeacher}_${cleanSubject}_${cleanClass}.xlsx`;
    }
    if (period === 'mingguan') {
      return `REKAP_HARIAN_MINGGUAN_${cleanClass}_2026.xlsx`;
    }
    if (period === 'bulanan') {
      return `REKAP_BULANAN_${cleanClass}_${selectedMonth}_2026.xlsx`;
    }
    if (period === '3bulan') {
      return `REKAP_TRIWULAN_${cleanClass}_2026.xlsx`;
    }
    if (period === 'semester') {
      return `REKAP_SEMESTER_${selectedSemester.toUpperCase()}_${cleanClass}_2026_2027.xlsx`;
    }
    return `REKAP_KELAS_LENGKAP_${cleanClass}_2026_2027.xlsx`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#eceef0] max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#00609b] via-[#0079c2] to-[#0761a2] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                file_download
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-bold truncate">
                Pusat Export Kehadiran Excel (.xlsx)
              </h3>
              <p className="text-[11px] text-[#cfe4ff] truncate">
                SMKN 1 Sorong • Rekap Presensi &amp; Laporan Rombel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-[#191c1e] text-[12px]">
          {/* 1. Pilih Periode */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#404751] block mb-1.5">
              1. Pilih Rentang / Periode Waktu
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setPeriod('mingguan')}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                  period === 'mingguan'
                    ? 'bg-[#cfe4ff]/60 border-[#00609b] text-[#001d34] font-bold shadow-xs'
                    : 'bg-[#f7f9fb] border-[#eceef0] text-[#404751] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="text-[15px] mb-0.5">📅</span>
                <span className="text-[11px]">Mingguan</span>
                <span className="text-[9px] text-[#707882]">6 Hari Efektif</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriod('bulanan')}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                  period === 'bulanan'
                    ? 'bg-[#cfe4ff]/60 border-[#00609b] text-[#001d34] font-bold shadow-xs'
                    : 'bg-[#f7f9fb] border-[#eceef0] text-[#404751] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="text-[15px] mb-0.5">🗓️</span>
                <span className="text-[11px]">Bulanan</span>
                <span className="text-[9px] text-[#707882]">26 Hari Kalender</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriod('3bulan')}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                  period === '3bulan'
                    ? 'bg-[#cfe4ff]/60 border-[#00609b] text-[#001d34] font-bold shadow-xs'
                    : 'bg-[#f7f9fb] border-[#eceef0] text-[#404751] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="text-[15px] mb-0.5">📊</span>
                <span className="text-[11px]">3 Bulan</span>
                <span className="text-[9px] text-[#707882]">Triwulan</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriod('semester')}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all cursor-pointer ${
                  period === 'semester'
                    ? 'bg-[#cfe4ff]/60 border-[#00609b] text-[#001d34] font-bold shadow-xs'
                    : 'bg-[#f7f9fb] border-[#eceef0] text-[#404751] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="text-[15px] mb-0.5">🎓</span>
                <span className="text-[11px]">1 Semester</span>
                <span className="text-[9px] text-[#707882]">6 Bulan Penuh</span>
              </button>

              <button
                type="button"
                onClick={() => setPeriod('kelas')}
                className={`p-2.5 rounded-xl border flex flex-col items-center text-center col-span-2 sm:col-span-1 transition-all cursor-pointer ${
                  period === 'kelas'
                    ? 'bg-[#cfe4ff]/60 border-[#00609b] text-[#001d34] font-bold shadow-xs'
                    : 'bg-[#f7f9fb] border-[#eceef0] text-[#404751] hover:bg-[#f2f4f6]'
                }`}
              >
                <span className="text-[15px] mb-0.5">🏫</span>
                <span className="text-[11px]">1 Kelas</span>
                <span className="text-[9px] text-[#707882]">Rombel Penuh</span>
              </button>
            </div>
          </div>

          {/* 2. Pilih 2 Basis Perhitungan */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#404751] block mb-1.5">
              2. Pilih Basis Perhitungan Kehadiran
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Basis A: Kehadiran Harian */}
              <div
                onClick={() => setBasis('harian')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  basis === 'harian'
                    ? 'bg-emerald-50/70 border-[#006947] ring-2 ring-[#006947]/30'
                    : 'bg-[#f7f9fb] border-[#eceef0] hover:bg-[#f2f4f6]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      basis === 'harian'
                        ? 'border-[#006947] bg-[#006947] text-white'
                        : 'border-[#707882]'
                    }`}
                  >
                    {basis === 'harian' && (
                      <span className="material-symbols-outlined text-[13px]">
                        check
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#191c1e] flex items-center gap-1.5">
                      <span>Kehadiran Harian</span>
                      <span className="text-[9px] bg-[#6ffbbe]/40 text-[#006947] px-1.5 py-0.5 rounded-md font-bold">
                        Minimal 1x Hadir
                      </span>
                    </p>
                    <p className="text-[10px] text-[#404751] mt-0.5 leading-snug">
                      Dicek dari apakah siswa setidaknya absen 1x selama hari tersebut.
                      Jika hadir di minimal satu JP, status harian dianggap hadir (✓).
                    </p>
                  </div>
                </div>
              </div>

              {/* Basis B: Berdasarkan Guru */}
              <div
                onClick={() => setBasis('guru')}
                className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                  basis === 'guru'
                    ? 'bg-sky-50/70 border-[#00609b] ring-2 ring-[#00609b]/30'
                    : 'bg-[#f7f9fb] border-[#eceef0] hover:bg-[#f2f4f6]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      basis === 'guru'
                        ? 'border-[#00609b] bg-[#00609b] text-white'
                        : 'border-[#707882]'
                    }`}
                  >
                    {basis === 'guru' && (
                      <span className="material-symbols-outlined text-[13px]">
                        check
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#191c1e] flex items-center gap-1.5">
                      <span>Berdasarkan Guru</span>
                      <span className="text-[9px] bg-sky-100 text-[#00609b] px-1.5 py-0.5 rounded-md font-bold">
                        Per Mapel/Guru
                      </span>
                    </p>
                    <p className="text-[10px] text-[#404751] mt-0.5 leading-snug">
                      Rekap presensi spesifik per guru pengampu dan mata pelajaran per
                      pertemuan tatap muka (Pertemuan 1 s.d. 16).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Parameter Detail Sesuai Pilihan */}
          <div className="p-3.5 bg-[#f7f9fb] rounded-2xl border border-[#eceef0] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Kelas */}
              <div>
                <label className="text-[10px] font-bold uppercase text-[#404751] block mb-1">
                  Target Kelas / Rombel
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-9 px-3 bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                >
                  <option value="XII TKJ 1">XII TKJ 1 (Teknik Komputer Jaringan)</option>
                  <option value="XII DKV 1">XII DKV 1 (Desain Komunikasi Visual)</option>
                  <option value="XII RPL 1">XII RPL 1 (Rekayasa Perangkat Lunak)</option>
                  <option value="XI TKJ 2">XI TKJ 2 (Teknik Komputer Jaringan)</option>
                  <option value="X PPLG">X PPLG (Pengembangan Perangkat Lunak)</option>
                </select>
              </div>

              {/* Conditional: Teacher Selector if basis === 'guru' */}
              {basis === 'guru' ? (
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#404751] block mb-1">
                    Pilih Guru Pengampu
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full h-9 px-3 bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                /* Detail Periode Waktu */
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#404751] block mb-1">
                    {period === 'mingguan'
                      ? 'Pilihan Minggu'
                      : period === 'bulanan'
                      ? 'Pilihan Bulan'
                      : period === '3bulan'
                      ? 'Pilihan Triwulan'
                      : 'Pilihan Semester'}
                  </label>
                  {period === 'mingguan' && (
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="w-full h-9 px-3 bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                    >
                      <option value="Minggu 1 (1 - 7 Okt)">Minggu 1 (1 - 7 Okt)</option>
                      <option value="Minggu 2 (8 - 14 Okt)">Minggu 2 (8 - 14 Okt)</option>
                      <option value="Minggu 3 (15 - 21 Okt)">Minggu 3 (15 - 21 Okt)</option>
                      <option value="Minggu 4 (22 - 28 Okt)">Minggu 4 (22 - 28 Okt)</option>
                    </select>
                  )}
                  {period === 'bulanan' && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full h-9 px-3 bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                    >
                      <option value="Juli">Juli 2026</option>
                      <option value="Agustus">Agustus 2026</option>
                      <option value="September">September 2026</option>
                      <option value="Oktober">Oktober 2026</option>
                      <option value="November">November 2026</option>
                      <option value="Desember">Desember 2026</option>
                    </select>
                  )}
                  {period === '3bulan' && (
                    <select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      className="w-full h-9 px-3 bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                    >
                      <option value="Triwulan 1 (Jul - Sep)">
                        Triwulan 1: Juli - September 2026
                      </option>
                      <option value="Triwulan 2 (Okt - Des)">
                        Triwulan 2: Oktober - Desember 2026
                      </option>
                    </select>
                  )}
                  {(period === 'semester' || period === 'kelas') && (
                    <div className="flex gap-2">
                      <select
                        value={selectedSemester}
                        onChange={(e) =>
                          setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')
                        }
                        className="flex-1 h-9 px-3 bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                      >
                        <option value="Ganjil">Semester Ganjil</option>
                        <option value="Genap">Semester Genap</option>
                      </select>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-24 h-9 px-2 text-center bg-white rounded-xl text-[12px] font-semibold text-[#191c1e] border border-[#eceef0] focus:ring-2 focus:ring-[#00609b] outline-hidden"
                        title="Tahun Ajaran"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional info when basis === 'guru' */}
            {basis === 'guru' && (
              <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200 text-[11px] text-[#00487a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#00609b]">
                    badge
                  </span>
                  <span>
                    <strong>NIP:</strong> {currentTeacher?.nip || '-'} •{' '}
                    <strong>Mapel:</strong> {currentTeacher?.subject || '-'}
                  </span>
                </div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-[#00609b] border border-sky-200">
                  16 Pertemuan
                </span>
              </div>
            )}
          </div>

          {/* 4. Preview File Box */}
          <div className="p-3 bg-white rounded-2xl border border-dashed border-[#00609b]/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[14px] shrink-0">
                📊
              </span>
              <div className="min-w-0">
                <p className="text-[10px] text-[#707882] font-semibold uppercase">
                  Target Berkas Excel:
                </p>
                <p className="text-[12px] font-mono font-bold text-[#00609b] truncate">
                  {getPreviewFilename()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-[#6ffbbe]/30 text-[#006947] px-2 py-1 rounded-lg shrink-0">
              {targetStudents.length} Siswa Terdaftar
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#f7f9fb] border-t border-[#eceef0] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#c3c7cf] text-[#404751] text-[12px] font-bold hover:bg-[#eceef0] transition-all cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownload}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00609b] to-[#0761a2] text-white text-[12px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,96,155,0.25)] hover:opacity-95 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isExporting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Mengekspor Excel...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">
                  download
                </span>
                <span>Unduh Berkas Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
