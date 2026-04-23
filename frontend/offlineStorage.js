import { openDB } from 'idb';

const DB_NAME = 'mediflow_db';
const DB_VERSION = 1;
const STORE_NAME = 'unsynced_records';

/**
 * Opens (or creates) the IndexedDB database.
 */
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'recordId' });
        store.createIndex('synced', 'synced');
        store.createIndex('patientId', 'patientId');
      }
    },
  });
}

/**
 * Save a single patient record to IndexedDB (offline).
 * @param {object} record - { recordId, patientId, ashaId, timestamp, eventType, eventData }
 */
export async function saveRecordOffline(record) {
  const db = await getDB();
  const entry = {
    ...record,
    synced: false,
    savedAt: new Date().toISOString(),
  };
  await db.put(STORE_NAME, entry);
  return entry;
}

/**
 * Get all unsynced records.
 */
export async function getUnsyncedRecords() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.filter((r) => !r.synced);
}

/**
 * Get all records (synced and unsynced).
 */
export async function getAllRecords() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Mark a list of recordIds as synced.
 * @param {string[]} recordIds
 */
export async function markAsSynced(recordIds) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  for (const recordId of recordIds) {
    const record = await store.get(recordId);
    if (record) {
      record.synced = true;
      record.syncedAt = new Date().toISOString();
      await store.put(record);
    }
  }

  await tx.done;
}

/**
 * Delete a single record by recordId.
 */
export async function deleteRecord(recordId) {
  const db = await getDB();
  await db.delete(STORE_NAME, recordId);
}

/**
 * Count unsynced records.
 */
export async function countUnsynced() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.filter((r) => !r.synced).length;
}

/**
 * Clear all records (for testing/reset).
 */
export async function clearAllRecords() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
