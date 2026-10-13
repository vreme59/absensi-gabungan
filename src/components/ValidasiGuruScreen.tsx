import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { getPerangkatKelas } from '../utils/perangkatKelasManager';
import { INITIAL_STUDENTS } from '../data/students';

export type StatusKey = 'H' | 'S' | 'I' | 'A' | 'B';
export type FilterTabKey = 'all' | 'H' | 'absent' | 'B' | 'S' | 'I' | 'A';

interface ValidasiGuruScreenProps {
  user: UserProfile;
  initialClassId?: string;
  initialJadwalItem?: any;
  isModal?: boolean;
  onClose?: () => void;
  onShowToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ValidasiGuruScreen: React.FC<ValidasiGuruScreenProps> = ({
  user,
  initialClassId,
  initialJadwalItem,
  isModal = false,
  onClose,
  onShowToast,
}) => {
  // Navigation & Classes
  const [teacherClasses, setTeacherClasses] = useState<{
    id: string;
    nama: string;
    mapelNama?: string;
    jadwalId?: string;
    ruang?: string;
    jamMulai?: string;
    jamSelesai?: string;
  }[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || initialJadwalItem?.kelas_id || initialJadwalItem?.kelas?.id || user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626'
  );
  const [activeJadwalItem, setActiveJadwalItem] = useState<any>(initialJadwalItem || null);

  // Sync props changes if initialClassId / initialJadwalItem updates
  useEffect(() => {
    const nextId = initialClassId || initialJadwalItem?.kelas_id || initialJadwalItem?.kelas?.id;
    if (nextId && nextId !== selectedClassId) {
      setSelectedClassId(nextId);
    }
    if (initialJadwalItem) {
      setActiveJadwalItem(initialJadwalItem);
    }
  }, [initialClassId, initialJadwalItem]);

  // Student list & Attendance status map
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, StatusKey>>({});
  const [morningDraftMap, setMorningDraftMap] = useState<Record<string, StatusKey>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  // Secretary draft metadata
  const [hasMorningDraft, setHasMorningDraft] = useState(false);
  const [morningDraftTime, setMorningDraftTime] = useState<string>('07.30 WIT');
  const [secretaryName, setSecretaryName] = useState<string>('Sekretaris Kelas');

  // Filter & Search controls
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTabFilter, setCurrentTabFilter] = useState<FilterTabKey>('all');

