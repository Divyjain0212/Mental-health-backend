const User = require('../models/User');

exports.listCounsellors = async (req, res) => {
  try {
    const counsellors = await User.find({ role: 'counsellor' }).select('-password');
    res.json(counsellors);
  } catch (error) {
    console.error('listCounsellors error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


