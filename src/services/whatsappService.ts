// WhatsApp Gateway Service for SMKN 1 Sorong
// Integrates with real WhatsApp Web Baileys Gateway & Direct wa.me Dispatch

export interface WhatsAppMessageLog {
  id: string;
  timestamp: string;
  recipientPhone: string;
  teacherName: string;
  className: string;
  roomName: string;
  messageText: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  senderName: string;
}

export interface WhatsAppGatewayConfig {
  status: 'connected' | 'waiting_qr' | 'connecting' | 'disconnected';
  defaultTeacherPhone: string;
  deviceInfo: string;
  connectedPhone: string;
  connectedName: string;
  connectedAt: string;
  qrCodeToken: string;
  qrDataUrl: string;
  pairingCode: string | null;
  lastQrUpdate: string;
  autoReconnect: boolean;
  messagesHistory: WhatsAppMessageLog[];
  isRealBackendActive: boolean;
  errorMessage?: string | null;
}

const STORAGE_KEY = 'smkn1_whatsapp_gateway_v2';
export const DEFAULT_TEACHER_PHONE = '0812-4895-7075';

// Helper to normalize phone number to international WhatsApp format (e.g. 6281248957075)
export function normalizePhoneForWhatsApp(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('0')) {
    return '62' + digitsOnly.slice(1);
  }
  if (digitsOnly.startsWith('62')) {
    return digitsOnly;
  }
  return '62' + digitsOnly;
}

// Initial Mock History for demonstration
const INITIAL_HISTORY: WhatsAppMessageLog[] = [
  {
    id: 'wa-msg-001',
    timestamp: '14 Okt 2026, 07:45 WIT',
    recipientPhone: DEFAULT_TEACHER_PHONE,
    teacherName: 'Budi Santoso, S.Kom',
    className: 'XII TKJ 1',
    roomName: 'Lab RPL 2',
    messageText: 'Halo Pak/Ibu Guru Budi Santoso, S.Kom, Anda dipanggil oleh kelas XII TKJ 1 untuk hadir di Lab RPL 2. Mohon segera menuju kelas. Terima kasih.',
    status: 'delivered',
    senderName: 'Cindy Laura (Sekretaris Kelas)',
  },
  {
    id: 'wa-msg-002',
    timestamp: '13 Okt 2026, 10:15 WIT',
    recipientPhone: DEFAULT_TEACHER_PHONE,
    teacherName: 'Drs. H. Ahmad Yani, M.Pd',
    className: 'XII DKV 1',
    roomName: 'Ruang Teori 4',
    messageText: 'Halo Pak/Ibu Guru Drs. H. Ahmad Yani, M.Pd, Anda dipanggil oleh kelas XII DKV 1 untuk hadir di Ruang Teori 4. Mohon segera menuju kelas. Terima kasih.',
    status: 'read',
    senderName: 'Fahri Ramadhan (Ketua Kelas)',
  },
];

export function getWhatsAppConfig(): WhatsAppGatewayConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        defaultTeacherPhone: parsed.defaultTeacherPhone || DEFAULT_TEACHER_PHONE,
        messagesHistory: parsed.messagesHistory || INITIAL_HISTORY,
      };
    }
  } catch (err) {
    console.error('Failed to load WhatsApp config from localStorage:', err);
  }

  const initialConfig: WhatsAppGatewayConfig = {
    status: 'waiting_qr',
    defaultTeacherPhone: DEFAULT_TEACHER_PHONE,
    deviceInfo: 'SMKN 1 Sorong Bot (WhatsApp-Web-JS / Baileys Gateway)',
    connectedPhone: '',
    connectedName: '',
    connectedAt: '',
    qrCodeToken: '',
    qrDataUrl: '',
    pairingCode: null,
    lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
    autoReconnect: true,
    messagesHistory: INITIAL_HISTORY,
    isRealBackendActive: false,
    errorMessage: null,
  };

  saveWhatsAppConfig(initialConfig);
  return initialConfig;
}

export function saveWhatsAppConfig(config: WhatsAppGatewayConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('whatsapp-config-updated', { detail: config }));
  } catch (err) {
    console.error('Failed to save WhatsApp config to localStorage:', err);
  }
}

// Fetch live WhatsApp status from real Node / Baileys backend
export async function fetchLiveWhatsAppStatus(): Promise<WhatsAppGatewayConfig> {
  const current = getWhatsAppConfig();
  try {
    const res = await fetch('/api/wa/status', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        const backendData = json.data;
        const updated: WhatsAppGatewayConfig = {
          ...current,
          status: backendData.status || current.status,
          qrCodeToken: backendData.qr || current.qrCodeToken,
          qrDataUrl: backendData.qrDataUrl || current.qrDataUrl,
          pairingCode: backendData.pairingCode ?? current.pairingCode,
          connectedPhone: backendData.connectedPhone || current.connectedPhone,
          connectedName: backendData.connectedName || current.connectedName,
          connectedAt: backendData.connectedAt || current.connectedAt,
          lastQrUpdate: backendData.lastUpdate || current.lastQrUpdate,
          isRealBackendActive: true,
          errorMessage: backendData.errorMessage || null,
        };
        saveWhatsAppConfig(updated);
        return updated;
      }
    }
  } catch (err) {
    // Backend API not reachable (e.g. running static preview on Vercel)
  }

  return current;
}

