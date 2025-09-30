const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MoodLog = require('../models/MoodLog');

exports.getOverview = async (req, res) => {
  try {
    // Basic counts. In real usage, compute from real collections.
    const totalUsers = await User.countDocuments();
    const counsellors = await User.countDocuments({ role: 'counsellor' });
    const students = await User.countDocuments({ role: 'student' });
    const admins = await User.countDocuments({ role: 'admin' });
    const upcomingAppointments = await Appointment.countDocuments({ status: 'scheduled' });

    res.json({ totalUsers, counsellors, students, admins, upcomingAppointments });
  } catch (error) {
    console.error('getOverview error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getWeeklyTrends = async (req, res) => {
  try {
    // Build last 4 weeks mood counts (simple aggregate by week number)
    const now = new Date();
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (i + 1) * 7);
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const logs = await MoodLog.find({ createdAt: { $gte: start, $lt: end } });
      const counts = { Happy: 0, Sad: 0, Neutral: 0 };
      logs.forEach(l => {
        if (counts[l.mood] !== undefined) counts[l.mood]++;
      });
      weeks.push({
        label: `Week ${4 - i}`,
        happy: counts.Happy,
        sad: counts.Sad,
        neutral: counts.Neutral,
      });
    }
    res.json(weeks);
  } catch (e) {
    console.error('getWeeklyTrends error', e);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getCampusBreakdown = async (req, res) => {
  try {
    // Simple aggregation by campus field on counsellors
    const counsellors = await User.find({ role: 'counsellor' });
    const map = new Map();
    counsellors.forEach(c => {
      const campus = c.campus || 'Main Campus';
      map.set(campus, (map.get(campus) || 0) + 1);
    });
    const result = Array.from(map.entries()).map(([campus, count]) => ({ campus, counsellors: count }));
    res.json(result);
  } catch (e) {
    console.error('getCampusBreakdown error', e);
    res.status(500).json({ message: 'Server Error' });
  }
};


