const User = require('../models/User');

exports.listCounsellors = async (req, res) => {
  try {
    const counsellors = await User.find({ role: 'counsellor' }).select('-password');
    
    // Format for frontend compatibility and group by specialization
    const formattedCounsellors = counsellors.map(counsellor => ({
      id: counsellor._id.toString(),
      _id: counsellor._id.toString(),
      name: counsellor.name,
      email: counsellor.email,
      phone: counsellor.phone,
      specialization: counsellor.specialization || ['General Counseling'],
      languages: counsellor.languages || ['English'],
      availableDays: counsellor.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableHours: counsellor.availableHours || '9:00 AM - 5:00 PM',
      location: counsellor.location || 'Student Counseling Center',
      campus: counsellor.campus || 'Main Campus'
    }));

    // Group counsellors by their primary specialization for categorization
    const categorizedCounsellors = {
      'Anxiety Disorders': formattedCounsellors.filter(c => c.specialization.some(s => s.includes('Anxiety'))),
      'Depression': formattedCounsellors.filter(c => c.specialization.some(s => s.includes('Depression') || s.includes('Crisis'))),
      'Academic Stress': formattedCounsellors.filter(c => c.specialization.some(s => s.includes('Academic') || s.includes('Study') || s.includes('Exam'))),
      'Peer Support': formattedCounsellors.filter(c => c.specialization.some(s => s.includes('Peer') || s.includes('Social') || s.includes('Homesickness'))),
      'General': formattedCounsellors.filter(c => !c.specialization.some(s => s.includes('Anxiety') || s.includes('Depression') || s.includes('Academic') || s.includes('Peer') || s.includes('Crisis') || s.includes('Study') || s.includes('Exam') || s.includes('Social') || s.includes('Homesickness')))
    };
    
    res.json({
      all: formattedCounsellors,
      categories: categorizedCounsellors
    });
  } catch (error) {
    console.error('listCounsellors error', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


