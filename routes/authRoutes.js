const express = require('express');
const router = express.Router();
const { registerCounsellor, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Import the middleware

router.post('/register/counsellor', registerCounsellor);
router.post('/login', login);

// Add this protected route for fetching the user profile
router.get('/profile', protect, getProfile); 

module.exports = router;