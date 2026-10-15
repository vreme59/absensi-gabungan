import type { IncomingMessage, ServerResponse } from 'http';
import { waGateway } from './wa-gateway-core.ts';

function readJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

export async function handleWhatsAppApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return true;
  }

  // 1. Check Status & QR
  if (url.startsWith('/api/wa/status') && req.method === 'GET') {
    const status = waGateway.getStatus();
    sendJson(res, 200, {
      success: true,
      data: status,
    });
    return true;
  }

  // 2. Start / Init Gateway
  if (url.startsWith('/api/wa/init') && req.method === 'POST') {
    await waGateway.init();
    sendJson(res, 200, {
      success: true,
      data: waGateway.getStatus(),
    });
    return true;
  }

  // 3. Request Pairing Code (8-digit)
  if (url.startsWith('/api/wa/pair-code') && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const phone = body.phone || '081248957075';
      const code = await waGateway.requestPairingCode(phone);
      sendJson(res, 200, {
        success: true,
        pairingCode: code,
        message: `Kode pairing berhasil dibuat: ${code}. Masukkan kode ini pada menu Tautkan Perangkat di WhatsApp HP Anda.`,
      });
    } catch (err: any) {
      sendJson(res, 500, {
        success: false,
        error: err?.message || 'Gagal membuat kode pairing WhatsApp',
      });
    }
    return true;
  }

  // 4. Send Message (Panggil Guru)
  if (url.startsWith('/api/wa/send') && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const phone = body.phone || '0812-4895-7075';
      const teacherName = body.teacherName || 'Bapak/Ibu Guru';
      const className = body.className || 'Kelas Siswa';
      const roomName = body.roomName || 'Ruang Kelas';
      const senderName = body.senderName || 'Siswa Kelas';

      // Standard message format requested by user
      const messageText = body.text || `Halo Pak/Ibu Guru ${teacherName}, Anda dipanggil oleh kelas ${className} untuk segera hadir di ${roomName}.\n\nDipanggil oleh: ${senderName}\nWaktu: ${new Date().toLocaleTimeString('id-ID')} WIT\n\nMohon kehadirannya di kelas, terima kasih.\n_Sistem Absensi SMKN 1 Sorong_`;

      const result = await waGateway.sendMessage(phone, messageText);
      sendJson(res, result.success ? 200 : 400, {
        ...result,
        phone,
        messageText,
      });
    } catch (err: any) {
      sendJson(res, 500, {
        success: false,
        error: err?.message || 'Gagal memproses pengiriman WhatsApp',
      });
    }
    return true;
  }

  // 5. Restart / Refresh QR
  if (url.startsWith('/api/wa/restart') && req.method === 'POST') {
    await waGateway.restart();
    sendJson(res, 200, {
      success: true,
      message: 'Gateway WhatsApp di-restart, QR code baru sedang disiapkan.',
      data: waGateway.getStatus(),
    });
    return true;
  }

  // 6. Logout / Clear Session
  if (url.startsWith('/api/wa/logout') && req.method === 'POST') {
    await waGateway.logout();
    sendJson(res, 200, {
      success: true,
      message: 'Sesi WhatsApp berhasil diputuskan (Logged Out).',
      data: waGateway.getStatus(),
    });
    return true;
  }

  return false;
}
