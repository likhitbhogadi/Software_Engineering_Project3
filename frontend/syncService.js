import axios from 'axios';

const SYNC_BASE = '/api/sync';

/**
 * Upload a batch of offline records to the Sync Service.
 * POST /api/sync/upload
 *
 * @param {Array} records - array of patient event records
 * @param {string} token - JWT token
 */
export async function uploadRecords(records, token) {
  const res = await axios.post(
    `${SYNC_BASE}/upload`,
    { records },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    }
  );
  return res.data; // { message, results: { total, synced, skipped, failed } }
}
