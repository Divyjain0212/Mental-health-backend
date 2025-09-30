const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    level: { type: String, enum: ['info', 'warning', 'critical'], default: 'critical' },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Alert = mongoose.model('Alert', AlertSchema);
module.exports = Alert;



