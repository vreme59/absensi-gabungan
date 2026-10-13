import React from 'react';
import { ScheduleSlot } from '../types';
import { ASSETS } from '../data/adminMockData';

interface PrintModalProps {
  isOpen: boolean;
  schedules: ScheduleSlot[];
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  schedules,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#eceef0] max-h-[85vh] animate-scaleUp">
        {/* Header bar */}
        <div className="p-4 bg-[#00609b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">print</span>
            <h3 className="text-[14px] font-bold">Format Cetak Jadwal Pelajaran</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Printable Document Area */}
        <div className="p-6 bg-white overflow-y-auto space-y-4 text-[#191c1e] text-[12px]">
          {/* Official Letterhead */}
          <div className="flex items-center gap-3 border-b-2 border-black pb-3">
            <img src={ASSETS.logo} alt="Logo" className="w-12 h-12 object-contain" />
            <div className="text-center flex-1">
              <p className="text-[10px] uppercase font-bold tracking-wider">
                Pemerintah Provinsi Papua Barat Daya • Dinas Pendidikan
              </p>
              <h2 className="text-[14px] font-extrabold text-[#00609b]">
                SMK NEGERI 1 SORONG
              </h2>
              <p className="text-[10px] text-[#404751]">
                Jadwal Pelajaran Kelas XII TKJ 1 • Semester Ganjil TA 2026/2027
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-[#bfc7d3] text-[11px]">
              <thead>
                <tr className="bg-[#f2f4f6]">
                  <th className="border border-[#bfc7d3] p-1.5 text-center font-bold">JP</th>
                  <th className="border border-[#bfc7d3] p-1.5 font-bold">Waktu (WIT)</th>
                  <th className="border border-[#bfc7d3] p-1.5 font-bold">Mata Pelajaran</th>
                  <th className="border border-[#bfc7d3] p-1.5 font-bold">Guru Pengampu</th>
                  <th className="border border-[#bfc7d3] p-1.5 font-bold">Ruang</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s, idx) => {
                  if (s.isBreak) {
                    return (
                      <tr key={idx} className="bg-amber-50 text-amber-900 font-semibold">
                        <td colSpan={5} className="border border-[#bfc7d3] p-1.5 text-center">
                          ☕ {s.breakTitle} ({s.timeRange})
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} className="hover:bg-[#f7f9fb]">
                      <td className="border border-[#bfc7d3] p-1.5 text-center font-bold text-[#00609b]">
                        {s.jpLabel || `JP ${s.jpStart}-${s.jpEnd}`}
                      </td>
                      <td className="border border-[#bfc7d3] p-1.5">{s.timeRange}</td>
                      <td className="border border-[#bfc7d3] p-1.5 font-bold">{s.subject}</td>
                      <td className="border border-[#bfc7d3] p-1.5">{s.teacher}</td>
                      <td className="border border-[#bfc7d3] p-1.5">{s.room}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature block */}
          <div className="pt-4 flex justify-between text-[11px]">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala SMKN 1 Sorong</p>
              <div className="h-12" />
              <p className="font-bold underline">Drs. Fransiskus Kambu, M.M</p>
              <p className="text-[10px] text-[#707882]">NIP. 19681120 199403 1 004</p>
            </div>
            <div className="text-right">
              <p>Sorong, 9 Oktober 2026</p>
              <p className="font-bold">Wali Kelas XII TKJ 1</p>
              <div className="h-12" />
              <p className="font-bold underline">Budi Santoso, S.Kom</p>
              <p className="text-[10px] text-[#707882]">NIP. 19850315 201101 1 009</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-[#f2f4f6] border-t border-[#eceef0] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#eceef0] text-[#404751] text-[12px] font-bold hover:bg-[#e6e8ea]"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              window.print();
            }}
            className="px-4 py-2 rounded-full bg-[#00609b] text-white text-[12px] font-bold hover:bg-[#0079c2] flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Cetak Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};
