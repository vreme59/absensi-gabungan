// src/utils/perangkatKelasManager.ts
// Modul Pengelolaan Perangkat Kelas (Sekretaris, Ketua Kelas, dan Mandat Darurat Wali Kelas)

export interface PerangkatKelasConfig {
  kelasId: string;
  sekretarisId: string | null;
  sekretarisNama: string;
  sekretaris2Id?: string | null;
  sekretaris2Nama?: string;
  ketuaKelasId: string | null;
  ketuaKelasNama: string;
  // Mandat darurat hari ini oleh wali kelas jika sekretaris & ketua absen
  mandatSiswaId: string | null;
  mandatSiswaNama: string;
  mandatTanggal: string | null; // YYYY-MM-DD
  mandatCatatan?: string;
  updatedAt?: string;
}

export interface WewenangPengabsenResult {
  canInputAttendance: boolean;
  officerRole: 'sekretaris' | 'sekretaris_2' | 'ketua_kelas' | 'mandat_wali' | 'siswa_biasa';
  activeOfficerId: string | null;
  activeOfficerName: string;
  officerTitle: string;
  officerReason: string;
  hierarchyStep: 1 | 2 | 3 | 4; // 1: Sekretaris, 2: Ketua Kelas / Sekr 2, 3: Mandat Wali, 4: Guru Mapel
  isDelegated: boolean;
  sekretarisAbsent: boolean;
  ketuaAbsent: boolean;
}

const STORAGE_PREFIX = 'smkn1_perangkat_kelas_';

export function getPerangkatKelas(
  kelasId: string,
  defaultStudents?: { id: string; nama: string }[]
): PerangkatKelasConfig {
  if (!kelasId) {
    return {
      kelasId: '',
      sekretarisId: null,
      sekretarisNama: '',
      sekretaris2Id: null,
      sekretaris2Nama: '',
      ketuaKelasId: null,
      ketuaKelasNama: '',
      mandatSiswaId: null,
      mandatSiswaNama: '',
      mandatTanggal: null,
    };
  }

  const raw = localStorage.getItem(`${STORAGE_PREFIX}${kelasId}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      console.error('Error parsing perangkat kelas:', e);
    }
  }

  // Fallback defaults jika belum diset oleh wali kelas
  let defaultKetuaId = null;
  let defaultKetuaNama = '';
  let defaultSekretarisId = null;
  let defaultSekretarisNama = '';
  let defaultSekretaris2Id = null;
  let defaultSekretaris2Nama = '';

  if (defaultStudents && defaultStudents.length > 0) {
    // Default Ketua Kelas: Siswa 1
    defaultKetuaId = defaultStudents[0].id;
    defaultKetuaNama = defaultStudents[0].nama;

    // Default Sekretaris 1: Siswa 2
    if (defaultStudents.length > 1) {
      defaultSekretarisId = defaultStudents[1].id;
      defaultSekretarisNama = defaultStudents[1].nama;
    } else {
      defaultSekretarisId = defaultStudents[0].id;
      defaultSekretarisNama = defaultStudents[0].nama;
    }

    // Default Sekretaris 2: Siswa 3
    if (defaultStudents.length > 2) {
      defaultSekretaris2Id = defaultStudents[2].id;
      defaultSekretaris2Nama = defaultStudents[2].nama;
    }
  }

  const initialConfig: PerangkatKelasConfig = {
    kelasId,
    sekretarisId: defaultSekretarisId,
    sekretarisNama: defaultSekretarisNama,
    sekretaris2Id: defaultSekretaris2Id,
    sekretaris2Nama: defaultSekretaris2Nama,
    ketuaKelasId: defaultKetuaId,
    ketuaKelasNama: defaultKetuaNama,
    mandatSiswaId: null,
    mandatSiswaNama: '',
    mandatTanggal: null,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${STORAGE_PREFIX}${kelasId}`, JSON.stringify(initialConfig));
  return initialConfig;
}

export function savePerangkatKelas(config: PerangkatKelasConfig): void {
  if (!config.kelasId) return;
  config.updatedAt = new Date().toISOString();
  localStorage.setItem(`${STORAGE_PREFIX}${config.kelasId}`, JSON.stringify(config));
}

export function setMandatHariIni(
  kelasId: string,
  siswaId: string | null,
  siswaNama: string | null,
  catatan?: string
): PerangkatKelasConfig {
  const current = getPerangkatKelas(kelasId);
  const todayStr = new Date().toISOString().split('T')[0];

  const updated: PerangkatKelasConfig = {
    ...current,
    mandatSiswaId: siswaId,
    mandatSiswaNama: siswaNama || '',
    mandatTanggal: siswaId ? todayStr : null,
    mandatCatatan: catatan || '',
    updatedAt: new Date().toISOString(),
  };

  savePerangkatKelas(updated);
  return updated;
}

/**
 * Menghitung siapa yang saat ini berhak dan bertugas mengabsen kelas
 * berdasarkan alur hierarki:
 * 1. Sekretaris Kelas (Default)
 * 2. Ketua Kelas (Jika Sekretaris Sakit/Izin/Alfa/Bolos)
 * 3. Siswa Mandat Khusus Wali Kelas (Jika Sekretaris & Ketua Keduanya Berhalangan)
 * 4. Guru Mapel (Jika belum ada yang mengabsen)
 */
