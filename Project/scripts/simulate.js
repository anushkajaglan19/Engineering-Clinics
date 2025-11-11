const axios = require('axios');

const URL = process.env.INGEST_URL || 'http://localhost:3000/api/ingest';
const DEVICE = process.env.DEVICE_ID || 'device-002';
let angle = 0;
let baseLat = 28.6139;
let baseLng = 77.2090;

async function tick() {
  angle += 12;
  const rad = angle * Math.PI / 180;
  const lat = baseLat + 0.02 * Math.sin(rad);
  const lng = baseLng + 0.02 * Math.cos(rad);
  const payload = {
    deviceId: DEVICE,
    heartRate: Math.round(72 + 12 * Math.sin(rad * 1.5) + Math.random() * 5),
    spo2: Math.round(96 + 2 * Math.cos(rad) + Math.random() * 1),
    temperature: Number((36.6 + 0.5 * Math.sin(rad) + Math.random() * 0.2).toFixed(1)),
    lat, lng
  };
  try {
    await axios.post(URL, payload);
    console.log('Sent', payload);
  } catch (e) {
    console.error('Failed to send', e.message);
  }
}

console.log('Simulator started. Press Ctrl+C to stop.');
setInterval(tick, 2000);
