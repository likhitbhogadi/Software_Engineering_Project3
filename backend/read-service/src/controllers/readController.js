const PatientProfile = require('../models/PatientProfile');

/**
 * GET /api/patients/:id
 *
 * Returns the full aggregated patient profile from the read model.
 * Available to DOCTOR role only (enforced by route middleware).
 *
 * Response includes:
 *  - patientId
 *  - totalEvents
 *  - eventSummary (counts by type)
 *  - events[] (full history, sorted oldest-first)
 *  - firstSeenAt, lastUpdatedAt
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await PatientProfile.findOne({ patientId: id });

    if (!profile) {
      return res.status(404).json({ message: `No patient data found for patientId: ${id}` });
    }

    // Sort events by timestamp ascending
    const sortedEvents = [...profile.events].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return res.status(200).json({
      patientId: profile.patientId,
      totalEvents: profile.totalEvents,
      firstSeenAt: profile.firstSeenAt,
      lastUpdatedAt: profile.lastUpdatedAt,
      eventSummary: profile.eventSummary,
      events: sortedEvents,
    });
  } catch (err) {
    console.error('Read Service getPatientById error:', err);
    return res.status(500).json({ message: 'Server error retrieving patient data' });
  }
};

/**
 * GET /api/patients
 *
 * Returns a paginated list of all patient IDs and summary info.
 * DOCTOR role only.
 */
const listPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await PatientProfile.countDocuments();
    const patients = await PatientProfile.find({})
      .select('patientId totalEvents eventSummary firstSeenAt lastUpdatedAt')
      .sort({ lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      total,
      page,
      limit,
      patients,
    });
  } catch (err) {
    console.error('Read Service listPatients error:', err);
    return res.status(500).json({ message: 'Server error listing patients' });
  }
};

module.exports = { getPatientById, listPatients };
