const Appointment = require('../models/Appointment');
const User = require('../models/User');

exports.createAppointment = async (req, res) => {
  try {
    const { counsellorId, date, time } = req.body;
    if (!counsellorId || !date || !time) {
      return res.status(400).json({ message: 'counsellorId, date and time are required' });
    }

    // Validate counsellor role
    const counsellor = await User.findById(counsellorId);
    if (!counsellor || counsellor.role !== 'counsellor') {
      return res.status(400).json({ message: 'Invalid counsellor' });
    }

    const appointment = await Appointment.create({
      student: req.user._id,
      counsellor: counsellorId,
      date,
      time,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('createAppointment error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const filter = req.user.role === 'counsellor' ? { counsellor: req.user._id } : { student: req.user._id };
    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .populate('student', 'email role')
      .populate('counsellor', 'email role');
    res.json(appointments);
  } catch (error) {
    console.error('getMyAppointments error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['scheduled', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Only student who booked or counsellor can update
    if (
      appointment.student.toString() !== req.user._id.toString() &&
      appointment.counsellor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    console.error('updateAppointmentStatus error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    if (
      appt.student.toString() !== req.user._id.toString() &&
      appt.counsellor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this appointment' });
    }
    await appt.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('deleteAppointment error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