// Request 8-Digit Pairing Code (Tautkan dengan nomor telepon)
export async function requestWhatsAppPairingCode(phoneNumber: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    const res = await fetch('/api/wa/pair-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.pairingCode) {
        const current = getWhatsAppConfig();
        const updated: WhatsAppGatewayConfig = {
          ...current,
          pairingCode: json.pairingCode,
          lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
        };
        saveWhatsAppConfig(updated);
        return { success: true, code: json.pairingCode };
      }
      return { success: false, error: json.error || 'Gagal menghasilkan kode pairing' };
    }
    const errJson = await res.json().catch(() => ({}));
    return { success: false, error: errJson.error || 'Server WhatsApp mengembalikan status ' + res.status };
  } catch (err: any) {
    return {
      success: false,
      error: 'Tidak dapat terhubung ke server WhatsApp gateway local. Pastikan server dev aktif.',
    };
  }
}

// Refresh QR Code for reconnecting
export async function refreshWhatsAppQr(): Promise<WhatsAppGatewayConfig> {
  try {
    const res = await fetch('/api/wa/restart', { method: 'POST' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const current = getWhatsAppConfig();
        const updated: WhatsAppGatewayConfig = {
          ...current,
          status: json.data.status || 'waiting_qr',
          qrCodeToken: json.data.qr || '',
          qrDataUrl: json.data.qrDataUrl || '',
          pairingCode: null,
          lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIT',
        };
        saveWhatsAppConfig(updated);
        return updated;
      }
    }
  } catch (err) {
    console.error('Failed to call restart API:', err);
  }

  // Fallback local update
  const current = getWhatsAppConfig();
  const updated: WhatsAppGatewayConfig = {
    ...current,
    status: 'waiting_qr',
    lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIT',
  };
  saveWhatsAppConfig(updated);
  return updated;
}

// Disconnect / Logout WhatsApp Session
export async function logoutWhatsAppGateway(): Promise<WhatsAppGatewayConfig> {
  try {
    await fetch('/api/wa/logout', { method: 'POST' });
  } catch (err) {
    console.error('Failed to logout WhatsApp gateway:', err);
  }

  const current = getWhatsAppConfig();
  const updated: WhatsAppGatewayConfig = {
    ...current,
    status: 'disconnected',
    qrCodeToken: '',
    qrDataUrl: '',
    pairingCode: null,
    connectedPhone: '',
    connectedName: '',
    connectedAt: '',
    lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
  };
  saveWhatsAppConfig(updated);
  return updated;
}

// Update default teacher phone
export function updateDefaultTeacherPhone(phone: string): WhatsAppGatewayConfig {
  const current = getWhatsAppConfig();
  const updated: WhatsAppGatewayConfig = {
    ...current,
    defaultTeacherPhone: phone.trim() || DEFAULT_TEACHER_PHONE,
  };
  saveWhatsAppConfig(updated);
  return updated;
}

// Send WhatsApp "Panggil Guru" Message
export interface SendPanggilGuruParams {
  teacherName: string;
  className: string;
  roomName?: string;
  senderName?: string;
  customPhone?: string;
  timeSlot?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId: string;
  phone: string;
  messageText: string;
  directWaUrl: string;
  timestamp: string;
  viaBot: boolean;
  error?: string;
}

export async function sendPanggilGuruWhatsApp(params: SendPanggilGuruParams): Promise<SendWhatsAppResult> {
  const config = getWhatsAppConfig();
  const phone = params.customPhone || config.defaultTeacherPhone || DEFAULT_TEACHER_PHONE;
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const room = params.roomName || 'Ruang Kelas';
  const time = params.timeSlot || (new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT');
  const sender = params.senderName || 'Siswa Kelas';

  // Format message as requested:
  // "Pak Guru [Nama], Anda dipanggil oleh kelas [Kelas yang memanggil]..."
  const messageText = `Halo Pak/Ibu Guru ${params.teacherName}, Anda dipanggil oleh kelas ${params.className} untuk segera hadir di ${room}.\n\nWaktu Panggilan: ${time}\nDipanggil oleh: ${sender}\n\nMohon kehadirannya di kelas, terima kasih.\n_Sistem Absensi SMKN 1 Sorong_`;

  const directWaUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;
  const messageId = `wa-${Date.now()}`;
  const timestamp = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT';

  let sentViaBot = false;
  let botError: string | undefined = undefined;

  // Always attempt real bot dispatch first
  try {
    const res = await fetch('/api/wa/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: normalizedPhone,
        teacherName: params.teacherName,
        className: params.className,
        roomName: room,
        senderName: sender,
        text: messageText,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        sentViaBot = true;
      } else {
        botError = json.error;
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      botError = errJson.error || `Server HTTP status ${res.status}`;
    }
  } catch (err: any) {
    console.warn('Real bot send attempt failed:', err);
    botError = err?.message || 'Server bot WhatsApp tidak dapat dihubungi';
  }

  const newLog: WhatsAppMessageLog = {
    id: messageId,
    timestamp,
    recipientPhone: phone,
    teacherName: params.teacherName,
    className: params.className,
    roomName: room,
    messageText,
    status: sentViaBot ? 'delivered' : 'sent',
    senderName: sender,
  };

  const updatedConfig: WhatsAppGatewayConfig = {
    ...config,
    messagesHistory: [newLog, ...(config.messagesHistory || [])].slice(0, 30),
  };
  saveWhatsAppConfig(updatedConfig);

  return {
    success: true,
    messageId,
    phone,
    messageText,
    directWaUrl,
    timestamp,
    viaBot: sentViaBot,
    error: botError,
  };
}
