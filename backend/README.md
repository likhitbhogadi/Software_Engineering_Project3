# MediFlow Backend — Offline-First Patient Data System

Prototype backend implementing **Event-Driven Microservices**, **CQRS**, and **RBAC** per the MediFlow SRS.

---

## Architecture Overview

```
ASHA PWA ──► Sync Service ──► Write Service ──► [EventBus] ──► Read Service
                                                                      │
Doctor Dashboard ◄─────────────────────────────────────────────────────┘
```

| Service        | Port | DB                  | Role                                  |
|----------------|------|---------------------|---------------------------------------|
| Auth Service   | 5001 | auth_db             | Register/login, JWT issuance, RBAC    |
| Sync Service   | 5002 | sync_db             | Accept offline batches, forward to Write |
| Write Service  | 5003 | patient_write_db    | Append-only event store, publish events |
| Read Service   | 5004 | patient_read_db     | CQRS read model, serve doctor queries |

---

## Quick Start (Recommended — In-Process, Single Node)

This is the **simplest way to run the prototype**. All services share the same Node.js process, which makes the in-memory EventBus work without Kafka.

### 1. Install Dependencies

```bash
cd backend
npm run install:all
npm install
```

### 2. Start MongoDB

```bash
# Using Docker (recommended):
docker run -d -p 27017:27017 --name mediflow-mongo mongo:6.0

# Or use a local MongoDB installation
```

### 3. Configure Environment

Each service has a pre-filled `.env` file with development defaults. Edit them if your MongoDB is on a different host.

The critical shared value is `JWT_SECRET` — it **must be identical** across all `.env` files.

```bash
# auth-service/.env
JWT_SECRET=mediflow_dev_secret_change_in_production

# sync-service/.env, write-service/.env, read-service/.env
JWT_SECRET=mediflow_dev_secret_change_in_production   # same value
```

### 4. Start All Services

```bash
# From backend/
npm run dev        # uses nodemon (recommended for dev)
# OR
npm start          # plain node
```

All 4 services start on their respective ports. The EventBus is live.

---

## Running Services Individually

Each service can be run standalone for isolated development:

```bash
cd auth-service  && npm run dev   # :5001
cd sync-service  && npm run dev   # :5002
cd write-service && npm run dev   # :5003
cd read-service  && npm run dev   # :5004
```

> ⚠️ When running separately, the in-memory EventBus **cannot** cross process boundaries. The Read Service will not update. Use Docker + Kafka for true service isolation (see below).

---

## Docker (Separate Containers)

```bash
cd backend
docker-compose up --build
```

> ⚠️ **Docker EventBus Limitation**: In Docker mode each service is its own process. The in-memory EventBus won't deliver events from Write → Read. The Read Service DB will not update. To fix this, replace the EventBus with Kafka (see upgrade path below).

---

## Kafka Upgrade Path (Production)

In `write-service/src/eventBus.js`, replace `EventEmitter.emit()` with a Kafka producer:

```js
// write-service/src/eventBus.js (production)
const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['kafka:9092'] });
const producer = kafka.producer();

class EventBus {
  async publish(eventName, payload) {
    await producer.connect();
    await producer.send({
      topic: eventName,
      messages: [{ value: JSON.stringify(payload) }],
    });
  }
}
```

In `read-service/src/server.js`, replace `eventBus.subscribe()` with a Kafka consumer:

```js
const { Kafka } = require('kafkajs');
const kafka = new Kafka({ brokers: ['kafka:9092'] });
const consumer = kafka.consumer({ groupId: 'read-service' });

await consumer.connect();
await consumer.subscribe({ topic: 'PatientDataSynced' });
await consumer.run({
  eachMessage: async ({ message }) => {
    const payload = JSON.parse(message.value.toString());
    await handlePatientDataSynced(payload);
  },
});
```

---

## API Reference

### Auth Service — `http://localhost:5001`

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "secure123",
  "role": "ASHA"          // "ASHA" | "DOCTOR" | "SYSTEM"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "token": "<jwt>",
  "user": { "id": "...", "name": "Priya Sharma", "email": "...", "role": "ASHA" }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "priya@example.com",
  "password": "secure123"
}
```

#### Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <jwt>
```

#### RBAC-Protected Example Routes
```
GET /api/protected/asha-dashboard    → ASHA only
GET /api/protected/doctor-dashboard  → DOCTOR only
GET /api/protected/shared            → ASHA or DOCTOR
GET /api/protected/system            → SYSTEM only
```

---

### Sync Service — `http://localhost:5002`

#### Upload Offline Records (Batch)
```
POST /api/sync/upload
Authorization: Bearer <asha-jwt>
Content-Type: application/json

{
  "records": [
    {
      "recordId": "rec-001",
      "patientId": "pat-123",
      "ashaId": "asha-456",
      "timestamp": "2024-01-15T10:30:00Z",
      "eventType": "MATERNAL_CARE",
      "eventData": {
        "weeksPregnant": 28,
        "bloodPressure": "110/70",
        "weight": 62
      }
    },
    {
      "recordId": "rec-002",
      "patientId": "pat-123",
      "ashaId": "asha-456",
      "timestamp": "2024-01-15T10:35:00Z",
      "eventType": "IMMUNIZATION",
      "eventData": {
        "vaccine": "TT",
        "dose": 2,
        "nextDueDate": "2024-04-15"
      }
    }
  ]
}
```

Response:
```json
{
  "message": "Sync complete",
  "results": {
    "total": 2,
    "synced": [{ "recordId": "rec-001" }, { "recordId": "rec-002" }],
    "skipped": [],
    "failed": []
  }
}
```

- Duplicate `recordId` values are silently skipped (idempotent).
- Failed forwards to Write Service are retried up to 3 times.

