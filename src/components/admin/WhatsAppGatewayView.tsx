import React, { useState, useEffect } from 'react';
import {
  getWhatsAppConfig,
  refreshWhatsAppQr,
  setWhatsAppConnected,
  setWhatsAppDisconnected,
  updateDefaultTeacherPhone,
  getQrCodeImageUrl,
  sendPanggilGuruWhatsApp,
  WhatsAppGatewayConfig,
  WhatsAppMessageLog,
} from '../../services/whatsappService';

interface WhatsAppGatewayViewProps {
  onShowFeedback?: (msg: string) => void;
}

export const WhatsAppGatewayView: React.FC<WhatsAppGatewayViewProps> = ({ onShowFeedback }) => {
  const [config, setConfig] = useState<WhatsAppGatewayConfig>(getWhatsAppConfig());
  const [teacherPhoneInput, setTeacherPhoneInput] = useState(config.defaultTeacherPhone);
  const [testTeacherName, setTestTeacherName] = useState('Budi Santoso, S.Kom');
  const [testClassName, setTestClassName] = useState('XII TKJ 1');
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
        setTeacherPhoneInput(e.detail.defaultTeacherPhone);
      }
    };
    window.addEventListener('whatsapp-config-updated', handleUpdate);
    return () => window.removeEventListener('whatsapp-config-updated', handleUpdate);
  }, []);

  const handleRefreshQr = () => {
    setIsRefreshingQr(true);
    setTimeout(() => {
      const updated = refreshWhatsAppQr();
      setConfig(updated);
      setIsRefreshingQr(false);
      if (onShowFeedback) {
        onShowFeedback('QR Code WhatsApp berhasil di-refresh & diperbarui!');
      }
    }, 500);
  };

  const handleConnectSimulate = () => {
    const updated = setWhatsAppConnected();
    setConfig(updated);
    if (onShowFeedback) {
      onShowFeedback('Sesi WhatsApp berhasil ditautkan & aktif (Connected)!');
    }
  };

  const handleDisconnectSimulate = () => {
    const updated = setWhatsAppDisconnected();
    setConfig(updated);
    if (onShowFeedback) {
      onShowFeedback('Sesi WhatsApp diputuskan. Silakan scan QR code untuk menghubungkan kembali.');
    }
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = updateDefaultTeacherPhone(teacherPhoneInput);
    setConfig(updated);
    if (onShowFeedback) {
      onShowFeedback(`Nomor tujuan WhatsApp guru diperbarui: ${updated.defaultTeacherPhone}`);
    }
  };

  const handleTestSend = (e: React.FormEvent) => {
    e.preventDefault();
    const result = sendPanggilGuruWhatsApp({
      teacherName: testTeacherName,
      className: testClassName,
      roomName: 'Lab Komputer 2',
      senderName: 'Superadmin Sorong (Uji Coba)',
      customPhone: config.defaultTeacherPhone,
    });
    setConfig(getWhatsAppConfig());
    if (onShowFeedback) {
      onShowFeedback(`Uji coba pesan WA berhasil dikirim ke ${result.phone}!`);
    }
  };

  const isConnected = config.status === 'connected';
  const qrImageUrl = getQrCodeImageUrl(config.qrCodeToken);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Banner Pengantar */}
      <div className="bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#25d366] text-white p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 ring-2 ring-white/30 shadow-md">
            <span className="material-symbols-outlined notranslate text-[28px] text-white">
              qr_code_scanner
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-black tracking-tight">WhatsApp Gateway JS (Super Admin)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#075e54] uppercase tracking-wider">
                Root
              </span>
            </div>
            <p className="text-[12px] text-emerald-100 mt-0.5 leading-relaxed">
              Integrasi bot JS gratis untuk otomatisasi notifikasi <strong>Panggil Guru</strong> dari murid ke WhatsApp guru.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="relative z-10 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
          <span
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-[#25d366] ring-4 ring-emerald-300 animate-pulse' : 'bg-amber-400 ring-4 ring-amber-200'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isConnected ? 'Sesi Aktif / Terhubung' : 'Menunggu Scan QR'}
            </span>
            <span className="text-[10px] text-emerald-200">
              {isConnected ? config.connectedAt : 'Silakan scan QR di bawah'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kolom Kiri: QR Code WhatsApp Web Pairing */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-emerald-600 text-[20px]">
                phonelink_ring
              </span>
              <h3 className="text-sm font-bold text-slate-800">QR Code Tautkan Perangkat</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">v2.3000 JS</span>
          </div>

          {/* QR Code Container */}
          <div className="relative p-3.5 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-3xl flex flex-col items-center justify-center my-1 shadow-inner">
            {isRefreshingQr ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Menghasilkan QR Baru...</span>
              </div>
            ) : (
              <div className="relative group">
                <img
                  src={qrImageUrl}
                  alt="WhatsApp Web QR Code"
                  className={`w-60 h-60 rounded-2xl object-contain transition-all ${
                    isConnected ? 'opacity-30 blur-[2px]' : 'opacity-100'
                  }`}
                />
                
                {/* Logo WhatsApp di tengah QR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {isConnected ? (
                    <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in zoom-in-95">
                      <span className="material-symbols-outlined notranslate text-[24px]">verified</span>
                      <span className="font-bold text-xs">WhatsApp Terhubung!</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2 border border-slate-200">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                        alt="WhatsApp"
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 text-[11px] text-slate-500 font-medium">
              Update QR Terakhir: <strong className="text-slate-700">{config.lastQrUpdate}</strong>
            </div>
          </div>

          {/* Petunjuk Penggunaan */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60 text-left w-full mt-3 space-y-1.5">
            <h4 className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
              <span className="material-symbols-outlined notranslate text-[16px] text-emerald-700">info</span>
              Cara Menghubungkan Jika WA Terputus:
            </h4>
            <ol className="text-[11px] text-emerald-900/90 list-decimal list-inside space-y-1 pl-1">
              <li>Buka WhatsApp di ponsel guru atau nomor resmi sekolah.</li>
              <li>Ketuk menu titik tiga (⋮) atau <strong>Pengaturan</strong> &gt; <strong>Perangkat Tertaut</strong>.</li>
              <li>Pilih <strong>Tautkan Perangkat</strong> lalu arahkan kamera ke kode QR di atas.</li>
              <li>Jika QR kadaluarsa / terputus, klik tombol <strong>Refresh QR Baru</strong> di bawah.</li>
            </ol>
          </div>

          {/* Tombol Kontrol QR & Sesi */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={handleRefreshQr}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-slate-200"
            >
              <span className="material-symbols-outlined notranslate text-[16px] text-emerald-700">refresh</span>
              <span>Refresh QR Baru</span>
            </button>

            {isConnected ? (
              <button
                type="button"
                onClick={handleDisconnectSimulate}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-rose-200"
              >
                <span className="material-symbols-outlined notranslate text-[16px]">link_off</span>
                <span>Putuskan Sesi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectSimulate}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined notranslate text-[16px]">qr_code_scanner</span>
                <span>Simulasi Scan OK</span>
              </button>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan Nomor Guru & Log Pengiriman */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Card 1: Konfigurasi Nomor WhatsApp Guru Default */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-emerald-600 text-[20px]">
                  contact_phone
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Nomor WhatsApp Guru Default (Penerima Panggilan)
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Sesuai Permintaan
              </span>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Nomor WhatsApp Semua Guru (Dianggap Sama):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 flex items-center">
                    <span className="material-symbols-outlined notranslate absolute left-3 text-emerald-600 text-[18px]">
                      call
                    </span>
                    <input
                      type="text"
                      value={teacherPhoneInput}
                      onChange={(e) => setTeacherPhoneInput(e.target.value)}
                      placeholder="0812-4895-7075"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#075e54] hover:bg-[#064e46] text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined notranslate text-[16px]">save</span>
                    <span>Simpan</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Nomor ini digunakan sebagai target kirim saat siswa menekan tombol <strong>Panggil Guru</strong> di halaman murid. Format pesan otomatis menyertakan nama guru dan kelas yang memanggil.
              </p>
            </form>
          </div>

          {/* Card 2: Uji Coba Kirim Panggil Guru */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-emerald-600 text-[20px]">
                  send
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Uji Coba Pengiriman Pesan WhatsApp
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Test Simulator</span>
            </div>

            <form onSubmit={handleTestSend} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Nama Guru:
                  </label>
                  <input
                    type="text"
                    value={testTeacherName}
                    onChange={(e) => setTestTeacherName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Kelas Pemanggil:
                  </label>
                  <input
                    type="text"
                    value={testClassName}
                    onChange={(e) => setTestClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Template Preview */}
              <div className="bg-[#e5ddd5] p-3 rounded-2xl border border-slate-200">
                <div className="bg-white p-3 rounded-xl text-slate-800 text-[11px] leading-relaxed shadow-xs">
                  <p className="font-bold text-[#075e54] mb-0.5">🔔 Notifikasi Otomatis WhatsApp:</p>
                  <p className="text-slate-700">
                    Halo Pak/Ibu Guru <strong>{testTeacherName}</strong>, Anda dipanggil oleh kelas <strong>{testClassName}</strong> untuk segera hadir di Lab Komputer 2. Mohon kehadirannya di kelas, terima kasih.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#075e54] to-[#128c7e] hover:from-[#064e46] hover:to-[#0f776a] text-white font-bold text-xs transition active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined notranslate text-[16px]">forward_to_inbox</span>
                <span>Kirim Uji Coba WhatsApp ke {config.defaultTeacherPhone}</span>
              </button>
            </form>
          </div>

          {/* Card 3: Log Riwayat Pesan WhatsApp */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-emerald-600 text-[20px]">
                  history
                </span>
                <h3 className="text-sm font-bold text-slate-800">
                  Riwayat Panggilan Guru via WhatsApp ({config.messagesHistory?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Live Gateway Logs</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {!config.messagesHistory || config.messagesHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada riwayat pesan panggil guru.
                </div>
              ) : (
                config.messagesHistory.map((log: WhatsAppMessageLog) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200/80 transition-colors flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-xs">
                          {log.teacherName}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-bold">
                          {log.className}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {log.messageText}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                      <span className="text-slate-500">
                        Ke: <strong className="font-mono text-emerald-700">{log.recipientPhone}</strong> ({log.roomName})
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <span className="material-symbols-outlined notranslate text-[14px]">done_all</span>
                        <span>{log.status === 'read' ? 'Dibaca Guru' : log.status === 'delivered' ? 'Terkirim (WA)' : 'Diproses'}</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
