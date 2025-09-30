const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getOverview, getWeeklyTrends, getCampusBreakdown } = require('../controllers/adminController');

// Simple role check middleware
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

router.get('/overview', protect, requireAdmin, getOverview);
router.get('/weekly-trends', protect, requireAdmin, getWeeklyTrends);
router.get('/campus-breakdown', protect, requireAdmin, getCampusBreakdown);

module.exports = router;


