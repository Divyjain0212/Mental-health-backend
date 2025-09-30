const mongoose = require('mongoose');

const RedemptionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
    code: { type: String, required: true },
    pointsSpent: { type: Number, required: true },
  },
  { timestamps: true }
);

const Redemption = mongoose.model('Redemption', RedemptionSchema);
module.exports = Redemption;




