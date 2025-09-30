// Vercel serverless function with MongoDB and authentication
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User Schema (inline for simplicity)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'counsellor'], default: 'student' },
  name: { type: String },
  campus: { type: String },
  phone: { type: String },
  languages: [String],
  specialization: [String],
  location: { type: String },
  availableDays: [String],
  availableHours: { type: String }
});

// Mood Log Schema
const MoodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, required: true },
  intensity: { type: Number, min: 1, max: 10, required: true },
  notes: { type: String },
  date: { type: Date, default: Date.now }
});

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String }
});

// Forum Post Schema for Peer Support
const ForumPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['general', 'anxiety', 'depression', 'stress', 'relationships', 'academic'], default: 'general' },
  isAnonymous: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Chat Schema
const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Mood Log Schema
const MoodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, required: true },
  intensity: { type: Number, min: 1, max: 10, required: true },
  note: { type: String },
  timestamp: { type: Date, default: Date.now }
});

// Appointment Schema
const AppointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counsellorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String }
});

// Forum Post Schema for Peer Support
const ForumPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['general', 'anxiety', 'depression', 'stress', 'relationships', 'academic'], default: 'general' },
  isAnonymous: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

let User, MoodLog, Appointment, ForumPost, Chat;
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    if (process.env.MONGO_URI) {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      // Initialize models
      User = mongoose.models.User || mongoose.model('User', UserSchema);
      MoodLog = mongoose.models.MoodLog || mongoose.model('MoodLog', MoodLogSchema);
      Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
      ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);
      Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
      
      isConnected = true;
      console.log('MongoDB Connected Successfully');
      
      // Create test data
      await createTestData();
    } else {
      console.log('MONGO_URI not found in environment variables');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  }
};

