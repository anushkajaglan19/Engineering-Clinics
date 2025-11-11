# Setup Guide: Run on a Fresh Windows PC

This guide walks you through running the Health + GPS IoT Tracker on a Windows 10/11 computer with nothing installed yet.

## What you’ll get
- A local website at http://localhost:3000
- A live map and charts that update in real time
- A simple API to ingest device data
- Optional data simulator

## Prerequisites
- Windows 10/11 (64-bit)
- An account with permission to install software
- Internet access (for one-time downloads). For fully offline, see "Offline setup" below.

---

## Quick start (copy/paste commands)
Run these in Windows PowerShell from the project folder after Node.js is installed:

```powershell
# 0) Verify Node.js and npm
node -v
npm -v

# 1) Install project dependencies
npm install

# 2) Start the server
npm start

# 3) Open the app in your browser
# http://localhost:3000

# 4) (Optional) In a new PowerShell window, run a device simulator
npm run simulate
```

---

## Step-by-step instructions

### 1) Install Node.js (LTS)
1. Visit https://nodejs.org
2. Download the "LTS" Windows Installer (.msi).
3. Run the installer:
   - Check "Add to PATH" when prompted
   - Accept defaults and finish
4. Verify in a new PowerShell window:
```powershell
node -v
npm -v
```
Both commands should print versions (e.g., Node v18+).

### 2) Get the project onto the PC
Pick one:
- Option A (ZIP/USB): Copy the project folder to the PC (e.g., `C:\Users\<you>\Desktop\projects sanju`).
- Option B (Git): Install Git from https://git-scm.com and then:
```powershell
# Example clone; replace with your repo URL
git clone <your-repo-url> health-gps-iot-tracker
cd health-gps-iot-tracker
```

### 3) Install dependencies
From the project folder (contains `package.json`):
```powershell
npm install
```

### 4) Start the server
```powershell
npm start
```
If Windows Firewall prompts, allow access on private networks so the app can be reached from your browser (and optionally from other devices on your LAN).

Open http://localhost:3000 in your browser.

### 5) Use the app
- On the page, fill the "Send Sample Data" form and click "Ingest" to post a reading.
- Click "Start Simulator" to generate moving GPS + health values.
- You should see the map marker move and the charts update live.

### 6) Optional: external simulator
Open a second PowerShell window in the project folder:
```powershell
npm run simulate
```
To target a different device ID or server URL:
```powershell
$env:INGEST_URL = 'http://localhost:3000/api/ingest'; $env:DEVICE_ID = 'device-010'; npm run simulate
```

### 7) API quick tests
- POST an example reading:
```powershell
$body = @{ deviceId='device-001'; heartRate=80; spo2=98; temperature=36.8; lat=28.6139; lng=77.2090 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/ingest -ContentType 'application/json' -Body $body
```
- GET recent data:
```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:3000/api/data
```

---

## Configuration
- Port: defaults to 3000. To change for a single run:
```powershell
$env:PORT = 4000; npm start
```
- Bind address: the server binds to all network interfaces by default (0.0.0.0). If Windows Firewall blocks access, allow Node.js or open the chosen port.

---

## Make it run on startup (optional)
Option A: PM2 (process manager)
```powershell
npm install -g pm2
pm2 start server.js --name health-gps-iot
pm2 save
pm2 startup windows
# Follow the shown command to register the service, then:
pm2 save
```
Option B: NSSM (Non-Sucking Service Manager)
- Download NSSM from https://nssm.cc/download
- Create a service pointing to `node` with `C:\path\to\server.js` as the argument.

---

## Offline setup
If the target machine is completely offline:
1) On an online machine:
- Install Node.js
- In the project folder: `npm ci`
- Zip the entire project folder including `node_modules`
- Download the Node.js LTS installer (.msi) for Windows
2) Transfer both the ZIP and Node.js installer to the offline PC (USB)
3) On the offline PC:
- Install Node.js using the .msi
- Extract the project ZIP to a folder
- Run:
```powershell
npm start
```
No internet is needed if `node_modules` is included in the ZIP.

---

## Troubleshooting
- "node is not recognized": Close and reopen PowerShell after install. Or reboot. Ensure Node.js was installed with PATH option.
- Port 3000 already in use: Change port
```powershell
$env:PORT=4000; npm start
```
- Firewall prompts: Allow access on private networks.
- Browser can’t connect: Confirm the server log shows "Server listening on http://localhost:3000" and check if antivirus/firewall is blocking Node.
- Corporate proxy: Set npm proxy if needed:
```powershell
npm config set proxy http://user:pass@proxy:port
npm config set https-proxy http://user:pass@proxy:port
```

---

## Uninstall / cleanup
- Stop the server (Ctrl+C) or `pm2 delete health-gps-iot`
- Delete the project folder
- Optionally uninstall Node.js from Windows Apps & features

---

## Project structure (reference)
- server.js — Express server + Socket.IO + REST APIs
- public/ — Frontend (index.html, app.js, styles.css)
- scripts/simulate.js — External data simulator
- README.md — Short usage guide
- SETUP-WINDOWS.md — This full setup guide
