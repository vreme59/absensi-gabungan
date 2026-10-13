import React from 'react';
import { Student } from '../../types';

interface AttachmentModalProps {
  student: Student | null;
  onClose: () => void;
}

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  student,
  onClose,
}) => {
  if (!student) return null;

  const isMedical = student.attachmentType === 'medical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-[#eceef0] animate-scaleUp">
        {/* Header */}
        <div className="p-4 bg-[#00609b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]">
              {isMedical ? 'medical_services' : 'assignment'}
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold truncate">
                {isMedical ? 'Surat Keterangan Sakit' : 'Surat Dispensasi LKS'}
              </h3>
              <p className="text-[11px] text-[#cfe4ff] truncate">
                {student.name} ({student.nis})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Document Body (Simulated Official Academic / Hospital Letter) */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto bg-[#f7f9fb]">
          <div className="bg-white p-5 rounded-2xl border border-[#eceef0] shadow-sm flex flex-col gap-3 font-sans text-[#191c1e]">
            {/* Kop Surat */}
            <div className="border-b-2 border-black/80 pb-3 text-center">
              {isMedical ? (
                <>
                  <p className="text-[11px] tracking-wider uppercase font-bold text-[#404751]">
                    Pemerintah Kota Sorong • Dinas Kesehatan
                  </p>
                  <p className="text-[14px] font-bold text-[#00609b]">
                    RSUD SELE BE SOLU KOTA SORONG
                  </p>
                  <p className="text-[10px] text-[#404751]">
                    Jl. Sele Be Solu Km. 12, Kel. Klablim, Sorong Timur, Papua Barat Daya
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] tracking-wider uppercase font-bold text-[#404751]">
                    Dinas Pendidikan &amp; Kebudayaan Papua Barat Daya
                  </p>
                  <p className="text-[14px] font-bold text-[#00609b]">
                    MKKS SMK KOTA SORONG
                  </p>
                  <p className="text-[10px] text-[#404751]">
                    Sekretariat: SMKN 1 Sorong, Jl. Pramuka No. 1 Sorong
                  </p>
                </>
              )}
            </div>

            {/* Letter Number & Title */}
            <div className="text-center my-1">
              <p className="text-[13px] font-bold uppercase underline">
                {isMedical ? 'SURAT KETERANGAN ISTIRAHAT DOKTER' : 'SURAT REKOMENDASI DISPENSASI'}
              </p>
              <p className="text-[10px] text-[#404751]">
                Nomor: {isMedical ? '440/109/RSUD-SBS/X/2026' : '028/LKS-SMK/SRG/X/2026'}
              </p>
            </div>

            {/* Content Details */}
            <div className="text-[12px] space-y-1.5 leading-relaxed text-[#191c1e]">
              <p className="text-[11px] text-[#404751]">
                Yang bertanda tangan di bawah ini menerangkan bahwa:
              </p>
              <div className="bg-[#f2f4f6] p-2.5 rounded-xl space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#404751]">Nama Siswa:</span>
                  <span className="font-bold">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#404751]">NIS / NISN:</span>
                  <span className="font-semibold">{student.nis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#404751]">Kelas / Jurusan:</span>
                  <span className="font-semibold">XII TKJ 1 (Teknik Komputer)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#404751]">Sekolah:</span>
                  <span className="font-semibold">SMKN 1 Sorong</span>
                </div>
              </div>

              {isMedical ? (
                <p className="text-[11px] leading-relaxed pt-1">
                  Berdasarkan hasil pemeriksaan medis, pasien didiagnosa mengalami{' '}
                  <strong className="text-[#00609b]">Febris Akut (Demam Tinggi)</strong> dan
                  memerlukan istirahat selama <strong>2 (dua) hari</strong> terhitung tanggal{' '}
                  <strong>9 s.d. 10 Oktober 2026</strong>.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed pt-1">
                  Diberikan dispensasi tidak mengikuti proses KBM tatap muka dikarenakan sedang
                  mengikuti pembinaan intensif dan karantina{' '}
                  <strong className="text-[#00609b]">
                    Lomba Kompetensi Siswa (LKS) Tingkat Kota Sorong
                  </strong>{' '}
                  Bidang <em>IT Network Systems &amp; Web Technologies</em>.
                </p>
              )}
            </div>

            {/* Stamped Signature */}
            <div className="mt-3 pt-2 border-t border-[#eceef0] flex justify-between items-end">
              <div className="flex items-center gap-1.5 text-[10px] text-[#006947] bg-[#00855b]/10 px-2.5 py-1 rounded-full font-bold">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Terverifikasi SIAP Sorong
              </div>
              <div className="text-right text-[10px]">
                <p className="text-[#404751]">Sorong, 9 Oktober 2026</p>
                <div className="my-1 py-1 font-bold text-[#00609b]">
                  {isMedical ? 'dr. Ronald Hendrik, Sp.A' : 'Ketua Pokja LKS Sorong'}
                </div>
                <p className="text-[#707882]">SIP. 19820412 201001 1 003</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-[#eceef0] flex items-center justify-between">
          <span className="text-[11px] text-[#707882] flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Dokumen Resmi Terenkripsi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#00609b] text-white text-[12px] font-bold hover:bg-[#0079c2] active:scale-95 transition-all"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
