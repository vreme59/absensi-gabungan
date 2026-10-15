import React, { useState, useEffect } from 'react';
import {
  getWhatsAppConfig,
  fetchLiveWhatsAppStatus,
  sendPanggilGuruWhatsApp,
  WhatsAppGatewayConfig,
} from '../services/whatsappService';

interface PanggilGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTeacherName?: string;
  initialClassName?: string;
  initialRoomName?: string;
  studentName?: string;
  onSuccess?: (message: string) => void;
}

export const PanggilGuruModal: React.FC<PanggilGuruModalProps> = ({
  isOpen,
  onClose,
  initialTeacherName = 'Budi Santoso, S.Kom',
  initialClassName = 'XII TKJ 1',
  initialRoomName = 'Lab Komputer 2',
  studentName = 'Cindy Laura',
  onSuccess,
}) => {
  const [teacherName, setTeacherName] = useState(initialTeacherName);
  const [className, setClassName] = useState(initialClassName);
  const [roomName, setRoomName] = useState(initialRoomName);
  const [targetPhone, setTargetPhone] = useState('0812-4895-7075');
  const [isSending, setIsSending] = useState(false);
  const [isSuccessSent, setIsSuccessSent] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [waConfig, setWaConfig] = useState<WhatsAppGatewayConfig>(getWhatsAppConfig());

  useEffect(() => {
    if (isOpen) {
      setTeacherName(initialTeacherName);
      setClassName(initialClassName);
      setRoomName(initialRoomName);
      setIsSuccessSent(false);
      setIsSending(false);
      setFeedback(null);

      // Fetch live status from backend so we know if bot is connected
      fetchLiveWhatsAppStatus().then((conf) => {
        setWaConfig(conf);
        setTargetPhone(conf.defaultTeacherPhone || '0812-4895-7075');
      });
    }
  }, [isOpen, initialTeacherName, initialClassName, initialRoomName]);

  if (!isOpen) return null;

  const currentWIT = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT';

  const previewMessage = `Halo Pak/Ibu Guru ${teacherName}, Anda dipanggil oleh kelas ${className} untuk segera hadir di ${roomName}.\n\nWaktu Panggilan: ${currentWIT}\nDipanggil oleh: ${studentName}\n\nMohon kehadirannya di kelas, terima kasih.\n_Sistem Informasi Presensi SMKN 1 Sorong_`;

  const handleSendAutomatic = async () => {
    setIsSending(true);
    setFeedback(null);

    try {
      const result = await sendPanggilGuruWhatsApp({
        teacherName,
        className,
        roomName,
        senderName: studentName,
        customPhone: targetPhone,
        timeSlot: currentWIT,
      });

      setIsSending(false);

      if (result.viaBot) {
        setIsSuccessSent(true);
        setFeedback({
          type: 'success',
          text: `✅ Pesan WhatsApp otomatis BERHASIL terkirim ke HP Guru (${result.phone}) via Bot!`,
        });

        if (onSuccess) {
          onSuccess(`Panggilan WhatsApp berhasil dikirim ke ${teacherName} (${result.phone})!`);
        }

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        // Bot is not connected or in cloud preview: open direct WhatsApp link so message REALLY goes to teacher's WA
        setFeedback({
          type: 'warning',
          text: `Bot WhatsApp belum terhubung. Mengalihkan ke WhatsApp langsung (wa.me) ke nomor ${result.phone}...`,
        });

        window.open(result.directWaUrl, '_blank', 'noopener,noreferrer');

        if (onSuccess) {
          onSuccess(`Membuka WhatsApp ke nomor ${result.phone}...`);
        }

        setTimeout(() => {
          onClose();
        }, 2500);
      }
    } catch (err: any) {
      console.error(err);
      setIsSending(false);
      // Fallback direct WA link on exception
      const clean = targetPhone.replace(/\D/g, '').replace(/^0/, '62');
      window.open(`https://wa.me/${clean}?text=${encodeURIComponent(previewMessage)}`, '_blank', 'noopener,noreferrer');
      setFeedback({
        type: 'error',
        text: 'Gagal kirim otomatis. Membuka chat WhatsApp langsung...',
      });
    }
  };

  const handleOpenDirectWhatsApp = async () => {
    const result = await sendPanggilGuruWhatsApp({
      teacherName,
      className,
      roomName,
      senderName: studentName,
      customPhone: targetPhone,
      timeSlot: currentWIT,
    });

    // Open WhatsApp Web or mobile WhatsApp directly
    window.open(result.directWaUrl, '_blank', 'noopener,noreferrer');

    if (onSuccess) {
      onSuccess(`Membuka WhatsApp ke nomor ${result.phone}...`);
    }
    onClose();
  };

  const isBotConnected = waConfig.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100 max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header WhatsApp Style */}
        <div className="p-4 bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#25d366] text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xs">
              <span className="material-symbols-outlined notranslate text-[22px] text-white">
                phone_in_talk
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-bold tracking-tight">Panggil Guru via WhatsApp</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                Kirim notifikasi panggil langsung ke HP Guru
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined notranslate text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-800 text-xs">
          
          {/* Status Badge Gateway */}
          <div className={`flex items-center justify-between p-2.5 rounded-2xl border ${
            isBotConnected
              ? 'bg-emerald-50 border-emerald-200/80'
              : 'bg-amber-50 border-amber-200/80'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isBotConnected ? 'bg-emerald-500 ring-4 ring-emerald-200' : 'bg-amber-500 ring-4 ring-amber-200'
              }`} />
              <span className={`text-[11px] font-bold ${
                isBotConnected ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {isBotConnected
                  ? `Bot WhatsApp: Terhubung Online (${waConfig.connectedPhone || 'Aktif'}) 🟢`
                  : 'Bot WhatsApp: Standby (Direct wa.me Aktif) 🟡'}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md text-emerald-800 border border-emerald-200 font-bold">
              JS Gateway
            </span>
          </div>

          {/* Teacher and Class Information Form */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Guru yang Dipanggil:
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Nama guru pengampu..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Kelas Pemanggil:
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Ruangan / Lab:
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
                <span>Nomor WhatsApp Guru:</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Tujuan Resmi SMKN 1</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined notranslate absolute left-3 text-emerald-600 text-[18px]">
                  call
                </span>
                <input
                  type="text"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-emerald-300 font-mono font-bold text-emerald-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pratinjau Pesan Chat WhatsApp */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined notranslate text-[16px] text-emerald-600">
                chat
              </span>
              Pratinjau Format Pesan WhatsApp:
            </label>
            <div className="bg-[#e5ddd5] p-3 rounded-2xl border border-emerald-200/50 shadow-inner relative">
              <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-xs text-slate-800 text-[11px] leading-relaxed relative">
                <p className="font-bold text-[#075e54] mb-1">
                  🔔 Panggilan Siswa SMKN 1 Sorong
                </p>
                <p className="whitespace-pre-line text-slate-700">
                  {previewMessage}
                </p>
                <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1">
                  <span>{currentWIT}</span>
                  <span className="text-emerald-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback / Notification */}
          {feedback && (
            <div className={`p-3 rounded-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2 border ${
              feedback.type === 'success'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                : feedback.type === 'warning'
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-rose-100 border-rose-300 text-rose-900'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                feedback.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                <span className="material-symbols-outlined notranslate text-[20px]">
                  {feedback.type === 'success' ? 'check' : 'warning'}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold leading-tight">{feedback.text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            onClick={handleSendAutomatic}
            disabled={isSending || isSuccessSent}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#075e54] to-[#128c7e] hover:from-[#064e46] hover:to-[#0f776a] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mengirim via Gateway...</span>
              </>
            ) : isSuccessSent ? (
              <>
                <span className="material-symbols-outlined notranslate text-[18px]">done_all</span>
                <span>Terkirim ke WhatsApp Guru!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined notranslate text-[18px]">send</span>
                <span>Kirim via WA Otomatis 🚀</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenDirectWhatsApp}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Buka Aplikasi WhatsApp Langsung"
          >
            <span className="material-symbols-outlined notranslate text-[18px]">open_in_new</span>
            <span>Buka WA (wa.me)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
