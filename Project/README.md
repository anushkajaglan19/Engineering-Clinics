# Health + GPS IoT Tracker

A simple full-stack demo that ingests health metrics and GPS from simulated IoT devices, shows them live on a map, and graphs the metrics.

Features
- Live updates over WebSockets (Socket.IO)
- Leaflet map with device markers and trails
- Chart.js line charts for heart rate, SpO2, and temperature
- REST API for ingesting and fetching data
- Manual form to send sample readings
- Optional simulator script to generate device data

## Run locally

1) Install dependencies
```powershell
npm install
```

2) Start the server
```powershell
npm start
```
Server runs at http://localhost:3000

3) Open the UI
- Visit http://localhost:3000
- Use the form to send a sample reading, or click "Start Simulator".

4) Optional: run external simulator
```powershell
npm run simulate
```
Environment vars you can use:
```powershell
$env:INGEST_URL = 'http://localhost:3000/api/ingest'; $env:DEVICE_ID = 'device-010'; npm run simulate
```

## New machine setup (Windows)
See SETUP-WINDOWS.md for a full step-by-step guide to run this on a fresh Windows 10/11 PC with nothing installed.

## API

POST /api/ingest
- body: {
  deviceId: string, (default 'device-001')
  heartRate: number,
  spo2: number,
  temperature: number,
  lat: number,
  lng: number,
  timestamp?: string | number (optional)
}

GET /api/data?deviceId=device-001
- returns the recent points for that device

GET /api/data
- returns points for all devices

Note: This demo uses in-memory storage and is not suitable for production. For persistence, plug in a database (e.g., MongoDB, Postgres) and add authentication.
