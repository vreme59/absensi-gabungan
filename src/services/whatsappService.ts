// WhatsApp Gateway Service for SMKN 1 Sorong
// Handles WhatsApp Web Pairing (QR Code), Connection Status, and Message Dispatching

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
  status: 'connected' | 'waiting_qr' | 'disconnected';
  defaultTeacherPhone: string;
  deviceInfo: string;
  connectedAt: string;
  qrCodeToken: string;
  lastQrUpdate: string;
  autoReconnect: boolean;
  messagesHistory: WhatsAppMessageLog[];
}

const STORAGE_KEY = 'smkn1_whatsapp_gateway_v1';
const DEFAULT_PHONE = '0812-4895-7075';

// Helper to normalize phone number to international WhatsApp format
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

// Generate QR Code Pairing String
export function createQrPairingToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 12);
  const timestamp = Date.now();
  return `2@SMKN1-SORONG-${timestamp}-${randomPart},WHATSAPP-WEB-GATEWAY-AUTH`;
}

// Get QR Code Image URL
export function getQrCodeImageUrl(token: string): string {
  const encoded = encodeURIComponent(token);
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encoded}&margin=8&color=075e54`;
}

// Initial Mock History
const INITIAL_HISTORY: WhatsAppMessageLog[] = [
  {
    id: 'wa-msg-001',
    timestamp: '14 Okt 2026, 07:45 WIT',
    recipientPhone: DEFAULT_PHONE,
    teacherName: 'Budi Santoso, S.Kom',
    className: 'XII TKJ 1',
    roomName: 'Lab RPL 2',
    messageText: 'Pak Guru Budi Santoso, S.Kom, Anda dipanggil oleh kelas XII TKJ 1 untuk hadir di ruang Lab RPL 2. Mohon segera menuju kelas. Terima kasih.',
    status: 'delivered',
    senderName: 'Cindy Laura (Sekretaris Kelas)',
  },
  {
    id: 'wa-msg-002',
    timestamp: '13 Okt 2026, 10:15 WIT',
    recipientPhone: DEFAULT_PHONE,
    teacherName: 'Drs. H. Ahmad Yani, M.Pd',
    className: 'XII DKV 1',
    roomName: 'Ruang Teori 4',
    messageText: 'Pak Guru Drs. H. Ahmad Yani, M.Pd, Anda dipanggil oleh kelas XII DKV 1 untuk hadir di Ruang Teori 4. Mohon segera menuju kelas. Terima kasih.',
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
        defaultTeacherPhone: parsed.defaultTeacherPhone || DEFAULT_PHONE,
        messagesHistory: parsed.messagesHistory || INITIAL_HISTORY,
      };
    }
  } catch (err) {
    console.error('Failed to load WhatsApp config from localStorage:', err);
  }

  const initialToken = createQrPairingToken();
  const initialConfig: WhatsAppGatewayConfig = {
    status: 'connected',
    defaultTeacherPhone: DEFAULT_PHONE,
    deviceInfo: 'SMKN1-Sorong-Server (Node.js WhatsApp-JS Client v2.3000)',
    connectedAt: '14 Okt 2026, 07:00 WIT',
    qrCodeToken: initialToken,
    lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
    autoReconnect: true,
    messagesHistory: INITIAL_HISTORY,
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

// Refresh QR Code for reconnecting if disconnected
export function refreshWhatsAppQr(): WhatsAppGatewayConfig {
  const current = getWhatsAppConfig();
  const newToken = createQrPairingToken();
  const updated: WhatsAppGatewayConfig = {
    ...current,
    status: 'waiting_qr',
    qrCodeToken: newToken,
    lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIT',
  };
  saveWhatsAppConfig(updated);
  return updated;
}

// Simulate successful QR code scan and connection
export function setWhatsAppConnected(): WhatsAppGatewayConfig {
  const current = getWhatsAppConfig();
  const updated: WhatsAppGatewayConfig = {
    ...current,
    status: 'connected',
    connectedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
    lastQrUpdate: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT',
  };
  saveWhatsAppConfig(updated);
  return updated;
}

// Simulate disconnected WhatsApp session
export function setWhatsAppDisconnected(): WhatsAppGatewayConfig {
  const current = getWhatsAppConfig();
  const updated: WhatsAppGatewayConfig = {
    ...current,
    status: 'disconnected',
    qrCodeToken: createQrPairingToken(),
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
    defaultTeacherPhone: phone.trim() || DEFAULT_PHONE,
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
}

export function sendPanggilGuruWhatsApp(params: SendPanggilGuruParams): SendWhatsAppResult {
  const config = getWhatsAppConfig();
  const phone = params.customPhone || config.defaultTeacherPhone || DEFAULT_PHONE;
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  const room = params.roomName || 'Ruang Kelas';
  const time = params.timeSlot || (new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT');
  const sender = params.senderName || 'Siswa Kelas';

  // Format message as requested:
  // "Pak Guru [Nama], Anda dipanggil oleh kelas [Kelas]"
  const messageText = `Halo Pak/Ibu Guru ${params.teacherName}, Anda dipanggil oleh kelas ${params.className} untuk segera hadir di ${room}.\n\nWaktu Panggilan: ${time}\nDipanggil oleh: ${sender}\n\nMohon kehadirannya di kelas, terima kasih.\n_Sistem Informasi Presensi SMKN 1 Sorong_`;

  const messageId = `wa-${Date.now()}`;
  const timestamp = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT';

  const newLog: WhatsAppMessageLog = {
    id: messageId,
    timestamp,
    recipientPhone: phone,
    teacherName: params.teacherName,
    className: params.className,
    roomName: room,
    messageText,
    status: config.status === 'connected' ? 'delivered' : 'sent',
    senderName: sender,
  };

  const updatedConfig: WhatsAppGatewayConfig = {
    ...config,
    messagesHistory: [newLog, ...(config.messagesHistory || [])].slice(0, 30),
  };
  saveWhatsAppConfig(updatedConfig);

  // Generate direct wa.me link with encoded text
  const directWaUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;

  return {
    success: true,
    messageId,
    phone,
    messageText,
    directWaUrl,
    timestamp,
  };
}
