const PatientProfile = require('../models/PatientProfile');
const redisClient = require('../config/redisClient');

/**
 * Handles the PatientDataSynced event published by Write Service.
 *
 * Updates (or creates) the aggregated PatientProfile in the read DB.
 * This is the core of the CQRS read-side projection.
 *
 * After updating the read model, invalidates the Redis cache for:
 *  - The specific patient (patient:<id>)
 *  - All paginated list caches (patients:list:*)
 *
 * Event payload shape:
 * {
 *   eventType: 'PatientDataSynced',
 *   patientId: '...',
 *   recordId: '...',
 *   timestamp: Date,
 *   payload: {
 *     eventType: 'MATERNAL_CARE' | 'IMMUNIZATION' | ...,
 *     eventData: {},
 *     ashaId: '...'
 *   }
 * }
 */
const handlePatientDataSynced = async (data) => {
  try {
    const { patientId, recordId, timestamp, payload } = data;
    const { eventType, eventData, ashaId } = payload;

    console.log(`[Read Service] Handling PatientDataSynced for patient: ${patientId}, record: ${recordId}`);

    // Check if this event was already applied (idempotency)
    const existingProfile = await PatientProfile.findOne({ patientId });

    if (existingProfile) {
      const alreadyApplied = existingProfile.events.some((e) => e.recordId === recordId);
      if (alreadyApplied) {
        console.log(`[Read Service] Event ${recordId} already applied to read model. Skipping.`);
        return;
      }
    }

    // Build the new event entry
    const eventEntry = {
      recordId,
      ashaId,
      eventType,
      timestamp: new Date(timestamp),
      eventData,
    };

    // Upsert the patient profile
    const profile = await PatientProfile.findOneAndUpdate(
      { patientId },
      {
        $push: { events: eventEntry },
        $inc: {
          totalEvents: 1,
          [`eventSummary.${eventType}`]: 1,
        },
        $set: {
          lastUpdatedAt: new Date(),
        },
        $setOnInsert: {
          firstSeenAt: new Date(timestamp),
        },
      },
      { upsert: true, new: true }
    );

    console.log(`[Read Service] PatientProfile updated for ${patientId}. Total events: ${profile.totalEvents}`);

    // ── Cache Invalidation ──────────────────────────────────────
    try {
      // Invalidate the specific patient cache
      await redisClient.del(`patient:${patientId}`);
      console.log(`[Read Service] Cache invalidated for patient:${patientId}`);

      // Invalidate all paginated list caches so the next list query is fresh
      const listKeys = await redisClient.keys('patients:list:*');
      if (listKeys.length > 0) {
        await redisClient.del(listKeys);
        console.log(`[Read Service] Invalidated ${listKeys.length} list cache key(s)`);
      }
    } catch (cacheErr) {
      // Cache invalidation failure is non-fatal; stale data expires via TTL
      console.error('[Read Service] Redis cache invalidation error:', cacheErr.message);
    }
  } catch (err) {
    console.error('[Read Service] Error handling PatientDataSynced event:', err.message);
  }
};

module.exports = { handlePatientDataSynced };
