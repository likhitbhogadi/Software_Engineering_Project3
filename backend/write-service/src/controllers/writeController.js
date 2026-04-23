const PatientEvent = require('../models/PatientEvent');
const eventBus = require('../eventBus');

/**
 * POST /api/write/records
 *
 * Called by Sync Service.
 * Stores a single patient event record in the write DB (append-only).
 * On success, publishes PatientDataSynced event to the event bus.
 *
 * Idempotent: if recordId already exists, returns 200 without duplicating.
 */
const storeRecord = async (req, res) => {
  try {
    const { recordId, patientId, ashaId, timestamp, eventType, eventData } = req.body;

    // Check for existing record (idempotency)
    const existing = await PatientEvent.findOne({ recordId });
    if (existing) {
      console.log(`Write Service: Record ${recordId} already exists. Skipping insert.`);
      return res.status(200).json({ message: 'Record already stored (idempotent)', recordId });
    }

    // Store the event
    const event = await PatientEvent.create({
      recordId,
      patientId,
      ashaId,
      timestamp: new Date(timestamp),
      eventType,
      eventData,
    });

    console.log(`Write Service: Stored record ${recordId} for patient ${patientId}`);

    // Publish PatientDataSynced event (FR5)
    const publishPayload = {
      eventType: 'PatientDataSynced',
      patientId: event.patientId,
      recordId: event.recordId,
      timestamp: event.timestamp,
      payload: {
        eventType: event.eventType,
        eventData: event.eventData,
        ashaId: event.ashaId,
      },
    };

    eventBus.publish('PatientDataSynced', publishPayload);

    return res.status(201).json({
      message: 'Record stored successfully',
      recordId: event.recordId,
      patientId: event.patientId,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key — idempotent response
      return res.status(200).json({ message: 'Record already stored (idempotent)', recordId: req.body.recordId });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Write Service error:', err);
    return res.status(500).json({ message: 'Server error storing record' });
  }
};

/**
 * GET /api/write/records/:patientId
 * Returns raw event log for a patient (write model — full history)
 * Accessible by SYSTEM role for audit purposes.
 */
const getPatientEvents = async (req, res) => {
  try {
    const { patientId } = req.params;
    const events = await PatientEvent.find({ patientId }).sort({ timestamp: 1 });
    return res.status(200).json({ patientId, count: events.length, events });
  } catch (err) {
    console.error('Write Service getPatientEvents error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { storeRecord, getPatientEvents };