export function getWewenangPengabsenHariIni(
  kelasId: string,
  currentUserId: string,
  todayAttendanceStatusMap: Record<string, string> = {},
  defaultStudents?: { id: string; nama: string }[]
): WewenangPengabsenResult {
  const config = getPerangkatKelas(kelasId, defaultStudents);
  const todayStr = new Date().toISOString().split('T')[0];

  const { sekretarisId, sekretarisNama, ketuaKelasId, ketuaKelasNama, mandatSiswaId, mandatSiswaNama, mandatTanggal } = config;

  // Cek kehadiran Sekretaris hari ini
  const sekStatus = sekretarisId ? todayAttendanceStatusMap[sekretarisId] : undefined;
  const isSekretarisAbsent = sekStatus === 'S' || sekStatus === 'I' || sekStatus === 'A' || sekStatus === 'B' || sekStatus === 'Sakit' || sekStatus === 'Izin' || sekStatus === 'Alfa' || sekStatus === 'Bolos';

  // Cek kehadiran Ketua Kelas hari ini
  const ketuaStatus = ketuaKelasId ? todayAttendanceStatusMap[ketuaKelasId] : undefined;
  const isKetuaAbsent = ketuaStatus === 'S' || ketuaStatus === 'I' || ketuaStatus === 'A' || ketuaStatus === 'B' || ketuaStatus === 'Sakit' || ketuaStatus === 'Izin' || ketuaStatus === 'Alfa' || ketuaStatus === 'Bolos';

  // Cek apakah ada mandat khusus aktif hari ini
  const isMandatActive = Boolean(mandatSiswaId && mandatTanggal === todayStr);

  // TINGKAT 1: SEKRETARIS KELAS (Hadir / Belum ada info absen)
  if (sekretarisId && !isSekretarisAbsent) {
    const isMe = currentUserId === sekretarisId;
    return {
      canInputAttendance: isMe,
      officerRole: isMe ? 'sekretaris' : 'siswa_biasa',
      activeOfficerId: sekretarisId,
      activeOfficerName: sekretarisNama || 'Sekretaris Kelas',
      officerTitle: 'Sekretaris Kelas',
      officerReason: isMe
        ? 'Anda ditugaskan sebagai Sekretaris Kelas untuk mengisi presensi pagi ini.'
        : `Presensi harian diisi oleh ${sekretarisNama || 'Sekretaris Kelas'}.`,
      hierarchyStep: 1,
      isDelegated: false,
      sekretarisAbsent: false,
      ketuaAbsent: false,
    };
  }

  // TINGKAT 2: KETUA KELAS (Menggantikan Sekretaris yang tidak masuk)
  if (ketuaKelasId && !isKetuaAbsent) {
    const isMe = currentUserId === ketuaKelasId;
    return {
      canInputAttendance: isMe,
      officerRole: isMe ? 'ketua_kelas' : 'siswa_biasa',
      activeOfficerId: ketuaKelasId,
      activeOfficerName: ketuaKelasNama || 'Ketua Kelas',
      officerTitle: 'Ketua Kelas (Pengganti)',
      officerReason: isMe
        ? '⚠️ Sekretaris Kelas berhalangan hadir. Sebagai Ketua Kelas, wewenang pengisian presensi pagi dialihkan kepada Anda.'
        : `Sekretaris Kelas tidak hadir. Presensi diambil alih oleh Ketua Kelas (${ketuaKelasNama}).`,
      hierarchyStep: 2,
      isDelegated: true,
      sekretarisAbsent: true,
      ketuaAbsent: false,
    };
  }

  // TINGKAT 3: SISWA MANDAT KHUSUS DARI WALI KELAS (Jika Sekretaris & Ketua Keduanya Absen)
  if (isMandatActive && mandatSiswaId) {
    const isMe = currentUserId === mandatSiswaId;
    return {
      canInputAttendance: isMe,
      officerRole: isMe ? 'mandat_wali' : 'siswa_biasa',
      activeOfficerId: mandatSiswaId,
      activeOfficerName: mandatSiswaNama || 'Siswa Mandat',
      officerTitle: 'Mandat Khusus Wali Kelas',
      officerReason: isMe
        ? `⭐ Sekretaris & Ketua Kelas tidak masuk. Anda menerima Mandat Khusus dari Wali Kelas untuk mengisi presensi pagi ini.${config.mandatCatatan ? ` Catatan: "${config.mandatCatatan}"` : ''}`
        : `Sekretaris & Ketua Kelas tidak hadir. Pengisian didelegasikan oleh Wali Kelas kepada ${mandatSiswaNama}.`,
      hierarchyStep: 3,
      isDelegated: true,
      sekretarisAbsent: true,
      ketuaAbsent: true,
    };
  }

  // TINGKAT 4: TIDAK ADA SISWA PETUGAS (Menunggu Guru Mapel Jam 1 / 2 / 3)
  return {
    canInputAttendance: false,
    officerRole: 'siswa_biasa',
    activeOfficerId: null,
    activeOfficerName: 'Menunggu Guru Mata Pelajaran',
    officerTitle: 'Guru Mapel Jam 1 / 2 / 3',
    officerReason: 'Sekretaris dan Ketua Kelas tidak hadir, dan belum ada mandat siswa. Presensi akan diisi langsung oleh Guru Mata Pelajaran yang masuk kelas.',
    hierarchyStep: 4,
    isDelegated: true,
    sekretarisAbsent: true,
    ketuaAbsent: true,
  };
}
