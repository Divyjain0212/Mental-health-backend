const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Import your User model

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for Seeder...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

// --- SEED REALISTIC ADMIN, STUDENTS, AND COUNSELLORS ---
const users = [
  // Admins
  {
    email: 'admin@university.edu',
    password: 'password123',
    role: 'admin',
    name: 'Campus Admin',
    phone: '+91-9000000001'
  },
  // Students
  {
    email: 'aisha.khan@student.university.edu',
    password: 'password123',
    role: 'student',
    name: 'Aisha Khan',
    campus: 'Main Campus'
  },
  {
    email: 'rohan.verma@student.university.edu',
    password: 'password123',
    role: 'student',
    name: 'Rohan Verma',
    campus: 'North Campus'
  },
  {
    email: 'meera.iyer@student.university.edu',
    password: 'password123',
    role: 'student',
    name: 'Meera Iyer',
    campus: 'South Campus'
  },
  // Counsellors
  {
    email: 'priya.sharma@university.edu',
    password: 'password123',
    role: 'counsellor',
    name: 'Dr. Priya Sharma',
    phone: '+91-9876543210',
    languages: ['English', 'Hindi', 'Punjabi'],
    specialization: ['Anxiety Disorders', 'Academic Stress', 'Cultural Adjustment'],
    location: 'Student Counseling Center, Block A',
    campus: 'Main Campus',
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    availableHours: '9:00 AM - 5:00 PM',
  },
  {
    email: 'rahul.mehta@university.edu',
    password: 'password123',
    role: 'counsellor',
    name: 'Counselor Rahul Mehta',
    phone: '+91-9876543211',
    languages: ['Hindi', 'English', 'Bengali'],
    specialization: ['Peer Counseling', 'Homesickness', 'Social Integration'],
    location: 'Hostel Support Office, Block B',
    campus: 'Main Campus',
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    availableHours: '2:00 PM - 8:00 PM',
  },
  {
    email: 'anita.patel@university.edu',
    password: 'password123',
    role: 'counsellor',
    name: 'Dr. Anita Patel',
    phone: '+91-9876543212',
    languages: ['English', 'Hindi', 'Gujarati', 'Marathi'],
    specialization: ['Crisis Counseling', 'Depression', 'Emergency Support'],
    location: 'Emergency Support Center',
    campus: 'Main Campus',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    availableHours: '12:00 AM - 11:59 PM',
  },
  {
    email: 'deepak.kumar@university.edu',
    password: 'password123',
    role: 'counsellor',
    name: 'Counselor Deepak Kumar',
    phone: '+91-9876543213',
    languages: ['Hindi', 'English', 'Tamil'],
    specialization: ['Study Skills', 'Exam Anxiety', 'Time Management'],
    location: 'Academic Support Center, Block C',
    campus: 'Main Campus',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    availableHours: '10:00 AM - 6:00 PM',
  },
];

const importData = async () => {
  await connectDB();
  try {
    // Clear existing seeded users (by role) to avoid duplicates
    await User.deleteMany({ role: { $in: ['admin', 'student', 'counsellor'] } });

    // The User.create method will trigger the password hashing
    await User.create(users);

    console.log('Admin, Student, and Counsellor Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  await connectDB();
  try {
    await User.deleteMany();
    console.log('Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

// Logic to run the correct function
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}