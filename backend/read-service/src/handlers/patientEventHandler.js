const PatientProfile = require('../models/PatientProfile');

/**
 * Handles the PatientDataSynced event published by Write Service.
 *
 * Updates (or creates) the aggregated PatientProfile in the read DB.
 * This is the core of the CQRS read-side projection.
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
  } catch (err) {
    console.error('[Read Service] Error handling PatientDataSynced event:', err.message);
  }
};

module.exports = { handlePatientDataSynced };
