const MoodLog = require('../models/MoodLog');
const Gamification = require('../models/Gamification');

exports.createMood = async (req, res) => {
  try {
    const { mood, score, source } = req.body;
    if (!mood) return res.status(400).json({ message: 'mood required' });
    const log = await MoodLog.create({ student: req.user._id, mood, score, source: source || 'self' });

    // Calculate proper streak based on consecutive days with mood logs
    const userMoods = await MoodLog.find({ 
      student: req.user._id 
    }).sort({ createdAt: -1 });
    
    // Group moods by date
    const moodsByDate = {};
    userMoods.forEach(moodLog => {
      const date = moodLog.createdAt.toISOString().split('T')[0];
      if (!moodsByDate[date]) {
        moodsByDate[date] = [];
      }
      moodsByDate[date].push(moodLog);
    });
    
    // Calculate consecutive streak from today backwards
    let streakCount = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      if (moodsByDate[dateStr] && moodsByDate[dateStr].length > 0) {
        streakCount++;
      } else {
        break; // Break streak if no mood logged on this day
      }
    }

    // Update or create gamification record
    const todayStr = new Date().toISOString().split('T')[0];
    let gam = await Gamification.findOne({ student: req.user._id });
    
    if (!gam) {
      gam = await Gamification.create({ 
        student: req.user._id, 
        points: 10, 
        streakCount: streakCount, 
        lastCheckInDate: todayStr, 
        badges: [] 
      });
    } else {
      // Always recalculate points and streak
      const totalMoods = userMoods.length;
      const newPoints = totalMoods * 10 + streakCount * 5;
      
      gam.points = newPoints;
      gam.streakCount = streakCount;
      gam.lastCheckInDate = todayStr;
      
      // Award badges based on streak
      if (streakCount >= 7 && !gam.badges.includes('7-day-streak')) {
        gam.badges.push('7-day-streak');
      }
      if (streakCount >= 30 && !gam.badges.includes('30-day-streak')) {
        gam.badges.push('30-day-streak');
      }
      
      await gam.save();
    }

    res.status(201).json({ log, gamification: gam });
  } catch (e) {
    console.error('Create mood error:', e);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.listMyMoods = async (req, res) => {
  try {
    const logs = await MoodLog.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Return current streak/points and last 7 days mood history (numeric)
exports.getStats = async (req, res) => {
  try {
    const gam = await Gamification.findOne({ student: req.user._id });

    // Build last 7 days mood numeric values
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const logs = await MoodLog.find({ student: req.user._id, createdAt: { $gte: start, $lte: end } }).sort({ createdAt: 1 });

    const dayKey = (d) => d.toISOString().slice(0,10);
    const moodToNum = (m) => (m === 'Happy' ? 3 : (m === 'Neutral' || m === 'Okay') ? 2 : (m === 'Sad' ? 1 : 2));
    const byDay = new Map();
    logs.forEach(l => {
      const k = dayKey(l.createdAt);
      const arr = byDay.get(k) || [];
      arr.push(moodToNum(l.mood));
      byDay.set(k, arr);
    });
    const series = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = dayKey(d);
      const arr = byDay.get(k) || [];
      const avg = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      series.push({ day: dayLabel, mood: Number(avg.toFixed(0)) });
    }

    res.json({
      points: gam?.points || 0,
      streakCount: gam?.streakCount || 0,
      lastCheckInDate: gam?.lastCheckInDate || null,
      history7d: series,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server Error' });
  }
};


