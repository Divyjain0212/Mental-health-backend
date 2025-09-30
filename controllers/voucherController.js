const Voucher = require('../models/Voucher');
const Gamification = require('../models/Gamification');
const Redemption = require('../models/Redemption');

exports.listVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ active: true, stock: { $gt: 0 } }).sort({ pointsCost: 1 });
    res.json(vouchers);
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.redeemVoucher = async (req, res) => {
  try {
    const { voucherId } = req.body;
    const voucher = await Voucher.findById(voucherId);
    if (!voucher || !voucher.active || voucher.stock <= 0) return res.status(400).json({ message: 'Voucher unavailable' });

    const gam = await Gamification.findOne({ student: req.user._id });
    if (!gam || gam.points < voucher.pointsCost) return res.status(400).json({ message: 'Insufficient points' });

    gam.points -= voucher.pointsCost;
    await gam.save();
    voucher.stock -= 1;
    await voucher.save();

    const redemption = await Redemption.create({
      student: req.user._id,
      voucher: voucher._id,
      code: voucher.code,
      pointsSpent: voucher.pointsCost,
    });

    res.json({ redemption, remainingPoints: gam.points });
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};




