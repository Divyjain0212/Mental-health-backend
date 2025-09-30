const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createMood, listMyMoods, getStats } = require('../controllers/moodController');

router.post('/', protect, createMood);
router.get('/me', protect, listMyMoods);
router.get('/stats', protect, getStats);

module.exports = router;


