import React, { useState, useEffect } from 'react';
import {
  getWhatsAppConfig,
  fetchLiveWhatsAppStatus,
  requestWhatsAppPairingCode,
  refreshWhatsAppQr,
  logoutWhatsAppGateway,
  updateDefaultTeacherPhone,
  sendPanggilGuruWhatsApp,
  WhatsAppGatewayConfig,
  WhatsAppMessageLog,
  DEFAULT_TEACHER_PHONE,
} from '../../services/whatsappService';

interface WhatsAppGatewayViewProps {
  onShowFeedback?: (msg: string) => void;
}

export const WhatsAppGatewayView: React.FC<WhatsAppGatewayViewProps> = ({ onShowFeedback }) => {
  const [config, setConfig] = useState<WhatsAppGatewayConfig>(getWhatsAppConfig());
  const [teacherPhoneInput, setTeacherPhoneInput] = useState(config.defaultTeacherPhone || DEFAULT_TEACHER_PHONE);
  const [testTeacherName, setTestTeacherName] = useState('Budi Santoso, S.Kom');
  const [testClassName, setTestClassName] = useState('XII TKJ 1');
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [linkMode, setLinkMode] = useState<'qr' | 'pairing_code'>('qr');
  const [pairingPhoneInput, setPairingPhoneInput] = useState(config.defaultTeacherPhone || DEFAULT_TEACHER_PHONE);
  const [pairingCodeResult, setPairingCodeResult] = useState<string | null>(config.pairingCode);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Poll live WhatsApp status every 3 seconds for real-time QR updates & scan detection
  useEffect(() => {
    // Initial fetch
    fetchLiveWhatsAppStatus().then(setConfig);

    const interval = setInterval(() => {
      fetchLiveWhatsAppStatus().then(setConfig);
    }, 3000);

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
        if (e.detail.defaultTeacherPhone) {
          setTeacherPhoneInput(e.detail.defaultTeacherPhone);
        }
        if (e.detail.pairingCode) {
          setPairingCodeResult(e.detail.pairingCode);
        }
      }
    };

    window.addEventListener('whatsapp-config-updated', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('whatsapp-config-updated', handleUpdate);
    };
  }, []);

  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      const updated = await refreshWhatsAppQr();
      setConfig(updated);
      if (onShowFeedback) {
        onShowFeedback('QR Code WhatsApp sedang di-generate ulang dari server...');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsRefreshingQr(false), 800);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhoneInput.trim()) return;
    setIsRequestingCode(true);
    setPairingCodeResult(null);

    const res = await requestWhatsAppPairingCode(pairingPhoneInput);
    setIsRequestingCode(false);

    if (res.success && res.code) {
      setPairingCodeResult(res.code);
      if (onShowFeedback) {
        onShowFeedback(`Kode Pairing WhatsApp: ${res.code}. Masukkan pada WhatsApp HP Anda!`);
      }
    } else {
      if (onShowFeedback) {
        onShowFeedback(res.error || 'Gagal membuat kode pairing. Coba gunakan scan QR code.');
      }
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin memutuskan koneksi sesi WhatsApp bot ini?')) return;
    const updated = await logoutWhatsAppGateway();
    setConfig(updated);
    setPairingCodeResult(null);
    if (onShowFeedback) {
      onShowFeedback('Sesi WhatsApp berhasil diputuskan. Silakan scan QR code baru untuk menghubungkan kembali.');
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

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    try {
      const result = await sendPanggilGuruWhatsApp({
        teacherName: testTeacherName,
        className: testClassName,
        roomName: 'Lab Komputer 2',
        senderName: 'Superadmin Sorong (Uji Coba)',
        customPhone: config.defaultTeacherPhone,
      });
      setConfig(getWhatsAppConfig());
      if (result.viaBot) {
        if (onShowFeedback) {
          onShowFeedback(`✅ Pesan panggil guru terkirim otomatis melalui Bot WA ke ${result.phone}!`);
        }
      } else {
        if (onShowFeedback) {
          onShowFeedback(`📱 Pesan siap dikirim ke ${result.phone}. Membuka tautan direct WhatsApp...`);
        }
        window.open(result.directWaUrl, '_blank');
      }
    } catch (e: any) {
      if (onShowFeedback) {
        onShowFeedback('Gagal mengirim uji coba: ' + (e.message || String(e)));
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  const isConnected = config.status === 'connected';

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#075e54] via-[#128c7e] to-[#25d366] text-white p-5 rounded-3xl shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 ring-2 ring-white/30 shadow-md">
            <span className="material-symbols-outlined notranslate text-[28px] text-white">
              qr_code_scanner
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-black tracking-tight">WhatsApp Web JS Gateway (Super Admin)</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#075e54] uppercase tracking-wider">
                Baileys v7
              </span>
            </div>
            <p className="text-[12px] text-emerald-100 mt-0.5 leading-relaxed">
              Integrasi gateway WhatsApp asli untuk otomatisasi notifikasi <strong>Panggil Guru</strong> dari murid ke nomor WhatsApp guru.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="relative z-10 flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
          <span
            className={`w-3.5 h-3.5 rounded-full ${
              isConnected
                ? 'bg-[#25d366] ring-4 ring-emerald-300 animate-pulse'
                : 'bg-amber-400 ring-4 ring-amber-200 animate-bounce'
            }`}
          />
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isConnected ? 'WhatsApp Terhubung (Connected)' : 'Menunggu Scan QR / Pairing'}
            </span>
            <span className="text-[10px] text-emerald-200">
              {isConnected
                ? `${config.connectedPhone || 'Akun WA Aktif'} • ${config.connectedAt || 'Aktif'}`
                : 'Buka WhatsApp di HP > Perangkat Tertaut'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Kolom Kiri: Real WhatsApp Web Authentication (QR & Pairing Code) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 shadow-sm border border-emerald-100 flex flex-col items-center text-center">
          
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined notranslate text-emerald-600 text-[20px]">
                phonelink_ring
              </span>
              <h3 className="text-sm font-bold text-slate-800">Tautkan WhatsApp Guru</h3>
            </div>
            
            {/* Tab Mode: QR vs Pairing Code */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLinkMode('qr')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  linkMode === 'qr' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Scan QR
              </button>
              <button
                type="button"
                onClick={() => setLinkMode('pairing_code')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  linkMode === 'pairing_code' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Kode 8 Digit
              </button>
            </div>
          </div>

          {/* Mode 1: QR Code Scanner */}
          {linkMode === 'qr' && (
            <div className="w-full flex flex-col items-center">
              <div className="relative p-3 bg-slate-50 border-2 border-dashed border-emerald-300 rounded-3xl flex flex-col items-center justify-center my-1 shadow-inner w-full">
                {isRefreshingQr ? (
                  <div className="w-60 h-60 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-500">Memperbarui QR Asli...</span>
                  </div>
                ) : isConnected ? (
                  <div className="w-60 h-60 flex flex-col items-center justify-center gap-3 bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg animate-in zoom-in-75">
                      <span className="material-symbols-outlined notranslate text-[36px]">verified</span>
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-slate-800 text-sm">WhatsApp Berhasil Terhubung!</h4>
                      <p className="text-[11px] text-emerald-800 font-mono font-bold mt-1">
                        +{config.connectedPhone || '6281248957075'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Bot siap menerima perintah kirim panggil guru dari murid.
                      </p>
                    </div>
                  </div>
                ) : config.qrDataUrl ? (
                  <div className="relative group">
                    <img
                      src={config.qrDataUrl}
                      alt="WhatsApp Web Real QR Code"
                      className="w-60 h-60 rounded-2xl object-contain shadow-xs bg-white p-2"
                    />
                    
                    {/* Floating WhatsApp Logo */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center p-2 border border-slate-200">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                          alt="WhatsApp"
                          className="w-8 h-8 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-60 h-60 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-500">Menyiapkan QR Handshake WhatsApp...</span>
                  </div>
                )}

                <div className="mt-3 text-[11px] text-slate-500 font-medium">
                  Update Terakhir: <strong className="text-slate-700">{config.lastQrUpdate}</strong>
                </div>
              </div>

              {/* Petunjuk Scan */}
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/60 text-left w-full mt-3 space-y-1.5">
                <h4 className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="material-symbols-outlined notranslate text-[16px] text-emerald-700">qr_code_scanner</span>
                  Langkah Scan dengan WhatsApp di HP:
                </h4>
                <ol className="text-[11px] text-emerald-900/90 list-decimal list-inside space-y-1 pl-1 leading-relaxed">
                  <li>Buka <strong>WhatsApp</strong> di HP Anda.</li>
                  <li>Ketuk menu titik tiga (⋮) atau <strong>Setelan</strong> &gt; <strong>Perangkat Tertaut</strong>.</li>
                  <li>Ketuk <strong>Tautkan Perangkat</strong>.</li>
                  <li>Arahkan kamera HP ke kode QR di atas hingga berbunyi atau bergetar.</li>
                  <li>Status di atas akan otomatis berubah menjadi <strong>WhatsApp Terhubung</strong>!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Mode 2: Pairing Code (Tautkan dengan nomor telepon tanpa kamera) */}
          {linkMode === 'pairing_code' && (
            <div className="w-full flex flex-col items-center">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl w-full text-left space-y-3.5 my-1">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined notranslate text-emerald-600 text-[18px]">password</span>
                    Tautkan Tanpa Kamera (Kode 8 Digit)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sangat cocok jika kamera HP sulit fokus pada layar laptop.
                  </p>
                </div>

                <form onSubmit={handleRequestPairingCode} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Nomor HP WhatsApp Anda:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pairingPhoneInput}
                        onChange={(e) => setPairingPhoneInput(e.target.value)}
                        placeholder="0812-4895-7075"
                        className="flex-1 px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={isRequestingCode}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        {isRequestingCode ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined notranslate text-[16px]">key</span>
                        )}
                        <span>Minta Kode</span>
                      </button>
                    </div>
                  </div>
                </form>

                {pairingCodeResult ? (
                  <div className="bg-emerald-100/70 border-2 border-dashed border-emerald-500 p-3.5 rounded-2xl text-center space-y-1.5 animate-in zoom-in-95">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      Kode Pairing WhatsApp Anda:
                    </span>
                    <div className="text-2xl font-mono font-black tracking-widest text-[#075e54] select-all py-1 bg-white rounded-xl border border-emerald-300">
                      {pairingCodeResult.slice(0, 4)}-{pairingCodeResult.slice(4)}
                    </div>
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      Buka notifikasi di WhatsApp HP &gt; masukkan 8 kode di atas untuk menghubungkan.
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                    Klik <strong>Minta Kode</strong> di atas, lalu buka WhatsApp HP &gt; <em>Perangkat Tertaut</em> &gt; <em>Tautkan dengan nomor telepon</em>.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
                onClick={handleLogout}
                className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-rose-200"
              >
                <span className="material-symbols-outlined notranslate text-[16px]">link_off</span>
                <span>Putuskan Sesi</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRefreshQr()}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined notranslate text-[16px]">sync</span>
                <span>Cek Koneksi</span>
              </button>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan Nomor Default Guru & Simulator Uji Coba */}
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
                0812-4895-7075
              </span>
            </div>

            <form onSubmit={handleSavePhone} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Nomor WhatsApp Semua Guru (Sesuai Permintaan):
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
                Ketika siswa memencet <strong>Panggil Guru</strong> di halaman murid, pesan otomatis dikirim ke nomor ini dengan format: <em>&quot;Pak Guru [Nama], Anda dipanggil oleh kelas [Kelas yang memanggil]...&quot;</em>
              </p>
            </form>
          </div>

          {/* Card 2: Uji Coba Pengiriman Pesan WhatsApp */}
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
              <span className="text-[10px] text-slate-400">Live Simulator</span>
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
                  <p className="font-bold text-[#075e54] mb-0.5">🔔 Pesan Notifikasi Otomatis:</p>
                  <p className="text-slate-700">
                    Halo Pak/Ibu Guru <strong>{testTeacherName}</strong>, Anda dipanggil oleh kelas <strong>{testClassName}</strong> untuk segera hadir di Lab Komputer 2. Mohon kehadirannya di kelas, terima kasih.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingTest}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#075e54] to-[#128c7e] hover:from-[#064e46] hover:to-[#0f776a] text-white font-bold text-xs transition active:scale-95 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingTest ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined notranslate text-[16px]">forward_to_inbox</span>
                )}
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
                        <span>{log.status === 'read' ? 'Dibaca Guru' : log.status === 'delivered' ? 'Terkirim (WA Bot)' : 'Diproses'}</span>
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
