const mongoose = require('mongoose');

/**
 * Tracks which recordIds have already been forwarded to Write Service.
 * Used to ensure idempotent processing — duplicate submissions are ignored.
 */
const syncLogSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['SYNCED', 'FAILED'],
      default: 'SYNCED',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SyncLog', syncLogSchema);
