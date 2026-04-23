const express = require('express');
const router = express.Router();
const { storeRecord, getPatientEvents } = require('../controllers/writeController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// POST /api/write/records — called internally by Sync Service (ASHA or SYSTEM token)
router.post('/records', verifyToken, requireRole('ASHA', 'SYSTEM'), storeRecord);

// GET /api/write/records/:patientId — audit/admin access (SYSTEM only)
router.get('/records/:patientId', verifyToken, requireRole('SYSTEM'), getPatientEvents);

module.exports = router;
