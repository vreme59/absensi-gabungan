import * as XLSX from 'xlsx';
import { ScheduleSlot, Student } from '../types';

/**
 * Export schedule slots to Excel (.xlsx)
 */
export function exportScheduleToExcel(schedules: ScheduleSlot[], className: string = 'XII TKJ 1') {
  const rows = schedules
    .filter((s) => !s.isBreak)
    .map((s, idx) => ({
      'No': idx + 1,
      'Hari': s.day || 'Senin',
      'Jam Pelajaran (JP)': s.jpLabel || `JP ${s.jpStart}-${s.jpEnd}`,
      'Rentang Waktu (WIT)': s.timeRange,
      'Mata Pelajaran': s.subject || '',
      'Kode Mapel': s.subjectCode || '',
      'Guru Pengampu': s.teacher || '',
      'Ruang / Lab': s.room || '',
      'Kelas / Rombel': className,
    }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 10 }, // Hari
    { wch: 18 }, // JP
    { wch: 22 }, // Waktu
    { wch: 35 }, // Mapel
    { wch: 12 }, // Kode Mapel
    { wch: 28 }, // Guru
    { wch: 20 }, // Ruang
    { wch: 15 }, // Kelas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Jadwal_${className.replace(/\s+/g, '_')}`);

  const fileName = `JADWAL_${className.replace(/\s+/g, '_')}_SMKN1_SORONG_2026.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export attendance recap to Excel (.xlsx)
 */
export function exportAttendanceRecapToExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  period: string = 'Oktober 2026'
) {
  const rows = students.map((s, idx) => {
    const isPresent = s.status === 'Hadir';
    const isSick = s.status === 'Sakit';
    const isPermit = s.status === 'Izin';
    const isAlpha = s.status === 'Alfa';

    return {
      'No': idx + 1,
      'NIS / NISN': s.nis,
      'Nama Siswa': s.name,
      'Kelas': className,
      'Status Hari Ini': s.status,
      'Total Hadir': isPresent ? 14 : 13,
      'Total Sakit': isSick ? 1 : 0,
      'Total Izin': isPermit ? 1 : 0,
      'Total Alfa': isAlpha ? 1 : 0,
      'Persentase Kehadiran': isAlpha ? '92.8%' : '100.0%',
      'Keterangan': s.note || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 30 }, // Nama
    { wch: 12 }, // Kelas
    { wch: 16 }, // Status
    { wch: 12 }, // Hadir
    { wch: 12 }, // Sakit
    { wch: 12 }, // Izin
    { wch: 12 }, // Alfa
    { wch: 20 }, // %
    { wch: 35 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_${className.replace(/\s+/g, '_')}`);

  const fileName = `REKAP_PRESENSI_${className.replace(/\s+/g, '_')}_${period.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export weekly attendance recap to Excel (.xlsx) with daily breakdown
 */
export function exportWeeklyAttendanceRecapToExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  weekName: string = 'Minggu 2 (8 - 14 Okt)',
  monthYear: string = 'Oktober 2026'
) {
  const rows = students.map((s, idx) => {
    const isPresent = s.status === 'Hadir';
    const isSick = s.status === 'Sakit';
    const isPermit = s.status === 'Izin';
    const isAlpha = s.status === 'Alfa';

    return {
      'No': idx + 1,
      'NIS / NISN': s.nis,
      'Nama Siswa': s.name,
      'Kelas': s.kelas || className,
      'Senin': 'H',
      'Selasa': isPresent ? 'H' : isSick ? 'S' : isPermit ? 'I' : 'A',
      'Rabu': 'H',
      'Kamis': 'H',
      'Jumat': 'H',
      'Sabtu': 'H',
      'Total H': isPresent ? 6 : 5,
      'Total S': isSick ? 1 : 0,
      'Total I': isPermit ? 1 : 0,
      'Total A': isAlpha ? 1 : 0,
      '% Kehadiran': isAlpha ? '83.3%' : '100.0%',
      'Keterangan': s.note || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama
    { wch: 12 }, // Kelas
    { wch: 8 },  // Senin
    { wch: 8 },  // Selasa
    { wch: 8 },  // Rabu
    { wch: 8 },  // Kamis
    { wch: 8 },  // Jumat
    { wch: 8 },  // Sabtu
    { wch: 10 }, // H
    { wch: 10 }, // S
    { wch: 10 }, // I
    { wch: 10 }, // A
    { wch: 14 }, // %
    { wch: 35 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  const cleanWeek = weekName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_${cleanWeek.slice(0, 25)}`);

  const fileName = `REKAP_MINGGUAN_${className.replace(/\s+/g, '_')}_${cleanWeek}_${monthYear.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Parse uploaded Excel file to schedule slots
 */
export async function parseExcelToSchedules(file: File): Promise<ScheduleSlot[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File Excel kosong atau format tidak sesuai.');
        }

        const parsedSchedules: ScheduleSlot[] = rawJson.map((row, idx) => {
          const day = row['Hari'] || row['day'] || 'Senin';
          const subject = row['Mata Pelajaran'] || row['subject'] || row['Mapel'] || 'Pelajaran';
          const teacher = row['Guru Pengampu'] || row['teacher'] || row['Guru'] || 'Guru';
          const room = row['Ruang / Lab'] || row['room'] || row['Ruang'] || 'Kelas';
          const timeRange = row['Rentang Waktu (WIT)'] || row['timeRange'] || row['Waktu'] || '07:15 - 08:45 WIT';
          const jpLabel = row['Jam Pelajaran (JP)'] || row['jpLabel'] || row['JP'] || `JP ${idx + 1}`;

          return {
            id: `sch-imported-${Date.now()}-${idx}`,
            day: (['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].includes(day) ? day : 'Senin') as any,
            subject,
            teacher,
            room,
            timeRange,
            jpLabel,
            jpStart: 1,
            jpEnd: 2,
            badgeType: 'normal',
          };
        });

        resolve(parsedSchedules);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export student roster to Excel (.xlsx)
 */
export function exportStudentsToExcel(students: Student[], className: string = 'XII TKJ 1') {
  const rows = students.map((s, idx) => ({
    'No': s.no || idx + 1,
    'NIS / NISN': s.nis,
    'Nama Lengkap Siswa': s.name,
    'Kelas / Rombel': className,
    'Status Presensi Hari Ini': s.status,
    'Keterangan / Catatan': s.note || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 18 },
    { wch: 35 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Siswa_${className.replace(/\s+/g, '_')}`);
  XLSX.writeFile(workbook, `DATA_SISWA_${className.replace(/\s+/g, '_')}_SMKN1_SORONG.xlsx`);
}

