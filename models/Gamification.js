const mongoose = require('mongoose');

const GamificationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    points: { type: Number, default: 0 },
    streakCount: { type: Number, default: 0 },
    lastCheckInDate: { type: String, default: '' }, // YYYY-MM-DD
    badges: [{ type: String }],
  },
  { timestamps: true }
);

const Gamification = mongoose.model('Gamification', GamificationSchema);
module.exports = Gamification;




