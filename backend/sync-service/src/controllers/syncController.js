const axios = require('axios');
const SyncLog = require('../models/SyncLog');

const WRITE_SERVICE_URL = process.env.WRITE_SERVICE_URL || 'http://localhost:5003';

/**
 * Validates a single record against expected schema.
 * Returns null if valid, or an error string if invalid.
 */
const validateRecord = (record) => {
  const required = ['recordId', 'patientId', 'ashaId', 'timestamp', 'eventType', 'eventData'];
  for (const field of required) {
    if (!record[field] && record[field] !== 0) {
      return `Missing required field: ${field}`;
    }
  }
  if (typeof record.eventData !== 'object' || Array.isArray(record.eventData)) {
    return 'eventData must be an object';
  }
  return null;
};

/**
 * POST /api/sync/upload
 * Body: { records: [ { recordId, patientId, ashaId, timestamp, eventType, eventData } ] }
 *
 * - Validates JWT (ASHA role only)
 * - Validates each record
 * - Skips already-synced records (idempotency)
 * - Forwards new records to Write Service with retry
 */
const uploadRecords = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Body must contain a non-empty "records" array' });
    }

    const results = {
      total: records.length,
      synced: [],
      skipped: [],
      failed: [],
    };

    for (const record of records) {
      // 1. Validate schema
      const validationError = validateRecord(record);
      if (validationError) {
        results.failed.push({ recordId: record.recordId || 'UNKNOWN', reason: validationError });
        continue;
      }

      // 2. Idempotency check — skip if already synced
      const alreadySynced = await SyncLog.findOne({ recordId: record.recordId });
      if (alreadySynced) {
        results.skipped.push({ recordId: record.recordId, reason: 'Already synced' });
        continue;
      }

      // 3. Forward to Write Service with retry (up to 3 attempts)
      let forwarded = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await axios.post(`${WRITE_SERVICE_URL}/api/write/records`, record, {
            headers: {
              'Content-Type': 'application/json',
              // Pass through auth header for service-to-service trust
              Authorization: req.headers.authorization,
            },
            timeout: 5000,
          });
          forwarded = true;
          break;
        } catch (err) {
          console.error(`Sync: Attempt ${attempt} failed for recordId ${record.recordId}:`, err.message);
          if (attempt === 3) {
            results.failed.push({ recordId: record.recordId, reason: 'Write Service unreachable after 3 attempts' });
          }
        }
      }

      if (forwarded) {
        // 4. Log as synced to prevent future duplicates
        await SyncLog.create({ recordId: record.recordId, status: 'SYNCED' });
        results.synced.push({ recordId: record.recordId });
      }
    }

    return res.status(200).json({
      message: 'Sync complete',
      results,
    });
  } catch (err) {
    console.error('Sync upload error:', err);
    return res.status(500).json({ message: 'Server error during sync' });
  }
};

/**
 * GET /api/sync/status/:recordId
 * Check if a specific record has been synced
 */
const checkSyncStatus = async (req, res) => {
  try {
    const { recordId } = req.params;
    const log = await SyncLog.findOne({ recordId });

    if (!log) {
      return res.status(404).json({ recordId, synced: false, message: 'Record not found in sync log' });
    }

    return res.status(200).json({ recordId, synced: true, syncedAt: log.syncedAt, status: log.status });
  } catch (err) {
    console.error('Sync status error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { uploadRecords, checkSyncStatus };