#### Check Sync Status
```
GET /api/sync/status/:recordId
Authorization: Bearer <asha-jwt>
```

---

### Write Service — `http://localhost:5003`

#### Store Single Record (called by Sync Service)
```
POST /api/write/records
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "recordId": "rec-001",
  "patientId": "pat-123",
  "ashaId": "asha-456",
  "timestamp": "2024-01-15T10:30:00Z",
  "eventType": "MATERNAL_CARE",
  "eventData": { "weeksPregnant": 28 }
}
```

Publishes `PatientDataSynced` event after successful insert.

#### Get Raw Event Log (SYSTEM only)
```
GET /api/write/records/:patientId
Authorization: Bearer <system-jwt>
```

**Supported `eventType` values:**
- `MATERNAL_CARE`
- `IMMUNIZATION`
- `NEWBORN_CARE`
- `DISEASE_TRACKING`
- `GENERAL_CHECKUP`

---

### Read Service — `http://localhost:5004`

#### Get Patient Profile
```
GET /api/patients/:id
Authorization: Bearer <doctor-jwt>
```

Response:
```json
{
  "patientId": "pat-123",
  "totalEvents": 2,
  "firstSeenAt": "2024-01-15T10:30:00Z",
  "lastUpdatedAt": "2024-01-15T10:35:00Z",
  "eventSummary": {
    "MATERNAL_CARE": 1,
    "IMMUNIZATION": 1,
    "NEWBORN_CARE": 0,
    "DISEASE_TRACKING": 0,
    "GENERAL_CHECKUP": 0
  },
  "events": [
    {
      "recordId": "rec-001",
      "ashaId": "asha-456",
      "eventType": "MATERNAL_CARE",
      "timestamp": "2024-01-15T10:30:00Z",
      "eventData": { "weeksPregnant": 28, "bloodPressure": "110/70" }
    },
    {
      "recordId": "rec-002",
      "ashaId": "asha-456",
      "eventType": "IMMUNIZATION",
      "timestamp": "2024-01-15T10:35:00Z",
      "eventData": { "vaccine": "TT", "dose": 2 }
    }
  ]
}
```

#### List All Patients (Paginated)
```
GET /api/patients?page=1&limit=20
Authorization: Bearer <doctor-jwt>
```

---

## End-to-End Test Flow

```bash
# 1. Register an ASHA worker
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Priya","email":"priya@test.com","password":"pass123","role":"ASHA"}'

# 2. Register a Doctor
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr Rao","email":"rao@test.com","password":"pass123","role":"DOCTOR"}'

# 3. Login as ASHA — save the token
ASHA_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"priya@test.com","password":"pass123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 4. Upload offline records as ASHA
curl -X POST http://localhost:5002/api/sync/upload \
  -H "Authorization: Bearer $ASHA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [{
      "recordId": "rec-e2e-001",
      "patientId": "pat-e2e-001",
      "ashaId": "asha-priya",
      "timestamp": "2024-01-15T10:00:00Z",
      "eventType": "GENERAL_CHECKUP",
      "eventData": { "notes": "Patient is healthy", "temperature": 98.6 }
    }]
  }'

# 5. Login as Doctor
DOCTOR_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rao@test.com","password":"pass123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 6. Retrieve patient as Doctor
curl http://localhost:5004/api/patients/pat-e2e-001 \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

---

## Folder Structure

```
backend/
├── index.js                  ← Root launcher (all services, one process)
├── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── auth-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.js
│       ├── models/User.js
│       ├── controllers/authController.js
│       ├── routes/authRoutes.js
│       ├── routes/protectedRoutes.js
│       ├── middleware/authMiddleware.js
│       └── middleware/roleMiddleware.js
│
├── sync-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.js
│       ├── models/SyncLog.js
│       ├── controllers/syncController.js
│       ├── routes/syncRoutes.js
│       ├── middleware/authMiddleware.js
│       └── middleware/roleMiddleware.js
│
├── write-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.js
│       ├── eventBus.js           ← Singleton EventBus
│       ├── models/PatientEvent.js
│       ├── controllers/writeController.js
│       ├── routes/writeRoutes.js
│       ├── middleware/authMiddleware.js
│       └── middleware/roleMiddleware.js
│
├── read-service/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env / .env.example
│   └── src/
│       ├── server.js             ← Subscribes to EventBus on startup
│       ├── models/PatientProfile.js
│       ├── controllers/readController.js
│       ├── routes/readRoutes.js
│       ├── handlers/patientEventHandler.js
│       ├── middleware/authMiddleware.js
│       └── middleware/roleMiddleware.js
│
└── shared/
    ├── eventBus/eventBus.js      ← Reference implementation
    ├── middleware/authMiddleware.js
    ├── middleware/roleMiddleware.js
    └── config/db.js
```

---

## SRS Acceptance Criteria — Status

| Criteria                              | Status |
|---------------------------------------|--------|
| ASHA can enter data offline           | ✅ (PWA side — IndexedDB handled by frontend) |
| Data persists across reload           | ✅ (MongoDB append-only store) |
| Sync works correctly                  | ✅ Sync Service with idempotency + retry |
| Events are published and consumed     | ✅ PatientDataSynced via EventBus |
| Read model updates correctly          | ✅ PatientProfile upserted on event |
| Doctor retrieves data quickly         | ✅ GET /api/patients/:id (CQRS read model) |
| RBAC enforced                         | ✅ JWT + role middleware on all routes |

---

## Security Notes

- `JWT_SECRET` must be a long, random string in production
- All passwords hashed with bcrypt (salt rounds: 12)
- CORS enabled — restrict `origin` in production
- All routes protected with `verifyToken` + `requireRole` middleware
- Write model is append-only (no update/delete operations)
