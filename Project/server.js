const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory store for last N data points per device
const MAX_POINTS = 200;
const dataStore = {
  // deviceId: [{ timestamp, heartRate, spo2, temperature, lat, lng }]
};

function addDataPoint(point) {
  const deviceId = point.deviceId || 'device-001';
  if (!dataStore[deviceId]) dataStore[deviceId] = [];
  dataStore[deviceId].push(point);
  if (dataStore[deviceId].length > MAX_POINTS) {
    dataStore[deviceId].shift();
  }
}

// API to ingest data from devices
app.post('/api/ingest', (req, res) => {
  const { deviceId = 'device-001', timestamp, heartRate, spo2, temperature, lat, lng } = req.body || {};

  // Basic validation
  if (typeof heartRate !== 'number' || typeof spo2 !== 'number' || typeof temperature !== 'number' || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid payload. Expect numbers for heartRate, spo2, temperature, lat, lng.' });
  }

  const ts = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
  const point = { deviceId, timestamp: ts, heartRate, spo2, temperature, lat, lng };
  addDataPoint(point);

  // Broadcast to all clients
  io.emit('data', point);
  res.json({ status: 'ok' });
});

// API to fetch recent data (optionally by device)
app.get('/api/data', (req, res) => {
  const { deviceId } = req.query;
  if (deviceId) {
    return res.json({ deviceId, points: dataStore[deviceId] || [] });
  }
  res.json({ devices: Object.keys(dataStore).map(id => ({ deviceId: id, points: dataStore[id] })) });
});

io.on('connection', (socket) => {
  // Optionally send latest snapshot on connect
  socket.emit('snapshot', { devices: Object.keys(dataStore).map(id => ({ deviceId: id, points: dataStore[id] })) });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
