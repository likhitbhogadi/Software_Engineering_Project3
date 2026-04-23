const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// ASHA-only route
router.get('/asha-dashboard', verifyToken, requireRole('ASHA'), (req, res) => {
  res.json({ message: `Welcome ASHA worker ${req.user.email}. You can record patient data.` });
});

// Doctor-only route
router.get('/doctor-dashboard', verifyToken, requireRole('DOCTOR'), (req, res) => {
  res.json({ message: `Welcome Doctor ${req.user.email}. You can view patient records.` });
});

// ASHA and DOCTOR shared route
router.get('/shared', verifyToken, requireRole('ASHA', 'DOCTOR'), (req, res) => {
  res.json({ message: `Hello ${req.user.role} - ${req.user.email}`, user: req.user });
});

// SYSTEM-only route
router.get('/system', verifyToken, requireRole('SYSTEM'), (req, res) => {
  res.json({ message: 'System internal access granted' });
});

module.exports = router;