// Create test data
const createTestData = async () => {
  try {
    // Create test student
    const existingStudent = await User.findOne({ email: 'test@student.com' });
    if (!existingStudent) {
      const testStudent = new User({
        email: 'test@student.com',
        password: 'password123',
        role: 'student',
        name: 'Test Student'
      });
      await testStudent.save();
      console.log('Test student created: test@student.com / password123');
      
      // Create sample mood logs for the test student
      const moodLogs = [
        { userId: testStudent._id, mood: 'happy', intensity: 8, note: 'Had a great day!', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
        { userId: testStudent._id, mood: 'anxious', intensity: 6, note: 'Exam stress', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
        { userId: testStudent._id, mood: 'calm', intensity: 7, note: 'Meditation helped', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72) }
      ];
      await MoodLog.insertMany(moodLogs);
      console.log('Sample mood logs created');
    }
    
    // Create test counsellor
    const existingCounsellor = await User.findOne({ email: 'counsellor@college.com' });
    if (!existingCounsellor) {
      const testCounsellor = new User({
        email: 'counsellor@college.com',
        password: 'password123',
        role: 'counsellor',
        name: 'Dr. Sarah Wilson',
        specialization: ['Anxiety', 'Depression', 'Academic Stress'],
        languages: ['English', 'Spanish'],
        location: 'Campus Counseling Center',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday'],
        availableHours: '9:00 AM - 5:00 PM'
      });
      await testCounsellor.save();
      console.log('Test counsellor created: counsellor@college.com / password123');
    }
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
};

// Helper function to parse JSON body
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Always try to connect to database
    await connectToDatabase();
    
    // Root endpoint
    if (url === '/' || url === '') {
      return res.status(200).json({
        message: 'MindCare Backend API - Working!',
        status: 'success',
        timestamp: new Date().toISOString(),
        method: method,
        database: isConnected ? 'connected' : 'disconnected'
      });
    }
    
    // API info endpoint
    if (url === '/api' || url === '/api/') {
      return res.status(200).json({
        message: 'MindCare API is running',
        version: '1.0.0',
        status: 'success',
        database: isConnected ? 'connected' : 'disconnected',
        endpoints: [
          'GET /',
          'GET /api',
          'GET /api/health',
          'POST /api/auth/login',
          'GET /api/auth/profile',
          'GET /api/moods',
          'POST /api/moods',
          'GET /api/counsellors',
          'GET /api/appointments',
          'POST /api/appointments',
          'GET /api/forum',
          'POST /api/forum',
          'POST /api/forum/:id/reply',
          'GET /api/chat',
          'POST /api/chat'
        ]
      });
    }
    
    // Health check
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'healthy',
        database: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: {
          hasMongoUri: !!process.env.MONGO_URI,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }
    
    // Auth register endpoint
    if (url === '/api/auth/register' && method === 'POST') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const body = await parseBody(req);
      const { email, password, role = 'student', name } = body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user
        const newUser = new User({
          email,
          password,
          role,
          name
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser._id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        return res.status(201).json({
          token,
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        });
        
      } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
      }
    }
    
    // Auth register endpoint
    if (url === '/api/auth/register' && method === 'POST') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const body = await parseBody(req);
      const { email, password, role = 'student', name } = body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user
        const newUser = new User({
          email,
          password,
          role,
          name
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser._id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        return res.status(201).json({
          token,
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        });
        
      } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
      }
    }
    
    // Auth login endpoint
    if (url === '/api/auth/login' && method === 'POST') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const body = await parseBody(req);
      const { email, password } = body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      try {
        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        return res.status(200).json({
          token,
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
      }
    }
    
    // Auth profile endpoint
    if (url === '/api/auth/profile' && method === 'GET') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json({
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Get mood history endpoint
    if (url === '/api/moods' && method === 'GET') {
      if (!isConnected || !MoodLog) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const moodLogs = await MoodLog.find({ userId: decoded.userId })
          .sort({ timestamp: -1 })
          .limit(30); // Get last 30 mood logs
        
        return res.status(200).json(moodLogs);
        
      } catch (error) {
        console.error('Get moods error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Log mood endpoint
    if (url === '/api/moods' && method === 'POST') {
      if (!isConnected || !MoodLog) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      const body = await parseBody(req);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const { mood, intensity, note } = body;
        
        if (!mood || !intensity) {
          return res.status(400).json({ message: 'Mood and intensity are required' });
        }
        
        const moodLog = new MoodLog({
          userId: decoded.userId,
          mood,
          intensity,
          note
        });
        
        await moodLog.save();
        return res.status(201).json(moodLog);
        
      } catch (error) {
        console.error('Log mood error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Get counsellors endpoint
    if (url === '/api/counsellors' && method === 'GET') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      try {
        const counsellors = await User.find({ role: 'counsellor' })
          .select('-password')
          .limit(20);
        
        return res.status(200).json(counsellors);
        
      } catch (error) {
        console.error('Get counsellors error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    
    // Book appointment endpoint
    if (url === '/api/appointments' && method === 'POST') {
      if (!isConnected || !Appointment) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      const body = await parseBody(req);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const { counsellorId, date, time, notes } = body;
        
        if (!counsellorId || !date || !time) {
          return res.status(400).json({ message: 'Counsellor, date and time are required' });
        }
        
        const appointment = new Appointment({
          studentId: decoded.userId,
          counsellorId,
          date: new Date(date),
          time,
          notes
        });
        
        await appointment.save();
        return res.status(201).json(appointment);
        
      } catch (error) {
        console.error('Book appointment error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Get appointments endpoint
    if (url === '/api/appointments' && method === 'GET') {
      if (!isConnected || !Appointment) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        let appointments;
        if (decoded.role === 'counsellor') {
          appointments = await Appointment.find({ counsellorId: decoded.userId })
            .populate('studentId', 'name email')
            .sort({ date: 1 });
        } else {
          appointments = await Appointment.find({ studentId: decoded.userId })
            .populate('counsellorId', 'name specialization')
            .sort({ date: 1 });
        }
        
        return res.status(200).json(appointments);
        
      } catch (error) {
        console.error('Get appointments error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Forum endpoints (Peer Support)
    
    // Get all forum posts
    if (url === '/api/forum' && method === 'GET') {
      if (!isConnected || !ForumPost) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      try {
        const posts = await ForumPost.find()
          .populate('authorId', 'name')
          .populate('replies.authorId', 'name')
          .sort({ createdAt: -1 });
        
        return res.status(200).json(posts);
        
      } catch (error) {
        console.error('Get forum posts error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    
    // Create forum post
    if (url === '/api/forum' && method === 'POST') {
      if (!isConnected || !ForumPost) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const body = await parseBody(req);
        const { title, content, category, isAnonymous } = body;
        
        if (!title || !content) {
          return res.status(400).json({ message: 'Title and content are required' });
        }
        
        const post = new ForumPost({
          authorId: decoded.userId,
          title,
          content,
          category: category || 'general',
          isAnonymous: isAnonymous || false
        });
        
        await post.save();
        await post.populate('authorId', 'name');
        
        return res.status(201).json(post);
        
      } catch (error) {
        console.error('Create forum post error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Add reply to forum post
    if (url.startsWith('/api/forum/') && url.includes('/reply') && method === 'POST') {
      if (!isConnected || !ForumPost) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      const postId = url.split('/')[3]; // Extract post ID from URL
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const body = await parseBody(req);
        const { content, isAnonymous } = body;
        
        if (!content) {
          return res.status(400).json({ message: 'Content is required' });
        }
        
        const post = await ForumPost.findById(postId);
        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }
        
        const reply = {
          authorId: decoded.userId,
          content,
          isAnonymous: isAnonymous || false,
          createdAt: new Date()
        };
        
        post.replies.push(reply);
        await post.save();
        await post.populate('replies.authorId', 'name');
        
        return res.status(201).json(post);
        
      } catch (error) {
        console.error('Add reply error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Chat endpoints
    
    // Get chat history
    if (url === '/api/chat' && method === 'GET') {
      if (!isConnected || !Chat) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        const chats = await Chat.find({ userId: decoded.userId })
          .sort({ timestamp: 1 })
          .limit(50);
        
        return res.status(200).json(chats);
        
      } catch (error) {
        console.error('Get chat history error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Send chat message
    if (url === '/api/chat' && method === 'POST') {
      if (!isConnected || !Chat) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const body = await parseBody(req);
        const { message } = body;
        
        if (!message) {
          return res.status(400).json({ message: 'Message is required' });
        }
        
        // Simple AI response (you can integrate with a real AI service later)
        let response = "I understand you're reaching out. ";
        if (message.toLowerCase().includes('anxiety')) {
          response += "Anxiety is common among students. Try deep breathing exercises and consider speaking with a counselor.";
        } else if (message.toLowerCase().includes('stress')) {
          response += "Stress management is important. Consider taking breaks, organizing your schedule, and practicing mindfulness.";
        } else if (message.toLowerCase().includes('help')) {
          response += "I'm here to help. You can explore our resources, talk to peers in the forum, or book an appointment with a counselor.";
        } else {
          response += "Thank you for sharing. Remember that it's okay to seek help when you need it. Our campus counselors and peer support are available.";
        }
        
        const chat = new Chat({
          userId: decoded.userId,
          message,
          response
        });
        
        await chat.save();
        
        return res.status(201).json(chat);
        
      } catch (error) {
        console.error('Send chat message error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // 404 for other routes
    return res.status(404).json({
      error: 'Not Found',
      url: url,
      message: 'Endpoint not found',
      availableEndpoints: ['/', '/api', '/api/health', '/api/auth/login', '/api/auth/profile', '/api/moods', '/api/counsellors', '/api/appointments', '/api/forum', '/api/chat']
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}