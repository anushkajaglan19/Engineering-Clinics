/* global io, L, Chart */
const socket = io();

// State
const deviceMarkers = {}; // deviceId -> L.marker
const devicePaths = {};   // deviceId -> L.polyline
const deviceSeries = {};  // deviceId -> { labels:[], hr:[], sp:[], tp:[] }
let simInterval = null;

// Map
const map = L.map('map').setView([28.6139, 77.2090], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Charts
function makeChart(ctx, label, color) {
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label, data: [], borderColor: color, fill: false, tension: 0.2 }] },
    options: {
      responsive: true,
      scales: { x: { ticks: { color: '#94a3b8'} }, y: { ticks: { color: '#94a3b8'} } },
      plugins: { legend: { labels: { color: '#e2e8f0' } } }
    }
  });
}

const heartChart = makeChart(document.getElementById('heartChart'), 'Heart Rate', '#f43f5e');
const spo2Chart = makeChart(document.getElementById('spo2Chart'), 'SpO2', '#22d3ee');
const tempChart = makeChart(document.getElementById('tempChart'), 'Temperature', '#a3e635');

function ensureSeries(deviceId) {
  if (!deviceSeries[deviceId]) {
    deviceSeries[deviceId] = { labels: [], hr: [], sp: [], tp: [] };
  }
  return deviceSeries[deviceId];
}

function updateCharts(deviceId, point) {
  const s = ensureSeries(deviceId);
  const label = new Date(point.timestamp).toLocaleTimeString();
  s.labels.push(label);
  s.hr.push(point.heartRate);
  s.sp.push(point.spo2);
  s.tp.push(point.temperature);
  if (s.labels.length > 50) { s.labels.shift(); s.hr.shift(); s.sp.shift(); s.tp.shift(); }

  heartChart.data.labels = s.labels;
  heartChart.data.datasets[0].data = s.hr;
  heartChart.update();

  spo2Chart.data.labels = s.labels;
  spo2Chart.data.datasets[0].data = s.sp;
  spo2Chart.update();

  tempChart.data.labels = s.labels;
  tempChart.data.datasets[0].data = s.tp;
  tempChart.update();
}

function updateMap(deviceId, point) {
  const latlng = [point.lat, point.lng];
  if (!deviceMarkers[deviceId]) {
    deviceMarkers[deviceId] = L.marker(latlng).addTo(map).bindPopup(deviceId);
    devicePaths[deviceId] = L.polyline([latlng], { color: '#60a5fa' }).addTo(map);
  } else {
    deviceMarkers[deviceId].setLatLng(latlng);
    devicePaths[deviceId].addLatLng(latlng);
  }
}

function updateLatest(point) {
  const el = document.getElementById('latest');
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <strong>${point.deviceId}</strong> @ ${new Date(point.timestamp).toLocaleTimeString()}<br>
    HR: ${point.heartRate} bpm | SpO2: ${point.spo2}% | Temp: ${point.temperature}°C<br>
    Lat: ${point.lat.toFixed(5)}, Lng: ${point.lng.toFixed(5)}
  `;
  el.prepend(card);
  // Limit to 12 latest cards
  while (el.children.length > 12) el.removeChild(el.lastChild);
}

function onPoint(point) {
  updateMap(point.deviceId, point);
  updateCharts(point.deviceId, point);
  updateLatest(point);
}

socket.on('connect', () => console.log('socket connected'));
socket.on('data', onPoint);
socket.on('snapshot', (snapshot) => {
  if (!snapshot || !snapshot.devices) return;
  snapshot.devices.forEach(d => {
    (d.points || []).forEach(onPoint);
  });
});

// Manual form submit
const form = document.getElementById('manualForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const payload = {
    deviceId: fd.get('deviceId') || 'device-001',
    heartRate: Number(fd.get('heartRate')),
    spo2: Number(fd.get('spo2')),
    temperature: Number(fd.get('temperature')),
    lat: Number(fd.get('lat')),
    lng: Number(fd.get('lng')),
  };
  try {
    await fetch('/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) { console.error(e); }
});

// Simple in-page simulator (moves in a small circle)
function startSim() {
  if (simInterval) return;
  const id = document.querySelector('input[name="deviceId"]').value || 'device-001';
  let angle = 0;
  let baseLat = Number(document.querySelector('input[name="lat"]').value) || 28.6139;
  let baseLng = Number(document.querySelector('input[name="lng"]').value) || 77.2090;
  simInterval = setInterval(async () => {
    angle += 10;
    const rad = angle * Math.PI / 180;
    const lat = baseLat + 0.01 * Math.sin(rad);
    const lng = baseLng + 0.01 * Math.cos(rad);
    const payload = {
      deviceId: id,
      heartRate: Math.round(70 + 15 * Math.sin(rad * 2) + Math.random() * 4),
      spo2: Math.round(95 + 3 * Math.cos(rad) + Math.random() * 1),
      temperature: Number((36.5 + 0.6 * Math.sin(rad) + Math.random() * 0.2).toFixed(1)),
      lat, lng
    };
    try { await fetch('/api/ingest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch {}
  }, 1500);
}

function stopSim() { if (!simInterval) return; clearInterval(simInterval); simInterval = null; }

document.getElementById('toggleSim').addEventListener('click', (e) => {
  if (simInterval) { stopSim(); e.target.textContent = 'Start Simulator'; e.target.style.background = '#16a34a'; }
  else { startSim(); e.target.textContent = 'Stop Simulator'; e.target.style.background = '#ef4444'; }
});
