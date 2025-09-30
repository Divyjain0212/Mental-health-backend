const Alert = require('../models/Alert');
const User = require('../models/User');

// Create a new alert from a student to counsellors/admins
const createAlert = async (req, res) => {
  try {
    const { message, level } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const alert = await Alert.create({
      student: req.user && req.user._id ? req.user._id : undefined,
      message,
      level: level || 'critical',
    });

    return res.status(201).json(alert);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create alert', error: error.message });
  }
};

// List alerts for a counsellor/admin inbox (unhandled first, newest first)
const listAlertsForCounsellor = async (req, res) => {
  try {
    // Optionally gate by role
    // if (!['counsellor', 'admin'].includes(req.user.role)) {
    //   return res.status(403).json({ message: 'Forbidden' });
    // }

    const alerts = await Alert.find()
      .populate('student', 'name email')
      .sort({ handled: 1, createdAt: -1 });

    return res.status(200).json(alerts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch alerts', error: error.message });
  }
};

// Mark an alert as handled
const markHandled = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Alert.findByIdAndUpdate(
      id,
      { $set: { handled: true } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update alert', error: error.message });
  }
};

module.exports = { createAlert, listAlertsForCounsellor, markHandled };


