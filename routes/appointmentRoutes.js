const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAppointment, getMyAppointments, updateAppointmentStatus, deleteAppointment } = require('../controllers/appointmentController');

router.post('/', protect, createAppointment);
router.get('/me', protect, getMyAppointments);
router.patch('/:id/status', protect, updateAppointmentStatus);
router.delete('/:id', protect, deleteAppointment);

module.exports = router;


