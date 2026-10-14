import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export interface WhatsAppGatewayStatus {
  status: 'disconnected' | 'connecting' | 'waiting_qr' | 'connected';
  qr: string | null;
  qrDataUrl: string | null;
  pairingCode: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  connectedAt: string | null;
  lastUpdate: string;
  errorMessage: string | null;
}

const AUTH_DIR = path.resolve(process.cwd(), '.wa-session');

class WhatsAppGatewayManager {
  private sock: WASocket | null = null;
  private state: WhatsAppGatewayStatus = {
    status: 'disconnected',
    qr: null,
    qrDataUrl: null,
    pairingCode: null,
    connectedPhone: null,
    connectedName: null,
    connectedAt: null,
    lastUpdate: new Date().toLocaleTimeString('id-ID'),
    errorMessage: null,
  };
  private isInitializing = false;
  private reconnectAttempts = 0;

  constructor() {
    // Ensure session directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      try {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      } catch (e) {
        console.error('Failed to create auth dir:', e);
      }
    }
  }

  public getStatus(): WhatsAppGatewayStatus {
    return { ...this.state };
  }

  public async init(): Promise<void> {
    if (this.isInitializing) return;
    this.isInitializing = true;
    this.state.status = 'connecting';
    this.state.lastUpdate = new Date().toLocaleTimeString('id-ID');
    this.state.errorMessage = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1043857760] as any }));

      const socket = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['SMKN 1 Sorong', 'Chrome', '1.0.0'],
        syncFullHistory: false,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 30_000,
      });

      this.sock = socket;

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.state.status = 'waiting_qr';
          this.state.qr = qr;
          try {
            this.state.qrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: {
                dark: '#075e54',
                light: '#ffffff',
              },
            });
          } catch (err: any) {
            console.error('QR code generation error:', err);
          }
          this.state.lastUpdate = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIT';
          console.log('[WA-Gateway] Real WhatsApp Web QR ready for scan');
        }

        if (connection === 'open') {
          this.reconnectAttempts = 0;
          this.state.status = 'connected';
          this.state.qr = null;
          this.state.qrDataUrl = null;
          this.state.pairingCode = null;
          this.state.errorMessage = null;

          const user = socket.user;
          const phoneRaw = user?.id ? user.id.split(':')[0].split('@')[0] : '081248957075';
          this.state.connectedPhone = phoneRaw;
          this.state.connectedName = user?.name || 'Admin SMKN 1 Sorong';
          this.state.connectedAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIT';
          this.state.lastUpdate = new Date().toLocaleTimeString('id-ID') + ' WIT';

          console.log(`[WA-Gateway] WhatsApp Web successfully CONNECTED as ${this.state.connectedPhone} (${this.state.connectedName})`);
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.log(`[WA-Gateway] Connection closed (status: ${statusCode}). Reconnect? ${shouldReconnect}`);

          this.state.status = 'disconnected';
          this.state.qr = null;
          this.state.qrDataUrl = null;
          this.state.lastUpdate = new Date().toLocaleTimeString('id-ID') + ' WIT';

          if (shouldReconnect && this.reconnectAttempts < 5) {
            this.reconnectAttempts++;
            setTimeout(() => {
              this.isInitializing = false;
              this.init();
            }, 3000);
          } else if (statusCode === DisconnectReason.loggedOut) {
            this.state.errorMessage = 'Sesi WhatsApp dikeluarkan (Logged Out). Silakan scan ulang.';
            this.clearAuthFiles();
          }
        }
      });
    } catch (err: any) {
      console.error('[WA-Gateway] Init error:', err);
      this.state.status = 'disconnected';
      this.state.errorMessage = err?.message || 'Gagal memulai gateway WhatsApp';
    } finally {
      this.isInitializing = false;
    }
  }

  public async requestPairingCode(phoneNumber: string): Promise<string> {
    if (!this.sock) {
      await this.init();
      // wait 2 seconds for socket initialization
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!this.sock) {
      throw new Error('Socket WhatsApp belum siap');
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    try {
      const code = await this.sock.requestPairingCode(intlPhone);
      this.state.pairingCode = code;
      this.state.lastUpdate = new Date().toLocaleTimeString('id-ID') + ' WIT';
      console.log(`[WA-Gateway] Pairing code generated: ${code} for phone: ${intlPhone}`);
      return code;
    } catch (err: any) {
      console.error('[WA-Gateway] Failed to request pairing code:', err);
      throw err;
    }
  }

  public async sendMessage(recipientPhone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.sock || this.state.status !== 'connected') {
      return {
        success: false,
        error: 'WhatsApp Bot belum terhubung (status: ' + this.state.status + '). Silakan scan QR code di Super Admin terlebih dahulu.',
      };
    }

    const cleanPhone = recipientPhone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const jid = `${intlPhone}@s.whatsapp.net`;

    try {
      const result = await this.sock.sendMessage(jid, { text });
      console.log(`[WA-Gateway] Message dispatched to ${jid}, id: ${result?.key?.id}`);
      return {
        success: true,
        messageId: result?.key?.id || `msg-${Date.now()}`,
      };
    } catch (err: any) {
      console.error('[WA-Gateway] Failed to send message:', err);
      return {
        success: false,
        error: err?.message || 'Gagal mengirim pesan WhatsApp',
      };
    }
  }

  public async logout(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
        this.sock = null;
      }
    } catch (err) {
      console.error('[WA-Gateway] Logout error:', err);
    }
    this.clearAuthFiles();
    this.state = {
      status: 'disconnected',
      qr: null,
      qrDataUrl: null,
      pairingCode: null,
      connectedPhone: null,
      connectedName: null,
      connectedAt: null,
      lastUpdate: new Date().toLocaleTimeString('id-ID') + ' WIT',
      errorMessage: null,
    };
    this.reconnectAttempts = 0;
    this.isInitializing = false;
  }

  public async restart(): Promise<void> {
    try {
      if (this.sock) {
        this.sock.end(undefined);
        this.sock = null;
      }
    } catch (e) {}
    this.reconnectAttempts = 0;
    this.isInitializing = false;
    await this.init();
  }

  private clearAuthFiles(): void {
    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to clear auth dir:', err);
    }
  }
}

export const waGateway = new WhatsAppGatewayManager();
