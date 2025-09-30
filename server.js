require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes'); 
const appointmentRoutes = require('./routes/appointmentRoutes');
const counsellorRoutes = require('./routes/counsellorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');
const moodRoutes = require('./routes/moodRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const forumRoutes = require('./routes/forumRoutes');

// App Config
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // To accept JSON data in the body

// DB Config
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected...'))
  .catch((err) => console.log(err));

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the MindCare Backend API!</h1><p>Server is running correctly.</p>');
});
// API Endpoints
app.use('/api/auth', authRoutes);
// Remove duplicate auth route registration
app.use('/api/chat', chatRoutes); // This line is for the AI Chat
app.use('/api/appointments', appointmentRoutes);
app.use('/api/counsellors', counsellorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/forum', forumRoutes);

// Listener
app.listen(PORT, () => console.log(`Server is running on: http://localhost:${PORT}`));