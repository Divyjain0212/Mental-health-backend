const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createAlert, listAlertsForCounsellor, markHandled } = require('../controllers/alertController');

router.post('/', protect, createAlert);
router.get('/inbox', protect, listAlertsForCounsellor); // counsellor view
router.patch('/:id/handled', protect, markHandled);

module.exports = router;




