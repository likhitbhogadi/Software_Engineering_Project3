const mongoose = require('mongoose');

/**
 * PatientEvent - Source of Truth (Write Model)
 *
 * Append-only: records are never updated or deleted.
 * Each document represents one healthcare interaction/event.
 *
 * Supported eventTypes per SRS FR2:
 *   MATERNAL_CARE | IMMUNIZATION | NEWBORN_CARE | DISEASE_TRACKING | GENERAL_CHECKUP
 */
const patientEventSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: [true, 'recordId is required'],
      unique: true,
      index: true,
    },
    patientId: {
      type: String,
      required: [true, 'patientId is required'],
      index: true,
    },
    ashaId: {
      type: String,
      required: [true, 'ashaId is required'],
    },
    timestamp: {
      type: Date,
      required: [true, 'timestamp is required'],
    },
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: [
        'MATERNAL_CARE',
        'IMMUNIZATION',
        'NEWBORN_CARE',
        'DISEASE_TRACKING',
        'GENERAL_CHECKUP',
      ],
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'eventData is required'],
    },
  },
  {
    timestamps: true,
    // Disable update operations at schema level to enforce append-only
    strict: true,
  }
);

// Prevent updates — write model is append-only
patientEventSchema.pre('findOneAndUpdate', function () {
  throw new Error('PatientEvent is append-only. Updates are not allowed.');
});

patientEventSchema.pre('updateOne', function () {
  throw new Error('PatientEvent is append-only. Updates are not allowed.');
});

module.exports = mongoose.model('PatientEvent', patientEventSchema);
