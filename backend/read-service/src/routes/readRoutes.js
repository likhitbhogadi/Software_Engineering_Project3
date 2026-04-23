const express = require('express');
const router = express.Router();
const { getPatientById, listPatients } = require('../controllers/readController');
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// GET /api/patients/:id — Doctor only (SRS FR7)
router.get('/:id', verifyToken, requireRole('DOCTOR'), getPatientById);

// GET /api/patients — Doctor can list all patients
router.get('/', verifyToken, requireRole('DOCTOR'), listPatients);

module.exports = router;