  // Interactive UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSavedConfirmed, setIsSavedConfirmed] = useState(false);
  const [floatingToast, setFloatingToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // 1. Fetch teacher's schedules & classes
  useEffect(() => {
    async function loadTeacherClasses() {
      try {
        const { data: scheduleRows } = await supabase
          .from('jadwal')
          .select('id, kelas_id, jam_mulai, jam_selesai, ruang, kelas:kelas_id(id, nama), mapel:mapel_id(nama)')
          .eq('guru_id', user.id);

        if (scheduleRows && scheduleRows.length > 0) {
          const map = new Map<string, any>();
          scheduleRows.forEach((r: any) => {
            if (r.kelas && !map.has(r.kelas.id)) {
              map.set(r.kelas.id, {
                id: r.kelas.id,
                nama: r.kelas.nama,
                mapelNama: r.mapel?.nama || 'Mata Pelajaran',
                jadwalId: r.id,
                ruang: r.ruang || 'Lab / Ruang Kelas',
                jamMulai: r.jam_mulai,
                jamSelesai: r.jam_selesai,
              });
            }
          });
          const list = Array.from(map.values()).sort((a, b) => a.nama.localeCompare(b.nama));
          setTeacherClasses(list);

          if (!selectedClassId && list.length > 0) {
            setSelectedClassId(list[0].id);
            setActiveJadwalItem({
              id: list[0].jadwalId,
              kelas_id: list[0].id,
              kelas: { id: list[0].id, nama: list[0].nama },
              mapel: { nama: list[0].mapelNama },
              ruang: list[0].ruang,
              jam_mulai: list[0].jamMulai,
              jam_selesai: list[0].jamSelesai,
            });
          }
        } else {
          // Fallback: Query only classes that have actual students enrolled in SMKN 1 Sorong
          const { data: profileCls } = await supabase
            .from('profiles')
            .select('kelas_id')
            .eq('role', 'siswa');

          const activeIds = Array.from(new Set((profileCls || []).map(p => p.kelas_id).filter(Boolean)));
          let list: any[] = [];

          if (activeIds.length > 0) {
            const { data: activeClasses } = await supabase
              .from('kelas')
              .select('id, nama')
              .in('id', activeIds)
              .order('nama');

            if (activeClasses && activeClasses.length > 0) {
              list = activeClasses.map(c => ({
                id: c.id,
                nama: c.nama,
                mapelNama: 'Mata Pelajaran',
                ruang: 'Ruang Kelas',
              }));
            }
          }

          if (list.length === 0) {
            const { data: allCls } = await supabase.from('kelas').select('id, nama').order('nama');
            if (allCls) {
              list = allCls.map(c => ({ id: c.id, nama: c.nama, mapelNama: 'Mata Pelajaran', ruang: 'Ruang Kelas' }));
            }
          }

          setTeacherClasses(list);

          if (!selectedClassId && list.length > 0) {
            const preferred = list.find(c => c.nama === 'XII TKJ 1') || list[0];
            setSelectedClassId(preferred.id);
            setActiveJadwalItem({
              id: null,
              kelas_id: preferred.id,
              kelas: { id: preferred.id, nama: preferred.nama },
              mapel: { nama: 'Mata Pelajaran' }
            });
          }
        }
      } catch (err) {
        console.error('Error fetching teacher classes:', err);
      }
    }
    loadTeacherClasses();
  }, [user.id]);

  // Sync active schedule when selected class changes
  useEffect(() => {
    if (initialJadwalItem && (initialJadwalItem.kelas_id === selectedClassId || initialJadwalItem.kelas?.id === selectedClassId)) {
      setActiveJadwalItem(initialJadwalItem);
      return;
    }
    const found = teacherClasses.find(c => c.id === selectedClassId);
    if (found) {
      setActiveJadwalItem({
        id: found.jadwalId,
        kelas_id: found.id,
        kelas: { id: found.id, nama: found.nama },
        mapel: { nama: found.mapelNama || 'Mata Pelajaran' },
        ruang: found.ruang,
        jam_mulai: found.jamMulai,
        jamSelesai: found.jamSelesai,
      });
    }
  }, [selectedClassId, teacherClasses, initialJadwalItem]);

  // 2. Load students & attendance from Supabase
  useEffect(() => {
    if (!selectedClassId) return;

    async function loadClassData() {
      setLoading(true);
      try {
        // Resolve UUID if selectedClassId is a class name
        let classUuid = selectedClassId;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedClassId);
        if (!isUuid) {
          const { data: foundKelas } = await supabase
            .from('kelas')
            .select('id, nama')
            .ilike('nama', selectedClassId.trim())
            .maybeSingle();

          if (foundKelas?.id) {
            classUuid = foundKelas.id;
          } else {
            classUuid = 'e88128be-8fc3-4973-8d69-00ef17571626';
          }
        }

        // Fetch students from profiles
        let { data: studentList, error: sErr } = await supabase
          .from('profiles')
          .select('id, nama, username, is_sekretaris')
          .eq('kelas_id', classUuid)
          .eq('role', 'siswa')
          .order('nama', { ascending: true });

        if (sErr) {
          console.warn('Supabase profiles query error, checking fallback:', sErr);
        }

        // Fallback if no students in profiles for this UUID
        if (!studentList || studentList.length === 0) {
          studentList = INITIAL_STUDENTS.map(s => ({
            id: s.id,
            nama: s.name,
            username: s.nisn,
            is_sekretaris: s.name.toUpperCase().includes('RAMA') || s.name.toUpperCase().includes('FARHAN')
          }));
        }

        // Deduplicate students by trimmed uppercase name
        const seenNames = new Set<string>();
        const uniqueStudents = (studentList || []).filter(s => {
          const key = (s.nama || '').trim().toUpperCase();
          if (!key || seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        });
        setStudents(uniqueStudents);

        // Retrieve Perangkat Kelas for secretary name
        const perCfg = getPerangkatKelas(classUuid, uniqueStudents);
        const secProfile = uniqueStudents.find(s => s.is_sekretaris || s.id === perCfg.sekretarisId);
        setSecretaryName(secProfile?.nama || perCfg.sekretarisNama || 'Farhan Ramadhan');

        // Fetch today's subject attendance (absen_mapel)
        const jId = activeJadwalItem?.id;
        const existingMap: Record<string, StatusKey> = {};
        const notesMap: Record<string, string> = {};

        if (jId) {
          const { data: mapelAbsen } = await supabase
            .from('absen_mapel')
            .select('siswa_id, status, keterangan')
            .eq('jadwal_id', jId)
            .eq('tanggal', todayStr);

          (mapelAbsen || []).forEach((a: any) => {
            const isBolos = a.status === 'Alfa' && (a.keterangan || '').includes('BOLOS MAPEL');
            existingMap[a.siswa_id] = isBolos ? 'B' : a.status === 'Hadir' ? 'H' : a.status === 'Sakit' ? 'S' : a.status === 'Izin' ? 'I' : 'A';
            if (a.keterangan) notesMap[a.siswa_id] = a.keterangan;
          });
        }

        // Fetch today's morning roll call (absen_harian)
        const { data: harianAbsen } = await supabase
          .from('absen_harian')
          .select('siswa_id, status, keterangan, created_at')
          .eq('kelas_id', classUuid)
          .eq('tanggal', todayStr);

        const morningMap: Record<string, StatusKey> = {};
        if (harianAbsen && harianAbsen.length > 0) {
          setHasMorningDraft(true);
          const firstRow = harianAbsen[0];
          if (firstRow?.created_at) {
            const draftDate = new Date(firstRow.created_at);
            setMorningDraftTime(draftDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') + ' WIT');
          }

          harianAbsen.forEach((h: any) => {
            const isB = h.status === 'Bolos' || (h.keterangan && h.keterangan.includes('BOLOS'));
            const key: StatusKey = isB ? 'B' : h.status === 'Hadir' ? 'H' : h.status === 'Sakit' ? 'S' : h.status === 'Izin' ? 'I' : 'A';
            morningMap[h.siswa_id] = key;
            if (!notesMap[h.siswa_id] && h.keterangan) {
              notesMap[h.siswa_id] = h.keterangan;
            }
          });
        } else {
          setHasMorningDraft(false);
          setMorningDraftTime(timeString + ' WIT');
        }

        // Set initial attendance map: prioritize existing subject attendance, then morning draft, then default to 'H'
        const initialAtt: Record<string, StatusKey> = {};
        const draftFallback: Record<string, StatusKey> = {};

        uniqueStudents.forEach((s: any) => {
          const mKey = morningMap[s.id] || 'H';
          draftFallback[s.id] = mKey;
          initialAtt[s.id] = existingMap[s.id] || mKey;
        });

        setAttendance(initialAtt);
        setMorningDraftMap(draftFallback);
        setNotes(notesMap);

        if (Object.keys(existingMap).length > 0) {
          setIsSavedConfirmed(true);
        }
      } catch (err: any) {
        console.error('Error loading class attendance data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadClassData();
  }, [selectedClassId, activeJadwalItem?.id, todayStr]);

  // Metadata Display Helpers
  const activeClassName = activeJadwalItem?.kelas?.nama || teacherClasses.find(c => c.id === selectedClassId)?.nama || 'XI RPL 1';
  const activeMapelName = activeJadwalItem?.mapel?.nama || teacherClasses.find(c => c.id === selectedClassId)?.mapelNama || 'Pemrograman Web & Perangkat Bergerak';
  const activeRoomName = activeJadwalItem?.ruang || 'LAB RPL 2';
  const activeTimeRange = activeJadwalItem?.jam_mulai && activeJadwalItem?.jam_selesai
    ? `${activeJadwalItem.jam_mulai.substring(0, 5)} - ${activeJadwalItem.jam_selesai.substring(0, 5)} WIT (3 JP)`
    : '08.45 - 10.15 WIT (3 JP)';

  // Calculate live counts
  const counts = useMemo(() => {
    const tally: Record<StatusKey, number> = { H: 0, S: 0, I: 0, A: 0, B: 0 };
    students.forEach(s => {
      const st = attendance[s.id] || 'H';
      tally[st] = (tally[st] || 0) + 1;
    });
    return tally;
  }, [students, attendance]);

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return students.filter(student => {
      const name = (student.nama || '').toLowerCase();
      const nisn = (student.username || '').toLowerCase();
      const st = attendance[student.id] || 'H';

      const matchSearch = !query || name.includes(query) || nisn.includes(query);
      if (!matchSearch) return false;

      if (currentTabFilter === 'all') return true;
      if (currentTabFilter === 'H') return st === 'H';
      if (currentTabFilter === 'absent') return st === 'S' || st === 'I' || st === 'A' || st === 'B';
      if (currentTabFilter === 'B') return st === 'B';
      if (currentTabFilter === 'S') return st === 'S';
      if (currentTabFilter === 'I') return st === 'I';
      if (currentTabFilter === 'A') return st === 'A';
      return true;
    });
  }, [students, attendance, searchQuery, currentTabFilter]);

  // Floating Toast Helper
  const showFeedback = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setFloatingToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setFloatingToast(null);
    }, 2800);
  };

