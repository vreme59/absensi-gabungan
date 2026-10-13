import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { MuridAbsensiScreenProps } from '../types';
import { INITIAL_STUDENTS } from '../../data/students';
import { getWewenangPengabsenHariIni, getPerangkatKelas } from '../../utils/perangkatKelasManager';

type AttendanceStatusKey = 'H' | 'S' | 'I' | 'A' | 'B';

export const MuridAbsensiScreen: React.FC<MuridAbsensiScreenProps> = ({
  user,
  onShowToast,
}) => {
  const currentKelasId = user.kelas?.id || user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626';
  const currentKelasNama = user.kelas?.nama || user.classRoom || 'XII TKJ 1';

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatusKey>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<'all' | 'H' | 'absent' | 'B'>('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSavedDraft, setIsSavedDraft] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // 1. Fetch class students and today's attendance
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        let { data: studentList } = await supabase
          .from('profiles')
          .select('id, nama, username, is_sekretaris')
          .eq('kelas_id', currentKelasId)
          .eq('role', 'siswa')
          .order('nama', { ascending: true });

        // Fallback if no students from DB
        if (!studentList || studentList.length === 0) {
          studentList = INITIAL_STUDENTS.map(s => ({
            id: s.id,
            nama: s.name,
            username: s.nisn,
            is_sekretaris: s.name.toUpperCase().includes('RAMA') || s.name.toUpperCase().includes('FARHAN')
          }));
        }

        // Deduplicate
        const seen = new Set<string>();
        const uniqueStudents = (studentList || []).filter(s => {
          const k = (s.nama || '').trim().toUpperCase();
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setStudents(uniqueStudents);

        // Fetch today's absen_harian
        const { data: harianData } = await supabase
          .from('absen_harian')
          .select('siswa_id, status, keterangan')
          .eq('kelas_id', currentKelasId)
          .eq('tanggal', todayStr);

        const attMap: Record<string, AttendanceStatusKey> = {};
        const noteMap: Record<string, string> = {};

        (harianData || []).forEach((row: any) => {
          const isB = row.status === 'Bolos' || (row.keterangan && row.keterangan.includes('BOLOS'));
          attMap[row.siswa_id] = isB ? 'B' : row.status === 'Hadir' ? 'H' : row.status === 'Sakit' ? 'S' : row.status === 'Izin' ? 'I' : 'A';
          if (row.keterangan) noteMap[row.siswa_id] = row.keterangan;
        });

        // Fill default 'H' for unrecorded students
        uniqueStudents.forEach(s => {
          if (!attMap[s.id]) {
            attMap[s.id] = 'H';
          }
        });

        setAttendance(attMap);
        setNotes(noteMap);
      } catch (err) {
        console.error('Error loading murid attendance screen:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentKelasId, todayStr]);

  // Attendance Officer Authority
  const todayStatusMap = useMemo(() => {
    return attendance;
  }, [attendance]);

  const wewenang = useMemo(() => {
    return getWewenangPengabsenHariIni(
      currentKelasId,
      user.id,
      todayStatusMap,
      students.map(s => ({ id: s.id, nama: s.nama }))
    );
  }, [currentKelasId, user.id, todayStatusMap, students]);

  const canEdit = wewenang.canInputAttendance;

  // Counts
  const counts = useMemo(() => {
    const res = { H: 0, S: 0, I: 0, A: 0, B: 0 };
    students.forEach(s => {
      const st = attendance[s.id] || 'H';
      res[st] = (res[st] || 0) + 1;
    });
    return res;
  }, [students, attendance]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter(s => {
      const name = (s.nama || '').toLowerCase();
      const nisn = (s.username || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || nisn.includes(q);
      if (!matchSearch) return false;

      const st = attendance[s.id] || 'H';
      if (currentFilter === 'all') return true;
      if (currentFilter === 'H') return st === 'H';
      if (currentFilter === 'absent') return st === 'S' || st === 'I' || st === 'A' || st === 'B';
      if (currentFilter === 'B') return st === 'B';
      return true;
    });
  }, [students, attendance, searchQuery, currentFilter]);

  // Handle Status Update
  const handleStatusChange = (siswaId: string, status: AttendanceStatusKey) => {
    if (!canEdit) return;
    setAttendance(prev => ({ ...prev, [siswaId]: status }));
    setIsSavedDraft(false);
  };

  // Submit Draft to Supabase
  const handleSubmitDraft = async () => {
    if (!canEdit || students.length === 0) return;
    setSubmitting(true);
    try {
      const rows = students.map(s => {
        const st = attendance[s.id] || 'H';
        const dbStatus = st === 'H' ? 'Hadir' : st === 'S' ? 'Sakit' : st === 'I' ? 'Izin' : st === 'B' ? 'Bolos' : 'Alfa';
        return {
          tanggal: todayStr,
          siswa_id: s.id,
          kelas_id: currentKelasId,
          status: dbStatus,
          keterangan: notes[s.id] || null,
          diinput_oleh: user.id,
          status_validasi: 'draft' as const,
        };
      });

      const { error } = await supabase
        .from('absen_harian')
        .upsert(rows, { onConflict: 'tanggal,siswa_id' });

      if (error) throw error;

      setIsSavedDraft(true);
      onShowToast?.('Draf Absensi Terkirim! ✅', 'Draf presensi kelas berhasil diserahkan ke Guru untuk divalidasi.', 'success');
    } catch (err: any) {
      console.error('Failed to submit morning draft:', err);
      onShowToast?.('Gagal Mengirim Draf', err.message || 'Terjadi gangguan jaringan.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-28 font-body bg-surface-container-lowest min-h-screen">
      {/* Top Banner */}
      <div className="bg-primary text-white pt-6 pb-6 px-4 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-headline font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined notranslate text-[22px]">checklist</span>
            Presensi Kelas {currentKelasNama}
          </h1>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
            {students.length} Siswa
          </span>
        </div>
        <p className="text-xs text-sky-100">
          Presensi Harian Pagi • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="px-4 mt-3 space-y-3">
        {/* Officer Authority Notice Banner */}
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
            canEdit
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              canEdit ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            <span className="material-symbols-outlined notranslate text-[20px]">
              {canEdit ? 'edit_note' : 'visibility'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-headline font-bold text-xs uppercase tracking-wide">
                {wewenang.officerTitle}
              </span>
              {canEdit && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-800 text-[10px] font-black">
                  HAK INPUT AKTIF
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 text-slate-600">
              {canEdit
                ? `Kamu bertugas mengisi presensi kelas hari ini atas nama: ${wewenang.activeOfficerName}.`
                : `Petugas pengabsen hari ini: ${wewenang.activeOfficerName}. Mode pantau transparan.`}
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            type="button"
            onClick={() => setCurrentFilter(currentFilter === 'H' ? 'all' : 'H')}
            className={`p-2.5 rounded-xl border transition active:scale-95 ${
              currentFilter === 'H' ? 'bg-emerald-100 border-emerald-300 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-100'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-700 block">HADIR</span>
            <span className="font-headline font-black text-base text-emerald-800 block">{counts.H}</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentFilter(currentFilter === 'absent' ? 'all' : 'absent')}
            className={`p-2.5 rounded-xl border transition active:scale-95 ${
              currentFilter === 'absent' ? 'bg-amber-100 border-amber-300 ring-2 ring-amber-400' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-700 block">SAKIT/IZIN</span>
            <span className="font-headline font-black text-base text-amber-800 block">{counts.S + counts.I}</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentFilter(currentFilter === 'absent' ? 'all' : 'absent')}
            className={`p-2.5 rounded-xl border transition active:scale-95 ${
              currentFilter === 'absent' ? 'bg-slate-200 border-slate-300 ring-2 ring-slate-400' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-700 block">ALFA</span>
            <span className="font-headline font-black text-base text-slate-800 block">{counts.A}</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentFilter(currentFilter === 'B' ? 'all' : 'B')}
            className={`p-2.5 rounded-xl border transition active:scale-95 ${
              currentFilter === 'B' ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-400' : 'bg-rose-50 border-rose-100'
            }`}
          >
            <span className="text-[10px] font-bold text-rose-700 block">BOLOS</span>
            <span className="font-headline font-black text-base text-rose-800 block">{counts.B}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full">
          <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama teman atau NISN..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
          />
        </div>

        {/* Student Attendance List */}
        <div className="space-y-2.5">
          {loading ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
              <span className="material-symbols-outlined notranslate text-primary text-3xl animate-spin">sync</span>
              <p className="text-xs font-semibold text-slate-500">Memuat daftar siswa kelas...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col items-center justify-center gap-2 shadow-xs">
              <span className="material-symbols-outlined notranslate text-slate-400 text-3xl">search_off</span>
              <p className="text-xs font-bold text-slate-700">Tidak ada siswa yang sesuai pencarian</p>
            </div>
          ) : (
            filteredStudents.map((s, idx) => {
              const st = attendance[s.id] || 'H';
              const numStr = String(idx + 1).padStart(2, '0');
              const isSekretaris = s.is_sekretaris || s.nama.toUpperCase().includes('RAMA');

              return (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl border shadow-xs flex flex-col gap-2.5 transition-all bg-white ${
                    st === 'B' ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-slate-400 w-5 shrink-0">
                        {numStr}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-headline font-bold text-xs text-slate-900 truncate">
                            {s.nama}
                          </h4>
                          {isSekretaris && (
                            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[9px] font-bold">
                              Sekretaris
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          NISN: {s.username?.replace(/^s_?/, '') || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        st === 'H'
                          ? 'bg-emerald-100 text-emerald-800'
                          : st === 'S'
                          ? 'bg-amber-100 text-amber-800'
                          : st === 'I'
                          ? 'bg-sky-100 text-sky-800'
                          : st === 'A'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-rose-600 text-white animate-pulse'
                      }`}
                    >
                      {st === 'H' ? 'Hadir' : st === 'S' ? 'Sakit' : st === 'I' ? 'Izin' : st === 'A' ? 'Alfa' : 'Bolos'}
                    </span>
                  </div>

                  {/* 5 Status Buttons (Only enabled if student has input authority) */}
                  {canEdit && (
                    <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-100">
                      {(['H', 'S', 'I', 'A', 'B'] as const).map(letter => {
                        const isActive = st === letter;
                        const activeCls =
                          letter === 'H' ? 'bg-emerald-600 text-white'
                          : letter === 'S' ? 'bg-amber-500 text-white'
                          : letter === 'I' ? 'bg-sky-500 text-white'
                          : letter === 'A' ? 'bg-slate-700 text-white'
                          : 'bg-rose-600 text-white';

                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => handleStatusChange(s.id, letter)}
                            className={`h-7 rounded-lg text-xs font-bold transition active:scale-90 flex items-center justify-center ${
                              isActive ? activeCls : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Button for Officers */}
        {canEdit && (
          <div className="pt-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitDraft}
              className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Mengirim Draf Presensi...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined notranslate text-[20px]">send</span>
                  <span>Kirim Draf Presensi ke Guru</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
