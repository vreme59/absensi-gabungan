import React, { useState, useEffect } from 'react';
import { ScheduleSlot } from '../types';
import { JP_TIMES } from '../data/adminMockData';

interface ScheduleModalProps {
  isOpen: boolean;
  editingSlot: ScheduleSlot | null;
  onClose: () => void;
  onSave: (slotData: Partial<ScheduleSlot>) => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  editingSlot,
  onClose,
  onSave,
}) => {
  const [mapel, setMapel] = useState('BA - Pemodelan Perangkat Lunak');
  const [guru, setGuru] = useState('Budi Santoso, S.Kom');
  const [ruang, setRuang] = useState('Lab Komputer 2');
  const [jpStart, setJpStart] = useState(1);
  const [jpEnd, setJpEnd] = useState(3);
  const [day, setDay] = useState<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'>('Selasa');

  useEffect(() => {
    if (editingSlot) {
      setMapel(editingSlot.subject || 'BA - Pemodelan Perangkat Lunak');
      setGuru(editingSlot.teacher || 'Budi Santoso, S.Kom');
      setRuang(editingSlot.room || 'Lab Komputer 2');
      setJpStart(editingSlot.jpStart || 1);
      setJpEnd(editingSlot.jpEnd || 3);
      setDay(editingSlot.day || 'Selasa');
    } else {
      setMapel('BA - Pemodelan Perangkat Lunak');
      setGuru('Budi Santoso, S.Kom');
      setRuang('Lab Komputer 2');
      setJpStart(1);
      setJpEnd(3);
      setDay('Selasa');
    }
  }, [editingSlot, isOpen]);

  if (!isOpen) return null;

  // Calculate estimated WIT time
  const startTime = JP_TIMES[jpStart] || '07:15';
  const endTime = JP_TIMES[Math.min(jpEnd + 1, 10)] || '15:00';
  const timeDisplay = `${startTime} - ${endTime} WIT`;

  const handleJpStartChange = (val: number) => {
    setJpStart(val);
    if (val > jpEnd) {
      setJpEnd(val);
    }
  };

  const handleJpEndChange = (val: number) => {
    if (val < jpStart) {
      setJpEnd(jpStart);
    } else {
      setJpEnd(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      subject: mapel,
      teacher: guru,
      room: ruang,
      jpStart,
      jpEnd,
      jpLabel: jpStart === jpEnd ? `JP ${jpStart}` : `JP ${jpStart} - ${jpEnd}`,
      timeRange: timeDisplay,
      day,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity duration-300">
      <div className="w-full max-w-lg bg-white rounded-t-[28px] shadow-2xl p-5 transform transition-transform duration-300 ease-out flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-[#bfc7d3] rounded-full mx-auto -mt-1 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#cfe4ff] flex items-center justify-center text-[#00609b]">
              <span className="material-symbols-outlined text-[20px]">edit_calendar</span>
            </div>
            <div>
              <h3 className="text-[16px] text-[#191c1e] font-bold">
                {editingSlot ? 'Edit Sesi Jadwal' : 'Tambah Sesi Jadwal'}
              </h3>
              <p className="text-[12px] text-[#404751]">
                Atur slot mata pelajaran untuk XII TKJ 1
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center text-[#404751] hover:bg-[#e6e8ea] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Fields Grid */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 pt-1">
          {/* Field: Hari */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#404751] font-semibold">
              Hari Pembelajaran
            </label>
            <div className="relative">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as any)}
                className="w-full h-11 bg-[#f2f4f6] rounded-xl px-3.5 pr-10 text-[14px] text-[#191c1e] font-medium appearance-none focus:outline-hidden focus:bg-[#eceef0] transition-colors cursor-pointer"
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-[20px] text-[#707882] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Field 1: Mata Pelajaran */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#404751] font-semibold">
              Mata Pelajaran (Mapel)
            </label>
            <div className="relative">
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full h-12 bg-[#f2f4f6] rounded-xl px-3.5 pr-10 text-[14px] text-[#191c1e] font-medium appearance-none focus:outline-hidden focus:bg-[#eceef0] transition-colors cursor-pointer"
              >
                <option value="Pemodelan Perangkat Lunak (BA)">
                  BA - Pemodelan Perangkat Lunak
                </option>
                <option value="Pemrograman Web & Bergerak (TS)">
                  TS - Pemrograman Web &amp; Bergerak
                </option>
                <option value="Administrasi Sistem Jaringan (AX)">
                  AX - Administrasi Sistem Jaringan
                </option>
                <option value="Bimbingan Konseling (BK)">
                  BK - Bimbingan Konseling
                </option>
                <option value="Produk Kreatif & Kewirausahaan (PK)">
                  PK - Produk Kreatif &amp; Kewirausahaan
                </option>
                <option value="Teknologi Layanan Jaringan (TL)">
                  TL - Teknologi Layanan Jaringan
                </option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[20px] text-[#707882] pointer-events-none">
                unfold_more
              </span>
            </div>
          </div>

          {/* Field 2: Guru Pengampu */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#404751] font-semibold">
              Guru Pengampu
            </label>
            <div className="relative">
              <select
                value={guru}
                onChange={(e) => setGuru(e.target.value)}
                className="w-full h-12 bg-[#f2f4f6] rounded-xl px-3.5 pr-10 text-[14px] text-[#191c1e] font-medium appearance-none focus:outline-hidden focus:bg-[#eceef0] transition-colors cursor-pointer"
              >
                <option value="Budi Santoso, S.Kom">Budi Santoso, S.Kom</option>
                <option value="Ratna Dewi, M.Pd">Ratna Dewi, M.Pd</option>
                <option value="Ahmad Dani, S.Pd">Ahmad Dani, S.Pd</option>
                <option value="Endang Supriadi, M.Kom">Endang Supriadi, M.Kom</option>
                <option value="Siti Aminah, S.Kom">Siti Aminah, S.Kom</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[20px] text-[#707882] pointer-events-none">
                person_search
              </span>
            </div>
          </div>

          {/* Field: Ruang / Lab */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#404751] font-semibold">
              Ruang Pembelajaran
            </label>
            <div className="relative">
              <select
                value={ruang}
                onChange={(e) => setRuang(e.target.value)}
                className="w-full h-12 bg-[#f2f4f6] rounded-xl px-3.5 pr-10 text-[14px] text-[#191c1e] font-medium appearance-none focus:outline-hidden focus:bg-[#eceef0] transition-colors cursor-pointer"
              >
                <option value="Lab Komputer 2">Lab Komputer 2</option>
                <option value="Bengkel RPL">Bengkel RPL</option>
                <option value="Lab Web Dev">Lab Web Dev</option>
                <option value="Lab Jaringan TKJ">Lab Jaringan TKJ</option>
                <option value="Ruang Kelas TKJ 1">Ruang Kelas TKJ 1</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-[20px] text-[#707882] pointer-events-none">
                meeting_room
              </span>
            </div>
          </div>

          {/* Field 3: Rentang Jam Pelajaran (JP) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-[#404751] font-semibold">
              Rentang Jam Pelajaran (JP)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-[#707882] absolute left-3 top-1 pointer-events-none">
                  Mulai
                </label>
                <select
                  value={jpStart}
                  onChange={(e) => handleJpStartChange(parseInt(e.target.value))}
                  className="w-full h-12 pt-3.5 bg-[#f2f4f6] rounded-xl px-3 text-[12px] text-[#191c1e] font-bold appearance-none focus:outline-hidden cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>
                      JP {n}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-3.5 text-[18px] text-[#707882] pointer-events-none">
                  expand_more
                </span>
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-[#707882] absolute left-3 top-1 pointer-events-none">
                  Selesai
                </label>
                <select
                  value={jpEnd}
                  onChange={(e) => handleJpEndChange(parseInt(e.target.value))}
                  className="w-full h-12 pt-3.5 bg-[#f2f4f6] rounded-xl px-3 text-[12px] text-[#191c1e] font-bold appearance-none focus:outline-hidden cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>
                      JP {n}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-3.5 text-[18px] text-[#707882] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Field 4: Kalkulasi Waktu Otomatis */}
          <div className="p-3 rounded-xl bg-[#f2f4f6] flex items-center justify-between border border-[#eceef0]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#00609b]">
                pace
              </span>
              <div>
                <p className="text-[11px] text-[#404751] font-medium">
                  Estimasi Waktu Sorong
                </p>
                <p className="text-[14px] font-bold text-[#00609b]">
                  {timeDisplay}
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#d1e4ff] text-[#001d36] font-bold">
              Otomatis
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-full bg-[#eceef0] text-[#191c1e] text-[14px] font-bold flex items-center justify-center hover:bg-[#e6e8ea] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-12 rounded-full bg-[#00609b] text-white text-[14px] font-bold flex items-center justify-center gap-1.5 shadow-[0_8px_16px_-2px_rgba(0,134,214,0.32)] hover:bg-[#0079c2] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan Jadwal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
