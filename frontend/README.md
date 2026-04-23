# MediFlow Frontend

**Offline-First Patient Data System** – React + Vite PWA for ASHA Workers and Doctors.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (proxies API to backend services)
npm run dev
```

Visit **http://localhost:5173**

## Folder Structure

```
frontend/
├── index.html               # HTML entry point
├── vite.config.js           # Vite + PWA + proxy config
├── package.json
├── public/
│   ├── favicon.svg
│   └── manifest.json
└── src/
    ├── main.jsx             # React root
    ├── App.jsx              # Routes + role guards
    ├── index.css            # Global design system
    ├── context/
    │   └── AuthContext.jsx  # JWT auth state
    ├── hooks/
    │   └── useOnlineStatus.js
    ├── services/
    │   ├── authService.js   # Auth Service (port 5001)
    │   ├── syncService.js   # Sync Service (port 5002)
    │   └── patientService.js# Read Service (port 5004)
    ├── storage/
    │   └── offlineStorage.js# IndexedDB via idb
    ├── components/
    │   ├── Layout.jsx       # Nav + offline banner
    │   ├── Alert.jsx
    │   ├── Spinner.jsx
    │   ├── RecordCard.jsx   # ASHA record row
    │   ├── PatientCard.jsx  # Doctor patient view
    │   └── SyncResultModal.jsx
    └── pages/
        ├── LoginPage.jsx    # Sign in / Register
        ├── AshaDashboard.jsx
        └── DoctorDashboard.jsx
```

## Backend API Ports

| Service      | Port | Proxy Path     |
|--------------|------|----------------|
| Auth Service | 5001 | `/api/auth`    |
| Sync Service | 5002 | `/api/sync`    |
| Write Service| 5003 | `/api/write`   |
| Read Service | 5004 | `/api/patients`|

## Key Features

### ASHA Worker Flow
1. Register / log in as **ASHA**
2. Fill in Patient ID, Event Type, and JSON event data
3. Click **Save Offline** → stored in IndexedDB (`mediflow_db`)
4. Works 100% offline — data persists across reloads
5. Click **Sync Now** when online → batch upload to Sync Service
6. Sync Results modal shows success / skipped / failed counts

### Doctor Flow
1. Register / log in as **DOCTOR**
2. Enter a Patient ID and click **Search**
3. View aggregated patient profile: event stats per type + full timeline
4. Recent patients list auto-loads on dashboard mount

### PWA
- Service worker caches all assets
- Installable on Android/iOS via browser install prompt
- Offline indicator banner in the top nav

## IndexedDB Schema

```
Database:  mediflow_db
Store:     unsynced_records
KeyPath:   recordId

Record shape:
{
  recordId:  string,   // "rec_<timestamp>_<random>"
  patientId: string,
  ashaId:    string,   // logged-in user id/email
  timestamp: ISO8601,
  eventType: "MATERNAL_CARE" | "IMMUNIZATION" | "NEWBORN_CARE"
             "DISEASE_TRACKING" | "GENERAL_CHECKUP",
  eventData: object,
  synced:    boolean,
  savedAt:   ISO8601,
  syncedAt?: ISO8601   // set after successful sync
}
```
