// Vercel serverless function with minimal functionality
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simple User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'counsellor'], default: 'student' },
  name: { type: String }
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

let User, MoodLog, Appointment, ForumPost, Chat;
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
      
      const token = authHeader.split(' ')[1];
      
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
        return res.status(201).json(moodLog);
        
      } catch (error) {
        console.error('Log mood error:', error);
        return res.status(500).json({ 
          message: 'Server error during mood logging',
          error: error.message,
          details: 'Please check if all required fields are provided'
        });
      }
    }
    
    // Simple counsellors endpoint (mock data for now)
    if (url === '/api/counsellors' && method === 'GET') {
      return res.status(200).json([
        { 
          _id: '1', 
          name: 'Dr. Sarah Johnson', 
          specialization: ['Anxiety', 'Depression'], 
          languages: ['English', 'Hindi'],
          availableDays: ['Monday', 'Wednesday', 'Friday']
        },
        { 
          _id: '2', 
          name: 'Dr. Rajesh Kumar', 
          specialization: ['Stress Management', 'Academic Pressure'], 
          languages: ['English', 'Hindi', 'Tamil'],
          availableDays: ['Tuesday', 'Thursday', 'Saturday']
        }
      ]);
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
      
      const token = authHeader.split(' ')[1];
      
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
      
      const token = authHeader.split(' ')[1];
      
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
        
        return res.status(201).json(chat);
        
      } catch (error) {
        console.error('Send chat message error:', error);
        return res.status(500).json({ message: 'Server error during chat' });
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