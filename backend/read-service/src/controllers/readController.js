const PatientProfile = require('../models/PatientProfile');
const redisClient = require('../config/redisClient');

const PATIENT_CACHE_TTL = 300; // 5 minutes
const LIST_CACHE_TTL = 60; // 1 minute

/**
 * GET /api/patients/:id
 *
 * Returns the full aggregated patient profile from the read model.
 * Available to DOCTOR role only (enforced by route middleware).
 *
 * Cache-aside pattern:
 *  1. Check Redis for cached profile
 *  2. On HIT  → return cached JSON
 *  3. On MISS → query MongoDB, cache result, return
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
    const cacheKey = `patient:${id}`;

    // 1. Try Redis cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[Read Service] Cache HIT for ${cacheKey}`);
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.error('[Read Service] Redis GET error (falling back to DB):', cacheErr.message);
    }

    // 2. Cache MISS — fetch from MongoDB
    console.log(`[Read Service] Cache MISS for ${cacheKey}, querying DB`);
    const profile = await PatientProfile.findOne({ patientId: id });

    if (!profile) {
      return res.status(404).json({ message: `No patient data found for patientId: ${id}` });
    }

    // Sort events by timestamp ascending
    const sortedEvents = [...profile.events].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const responseData = {
      patientId: profile.patientId,
      totalEvents: profile.totalEvents,
      firstSeenAt: profile.firstSeenAt,
      lastUpdatedAt: profile.lastUpdatedAt,
      eventSummary: profile.eventSummary,
      events: sortedEvents,
    };

    // 3. Store in Redis with TTL
    try {
      await redisClient.setEx(cacheKey, PATIENT_CACHE_TTL, JSON.stringify(responseData));
      console.log(`[Read Service] Cached ${cacheKey} (TTL ${PATIENT_CACHE_TTL}s)`);
    } catch (cacheErr) {
      console.error('[Read Service] Redis SET error:', cacheErr.message);
    }

    return res.status(200).json(responseData);
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
 *
 * Cached with a short TTL to reduce DB load on repeated list views.
 */
const listPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const cacheKey = `patients:list:page=${page}:limit=${limit}`;

    // 1. Try Redis cache
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`[Read Service] Cache HIT for ${cacheKey}`);
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.error('[Read Service] Redis GET error (falling back to DB):', cacheErr.message);
    }

    // 2. Cache MISS
    console.log(`[Read Service] Cache MISS for ${cacheKey}, querying DB`);
    const total = await PatientProfile.countDocuments();
    const patients = await PatientProfile.find({})
      .select('patientId totalEvents eventSummary firstSeenAt lastUpdatedAt')
      .sort({ lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const responseData = {
      total,
      page,
      limit,
      patients,
    };

    // 3. Cache with short TTL
    try {
      await redisClient.setEx(cacheKey, LIST_CACHE_TTL, JSON.stringify(responseData));
      console.log(`[Read Service] Cached ${cacheKey} (TTL ${LIST_CACHE_TTL}s)`);
    } catch (cacheErr) {
      console.error('[Read Service] Redis SET error:', cacheErr.message);
    }

    return res.status(200).json(responseData);
  } catch (err) {
    console.error('Read Service listPatients error:', err);
    return res.status(500).json({ message: 'Server error listing patients' });
  }
};

module.exports = { getPatientById, listPatients };
