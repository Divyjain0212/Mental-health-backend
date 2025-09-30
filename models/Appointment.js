const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:MM AM/PM
    status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
    notes: { type: String },
  },
  { timestamps: true }
);

const Appointment = mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;


