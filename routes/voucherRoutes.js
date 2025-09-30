const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { listVouchers, redeemVoucher } = require('../controllers/voucherController');

router.get('/', protect, listVouchers);
router.post('/redeem', protect, redeemVoucher);

module.exports = router;




