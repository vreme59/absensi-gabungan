import http from 'http';
import { handleWhatsAppApiRequest } from './wa-routes';
import { waGateway } from './wa-gateway-core';

const PORT = process.env.WA_PORT ? parseInt(process.env.WA_PORT, 10) : 3001;

const server = http.createServer(async (req, res) => {
  const handled = await handleWhatsAppApiRequest(req, res);
  if (!handled) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🤖 WhatsApp Gateway JS SMKN 1 Sorong berjalan di port ${PORT}`);
  console.log(`📡 URL API Gateway: http://localhost:${PORT}/api/wa/status`);
  console.log(`=======================================================`);
  // Auto-init connection to generate QR code on start
  waGateway.init().catch(console.error);
});
