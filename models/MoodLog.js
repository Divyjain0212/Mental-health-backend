const mongoose = require('mongoose');

const MoodLogSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mood: { type: String, enum: ['Happy', 'Okay', 'Sad', 'Angry', 'Neutral'], required: true },
    score: { type: Number, min: 0, max: 1 }, // optional confidence score from detector
    source: { type: String, enum: ['self', 'camera'], default: 'self' },
  },
  { timestamps: true }
);

const MoodLog = mongoose.model('MoodLog', MoodLogSchema);
module.exports = MoodLog;



