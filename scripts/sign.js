const { createHmac } = require('node:crypto');

require('dotenv').config({ quiet: true });

const secret = process.env.WEBHOOK_SECRET;

if (!secret) {
  console.error('WEBHOOK_SECRET não encontrado. Copie o .env.example para .env.');
  process.exit(1);
}

const body = process.argv[2];

if (!body) {
  console.error('uso: npm run sign -- \'{"eventId":"evt_1", ...}\'');
  process.exit(1);
}

console.log(createHmac('sha256', secret).update(body).digest('hex'));
