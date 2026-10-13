import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { MuridJadwalScreenProps } from '../types';
import { SCHEDULES_BY_DAY } from '../../data/samakan/scheduleData';

export const MuridJadwalScreen: React.FC<MuridJadwalScreenProps> = ({
  user,
  onShowToast,
}) => {
  const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const today = new Date();
  let hariIni = hariNames[today.getDay()];
  if (hariIni === 'Minggu') hariIni = 'Senin';

  const [selectedDay, setSelectedDay] = useState(hariIni);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbSchedules, setDbSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const currentKelasId = user.kelas?.id || user.kelas_id || 'e88128be-8fc3-4973-8d69-00ef17571626';
  const currentKelasNama = user.kelas?.nama || user.classRoom || 'XII TKJ 1';

  // Fetch Schedules from Supabase for this student's class
  useEffect(() => {
    async function fetchSchedules() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('jadwal')
          .select(`
            id, jam_mulai, jam_selesai, hari, ruang,
            mapel:mapel_id(nama),
            guru:guru_id(nama)
          `)
          .eq('kelas_id', currentKelasId)
          .eq('hari', selectedDay)
          .order('jam_mulai', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Group consecutive same-subject sessions
          const grouped: any[] = [];
          data.forEach((item: any) => {
            const last = grouped[grouped.length - 1];
            if (last && last.mapel?.nama === item.mapel?.nama && last.guru?.nama === item.guru?.nama) {
              last.jam_selesai = item.jam_selesai;
              last.sessionCount = (last.sessionCount || 1) + 1;
            } else {
              grouped.push({ ...item, sessionCount: 1 });
            }
          });
          setDbSchedules(grouped);
        } else {
          // Fallback to local schedule data
          const localItems = SCHEDULES_BY_DAY[selectedDay] || [];
          const mapped = localItems.map((item, idx) => ({
            id: `local-${idx}`,
            jam_mulai: item.startTime,
            jam_selesai: item.endTime,
            mapel: { nama: item.subject },
            guru: { nama: item.teacher },
            ruang: item.room,
            sessionCount: 1,
          }));
          setDbSchedules(mapped);
        }
      } catch (err: any) {
        console.warn('Error fetching schedules, using local fallback:', err);
        const localItems = SCHEDULES_BY_DAY[selectedDay] || [];
        const mapped = localItems.map((item, idx) => ({
          id: `local-${idx}`,
          jam_mulai: item.startTime,
          jam_selesai: item.endTime,
          mapel: { nama: item.subject },
          guru: { nama: item.teacher },
          ruang: item.room,
          sessionCount: 1,
        }));
        setDbSchedules(mapped);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedules();
  }, [currentKelasId, selectedDay]);

  // Filtered schedules by search query
  const filteredSchedules = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dbSchedules;
    return dbSchedules.filter(item => {
      const mapelName = (item.mapel?.nama || '').toLowerCase();
      const guruName = (item.guru?.nama || '').toLowerCase();
      return mapelName.includes(q) || guruName.includes(q);
    });
  }, [dbSchedules, searchQuery]);

  // Live status check helper
  const nowMin = today.getHours() * 60 + today.getMinutes();

  return (
    <div className="flex flex-col w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl mx-auto pb-28 font-body bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-container pt-6 pb-6 px-4 text-white shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-headline font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-[22px]">calendar_month</span>
              Jadwal Pelajaran
            </h1>
            <p className="text-xs text-sky-100 mt-0.5">
              Roster Resmi Kelas <strong className="text-white">{currentKelasNama}</strong> • SMKN 1 Sorong
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs backdrop-blur-sm">
            {filteredSchedules.length} Sesi
          </span>
        </div>
      </div>

      {/* Day Selector Navigation Tabs */}
      <div className="px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x">
          {days.map((day) => {
            const isToday = day === hariIni;
            const isSelected = day === selectedDay;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{day.toUpperCase()}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Box */}
      <div className="px-4 mt-2">
        <div className="relative w-full">
          <span className="material-symbols-outlined notranslate absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari mata pelajaran atau nama guru..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-xs"
          />
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="px-4 mt-3 space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined notranslate text-primary text-3xl animate-spin">sync</span>
            <p className="text-xs font-semibold text-slate-500">Memuat jadwal {selectedDay}...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined notranslate text-slate-400 text-3xl">event_busy</span>
            <p className="text-xs font-bold text-slate-700">Tidak ada jadwal pelajaran pada hari {selectedDay}</p>
            <p className="text-[11px] text-slate-400">Silakan pilih hari lainnya di bilah navigasi atas</p>
          </div>
        ) : (
          filteredSchedules.map((item, idx) => {
            const startStr = (item.jam_mulai || '00:00').substring(0, 5);
            const endStr = (item.jam_selesai || '00:00').substring(0, 5);
            const [sh, sm] = startStr.split(':').map(Number);
            const [eh, em] = endStr.split(':').map(Number);
            const startMinutes = sh * 60 + sm;
            const endMinutes = eh * 60 + em;

            const isToday = selectedDay === hariIni;
            const isLive = isToday && nowMin >= startMinutes && nowMin < endMinutes;
            const isDone = isToday && nowMin >= endMinutes;

            return (
              <div
                key={item.id || idx}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex gap-3 transition-all ${
                  isLive
                    ? 'border-primary ring-2 ring-primary/20 bg-sky-50/20'
                    : isDone
                    ? 'border-slate-200 opacity-60'
                    : 'border-slate-100'
                }`}
              >
                {/* Accent bar */}
                <div
                  className={`w-1 rounded-full shrink-0 ${
                    isLive ? 'bg-primary animate-pulse' : isDone ? 'bg-slate-300' : 'bg-primary/40'
                  }`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {startStr} - {endStr} WIT
                    </span>
                    {isLive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        SEDANG BERLANGSUNG
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-bold text-slate-400">
                        SELESAI
                      </span>
                    )}
                  </div>

                  <h3 className="font-headline font-bold text-sm text-slate-900 leading-snug">
                    {item.mapel?.nama || 'Mata Pelajaran'}
                  </h3>

                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined notranslate text-[14px] text-slate-400">person</span>
                      {item.guru?.nama || 'Guru Pengampu'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined notranslate text-[14px] text-slate-400">meeting_room</span>
                      {item.ruang || 'Ruang Kelas'}
                    </span>
                    {item.sessionCount > 1 && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                        {item.sessionCount} JP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
