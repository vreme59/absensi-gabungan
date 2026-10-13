export type UserRole = 'siswa' | 'sekretaris' | 'guru' | 'wali_kelas' | 'guru_piket' | 'operator' | 'admin' | 'superadmin';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  identifier: string;
  classRoom?: string;
  homeroomTeacher?: string;
  avatarUrl: string;
  nipOrNisnLabel: string;
  isAtSchool: boolean;
  attendanceRate: number;
  streakDays: number;
  phone?: string;
  kelas_id?: string;
  kelas?: { id: string; nama: string };
  is_wali_kelas?: boolean;
  wali_kelas?: { id: string; nama: string };
  is_guru_piket?: boolean;
}

export interface ScheduleItem {
  id: string;
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  teacherNip?: string;
  room: string;
  status: 'completed' | 'live' | 'upcoming' | 'last_period';
  isBreak?: boolean;
  breakDuration?: string;
  progressMinutes?: number;
  remainingMinutes?: number;
}

export interface StudentAttendance {
  id: string;
  name: string;
  studentNo: string;
  nisn: string;
  avatarUrl: string;
  morningStatus: 'hadir' | 'sakit' | 'izin' | 'alfa';
  morningCheckInTime?: string;
  note?: string;
  subjectStatus: 'hadir' | 'bolos' | 'dispensasi';
  attachmentUrl?: string;
}

export interface ClassAttendanceSummary {
  className: string;
  totalStudents: number;
  present: number;
  sick: number;
  permitted: number;
  unexcused: number;
  validationStatus: 'draft' | 'menunggu_acc' | 'tervalidasi';
  validatedBy?: string;
  validatedAt?: string;
}

export interface TeacherCallAlert {
  id: string;
  className: string;
  subject: string;
  room: string;
  timestamp: string;
  message: string;
  teacherName: string;
  isActive: boolean;
  statusResponse?: 'menuju_kelas' | 'tugas_mandiri' | 'pending';
}

// ─── ADMIN & SUPERADMIN TYPES (FROM UI-SEKOLAH) ───
export type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

export interface Student {
  id: string;
  no: string;
  name: string;
  nis: string;
  status: AttendanceStatus;
  kelas?: string;
  note?: string;
  hasAttachment?: boolean;
  attachmentTitle?: string;
  attachmentType?: 'medical' | 'dispensation';
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  subject: string;
  room?: string;
}

export interface ScheduleSlot {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  isBreak?: boolean;
  breakTitle?: string;
  breakSubtitle?: string;
  breakDuration?: string;
  breakIcon?: string;
  breakColor?: 'amber' | 'emerald';
  jpStart?: number;
  jpEnd?: number;
  jpLabel?: string;
  timeRange: string;
  subject?: string;
  subjectCode?: string;
  teacher?: string;
  room?: string;
  badgeType?: 'live' | 'upcoming' | 'normal' | 'break';
  statusPresensi?: 'Hadir' | 'Belum' | 'Menunggu';
  recordedTime?: string;
  classTarget?: string;
  teacherNip?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'attendance' | 'schedule' | 'broadcast';
  targetAudience?: 'semua' | 'guru' | 'siswa';
}

// ─── Export Kehadiran Types ───
export type ExportPeriod = 'mingguan' | 'bulanan' | '3bulan' | 'semester' | 'kelas';
export type ExportBasis = 'harian' | 'guru';

export interface ExportConfig {
  period: ExportPeriod;
  basis: ExportBasis;
  kelas: string;
  guruId?: string;
  guruName?: string;
  startDate?: string;
  endDate?: string;
  semester?: 'ganjil' | 'genap';
  tahunAjaran?: string;
}

// ─── Login Security Types ───
export interface LoginAttempt {
  timestamp: string;
  username: string;
  success: boolean;
  userAgent?: string;
}

export interface SecurityConfig {
  maxAttempts: number;
  lockoutDurations: Record<number, number>;
  captchaThreshold: number;
}