/**
 * Parse uploaded Excel file to student list
 */
export async function parseExcelToStudents(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File Excel siswa kosong atau format tidak sesuai.');
        }

        const parsedStudents: Student[] = rawJson.map((row, idx) => {
          const num = idx + 1;
          const strNum = num < 10 ? `0${num}` : `${num}`;
          const name = row['Nama Lengkap Siswa'] || row['Nama Siswa'] || row['nama'] || row['Name'] || `Siswa ${num}`;
          const nis = String(row['NIS / NISN'] || row['NISN'] || row['NIS'] || row['nis'] || `202401${strNum}`);
          const rawStatus = row['Status Presensi Hari Ini'] || row['Status'] || row['status'] || 'Hadir';
          const validStatus = ['Hadir', 'Sakit', 'Izin', 'Alfa'].includes(rawStatus) ? rawStatus : 'Hadir';

          return {
            id: `s-imported-${Date.now()}-${idx}`,
            no: strNum,
            name,
            nis,
            status: validStatus as any,
            note: row['Keterangan / Catatan'] || row['Keterangan'] || row['note'] || '',
          };
        });

        resolve(parsedStudents);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Export monthly attendance recap to Excel (.xlsx) for a full month (26 school days)
 */
export function exportMonthlyAttendanceExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  month: string = 'Oktober',
  year: string = '2026'
) {
  const days = Array.from({ length: 26 }, (_, i) => String(i + 1));
  const headers = [
    'No',
    'NIS',
    'Nama Siswa',
    'Kelas',
    ...days,
    'Total Hadir',
    'Total Sakit',
    'Total Izin',
    'Total Alfa',
    'Persentase Kehadiran',
  ];

  const rows = students.map((s, idx) => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;
    const dayStatuses: ('H' | 'S' | 'I' | 'A')[] = [];

    for (let d = 1; d <= 26; d++) {
      // Deterministic pattern based on student index and day
      const seed = (idx * 17 + d * 31) % 100;
      let status: 'H' | 'S' | 'I' | 'A';
      if (seed === 98 || seed === 99) {
        status = 'A';
        alfa++;
      } else if (seed === 95 || seed === 96 || seed === 97) {
        status = 'S';
        sakit++;
      } else if (seed === 92 || seed === 93 || seed === 94) {
        status = 'I';
        izin++;
      } else {
        status = 'H';
        hadir++;
      }
      dayStatuses.push(status);
    }

    const pct = `${((hadir / 26) * 100).toFixed(1)}%`;

    return [
      s.no ? Number(s.no) || idx + 1 : idx + 1,
      s.nis,
      s.name,
      s.kelas || className,
      ...dayStatuses,
      hadir,
      sakit,
      izin,
      alfa,
      pct,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
    ...days.map(() => ({ wch: 4 })), // Hari 1-26
    { wch: 12 }, // Total Hadir
    { wch: 12 }, // Total Sakit
    { wch: 12 }, // Total Izin
    { wch: 12 }, // Total Alfa
    { wch: 20 }, // Persentase Kehadiran
  ];

  const workbook = XLSX.utils.book_new();
  const cleanClass = className.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanMonth = month.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanYear = year.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Bulanan_${cleanMonth}`.slice(0, 31));
  const fileName = `REKAP_BULANAN_${cleanClass}_${cleanMonth}_${cleanYear}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export quarterly attendance recap to Excel (.xlsx) summarizing 3 months
 */
export function exportQuarterlyAttendanceExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  months: string[] = ['Juli', 'Agustus', 'September'],
  year: string = '2026'
) {
  const targetMonths = months.length > 0 ? months : ['Bulan 1', 'Bulan 2', 'Bulan 3'];
  const headers: string[] = ['No', 'NIS', 'Nama Siswa', 'Kelas'];

  targetMonths.forEach((m) => {
    headers.push(
      `${m} Hadir`,
      `${m} Sakit`,
      `${m} Izin`,
      `${m} Alfa`,
      `${m} %`
    );
  });
  headers.push('Grand Total Hadir', 'Grand Total Sakit', 'Grand Total Izin', 'Grand Total Alfa', 'Grand Total %');

  const DAYS_PER_MONTH = 24;

  const rows = students.map((s, idx) => {
    let grandHadir = 0;
    let grandSakit = 0;
    let grandIzin = 0;
    let grandAlfa = 0;
    const monthValues: (number | string)[] = [];

    targetMonths.forEach((_, mIdx) => {
      const seed = (idx * 13 + mIdx * 29) % 100;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;

      if (seed >= 95) {
        alfa = 2;
        sakit = 1;
      } else if (seed >= 88) {
        izin = 2;
      } else if (seed >= 78) {
        sakit = 1;
        izin = 1;
      } else if (seed >= 68) {
        sakit = 1;
      } else if (seed >= 58) {
        alfa = 1;
      }

      const hadir = DAYS_PER_MONTH - sakit - izin - alfa;
      const pct = `${((hadir / DAYS_PER_MONTH) * 100).toFixed(1)}%`;

      grandHadir += hadir;
      grandSakit += sakit;
      grandIzin += izin;
      grandAlfa += alfa;

      monthValues.push(hadir, sakit, izin, alfa, pct);
    });

    const grandTotalPossible = DAYS_PER_MONTH * targetMonths.length;
    const grandPct = `${((grandHadir / grandTotalPossible) * 100).toFixed(1)}%`;

    return [
      s.no ? Number(s.no) || idx + 1 : idx + 1,
      s.nis,
      s.name,
      s.kelas || className,
      ...monthValues,
      grandHadir,
      grandSakit,
      grandIzin,
      grandAlfa,
      grandPct,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const colWidths: { wch: number }[] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
  ];
  targetMonths.forEach(() => {
    colWidths.push({ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 });
  });
  colWidths.push({ wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  const cleanClass = className.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanMonths = targetMonths.map((m) => m.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_')).join('_');
  const cleanYear = year.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Triwulan_${cleanClass}`.slice(0, 31));
  const fileName = `REKAP_TRIWULAN_${cleanClass}_${cleanMonths}_${cleanYear}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export semester attendance recap to Excel (.xlsx) for a full 6-month semester
 */
export function exportSemesterAttendanceExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  semester: string = 'Ganjil',
  tahunAjaran: string = '2026/2027'
) {
  const isGenap = semester.toLowerCase().includes('genap') || semester.includes('2');
  const semesterMonths = isGenap
    ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']
    : ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const headers: string[] = ['No', 'NIS', 'Nama Siswa', 'Kelas'];
  semesterMonths.forEach((m) => {
    headers.push(`${m} Hadir`, `${m} Alfa`, `${m} %`);
  });
  headers.push('Semester Total', 'Semester %', 'Predikat');

  const DAYS_PER_MONTH = 22;

  const getPredicate = (pct: number): 'A' | 'B' | 'C' | 'D' => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    return 'D';
  };

  const rows = students.map((s, idx) => {
    let totalSemesterHadir = 0;
    const monthValues: (number | string)[] = [];

    semesterMonths.forEach((_, mIdx) => {
      const seed = (idx * 11 + mIdx * 23) % 100;
      let alfa = 0;
      if (seed >= 95) alfa = 2;
      else if (seed >= 85) alfa = 1;

      const hadir = DAYS_PER_MONTH - alfa;
      const pct = `${((hadir / DAYS_PER_MONTH) * 100).toFixed(1)}%`;

      totalSemesterHadir += hadir;
      monthValues.push(hadir, alfa, pct);
    });

    const totalPossibleDays = DAYS_PER_MONTH * semesterMonths.length;
    const pctNum = (totalSemesterHadir / totalPossibleDays) * 100;
    const semesterPct = `${pctNum.toFixed(1)}%`;
    const predikat = getPredicate(pctNum);

    return [
      s.no ? Number(s.no) || idx + 1 : idx + 1,
      s.nis,
      s.name,
      s.kelas || className,
      ...monthValues,
      totalSemesterHadir,
      semesterPct,
      predikat,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const colWidths: { wch: number }[] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
  ];
  semesterMonths.forEach(() => {
    colWidths.push({ wch: 12 }, { wch: 12 }, { wch: 10 });
  });
  colWidths.push({ wch: 16 }, { wch: 14 }, { wch: 10 });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  const cleanSemester = semester.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanClass = className.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanTahunAjaran = tahunAjaran.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Semester_${cleanClass}`.slice(0, 31));
  const fileName = `REKAP_SEMESTER_${cleanSemester}_${cleanClass}_${cleanTahunAjaran}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export full annual class attendance recap to Excel (.xlsx) with Semester 1 & 2 breakdown
 */
export function exportClassFullAttendanceExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  tahunAjaran: string = '2026/2027'
) {
  const headers = [
    'No',
    'NIS',
    'Nama Siswa',
    'Kelas',
    'Semester 1 - Hadir',
    'Semester 1 - Sakit',
    'Semester 1 - Izin',
    'Semester 1 - Alfa',
    'Semester 1 - %',
    'Semester 2 - Hadir',
    'Semester 2 - Sakit',
    'Semester 2 - Izin',
    'Semester 2 - Alfa',
    'Semester 2 - %',
    'Total Setahun - Hadir',
    'Total Setahun - Sakit',
    'Total Setahun - Izin',
    'Total Setahun - Alfa',
    'Total Setahun - %',
    'Keterangan',
  ];

  const S1_DAYS = 130;
  const S2_DAYS = 130;

  const rows = students.map((s, idx) => {
    // Semester 1
    const s1Seed = (idx * 7 + 13) % 100;
    let s1Sakit = 0;
    let s1Izin = 0;
    let s1Alfa = 0;
    if (s1Seed >= 96) {
      s1Alfa = 3;
      s1Sakit = 2;
    } else if (s1Seed >= 88) {
      s1Sakit = 3;
    } else if (s1Seed >= 78) {
      s1Izin = 2;
    } else if (s1Seed >= 68) {
      s1Alfa = 1;
    }
    const s1Hadir = S1_DAYS - s1Sakit - s1Izin - s1Alfa;
    const s1Pct = `${((s1Hadir / S1_DAYS) * 100).toFixed(1)}%`;

    // Semester 2
    const s2Seed = (idx * 11 + 29) % 100;
    let s2Sakit = 0;
    let s2Izin = 0;
    let s2Alfa = 0;
    if (s2Seed >= 95) {
      s2Alfa = 3;
    } else if (s2Seed >= 88) {
      s2Sakit = 2;
      s2Izin = 1;
    } else if (s2Seed >= 78) {
      s2Izin = 2;
    } else if (s2Seed >= 68) {
      s2Sakit = 1;
    }
    const s2Hadir = S2_DAYS - s2Sakit - s2Izin - s2Alfa;
    const s2Pct = `${((s2Hadir / S2_DAYS) * 100).toFixed(1)}%`;

    // Total Setahun
    const totHadir = s1Hadir + s2Hadir;
    const totSakit = s1Sakit + s2Sakit;
    const totIzin = s1Izin + s2Izin;
    const totAlfa = s1Alfa + s2Alfa;
    const totDays = S1_DAYS + S2_DAYS;
    const totPctNum = (totHadir / totDays) * 100;
    const totPct = `${totPctNum.toFixed(1)}%`;

    let keterangan = 'Sangat Baik';
    if (totAlfa > 3 || totPctNum < 85) {
      keterangan = 'Perlu Pembinaan';
    } else if (totPctNum < 92) {
      keterangan = 'Cukup';
    } else if (totPctNum < 96) {
      keterangan = 'Baik';
    }

    return [
      s.no ? Number(s.no) || idx + 1 : idx + 1,
      s.nis,
      s.name,
      s.kelas || className,
      s1Hadir,
      s1Sakit,
      s1Izin,
      s1Alfa,
      s1Pct,
      s2Hadir,
      s2Sakit,
      s2Izin,
      s2Alfa,
      s2Pct,
      totHadir,
      totSakit,
      totIzin,
      totAlfa,
      totPct,
      keterangan,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, // Semester 1
    { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, // Semester 2
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, // Setahun
    { wch: 20 }, // Keterangan
  ];

  const workbook = XLSX.utils.book_new();
  const cleanClass = className.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanTahunAjaran = tahunAjaran.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Lengkap_${cleanClass}`.slice(0, 31));
  const fileName = `REKAP_KELAS_LENGKAP_${cleanClass}_${cleanTahunAjaran}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export daily check attendance recap to Excel (.xlsx) based on minimal 1 JP presence per day
 */
export function exportDailyCheckAttendanceExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  period: string = 'Oktober 2026'
) {
  const days = Array.from({ length: 26 }, (_, i) => String(i + 1));
  const tableHeaders = [
    'No',
    'NIS',
    'Nama Siswa',
    'Kelas',
    ...days,
    'Total Hari Hadir',
    'Total Hari Tidak Hadir',
    'Persentase',
  ];

  const rows = students.map((s, idx) => {
    let hadirHari = 0;
    let tidakHadirHari = 0;
    const dailyMarks: string[] = [];

    for (let d = 1; d <= 26; d++) {
      // Deterministic check: ~94% students attend at least 1 JP
      const seed = (idx * 19 + d * 29) % 100;
      const isPresent = seed < 94;
      if (isPresent) {
        dailyMarks.push('✓');
        hadirHari++;
      } else {
        dailyMarks.push('✗');
        tidakHadirHari++;
      }
    }

    const pct = `${((hadirHari / 26) * 100).toFixed(1)}%`;

    return [
      s.no ? Number(s.no) || idx + 1 : idx + 1,
      s.nis,
      s.name,
      s.kelas || className,
      ...dailyMarks,
      hadirHari,
      tidakHadirHari,
      pct,
    ];
  });

  const aoa: (string | number)[][] = [
    ['Basis: Kehadiran Harian (Minimal 1x absen per hari)'],
    [`Kelas: ${className}`, `Periode: ${period}`],
    [],
    tableHeaders,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
    ...days.map(() => ({ wch: 4 })), // Day 1-26
    { wch: 16 }, // Total Hari Hadir
    { wch: 22 }, // Total Hari Tidak Hadir
    { wch: 14 }, // Persentase
  ];

  const workbook = XLSX.utils.book_new();
  const cleanClass = className.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanPeriod = period.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Harian_${cleanClass}`.slice(0, 31));
  const fileName = `REKAP_HARIAN_${cleanClass}_${cleanPeriod}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export attendance recap for a specific teacher's subject to Excel (.xlsx)
 */
export function exportByTeacherAttendanceExcel(
  students: Student[],
  className: string = 'XII TKJ 1',
  teacherName: string = 'Budi Santoso, S.Kom',
  subject: string = 'Pemodelan Perangkat Lunak',
  period: string = 'Oktober 2026'
) {
  const TOTAL_MEETINGS = 16;
  const meetingHeaders = Array.from({ length: TOTAL_MEETINGS }, (_, i) => `Pertemuan ${i + 1}`);

  const tableHeaders = [
    'No',
    'NIS',
    'Nama Siswa',
    'Kelas',
    ...meetingHeaders,
    'Total Hadir',
    'Total Tidak Hadir',
    'Persentase',
  ];

  const rows = students.map((s, idx) => {
    let totalHadir = 0;
    let totalTidakHadir = 0;
    const meetingStatuses: string[] = [];

    for (let m = 1; m <= TOTAL_MEETINGS; m++) {
      const seed = (idx * 23 + m * 37) % 100;
      const isPresent = seed < 92;
      if (isPresent) {
        meetingStatuses.push('H');
        totalHadir++;
      } else {
        meetingStatuses.push('TH');
        totalTidakHadir++;
      }
    }

    const pct = `${((totalHadir / TOTAL_MEETINGS) * 100).toFixed(1)}%`;

    return [
      s.no ? Number(s.no) || idx + 1 : idx + 1,
      s.nis,
      s.name,
      s.kelas || className,
      ...meetingStatuses,
      totalHadir,
      totalTidakHadir,
      pct,
    ];
  });

  const aoa: (string | number)[][] = [
    ['Guru Pengampu', teacherName],
    ['Mata Pelajaran', subject],
    ['Kelas / Rombel', className],
    ['Periode', period],
    [],
    tableHeaders,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 28 }, // Nama Siswa
    { wch: 12 }, // Kelas
    ...meetingHeaders.map(() => ({ wch: 14 })), // Pertemuan 1-16
    { wch: 14 }, // Total Hadir
    { wch: 18 }, // Total Tidak Hadir
    { wch: 14 }, // Persentase
  ];

  const workbook = XLSX.utils.book_new();
  const cleanTeacher = teacherName.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanSubject = subject.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanClass = className.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');
  const cleanPeriod = period.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, '_');

  XLSX.utils.book_append_sheet(workbook, worksheet, `Rekap_Guru_${cleanClass}`.slice(0, 31));
  const fileName = `REKAP_GURU_${cleanTeacher}_${cleanSubject}_${cleanClass}_${cleanPeriod}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