  // Status Change Handler
  const handleUpdateStatus = (siswaId: string, newStatus: StatusKey) => {
    setAttendance(prev => ({ ...prev, [siswaId]: newStatus }));
    setIsSavedConfirmed(false);

    if (newStatus === 'B') {
      if (!notes[siswaId]) {
        setNotes(prev => ({ ...prev, [siswaId]: 'Tidak kembali setelah istirahat (Ditandai Guru) - Panggil BK' }));
      }
    } else if (newStatus === 'H') {
      if (notes[siswaId] === 'Tidak kembali setelah istirahat (Ditandai Guru) - Panggil BK') {
        setNotes(prev => {
          const next = { ...prev };
          delete next[siswaId];
          return next;
        });
      }
    }
  };

  // Reset to morning draft
  const handleResetToMorningDraft = () => {
    setAttendance({ ...morningDraftMap });
    setIsSavedConfirmed(false);
    showFeedback('Data presensi dikembalikan ke draf sekretaris');
    onShowToast('Draf Dipulihkan', 'Status kehadiran siswa dikembalikan sesuai catatan awal sekretaris.', 'info');
  };

  // Save & Confirm attendance to database
  const handleConfirmAttendance = async () => {
    if (!selectedClassId || students.length === 0) return;
    setSaving(true);

    try {
      const jId = activeJadwalItem?.id;

      // 1. Upsert into absen_mapel (if schedule exists)
      if (jId) {
        const mapelRows = students.map(s => {
          const st = attendance[s.id] || 'H';
          const isBolos = st === 'B';
          const dbStatus = st === 'H' ? 'Hadir' : st === 'S' ? 'Sakit' : st === 'I' ? 'Izin' : 'Alfa';
          const noteText = isBolos
            ? `[BOLOS MAPEL] Dilaporkan guru ${user.name}: ${notes[s.id] || 'Tidak ada di kelas saat jam pelajaran'}`
            : notes[s.id] || null;

          return {
            tanggal: todayStr,
            jadwal_id: jId,
            siswa_id: s.id,
            status: dbStatus,
            keterangan: noteText,
            diinput_oleh: user.id,
          };
        });

        await supabase.from('absen_mapel').upsert(mapelRows, { onConflict: 'tanggal,jadwal_id,siswa_id' });
      }

      // 2. Upsert into absen_harian with status_validasi = 'tervalidasi'
      let targetClassUuid = selectedClassId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedClassId);
      if (!isUuid) {
        const found = teacherClasses.find(c => c.id === selectedClassId || c.nama === selectedClassId);
        if (found) targetClassUuid = found.id;
        else targetClassUuid = 'e88128be-8fc3-4973-8d69-00ef17571626';
      }

      const harianRows = students.map(s => {
        const st = attendance[s.id] || 'H';
        const isBolos = st === 'B';
        const dbStatus = st === 'H' ? 'Hadir' : st === 'S' ? 'Sakit' : st === 'I' ? 'Izin' : 'Alfa';
        const noteText = isBolos
          ? `[BOLOS MAPEL] Dilaporkan guru ${user.name}: ${notes[s.id] || 'Terdeteksi bolos jam pelajaran'}`
          : notes[s.id] || null;

        return {
          tanggal: todayStr,
          siswa_id: s.id,
          kelas_id: targetClassUuid,
          status: dbStatus,
          keterangan: noteText,
          status_validasi: 'tervalidasi' as const,
          divalidasi_oleh: user.id,
          diinput_oleh: user.id,
        };
      });

      await supabase.from('absen_harian').upsert(harianRows, { onConflict: 'tanggal,siswa_id' });

      setSaving(false);
      setIsSavedConfirmed(true);
      showFeedback('Presensi Berhasil Disahkan ke Dapodik SMKN 1 Sorong!');
      onShowToast(
        'Presensi Disahkan & Tersimpan! ✅',
        `Presensi kelas ${activeClassName} telah resmi divalidasi dan tersinkronisasi ke pusat kontrol sekolah.`,
        'success'
      );

      // Auto close after delay if rendered in modal
      if (isModal && onClose) {
        setTimeout(() => onClose(), 2200);
      }
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      setSaving(false);
      onShowToast('Gagal Menyimpan Presensi', err?.message || 'Terjadi kesalahan jaringan.', 'error');
    }
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.back();
    }
  };

  const content = (
    <div className="bg-surface-container-lowest font-body text-on-surface flex flex-col min-h-screen antialiased">
      {/* Top Fixed Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,99,168,0.06)] transition-all duration-200">
        <div className="h-16 px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Kembali"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container-low active:scale-90 transition-all duration-150"
              onClick={handleBack}
              type="button"
            >
              <span className="material-symbols-outlined notranslate text-[24px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="flex flex-col">
                <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold tracking-tight select-none">
                  Absensi Kelas
                </h1>
                <span className="font-label-sm text-outline text-[11px]">SMKN 1 Sorong</span>
              </div>
            </div>
          </div>

          {/* Class Switcher for Teachers with Multiple Classes */}
          {teacherClasses.length > 1 && (
            <div className="flex items-center">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs font-bold text-primary bg-primary/10 border-0 rounded-full px-3 py-1.5 focus:ring-2 focus:ring-primary outline-none"
              >
                {teacherClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex flex-col relative w-full pt-16 bg-surface-container-lowest min-h-screen">
        <div className="flex flex-col w-full pb-32">
          {/* DANA Style Curved Blue Backdrop Banner */}
          <div
            className="relative w-full bg-gradient-to-b from-primary via-primary-container to-secondary pb-10 pt-4 px-margin overflow-hidden rounded-b-[28px] shadow-sm animate-fade-in"
            style={{ animationDelay: '50ms' }}
          >
            {/* Decorative Ambient Glow Circles */}
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none pulse-breathe"></div>
            <div className="absolute left-1/4 -bottom-10 w-48 h-48 rounded-full bg-secondary-container/20 blur-xl pointer-events-none"></div>

            {/* Top Sub-Navigation Context */}
            <div className="relative z-10 flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md transition-all hover:bg-white/20">
                <span className="w-2 h-2 rounded-full bg-secondary-fixed animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-on-primary tracking-wide">
                  SESI AKTIF • WIT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-primary-fixed bg-black/20 px-2 py-0.5 rounded-md">
                  {timeString} WIT
                </span>
              </div>
            </div>

            {/* Subject Title & Metadata */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-label-md text-label-md text-primary-fixed uppercase tracking-wider font-semibold">
                  {activeClassName} • {activeRoomName}
                </span>
              </div>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary tracking-tight font-bold">
                {activeMapelName}
              </h2>
              <div className="flex items-center gap-3 pt-1 text-on-primary/90 font-body-sm text-body-sm">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined notranslate text-[16px] text-primary-fixed">schedule</span>
                  {activeTimeRange}
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined notranslate text-[16px] text-primary-fixed">person</span>
                  {user.name}
                </span>
              </div>
            </div>
          </div>

          {/* Secretary Draft Sync Notification Banner (Overlaps Banner) */}
          <div className="px-margin -mt-6 relative z-20 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-[0_4px_16px_rgba(11,99,168,0.08)] flex items-start gap-3 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5 text-primary">
                <span className="material-symbols-outlined notranslate text-[18px]">verified_user</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                    {hasMorningDraft ? 'Draf Sekretaris Dimuat' : 'Presensi Mandiri Guru'}
                  </p>
                  <span className="font-label-sm text-label-sm text-outline">{morningDraftTime}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                  {hasMorningDraft ? (
                    <>
                      Draf oleh: <span className="font-medium text-primary">{secretaryName}</span> (Sekretaris Kelas)
                    </>
                  ) : (
                    'Belum ada presensi pagi sekretaris. Anda mengisi dan mengesahkan presensi mapel secara langsung.'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Attendance Metric Pills (Fintech Card Style) */}
          <div className="px-margin mt-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-[0_2px_8px_rgba(11,99,168,0.05)] border border-surface-container/50">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label-md text-label-md text-on-surface font-bold tracking-wide">
                  RINGKASAN KEHADIRAN
                </span>
                <span
                  className="font-label-sm text-label-sm text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full"
                  id="total-badge"
                >
                  {students.length} Total Siswa
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <button
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-emerald-50 text-emerald-800 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-xs ripple-btn"
                  onClick={() => setCurrentTabFilter('H')}
                  type="button"
                >
                  <span className="font-label-sm text-[11px] font-bold text-emerald-700">HADIR</span>
                  <span
                    className="font-headline-sm text-headline-sm font-bold text-emerald-600 mt-1 inline-block transition-transform duration-200"
                    id="count-h"
                  >
                    {counts.H}
                  </span>
                </button>
                <button
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-amber-50 text-amber-900 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-xs ripple-btn"
                  onClick={() => setCurrentTabFilter('S')}
                  type="button"
                >
                  <span className="font-label-sm text-[11px] font-bold text-amber-700">SAKIT</span>
                  <span
                    className="font-headline-sm text-headline-sm font-bold text-amber-600 mt-1 inline-block transition-transform duration-200"
                    id="count-s"
                  >
                    {counts.S}
                  </span>
                </button>
                <button
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-sky-50 text-sky-900 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-xs ripple-btn"
                  onClick={() => setCurrentTabFilter('I')}
                  type="button"
                >
                  <span className="font-label-sm text-[11px] font-bold text-sky-700">IZIN</span>
                  <span
                    className="font-headline-sm text-headline-sm font-bold text-sky-600 mt-1 inline-block transition-transform duration-200"
                    id="count-i"
                  >
                    {counts.I}
                  </span>
                </button>
                <button
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-slate-100 text-slate-700 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-xs ripple-btn"
                  onClick={() => setCurrentTabFilter('A')}
                  type="button"
                >
                  <span className="font-label-sm text-[11px] font-bold text-slate-600">ALFA</span>
                  <span
                    className="font-headline-sm text-headline-sm font-bold text-slate-700 mt-1 inline-block transition-transform duration-200"
                    id="count-a"
                  >
                    {counts.A}
                  </span>
                </button>
                <button
                  className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-rose-50 text-rose-900 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 hover:shadow-xs ripple-btn"
                  onClick={() => setCurrentTabFilter('B')}
                  type="button"
                >
                  <span className="font-label-sm text-[11px] font-bold text-rose-700">BOLOS</span>
                  <span
                    className="font-headline-sm text-headline-sm font-bold text-rose-600 mt-1 inline-block transition-transform duration-200"
                    id="count-b"
                  >
                    {counts.B}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="px-margin mt-4 space-y-2.5 animate-fade-in" style={{ animationDelay: '250ms' }}>
            {/* Search Box with smooth focus ring glow */}
            <div className="relative w-full group">
              <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary text-[20px] transition-colors duration-200">
                search
              </span>
              <input
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md border border-transparent focus:outline-none focus:bg-surface-container-lowest focus:border-primary focus:ring-4 focus:ring-primary/20 shadow-xs transition-all duration-200"
                id="student-search-input"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NISN siswa..."
                type="search"
                value={searchQuery}
              />
            </div>

            {/* Filter Segmented Tabs */}
            <div className="relative flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-nowrap" id="tabs-container">
              <button
                className={`tab-btn px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all duration-200 active:scale-95 ${
                  currentTabFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
                onClick={() => setCurrentTabFilter('all')}
                type="button"
              >
                Semua ({students.length})
              </button>
              <button
                className={`tab-btn px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all duration-200 active:scale-95 ${
                  currentTabFilter === 'H'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
                onClick={() => setCurrentTabFilter('H')}
                type="button"
              >
                Hadir ({counts.H})
              </button>
              <button
                className={`tab-btn px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all duration-200 active:scale-95 ${
                  currentTabFilter === 'absent'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
                onClick={() => setCurrentTabFilter('absent')}
                type="button"
              >
                Tidak Hadir ({counts.S + counts.I + counts.A + counts.B})
              </button>
              <button
                className={`tab-btn px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all duration-200 active:scale-95 ${
                  currentTabFilter === 'B'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                }`}
                onClick={() => setCurrentTabFilter('B')}
                type="button"
              >
                Bolos ({counts.B})
              </button>
            </div>
          </div>

          {/* Student Attendance Interactive List */}
          <div className="px-margin mt-3 space-y-3" id="student-list-container">
            {loading ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-surface-container shadow-xs text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined notranslate text-primary text-3xl animate-spin">sync</span>
                <p className="text-xs font-semibold text-outline">Memuat daftar siswa kelas...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-2xl p-8 border border-surface-container shadow-xs text-center flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined notranslate text-slate-400 text-3xl">search_off</span>
                <p className="text-xs font-semibold text-slate-600">Tidak ada siswa yang sesuai dengan filter.</p>
              </div>
            ) : (
              filteredStudents.map((s, idx) => {
                const status = attendance[s.id] || 'H';
                const isBolos = status === 'B';
                const note = notes[s.id];
                const initials = s.nama
                  ? s.nama
                      .split(' ')
                      .filter(Boolean)
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'SW';
                const numStr = String(idx + 1).padStart(2, '0');
                const isSekretaris = s.is_sekretaris || s.nama === secretaryName;

                return (
                  <div
                    key={s.id}
                    className={`student-card rounded-2xl p-3.5 border shadow-xs flex flex-col gap-3 transition-all duration-200 ${
                      isBolos
                        ? 'bg-rose-50/50 border-rose-100'
                        : 'bg-surface-container-lowest border-surface-container'
                    }`}
                    data-name={s.nama}
                    data-nisn={s.username}
                    data-status={status}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full font-headline-sm font-bold flex items-center justify-center shrink-0 text-sm ${
                            isBolos
                              ? 'bg-rose-100 text-rose-700'
                              : status === 'S'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'I'
                              ? 'bg-sky-100 text-sky-800'
                              : status === 'A'
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-label-sm text-outline text-[11px] font-semibold">{numStr}</span>
                            <h3 className="font-label-lg text-label-lg font-bold text-on-surface truncate">
                              {s.nama}
                            </h3>
                            {isSekretaris && (
                              <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-tight">
                                Sekretaris
                              </span>
                            )}
                          </div>
                          <p className="font-body-sm text-body-sm text-outline truncate">
                            NISN: {s.username?.replace(/^s_?/, '') || '-'}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`status-badge px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          status === 'H'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'S'
                            ? 'bg-amber-100 text-amber-800'
                            : status === 'I'
                            ? 'bg-sky-100 text-sky-800'
                            : status === 'A'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-rose-600 text-white animate-pulse'
                        }`}
                      >
                        {status === 'H'
                          ? 'Hadir'
                          : status === 'S'
                          ? 'Sakit'
                          : status === 'I'
                          ? 'Izin'
                          : status === 'A'
                          ? 'Alfa'
                          : 'Bolos'}
                      </span>
                    </div>

                    {/* Note / Keterangan row */}
                    {isBolos && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-100/70 border border-rose-200 text-rose-900 font-body-sm text-xs">
                        <span className="material-symbols-outlined notranslate text-[16px] text-rose-600 shrink-0">
                          warning
                        </span>
                        <span className="truncate">
                          {note || 'Tidak kembali setelah istirahat (Ditandai Guru) - Panggil BK'}
                        </span>
                      </div>
                    )}
                    {!isBolos && note && (
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/60 text-amber-900 font-body-sm text-xs">
                        <span className="material-symbols-outlined notranslate text-[16px] text-amber-700 shrink-0">
                          description
                        </span>
                        <span className="truncate">{note}</span>
                      </div>
                    )}

                    {/* 5-Button Status Control: H, S, I, A, B */}
                    <div
                      className={`grid grid-cols-5 gap-1.5 pt-1 border-t ${
                        isBolos ? 'border-rose-200/60' : 'border-surface-container/60'
                      }`}
                    >
                      {(['H', 'S', 'I', 'A', 'B'] as const).map(letter => {
                        const isActive = status === letter;
                        const activeStyle =
                          letter === 'H'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : letter === 'S'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : letter === 'I'
                            ? 'bg-sky-500 text-white shadow-xs'
                            : letter === 'A'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs';

                        return (
                          <button
                            key={letter}
                            className={`status-btn ripple-btn h-8 rounded-lg font-label-sm text-label-sm font-bold transition-all duration-150 ease-out flex items-center justify-center active:scale-90 ${
                              isActive
                                ? activeStyle
                                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                            }`}
                            onClick={() => handleUpdateStatus(s.id, letter)}
                            type="button"
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar (Fintech Primary CTA) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-xl px-margin py-3 pb-safe shadow-[0_-8px_24px_rgba(11,99,168,0.12)]">
          <div className="max-w-md mx-auto flex flex-col gap-2">
            {/* Auto Save status label */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSavedConfirmed ? 'bg-emerald-500 animate-pulse' : 'bg-primary animate-pulse'
                  }`}
                ></span>
                <span className="font-label-sm text-label-sm text-outline">
                  {isSavedConfirmed ? 'Tersimpan Otomatis (Tersahkan)' : 'Draf Siap Disahkan'}
                </span>
              </div>
              <button
                className="font-label-sm text-label-sm text-primary font-bold hover:underline active:scale-95 transition-transform"
                onClick={handleResetToMorningDraft}
                type="button"
              >
                Reset
              </button>
            </div>

            {/* Main Action Button with Interactive States */}
            <button
              className={`relative overflow-hidden w-full h-12 rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,120,200,0.35)] transition-all duration-300 active:scale-[0.98] ${
                isSavedConfirmed
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-primary hover:bg-on-primary-fixed-variant text-on-primary'
              }`}
              disabled={saving}
              id="btn-submit-attendance"
              onClick={handleConfirmAttendance}
              type="button"
            >
              <span
                className={`material-symbols-outlined notranslate text-[20px] transition-transform duration-200 ${
                  saving ? 'animate-spin' : ''
                }`}
                id="btn-icon"
              >
                {saving ? 'sync' : isSavedConfirmed ? 'verified' : 'check_circle'}
              </span>
              <span id="btn-text">
                {saving
                  ? 'Menyinkronkan ke SIM SMKN 1...'
                  : isSavedConfirmed
                  ? 'Tersahkan & Terkirim ke Kurikulum'
                  : 'Simpan & Sahkan Presensi Kelas'}
              </span>
            </button>
          </div>
        </div>

        {/* Celebratory Floating Toast Notification with Spring Bounce */}
        {floatingToast && (
          <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 animate-fade-in"
            id="toast-notif"
          >
            <div className="bg-inverse-surface/95 backdrop-blur-md text-inverse-on-surface px-5 py-3 rounded-full shadow-[0_12px_32px_rgba(11,28,48,0.3)] flex items-center gap-2.5 font-label-md text-label-md border border-white/10">
              <span className="material-symbols-outlined notranslate text-[20px] text-emerald-400" id="toast-icon">
                check_circle
              </span>
              <span className="font-medium" id="toast-text">
                {floatingToast}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-container-lowest overflow-y-auto">
        {content}
      </div>
    );
  }

  return content;
};
