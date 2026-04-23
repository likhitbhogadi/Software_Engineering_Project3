const express = require('express');
const router = express.Router();
const { uploadRecords, checkSyncStatus } = require('../controllers/syncController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// POST /api/sync/upload — ASHA workers only
router.post('/upload', verifyToken, requireRole('ASHA'), uploadRecords);

// GET /api/sync/status/:recordId — ASHA workers can check their own sync status
router.get('/status/:recordId', verifyToken, requireRole('ASHA', 'SYSTEM'), checkSyncStatus);

module.exports = router;
