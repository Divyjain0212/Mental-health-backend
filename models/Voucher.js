const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    pointsCost: { type: Number, required: true },
    code: { type: String, required: true },
    active: { type: Boolean, default: true },
    stock: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Voucher = mongoose.model('Voucher', VoucherSchema);
module.exports = Voucher;




