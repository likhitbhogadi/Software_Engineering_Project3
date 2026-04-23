const mongoose = require('mongoose');

/**
 * PatientProfile - Read Model (CQRS Query Side)
 *
 * Aggregated, query-optimized view of patient data.
 * Built and updated by consuming PatientDataSynced events.
 * Never written to directly by the API — only by the event handler.
 *
 * Doctors use GET /patients/:id to retrieve this.
 */
const patientProfileSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Summary counts by event type
    eventSummary: {
      MATERNAL_CARE: { type: Number, default: 0 },
      IMMUNIZATION: { type: Number, default: 0 },
      NEWBORN_CARE: { type: Number, default: 0 },
      DISEASE_TRACKING: { type: Number, default: 0 },
      GENERAL_CHECKUP: { type: Number, default: 0 },
    },
    // Full event history (array of lightweight event references)
    events: [
      {
        recordId: String,
        ashaId: String,
        eventType: String,
        timestamp: Date,
        eventData: mongoose.Schema.Types.Mixed,
      },
    ],
    // Metadata
    firstSeenAt: {
      type: Date,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
