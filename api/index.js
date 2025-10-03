// Vercel serverless function with minimal functionality
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simple User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'counsellor'], default: 'student' },
  name: { type: String },
  phone: { type: String },
  campus: { type: String },
  // Counsellor specific fields
  languages: [{ type: String }],
  specialization: [{ type: String }],
  location: { type: String },
  availableDays: [{ type: String }],
  availableHours: { type: String },
  // Gamification fields
  points: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  lastMoodLogDate: { type: Date }
});

// Gamification Schema
const GamificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, default: 0 },
  streakCount: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  achievements: [{ type: String }],
  level: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
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
  counsellorId: { type: String, required: true }, // Using string for now since counsellors are mock data
  counsellorName: { type: String, required: true },
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
  category: { type: String, default: 'general' }, // Removed enum restriction for flexibility
  isAnonymous: { type: Boolean, default: false },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [{
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [{ type: String }], // Added tags support
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Chat Schema for AI Support
const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
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

let User, MoodLog, Appointment, ForumPost, Chat, Gamification;
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    if (process.env.MONGO_URI) {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(process.env.MONGO_URI);
      
      // Initialize models
      User = mongoose.models.User || mongoose.model('User', UserSchema);
      MoodLog = mongoose.models.MoodLog || mongoose.model('MoodLog', MoodLogSchema);
      Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
      ForumPost = mongoose.models.ForumPost || mongoose.model('ForumPost', ForumPostSchema);
      Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
      Gamification = mongoose.models.Gamification || mongoose.model('Gamification', GamificationSchema);
      
      isConnected = true;
      console.log('MongoDB Connected Successfully');
      
      // Create test user if not exists
      await createTestUser();
    } else {
      console.log('MONGO_URI not found in environment variables');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  }
};

// Create a test user for login
const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'test@student.com' });
    if (!existingUser) {
      const testUser = new User({
        email: 'test@student.com',
        password: 'password123',
        role: 'student',
        name: 'Test Student'
      });
      await testUser.save();
      console.log('Test user created: test@student.com / password123');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
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
          'GET /api/auth/profile'
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
        
        const moods = await MoodLog.find({ userId: decoded.userId })
          .sort({ timestamp: -1 })
          .limit(30);
        
        return res.status(200).json(moods);
        
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
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const body = await parseBody(req);
        const { mood, intensity, note } = body;
        
        console.log('Mood log request:', { mood, intensity, note, userId: decoded.userId });
        
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
        console.log('Mood log saved successfully:', moodLog._id);
        
        // Calculate updated streak and points after saving
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const userMoods = await MoodLog.find({ 
          userId: decoded.userId,
          timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: -1 });
        
        // Calculate streak - consecutive days with mood logs (including today if logged today)
        const moodsByDate = {};
        userMoods.forEach(mood => {
          const date = mood.timestamp.toISOString().split('T')[0];
          if (!moodsByDate[date]) {
            moodsByDate[date] = [];
          }
          moodsByDate[date].push(mood.intensity);
        });
        
        let streakCount = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Start checking from today backwards
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          if (moodsByDate[dateStr] && moodsByDate[dateStr].length > 0) {
            streakCount++;
          } else {
            // Break the streak - no consecutive days
            break;
          }
        }
        
        const totalMoods = userMoods.length;
        const points = totalMoods * 10 + streakCount * 5;
        
        // Update User gamification data
        await User.findByIdAndUpdate(decoded.userId, {
          points: points,
          streakCount: streakCount,
          lastMoodLogDate: new Date()
        });
        
        // Update or create Gamification record
        await Gamification.findOneAndUpdate(
          { userId: decoded.userId },
          {
            points: points,
            streakCount: streakCount,
            lastActivityDate: new Date(),
            level: Math.floor(points / 100) + 1,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        console.log('Gamification data updated:', { points, streakCount, userId: decoded.userId });
        
        return res.status(201).json({
          ...moodLog.toObject(),
          gamification: {
            points: points,
            streakCount: streakCount,
            level: Math.floor(points / 100) + 1
          }
        });
        
      } catch (error) {
        console.error('Log mood error:', error);
        return res.status(500).json({ 
          message: 'Server error during mood logging',
          error: error.message,
          details: 'Please check if all required fields are provided'
        });
      }
    }
    
    // Get counsellors endpoint
    if (url === '/api/counsellors' && method === 'GET') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      try {
        // Fetch real counsellors from database
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
        
        return res.status(200).json({
          all: formattedCounsellors,
          categories: categorizedCounsellors
        });
        
      } catch (error) {
        console.error('Get counsellors error:', error);
        return res.status(500).json({ message: 'Server error fetching counsellors' });
      }
    }
    
    // Book appointment endpoint
    if (url === '/api/appointments' && method === 'POST') {
      if (!isConnected || !Appointment) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const body = await parseBody(req);
        const { counsellorId, counsellorName, date, time, notes } = body;
        
        console.log('Appointment booking request:', { counsellorId, counsellorName, date, time, notes, userId: decoded.userId });
        
        if (!counsellorId || !date || !time) {
          return res.status(400).json({ message: 'Counsellor, date and time are required' });
        }
        
        const appointment = new Appointment({
          studentId: decoded.userId,
          counsellorId,
          counsellorName: counsellorName || 'Unknown Counsellor',
          date: new Date(date),
          time,
          notes
        });
        
        await appointment.save();
        return res.status(201).json(appointment);
        
      } catch (error) {
        console.error('Book appointment error:', error);
        return res.status(500).json({ 
          message: 'Server error during booking',
          error: error.message,
          details: 'Please check if all required fields are provided'
        });
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
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        const appointments = await Appointment.find({ studentId: decoded.userId })
          .sort({ date: 1 });
        
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
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const body = await parseBody(req);
        const { title, content, category, isAnonymous, tags } = body;
        
        console.log('Forum post creation request:', { title, content, category, isAnonymous, userId: decoded.userId });
        
        if (!title || !content) {
          return res.status(400).json({ message: 'Title and content are required' });
        }
        
        const post = new ForumPost({
          authorId: decoded.userId,
          title,
          content,
          category: category || 'general',
          isAnonymous: isAnonymous || false,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
        });
        
        await post.save();
        console.log('Forum post saved successfully:', post._id);
        await post.populate('authorId', 'name email');
        
        return res.status(201).json(post);
        
      } catch (error) {
        console.error('Create forum post error:', error);
        return res.status(500).json({ message: 'Server error creating post', error: error.message });
      }
    }
    
    // Delete forum post
    if (url.startsWith('/api/forum/') && !url.includes('/reply') && method === 'DELETE') {
      if (!isConnected || !ForumPost) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      const postId = url.split('/')[3]; // Extract post ID from URL
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Find the post
        const post = await ForumPost.findById(postId);
        if (!post) {
          return res.status(404).json({ message: 'Post not found' });
        }
        
        // Check if user is the author of the post
        if (post.authorId.toString() !== decoded.userId) {
          return res.status(403).json({ message: 'You can only delete your own posts' });
        }
        
        await ForumPost.findByIdAndDelete(postId);
        console.log('Forum post deleted successfully:', postId);
        
        return res.status(200).json({ message: 'Post deleted successfully' });
        
      } catch (error) {
        console.error('Delete forum post error:', error);
        return res.status(500).json({ message: 'Server error deleting post', error: error.message });
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
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
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
        
        // Populate the new reply's author info
        await post.populate('replies.authorId', 'name email');
        
        // Return just the new reply, not the entire post
        const newReply = post.replies[post.replies.length - 1];
        return res.status(201).json(newReply);
        
      } catch (error) {
        console.error('Add reply error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Chat endpoints (AI Support)
    
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
    
    // Send chat message (AI Support)
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
        
        // Simple AI response logic
        let response = "I understand you're reaching out. ";
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious')) {
          response += "Anxiety is very common among students. Here are some techniques that might help: Try deep breathing (4 counts in, hold for 4, out for 4), practice grounding techniques (name 5 things you can see, 4 you can hear, 3 you can touch), and remember that anxiety is temporary. Consider speaking with one of our campus counselors if these feelings persist.";
        } else if (lowerMessage.includes('stress') || lowerMessage.includes('stressed')) {
          response += "Stress management is crucial for your wellbeing. Try breaking large tasks into smaller ones, take regular breaks, practice mindfulness or meditation, maintain a regular sleep schedule, and don't hesitate to reach out for support. Our counselors can help you develop personalized stress management strategies.";
        } else if (lowerMessage.includes('depression') || lowerMessage.includes('sad') || lowerMessage.includes('down')) {
          response += "I'm sorry you're feeling this way. Depression is a serious but treatable condition. Please know that you're not alone and help is available. Consider reaching out to our campus counselors, maintaining social connections, getting regular exercise and sunlight, and practicing self-care. If you're having thoughts of self-harm, please contact emergency services immediately.";
        } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
          response += "I'm here to help and support you. You can explore our mental health resources, connect with peers in our support forum, book an appointment with a qualified counselor, or continue chatting with me. Remember, seeking help is a sign of strength, not weakness.";
        } else if (lowerMessage.includes('exam') || lowerMessage.includes('study') || lowerMessage.includes('academic')) {
          response += "Academic pressure is common but manageable. Try creating a study schedule, taking regular breaks, using active learning techniques, forming study groups, and maintaining work-life balance. Our counselors can also help with study strategies and academic stress management.";
        } else if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia')) {
          response += "Good sleep is essential for mental health. Try maintaining a regular sleep schedule, avoiding screens before bed, creating a relaxing bedtime routine, limiting caffeine, and keeping your bedroom cool and dark. If sleep problems persist, consider speaking with a counselor or healthcare provider.";
        } else {
          response += "Thank you for sharing with me. Remember that it's completely normal to have ups and downs, and seeking support shows strength. Our campus has many resources available including counselors, peer support groups, and wellness programs. Is there anything specific you'd like to talk about or any particular support you're looking for?";
        }
        
        const chat = new Chat({
          userId: decoded.userId,
          message,
          response
        });
        
        await chat.save();
        
        return res.status(201).json({ reply: response });
        
      } catch (error) {
        console.error('Send chat message error:', error);
        return res.status(500).json({ message: 'Server error during chat' });
      }
    }
    
    // Get mood stats endpoint
    if (url === '/api/moods/stats' && method === 'GET') {
      if (!isConnected || !MoodLog) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Get last 7 days of mood logs
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const moods = await MoodLog.find({ 
          userId: decoded.userId,
          timestamp: { $gte: sevenDaysAgo }
        }).sort({ timestamp: -1 });
        
        // Generate proper 7-day history with all dates
        const history7d = [];
        const moodsByDate = {};
        
        // Group existing moods by date
        moods.forEach(mood => {
          const date = mood.timestamp.toISOString().split('T')[0];
          if (!moodsByDate[date]) {
            moodsByDate[date] = [];
          }
          moodsByDate[date].push(mood.intensity);
        });
        
        // Generate last 7 days with data or default values
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          let avgMood = 0;
          if (moodsByDate[dateStr] && moodsByDate[dateStr].length > 0) {
            // Calculate average mood for that day
            avgMood = moodsByDate[dateStr].reduce((sum, mood) => sum + mood, 0) / moodsByDate[dateStr].length;
          }
          
          history7d.push({
            day: dateStr,
            mood: Math.round(avgMood)
          });
        }
        
        // Calculate proper streak (consecutive days with mood logs)
        let streakCount = 0;
        const today = new Date();
        
        // Start checking from today backwards for consecutive days
        for (let i = 0; i < 365; i++) { // Check up to 365 days back
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          
          if (moodsByDate[dateStr] && moodsByDate[dateStr].length > 0) {
            streakCount++;
          } else {
            // Break streak if missing day (no mood logged)
            break;
          }
        }
        
        const totalMoods = moods.length;
        const averageMood = totalMoods > 0 ? moods.reduce((sum, m) => sum + m.intensity, 0) / totalMoods : 0;
        
        return res.status(200).json({
          history7d,
          points: totalMoods * 10 + streakCount * 5, // 10 points per mood log + 5 bonus per streak day
          streakCount: streakCount,
          averageMood: Math.round(averageMood * 10) / 10
        });
        
      } catch (error) {
        console.error('Get mood stats error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Get user appointments endpoint
    if (url === '/api/appointments/me' && method === 'GET') {
      if (!isConnected || !Appointment) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        const appointments = await Appointment.find({ studentId: decoded.userId })
          .sort({ date: -1 });
        
        // Populate counsellor information for each appointment
        const appointmentsWithCounsellors = await Promise.all(
          appointments.map(async (appointment) => {
            try {
              // Find counsellor by counsellorId (which is an email)
              const counsellor = await User.findOne({ email: appointment.counsellorId, role: 'counsellor' });
              return {
                ...appointment.toObject(),
                counsellor: counsellor ? {
                  _id: counsellor._id,
                  email: counsellor.email,
                  name: counsellor.name || counsellor.email.split('@')[0]
                } : {
                  email: appointment.counsellorId,
                  name: appointment.counsellorName || 'Counsellor'
                }
              };
            } catch (error) {
              console.error('Error populating counsellor:', error);
              return {
                ...appointment.toObject(),
                counsellor: {
                  email: appointment.counsellorId,
                  name: appointment.counsellorName || 'Counsellor'
                }
              };
            }
          })
        );
        
        return res.status(200).json(appointmentsWithCounsellors);
        
      } catch (error) {
        console.error('Get appointments error:', error);
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // Update appointment status endpoint
    if (url.startsWith('/api/appointments/') && url.includes('/status') && method === 'PUT') {
      if (!isConnected || !Appointment) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const appointmentId = url.split('/')[3]; // Extract ID from URL
        const body = await parseBody(req);
        const { status } = body;
        
        const appointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          { status },
          { new: true }
        );
        
        if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found' });
        }
        
        return res.status(200).json(appointment);
        
      } catch (error) {
        console.error('Update appointment error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    
    // Delete appointment endpoint
    if (url.startsWith('/api/appointments/') && !url.includes('/status') && !url.includes('/me') && method === 'DELETE') {
      if (!isConnected || !Appointment) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      // Handle both "Bearer TOKEN" and just "TOKEN" formats
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const appointmentId = url.split('/')[3]; // Extract ID from URL like /api/appointments/123
        
        // Find and delete the appointment, but only if it belongs to the requesting user
        const appointment = await Appointment.findOneAndDelete({
          _id: appointmentId,
          studentId: decoded.userId
        });
        
        if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found or not authorized' });
        }
        
        return res.status(200).json({ message: 'Appointment cancelled successfully' });
        
      } catch (error) {
        console.error('Delete appointment error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    
    // Create alert endpoint
    if (url === '/api/alerts' && method === 'POST') {
      if (!isConnected) {
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
        
        // Log the alert (simplified - in a real app you'd store this)
        console.log('ALERT CREATED:', {
          userId: decoded.userId,
          message: body.message,
          level: body.level,
          timestamp: new Date().toISOString()
        });
        
        return res.status(201).json({ message: 'Alert created successfully' });
        
      } catch (error) {
        console.error('Create alert error:', error);
        return res.status(500).json({ message: 'Server error' });
      }
    }
    
    // 404 for other routes
    return res.status(404).json({
      error: 'Not Found',
      url: url,
      message: 'Endpoint not found',
      availableEndpoints: [
        '/', 
        '/api', 
        '/api/health', 
        '/api/auth/login', 
        '/api/auth/profile', 
        '/api/moods', 
        '/api/moods/stats',
        '/api/counsellors', 
        '/api/appointments', 
        '/api/appointments/me',
        '/api/appointments/:id/status',
        '/api/forum', 
        '/api/chat',
        '/api/alerts'
      ]
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