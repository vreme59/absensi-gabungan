import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import {
  getPerangkatKelas,
  savePerangkatKelas,
  PerangkatKelasConfig,
} from '../utils/perangkatKelasManager';

interface PerangkatKelasScreenProps {
  user: UserProfile;
  initialClassId?: string;
  onNavigateHome?: () => void;
  onShowToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export const PerangkatKelasScreen: React.FC<PerangkatKelasScreenProps> = ({
  user,
  initialClassId,
  onNavigateHome,
  onShowToast,
}) => {
  const [classes, setClasses] = useState<{ id: string; nama: string; wali_kelas_id?: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626'
  );
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Perangkat Kelas State
  const [config, setConfig] = useState<PerangkatKelasConfig | null>(null);

  // Modal Picker State
  const [pickerModalRole, setPickerModalRole] = useState<'ketua' | 'sekretaris1' | 'sekretaris2' | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');

  // 1. Fetch Class List
  useEffect(() => {
    async function fetchClasses() {
      try {
        const { data: allCls } = await supabase
          .from('kelas')
          .select('id, nama, wali_kelas_id')
          .order('nama', { ascending: true });

        if (allCls && allCls.length > 0) {
          setClasses(allCls);
          const myClass = allCls.find((c) => c.wali_kelas_id === user.id || c.id === user.kelas_id);
          if (myClass && !initialClassId) {
            setSelectedClassId(myClass.id);
          }
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    }
    fetchClasses();
  }, [user.id, user.kelas_id, initialClassId]);

  // 2. Fetch Students for Selected Class
  useEffect(() => {
    if (!selectedClassId) return;

    async function fetchStudents() {
      setLoading(true);
      try {
        const { data: stdList } = await supabase
          .from('profiles')
          .select('id, nama, username, phone, avatar_url')
          .eq('kelas_id', selectedClassId)
          .eq('role', 'siswa')
          .order('nama', { ascending: true });

        let finalStudents: any[] = [];
        if (stdList && stdList.length > 0) {
          finalStudents = stdList;
        } else {
          // Fallback demo students
          finalStudents = [
            { id: 'std-01', nama: 'ACHMAD FAISAL', username: '0057182901', phone: '0812-4895-7075' },
            { id: 'std-02', nama: 'ALFIAN RIZKY PRATAMA', username: '0057182902', phone: '0813-8822-1011' },
            { id: 'std-03', nama: 'AMELIA PUTRI RAHMADHANI', username: '0057182903', phone: '0812-9988-2345' },
            { id: 'std-04', nama: 'ANDI RAMA RISKIANSYAH', username: '0057182904', phone: '0821-5544-3322' },
            { id: 'std-05', nama: 'ANISA AULIA RAHMAN', username: '0057182905', phone: '0852-1122-3344' },
            { id: 'std-06', nama: 'BAGAS ARYA SETIAWAN', username: '0057182906', phone: '0813-4455-6677' },
            { id: 'std-07', nama: 'CINDY LAURA', username: '0057182907', phone: '0812-4895-7075' },
            { id: 'std-08', nama: 'DANIEL CHRISTIAN MANUPUTTY', username: '0057182908', phone: '0811-2233-4455' },
            { id: 'std-09', nama: 'DIMAS ARYA PRATAMA', username: '0057182909', phone: '0813-9988-7766' },
            { id: 'std-10', nama: 'EKO PRASETYO', username: '0057182910', phone: '0812-3344-5566' },
          ];
        }

        setStudents(finalStudents);

        // Load or initialize Perangkat Kelas config
        const conf = getPerangkatKelas(selectedClassId, finalStudents);
        setConfig(conf);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [selectedClassId]);

  // Current selected class name
  const currentClassName = useMemo(() => {
    const found = classes.find((c) => c.id === selectedClassId);
    return found ? found.nama : user.kelas?.nama || 'XII TKJ 1';
  }, [classes, selectedClassId, user.kelas]);

  // Handler to assign student to a specific role
  const handleAssignRole = (
    role: 'ketua' | 'sekretaris1' | 'sekretaris2',
    studentId: string,
    studentName: string
  ) => {
    if (!config) return;

    let updated: PerangkatKelasConfig = { ...config };

    if (role === 'ketua') {
      updated = {
        ...updated,
        ketuaKelasId: studentId,
        ketuaKelasNama: studentName,
      };
      onShowToast('Ketua Kelas Ditetapkan', `${studentName} berhasil ditetapkan sebagai Ketua Kelas ${currentClassName}.`, 'success');
    } else if (role === 'sekretaris1') {
      updated = {
        ...updated,
        sekretarisId: studentId,
        sekretarisNama: studentName,
      };
      onShowToast('Sekretaris 1 Ditetapkan', `${studentName} berhasil ditetapkan sebagai Sekretaris 1 (Petugas Utama Presensi).`, 'success');
    } else if (role === 'sekretaris2') {
      updated = {
        ...updated,
        sekretaris2Id: studentId,
        sekretaris2Nama: studentName,
      };
      onShowToast('Sekretaris 2 Ditetapkan', `${studentName} berhasil ditetapkan sebagai Sekretaris 2 (Petugas Cadangan Presensi).`, 'success');
    }

    savePerangkatKelas(updated);
    setConfig(updated);
    setPickerModalRole(null);
  };

  // Filtered students for main table
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  // Filtered students for picker modal
  const filteredPickerStudents = useMemo(() => {
    if (!pickerSearch.trim()) return students;
    const q = pickerSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.username && s.username.toLowerCase().includes(q))
    );
  }, [students, pickerSearch]);

  // Details of assigned officers
  const ketuaDetails = useMemo(() => {
    if (!config?.ketuaKelasId) return null;
    return students.find((s) => s.id === config.ketuaKelasId) || { nama: config.ketuaKelasNama, username: '-' };
  }, [config, students]);

  const sekretaris1Details = useMemo(() => {
    if (!config?.sekretarisId) return null;
    return students.find((s) => s.id === config.sekretarisId) || { nama: config.sekretarisNama, username: '-' };
  }, [config, students]);

  const sekretaris2Details = useMemo(() => {
    if (!config?.sekretaris2Id) return null;
    return students.find((s) => s.id === config.sekretaris2Id) || { nama: config.sekretaris2Nama, username: '-' };
  }, [config, students]);

  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto px-3.5 sm:px-6 py-4 pb-28 font-body space-y-5 animate-in fade-in duration-200">
      
      {/* Top Banner Wali Kelas Header */}
      <div className="bg-gradient-to-r from-[#003d73] via-[#005fa0] to-[#0284c7] text-white p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 ring-2 ring-white/30 shadow-md">
            <span className="material-symbols-outlined notranslate text-[28px] text-white">
              assignment_ind
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[17px] sm:text-lg font-black tracking-tight">
                Struktur Perangkat Kelas
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#005fa0] uppercase tracking-wider shadow-xs">
                {currentClassName}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-sky-100 mt-0.5 leading-relaxed">
              Wali Kelas: <strong>{user.name}</strong> • Tetapkan Ketua Kelas dan Sekretaris 1 &amp; 2 sebagai pemegang wewenang resmi presensi harian.
            </p>
          </div>
        </div>

        {/* Class Selector Dropdown */}
        {classes.length > 1 && (
          <div className="relative z-10 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20">
            <span className="material-symbols-outlined notranslate text-[18px] text-sky-200">
              meeting_room
            </span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-2"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-800 font-semibold">
                  Kelas {c.nama}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3 Main Officer Cards (Ketua Kelas, Sekretaris 1, Sekretaris 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: KETUA KELAS */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-amber-200/80 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full pointer-events-none -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <span>👑</span>
                <span>Ketua Kelas</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Wewenang Cadangan 1</span>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                {ketuaDetails?.avatar_url ? (
                  <img src={ketuaDetails.avatar_url} alt={config?.ketuaKelasNama} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined notranslate text-amber-600 text-[32px]">
                    person
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate leading-snug">
                  {config?.ketuaKelasNama || 'Belum Ditetapkan'}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono block">
                  NISN: {ketuaDetails?.username || '-'}
                </span>
                {ketuaDetails?.phone && (
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined notranslate text-[12px]">call</span>
                    {ketuaDetails.phone}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Bertugas memimpin kelas dan otomatis memegang wewenang pengisian presensi jika Sekretaris 1 berhalangan hadir.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPickerModalRole('ketua');
              setPickerSearch('');
            }}
            className="w-full mt-4 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <span className="material-symbols-outlined notranslate text-[16px]">edit</span>
            <span>Ganti / Pilih Ketua Kelas</span>
          </button>
        </div>

        {/* Card 2: SEKRETARIS 1 (Petugas Utama) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-sky-200/80 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full pointer-events-none -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1.5 shadow-2xs">
                <span>✍️</span>
                <span>Sekretaris 1</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                Petugas Utama
              </span>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border-2 border-sky-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                {sekretaris1Details?.avatar_url ? (
                  <img src={sekretaris1Details.avatar_url} alt={config?.sekretarisNama} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined notranslate text-sky-600 text-[32px]">
                    draw
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate leading-snug">
                  {config?.sekretarisNama || 'Belum Ditetapkan'}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono block">
                  NISN: {sekretaris1Details?.username || '-'}
                </span>
                {sekretaris1Details?.phone && (
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined notranslate text-[12px]">call</span>
                    {sekretaris1Details.phone}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Petugas utama pengisian presensi harian siswa (07.00 - 07.45 WIT) dan pelapor draft kehadiran pagi kelas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPickerModalRole('sekretaris1');
              setPickerSearch('');
            }}
            className="w-full mt-4 py-2.5 px-3 rounded-xl bg-[#005fa0] hover:bg-[#004e84] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <span className="material-symbols-outlined notranslate text-[16px]">edit</span>
            <span>Ganti / Pilih Sekretaris 1</span>
          </button>
        </div>

        {/* Card 3: SEKRETARIS 2 (Petugas Cadangan / Pendamping) */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-emerald-200/80 hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full pointer-events-none -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
          
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                <span>📋</span>
                <span>Sekretaris 2</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Pendamping Presensi</span>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                {sekretaris2Details?.avatar_url ? (
                  <img src={sekretaris2Details.avatar_url} alt={config?.sekretaris2Nama} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined notranslate text-emerald-600 text-[32px]">
                    fact_check
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-sm truncate leading-snug">
                  {config?.sekretaris2Nama || 'Belum Ditetapkan'}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono block">
                  NISN: {sekretaris2Details?.username || '-'}
                </span>
                {sekretaris2Details?.phone && (
                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined notranslate text-[12px]">call</span>
                    {sekretaris2Details.phone}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              Membantu tugas sekretaris utama dan bertindak sebagai cadangan penginputan data absensi jika diperlukan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPickerModalRole('sekretaris2');
              setPickerSearch('');
            }}
            className="w-full mt-4 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <span className="material-symbols-outlined notranslate text-[16px]">edit</span>
            <span>Ganti / Pilih Sekretaris 2</span>
          </button>
        </div>

      </div>

      {/* Roster / Daftar Seluruh Siswa Kelas dengan Quick-Assign */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-primary text-[20px]">
                groups
              </span>
              Daftar Siswa Kelas {currentClassName} ({students.length} Siswa)
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pilih langsung jabatan siswa melalui tombol di samping setiap nama.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined notranslate absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / NISN..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
            />
          </div>
        </div>

        {/* Student List Grid / Table */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat data siswa kelas...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Tidak ada siswa yang cocok dengan pencarian &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredStudents.map((std, idx) => {
              const isKetua = config?.ketuaKelasId === std.id;
              const isSekr1 = config?.sekretarisId === std.id;
              const isSekr2 = config?.sekretaris2Id === std.id;

              return (
                <div
                  key={std.id}
                  className={`py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl transition hover:bg-slate-50 ${
                    isKetua
                      ? 'bg-amber-50/60 border border-amber-200/60'
                      : isSekr1
                      ? 'bg-sky-50/60 border border-sky-200/60'
                      : isSekr2
                      ? 'bg-emerald-50/60 border border-emerald-200/60'
                      : ''
                  }`}
                >
                  {/* Left: Info Siswa */}
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-slate-400 font-mono">
                      {idx + 1}
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 overflow-hidden border border-slate-200">
                      {std.avatar_url ? (
                        <img src={std.avatar_url} alt={std.nama} className="w-full h-full object-cover" />
                      ) : (
                        std.nama.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs">
                          {std.nama}
                        </span>
                        {isKetua && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>👑</span> Ketua Kelas
                          </span>
                        )}
                        {isSekr1 && (
                          <span className="bg-sky-100 text-sky-900 border border-sky-300 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>✍️</span> Sekretaris 1
                          </span>
                        )}
                        {isSekr2 && (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>📋</span> Sekretaris 2
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        NISN: {std.username || '-'} {std.phone ? `• WA: ${std.phone}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quick Assign Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleAssignRole('ketua', std.id, std.nama)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isKetua
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                      title="Tetapkan sebagai Ketua Kelas"
                    >
                      <span>👑</span>
                      <span>{isKetua ? 'Ketua Aktif' : 'Jadikan Ketua'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignRole('sekretaris1', std.id, std.nama)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSekr1
                          ? 'bg-[#005fa0] text-white shadow-xs'
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200'
                      }`}
                      title="Tetapkan sebagai Sekretaris 1"
                    >
                      <span>✍️</span>
                      <span>{isSekr1 ? 'Sekr 1 Aktif' : 'Jadikan Sekr 1'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAssignRole('sekretaris2', std.id, std.nama)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSekr2
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                      title="Tetapkan sebagai Sekretaris 2"
                    >
                      <span>📋</span>
                      <span>{isSekr2 ? 'Sekr 2 Aktif' : 'Jadikan Sekr 2'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Picker Siswa Cepat */}
      {pickerModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[85vh] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#003d73] to-[#005fa0] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-[22px]">
                  person_search
                </span>
                <div>
                  <h3 className="font-bold text-sm">
                    Pilih{' '}
                    {pickerModalRole === 'ketua'
                      ? '👑 Ketua Kelas'
                      : pickerModalRole === 'sekretaris1'
                      ? '✍️ Sekretaris 1'
                      : '📋 Sekretaris 2'}
                  </h3>
                  <p className="text-[10px] text-sky-200">
                    Kelas {currentClassName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerModalRole(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined notranslate text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Search Input */}
            <div className="p-3 bg-slate-50 border-b border-slate-100">
              <div className="relative">
                <span className="material-symbols-outlined notranslate absolute left-3 top-2.5 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  autoFocus
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Ketik nama siswa..."
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Student Choices */}
            <div className="overflow-y-auto p-2 space-y-1.5 flex-1">
              {filteredPickerStudents.map((std) => (
                <button
                  key={std.id}
                  type="button"
                  onClick={() => handleAssignRole(pickerModalRole, std.id, std.nama)}
                  className="w-full p-2.5 rounded-xl hover:bg-sky-50 transition flex items-center justify-between text-left group border border-transparent hover:border-sky-200"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                      {std.nama.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs block group-hover:text-primary">
                        {std.nama}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        NISN: {std.username || '-'}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-[10px] font-bold bg-primary text-white group-hover:bg-[#004e84]">
                    Pilih
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
